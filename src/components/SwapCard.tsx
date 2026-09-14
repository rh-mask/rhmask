"use client";

import { useEffect, useMemo, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { Badge } from "@/components/Badge";
import { useStealthKeys } from "@/lib/keystore";
import { deriveStealthAddress } from "@/lib/stealth";
import { isValidAmount } from "@/lib/payment";

type RouterToken = { assetId: string; symbol: string; blockchain: string; decimals: number; price: number | null };
type TokenList = { count: number; chains: string[]; tokens: RouterToken[] };

type QuoteResponse = {
  correlationId: string;
  quote: {
    depositAddress?: string;
    amountInFormatted: string;
    amountInUsd?: string;
    amountOutFormatted: string;
    amountOutUsd?: string;
    minAmountOut?: string;
    timeEstimate: number;
    deadline?: string;
  };
};

/** Chains whose addresses are EVM-shaped; everything else gets a length check only. */
const EVM_CHAINS = new Set(["eth", "arb", "base", "op", "pol", "bsc", "avax", "gnosis", "bera", "monad", "xlayer", "plasma", "abs", "scroll", "adi", "hypercore"]);

function addressOk(chain: string | undefined, value: string) {
  if (!value) return false;
  if (!chain) return value.length >= 10;
  return EVM_CHAINS.has(chain) ? isAddress(value) : value.length >= 10;
}

function toBaseUnits(amount: string, decimals: number): string | null {
  try {
    return parseUnits(amount, decimals).toString();
  } catch {
    return null;
  }
}

/**
 * Mask Swap. Pick an asset on any supported chain, enter a human amount,
 * choose where the fill should land, get a private quote. The receiving
 * address can be a fresh stealth address derived from your own meta-address,
 * so a swap and a private receive become one action.
 */
export function SwapCard() {
  const { keys } = useStealthKeys();
  const [list, setList] = useState<TokenList | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [fromChain, setFromChain] = useState("");
  const [toChain, setToChain] = useState("");
  const [originAsset, setOriginAsset] = useState("");
  const [destinationAsset, setDestinationAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [refundTo, setRefundTo] = useState("");
  const [search, setSearch] = useState("");

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/router-tokens")
      .then(async (r) => {
        if (!r.ok) throw new Error(`token list ${r.status}`);
        return (await r.json()) as TokenList;
      })
      .then((data) => {
        if (!cancelled) setList(data);
      })
      .catch((e) => {
        if (!cancelled) setListError(e instanceof Error ? e.message : "token list unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byChain = useMemo(() => {
    const m = new Map<string, RouterToken[]>();
    for (const t of list?.tokens ?? []) {
      if (!m.has(t.blockchain)) m.set(t.blockchain, []);
      m.get(t.blockchain)!.push(t);
    }
    return m;
  }, [list]);

  const filterTokens = (chain: string) => {
    const all = chain ? (byChain.get(chain) ?? []) : (list?.tokens ?? []);
    const q = search.trim().toLowerCase();
    return q ? all.filter((t) => t.symbol.toLowerCase().includes(q) || t.assetId.toLowerCase().includes(q)) : all;
  };

  const origin = list?.tokens.find((t) => t.assetId === originAsset);
  const destination = list?.tokens.find((t) => t.assetId === destinationAsset);
  const baseAmount = origin && isValidAmount(amount) ? toBaseUnits(amount, origin.decimals) : null;
  const recipientOk = addressOk(destination?.blockchain, recipient);
  const refundOk = addressOk(origin?.blockchain, refundTo);
  const ready = Boolean(origin && destination && baseAmount && recipientOk && refundOk);

  function useStealthDestination() {
    if (!keys) return;
    try {
      setRecipient(deriveStealthAddress(keys.metaAddress).stealthAddress);
    } catch {
      /* keys validated on load; nothing to do */
    }
  }

  async function getQuote() {
    if (!ready || !baseAmount) return;
    setBusy(true);
    setError(null);
    setQuote(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ originAsset, destinationAsset, amount: baseAmount, recipient, refundTo, dry: true }),
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

  const usd = (v?: string) => (v ? ` (~$${Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 })})` : "");

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Mask Swap</h2>
        <Badge tone="mask">beta · dry quotes</Badge>
      </div>
      <p className="mt-2 text-sm text-fog">
        Private fill, one receipt. Fee is printed on the quote before you send anything. Your wallet deposits straight
        to the venue; RhMask never holds funds.
      </p>

      {listError && <p className="mt-4 text-sm text-warn">Asset list unavailable: {listError}. Retry in a moment.</p>}
      {!list && !listError && <p className="mt-4 text-sm text-fog">Loading assets…</p>}

      {list && (
        <div className="mt-5 grid gap-4">
          <p className="text-xs text-fog">
            {list.count} assets across {list.chains.length} chains from the intent router. Stock tokens on Robinhood Chain
            are not fillable through this route yet; the native route is on the roadmap.
          </p>
          <input
            className="field"
            placeholder="Search symbol or asset id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            spellCheck={false}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <fieldset className="grid gap-2 rounded-xl border border-line p-3">
              <legend className="px-1 text-xs text-fog">You send</legend>
              <select className="field mono" value={fromChain} onChange={(e) => { setFromChain(e.target.value); setOriginAsset(""); }}>
                <option value="">any chain</option>
                {list.chains.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select className="field mono" value={originAsset} onChange={(e) => setOriginAsset(e.target.value)} size={6}>
                {filterTokens(fromChain).map((t) => (
                  <option key={t.assetId} value={t.assetId}>
                    {t.symbol} · {t.blockchain}{t.price ? ` · $${t.price}` : ""}
                  </option>
                ))}
              </select>
              <input
                className="field mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value.trim())}
                placeholder={origin ? `amount in ${origin.symbol}` : "amount"}
                inputMode="decimal"
              />
              {origin && amount && !baseAmount && <span className="text-xs text-warn">Use a plain decimal with at most {origin.decimals} places.</span>}
              <input
                className="field mono"
                value={refundTo}
                onChange={(e) => setRefundTo(e.target.value.trim())}
                placeholder={origin ? `refund address on ${origin.blockchain}` : "refund address"}
                spellCheck={false}
              />
              {refundTo && !refundOk && <span className="text-xs text-warn">Not a valid address for {origin?.blockchain ?? "this chain"}.</span>}
            </fieldset>

            <fieldset className="grid gap-2 rounded-xl border border-line p-3">
              <legend className="px-1 text-xs text-fog">You receive</legend>
              <select className="field mono" value={toChain} onChange={(e) => { setToChain(e.target.value); setDestinationAsset(""); }}>
                <option value="">any chain</option>
                {list.chains.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select className="field mono" value={destinationAsset} onChange={(e) => setDestinationAsset(e.target.value)} size={6}>
                {filterTokens(toChain).map((t) => (
                  <option key={t.assetId} value={t.assetId}>
                    {t.symbol} · {t.blockchain}{t.price ? ` · $${t.price}` : ""}
                  </option>
                ))}
              </select>
              <input
                className="field mono"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
                placeholder={destination ? `receiving address on ${destination.blockchain}` : "receiving address"}
                spellCheck={false}
              />
              {recipient && !recipientOk && <span className="text-xs text-warn">Not a valid address for {destination?.blockchain ?? "this chain"}.</span>}
              {keys && destination && EVM_CHAINS.has(destination.blockchain) && (
                <button type="button" className="btn btn-ghost text-sm w-fit" onClick={useStealthDestination}>
                  Receive on a fresh stealth address
                </button>
              )}
            </fieldset>
          </div>

          <button type="button" className="btn btn-primary" onClick={getQuote} disabled={!ready || busy}>
            {busy ? "Quoting…" : "Get private quote"}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-warn">{error}</p>}

      {quote && (
        <div className="mt-5 rounded-xl border border-line bg-ink-3 p-4 text-sm grid gap-1">
          <div className="flex justify-between"><span className="text-fog">You send</span><span>{quote.quote.amountInFormatted} {origin?.symbol}{usd(quote.quote.amountInUsd)}</span></div>
          <div className="flex justify-between"><span className="text-fog">You receive</span><span>{quote.quote.amountOutFormatted} {destination?.symbol}{usd(quote.quote.amountOutUsd)}</span></div>
          {quote.quote.minAmountOut && <div className="flex justify-between"><span className="text-fog">Minimum after slippage</span><span className="mono">{quote.quote.minAmountOut}</span></div>}
          <div className="flex justify-between"><span className="text-fog">Estimated time</span><span>{quote.quote.timeEstimate}s</span></div>
          <div className="flex justify-between"><span className="text-fog">Route</span><span>Private fill · intent router</span></div>
          <p className="mt-2 text-xs text-fog/70">Dry quote. Live deposit addresses are enabled once the router key is configured.</p>
        </div>
      )}
    </div>
  );
}
