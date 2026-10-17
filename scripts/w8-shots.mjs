// W8 shots: node scripts/w8-shots.mjs <outDir> [baseUrl]  (needs a build served on 4173: `npx vite build --outDir X && npx vite preview --outDir X --port 4173`).
// Raven scout swoop strip (perch, dive, peck, return) and the W8b Mark tint; desktop + phone. Headless Chrome over CDP, own PID only.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9363;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-w8-'));
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
  await sleep(600);
}

const GRANT = 'grant=' + encodeURIComponent('raven_flock:count=3,power=3,range=3,speed=2');
// stationary, near-unkillable fodder ringed 45-110 px out so ravens always have something to swoop on
const FEED = `(() => { const s = window.__app.sim, p = s.player; let n = 0; for (const e of s.enemies) if (!e.dead && e.stage) n++; for (; n < 6; n++) { const a = n * 2.399 + 0.5, d = 45 + ((n * 37) % 7) * 10; const e = s.spawnEnemy(n % 2 ? 'wolf' : 'crow', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); e.stage = true; e.hp = e.maxHp = 1e9; e.speed = 0; e.dmg = 0; } })()`;
const STATES = `(() => { const s = window.__app.sim; return { state: s.state, st: s.units.filter((u) => u.kind === 'raven' && !u.dead).map((u) => u.st) }; })()`;
const MARKED = `(() => { const s = window.__app.sim; return s.enemies.filter((e) => !e.dead && e.markT > 0).length; })()`;
const VIEWS = [['desktop-1280x720', 1280, 720, false], ['phone-land-844x390', 844, 390, true]];
const zoom = async (name, w, h, mobile) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, clip: { x: w / 2 - 160, y: h / 2 - 90, width: 320, height: 180, scale: mobile ? 2 : 3 } });
  writeFileSync(join(out, `${name}.jpg`), Buffer.from(r.data, 'base64'));
};
try {
  for (const [tag, w, h, mobile] of VIEWS) {
    console.log(`== ${tag}`);
    await load(w, h, mobile, `?auto=wren&seed=1&t=330&god=1&rr=2&ban=1${mobile ? '&touch=1' : ''}&${GRANT}`);
    const got = new Set();
    for (let i = 0; i < 600 && got.size < 4; i++) {
      await ev(FEED);
      const m = await ev(STATES);
      if (m.state === 'levelup') { await ev('window.__app.sim.offer && window.__app.sim.pick && window.__app.sim.pick(0)').catch(() => {}); continue; }
      for (const st of ['perch', 'dive', 'peck', 'return']) {
        if (m.st.includes(st) && !got.has(st) && (st === 'perch' ? got.size === 0 || got.has('return') : true)) {
          got.add(st); await zoom(`${tag}-swoop-${got.size}-${st}`, w, h, mobile); console.log(`  strip ${st}`);
        }
      }
      await sleep(40);
    }
    check(`${tag}: saw perch, dive, peck, return`, got.size === 4, [...got].join(','));
    await shot(`${tag}-full`);
    if (process.env.MARK) {
      // W8b: a marked foe shows the violet omen
      await ev('(() => { const s = window.__app.sim; for (const e of s.enemies) if (!e.dead) { s._src = "raven_flock"; s.mark(e); } })()');
      await sleep(250);
      const n = await ev(MARKED);
      check(`${tag}: marked foes visible`, n > 0, String(n));
      await zoom(`${tag}-mark`, w, h, mobile);
      await shot(`${tag}-mark-full`);
    }
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
