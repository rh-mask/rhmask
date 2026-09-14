# RhMask extension (MVP)

The second surface. Same keys, same crypto (`src/lib/stealth.ts`), same receipt format as the dapp. Design and
phases: [`docs/EXTENSION.md`](../docs/EXTENSION.md).

## What this MVP does

- **Keys and meta-address** in the popup: generate, show as text and QR, back up, restore, forget.
- **Chips on any page**: click "Add RhMask chips to this tab", every address-looking field gets a chip. One click
  pastes a fresh stealth address derived from your own meta-address. Nothing runs on a page until you ask.
- **Receipts**: every address you handed out is listed with a link that opens the dapp's claim flow
  (`/app?claim=…`), where you can read the balance and sweep.
- **Derive for someone**: paste their meta-address, get a one-time address and the receipt link to send them.
- **Passphrase encryption**: same AES-256-GCM / PBKDF2 blob as the dapp (`src/lib/keycrypto.ts`), so one backup and
  one passphrase work in both. Unlocked keys live in `chrome.storage.session` (memory, cleared when the browser
  closes, unreachable from content scripts). Chips keep working while unlocked.

## What it does not do yet

- No background scanning (needs the announcer contract), no sweep inside the popup. Without a passphrase, keys
  are plaintext in `chrome.storage.local`, never synced. Icons are placeholders until the store listing.

## Build and load

```bash
npm run build:extension          # bundles into extension/dist
```

Chrome, Brave, Edge, Arc: open `chrome://extensions`, enable Developer mode, "Load unpacked", pick `extension/dist`.

## Permissions

`storage` (keys and receipts), `activeTab` + `scripting` (chips only on the tab you clicked), `clipboardWrite`.
No host permissions, no network calls: the extension never talks to a server.
