# The testnet sandbox

A place to try RhMask with funds that are worth nothing.

**It came after mainnet, not before.** The contracts went straight to Robinhood Chain mainnet on
25 September 2026, and the chain's timestamps say so. This sandbox exists because people asked to try the
flow without spending, not because anything was rehearsed here first. Nothing in `marketing/` may imply
otherwise — see the rules in [`../marketing/BUILD-LOG.md`](../marketing/BUILD-LOG.md).

## The network

| | |
|:--|:--|
| Chain | Robinhood Chain Testnet, id **46630** (Arbitrum Orbit, settles to Sepolia) |
| RPC | `https://robinhood-sepolia-rpc.publicnode.com` |
| Explorer | `https://explorer.testnet.chain.robinhood.com` |
| Faucet | **None.** The chain registry lists none and the chain's own docs publish none. |

The chain's own testnet RPC host, `rpc.testnet.chain.robinhood.com`, is unreachable from some networks
(the same DNS hijacking that affects the mainnet host), so the default above is a public mirror. Everything
that writes asserts `eth_chainId` first, so a mirror serving the wrong network fails instead of costing
anything.

Use it from the CLI with `--network testnet`:

```bash
npx rhmask chain --network testnet
npx rhmask balance 0x… --network testnet
```

## Status: live

Deployed 25 September 2026, and the deploy script proved the loop before recording anything.

| Contract | Address | |
|:--|:--|:--|
| `StealthAnnouncer` | `0x5107a69e9d2543a46e2d360060e9dd979b38cb58` | 788 bytes, ERC-5564 |
| `StealthRegistry` | `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` | 1,422 bytes, ERC-6538 |

| What | Transaction |
|:--|:--|
| Announcer deployed | `0x36efee4b133dda90c4c2df364f44b3e030c7ee702cbddbf02dff0340aa7af0f1` |
| Registry deployed | `0xf16977c6f21286ff381e2c0ee1e75d9a28350c41a59ba64f035bd3e0969a11ba` |
| First announcement | `0x5f186a8340dd51cdd908e10859d88e9b3d941cb0dcec2ed254aac513719c7191` |
| First registration | `0xfe528e5ca97a6b3ff4fd42b26fe0db8dcec71e36cfbc5e2c7ac63134d7a17d1d` |

The whole thing cost `0.0000084` ETH. Recorded in `contracts/deployments.testnet.json`, which is a separate
file from the mainnet record so neither can overwrite the other.

Try it:

```bash
npx rhmask chain --network testnet
npx rhmask scan --network testnet --view 0x… --spend 0x…
```

## ⚠ The same address means different contracts on the two chains

`0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` is the **`StealthRegistry` on testnet** and the
**`StealthAnnouncer` on mainnet**. Both really exist, and reading the code at that address proves it:
1,422 bytes on chain 46630, 788 bytes on chain 4663.

This is not a mistake, it is how `CREATE` works: the address is a hash of the deployer and its nonce, and
the same throwaway deployer was used on both chains with nonces that happened to line up.

**So an address on its own does not identify a contract.** Every time one is written down — in docs, in a
caption, in a reply to someone — it carries its chain id with it. `rhmask chain --network …` always prints
the two together for this reason.

## How it was funded

There is no faucet, so testnet ETH came across the bridge from Sepolia.

**1. Get Sepolia ETH.** This needs a browser and usually an account, so it cannot be scripted. Any Sepolia
faucet works. The deployer address is in `internal/test-wallet.json`. We claimed `0.05` and bridged `0.02`,
which turned out to be about 2,400 times what the deploys actually cost.

**2. Bridge it.**

```bash
npm run bridge:testnet -- --amount 0.01 --dry   # simulate, send nothing
npm run bridge:testnet -- --amount 0.01         # actually deposit
```

This calls `depositEth()` on the testnet Delayed Inbox. The L2 credit arrives on its own once the sequencer
picks the message up; there is nothing to claim at the other end. **Measured: 600 seconds**, the same ten
minutes mainnet took. The deposit shows up on Sepolia as a `MessageDelivered` from the Bridge and an
`InboxMessageDelivered` from the Inbox carrying the same message number, which is how you tell a queued
deposit from a failed one while you wait.

**3. Deploy.**

```bash
npm run contracts:build
npm run contracts:deploy:testnet
```

The deploy script does not just deploy. It announces a real stealth payment, reads the log back, confirms a
viewing key finds it and a stranger does not, then round-trips a meta-address through the registry. If any
of that fails it stops, and nothing is written to the deployment record.

Addresses land in `contracts/deployments.testnet.json`, which is a separate file from the mainnet record so
one can never overwrite the other.

## Verified L1 contracts

The bridge addresses came from the chain's documentation and were then checked against Sepolia, because a
documented address is a claim like any other.

| Contract | Address | Checked |
|:--|:--|:--|
| Delayed Inbox | `0xF2939afA86F6f933A3CE17fCAB007907B6b0B7a4` | `bridge()` returns the Bridge below ✓ |
| Bridge | `0x96295BDad104eaD97cC08797b3dC68efF59CcF30` | `rollup()` returns `0xdc5f8e39…1b386d` ✓ |

Both carry code on Sepolia. A nonsense selector on the same inbox reverts while `depositEth()` does not, so
the ABI is genuinely there rather than assumed. Re-check before moving anything that matters.

## Quirks of the mirror RPC

Measured on `robinhood-sepolia-rpc.publicnode.com`, 2026-09-25:

| | |
|:--|:--|
| `eth_getLogs` **needs an address filter** | A bare block range is refused outright. Everything here always passes one, so it does not bite us, but a hand-written query will fail. |
| Log ranges | 20,000 blocks answered fine, so the app's 5,000-block cap is comfortable. |
| Base fee | `0.01` gwei, priority fee `0`. Effectively free. |

## Environment overrides

| Variable | Effect |
|:--|:--|
| `RHC_TESTNET_RPC` | Use a different testnet endpoint (the scripts still assert chain 46630) |
| `SEPOLIA_RPC_URL` | Use a different Sepolia endpoint for the bridge |
| `RHMASK_NETWORK` | Default network for the CLI, instead of passing `--network` each time |

## What the sandbox does not prove

Testnet gas is not mainnet gas. The bug that a real payment found on 25 September — this chain prices L1
calldata into the gas limit, so a transfer needs about 21,369 rather than 21,000 — is exactly the kind of
thing a sandbox can miss, because L1 data costs are different there. A green run here is not a substitute
for a small real one.
