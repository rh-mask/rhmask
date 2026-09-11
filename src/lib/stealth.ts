/**
 * ERC-5564 stealth addresses on secp256k1, computed entirely in the browser.
 *
 * The recipient keeps two private keys (spending, viewing) and publishes one
 * meta-address. A sender derives a fresh, unlinkable address from that
 * meta-address for every payment. The recipient scans announcements with the
 * viewing key; only the spending key can move the funds.
 *
 * Scheme (ERC-5564, scheme id 1):
 *   ephemeral r, R = r*G
 *   S = r * K_view                      (sender)   == k_view * R (recipient)
 *   h = keccak256(compress(S))          view tag = h[0]
 *   P_stealth = K_spend + h * G
 *   address   = keccak256(uncompress(P_stealth)[1:])[12:]
 *
 * Nothing here touches the network. Keys never leave the device.
 */
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { keccak_256 } from "@noble/hashes/sha3";

const G = secp256k1.ProjectivePoint.BASE;
const N = secp256k1.CURVE.n;
type Point = typeof G;

export type StealthKeys = {
  spendingKey: `0x${string}`;
  viewingKey: `0x${string}`;
  /** st:eth:0x + spendPub(33 bytes) + viewPub(33 bytes) */
  metaAddress: string;
};

export type StealthDerivation = {
  stealthAddress: `0x${string}`;
  /** 33-byte compressed ephemeral public key, published with the payment. */
  ephemeralPublicKey: `0x${string}`;
  viewTag: number;
};

function toHex(bytes: Uint8Array): `0x${string}` {
  return `0x${bytesToHex(bytes)}`;
}

function bytesToBigInt(bytes: Uint8Array) {
  return BigInt(`0x${bytesToHex(bytes)}`);
}

function pubToAddress(point: Point): `0x${string}` {
  const uncompressed = point.toRawBytes(false).slice(1);
  const hash = keccak_256(uncompressed);
  return toHex(hash.slice(12));
}

function sharedSecretScalar(sharedPoint: Point) {
  const h = keccak_256(sharedPoint.toRawBytes(true));
  return { scalar: bytesToBigInt(h) % N, viewTag: h[0] };
}

/** Generate a fresh key set and its meta-address. */
export function generateStealthKeys(): StealthKeys {
  const spend = secp256k1.utils.randomPrivateKey();
  const view = secp256k1.utils.randomPrivateKey();
  return keysFromPrivate(toHex(spend), toHex(view));
}

export function keysFromPrivate(spendingKey: `0x${string}`, viewingKey: `0x${string}`): StealthKeys {
  const spendPub = secp256k1.getPublicKey(hexToBytes(spendingKey.slice(2)), true);
  const viewPub = secp256k1.getPublicKey(hexToBytes(viewingKey.slice(2)), true);
  return {
    spendingKey,
    viewingKey,
    metaAddress: `st:eth:0x${bytesToHex(spendPub)}${bytesToHex(viewPub)}`,
  };
}

export function parseMetaAddress(meta: string) {
  const m = meta.trim().match(/^st:eth:0x([0-9a-fA-F]{132})$/);
  if (!m) throw new Error("Invalid meta-address. Expected st:eth:0x followed by 132 hex characters.");
  const raw = hexToBytes(m[1]);
  return {
    spendPub: secp256k1.ProjectivePoint.fromHex(raw.slice(0, 33)),
    viewPub: secp256k1.ProjectivePoint.fromHex(raw.slice(33, 66)),
  };
}

/** Sender side: derive a one-time address for a recipient meta-address. */
export function deriveStealthAddress(meta: string): StealthDerivation {
  const { spendPub, viewPub } = parseMetaAddress(meta);
  const r = bytesToBigInt(secp256k1.utils.randomPrivateKey());
  const R = G.multiply(r);
  const S = viewPub.multiply(r);
  const { scalar, viewTag } = sharedSecretScalar(S);
  const stealthPub = spendPub.add(G.multiply(scalar));
  return {
    stealthAddress: pubToAddress(stealthPub),
    ephemeralPublicKey: toHex(R.toRawBytes(true)),
    viewTag,
  };
}

/**
 * Recipient side: check one announcement. Returns the stealth private key
 * when the announcement belongs to these keys, otherwise null.
 */
export function checkAnnouncement(
  keys: Pick<StealthKeys, "spendingKey" | "viewingKey">,
  ephemeralPublicKey: `0x${string}`,
  stealthAddress: `0x${string}`,
  viewTag?: number,
): `0x${string}` | null {
  const R = secp256k1.ProjectivePoint.fromHex(hexToBytes(ephemeralPublicKey.slice(2)));
  const kView = bytesToBigInt(hexToBytes(keys.viewingKey.slice(2)));
  const S = R.multiply(kView);
  const { scalar, viewTag: tag } = sharedSecretScalar(S);
  if (viewTag !== undefined && viewTag !== tag) return null;

  const kSpend = bytesToBigInt(hexToBytes(keys.spendingKey.slice(2)));
  const stealthPriv = (kSpend + scalar) % N;
  const derived = pubToAddress(G.multiply(stealthPriv));
  if (derived.toLowerCase() !== stealthAddress.toLowerCase()) return null;
  return `0x${stealthPriv.toString(16).padStart(64, "0")}`;
}
