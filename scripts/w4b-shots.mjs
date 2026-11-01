// W4b check (Burn visuals + Orbit guard contraction strip): node scripts/w4b-shots.mjs <outDir> [baseUrl]  (needs a built dist served, e.g. `npx vite preview --outDir <dir> --port 4180`).
// Headless Chrome over CDP. Offers are STAGED in a debug run (?debug params never touch the real save): the sim is paused in
// 'levelup', sim.offer is replaced with hand-built cards of every kind (same shapes the Sim produces) and the REAL ui.showLevelUp
// renders them. One natural, unstaged offer per viewport is also captured. Measures overflow, hit targets, text sizes, row layout.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9361;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-w4b-'));
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


const BURNING = `(() => { const s = window.__app.sim, p = s.player; let n = 0, m = 0; for (const e of s.enemies) { if (Math.abs(e.x - p.x) < 300 && Math.abs(e.y - p.y) < 170) { n++; if (e.burnT > 0) m++; } } return { state: s.state, near: n, burning: m, t: Math.round(s.time) }; })()`;
const CLEAR = `(() => { const a = window.__app, s = a.sim; if (s.state === 'levelup') { s.pending = 0; s.offer = null; s.state = 'running'; } a.ui.hideLevelUp(); return 1; })()`;
const VIEWS = [['desktop-1280x720', 1280, 720, false], ['phone-land-844x390', 844, 390, true], ['phone-port-390x844', 390, 844, true]];
const VF = VIEWS.filter((v) => !process.env.ONLY || v[0].startsWith(process.env.ONLY));
try {
  for (const [tag, w, h, mobile] of VF) {
    console.log(`== ${tag}`);
    await load(w, h, mobile, `?auto=elias&seed=1&t=330&god=1&rr=2&ban=1${mobile ? '&touch=1' : ''}&grant=${encodeURIComponent('holy_orbit:power=3,count=3,speed=2,radius=1')}`);
    let m = null;
    for (let i = 0; i < 400; i++) { await sleep(150); m = await ev(BURNING); if (m.state === 'levelup') { await ev(CLEAR).catch(() => {}); } if (m.state === 'running' && m.burning >= 3) break; }
    check(`${tag}: several enemies burning on screen`, m && m.burning >= 3, JSON.stringify(m));
    await ev(CLEAR); await sleep(250);
    await shot(`w4b-${tag}-burn`);
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: w / 2 - 160, y: h / 2 - 90, width: 320, height: 180, scale: mobile ? 2 : 3 } });
    writeFileSync(join(out, `w4b-${tag}-burn-zoom.jpg`), Buffer.from(r.data, 'base64'));
    if (tag !== 'phone-port-390x844') {
      // Guard contraction strip: freeze the run, stage one foe, step the sim by hand, capture the hero area at four moments.
      await ev(`(() => { const a = window.__app, s = a.sim; a.freeze = true; a.paused = true; s.enemies.length = 0; s.spawnAcc = []; s.player.iframes = 99; window.__stage = { s }; return 1; })()`);
      await ev(CLEAR);
      const stage = async (edge) => ev(`(() => { const s = window.__stage.s; s.enemies.length = 0; const e = s.spawnEnemy('wolf', s.player.x, s.player.y); e.x = s.player.x + e.r + s.player.r + ${edge}; e.y = s.player.y; e.speed = 0; e.hp = e.maxHp = 1e9; return e.id; })()`);
      const stepSim = (secs) => ev(`(() => { const s = window.__stage.s; for (let i = 0; i < ${Math.round(secs * 60)}; i++) s.step(1/60, {}); const w = s.weapons.find((x) => x.id === 'holy_orbit'); return { gK: w.rt.gK, d: Math.hypot(w.rt.units[0].x - s.player.x, w.rt.units[0].y - s.player.y) }; })()`);
      const crops = [];
      const grab = async (label) => {
        await sleep(220);
        const cz = mobile ? 3 : 4;
        const rr = await send('Page.captureScreenshot', { format: 'png', clip: { x: w / 2 - 70, y: h / 2 - 70, width: 140, height: 140, scale: cz } });
        crops.push({ label, data: rr.data });
      };
      await stage(20); let st = await stepSim(1.8); await grab(`open d=${st.d.toFixed(0)}`);
      check(`${tag}: edge 20 px does not contract`, st.gK === 0, JSON.stringify(st));
      await stage(3); await stepSim(0.2 + 0.12); st = await stepSim(0); await grab(`closing gK=${(await stepSim(0)).gK.toFixed(2)}`);
      st = await stepSim(0.5); await grab(`closed d=${st.d.toFixed(0)}`);
      check(`${tag}: ring closed to ~14 px`, Math.abs(st.d - 14) < 1, JSON.stringify(st));
      await ev(`window.__stage.s.enemies.length = 0`); await stepSim(1.0); st = await stepSim(0.2); await grab(`opening gK=${st.gK.toFixed(2)}`);
      const strip = await ev(`(async () => { const crops = ${JSON.stringify(crops.map((c) => c.data))}; const imgs = await Promise.all(crops.map((d) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + d; }))); const W = imgs[0].width, H = imgs[0].height; const c = document.createElement('canvas'); c.width = W * imgs.length; c.height = H; const x = c.getContext('2d'); imgs.forEach((im, k) => x.drawImage(im, k * W, 0)); return c.toDataURL('image/jpeg', 0.85).split(',')[1]; })()`);
      writeFileSync(join(out, `w4b-${tag}-guard-strip.jpg`), Buffer.from(strip, 'base64'));
      console.log('  strip: ' + crops.map((c) => c.label).join(' | '));
    }
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
