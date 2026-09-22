const TONES = {
  fog: "border-white/12 text-fog bg-white/4",
  mask: "border-mask/35 text-mask bg-mask/8",
  aqua: "border-aqua/35 text-aqua bg-aqua/8",
  violet: "border-violet/35 text-violet bg-violet/8",
  pink: "border-pink/35 text-pink bg-pink/8",
  warn: "border-warn/35 text-warn bg-warn/8",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({ tone = "fog", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
