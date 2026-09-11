import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";

/**
 * Cross-chain leg: intent-based router. The router never holds user funds;
 * the user deposits to a venue address and the fill arrives at `recipient`.
 *
 * The integrator fee (`appFees`) is deducted from the input asset and paid to
 * ROUTER_FEE_RECIPIENT. That fee is one of the vault's revenue sources.
 */
const BASE_URL = "https://1click.chaindefuser.com";

export const quoteInput = z.object({
  originAsset: z.string().min(3),
  destinationAsset: z.string().min(3),
  amount: z.string().regex(/^\d+$/, "amount must be an integer string in base units"),
  recipient: z.string().min(10),
  refundTo: z.string().min(10),
  slippageBps: z.number().int().min(1).max(1000).default(100),
  dry: z.boolean().default(true),
});
export type QuoteInput = z.infer<typeof quoteInput>;

export type RouterToken = {
  assetId: string;
  symbol: string;
  blockchain: string;
  decimals: number;
  contractAddress?: string;
  price?: number;
};

export type RouterQuote = {
  correlationId: string;
  quote: {
    depositAddress?: string;
    amountIn: string;
    amountInFormatted: string;
    amountInUsd?: string;
    amountOut: string;
    amountOutFormatted: string;
    amountOutUsd?: string;
    minAmountOut: string;
    timeEstimate: number;
    deadline: string;
  };
};

export class RouterError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function headers() {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (env.routerJwt) h.authorization = `Bearer ${env.routerJwt}`;
  return h;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function listTokens(): Promise<RouterToken[]> {
  const res = await fetch(`${BASE_URL}/v0/tokens`, { headers: headers(), next: { revalidate: 600 } });
  if (!res.ok) throw new RouterError(`router tokens ${res.status}`);
  return (await res.json()) as RouterToken[];
}

export async function requestQuote(input: QuoteInput): Promise<RouterQuote> {
  if (!env.routerJwt) {
    throw new RouterError("ROUTER_JWT is not configured on the server", 503);
  }
  const deadline = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const body: Record<string, unknown> = {
    dry: input.dry,
    swapType: "EXACT_INPUT",
    slippageTolerance: input.slippageBps,
    originAsset: input.originAsset,
    depositType: "ORIGIN_CHAIN",
    destinationAsset: input.destinationAsset,
    amount: input.amount,
    refundTo: input.refundTo,
    refundType: "ORIGIN_CHAIN",
    recipient: input.recipient,
    recipientType: "DESTINATION_CHAIN",
    deadline,
    quoteWaitingTimeMs: 3000,
  };
  if (env.routerFeeRecipient && env.routerFeeBps > 0) {
    body.appFees = [{ recipient: env.routerFeeRecipient, fee: env.routerFeeBps }];
  }
  const res = await fetch(`${BASE_URL}/v0/quote`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await readJson(res);
  if (!res.ok) {
    const message = typeof json.message === "string" ? json.message : `router quote ${res.status}`;
    throw new RouterError(message, res.status);
  }
  return json as unknown as RouterQuote;
}

export async function orderStatus(depositAddress: string) {
  const url = new URL(`${BASE_URL}/v0/status`);
  url.searchParams.set("depositAddress", depositAddress);
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  const json = await readJson(res);
  if (!res.ok) {
    const message = typeof json.message === "string" ? json.message : `router status ${res.status}`;
    throw new RouterError(message, res.status);
  }
  return json as { status: string; updatedAt?: string; swapDetails?: unknown };
}
