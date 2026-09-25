# The build log: how the fortnight actually ran

Nine posters, `rhmask-p42.jpg` … `rhmask-p50.jpg`. This is the run-up that makes the mainnet
announcement in [`MAINNET-PROOF.md`](MAINNET-PROOF.md) land as the end of a story rather than the start
of one.

**The through-line:** *the order of the work is a fact, and both the repository and the chain recorded it.*

---

## Read this before you post it

There was **no testnet stage**. The contracts went straight to Robinhood Chain mainnet on 25 September,
and the chain's timestamps are public. So this act does not say "first we tested, then we launched",
because that is not what happened and it would take one click to disprove.

What it says instead is the truth, which is stronger: **eleven days of reading the chain and proving the
crypto, then one day of writing to it.** Every claim below is anchored to either a commit hash or a block
number, and the two independently agree on the order.

| Do say | Do not say |
|:--|:--|
| "Simulated against mainnet for eleven days before anything was signed." | "Tested on testnet first." |
| "The first write to the chain was a real payment." | "We rehearsed, then went live." |
| "The chain's timestamps were never ours to set." | Anything that implies a date we cannot show. |

---

## The verified chronology

Read from Robinhood Chain on 2026-09-25 through a DNS-over-HTTPS pinned RPC. Commit times are UTC, the
same clock the chain uses.

| When (UTC) | What | Evidence |
|:--|:--|:--|
| 11 Sep 14:36:36 | First commit. Stealth derivation and its test. | `408ddc6` |
| 14 Sep 04:13:35 | Private Pay wire formats, with a round-trip check. | `6b7c47c` · `6742b73` |
| 14 Sep 04:13:36 | Read-only mainnet check, DoH pinning. Nothing signed. | `1a3ef6e` · `ab7998b` |
| 14 Sep 04:13:37 | Pre-push gate and CI. | `fdf44ed` |
| 14 Sep 04:33:29 | Browser extension MVP. | `807ad8f` |
| 14 Sep 11:45:52 | Key encryption extracted so app and extension share one blob. | `39a37b5` |
| **25 Sep 03:30:49** | **First private payment, on chain.** | block 71,907,730 |
| 25 Sep 03:30:54 | Swept back. | block 71,907,780 |
| **25 Sep 03:34:39** | **The gas bug that payment exposed, fixed and committed.** | `444e010` |
| 25 Sep 04:15:11 | `StealthAnnouncer` deployed. | block 71,934,007 |
| 25 Sep 04:15:18 | `StealthRegistry` deployed. | block 71,934,071 |
| 25 Sep 04:17:57 | Both recorded in the repository. | `f3fd6b6` |

Two gaps carry the whole act:

- **3 minutes 50 seconds** between the chain rejecting our gas limit and the fix being in the log.
- **44 minutes, 26,277 blocks** between the first private payment and the first contract deploy. The
  product worked before the infrastructure existed for it.

---

## Captions

### 42 · It started with the derivation
`rhmask-p42.jpg`

> Commit one, 11 September, 14:36 UTC. It contained the stealth derivation and the test that proves it.
> No landing page copy, no logo, no launch date.
>
> The test still runs on every push: the payer derives an address, the viewing key recognises it, the
> spending key recovers it, and a stranger recovers nothing.
>
> Fourteen days later two contracts went to mainnet. This is how that fortnight actually ran.
>
> github.com/rh-mask/rhmask

**Hashtags:** #buildinpublic #ERC5564

---

### 43 · A payment format, before a payment
`rhmask-p43.jpg`

> 14 September. The wire format was frozen before a single coin moved.
>
> A request is a URL you can put in a QR: `/pay?to=st:eth:0x…`. A receipt is another one, carrying the
> one-time address, the ephemeral key and one byte of view tag.
>
> Both round-trip through a test that runs on every push. And because the receipt maps one-to-one onto the
> ERC-5564 event, the contract we deployed eleven days later replaced the QR without changing the format.
>
> `npm run check:payment`

**Hashtags:** #buildinpublic #privatepayments

---

### 44 · Read the chain before writing to it
`rhmask-p44.jpg`

> 14 September, and for the eleven days after it: every assumption this app makes about Robinhood Chain
> was measured against the live chain, with nothing signed and nothing broadcast.
>
> Ten stock tokens verified. A fresh stealth address receiving NVDA, SPY, TSLA and AAPL in simulation.
> Every basket token transferring to a contract. Sweep errors checked so the interface can explain them.
>
> The command still ships, and it gives you the same answers it gave us: `npm run check:onchain`
>
> It carries the DNS-over-HTTPS bypass too, because the chain's own RPC domain is blocked on some
> networks. Ours was one of them.

**Hashtags:** #verifiable #opensource

---

### 45 · A gate before a push
`rhmask-p45.jpg`

> 14 September. Before the repository was public, the thing that decides what may enter it was written.
>
> No private files. No retired brand names, even in history. No generated-by attribution of any kind.
> Then typecheck, lint, three cryptographic round-trip checks, and a production build.
>
> It runs locally through a git hook and again in CI. Ninety-three commits have gone through it and it has
> never been skipped.
>
> docs/PUSH_RULES.md

**Hashtags:** #opensource #engineering

---

### 46 · Two surfaces, one sealed blob
`rhmask-p46.jpg`

> 14 September, the same day: the browser extension landed beside the web app.
>
> Then the passphrase encryption was pulled into a single module so both read the identical format.
> 310,000 PBKDF2-SHA256 rounds, then AES-256-GCM, entirely in WebCrypto on your device.
>
> Back up once, restore in either place. There is no sync service, because there is nothing to sync
> through.
>
> `npm run check:keycrypto` asserts all three: a correct passphrase opens it, a wrong one fails, a tampered
> blob fails.

**Hashtags:** #selfcustody #encryption

---

### 47 · The first one was real money
`rhmask-p47.jpg`

> 25 September, 03:30:49 UTC. Block 71,907,730.
>
> A one-time address derived in a browser, receiving a live payment on Robinhood Chain. Recognised by a
> viewing key. Swept back five seconds later, in block 71,907,780.
>
> There was no testnet rehearsal. The flow had been simulated against mainnet for eleven days, and this was
> the first time anything was signed.
>
> pay `0xb363b2e3…26d4f599`
> sweep `0x6db1fde3…81e7358d`
>
> robinscan.io · robinhoodchain.blockscout.com

**Hashtags:** #onchain #privatepayments

---

### 48 · It failed first
`rhmask-p48.jpg`

> That first payment did not go through cleanly, and that is the reason for doing it.
>
> 03:30 UTC, on chain: the sweep was rejected outright with `intrinsic gas too low`. Robinhood Chain prices
> L1 calldata into the gas limit, so a plain ETH transfer needs about 21,369 gas — not the 21,000 that
> every tutorial hard-codes. Our fallback was 21,000.
>
> 03:34:39 UTC, in the repository: fixed, tested, committed as `444e010`. The estimate is now required and
> never assumed.
>
> Three minutes and fifty seconds. A simulation would never have found this, because the simulation was not
> paying for calldata. Only spending real gas on the real chain did.
>
> src/lib/transfer.ts

**Hashtags:** #buildinpublic #ethereum #L2

---

### 49 · Then, and only then, the contracts
`rhmask-p49.jpg`

> Forty-four minutes and 26,277 blocks after the first private payment, the contracts went up.
>
> 03:30:49 first private payment · 71,907,730
> 04:15:11 `StealthAnnouncer` · 71,934,007
> 04:15:18 `StealthRegistry` · 71,934,071
> 04:17:57 both recorded in the repository · `f3fd6b6`
>
> The product worked end to end before any infrastructure was deployed for it. Payment first, then the
> announcer that makes a payment findable without a receipt QR. Not the other way round.
>
> We did not set those timestamps. The chain did.
>
> contracts/deployments.json

**Hashtags:** #ERC5564 #ERC6538 #onchain

---

### 50 · Ninety-three commits, fourteen days
`rhmask-p50.jpg`

> 11 to 25 September. Ninety-three commits, one author, every one of them public, dated, and small enough
> to read in a minute.
>
> The heavy days are visible in the shape: 14 September when the product surfaces landed, 22 September when
> the interface was rebuilt, 25 September when it reached mainnet.
>
> You do not have to take the order of any of this on faith. `git log` is public, the block timestamps are
> public, and the two agree.
>
> github.com/rh-mask/rhmask

**Hashtags:** #buildinpublic #opensource

---

## The thread

Post as one thread on the day before the mainnet announcement, so the two read as a single arc.

**1/**

> Tomorrow we will say RhMask is live on Robinhood Chain and post the block numbers.
>
> Today, the part that usually goes unpublished: the order the work actually happened in, with a commit
> hash or a block number against every line of it.

**2/**

> 11 Sep, 14:36 UTC. Commit one.
>
> `src/lib/stealth.ts` and `scripts/stealth-check.ts`. The derivation and the test that proves it, before
> there was an interface to look at.
>
> `408ddc6`

**3/**

> 14 Sep. The payment format, frozen before a coin moved.
>
> A request is a URL. A receipt is a URL carrying the one-time address, the ephemeral key and a one-byte
> view tag — and it maps one-to-one onto the ERC-5564 event, which is why the contract could replace it
> later without a format change.

**4/**

> 14 Sep, and the eleven days after it: read the chain, do not write to it.
>
> Ten tokens verified, stealth receive simulated, vault transfers simulated, sweep errors checked. Nothing
> signed, nothing broadcast.
>
> `npm run check:onchain` still gives you the same answers.

**5/**

> 25 Sep, 03:30:49 UTC. The first thing we ever signed on this chain was a real private payment.
>
> Block 71,907,730. Swept back at 71,907,780.
>
> No testnet rehearsal. Eleven days of simulation, then live.

**6/**

> And it failed first.
>
> `intrinsic gas too low`. This chain prices L1 calldata into the gas limit, so a transfer needs about
> 21,369 — not the 21,000 in our fallback.
>
> Fixed and committed at 03:34:39 UTC, `444e010`. Three minutes fifty. Only a real chain finds that.

**7/**

> 04:15:11 UTC, forty-four minutes and 26,277 blocks later, the contracts went up.
>
> The product worked before the infrastructure existed for it. Payment first, then the announcer that makes
> a payment findable.
>
> We did not set those timestamps.

**8/**

> Ninety-three commits, fourteen days, one author, all public.
>
> Tomorrow: the addresses, the explorer links, and the full list of what is live and what is not.
>
> github.com/rh-mask/rhmask

---

## Where this fits

This is **Act III¾** in [`CAMPAIGN.md`](CAMPAIGN.md), the run-up to the headline moment. Order:

`p42` → `p43` → `p44` → `p45` → `p46` → `p47` → `p48` → `p49` → `p50`, then straight into Act IV.

Post `p47`, `p48` and `p49` on consecutive days, or as one thread. They are the sequence that makes the
mainnet announcement read as an arrival rather than a launch.

## Rules

- **Never imply a testnet stage.** There was none. `p47`'s caption says so outright, and that line stays.
- **Every date is copied from `git log` or from a block, never typed from memory.** Commit times in this
  file are UTC so they can be compared against chain timestamps directly.
- **Author dates in git can be set by hand; block timestamps cannot.** When the ordering matters, lead with
  the block number. That is why `p47`, `p48` and `p49` are the anchors of this act.
- Contracts are **not audited**, and the vault that will hold value is not deployed. Say so whenever the
  conversation moves from these two contracts to the token.
- One claim per post. If a post needs two, it is two posts.
