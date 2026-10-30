// Text-fit regression: headless Chrome (no deps, Node 22+ WebSocket) drives the dev server and runs __fitSweep() (menus) or __fitSweepRun() (in-run).
// Also runs layoutAudit (src/ui/fitaudit.js): dead gutters on phone-shaped screens, scroll panels without a cue, controls cut off by a clipping box, controls inside safe-area insets.
// Usage: node scripts/fit-audit.mjs x serve 375x812,915x412,844x390,1000x460 [menu|run]  ('serve' = in-process Vite on 5191, one node process; or pass the port of a running dev server). Exit 1 when anything is wrong.
// Sizes: WxH, desktop sizes end in d (no touch emulation), e.g. 1280x720d.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startDev } from './_devserver.mjs';
const port = process.argv[3] === 'serve' ? '5191' : (process.argv[3] || '5191');
const srv = process.argv[3] === 'serve' ? await startDev(5191) : null;
const sizes = (process.argv[4] || '375x812').split(',').map(x=>{const d=x.endsWith('d');const [w,h]=x.replace('d','').split('x').map(Number);return [x,w,h,2,!d]});
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
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await send('Page.navigate', { url: `http://localhost:${port}/?debug=1${mode === 'run' ? '&auto=wren&seed=1&t=200&god=1' : ''}` });
  for (let i = 0; i < 200; i++) { if (await ev('!!(window.__app && window.__app.ui && window.__fitSweep)')) break; await sleep(500); }
  await sleep(1500);
  const r = JSON.parse(await ev(mode === 'run' ? `__fitSweepRun(${process.env.TEXTS ? JSON.stringify(process.env.TEXTS.split(',')) : 'undefined'}).then(r=>JSON.stringify(r))` : '__fitSweep().then(r=>JSON.stringify(r))'));
  bad += r.problems;
  console.log(mode, name, r.problems ? JSON.stringify(r.rep) : 'clean');
  if (mode === 'menu') { // self-test: a deliberately gutter-ed stage must be detected (phones and, since DESKTOP A1, desktop windows)
    const st = await ev("(()=>{const s=document.getElementById('stage');const o=s.style.width;s.style.width='80%';const bad=window.__layoutAudit().some(x=>/dead gutters/.test(x.why));s.style.width=o;return bad})()");
    if (!st) { bad++; console.log('SELFTEST FAIL: dead-gutter check did not fire at', name); }
  }
}
ws.close(); p.kill(); if (srv) await srv.close();
process.exit(bad ? 1 : 0);
