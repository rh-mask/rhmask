/**
 * Service worker. Owns the one action that must work while the popup is
 * closed: a chip on a page asks for a fresh receiving address, we derive it
 * from the stored meta-address, remember the receipt, and answer.
 */
import { deriveStealthAddress } from "../../src/lib/stealth";
import { addReceipt, getKeys } from "./store";

chrome.runtime.onMessage.addListener((message: { type?: string; origin?: string }, _sender, sendResponse) => {
  if (message?.type !== "rhmask:fresh") return false;
  (async () => {
    const keys = await getKeys();
    if (!keys) {
      sendResponse({ error: "No keys yet. Open the RhMask popup and generate them." });
      return;
    }
    const d = deriveStealthAddress(keys.metaAddress);
    await addReceipt({ ...d, origin: message.origin ?? "page", createdAt: Date.now() });
    sendResponse({ address: d.stealthAddress });
  })().catch((err) => sendResponse({ error: err instanceof Error ? err.message : String(err) }));
  return true;
});
