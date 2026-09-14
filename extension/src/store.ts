/**
 * Extension-side storage. chrome.storage.local, never sync.
 *
 * Keys are stored either as plaintext JSON (same shape as the dapp's backup
 * file) or as the shared encrypted blob from src/lib/keycrypto.ts, so a
 * backup restores in either place and a passphrase set here works there.
 * Unlocked keys live in chrome.storage.session (memory only, cleared when
 * the browser closes, unreachable from content scripts).
 */
import type { StealthKeys } from "../../src/lib/stealth";
import { isEncryptedKeys, openKeys, parseKeys, sealKeys, type EncryptedKeys } from "../../src/lib/keycrypto";

export type Receipt = {
  /** One-time address handed to a site or a person. */
  stealthAddress: `0x${string}`;
  ephemeralPublicKey: `0x${string}`;
  viewTag: number;
  /** Where it was used (hostname) or "manual". */
  origin: string;
  createdAt: number;
};

export type KeyState = { keys: StealthKeys | null; encrypted: boolean; locked: boolean };

export const KEYS = "rhmask.keys.v1";
export const RECEIPTS = "rhmask.receipts.v1";
const SESSION_KEYS = "rhmask.session.keys";
const APP_URL = "rhmask.appUrl";
export const DEFAULT_APP_URL = "https://rhmask.org";

async function readStored(): Promise<StealthKeys | EncryptedKeys | null> {
  const r = await chrome.storage.local.get(KEYS);
  const v = r[KEYS];
  if (isEncryptedKeys(v)) return v;
  return parseKeys(v);
}

async function readSession(): Promise<StealthKeys | null> {
  try {
    const r = await chrome.storage.session.get(SESSION_KEYS);
    return parseKeys(r[SESSION_KEYS]);
  } catch {
    return null;
  }
}

async function writeSession(keys: StealthKeys | null) {
  try {
    if (keys) await chrome.storage.session.set({ [SESSION_KEYS]: keys });
    else await chrome.storage.session.remove(SESSION_KEYS);
  } catch {
    /* session storage unavailable: unlocked keys will not survive the popup */
  }
}

/** Plaintext keys, or the unlocked copy of encrypted keys, or null. */
export async function getKeys(): Promise<StealthKeys | null> {
  const stored = await readStored();
  if (!stored) return null;
  if (isEncryptedKeys(stored)) return readSession();
  return stored;
}

export async function getKeyState(): Promise<KeyState> {
  const stored = await readStored();
  if (!stored) return { keys: null, encrypted: false, locked: false };
  if (isEncryptedKeys(stored)) {
    const keys = await readSession();
    return { keys, encrypted: true, locked: keys === null };
  }
  return { keys: stored, encrypted: false, locked: false };
}

/** Store plaintext keys (or remove everything with null). */
export async function setKeys(keys: StealthKeys | null) {
  await writeSession(null);
  if (keys) await chrome.storage.local.set({ [KEYS]: keys });
  else await chrome.storage.local.remove(KEYS);
}

export async function encryptStoredKeys(keys: StealthKeys, passphrase: string) {
  const blob = await sealKeys(keys, passphrase);
  await chrome.storage.local.set({ [KEYS]: blob });
  await writeSession(keys);
}

export async function unlockKeys(passphrase: string): Promise<StealthKeys> {
  const stored = await readStored();
  if (!isEncryptedKeys(stored)) throw new Error("No encrypted keys in this extension.");
  const keys = await openKeys(stored, passphrase);
  await writeSession(keys);
  return keys;
}

export async function lockKeys() {
  await writeSession(null);
}

export async function removeEncryption() {
  const keys = await readSession();
  if (!keys) throw new Error("Unlock first.");
  await setKeys(keys);
}

export async function getReceipts(): Promise<Receipt[]> {
  const r = await chrome.storage.local.get(RECEIPTS);
  return (r[RECEIPTS] as Receipt[] | undefined) ?? [];
}

export async function addReceipt(receipt: Receipt) {
  const all = await getReceipts();
  all.unshift(receipt);
  await chrome.storage.local.set({ [RECEIPTS]: all.slice(0, 200) });
}

export async function getAppUrl(): Promise<string> {
  const r = await chrome.storage.local.get(APP_URL);
  return (r[APP_URL] as string | undefined) || DEFAULT_APP_URL;
}

export async function setAppUrl(url: string) {
  await chrome.storage.local.set({ [APP_URL]: url });
}

/** Claim link the dapp understands: /app?claim=1&addr=…&eph=…&tag=…#receive */
export function claimLink(appUrl: string, r: Receipt) {
  const u = new URL("/app", appUrl);
  u.searchParams.set("claim", "1");
  u.searchParams.set("addr", r.stealthAddress);
  u.searchParams.set("eph", r.ephemeralPublicKey);
  u.searchParams.set("tag", String(r.viewTag));
  u.hash = "receive";
  return u.toString();
}
