"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { QrCode } from "@/components/QrCode";
import { QrScanner } from "@/components/QrScanner";
import { ClaimCard } from "@/components/ClaimCard";
import { clearKeys, encryptKeys, lockKeys, parseKeys, removeEncryption, saveKeys, unlockKeys, useStealthKeys } from "@/lib/keystore";
import { generateStealthKeys, deriveStealthAddress, keysFromPrivate, type StealthDerivation } from "@/lib/stealth";
import { encodeAnnouncement } from "@/lib/payment";
import { explorerAddress } from "@/lib/chain";

const HEX32 = /^0x[0-9a-fA-F]{64}$/;

/**
 * Ghost Receive. Generate the key pair, publish the meta-address (text or
 * QR), back the keys up, restore them, derive one-time addresses for other
 * people, and claim payments that were sent to you. Everything runs in the
 * browser; the network is only touched when you read a balance or sweep.
 */
export function StealthCard() {
  const { keys, hydrated, encrypted, locked } = useStealthKeys();
  const [reveal, setReveal] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [passBusy, setPassBusy] = useState(false);
  const [showQr, setShowQr] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreText, setRestoreText] = useState("");

  const [target, setTarget] = useState("");
  const [derived, setDerived] = useState<StealthDerivation | null>(null);
  const [deriveError, setDeriveError] = useState<string | null>(null);

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setError("Clipboard unavailable. Select the text and copy it manually.");
    }
  }

  function create() {
    setError(null);
    setReveal(false);
    saveKeys(generateStealthKeys());
  }

  function forget() {
    if (!window.confirm("Forget these keys on this device? Any unswept stealth balance becomes unreachable without a backup.")) return;
    setReveal(false);
    clearKeys();
  }

  function backup() {
    if (!keys) return;
    const blob = new Blob([JSON.stringify(keys, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rhmask-keys-${keys.metaAddress.slice(9, 17)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function restore(text: string) {
    setError(null);
    const trimmed = text.trim();
    // Accept a backup JSON, or two raw private keys separated by whitespace / newline.
    let parsed = parseKeys(trimmed);
    if (!parsed) {
      const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
      if (parts.length === 2 && HEX32.test(parts[0]) && HEX32.test(parts[1])) {
        try {
          parsed = keysFromPrivate(parts[0] as `0x${string}`, parts[1] as `0x${string}`);
        } catch {
          parsed = null;
        }
      }
    }
    if (!parsed) {
      setError("Not a valid backup. Paste the backup JSON, or the spending key and viewing key on two lines.");
      return;
    }
    saveKeys(parsed);
    setRestoreOpen(false);
    setRestoreText("");
  }

  async function encrypt() {
    if (!keys) return;
    setError(null);
    if (pass !== pass2) {
      setError("Passphrases do not match.");
      return;
    }
    setPassBusy(true);
    try {
      await encryptKeys(keys, pass);
      setPassOpen(false);
      setPass("");
      setPass2("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "encryption failed");
    } finally {
      setPassBusy(false);
    }
  }

  async function unlock() {
    setError(null);
    setPassBusy(true);
    try {
      await unlockKeys(pass);
      setPass("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "unlock failed");
    } finally {
      setPassBusy(false);
    }
  }

  function derive() {
    setDeriveError(null);
    try {
      setDerived(deriveStealthAddress(target));
    } catch (err) {
      setDerived(null);
      setDeriveError(err instanceof Error ? err.message : "derivation failed");
    }
  }

  const derivedReceipt = derived
    ? encodeAnnouncement({
        stealthAddress: derived.stealthAddress,
        ephemeralPublicKey: derived.ephemeralPublicKey,
        viewTag: derived.viewTag,
      })
    : null;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Your stealth keys and meta-address</h2>
          <Badge tone="mask">{encrypted ? "encrypted · client-side" : "client-side"}</Badge>
        </div>
        <p className="mt-2 text-sm text-fog">
          Two keys, generated here and stored only here. Share the meta-address once, as text or QR; every sender
          derives a fresh address from it that only you can spend from.
        </p>

        {!hydrated ? null : locked ? (
          <div className="mt-4 grid gap-3">
            <p className="text-sm text-fog">Your keys are encrypted on this device. Unlock them for this session.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="field"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Passphrase"
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pass) unlock();
                }}
              />
              <button type="button" className="btn btn-primary shrink-0" onClick={unlock} disabled={!pass || passBusy}>
                {passBusy ? "Unlocking…" : "Unlock"}
              </button>
            </div>
            {error && <p className="text-sm text-warn">{error}</p>}
            <button type="button" className="btn btn-ghost text-sm text-warn w-fit" onClick={forget}>
              Forget keys on this device
            </button>
          </div>
        ) : keys ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-ink-3 p-3">
                <p className="text-xs text-fog mb-1">Meta-address</p>
                <p className="mono">{keys.metaAddress}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost text-sm" onClick={() => copy("meta", keys.metaAddress)}>
                  {copied === "meta" ? "Copied" : "Copy"}
                </button>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setShowQr((v) => !v)}>
                  {showQr ? "Hide QR" : "Show QR"}
                </button>
                <button type="button" className="btn btn-ghost text-sm" onClick={backup}>
                  Backup keys
                </button>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setReveal((v) => !v)}>
                  {reveal ? "Hide keys" : "Reveal keys"}
                </button>
                {encrypted ? (
                  <>
                    <button type="button" className="btn btn-ghost text-sm" onClick={() => lockKeys()}>
                      Lock
                    </button>
                    <button type="button" className="btn btn-ghost text-sm" onClick={() => removeEncryption()}>
                      Remove passphrase
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => setPassOpen((v) => !v)}>
                    {passOpen ? "Cancel" : "Encrypt with passphrase"}
                  </button>
                )}
                <button type="button" className="btn btn-ghost text-sm text-warn" onClick={forget}>
                  Forget keys
                </button>
              </div>
              {passOpen && !encrypted && (
                <div className="rounded-xl border border-line bg-ink-3 p-3 grid gap-2">
                  <p className="text-xs text-fog">
                    AES-256-GCM, key derived from your passphrase with PBKDF2 (310k rounds), all in WebCrypto. Forgetting
                    the passphrase means the keys are gone unless you have a backup.
                  </p>
                  <input className="field" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passphrase (8+ characters)" autoComplete="new-password" />
                  <input className="field" type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="Repeat passphrase" autoComplete="new-password" />
                  <button type="button" className="btn btn-primary w-fit" onClick={encrypt} disabled={pass.length < 8 || passBusy}>
                    {passBusy ? "Encrypting…" : "Encrypt and keep unlocked"}
                  </button>
                </div>
              )}
              {reveal && (
                <div className="rounded-xl border border-warn/40 bg-ink-3 p-3 space-y-2">
                  <p className="text-xs text-warn">Back these up. Losing the spending key loses every stealth balance.</p>
                  <p className="text-xs text-fog">Spending key</p>
                  <p className="mono">{keys.spendingKey}</p>
                  <p className="text-xs text-fog">Viewing key</p>
                  <p className="mono">{keys.viewingKey}</p>
                </div>
              )}
              {error && <p className="text-sm text-warn">{error}</p>}
            </div>
            {showQr && (
              <div className="justify-self-center lg:justify-self-end">
                <QrCode value={keys.metaAddress} size={200} label="Meta-address QR" />
                <p className="mt-2 text-center text-xs text-fog">Meta-address only. Safe to show.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={create}>
                Generate keys
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setRestoreOpen((v) => !v)}>
                Restore from backup
              </button>
            </div>
            {restoreOpen && (
              <div className="grid gap-2">
                <QrScanner onResult={restore} label="Scan backup QR" />
                <textarea
                  className="field mono min-h-24"
                  value={restoreText}
                  onChange={(e) => setRestoreText(e.target.value)}
                  placeholder={'{"spendingKey":"0x…","viewingKey":"0x…","metaAddress":"st:eth:0x…"}  or  spending key + viewing key on two lines'}
                  spellCheck={false}
                />
                <button type="button" className="btn btn-primary w-fit" onClick={() => restore(restoreText)} disabled={!restoreText.trim()}>
                  Restore
                </button>
              </div>
            )}
            {error && <p className="text-sm text-warn">{error}</p>}
          </div>
        )}
      </div>

      <ClaimCard />

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Generate a stealth address for someone</h2>
        <p className="mt-2 text-sm text-fog">
          Scan or paste a meta-address to derive a one-time address. Send stock tokens or ETH to it from any wallet,
          then give the recipient the receipt QR so they can claim it. For the full guided flow use the Private Pay tab.
        </p>
        <div className="mt-4 grid gap-3">
          <QrScanner onResult={(t) => setTarget(t)} label="Scan meta-address QR" />
          <div className="flex flex-col sm:flex-row gap-2">
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
        </div>
        {deriveError && <p className="mt-3 text-sm text-warn">{deriveError}</p>}
        {derived && derivedReceipt && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-xl border border-line bg-ink-3 p-3 space-y-2">
              <p className="text-xs text-fog">One-time address</p>
              <a className="mono text-mask" href={explorerAddress(derived.stealthAddress)} target="_blank" rel="noreferrer">
                {derived.stealthAddress}
              </a>
              <p className="text-xs text-fog">Ephemeral public key (part of the receipt)</p>
              <p className="mono">{derived.ephemeralPublicKey}</p>
              <p className="text-xs text-fog">View tag: {derived.viewTag}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className="btn btn-ghost text-sm" onClick={() => copy("addr", derived.stealthAddress)}>
                  {copied === "addr" ? "Copied" : "Copy address"}
                </button>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => copy("receipt", derivedReceipt)}>
                  {copied === "receipt" ? "Copied" : "Copy receipt link"}
                </button>
              </div>
            </div>
            <div className="justify-self-center lg:justify-self-end">
              <QrCode value={derivedReceipt} size={200} label="Receipt QR" />
              <p className="mt-2 text-center text-xs text-fog">Receipt QR for the recipient</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
