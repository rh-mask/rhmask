# $VEIL

## Principle

`$VEIL` buys **access and discounts**. It never buys route quality. Route quality is equal for everyone.

`$VEIL` is the only way to receive the vault's stock-token stream. That is the utility: stake `$VEIL`, get paid in NVDA, SPY, TSLA, AAPL, MSFT.

## Supply and launch

| | |
|---|---|
| Supply | 1,000,000,000, fixed. No `mint()`, no `owner()`, no `pause()`. |
| Launch | Fair launch on the chain's leading launchpad (V2 bonding curve → locked Uniswap v4 pool). Full supply mints to the curve. |
| Team allocation | None. The team buys from the curve with a disclosed wallet and posts the hash. |
| Presale | None. |
| Creator fee | Set at launch (cap is 10%; target 3%). Paid in ETH on every trade of `$VEIL`, on the curve and in the pool. **100% of it goes to the vault.** |

The creator fee is the reason the vault can pay from day one. Every trade of `$VEIL`, buy or sell, produces ETH that becomes stock tokens for stakers. The flywheel does not wait for product volume.

## Revenue → vault

| Source | Asset | Live when |
|---|---|---|
| Creator share of `$VEIL` trading fees | ETH | Token launch |
| Routing fee (default 0.30% of input; integrator keeps half after the router's share) | input token | Router key configured |
| Gasless sweep relay fee | ETH | Relay ships |
| API keys, desk mirroring | ETH / stables | Phase 3 |

### Allocation of every unit of revenue

| Share | Destination |
|---|---|
| 60% | **Vault**: converted to the basket and streamed to stakers |
| 20% | **Buyback and burn** of `$VEIL`, executed on-chain, hash posted |
| 15% | **Treasury**: audits, infrastructure, relay gas |
| 5% | **Growth**: referrals, competitions |

Allocation is enforced by `RevenueRouter`, not by a spreadsheet.

## Tiers

Tiers are by amount staked in `VeilVault`. Holding in a wallet does not count.

| Tier | Staked | Fee discount | Stream multiplier | Unlocks |
|---|---|---|---|---|
| Passer | 0 | 0% | ×1.0 | Full product |
| Shade | 1M | 5% | ×1.1 | Gasless sweeps, 5/day |
| Dusk | 2.5M | 15% | ×1.25 | API key 60 req/min, saved receipts |
| Night | 5M | 35% | ×1.5 | Order split from $1,000, API 300 req/min |
| Blackout | 10M | 50% | ×2.0 | Priority relay, unlimited sweeps, basket vote weight ×2 |

Stream multiplier is applied to a staker's share of the stock-token stream. Multipliers are funded from the same pool; they redistribute, they do not inflate.

## Lock options

| Lock | Effect |
|---|---|
| Flexible | Tier counts immediately, ×1.0 lock bonus |
| 90 days | ×1.15 lock bonus |
| 180 days | ×1.35 lock bonus |

Early unlock drops the tier immediately. No penalty burn: penalising exits makes the number look good and the product look bad.

## Governance

- Stakers vote on basket composition (which stock tokens, what weights) once a month.
- Proposals to change fee allocation require a 7-day timelock.
- Nothing else is governable. Contracts have no admin.

## Anti-gaming

- Only settled swap volume counts toward volume-based cashback.
- Round trips within one hour earn the base rate only.
- Self-referral is blocked by address graph.
- Tier is measured at stake time and re-checked at each payout epoch.

## What must be verified before this document is final

1. That a contract on Robinhood Chain can hold and transfer stock tokens (issuer transfer restrictions). If not, the vault pays a redeemable claim rather than the token directly.
2. The launchpad's exact creator-fee claim mechanics (escrow claim cadence, gas).
3. Legal review of paying stock-token rewards to anonymous stakers in each target jurisdiction.
