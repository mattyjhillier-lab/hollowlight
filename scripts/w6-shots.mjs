// W6 Howling Legion shots: node scripts/w6-shots.mjs <outDir> [baseUrl]  (needs a build served on 4173: `npx vite build --outDir X && npx vite preview --outDir X --port 4173`).
// A real auto-played Elias run with the evolution granted; waits for burning foes (Halo) or a blast (Wheel), captures desktop + phone views and a zoom.
// Headless Chrome over CDP. Offers are STAGED in a debug run (?debug params never touch the real save): the sim is paused in
// 'levelup', sim.offer is replaced with hand-built cards of every kind (same shapes the Sim produces) and the REAL ui.showLevelUp
// renders them. One natural, unstaged offer per viewport is also captured. Measures overflow, hit targets, text sizes, row layout.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9363;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-hud2-'));
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

const GRANT = "grant=" + encodeURIComponent('ghost_wolves:count=3,power=3,speed=3,duration=3:howling_legion');
// fodder: low-hp wolves/crows ringed at 40-120 px that stand still, topped up so the pack keeps killing
const FEED = `(() => { const s = window.__app.sim, p = s.player; let n = 0; for (const e of s.enemies) if (!e.dead && e.stage) n++; for (; n < 14; n++) { const a = s.time * 7 + n * 2.399, d = 45 + ((n * 37) % 10) * 8; const e = s.spawnEnemy(n % 3 ? 'wolf' : 'crow', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); e.hp = e.maxHp = 22; e.speed = 0; e.dmg = 0; e.stage = 1; } })()`;
const COUNT = `(() => { const s = window.__app.sim; return { state: s.state, echoes: s.units.filter((u) => u.kind === 'echo' && !u.dead && !(u.rise > 0)).length, wolves: s.units.filter((u) => u.kind === 'wolf').length, cap: s.weapons[0].s.count, t: Math.round(s.time) }; })()`;
const VIEWS = [['desktop-1280x720', 1280, 720, false], ['phone-land-844x390', 844, 390, true]];
try {
  for (const [tag, w, h, mobile] of VIEWS) {
    console.log(`== ${tag}`);
    await load(w, h, mobile, `?auto=wren&seed=1&t=330&god=1&rr=2&ban=1${mobile ? '&touch=1' : ''}&${GRANT}`);
    let m = null;
    for (let i = 0; i < 500; i++) {
      await sleep(120); await ev(FEED); m = await ev(COUNT);
      if (m.state === 'levelup') { await ev("window.__app.sim.offer && window.__app.sim.pick && window.__app.sim.pick(0)").catch(() => {}); }
      if (m.state === 'running' && m.echoes >= 3) break;
    }
    await ev('(() => { window.__app.sim.step = () => {}; })()'); // freeze on the frame (units stay drawn)
    await sleep(200);
    check(`${tag}: echoes on screen, within Pack size`, m && m.echoes >= 3 && m.echoes <= m.cap, JSON.stringify(m));
    await shot(`${tag}-echoes`);
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, clip: { x: w / 2 - 160, y: h / 2 - 90, width: 320, height: 180, scale: mobile ? 2 : 3 } });
    writeFileSync(join(out, `${tag}-echoes-zoom.jpg`), Buffer.from(r.data, 'base64'));
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
