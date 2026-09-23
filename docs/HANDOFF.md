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

The look is a terminal: one monospace face, square corners, Robinhood green on black, ANSI tones for the rest.

| Token | Value | Use |
|:--|:--|:--|
| `--color-ink` … `ink-4` | `#000000` `#07090a` `#0e1210` `#151a17` | page, pane, field, raised |
| `--color-line` / `line-2` | `#1f2a22` `#2f4034` | dividers, pane borders |
| `--color-paper` | `#e6f5e8` | primary text |
| `--color-fog` / `fog-2` | `#8fa396` `#5f7065` | secondary text, comments |
| `--color-mask` / `mask-2` | `#ccff00` `#a8d400` | Robinhood neon green: primary accent, prompt, cursor, focus ring |
| `--color-aqua` | `#33d6e6` | ANSI cyan: Private Pay, paths |
| `--color-violet` | `#e5c07b` | ANSI yellow: Mask Swap |
| `--color-pink` | `#d670d6` | ANSI magenta: token and vault |
| `--color-warn` | `#ffb000` | anything `planned`, and every error |

Every `rounded-*` radius token is zeroed in `@theme`, so corners are square everywhere; `rounded-full` (dots) is
untouched.

The CSS is layered. Base rules live in `@layer base` and component classes in `@layer components`, which is what
lets a Tailwind utility such as `md:hidden` override `.btn`. Keep new component CSS inside that layer or you will
reintroduce the bug where a button ignores a responsive utility.

Helper classes, all in the same file: `.card` and `.glass` (flat pane), `.card-hover`, `.aura` (coloured top rule,
set `--aura`), `.field`, `.btn` with `.btn-primary` / `.btn-ghost` (rendered as `[ label ]`), `.display`, `.mono`,
`.shine`, `.gradient-lime`, `.gradient-violet` (solid colours now, names kept), `.eyebrow` (prefixed `// `),
`.rule`, `.cursor` (blinking block after the text), `.ticker` / `.ticker-track`, `.reveal`, `.pulse-dot` (needs a
`relative` parent), `.spinner` (`|/-\` before the text), `.logo-eye` (blinking logo eyes), and the looping icon
classes `.loop-float` / `.loop-pulse` / `.loop-flip` / `.loop-spin` / `.loop-bob` (transform-only; stagger with
`animationDelay`; reduced motion stops them). Panel titles inside `.card` with `font-semibold` get a `> ` prompt automatically. Restyle them
freely; renaming means touching every component, so prefer changing the rule.

`src/components/Terminal.tsx` holds the window chrome (`Terminal`, title bar with a path) and the `Cmd` shell line.

One font is wired in `layout.tsx` through `next/font/google`: **JetBrains Mono**, used for display, body and code.
It is self-hosted at build time, so no request leaves the page.

There is no ambient background layer: the page is flat black.

**Performance rules, learned the hard way.** The first build ran at 49fps with 27 dropped frames per scroll.
Two causes, both worth avoiding:

- No `backdrop-filter` on repeated elements. A blurred backdrop on twenty cards forces each one to recompute
  whenever anything behind it moves. Only the sticky header uses it, because there is exactly one.
- No `filter: blur()` on an animated element. The aurora used to animate a 40px blur; every frame re-blurred a
  full-screen surface. Soft radial-gradient stops give the same look at zero cost.

After both fixes the page holds a locked 60fps on desktop and mobile. Re-measure before shipping anything that
adds a filter, a large shadow animation, or a new fixed overlay.

If you change the accent, change it in four places or it will look broken: `globals.css`, `src/app/icon.svg`,
`src/components/Logo.tsx`, `src/app/opengraph-image.tsx`, and the extension (`extension/src/popup.html`, `content.ts`).

Links and handles are not hard-coded in components. They live in `src/lib/site.ts` (site URL, X handle, GitHub),
and the header and footer read from there.

## Rules that are not style

These are product promises. Changing them is a product decision, not a UI one.

1. **Never remove a status label.** The `beta` and `planned` badges on the feature cards and in the mechanism
   list are the trust story. If a surface is not live, the screen says so. The full status detail now lives on
   `/docs` rather than the landing page.
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
