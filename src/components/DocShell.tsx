import Link from "next/link";
import { ArrowIcon } from "@/components/Icons";

export type TocItem = { id: string; label: string };

/**
 * Two-column reading layout used by /docs and /whitepaper. The table of
 * contents is a plain anchor list: sticky beside the text on desktop, a
 * scrollable chip row at the top on mobile. No JavaScript involved.
 */
export function DocShell({
  eyebrow,
  title,
  lead,
  meta,
  toc,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  meta?: React.ReactNode;
  toc: TocItem[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 grid-bg" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-20">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display mt-4 text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-fog">{lead}</p>
          {meta && <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-fog-2">{meta}</div>}
        </div>
      </header>

      <div className="mx-auto max-w-6xl gap-12 px-4 py-12 lg:grid lg:grid-cols-[15rem_1fr]">
        <nav aria-label="On this page" className="mb-10 lg:mb-0">
          <div className="lg:sticky lg:top-24">
            <p className="eyebrow mb-3 hidden lg:block">On this page</p>
            <ul className="-mx-1 flex gap-2 overflow-x-auto pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
              {toc.map((t) => (
                <li key={t.id} className="shrink-0">
                  <a
                    href={`#${t.id}`}
                    className="block whitespace-nowrap rounded-lg border border-white/8 px-3 py-2 text-sm text-fog transition-colors hover:border-white/15 hover:text-paper lg:border-0 lg:border-l lg:border-line lg:whitespace-normal lg:rounded-none lg:rounded-r-lg hover:lg:border-mask"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 hidden lg:block">
              <Link href="/app" className="btn btn-primary w-full text-sm">
                Open the app <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

/** A titled section with a stable anchor. */
export function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/8 py-12 first:border-0 first:pt-0">
      <h2 className="display text-2xl sm:text-3xl">{title}</h2>
      <div className="mt-6 grid gap-5 text-[0.95rem] leading-relaxed text-fog">{children}</div>
    </section>
  );
}

export function Code({ children }: { children: string }) {
  return (
    <pre className="card overflow-x-auto p-5 text-xs leading-relaxed">
      <code className="mono whitespace-pre text-paper/90">{children}</code>
    </pre>
  );
}

export function Note({ tone = "mask", children }: { tone?: "mask" | "warn"; children: React.ReactNode }) {
  const color = tone === "warn" ? "var(--color-warn)" : "var(--color-mask)";
  return (
    <div
      className="rounded-xl border px-5 py-4 text-sm"
      style={{
        borderColor: `color-mix(in oklab, ${color} 30%, transparent)`,
        background: `color-mix(in oklab, ${color} 7%, transparent)`,
      }}
    >
      {children}
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="text-left text-fog">
            <tr className="border-b border-white/8">
              {head.map((h) => (
                <th key={h} className="px-5 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                {r.map((cell, j) => (
                  <td key={j} className="px-5 py-3 align-top text-fog first:text-paper">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
