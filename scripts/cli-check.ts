/**
 * Proves the CLI actually works, not just that it compiles. Run: npm run check:cli
 *
 * The interesting one is the QR: the rendered half-block art is parsed back into
 * a module matrix, upscaled to a bitmap and decoded with the same scanner the
 * web app uses. If the terminal output is not scannable by a phone, this fails.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import jsQR from "jsqr";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "cli", "dist", "rhmask.mjs");

if (!existsSync(bundle)) {
  const built = spawnSync(process.execPath, [join(root, "cli", "build.mjs")], { cwd: root, stdio: "inherit" });
  if (built.status !== 0) throw new Error("cli build failed");
}

let failures = 0;
function assert(condition: boolean, label: string) {
  console.log(`${condition ? "ok  " : "FAIL"} ${label}`);
  if (!condition) failures++;
}

/** Run the CLI as a user would, with colour forced so the QR draws. */
function cli(args: string[], colour = false) {
  return execFileSync(process.execPath, [bundle, ...args], {
    encoding: "utf8",
    env: colour ? { ...process.env, FORCE_COLOR: "1" } : { ...process.env, NO_COLOR: "1" },
  });
}

// --- offline key commands -------------------------------------------------
const keys = JSON.parse(cli(["keys", "--json"]));
assert(/^st:eth:0x[0-9a-f]{132}$/i.test(keys.metaAddress), "keys prints a well-formed meta-address");
assert(/^0x[0-9a-f]{64}$/i.test(keys.spendingKey) && /^0x[0-9a-f]{64}$/i.test(keys.viewingKey), "keys prints two 32-byte private keys");

const restored = JSON.parse(cli(["keys", "--spend", keys.spendingKey, "--view", keys.viewingKey, "--json"]));
assert(restored.metaAddress === keys.metaAddress, "the same private keys rebuild the same meta-address");

const derived = JSON.parse(cli(["address", keys.metaAddress, "--json"]));
assert(/^0x[0-9a-f]{40}$/i.test(derived.stealthAddress), "address derives a one-time address");

const claimed = JSON.parse(
  cli(["claim", "--spend", keys.spendingKey, "--view", keys.viewingKey, "--addr", derived.stealthAddress, "--eph", derived.ephemeralPublicKey, "--tag", String(derived.viewTag), "--json"]),
);
assert(claimed.mine === true && /^0x[0-9a-f]{64}$/i.test(claimed.stealthPrivateKey), "claim recovers the stealth private key for the owner");

const stranger = JSON.parse(cli(["keys", "--json"]));
const refused = spawnSync(process.execPath, [bundle, "claim", "--spend", stranger.spendingKey, "--view", stranger.viewingKey, "--addr", derived.stealthAddress, "--eph", derived.ephemeralPublicKey, "--json"], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
assert(refused.status === 1 && JSON.parse(refused.stdout).mine === false, "claim refuses a stranger, and exits non-zero");

const verified = spawnSync(process.execPath, [bundle, "verify"], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
assert(verified.status === 0, "verify passes its own round-trip");

// --- the terminal QR ------------------------------------------------------
const out = cli(["request", "--to", keys.metaAddress, "--token", "NVDA", "--amount", "1.5"], true);
const rows = out.split("\n").filter((l) => l.startsWith("\x1b[30;107m")).map((l) => l.replace(/\x1b\[[0-9;]*m/g, ""));
assert(rows.length > 0, "request draws a QR block");

const w = rows[0]?.length ?? 0;
const h = rows.length * 2;
const modules: Uint8Array[] = Array.from({ length: h }, () => new Uint8Array(w));
rows.forEach((line, r) => {
  for (let x = 0; x < w; x++) {
    const ch = line[x];
    modules[r * 2][x] = ch === "█" || ch === "▀" ? 1 : 0;
    modules[r * 2 + 1][x] = ch === "█" || ch === "▄" ? 1 : 0;
  }
});

const SCALE = 4;
const W = w * SCALE;
const H = h * SCALE;
const pixels = new Uint8ClampedArray(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const value = modules[Math.floor(y / SCALE)][Math.floor(x / SCALE)] ? 0 : 255;
    const i = (y * W + x) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
}

const decoded = jsQR(pixels, W, H);
assert(decoded !== null, "the rendered QR decodes with the app's own scanner");
if (decoded) {
  const url = new URL(decoded.data);
  assert(url.searchParams.get("to") === keys.metaAddress, "the decoded QR carries the exact meta-address");
  assert(url.searchParams.get("token") === "NVDA" && url.searchParams.get("amount") === "1.5", "the decoded QR carries token and amount");
}
assert(w <= 80, `the QR fits an 80-column terminal (${w} columns)`);

// --- surface ---------------------------------------------------------------
const help = cli([]);
for (const name of ["keys", "address", "request", "claim", "verify", "chain", "balance", "tokens", "scan"]) {
  assert(help.includes(name), `help lists ${name}`);
}
const unknown = spawnSync(process.execPath, [bundle, "nope"], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
assert(unknown.status === 1 && /no "nope" command/.test(unknown.stderr), "an unknown command fails with a readable message");

console.log("");
if (failures) {
  console.error(`cli check: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`cli check: passed, QR ${w}x${h} modules decoded`);
