// Headless Chrome (CDP, own port + temp profile) -> PNG of each sandbox canvas. Closes only what it spawned.
// node shots.mjs <outDir> [query e.g. "l=A&o=1&pose=walk&t=1.3"] [prefix] [canvas ids comma list]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => p && existsSync(p));
const PORT = 9473; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = process.argv[2] || 'shots'; const q = process.argv[3] || 't=1.3'; const pre = process.argv[4] || 'v'; const ids = (process.argv[5] || 'game,zoom,small,phone,crowd,crowdz,lineup,poses,sil,close').split(',');
mkdirSync(out, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), 'pup-shot-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
try {
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); p(d); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: pathToFileURL(join(process.cwd(), 'index.html')).href + '?' + q });
  for (let i = 0; i < 40; i++) { const r = await send('Runtime.evaluate', { expression: 'window.__ready && window.__ready()', returnByValue: true }); if (r.result?.result?.value) break; await sleep(150); } await sleep(300);
  for (const c of ids) {
    const r = await send('Runtime.evaluate', { expression: `window.__cv('#${c}')`, returnByValue: true });
    const v = r.result?.result?.value; if (!v) { console.error('no canvas', c, JSON.stringify(r).slice(0, 300)); continue; }
    writeFileSync(join(out, `${pre}-${c}.png`), Buffer.from(v.split(',')[1], 'base64'));
  }
  const ch = await send('Runtime.evaluate', { expression: 'window.__checks()', returnByValue: true });
  console.log((ch.result?.result?.value || []).join('\n'));
  ws.close();
} finally { proc.kill(); setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } }, 1000); }
