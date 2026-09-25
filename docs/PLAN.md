# Product plan

Status as of 2026-09-12. Live at https://rhmask.org. This document is the single list of what is
fixed, what is next, and why. The roadmap (`ROADMAP.md`) is the calendar view of the same plan; the extension
design is in `EXTENSION.md`.

## 1. Two surfaces, two core functions

| | Ghost Receive | Mask Swap |
|---|---|---|
| **Dapp** | Keys, meta-address QR, derive, Private Pay (request QR, receipt QR, claim, sweep), (next) on-chain scan | Quote, deposit, receipt, order status |
| **Extension** | Fresh stealth address in any address field, background scan, sweep | One-click private quote from any page |

The Blue Chip Vault and the Proof Ledger are the token layer underneath both surfaces, not a third product.
Every screen in both surfaces answers one of two questions: "was I seen?" and "was I paid?".

## 1b. Private Pay (shipped 2026-09-12, beta)

Private payment and private transfer, both driven by QR, both fully client-side:

| Step | Who | What happens |
|---|---|---|
| Request | recipient | `/app#pay` builds a payment request (meta-address + optional token, amount, memo) as a link and a QR. A phone camera opens `/pay?to=…` directly. |
| Send | payer | Scans or pastes the request, gets a one-time ERC-5564 address, sends ETH or a stock token from an injected wallet (or any wallet, pasting the tx hash), and receives a **receipt QR**. |
| Claim | recipient | Scans the receipt in Ghost Receive. The viewing key recognises it (view tag first, then the full check), the spending key derives the stealth private key, balances are read, and a **sweep** signs in-page to any destination. |
| Keys | recipient | Generate, show as QR, back up (JSON), restore (JSON, two keys, or a scanned backup QR), and **encrypt at rest** (PBKDF2-SHA256 310k + AES-256-GCM, WebCrypto). |

The receipt QR is the announcement until the `StealthAnnouncer` contract ships; the format (`addr`, `eph`, `tag`) maps 1:1 onto the ERC-5564 `Announcement` event so the scanner can replace the QR without a format change.

Files: `src/lib/payment.ts` (wire formats), `src/lib/qr.ts` (SVG generation, BarcodeDetector + jsQR decoding), `src/lib/transfer.ts` (wallet transfer, balances, sweep), `src/lib/keystore.ts` (shared store, encryption), `src/components/{PayCard,ClaimCard,QrCode,QrScanner,StealthCard}.tsx`, `src/app/pay/page.tsx`. Round-trip test: `npm run check:payment`.

## 1c. Mechanism stack (what is modern, what we use, what is next)

| Mechanism | Standard | Status in RhMask | Why it fits the narrative |
|---|---|---|---|
| Stealth addresses with view tags | ERC-5564 | live, client-side | "Receive unseen": one meta-address, unlinkable one-time addresses, fast scanning |
| Stealth meta-address registry | ERC-6538 | contract planned (phase 1) | Look up a meta-address by ENS/address so payers never paste 140 hex chars |
| On-chain announcer | ERC-5564 `announce` | receipt QR now, contract phase 1 | Removes the out-of-band step; the scanner finds payments without a QR |
| Encrypted local keys | WebCrypto PBKDF2 + AES-GCM | live | Keys never leave the device, and are unreadable at rest |
| Passkey-bound keys | WebAuthn PRF extension | next (phase 2) | Unlock with a passkey instead of a passphrase; the encryption key is derived inside the authenticator |
| Sponsored stealth sweeps | EIP-7702 delegation + ERC-4337 paymaster | phase 3 (relay) | A fresh stealth address has no ETH; a paymaster pays gas and takes the fee from the swept amount, so "receive unseen" does not need "fund first" |
| Intent-based private fills | ERC-7683 cross-chain intents | Mask Swap uses an intent router today; ERC-7683 order format planned | Orders are filled by solvers, never sit in a public book or mempool |
| Provable-but-private | Privacy Pools style association sets | research (phase 4) | Stakers and users can prove funds are not from a sanctioned set without revealing which deposit is theirs |
| Proof of payment | ZK receipt (prove a stealth payment happened to you without revealing the address) | research | Invoices, refunds and disputes without doxxing the receiving address |
| Confidential amounts | FHE / encrypted ERC-20 (not available on this chain yet) | research | Hide the value, not just the address |

Rule: anything in "live" has a test and a URL. Anything else is on the roadmap with a phase, or marked research.

## 1d. On-chain verification (mainnet, 2026-09-12)

`npm run check:onchain` runs read-only against Robinhood Chain (chain id 4663) and simulates with `eth_call` from real
holders found in recent Transfer logs. Nothing is signed or broadcast. Findings:

| Area | Result |
|---|---|
| Chain, gas | Block age under 2s, `estimateFeesPerGas` works (priority fee 0), a 21k-gas ETH transfer costs about 0.0000025 ETH |
| Stock tokens | All 10 registry addresses are live ERC-20s with the expected symbol and 18 decimals; every one is an upgradeable beacon proxy owned by the issuer |
| Stealth receive | A fresh one-time address is an empty EOA; `balanceOf` works on all tokens; transfer of NVDA, SPY, TSLA, AAPL, MSFT to it simulates fine |
| Vault feasibility | Transfer of every basket token to a contract (Multicall3) simulates fine, `approve` works, no `paused()` exposed: a vault can hold and stream stock tokens |
| Sweep | Empty stealth address fails cleanly with `ERC20InsufficientBalance` / "exceeds the balance", which the UI now translates into a sentence |
| One false alarm | An AAPL transfer reverted once because the sampled holder had spent its balance between the log scan and the simulation; the script now rotates holders and decodes the selector |

ISP note: some networks DNS-hijack the chain's RPC domain to a filter page that never answers. Two bypasses ship:

- **In the app**: the browser talks to `/api/rpc` (same origin) which forwards allow-listed JSON-RPC methods to the
  real RPC from the server. `NEXT_PUBLIC_RHC_RPC_URL` overrides it for people with their own node.
- **In the check script**: system DNS is compared with DNS-over-HTTPS; on disagreement the real IP is pinned and TLS
  still verifies the hostname. Requests carry a 10s timeout and retry on 429 / 5xx.

Improvements shipped from the run: pre-flight simulation before the wallet prompt (a revert becomes a sentence, not a
failed transaction), sweep gas from `estimateGas` instead of a hard-coded 21k, revert selectors decoded in the UI.

## 2. Bugs fixed in this round

| Area | Bug | Fix |
|---|---|---|
| Brand | Navbar logo still drew the old letter mark after the icon changed | `Logo.tsx` now matches `icon.svg` (mask shape) |
| Wallet | Rejecting `wallet_addEthereumChain` threw an unhandled promise rejection; chain id was stale after a switch | Both requests wrapped, chain id re-read after switch |
| Stealth keys | Corrupt or hand-edited storage was rendered as-is; nothing validated the key shapes | Stored keys are validated against 32-byte hex and the meta-address format before use, otherwise ignored |
| Stealth keys | Copy button gave no feedback and silently failed without clipboard permission | "Copied" state and a visible error |
| Social | No OG / X card image; `summary_large_image` was declared with no image | `opengraph-image.tsx` renders a 1200x630 card at build time |
| Dashboard | Tab state lived in memory only; `/app#swap` was not linkable | Tabs read and write the URL hash, ARIA roles added |
| Router API | Deposit ids with `.` or `-` (non-EVM venues) were rejected as invalid | Regex widened, length capped |
| Router API | Asset ids and addresses were not trimmed; unbounded length | Trimmed and capped at 128 chars |
| Headers | No `Permissions-Policy`, no HSTS | Both added in `next.config.ts` |
| Repo | Duplicate `.vercel` ignore line | Removed |
| Repo | No pre-push gate; commit history carried AI co-author trailers | `scripts/prepush-check.mjs`, hook installer, CI workflow, rules in `PUSH_RULES.md` |

## 3. Feature plan

### Ghost Receive (dapp + extension)

- **Announcer + registry contracts** (ERC-5564 `announce`, ERC-6538 registry). Without these, senders must hand
  the ephemeral key over out of band. This is the single biggest gap between "demo" and "product".
- **Scanner**: client-side event scan filtered by view tag, list of stealth balances, per-address explorer link.
- **Sweep** (done): self-funded gas now, paymaster relay later.
- **Encrypted key storage** (done, passphrase): passkey (WebAuthn PRF) unlock next.
- **Key export / import** (done: JSON backup, meta-address QR, restore): viewing-key-only export for accountants next.
- **Extension chip**: address-field detection and one-click paste (see `EXTENSION.md`).

### Mask Swap (dapp + extension)

- **Asset picker** (done): `/api/router-tokens` serves the router's list (189 assets, 35 chains, cached 10 min);
  the card filters by chain and search. Raw asset ids are gone.
- **Human amounts** (done): decimal input converted to base units with the picked asset's decimals.
- **Address validation** (done): EVM address check on EVM chains, length check elsewhere, per field.
- **Stealth destination shortcut** (done): "Receive on a fresh stealth address" derives one from your own
  meta-address for EVM destinations.
- **Live quotes** once `ROUTER_JWT` is set: deposit address, countdown to deadline, "send from wallet" button
  that fills the transfer for injected wallets.
- **Receipt page** `/r/:id`: status polling, venue, fee line, share link, "size hidden" toggle.

### Blue Chip Vault + Proof Ledger

- **On-chain feasibility (done, 2026-09-12)**: a contract can hold and transfer the issuer's stock tokens, so the
  vault streams tokens directly. Re-run `npm run check:onchain` before each release; the tokens are upgradeable.
- Contracts `MaskVault`, `RevenueRouter`, `ProofLedger` (spec in `contracts/README.md`), audit scope frozen
  before launch.
- Vault API reads chain state; the ledger page lists payouts newest first with hashes; RSS/JSON feed for
  the ledger so anyone can mirror it.

### Token ($MASK)

- Fair launch on the launchpad, creator fee to the vault wallet from block one, launch hash on the ledger.
- Fee discount tiers by staked amount, read live from the vault in the swap quote.
- Basket vote (snapshot-style, off-chain signatures, on-chain execution by the keeper).

## 4. Improvements (existing features, better)

- Landing: replace the status table's hard-coded rows with the same data `/api/vault` and a new `/api/status`
  return, so the page can never drift from reality.
- `/api/chain`: cache the viem client per process; add latency to the payload; expose it in the footer.
- Wallet hook: remember "connected" for the session only (no auto-connect on load, by design), handle
  `eth_accounts` returning empty after a lock.
- Stealth card: show the view tag and ephemeral key as a single copyable "announcement" JSON.
- Empty and error states for every fetch (vault, chain, quote) with a retry button, not silent dashes.
- Loading skeletons on the dashboard cards.
- i18n scaffold (English first; Indonesian second, since the founding community is there).
- Accessibility pass: focus rings, tab semantics (started), colour contrast on `fog` text.

## 5. Upgrades (new capability)

- **Extension** (`EXTENSION.md`), the second surface.
- **Encrypted local vault for keys** with passphrase, shared between dapp and extension via the same format.
- **Gasless sweep relay**: a small server that sponsors gas for stealth sweeps, fee taken from the swept
  amount, paid to the vault.
- **Native on-chain private route**: batched, delayed forwarder for stock-token swaps on the chain's DEXes,
  so no single swap is attributable (roadmap phase 3).
- **Viewing-key disclosure**: export a viewing key for a date range so a user can prove income to a third
  party without revealing spending capability.
- **Public API v1** with keyed tiers, so other dapps can offer "receive unseen" without our UI.
- **Status page** `/status` with uptime of RPC, router and app, plus the honest-status table.

## 6. Order of work

Done: rebrand, push rules + CI, Private Pay (QR request / send / receipt / claim / sweep), encrypted key storage,
on-chain verification, ISP bypass, rhmask.org attached to the project.

1. Repo publish: rewrite the local history (drop AI trailers), split the working tree into small commits, push
   (blocked on the GitHub account and PAT). DNS for rhmask.org, then `NEXT_PUBLIC_APP_URL`.
2. First real mainnet payment: fund one wallet with a little ETH and one stock token, run the QR flow end to end
   on two phones, post the hashes. This is the first "stealth first" for X.
3. `StealthAnnouncer` + `StealthRegistry` contracts (ERC-5564 / ERC-6538) on testnet, then mainnet; scanner in
   the dapp replaces the receipt QR (the QR stays as the offline path).
4. Mask Swap: asset picker, human amounts, address validation (done); live quotes once `ROUTER_JWT` is set.
5. Extension MVP (done: popup with keys and meta-address QR, backup/restore, passphrase encryption in the shared
   `keycrypto` format with session-only unlock, address-field chips, receipts list, derive-for-someone; see
   `extension/README.md`). Next: icons, store listing, background scanner once the announcer contract exists.
6. Passkey (WebAuthn PRF) unlock; viewing-key export.
7. Vault contracts + audit scope (feasibility is verified), token launch, first payout hash, ledger feed.
8. Gasless sweep relay (EIP-7702 + paymaster), native private route, API v1.

Each step ends with a hash, a screenshot, or a URL. If it cannot be shown, it is not done.
