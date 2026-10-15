// Local Chrome (CDP) screenshotter, Node built-ins only. Reuses ../ui-directions/png.mjs to keep PNGs small.
import { writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { recompress } from '../ui-directions/png.mjs';
import { toPng8 } from './pal.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function renderAll(jobs, here) {
  const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
  const dir = mkdtempSync(join(tmpdir(), 'hl-cp-'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch {} await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.enable');
  for (const [name, html] of jobs) {
    writeFileSync(join(here, name + '.html'), html);
    await send('Page.navigate', { url: pathToFileURL(join(here, name + '.html')).href });
    await sleep(1500);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    const src = Buffer.from(r.result.data, 'base64'); let o = src, rd = 1;
    for (const k of [1, 2, 3, 4, 5, 6]) { o = recompress(src, k); rd = k; if (o.length < 335 * 1024) break; }
    if (o.length >= 335 * 1024) { o = toPng8(src, 256); rd = 'pal256'; }
    writeFileSync(join(here, name + '.png'), o);
    console.log(name + '.png', Math.round(statSync(join(here, name + '.png')).size / 1024) + 'KB round' + rd);
  }
  ws.close(); proc.kill(); process.exit(0);
}
