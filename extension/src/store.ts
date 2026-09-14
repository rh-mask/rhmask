/**
 * Extension-side storage. chrome.storage.local, never sync. Beta: plaintext
 * keys, same JSON shape as the dapp's backup file so a backup restores in
 * either place. Passphrase encryption (shared format with the dapp) is the
 * next step.
 */
import type { StealthKeys } from "../../src/lib/stealth";

export type Receipt = {
  /** One-time address handed to a site or a person. */
  stealthAddress: `0x${string}`;
  ephemeralPublicKey: `0x${string}`;
  viewTag: number;
  /** Where it was used (hostname) or "manual". */
  origin: string;
  createdAt: number;
};

const KEYS = "rhmask.keys.v1";
const RECEIPTS = "rhmask.receipts.v1";
const APP_URL = "rhmask.appUrl";
export const DEFAULT_APP_URL = "https://rhmask.org";

export async function getKeys(): Promise<StealthKeys | null> {
  const r = await chrome.storage.local.get(KEYS);
  const k = r[KEYS] as StealthKeys | undefined;
  return k && typeof k.metaAddress === "string" ? k : null;
}

export async function setKeys(keys: StealthKeys | null) {
  if (keys) await chrome.storage.local.set({ [KEYS]: keys });
  else await chrome.storage.local.remove(KEYS);
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
