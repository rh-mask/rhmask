import "server-only";

/** Server-side env access. Missing values degrade to a clear, named 503. */
export const env = {
  routerJwt: process.env.ROUTER_JWT ?? "",
  routerFeeRecipient: process.env.ROUTER_FEE_RECIPIENT ?? "",
  routerFeeBps: clampInt(process.env.ROUTER_FEE_BPS, 30, 0, 500),
  alchemyKey: process.env.ALCHEMY_API_KEY ?? "",
};

function clampInt(raw: string | undefined, fallback: number, min: number, max: number) {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function serverRpcUrl() {
  if (env.alchemyKey) return `https://robinhood-mainnet.g.alchemy.com/v2/${env.alchemyKey}`;
  return process.env.NEXT_PUBLIC_RHC_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
}
