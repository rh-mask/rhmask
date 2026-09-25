/**
 * Every caption in marketing/ must have its poster rendered beside it, so a
 * file can be read top to bottom and posted from directly. Run: npm run check:captions
 *
 * The rendered JPEGs are deliberately untracked, so a fresh clone and CI have
 * none of them. The check therefore only runs where posters actually exist,
 * and is a no-op otherwise.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const MARKETING = join(ROOT, "marketing");
const POSTERS = join(MARKETING, "posters");
const REF = /rhmask-(p\d{2})\.jpg/g;

if (!existsSync(MARKETING)) {
  console.log("captions: no marketing directory, nothing to check");
  process.exit(0);
}

const onDisk = new Set(
  (existsSync(POSTERS) ? readdirSync(POSTERS) : []).filter((f) => f.endsWith(".jpg")),
);

if (onDisk.size === 0) {
  console.log("captions: no rendered posters here (untracked), skipping");
  process.exit(0);
}

/** Every .md under marketing/, at any depth. */
function markdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? markdown(join(dir, e.name)) : e.name.endsWith(".md") ? [join(dir, e.name)] : [],
  );
}

const missing = [];
const referenced = new Set();

for (const file of markdown(MARKETING)) {
  const text = readFileSync(file, "utf8");
  for (const [full, id] of text.matchAll(REF)) {
    referenced.add(id);
    if (!onDisk.has(full)) {
      const line = text.slice(0, text.indexOf(full)).split("\n").length;
      missing.push(`${relative(ROOT, file)}:${line}  names ${full}, which is not in marketing/posters/`);
    }
  }
}

if (missing.length) {
  console.error("captions: a caption names a poster that has not been rendered\n");
  for (const m of [...new Set(missing)]) console.error(`  ${m}`);
  console.error("\nRender the poster, or remove the caption. Captions do not ship ahead of their image.");
  process.exit(1);
}

/** Not a failure: a poster with no caption yet is work in progress, not a broken file. */
const uncaptioned = [...onDisk]
  .map((f) => f.match(/rhmask-(p\d{2})\.jpg/)?.[1])
  .filter((id) => id && !referenced.has(id))
  .sort();

console.log(`captions: ${referenced.size} captions, every poster present`);
if (uncaptioned.length) console.log(`captions: rendered but not yet captioned: ${uncaptioned.join(", ")}`);
