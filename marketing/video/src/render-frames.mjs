/**
 * Steps a deterministic scene frame by frame and writes PNGs.
 *
 *   node render-frames.mjs <url> <outDir> <w> <h> <fps> [transparent]
 *
 * Nothing in the page animates on its own: it exposes setT(seconds) and DUR,
 * so every run produces identical frames however slow the machine is.
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const [url, outDir, W, H, FPS, transparent] = process.argv.slice(2);
const w = Number(W), h = Number(H), fps = Number(FPS);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const list = await (await fetch("http://127.0.0.1:9333/json/list")).json();
const ws = new WebSocket(list.find((x) => x.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (m, p = {}) => new Promise((res) => { const n = ++id; pend.set(n, res); ws.send(JSON.stringify({ id: n, method: m, params: p })); });

await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 3500));

// Transparent capture needs the default white backdrop cleared.
if (transparent === "transparent") {
  await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
}

const ready = await send("Runtime.evaluate", {
  expression: `document.fonts.ready.then(() => document.documentElement.dataset.ready === "1")`,
  awaitPromise: true,
  returnByValue: true,
});
if (ready.result.result.value !== true) { console.error("  scene not ready"); process.exit(1); }

const dur = (await send("Runtime.evaluate", { expression: "window.DUR ?? window.SPIN", returnByValue: true })).result.result.value;
const total = Math.round(dur * fps);
const started = Date.now();

for (let f = 0; f < total; f++) {
  await send("Runtime.evaluate", { expression: `setT(${(f / fps).toFixed(5)})` });
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: w, height: h, scale: 1 },
  });
  writeFileSync(join(outDir, `f${String(f).padStart(5, "0")}.png`), Buffer.from(shot.result.data, "base64"));
  if (f % 30 === 0) process.stdout.write(`${f}/${total} `);
}

console.log(`\n  ${total} frames, ${dur}s at ${fps}fps, ${w}x${h}, in ${((Date.now() - started) / 1000).toFixed(0)}s`);
ws.close();
process.exit(0);
