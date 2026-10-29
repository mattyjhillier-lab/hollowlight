// Text-fit regression: headless Chrome (no deps, Node 22+ WebSocket) drives the dev server and runs __fitSweep() (menus) or __fitSweepRun() (in-run).
// Usage: npm run dev -- --port 5191 ; node scripts/fit-audit.mjs x 5191 375x812,812x375,320x568 [menu|run]. Exit 1 when anything is clipped.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const port = process.argv[3] || '5191';
const sizes = (process.argv[4] || '375x812').split(',').map(x=>{const [w,h]=x.split('x').map(Number);return [x,w,h,2,true]});
const screens = ['front', 'chars', 'tree', 'goals', 'almanac', 'settings'];
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dir = mkdtempSync(path.join(tmpdir(), 'hlchrome-'));
const p = spawn(chrome, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${dir}`, '--no-first-run', '--disable-gpu-vsync', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch('http://127.0.0.1:9333/json')).json(); if (tabs.length) break; } catch {} await sleep(300); }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

const mode = process.argv[5] === 'run' ? 'run' : 'menu';
let bad = 0;
for (const [name, w, h, dpr, mobile] of sizes) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  await send('Page.navigate', { url: `http://localhost:${port}/?debug=1${mode === 'run' ? '&auto=wren&seed=1&t=200&god=1' : ''}` });
  for (let i = 0; i < 200; i++) { if (await ev('!!(window.__app && window.__app.ui && window.__fitSweep)')) break; await sleep(500); }
  await sleep(1500);
  const r = JSON.parse(await ev(mode === 'run' ? '__fitSweepRun().then(r=>JSON.stringify(r))' : '__fitSweep().then(r=>JSON.stringify(r))'));
  bad += r.problems;
  console.log(mode, name, r.problems ? JSON.stringify(r.rep) : 'clean');
}
ws.close(); p.kill();
process.exit(bad ? 1 : 0);
