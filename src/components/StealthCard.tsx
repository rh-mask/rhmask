"use client";

import { useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/Badge";
import { generateStealthKeys, deriveStealthAddress, type StealthKeys, type StealthDerivation } from "@/lib/stealth";
import { explorerAddress } from "@/lib/chain";

const STORAGE_KEY = "veilstreet.stealth.keys.v1";

/**
 * Local key store exposed through useSyncExternalStore so the server render
 * (no keys) and the first client frame agree, and updates propagate without
 * setState-in-effect.
 */
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function writeRaw(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable: nothing persists */
  }
  listeners.forEach((cb) => cb());
}

function parseKeys(raw: string | null): StealthKeys | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StealthKeys;
  } catch {
    return null;
  }
}

const subscribeHydration = () => () => {};

export function StealthCard() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const keys = parseKeys(raw);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [reveal, setReveal] = useState(false);
  const [target, setTarget] = useState("");
  const [derived, setDerived] = useState<StealthDerivation | null>(null);
  const [error, setError] = useState<string | null>(null);

  function create() {
    setReveal(false);
    writeRaw(JSON.stringify(generateStealthKeys()));
  }

  function forget() {
    setReveal(false);
    writeRaw(null);
  }

  function derive() {
    setError(null);
    try {
      setDerived(deriveStealthAddress(target));
    } catch (err) {
      setDerived(null);
      setError(err instanceof Error ? err.message : "derivation failed");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Your meta-address</h2>
          <Badge tone="veil">client-side</Badge>
        </div>
        <p className="mt-2 text-sm text-fog">
          Share this once. Every sender derives a new address from it. Keys are generated in this browser and stored
          only here.
        </p>
        {keys ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-line bg-ink-3 p-3">
              <p className="text-xs text-fog mb-1">Meta-address</p>
              <p className="mono">{keys.metaAddress}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-ghost text-sm" onClick={() => navigator.clipboard?.writeText(keys.metaAddress)}>
                Copy
              </button>
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setReveal((v) => !v)}>
                {reveal ? "Hide keys" : "Reveal keys"}
              </button>
              <button type="button" className="btn btn-ghost text-sm text-warn" onClick={forget}>
                Forget keys
              </button>
            </div>
            {reveal && (
              <div className="rounded-xl border border-warn/40 bg-ink-3 p-3 space-y-2">
                <p className="text-xs text-warn">Back these up. Losing the spending key loses every stealth balance.</p>
                <p className="text-xs text-fog">Spending key</p>
                <p className="mono">{keys.spendingKey}</p>
                <p className="text-xs text-fog">Viewing key</p>
                <p className="mono">{keys.viewingKey}</p>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="btn btn-primary mt-4" onClick={create} disabled={!hydrated}>
            Generate keys
          </button>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Send to someone unseen</h2>
        <p className="mt-2 text-sm text-fog">
          Paste a meta-address to derive a one-time address. Send stock tokens or ETH to it from any wallet. Then share
          the ephemeral key with the recipient (the announcer contract will do this on-chain when it ships).
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            className="field mono"
            placeholder="st:eth:0x…"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            spellCheck={false}
          />
          <button type="button" className="btn btn-primary shrink-0" onClick={derive} disabled={!target}>
            Derive address
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-warn">{error}</p>}
        {derived && (
          <div className="mt-4 rounded-xl border border-line bg-ink-3 p-3 space-y-2">
            <p className="text-xs text-fog">One-time address</p>
            <a className="mono text-veil" href={explorerAddress(derived.stealthAddress)} target="_blank" rel="noreferrer">
              {derived.stealthAddress}
            </a>
            <p className="text-xs text-fog">Ephemeral public key (give this to the recipient)</p>
            <p className="mono">{derived.ephemeralPublicKey}</p>
            <p className="text-xs text-fog">View tag: {derived.viewTag}</p>
          </div>
        )}
      </div>
    </div>
  );
}
