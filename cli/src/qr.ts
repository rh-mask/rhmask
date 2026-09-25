/**
 * QR in the terminal, drawn with half-block glyphs so one character row carries
 * two module rows and the code stays square on a normal terminal.
 *
 * It is printed as black modules on a white background, explicitly, because a
 * scanner needs the light quiet zone and most terminals are dark. Only the
 * matrix generator is borrowed; the renderer here touches no filesystem, which
 * is what keeps the bundle free of Node built-ins pulled in dynamically.
 */
import qr from "qrcode/lib/core/qrcode.js";

const FULL = "█"; // both module rows dark
const UPPER = "▀"; // top dark, bottom light
const LOWER = "▄"; // top light, bottom dark
const BLANK = " ";

/** Black on bright white, so the code reads on a dark terminal. */
const ON = "\x1b[30;107m";
const OFF = "\x1b[39;49m";

export type QrResult = { art: string; size: number; quietZone: number };

/**
 * Returns null when the code cannot fit the terminal width: a QR that wraps is
 * not a QR, so the caller prints the link instead of something unscannable.
 */
export function render(text: string, columns = process.stdout.columns || 80): QrResult | null {
  const code = qr.create(text, { errorCorrectionLevel: "M" });
  const size: number = code.modules.size;
  const data: Uint8Array = code.modules.data;
  const dark = (x: number, y: number) => x >= 0 && y >= 0 && x < size && y < size && !!data[y * size + x];

  // 4 is the specified quiet zone; 2 still scans off a screen and buys width.
  const quietZone = size + 8 <= columns ? 4 : size + 4 <= columns ? 2 : 0;
  if (!quietZone) return null;

  const lo = -quietZone;
  const hi = size + quietZone;
  const lines: string[] = [];

  for (let y = lo; y < hi; y += 2) {
    let line = "";
    for (let x = lo; x < hi; x++) {
      const top = dark(x, y);
      const bottom = dark(x, y + 1);
      line += top && bottom ? FULL : top ? UPPER : bottom ? LOWER : BLANK;
    }
    lines.push(ON + line + OFF);
  }

  return { art: lines.join("\n"), size, quietZone };
}
