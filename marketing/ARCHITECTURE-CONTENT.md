# Architecture content

Twelve posters, `rhmask-p25.jpg` … `rhmask-p36.jpg`, each one a diagram rather than a slogan. They exist
because the architecture *is* the argument: anyone can claim privacy, and almost nobody will show you the
boundary where theirs stops.

Ground truth for all of it is [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md). If that file and a
caption ever disagree, the file wins and the caption gets fixed.

**The through-line:** *we are not asking you to trust us, because we built a system where you do not have to.*
Every poster below is one piece of evidence for that single sentence.

---

## The thread

Post these twelve as one long-form thread, then reuse individual posters later as standalone posts. The
thread is where the narrative lands; the singles are reminders.

**1/ The layers**
`rhmask-p25.jpg`

> Three layers. Only one of them ever sees a key, and it is the one on your device.
>
> The middle layer is the only part we operate. It holds router credentials and nothing else: no spending
> key, no viewing key, no passphrase. It could be fully compromised and your funds would not move.

**2/ The boundary**
`rhmask-p26.jpg`

> Here is the exact line.
>
> Never leaves: spending key, viewing key, stealth private key, passphrase, derived AES key.
> May travel: meta-address, one-time address, ephemeral pubkey, view tag, signed transaction.
>
> Everything on the right is public by construction. Publishing it reveals nothing.

**3/ The flow**
`rhmask-p27.jpg`

> A private payment, start to finish.
>
> You share a meta-address once. The payer derives a one-time address on their own machine, sends, and
> announces. You scan, recognise it with your viewing key, unlock it with your spending key, sweep.
>
> No server appears anywhere in that diagram. That is not an omission.

**4/ Why scanning is cheap**
`rhmask-p28.jpg`

> A scan could be brutal: one elliptic-curve operation per announcement, forever.
>
> ERC-5564 solves it with one byte. The view tag in `metadata[0]` discards roughly 255 of every 256
> announcements for the cost of a single comparison. The maths only runs on what survives.
>
> That is the difference between a scan a phone can do and one it cannot.

**5/ One format, two transports**
`rhmask-p29.jpg`

> The receipt QR and the on-chain event carry the same three fields.
>
> `stealthAddress`, `ephemeralPubKey`, and the view tag. One scanner, one code path, two ways in.
>
> The QR was never a placeholder for the contract. It is the offline transport, and it still works on a
> plane.

**6/ When the network is the adversary**
`rhmask-p30.jpg`

> Some ISPs DNS-hijack the chain's RPC domain. From those networks a healthy endpoint simply hangs.
>
> Telling users to install a VPN is not a fix. So the browser talks to `/api/rpc` on our own origin and the
> server forwards. Allow-listed reads, capped batches, bounded log ranges.
>
> It signs nothing. A raw transaction arrives already signed by a key that never left the browser.

**7/ Two surfaces, one keystore**
`rhmask-p31.jpg`

> The app and the extension share one sealed blob, byte for byte.
>
> One backup file restores in either. One passphrase unlocks both. Two key formats is how people lose
> funds, so there is one format and one module that owns it.

**8/ Fail closed, and say why**
`rhmask-p32.jpg`

> Missing router key? `503`, naming the exact variable.
> Bad input? `400`, with the validation issues.
>
> There is no silent fallback anywhere in the codebase. A privacy tool that quietly degrades is worse than
> one that stops.

**9/ The gate**
`rhmask-p33.jpg`

> Four checks stand between a claim and a release: stealth, payment, keycrypto, onchain. Plus history,
> tracked files, forbidden terms, typecheck, lint and build.
>
> The same script runs in the pre-push hook and again in CI.
>
> If a claim in our marketing has no command in our repo, it does not go out.

**10/ The contracts**
`rhmask-p34.jpg`

> 788 and 1,422 bytes of runtime.
>
> No `owner()`. No `pause()`. No `upgradeTo()`. No proxy. No funds held. Nothing for us to change and
> nothing for anyone to take.
>
> Not audited. The vault, which will hold value, is not deployed and will not be until it is.

**11/ From passphrase to sealed key**
`rhmask-p35.jpg`

> PBKDF2-SHA256, 310,000 rounds, random salt. Then AES-256-GCM with a random IV, authenticated so tampering
> fails rather than silently corrupts.
>
> All of it WebCrypto, in your browser. The decrypted copy lives in memory and dies on lock or reload.
>
> There is no account to recover, and no server that could help if there were.

**12/ What we refused to build**
`rhmask-p36.jpg`

> No pool. No user database. No server-side key. No admin switch. No analytics in the key path.
>
> Every one of those would have been easier to build than to leave out.
>
> Leaving them out is the product.
>
> github.com/rh-mask/rhmask

---

## Where these fit in the campaign

Slot the thread into [`CAMPAIGN.md`](CAMPAIGN.md) as **Act III½**, between the proof act and the contract
launch. By then the audience has seen the problem and the receipts; this is where they learn the shape of
the thing and decide whether the team is serious.

For a slower cadence, one poster every two or three days works, in this order:

`p25` → `p26` → `p36` → `p27` → `p28` → `p29` → `p34` → `p35` → `p32` → `p31` → `p30` → `p33`

That front-loads the boundary and the refusals, which are the parts a sceptical reader cares about, and
leaves the operational detail for people who stayed.

## Reusing them

- **Docs:** `p25`, `p27` and `p29` are accurate enough to drop straight into `/docs`.
- **Replies:** when someone asks "where is the server in this?", `p27` is the answer with no typing.
- **Due diligence:** `p26`, `p34` and `p36` together answer most of what a careful reader asks first.

## Rules

Same as everywhere else, and they bite hardest here because architecture posts sound authoritative:

- Never "anonymous", never "untraceable".
- `planned` is stated in the caption, not only in the image. `p34` carries the unaudited note; keep it.
- Byte counts, round counts and addresses are read from the repo and the chain. Re-check before reuse.
- If a diagram stops matching `docs/ARCHITECTURE.md`, re-render the poster. Do not edit the JPEG.
