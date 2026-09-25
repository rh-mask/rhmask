/**
 * Deploys StealthAnnouncer and StealthRegistry to Robinhood Chain, then proves
 * the loop that matters: announce a real stealth payment, scan for it with a
 * viewing key, and confirm a stranger cannot claim it.
 * Records every address and tx hash in contracts/deployments.json.
 */
import { createPublicClient, createWalletClient, http, formatEther, toHex, hexToBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync } from "node:fs";
import { robinhoodChain } from "../src/lib/chain.ts";
import { generateStealthKeys, deriveStealthAddress, checkAnnouncement } from "../src/lib/stealth.ts";

const RPC = "https://rhmask.org/api/rpc";
const w = JSON.parse(readFileSync(new URL("../internal/test-wallet.json", import.meta.url), "utf8"));
const account = privateKeyToAccount(w.privateKey);
const pub = createPublicClient({ chain: robinhoodChain, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: robinhoodChain, transport: http(RPC) });
const art = (n) => JSON.parse(readFileSync(new URL(`../contracts/out/${n}.json`, import.meta.url), "utf8"));
const ex = (h) => `https://robinhoodchain.blockscout.com/tx/${h}`;

const before = await pub.getBalance({ address: account.address });
console.log(`deployer ${account.address}\nbalance  ${formatEther(before)} ETH\n`);

async function deploy(name) {
  const { abi, bytecode } = art(name);
  const fees = await pub.estimateFeesPerGas();
  const gas = await pub.estimateGas({ account, data: bytecode });
  const hash = await wallet.deployContract({
    abi, bytecode, gas: (gas * 13n) / 10n,
    maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  });
  const r = await pub.waitForTransactionReceipt({ hash, timeout: 240000 });
  if (r.status !== "success") throw new Error(`${name} deploy failed`);
  const code = await pub.getCode({ address: r.contractAddress });
  console.log(`${name}`);
  console.log(`  address  ${r.contractAddress}`);
  console.log(`  tx       ${hash}`);
  console.log(`  gas used ${r.gasUsed}   runtime ${(code.length - 2) / 2} bytes`);
  return { name, address: r.contractAddress, txHash: hash, block: Number(r.blockNumber), gasUsed: String(r.gasUsed), abi };
}

const announcer = await deploy("StealthAnnouncer");
const registry = await deploy("StealthRegistry");

// ── prove the loop ──────────────────────────────────────────────────────────
console.log("\n[verify] a real stealth payment, announced and then found by scanning");
const keys = generateStealthKeys();
const d = deriveStealthAddress(keys.metaAddress);
console.log(`  stealth address   ${d.stealthAddress}`);

const fees = await pub.estimateFeesPerGas();
// metadata byte 0 is the view tag: a scanner filters on it before doing any EC work
const metadata = toHex(new Uint8Array([d.viewTag]));
const g1 = await pub.estimateContractGas({
  address: announcer.address, abi: announcer.abi, functionName: "announce",
  args: [1n, d.stealthAddress, d.ephemeralPublicKey, metadata], account,
});
const annTx = await wallet.writeContract({
  address: announcer.address, abi: announcer.abi, functionName: "announce",
  args: [1n, d.stealthAddress, d.ephemeralPublicKey, metadata],
  gas: (g1 * 13n) / 10n, maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
});
const r1 = await pub.waitForTransactionReceipt({ hash: annTx, timeout: 240000 });
console.log(`  announce tx       ${annTx}  (${r1.status})`);

const logs = await pub.getLogs({
  address: announcer.address,
  event: announcer.abi.find((x) => x.type === "event" && x.name === "Announcement"),
  fromBlock: BigInt(r1.blockNumber), toBlock: BigInt(r1.blockNumber),
});
if (logs.length !== 1) throw new Error(`expected 1 announcement, got ${logs.length}`);
const a = logs[0].args;
console.log(`  read back         schemeId ${a.schemeId}, viewTag ${hexToBytes(a.metadata)[0]}`);

const priv = checkAnnouncement(keys, a.ephemeralPubKey, a.stealthAddress, hexToBytes(a.metadata)[0]);
if (!priv) throw new Error("recipient could not find their own announcement");
console.log(`  recipient scan    FOUND, and the derived key controls the address`);
if (checkAnnouncement(generateStealthKeys(), a.ephemeralPubKey, a.stealthAddress, hexToBytes(a.metadata)[0]) !== null) {
  throw new Error("a stranger matched the announcement");
}
console.log(`  stranger scan     no match, as required`);

console.log("\n[verify] registry: publish a meta-address and read it back");
const metaBytes = toHex(new TextEncoder().encode(keys.metaAddress));
const g2 = await pub.estimateContractGas({ address: registry.address, abi: registry.abi, functionName: "registerKeys", args: [1n, metaBytes], account });
const regTx = await wallet.writeContract({
  address: registry.address, abi: registry.abi, functionName: "registerKeys", args: [1n, metaBytes],
  gas: (g2 * 13n) / 10n, maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
});
const r2 = await pub.waitForTransactionReceipt({ hash: regTx, timeout: 240000 });
console.log(`  register tx       ${regTx}  (${r2.status})`);
const stored = await pub.readContract({ address: registry.address, abi: registry.abi, functionName: "stealthMetaAddressOf", args: [account.address, 1n] });
const roundTrip = new TextDecoder().decode(hexToBytes(stored));
if (roundTrip !== keys.metaAddress) throw new Error("registry did not round-trip the meta-address");
console.log(`  read back         matches the registered meta-address`);

const after = await pub.getBalance({ address: account.address });
console.log(`\nspent    ${formatEther(before - after)} ETH   left ${formatEther(after)} ETH`);

const out = {
  chainId: robinhoodChain.id,
  chainName: robinhoodChain.name,
  deployedAt: new Date().toISOString(),
  deployer: account.address,
  contracts: {
    StealthAnnouncer: { address: announcer.address, txHash: announcer.txHash, block: announcer.block, gasUsed: announcer.gasUsed, standard: "ERC-5564" },
    StealthRegistry: { address: registry.address, txHash: registry.txHash, block: registry.block, gasUsed: registry.gasUsed, standard: "ERC-6538" },
  },
  verification: { announceTx: annTx, registerTx: regTx, stealthAddress: d.stealthAddress },
};
const path = new URL("../contracts/deployments.json", import.meta.url);
writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
console.log(`\nrecorded in contracts/deployments.json`);
console.log(`announcer ${ex(announcer.txHash)}`);
console.log(`registry  ${ex(registry.txHash)}`);
