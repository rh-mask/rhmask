import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RhMask. Wall Street sees everything. RhMask sees nothing.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card for X / OG. Rendered at build time; no external assets. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#07080b",
          color: "#eef0f5",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect x="2" y="2" width="28" height="28" rx="7" fill="#b8ff5c" />
            <path
              d="M6 12c0-2 2-3.5 10-3.5s10 1.5 10 3.5c0 5-3 9.5-6 9.5-2 0-3-1.5-4-1.5s-2 1.5-4 1.5c-3 0-6-4.5-6-9.5z"
              fill="#07080b"
            />
            <ellipse cx="11.5" cy="14.5" rx="2.6" ry="1.7" fill="#b8ff5c" />
            <ellipse cx="20.5" cy="14.5" rx="2.6" ry="1.7" fill="#b8ff5c" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>RhMask</span>
          <span
            style={{
              marginLeft: 12,
              fontSize: 20,
              color: "#b8ff5c",
              border: "2px solid rgba(184,255,92,0.4)",
              borderRadius: 999,
              padding: "6px 16px",
            }}
          >
            ROBINHOOD CHAIN
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
            Wall Street sees everything.
          </span>
          <span style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, color: "#b8ff5c" }}>
            RhMask sees nothing.
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#8b90a0" }}>
          <span>Receive unseen. Trade unseen. Get paid in stocks.</span>
          <span style={{ fontFamily: "ui-monospace, monospace" }}>$MASK</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
