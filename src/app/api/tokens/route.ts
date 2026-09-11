import { NextResponse } from "next/server";
import { STOCK_TOKENS } from "@/lib/tokens";
import { robinhoodChain } from "@/lib/chain";

export const runtime = "nodejs";
export const revalidate = 3600;

/** Stock Tokens known to the app on Robinhood Chain. */
export function GET() {
  return NextResponse.json({
    chainId: robinhoodChain.id,
    tokens: STOCK_TOKENS,
  });
}
