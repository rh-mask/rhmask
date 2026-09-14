# Roadmap

Dates are targets, not promises. A surface is "live" only when the status table on the landing page says so.

## Phase 0 · Now (this repository)

- [x] Landing page with the narrative and an honest status table
- [x] Dashboard: Ghost Receive (keys, derive, verify), Mask Swap (dry quotes), Vault (empty, labelled)
- [x] API: health, chain, tokens, quote, order status, vault summary
- [x] Docs: product, architecture, tokenomics, roadmap, narrative
- [x] Deploy to Vercel production (https://rhmask.vercel.app)
- [x] Push rules, pre-push hook, CI workflow
- [x] Private Pay: request QR, send, receipt QR, claim, sweep
- [x] Meta-address QR, key backup / restore, encrypted key storage (passphrase)
- [ ] Publish repository
- [ ] X account, first poster, first thread

## Phase 1 · Weeks 1–2 · Private receive, live quotes

Two surfaces from here on: the dapp and the browser extension (design in `EXTENSION.md`). Both expose the same
two core functions, Ghost Receive and Mask Swap.

- Router partner key → live (non-dry) quotes with deposit addresses and order status
- Asset picker backed by the router token list and the stock token registry
- Receipt page per order, shareable link, size toggle
- `StealthAnnouncer` + `StealthRegistry` written, tested, deployed to testnet
- [x] On-chain verification: a contract can hold stock tokens on this chain (verified 2026-09-12, `npm run check:onchain`); vault streams tokens directly
- First on-chain stealth payment on mainnet, screenshot and hash posted
- Passkey (WebAuthn PRF) unlock on top of the passphrase store, same format for dapp and extension
- [x] Extension MVP: popup with keys and meta-address QR, backup/restore, address-field chips, receipts list (`extension/`)

## Phase 2 · Weeks 3–6 · Token and vault

- Audit scope fixed for `MaskVault`, `ProofLedger`, `RevenueRouter`
- `$MASK` fair launch on the launchpad, creator fee routed to the vault wallet, launch hash posted
- `MaskVault` deployed after audit; staking, tiers, locks
- First stock-token payout on the Proof Ledger
- Buyback and burn pipeline live with hashes

## Phase 3 · Months 2–3 · Native private routing

- On-chain forwarder for stock-token swaps on the chain's DEXes (batching + delay so no single swap is attributable)
- Order split across venues above a threshold
- Gasless stealth sweeps through a relay funded from treasury
- Extension: background scanner, badge, sweep, one-click private quote
- API v1 with keyed tiers
- Referral program with stock-token payout

## Phase 4 · Months 4–12 · Expansion

- Extension on Firefox; store listings signed and hashed
- Viewing-key export for selective disclosure (tax, audit)
- Confidential amounts research (hide value, not just address)
- Mobile shell
- Governance of basket and fee allocation by stakers
