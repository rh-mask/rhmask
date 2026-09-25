/**
 * Terminal output helpers. Colour is truecolor when the terminal will take it,
 * and disappears entirely when it will not: piped output, NO_COLOR, dumb terms.
 * Everything here must stay readable with every escape stripped.
 */

const forced = process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== "0";

const plain =
  !forced &&
  (!process.stdout.isTTY ||
    process.env.NO_COLOR !== undefined ||
    process.env.TERM === "dumb" ||
    process.argv.includes("--no-color"));

function rgb(r: number, g: number, b: number) {
  return (s: string) => (plain ? s : `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m`);
}

/** The brand palette, the same tokens the site uses. */
export const c = {
  mask: rgb(204, 255, 0),
  aqua: rgb(51, 214, 230),
  amber: rgb(255, 176, 0),
  red: rgb(255, 80, 0),
  magenta: rgb(214, 112, 214),
  paper: rgb(230, 245, 232),
  fog: rgb(143, 163, 150),
  fog2: rgb(95, 112, 101),
  bold: (s: string) => (plain ? s : `\x1b[1m${s}\x1b[22m`),
  dim: (s: string) => (plain ? s : `\x1b[2m${s}\x1b[22m`),
};

export const isPlain = plain;

/** Visible width, ignoring escapes, so boxes line up when colour is on. */
export function width(s: string) {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

export function pad(s: string, n: number) {
  return s + " ".repeat(Math.max(0, n - width(s)));
}

/** A labelled box. Rows are [label, value] and align on the widest label. */
export function box(title: string, rows: Array<[string, string]>, accent = c.mask) {
  const labelW = Math.max(...rows.map(([l]) => width(l)));
  const bodyW = Math.max(width(title) + 2, ...rows.map(([, v]) => labelW + 2 + width(v)));
  const line = "─".repeat(bodyW + 2);
  const out = [accent(`┌─ ${title} ${line.slice(width(title) + 3)}`)];
  for (const [l, v] of rows) out.push(accent("│ ") + c.fog(pad(l, labelW)) + "  " + v);
  out.push(accent(`└${line}`));
  return out.join("\n");
}

export function rule(label = "") {
  const w = Math.min(process.stdout.columns || 80, 80);
  if (!label) return c.fog2("─".repeat(w));
  return c.fog2("── " + label + " " + "─".repeat(Math.max(0, w - width(label) - 4)));
}

export function ok(s: string) {
  return c.mask("  ok  ") + s;
}
export function warn(s: string) {
  return c.amber("  !   ") + s;
}
export function bad(s: string) {
  return c.red("  x   ") + s;
}

/** A fatal, readable error. No stack trace: the message is the product. */
export function die(message: string, hint?: string): never {
  process.stderr.write("\n" + c.red("error") + "  " + message + "\n");
  if (hint) process.stderr.write(c.fog2("hint") + "   " + hint + "\n");
  process.stderr.write("\n");
  process.exit(1);
}
