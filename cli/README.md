<div align="center">

```
 ▄▄▄▄▄▄▄▄▄▄▄▄▄
 █  ▀▀   ▀▀  █
 ▀▀▀▀▀▀▀▀▀▀▀▀▀

██████╗ ██╗  ██╗███╗   ███╗ █████╗ ███████╗██╗  ██╗
██╔══██╗██║  ██║████╗ ████║██╔══██╗██╔════╝██║ ██╔╝
██████╔╝███████║██╔████╔██║███████║███████╗█████╔╝
██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║╚════██║██╔═██╗
██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║███████║██║  ██╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
```

**Stealth addresses and private payment requests, from your terminal.**

[Website](https://rhmask.org) · [Docs](https://rhmask.org/docs) · [Source](https://github.com/rh-mask/rhmask)

</div>

---

```bash
npx rhmask
```

No install, no account, no API key. The same ERC-5564 derivation the web app and the browser extension use,
with a terminal in front of it instead of a browser.

## What it does, and what it deliberately cannot

**It cannot sign or broadcast a transaction.** There is no code path in this package that produces a signed
transaction, which is why it is safe to run on a machine you only half trust. It derives, it recognises,
and it reads.

| Command | | What it does |
|:--|:--|:--|
| `rhmask keys` | `offline` | Make a key set, or rebuild one from its two private keys |
| `rhmask address <meta>` | `offline` | Payer side: derive a one-time address for a recipient |
| `rhmask request --to <meta>` | `offline` | Print a payment request as a scannable QR in the terminal |
| `rhmask claim …` | `offline` | Check a receipt, and recover the key if it is yours |
| `rhmask verify` | `offline` | Prove the whole round-trip on this machine |
| `rhmask chain` | reads | Chain id, head block, whether the contracts are there |
| `rhmask balance <addr>` | reads | Native balance, and every stock token with `--tokens` |
| `rhmask tokens` | reads | Read the stock token registry from the chain itself |
| `rhmask scan --view … --spend …` | reads | Find stealth payments announced to your keys |

The five marked `offline` never open a socket. Pull the network cable and they still work, which is the
only honest way to ship something that touches key material.

## A payment in three commands

```bash
# You, once. Publish the meta-address; keep the two private keys.
npx rhmask keys

# You, per invoice. Prints a QR your payer can scan off the screen.
npx rhmask request --to st:eth:0x… --token NVDA --amount 1.5

# You, after they pay. Finds it on chain and gives you the key that spends it.
npx rhmask scan --view 0x… --spend 0x…
```

The payer never runs anything of ours. Their wallet pays an ordinary address that their own device derived.

## Options

| | |
|:--|:--|
| `--network mainnet\|testnet` | Which chain to read. Default `mainnet`, id 4663. |
| `--json` | Machine-readable output, for piping. Every command supports it. |
| `--no-color` | Plain text. `NO_COLOR` and a non-TTY stdout do the same thing. |
| `RHMASK_RPC_URL` | Point at your own node, and nobody sees your reads but you. |

## If your network blocks the chain's RPC

Some ISPs hijack the chain's RPC domain, which makes a perfectly healthy endpoint look dead. The CLI
notices the system resolver disagreeing with DNS-over-HTTPS, pins the correct address, and tells you it
did. TLS still verifies the real hostname, so pinning cannot be used to feed you a different server.

## What this does not hide

Settlement is public: the chain is a public ledger and a stealth address does not change that. Whoever
serves your RPC sees which addresses you ask about — point `RHMASK_RPC_URL` at your own node if that
matters to you. Never "anonymous", never "untraceable".

## Security

Private keys are printed to your terminal and never leave the process. There is no telemetry, no update
check, and no network call in any command marked `offline`. Report anything that looks wrong at
[github.com/rh-mask/rhmask/issues](https://github.com/rh-mask/rhmask/issues).

The two contracts this reads are **not audited**.

## License

MIT.
