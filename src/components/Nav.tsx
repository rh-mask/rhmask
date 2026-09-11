import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Nav() {
  return (
    <header className="border-b border-line/70 bg-ink/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo className="h-6 w-6" />
          VeilStreet
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/#how" className="px-3 py-1.5 rounded-lg text-fog hover:text-paper">
            How it works
          </Link>
          <Link href="/#token" className="px-3 py-1.5 rounded-lg text-fog hover:text-paper">
            Token
          </Link>
          <Link href="/app" className="btn btn-primary py-1.5! px-3.5! text-sm">
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}
