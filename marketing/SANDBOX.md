# The sandbox

Four posters, `rhmask-p53.jpg` … `rhmask-p56.jpg`. The testnet deployment, how it got funded, the one
genuinely surprising thing it turned up, and an honest account of what it does not prove.

**The through-line:** *a free place to try it, and a straight answer about what that is worth.*

---

## Read this before you post it

**The sandbox came after mainnet, on the same day, and `p53` says so in its own caption.** Mainnet contracts
landed at 04:15 UTC; the testnet ones at 10:29 UTC. Both timestamps are public. Nothing in this set may be
ordered or worded so that the sandbox looks like a rehearsal — see the rules in
[`BUILD-LOG.md`](BUILD-LOG.md).

`p53` and `p56` are a pair. Do not post the invitation without the limit.

---

## The verified facts

Read from chain 46630 on 2026-09-25, and cross-checked against the chain's own explorer API.

| | |
|:--|:--|
| Chain | Robinhood Chain Testnet, **46630**, settles to Sepolia |
| `StealthAnnouncer` | `0x5107a69e9d2543a46e2d360060e9dd979b38cb58` · 788 bytes · block 124,061,246 |
| `StealthRegistry` | `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` · 1,422 bytes · block 124,061,254 |
| Deploy cost | `0.0000084` ETH for both, plus the announce and register proofs |
| Funding | 0.02 ETH bridged from Sepolia, message **#590,980**, credited in **600 seconds** |
| Balances | both contracts hold **0 ETH**, same as mainnet |

The explorer confirms it independently: `is_contract: true`, creator `0xe6580E40…151A`, `coin_balance: 0`,
and the deploy transaction reports `status: ok` with `created_contract` matching.

### The address collision

`0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` is the **registry on testnet** and the **announcer on
mainnet**. `eth_getCode` at that address returns 1,422 bytes on chain 46630 and 788 bytes on chain 4663.

A `CREATE` address is a hash of the deployer and its nonce, the same throwaway deployer was used on both
chains, and the nonces lined up. **So every address we publish carries its chain id.** This is now a
campaign-wide rule in [`CAMPAIGN.md`](CAMPAIGN.md).

---

## Captions

### 53 · Try the whole thing for nothing
`rhmask-p53.jpg`

> Both contracts are now live on Robinhood Chain Testnet too — chain **46630**, which settles to Sepolia.
> Same code, same derivation, funds that are worth zero.
>
> `StealthAnnouncer` · `0x5107a69e9d2543a46e2d360060e9dd979b38cb58`
> `StealthRegistry` · `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d`
>
> Both hold 0 ETH, the same as on mainnet. Read them yourself:
>
> `npx rhmask chain --network testnet`
>
> On the order of things: mainnet came first, earlier the same day. The sandbox was added afterwards
> because people asked to try the flow without spending — not as a rehearsal.

**Hashtags:** #testnet #ERC5564 #buildinpublic

---

### 54 · One address, two different contracts
`rhmask-p54.jpg`

> Something worth knowing if you ever verify a contract by address alone.
>
> `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` is our **announcer on chain 4663** and our **registry on
> chain 46630**. Both are real. `eth_getCode` returns 788 bytes on one and 1,422 on the other.
>
> Nothing went wrong. A contract address is a hash of the deployer and its nonce, we used the same
> throwaway deployer on both chains, and the nonces happened to line up.
>
> An address is not an identity. Ours now always ship with a chain id, and it is fair to expect that of
> anyone who shows you one.

**Hashtags:** #ethereum #solidity #security

---

### 55 · Ten minutes, no claim step
`rhmask-p55.jpg`

> This chain publishes no faucet, so the sandbox was funded the long way: a deposit on Sepolia that crosses
> to L2 by itself.
>
> `depositEth()` on the Delayed Inbox, 0.02 ETH. Two events fire on L1 — `MessageDelivered` from the Bridge
> and `InboxMessageDelivered` from the Inbox — both carrying message **#590,980**.
>
> Then you wait. Credited on chain 46630 after **600 seconds**, with nothing to claim at the other end.
>
> Matching message numbers on both events is how you tell a queued deposit from a failed one while you are
> still staring at a zero balance.

**Hashtags:** #arbitrum #orbit #L2

---

### 56 · A green run here is not a green run there
`rhmask-p56.jpg`

> The sandbox is useful. It is not a substitute, and here is the specific reason.
>
> The worst bug we have hit was `intrinsic gas too low` on mainnet. A plain ETH transfer needed **21,369**
> gas, not the 21,000 every tutorial hard-codes, because this chain prices L1 calldata into the limit.
>
> L1 data costs are different on a testnet. That number would have come out wrong there, and the bug would
> have shipped.
>
> **Good for:** learning the flow, wiring an integration, breaking things loudly.
> **Not good for:** gas numbers, fee assumptions, calling anything proven.
>
> Test the thing that handles money on the chain that handles money. Ours cost a fraction of a cent.

**Hashtags:** #testing #ethereum #honestsoftware

---

## The thread

**1/**

> You can now run the whole of RhMask for free.
>
> Both contracts are live on Robinhood Chain Testnet, chain 46630, settling to Sepolia.
>
> `npx rhmask chain --network testnet`

**2/**

> `StealthAnnouncer` · 788 bytes
> `0x5107a69e9d2543a46e2d360060e9dd979b38cb58`
>
> `StealthRegistry` · 1,422 bytes
> `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d`
>
> Blocks 124,061,246 and 124,061,254. Both hold 0 ETH. Both deploys together cost 0.0000084 ETH.

**3/**

> The order, since it matters and it is checkable: mainnet first at 04:15 UTC, the sandbox at 10:29 UTC the
> same day.
>
> This is a place to try the flow without spending, not a rehearsal we are backdating.

**4/**

> Funding it was the interesting part. No faucet exists for this chain, so it came over the bridge.
>
> `depositEth()` on Sepolia, two L1 events both carrying message #590,980, then 600 seconds of waiting and
> the balance simply appears. No claim step.

**5/**

> And one thing we did not expect.
>
> `0x5707e5ed1852174e09f6e113f0e56f14bfc2c25d` is our announcer on mainnet and our registry on testnet.
> Same address, different contracts, both real.
>
> A CREATE address is just hash(deployer, nonce). The nonces lined up.

**6/**

> Which is a useful reminder: an address on its own does not identify a contract.
>
> Every address we publish now carries its chain id. Worth asking that of anyone who shows you one.

**7/**

> Finally, what a sandbox does not buy you.
>
> Our worst bug was a gas limit — 21,369 needed, 21,000 assumed — and it only showed up because we paid for
> real L1 calldata. A testnet would have given us a different number and a green tick.
>
> Use it to learn. Prove it where it counts.

---

## Where this fits

**Act V** in [`CAMPAIGN.md`](CAMPAIGN.md), beside the CLI set, and after the npm package is live since
`p53` tells people to run `npx rhmask`.

Order: `p53` → `p55` → `p54` → `p56`. The invitation, then how it was built, then the surprise, then the
limit. `p54` is the one technical people will quote; `p56` is the one that keeps the set honest.

## Rules

- **Never imply the sandbox preceded mainnet.** It did not, and both timestamps are public.
- **Never print an address without its chain id.** This set is the reason that rule exists.
- `p53` depends on `npx rhmask` resolving. Hold it until the package is published; see [`CLI.md`](CLI.md).
- The explorer at `explorer.testnet.chain.robinhood.com` is reachable and was verified through its API,
  though the host is DNS-blocked on our own network. Check a link before putting it in a post.
- Contracts are **not audited**, on either chain.
