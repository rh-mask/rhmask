import { NextResponse } from "next/server";
import { listTokens, RouterError } from "@/lib/router/intent";

export const runtime = "nodejs";
export const revalidate = 600;

/**
 * GET /api/router-tokens
 * Assets the intent router can fill, trimmed to what the picker needs and
 * sorted by chain then symbol. Cached for 10 minutes. No key required.
 */
export async function GET() {
  try {
    const tokens = await listTokens();
    const out = tokens
      .map((t) => ({
        assetId: t.assetId,
        symbol: t.symbol,
        blockchain: t.blockchain,
        decimals: t.decimals,
        price: typeof t.price === "number" ? t.price : null,
      }))
      .sort((a, b) => a.blockchain.localeCompare(b.blockchain) || a.symbol.localeCompare(b.symbol));
    const chains = [...new Set(out.map((t) => t.blockchain))].sort();
    return NextResponse.json(
      { count: out.length, chains, tokens: out },
      { headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    const status = err instanceof RouterError ? err.status : 502;
    return NextResponse.json({ error: "router token list unavailable" }, { status });
  }
}
