"use client";

import { useWallet } from "@/hooks/useWallet";
import { shortAddress } from "@/lib/format";

export function WalletButton() {
  const w = useWallet();

  if (!w.address) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button type="button" className="btn btn-ghost text-sm" onClick={w.connect} disabled={w.busy}>
          {w.busy ? "Connecting…" : "Connect wallet"}
        </button>
        {w.error && <p className="text-xs text-warn max-w-60 text-right">{w.error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!w.onRobinhoodChain && (
        <button type="button" className="btn btn-primary text-sm py-1.5!" onClick={w.switchChain}>
          Switch to Robinhood Chain
        </button>
      )}
      <button type="button" className="btn btn-ghost text-sm mono" onClick={w.disconnect} title="Disconnect">
        {shortAddress(w.address)}
      </button>
    </div>
  );
}
