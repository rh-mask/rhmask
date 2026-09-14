import { NextResponse } from "next/server";
import { serverRpcUrl } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/rpc  JSON-RPC pass-through to Robinhood Chain.
 *
 * Why: some ISPs DNS-hijack the chain's RPC domain to a filter page, so a
 * browser on that network cannot read balances or broadcast a sweep even
 * though the chain is fine. Same-origin requests to this route are not
 * affected. The browser uses this route by default (see publicRpcUrl()).
 *
 * Read-only methods plus eth_sendRawTransaction are allowed; the server
 * never signs anything and sees no private key. Batches are capped, and
 * eth_getLogs ranges are bounded so the public RPC is not abused through us.
 */
const ALLOWED = new Set([
  "eth_chainId",
  "eth_blockNumber",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_getBalance",
  "eth_getCode",
  "eth_getStorageAt",
  "eth_getTransactionCount",
  "eth_call",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_getLogs",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_sendRawTransaction",
  "net_version",
]);
const MAX_BATCH = 20;
const MAX_LOG_RANGE = 5_000n;
const MAX_BODY = 200_000;

type RpcReq = { jsonrpc?: string; id?: unknown; method?: unknown; params?: unknown };

function reject(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function validate(r: RpcReq): { ok: true } | { ok: false; message: string } {
  if (typeof r.method !== "string" || !ALLOWED.has(r.method)) return { ok: false, message: `method not allowed: ${String(r.method)}` };
  if (r.method === "eth_getLogs") {
    const p = (Array.isArray(r.params) ? r.params[0] : null) as { fromBlock?: string; toBlock?: string } | null;
    const from = p?.fromBlock?.startsWith("0x") ? BigInt(p.fromBlock) : null;
    const to = p?.toBlock?.startsWith("0x") ? BigInt(p.toBlock) : null;
    if (from === null || to === null || to - from > MAX_LOG_RANGE) return { ok: false, message: `eth_getLogs must use explicit hex blocks spanning at most ${MAX_LOG_RANGE}` };
  }
  return { ok: true };
}

export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > MAX_BODY) return NextResponse.json(reject(null, -32600, "body too large"), { status: 413 });
  let payload: RpcReq | RpcReq[];
  try {
    payload = JSON.parse(text);
  } catch {
    return NextResponse.json(reject(null, -32700, "parse error"), { status: 400 });
  }
  const batch = Array.isArray(payload);
  const items: RpcReq[] = Array.isArray(payload) ? payload : [payload];
  if (items.length === 0 || items.length > MAX_BATCH) return NextResponse.json(reject(null, -32600, `batch size 1..${MAX_BATCH}`), { status: 400 });
  for (const r of items) {
    const v = validate(r);
    if (!v.ok) return NextResponse.json(reject(r.id, -32601, v.message), { status: 400 });
  }
  try {
    const upstream = await fetch(serverRpcUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(items.map((r) => ({ jsonrpc: "2.0", id: r.id ?? null, method: r.method, params: r.params ?? [] }))),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const json = await upstream.json();
    const out = batch ? json : Array.isArray(json) ? json[0] : json;
    return NextResponse.json(out, { status: upstream.ok ? 200 : 502, headers: { "cache-control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message.split("\n")[0] : "upstream unreachable";
    return NextResponse.json(reject(null, -32000, `upstream: ${message}`), { status: 502 });
  }
}
