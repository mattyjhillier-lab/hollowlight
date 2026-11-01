// E9 check: node scripts/e9-shots.mjs <outDir> [baseUrl]  (needs `npm run build` + `npx vite preview --port 4189`). The evolution pick beat at 3 frames for 3 evolutions + phone views; own Chrome, kills only its PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9361;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-e9-'));
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
const PICK = (evo, wid, ranks) => `(() => { const a = window.__app, s = a.sim; s.debugGrant(${JSON.stringify(wid)}, ${JSON.stringify(ranks)}, null);
  const key = 'e:${evo}'; s.offer = { cards: [], gold: [{ key, kind: 'evolution', weaponId: ${JSON.stringify(wid)}, evoId: ${JSON.stringify(evo)}, title: 'x', desc: 'x' }] };
  s.pending = 1; s.state = 'levelup'; a.pick(key); return s.state; })()`;
const PLATE = `(() => { const p = document.querySelector('.u9-plate'); if (!p) return null; const r = p.getBoundingClientRect(); return { on: p.classList.contains('on'), t: p.innerText.split(String.fromCharCode(10)).join(' | '), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight }; })()`;
const CASES = [
  ['howling_legion', 'ghost_wolves', 'wren', { count: 5, duration: 5 }],
  ['spearhead', 'raven_flock', 'wren', { range: 5, speed: 5 }],
  ['sanctum_halo', 'holy_orbit', 'elias', { count: 5, radius: 5 }],
];
const VIEWS = [['desktop-1280x720', 1280, 720, false], ['phone-land-844x390', 844, 390, true], ['phone-port-390x844', 390, 844, true]];
const CALM = process.env.CALM === '1';
try {
  for (const [tag, w, h, mobile] of VIEWS) {
    for (const [evo, wid, hero, ranks] of CASES) {
      if (mobile && evo !== 'spearhead') continue;
      const name = `${tag}-${evo}${CALM ? '-calm' : ''}`;
      console.log(`== ${name}`);
      await load(w, h, mobile, `?auto=${hero}&seed=1&t=300&god=1&debug=1${CALM ? '&rm=1' : ''}${mobile ? '&touch=1' : ''}`);
      if (CALM) await ev("window.__app.save.data.settings.reducedMotion = true; document.documentElement.classList.add('reduced-motion')");
      for (let i = 0; i < 60; i++) { if ((await ev('window.__app.sim.state')) === 'running') break; await sleep(100); }
      const st = await ev(PICK(evo, wid, ranks));
      check(`${name}: picked, sim running`, st === 'running', st);
      for (let f = 0; f < 3; f++) { await shot(`${name}-f${f}`); if (f === 0) { const pl = await ev(PLATE); check(`${name}: plate shown`, pl && pl.on && /evolved/i.test(pl.t), JSON.stringify(pl)); check(`${name}: plate inside viewport`, pl && pl.x >= 0 && pl.x + pl.w <= pl.vw && pl.y >= 0 && pl.y + pl.h <= pl.vh); } await sleep(120); }
      await sleep(3600);
      const gone = await ev(PLATE);
      check(`${name}: plate fades out and clears text`, gone && !gone.on && gone.t.replace(/[ |]/g, '') === '', JSON.stringify(gone));
    }
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
