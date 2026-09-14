/**
 * Round-trip check for the shared passphrase encryption. Run: node scripts/keycrypto-check.ts
 * Seal, open with the right passphrase, refuse the wrong one, refuse a
 * tampered ciphertext, refuse a short passphrase, and confirm the blob
 * shape is what both the dapp and the extension expect.
 */
import { generateStealthKeys } from "../src/lib/stealth.ts";
import { sealKeys, openKeys, isEncryptedKeys, parseKeys, PBKDF2_ITERATIONS } from "../src/lib/keycrypto.ts";

const keys = generateStealthKeys();
const blob = await sealKeys(keys, "correct horse battery");
if (!isEncryptedKeys(blob) || !isEncryptedKeys(JSON.stringify(blob))) throw new Error("blob shape not recognised");
if (blob.iter !== PBKDF2_ITERATIONS || blob.v !== 2) throw new Error("blob parameters drifted");
if (JSON.stringify(blob).includes(keys.spendingKey.slice(2, 20))) throw new Error("plaintext leaked into the blob");

const opened = await openKeys(blob, "correct horse battery");
if (JSON.stringify(opened) !== JSON.stringify(keys)) throw new Error("open did not return the same keys");

const mustThrow = async (label: string, fn: () => Promise<unknown>, expect?: string) => {
  try {
    await fn();
  } catch (e) {
    if (expect && !(e instanceof Error && e.message === expect)) throw new Error(`${label}: unexpected message "${e instanceof Error ? e.message : e}"`);
    return;
  }
  throw new Error(`${label} was accepted`);
};
await mustThrow("wrong passphrase", () => openKeys(blob, "correct horse batter"), "Wrong passphrase.");
const tampered = { ...blob, ct: blob.ct.slice(0, -4) + (blob.ct.endsWith("AAAA") ? "BBBB" : "AAAA") };
await mustThrow("tampered ciphertext", () => openKeys(tampered, "correct horse battery"), "Wrong passphrase.");
await mustThrow("short passphrase", () => sealKeys(keys, "1234567"));

if (parseKeys({ ...keys, spendingKey: "0x1234" }) !== null) throw new Error("bad key shape accepted");
if (parseKeys(JSON.stringify(keys))?.metaAddress !== keys.metaAddress) throw new Error("JSON string keys not parsed");

const again = await sealKeys(keys, "correct horse battery");
if (again.salt === blob.salt || again.iv === blob.iv) throw new Error("salt or iv reused");

console.log("keycrypto round-trip ok", `${PBKDF2_ITERATIONS} rounds`, "blob", JSON.stringify(blob).length, "bytes");
