"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/Badge";
import { QrCode } from "@/components/QrCode";
import { QrScanner } from "@/components/QrScanner";
import { useStealthKeys } from "@/lib/keystore";
import { useWallet } from "@/hooks/useWallet";
import { deriveStealthAddress, type StealthDerivation } from "@/lib/stealth";
import {
  encodeAnnouncement,
  encodePaymentRequest,
  isValidAmount,
  parsePaymentInput,
  type PaymentRequest,
} from "@/lib/payment";
import { buildTransfer, explainRevert, preflightTransfer, TRANSFER_TOKENS } from "@/lib/transfer";
import { explorerAddress, explorerTx } from "@/lib/chain";

/**
 * Private Pay. Left: the recipient builds a payment request and shows it as
 * a QR. Right: the sender scans (or pastes) it, gets a one-time address,
 * sends from any wallet, and hands back a receipt QR the recipient can
 * claim with their viewing key. Nothing here touches a server.
 */
export function PayCard({ initial, mode = "both" }: { initial?: PaymentRequest; mode?: "both" | "send" }) {
  return (
    <div className="grid gap-6">
      {mode === "both" && <RequestPanel />}
      <SendPanel initial={initial} />
    </div>
  );
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard blocked: the text is selectable */
    }
  }, []);
  return { copied, copy };
}

function TokenSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="field mono" value={value} onChange={(e) => onChange(e.target.value)}>
      {TRANSFER_TOKENS.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Recipient side
// ---------------------------------------------------------------------------
function RequestPanel() {
  const { keys, hydrated, locked } = useStealthKeys();
  const [token, setToken] = useState("ETH");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const { copied, copy } = useCopy();

  const amountOk = amount === "" || isValidAmount(amount);
  const link = keys
    ? encodePaymentRequest({ to: keys.metaAddress, token, amount: amountOk && amount ? amount : undefined, memo: memo || undefined })
    : null;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Request a private payment</h2>
        <Badge tone="mask">QR · client-side</Badge>
      </div>
      <p className="mt-2 text-sm text-fog">
        Show this QR or send the link. Whoever pays derives a fresh one-time address from your meta-address, so the
        payment never lands on a wallet that can be linked to you.
      </p>

      {!hydrated ? null : !keys ? (
        <p className="mt-4 text-sm text-warn">
          {locked ? "Unlock your keys in the Ghost Receive tab first." : "Generate your keys in the Ghost Receive tab first."}
        </p>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-3">
            <label className="grid gap-1 text-xs text-fog">
              Token
              <TokenSelect value={token} onChange={setToken} />
            </label>
            <label className="grid gap-1 text-xs text-fog">
              Amount (optional)
              <input className="field mono" value={amount} onChange={(e) => setAmount(e.target.value.trim())} placeholder="1.5" inputMode="decimal" />
              {!amountOk && <span className="text-warn">Use a plain decimal like 1.5</span>}
            </label>
            <label className="grid gap-1 text-xs text-fog">
              Memo (optional, visible to the payer only)
              <input className="field" value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={140} placeholder="invoice 42" />
            </label>
            {link && (
              <div className="rounded-xl border border-line bg-ink-3 p-3">
                <p className="text-xs text-fog mb-1">Payment link</p>
                <p className="mono break-all">{link}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => copy("link", link)}>
                    {copied === "link" ? "Copied" : "Copy link"}
                  </button>
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => copy("meta", keys.metaAddress)}>
                    {copied === "meta" ? "Copied" : "Copy meta-address"}
                  </button>
                </div>
              </div>
            )}
          </div>
          {link && (
            <div className="justify-self-center lg:justify-self-end">
              <QrCode value={link} size={220} label="Payment request QR" />
              <p className="mt-2 text-center text-xs text-fog">Scan with any phone camera</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sender side
// ---------------------------------------------------------------------------
function SendPanel({ initial }: { initial?: PaymentRequest }) {
  const w = useWallet();
  const { copied, copy } = useCopy();
  const [input, setInput] = useState(initial ? encodePaymentRequest(initial) : "");
  const [request, setRequest] = useState<PaymentRequest | null>(initial ?? null);
  const [derived, setDerived] = useState<StealthDerivation | null>(() => (initial ? safeDerive(initial.to) : null));
  const [token, setToken] = useState(initial?.token ?? "ETH");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualTx, setManualTx] = useState("");

  function safeDerive(meta: string) {
    try {
      return deriveStealthAddress(meta);
    } catch {
      return null;
    }
  }

  const load = useCallback((text: string) => {
    setError(null);
    setTxHash(null);
    setInput(text);
    try {
      const req = parsePaymentInput(text);
      const d = deriveStealthAddress(req.to);
      setRequest(req);
      setDerived(d);
      if (req.token) setToken(req.token);
      if (req.amount) setAmount(req.amount);
    } catch (err) {
      setRequest(null);
      setDerived(null);
      setError(err instanceof Error ? err.message : "could not read that request");
    }
  }, []);

  function newAddress() {
    if (!request) return;
    setTxHash(null);
    setDerived(safeDerive(request.to));
  }

  async function sendFromWallet() {
    if (!derived || !w.address) return;
    setError(null);
    setBusy(true);
    try {
      try {
        await preflightTransfer(w.address, token, amount, derived.stealthAddress);
      } catch (pre) {
        throw new Error(`Transfer would fail: ${explainRevert(pre)}`);
      }
      const tx = buildTransfer(token, amount, derived.stealthAddress);
      const hash = (await window.ethereum!.request({
        method: "eth_sendTransaction",
        params: [{ from: w.address, ...tx }],
      })) as `0x${string}`;
      setTxHash(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "transaction rejected");
    } finally {
      setBusy(false);
    }
  }

  const amountOk = isValidAmount(amount);
  const receiptTx = txHash ?? (/^0x[0-9a-fA-F]{64}$/.test(manualTx) ? (manualTx as `0x${string}`) : undefined);
  const receipt = derived
    ? encodeAnnouncement({
        stealthAddress: derived.stealthAddress,
        ephemeralPublicKey: derived.ephemeralPublicKey,
        viewTag: derived.viewTag,
        txHash: receiptTx,
        token,
        amount: amountOk ? amount : undefined,
      })
    : null;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Send a private transfer</h2>
        <Badge tone="mask">beta</Badge>
      </div>
      <p className="mt-2 text-sm text-fog">
        Scan a payment request or paste a meta-address. You get a one-time address that only the recipient can
        spend from. Send from any wallet, then hand back the receipt QR so they can claim it.
      </p>

      <div className="mt-5 grid gap-3">
        <QrScanner onResult={load} label="Scan payment QR" />
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="field mono"
            placeholder="st:eth:0x… or a /pay link"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
          <button type="button" className="btn btn-primary shrink-0" onClick={() => load(input)} disabled={!input.trim()}>
            Load
          </button>
        </div>
        {error && <p className="text-sm text-warn">{error}</p>}
      </div>

      {request && derived && (
        <div className="mt-5 grid gap-4">
          {request.memo && (
            <p className="text-sm">
              <span className="text-fog">Memo: </span>
              {request.memo}
            </p>
          )}
          <div className="rounded-xl border border-line bg-ink-3 p-3">
            <p className="text-xs text-fog mb-1">One-time address for this payment</p>
            <a className="mono text-mask" href={explorerAddress(derived.stealthAddress)} target="_blank" rel="noreferrer">
              {derived.stealthAddress}
            </a>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost text-sm" onClick={() => copy("addr", derived.stealthAddress)}>
                {copied === "addr" ? "Copied" : "Copy address"}
              </button>
              <button type="button" className="btn btn-ghost text-sm" onClick={newAddress} disabled={Boolean(txHash)}>
                New address
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-fog">
              Token
              <TokenSelect value={token} onChange={setToken} />
            </label>
            <label className="grid gap-1 text-xs text-fog">
              Amount
              <input className="field mono" value={amount} onChange={(e) => setAmount(e.target.value.trim())} placeholder="1.5" inputMode="decimal" />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {w.address ? (
              w.onRobinhoodChain ? (
                <button type="button" className="btn btn-primary" onClick={sendFromWallet} disabled={!amountOk || busy || Boolean(txHash)}>
                  {busy ? "Confirm in wallet…" : txHash ? "Sent" : `Send ${amountOk ? amount : ""} ${token} from wallet`}
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={w.switchChain}>
                  Switch to Robinhood Chain
                </button>
              )
            ) : (
              <button type="button" className="btn btn-primary" onClick={w.connect} disabled={w.busy}>
                {w.busy ? "Connecting…" : "Connect wallet to send"}
              </button>
            )}
            <span className="text-xs text-fog">or send to the address above from any wallet, then paste the tx hash:</span>
          </div>
          {!txHash && (
            <input className="field mono" value={manualTx} onChange={(e) => setManualTx(e.target.value.trim())} placeholder="0x… transaction hash (optional)" spellCheck={false} />
          )}
          {txHash && (
            <p className="text-sm">
              <span className="text-fog">Transaction: </span>
              <a className="mono text-mask" href={explorerTx(txHash)} target="_blank" rel="noreferrer">
                {txHash}
              </a>
            </p>
          )}

          {receipt && (
            <div className="rounded-xl border border-mask/40 bg-ink-3 p-4 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="font-semibold">Receipt for the recipient</p>
                <p className="mt-1 text-sm text-fog">
                  This QR carries the ephemeral key. The recipient scans it in Ghost Receive, their viewing key
                  recognises the payment, and their spending key unlocks the address. Without it they cannot find the
                  funds, so send it.
                </p>
                <p className="mt-3 mono break-all text-xs">{receipt}</p>
                <button type="button" className="btn btn-ghost text-sm mt-2" onClick={() => copy("receipt", receipt)}>
                  {copied === "receipt" ? "Copied" : "Copy receipt link"}
                </button>
              </div>
              <div className="justify-self-center lg:justify-self-end">
                <QrCode value={receipt} size={200} label="Receipt QR" />
              </div>
            </div>
          )}
          <p className="text-xs text-fog/70">
            Stock tokens are issued by a third party and may enforce transfer restrictions. Test with a small amount
            first. RhMask never holds funds and never sees a private key.
          </p>
        </div>
      )}
    </div>
  );
}
