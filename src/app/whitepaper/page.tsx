import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { Code, DataTable, DocSection, DocShell, Note, type TocItem } from "@/components/DocShell";
import { GitHubIcon } from "@/components/Icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Whitepaper",
  description:
    "RhMask whitepaper: the visibility problem in tokenized equities, a stealth-address privacy layer, the $MASK token, and the risks.",
};

const TOC: TocItem[] = [
  { id: "abstract", label: "Abstract" },
  { id: "problem", label: "1. The problem" },
  { id: "design", label: "2. Design goals" },
  { id: "architecture", label: "3. Architecture" },
  { id: "crypto", label: "4. Cryptography" },
  { id: "payments", label: "5. Private payments" },
  { id: "token", label: "6. The $MASK token" },
  { id: "roadmap", label: "7. Roadmap" },
  { id: "risks", label: "8. Risks" },
  { id: "refs", label: "References" },
];

export default function WhitepaperPage() {
  return (
    <DocShell
      eyebrow="Whitepaper · v0.2 · September 2026"
      title={
        <>
          Privacy for a market <span className="gradient-violet">that forgot to have any</span>
        </>
      }
      lead="Tokenized equities moved the order book onto a public ledger and kept none of the discretion the old one had. This paper describes the layer that gives it back, and is honest about where that layer stops."
      meta={
        <>
          <Badge tone="violet">Draft</Badge>
          <span>Not investment advice</span>
          <a href={SITE.github.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-paper">
            <GitHubIcon className="h-3.5 w-3.5" /> Source and checks
          </a>
        </>
      }
      toc={TOC}
    >
      <DocSection id="abstract" title="Abstract">
        <p>
          Stock tokens on Robinhood Chain settle on a public ledger. Every position, entry, exit and running balance is
          readable by anyone with a block explorer, permanently and without consent. That is a worse privacy posture
          than the market these instruments were built to mirror, where only the venue sees the tape.
        </p>
        <p>
          RhMask is a privacy layer for those assets. It gives holders a way to <b className="text-paper">receive
          unseen</b> using ERC-5564 stealth addresses derived entirely in the browser, a way to{" "}
          <b className="text-paper">pay and be paid privately</b> through a three-scan QR flow that needs no server, and
          a way to <b className="text-paper">be paid in stock tokens</b> for securing the protocol. No component takes
          custody, and no server ever sees a private key.
        </p>
        <p>
          The privacy claim is narrow and deliberate. RhMask unlinks identity from receiving addresses. It does not hide
          settlement, does not obscure amounts, and is not a mixer. Every surface in the product states which of those
          applies.
        </p>
      </DocSection>

      <DocSection id="problem" title="1. The problem">
        <p>
          A wallet holding tokenized equity is a public portfolio. Given one address, an observer can reconstruct cost
          basis, size, timing and counterparties. Three consequences follow, and all three are already visible on chain.
        </p>
        <ul className="grid gap-3">
          {[
            ["Adverse selection", "A visible position invites front-running and quote fading. The larger the holder, the worse the fills."],
            ["Coerced disclosure", "Paying someone once reveals your whole balance history to them, forever, with no way to revoke it."],
            ["Chilled participation", "Funds and treasuries cannot use an instrument that broadcasts their book, which caps the market's serious capital."],
          ].map(([t, d]) => (
            <li key={t} className="card p-4">
              <b className="text-paper">{t}.</b> <span className="text-fog">{d}</span>
            </li>
          ))}
        </ul>
        <p>
          The usual answer is a pooled mixer. That is the wrong tool here: it co-mingles funds, it creates a compliance
          problem for regulated assets, and it does nothing about the fact that a payer learns your address. RhMask
          takes the opposite approach. Nothing is pooled; every payment simply arrives somewhere new.
        </p>
      </DocSection>

      <DocSection id="design" title="2. Design goals">
        <DataTable
          head={["Goal", "Consequence"]}
          rows={[
            ["Keys never leave the device", "All key material is generated, stored and used in the browser. No account, no email, no recovery service."],
            ["No custody, ever", "Funds move wallet to venue or wallet to address. No contract we control holds user balances."],
            ["Honest by construction", "Anything not live is labelled planned in the interface, not only in the docs."],
            ["Verifiable claims", "Every property in this paper maps to a check in the repository that anyone can run."],
            ["Usable at the leak point", "Privacy has to be available where an address is pasted, which is why a browser extension is a first-class surface."],
          ]}
        />
      </DocSection>

      <DocSection id="architecture" title="3. Architecture">
        <p>
          The system is three layers. Only the middle one touches a server, and only to reach third-party routers on
          your behalf.
        </p>
        <Code>{`┌─ Surfaces ────────────────────────────────────────────────┐
│  Web app  (Next.js)          Browser extension (MV3)      │
│  keys · QR · claim · sweep   chips · receipts · same keys  │
└──────────────┬────────────────────────────┬───────────────┘
               │  all crypto client-side    │
┌──────────────▼────────────────────────────▼───────────────┐
│  Edge routes: quote · order · tokens · vault · rpc         │
│  holds router keys, never key material, fails closed       │
└──────────────┬─────────────────────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────────┐
│  Robinhood Chain 4663 · stock tokens · (planned) announcer, │
│  registry, MaskVault, RevenueRouter, ProofLedger            │
└────────────────────────────────────────────────────────────┘`}</Code>
        <p>
          The RPC pass-through deserves a note. Several consumer networks hijack the chain&rsquo;s RPC hostname at the
          DNS level, which makes a healthy endpoint look dead and silently breaks balance reads. Routing browser traffic
          through the application&rsquo;s own origin removes that failure mode without asking anyone to change their
          network.
        </p>
      </DocSection>

      <DocSection id="crypto" title="4. Cryptography">
        <p>
          Stealth addresses follow ERC-5564 on secp256k1. A recipient publishes a meta-address built from two public
          keys: spending and viewing. A sender derives a fresh address for every payment.
        </p>
        <Code>{`Sender                              Recipient
─────────────────────────────       ─────────────────────────────
r ← random scalar
R = r·G                        →    R arrives with the payment
S = r·K_view                        S = k_view·R          (equal)
h = keccak256(compress(S))          h = keccak256(compress(S))
tag = h[0]                          skip unless tag matches
P = K_spend + h·G                   p = k_spend + h  (mod n)
addr = keccak(P)[12:]               addr == keccak(p·G)[12:]`}</Code>
        <p>
          Only the recipient can compute <span className="mono">p</span>, so only the recipient can spend. The view tag
          is a one-byte filter that lets a scanner discard the overwhelming majority of announcements with a single
          comparison.
        </p>
        <p>
          Key storage is optional and local. With a passphrase set, the key set is sealed with AES-256-GCM under a key
          derived by PBKDF2-SHA256 over 310,000 rounds through WebCrypto. The sealed blob format is shared byte-for-byte
          between the web app and the extension, so one backup restores in either.
        </p>
        <Note>
          The round-trip, the stranger-cannot-claim property, wrong-passphrase rejection and tamper rejection are all
          asserted by scripts in the repository and run on every push.
        </Note>
      </DocSection>

      <DocSection id="payments" title="5. Private payments">
        <p>
          Until an announcer contract is deployed, the sender must hand the ephemeral key to the recipient. RhMask makes
          that step the product rather than a footnote: it is a QR code.
        </p>
        <DataTable
          head={["Artifact", "Carries", "Direction"]}
          rows={[
            ["Payment request", "meta-address, optional token, amount, memo", "recipient → payer"],
            ["One-time address", "derived in the payer's browser", "payer → chain"],
            ["Receipt", "address, ephemeral pubkey, view tag, optional tx hash", "payer → recipient"],
          ]}
        />
        <p>
          The receipt fields are exactly the fields of the ERC-5564 announcement event. When the announcer contract
          ships, a background scanner replaces the QR with no change to the format, and the QR remains as the offline
          path for payments made without publishing anything on chain.
        </p>
      </DocSection>

      <DocSection id="token" title="6. The $MASK token">
        <p>
          $MASK buys access and fee discounts. It never buys route quality; routing is identical for everyone, holder or
          not. Its single distinguishing property is what it pays: stakers receive a basket of stock tokens, not more
          $MASK.
        </p>
        <DataTable
          head={["Revenue source", "Paid in", "Starts"]}
          rows={[
            ["Creator share of $MASK trading fees", "ETH", "At token launch"],
            ["Routing fee on private fills", "Input asset", "When the router key is live"],
            ["Relay fee on sponsored sweeps", "Swept asset", "Roadmap phase 3"],
          ]}
        />
        <p>
          Revenue converts to the basket on-chain and streams to stakers. The design depends on one on-chain fact: that
          a contract can hold and transfer the issuer&rsquo;s stock tokens. That was verified against mainnet by
          simulating transfers of every basket token from real holders to a contract address. It holds today, and it is
          re-verified before each release because the tokens are upgradeable proxies controlled by their issuer.
        </p>
        <p>
          Supply is fixed with no mint function and no admin keys. The launch is a fair launch on a public bonding
          curve: no presale, no team allocation, and the launch transaction hash is published.
        </p>
      </DocSection>

      <DocSection id="roadmap" title="7. Roadmap">
        <DataTable
          head={["Phase", "Delivers", "State"]}
          rows={[
            ["0", "Stealth keys, QR private payments, claim and sweep, private swap quotes, extension MVP", <Badge key="a" tone="mask">shipped</Badge>],
            ["1", "Announcer and registry contracts, background scanner, live quotes", <Badge key="b" tone="warn">next</Badge>],
            ["2", "Passkey unlock, viewing-key disclosure, vault contracts and audit scope", <Badge key="c" tone="warn">planned</Badge>],
            ["3", "Sponsored sweeps, native on-chain private route, public API", <Badge key="d" tone="warn">planned</Badge>],
            ["4", "Association-set membership proofs, confidential amounts research", <Badge key="e" tone="warn">research</Badge>],
          ]}
        />
      </DocSection>

      <DocSection id="risks" title="8. Risks">
        <p>Stated without softening, because a privacy product that oversells itself is worse than none.</p>
        <ul className="grid gap-3">
          {[
            ["Issuer control", "Stock tokens are upgradeable proxies. The issuer can change behaviour under the same address, including transfer restrictions that would break the vault design."],
            ["Metadata leakage", "Settlement is public. Timing and amount analysis can still link activity, especially for unusual sizes."],
            ["Out-of-band receipts", "Until the announcer ships, a lost receipt means the recipient cannot locate funds that are already theirs."],
            ["Key loss", "There is no recovery path by design. A lost spending key is a permanent loss."],
            ["Unaudited contracts", "No contract is deployed yet. Nothing in the vault section should be treated as live until an audit is published."],
            ["Regulatory surface", "Tokenized equities sit in a moving regulatory perimeter that varies by jurisdiction and may restrict availability."],
          ].map(([t, d]) => (
            <li key={t} className="card p-4">
              <b className="text-paper">{t}.</b> <span className="text-fog">{d}</span>
            </li>
          ))}
        </ul>
        <Note tone="warn">
          This document describes software, not a security offering, and nothing in it is investment advice. Figures
          that are not yet produced by a deployed contract are labelled planned throughout.
        </Note>
      </DocSection>

      <DocSection id="refs" title="References">
        <ul className="grid gap-2 text-sm">
          {[
            ["ERC-5564: Stealth Addresses", "https://eips.ethereum.org/EIPS/eip-5564"],
            ["ERC-6538: Stealth Meta-Address Registry", "https://eips.ethereum.org/EIPS/eip-6538"],
            ["ERC-7683: Cross-Chain Intents", "https://eips.ethereum.org/EIPS/eip-7683"],
            ["EIP-7702: Set EOA account code", "https://eips.ethereum.org/EIPS/eip-7702"],
            ["RhMask source and verification scripts", SITE.github.url],
          ].map(([label, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer" className="text-mask hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/docs" className="btn btn-ghost">
            Read the docs
          </Link>
          <Link href="/app" className="btn btn-primary">
            Open the app
          </Link>
        </div>
      </DocSection>
    </DocShell>
  );
}
