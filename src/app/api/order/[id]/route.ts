import { NextResponse } from "next/server";
import { orderStatus, RouterError } from "@/lib/router/intent";

export const runtime = "nodejs";

/** GET /api/order/:depositAddress - settlement status of a routed order. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-zA-Z._-]{20,128}$/.test(id)) {
    return NextResponse.json({ error: "invalid order id" }, { status: 400 });
  }
  try {
    const status = await orderStatus(id);
    return NextResponse.json(status, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (err instanceof RouterError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "status lookup failed" }, { status: 502 });
  }
}
