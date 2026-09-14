/**
 * Passphrase encryption for stealth keys. Pure WebCrypto, no storage, so the
 * dapp (localStorage) and the extension (chrome.storage) share one format:
 *
 *   { v: 2, kdf: "pbkdf2-sha256", iter, salt, iv, ct }
 *
 * AES-256-GCM over the plaintext key JSON; key derived with PBKDF2-SHA256.
 * Works in browsers, extension workers and Node 20+ (globalThis.crypto).
 */
import type { StealthKeys } from "./stealth.ts";

export type EncryptedKeys = { v: 2; kdf: "pbkdf2-sha256"; iter: number; salt: string; iv: string; ct: string };

export const PBKDF2_ITERATIONS = 310_000;
const HEX32 = /^0x[0-9a-fA-F]{64}$/;
const META = /^st:eth:0x[0-9a-fA-F]{132}$/;

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Shape-check a parsed object (or JSON string) as a plaintext key set. */
export function parseKeys(raw: unknown): StealthKeys | null {
  let k: Partial<StealthKeys> | null = null;
  if (typeof raw === "string") {
    try {
      k = JSON.parse(raw) as Partial<StealthKeys>;
    } catch {
      return null;
    }
  } else if (raw && typeof raw === "object") {
    k = raw as Partial<StealthKeys>;
  }
  if (
    !k ||
    typeof k.spendingKey !== "string" || !HEX32.test(k.spendingKey) ||
    typeof k.viewingKey !== "string" || !HEX32.test(k.viewingKey) ||
    typeof k.metaAddress !== "string" || !META.test(k.metaAddress)
  ) {
    return null;
  }
  return { spendingKey: k.spendingKey, viewingKey: k.viewingKey, metaAddress: k.metaAddress };
}

export function isEncryptedKeys(raw: unknown): raw is EncryptedKeys {
  let b: Partial<EncryptedKeys> | null = null;
  if (typeof raw === "string") {
    try {
      b = JSON.parse(raw) as Partial<EncryptedKeys>;
    } catch {
      return false;
    }
  } else if (raw && typeof raw === "object") {
    b = raw as Partial<EncryptedKeys>;
  }
  return Boolean(b && b.v === 2 && b.kdf === "pbkdf2-sha256" && typeof b.iter === "number" && b.salt && b.iv && b.ct);
}

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

/** Encrypt a key set under a passphrase. Throws on a short passphrase. */
export async function sealKeys(keys: StealthKeys, passphrase: string): Promise<EncryptedKeys> {
  if (passphrase.length < 8) throw new Error("Use a passphrase of at least 8 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aes = await deriveAesKey(passphrase, salt, PBKDF2_ITERATIONS);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, aes, enc.encode(JSON.stringify(keys))));
  return { v: 2, kdf: "pbkdf2-sha256", iter: PBKDF2_ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

/** Decrypt a blob. Throws "Wrong passphrase." on auth failure, "Stored keys are corrupt." on a bad payload. */
export async function openKeys(blob: EncryptedKeys, passphrase: string): Promise<StealthKeys> {
  const aes = await deriveAesKey(passphrase, unb64(blob.salt), blob.iter);
  let plain: string;
  try {
    plain = dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(blob.iv) as BufferSource }, aes, unb64(blob.ct) as BufferSource));
  } catch {
    throw new Error("Wrong passphrase.");
  }
  const keys = parseKeys(plain);
  if (!keys) throw new Error("Stored keys are corrupt.");
  return keys;
}
