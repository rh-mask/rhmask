import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/Badge";
import { QrCode } from "@/components/QrCode";
import { ArrowIcon, CheckIcon, GhostIcon, LedgerIcon, QrIcon, SwapIcon, VaultIcon, XIcon } from "@/components/Icons";
import { BASKET } from "@/lib/tokens";
import { SITE } from "@/lib/site";

type Surface = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  status: "beta" | "planned";
  tone: BadgeTone;
  aura: string;
  points: string[];
};

const SURFACES: Surface[] = [
  {
    icon: GhostIcon,
    title: "Ghost Receive",
    body: "Publish one meta-address. Every payment lands on a fresh address nobody can link back to you.",
    status: "beta",
    tone: "mask",
    aura: "var(--color-mask)",
    points: ["ERC-5564 stealth addresses", "Keys generated in your browser", "Encrypted at rest with a passphrase"],
  },
  {
    icon: QrIcon,
    title: "Private Pay",
    body: "Show a QR, get paid on a one-time address, hand back a receipt QR. Three scans, no server in the middle.",
    status: "beta",
    tone: "aqua",
    aura: "var(--color-aqua)",
    points: ["Request, pay, claim, sweep", "Works from any wallet", "Scan with a plain phone camera"],
  },
  {
    icon: SwapIcon,
    title: "Mask Swap",
    body: "Route swaps through private fills instead of public order books. Venue and flat fee printed before you send.",
    status: "beta",
    tone: "violet",
    aura: "var(--color-violet)",
    points: ["189 assets across 35 chains", "Receive on a fresh stealth address", "Non-custodial, deposit goes to the venue"],
  },
  {
    icon: VaultIcon,
    title: "Blue Chip Vault",
    body: "Stake $MASK. Protocol revenue buys stock tokens and streams them to stakers, paid in NVDA and SPY.",
    status: "planned",
    tone: "pink",
    aura: "var(--color-pink)",
    points: ["Paid in stocks, not in more $MASK", "Funded from day one by the creator fee", "Holders vote the basket"],
  },
  {
    icon: LedgerIcon,
    title: "Proof Ledger",
    body: "Every payout listed with its transaction hash. If it is not on the ledger, it did not happen.",
    status: "planned",
    tone: "warn",
    aura: "var(--color-warn)",
    points: ["Nothing estimated, nothing back-filled", "Public feed anyone can mirror", "Ships with the vault"],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Generate your keys",
    body: "Two keys, made locally and never sent anywhere. Share the meta-address once, keep the spending key.",
    tone: "text-mask",
  },
  {
    n: "02",
    title: "Show a QR, get paid",
    body: "The payer scans it, derives a one-time address, and sends from any wallet. Your balance never piles up.",
    tone: "text-aqua",
  },
  {
    n: "03",
    title: "Claim with a scan",
    body: "Their receipt QR proves the payment is yours. Your viewing key finds it, your spending key unlocks it.",
    tone: "text-violet",
  },
  {
    n: "04",
    title: "Sweep, or get paid in stocks",
    body: "Move funds anywhere, or stake $MASK and receive a basket of stock tokens, hash by hash.",
    tone: "text-pink",
  },
];

const PROOFS = [
  { value: "5", label: "stock tokens verified receivable on a fresh stealth address" },
  { value: "189", label: "assets across 35 chains routable through private fills" },
  { value: "0", label: "servers that ever see a private key" },
  { value: "310k", label: "PBKDF2 rounds protecting keys at rest" },
];

const MECHANISMS = [
  { name: "ERC-5564", detail: "Stealth addresses with view tags", state: "live" },
  { name: "WebCrypto", detail: "PBKDF2 + AES-256-GCM at rest", state: "live" },
  { name: "ERC-6538", detail: "Meta-address registry", state: "planned" },
  { name: "WebAuthn PRF", detail: "Unlock with a passkey", state: "planned" },
  { name: "EIP-7702", detail: "Sponsored stealth sweeps", state: "planned" },
  { name: "ERC-7683", detail: "Intent-based private fills", state: "planned" },
];


const SAMPLE_QR = "https://rhmask.org/pay?to=st:eth:0x02b4f1c6a7d8e93f5a1c0b7d6e2f8a34c9d5b1e07f3a6c8d2b4e9f1a5c7d3b6e8f0&token=NVDA&amount=1.5";

export default function Landing() {
  return (
    <div>
      {/* ------------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -left-40 -top-32 h-[34rem] w-[34rem] opacity-60"
          style={{
            background: "radial-gradient(closest-side, color-mix(in oklab, var(--color-mask) 26%, transparent), transparent)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-20 sm:pt-16 lg:pt-20">
          {/* The headline spans the full column: at this size both sentences
              land on one line each, which is where the line gets its weight. */}
          <h1 className="display max-w-5xl text-[2rem] leading-[1.06] sm:text-5xl lg:text-[3.75rem]">
            <span className="block shine">Wall Street sees everything.</span>
            <span className="block gradient-lime">RhMask sees nothing.</span>
          </h1>

          <div className="mt-10 grid gap-12 lg:mt-12 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-16">
            <div>
              <p className="max-w-xl text-lg leading-relaxed text-fog">
                Tokenized stocks put the market on a public ledger. Your entries, your exits, your whole bag, readable
                by anyone. RhMask is the privacy layer: receive unseen, pay unseen, and earn real stock tokens for
                holding the line.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/app" className="btn btn-primary w-full sm:w-auto">
                  Open the app <ArrowIcon className="h-4 w-4" />
                </Link>
                <Link href="/whitepaper" className="btn btn-ghost w-full sm:w-auto">
                  Read the whitepaper
                </Link>
                <a
                  href={SITE.x.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost w-full justify-center gap-2 sm:w-auto"
                >
                  <XIcon className="h-4 w-4" /> {SITE.x.handle}
                </a>
              </div>

              <p className="mt-6 text-xs text-fog-2">
                No sign-up, no email, no KYC. Keys are generated on your device and never leave it.
              </p>
            </div>

            {/* floating product preview */}
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div
                className="absolute -inset-10 -z-10 rounded-[3rem] opacity-70"
                style={{ background: "radial-gradient(60% 60% at 50% 40%, color-mix(in oklab, var(--color-mask) 30%, transparent), transparent 70%)" }}
                aria-hidden="true"
              />
              <div className="card aura p-6" style={{ ["--aura" as string]: "var(--color-mask)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <QrIcon className="h-5 w-5 text-mask" />
                    <p className="font-semibold">Payment request</p>
                  </div>
                  <Badge tone="mask">QR</Badge>
                </div>
                <p className="mt-2 text-sm text-fog">Scan to pay 1.5 NVDA to a one-time address.</p>
                <div className="mt-5 flex justify-center">
                  <div className="rounded-2xl bg-white p-3 shadow-[0_18px_50px_-20px_rgba(184,255,92,0.7)]">
                    <QrCode value={SAMPLE_QR} size={188} label="Example payment request QR" />
                  </div>
                </div>
                <div className="mt-5 grid gap-2 text-xs">
                  {["Derived in the payer's browser", "Unlinkable to your wallet", "Receipt QR proves it is yours"].map((t) => (
                    <p key={t} className="flex items-center gap-2 text-fog">
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-mask" /> {t}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- proofs */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="card reveal grid grid-cols-2 divide-x divide-y divide-white/6 overflow-hidden p-0 lg:grid-cols-4 lg:divide-y-0">
          {PROOFS.map((p) => (
            <div key={p.label} className="p-6">
              <p className="display text-3xl gradient-lime sm:text-4xl">{p.value}</p>
              <p className="mt-2.5 text-xs leading-relaxed text-fog">{p.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-fog-2">
          Reproduce it yourself: <code className="mono text-fog">npm run check:onchain</code> runs read-only against
          mainnet and signs nothing.
        </p>
      </section>

      {/* ------------------------------------------------------------- features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">What you get</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">
            Five surfaces, <span className="gradient-violet">one promise</span>
          </h2>
          <p className="mt-4 text-fog">
            Each one answers a question you should never have to ask in public: was I seen, and was I paid?
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s) => (
            <article
              key={s.title}
              className="card card-hover aura reveal flex flex-col p-6"
              style={{ ["--aura" as string]: s.aura }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/10"
                  style={{ background: `color-mix(in oklab, ${s.aura} 14%, transparent)`, color: s.aura }}
                >
                  <s.icon className="h-5 w-5" />
                </span>
                <Badge tone={s.status === "beta" ? s.tone : "warn"}>{s.status}</Badge>
              </div>
              <h3 className="display mt-5 text-xl">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fog">{s.body}</p>
              <ul className="mt-5 space-y-2 border-t border-white/6 pt-4 text-sm">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-fog">
                    <span className="mt-0.5 shrink-0" style={{ color: s.aura }}>
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          <article className="card card-hover reveal flex flex-col justify-between p-6">
            <div>
              <p className="eyebrow">Second surface</p>
              <h3 className="display mt-3 text-xl">Browser extension</h3>
              <p className="mt-3 text-sm leading-relaxed text-fog">
                A chip beside any address field on any site. One click pastes a fresh stealth address and keeps the
                receipt, so privacy happens at the exact moment you would otherwise leak.
              </p>
            </div>
            <a
              href={`${SITE.github.url}/tree/main/extension`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost mt-6 w-fit text-sm"
            >
              Build it from source <ArrowIcon className="h-4 w-4" />
            </a>
          </article>
        </div>
      </section>

      {/* ------------------------------------------------------------------ how */}
      <section id="how" className="relative scroll-mt-24 border-y border-white/8 bg-ink-2/40 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Four steps, <span className="gradient-lime">no accounts</span>
            </h2>
            <p className="mt-4 text-fog">
              The whole flow runs in your browser. The network is touched only to read a balance or move funds.
            </p>
          </div>

          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.n} className="reveal relative">
                {i < STEPS.length - 1 && (
                  <span
                    className="absolute left-12 right-0 top-6 hidden h-px bg-gradient-to-r from-line-2 to-transparent lg:block"
                    aria-hidden="true"
                  />
                )}
                <div className="card relative h-full p-6">
                  <span className={`mono display text-2xl ${s.tone}`}>{s.n}</span>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="card reveal mt-10 grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Stated plainly</p>
              <h3 className="display mt-3 text-xl">What is hidden</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-fog">
                <li className="flex gap-2.5">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-mask" />
                  The link between your identity and a receiving address.
                </li>
                <li className="flex gap-2.5">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-mask" />
                  Your order, from public order books and mempools, as a visible swap.
                </li>
                <li className="flex gap-2.5">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-mask" />
                  Your balance history, because it never piles up on one wallet.
                </li>
              </ul>
            </div>
            <div className="lg:border-l lg:border-white/8 lg:pl-8">
              <p className="eyebrow">And what is not</p>
              <h3 className="display mt-3 text-xl">What stays visible</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-fog">
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden="true" />
                  On-chain settlement itself. The chain is public by nature.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden="true" />
                  The venue filling an order sees the deposit and the receiving address.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden="true" />
                  Network metadata, your IP to the RPC, unless you run your own node.
                </li>
              </ul>
              <p className="mt-5 text-xs text-fog-2">
                We never write &ldquo;anonymous&rdquo; or &ldquo;untraceable&rdquo;. Privacy claims always ship with
                their limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- mechanisms */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">Under the hood</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Standards, <span className="gradient-violet">not slogans</span>
            </h2>
            <p className="mt-4 text-fog">
              Everything marked live has a test and a URL. Everything else is on the roadmap with a phase, and the
              site says so on the screen where it matters.
            </p>
            <Link href="/docs" className="btn btn-ghost mt-7 w-fit">
              Read the docs <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {MECHANISMS.map((m) => (
              <div key={m.name} className="card reveal flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="mono text-sm text-paper">{m.name}</p>
                  <p className="mt-1 text-xs leading-snug text-fog">{m.detail}</p>
                </div>
                <Badge tone={m.state === "live" ? "mask" : "warn"}>{m.state}</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- token */}
      <section id="token" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24">
        <div className="card aura overflow-hidden p-6 sm:p-10" style={{ ["--aura" as string]: "var(--color-pink)" }}>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <Badge tone="pink">$MASK</Badge>
              <h2 className="display mt-5 text-3xl sm:text-4xl">
                A token that pays you in <span className="gradient-violet">someone else&rsquo;s stock</span>.
              </h2>
              <p className="mt-5 text-fog">
                $MASK buys access and fee discounts. It never buys route quality. Stake it and the vault pays you in a
                basket of stock tokens funded by protocol revenue. Every trade of $MASK and every routed swap feeds the
                same vault.
              </p>
              <ul className="mt-7 grid gap-2.5 text-sm">
                {[
                  "Fixed supply. No mint. No admin keys.",
                  "Fair launch on a public bonding curve. No presale, no team allocation.",
                  "Rewards paid in stock tokens, on-chain, with a hash.",
                  "Holders vote which stocks enter the basket.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-fog">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-pink" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="content-start grid gap-3">
              <p className="eyebrow">Launch basket</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {BASKET.map((t) => (
                  <div key={t.symbol} className="card card-hover p-4">
                    <p className="display text-lg">{t.symbol}</p>
                    <p className="mt-1 truncate text-xs text-fog">{t.name}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-fog-2">
                Basket composition is governed by stakers after launch. Stock tokens are issued by a third party, and
                every address is re-verified before a release.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ cta */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="card relative overflow-hidden p-10 text-center sm:p-16">
          <div
            className="absolute inset-0 -z-10 opacity-80"
            style={{
              background:
                "radial-gradient(70% 120% at 50% 0%, color-mix(in oklab, var(--color-mask) 22%, transparent), transparent 70%), radial-gradient(60% 100% at 80% 100%, color-mix(in oklab, var(--color-violet) 20%, transparent), transparent 70%)",
            }}
            aria-hidden="true"
          />
          <h2 className="display mx-auto max-w-2xl text-3xl sm:text-5xl">
            Own the market. <span className="gradient-lime">Stay unseen.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-fog">
            Generate your keys in about ten seconds. No wallet connection needed to start, and nothing to sign up for.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/app" className="btn btn-primary w-full sm:w-auto">
              Open the app <ArrowIcon className="h-4 w-4" />
            </Link>
            <Link href="/docs" className="btn btn-ghost w-full sm:w-auto">
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
