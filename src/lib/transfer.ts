"use client";

import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { publicRpcUrl, robinhoodChain } from "@/lib/chain";
import { STOCK_TOKENS, findStock } from "@/lib/tokens";

/**
 * Transfers on Robinhood Chain from the browser. Two paths:
 *   - injected wallet: we only build the request, the wallet signs;
 *   - stealth sweep: the stealth private key (derived locally from the
 *     viewing + spending keys) signs directly through an RPC. It never
 *     leaves the page.
 */

export const TRANSFER_TOKENS = ["ETH", ...STOCK_TOKENS.map((t) => t.symbol)] as const;
export type TransferToken = (typeof TRANSFER_TOKENS)[number];

export function publicClient() {
  return createPublicClient({ chain: robinhoodChain, transport: http(publicRpcUrl()) });
}

export type TxRequest = { to: `0x${string}`; value?: Hex; data?: Hex };

/** Build an eth_sendTransaction request for an injected wallet. */
export function buildTransfer(token: string, amount: string, to: `0x${string}`): TxRequest {
  const value = parseUnits(amount, 18);
  if (token === "ETH") return { to, value: `0x${value.toString(16)}` };
  const stock = findStock(token);
  if (!stock) throw new Error(`Unknown token ${token}`);
  return {
    to: stock.address,
    data: encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [to, value] }),
  };
}

/** Known custom-error selectors from the stock token contracts, turned into plain words. */
const ERROR_TEXT: Record<string, string> = {
  "0xe450d38c": "Insufficient balance for this transfer.",
  "0xec442f05": "The token contract rejects this recipient.",
  "0x96c6fd1e": "The token contract rejects this sender.",
  "0xfb8f41b2": "Insufficient allowance.",
  "0xd93c0665": "Transfers are paused by the issuer.",
};

export function explainRevert(e: unknown): string {
  const m = String(e instanceof Error ? e.message : e);
  const sel = (m.match(/0x[0-9a-fA-F]{8}\b/) || [])[0]?.toLowerCase();
  if (sel && ERROR_TEXT[sel]) return ERROR_TEXT[sel];
  const reason = m.match(/reverted with the following reason:\s*(.+)/)?.[1]?.trim();
  if (reason) return reason;
  if (/exceeds the balance of the account/i.test(m)) return "Not enough ETH for gas plus value.";
  return m.split("\n")[0].slice(0, 160);
}

/**
 * Dry-run a transfer with eth_call / eth_estimateGas from the sender before
 * the wallet prompt, so a revert (restricted token, empty balance, paused)
 * shows up as a sentence instead of a failed transaction.
 */
export async function preflightTransfer(from: `0x${string}`, token: string, amount: string, to: `0x${string}`) {
  const client = publicClient();
  const value = parseUnits(amount, 18);
  if (token === "ETH") {
    await client.estimateGas({ account: from, to, value });
    return;
  }
  const stock = findStock(token);
  if (!stock) throw new Error(`Unknown token ${token}`);
  await client.simulateContract({ account: from, address: stock.address, abi: erc20Abi, functionName: "transfer", args: [to, value] });
}

export type Balance = { token: string; raw: bigint; formatted: string };

/** ETH plus every known stock token balance for one address. */
export async function readBalances(address: `0x${string}`): Promise<Balance[]> {
  const client = publicClient();
  const [eth, ...stocks] = await Promise.all([
    client.getBalance({ address }),
    ...STOCK_TOKENS.map((t) =>
      client
        .readContract({ address: t.address, abi: erc20Abi, functionName: "balanceOf", args: [address] })
        .catch(() => 0n),
    ),
  ]);
  const out: Balance[] = [{ token: "ETH", raw: eth, formatted: formatUnits(eth, 18) }];
  STOCK_TOKENS.forEach((t, i) => {
    const raw = stocks[i] as bigint;
    out.push({ token: t.symbol, raw, formatted: formatUnits(raw, t.decimals) });
  });
  return out;
}

/**
 * Sweep one asset out of a stealth address. Sends the full balance; for ETH
 * the gas cost is subtracted first. Requires the stealth address to hold
 * enough ETH for gas (the gasless relay on the roadmap removes this).
 */
export async function sweep(stealthPrivateKey: `0x${string}`, token: string, to: `0x${string}`): Promise<`0x${string}`> {
  const account = privateKeyToAccount(stealthPrivateKey);
  const client = publicClient();
  const wallet = createWalletClient({ account, chain: robinhoodChain, transport: http(publicRpcUrl()) });
  const fees = await client.estimateFeesPerGas();

  if (token === "ETH") {
    const balance = await client.getBalance({ address: account.address });
    if (balance === 0n) throw new Error("No ETH on this address.");
    // This chain prices L1 calldata into the gas limit, so a plain transfer needs
    // more than 21,000 and the exact number moves with L1 data cost. Measured on
    // mainnet: 21,369 for an ETH transfer, and 21,000 is rejected outright as
    // "intrinsic gas too low". So the estimate is required, never assumed.
    const estimated = await client.estimateGas({ account, to, value: 1n });
    const gas = (estimated * 13n) / 10n;
    const cost = gas * fees.maxFeePerGas;
    if (balance <= cost) throw new Error("Not enough ETH to cover gas for the sweep.");
    return wallet.sendTransaction({
      to,
      value: balance - cost,
      gas,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    });
  }

  const stock = findStock(token);
  if (!stock) throw new Error(`Unknown token ${token}`);
  const amount = await client.readContract({
    address: stock.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });
  if (amount === 0n) throw new Error(`No ${token} on this address.`);
  const { request } = await client.simulateContract({
    account,
    address: stock.address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amount],
  });
  return wallet.writeContract(request);
}
