/**
 * Bundles the CLI into cli/dist/rhmask.mjs with esbuild. Run: npm run build:cli
 *
 * One file, no runtime dependencies, so `npx rhmask` fetches a single artifact
 * and nothing resolves a dependency tree on a stranger's machine. That is also
 * why the bundle is not minified: a CLI that handles key material should be
 * readable by the person running it.
 */
import { build } from "esbuild";
import { chmodSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const entry = join(out, "entry.mjs");
writeFileSync(
  entry,
  `import { main } from "${join(here, "src/index.ts").replace(/\\/g, "/")}";\nawait main(process.argv.slice(2));\n`,
);

await build({
  entryPoints: [entry],
  outfile: join(out, "rhmask.mjs"),
  bundle: true,
  minify: false,
  platform: "node",
  format: "esm",
  target: ["node20"],
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "info",
  // Resolve the shared .ts sources the app also uses, so the CLI cannot drift
  // from the browser implementation of the same derivation.
  resolveExtensions: [".ts", ".mjs", ".js", ".json"],
});

rmSync(entry);
chmodSync(join(out, "rhmask.mjs"), 0o755);

const kb = (statSync(join(out, "rhmask.mjs")).size / 1024).toFixed(0);
console.log(`cli: dist/rhmask.mjs  ${kb}KB  no runtime dependencies`);
