"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { explorerTx } from "@/lib/chain";

type VaultSummary = {
  live: boolean;
  contract: string | null;
  totalStaked: string;
  stakers: number;
  basket: { symbol: string; address: string }[];
  payouts: { txHash: string; symbol: string; amount: string; at: string }[];
  revenueSources: { id: string; label: string; live: boolean }[];
};

export function VaultCard() {
  const [data, setData] = useState<VaultSummary | null>(null);

  useEffect(() => {
    fetch("/api/vault")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Blue Chip Vault</h2>
          <Badge tone={data?.live ? "mask" : "warn"}>{data?.live ? "live" : "planned"}</Badge>
        </div>
        <p className="mt-2 text-sm text-fog">
          Stake $MASK, get paid in stock tokens. Revenue from routing fees and $MASK trading fees buys the basket on-chain
          and streams it to stakers. Nothing is estimated: if a payout has no hash, it is not counted.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Total staked", data ? data.totalStaked : "—"],
            ["Stakers", data ? String(data.stakers) : "—"],
            ["Payouts", data ? String(data.payouts.length) : "—"],
            ["Contract", data?.contract ?? "not deployed"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-ink-3 p-3">
              <p className="text-xs text-fog">{k}</p>
              <p className="mt-1 font-semibold truncate">{v}</p>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-primary mt-5" disabled>
          Stake (after launch)
        </button>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold">Revenue sources</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {(data?.revenueSources ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3">
              <span>{s.label}</span>
              <Badge tone={s.live ? "mask" : "fog"}>{s.live ? "live" : "not yet"}</Badge>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold">Proof ledger</h3>
        {data && data.payouts.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            {data.payouts.map((p) => (
              <li key={p.txHash} className="flex justify-between gap-3">
                <span>{p.amount} {p.symbol}</span>
                <a className="mono text-mask" href={explorerTx(p.txHash)} target="_blank" rel="noreferrer">{p.txHash.slice(0, 10)}…</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-fog">No payouts yet. The first one will appear here with its transaction hash.</p>
        )}
      </div>
    </div>
  );
}
