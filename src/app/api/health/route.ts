import { NextResponse } from "next/server";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "veilstreet",
    chainId: ROBINHOOD_CHAIN_ID,
    time: new Date().toISOString(),
  });
}
