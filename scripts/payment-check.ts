/**
 * Round-trip check for the Private Pay wire formats. Run: node scripts/payment-check.ts
 *
 * 1. Recipient builds a payment request URL from their meta-address; the sender
 *    parses it back (also as a bare meta-address and as a bare query string).
 * 2. Sender derives a one-time address and encodes the receipt (announcement).
 * 3. Recipient parses the receipt and recovers the stealth private key with
 *    checkAnnouncement; a stranger cannot.
 * 4. Malformed inputs are rejected with a message, never accepted.
 */
import { generateStealthKeys, deriveStealthAddress, checkAnnouncement } from "../src/lib/stealth.ts";
import {
  encodePaymentRequest,
  parsePaymentInput,
  encodeAnnouncement,
  parseAnnouncementInput,
} from "../src/lib/payment.ts";

const origin = "https://rhmask.org";
const keys = generateStealthKeys();

// 1. payment request
const link = encodePaymentRequest({ to: keys.metaAddress, token: "nvda", amount: "1.5", memo: "invoice 42" }, origin);
const req = parsePaymentInput(link);
if (req.to !== keys.metaAddress) throw new Error("meta-address did not round-trip");
if (req.token !== "NVDA" || req.amount !== "1.5" || req.memo !== "invoice 42") throw new Error("request fields did not round-trip");
if (parsePaymentInput(keys.metaAddress).to !== keys.metaAddress) throw new Error("bare meta-address rejected");
if (parsePaymentInput(new URL(link).search).to !== keys.metaAddress) throw new Error("bare query string rejected");
const foreign = parsePaymentInput(link.replace(origin, "https://someone-else.example"));
if (foreign.to !== keys.metaAddress) throw new Error("request from another origin rejected");
const badToken = parsePaymentInput(`${origin}/pay?to=${keys.metaAddress}&token=DOGE&amount=abc`);
if (badToken.token !== undefined || badToken.amount !== undefined) throw new Error("unknown token or bad amount was accepted");

// 2. receipt
const d = deriveStealthAddress(req.to);
const tx = `0x${"ab".repeat(32)}` as const;
const receipt = encodeAnnouncement({ ...d, txHash: tx, token: "NVDA", amount: "1.5" }, origin);
if (!receipt.endsWith("#receive")) throw new Error("receipt should open the receive tab");

// 3. claim
const a = parseAnnouncementInput(receipt);
if (a.stealthAddress !== d.stealthAddress || a.ephemeralPublicKey !== d.ephemeralPublicKey || a.viewTag !== d.viewTag) {
  throw new Error("announcement did not round-trip");
}
if (a.txHash !== tx || a.token !== "NVDA" || a.amount !== "1.5") throw new Error("receipt extras did not round-trip");
const priv = checkAnnouncement(keys, a.ephemeralPublicKey, a.stealthAddress, a.viewTag);
if (!priv) throw new Error("recipient could not claim their own receipt");
const stranger = generateStealthKeys();
if (checkAnnouncement(stranger, a.ephemeralPublicKey, a.stealthAddress, a.viewTag) !== null) {
  throw new Error("a stranger claimed someone else's receipt");
}
const asJson = parseAnnouncementInput(JSON.stringify({ addr: d.stealthAddress, eph: d.ephemeralPublicKey, tag: d.viewTag }));
if (asJson.stealthAddress !== d.stealthAddress) throw new Error("JSON announcement rejected");

// 4. rejects
const mustThrow = (label: string, fn: () => unknown) => {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`${label} was accepted`);
};
mustThrow("garbage payment input", () => parsePaymentInput("hello"));
mustThrow("short meta-address", () => parsePaymentInput("st:eth:0x1234"));
mustThrow("receipt without eph", () => parseAnnouncementInput(`?claim=1&addr=${d.stealthAddress}&tag=1`));
mustThrow("receipt with bad tag", () => parseAnnouncementInput(`?claim=1&addr=${d.stealthAddress}&eph=${d.ephemeralPublicKey}&tag=999`));

console.log("payment round-trip ok", d.stealthAddress, "viewTag", d.viewTag);
