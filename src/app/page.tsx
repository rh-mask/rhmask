import Link from "next/link";
import { Badge } from "@/components/Badge";
import { BASKET } from "@/lib/tokens";

const pillars = [
  {
    title: "Ghost Receive",
    body: "Publish one meta-address. Every payment lands on a fresh address nobody can link back to you. Stealth addresses, derived in your browser.",
    status: "beta",
  },
  {
    title: "Private Pay",
    body: "Request a payment as a QR. The payer scans it, funds land on a one-time address, and a receipt QR lets you claim and sweep. Keys encrypted on your device.",
    status: "beta",
  },
  {
    title: "Mask Swap",
    body: "Route swaps through private fills instead of public order books. Real venue name and flat fee printed before you send.",
    status: "beta",
  },
  {
    title: "Blue Chip Vault",
    body: "Stake $MASK. Protocol revenue buys stock tokens and streams them to stakers. Paid in NVDA and SPY, not in more $MASK.",
    status: "planned",
  },
  {
    title: "Proof Ledger",
    body: "Every payout has a transaction hash on a public page. If it is not on the ledger, it did not happen.",
    status: "planned",
  },
];

const steps = [
  ["01", "Generate keys", "Two keys, generated locally. Share the meta-address, keep the spending key."],
  ["02", "Receive unseen", "Senders derive a one-time address from your meta-address. Balances never pile up on one wallet."],
  ["03", "Trade unseen", "Quotes come from private fills. Your order never sits in a public book or mempool as a visible swap."],
  ["04", "Get paid in stocks", "Stake $MASK. Revenue converts to stock tokens on-chain and streams to you, hash by hash."],
];

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:pt-28">
          <div className="flex gap-2 mb-6">
            <Badge tone="mask">Robinhood Chain</Badge>
            <Badge>Non-custodial</Badge>
            <Badge>No account</Badge>
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            Wall Street sees everything.
            <br />
            <span className="text-mask">RhMask sees nothing.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-fog">
            Tokenized stocks put the market on a public ledger. Your entries, your exits, your whole bag, visible to
            anyone. RhMask is the privacy layer: receive unseen, trade unseen, and earn real stock tokens for
            holding the line.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className="btn btn-primary">Open app</Link>
            <Link href="/#how" className="btn btn-ghost">How it works</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="product">
        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <Badge tone={p.status === "beta" ? "mask" : "warn"}>{p.status}</Badge>
              </div>
              <p className="mt-3 text-fog">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="how">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([n, title, body]) => (
            <li key={n} className="card p-5">
              <span className="mono text-mask">{n}</span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-fog">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="token">
        <div className="card p-6 sm:p-10 grid gap-8 lg:grid-cols-2">
          <div>
            <Badge tone="mask">$MASK</Badge>
            <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">
              A token that pays you in someone else&apos;s stock.
            </h2>
            <p className="mt-4 text-fog">
              $MASK buys access and fee discounts. It never buys route quality. Stake it and the vault pays you in a
              basket of stock tokens funded by protocol revenue. Every trade of $MASK and every routed swap feeds the
              same vault.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-mask">▸</span> Fixed supply. No mint. No admin keys.</li>
              <li className="flex gap-2"><span className="text-mask">▸</span> Fair launch on a public bonding curve. No presale, no team allocation.</li>
              <li className="flex gap-2"><span className="text-mask">▸</span> Rewards paid in stock tokens, on-chain, with a hash.</li>
              <li className="flex gap-2"><span className="text-mask">▸</span> Holders vote which stocks enter the basket.</li>
            </ul>
          </div>
          <div className="grid gap-3 content-start">
            <p className="text-sm text-fog">Launch basket</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BASKET.map((t) => (
                <div key={t.symbol} className="rounded-xl border border-line bg-ink-3 p-3">
                  <p className="font-semibold">{t.symbol}</p>
                  <p className="text-xs text-fog">{t.name}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-fog/70 mt-2">
              Basket composition is governed by stakers after launch. Stock tokens are issued by a third party.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="status">
        <h2 className="text-2xl font-semibold tracking-tight">Honest status</h2>
        <p className="mt-3 text-fog max-w-2xl">
          We publish what is live and what is not. Anything marked planned has no on-chain effect yet, and nothing on
          this site is estimated or back-filled.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-fog">
              <tr className="border-b border-line">
                <th className="py-2 pr-4 font-medium">Surface</th>
                <th className="py-2 pr-4 font-medium">State</th>
                <th className="py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Ghost Receive (keys, meta-address QR, derivation, claim, sweep)", "beta", "Client-side. Receipt QR stands in for the announcer contract until it ships."],
                ["Private Pay (request QR, send, receipt QR)", "beta", "Client-side. Sends through your own wallet on Robinhood Chain."],
                ["Mask Swap quotes", "beta", "Private fills via intent router. Native on-chain route in progress."],
                ["Blue Chip Vault", "planned", "Contract written after audit scope is fixed. No payouts yet."],
                ["Proof Ledger", "planned", "Ships with the vault. Empty until the first payout."],
                ["$MASK token", "planned", "Fair launch date announced on X before deployment."],
              ].map(([s, state, note]) => (
                <tr key={s} className="border-b border-line/60">
                  <td className="py-3 pr-4">{s}</td>
                  <td className="py-3 pr-4"><Badge tone={state === "beta" ? "mask" : "warn"}>{state}</Badge></td>
                  <td className="py-3 text-fog">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
