/**
 * Compiles contracts/src/*.sol with solc and writes contracts/out/<Name>.json
 * (abi + bytecode). Run: npm run contracts:build
 *
 * No Foundry, no Hardhat: two small contracts do not justify a second
 * toolchain in a Next.js repo. Warnings are printed; errors stop the build.
 */
import solc from "solc";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "contracts");
const srcDir = join(root, "src");
const outDir = join(root, "out");
mkdirSync(outDir, { recursive: true });

const sources = {};
for (const f of readdirSync(srcDir).filter((f) => f.endsWith(".sol"))) {
  sources[f] = { content: readFileSync(join(srcDir, f), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 1_000_000 },
    evmVersion: "paris",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
  },
};

const out = JSON.parse(solc.compile(JSON.stringify(input)));

let failed = false;
for (const e of out.errors ?? []) {
  if (e.severity === "error") {
    failed = true;
    console.error(e.formattedMessage);
  } else {
    console.warn(e.formattedMessage.trim());
  }
}
if (failed) process.exit(1);

let n = 0;
for (const [file, contracts] of Object.entries(out.contracts ?? {})) {
  for (const [name, c] of Object.entries(contracts)) {
    const bytecode = c.evm.bytecode.object;
    if (!bytecode) continue; // interfaces produce none
    writeFileSync(
      join(outDir, `${name}.json`),
      JSON.stringify({ name, file, abi: c.abi, bytecode: `0x${bytecode}`, deployedBytecode: `0x${c.evm.deployedBytecode.object}` }, null, 2),
    );
    console.log(`  ${name.padEnd(18)} ${(bytecode.length / 2).toString().padStart(5)} bytes runtime+init`);
    n++;
  }
}
console.log(`\ncompiled ${n} contract(s) with solc ${solc.version().split("+")[0]}`);
