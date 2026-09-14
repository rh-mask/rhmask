/**
 * Popup: keys and meta-address (text + QR), backup / restore, chip injection
 * on the current tab, the list of one-time addresses handed out, and a
 * "derive for someone" helper. Same crypto as the dapp (src/lib/stealth.ts).
 */
import { generateStealthKeys, deriveStealthAddress, keysFromPrivate, type StealthKeys } from "../../src/lib/stealth";
import { qrMatrix, qrPath } from "../../src/lib/qr";
import { addReceipt, claimLink, getAppUrl, getKeys, getReceipts, setKeys, type Receipt } from "./store";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const HEX32 = /^0x[0-9a-fA-F]{64}$/;
const META = /^st:eth:0x[0-9a-fA-F]{132}$/;

let keys: StealthKeys | null = null;
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
  try {
    const k = JSON.parse(t) as Partial<StealthKeys>;
    if (typeof k.spendingKey === "string" && HEX32.test(k.spendingKey) && typeof k.viewingKey === "string" && HEX32.test(k.viewingKey) && typeof k.metaAddress === "string" && META.test(k.metaAddress)) {
      return { spendingKey: k.spendingKey, viewingKey: k.viewingKey, metaAddress: k.metaAddress };
    }
  } catch {
    /* not JSON */
  }
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
  keys = await getKeys();
  show($("no-keys"), !keys);
  show($("has-keys"), Boolean(keys));
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
    const when = new Date(r.createdAt).toLocaleString();
    li.innerHTML = `<span class="mono">${r.stealthAddress}</span><span class="fog">${r.origin} · ${when}</span>`;
    const a = document.createElement("a");
    a.href = claimLink(appUrl, r);
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = "Open receipt in the app";
    li.appendChild(a);
    ul.appendChild(li);
  }
}

/** Derive a fresh address from our own meta-address and remember the receipt. */
async function freshReceivingAddress(origin: string): Promise<Receipt> {
  if (!keys) throw new Error("no keys");
  const d = deriveStealthAddress(keys.metaAddress);
  const receipt: Receipt = { ...d, origin, createdAt: Date.now() };
  await addReceipt(receipt);
  await renderReceipts();
  return receipt;
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function init() {
  appUrl = await getAppUrl();
  $<HTMLAnchorElement>("open-app").href = `${appUrl}/app`;
  $("app-url-label").textContent = new URL(appUrl).host;
  await renderKeys();
  await renderReceipts();

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
  $("copy-meta").onclick = (e) => keys && copy(keys.metaAddress, e.currentTarget as HTMLButtonElement);
  $("backup").onclick = () => {
    if (!keys) return;
    const blob = new Blob([JSON.stringify(keys, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rhmask-keys-${keys.metaAddress.slice(9, 17)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  $("reveal").onclick = () => {
    const box = $("revealed");
    show(box, box.hidden);
    $("reveal").textContent = box.hidden ? "Reveal keys" : "Hide keys";
  };
  $("forget").onclick = async () => {
    if (!confirm("Forget these keys in this extension? Any unswept stealth balance becomes unreachable without a backup.")) return;
    await setKeys(null);
    await renderKeys();
  };

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

  $("derive").onclick = () => {
    const target = $<HTMLInputElement>("target").value.trim();
    try {
      const d = deriveStealthAddress(target);
      const u = new URL("/app", appUrl);
      u.searchParams.set("claim", "1");
      u.searchParams.set("addr", d.stealthAddress);
      u.searchParams.set("eph", d.ephemeralPublicKey);
      u.searchParams.set("tag", String(d.viewTag));
      u.hash = "receive";
      $("derived-addr").textContent = d.stealthAddress;
      $("derived-receipt").textContent = u.toString();
      show($("derived"), true);
      msg("derive-msg", null);
    } catch (err) {
      show($("derived"), false);
      msg("derive-msg", err instanceof Error ? err.message : "derivation failed");
    }
  };
  $("copy-derived").onclick = (e) => copy($("derived-addr").textContent ?? "", e.currentTarget as HTMLButtonElement);
  $("copy-receipt").onclick = (e) => copy($("derived-receipt").textContent ?? "", e.currentTarget as HTMLButtonElement);

  // Chip clicks are answered by the service worker (popup may be closed); refresh the list when storage changes.
  chrome.storage.onChanged.addListener((changes) => {
    if (changes["rhmask.receipts.v1"]) renderReceipts();
    if (changes["rhmask.keys.v1"]) renderKeys();
  });
}

init();
