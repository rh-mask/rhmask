/**
 * Key-side commands. Every one of these is pure computation: nothing here opens
 * a socket, so they all work with the network cable pulled out, which is the
 * point of doing key material on your own machine.
 */
import { generateStealthKeys, keysFromPrivate, deriveStealthAddress, checkAnnouncement } from "../../../src/lib/stealth.ts";
import { encodeAnnouncement } from "../../../src/lib/payment.ts";
import { parse } from "../args.ts";
import { box, c, ok, bad, rule } from "../ui.ts";

const HEX32 = /^0x[0-9a-fA-F]{64}$/;

/** rhmask keys — make a fresh key set, or rebuild one from two private keys. */
export function keys(argv: string[]) {
  const f = parse(argv, ["--spend", "--view"]);
  const spend = f.get("--spend");
  const view = f.get("--view");

  let k;
  if (spend || view) {
    if (!spend || !view) throw new Error("Restoring needs both --spend and --view.");
    if (!HEX32.test(spend) || !HEX32.test(view)) throw new Error("Keys must be 0x followed by 64 hex characters.");
    k = keysFromPrivate(spend as `0x${string}`, view as `0x${string}`);
  } else {
    k = generateStealthKeys();
  }

  if (f.has("--json")) {
    process.stdout.write(JSON.stringify(k, null, 2) + "\n");
    return;
  }

  console.log("");
  console.log(box("meta-address — publish this one", [["", c.mask(k.metaAddress)]]));
  console.log("");
  console.log(box(
    "private keys — never publish these",
    [
      ["spending", c.paper(k.spendingKey)],
      ["viewing", c.paper(k.viewingKey)],
    ],
    c.red,
  ));
  console.log("");
  console.log(c.fog("  The spending key moves funds. The viewing key only finds them, so it is the one"));
  console.log(c.fog("  you give a watch-only tool. Lose both and nothing can recover them: there is no"));
  console.log(c.fog("  account behind this, which is the whole idea."));
  console.log("");
  console.log(c.fog2("  Nothing was sent anywhere. This ran entirely on this machine."));
  console.log("");
}

/** rhmask address <meta-address> — payer side: derive a one-time address. */
export function address(argv: string[]) {
  const f = parse(argv, ["--to", "--token", "--amount", "--tx"]);
  const meta = f.get("--to") ?? f.positional[0];
  if (!meta) throw new Error("Give a meta-address: rhmask address st:eth:0x…");

  const d = deriveStealthAddress(meta);
  const receipt = encodeAnnouncement(
    {
      stealthAddress: d.stealthAddress,
      ephemeralPublicKey: d.ephemeralPublicKey,
      viewTag: d.viewTag,
      token: f.get("--token"),
      amount: f.get("--amount"),
      txHash: f.get("--tx") as `0x${string}` | undefined,
    },
    "https://rhmask.org",
  );

  if (f.has("--json")) {
    process.stdout.write(JSON.stringify({ ...d, receipt }, null, 2) + "\n");
    return;
  }

  console.log("");
  console.log(box("send to this address, once", [
    ["address", c.mask(d.stealthAddress)],
    ["ephemeral", c.fog(d.ephemeralPublicKey)],
    ["view tag", c.aqua(String(d.viewTag))],
  ]));
  console.log("");
  console.log(c.fog("  Hand the receipt back so they can find it, or announce it on chain:"));
  console.log("");
  console.log("  " + c.aqua(receipt));
  console.log("");
  console.log(c.fog2("  Derived here, from their public meta-address. They never see this command."));
  console.log("");
}

/** rhmask claim — recipient side: is this announcement mine, and what is its key? */
export function claim(argv: string[]) {
  const f = parse(argv, ["--spend", "--view", "--addr", "--eph", "--tag"]);
  const spend = f.need("--spend", "your spending key");
  const view = f.need("--view", "your viewing key");
  const addr = f.need("--addr", "the one-time address from the receipt");
  const eph = f.need("--eph", "the ephemeral public key from the receipt");
  const tagRaw = f.get("--tag");

  const priv = checkAnnouncement(
    { spendingKey: spend as `0x${string}`, viewingKey: view as `0x${string}` },
    eph as `0x${string}`,
    addr as `0x${string}`,
    tagRaw === undefined ? undefined : Number(tagRaw),
  );

  if (f.has("--json")) {
    process.stdout.write(JSON.stringify({ mine: priv !== null, stealthPrivateKey: priv }, null, 2) + "\n");
    if (!priv) process.exitCode = 1;
    return;
  }

  console.log("");
  if (!priv) {
    console.log(bad("This announcement is not for these keys."));
    console.log(c.fog2("  That is the expected answer for everyone except the recipient."));
    console.log("");
    process.exitCode = 1;
    return;
  }
  console.log(ok("This one is yours."));
  console.log("");
  console.log(box("stealth private key — import to spend", [["", c.paper(priv)]], c.red));
  console.log("");
  console.log(c.fog("  Import it into a wallet to sweep the funds, then forget the address:"));
  console.log(c.fog("  a stealth address is meant to be used once."));
  console.log("");
}

/** rhmask verify — prove the maths on this machine, with no network at all. */
export function verify() {
  console.log("");
  console.log(rule("stealth round-trip, offline"));
  console.log("");
  const recipient = generateStealthKeys();
  const stranger = generateStealthKeys();
  const d = deriveStealthAddress(recipient.metaAddress);

  const mine = checkAnnouncement(recipient, d.ephemeralPublicKey, d.stealthAddress, d.viewTag);
  const theirs = checkAnnouncement(stranger, d.ephemeralPublicKey, d.stealthAddress, d.viewTag);

  const results: Array<[boolean, string]> = [
    [d.stealthAddress.length === 42, "a payer derives a one-time address from the meta-address alone"],
    [mine !== null, "the recipient's viewing key recognises it"],
    [mine !== null && mine.length === 66, "the recipient's spending key recovers the private key"],
    [theirs === null, "a stranger with valid keys recovers nothing"],
  ];
  for (const [pass, label] of results) console.log(pass ? ok(label) : bad(label));

  console.log("");
  console.log(box("this run", [
    ["address", c.mask(d.stealthAddress)],
    ["view tag", c.aqua(String(d.viewTag))],
  ]));
  console.log("");
  const failed = results.filter(([p]) => !p).length;
  if (failed) {
    console.log(bad(`${failed} check(s) failed.`));
    process.exitCode = 1;
  } else {
    console.log(c.fog2("  Fresh keys each run, so the numbers change and the answers do not."));
  }
  console.log("");
}
