// Damage-readability recap mock renderer (docs only): node scripts/dr-recap.mjs <outDir> [recap]. Run from the repo root. Own Chrome 9533 + server 4253 (serves docs/ and src/assets/ only).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9533, HTTP = 4253, ROOT = resolve('.');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = createServer((req, res) => { const p = decodeURIComponent((req.url || '/').split('?')[0]); const f = resolve(join(ROOT, p)); if (!f.startsWith(join(ROOT, 'docs')) && !f.startsWith(join(ROOT, 'src', 'assets'))) { res.writeHead(403); res.end(); return; } if (!existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); });
await new Promise((r) => srv.listen(HTTP, '127.0.0.1', r));
const dir = mkdtempSync(join(tmpdir(), 'hl-rc-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } });
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const out = process.argv[2];
try {
  for (const page of (process.argv[3] || 'recap').split(',')) for (const [v, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const o of (page === 'recap' ? ['A', 'B', 'C'] : [''])) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/docs/mockups/damage-readability/${page}.html?opt=${o}` }); await sleep(900);
    const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, `${page}${o ? '-' + o : ''}-${v}.png`), Buffer.from(r.data, 'base64')); console.log(page, o, v);
  }
} finally { ws.close(); proc.kill(); srv.close(); setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch {} }, 1500); }
