import { NextResponse } from "next/server";
import { BASKET } from "@/lib/tokens";

export const runtime = "nodejs";
export const revalidate = 60;

/**
 * GET /api/vault
 *
 * Vault summary for the UI. Until the vault contract is deployed every
 * figure is zero and `live` is false - the UI must label it as such.
 * When the contract ships this handler reads totals and the payout ledger
 * from chain; nothing is ever estimated or back-filled.
 */
export function GET() {
  return NextResponse.json({
    live: false,
    contract: null as string | null,
    totalStaked: "0",
    stakers: 0,
    basket: BASKET.map((t) => ({ symbol: t.symbol, address: t.address })),
    payouts: [] as Array<{ txHash: string; symbol: string; amount: string; at: string }>,
    revenueSources: [
      { id: "router-fee", label: "Routing fee", live: false },
      { id: "launch-fee", label: "Token trading fee (creator share)", live: false },
      { id: "sweep-fee", label: "Stealth sweep relay fee", live: false },
    ],
  });
}
