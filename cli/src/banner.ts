/**
 * The brand mark in the terminal. Drawn with box-drawing and block glyphs, so
 * it needs a UTF-8 terminal but no fonts and no images. Colour is a lime-to-aqua
 * gradient in truecolor; with colour off the art still reads, which is the test.
 */
import { c, isPlain } from "./ui.ts";

export const VERSION = "0.1.0";

/** The mask itself: a block with two eye slits, the same shape as the favicon. */
const MARK = [
  "▄▄▄▄▄▄▄▄▄▄▄▄▄",
  "█  ▀▀   ▀▀  █",
  "▀▀▀▀▀▀▀▀▀▀▀▀▀",
];

const WORDMARK = [
  "██████╗ ██╗  ██╗███╗   ███╗ █████╗ ███████╗██╗  ██╗",
  "██╔══██╗██║  ██║████╗ ████║██╔══██╗██╔════╝██║ ██╔╝",
  "██████╔╝███████║██╔████╔██║███████║███████╗█████╔╝ ",
  "██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║╚════██║██╔═██╗ ",
  "██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║███████║██║  ██╗",
  "╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝",
];

/** #ccff00 to #33d6e6, one step per line. */
function gradient(line: string, i: number, total: number) {
  if (isPlain) return line;
  const t = total === 1 ? 0 : i / (total - 1);
  const r = Math.round(204 + (51 - 204) * t);
  const g = Math.round(255 + (214 - 255) * t);
  const b = Math.round(0 + (230 - 0) * t);
  return `\x1b[38;2;${r};${g};${b}m${line}\x1b[39m`;
}

/**
 * The full banner. Shown for bare `rhmask` and `--help`; every other command
 * gets the one-liner, so output stays pipeable and quiet.
 */
export function banner() {
  const pad = "  ";
  const markPad = " ".repeat(2 + Math.floor((51 - 13) / 2));
  const lines = [
    "",
    ...MARK.map((l, i) => markPad + gradient(l, i, MARK.length)),
    "",
    ...WORDMARK.map((l, i) => pad + gradient(l, i, WORDMARK.length)),
    "",
    pad + c.fog("privacy layer for tokenized stocks") + c.fog2("  ·  ") + c.fog("robinhood chain 4663"),
    pad + c.fog2(`v${VERSION}  ·  keys never leave this machine  ·  rhmask.org`),
    "",
  ];
  return lines.join("\n");
}

/** One line, for every command that actually prints something useful after it. */
export function tag() {
  return c.mask("▄▀▄ rhmask") + c.fog2(`  v${VERSION}`);
}
