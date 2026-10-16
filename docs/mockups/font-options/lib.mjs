// Headless Chrome helper (Node built-ins only). Proof pages load candidate fonts from fonts.googleapis.com/gstatic ONLY while proofing; nothing is downloaded into the repo.
import { mkdtempSync, existsSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function chrome(port = 9377) {
  const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-font-'))}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch {} await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;
  await send('Page.enable');
  return {
    send, ev,
    async shot(file, out, w, h, dpr = 1, full = false) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
      await send('Page.navigate', { url: pathToFileURL(file).href });
      await sleep(700);
      await ev('document.fonts.ready.then(()=>new Promise(r=>setTimeout(r,600)))');
      if (full) { const hh = await ev('document.documentElement.scrollHeight'); await send('Emulation.setDeviceMetricsOverride', { width: w, height: hh, deviceScaleFactor: dpr, mobile: false }); await sleep(300); }
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(out, Buffer.from(r.data, 'base64'));
    },
    close() { ws.close(); proc.kill(); },
  };
}
