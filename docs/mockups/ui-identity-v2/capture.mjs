// Capture live game frames (own headless Chrome, port 9371) used as mock-up backdrops. Usage: node capture.mjs [baseUrl]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const base = process.argv[2] || 'http://127.0.0.1:5173';
const PORT = 9371; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-v2cap-'))}`, '--no-first-run', '--disable-extensions', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result && r.result.value; };
const shot = async (n, fmt = 'png') => { const r = await send('Page.captureScreenshot', { format: fmt, quality: fmt === 'jpeg' ? 82 : undefined }); writeFileSync(join(HERE, 'frames', n + '.' + (fmt === 'jpeg' ? 'jpg' : 'png')), Buffer.from(r.data, 'base64')); console.log('shot', n); };
await send('Page.enable'); await send('Runtime.enable');
for (const [tag, w, h, dpr, m] of [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
  await send('Page.navigate', { url: `${base}/?auto=wren&seed=3&god=1&t=300${m ? '&touch=1' : ''}` });
  for (let i = 0; i < 80; i++) { await sleep(250); if (await ev('!!(window.__app&&window.__app.sim)')) break; }
  await sleep(5000);
  await shot('live-hud-' + tag);
  await ev(`(()=>{for(const e of document.querySelectorAll('body > *:not(canvas)')){if(!e.querySelector('canvas'))e.style.visibility='hidden'}document.querySelectorAll('[class*=hud],#hud,.hud').forEach(e=>e.style.visibility='hidden');return 1})()`);
  await sleep(200);
  await shot('bg-' + tag, 'jpeg');
}
ws.close(); proc.kill();
