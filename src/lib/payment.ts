/**
 * Private Pay wire formats. Both are plain URLs so a phone camera opens the
 * app directly, and both round-trip through a QR code.
 *
 *   Payment request  (recipient -> sender)
 *     {origin}/pay?to=st:eth:0x…&token=NVDA&amount=1.5&memo=invoice%2042
 *     `to` is the recipient's meta-address; everything else is optional.
 *
 *   Announcement / receipt  (sender -> recipient)
 *     {origin}/app?claim=1&addr=0x…&eph=0x…&tag=87&tx=0x…&token=NVDA&amount=1.5
 *     `addr` is the one-time address, `eph` the 33-byte ephemeral public key,
 *     `tag` the view tag. The recipient's viewing key turns this into the
 *     stealth private key. Until the announcer contract ships, this QR *is*
 *     the announcement.
 */
import { STOCK_TOKENS } from "./tokens.ts";

export const META_ADDRESS_RE = /^st:eth:0x[0-9a-fA-F]{132}$/;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const PUBKEY_RE = /^0x[0-9a-fA-F]{66}$/;
const TX_RE = /^0x[0-9a-fA-F]{64}$/;
const AMOUNT_RE = /^(?:\d+)(?:\.\d{1,18})?$/;

export type PaymentRequest = {
  to: string;
  token?: string;
  amount?: string;
  memo?: string;
};

export type Announcement = {
  stealthAddress: `0x${string}`;
  ephemeralPublicKey: `0x${string}`;
  viewTag: number;
  txHash?: `0x${string}`;
  token?: string;
  amount?: string;
};

export function isKnownToken(symbol: string) {
  return symbol === "ETH" || STOCK_TOKENS.some((t) => t.symbol === symbol.toUpperCase());
}

/** Origin baked into QR links. In the browser it is the page's own origin; on the server the canonical site. */
export function appOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "https://rhmask.org";
}

export function encodePaymentRequest(req: PaymentRequest, origin = appOrigin()) {
  const url = new URL("/pay", origin);
  url.searchParams.set("to", req.to);
  if (req.token) url.searchParams.set("token", req.token.toUpperCase());
  if (req.amount) url.searchParams.set("amount", req.amount);
  if (req.memo) url.searchParams.set("memo", req.memo.slice(0, 140));
  return url.toString();
}

/**
 * Accepts a raw meta-address, a payment-request URL from any origin, or a
 * bare query string. Throws with a human message otherwise.
 */
export function parsePaymentInput(input: string): PaymentRequest {
  const text = input.trim();
  if (META_ADDRESS_RE.test(text)) return { to: text };

  let params: URLSearchParams | null = null;
  try {
    params = new URL(text).searchParams;
  } catch {
    if (text.includes("to=")) params = new URLSearchParams(text.replace(/^\?/, ""));
  }
  const to = params?.get("to")?.trim();
  if (!to || !META_ADDRESS_RE.test(to)) {
    throw new Error("Not a meta-address or a payment request. Expected st:eth:0x… or a /pay link.");
  }
  const req: PaymentRequest = { to };
  const token = params?.get("token")?.toUpperCase();
  if (token && isKnownToken(token)) req.token = token;
  const amount = params?.get("amount");
  if (amount && AMOUNT_RE.test(amount)) req.amount = amount;
  const memo = params?.get("memo");
  if (memo) req.memo = memo.slice(0, 140);
  return req;
}

export function encodeAnnouncement(a: Announcement, origin = appOrigin()) {
  const url = new URL("/app", origin);
  url.searchParams.set("claim", "1");
  url.searchParams.set("addr", a.stealthAddress);
  url.searchParams.set("eph", a.ephemeralPublicKey);
  url.searchParams.set("tag", String(a.viewTag));
  if (a.txHash) url.searchParams.set("tx", a.txHash);
  if (a.token) url.searchParams.set("token", a.token);
  if (a.amount) url.searchParams.set("amount", a.amount);
  url.hash = "receive";
  return url.toString();
}

/** Accepts an announcement URL, a bare query string, or a JSON object with the same fields. */
export function parseAnnouncementInput(input: string): Announcement {
  const text = input.trim();
  let get: (k: string) => string | null;
  if (text.startsWith("{")) {
    const obj = JSON.parse(text) as Record<string, unknown>;
    get = (k) => {
      const alias: Record<string, string> = { addr: "stealthAddress", eph: "ephemeralPublicKey", tag: "viewTag", tx: "txHash" };
      const v = obj[k] ?? obj[alias[k] ?? k];
      return v === undefined || v === null ? null : String(v);
    };
  } else {
    let params: URLSearchParams;
    try {
      params = new URL(text).searchParams;
    } catch {
      params = new URLSearchParams(text.replace(/^\?/, ""));
    }
    get = (k) => params.get(k);
  }
  const addr = get("addr")?.trim();
  const eph = get("eph")?.trim();
  const tagRaw = get("tag")?.trim();
  if (!addr || !ADDRESS_RE.test(addr)) throw new Error("Announcement is missing a valid one-time address.");
  if (!eph || !PUBKEY_RE.test(eph)) throw new Error("Announcement is missing a valid ephemeral public key.");
  const viewTag = Number.parseInt(tagRaw ?? "", 10);
  if (!Number.isInteger(viewTag) || viewTag < 0 || viewTag > 255) throw new Error("Announcement view tag is invalid.");
  const a: Announcement = {
    stealthAddress: addr as `0x${string}`,
    ephemeralPublicKey: eph as `0x${string}`,
    viewTag,
  };
  const tx = get("tx")?.trim();
  if (tx && TX_RE.test(tx)) a.txHash = tx as `0x${string}`;
  const token = get("token")?.toUpperCase();
  if (token && isKnownToken(token)) a.token = token;
  const amount = get("amount");
  if (amount && AMOUNT_RE.test(amount)) a.amount = amount;
  return a;
}

export function isValidAmount(s: string) {
  return AMOUNT_RE.test(s) && Number(s) > 0;
}
