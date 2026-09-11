/**
 * Round-trip check for the stealth address scheme. Run: node scripts/stealth-check.ts
 * Recipient generates keys, sender derives an address, recipient recovers the
 * private key for it, and the recovered key must control that exact address.
 */
import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { generateStealthKeys, deriveStealthAddress, checkAnnouncement } from "../src/lib/stealth.ts";

const keys = generateStealthKeys();
const d = deriveStealthAddress(keys.metaAddress);
const priv = checkAnnouncement(keys, d.ephemeralPublicKey, d.stealthAddress, d.viewTag);
if (!priv) throw new Error("recipient failed to recognise its own stealth address");

const pub = secp256k1.getPublicKey(hexToBytes(priv.slice(2)), false).slice(1);
const addr = `0x${bytesToHex(keccak_256(pub).slice(12))}`;
if (addr.toLowerCase() !== d.stealthAddress.toLowerCase()) throw new Error("recovered key does not control the address");

const other = generateStealthKeys();
if (checkAnnouncement(other, d.ephemeralPublicKey, d.stealthAddress, d.viewTag) !== null) {
  throw new Error("a stranger recognised someone else's stealth address");
}
console.log("stealth round-trip ok", d.stealthAddress, "viewTag", d.viewTag);
