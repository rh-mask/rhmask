export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" fill="#ccff00" />
      <path
        d="M6 12.5c0-2 2-3.5 10-3.5s10 1.5 10 3.5c0 5-3 9.5-6 9.5-2 0-3-1.5-4-1.5s-2 1.5-4 1.5c-3 0-6-4.5-6-9.5z"
        fill="#000"
      />
      <ellipse className="logo-eye" cx="11.5" cy="15" rx="2.6" ry="1.7" fill="#ccff00" />
      <ellipse className="logo-eye" cx="20.5" cy="15" rx="2.6" ry="1.7" fill="#ccff00" />
    </svg>
  );
}
