/**
 * Payment-request side. `request` prints a QR straight into the terminal, so a
 * phone can scan it off the screen with no website in between.
 */
import { encodePaymentRequest, META_ADDRESS_RE, isKnownToken, isValidAmount } from "../../../src/lib/payment.ts";
import { parse } from "../args.ts";
import { render } from "../qr.ts";
import { box, c, isPlain, warn } from "../ui.ts";

/** rhmask request --to <meta-address> [--token NVDA] [--amount 1.5] [--memo ...] */
export function request(argv: string[]) {
  const f = parse(argv, ["--to", "--token", "--amount", "--memo", "--origin"]);
  const to = (f.get("--to") ?? f.positional[0])?.trim();
  if (!to) throw new Error("Give your meta-address: rhmask request --to st:eth:0x…");
  if (!META_ADDRESS_RE.test(to)) {
    throw new Error("That is not a meta-address. It looks like st:eth:0x followed by 132 hex characters.");
  }

  const token = f.get("--token");
  if (token && !isKnownToken(token)) throw new Error(`Unknown token ${token}. Try ETH or a stock symbol.`);
  const amount = f.get("--amount");
  if (amount && !isValidAmount(amount)) throw new Error(`Amount ${amount} is not a positive decimal.`);

  const url = encodePaymentRequest(
    { to, token, amount, memo: f.get("--memo") },
    f.get("--origin") ?? "https://rhmask.org",
  );

  if (f.has("--json")) {
    process.stdout.write(JSON.stringify({ url }, null, 2) + "\n");
    return;
  }

  console.log("");
  if (isPlain) {
    // Colour is off, so the light quiet zone cannot be drawn and the code would
    // not scan. The link is the payload either way.
    console.log(warn("QR needs colour to draw its quiet zone. The link below carries the same thing."));
  } else {
    const qr = render(url);
    if (qr) console.log(qr.art);
    else console.log(warn(`This request needs a wider terminal to draw its QR. The link still works.`));
  }

  console.log("");
  console.log(box("payment request", [
    ["to", c.mask(to.slice(0, 20) + "…" + to.slice(-6))],
    ["token", token ? c.paper(token.toUpperCase()) : c.fog2("payer chooses")],
    ["amount", amount ? c.paper(amount) : c.fog2("payer chooses")],
  ]));
  console.log("");
  console.log("  " + c.aqua(url));
  console.log("");
  console.log(c.fog("  Scan it, or send the link. The payer's own device derives a fresh one-time"));
  console.log(c.fog("  address from your meta-address, so no two payments land on the same one."));
  console.log("");
}
