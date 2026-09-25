/**
 * Chain-reading commands. All read-only: this CLI never holds a private key for
 * signing and never broadcasts, so the worst it can do to you is be wrong out loud.
 */
import { keccak_256 } from "@noble/hashes/sha3";
import { checkAnnouncement } from "../../../src/lib/stealth.ts";
import { STOCK_TOKENS } from "../../../src/lib/tokens.ts";
import { parse } from "../args.ts";
import { Rpc, pickNetwork } from "../rpc.ts";
import { box, c, ok, warn, rule, bad } from "../ui.ts";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const SELECTOR = { symbol: "0x95d89b41", decimals: "0x313ce567", balanceOf: "0x70a08231" };

function topic(signature: string) {
  return "0x" + Buffer.from(keccak_256(new TextEncoder().encode(signature))).toString("hex");
}
const ANNOUNCEMENT_TOPIC = topic("Announcement(uint256,address,address,bytes,bytes)");

function formatUnits(v: bigint, decimals: number, places = 6) {
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = (v % base).toString().padStart(decimals, "0").slice(0, places).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

/** Two dynamic `bytes` arguments, ABI-encoded, straight out of the log data. */
function decodeTwoBytes(data: string) {
  const hex = data.slice(2);
  const word = (i: number) => BigInt("0x" + hex.slice(i * 64, i * 64 + 64));
  const at = (byteOffset: bigint) => {
    const start = Number(byteOffset) * 2;
    const len = Number(BigInt("0x" + hex.slice(start, start + 64)));
    return "0x" + hex.slice(start + 64, start + 64 + len * 2);
  };
  return [at(word(0)), at(word(1))] as [string, string];
}

function decodeString(result: string) {
  if (!result || result === "0x") return "";
  const hex = result.slice(2);
  // Either an ABI string (offset, length, bytes) or a fixed bytes32 from an old token.
  if (hex.length >= 128) {
    const len = Number(BigInt("0x" + hex.slice(64, 128)));
    if (len > 0 && len <= 64) return Buffer.from(hex.slice(128, 128 + len * 2), "hex").toString("utf8");
  }
  return Buffer.from(hex, "hex").toString("utf8").replace(/\0+$/, "");
}

/** rhmask chain — what is on the other end of the wire, and is our code there. */
export async function chain(argv: string[]) {
  const f = parse(argv, []);
  const net = pickNetwork(argv);
  const rpc = new Rpc(net);

  const id = await rpc.chainId();
  const head = await rpc.blockNumber();
  const rows: Array<[string, string]> = [
    ["network", c.paper(net.name)],
    ["chain id", id === net.chainId ? c.mask(String(id)) : c.red(`${id} (expected ${net.chainId})`)],
    ["head block", c.paper(head.toLocaleString("en-US"))],
    ["rpc", c.fog(new URL(net.rpc).hostname)],
  ];

  const contracts: Array<[string, string]> = [];
  for (const [label, addr] of [["announcer", net.announcer], ["registry", net.registry]] as const) {
    if (!addr) {
      contracts.push([label, c.amber("not deployed on this network")]);
      continue;
    }
    const code = (await rpc.call("eth_getCode", [addr, "latest"])) as string;
    const bytes = code && code !== "0x" ? (code.length - 2) / 2 : 0;
    contracts.push([label, bytes ? `${c.mask(addr)} ${c.fog2(`${bytes} bytes`)}` : c.red(`${addr} has no code`)]);
  }

  if (f.has("--json")) {
    process.stdout.write(JSON.stringify({ network: net.key, chainId: id, head, rpc: net.rpc, contracts: { announcer: net.announcer ?? null, registry: net.registry ?? null } }, null, 2) + "\n");
    return;
  }

  console.log("");
  console.log(box("chain", rows));
  console.log("");
  console.log(box("contracts", contracts, c.aqua));
  if (rpc.pinned) {
    console.log("");
    console.log(warn("This network's DNS answered wrongly for the RPC host, so the address was"));
    console.log(c.fog2("      re-resolved over DNS-over-HTTPS and pinned. TLS still verified the real host."));
  }
  console.log("");
}

/** rhmask balance <address> — native balance, and stock tokens with --tokens. */
export async function balance(argv: string[]) {
  const f = parse(argv, ["--tokens"]);
  const addr = f.positional[0];
  if (!addr) throw new Error("Give an address: rhmask balance 0x…");
  if (!ADDRESS_RE.test(addr)) throw new Error("That is not a 20-byte address.");

  const net = pickNetwork(argv);
  const rpc = new Rpc(net);
  await rpc.assertChain();

  const eth = await rpc.balance(addr);
  const rows: Array<[string, string]> = [["ETH", (eth === 0n ? c.fog2 : c.mask)(formatUnits(eth, 18))]];

  if (f.has("--tokens")) {
    for (const t of STOCK_TOKENS) {
      const data = SELECTOR.balanceOf + addr.slice(2).toLowerCase().padStart(64, "0");
      const raw = await rpc.ethCall(t.address, data).catch(() => "0x");
      const v = raw && raw !== "0x" ? BigInt(raw) : 0n;
      if (v > 0n || !f.has("--json")) rows.push([t.symbol, (v === 0n ? c.fog2 : c.mask)(formatUnits(v, t.decimals ?? 18))]);
    }
  }

  if (f.has("--json")) {
    process.stdout.write(JSON.stringify({ address: addr, wei: eth.toString(), eth: formatUnits(eth, 18) }, null, 2) + "\n");
    return;
  }

  console.log("");
  console.log(box(`${addr}  ·  ${net.name}`, rows));
  console.log("");
  console.log(c.fog2("  " + net.explorer + "/address/" + addr));
  console.log("");
}

/** rhmask tokens — the stock token registry, read from the chain rather than from us. */
export async function tokens(argv: string[]) {
  const f = parse(argv, []);
  const net = pickNetwork(argv);
  const rpc = new Rpc(net);
  await rpc.assertChain();

  const found: Array<{ symbol: string; onChain: string; decimals: number; address: string }> = [];
  console.log("");
  console.log(rule(`${STOCK_TOKENS.length} stock tokens on ${net.name}`));
  console.log("");
  for (const t of STOCK_TOKENS) {
    const sym = decodeString(await rpc.ethCall(t.address, SELECTOR.symbol).catch(() => "0x"));
    const decRaw = await rpc.ethCall(t.address, SELECTOR.decimals).catch(() => "0x");
    const dec = decRaw && decRaw !== "0x" ? Number(BigInt(decRaw)) : -1;
    const matches = sym.toUpperCase() === t.symbol.toUpperCase();
    found.push({ symbol: t.symbol, onChain: sym, decimals: dec, address: t.address });
    if (!f.has("--json")) {
      const label = `${c.mask(t.symbol.padEnd(6))} ${c.fog(t.address)}`;
      console.log(matches ? ok(`${label}  ${c.fog2(`${dec} decimals`)}`) : bad(`${label}  chain says "${sym}"`));
    }
  }
  if (f.has("--json")) {
    process.stdout.write(JSON.stringify(found, null, 2) + "\n");
    return;
  }
  console.log("");
  console.log(c.fog2("  Read from the chain just now, not from a list we ship. Re-run before trusting it."));
  console.log("");
}

/**
 * rhmask scan --view <key> --spend <key> — find stealth payments announced to you.
 *
 * The view tag is why this is cheap: one byte of the metadata is compared first
 * and only a match costs an elliptic-curve multiplication.
 */
export async function scan(argv: string[]) {
  const f = parse(argv, ["--view", "--spend", "--from", "--to-block", "--blocks"]);
  const view = f.need("--view", "your viewing key");
  const spend = f.need("--spend", "your spending key, to recover the private key of a match");

  const net = pickNetwork(argv);
  if (!net.announcer) throw new Error(`No announcer is deployed on ${net.key} yet.`);
  const rpc = new Rpc(net);
  await rpc.assertChain();

  const head = await rpc.blockNumber();
  const span = Number(f.get("--blocks") ?? 5000);
  const from = Number(f.get("--from") ?? Math.max(0, head - span));
  const to = Number(f.get("--to-block") ?? head);

  console.log("");
  console.log(rule(`scanning blocks ${from.toLocaleString("en-US")} – ${to.toLocaleString("en-US")}`));

  const logs = await rpc.logs({
    address: net.announcer,
    topics: [ANNOUNCEMENT_TOPIC],
    fromBlock: "0x" + from.toString(16),
    toBlock: "0x" + to.toString(16),
  });

  let checked = 0;
  let tagSkipped = 0;
  const mine: Array<{ stealthAddress: string; privateKey: string; block: number; tx: string }> = [];

  for (const log of logs) {
    const topics = log.topics as string[];
    const stealthAddress = ("0x" + topics[2].slice(26)) as `0x${string}`;
    const [eph, metadata] = decodeTwoBytes(log.data as string);
    const viewTag = metadata.length >= 4 ? parseInt(metadata.slice(2, 4), 16) : undefined;
    checked++;
    const priv = checkAnnouncement(
      { spendingKey: spend as `0x${string}`, viewingKey: view as `0x${string}` },
      eph as `0x${string}`,
      stealthAddress,
      viewTag,
    );
    if (!priv) {
      tagSkipped++;
      continue;
    }
    mine.push({
      stealthAddress,
      privateKey: priv,
      block: Number(BigInt(log.blockNumber as string)),
      tx: log.transactionHash as string,
    });
  }

  if (f.has("--json")) {
    process.stdout.write(JSON.stringify({ from, to, announcements: checked, mine }, null, 2) + "\n");
    return;
  }

  console.log("");
  console.log(box("scan", [
    ["announcements", c.paper(String(checked))],
    ["not yours", c.fog2(String(tagSkipped))],
    ["yours", mine.length ? c.mask(String(mine.length)) : c.fog2("0")],
  ]));

  for (const m of mine) {
    console.log("");
    console.log(box(`block ${m.block.toLocaleString("en-US")}`, [
      ["address", c.mask(m.stealthAddress)],
      ["key", c.paper(m.privateKey)],
      ["tx", c.fog(m.tx)],
    ], c.magenta));
  }

  console.log("");
  if (!mine.length) {
    console.log(c.fog2(`  Nothing for these keys in that range. Widen it with --blocks or --from.`));
  } else {
    console.log(c.fog("  Import a key above to sweep that address. Each one is single-use."));
  }
  console.log("");
}
