# VeilStreet

**The privacy layer for tokenized stocks on Robinhood Chain.**

> Wall Street sees everything. VeilStreet sees nothing.

Tokenized stocks put the market on a public ledger: every entry, every exit, every balance is visible to anyone with an explorer. VeilStreet gives holders three things: a way to **receive unseen**, a way to **trade unseen**, and a vault that **pays stakers in real stock tokens**.

| Surface | What it does | State |
|---|---|---|
| **Ghost Receive** | One meta-address, a fresh unlinkable address per payment (ERC-5564 stealth addresses, derived in the browser). | beta |
| **Veil Swap** | Private fills instead of public order books. Venue name and flat fee printed before you send. Non-custodial. | beta (dry quotes) |
| **Blue Chip Vault** | Stake `$VEIL`; protocol revenue buys a basket of stock tokens and streams it to stakers. | planned |
| **Proof Ledger** | Every payout listed with its transaction hash. If it is not on the ledger, it did not happen. | planned |

Nothing on the site is estimated or back-filled. Surfaces marked *planned* have no on-chain effect yet.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Route handlers keep secrets server-side; deploys to Vercel with zero config |
| Language | TypeScript, strict | |
| Styling | Tailwind CSS v4 | CSS-first theme, no config file |
| Chain | viem v2 | Typed RPC client for Robinhood Chain |
| Crypto | `@noble/curves`, `@noble/hashes` | Audited secp256k1 + keccak for stealth address derivation |
| Validation | zod | Every API body is validated before it touches a provider |

No wallet SDK. The connect button talks to the injected EIP-1193 provider directly: fewer dependencies, no telemetry.

---

## Network

Robinhood Chain is an Arbitrum-Orbit L2. Mainnet launched 1 July 2026.

| | Mainnet |
|---|---|
| Chain ID | `4663` (`0x1237`) |
| RPC | `https://rpc.mainnet.chain.robinhood.com` (rate-limited, not for production) |
| Explorer | `https://robinhoodchain.blockscout.com` |
| Gas | ETH |

Set `ALCHEMY_API_KEY` for production reads. Stock Token addresses live in [`src/lib/tokens.ts`](src/lib/tokens.ts). Re-verify them on the explorer before wiring real value: the issuer uses upgradeable proxies.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev
```

The app runs with no keys at all. Routes that need a key return a `503` naming the exact env var.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | public | Canonical URL for metadata |
| `NEXT_PUBLIC_RHC_RPC_URL` | public | Override browser RPC |
| `ROUTER_JWT` | server | Intent router partner key; enables live quotes |
| `ROUTER_FEE_RECIPIENT` | server | Address that receives the routing fee |
| `ROUTER_FEE_BPS` | server | Routing fee in basis points (default 30) |
| `ALCHEMY_API_KEY` | server | Production RPC |

`NEXT_PUBLIC_*` values are inlined into the browser bundle. Never put a secret behind that prefix.

---

## Project layout

```
veilstreet/
├─ src/
│  ├─ app/             Next.js routes
│  │  ├─ page.tsx      landing
│  │  ├─ app/          dashboard (Swap · Receive · Vault)
│  │  └─ api/          backend route handlers
│  │     ├─ health     liveness
│  │     ├─ chain      chain params + live block number
│  │     ├─ tokens     stock token registry
│  │     ├─ quote      POST: private-fill quote
│  │     ├─ order/[id] GET: settlement status
│  │     └─ vault      vault summary + proof ledger
│  ├─ components/      UI
│  ├─ hooks/           useWallet (EIP-1193, no SDK)
│  └─ lib/
│     ├─ chain.ts      Robinhood Chain definition
│     ├─ tokens.ts     stock token addresses
│     ├─ stealth.ts    ERC-5564 derivation (client-side)
│     ├─ env.ts        server env (never imported by client code)
│     └─ router/       intent router client (server-only)
├─ contracts/          Solidity (vault, announcer, fee splitter) - see contracts/README.md
├─ docs/               product, architecture, tokenomics, roadmap
├─ marketing/          narrative and launch copy
└─ public/
```

---

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/chain` | chain params, live block number, RPC error if any |
| GET | `/api/tokens` | stock token registry |
| POST | `/api/quote` | `{ originAsset, destinationAsset, amount, recipient, refundTo, slippageBps?, dry? }` |
| GET | `/api/order/:depositAddress` | order status |
| GET | `/api/vault` | totals, basket, payouts (all zero until the vault ships) |

---

## Privacy model, stated plainly

**Hidden:** the link between you and a receiving address (stealth addresses); your order from public order books and mempools as a visible swap.

**Not hidden:** on-chain settlement itself; the venue filling an order sees the deposit and the receiving address; network-level metadata (your IP to the RPC) unless you use your own node or a relay.

VeilStreet is non-custodial software. It does not hold funds, does not provide investment advice, and does not guarantee execution, rates, or settlement times. Stock Tokens are issued by a third party and may be unavailable in your jurisdiction.

---

## Deploy

Vercel, framework preset Next.js, region `sin1` (see [`vercel.json`](vercel.json)). Add the server env vars in the project settings. No database is required for this release.

## License

MIT
