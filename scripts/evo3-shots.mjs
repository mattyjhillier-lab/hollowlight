// EVO-HINT staged screenshots: node scripts/evohint-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// Headless Chrome over CDP with touch emulation (Input.dispatchTouchEvent). Real UI path, ?touch=1 only.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9341;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = mkdtempSync(join(tmpdir(), 'hl-evo3-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--autoplay-policy=no-user-gesture-required',
  ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') console.error('PAGE ERR', d.params.args.map((a) => a.value || a.description).join(' '));
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
const results = [];
const check = (name, ok, extra = '') => { results.push([name, !!ok]); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const f = join(out, name + '.jpg');
  writeFileSync(f, Buffer.from(r.data, 'base64'));
  const kb = Math.round(statSync(f).size / 1024);
  console.log(`  shot ${name}.jpg ${kb}KB`);
  if (kb > 300) check(`shot size ${name}`, false, kb + 'KB');
};
const touch = (type, pts) => send('Input.dispatchTouchEvent', { type, touchPoints: pts });
const tap = async (x, y) => { await touch('touchStart', [{ x, y, id: 1 }]); await sleep(60); await touch('touchEnd', []); await sleep(120); };
const rect = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,vis:getComputedStyle(e).display!=='none'}})()`);
const st = () => ev('(()=>{const a=window.__app,s=a.sim;return s?{x:s.player.x,y:s.player.y,t:s.time,state:s.state,paused:a.paused,cd:s.ability.cdLeft,lvl:s.level}:null})()');

async function load(w, h, query) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 600 });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.scene)')) break; } catch { /* loading */ } }
  await sleep(500);
}


const Q = '?auto=wren&seed=1&god=1&rr=30&grant=ghost_wolves:power=5,duration=5;chain_lightning:chains=5,power=5;raven_flock:count=5,range=5';
async function session(tag, w, h, dpr, touch) {
  console.log(`== ${tag} ${w}x${h}`);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: w < 600 || h < 500 });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + Q + (touch ? '&touch=1' : '') });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim)')) break; } catch { /* loading */ } }
  await ev("(()=>{const s=window.__app.sim;[\"dire_alpha\",\"thunder_judgment\",\"murder_storm\"].forEach((x)=>s.unlockedEvolutions.add(x));s.xp=s.xpNeeded+1;})()");
  let n = 0;
  for (let i = 0; i < 60 && n < 3; i++) { await sleep(250); n = await ev("document.querySelectorAll('.layer-levelup .card.is-evolve').length"); }
  await sleep(1200);
  check(`${tag}: ${n} evolve cards`, n === 3);
  const r = await ev(`(()=>{const cs=[...document.querySelectorAll('.layer-levelup .card')];const vh=innerHeight,vw=innerWidth;return {vw,vh,cards:cs.map(c=>{const b=c.getBoundingClientRect();const d=c.querySelector('.c-desc');const bad=[...c.querySelectorAll('.c-desc,.c-title,.c-num,.c-unit')].filter(e=>e.scrollHeight>e.clientHeight+1&&getComputedStyle(e).display!=='none'&&!e.classList.contains('c-desc')).map(e=>e.className);return {x:b.x,y:b.y,w:b.width,h:b.height,b:b.bottom,r:b.right,desc:d?d.innerText:null,dh:d?[d.scrollHeight,d.clientHeight]:null,bad,cs:c.scrollHeight>c.clientHeight+1}})}})()`);
  console.log(JSON.stringify(r));
  const c = r.cards;
  check(`${tag}: cards inside viewport`, c.every((k) => k.y >= 0 && k.b <= r.vh + 1 && k.x >= 0 && k.r <= r.vw + 1), c.map((k) => Math.round(k.b)).join(','));
  let ov = false; for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) { const a = c[i], b = c[j]; if (a.x < b.r - 1 && b.x < a.r - 1 && a.y < b.b - 1 && b.y < a.b - 1) ov = true; }
  check(`${tag}: no overlap`, !ov);
  check(`${tag}: desc not clamped`, c.every((k) => !k.dh || k.dh[0] <= k.dh[1] + 1), c.map((k) => k.dh && k.dh.join('/')).join(' '));
  check(`${tag}: card height >= 44`, c.every((k) => k.h >= 44), c.map((k) => Math.round(k.h)).join(','));
  await shot(tag);
}
const OUT = out;
try {
  await session('3evo-desktop-1280x720', 1280, 720, 1);
  await session('3evo-game-640x360', 640, 360, 2);
  await session('3evo-phone-landscape-812x375', 812, 375, 2, true);
  await session('3evo-phone-portrait-375x812', 375, 812, 2, true);
  await session('3evo-small-portrait-320x568', 320, 568, 2, true);
} finally {
  try { ws.close(); } catch { /* ignore */ }
  try { proc.kill(); } catch { /* ignore */ }
}
const bad = results.filter((r) => !r[1]);
console.log(`${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
