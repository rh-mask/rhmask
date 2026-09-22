import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { Code, DataTable, DocSection, DocShell, Note, type TocItem } from "@/components/DocShell";
import { GitHubIcon } from "@/components/Icons";
import { SITE } from "@/lib/site";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";

export const metadata: Metadata = {
  title: "Documentation",
  description: "How RhMask works: stealth keys, private payments by QR, private swaps, the API, and the security model.",
};

const TOC: TocItem[] = [
  { id: "start", label: "Quick start" },
  { id: "keys", label: "Keys and meta-address" },
  { id: "pay", label: "Private Pay" },
  { id: "swap", label: "Mask Swap" },
  { id: "security", label: "Security model" },
  { id: "api", label: "API reference" },
  { id: "extension", label: "Browser extension" },
  { id: "develop", label: "Run it yourself" },
  { id: "faq", label: "FAQ" },
];

export default function DocsPage() {
  return (
    <DocShell
      eyebrow="Documentation"
      title={
        <>
          Everything, <span className="gradient-lime">stated plainly</span>
        </>
      }
      lead="How the product works, what it protects, and exactly where the protection stops. If a claim is not backed by a check you can run, it is not in here."
      meta={
        <>
          <Badge tone="mask">Chain {ROBINHOOD_CHAIN_ID}</Badge>
          <a href={SITE.github.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-paper">
            <GitHubIcon className="h-3.5 w-3.5" /> {SITE.github.handle}
          </a>
          <span>Updated with every release</span>
        </>
      }
      toc={TOC}
    >
      <DocSection id="start" title="Quick start">
        <p>
          There is nothing to install and nothing to sign up for. Open the app, generate a pair of keys, and you have a
          meta-address you can hand out for the rest of the project&rsquo;s life.
        </p>
        <ol className="grid gap-3 text-sm">
          {[
            ["Open the app", "Go to the Ghost Receive tab and press Generate keys. Two private keys are created in your browser."],
            ["Back them up", "Download the JSON backup, or set a passphrase so the keys are encrypted at rest on this device."],
            ["Share the meta-address", "Copy the text or show the QR. It is safe to publish; it cannot spend anything."],
            ["Get paid", "Every payer derives a fresh one-time address from it. Claim their receipt QR, then sweep."],
          ].map(([t, d], i) => (
            <li key={t} className="card flex gap-4 p-4">
              <span className="mono display shrink-0 text-lg text-mask">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <b className="text-paper">{t}.</b> {d}
              </span>
            </li>
          ))}
        </ol>
        <Note>
          The whole app runs without a single secret. Endpoints that need a server key answer <code className="mono">503</code>{" "}
          naming the exact variable, and the interface shows that message instead of a blank state.
        </Note>
      </DocSection>

      <DocSection id="keys" title="Keys and meta-address">
        <p>
          RhMask implements <b className="text-paper">ERC-5564</b> stealth addresses on secp256k1. You hold two private
          keys. The <b className="text-paper">spending key</b> moves funds. The <b className="text-paper">viewing key</b>{" "}
          only recognises which payments are yours, so it can be handed to an accountant without giving up control.
        </p>
        <p>Your meta-address is the two matching public keys joined together:</p>
        <Code>{`st:eth:0x <33-byte spending pubkey> <33-byte viewing pubkey>
              └─ 132 hex characters in total`}</Code>
        <p>A sender turns that into a one-time address nobody can link back to you:</p>
        <Code>{`ephemeral r,  R = r·G
S        = r · K_view              (sender)   ==  k_view · R   (you)
h        = keccak256(compress(S)),  view tag = h[0]
P_stealth = K_spend + h·G
address   = keccak256(uncompress(P_stealth)[1:])[12:]`}</Code>
        <p>
          The view tag is one byte. Scanning checks it first and only does the full elliptic-curve work on a match, which
          is what keeps a scan fast once the announcer contract exists.
        </p>
        <DataTable
          head={["Key", "Can do", "Cannot do"]}
          rows={[
            ["Spending key", "Move funds from any stealth address", "Nothing is out of reach; guard it"],
            ["Viewing key", "Find which payments belong to you", "Spend anything"],
            ["Meta-address", "Receive payments", "Spend, or reveal your balance"],
          ]}
        />
        <Note tone="warn">
          Losing the spending key loses every unswept stealth balance. There is no recovery, no server copy, and no
          support channel that can restore it. Back it up before you receive anything real.
        </Note>
      </DocSection>

      <DocSection id="pay" title="Private Pay">
        <p>
          A private payment is three scans and no server. Every step happens in a browser, and the receipt QR carries the
          announcement until the on-chain announcer contract ships.
        </p>
        <DataTable
          head={["Step", "Who", "What happens"]}
          rows={[
            ["Request", "Recipient", "Builds a payment request from the meta-address, plus optional token, amount and memo. Shown as a link and a QR."],
            ["Send", "Payer", "Scans it, derives a one-time address, sends from any wallet on Robinhood Chain, receives a receipt QR."],
            ["Claim", "Recipient", "Scans the receipt. The viewing key verifies it, the spending key unlocks it, balances load."],
            ["Sweep", "Recipient", "Moves the funds anywhere, signed in the page with the derived key."],
          ]}
        />
        <p>Both formats are plain URLs, so a phone camera opens the right screen with no app install:</p>
        <Code>{`Payment request
${SITE.url}/pay?to=st:eth:0x…&token=NVDA&amount=1.5&memo=invoice%2042

Receipt / announcement
${SITE.url}/app?claim=1&addr=0x…&eph=0x…&tag=87&tx=0x…#receive`}</Code>
        <p>
          <b className="text-paper">addr</b> is the one-time address, <b className="text-paper">eph</b> the compressed
          ephemeral public key, and <b className="text-paper">tag</b> the view tag. Those three fields map one-to-one onto
          the ERC-5564 announcement event, so the scanner will replace the QR without a format change.
        </p>
        <Note tone="warn">
          Send the receipt. Without the ephemeral key the recipient cannot find the payment, even though the funds are
          already theirs on chain.
        </Note>
      </DocSection>

      <DocSection id="swap" title="Mask Swap">
        <p>
          Swaps are filled through an intent router rather than a public order book, so the order never sits in a
          mempool as a visible trade. Pick an asset from 189 across 35 chains, enter a human amount, and the quote prints
          the venue and the flat fee before anything is sent.
        </p>
        <p>
          The receiving address can be a fresh stealth address derived from your own meta-address in one click, so a swap
          and a private receive become a single action.
        </p>
        <Note>
          Live deposit addresses need a router partner key on the server. Until it is configured the quote endpoint
          answers <code className="mono">503</code> and the card shows dry quotes, clearly labelled.
        </Note>
      </DocSection>

      <DocSection id="security" title="Security model">
        <p>Five properties hold for every release, and each one is checked rather than asserted.</p>
        <ul className="grid gap-3">
          {[
            ["Keys never leave the device", "Generation, derivation and recognition are pure client-side code. No fetch sits in the key path."],
            ["The server holds nothing", "No custody, no private keys, no session. Secrets are server-only env vars used to reach third-party routers."],
            ["Encrypted at rest", "Optional passphrase wraps the keys with AES-256-GCM, key derived by PBKDF2-SHA256 over 310,000 rounds via WebCrypto."],
            ["Fail closed", "A missing key produces a named 503, never a silent fallback that might leak or mislead."],
            ["Verified against mainnet", "A read-only script simulates real transfers from real holders before each release. It signs nothing."],
          ].map(([t, d]) => (
            <li key={t} className="card p-4">
              <b className="text-paper">{t}.</b> <span className="text-fog">{d}</span>
            </li>
          ))}
        </ul>
        <p>
          What is <i>not</i> hidden matters just as much: on-chain settlement is public, the venue filling a swap sees
          the deposit and the receiving address, and your IP reaches whichever RPC you use unless you run your own node.
        </p>
        <p>
          Found a problem? Report it privately by email rather than in a public issue. Details are in{" "}
          <a href={`${SITE.github.url}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer" className="text-mask hover:underline">
            SECURITY.md
          </a>
          .
        </p>
      </DocSection>

      <DocSection id="api" title="API reference">
        <p>
          Every route is a Next.js handler in the same deployment. Reads are cached where it is safe, and nothing that
          touches a key is exposed.
        </p>
        <DataTable
          head={["Method", "Path", "Notes"]}
          rows={[
            [<code key="a" className="mono">GET</code>, <code key="b" className="mono">/api/health</code>, "Liveness and chain id"],
            [<code key="c" className="mono">GET</code>, <code key="d" className="mono">/api/chain</code>, "Chain params plus a live block number"],
            [<code key="e" className="mono">GET</code>, <code key="f" className="mono">/api/tokens</code>, "Stock token registry on Robinhood Chain"],
            [<code key="g" className="mono">GET</code>, <code key="h" className="mono">/api/router-tokens</code>, "Assets the intent router can fill, cached 10 minutes"],
            [<code key="i" className="mono">POST</code>, <code key="j" className="mono">/api/quote</code>, "Private fill quote; 503 when the router key is absent"],
            [<code key="k" className="mono">GET</code>, <code key="l" className="mono">/api/order/:deposit</code>, "Settlement status for a routed order"],
            [<code key="m" className="mono">GET</code>, <code key="n" className="mono">/api/vault</code>, "Vault totals, basket and proof ledger"],
            [<code key="o" className="mono">POST</code>, <code key="p" className="mono">/api/rpc</code>, "JSON-RPC pass-through, allow-listed read methods plus raw send"],
          ]}
        />
        <p>
          The pass-through exists because some networks hijack the chain&rsquo;s RPC domain at the DNS level. Routing
          through the app&rsquo;s own origin keeps balance reads and sweeps working where the direct endpoint is
          filtered. Batches are capped and log ranges bounded so the public RPC is not abused through us.
        </p>
        <Code>{`curl -X POST ${SITE.url}/api/rpc \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'`}</Code>
      </DocSection>

      <DocSection id="extension" title="Browser extension">
        <p>
          A stealth address only protects you if you use it at the moment someone asks for an address. The extension
          moves that choice to exactly that moment: a chip appears beside any address field, one click pastes a fresh
          one-time address, and the receipt is kept locally.
        </p>
        <p>
          It shares the key format with the app, so one backup and one passphrase work in both. It has no backend and
          requests no host permissions: the content script runs only on the tab where you clicked the toolbar icon.
        </p>
        <Code>{`git clone ${SITE.github.url}.git
cd rhmask && npm install
npm run build:extension       # bundles into extension/dist
# chrome://extensions → Developer mode → Load unpacked → extension/dist`}</Code>
      </DocSection>

      <DocSection id="develop" title="Run it yourself">
        <p>The repository is public and the app builds with no secrets at all.</p>
        <Code>{`git clone ${SITE.github.url}.git
cd rhmask
npm install
npm run hooks:install     # pre-push gate, once per clone
npm run dev               # http://localhost:3000`}</Code>
        <p>Four checks back the claims on this page, and the same set runs in CI:</p>
        <DataTable
          head={["Command", "What it proves"]}
          rows={[
            [<code key="a" className="mono">npm run check:stealth</code>, "Derive, recognise, recover. A stranger cannot claim your payment."],
            [<code key="b" className="mono">npm run check:payment</code>, "Request and receipt formats round-trip; malformed input is refused."],
            [<code key="c" className="mono">npm run check:keycrypto</code>, "Seal and open keys; a wrong passphrase and a tampered blob both fail."],
            [<code key="d" className="mono">npm run check:onchain</code>, "Read-only mainnet verification of tokens, stealth receive and vault feasibility."],
          ]}
        />
      </DocSection>

      <DocSection id="faq" title="FAQ">
        <div className="grid gap-3">
          {[
            ["Is this a mixer?", "No. Nothing is pooled and nothing is co-mingled. Each payment simply lands on its own fresh address that only you control."],
            ["Do I need to connect a wallet?", "Only to send. Generating keys, showing a request QR and claiming a receipt all work with no wallet at all."],
            ["What if I clear my browser data?", "Unswept balances become unreachable unless you have the backup file or the two private keys. Back them up first."],
            ["Can I use it on my phone?", "Yes. The request and receipt QRs are designed for a phone camera, and every screen is laid out for a small viewport."],
            ["Why do I need ETH to sweep?", "A fresh stealth address pays its own gas. The sponsored sweep on the roadmap removes that step."],
            ["Is the vault live?", "No. It is marked planned everywhere it appears, and it stays that way until a contract is deployed and audited."],
          ].map(([q, a]) => (
            <details key={q} className="card group p-5">
              <summary className="cursor-pointer list-none font-semibold text-paper marker:hidden">
                <span className="mr-2 text-mask transition-transform group-open:rotate-90 inline-block">›</span>
                {q}
              </summary>
              <p className="mt-3 pl-5 text-sm text-fog">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/whitepaper" className="btn btn-ghost">
            Read the whitepaper
          </Link>
          <Link href="/app" className="btn btn-primary">
            Open the app
          </Link>
        </div>
      </DocSection>
    </DocShell>
  );
}
