import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GitHubIcon, TelegramIcon, XIcon } from "@/components/Icons";
import { SITE } from "@/lib/site";
import { EXPLORER_URL, ROBINHOOD_CHAIN_ID } from "@/lib/chain";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/app#receive", label: "Ghost Receive" },
      { href: "/app#pay", label: "Private Pay" },
      { href: "/app#swap", label: "Mask Swap" },
      { href: "/app#vault", label: "Blue Chip Vault" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/whitepaper", label: "Whitepaper" },
      { href: "/#how", label: "How it works" },
      { href: "/docs#security", label: "Security model" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-7 w-7" />
              <span className="text-lg font-bold tracking-tight">rhmask</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-fog">
              The privacy layer for tokenized stocks. Receive unseen, pay unseen, and get paid in real stock tokens.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={SITE.x.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`RhMask on X, ${SITE.x.handle}`}
                className="btn btn-ghost px-3! py-2!"
              >
                <XIcon className="h-4 w-4" />
              </a>
              <a
                href={SITE.github.url}
                target="_blank"
                rel="noreferrer"
                aria-label="RhMask on GitHub"
                className="btn btn-ghost px-3! py-2!"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
              <a
                href={SITE.telegram.url}
                target="_blank"
                rel="noreferrer"
                aria-label="RhMask on Telegram"
                className="btn btn-ghost px-3! py-2!"
              >
                <TelegramIcon className="h-4 w-4" />
              </a>
              <span className="ml-1 text-xs text-fog-2">{SITE.x.handle}</span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-fog transition-colors hover:text-paper">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="eyebrow">Network</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-fog">
                <span className="pulse-dot relative inline-block h-1.5 w-1.5 rounded-full bg-mask text-mask" aria-hidden="true" />
                Robinhood Chain · {ROBINHOOD_CHAIN_ID}
              </li>
              <li>
                <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="text-fog transition-colors hover:text-paper">
                  Block explorer
                </a>
              </li>
              <li>
                <a href={SITE.github.url} target="_blank" rel="noreferrer" className="text-fog transition-colors hover:text-paper">
                  Source code
                </a>
              </li>
              <li>
                <a
                  href={`${SITE.github.url}/blob/main/SECURITY.md`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-fog transition-colors hover:text-paper"
                >
                  Report a vulnerability
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="rule my-10" />

        <div className="flex flex-col gap-4 text-xs text-fog-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name} · {SITE.domain}
          </p>
          <p className="max-w-2xl sm:text-right">
            Non-custodial software. It does not hold funds, does not provide investment advice, and does not guarantee
            execution, rates, or settlement times. Stock tokens are issued by a third party and may be unavailable in
            your jurisdiction.
          </p>
        </div>
      </div>
    </footer>
  );
}
