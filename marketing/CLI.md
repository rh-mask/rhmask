# The terminal surface

Two posters, `rhmask-p51.jpg` and `rhmask-p52.jpg`. Both are screenshots of the CLI's real output, captured
with colour on and converted to HTML rather than redrawn.

**The through-line:** *the same privacy layer, with no browser in front of it.*

---

## Do not post these yet

**The package is not published.** `npx rhmask` does not work at the time of writing, and both posters show
that command. Publishing needs an npm account and token, which is a decision for the project owner, not
something a build step should do on its own.

Publish first:

```bash
cd cli && npm publish     # name "rhmask" was free as of 2026-09-25
npx rhmask                # confirm it actually resolves before anything goes out
```

Then post. A poster that tells people to run a command that does not exist is the one mistake this whole
campaign is built to avoid.

---

## What is true about it today

| | |
|:--|:--|
| Built | Yes. `npm run build:cli` produces one 165KB file with no runtime dependencies. |
| Tested | Yes. `npm run check:cli` runs 22 assertions on every push. |
| Published | **No.** Nothing is on npm under `rhmask` or any near name. |
| Signs transactions | **No, and it never will.** There is no signing code path in the package. |

The QR check is the interesting one: the rendered half-block art is parsed back into a module matrix,
upscaled to a bitmap and decoded with `jsqr`, the same scanner the web app uses. If the terminal output
ever stops being scannable, the push fails.

---

## Captions

### 51 · It also runs in your terminal
`rhmask-p51.jpg`

> RhMask now has a third surface: the command line.
>
> `npx rhmask`
>
> Nine commands. The five marked **·offline** never open a socket at all — key generation, address
> derivation, payment requests, claiming a receipt, and the round-trip proof. Pull the network cable and
> they still work.
>
> The four that read the chain only read it. There is no signing code in the package, which is what makes
> it safe to run somewhere you do not fully trust.
>
> Same ERC-5564 derivation as the web app and the extension, from the same source files.
>
> github.com/rh-mask/rhmask

**Hashtags:** #cli #opensource #ERC5564

---

### 52 · A payment request, drawn in text
`rhmask-p52.jpg`

> `rhmask request --to st:eth:0x… --token NVDA --amount 1.5`
>
> That prints a working QR into your terminal. Someone scans it off your screen, their own device derives a
> fresh one-time address from your meta-address, and they pay it from any wallet.
>
> No image file. No upload. No website in the middle.
>
> It is drawn with half-block characters, two QR rows per line of text. Every build parses that output back
> into a matrix and decodes it with the same scanner the web app uses, so what prints is what scans.

**Hashtags:** #cli #privatepayments #QR

---

## The thread

**1/**

> RhMask has a third surface, and it needs no browser.
>
> `npx rhmask`
>
> Nine commands. Five of them never open a socket.

**2/**

> The five offline ones are the ones that matter for privacy:
>
> `keys` make a key set
> `address` derive a one-time address as the payer
> `request` print a payment request as a QR
> `claim` recover the key from a receipt
> `verify` prove the round-trip on your own machine
>
> Pull the cable. They still work.

**3/**

> `rhmask request` prints a scannable QR into the terminal itself, with half-block characters.
>
> No image file, no upload, no site in between. Someone scans it off your screen and pays a one-time address
> their own device derived.

**4/**

> That QR is checked, not assumed.
>
> Every build parses the printed characters back into a module matrix, upscales it and decodes it with the
> same scanner the web app uses. If the output stops scanning, the push is refused.

**5/**

> What it deliberately cannot do: sign or broadcast a transaction. There is no code path for it.
>
> That is why you can run it on a machine you only half trust. It derives, it recognises, it reads.

**6/**

> It also reads the sandbox: `rhmask chain --network testnet`.
>
> And when a network hijacks the chain's RPC domain — ours does — it re-resolves over DNS-over-HTTPS, pins
> the right address, and tells you it had to.

**7/**

> One file, no runtime dependencies, MIT.
>
> `npx rhmask`
> github.com/rh-mask/rhmask

---

## Where this fits

**Act V** in [`CAMPAIGN.md`](CAMPAIGN.md), with the other surfaces, and only after the package is live on
npm. `p51` first, `p52` a day later: the first explains what it is, the second is the one people try.

## Rules

- **Never post before the package resolves.** Run `npx rhmask` from a clean machine first.
- **Do not call it a wallet.** It cannot sign. Say "derives, recognises, reads".
- The version number on the poster is `v0.1.0`. Re-render the poster when that changes, rather than editing
  the number, because the poster is a capture of real output and should stay one.
- Contracts are **not audited**, and the vault that will hold value is not deployed.
