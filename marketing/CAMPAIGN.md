# Campaign: one story, told in order

Everything in `marketing/` is one narrative, not a pile of posts. This file is the running order and the
connective tissue between them. Assets: the trailer in [`video/`](video/), forty-one posters in
[`posters/`](posters/), with captions split across [`posters/CAPTIONS.md`](posters/CAPTIONS.md) for 01–20,
this file for 21–24, [`ARCHITECTURE-CONTENT.md`](ARCHITECTURE-CONTENT.md) for 25–36, and
[`MAINNET-PROOF.md`](MAINNET-PROOF.md) for 37–41.

The spine is simple and it never changes:

> **The ledger is public → that is a problem you can see → here is the layer that fixes it → here is the
> proof it works → here is the code → open it.**

Every post is a step on that line. Nothing is posted out of order, because the credibility comes from the
sequence, not from any single image.

---

## Act I · The problem (days 1–3)

| # | Asset | Role |
|:--|:--|:--|
| 1 | `video/rhmask-why-privacy-matters.mp4` | Opens everything. 32 seconds, the whole argument. |
| 2 | `p01` Manifesto | The line, standing alone. |
| 3 | `p04` The exposed wallet | Makes the problem concrete. |
| 4 | `p03` Two markets | Names the fix without explaining it yet. |

**Continuity:** post 2 quotes the video's closing line. Post 3 opens with "Yesterday we said the ledger is
public. Here is what that actually looks like." Post 4 answers post 3 directly.

## Act II · The product (days 4–9)

| # | Asset | Role |
|:--|:--|:--|
| 5 | `p05` Ghost Receive | The first surface. |
| 6 | `p06` Scan to pay | A real, scannable QR. Ask people to try it. |
| 7 | `p07` Three scans | The whole flow on one card. |
| 8 | `p13` Keys stay home | The first trust beat. |
| 9 | `p17` Just keys | No account, no KYC. |

**Continuity:** each caption ends with the question the next post answers. Post 6 is the only interactive
one: people scan it, so it earns replies that carry the thread.

## Act III · The proof (days 10–15)

| # | Asset | Role |
|:--|:--|:--|
| 10 | `p11` Run the checks | Hands over the command. |
| 11 | `p18` Verified on mainnet | Shows the output. |
| 12 | `p12` The math | For the people who asked how. |
| 13 | `p14` 310k rounds | One number, one claim. |
| 14 | `p15` Where privacy stops | The post that buys the rest of them credibility. |

**Continuity:** this act is deliberately the least promotional. It exists so that Act V is believed.

## Act III½ · The architecture (days 16–18)

Twelve diagram posters, `p25`–`p36`, posted as one long-form thread. Captions and running order live in
[`ARCHITECTURE-CONTENT.md`](ARCHITECTURE-CONTENT.md).

This act exists because the architecture is the argument. By now the audience has seen the problem and the
receipts; here they learn the shape of the thing and decide whether the team is serious. It is the least
promotional act, and it is what makes Act V believable.

**Continuity:** it opens on the trust boundary that Act III's proof posts implied but never drew, and it
closes on what we refused to build, which sets up the contracts landing in Act IV.

## Act IV · Live on mainnet (day 19, the headline moment)

Five proof posters, `p37`-`p41`, plus a seven-part thread. Captions and verified facts live in
[`MAINNET-PROOF.md`](MAINNET-PROOF.md).

This is the moment the whole campaign has been building towards: a claim with a block number attached. Post
`p37` and `p38` within an hour of each other. `p37` is the announcement, `p38` is the one that convinces
people, because the evidence in it is the chain explorer rather than anything we control.

Then the earlier contract set, `p21`-`p24`, over the following week as follow-ups.

## Act IV b · The contracts (follow-ups)

This is the moment the product stops depending on a QR handoff. Post the thread below, then space the four
posters over the following days.

| # | Asset | Role |
|:--|:--|:--|
| 15 | **Launch thread** (below) | The event. |
| 16 | `p21` The announcer is on chain | The addresses, pinned. |
| 17 | `p22` Scanning, not screenshots | What changed for the user. |
| 18 | `p23` No owner, no pause | Why it is safe to use. |
| 19 | `p24` Built on Robinhood Chain | Where it runs, and who we are not. |

## Act V · The rest (days 20+)

`p08` Mask Swap · `p16` The extension · `p09` Blue Chip Vault · `p10` Proof Ledger · `p19` Read the code ·
`p02` Terminal status · `p20` Open the app.

Keep `p09` and `p10` late and always labelled `planned`. Nothing about the token goes out before the proof
in Act III and the contracts in Act IV have landed.

---

## The launch thread

Post as a single thread. Every hash is real and links to the explorer.

**1/**

> The receipt QR was always a workaround.
>
> A stealth payment lands on an address only you can spend from. But something has to tell you it happened,
> and until today that something was a screenshot.
>
> Not any more. Two contracts are live on Robinhood Chain.

**2/**

> `StealthAnnouncer` · ERC-5564
> `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d`
>
> `StealthRegistry` · ERC-6538
> `0xa30e5702561bf230ad37ceecd1801c61067996a9`
>
> Canonical interfaces, so any ERC-5564 client can read this chain without a custom adapter.

**3/**

> We did not deploy and hope.
>
> The deploy script announces a real stealth payment, then scans the log with a viewing key and confirms two
> things: the recipient finds it, and a stranger does not.
>
> announce: `0x80861d97c427eac94d9243390d9cc0a97621d97698547f69a29cecbff0b6b785`

**4/**

> How the scan stays cheap: one byte.
>
> The first byte of `metadata` is the view tag. A wallet compares that byte against the whole log and only
> does elliptic-curve work on a match. Everything else is discarded for the cost of one comparison.

**5/**

> What we did not ship:
>
> no `owner()`, no `pause()`, no upgrade path, no funds held. 788 and 1,422 bytes of runtime, and neither
> contract can be changed by us or anyone else.
>
> They are not audited. The vault, which will hold value, is not deployed and will not be until it is.

**6/**

> Before this, on the same wallet, we made the first private payment on this chain end to end.
>
> pay: `0xb363b2e311af1f164a5a43ccc572aa2fa25f7c3b66a1a07795207a2f26d4f599`
> sweep: `0x6db1fde3ca024bfa61177f3315009298b99e5de3c4f0aac61eb85a0e81e7358d`
>
> Derived, sent, recognised by the viewing key, swept back. Real funds.

**7/**

> All of it is public: the contracts, the deploy script that verifies them, and the checks that back every
> claim in this thread.
>
> github.com/rh-mask/rhmask
> rhmask.org

---

## Captions for the new posters

### 21 · The announcer is on chain
`rhmask-p21.jpg`

> Two contracts, live on Robinhood Chain.
>
> `StealthAnnouncer` (ERC-5564) and `StealthRegistry` (ERC-6538). Canonical interfaces, no owner, no funds
> held. Until today a sender had to hand you the ephemeral key by QR. Now they can write it to the chain.
>
> Addresses and tx hashes: github.com/rh-mask/rhmask

### 22 · Scanning, not screenshots
`rhmask-p22.jpg`

> Before: lose the receipt QR and the funds are still yours, but you cannot find them.
>
> Now: your wallet scans the announcer log. One byte of view tag filters everything, and the maths only runs
> on a match.
>
> The QR stays as the offline path. It is no longer the only path.

### 23 · No owner, no pause
`rhmask-p23.jpg`

> What we deliberately did not ship: `owner()`, `pause()`, `upgradeTo()`.
>
> 788 and 1,422 bytes of runtime. No admin key, no proxy, no funds held, so there is nothing to rug and
> nothing for us to change later.
>
> Not audited. The vault, which will hold value, is not deployed and will not be until it is.

### 24 · Built on Robinhood Chain
`rhmask-p24.jpg`

> Tokenized equity deserves a privacy layer, so we wrote one on the chain those assets already live on.
>
> Chain 4663, an Arbitrum Orbit L2 settling to Ethereum. Ten stock tokens verified on chain. Two of our
> contracts live, zero owners between them.
>
> RhMask is an independent project, not affiliated with or endorsed by the chain's operator or the token
> issuer.

---

## Tagging the chain's operator

You asked to tag their account. Two things before you do.

**The handle is not confirmed.** Their chain documentation does not publish an X account, and I will not
guess one into published copy: tagging the wrong account is worse than tagging none. Confirm it from their
own site or a verified profile, then use it in `p24` and in the final post of the launch thread only.

**Tag the chain, never imply a relationship.** "Built on Robinhood Chain" is a fact anyone can verify from
chain id 4663. "Partnered with", "backed by", "in collaboration with" are not, and would be false. Poster
`p24` and its caption already carry the non-affiliation line, and it stays in every post that tags them.

Suggested form, once the handle is confirmed:

> Built on Robinhood Chain — chain 4663, settling to Ethereum. cc @<confirmed-handle>
>
> Independent project, not affiliated with or endorsed by them.

---

## Rules that apply to every post

Inherited from [`NARRATIVE.md`](NARRATIVE.md), repeated because they are easy to break under engagement
pressure:

- Never "anonymous", never "untraceable".
- Anything `planned` says so in the caption, not only in the image.
- One claim per post. If a post needs two, it is two posts.
- Every number is re-checked before reuse. Asset and chain counts drift.
- Never name a competitor. Name what we do.
