# Security

## Reporting

Email **admin@rhmask.org** with the subject `security: <short title>`. Include steps to reproduce and, if it
concerns funds, the chain, the addresses and the transaction hashes involved. You will get a reply within 72 hours.

Please do not open a public issue for anything that could put user funds or keys at risk, and please do not run
tests against other people's stealth addresses or balances.

## Scope

- Key generation, derivation and recognition (`src/lib/stealth.ts`)
- Local key storage and encryption (`src/lib/keystore.ts`)
- Transfer building, pre-flight and sweep (`src/lib/transfer.ts`)
- Payment request and receipt parsing (`src/lib/payment.ts`)
- Server routes under `src/app/api/`, in particular the RPC pass-through and the quote handler

## Out of scope

- The issuer's stock token contracts and the chain itself
- Third-party venues that fill swaps
- Browser extensions or wallets you install yourself

## Design notes worth knowing before you dig

- The server never sees a private key and never holds funds. Secrets live in server-only env vars.
- Stealth keys are generated in the browser. At rest they are either plaintext in `localStorage` (beta default)
  or AES-256-GCM under a PBKDF2-SHA256 passphrase key. Decrypted keys live in memory only.
- The RPC pass-through allows read methods and `eth_sendRawTransaction` only, caps batches and bounds
  `eth_getLogs` ranges.
- Every public claim about what is hidden is paired with what is not hidden. If you find a place where that is not
  true, that is a valid report too.
