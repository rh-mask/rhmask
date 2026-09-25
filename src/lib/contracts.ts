/**
 * Deployed contracts on Robinhood Chain. Addresses come from
 * contracts/deployments.json, which the deploy script writes; keep the two in
 * step rather than editing one by hand.
 */
export const CONTRACTS = {
  /** ERC-5564 announcer. Emits the event a recipient scans for. */
  announcer: "0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d" as const,
  /** ERC-6538 registry. Maps an address to its stealth meta-address. */
  registry: "0xa30e5702561bf230ad37ceecd1801c61067996a9" as const,
} as const;

/** Scheme 1 is secp256k1 with a view tag, which is what this app derives. */
export const STEALTH_SCHEME_ID = 1n;

export const ANNOUNCER_ABI = [
  {
    type: "event",
    name: "Announcement",
    inputs: [
      { name: "schemeId", type: "uint256", indexed: true },
      { name: "stealthAddress", type: "address", indexed: true },
      { name: "caller", type: "address", indexed: true },
      { name: "ephemeralPubKey", type: "bytes", indexed: false },
      { name: "metadata", type: "bytes", indexed: false },
    ],
  },
  {
    type: "function",
    name: "announce",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schemeId", type: "uint256" },
      { name: "stealthAddress", type: "address" },
      { name: "ephemeralPubKey", type: "bytes" },
      { name: "metadata", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export const REGISTRY_ABI = [
  {
    type: "function",
    name: "registerKeys",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schemeId", type: "uint256" },
      { name: "stealthMetaAddress", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "stealthMetaAddressOf",
    stateMutability: "view",
    inputs: [
      { name: "registrant", type: "address" },
      { name: "schemeId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
] as const;
