# Poster captions

Twenty posters, twenty layouts. Each caption is written for X at `@RHmask_` and works unchanged on
Telegram or Discord. Keep the rules from [`../NARRATIVE.md`](../NARRATIVE.md): never write "anonymous" or
"untraceable", always say `planned` when something is not live, and never invent a claim the status page
cannot back.

Files are `rhmask-p01.jpg` … `rhmask-p36.jpg`, all 1080×1350. Captions for `p21`–`p24`, the contract
launch set, live in [`../CAMPAIGN.md`](../CAMPAIGN.md) together with the running order for the whole campaign.

---

### 01 · Manifesto
`rhmask-p01.jpg`

> Wall Street sees everything. RhMask sees nothing.
>
> Tokenized stocks moved the order book onto a public ledger and kept none of the discretion the old one had.
> We are building the layer that gives it back.
>
> rhmask.org

**Hashtags:** #privacy #RWA #tokenizedstocks

---

### 02 · Terminal status
`rhmask-p02.jpg`

> `$ rhmask status`
>
> chain: robinhood · 4663
> keys: local only
> server: none sees a key
> account: not required
>
> Nothing to sign up for means nothing to breach.
>
> rhmask.org

**Hashtags:** #selfcustody #web3privacy

---

### 03 · Two markets
`rhmask-p03.jpg`

> The market you know: every entry, every exit, every balance, readable by anyone with a block explorer.
>
> The market we build: one address you share once, then a fresh one for every payment after it.
>
> rhmask.org

**Hashtags:** #privacy #stealthaddresses

---

### 04 · The exposed wallet
`rhmask-p04.jpg`

> Give someone your address once and you hand them your whole history. Cost basis. Size. Timing.
> Counterparties. Forever, and with no way to take it back.
>
> Your portfolio should not be a public document.
>
> rhmask.org

**Hashtags:** #onchainprivacy #RWA

---

### 05 · Ghost Receive
`rhmask-p05.jpg`

> Ghost Receive, in beta today.
>
> Publish one meta-address. Every payer derives a fresh, unlinkable address from it in their own browser.
> Your balance never piles up on one wallet.
>
> ERC-5564, running now at rhmask.org

**Hashtags:** #ERC5564 #stealthaddresses

---

### 06 · Scan to pay
`rhmask-p06.jpg`

> This is a real payment request.
>
> Scan it and your wallet pays a one-time address that was derived on your device. No server sits in
> the middle, and nothing links the payment back to the person who asked for it.
>
> rhmask.org/pay

**Hashtags:** #privatepayments #QR

---

### 07 · Three scans
`rhmask-p07.jpg`

> A private payment is three scans.
>
> 1. Request. You show a QR.
> 2. Pay. They scan, derive a one-time address, send from any wallet.
> 3. Claim. Their receipt QR proves it is yours, then you sweep it anywhere.
>
> rhmask.org

**Hashtags:** #privatepayments #selfcustody

---

### 08 · Mask Swap
`rhmask-p08.jpg`

> 197 assets across 36 chains, filled privately instead of through a public order book.
>
> The venue name and the flat fee are printed before you send anything, and the deposit goes straight
> to the venue. We never hold it.
>
> Beta, live now at rhmask.org

**Hashtags:** #intents #crosschain #privacy

---

### 09 · Blue Chip Vault
`rhmask-p09.jpg`

> A token that pays you in someone else's stock.
>
> Stake $MASK and the vault streams you a basket of NVDA, SPY, TSLA, AAPL and MSFT. Not more $MASK.
> Stakers vote what enters the basket next.
>
> Planned. No contract is deployed and no payout has been made yet.

**Hashtags:** #tokenomics #RWA

---

### 10 · Proof Ledger
`rhmask-p10.jpg`

> If it is not on the ledger, it did not happen.
>
> Every payout will carry a transaction hash on a public page. Nothing estimated, nothing back-filled,
> nothing you have to take our word for.
>
> Planned, and it stays empty until the first real payout.

**Hashtags:** #proofofreserves #transparency

---

### 11 · Run the checks
`rhmask-p11.jpg`

> Do not trust us. Run it.
>
> `npm run check:onchain` reads Robinhood Chain and simulates real transfers from real holders. It signs
> nothing and broadcasts nothing. Three more commands check the crypto itself.
>
> github.com/rh-mask/rhmask

**Hashtags:** #opensource #verifiable

---

### 12 · The math
`rhmask-p12.jpg`

> Privacy you can check line by line.
>
> The payer derives the address from your meta-address. Only your spending key can compute the matching
> private key, so only you can move what lands there.
>
> ERC-5564, explained at rhmask.org/docs

**Hashtags:** #cryptography #ERC5564

---

### 13 · Keys stay home
`rhmask-p13.jpg`

> Your keys never leave this device.
>
> Generated in your browser, sealed at rest with your passphrase. There is no account to recover, because
> there is no account. That is the whole point.
>
> rhmask.org

**Hashtags:** #selfcustody #privacy

---

### 14 · 310k rounds
`rhmask-p14.jpg`

> 310,000 PBKDF2-SHA256 rounds, then AES-256-GCM, entirely in WebCrypto, entirely on your device.
>
> A wrong passphrase fails. A tampered blob fails. Both are asserted by a check that runs on every push.
>
> rhmask.org/docs

**Hashtags:** #encryption #websecurity

---

### 15 · Where privacy stops
`rhmask-p15.jpg`

> Most privacy products tell you what they hide. Here is what we do not.
>
> Settlement stays public. The venue filling your order sees the deposit. Your IP reaches the RPC unless
> you run your own node.
>
> A privacy claim without its limits is marketing, not privacy.

**Hashtags:** #honestsoftware #privacy

---

### 16 · The extension
`rhmask-p16.jpg`

> A stealth address only helps if you use it at the moment someone asks for an address.
>
> The extension puts a chip beside any address field on any site. One click pastes a fresh one-time
> address. No host permissions, no backend, same keys as the app.
>
> github.com/rh-mask/rhmask

**Hashtags:** #browserextension #privacy

---

### 17 · Just keys
`rhmask-p17.jpg`

> No email. No password. No KYC. No cookie banner.
>
> Just keys, made on your device in about ten seconds.
>
> Nothing to sign up for means nothing to breach, nothing to subpoena, and nothing to sell.
>
> rhmask.org

**Hashtags:** #nokyc #selfcustody

---

### 18 · Verified on mainnet
`rhmask-p18.jpg`

> Proof, not promises.
>
> A fresh stealth address receives NVDA, SPY, TSLA and AAPL in simulation from real holders. A contract
> can hold every basket token, so the vault design stands.
>
> Re-run it yourself: `npm run check:onchain`

**Hashtags:** #verifiable #RWA #opensource

---

### 19 · Read the code
`rhmask-p19.jpg`

> A privacy tool you cannot read is a promise, not a guarantee.
>
> Every line that touches your keys is public, and so is every check that backs a claim we make. MIT
> licensed, and every push passes the same gate.
>
> github.com/rh-mask/rhmask

**Hashtags:** #opensource #MIT

---

### 20 · Open the app
`rhmask-p20.jpg`

> Own the market. Stay unseen.
>
> Generate your keys in about ten seconds. You do not even need to connect a wallet to start.
>
> rhmask.org

**Hashtags:** #privacy #RWA #tokenizedstocks

---

## Posting notes

- **Running order lives in [`../CAMPAIGN.md`](../CAMPAIGN.md)**, which sequences the trailer, all twenty-four
  posters and the contract launch thread into one story. Do not post these out of order: the credibility
  comes from the sequence, not from any single image.
- **One claim per post.** Do not stack two features into one caption.
- **Anything `planned` says so in the caption**, not only in the image.
- **Numbers drift.** 197 assets and 36 chains were read from the live API on 2026-09-25. Re-check before
  reusing poster 08 later.
