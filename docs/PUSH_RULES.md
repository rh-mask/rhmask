# Push rules

Everything that reaches the public repository passes through `npm run check`. The same script runs in CI
(`.github/workflows/ci.yml`) and as a local `pre-push` hook (`npm run hooks:install`, once per clone).
A push that fails any rule is refused. There is no override flag on purpose.

## The rules

1. **Human contributors only.** Every commit's author, committer and message body must be free of AI assistant
   identities and free of co-author trailers. The public contributor list is the people who own this project,
   nobody else. Commits are authored with the repo-local identity (`git config user.name` / `user.email`), never a
   global one that belongs to another account.
2. **No private files.** `internal/`, `.env*` (except `.env.example`), `.vercel/`, `node_modules/`, `.next/`,
   keys and certificates are never tracked.
3. **No rendered binaries.** Poster JPEGs and the trailer MP4 are build output, not source: they are
   regenerated from HTML, so they are gitignored. A clone should carry code, not eighteen megabytes of
   campaign artwork. Small site assets under `public/` are the exception, because the site serves them.
4. **No retired brand names**, in a file *or* in a commit message. The gate checks both; it used to check
   only files, which is how one rebrand commit kept the old name in its body.
5. **No foreign brands in public text.** README, LICENSE, `docs/`, `marketing/`, `src/`, `scripts/`, `contracts/`,
   `public/` and `.github/` are scanned, case-insensitively, for:
   - the previous project name and its derived names (so a rebrand never leaks half-done),
   - AI attribution words,
   - every term in `internal/forbidden-terms.txt` (gitignored; competitor and third-party product names go there,
     one per line, so the list itself is never published).
6. **Typecheck, lint, crypto round-trips, production build** all pass. `--fast` skips the build for quick local
   loops; the hook and CI always run the full set.

## Commit style

- One change per commit. A rebrand, a bug fix, a new doc, a config tweak are four commits, not one.
  Small commits make `git bisect` useful and make the history read like a changelog.
- Subject line in imperative mood, under 60 characters, no trailing period. Body explains why, not what.
- No trailers of any kind (no sign-off lines, no co-author lines).
- Never amend or rewrite a commit that has already been pushed.

## Before the first push to a new remote

```
git remote add origin <url>
npm run hooks:install
npm run check
git push -u origin main
```

If rule 1 fails on historical commits, rewrite the messages before the first push (the history is still local),
dropping every line that matches the `AI_PATTERN` regex defined at the top of `scripts/prepush-check.mjs`:

```
git filter-branch -f --msg-filter 'grep -viE "<AI_PATTERN>"' -- --all
```

then run `npm run check` again.
