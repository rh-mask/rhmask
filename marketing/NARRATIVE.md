# Narrative

This is the selling story. Every poster, caption, and thread pulls from here. Do not invent new claims in a caption; if it is not in this file or in the status table, it is not said.

Home: **rhmask.org**, live.

## What got lost

Tokenized stocks are the biggest thing to happen to markets in a decade, and something ordinary went missing on the way: **discretion**.

Your position, your entry, your exit, your average price, your whole history. All of it readable by anyone with a block explorer, permanently.

On Wall Street only the venue sees the tape, and nobody calls that secretive. It is simply how a serious market works. Public ledgers removed it by accident, not by design, and there is no reason it has to stay removed.

That is the gap we build in. Not a fight, a fix.

## The promise

**RhMask is the privacy layer for tokenized stocks.**

Three things, no more:

1. **Receive unseen.** One meta-address, a fresh address for every payment. Your balance never piles up on one wallet. Show a QR, get paid, claim with a scan.
2. **Trade unseen.** Private fills instead of public order books. The venue name and the fee are printed before you send.
3. **Get paid in stocks.** Stake `$MASK`, get streamed NVDA, SPY, TSLA. Every trade of `$MASK` buys stock tokens for stakers, from day one, with a hash.

Two surfaces carry the same three things: the web app, and a browser extension that puts a fresh stealth address into any address field on any site.

## Boilerplate

**The description.** Paste it wherever a bio or a listing wants a paragraph: the Telegram channel, a
pinned post, a directory entry, a press note.

> **RhMask is** the privacy layer for tokenized stocks. Your portfolio sits on a public ledger for anyone
> to read. Publish one address instead, and every payment lands somewhere new that only you can spend
> from. Keys never leave your device.

*40 words, 235 characters. Fits a Telegram description. Own the market. Stay unseen.*

**Shorter still, where the character limit bites.**

> **RhMask is** the privacy layer for tokenized stocks. Publish one address; every payment lands somewhere
> new only you can spend from. Keys never leave your device.

*26 words, 159 characters. An X bio cuts at 160, so this one has a single character to spare: check the
count before changing a word of it.*

The short one is the long one with the problem sentence dropped and two words trimmed to clear the limit.
**No claim differs between them, and none should.** The two get seen together, and a reader who spots a
claim that changed between versions is right to wonder which one is the real one.

**Both open with "RhMask is."** Keep it that way. A description gets quoted, indexed and pasted into
places that strip the surrounding context, so the first two words have to say what the thing is rather
than set a scene.

**Keeping it honest.** The short forms work by leaving things out, which is fair, and stop working the
moment they leave out something that changes the decision.

- Never add "anonymous", "untraceable" or "fully private" to make a line land harder. Settlement is public
  and that is not a detail a shorter paragraph gets to drop.
- Never imply the vault, the swap fills or the ledger exist. They are not mentioned above, and that is the
  point: a feature you do not name needs no disclaimer, a feature you name does.
- The detailed version, with the standards, the deployment status and what is not live, lives in
  [`../README.md`](../README.md) and on `/docs`. Link there rather than growing this.

One line already exists in `src/lib/site.ts`, in the GitHub repo description and in the npm package
description. Keep all three saying the same thing as the paragraph above.

## Master tagline

> **Wall Street sees everything. RhMask sees nothing.**

Alternates for rotation:

- Own the market. Stay unseen.
- Discretion, restored.
- Your position is your business.
- Scan. Pay. Move on.
- The first token that pays you in someone else's stock.

## Proof points (only these, only when true)

| Claim | Proof |
|---|---|
| Keys never leave your device | Open-source derivation, no network call in the key path. Keys are generated in the browser and can be encrypted at rest with a passphrase (WebCrypto). |
| Stealth addresses work on Robinhood Chain today | Verified on mainnet: a fresh one-time address receives NVDA, SPY, TSLA, AAPL and MSFT in simulation from real holders. Script: `npm run check:onchain`. |
| Private payment in three scans | Request QR, pay from any wallet, receipt QR, claim and sweep. Everything client-side; the receipt QR is the announcement until the announcer contract ships. |
| Works even where the chain's RPC is blocked | Balance reads and sweeps go through the app's own RPC route, so an ISP that filters the chain's domain cannot break the app. |
| No account, no KYC | There is no sign-up. Nothing to give. |
| Non-custodial | Deposits go wallet to venue or contract. No server key controls funds. The server never sees a private key. |
| A vault can hold stock tokens | Verified on mainnet: transfer of every basket token to a contract address simulates fine, so the vault design can stream tokens directly. |
| Paid in stock tokens | Proof Ledger: every payout with a transaction hash |
| Fair launch | No presale, no team allocation, launch hash posted |
| No admin keys | Contracts have no owner, no pause, no upgrade |

Caveat we always carry: the stock tokens themselves are upgradeable beacon proxies controlled by the issuer. What is true today can change under the same address. We re-verify before every release and say so.

## Tone

- Short sentences. Declarative. No exclamation marks.
- Never overclaim privacy. Say what is hidden and what is not, every time it matters.
- "Planned" is a word we use in public. It builds more trust than a fake number.
- We do not name other projects. We name what we do.

### Do not build the story on distrust

This is the one that is easiest to get wrong, because fear writes fast copy.

The frame is **discretion as a normal condition**, not defence against enemies. A trader who does not
broadcast their book is not hiding, they are being professional, and that has been ordinary for a century.
Public ledgers removed it by accident. We are restoring something normal, not arming anyone.

So: lead with what the design gives, not with what it protects against. Both sentences can be true and only
one of them is ours.

| Do not write | Write instead |
|---|---|
| "Do not trust us, verify" | "Every claim has a command behind it" |
| "Nothing to rug, nothing to seize" | "Nothing to administer, so it works the same for everyone" |
| "No table to breach or subpoena" | "No account, so there is nothing about you to store" |
| "It could be compromised and you would be fine" | "It never needs a secret, so it never holds one" |
| "What we refused to build" | "What is not in it" |

The reader should finish a post feeling composed, not hunted. If a line only works by implying someone is
coming for them, it is the wrong line, however true it is.

## FOMO mechanics (honest ones)

- **Day-one yield**: the creator fee on `$MASK` trading means the vault has revenue the minute the token exists. Post the first payout hash within days of launch.
- **Weekly ledger drops**: same day, same time, every week. A payout post is a countdown.
- **Basket votes**: stakers choose the next stock in the basket. Every vote is a campaign.
- **Stealth firsts**: first stealth payment on the chain, first stealth NVDA transfer, first QR-to-QR private payment, first gasless sweep. Each is a screenshot with a hash.
- **Tier ladders**: public tier counts. "Blackout" is a status symbol.
- **Scan challenges**: post a payment-request QR, ask the timeline to pay 0.001 ETH to it privately, sweep it live, show the ledger. Nobody can tell who paid.

## Launch thread skeleton

1. The flaw: on-chain stocks are public. Screenshot of a whale wallet anyone can read.
2. The fix: RhMask, three surfaces, one line each.
3. Demo: request QR on one phone, scan and pay from another, receipt QR back, claim and sweep. 30-second clip, no cuts.
4. The proof: the mainnet check output. Five stock tokens received on a fresh stealth address. Hash.
5. The token: `$MASK` pays in stocks, not in `$MASK`. Allocation table.
6. The ledger: empty today, first hash on [date].
7. The launch: date, launchpad, no presale, team wallet disclosed.
8. CTA: rhmask.org, generate keys, show your QR, follow for the ledger.

## Words we use / words we avoid

| Use | Avoid |
|---|---|
| unseen, private, stealth, one-time address | anonymous, untraceable, mixer |
| request, receipt, claim, sweep | deposit (for the pay flow), withdrawal |
| stock tokens, blue chips, basket | securities, dividends (unless legally accurate) |
| paid, streamed, on the ledger | APY, guaranteed, risk-free |
| planned, in progress, live, verified on mainnet | soon, coming, imminent, audited (until it is) |
