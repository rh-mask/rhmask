/**
 * Content script, injected only when the user clicks "Add RhMask chips" in
 * the popup (activeTab + scripting; no blanket host permission). Finds
 * address-looking inputs and adds a chip next to each. Clicking a chip asks
 * the service worker for a fresh stealth address and pastes it in.
 */
const MARK = "data-rhmask";
const HINT = /address|recipient|wallet|\bto\b|destination|payee|receiver/i;

function looksLikeAddressField(el: HTMLInputElement | HTMLTextAreaElement) {
  if (el instanceof HTMLInputElement && !/^(text|search|url|email|)$/.test(el.type)) return false;
  const bits = [el.name, el.id, el.placeholder, el.getAttribute("aria-label") ?? "", el.title, el.autocomplete]
    .filter(Boolean)
    .join(" ");
  if (HINT.test(bits)) return true;
  const label = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent ?? "" : "";
  if (HINT.test(label)) return true;
  const value = el.value.trim();
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function setValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  // Go through the prototype setter so React/Vue controlled inputs notice the change.
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function chipFor(el: HTMLInputElement | HTMLTextAreaElement) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.textContent = "RhMask: fresh address";
  chip.setAttribute(MARK, "chip");
  Object.assign(chip.style, {
    all: "initial",
    display: "inline-block",
    margin: "4px 0 0 0",
    padding: "3px 8px",
    font: "600 11px ui-sans-serif, system-ui, sans-serif",
    color: "#000000",
    background: "#ccff00",
    border: "1px solid #a8d400",
    borderRadius: "0",
    cursor: "pointer",
    zIndex: "2147483647",
  } as CSSStyleDeclaration);
  chip.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    chip.textContent = "Deriving…";
    try {
      const res = (await chrome.runtime.sendMessage({ type: "rhmask:fresh", origin: location.hostname })) as { address?: string; error?: string };
      if (res?.address) {
        setValue(el, res.address);
        chip.textContent = "Pasted. Receipt saved in RhMask.";
      } else {
        chip.textContent = res?.error ?? "Failed";
      }
    } catch (err) {
      chip.textContent = err instanceof Error ? err.message : "Failed";
    }
    setTimeout(() => (chip.textContent = "RhMask: fresh address"), 2500);
  });
  return chip;
}

function scan(): number {
  let count = 0;
  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  for (const el of fields) {
    if (el.getAttribute(MARK) === "field") continue;
    if (!looksLikeAddressField(el)) continue;
    el.setAttribute(MARK, "field");
    el.insertAdjacentElement("afterend", chipFor(el));
    count++;
  }
  return count;
}

chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
  if (message?.type !== "rhmask:scan") return false;
  sendResponse({ count: scan() });
  return false;
});

scan();
