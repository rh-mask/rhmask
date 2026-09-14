"use client";

import { useSyncExternalStore } from "react";
import type { StealthKeys } from "@/lib/stealth";

/**
 * Local stealth key store.
 *
 * Two on-disk formats in localStorage:
 *   v1  plaintext JSON  { spendingKey, viewingKey, metaAddress }
 *   v2  encrypted       { v: 2, kdf: "pbkdf2-sha256", iter, salt, iv, ct }
 *       AES-256-GCM over the v1 JSON; key derived from a passphrase with
 *       PBKDF2-SHA256 (WebCrypto). Decrypted keys live in memory only and
 *       are dropped on lock or reload.
 *
 * Everything is exposed through useSyncExternalStore so the server render
 * (no keys) and the first client frame agree, and every card on the
 * dashboard sees the same state.
 */
const STORAGE_KEY = "rhmask.stealth.keys.v1";
const HEX32 = /^0x[0-9a-fA-F]{64}$/;
const META = /^st:eth:0x[0-9a-fA-F]{132}$/;
const PBKDF2_ITERATIONS = 310_000;

type EncryptedBlob = { v: 2; kdf: "pbkdf2-sha256"; iter: number; salt: string; iv: string; ct: string };

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

export function parseKeys(raw: string | null): StealthKeys | null {
  if (!raw) return null;
  try {
    const k = JSON.parse(raw) as Partial<StealthKeys>;
    if (
      typeof k.spendingKey !== "string" || !HEX32.test(k.spendingKey) ||
      typeof k.viewingKey !== "string" || !HEX32.test(k.viewingKey) ||
      typeof k.metaAddress !== "string" || !META.test(k.metaAddress)
    ) {
      return null;
    }
    return { spendingKey: k.spendingKey, viewingKey: k.viewingKey, metaAddress: k.metaAddress };
  } catch {
    return null;
  }
}

function parseBlob(raw: string | null): EncryptedBlob | null {
  if (!raw) return null;
  try {
    const b = JSON.parse(raw) as Partial<EncryptedBlob>;
    if (b.v === 2 && b.kdf === "pbkdf2-sha256" && typeof b.iter === "number" && b.salt && b.iv && b.ct) return b as EncryptedBlob;
  } catch {
    /* not a blob */
  }
  return null;
}

function getSnapshot(): KeyState {
  const raw = readRaw();
  if (cached && cached.raw === raw && cached.mem === memoryKeys) return cached.state;
  const blob = parseBlob(raw);
  const state: KeyState = blob
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

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveAesKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt the given keys under a passphrase and store the blob (v2). Keys stay unlocked in memory. */
export async function encryptKeys(keys: StealthKeys, passphrase: string) {
  if (passphrase.length < 8) throw new Error("Use a passphrase of at least 8 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aes = await deriveAesKey(passphrase, salt, PBKDF2_ITERATIONS);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, aes, enc.encode(JSON.stringify(keys))));
  const blob: EncryptedBlob = { v: 2, kdf: "pbkdf2-sha256", iter: PBKDF2_ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  memoryKeys = keys;
  writeRaw(JSON.stringify(blob));
}

/** Decrypt the stored blob into memory. Throws on a wrong passphrase. */
export async function unlockKeys(passphrase: string): Promise<StealthKeys> {
  const blob = parseBlob(readRaw());
  if (!blob) throw new Error("No encrypted keys on this device.");
  const aes = await deriveAesKey(passphrase, unb64(blob.salt), blob.iter);
  let plain: string;
  try {
    plain = dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(blob.iv) as BufferSource }, aes, unb64(blob.ct) as BufferSource));
  } catch {
    throw new Error("Wrong passphrase.");
  }
  const keys = parseKeys(plain);
  if (!keys) throw new Error("Stored keys are corrupt.");
  memoryKeys = keys;
  notify();
  return keys;
}

/** Drop the passphrase: store the unlocked keys in plaintext again. */
export function removeEncryption() {
  if (!memoryKeys) throw new Error("Unlock first.");
  const keys = memoryKeys;
  saveKeys(keys);
}
