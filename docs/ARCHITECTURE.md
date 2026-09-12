# Architecture

## Principles

1. **Non-custodial, always.** No server ever holds a private key that controls user funds. Deposits go from the user's wallet to a venue or a contract.
2. **Secrets stay on the server.** Router keys and RPC keys live in route handlers. The browser bundle contains none.
3. **Client-side privacy.** Stealth key generation and derivation run in the browser. The server never sees a spending or viewing key.
4. **Fail closed.** A missing key returns a `503` that names the env var. A bad input returns a `400` with the validation issues. Nothing falls back to a fake value.
5. **Nothing estimated.** Vault totals and payouts come from chain reads and the ledger. Empty is a valid state and is displayed as such.

## Components

```
 browser                          Vercel (Next.js)                       chain / venues
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
2. Sender: `deriveStealthAddress(meta)` → one-time address + ephemeral pubkey + view tag → send funds → call `StealthAnnouncer.announce(...)` (or hand over the ephemeral key off-band until the announcer ships).
3. Recipient: scan announcements, filter by view tag, `checkAnnouncement()` recovers the stealth private key, sweep.

### Vault payout (after launch)

1. Revenue lands in `RevenueRouter` (ETH from launchpad fee escrow claims, input-token fees from routing, ETH from relay).
2. Keeper calls `RevenueRouter.convert()` which swaps to basket tokens through a fixed route and pushes to `MaskVault`.
3. `MaskVault` updates the reward-per-token accumulator. `ProofLedger.record()` logs the payout.
4. `/api/vault` reads totals and the ledger; dashboard renders.

## Infrastructure

| Concern | Choice |
|---|---|
| Hosting | Vercel, region `sin1`, Node runtime for route handlers |
| RPC | Alchemy (server), public RPC fallback (browser) |
| Database | none in this release; order history is per-browser. A Postgres with row-level security is the planned addition for rewards accounting |
| Secrets | Vercel project env |
| Observability | Vercel logs; add a structured logger before rewards accounting ships |

## Known local-dev trap

Some ISPs DNS-hijack `*.robinhood.com`. The public RPC then looks dead (TLS altname errors, empty responses). It is a local network artifact. Use a VPN, or set `NEXT_PUBLIC_RHC_RPC_URL` / `ALCHEMY_API_KEY` to a different host. Vercel is unaffected.
