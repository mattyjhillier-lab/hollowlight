// Screenshots of the three tree-screen options (own headless Chrome on port 9384, throwaway profile DELETED afterwards).
//   node docs/mockups/tree-screen-v2/build.mjs && node docs/mockups/tree-screen-v2/shoot.mjs
// -> shots/<opt>-<view>.png at 1280x720, 844x390@2x, 390x844@2x + console errors + buy-flow check + connected-rule counts + draw timing
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)); const OUT = join(HERE, 'shots'); mkdirSync(OUT, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9384; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'hl-ts2-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-extensions', '--enable-unsafe-swiftshader', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
const D = [1280, 720, 1, false], L = [844, 390, 2, true], Pt = [390, 844, 2, true];
const ONLY = process.argv[2] || null; // optional: shoot only views whose name contains this
const VIEWS = [
  ['desk-run3', D, 'preset=2&coach=0'], ['desk-run10', D, 'preset=3&coach=0'], ['desk-far', D, 'preset=3&far=1&coach=0'],
  ['desk-selected', D, 'preset=2&sel=gt_raven_flock'], ['desk-new', D, 'preset=0&coach=1'], ['desk-coach', D, 'preset=1&coach=1'],
  ['desk-goals', D, 'preset=3&goals=1&coach=0'], ['desk-help', D, 'preset=2&help=1&coach=0'],
  ['phl-run3', L, 'preset=2&coach=0'], ['phl-selected', L, 'preset=2&sel=wf_rend'], ['phl-goals', L, 'preset=3&goals=1&coach=0'],
  ['php-run3', Pt, 'preset=2&coach=0'], ['php-selected', Pt, 'preset=2&sel=gt_raven_flock'], ['php-goals', Pt, 'preset=3&goals=1&coach=0'], ['php-new', Pt, 'preset=0&coach=1'],
];
const EXTRA = [['c', 'desk-focus', D, 'preset=3&focus=c:ghost_wolves&coach=0'], ['c', 'php-focus', Pt, 'preset=3&focus=c:holy_orbit&coach=0'], ['c', 'phl-focus', L, 'preset=2&focus=r:rings&coach=0'],
  ['a', 'desk-1000-far', D, 'preset=4&data=1&far=1&coach=0'], ['a', 'desk-todayrules', D, 'preset=2&conn=0&coach=0']];
let errors = 0;
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* wait */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') { errors++; console.log('PAGE ERROR', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); }
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') { errors++; console.log('CONSOLE ERROR', d.params.args.map((a) => a.value || a.description).join(' ')); }
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result && r.result.value; };
  const url = (opt, q) => `${pathToFileURL(join(HERE, `option-${opt}.html`)).href}?${q}&rm=1`;
  await send('Page.enable'); await send('Runtime.enable');
  const shoot = async (opt, name, [w, h, dpr, mobile], q) => {
    if (ONLY && !`${opt}-${name}`.includes(ONLY)) return;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await send('Page.navigate', { url: url(opt, q) });
    await sleep(1300);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, `${opt}-${name}.png`), Buffer.from(r.data, 'base64'));
  };
  for (const opt of ['a', 'b', 'c']) for (const [name, dev, q] of VIEWS) await shoot(opt, name, dev, q);
  for (const [opt, name, dev, q] of EXTRA) await shoot(opt, name, dev, q);
  console.log('shots done');
  if (!ONLY) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    for (const opt of ['a', 'b', 'c']) {
      await send('Page.navigate', { url: url(opt, 'preset=1&coach=0') }); await sleep(1200);
      const f = await ev(`(async()=>{const p=window.__proto;const g0=p.save.gold;const b0=p.best&&p.best.id;p.nextAfford();await new Promise(r=>setTimeout(r,700));const b=document.getElementById('buyBtn');b.click();const mid=p.save.gold;b.click();return {b0,g0,mid,g1:p.save.gold}})()`);
      const ok = f && f.b0 && f.mid === f.g0 && f.g1 < f.g0; if (!ok) errors++;
      console.log(`buy flow ${opt}`, JSON.stringify(f), ok ? 'OK' : 'FAILED');
    }
    for (let pi = 0; pi < 6; pi++) {
      const row = [];
      for (const conn of ['0', '1']) {
        await send('Page.navigate', { url: url('a', `preset=${pi}&coach=0&conn=${conn}`) }); await sleep(900);
        row.push(await ev(`(()=>{const p=window.__proto;const b=p.best;return {canLight:+document.getElementById('lightN').textContent,best:b&&b.id,held:p.held()}})()`));
      }
      console.log(`preset ${pi}: today ${JSON.stringify(row[0])} | connected ${JSON.stringify(row[1])}`);
    }
    for (const q of ['preset=4', 'preset=4&data=1']) {
      await send('Page.navigate', { url: url('a', `${q}&coach=0`) }); await sleep(1200);
      const near = await ev('window.__proto.perf()'); await ev('(()=>{const p=window.__proto;p.cam.x=0;p.cam.y=0;p.cam.z=0.05;return 1})()'); const far = await ev('window.__proto.perf()');
      await send('Emulation.setCPUThrottlingRate', { rate: 4 }); await ev('(()=>{window.__proto.cam.z=0.45;return 1})()'); const mid4 = await ev('window.__proto.perf()'); await send('Emulation.setCPUThrottlingRate', { rate: 1 });
      console.log(`draw ms ${q}: near ${near.toFixed(2)} far ${far.toFixed(2)} mid@4x ${mid4.toFixed(2)}`);
    }
  }
  ws.close();
} finally {
  const gone = new Promise((r) => proc.once('exit', r)); proc.kill(); await Promise.race([gone, sleep(5000)]);
  for (let i = 0; i < 10 && existsSync(profile); i++) { try { rmSync(profile, { recursive: true, force: true }); } catch { await sleep(700); } }
  console.log(`errors: ${errors}; temp profile removed: ${!existsSync(profile)}`);
}
