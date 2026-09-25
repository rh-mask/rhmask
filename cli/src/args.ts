/** Minimal flag parsing. No dependency, and it rejects what it does not know. */

export type Flags = {
  get(name: string): string | undefined;
  /** A flag that must be present, with the error a person can act on. */
  need(name: string, what: string): string;
  has(name: string): boolean;
  positional: string[];
};

const GLOBAL = new Set(["--network", "-n", "--json", "--no-color", "--help", "-h"]);

export function parse(argv: string[], known: string[]): Flags {
  const values = new Map<string, string>();
  const bare = new Set<string>();
  const positional: string[] = [];
  const allowed = new Set([...known, ...GLOBAL]);

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("-")) {
      positional.push(a);
      continue;
    }
    const [name, inline] = a.includes("=") ? [a.slice(0, a.indexOf("=")), a.slice(a.indexOf("=") + 1)] : [a, undefined];
    if (!allowed.has(name)) {
      throw new Error(`Unknown option ${name}. Try rhmask --help.`);
    }
    if (name === "--json" || name === "--no-color" || name === "--help" || name === "-h") {
      bare.add(name);
      continue;
    }
    const value = inline ?? argv[++i];
    if (value === undefined || value.startsWith("-")) throw new Error(`${name} needs a value.`);
    values.set(name, value);
  }

  return {
    get: (n) => values.get(n),
    need(n, what) {
      const v = values.get(n);
      if (v === undefined) throw new Error(`${n} is required: ${what}`);
      return v;
    },
    has: (n) => bare.has(n) || values.has(n),
    positional,
  };
}
