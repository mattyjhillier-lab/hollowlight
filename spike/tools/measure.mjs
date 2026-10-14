// Headless Chrome CDP driver for the spike (Node builtins only; Node 22+ global WebSocket).
//   node spike/tools/measure.mjs shot  "<query>" <out.png> <w> <h> <dpr> [settleMs=4000] [throttle=1]
//   node spike/tools/measure.mjs bench "<query>" <w> <h> <dpr> [throttle=1] [secs=8] [warmMs=3000]
// Needs the vite dev server (npx vite --port 4180) running. Env UNCAP=1 removes the 60 Hz rAF cap.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9400 + Math.floor(Math.random() * 400);
const BASE = process.env.BASE || 'http://localhost:4180/spike/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-spike-'));
  const args = ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--ignore-gpu-blocklist', '--enable-webgl'];
  if (process.env.UNCAP) args.push('--disable-gpu-vsync', '--disable-frame-rate-limit');
  if (process.env.SWGL) args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  const proc = spawn(CHROME, [...args, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Log.entryAdded') console.error('LOG', d.params.entry.level, d.params.entry.text, d.params.entry.url||'');
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) console.error('PAGE', d.params.type, d.params.args.map((a) => a.value || a.description).join(' ').slice(0, 600));
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };
  return { send, ev, close: () => { try { ws.close(); proc.kill(); } catch { /* ignore */ } } };
}

async function open(c, query, w, h, dpr, throttle) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  if (throttle > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
  await c.send('Page.navigate', { url: `${BASE}?${query}` });
  for (let i = 0; i < 240; i++) {
    await sleep(250);
    try {
      if (await c.ev('!!window.__spikeReady')) return;
      const e = await c.ev('window.__spikeErr||""');
      if (e) throw new Error('spike error: ' + e);
    } catch (err) { if (String(err).includes('spike error')) throw err; }
  }
  console.error(await c.ev('JSON.stringify({rs:document.readyState,err:window.__spikeErr||null,canv:document.querySelectorAll("canvas").length})'));
  throw new Error('spike did not become ready');
}

const SHRINK = (b64, scale, q) => `(async()=>{const im=new Image();im.src='data:image/png;base64,${b64}';await im.decode();const cv=document.createElement('canvas');cv.width=Math.round(im.width*${scale});cv.height=Math.round(im.height*${scale});const g=cv.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,0,0,cv.width,cv.height);const id=g.getImageData(0,0,cv.width,cv.height);const d=id.data;for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,Math.round(d[i]/${q})*${q});d[i+1]=Math.min(255,Math.round(d[i+1]/${q})*${q});d[i+2]=Math.min(255,Math.round(d[i+2]/${q})*${q});}g.putImageData(id,0,0);return cv.toDataURL('image/png').split(',')[1]})()`;

const [cmd, query, ...rest] = process.argv.slice(2);
const c = await launch();
try {
  if (cmd === 'shot') {
    const [out, w, h, dpr, settle = 4000, th = 1] = rest;
    await open(c, query, +w, +h, +dpr, +th);
    await sleep(+settle);
    const r = await c.send('Page.captureScreenshot', { format: 'png' });
    let best = r.data;
    if (process.env.RAW) { writeFileSync(process.env.RAW, Buffer.from(r.data, 'base64')); }
    for (const [sc, q] of [[1, 1], [1, 6], [1, 10], [0.75, 8], [0.75, 14], [0.6, 12]]) {
      best = q === 1 && sc === 1 ? r.data : await c.ev(SHRINK(r.data, sc, q));
      if (Buffer.from(best, 'base64').length < 290 * 1024) break;
    }
    writeFileSync(out, Buffer.from(best, 'base64'));
    console.log(out, Math.round(Buffer.from(best, 'base64').length / 1024) + 'KB');
  } else if (cmd === 'bench') {
    const [w, h, dpr, th = 1, secs = 8, warm = 3000] = rest;
    await open(c, query, +w, +h, +dpr, +th);
    await sleep(+warm);
    await c.ev('window.__spike.reset(); true');
    await sleep(+secs * 1000);
    const s = await c.ev('JSON.stringify(window.__spike.summary())');
    console.log(s);
  } else if (cmd === 'bake') {
    const out = query;
    await open(c, 'mode=bake', 800, 600, 1, 1);
    const r = JSON.parse(await c.ev('JSON.stringify(window.__bake)'));
    for (const k of ['chars', 'spirits', 'props']) writeFileSync(join(out, 'atlas-' + k + '.png'), Buffer.from(r[k].split(',')[1], 'base64'));
    writeFileSync(join(out, 'atlas-meta.json'), JSON.stringify(r.meta));
    console.log('baked', Object.keys(r.meta));
  } else if (cmd === 'eval') {
    await open(c, query, +rest[1], +rest[2], +rest[3], 1);
    console.log(await c.ev(rest[0]));
  }
} finally { c.close(); }
process.exit(0);
