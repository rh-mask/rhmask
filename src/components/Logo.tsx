export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#b8ff5c" />
      <path d="M8 9l8 14 8-14" fill="none" stroke="#07080b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 9h10" stroke="#07080b" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}
