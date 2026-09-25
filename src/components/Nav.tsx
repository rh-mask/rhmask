"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { GitHubIcon, MenuIcon, TelegramIcon, XIcon } from "@/components/Icons";
import { NAV_LINKS, SITE } from "@/lib/site";

/**
 * Sticky solid header. Gains a hairline once the page scrolls, so the hero
 * stays clean at the top. Mobile gets a full-width
 * sheet instead of a cramped row.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A mobile sheet that stays open while the page scrolls under it is a trap.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 bg-ink transition-colors duration-300 ${
        scrolled ? "border-b border-line" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          <span className="cursor text-lg font-bold tracking-tight">rhmask</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm lowercase text-fog transition-colors hover:bg-ink-3 hover:text-mask"
            >
              ./{l.label}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />
          <a
            href={SITE.x.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`RhMask on X, ${SITE.x.handle}`}
            title={SITE.x.handle}
            className="rounded-full p-2 text-fog transition-colors hover:bg-ink-3 hover:text-paper"
          >
            <XIcon className="h-4 w-4" />
          </a>
          <a
            href={SITE.github.url}
            target="_blank"
            rel="noreferrer"
            aria-label="RhMask on GitHub"
            title={SITE.github.handle}
            className="rounded-full p-2 text-fog transition-colors hover:bg-ink-3 hover:text-paper"
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
          <a
            href={SITE.telegram.url}
            target="_blank"
            rel="noreferrer"
            aria-label="RhMask on Telegram"
            title={SITE.telegram.handle}
            className="rounded-full p-2 text-fog transition-colors hover:bg-ink-3 hover:text-paper"
          >
            <TelegramIcon className="h-4 w-4" />
          </a>
          <Link href="/app" className="btn btn-primary ml-2 px-4! py-2! text-sm">
            open app
          </Link>
        </nav>

        <button
          type="button"
          className="btn btn-ghost px-3! py-2! md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line bg-ink md:hidden"
      >
        <div className="mx-auto grid max-w-6xl gap-1 px-4 py-4">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-base lowercase text-fog transition-colors hover:bg-ink-3 hover:text-mask"
            >
              ./{l.label}
            </Link>
          ))}
          <Link href="/app" onClick={() => setOpen(false)} className="btn btn-primary mt-2">
            open app
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <a href={SITE.x.url} target="_blank" rel="noreferrer" className="btn btn-ghost flex-1 text-sm">
              <XIcon className="h-4 w-4" /> {SITE.x.handle}
            </a>
            <a href={SITE.github.url} target="_blank" rel="noreferrer" className="btn btn-ghost flex-1 text-sm">
              <GitHubIcon className="h-4 w-4" /> GitHub
            </a>
          </div>
          <a href={SITE.telegram.url} target="_blank" rel="noreferrer" className="btn btn-ghost mt-2 w-full text-sm">
            <TelegramIcon className="h-4 w-4" /> Telegram
          </a>
        </div>
      </div>
    </header>
  );
}
