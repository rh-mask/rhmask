# Handoff: working on the UI

This is the page to read first if you joined to polish the interface. Nothing here is a style opinion; it is the
set of things that will break the product if they change silently.

## Get running

```bash
git clone https://github.com/rh-mask/rhmask.git
cd rhmask
npm install
npm run hooks:install      # installs the pre-push gate, once per clone
cp .env.example .env.local # optional; the app runs with no keys at all
npm run dev                # http://localhost:3000
```

Every route works without a single secret. Handlers that need a key answer `503` naming the exact variable, and
the UI shows that message instead of a blank state. So you can style every screen offline.

Production is Vercel, project `rhmask`, canonical domain `rhmask.org`.

## Where the UI lives

| Screen | Route | Components |
|:--|:--|:--|
| Landing | `src/app/page.tsx` | `Badge`, `QrCode`, `Icons`; the honest-status table is inline |
| Docs | `src/app/docs/page.tsx` | `DocShell`, `DocSection`, `Code`, `Note`, `DataTable` |
| Whitepaper | `src/app/whitepaper/page.tsx` | same `DocShell` primitives |
| Dashboard | `src/app/app/page.tsx` | `Dashboard` → `SwapCard` · `StealthCard` · `PayCard` · `VaultCard` |
| Pay landing (scanned QR) | `src/app/pay/page.tsx` | `PayCard` in `mode="send"` |
| Chrome (shell) | `src/app/layout.tsx` | `Nav`, `Footer`, `Logo` |
| Social card | `src/app/opengraph-image.tsx` | rendered at build time, 1200×630 |

Tabs are driven by the URL hash: `/app#swap`, `/app#receive`, `/app#pay`, `/app#vault`. Keep that. A scanned
receipt QR opens `/app?claim=1&…#receive` and the claim card reads it on mount, so the hash is part of the
product, not decoration.

## Design tokens

All colour lives in `src/app/globals.css` under `@theme`. Use the token, never a raw hex, so both surfaces and
the OG image stay in step.

| Token | Value | Use |
|:--|:--|:--|
| `--color-ink` … `ink-4` | `#05060a` `#0a0c13` `#11141e` `#191d2a` | page, card, field, raised |
| `--color-line` / `line-2` | `#232838` `#333a4f` | borders, hover borders |
| `--color-paper` | `#f0f2f8` | primary text |
| `--color-fog` / `fog-2` | `#8b91a8` `#646a80` | secondary and tertiary text |
| `--color-mask` / `mask-2` | `#b8ff5c` `#8ee03a` | primary accent, focus ring |
| `--color-aqua` | `#52e8ff` | Private Pay, secondary gradients |
| `--color-violet` | `#a78bfa` | Mask Swap, whitepaper accent |
| `--color-pink` | `#ff6ec7` | token and vault |
| `--color-warn` | `#ffb454` | anything `planned`, and every error |

The CSS is layered. Base rules live in `@layer base` and component classes in `@layer components`, which is what
lets a Tailwind utility such as `md:hidden` override `.btn`. Keep new component CSS inside that layer or you will
reintroduce the bug where a button ignores a responsive utility.

Helper classes, all in the same file: `.card` and `.glass` (glass surface), `.card-hover`, `.aura` (coloured
hairline, set `--aura`), `.field`, `.btn` with `.btn-primary` / `.btn-ghost`, `.display`, `.mono`, `.shine`,
`.gradient-lime`, `.gradient-violet`, `.eyebrow`, `.rule`, `.reveal`, `.pulse-dot`, `.grid-bg`, `.aurora`,
`.grain`. Restyle them freely; renaming means touching every component, so prefer changing the rule.

Three fonts are wired in `layout.tsx` through `next/font/google` and exposed as tokens: **Unbounded** for display
(`.display`, `--font-display`), **Plus Jakarta Sans** for body, **JetBrains Mono** for code (`.mono`). They are
self-hosted at build time, so no request leaves the page.

The ambient background is two fixed layers rendered once in `layout.tsx`: `.aurora` (four blurred colour fields,
clipped by its own wrapper so it can never widen the document) and `.grain`.

If you change the accent, change it in four places or it will look broken: `globals.css`, `src/app/icon.svg`,
`src/components/Logo.tsx`, `src/app/opengraph-image.tsx`.

Links and handles are not hard-coded in components. They live in `src/lib/site.ts` (site URL, X handle, GitHub),
and the header and footer read from there.

## Rules that are not style

These are product promises. Changing them is a product decision, not a UI one.

1. **Never remove a status label.** `beta` and `planned` badges, and the "Honest status" table, are the trust
   story. If a surface is not live, the screen says so.
2. **Never remove "what is hidden, what is not."** It appears beside the dashboard and in the docs. Privacy
   claims stay paired with their limits. We never write "anonymous" or "untraceable".
3. **Keys never leave the browser.** Do not add analytics, a font that phones home, an error reporter, or any
   `fetch` inside a component that touches `src/lib/stealth.ts`, `src/lib/keycrypto.ts` or `src/lib/keystore.ts`.
4. **Do not move key handling into a server component.** Everything under `src/lib/` marked `"use client"` is
   client-only on purpose.
5. **Warnings before money.** The "test with a small amount first" line on the pay flow and the gas warning on
   sweep stay visible.
6. **Reveal stays behind a click.** Private keys, backups and the stealth private key are never rendered by
   default.

## Checks

`npm run check` runs in the pre-push hook and again in CI, and a red run blocks the merge.

| Command | What it covers |
|:--|:--|
| `npm run check:fast` | history, tracked files, forbidden terms, typecheck, lint, crypto round-trips |
| `npm run check` | the above plus the production build |
| `npm run check:onchain` | read-only mainnet verification; needs network |
| `npm run build:extension` | bundles `extension/` into `extension/dist` for unpacked loading |

The forbidden-terms step reads an optional private list that is not in the repository. You will see a note that
it is missing; that is expected and not a failure.

## Commits and pull requests

Read [`PUSH_RULES.md`](PUSH_RULES.md). The short version: one change per commit, imperative subject under 60
characters, no trailers of any kind, no AI identity in author or message, nothing private ever tracked.

`main` is protected: linear history, no force pushes, and the `checks` job must pass. A collaborator cannot push
to `main` directly, so the flow is always a branch and a pull request:

```bash
git switch -c ui/dashboard-polish
# …work…
npm run check                       # same gate CI runs
git push -u origin ui/dashboard-polish
gh pr create --fill                 # or open it in the browser
```

Keep branches short-lived and rebase rather than merge, so the history stays linear:

```bash
git fetch origin
git rebase origin/main
```

The other side of the repository pulls your work the same way, so nothing is ever copied by hand:

```bash
git fetch origin && git pull --ff-only
```

## What is deliberately ugly right now

Honest list, so you do not spend time wondering whether something is intentional:

- The swap asset picker uses two native `<select size=6>` lists. It works and validates; it is not designed.
- `/docs` and `/whitepaper` are hand-authored React, not MDX. Long term they should read from `docs/`.
- The vault tab is mostly empty state because the contract does not exist yet.
- The extension popup (`extension/src/popup.html`) is hand-written CSS, not Tailwind, because it ships without a
  build step for styles. Same tokens, different file.
- No loading skeletons. Fetches show a plain "Loading…" line.
- No i18n. English only, Indonesian is planned.
