/**
 * Popup: keys and meta-address (text + QR), backup / restore, passphrase
 * lock / unlock, chip injection on the current tab, the list of one-time
 * addresses handed out, and a "derive for someone" helper. Same crypto and
 * the same encrypted format as the dapp.
 */
import { generateStealthKeys, deriveStealthAddress, keysFromPrivate, type StealthKeys } from "../../src/lib/stealth";
import { parseKeys } from "../../src/lib/keycrypto";
import { qrMatrix, qrPath } from "../../src/lib/qr";
import {
  addReceipt,
  claimLink,
  encryptStoredKeys,
  getAppUrl,
  getKeyState,
  getReceipts,
  KEYS,
  lockKeys,
  RECEIPTS,
  removeEncryption,
  setKeys,
  unlockKeys,
  type KeyState,
  type Receipt,
} from "./store";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const HEX32 = /^0x[0-9a-fA-F]{64}$/;

let state: KeyState = { keys: null, encrypted: false, locked: false };
let appUrl = "https://rhmask.org";

function show(el: HTMLElement, visible: boolean) {
  el.hidden = !visible;
}

function msg(id: string, text: string | null, cls = "warn") {
  const el = $(id);
  el.className = cls;
  el.textContent = text ?? "";
  show(el, Boolean(text));
}

function qrSvg(value: string) {
  const m = qrMatrix(value);
  const quiet = 2;
  const view = m.size + quiet * 2;
  return `<svg viewBox="0 0 ${view} ${view}" shape-rendering="crispEdges" role="img" aria-label="Meta-address QR"><rect width="${view}" height="${view}" fill="#fff"/><path d="${qrPath(m)}" fill="#07080b" transform="translate(${quiet} ${quiet})"/></svg>`;
}

async function copy(text: string, button: HTMLButtonElement, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    const old = button.textContent;
    button.textContent = label;
    setTimeout(() => (button.textContent = old), 1200);
  } catch {
    /* clipboard blocked */
  }
}

function parseBackup(text: string): StealthKeys | null {
  const t = text.trim();
  const parsed = parseKeys(t);
  if (parsed) return parsed;
  const parts = t.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 2 && HEX32.test(parts[0]) && HEX32.test(parts[1])) {
    try {
      return keysFromPrivate(parts[0] as `0x${string}`, parts[1] as `0x${string}`);
    } catch {
      return null;
    }
  }
  return null;
}

async function renderKeys() {
  state = await getKeyState();
  const { keys, encrypted, locked } = state;
  show($("no-keys"), !keys && !locked);
  show($("locked"), locked);
  show($("has-keys"), Boolean(keys));
  show($("encrypt-toggle"), !encrypted);
  show($("lock"), encrypted);
  show($("remove-encryption"), encrypted);
  $("state-tag").textContent = locked ? "locked" : encrypted ? "encrypted" : "beta";
  $<HTMLButtonElement>("inject").disabled = !keys;
  $<HTMLButtonElement>("fresh").disabled = !keys;
  if (keys) {
    $("meta").textContent = keys.metaAddress;
    $("qr").innerHTML = qrSvg(keys.metaAddress);
    $("spend").textContent = keys.spendingKey;
    $("view").textContent = keys.viewingKey;
  }
}

async function renderReceipts() {
  const list = await getReceipts();
  const ul = $("receipts");
  ul.innerHTML = "";
  if (!list.length) {
    ul.innerHTML = '<li class="fog">None yet.</li>';
    return;
  }
  for (const r of list.slice(0, 20)) {
    const li = document.createElement("li");
    const addr = document.createElement("span");
    addr.className = "mono";
    addr.textContent = r.stealthAddress;
    const meta = document.createElement("span");
    meta.className = "fog";
    meta.textContent = `${r.origin} · ${new Date(r.createdAt).toLocaleString()}`;
    const a = document.createElement("a");
    a.href = claimLink(appUrl, r);
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = "Open receipt in the app";
    li.append(addr, meta, a);
    ul.appendChild(li);
  }
}

/** Derive a fresh address from our own meta-address and remember the receipt. */
async function freshReceivingAddress(origin: string): Promise<Receipt> {
  if (!state.keys) throw new Error("no keys");
  const d = deriveStealthAddress(state.keys.metaAddress);
  const receipt: Receipt = { ...d, origin, createdAt: Date.now() };
  await addReceipt(receipt);
  await renderReceipts();
  return receipt;
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function forgetKeys() {
  return (async () => {
    if (!confirm("Forget these keys in this extension? Any unswept stealth balance becomes unreachable without a backup.")) return;
    await setKeys(null);
    await renderKeys();
  })();
}

async function init() {
  appUrl = await getAppUrl();
  $<HTMLAnchorElement>("open-app").href = `${appUrl}/app`;
  $("app-url-label").textContent = new URL(appUrl).host;
  await renderKeys();
  await renderReceipts();

  // keys ------------------------------------------------------------------
  $("generate").onclick = async () => {
    await setKeys(generateStealthKeys());
    msg("keys-msg", null);
    await renderKeys();
  };
  $("restore-toggle").onclick = () => {
    const box = $("restore-box");
    show(box, box.hidden);
  };
  $("restore").onclick = async () => {
    const parsed = parseBackup($<HTMLTextAreaElement>("restore-text").value);
    if (!parsed) {
      msg("keys-msg", "Not a valid backup. Paste the backup JSON, or the spending key and viewing key on two lines.");
      return;
    }
    await setKeys(parsed);
    msg("keys-msg", null);
    await renderKeys();
  };
  $("copy-meta").onclick = (e) => state.keys && copy(state.keys.metaAddress, e.currentTarget as HTMLButtonElement);
  $("backup").onclick = () => {
    if (!state.keys) return;
    const blob = new Blob([JSON.stringify(state.keys, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rhmask-keys-${state.keys.metaAddress.slice(9, 17)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  $("reveal").onclick = () => {
    const box = $("revealed");
    show(box, box.hidden);
    $("reveal").textContent = box.hidden ? "Reveal keys" : "Hide keys";
  };
  $("forget").onclick = forgetKeys;
  $("forget-locked").onclick = forgetKeys;

  // passphrase ------------------------------------------------------------
  $("encrypt-toggle").onclick = () => {
    const box = $("encrypt-box");
    show(box, box.hidden);
  };
  $("encrypt").onclick = async () => {
    if (!state.keys) return;
    const p1 = $<HTMLInputElement>("pass1").value;
    const p2 = $<HTMLInputElement>("pass2").value;
    if (p1 !== p2) {
      msg("keys-msg", "Passphrases do not match.");
      return;
    }
    try {
      await encryptStoredKeys(state.keys, p1);
      $<HTMLInputElement>("pass1").value = "";
      $<HTMLInputElement>("pass2").value = "";
      show($("encrypt-box"), false);
      msg("keys-msg", null);
      await renderKeys();
    } catch (err) {
      msg("keys-msg", err instanceof Error ? err.message : "encryption failed");
    }
  };
  const unlock = async () => {
    const pass = $<HTMLInputElement>("unlock-pass").value;
    if (!pass) return;
    try {
      await unlockKeys(pass);
      $<HTMLInputElement>("unlock-pass").value = "";
      msg("keys-msg", null);
      await renderKeys();
    } catch (err) {
      msg("keys-msg", err instanceof Error ? err.message : "unlock failed");
    }
  };
  $("unlock").onclick = unlock;
  $<HTMLInputElement>("unlock-pass").onkeydown = (e) => {
    if (e.key === "Enter") unlock();
  };
  $("lock").onclick = async () => {
    await lockKeys();
    await renderKeys();
  };
  $("remove-encryption").onclick = async () => {
    try {
      await removeEncryption();
      await renderKeys();
    } catch (err) {
      msg("keys-msg", err instanceof Error ? err.message : "failed");
    }
  };

  // page chips ------------------------------------------------------------
  $("fresh").onclick = async (e) => {
    const r = await freshReceivingAddress("manual");
    await copy(r.stealthAddress, e.currentTarget as HTMLButtonElement, "Copied fresh address");
  };
  $("inject").onclick = async () => {
    const tab = await currentTab();
    if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
      msg("chip-msg", "Open a normal web page first.", "warn");
      return;
    }
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      const res = (await chrome.tabs.sendMessage(tab.id, { type: "rhmask:scan" })) as { count: number } | undefined;
      msg("chip-msg", res ? `${res.count} address field(s) found on ${new URL(tab.url).host}. Click a chip to paste a fresh address.` : "Chips added.", "ok");
    } catch (err) {
      msg("chip-msg", `Could not add chips: ${err instanceof Error ? err.message : String(err)}`, "warn");
    }
  };

  // derive for someone ----------------------------------------------------
  $("derive").onclick = () => {
    const target = $<HTMLInputElement>("target").value.trim();
    try {
      const d = deriveStealthAddress(target);
      $("derived-addr").textContent = d.stealthAddress;
      $("derived-receipt").textContent = claimLink(appUrl, { ...d, origin: "manual", createdAt: Date.now() });
      show($("derived"), true);
      msg("derive-msg", null);
    } catch (err) {
      show($("derived"), false);
      msg("derive-msg", err instanceof Error ? err.message : "derivation failed");
    }
  };
  $("copy-derived").onclick = (e) => copy($("derived-addr").textContent ?? "", e.currentTarget as HTMLButtonElement);
  $("copy-receipt").onclick = (e) => copy($("derived-receipt").textContent ?? "", e.currentTarget as HTMLButtonElement);

  // Chip clicks are answered by the service worker; refresh when storage changes.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[RECEIPTS]) renderReceipts();
    if (changes[KEYS]) renderKeys();
  });
}

init();
