/**
 * Read-only on-chain check of every function the app relies on, against
 * Robinhood Chain mainnet. Run: npm run check:onchain
 *
 *   RHC_RPC_URL   override the RPC (default: public mainnet RPC)
 *   RHC_RPC_IP    pin the RPC host to this IP (for networks whose DNS hijacks
 *                 the domain); TLS still verifies the real hostname. When unset
 *                 and the first request fails with a TLS/altname error, the IP
 *                 is looked up over DNS-over-HTTPS (Cloudflare) automatically.
 *
 * Nothing is signed or broadcast. Simulations use eth_call / eth_estimateGas
 * with `from` set to real holders found through recent Transfer logs.
 */
import dns from "node:dns/promises";
import https from "node:https";
import { createPublicClient, custom, erc20Abi, formatUnits, getAddress, parseAbiItem, toHex } from "viem";
import { robinhoodChain } from "../src/lib/chain.ts";
import { STOCK_TOKENS } from "../src/lib/tokens.ts";
import { generateStealthKeys, deriveStealthAddress, checkAnnouncement } from "../src/lib/stealth.ts";

const RPC_URL = process.env.RHC_RPC_URL || robinhoodChain.rpcUrls.default.http[0];
let RPC_IP = process.env.RHC_RPC_IP || "";
const url = new URL(RPC_URL);

async function resolveOverDoH(hostname: string): Promise<string> {
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, { headers: { accept: "application/dns-json" } });
  const json = (await res.json()) as { Answer?: Array<{ type: number; data: string }> };
  const a = (json.Answer ?? []).find((x) => x.type === 1);
  if (!a) throw new Error(`DoH could not resolve ${hostname}`);
  return a.data;
}

/** Known custom-error selectors, so a revert reads as a name instead of 4 bytes. */
const ERROR_NAMES: Record<string, string> = {
  "0xe450d38c": "ERC20InsufficientBalance(address,uint256,uint256)",
  "0xec442f05": "ERC20InvalidReceiver(address)",
  "0x96c6fd1e": "ERC20InvalidSender(address)",
  "0xfb8f41b2": "ERC20InsufficientAllowance(address,uint256,uint256)",
  "0xd93c0665": "EnforcedPause()",
  "0x4f2a367e": "AccountFrozen(address)",
  "0xffa4e618": "Blacklisted(address)",
  "0x726ba784": "RestrictedAddress(address)",
  "0xe827105e": "TransferRestricted()",
  "0x82b42900": "Unauthorized()",
};
const INSUFFICIENT = "0xe450d38c";
function revertName(e: unknown): string {
  const m = String(e instanceof Error ? e.message : e);
  const sel = (m.match(/0x[0-9a-fA-F]{8}\b/) || [])[0]?.toLowerCase();
  const named = sel ? ERROR_NAMES[sel] : undefined;
  const reason = m.match(/reverted with the following reason:\s*(.+)/)?.[1]?.trim();
  if (named) return named;
  if (reason) return `reason "${reason}"`;
  if (sel) return `unknown selector ${sel}`;
  return m.split("\n")[0].slice(0, 140);
}

const TIMEOUT_MS = 10_000;
const RETRIES = 4;
let rpcId = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One JSON-RPC call with retry on rate limits (429), upstream errors (5xx) and timeouts. */
async function rpc(method: string, params: unknown[] = []): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      return await rpcOnce(method, params);
    } catch (e) {
      lastErr = e;
      const msg = String(e instanceof Error ? e.message : e);
      const transient = /\b(429|502|503|504)\b|timeout|ECONNRESET|rate limit/i.test(msg);
      if (!transient || attempt === RETRIES) throw e;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw lastErr;
}

function rpcOnce(method: string, params: unknown[]): Promise<unknown> {
  const body = JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: RPC_IP || url.hostname,
        servername: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        timeout: TIMEOUT_MS,
        headers: { host: url.hostname, "content-type": "application/json", "content-length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.error) reject(Object.assign(new Error(json.error.message), { code: json.error.code, data: json.error.data }));
            else resolve(json.result);
          } catch {
            reject(new Error(`bad rpc response (${res.statusCode}): ${data.slice(0, 120)}`));
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error(`rpc timeout after ${TIMEOUT_MS}ms (${RPC_IP || url.hostname})`)));
    req.on("error", reject);
    req.end(body);
  });
}

/**
 * ISP bypass. Some networks hijack the RPC domain to a filter page that
 * neither answers nor refuses. So: compare the system resolver with
 * DNS-over-HTTPS first; if they disagree, pin the DoH answer. If the first
 * request still fails or times out, pin as a fallback.
 */
async function ensureReachable() {
  if (!RPC_IP && url.hostname !== "localhost") {
    try {
      const [system, doh] = await Promise.all([
        dns.resolve4(url.hostname).catch(() => [] as string[]),
        resolveOverDoH(url.hostname).catch(() => ""),
      ]);
      if (doh && !system.includes(doh)) {
        RPC_IP = doh;
        console.log(`system DNS (${system.join(", ") || "none"}) disagrees with DNS-over-HTTPS (${doh}); pinned ${url.hostname} to ${doh}`);
      }
    } catch {
      /* fall through to the request-based check */
    }
  }
  try {
    await rpc("eth_chainId");
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    if (RPC_IP) throw e;
    RPC_IP = await resolveOverDoH(url.hostname);
    console.log(`direct request failed (${msg.slice(0, 70)}); pinned ${url.hostname} to ${RPC_IP} via DNS-over-HTTPS`);
    await rpc("eth_chainId");
  }
}

const client = createPublicClient({ chain: robinhoodChain, transport: custom({ request: ({ method, params }) => rpc(method, params as unknown[]) }) });

const results: Array<{ check: string; ok: boolean; note: string }> = [];
const record = (check: string, ok: boolean, note: string) => {
  results.push({ check, ok, note });
  console.log(`${ok ? "  ok  " : "  FAIL"} ${check}: ${note}`);
};
/** First line of an error plus viem's "Details:" line, so wrapped RPC errors keep their cause. */
const short = (e: unknown) => {
  if (!(e instanceof Error)) return String(e);
  const lines = e.message.split("\n");
  const details = lines.find((l) => l.startsWith("Details:"))?.trim();
  return `${lines[0].slice(0, 120)}${details ? ` (${details.slice(0, 120)})` : ""}`;
};
const TRANSFER = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
const PAUSED_ABI = [{ type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] }] as const;
const ZERO = "0x0000000000000000000000000000000000000000";
const IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";

async function main() {
  await ensureReachable();
  console.log(`\nRPC ${RPC_URL}${RPC_IP ? ` (pinned to ${RPC_IP})` : ""}\n`);

  // 1. chain + gas ---------------------------------------------------------
  console.log("[1] chain and gas");
  const chainId = await client.getChainId();
  record("chain id", chainId === robinhoodChain.id, `${chainId}`);
  const block = await client.getBlock();
  const ageSec = Math.round(Date.now() / 1000 - Number(block.timestamp));
  record("latest block", ageSec < 120, `#${block.number}, ${ageSec}s old, baseFee ${block.baseFeePerGas ?? "n/a"} wei`);
  const fees = await client.estimateFeesPerGas();
  record("estimateFeesPerGas (sweep uses it)", fees.maxFeePerGas > 0n, `maxFee ${fees.maxFeePerGas} wei, priority ${fees.maxPriorityFeePerGas} wei`);
  record("ETH sweep gas cost at 21k gas", true, `${formatUnits(21_000n * fees.maxFeePerGas, 18)} ETH`);

  // 2. stock token contracts ----------------------------------------------
  console.log("\n[2] stock token contracts");
  for (const t of STOCK_TOKENS) {
    try {
      const [symbol, name, decimals, supply, code] = await Promise.all([
        client.readContract({ address: t.address, abi: erc20Abi, functionName: "symbol" }),
        client.readContract({ address: t.address, abi: erc20Abi, functionName: "name" }),
        client.readContract({ address: t.address, abi: erc20Abi, functionName: "decimals" }),
        client.readContract({ address: t.address, abi: erc20Abi, functionName: "totalSupply" }),
        client.getCode({ address: t.address }),
      ]);
      const impl = (await client.getStorageAt({ address: t.address, slot: IMPL_SLOT })) ?? "0x";
      const beacon = (await client.getStorageAt({ address: t.address, slot: BEACON_SLOT })) ?? "0x";
      const proxy = impl !== "0x" && BigInt(impl) !== 0n ? "EIP-1967 impl" : beacon !== "0x" && BigInt(beacon) !== 0n ? "beacon proxy (upgradeable)" : "no proxy slot";
      const symbolOk = String(symbol).toUpperCase().replace(/[^A-Z]/g, "").startsWith(t.symbol);
      record(
        `${t.symbol} ${t.address}`,
        symbolOk && decimals === t.decimals && (code?.length ?? 0) > 2,
        `"${symbol}" / "${name}", decimals ${decimals}, supply ${formatUnits(supply, decimals)}, ${proxy}`,
      );
    } catch (e) {
      record(`${t.symbol} ${t.address}`, false, short(e));
    }
  }

  // 3. holders per basket token from recent Transfer logs -----------------
  console.log("\n[3] recent holders (senders in Transfer logs, funded EOAs only)");
  const latest = block.number;
  const holders: Record<string, `0x${string}`[]> = {};
  for (const t of STOCK_TOKENS.filter((x) => x.basket)) {
    holders[t.symbol] = [];
    for (const span of [2_000n, 500n, 100n]) {
      try {
        const logs = await client.getLogs({ address: t.address, event: TRANSFER, fromBlock: latest - span, toBlock: latest });
        // Senders first (they have proven they can transfer), then recipients; newest first.
        // Balance is read before code so an empty candidate costs one call, not two.
        const seen = new Set<string>();
        const candidates: `0x${string}`[] = [];
        for (const l of [...logs].reverse()) {
          for (const a of [l.args.from, l.args.to]) {
            if (a && !seen.has(a) && a !== ZERO) {
              seen.add(a);
              candidates.push(a);
            }
          }
        }
        let tried = 0;
        for (const c of candidates.slice(0, 20)) {
          tried++;
          const bal = await client.readContract({ address: t.address, abi: erc20Abi, functionName: "balanceOf", args: [c] });
          if (bal === 0n) continue;
          const code = await client.getCode({ address: c });
          if (!code || code === "0x") holders[t.symbol].push(c);
          if (holders[t.symbol].length >= 2) break;
        }
        if (holders[t.symbol].length) {
          record(`${t.symbol} holders`, true, `${holders[t.symbol].length} funded EOA(s), first ${holders[t.symbol][0]} (${logs.length} transfers in last ${span} blocks, ${tried} candidates checked)`);
          break;
        }
        if (logs.length === 0) record(`${t.symbol} holders`, false, `no transfers in the last ${span} blocks`);
        else record(`${t.symbol} holders`, false, `transfers found but no funded EOA among ${tried} candidates`);
        break;
      } catch (e) {
        if (span === 100n) record(`${t.symbol} holders`, false, `getLogs failed: ${short(e)}`);
      }
    }
  }

  // 4. stealth flow + balances -------------------------------------------
  console.log("\n[4] stealth flow against the chain");
  const keys = generateStealthKeys();
  const d = deriveStealthAddress(keys.metaAddress);
  const priv = checkAnnouncement(keys, d.ephemeralPublicKey, d.stealthAddress, d.viewTag);
  record("derive + claim round-trip", Boolean(priv), d.stealthAddress);
  const stealthEth = await client.getBalance({ address: d.stealthAddress });
  const stealthCode = await client.getCode({ address: d.stealthAddress });
  record("fresh stealth address is an empty EOA", stealthEth === 0n && (!stealthCode || stealthCode === "0x"), `balance ${stealthEth}, code ${stealthCode ?? "0x"}`);
  const balReads = await Promise.all(
    STOCK_TOKENS.map((t) =>
      client.readContract({ address: t.address, abi: erc20Abi, functionName: "balanceOf", args: [d.stealthAddress] }).then(() => true).catch(() => false),
    ),
  );
  record("readBalances: balanceOf on all stock tokens", balReads.every(Boolean), `${balReads.filter(Boolean).length}/${STOCK_TOKENS.length} calls succeeded`);

  // 5. transfer simulations -----------------------------------------------
  console.log("\n[5] transfer simulations (eth_call from real holders, nothing broadcast)");
  const anyHolder = Object.values(holders).flat()[0];
  if (anyHolder) {
    try {
      const gas = await client.estimateGas({ account: anyHolder, to: d.stealthAddress, value: 1n });
      record("ETH -> stealth address (estimateGas)", gas >= 21_000n, `${gas} gas`);
    } catch (e) {
      record("ETH -> stealth address (estimateGas)", false, short(e));
    }
  } else {
    record("ETH -> stealth address", false, "no holder found to simulate from");
  }

  const contractTargets: Array<[string, `0x${string}`]> = [["Multicall3 (a plain contract)", "0xcA11bde05977b3631167028862bE2a173976CA11"]];

  /** Simulate transfer(to, 1) from each holder in turn; a holder whose balance moved since the scan is skipped. */
  async function simTransfer(label: string, token: (typeof STOCK_TOKENS)[number], to: `0x${string}`, okNote: string) {
    let lastErr: unknown = null;
    for (const from of holders[token.symbol]) {
      try {
        await client.simulateContract({ account: from, address: token.address, abi: erc20Abi, functionName: "transfer", args: [to, 1n] });
        record(label, true, `${okNote} (from ${from})`);
        return;
      } catch (e) {
        lastErr = e;
        if (!String(e instanceof Error ? e.message : e).includes(INSUFFICIENT)) break; // a real restriction, not a stale balance
      }
    }
    record(label, false, holders[token.symbol].length ? `REVERTS: ${revertName(lastErr)}` : "skipped, no holder");
  }

  for (const t of STOCK_TOKENS.filter((x) => x.basket)) {
    await simTransfer(`${t.symbol} -> fresh stealth EOA`, t, d.stealthAddress, "stealth receive works for this token");
    for (const [label, target] of contractTargets) {
      const code = await client.getCode({ address: target });
      if (!code || code === "0x") {
        record(`${t.symbol} -> ${label}`, false, `${target} has no code on this chain, cannot test`);
        continue;
      }
      await simTransfer(`${t.symbol} -> ${label}`, t, target, "a contract can hold this token (vault feasibility)");
    }
    const from = holders[t.symbol][0];
    if (from) {
      try {
        await client.simulateContract({ account: from, address: t.address, abi: erc20Abi, functionName: "approve", args: [contractTargets[0][1], 1n] });
        record(`${t.symbol} approve(contract)`, true, "approve simulates fine");
      } catch (e) {
        record(`${t.symbol} approve(contract)`, false, `REVERTS: ${revertName(e)}`);
      }
    }
    const paused = await client.readContract({ address: t.address, abi: PAUSED_ABI, functionName: "paused" }).catch(() => null);
    record(`${t.symbol} paused()`, paused !== true, paused === null ? "no paused() function exposed" : String(paused));
  }

  // 6. sweep error path ----------------------------------------------------
  console.log("\n[6] sweep from an empty stealth address (expected to fail cleanly)");
  const dest = getAddress(anyHolder ?? d.stealthAddress);
  try {
    await client.simulateContract({ account: d.stealthAddress, address: STOCK_TOKENS[0].address, abi: erc20Abi, functionName: "transfer", args: [dest, 1n] });
    record("empty stealth ERC-20 sweep", false, "unexpectedly succeeded");
  } catch (e) {
    record("empty stealth ERC-20 sweep rejects", true, revertName(e));
  }
  try {
    await client.estimateGas({ account: d.stealthAddress, to: dest, value: 1n });
    record("empty stealth ETH sweep", false, "unexpectedly succeeded");
  } catch (e) {
    record("empty stealth ETH sweep rejects", true, short(e));
  }

  // summary ----------------------------------------------------------------
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed at block ${latest} (${toHex(latest)})`);
  if (failed.length) {
    console.log("failed:");
    failed.forEach((f) => console.log(`  - ${f.check}: ${f.note}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("onchain-check crashed:", short(e));
  process.exit(1);
});
