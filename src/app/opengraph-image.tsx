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
          background: "#000000",
          color: "#ffffff",
          fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="58" height="58" viewBox="0 0 32 32">
            <rect x="1" y="1" width="30" height="30" fill="#ccff00" />
            <path
              d="M6 12.5c0-2 2-3.5 10-3.5s10 1.5 10 3.5c0 5-3 9.5-6 9.5-2 0-3-1.5-4-1.5s-2 1.5-4 1.5c-3 0-6-4.5-6-9.5z"
              fill="#000000"
            />
            <ellipse cx="11.5" cy="15" rx="2.6" ry="1.7" fill="#ccff00" />
            <ellipse cx="20.5" cy="15" rx="2.6" ry="1.7" fill="#ccff00" />
          </svg>
          <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.2 }}>rhmask</span>
          <span
            style={{
              marginLeft: 14,
              fontSize: 19,
              fontWeight: 600,
              color: "#ccff00",
              border: "2px solid #ccff00",
              borderRadius: 999,
              padding: "7px 18px",
              letterSpacing: 1.2,
            }}
          >
            ROBINHOOD CHAIN
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 80, letterSpacing: -3, fontWeight: 800, lineHeight: 1.02 }}>
            Wall Street sees everything.
          </span>
          <span style={{ fontSize: 80, letterSpacing: -3, fontWeight: 800, lineHeight: 1.02, color: "#ccff00" }}>
            RhMask sees nothing.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 25,
            color: "#9b9ea4",
            borderTop: "1px solid #26282b",
            paddingTop: 28,
          }}
        >
          <span>Receive unseen. Pay unseen. Get paid in stocks.</span>
          <span style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <span style={{ fontFamily: "ui-monospace, monospace", color: "#ffffff" }}>$MASK</span>
            <span style={{ color: "#ccff00" }}>rhmask.org</span>
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
