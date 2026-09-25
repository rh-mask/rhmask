# Architecture content

Twelve posters, `rhmask-p25.jpg` … `rhmask-p36.jpg`, each one a diagram rather than a slogan.

Ground truth for all of it is [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md). If that file and a
caption ever disagree, the file wins and the caption gets fixed.

**The through-line:** *discretion is the normal condition of a serious market, and this is simply what it
looks like to build for it properly.*

Not "do not trust us". Not "everyone is out to get you". A trader who does not broadcast their book is not
hiding, they are being professional, and that has been true for a century. Public ledgers took that away by
accident. These twelve posters show the shape of giving it back, the way an architect shows drawings:
because the work is good and worth showing.

---

## The thread

Post these twelve as one long-form thread, then reuse individual posters later as standalone posts.

**1/ The layers**
`rhmask-p25.jpg`

> Three layers. Your keys live in the one you control.
>
> The middle layer is the only part we operate, and it never needs a secret to do its job, so it never holds
> one. That is not a precaution. It is just the right place to draw the line.

**2/ The boundary**
`rhmask-p26.jpg`

> Here is the exact line, drawn plainly.
>
> Stays with you: spending key, viewing key, stealth private key, passphrase, derived AES key.
> Free to travel: meta-address, one-time address, ephemeral pubkey, view tag, signed transaction.
>
> Everything in the second list is public by construction. Publishing it reveals nothing, and that is what
> makes the whole scheme work.

**3/ The flow**
`rhmask-p27.jpg`

> A private payment, start to finish.
>
> You share a meta-address once. The payer derives a one-time address on their own machine, sends, and
> announces. You scan, recognise it with your viewing key, unlock it with your spending key, sweep.
>
> No server appears anywhere in that diagram. That is not an omission.

**4/ Why scanning stays cheap**
`rhmask-p28.jpg`

> A scan could be brutal: one elliptic-curve operation per announcement, forever.
>
> ERC-5564 solves it with a single byte. The view tag in `metadata[0]` clears roughly 255 of every 256
> announcements for the cost of one comparison, and the real maths runs only on what is left.
>
> That one byte is the difference between a scan a phone can do and one it cannot.

**5/ One format, two transports**
`rhmask-p29.jpg`

> The receipt QR and the on-chain event carry the same three fields.
>
> `stealthAddress`, `ephemeralPubKey`, and the view tag. One scanner, one code path, two ways in.
>
> The QR was never a placeholder for the contract. It is the offline transport, and it still works on a
> plane.

**6/ Reachable anywhere**
`rhmask-p30.jpg`

> Some networks hijack the chain's RPC domain at the DNS level, and from those networks a healthy endpoint
> simply hangs. Asking people to install a VPN is not a fix.
>
> So the browser talks to `/api/rpc` on our own origin and the server forwards. Allow-listed reads, capped
> batches, bounded log ranges. It signs nothing: a raw transaction arrives already signed by a key that
> never left the browser.
>
> The app should work from wherever you happen to be.

**7/ Two surfaces, one keystore**
`rhmask-p31.jpg`

> The app and the extension share one sealed blob, byte for byte.
>
> One format, one module that owns it. So there is one backup to keep, one passphrase to remember, and one
> thing to get right.

**8/ Say what is missing**
`rhmask-p32.jpg`

> Missing router key? `503`, naming the exact variable.
> Bad input? `400`, with the validation issues.
>
> When a piece is missing, the app says so plainly and names it. Being told what is wrong is a courtesy. A
> convincing blank screen is not.

**9/ The checks**
`rhmask-p33.jpg`

> Four checks stand behind every release: stealth, payment, keycrypto, onchain. Plus history, tracked files,
> forbidden terms, typecheck, lint and build.
>
> The same script runs in the pre-push hook and again in CI.
>
> Every claim we publish has a command behind it. Run any of them and you will get the same answer we did.

**10/ The contracts**
`rhmask-p34.jpg`

> 788 and 1,422 bytes of runtime.
>
> No `owner()`. No `pause()`. No `upgradeTo()`. No proxy. No funds held. Nothing to administer, so they
> behave the same way for everyone, permanently.
>
> Not audited. The vault, which will hold value, is not deployed and will not be until it is.

**11/ From passphrase to sealed key**
`rhmask-p35.jpg`

> PBKDF2-SHA256, 310,000 rounds, random salt. Then AES-256-GCM with a random IV, authenticated so tampering
> fails cleanly rather than corrupting quietly.
>
> All of it WebCrypto, in your browser. The decrypted copy lives in memory and is gone on lock or reload.
>
> Keep the backup somewhere you would keep anything else that matters.

**12/ What is not in it**
`rhmask-p36.jpg`

> No pool. No user database. No server-side key. No admin switch. No analytics in the key path.
>
> Every one of those would have been easier to build than to leave out.
>
> Leaving them out is the craft.
>
> github.com/rh-mask/rhmask

---

## Where these fit in the campaign

Slot the thread into [`CAMPAIGN.md`](CAMPAIGN.md) as **Act III½**, between the proof act and the contract
launch. By then the audience has seen the problem and the receipts; this is where they see how the thing is
made.

For a slower cadence, one poster every two or three days:

`p25` → `p26` → `p36` → `p27` → `p28` → `p29` → `p34` → `p35` → `p32` → `p31` → `p30` → `p33`

That leads with the shape and the restraint, which is what a thoughtful reader wants first, and keeps the
operational detail for the people who stayed.

## Reusing them

- **Docs:** `p25`, `p27` and `p29` are accurate enough to drop straight into `/docs`.
- **Replies:** when someone asks "where is the server in this?", `p27` answers it with no typing.
- **First questions:** `p26`, `p34` and `p36` together cover most of what a careful reader asks.

## Rules

Same as everywhere else, and they bite hardest here because architecture posts sound authoritative:

- Never "anonymous", never "untraceable".
- `planned` is stated in the caption, not only in the image. `p34` carries the unaudited note; keep it.
- Byte counts, round counts and addresses are read from the repo and the chain. Re-check before reuse.
- If a diagram stops matching `docs/ARCHITECTURE.md`, re-render the poster. Do not edit the JPEG.
- **Lead with what the design gives, not with what it protects against.** See the tone rules in
  [`NARRATIVE.md`](NARRATIVE.md).
