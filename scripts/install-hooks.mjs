/** Installs the git pre-push hook. Run once per clone: npm run hooks:install */
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

if (!existsSync(join(process.cwd(), ".git"))) {
  console.error("not a git repository");
  process.exit(1);
}
const hooksDir = join(process.cwd(), ".git", "hooks");
mkdirSync(hooksDir, { recursive: true });
const hook = join(hooksDir, "pre-push");
writeFileSync(
  hook,
  `#!/bin/sh
# Installed by scripts/install-hooks.mjs. Rules: docs/PUSH_RULES.md
node scripts/prepush-check.mjs || exit 1
`,
);
try {
  chmodSync(hook, 0o755);
} catch {
  /* windows: git for windows runs sh hooks without the mode bit */
}
console.log(`installed ${hook}`);
