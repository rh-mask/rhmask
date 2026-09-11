export function Badge({ tone = "fog", children }: { tone?: "fog" | "veil" | "warn"; children: React.ReactNode }) {
  const cls =
    tone === "veil"
      ? "border-veil/40 text-veil"
      : tone === "warn"
        ? "border-warn/40 text-warn"
        : "border-line text-fog";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}
