/**
 * rhmask — the terminal surface.
 *
 * Same stealth derivation as the web app and the extension, same wire formats,
 * no browser. Key commands never open a socket; chain commands only read.
 * Nothing here can sign or broadcast a transaction, on purpose: a CLI that
 * cannot spend is a CLI you can run on a machine you do not fully trust.
 */
import { banner, tag, VERSION } from "./banner.ts";
import { c, die, rule } from "./ui.ts";
import { keys, address, claim, verify } from "./commands/keys.ts";
import { request } from "./commands/pay.ts";
import { chain, balance, tokens, scan } from "./commands/chain.ts";

type Command = {
  run: (argv: string[]) => void | Promise<void>;
  usage: string;
  blurb: string;
  /** Commands that never touch the network, flagged in help because it matters. */
  offline?: boolean;
};

const COMMANDS: Record<string, Command> = {
  keys: { run: keys, usage: "rhmask keys [--spend 0x… --view 0x…]", blurb: "Make a key set, or rebuild one from its private keys", offline: true },
  address: { run: address, usage: "rhmask address <meta-address>", blurb: "Payer side: derive a one-time address to send to", offline: true },
  request: { run: request, usage: "rhmask request --to <meta-address>", blurb: "Print a payment request as a QR in this terminal", offline: true },
  claim: { run: claim, usage: "rhmask claim --spend 0x… --view 0x… --addr 0x… --eph 0x…", blurb: "Check a receipt and recover the key if it is yours", offline: true },
  verify: { run: verify, usage: "rhmask verify", blurb: "Prove the stealth round-trip on this machine", offline: true },
  chain: { run: chain, usage: "rhmask chain [--network testnet]", blurb: "Chain id, head block, and whether our contracts are there" },
  balance: { run: balance, usage: "rhmask balance <address> [--tokens]", blurb: "Read a balance, optionally every stock token" },
  tokens: { run: tokens, usage: "rhmask tokens", blurb: "Read the stock token registry from the chain itself" },
  scan: { run: scan, usage: "rhmask scan --view 0x… --spend 0x…", blurb: "Find stealth payments announced to your keys" },
};

function help() {
  const names = Object.keys(COMMANDS);
  const w = Math.max(...names.map((n) => n.length));
  const lines = [
    banner(),
    rule("commands"),
    "",
    ...names.map((n) => {
      const cmd = COMMANDS[n];
      const mark = cmd.offline ? c.mask(" ·offline") : c.fog2(" ·reads  ");
      return "  " + c.bold(c.paper(n.padEnd(w))) + mark + "  " + c.fog(cmd.blurb);
    }),
    "",
    rule("options"),
    "",
    ...(
      [
        ["--network <name>", "mainnet (default) or testnet"],
        ["--json", "machine-readable output, for piping"],
        ["--no-color", "plain text; NO_COLOR is honoured too"],
      ] as const
    ).map(([flag, blurb]) => "  " + c.paper(flag.padEnd(w + 10)) + "  " + c.fog(blurb)),
    "",
    rule(),
    "",
    "  " + c.fog("Commands marked ") + c.mask("·offline") + c.fog(" never open a socket. Pull the cable and they still work."),
    "  " + c.fog("Nothing in this CLI can sign or broadcast a transaction."),
    "",
    "  " + c.fog2("docs  rhmask.org/docs") + c.fog2("      source  github.com/rh-mask/rhmask"),
    "",
  ];
  process.stdout.write(lines.join("\n"));
}

function usage(name: string) {
  const cmd = COMMANDS[name];
  process.stdout.write(
    "\n" + tag() + "\n\n  " + c.paper(cmd.usage) + "\n  " + c.fog(cmd.blurb) + "\n\n",
  );
}

export async function main(argv: string[]) {
  const first = argv[0];

  if (!first || first === "--help" || first === "-h" || first === "help") return help();
  if (first === "--version" || first === "-v" || first === "version") {
    process.stdout.write(VERSION + "\n");
    return;
  }

  const cmd = COMMANDS[first];
  if (!cmd) {
    const near = Object.keys(COMMANDS).filter((n) => n.startsWith(first[0]));
    die(`There is no "${first}" command.`, near.length ? `Did you mean: ${near.join(", ")}?` : "Run rhmask --help.");
  }

  const rest = argv.slice(1);
  if (rest.includes("--help") || rest.includes("-h")) return usage(first);

  try {
    await cmd.run(rest);
  } catch (e) {
    die(e instanceof Error ? e.message : String(e), cmd.usage);
  }
}
