# Live on mainnet: the proof set

Five posters, `rhmask-p37.jpg` … `rhmask-p41.jpg`. This is the set that turns "we built a privacy layer"
into "here is the block number".

Everything here is read from chain, not from our own database. `p38` carries an unedited screenshot of the
chain's own block explorer, not a mockup of one.

**The through-line:** *a claim with a block number attached is a different kind of claim.*

---

## Verified facts behind this set

Re-read from Robinhood Chain on 2026-09-25. Re-check before reusing any of it.

| What | Value |
|:--|:--|
| Chain | Robinhood Chain, id 4663, Arbitrum Orbit L2 settling to Ethereum |
| `StealthAnnouncer` | `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` · 788 bytes runtime · 0 ETH |
| `StealthRegistry` | `0xa30e5702561bf230ad37ceecd1801c61067996a9` · 1,422 bytes runtime · 0 ETH |
| Announcer deploy | `0x55f314ae…ff34c` · block 71,934,007 · success |
| Registry deploy | `0xd1cb0e47…e12a19` · block 71,934,071 · success |
| First announcement | `0x80861d97…6b785` · block 71,934,116 · success · 1 log |
| First registration | `0x488899a4…78154` · block 71,934,157 · success · 1 log |
| First private payment | `0xb363b2e3…6d4f599` · block 71,907,730 · success |
| Swept back | `0x6db1fde3…1e7358d` · block 71,907,780 · success |

Explorers, all four independent and all reading the same blocks:
`robinhoodchain.blockscout.com` · `robinscan.io` · `hoodscan.co` · `stonkscan.io`

Link shape: `https://robinhoodchain.blockscout.com/tx/<hash>` and `/address/<address>`.

---

## The launch thread

**1/**

> Ghost Receive is live on mainnet.
>
> Not a testnet. Not a demo. Robinhood Chain 4663, settling to Ethereum, with six transactions anyone can
> open on four different explorers.

**2/**

> `StealthAnnouncer` · ERC-5564
> `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d`
>
> `StealthRegistry` · ERC-6538
> `0xa30e5702561bf230ad37ceecd1801c61067996a9`
>
> 788 and 1,422 bytes of runtime. Canonical interfaces, so any ERC-5564 client reads this chain with no
> custom adapter.

**3/**

> Both contracts show a balance of 0 ETH, and they will stay that way.
>
> Neither has a deposit function, a payable path or a treasury. One emits an event, the other stores a
> mapping row you write yourself. A privacy layer should not be somewhere you keep money.

**4/**

> We did not deploy and hope.
>
> The deploy script announced a real stealth payment, read the log back, confirmed a viewing key finds it,
> and confirmed a stranger does not.
>
> `0x80861d97c427eac94d9243390d9cc0a97621d97698547f69a29cecbff0b6b785`

**5/**

> Before the contracts, on the same wallet, the whole payment flow ran end to end with live funds.
>
> pay: `0xb363b2e311af1f164a5a43ccc572aa2fa25f7c3b66a1a07795207a2f26d4f599`
> sweep: `0x6db1fde3ca024bfa61177f3315009298b99e5de3c4f0aac61eb85a0e81e7358d`
>
> Derived, sent, recognised by the viewing key, swept back.

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

> Ghost Receive is live on mainnet.
>
> Robinhood Chain 4663, settling to Ethereum. Announcer deployed, registry deployed, first announcement
> confirmed, first private payment confirmed, swept back.
>
> Six transactions, four public explorers. rhmask.org

### 38 · Their explorer, not ours
`rhmask-p38.jpg`

> This is the chain's own block explorer, unedited.
>
> Contract deployed, creator visible, balance 0 ETH, one log: the first announcement.
>
> Zero balance is the point. The contract emits an event and holds nothing, so there is nothing to
> administer.

### 39 · The receipts
`rhmask-p39.jpg`

> Every claim in this launch, with the hash attached.
>
> Two deploys, one announcement, one private payment, one sweep. Paste any of them into a block explorer.
>
> contracts/deployments.json has the full list.

### 40 · Zero, and it stays that way
`rhmask-p40.jpg`

> Both contracts hold 0 ETH.
>
> No deposit function. No payable path. No treasury. They emit or they store, and they never receive.
>
> Your funds stay in your own addresses, always.

### 41 · Check it anywhere
`rhmask-p41.jpg`

> Four independent explorers index this chain. Open the addresses on whichever you trust.
>
> announcer `0x5707e5ed…c2c25d`
> registry `0xa30e5702…7996a9`
>
> Same blocks, four readers.

---

## Where this fits

This is **Act IV** in [`CAMPAIGN.md`](CAMPAIGN.md), and it replaces the earlier contract-launch set as the
headline moment. Order:

`p37` → `p38` → `p39` → `p40` → `p41`, then the four posters from `p21`–`p24` as follow-ups over the
following week.

`p37` is the announcement. `p38` is the one that actually convinces people, because the evidence is not
ours. Post them within an hour of each other.

## Rules

- **Never screenshot our own dashboard as proof.** The whole point of `p38` is that the source is a third
  party. If the explorer UI changes, re-screenshot it; do not redraw it.
- Hashes and block numbers are copied from chain, never typed from memory.
- `planned` still applies to the vault and the ledger. Being live on mainnet for two contracts does not make
  the others live, and no caption in this set implies it.
- Contracts are **not audited**, and the vault that will hold value is not deployed. Say so whenever the
  conversation moves from these two contracts to the token.
