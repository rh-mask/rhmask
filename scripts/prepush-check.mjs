/**
 * Pre-push gate. Run: npm run check   (or automatically via the pre-push hook)
 *
 *   node scripts/prepush-check.mjs            full: history + files + terms + typecheck + lint + stealth + build
 *   node scripts/prepush-check.mjs --fast     skips the production build
 *
 * Every rule here is documented in docs/PUSH_RULES.md. Exit code 1 on any failure.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const fast = process.argv.includes("--fast");
const failures = [];
const ok = (msg) => console.log(`  ok   ${msg}`);
const fail = (msg) => {
  failures.push(msg);
  console.log(`  FAIL ${msg}`);
};
const git = (args) => execSync(`git ${args}`, { cwd: root, encoding: "utf8" }).trim();

// ---------------------------------------------------------------------------
// 1. Commit history: no AI identity anywhere in author, committer or trailers.
//    GitHub lists every co-author as a contributor; the list stays human.
// ---------------------------------------------------------------------------
console.log("\n[1/5] commit history");
const AI_PATTERN = /claude|anthropic|copilot|openai|chatgpt|co-authored-by/i;
let range = "HEAD";
try {
  const upstream = git("rev-parse --abbrev-ref --symbolic-full-name @{u}");
  range = `${upstream}..HEAD`;
} catch {
  /* no upstream yet: scan the whole branch */
}
const SEP = String.fromCharCode(31);
const END = String.fromCharCode(30);
const log = git(`log --format=%H${SEP}%an${SEP}%ae${SEP}%cn${SEP}%ce${SEP}%B${END} ${range}`);
const commits = log ? log.split(END).map((s) => s.trim()).filter(Boolean) : [];
let badCommits = 0;
for (const c of commits) {
  const [hash, an, ae, cn, ce, body] = c.split(SEP);
  const hit = [an, ae, cn, ce, body].find((v) => AI_PATTERN.test(v ?? ""));
  if (hit) {
    badCommits++;
    const line = hit.split("\n").find((l) => AI_PATTERN.test(l))?.trim();
    fail(`commit ${hash.slice(0, 8)} carries an AI identity or a co-author trailer: "${line}"`);
  }
}
if (badCommits === 0) ok(`${commits.length} commit(s) in ${range} are clean`);

// ---------------------------------------------------------------------------
// 2. Tracked files: nothing private, nothing generated.
// ---------------------------------------------------------------------------
console.log("\n[2/5] tracked files");
// Tracked plus untracked-but-not-ignored, so a new file is checked before its first commit.
const tracked = git("ls-files --cached --others --exclude-standard").split("\n").filter(Boolean);
const PRIVATE = [/^internal\//, /^\.env(?!\.example$)/, /^\.vercel\//, /^node_modules\//, /^\.next\//, /\.pem$/, /\.key$/];
const leaked = tracked.filter((f) => PRIVATE.some((re) => re.test(f)));
if (leaked.length) fail(`private or generated files are tracked: ${leaked.join(", ")}`);
else ok("no private or generated files tracked");

// ---------------------------------------------------------------------------
// 3. Public text: no old brand, no third-party brands, no AI attribution.
//    Generic terms live here; project-specific ones (competitor names) live in
//    internal/forbidden-terms.txt which is gitignored, one term per line.
// ---------------------------------------------------------------------------
console.log("\n[3/5] forbidden terms in public files");
const generic = ["veilstreet", "veil swap", "veilvault", "$veil", "claude", "anthropic", "co-authored-by"];
const extraFile = join(root, "internal", "forbidden-terms.txt");
const extra = existsSync(extraFile)
  ? readFileSync(extraFile, "utf8")
      .split("\n")
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && !l.startsWith("#"))
  : [];
if (!extra.length) console.log("  note internal/forbidden-terms.txt missing or empty; only generic terms checked");
const terms = [...new Set([...generic, ...extra])];
const PUBLIC = tracked.filter(
  (f) =>
    /^(README\.md|LICENSE|package\.json|docs\/|marketing\/|src\/|scripts\/|contracts\/|public\/|\.github\/)/.test(f) &&
    !/\.(png|jpg|svg|ico|lock)$/.test(f),
);
const hits = [];
for (const f of PUBLIC) {
  const text = readFileSync(join(root, f), "utf8").toLowerCase();
  for (const t of terms) {
    if (f === "scripts/prepush-check.mjs" && generic.includes(t)) continue; // this file defines the list
    let idx = text.indexOf(t);
    while (idx !== -1) {
      const line = text.slice(0, idx).split("\n").length;
      hits.push(`${f}:${line} "${t}"`);
      idx = text.indexOf(t, idx + t.length);
    }
  }
}
if (hits.length) hits.forEach((h) => fail(h));
else ok(`${PUBLIC.length} public files scanned, ${terms.length} terms, no hits`);

// ---------------------------------------------------------------------------
// 4/5. Toolchain: typecheck, lint, stealth round-trip, production build.
// ---------------------------------------------------------------------------
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
function run(label, args) {
  if (label) console.log(`\n${label}`);
  const r = spawnSync(npm, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) fail(`${args.join(" ")} exited ${r.status}`);
  else ok(args.join(" "));
}
run("[4/5] typecheck + lint + stealth", ["run", "typecheck"]);
run("", ["run", "lint"]);
run("", ["run", "check:stealth"]);
run("", ["run", "check:payment"]);
if (fast) console.log("\n[5/5] build skipped (--fast)");
else run("[5/5] production build", ["run", "build"]);

console.log("");
if (failures.length) {
  console.error(`${failures.length} check(s) failed. Push refused.`);
  process.exit(1);
}
console.log("all checks passed");
