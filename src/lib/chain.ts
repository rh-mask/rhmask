import { defineChain } from "viem";

/**
 * Robinhood Chain (Arbitrum Orbit L2). Mainnet went live 1 July 2026.
 *
 * The public RPC is rate-limited and not intended for production traffic.
 * Set NEXT_PUBLIC_RHC_RPC_URL (browser) / ALCHEMY_API_KEY (server) for real load.
 */
export const ROBINHOOD_CHAIN_ID = 4663;

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
      apiUrl: "https://robinhoodchain.blockscout.com/api",
    },
  },
});

export const ROBINHOOD_TESTNET_ID = 46630;

/**
 * Robinhood Chain Testnet, which settles to Sepolia. This is the sandbox: the
 * same contracts, the same derivation, funds that are worth nothing.
 *
 * The chain's own testnet RPC host is unreachable from some networks, so the
 * default here is a public mirror that answers for the same chain id. Anything
 * pointed at it should still assert the chain id before writing.
 * The CLI keeps its own copy of these values so that it can ship without viem;
 * if one changes, change both.
 */
export const robinhoodTestnet = defineChain({
  id: ROBINHOOD_TESTNET_ID,
  name: "Robinhood Chain Testnet",
  testnet: true,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://robinhood-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
});

export const EXPLORER_URL = robinhoodChain.blockExplorers.default.url;

export function explorerAddress(address: string) {
  return `${EXPLORER_URL}/address/${address}`;
}

export function explorerTx(hash: string) {
  return `${EXPLORER_URL}/tx/${hash}`;
}

/**
 * Browser-side RPC URL.
 *
 * Default is the app's own /api/rpc pass-through: same origin, so an ISP that
 * DNS-hijacks the chain's domain cannot break balance reads or sweeps.
 * NEXT_PUBLIC_RHC_RPC_URL overrides it (own node, paid RPC). Outside the
 * browser (tests, scripts) the public endpoint is used directly.
 */
export function publicRpcUrl() {
  if (process.env.NEXT_PUBLIC_RHC_RPC_URL) return process.env.NEXT_PUBLIC_RHC_RPC_URL;
  if (typeof window !== "undefined") return `${window.location.origin}/api/rpc`;
  return robinhoodChain.rpcUrls.default.http[0];
}
