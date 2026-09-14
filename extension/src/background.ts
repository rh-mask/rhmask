/**
 * Service worker. Owns the one action that must work while the popup is
 * closed: a chip on a page asks for a fresh receiving address, we derive it
 * from the stored meta-address, remember the receipt, and answer. With
 * encrypted keys this works only while they are unlocked for the session.
 */
import { deriveStealthAddress } from "../../src/lib/stealth";
import { addReceipt, getKeyState } from "./store";

chrome.runtime.onMessage.addListener((message: { type?: string; origin?: string }, _sender, sendResponse) => {
  if (message?.type !== "rhmask:fresh") return false;
  (async () => {
    const state = await getKeyState();
    if (!state.keys) {
      sendResponse({ error: state.locked ? "Keys are locked. Unlock them in the RhMask popup." : "No keys yet. Open the RhMask popup and generate them." });
      return;
    }
    const d = deriveStealthAddress(state.keys.metaAddress);
    await addReceipt({ ...d, origin: message.origin ?? "page", createdAt: Date.now() });
    sendResponse({ address: d.stealthAddress });
  })().catch((err) => sendResponse({ error: err instanceof Error ? err.message : String(err) }));
  return true;
});
