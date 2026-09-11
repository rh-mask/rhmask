/**
 * Stock Tokens on Robinhood Chain (chain id 4663).
 *
 * These are the issuer's ERC-20 tokens (18 decimals). Addresses below were
 * collected from public explorer data in September 2026. Re-verify every
 * address on the explorer before wiring real value to it - the issuer uses
 * an upgradeable beacon proxy pattern, so behaviour can change under the
 * same address.
 */
export type StockToken = {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: 18;
  /** Tokens the reward basket may include. */
  basket: boolean;
};

export const STOCK_TOKENS: StockToken[] = [
  { symbol: "NVDA", name: "NVIDIA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", decimals: 18, basket: true },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", decimals: 18, basket: true },
  { symbol: "TSLA", name: "Tesla", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", decimals: 18, basket: true },
  { symbol: "AAPL", name: "Apple", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", decimals: 18, basket: true },
  { symbol: "MSFT", name: "Microsoft", address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74", decimals: 18, basket: true },
  { symbol: "AMZN", name: "Amazon", address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54", decimals: 18, basket: false },
  { symbol: "GOOGL", name: "Alphabet", address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3", decimals: 18, basket: false },
  { symbol: "META", name: "Meta Platforms", address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35", decimals: 18, basket: false },
  { symbol: "MSTR", name: "Strategy", address: "0xec262a75e413fAfD0dF80480274532C79D42da09", decimals: 18, basket: false },
  { symbol: "QCOM", name: "Qualcomm", address: "0x0f17206447090e464C277571124dD2688E48AEA9", decimals: 18, basket: false },
];

export const BASKET = STOCK_TOKENS.filter((t) => t.basket);

export function findStock(symbol: string) {
  return STOCK_TOKENS.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
}
