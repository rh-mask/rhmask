"use client";

import { qrMatrix, qrPath } from "@/lib/qr";

/**
 * Inline SVG QR. Light quiet zone on purpose: scanners want contrast, the
 * dark UI does not provide it.
 */
export function QrCode({ value, size = 220, label }: { value: string; size?: number; label?: string }) {
  const m = qrMatrix(value);
  const quiet = 2;
  const view = m.size + quiet * 2;
  return (
    <svg
      viewBox={`0 0 ${view} ${view}`}
      width={size}
      height={size}
      role="img"
      aria-label={label ?? "QR code"}
      shapeRendering="crispEdges"
      className="rounded-xl"
    >
      <rect width={view} height={view} fill="#ffffff" />
      <path d={qrPath(m)} fill="#07080b" transform={`translate(${quiet} ${quiet})`} />
    </svg>
  );
}
