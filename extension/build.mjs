/**
 * Bundles the extension into extension/dist with esbuild. Run: npm run build:extension
 * Load extension/dist as an unpacked extension in Chrome (chrome://extensions, Developer mode).
 */
import { build } from "esbuild";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const common = {
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ["chrome116"],
  format: "esm",
  platform: "browser",
  logLevel: "info",
  define: { "process.env.NODE_ENV": '"production"' },
};

await build({ ...common, entryPoints: [join(here, "src/popup.ts")], outfile: join(out, "popup.js") });
await build({ ...common, entryPoints: [join(here, "src/background.ts")], outfile: join(out, "background.js") });
// The content script runs in the page world's isolated context; classic script, no ESM.
await build({ ...common, format: "iife", entryPoints: [join(here, "src/content.ts")], outfile: join(out, "content.js") });

copyFileSync(join(here, "manifest.json"), join(out, "manifest.json"));
copyFileSync(join(here, "src/popup.html"), join(out, "popup.html"));
console.log(`extension built into ${out}`);
