// Capture the CURRENT live build (dev server) with its current enemies, for the round-2 diagnosis. Own Chrome on its own port; kills only that PID.
// node live.mjs [baseUrl]  -> live/*.png. Mock-up tooling only, not game code.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://localhost:5173';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9300 + Math.floor(Math.random() * 90); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-live-'))}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 120; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); p(d.result || {}); } });
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
mkdirSync(join(here, 'live'), { recursive: true });
try {
  for (const [name, t, hero] of [['live-desk-day', 560, 'wren'], ['live-desk-night', 40, 'wren']]) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await send('Page.enable');
    await send('Page.navigate', { url: `${base}/?auto=${hero}&seed=3&t=${t}&god=1` });
    const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value;
    await send('Runtime.enable');
    for (let i = 0; i < 160; i++) { await sleep(250); if (await ev('!!(window.__app && window.__app.sim && window.__app.scene)')) break; }
    await ev("try{window.__app.scene.quality.setMode('high');window.__app.scene.applyTier()}catch(e){}");
    await sleep(5000);
    console.log(await ev('JSON.stringify({t:window.__app?.sim?.time, n:window.__app?.sim?.enemies?.length, zoom: window.__app?.scene?.cameras?.main?.zoom})'));
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(here, 'live', name + '.png'), Buffer.from(r.data, 'base64')); console.log(name);
  }
} finally { try { ws.close(); } catch {} proc.kill(); }
process.exit(0);
