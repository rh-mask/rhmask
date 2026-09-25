# Contributing

Thanks for looking. RhMask is small on purpose, and the rules are short.

Joining to work on the interface? Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first. It has the invariants, the
handful of rules that are product promises rather than style, and an honest list of what is unfinished.

## Before you push

1. `npm run hooks:install` once per clone. It installs the `pre-push` hook.
2. `npm run check` before opening a pull request. CI runs the same script; a red hook is a red PR.
3. Read [`docs/PUSH_RULES.md`](docs/PUSH_RULES.md). The rules that surprise people:
   - one change per commit, imperative subject under 60 characters, no trailers of any kind;
   - human contributors only, no AI identities in author, committer or message;
   - no third-party brand names in public text (the pre-push gate scans for them);
   - nothing under `internal/`, no `.env*`, no keys.

## What a good pull request looks like

- One concern. A bug fix and a refactor are two PRs.
- A sentence on why, not a paragraph on what. The diff says what.
- Anything that touches `src/lib/stealth.ts`, `src/lib/keystore.ts` or `src/lib/transfer.ts` comes with a check
  script change or a new one. Crypto and money paths do not merge on trust.
- Public claims (README, landing copy, narrative) change only when the status table can back them.

## Running the checks

| Command | Scope |
|:--|:--|
| `npm run check:fast` | history, files, forbidden terms, typecheck, lint, stealth and payment round-trips |
| `npm run check` | the above plus the production build |
| `npm run check:onchain` | read-only mainnet verification; needs network access |

## Reporting a security issue

Do not open a public issue. See [`SECURITY.md`](SECURITY.md).
