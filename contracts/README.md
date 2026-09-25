# Contracts

Solidity for RhMask on Robinhood Chain (4663).

**Deployed 2026-09-25** (addresses and tx hashes in [`deployments.json`](deployments.json)):

| Contract | Address | Standard |
|---|---|---|
| `StealthAnnouncer` | `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` | ERC-5564 |
| `StealthRegistry` | `0xa30e5702561bf230ad37ceecd1801c61067996a9` | ERC-6538 |

Both are stateless-or-nearly-so, have no owner, no pause and no upgrade path, and hold no funds. They are
not audited. The vault contracts, which will hold value, are not deployed and will not be until they are.

Build with `npm run contracts:build` (solc, no Foundry: two small contracts do not justify a second toolchain).

## Planned contracts

| Contract | Purpose | Admin surface |
|---|---|---|
| `StealthAnnouncer` | ERC-5564 announcer: emits `(schemeId, stealthAddress, caller, ephemeralPubKey, metadata)` so recipients can scan with a viewing key. Canonical interface, no storage. | none |
| `StealthRegistry` | ERC-6538 registry: maps an address to its meta-address so senders can look it up on-chain. | none |
| `MaskVault` | Stake `$MASK`, receive a pro-rata stream of stock tokens. Rewards are pushed as ERC-20 stock tokens; the vault never mints anything. | none (no owner, no pause, no upgrade) |
| `RevenueRouter` | Receives ETH / ERC-20 revenue (routing fees, token trading fees, relay fees), swaps to the basket through a fixed DEX route, and forwards to `MaskVault`. | basket weights set by staker vote, timelocked |
| `ProofLedger` | Append-only log of payouts (`token, amount, txRef, source`) so the public ledger page reads from one place. | none |

## Order of work

1. [x] Confirm on-chain that stock tokens can be held and transferred by a contract on this chain (small test transfer to a throwaway contract). This decides whether the vault can pay in stock tokens directly or must pay a claim that the user redeems.
2. [x] `StealthAnnouncer` + `StealthRegistry` (small, standard, cheap to audit).
3. `MaskVault` + `ProofLedger`.
4. `RevenueRouter` last, after the token exists and the fee sources are live.

## Conventions

- Solidity `^0.8.26`, Foundry, OpenZeppelin for ERC-20 interfaces only.
- No `owner()`, no `pause()`, no upgrade path unless the doc for that contract says why.
- Every deployed address is recorded in `deployments.json` with the deploy tx hash.
