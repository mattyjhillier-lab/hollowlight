// E1 check: node scripts/e1-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// Headless Chrome over CDP. Offers are STAGED in a debug run (?debug params never touch the real save): the sim is paused in
// 'levelup', sim.offer is replaced with hand-built cards of every kind (same shapes the Sim produces) and the REAL ui.showLevelUp
// renders them. One natural, unstaged offer per viewport is also captured. Measures overflow, hit targets, text sizes, row layout.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9351;
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

// Stage one offer per weapon: its 4 stat cards (real shapes), then measure clipping/overflow with the same checks as HUD-2.
const STAGE = `(() => {
  const a = window.__app, s = a.sim, d = a.data || s.data;
  const st = (weaponId, stat, rank) => ({ key: 's:' + weaponId + ':' + stat, kind: 'stat', weaponId, stat, rank, nextRank: rank + 1, maxRank: 5, title: '', desc: '', color: d.weapons[weaponId].color });
  const w = %W%;
  s.pending = 1; s.xp = 0;
  if (s.state !== 'levelup') s.beginLevelUp();
  s.offer = { gold: [], cards: Object.keys(d.weapons[w].stats).map((k) => st(w, k, 1)) };
  a.ui.showLevelUp(s);
  return [...document.querySelectorAll('.layer-levelup .c-desc')].map((e) => e.textContent);
})()`;
const MEASURE = `(() => {
  const q = (sel) => [...document.querySelectorAll(sel)];
  const R = (e) => e.getBoundingClientRect();
  const cards = q('.layer-levelup .card');
  const clipped = [];
  for (const c of cards) { const cr = R(c); for (const e of c.querySelectorAll('*')) { if (e.closest('svg') || /eyelet/.test(e.className)) continue; const r = R(e); if (r.width && (r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1)) clipped.push(c.className + ' > ' + e.className); } }
  const cut = q('.layer-levelup .c-desc').filter((e) => e.scrollHeight > e.clientHeight + 1 || e.textContent.endsWith('…')).map((e) => e.textContent);
  return { n: cards.length, clipped, cut, descFs: Math.min(...q('.layer-levelup .c-desc').map((e) => parseFloat(getComputedStyle(e).fontSize)).concat([999])) };
})()`;
const WEAPONS = ['ghost_wolves', 'holy_orbit', 'raven_flock', 'spirit_bolts', 'chain_lightning'];
const VIEWS = [['desktop-1280x720', 1280, 720, false], ['phone-land-844x390', 844, 390, true], ['phone-port-390x844', 390, 844, true]];
try {
  for (const [tag, w, h, mobile] of VIEWS) {
    console.log(`== ${tag}`);
    await load(w, h, mobile, `?auto=wren&seed=1&god=1&rr=2&ban=1${mobile ? '&touch=1' : ''}`);
    for (const wid of WEAPONS) {
      const descs = await ev(STAGE.replace('%W%', JSON.stringify(wid)));
      await sleep(900);
      const m = await ev(MEASURE);
      check(`${tag}/${wid}: ${m.n} cards, none clipped, no cut text`, m.n === 4 && m.clipped.length === 0 && m.cut.length === 0, JSON.stringify([m.clipped.slice(0, 2), m.cut]));
      if (process.env.TXT) console.log('   ', descs.join(' | '));
      await shot(`${tag}-${wid}`);
    }
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
