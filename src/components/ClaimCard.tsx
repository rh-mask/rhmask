"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/Badge";
import { QrScanner } from "@/components/QrScanner";
import { useStealthKeys } from "@/lib/keystore";
import { checkAnnouncement } from "@/lib/stealth";
import { parseAnnouncementInput, type Announcement } from "@/lib/payment";
import { explainRevert, readBalances, sweep, TRANSFER_TOKENS, type Balance } from "@/lib/transfer";
import { explorerAddress, explorerTx } from "@/lib/chain";

/**
 * Recipient side of Private Pay. Scan or paste a receipt (announcement),
 * recognise it with the viewing key, unlock it with the spending key, read
 * the balances, sweep to any address. The stealth private key is derived in
 * memory and shown only on request.
 */
const noop = () => () => {};
function readSearch() {
  return window.location.search;
}

type Claimed = { announcement: Announcement; stealthPrivateKey: `0x${string}` };

export function ClaimCard() {
  const { keys, locked } = useStealthKeys();
  const search = useSyncExternalStore(noop, readSearch, () => "");
  const fromUrl = search.includes("claim=1") ? search : "";

  const [input, setInput] = useState(fromUrl);
  const [claimed, setClaimed] = useState<Claimed | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [reveal, setReveal] = useState(false);
  const [sweepToken, setSweepToken] = useState("ETH");
  const [sweepTo, setSweepTo] = useState("");
  const [sweepTx, setSweepTx] = useState<`0x${string}` | null>(null);
  const [busy, setBusy] = useState(false);
  const autoTried = useRef(false);

  const refresh = useCallback(async (address: `0x${string}`) => {
    setBalances(null);
    try {
      setBalances(await readBalances(address));
    } catch {
      setStatus("Balances unavailable (RPC unreachable). The claim itself is verified.");
    }
  }, []);

  const claim = useCallback(
    (text: string) => {
      setError(null);
      setStatus(null);
      setClaimed(null);
      setBalances(null);
      setSweepTx(null);
      setReveal(false);
      setInput(text);
      if (!keys) {
        setError(locked ? "Unlock your keys above first." : "Generate or restore your keys above first.");
        return;
      }
      let a: Announcement;
      try {
        a = parseAnnouncementInput(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "could not read that receipt");
        return;
      }
      let priv: `0x${string}` | null = null;
      try {
        priv = checkAnnouncement(keys, a.ephemeralPublicKey, a.stealthAddress, a.viewTag);
      } catch {
        priv = null;
      }
      if (!priv) {
        setError("This receipt is not for your keys. Nothing to claim here.");
        return;
      }
      setClaimed({ announcement: a, stealthPrivateKey: priv });
      if (a.token) setSweepToken(a.token);
      refresh(a.stealthAddress);
    },
    [keys, locked, refresh],
  );

  // A receipt arriving through the URL (scanned by a phone camera) is claimed once keys are available.
  useEffect(() => {
    if (!fromUrl || !keys || autoTried.current) return;
    autoTried.current = true;
    const t = window.setTimeout(() => claim(fromUrl), 0);
    return () => window.clearTimeout(t);
  }, [fromUrl, keys, claim]);

  async function doSweep() {
    if (!claimed) return;
    setError(null);
    setBusy(true);
    try {
      const hash = await sweep(claimed.stealthPrivateKey, sweepToken, sweepTo as `0x${string}`);
      setSweepTx(hash);
      refresh(claimed.announcement.stealthAddress);
    } catch (err) {
      setError(`Sweep failed: ${explainRevert(err)}`);
    } finally {
      setBusy(false);
    }
  }

  const sweepToOk = /^0x[0-9a-fA-F]{40}$/.test(sweepTo);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Claim a private payment</h2>
        <Badge tone="mask">viewing key · local</Badge>
      </div>
      <p className="mt-2 text-sm text-fog">
        Scan the receipt QR the sender gave you, or paste the link. Your viewing key checks it, your spending key
        unlocks it. Then sweep the funds anywhere you like.
      </p>

      <div className="mt-4 grid gap-3">
        <QrScanner onResult={claim} label="Scan receipt QR" />
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="field mono"
            placeholder="receipt link, ?claim=1&addr=…&eph=…&tag=…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
          <button type="button" className="btn btn-primary shrink-0" onClick={() => claim(input)} disabled={!input.trim()}>
            Claim
          </button>
        </div>
        {error && <p className="text-sm text-warn">{error}</p>}
        {status && <p className="text-sm text-fog">{status}</p>}
      </div>

      {claimed && (
        <div className="mt-5 grid gap-4">
          <div className="rounded-xl border border-mask/40 bg-ink-3 p-3">
            <p className="text-xs text-mask mb-1">Verified: this payment is yours</p>
            <a className="mono text-mask" href={explorerAddress(claimed.announcement.stealthAddress)} target="_blank" rel="noreferrer">
              {claimed.announcement.stealthAddress}
            </a>
            {claimed.announcement.txHash && (
              <p className="mt-1 text-xs">
                <span className="text-fog">Sender tx: </span>
                <a className="mono text-mask" href={explorerTx(claimed.announcement.txHash)} target="_blank" rel="noreferrer">
                  {claimed.announcement.txHash.slice(0, 18)}…
                </a>
              </p>
            )}
            {(claimed.announcement.amount || claimed.announcement.token) && (
              <p className="mt-1 text-xs text-fog">
                Declared: {claimed.announcement.amount ?? "?"} {claimed.announcement.token ?? ""} (declared by the sender, verify against the balance)
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Balance on this address</p>
              <button type="button" className="btn btn-ghost text-xs py-1!" onClick={() => refresh(claimed.announcement.stealthAddress)}>
                Refresh
              </button>
            </div>
            {balances ? (
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
                {balances
                  .filter((b) => b.raw > 0n || b.token === "ETH")
                  .map((b) => (
                    <li key={b.token} className="rounded-lg border border-line bg-ink-3 p-2">
                      <p className="text-xs text-fog">{b.token}</p>
                      <p className="mono">{b.formatted}</p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-fog">Reading…</p>
            )}
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-semibold">Sweep</p>
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <select className="field mono" value={sweepToken} onChange={(e) => setSweepToken(e.target.value)}>
                {TRANSFER_TOKENS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input className="field mono" value={sweepTo} onChange={(e) => setSweepTo(e.target.value.trim())} placeholder="0x… destination" spellCheck={false} />
            </div>
            <button type="button" className="btn btn-primary" onClick={doSweep} disabled={!sweepToOk || busy}>
              {busy ? "Sweeping…" : `Sweep all ${sweepToken}`}
            </button>
            {sweepTx && (
              <p className="text-sm">
                <span className="text-fog">Sweep tx: </span>
                <a className="mono text-mask" href={explorerTx(sweepTx)} target="_blank" rel="noreferrer">
                  {sweepTx}
                </a>
              </p>
            )}
            <p className="text-xs text-fog/70">
              The sweep is signed in this page with the derived key and sent through the RPC. The address needs a
              little ETH for gas; the gasless relay on the roadmap removes that.
            </p>
          </div>

          <div>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setReveal((v) => !v)}>
              {reveal ? "Hide stealth private key" : "Reveal stealth private key"}
            </button>
            {reveal && (
              <div className="mt-2 rounded-xl border border-warn/40 bg-ink-3 p-3">
                <p className="text-xs text-warn">Import this into any wallet to control the address directly.</p>
                <p className="mono mt-1">{claimed.stealthPrivateKey}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
