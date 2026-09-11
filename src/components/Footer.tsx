import Link from "next/link";
import { EXPLORER_URL } from "@/lib/chain";

export function Footer() {
  return (
    <footer className="border-t border-line/70 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-sm text-fog">
        <p>VeilStreet · Robinhood Chain (4663)</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/app" className="hover:text-paper">App</Link>
          <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="hover:text-paper">Explorer</a>
          <Link href="/#status" className="hover:text-paper">Status</Link>
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-fog/70">
        VeilStreet is non-custodial software. It does not hold funds, does not provide investment advice, and does not
        guarantee execution, rates, or settlement times. Stock Tokens are issued by a third party and may be
        unavailable in your jurisdiction.
      </p>
    </footer>
  );
}
