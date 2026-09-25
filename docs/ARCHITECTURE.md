# Architecture

## Principles

1. **Non-custodial, always.** No server ever holds a private key that controls user funds. Deposits go from the user's wallet to a venue or a contract.
2. **Secrets stay on the server.** Router keys and RPC keys live in route handlers. The browser bundle contains none.
3. **Client-side privacy.** Stealth key generation and derivation run in the browser. The server never sees a spending or viewing key.
4. **Fail closed.** A missing key returns a `503` that names the env var. A bad input returns a `400` with the validation issues. Nothing falls back to a fake value.
5. **Nothing estimated.** Vault totals and payouts come from chain reads and the ledger. Empty is a valid state and is displayed as such.
6. **Reachable under a hostile network.** Browser chain access goes through a same-origin pass-through, so an ISP that hijacks the chain's RPC domain cannot break the app.

## Components

```
 browser                          our origin (Next.js)                   chain / venues
 ┌─────────────────┐              ┌──────────────────────┐              ┌──────────────────┐
 │ Ghost Receive   │  none        │                      │              │ Robinhood Chain  │
 │  keys, derive   │─────────────▶│                      │              │  4663            │
 │                 │              │ /api/chain ──────────┼─────────────▶│  RPC (Alchemy)   │
 │ Mask Swap       │ POST quote   │ /api/quote ──────────┼──┐           │                  │
 │  form, receipt  │─────────────▶│  zod → router client │  │           │ StealthAnnouncer │
 │                 │              │ /api/order/:id       │  │           │ MaskVault        │
 │ Vault           │ GET vault    │ /api/vault ──────────┼──┼──────────▶│ ProofLedger      │
 │  totals, ledger │─────────────▶│  chain reads         │  │           └──────────────────┘
 │                 │              └──────────────────────┘  │           ┌──────────────────┐
 │ wallet (EIP-1193)│  tx signed locally, sent to venue/contract        │ intent router    │
 └─────────────────┘                                        └──────────▶│ (private fills)  │
                                                                        └──────────────────┘
```

## Request flows

### Quote → order → receipt

1. Client `POST /api/quote` with asset ids, amount, receiving address, refund address.
2. Handler validates with zod, attaches the integrator fee (`ROUTER_FEE_BPS` → `ROUTER_FEE_RECIPIENT`), calls the router with the server JWT.
3. Response carries venue quote and, when not a dry run, a deposit address.
4. User's wallet sends to the deposit address. Server never touches it.
5. Client polls `GET /api/order/:depositAddress` until `SUCCESS` / `REFUNDED` / `FAILED`.
6. Receipt card renders from the final status. Shareable by link, size optional.

### Stealth receive

1. Recipient: `generateStealthKeys()` → store locally → share meta-address.
2. Sender: `deriveStealthAddress(meta)` → one-time address + ephemeral pubkey + view tag → send funds → either call `StealthAnnouncer.announce(...)` on chain, or hand the same three fields over as a receipt QR. The QR is the offline path, not a fallback for a missing contract.
3. Recipient: scan announcements, **filter on the one-byte view tag first**, then `checkAnnouncement()` on survivors recovers the stealth private key. Sweep with a gas estimate, never a hard-coded 21,000.

The receipt QR and the on-chain event carry the same three fields, `stealthAddress`, `ephemeralPubKey` and the view tag in `metadata[0]`, so a scanner reads either source with one code path.

**Deployed 2026-09-25** (see [`../contracts/deployments.json`](../contracts/deployments.json)):

| Contract | Address | Standard |
|---|---|---|
| `StealthAnnouncer` | `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` | ERC-5564 |
| `StealthRegistry` | `0xa30e5702561bf230ad37ceecd1801c61067996a9` | ERC-6538 |

Neither has an owner, a pause, or an upgrade path, and neither holds funds.

### Vault payout (after launch)

1. Revenue lands in `RevenueRouter` (ETH from launchpad fee escrow claims, input-token fees from routing, ETH from relay).
2. Keeper calls `RevenueRouter.convert()` which swaps to basket tokens through a fixed route and pushes to `MaskVault`.
3. `MaskVault` updates the reward-per-token accumulator. `ProofLedger.record()` logs the payout.
4. `/api/vault` reads totals and the ledger; dashboard renders.

## Infrastructure

| Concern | Choice |
|---|---|
| Hosting | Any Node host that runs Next.js; the Node runtime is required for the route handlers |
| RPC | Alchemy (server), public RPC fallback (browser) |
| Database | none in this release; order history is per-browser. A Postgres with row-level security is the planned addition for rewards accounting |
| Secrets | Host environment variables; none are prefixed `NEXT_PUBLIC_` |
| Observability | Host request logs only. The application writes no logs of its own and reads no client IP. Add a structured logger before rewards accounting ships |

## The RPC pass-through

Some ISPs DNS-hijack `*.robinhood.com`, so the chain's public RPC looks dead from a browser on that network: TLS altname errors, empty responses, hanging requests. It is a network artifact, not a chain problem, and telling users to install a VPN is not a fix.

So `publicRpcUrl()` points the browser at `/api/rpc` on the app's own origin, and the server forwards from there. Read methods plus `eth_sendRawTransaction` are allow-listed, batches are capped at 20, and `eth_getLogs` ranges are bounded, so the public endpoint is not abused through us. `NEXT_PUBLIC_RHC_RPC_URL` overrides it for anyone running their own node.

The route signs nothing and holds nothing. A raw transaction arrives already signed by the user's wallet or by a key that never left their browser.

## Chain quirks that bit us

| Quirk | Consequence |
|---|---|
| Intrinsic gas for a plain ETH transfer is above 21,000 (measured 21,358-21,369 and it moves with L1 data cost) | Never hard-code 21,000. `estimateGas` then add headroom, or the chain rejects the transaction outright. |
| Stock tokens are upgradeable beacon proxies owned by the issuer | Re-verify every address and every transfer assumption before a release. `npm run check:onchain` does this. |
| Chain 4663 is absent from the Arbitrum Orbit registry | The L1 bridge contracts come from the chain's own docs and were cross-checked on mainnet before any funds moved. |

## Invariants

These are product promises rather than preferences. Changing one is a product decision.

1. **A surface that is not live says so.** The `beta` and `planned` labels on the feature cards and in the
   status table are load-bearing. Never quietly promote a label.
2. **A privacy claim ships with its limits.** What is hidden and what is not is stated on `/docs` and in the
   README. We never write "anonymous" or "untraceable", because neither is true of what this builds.
3. **Keys never leave the browser.** No analytics, no self-hosted-elsewhere font, no error reporter, and no
   `fetch` in any component that touches `src/lib/stealth.ts`, `keycrypto.ts` or `keystore.ts`.
4. **Key handling stays client-side.** Everything under `src/lib/` marked `"use client"` is client-only on
   purpose, and moving it to a server component would defeat the point.
5. **Warnings come before money.** The "test with a small amount first" line on the pay flow and the gas
   warning on sweep stay visible.
6. **Secrets stay behind a click.** Private keys, backups and a recovered stealth key are never rendered by
   default.

## Interface rules

Style is open to change; these are not, because they were each paid for once.

| Rule | Why |
|:--|:--|
| No `backdrop-filter`, and no animated `filter: blur()` | Twenty blurred cards and one animated blur cost 27 dropped frames and held the page at 49fps. Removing them locked 60. |
| Component CSS lives in `@layer components` | Otherwise plain custom CSS outranks Tailwind utilities and `md:hidden` stops working. |
| Full-bleed background effects need an `overflow: hidden` parent | A fixed, oversized gradient widened the document and produced horizontal scroll on phones. |
| Measure mobile with device emulation, not a narrow window | A narrow desktop window does not reproduce either bug above. |
