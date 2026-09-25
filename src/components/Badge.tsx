const TONES = {
  fog: "border-line-2 text-fog",
  mask: "border-mask/50 text-mask bg-mask/8",
  aqua: "border-aqua/50 text-aqua bg-aqua/8",
  violet: "border-violet/50 text-violet bg-violet/8",
  pink: "border-pink/50 text-pink bg-pink/8",
  warn: "border-warn/50 text-warn bg-warn/8",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({ tone = "fog", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      // No backdrop-filter here on purpose: badges repeat a dozen times per
      // page and a blurred backdrop on each one costs frames. See docs/ARCHITECTURE.md.
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-bold lowercase ${TONES[tone]}`}
    >
      [{children}]
    </span>
  );
}
