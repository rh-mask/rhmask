"use client";

import { useSyncExternalStore } from "react";
import type { StealthKeys } from "@/lib/stealth";
import { isEncryptedKeys, openKeys, parseKeys, sealKeys, type EncryptedKeys } from "@/lib/keycrypto";

/**
 * Local stealth key store for the dapp.
 *
 * Two on-disk formats in localStorage:
 *   v1  plaintext JSON  { spendingKey, viewingKey, metaAddress }
 *   v2  encrypted       { v: 2, kdf: "pbkdf2-sha256", iter, salt, iv, ct }   (see keycrypto.ts)
 * Decrypted keys live in memory only and are dropped on lock or reload.
 *
 * Everything is exposed through useSyncExternalStore so the server render
 * (no keys) and the first client frame agree, and every card on the
 * dashboard sees the same state.
 */
const STORAGE_KEY = "rhmask.stealth.keys.v1";

export type KeyState = {
  /** Decrypted keys, or null when none are stored or the store is locked. */
  keys: StealthKeys | null;
  /** True once the client has read storage. */
  hydrated: boolean;
  /** True when the stored keys are passphrase-encrypted. */
  encrypted: boolean;
  /** True when encrypted keys exist and have not been unlocked this session. */
  locked: boolean;
};

const listeners = new Set<() => void>();
let memoryKeys: StealthKeys | null = null;
let cached: { raw: string | null; mem: StealthKeys | null; state: KeyState } | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable: nothing persists */
  }
  notify();
}

function notify() {
  cached = null;
  listeners.forEach((cb) => cb());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export { parseKeys };

function getSnapshot(): KeyState {
  const raw = readRaw();
  if (cached && cached.raw === raw && cached.mem === memoryKeys) return cached.state;
  const state: KeyState = isEncryptedKeys(raw)
    ? { keys: memoryKeys, hydrated: true, encrypted: true, locked: memoryKeys === null }
    : { keys: parseKeys(raw), hydrated: true, encrypted: false, locked: false };
  cached = { raw, mem: memoryKeys, state };
  return state;
}

const SERVER_STATE: KeyState = { keys: null, hydrated: false, encrypted: false, locked: false };

export function useStealthKeys(): KeyState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Store keys in plaintext (v1). Replaces whatever is there. */
export function saveKeys(keys: StealthKeys) {
  memoryKeys = null;
  writeRaw(JSON.stringify(keys));
}

export function clearKeys() {
  memoryKeys = null;
  writeRaw(null);
}

/** Forget the decrypted copy; the encrypted blob stays on disk. */
export function lockKeys() {
  memoryKeys = null;
  notify();
}

/** Encrypt the given keys under a passphrase and store the blob (v2). Keys stay unlocked in memory. */
export async function encryptKeys(keys: StealthKeys, passphrase: string) {
  const blob = await sealKeys(keys, passphrase);
  memoryKeys = keys;
  writeRaw(JSON.stringify(blob));
}

/** Decrypt the stored blob into memory. Throws on a wrong passphrase. */
export async function unlockKeys(passphrase: string): Promise<StealthKeys> {
  const raw = readRaw();
  if (!isEncryptedKeys(raw)) throw new Error("No encrypted keys on this device.");
  const keys = await openKeys(JSON.parse(raw as string) as EncryptedKeys, passphrase);
  memoryKeys = keys;
  notify();
  return keys;
}

/** Drop the passphrase: store the unlocked keys in plaintext again. */
export function removeEncryption() {
  if (!memoryKeys) throw new Error("Unlock first.");
  saveKeys(memoryKeys);
}
