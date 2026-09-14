# Product

## One line

RhMask is the privacy layer for tokenized stocks on Robinhood Chain: receive unseen, trade unseen, and earn real stock tokens for staking.

## Who it is for

- Holders of stock tokens who do not want their portfolio readable from an explorer.
- Traders who do not want their size and timing visible in public books and mempools.
- Anyone on the chain who wants yield paid in blue-chip stock tokens instead of in another emission token.

## The four surfaces

### 1. Ghost Receive (stealth wallet)

- User generates a spending key and a viewing key in the browser. Publishes one meta-address (`st:eth:0x…`).
- A sender derives a fresh one-time address from the meta-address. The payment lands there. No on-chain link to the recipient's public identity.
- The recipient scans announcements with the viewing key (view tags discard ~99.6% of announcements without a full derivation) and sweeps with the spending key.
- Later: gasless sweeps through a relay paid from the vault, viewing-key export for selective disclosure (auditors, tax), and a browser extension that auto-derives addresses on any dapp's "send" field.

### 1b. Private Pay (QR request, transfer, receipt, claim)

- Recipient: build a payment request (token, amount, memo optional) as a link and QR. Phone cameras open `/pay` directly.
- Payer: scan or paste, get a one-time address, send from an injected wallet on Robinhood Chain or any wallet, get a receipt QR.
- Recipient: scan the receipt, the viewing key verifies it, the spending key unlocks it, sweep to anywhere. Until the announcer contract ships, the receipt QR is the announcement.
- Keys: meta-address as QR, backup and restore, passphrase encryption at rest (WebCrypto).

### 2. Mask Swap (private routing)

- Two legs. **Cross-chain leg** uses an intent router: quotes from competing private fills, user deposits to a venue address, fill arrives at the receiving address. **Native leg** (in progress) routes stock-token swaps on-chain through a forwarder that batches and delays orders so no single swap is attributable in the mempool.
- Every quote prints venue name, output, ETA, and the flat fee before the user sends anything.
- Receiving address can be a stealth address. This is the combination nobody else offers: private route in, private landing at the end.
- Large-order split across venues is a later phase; it is not claimed until it works.

### 3. Blue Chip Vault (staking)

- Stake `$MASK`. The vault streams a basket of stock tokens to stakers pro-rata over time.
- Revenue sources: (a) routing fee on swaps, (b) creator share of trading fees on `$MASK` itself, paid in ETH by the launchpad, (c) relay fee on gasless sweeps, (d) later, API keys and desk mirroring.
- Revenue is converted to the basket on-chain by `RevenueRouter` and pushed to the vault. The vault does not hold `$MASK` rewards; it pays out stock tokens only.
- Tiers by staked amount unlock fee discounts, lower split thresholds, API rate limits, and relay priority. Tiers never change route quality.

### 4. Proof Ledger

- One public page: every payout with amount, token, source, and transaction hash.
- The dashboard reads counts from the ledger, never from an off-chain estimate.

## What we refuse to claim

- We do not hide on-chain settlement. The chain is public.
- We do not hide the deposit from the venue that fills it.
- We do not hide network metadata unless the user runs their own RPC or a relay.
- We do not promise execution, rates, or settlement time.

## Success metrics for the first 90 days

| Metric | Target |
|---|---|
| Meta-addresses generated | 5,000 |
| Stealth payments announced on-chain | 2,000 |
| Routed swap volume | $2M |
| First stock-token payout on the ledger | week 4 after token launch |
| Payouts on the ledger | weekly, without a miss |
