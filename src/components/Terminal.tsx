/** A terminal window: title bar with a path, body in the pane below. */
export function Terminal({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center gap-3 border-b border-line-2 px-4 py-2.5 text-xs text-fog">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn" />
          <span className="h-2.5 w-2.5 rounded-full bg-mask" />
        </span>
        <span className="truncate">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** One shell line: `$ command`. */
export function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm">
      <span className="text-mask">$</span> <span className="text-paper">{children}</span>
    </p>
  );
}
