import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { robinhoodChain } from "@/lib/chain";
import { serverRpcUrl } from "@/lib/env";

export const runtime = "nodejs";
export const revalidate = 30;

/** Chain parameters plus a live block number so the UI can show the chain is reachable. */
export async function GET() {
  const client = createPublicClient({ chain: robinhoodChain, transport: http(serverRpcUrl()) });
  let blockNumber: string | null = null;
  let rpcError: string | null = null;
  try {
    blockNumber = (await client.getBlockNumber()).toString();
  } catch (err) {
    rpcError = err instanceof Error ? err.message.split("\n")[0] : "rpc unreachable";
  }
  return NextResponse.json({
    id: robinhoodChain.id,
    name: robinhoodChain.name,
    nativeCurrency: robinhoodChain.nativeCurrency,
    explorer: robinhoodChain.blockExplorers.default.url,
    blockNumber,
    rpcError,
  });
}
