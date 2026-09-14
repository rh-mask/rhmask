# RhMask browser extension

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
