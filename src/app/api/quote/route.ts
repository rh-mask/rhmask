import { NextResponse } from "next/server";
import { quoteInput, requestQuote, RouterError } from "@/lib/router/oneclick";

export const runtime = "nodejs";

/**
 * POST /api/quote
 * Body: { originAsset, destinationAsset, amount, recipient, refundTo, slippageBps?, dry? }
 *
 * Returns a venue quote. With dry=false the response includes a deposit
 * address; the user's wallet sends directly to it and the fill lands at
 * `recipient`. The server never holds funds and never sees a private key.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const parsed = quoteInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const result = await requestQuote(parsed.data);
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (err instanceof RouterError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "quote failed" }, { status: 502 });
  }
}
