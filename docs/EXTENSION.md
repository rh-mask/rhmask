# RhMask browser extension

**Status:** MVP in `extension/` (phase 1 below), built with `npm run build:extension`, loadable unpacked. See
`extension/README.md` for what it does today.

RhMask ships on two surfaces with the same two core functions. The dapp is where you set things up and see proof.
The extension is where privacy happens at the moment you would otherwise leak.

| Core function | In the dapp (`/app`) | In the extension |
|---|---|---|
| **Ghost Receive** | Generate keys, show meta-address, derive one-time addresses, later: scan announcements and sweep | Detect any "your address" field on any site and offer a fresh stealth address instead of your real wallet. Scan announcements in the background. Badge shows unswept balances. |
| **Mask Swap** | Full quote form, receipt page, order status | One-click "quote this privately" on any token page or explorer page. Quotes come from the same server API; the wallet deposits straight to the venue. |

Same keys, same crypto (`src/lib/stealth.ts` is shared as a package), same API. The extension never has its own
backend and never sees a private key that the user did not generate on the device.

## Why an extension

A stealth address only protects you if you actually use it at the moment someone asks for your address. In
practice people copy their wallet address from the wallet UI and paste it. The extension moves the private
choice to that exact moment: a small RhMask chip appears next to the field, one click pastes a one-time
address, the ephemeral key is queued for announcement. The dapp cannot do this; only an extension can see
the page.

## Architecture (Manifest V3)

```
extension/
  manifest.json          MV3, permissions: storage, activeTab, alarms, scripting (no host_permissions by default)
  src/
    background.ts        service worker: announcement scanner (alarms), quote proxy, badge
    content.ts           address-field detector + inline chip; injected on user click, not on every page
    popup/               keys, meta-address, unswept balances, "quote privately" form
    options/             RPC override, API base URL, scan interval, export viewing key
    shared/              re-exports @rhmask/stealth (the same code the dapp uses)
```

Key handling: the spending key is encrypted at rest with a passphrase (PBKDF2 + AES-GCM via WebCrypto) in
`chrome.storage.local`. The viewing key can be exported separately for the scanner. Nothing is synced.

Announcement scanning: the background worker polls the `StealthAnnouncer` event log through the app's RPC
(or the user's own RPC from options), filters by view tag first, then does the full check. Matches are stored
locally with the derived private key encrypted under the same passphrase.

Sweeping: the popup builds the transfer from the stealth address to a destination the user picks; the
gasless relay from the roadmap signs the gas sponsorship, the user signs the transfer. Until the relay ships,
sweeping requires the stealth address to hold a little ETH, and the popup says so.

Quote proxy: the extension never calls the router directly. It calls the app's `/api/quote` and `/api/order/:id`,
so the router key stays on the server and the fee logic stays in one place.

## Permission budget

- `storage`, `alarms`: required.
- `activeTab` + `scripting`: the content script runs only after the user clicks the toolbar icon on a page. No
  blanket `<all_urls>`. This is what makes the store review painless and the privacy story honest.
- Optional host permission for the explorer and the app domain, requested on first use of "quote privately".

## Store and distribution

- Chrome Web Store first (covers Brave, Edge, Arc). Firefox second (MV3 support is sufficient for this scope).
- Source published in this repository under `extension/`, built with the same toolchain, versioned with the app.
- Every release signed and its hash posted, same rule as every payout.

## Phases

1. **MVP (with Phase 1 of the roadmap):** popup with keys + meta-address, address-field chip, manual
   announcement import. Ships the day the announcer contract is on mainnet.
2. **Scanner:** background scanning, badge, unswept list, sweep with self-funded gas.
3. **Quote privately:** context-menu and toolbar quote flow, receipt link back to the dapp.
4. **Relay + vault:** gasless sweeps, staking position visible in the popup, proof ledger notifications.

---

## The next release: what it has to do

Written 25 September 2026, against what is actually in `extension/` today. The MVP shipped before the
announcer existed, so phase 1 is now finishable and phase 2 is unblocked.

### Blockers for a store submission

These are hard stops rather than polish. A submission without them is rejected or embarrassing.

| | |
|:--|:--|
| **No icons.** `manifest.json` declares no `icons` key and there is no `extension/icons` directory. | Chrome needs 16, 32, 48 and 128px PNGs. Render them from `src/app/icon.svg`, the same mark the site and the CLI use. |
| **No listing assets.** | 1280×800 or 640×400 screenshots, a 440×280 tile, a short and a full description. The poster set already has the visual language to draw on. |
| **No privacy policy URL.** | Required for anything that touches storage. `/docs` already states what is stored and what leaves the device; it needs a stable anchor the listing can point at. |
| **No developer account.** | Still outstanding, and review takes days. Start it before the release is ready, not after. |

### Functional gaps, now that the chain side exists

1. **Use the announcer, not only receipt QRs.** Both contracts are live on mainnet and on the sandbox, and
   the CLI already scans them. The extension still depends on someone handing over a receipt. Reuse the
   same view-tag filter: compare one byte, and only do elliptic-curve work on a match.
2. **Carry a network.** The CLI has `--network testnet` and the sandbox is deployed; the popup has no
   concept of a network at all. Add the switch, and print the chain id beside every address, for the reason
   in [`TESTNET.md`](TESTNET.md) — an address does not identify a contract on its own.
3. **Reuse the RPC bypass.** The extension talks to the chain directly, so on a network that hijacks the
   RPC domain it simply fails. The CLI approach applies unchanged: compare the system resolver against
   DNS-over-HTTPS, pin the answer, and keep verifying TLS against the real hostname.
4. **Import the wire formats, do not re-implement them.** `src/lib/payment.ts` and `src/lib/stealth.ts` are
   the single source for the app and the CLI already. Keep the extension on the same files when the
   announcement path changes.

### What must not change

The permission budget is the product. `host_permissions` is empty today and stays empty: the content script
runs only after the toolbar click. Anything needing a host permission asks optionally, at the moment of
use, or it does not ship.

Keys stay in `chrome.storage.session` while unlocked and in the shared sealed blob at rest. No analytics,
no error reporter, and no background `fetch` that is not a chain read the user asked for.

### Order of work

```
icons + manifest  ──▶  developer account  ──▶  announcer scanning  ──▶  network switch
                   └─▶  listing assets and a privacy anchor
```

The first two are unblocked and slow, because review time is out of our hands. The last two are the
interesting work and depend on nothing external.
