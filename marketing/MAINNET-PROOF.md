# Live on mainnet: the proof set

Five posters, `rhmask-p37.jpg` … `rhmask-p41.jpg`. This is the set that turns "we built a privacy layer"
into "here is the block number".

Every figure below was read from Robinhood Chain on 2026-09-25, not from our own database. `p38` carries an
unedited screenshot of the chain's own block explorer, not a mockup of one.

**The through-line:** *a claim with a block number attached is a different kind of claim.*

---

## What is live, exactly

Say this list, not a shorter one. The green rows are what a person can use today; the amber rows have no
on-chain effect yet and every caption that touches them says so.

| Surface | Status | What that means |
|:--|:--|:--|
| **Ghost Receive** | live | Keys, meta-address, derivation, claim and sweep, all in the browser. Passphrase encryption at rest. |
| **Private Pay** | live | Request QR, pay from any wallet, receipt QR, claim, sweep. Proven end to end with real funds. |
| **StealthAnnouncer** | deployed | ERC-5564 announcer on mainnet. 788 bytes, no owner, 0 ETH. |
| **StealthRegistry** | deployed | ERC-6538 registry on mainnet. 1,422 bytes, self-write only, 0 ETH. |
| **RPC pass-through** | live | Chain reads go through the app's own origin, so a filtered network cannot break it. |
| **Browser extension** | buildable | Builds from source and loads unpacked. Not on a store yet. |
| **Mask Swap** | dry quotes | Asset picker and validation work. Live deposit addresses need a router key we do not have. |
| **Blue Chip Vault** | planned | No contract deployed. No payout has ever been made. |
| **Proof Ledger** | planned | Ships with the vault. Empty until the first real payout. |

## Proof links

Open any of these. They resolve, or we are wrong in public.

### Contracts

| Contract | Address | Explorer |
|:--|:--|:--|
| `StealthAnnouncer` | `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` | [blockscout](https://robinhoodchain.blockscout.com/address/0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d) · [robinscan](https://robinscan.io/address/0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d) · [hoodscan](https://hoodscan.co/address/0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d) |
| `StealthRegistry` | `0xa30e5702561bf230ad37ceecd1801c61067996a9` | [blockscout](https://robinhoodchain.blockscout.com/address/0xa30e5702561bf230ad37ceecd1801c61067996a9) · [robinscan](https://robinscan.io/address/0xa30e5702561bf230ad37ceecd1801c61067996a9) · [hoodscan](https://hoodscan.co/address/0xa30e5702561bf230ad37ceecd1801c61067996a9) |

### Transactions

| What | Block | Explorer |
|:--|:--|:--|
| Announcer deployed | 71,934,007 | [blockscout](https://robinhoodchain.blockscout.com/tx/0x55f314ae028119e7c1aca8511f2adb815c210785c14a375d719ba76d240ff34c) · [robinscan](https://robinscan.io/tx/0x55f314ae028119e7c1aca8511f2adb815c210785c14a375d719ba76d240ff34c) |
| Registry deployed | 71,934,071 | [blockscout](https://robinhoodchain.blockscout.com/tx/0xd1cb0e474323d733c86db55d0c02ee4b9eea842d5f8f4c7695cff3a55be12a19) · [robinscan](https://robinscan.io/tx/0xd1cb0e474323d733c86db55d0c02ee4b9eea842d5f8f4c7695cff3a55be12a19) |
| First announcement | 71,934,116 | [blockscout](https://robinhoodchain.blockscout.com/tx/0x80861d97c427eac94d9243390d9cc0a97621d97698547f69a29cecbff0b6b785) · [robinscan](https://robinscan.io/tx/0x80861d97c427eac94d9243390d9cc0a97621d97698547f69a29cecbff0b6b785) |
| First registration | 71,934,157 | [blockscout](https://robinhoodchain.blockscout.com/tx/0x488899a40184f4db990b979c084aeee45d04489e9d7c8b355fc2be50f0078154) · [robinscan](https://robinscan.io/tx/0x488899a40184f4db990b979c084aeee45d04489e9d7c8b355fc2be50f0078154) |
| First private payment | 71,907,730 | [blockscout](https://robinhoodchain.blockscout.com/tx/0xb363b2e311af1f164a5a43ccc572aa2fa25f7c3b66a1a07795207a2f26d4f599) · [robinscan](https://robinscan.io/tx/0xb363b2e311af1f164a5a43ccc572aa2fa25f7c3b66a1a07795207a2f26d4f599) |
| Swept back | 71,907,780 | [blockscout](https://robinhoodchain.blockscout.com/tx/0x6db1fde3ca024bfa61177f3315009298b99e5de3c4f0aac61eb85a0e81e7358d) · [robinscan](https://robinscan.io/tx/0x6db1fde3ca024bfa61177f3315009298b99e5de3c4f0aac61eb85a0e81e7358d) |

**Explorers.** Three were opened and confirmed to show the contract before this file was written:
`robinhoodchain.blockscout.com`, `robinscan.io`, `hoodscan.co`. A fourth, `stonkscan.io`, is listed by the
chain registry but would not render for us to check, so it is not claimed here.

**Short form for a post**, when the platform strips long URLs:

```
announcer  robinscan.io/address/0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d
registry   robinscan.io/address/0xa30e5702561bf230ad37ceecd1801c61067996a9
```

---

## The launch thread

**1/**

> RhMask is live on Robinhood Chain.
>
> Ghost Receive and Private Pay both work today, in the browser, with nothing to sign up for. Two contracts
> are deployed. Six transactions back all of it and every one is open on three public explorers.
>
> The vault and the ledger are not live, and this thread will not pretend otherwise.

**2/**

> `StealthAnnouncer` · ERC-5564
> `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d`
>
> `StealthRegistry` · ERC-6538
> `0xa30e5702561bf230ad37ceecd1801c61067996a9`
>
> 788 and 1,422 bytes of runtime. Canonical interfaces, so any ERC-5564 client reads this chain with no
> custom adapter.
>
> robinscan.io/address/0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d

**3/**

> Both contracts show a balance of 0 ETH, and they will stay that way.
>
> Neither has a deposit function, a payable path or a treasury. One emits an event, the other stores a row
> you write yourself. A privacy layer should not be somewhere you keep money.

**4/**

> We did not deploy and hope.
>
> The deploy script announced a real stealth payment, read the log back, confirmed a viewing key finds it,
> and confirmed a stranger does not.
>
> Block 71,934,116
> `0x80861d97c427eac94d9243390d9cc0a97621d97698547f69a29cecbff0b6b785`

**5/**

> Private Pay ran end to end with live funds on the same wallet.
>
> Derived a one-time address, sent, recognised it with the viewing key, swept it back.
>
> pay · block 71,907,730 · `0xb363b2e3…26d4f599`
> sweep · block 71,907,780 · `0x6db1fde3…81e7358d`

**6/**

> That run also found a real bug. This chain prices L1 calldata into the gas limit, so a plain ETH transfer
> needs about 21,360 gas and a hard-coded 21,000 is rejected outright.
>
> Our sweep had 21,000 as a fallback. It is gone. Only a live test on a real chain would have shown that.

**7/**

> Everything is open: the contracts, the deploy script that verifies them, and every check behind the
> claims in this thread.
>
> github.com/rh-mask/rhmask
> rhmask.org

---

## Captions

### 37 · Live on mainnet
`rhmask-p37.jpg`

> RhMask is live on Robinhood Chain 4663.
>
> **Live today:** Ghost Receive, Private Pay, the RPC pass-through, and two contracts on mainnet. The
> browser extension builds from source.
>
> **Not live:** Mask Swap still shows dry quotes because we have no router key. The Blue Chip Vault and the
> Proof Ledger are planned, with no contract deployed and no payout ever made.
>
> Six transactions back the first list. rhmask.org

### 38 · Their explorer, not ours
`rhmask-p38.jpg`

> This is the chain's own block explorer, unedited.
>
> Contract deployed, creator visible, balance 0 ETH, one log: the first announcement.
>
> Zero balance is the point. The contract emits an event and holds nothing, so there is nothing to
> administer.
>
> robinhoodchain.blockscout.com/address/0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d

### 39 · The receipts
`rhmask-p39.jpg`

> Every claim in this launch, with the hash attached.
>
> Two deploys, one announcement, one private payment, one sweep. Blocks 71,907,730 through 71,934,157.
>
> Paste any of them into a block explorer. Full list with links: github.com/rh-mask/rhmask

### 40 · Zero, and it stays that way
`rhmask-p40.jpg`

> Both contracts hold 0 ETH.
>
> No deposit function. No payable path. No treasury. They emit or they store, and they never receive.
>
> Your funds stay in your own addresses, always.

### 41 · Check it anywhere
`rhmask-p41.jpg`

> Three independent explorers index this chain. Open the addresses on whichever you trust.
>
> announcer `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d`
> registry `0xa30e5702561bf230ad37ceecd1801c61067996a9`
>
> blockscout · robinscan · hoodscan. Same blocks, three readers.

---

## Where this fits

This is **Act IV** in [`CAMPAIGN.md`](CAMPAIGN.md), the headline moment. Order:

`p37` → `p38` → `p39` → `p40` → `p41`, then the four posters from `p21`–`p24` as follow-ups over the
following week.

`p37` is the announcement. `p38` is the one that actually convinces people, because the evidence is not
ours. Post them within an hour of each other.

## Rules

- **Say the whole list, not the flattering half.** `p37` names what is live *and* what is not, in the same
  breath. A caption that only says "live on mainnet" invites people to assume the vault is too.
- **Never screenshot our own dashboard as proof.** The point of `p38` is that the source is a third party.
  If the explorer UI changes, re-screenshot it; do not redraw it.
- **Verify a link before you publish it.** Every URL in this file was opened first. `stonkscan.io` is
  omitted for exactly that reason.
- Hashes and block numbers are copied from chain, never typed from memory.
- Contracts are **not audited**, and the vault that will hold value is not deployed. Say so whenever the
  conversation moves from these two contracts to the token.
