// Screenshots of the tree-screen prototype (own headless Chrome on port 9383, throwaway profile DELETED afterwards).
//   node docs/mockups/tree-screen/shoot.mjs        -> PNGs in this folder at 1280x720, 844x390@2x, 390x844@2x + console errors + draw timing
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9383; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'hl-ts-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-extensions', '--enable-unsafe-swiftshader', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
const page = pathToFileURL(join(HERE, 'tree-screen.html')).href;
const SHOTS = [
  // [file, w, h, dpr, mobile, query]
  ['ts-desk-overview', 1280, 720, 1, false, 'preset=3'],
  ['ts-desk-selected', 1280, 720, 1, false, 'preset=2&sel=gt_raven_flock'],
  ['ts-desk-afford', 1280, 720, 1, false, 'preset=1&sel=li_vigor'],
  ['ts-desk-only', 1280, 720, 1, false, 'preset=2&only=1'],
  ['ts-desk-far', 1280, 720, 1, false, 'preset=3&far=1'],
  ['ts-desk-new', 1280, 720, 1, false, 'preset=0'],
  ['ts-desk-late', 1280, 720, 1, false, 'preset=4&far=1'],
  ['ts-desk-index', 1280, 720, 1, false, 'preset=2&index=1'],
  ['ts-desk-1000', 1280, 720, 1, false, 'preset=4&data=1&far=1'],
  ['ts-desk-1000-staggered', 1280, 720, 1, false, 'preset=4&data=2&far=1'],
  ['ts-phl-overview', 844, 390, 2, true, 'preset=2'],
  ['ts-phl-selected', 844, 390, 2, true, 'preset=2&sel=wf_rend'],
  ['ts-phl-goals', 844, 390, 2, true, 'preset=2&goals=1'],
  ['ts-php-overview', 390, 844, 2, true, 'preset=2&goals=1'],
  ['ts-php-selected', 390, 844, 2, true, 'preset=2&sel=gt_raven_flock'],
  ['ts-php-far', 390, 844, 2, true, 'preset=3&far=1'],
];
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
  await send('Page.enable'); await send('Runtime.enable');
  for (const [name, w, h, dpr, mobile, q] of SHOTS) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await send('Page.navigate', { url: `${page}?${q}&rm=1` });
    await sleep(1400);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(HERE, `${name}.png`), Buffer.from(r.data, 'base64'));
    console.log('shot', name);
  }
  // functional check: jump to the next affordable lantern, two-step buy, the purse and the 'can light' badge update live
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${page}?preset=1&rm=1` }); await sleep(1200);
  const f = await ev(`(()=>{const p=window.__proto;const g0=p.save.gold;const n0=+document.getElementById('lightN').textContent;p.nextAfford();const b=document.getElementById('buyBtn');const id=document.getElementById('pName').textContent;b.click();const mid=p.save.gold;b.click();return {id,g0,mid,g1:p.save.gold,n0,n1:+document.getElementById('lightN').textContent,state:document.getElementById('pState').textContent}})()`);
  console.log('buy flow', JSON.stringify(f), f && f.mid === f.g0 && f.g1 < f.g0 ? 'OK (two-step, gold spent)' : 'FAILED');
  if (!(f && f.mid === f.g0 && f.g1 < f.g0)) errors++;
  // draw-time probe (desktop, both datasets, whole-web view and near view; 4x CPU throttle as the phone proxy)
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (const q of ['preset=4', 'preset=4&data=1', 'preset=4&data=2']) {
    await send('Page.navigate', { url: `${page}?${q}&rm=1` }); await sleep(1200);
    const near = await ev('window.__proto.perf()');
    await ev('(()=>{const p=window.__proto;p.cam.x=0;p.cam.y=0;p.cam.z=0.05;return 1})()');
    const far = await ev('window.__proto.perf()');
    await ev('(()=>{const p=window.__proto;p.cam.z=0.45;return 1})()');
    const mid = await ev('window.__proto.perf()');
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const mid4 = await ev('window.__proto.perf()');
    await send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const n = await ev('window.__proto.def.list.length');
    console.log(`draw ms (${n} nodes): near ${near.toFixed(2)}, mid ${mid.toFixed(2)}, far ${far.toFixed(2)}, mid at 4x throttle ${mid4.toFixed(2)}`);
  }
  ws.close();
} finally {
  const gone = new Promise((r) => proc.once('exit', r));
  proc.kill();
  await Promise.race([gone, sleep(5000)]);
  for (let i = 0; i < 10 && existsSync(profile); i++) { try { rmSync(profile, { recursive: true, force: true }); } catch { await sleep(700); } }
  console.log(`errors: ${errors}; temp profile removed: ${!existsSync(profile)}`);
}
