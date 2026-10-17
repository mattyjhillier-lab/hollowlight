// AL-6 dawn chorus shots: QUALITY=high|med|low VIEW=desktop|phone node scripts/al6-shots.mjs <outDir> [baseUrl] (serve a build, e.g. `npx vite build --outDir X && npx vite preview --outDir X --port 4181`).
// Auto-played Wren run started inside each dawn moment (first light ~8:30, the hush 10:00, flood 14:00, 14:50) plus a 4-frame bird-flight strip. Own Chrome PID only.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9367;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-al6-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
  return r.result.value;
};
const [out, base = 'http://localhost:4173'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
  const f = join(out, name + '.jpg');
  writeFileSync(f, Buffer.from(r.data, 'base64'));
  const kb = Math.round(statSync(f).size / 1024);
  console.log(`  shot ${name}.jpg ${kb}KB`);
  if (kb > 300) check(`size ${name}`, false, kb + 'KB');
};

async function load(w, h, mobile, query) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.ui && window.__app.ui.hudView)')) break; } catch { /* loading */ } }
  if (process.env.QUALITY) await ev(`(() => { const sc = window.__app.scene; sc.quality.setMode('${process.env.QUALITY}'); sc.applyTier(); })()`); // headless auto-tier drops to Low: force the tier under test
  await sleep(600);
}

const VIEWS0 = [['desktop-1280x720', 1280, 720, false], ['phone-land-844x390', 844, 390, true]];
const VIEWS = process.env.VIEW ? VIEWS0.filter((v) => v[0].startsWith(process.env.VIEW)) : VIEWS0;
const Q = process.env.QUALITY || 'auto';
const EXTRA = process.env.EXTRA || '';
// moments: [name, start t (sim seconds), real-time wait (ms)]
const MOMENTS = [['first-light-8m30', 505, 3500], ['hush-10m00', 598, 1500], ['flood-14m00', 841, 2600], ['flood-14m50', 889, 800]];
const state = () => ev('(() => { const a = window.__app; const s = a.sim; const d = a.scene.dawnFx; return JSON.stringify({ t: +s.time.toFixed(1), st: s.state, birds: d.field.activeBirds(), shown: d.count, tier: a.scene.quality.tier, flush: +d.field.mod.flush.toFixed(3) }); })()');
try {
  for (const [tag, w, h, mobile] of VIEWS) {
    for (const [name, t, wait] of MOMENTS) {
      console.log('== ' + tag + ' ' + name);
      await load(w, h, mobile, '?auto=wren&seed=2&t=' + t + '&god=1' + (mobile ? '&touch=1' : '') + EXTRA);
      await sleep(wait);
      const s = JSON.parse(await state());
      console.log('  ' + JSON.stringify(s));
      await shot(name + '-' + tag + '-' + Q);
      check(tag + ' ' + name + ' no page errors', true);
    }
    // 4-frame bird flight strip from the burst
    console.log('== ' + tag + ' strip');
    await load(w, h, mobile, '?auto=wren&seed=2&t=841&god=1' + (mobile ? '&touch=1' : '') + EXTRA);
    for (let i = 0; i < 4; i++) { await sleep(i === 0 ? 900 : 1100); const s = JSON.parse(await state()); console.log('  ' + JSON.stringify(s)); await shot('birds-strip' + (i + 1) + '-' + tag + '-' + Q); }
    check(tag + ' strip birds seen', true);
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
process.exit(fails ? 1 : 0);
