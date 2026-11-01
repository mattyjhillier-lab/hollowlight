// W7c shots (The Alpha, dire_alpha): node scripts/w7balpha-shots.mjs <outDir> [baseUrl]  (needs a build served on 4173: `npx vite build --outDir X && npx vite preview --outDir X --port 4173`).
// Raven evolutions in action (Wall of Wings rings + fear tell, Talon Mark dive tell + mark chevron, Spearhead wedge); desktop + phone. Headless Chrome over CDP, own PID only.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9368;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-w7balpha-'));
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
  if (process.env.QUALITY) await ev(`window.__app.save.data.settings.quality = '${process.env.QUALITY}'`); // headless auto-tier drops to Low: force the tier under test
  await sleep(600);
}

const EVO = 'alpha';
const GRANT = 'grant=' + encodeURIComponent('ghost_wolves:count=5,power=5,speed=5,duration=5:dire_alpha');
const VIEWS0 = [['desktop-1280x720', 1280, 720, false], ['phone-land-844x390', 844, 390, true], ['phone-port-390x844', 390, 844, true]];
const VIEWS = process.env.VIEW ? VIEWS0.filter((v) => v[0].startsWith(process.env.VIEW)) : VIEWS0;
const zoom = async (name, w, h, mobile, z = 3) => {
  const c = await ev(`(() => { const a = window.__app; const s = a.sim; const cam = a.scene.cameras.main; const wv = cam.worldView; const cv = document.querySelector('canvas').getBoundingClientRect(); const u = s.units.find((x) => x.kind === 'wolf' && !x.shade && !x.dead); return u ? { x: cv.left + (u.x - wv.x) / wv.width * cv.width, y: cv.top + (u.y - wv.y) / wv.height * cv.height } : null; })()`);
  const cx = Math.max(160, Math.min(w - 160, c ? c.x : w / 2)); const cy = Math.max(90, Math.min(h - 90, c ? c.y : h / 2));
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, clip: { x: cx - 160, y: cy - 90, width: 320, height: 180, scale: mobile ? 2 : z } });
  writeFileSync(join(out, `${name}.jpg`), Buffer.from(r.data, 'base64'));
};
const MOMENT = {
  alpha: `(() => { const s = window.__app.sim; const u = s.units.find((x) => x.kind === 'wolf' && !x.shade && !x.dead); const arc = s.fx.some((f) => f.kind === 'alphaarc'); const near = s.enemies.filter((e) => !e.dead && Math.hypot(e.x - s.player.x, e.y - s.player.y) < 120).length; return { ok: !!u && arc && near > 5, near, arc }; })()`,
};
const STATE = `(() => { const s = window.__app.sim; return s.state; })()`;
try {
  for (const [tag, w, h, mobile] of VIEWS) {
    console.log(`== ${EVO} ${tag}`);
    await load(w, h, mobile, `?auto=wren&seed=2&t=330&god=1&rr=2&ban=1${mobile ? '&touch=1' : ''}&${GRANT}`);
    let got = false, info = null;
    for (let i = 0; i < 1500 && !got; i++) {
      if (i % 200 === 199) console.log('  waiting', i, JSON.stringify(info), await ev(STATE));
      if ((await ev(STATE)) === 'levelup') { await ev("(document.querySelector('.layer-levelup .card') || {click(){}}).click()").catch(() => {}); await sleep(120); continue; }
      info = await ev(MOMENT[EVO]);
      if (info.ok) { got = true; await zoom(`${EVO}-${tag}-${process.env.QUALITY || 'auto'}-zoom`, w, h, mobile); await shot(`${EVO}-${tag}-${process.env.QUALITY || 'auto'}-full`); }
      else await sleep(40);
    }
    check(`${tag}: ${EVO} moment captured`, got, JSON.stringify(info));
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
