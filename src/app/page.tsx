import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/Badge";
import { QrCode } from "@/components/QrCode";
import { Cmd, Terminal } from "@/components/Terminal";
import { ArrowIcon, CheckIcon, GhostIcon, LedgerIcon, QrIcon, SwapIcon, VaultIcon, XIcon } from "@/components/Icons";
import { BASKET } from "@/lib/tokens";
import { SITE } from "@/lib/site";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";

type Surface = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  cmd: string;
  body: string;
  status: "beta" | "planned";
  tone: BadgeTone;
  aura: string;
  anim: string;
  points: string[];
};

const SURFACES: Surface[] = [
  {
    icon: GhostIcon,
    title: "Ghost Receive",
    cmd: "rhmask receive",
    body: "Publish one meta-address. Every payment lands on a fresh address nobody can link back to you.",
    status: "beta",
    tone: "mask",
    aura: "var(--color-mask)",
    anim: "loop-float",
    points: ["ERC-5564 stealth addresses", "Keys generated in your browser", "Encrypted at rest with a passphrase"],
  },
  {
    icon: QrIcon,
    title: "Private Pay",
    cmd: "rhmask pay",
    body: "Show a QR, get paid on a one-time address, hand back a receipt QR. Three scans, no server in the middle.",
    status: "beta",
    tone: "aqua",
    aura: "var(--color-aqua)",
    anim: "loop-pulse",
    points: ["Request, pay, claim, sweep", "Works from any wallet", "Scan with a plain phone camera"],
  },
  {
    icon: SwapIcon,
    title: "Mask Swap",
    cmd: "rhmask swap",
    body: "Route swaps through private fills instead of public order books. Venue and flat fee printed before you send.",
    status: "beta",
    tone: "violet",
    aura: "var(--color-violet)",
    anim: "loop-flip",
    points: ["189 assets across 35 chains", "Receive on a fresh stealth address", "Non-custodial, deposit goes to the venue"],
  },
  {
    icon: VaultIcon,
    title: "Blue Chip Vault",
    cmd: "rhmask vault",
    body: "Stake $MASK. Protocol revenue buys stock tokens and streams them to stakers, paid in NVDA and SPY.",
    status: "planned",
    tone: "pink",
    aura: "var(--color-pink)",
    anim: "loop-spin",
    points: ["Paid in stocks, not in more $MASK", "Funded from day one by the creator fee", "Holders vote the basket"],
  },
  {
    icon: LedgerIcon,
    title: "Proof Ledger",
    cmd: "rhmask ledger",
    body: "Every payout listed with its transaction hash. If it is not on the ledger, it did not happen.",
    status: "planned",
    tone: "warn",
    aura: "var(--color-warn)",
    anim: "loop-bob",
    points: ["Nothing estimated, nothing back-filled", "Public feed anyone can mirror", "Ships with the vault"],
  },
];

const STEPS = [
  {
    fn: "keygen()",
    icon: GhostIcon,
    anim: "loop-float",
    title: "Generate your keys",
    body: "Two keys, made locally and never sent anywhere. Share the meta-address once, keep the spending key.",
  },
  {
    fn: "request()",
    icon: QrIcon,
    anim: "loop-pulse",
    title: "Show a QR, get paid",
    body: "The payer scans it, derives a one-time address, and sends from any wallet. Your balance never piles up.",
  },
  {
    fn: "claim()",
    icon: CheckIcon,
    anim: "loop-bob",
    title: "Claim with a scan",
    body: "Their receipt QR proves the payment is yours. Your viewing key finds it, your spending key unlocks it.",
  },
  {
    fn: "sweep()",
    icon: SwapIcon,
    anim: "loop-flip",
    title: "Sweep, or get paid in stocks",
    body: "Move funds anywhere, or stake $MASK and receive a basket of stock tokens, hash by hash.",
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

const HIDDEN = [
  "The link between your identity and a receiving address.",
  "Your order, from public order books and mempools, as a visible swap.",
  "Your balance history, because it never piles up on one wallet.",
];

const VISIBLE = [
  "On-chain settlement itself. The chain is public by nature.",
  "The venue filling an order sees the deposit and the receiving address.",
];

const SAMPLE_QR = "https://rhmask.org/pay?to=st:eth:0x02b4f1c6a7d8e93f5a1c0b7d6e2f8a34c9d5b1e07f3a6c8d2b4e9f1a5c7d3b6e8f0&token=NVDA&amount=1.5";

export default function Landing() {
  return (
    <div>
      {/* ------------------------------------------------------------------ hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="text-sm text-fog">
            <span className="text-mask">guest@rhmask</span>:<span className="text-aqua">~</span>$ whoami
          </p>
          <h1 className="display mt-6 text-[2.1rem] sm:text-5xl lg:text-[3.6rem]">
            <span className="block">Wall Street sees everything.</span>
            <span className="cursor block text-mask">RhMask sees nothing.</span>
          </h1>
          <p className="mt-8 max-w-xl leading-relaxed text-fog">
            <span className="text-fog-2"># </span>
            Tokenized stocks put the market on a public ledger. Your entries, your exits, your whole bag, readable by
            anyone. RhMask is the privacy layer: receive unseen, pay unseen, and earn real stock tokens for holding the
            line.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/app" className="btn btn-primary w-full sm:w-auto">
              open the app <ArrowIcon className="h-4 w-4" />
            </Link>
            <Link href="/whitepaper" className="btn btn-ghost w-full sm:w-auto">
              read whitepaper
            </Link>
            <a href={SITE.x.url} target="_blank" rel="noreferrer" className="btn btn-ghost w-full sm:w-auto">
              <XIcon className="h-4 w-4" /> {SITE.x.handle}
            </a>
          </div>

          <p className="mt-6 text-xs text-fog-2">
            {"// "}No sign-up, no email, no KYC. Keys are generated on your device and never leave it.
          </p>
        </div>

        <Terminal title="guest@rhmask: ~ — zsh" className="w-full">
          <div className="grid gap-4 text-sm">
            <div className="grid gap-1">
              <Cmd>rhmask status</Cmd>
              <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1 text-fog">
                <dt>chain</dt>
                <dd className="text-paper">robinhood · {ROBINHOOD_CHAIN_ID}</dd>
                <dt>keys</dt>
                <dd className="text-paper">local only</dd>
                <dt>server</dt>
                <dd className="text-paper">none sees a key</dd>
              </dl>
            </div>
            <div className="grid gap-3">
              <Cmd>rhmask pay --token NVDA --amount 1.5</Cmd>
              <p className="text-fog">
                <span className="text-mask">→</span> one-time address derived. scan to pay:
              </p>
              <div className="w-fit bg-white p-2.5">
                <QrCode value={SAMPLE_QR} size={156} label="Example payment request QR" />
              </div>
              <ul className="grid gap-1 text-xs text-fog">
                {["derived in the payer's browser", "unlinkable to your wallet", "receipt QR proves it is yours"].map((t) => (
                  <li key={t}>
                    <span className="text-mask">✓</span> {t}
                  </li>
                ))}
              </ul>
              <p className="spinner text-xs text-fog"> awaiting payer scan…</p>
            </div>
          </div>
        </Terminal>
      </section>

      {/* ---------------------------------------------------------------- ticker */}
      <section className="ticker overflow-hidden border-y border-line-2 bg-ink-2 py-3" aria-label="Launch basket">
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {BASKET.map((t) => (
                <li key={t.symbol} className="flex items-center gap-2 px-6 text-sm whitespace-nowrap">
                  <span className="text-mask">●</span>
                  <span className="font-bold">{t.symbol}</span>
                  <span className="text-fog">{t.name}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------- proofs */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="eyebrow">proof, not promises</p>
        <h2 className="display mt-3 text-3xl sm:text-4xl">
          Numbers you can <span className="text-mask">reproduce</span>.
        </h2>
        <Terminal title="~/rhmask — npm run check:onchain" className="reveal mt-8">
          <Cmd>npm run check:onchain</Cmd>
          <p className="mt-1 text-sm text-fog-2">read-only against mainnet · signs nothing</p>
          <dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROOFS.map((p) => (
              <div key={p.label}>
                <dt className="display text-4xl text-mask sm:text-5xl">{p.value}</dt>
                <dd className="mt-2 text-xs leading-relaxed text-fog">
                  <span className="text-mask">✓</span> {p.label}
                </dd>
              </div>
            ))}
          </dl>
        </Terminal>
      </section>

      {/* ------------------------------------------------------------- features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24">
        <div className="max-w-2xl">
          <p className="eyebrow">what you get</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">
            Five surfaces, <span className="text-mask">one promise</span>.
          </h2>
          <p className="mt-4 text-fog">
            Each one answers a question you should never have to ask in public: was I seen, and was I paid?
          </p>
        </div>

        <div className="mt-10 border border-line-2">
          <p className="border-b border-line-2 bg-ink-2 px-5 py-3 text-sm">
            <span className="text-mask">$</span> ls surfaces/ <span className="text-fog-2">--long</span>
          </p>
          <ul>
            {SURFACES.map((s) => (
              <li
                key={s.title}
                className="reveal grid gap-5 border-b border-line px-5 py-7 last:border-0 md:grid-cols-[2.5rem_1.1fr_1fr_auto] md:items-start md:gap-8"
              >
                <span
                  className="grid h-10 w-10 place-items-center border"
                  style={{ borderColor: s.aura, color: s.aura }}
                >
                  <span className={s.anim}>
                    <s.icon className="h-5 w-5" />
                  </span>
                </span>
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-xs text-fog-2">
                    <span style={{ color: s.aura }}>$</span> {s.cmd}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-fog">{s.body}</p>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-fog">
                      <span className="mt-0.5 shrink-0" style={{ color: s.aura }}>
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="md:justify-self-end">
                  <Badge tone={s.status === "beta" ? s.tone : "warn"}>{s.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Terminal title="~/rhmask/extension" className="card-hover reveal mt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">second surface</p>
              <h3 className="mt-2 text-lg font-bold">Browser extension</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">
                A chip beside any address field on any site. One click pastes a fresh stealth address and keeps the
                receipt, so privacy happens at the exact moment you would otherwise leak.
              </p>
              <div className="mt-4">
                <Cmd>npm run build:extension</Cmd>
              </div>
            </div>
            <a
              href={`${SITE.github.url}/tree/main/extension`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost w-fit shrink-0 text-sm"
            >
              build from source <ArrowIcon className="h-4 w-4" />
            </a>
          </div>
        </Terminal>
      </section>

      {/* ------------------------------------------------------------------ how */}
      <section id="how" className="scroll-mt-24 border-y border-line-2 bg-ink-2 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="eyebrow">how it works</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Four steps, <span className="text-mask">no accounts</span>.
            </h2>
            <p className="mt-4 text-fog">
              The whole flow runs in your browser. The network is touched only to read a balance or move funds.
            </p>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.fn} className="card reveal bg-ink! p-5">
                <div className="flex items-center justify-between text-mask">
                  <p className="text-xs text-fog-2">{String(i + 1).padStart(2, "0")}</p>
                  <span className={s.anim} style={{ animationDelay: `${i * 0.4}s` }}>
                    <s.icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-2 text-lg font-bold text-mask">{s.fn}</p>
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fog">{s.body}</p>
              </li>
            ))}
          </ol>

          <Terminal title="privacy.diff — stated plainly" className="reveal mt-12 bg-ink!">
            <div className="grid gap-8 text-sm lg:grid-cols-2">
              <div>
                <p className="font-bold">## what is hidden</p>
                <ul className="mt-3 grid gap-2">
                  {HIDDEN.map((t) => (
                    <li key={t} className="flex gap-3 bg-mask/8 px-3 py-1.5 text-mask">
                      <span aria-hidden="true">+</span>
                      <span className="text-paper">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold">## what stays visible</p>
                <ul className="mt-3 grid gap-2">
                  {VISIBLE.map((t) => (
                    <li key={t} className="flex gap-3 bg-warn/8 px-3 py-1.5 text-warn">
                      <span aria-hidden="true">!</span>
                      <span className="text-paper">{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-fog-2">
                  {"// "}We never write &ldquo;anonymous&rdquo; or &ldquo;untraceable&rdquo;. Privacy claims always
                  ship with their limits.
                </p>
              </div>
            </div>
          </Terminal>
        </div>
      </section>

      {/* ----------------------------------------------------------- mechanisms */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div>
            <p className="eyebrow">under the hood</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Standards, <span className="text-mask">not slogans</span>.
            </h2>
            <p className="mt-4 text-fog">
              Everything marked live has a test and a URL. Everything else is on the roadmap with a phase, and the
              site says so on the screen where it matters.
            </p>
            <Link href="/docs" className="btn btn-ghost mt-7 w-fit">
              read the docs <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
          <Terminal title="~/rhmask — standards.txt">
            <Cmd>cat standards.txt</Cmd>
            <ul className="mt-3">
              {MECHANISMS.map((m) => (
                <li
                  key={m.name}
                  className="flex items-center justify-between gap-4 border-b border-dashed border-line py-3 last:border-0"
                >
                  <div className="min-w-0 text-sm">
                    <span className="font-bold text-aqua">{m.name}</span>
                    <span className="block text-fog sm:inline sm:pl-3">{m.detail}</span>
                  </div>
                  <Badge tone={m.state === "live" ? "mask" : "warn"}>{m.state}</Badge>
                </li>
              ))}
            </ul>
          </Terminal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- token */}
      <section id="token" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24">
        <div className="bg-mask p-6 text-black sm:p-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold">$ cat token/MASK.md</p>
              <h2 className="display mt-5 text-3xl sm:text-4xl">A token that pays you in someone else&rsquo;s stock.</h2>
              <p className="mt-5 text-black/75">
                $MASK buys access and fee discounts. It never buys route quality. Stake it and the vault pays you in a
                basket of stock tokens funded by protocol revenue. Every trade of $MASK and every routed swap feeds the
                same vault.
              </p>
              <ul className="mt-6 grid gap-2 text-sm font-medium">
                {[
                  "Fixed supply. No mint. No admin keys.",
                  "Fair launch on a public bonding curve. No presale, no team allocation.",
                  "Rewards paid in stock tokens, on-chain, with a hash.",
                  "Holders vote which stocks enter the basket.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <span aria-hidden="true">-</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid content-start gap-3 bg-black p-5 text-sm text-paper">
              <p className="text-fog">
                <span className="text-mask">const</span> <span className="text-aqua">launchBasket</span> ={" "}
                <span className="text-fog-2">{"// planned"}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BASKET.map((t) => (
                  <div key={t.symbol} className="border border-line-2 p-3">
                    <p className="font-bold text-mask">&quot;{t.symbol}&quot;</p>
                    <p className="mt-1 truncate text-xs text-fog">{t.name}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-fog-2">
                {"// "}Basket composition is governed by stakers after launch. Stock tokens are issued by a third party,
                and every address is re-verified before a release.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ cta */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <Terminal title="guest@rhmask: ~ — zsh">
          <div className="py-6 text-center sm:py-10">
            <Cmd>rhmask init</Cmd>
            <h2 className="display mx-auto mt-6 max-w-3xl text-3xl sm:text-5xl">
              Own the market. <span className="cursor block text-mask">Stay unseen.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-fog">
              Generate your keys in about ten seconds. No wallet connection needed to start, and nothing to sign up
              for.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/app" className="btn btn-primary w-full sm:w-auto">
                open the app <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link href="/docs" className="btn btn-ghost w-full sm:w-auto">
                read the docs
              </Link>
            </div>
          </div>
        </Terminal>
      </section>
    </div>
  );
}
