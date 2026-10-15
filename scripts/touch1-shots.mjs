// TOUCH-1 check: node scripts/touch1-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// Headless Chrome over CDP with touch emulation (Input.dispatchTouchEvent). Real UI path, ?touch=1 only.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9335;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = mkdtempSync(join(tmpdir(), 'hl-touch-'));
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

async function load(w, h, query = '?touch=1') {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.scene)')) break; } catch { /* loading */ } }
  await sleep(500);
}

async function session(tag, w, h) {
  console.log(`== ${tag} ${w}x${h}`);
  await load(w, h);
  check(`${tag}: touch class on`, await ev("document.documentElement.classList.contains('touch')"));
  check(`${tag}: viewport-fit=cover`, await ev("document.querySelector('meta[name=viewport]').content.includes('viewport-fit=cover')"));
  await shot(`${tag}-1-title`);
  // title: tap the first hero card
  const card = await rect('.charcard');
  check(`${tag}: hero card >=44px`, card && card.w >= 44 && card.h >= 44, JSON.stringify(card && { w: card.w, h: card.h }));
  await tap(card.x, card.y);
  await sleep(800);
  let s = await st();
  check(`${tag}: tap hero starts run`, s && s.state === 'running');
  check(`${tag}: touch layer visible in run`, (await rect('.touch-layer')).vis);
  // god-mode-free: just move for a bit. Floating stick: touch down in left 55%, drag right.
  const sx = Math.round(w * 0.2), sy = Math.round(h * 0.65);
  s = await st();
  const x0 = s.x;
  await touch('touchStart', [{ x: sx, y: sy, id: 1 }]);
  await sleep(100);
  await touch('touchMove', [{ x: sx + 60, y: sy, id: 1 }]);
  await sleep(900);
  await shot(`${tag}-2-run-stick`);
  const mid = await st();
  check(`${tag}: stick moves player right`, mid.x > x0 + 20, `dx=${(mid.x - x0).toFixed(1)}`);
  check(`${tag}: stick base drawn`, (await rect('.touch-base')).vis);
  // multi-touch: with the stick held, tap the ability button with a second finger
  const ab = await rect('.touch-ability');
  check(`${tag}: ability >=44px`, ab.w >= 44 && ab.h >= 44, `${ab.w}x${ab.h}`);
  await ev('(()=>{window.__app.sim.ability.cdLeft=0;return 1})()');
  await sleep(150);
  const cd0 = (await st()).cd;
  await touch('touchStart', [{ x: sx, y: sy, id: 1 }, { x: ab.x, y: ab.y, id: 2 }]);
  await sleep(80);
  await touch('touchStart', [{ x: sx + 60, y: sy, id: 1 }]).catch(() => {});
  await sleep(50);
  await touch('touchEnd', [{ x: sx + 60, y: sy, id: 1 }]);
  await sleep(300);
  const after = await st();
  check(`${tag}: ability fires while stick held`, cd0 <= 0 && after.cd > 5, `cd ${cd0.toFixed(1)}->${after.cd.toFixed(1)}`);
  // release stick: player must stop
  await touch('touchEnd', []);
  await sleep(300);
  const r1 = await st();
  await sleep(500);
  const r2 = await st();
  check(`${tag}: no stuck stick after release`, Math.abs(r2.x - r1.x) < 0.5 && Math.abs(r2.y - r1.y) < 0.5);
  // cancel handling
  await touch('touchStart', [{ x: sx, y: sy, id: 1 }]);
  await touch('touchMove', [{ x: sx - 60, y: sy, id: 1 }]);
  await sleep(300);
  await touch('touchCancel', []);
  await sleep(300);
  const c1 = await st();
  await sleep(500);
  const c2 = await st();
  check(`${tag}: touchcancel releases stick`, Math.abs(c2.x - c1.x) < 0.5);
  // pause button
  const pb = await rect('.touch-pause');
  check(`${tag}: pause >=44px`, pb.w >= 44 && pb.h >= 44);
  await tap(pb.x, pb.y);
  s = await st();
  check(`${tag}: pause button pauses`, s.paused);
  await shot(`${tag}-3-pause`);
  check(`${tag}: touch layer hidden while paused`, !(await rect('.touch-layer')).vis);
  const rs = await rect('[data-act="resume"]');
  await tap(rs.x, rs.y);
  s = await st();
  check(`${tag}: resume by tap`, !s.paused);
  // level-up: grant xp, pick a card by tap
  await ev('(()=>{const s=window.__app.sim;s.xp=s.xpNeeded+1;return 1})()');
  await sleep(700);
  s = await st();
  check(`${tag}: level-up opens`, s.state === 'levelup');
  await shot(`${tag}-4-levelup`);
  const cards = await ev("[...document.querySelectorAll('.layer-levelup .card')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height}})");
  check(`${tag}: cards >=44px`, cards.length >= 1 && cards.every((c) => c.w >= 44 && c.h >= 44), `${cards.length} cards`);
  const lv0 = s.lvl;
  await tap(cards[0].x, cards[0].y);
  await sleep(300);
  s = await st();
  check(`${tag}: card picked by tap`, s.state === 'running' || s.lvl > lv0 || s.state === 'levelup' && false);
  check(`${tag}: ?touch=1 is not a debug run (saving stays on)`, !(await ev('window.__app.isDebugRun()')));
  // focus loss while holding the stick: release + auto-pause
  await touch('touchStart', [{ x: sx, y: sy, id: 1 }]);
  await touch('touchMove', [{ x: sx + 60, y: sy, id: 1 }]);
  await sleep(200);
  await ev("window.dispatchEvent(new Event('blur'))");
  await sleep(300);
  check(`${tag}: blur auto-pauses and releases stick`, (await st()).paused && (await ev('window.__app.touch.stick.active')) === false);
  await touch('touchEnd', []);
  await ev("document.querySelector('.layer-pause [data-act=resume]').click()");
  await sleep(200);
  await tap(pb.x, pb.y);
  // settings via pause menu
  await tap(pb.x, pb.y);
  const sb = await rect('.layer-pause [data-act="settings"]');
  await tap(sb.x, sb.y);
  await sleep(300);
  await shot(`${tag}-5-settings`);
  const sels = await ev("[...document.querySelectorAll('.layer-settings select')].map(e=>({h:e.getBoundingClientRect().height}))");
  check(`${tag}: settings has touch selects`, sels.length >= 3 && sels.every((x) => x.h >= 44), JSON.stringify(sels));
  // back by tap, then menu
  const bk = await rect('.layer-settings .btn.big');
  await tap(bk.x, bk.y);
  await sleep(300);
  const mn = await rect('.layer-pause [data-act="menu"]');
  if (mn && mn.vis) { await tap(mn.x, mn.y); await sleep(500); }
  await shot(`${tag}-6-menu-again`);
  // tree by tap
  await ev("document.querySelector('.layer-start [data-act=tree]').scrollIntoView({block:'center'})"); await sleep(200);
  const tb = await rect('.layer-start [data-act="tree"]');
  if (tb) {
    await tap(tb.x, tb.y);
    await sleep(900);
    await shot(`${tag}-7-tree`);
    const nodes = await ev("document.querySelectorAll('.tree-node').length");
    check(`${tag}: tree opens by tap`, nodes > 0, `${nodes} nodes`);
    const node = await ev("(()=>{const e=[...document.querySelectorAll('.tree-node')].find(n=>{const r=n.getBoundingClientRect();return /Bound Spirits|Moon-Touched|Warm Embers/.test(n.textContent)&&r.x>0&&r.right<innerWidth&&r.bottom<innerHeight-120&&r.y>60});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width}})()");
    if (node) {
      await tap(node.x, node.y);
      const sel = await ev("!!document.querySelector('.tree-node.sel')");
      check(`${tag}: tree node selectable by tap`, sel);
    }
    const back = await ev("(()=>{const b=[...document.querySelectorAll('.layer-tree .btn')].find(b=>/back|close/i.test(b.textContent));if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,h:r.height}})()");
    check(`${tag}: tree back button >=44px`, back && back.h >= 44, JSON.stringify(back));
  }
}

try {
  await session('land', 844, 390);
  await session('port', 390, 844);
  // keyboard+mouse desktop: controls hidden without ?touch=1
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base + '/' });
  for (let i = 0; i < 60; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui)')) break; } catch { /* loading */ } }
  check('desktop: touch class off by default', !(await ev("document.documentElement.classList.contains('touch')")));
} finally {
  try { ws.close(); } catch { /* ignore */ }
  try { proc.kill(); } catch { /* ignore */ }
}
const bad = results.filter((r) => !r[1]);
console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
