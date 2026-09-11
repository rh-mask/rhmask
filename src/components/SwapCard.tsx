"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";

type QuoteResponse = {
  correlationId: string;
  quote: {
    depositAddress?: string;
    amountInFormatted: string;
    amountInUsd?: string;
    amountOutFormatted: string;
    amountOutUsd?: string;
    timeEstimate: number;
  };
};

/**
 * Minimal quote card. Asset ids are the router's canonical ids; a picker
 * backed by /api/tokens and the router token list replaces the raw inputs
 * in the next iteration.
 */
export function SwapCard() {
  const [originAsset, setOriginAsset] = useState("");
  const [destinationAsset, setDestinationAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [refundTo, setRefundTo] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function getQuote() {
    setBusy(true);
    setError(null);
    setQuote(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ originAsset, destinationAsset, amount, recipient, refundTo, dry: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `quote failed (${res.status})`);
      setQuote(json as QuoteResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "quote failed");
    } finally {
      setBusy(false);
    }
  }

  const ready = originAsset && destinationAsset && /^\d+$/.test(amount) && recipient && refundTo;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Veil Swap</h2>
        <Badge tone="veil">beta · dry quotes</Badge>
      </div>
      <p className="mt-2 text-sm text-fog">
        Private fill, one receipt. Fee is printed on the quote before you send anything. Your wallet deposits straight
        to the venue; VeilStreet never holds funds.
      </p>

      <div className="mt-5 grid gap-3">
        <label className="grid gap-1 text-xs text-fog">
          Origin asset id
          <input className="field mono" value={originAsset} onChange={(e) => setOriginAsset(e.target.value)} placeholder="nep141:eth.omft.near" spellCheck={false} />
        </label>
        <label className="grid gap-1 text-xs text-fog">
          Destination asset id
          <input className="field mono" value={destinationAsset} onChange={(e) => setDestinationAsset(e.target.value)} placeholder="nep141:arb-0x….omft.near" spellCheck={false} />
        </label>
        <label className="grid gap-1 text-xs text-fog">
          Amount (base units)
          <input className="field mono" value={amount} onChange={(e) => setAmount(e.target.value.trim())} placeholder="1000000000000000" inputMode="numeric" />
        </label>
        <label className="grid gap-1 text-xs text-fog">
          Receiving address
          <input className="field mono" value={recipient} onChange={(e) => setRecipient(e.target.value.trim())} placeholder="0x… or a stealth address" spellCheck={false} />
        </label>
        <label className="grid gap-1 text-xs text-fog">
          Refund address
          <input className="field mono" value={refundTo} onChange={(e) => setRefundTo(e.target.value.trim())} placeholder="0x…" spellCheck={false} />
        </label>
        <button type="button" className="btn btn-primary" onClick={getQuote} disabled={!ready || busy}>
          {busy ? "Quoting…" : "Get quote"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-warn">{error}</p>}

      {quote && (
        <div className="mt-5 rounded-xl border border-line bg-ink-3 p-4 text-sm grid gap-1">
          <div className="flex justify-between"><span className="text-fog">You send</span><span>{quote.quote.amountInFormatted}{quote.quote.amountInUsd ? ` (~$${quote.quote.amountInUsd})` : ""}</span></div>
          <div className="flex justify-between"><span className="text-fog">You receive</span><span>{quote.quote.amountOutFormatted}{quote.quote.amountOutUsd ? ` (~$${quote.quote.amountOutUsd})` : ""}</span></div>
          <div className="flex justify-between"><span className="text-fog">Estimated time</span><span>{quote.quote.timeEstimate}s</span></div>
          <div className="flex justify-between"><span className="text-fog">Route</span><span>Private fill · intent router</span></div>
          <p className="mt-2 text-xs text-fog/70">Dry quote. Live deposit addresses are enabled once the router key is configured.</p>
        </div>
      )}
    </div>
  );
}
