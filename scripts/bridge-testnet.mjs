/**
 * Moves Sepolia ETH into Robinhood Chain Testnet, so the sandbox can be funded.
 *
 *   node scripts/bridge-testnet.mjs --amount 0.01 --dry    simulate, send nothing
 *   node scripts/bridge-testnet.mjs --amount 0.01          actually deposit
 *
 * This calls depositEth() on the testnet Delayed Inbox on Sepolia. The L2 credit
 * arrives on its own after the sequencer picks the message up, which on mainnet
 * took about ten minutes; there is nothing to claim.
 *
 * The addresses below came from the chain's own documentation and were then
 * checked against Sepolia: Inbox.bridge() returns the documented Bridge, and a
 * nonsense selector on the same address reverts, so the ABI is really there.
 */
import { createPublicClient, createWalletClient, http, formatEther, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { robinhoodTestnet } from "../src/lib/chain.ts";

/** Verified on Sepolia on 2026-09-25. Re-check before moving anything larger. */
const INBOX = "0xF2939afA86F6f933A3CE17fCAB007907B6b0B7a4";
const BRIDGE = "0x96295BDad104eaD97cC08797b3dC68efF59CcF30";

const INBOX_ABI = [
  { type: "function", name: "depositEth", stateMutability: "payable", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "bridge", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
];

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const dry = process.argv.includes("--dry");
const amount = parseEther(arg("--amount", "0.01"));

const L1_RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const L2_RPC = process.env.RHC_TESTNET_RPC || robinhoodTestnet.rpcUrls.default.http[0];

const w = JSON.parse(readFileSync(new URL("../internal/test-wallet.json", import.meta.url), "utf8"));
const account = privateKeyToAccount(w.privateKey);
const l1 = createPublicClient({ chain: sepolia, transport: http(L1_RPC) });
const l2 = createPublicClient({ chain: robinhoodTestnet, transport: http(L2_RPC) });
const wallet = createWalletClient({ account, chain: sepolia, transport: http(L1_RPC) });

// Both ends must be the chains we think they are before any value moves.
const l1Id = await l1.getChainId();
if (l1Id !== sepolia.id) throw new Error(`${L1_RPC} is chain ${l1Id}, expected Sepolia (${sepolia.id})`);
const l2Id = await l2.getChainId();
if (l2Id !== robinhoodTestnet.id) throw new Error(`${L2_RPC} is chain ${l2Id}, expected ${robinhoodTestnet.id}`);

// And the inbox must really be the inbox for that bridge.
const wired = await l1.readContract({ address: INBOX, abi: INBOX_ABI, functionName: "bridge" });
if (wired.toLowerCase() !== BRIDGE.toLowerCase()) {
  throw new Error(`Inbox.bridge() is ${wired}, not the documented ${BRIDGE}. Stopping.`);
}

const l1Before = await l1.getBalance({ address: account.address });
const l2Before = await l2.getBalance({ address: account.address });
console.log(`account   ${account.address}`);
console.log(`sepolia   ${formatEther(l1Before)} ETH`);
console.log(`testnet   ${formatEther(l2Before)} ETH`);
console.log(`deposit   ${formatEther(amount)} ETH  via ${INBOX}`);
console.log(`inbox     bridge() -> ${wired}  ok\n`);

if (l1Before <= amount) {
  throw new Error(
    `Not enough Sepolia ETH. Fund ${account.address} from a Sepolia faucet first; this chain's testnet publishes none of its own.`,
  );
}

const gas = await l1.estimateContractGas({
  address: INBOX,
  abi: INBOX_ABI,
  functionName: "depositEth",
  value: amount,
  account,
});
console.log(`estimate  ${gas} gas`);

if (dry) {
  console.log("\ndry run: nothing was sent.");
  process.exit(0);
}

const hash = await wallet.writeContract({
  address: INBOX,
  abi: INBOX_ABI,
  functionName: "depositEth",
  value: amount,
  gas: (gas * 13n) / 10n,
});
console.log(`sent      ${hash}`);
const receipt = await l1.waitForTransactionReceipt({ hash, timeout: 300000 });
console.log(`mined     block ${receipt.blockNumber}  (${receipt.status})`);
console.log(`\nhttps://sepolia.etherscan.io/tx/${hash}`);
console.log(`\nThe L2 credit arrives on its own. Watch it with:`);
console.log(`  npx rhmask balance ${account.address} --network testnet`);
