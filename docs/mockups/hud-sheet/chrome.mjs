// Local Chrome (CDP) screenshotter, Node built-ins only (same approach as ../wren-sheet/render.mjs, plus transparent captures for footprint measuring).
import { writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { recompress } from '../ui-directions/png.mjs';
import { toPng8 } from '../cartoon-polished/pal.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function openChrome() {
  const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
  const dir = mkdtempSync(join(tmpdir(), 'hl-hud-'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch {} await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  return {
    async shot(htmlPath, html, w, h, dpr = 1, transparent = false) {
      writeFileSync(htmlPath, html);
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
      await send('Emulation.setDefaultBackgroundColorOverride', transparent ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
      await send('Page.navigate', { url: pathToFileURL(htmlPath).href });
      await sleep(transparent ? 1200 : 2200);
      const r = await send('Page.captureScreenshot', { format: 'png' });
      return Buffer.from(r.result.data, 'base64');
    },
    close() { ws.close(); proc.kill(); },
  };
}
export function savePng(path, src, capK = 340) {
  let o = src, rd = 1;
  for (const k of [1, 2, 3, 4, 6, 8]) { o = recompress(src, k); rd = k; if (o.length < capK * 1024) break; }
  if (o.length >= capK * 1024) { o = toPng8(src, 256); rd = 'pal256'; }
  for (const n of [128, 64]) if (o.length >= capK * 1024) { o = toPng8(src, n); rd = 'pal' + n; }
  writeFileSync(path, o);
  console.log(path.split(/[\\/]/).pop(), Math.round(statSync(path).size / 1024) + 'KB round' + rd);
}
export const dataUri = (buf) => 'data:image/png;base64,' + buf.toString('base64');
