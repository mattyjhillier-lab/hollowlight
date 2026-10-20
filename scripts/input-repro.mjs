// Controls reproduction harness (CTL1): real (trusted) key events through CDP into a built game, one scenario at a time.
// Each scenario ends with every key released, then checks the hero is NOT still moving (stuck key) and that a fresh press moves her.
// Usage: node scripts/input-repro.mjs <distDir> [onlyScenario] [--long]   (own Chrome on 9543 + own static server on 4263; touches nothing else)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9543, HTTP = 4263;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const dist = process.argv[2];
const ONLY = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '';
const LONG = process.argv.includes('--long');
if (!dist || !existsSync(join(dist, 'index.html'))) { console.error('usage: node scripts/input-repro.mjs <distDir> [scenario] [--long]'); process.exit(2); }

function serve(dir) {
  const root = resolve(dir);
  const srv = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
    const f = resolve(join(root, p));
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(HTTP, '127.0.0.1', () => r(srv)));
}

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-in-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500); };
  return { send, ev, close, pid: proc.pid };
}

const KEYS = {
  d: ['d', 'KeyD', 68], a: ['a', 'KeyA', 65], w: ['w', 'KeyW', 87], s: ['s', 'KeyS', 83],
  right: ['ArrowRight', 'ArrowRight', 39], left: ['ArrowLeft', 'ArrowLeft', 37], up: ['ArrowUp', 'ArrowUp', 38], down: ['ArrowDown', 'ArrowDown', 40],
  space: [' ', 'Space', 32], esc: ['Escape', 'Escape', 27], 1: ['1', 'Digit1', 49], tab: ['Tab', 'Tab', 9], alt: ['Alt', 'AltLeft', 18],
};
const key = (c, type, k, extra = {}) => {
  const [kk, code, vk] = KEYS[k];
  const text = kk.length === 1 && type === 'keyDown' ? kk : undefined;
  return c.send('Input.dispatchKeyEvent', { type, key: kk, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(text ? { text, unmodifiedText: text } : {}), ...extra });
};
const down = (c, k, extra) => key(c, 'keyDown', k, extra);
const up = (c, k) => key(c, 'keyUp', k);
const tap = async (c, k) => { await down(c, k); await sleep(40); await up(c, k); };

const st = (c) => c.ev("(()=>{const a=window.__app,s=a.sim,p=s.player,sc=a.scene;const k=sc.keys||{};const held=sc.held?sc.held.list():Object.keys(k).filter((n)=>k[n].isDown);return {x:p.x,y:p.y,state:s.state,paused:a.paused,held,cd:s.ability.cdLeft,uses:s.abilityUses,t:s.time}})()");
// metres moved by the hero over ms of real time while the sim is running
async function drift(c, ms = 400) { const a = await st(c); await sleep(ms); const b = await st(c); return { d: Math.hypot(b.x - a.x, b.y - a.y), dx: b.x - a.x, dy: b.y - a.y, held: b.held, state: b.state, paused: b.paused }; }
const runIt = async (c) => { for (let i = 0; i < 30; i++) { const s = await st(c); if (s.state === 'running' && !s.paused) return; if (s.state === 'levelup') await c.ev("(()=>{const a=window.__app,s=a.sim;a.pick(s.offer.cards[0].key);return 1})()"); else if (s.paused) await c.ev('window.__app.togglePause(),1'); await sleep(120); } };
const forceLevelUp = (c) => c.ev("(()=>{const s=window.__app.sim;s.xp=s.xpNeeded+1;return 1})()");
const waitState = async (c, want, ms = 4000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(c); if (s.state === want) return true; await sleep(50); } return false; };

// verdict: after every key is up the hero must stand still, then a fresh 'd' tap must move her right
async function verdict(c) {
  await runIt(c);
  await sleep(250);
  const still = await drift(c, 400);
  await down(c, 'd'); await sleep(300); const s0 = await st(c); await sleep(200); const s1 = await st(c); await up(c, 'd');
  await sleep(150);
  const after = await drift(c, 300);
  return { stuck: still.d > 1, drift: +still.d.toFixed(1), held: still.held, freshPressMoves: s1.x - s0.x > 3, stopsAfter: after.d <= 1 };
}

const SCEN = {
  baseline: async (c) => { await down(c, 'd'); await sleep(500); await up(c, 'd'); },
  levelupReleaseDuringOverlay: async (c) => { await down(c, 'd'); await sleep(300); await forceLevelUp(c); await waitState(c, 'levelup'); await sleep(300); await up(c, 'd'); await sleep(200); await tap(c, '1'); },
  levelupPickWhileHeld: async (c) => { await down(c, 'd'); await sleep(300); await forceLevelUp(c); await waitState(c, 'levelup'); await sleep(300); await tap(c, '1'); await sleep(300); await up(c, 'd'); },
  levelupArrowsHeldThrough: async (c) => { await down(c, 'right'); await sleep(300); await forceLevelUp(c); await waitState(c, 'levelup'); await down(c, 'right', { autoRepeat: true }); await sleep(100); await up(c, 'right'); await sleep(100); await tap(c, '1'); },
  levelupArrowPressedDuringOverlay: async (c) => { await forceLevelUp(c); await waitState(c, 'levelup'); await sleep(200); await down(c, 'right'); await sleep(200); await tap(c, '1'); await sleep(300); await up(c, 'right'); },
  blurWhileHeld: async (c) => { await down(c, 'd'); await sleep(300); await c.ev("window.dispatchEvent(new Event('blur')),1"); await sleep(300); await c.ev("window.dispatchEvent(new Event('focus')),1"); /* the keyup happened while unfocused: never delivered */ },
  hiddenWhileHeld: async (c) => { await down(c, 'd'); await sleep(300); await c.ev("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange')),1"); await sleep(300); await c.ev("delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange')),1"); await sleep(200); },
  escPauseHeldReleaseInPause: async (c) => { await down(c, 'd'); await sleep(300); await tap(c, 'esc'); await sleep(350); await up(c, 'd'); await sleep(200); await tap(c, 'esc'); },
  escPauseHeldThrough: async (c) => { await down(c, 'd'); await sleep(300); await tap(c, 'esc'); await sleep(350); await tap(c, 'esc'); await sleep(300); await up(c, 'd'); },
  pauseSpaceResumeThenAbility: async (c) => { await c.ev('(()=>{window.__app.sim.ability.cdLeft=0;return 1})()'); await tap(c, 'esc'); await sleep(350); await tap(c, 'space'); await sleep(300); const u0 = (await st(c)).uses; await tap(c, 'space'); await sleep(250); const u1 = (await st(c)).uses; return { abilityFired: u1 > u0 }; },
  rollover: async (c) => { await down(c, 'a'); await sleep(200); await down(c, 'd'); await sleep(200); await up(c, 'a'); await sleep(300); const m = await drift(c, 300); await up(c, 'd'); return { rightAfterARelease: m.dx > 3 }; },
  spaceWhileMoving: async (c) => { await c.ev('(()=>{window.__app.sim.ability.cdLeft=0;return 1})()'); await down(c, 'w'); await sleep(200); const u0 = (await st(c)).uses; await tap(c, 'space'); await sleep(200); const m = await drift(c, 250); await up(c, 'w'); return { abilityFired: (await st(c)).uses > u0, keptMoving: m.d > 3 }; },
  altTabHeld: async (c) => { await down(c, 'd'); await sleep(200); await down(c, 'alt'); await c.ev("window.dispatchEvent(new Event('blur')),1"); await sleep(200); await c.ev("window.dispatchEvent(new Event('focus')),1"); await up(c, 'alt'); },
  focusOnHudButton: async (c) => { await c.ev("(()=>{const b=document.querySelector('.hud button');if(b){b.focus();}return 1})()"); await down(c, 'd'); await sleep(300); await up(c, 'd'); },
  crowdIdle: async (c) => {
    await c.ev("(()=>{const s=window.__app.sim,p=s.player;const T=['wolf','crow','root_crawler'];for(let k=0;k<300;k++){const a=(k*2.399)%6.2832,d=20+((k*37)%200);s.spawnEnemy(T[k%3],p.x+Math.cos(a)*d,p.y+Math.sin(a)*d);}s.xp=-1e9;return s.enemies.length})()");
    await sleep(LONG ? 60000 : 10000);
    const fr = await c.ev("(()=>{const sc=window.__app.scene;return Math.round(sc.frameMs)})()"); const pre = await st(c);
    const t0 = Date.now(); await down(c, 'd'); let lag = -1; const x0 = (await st(c)).x;
    for (let i = 0; i < 60; i++) { const s = await st(c); if (s.x - x0 > 0.5) { lag = Date.now() - t0; break; } await sleep(10); }
    await sleep(300); await up(c, 'd'); const tu = Date.now(); const xu = (await st(c)).x; await sleep(300); const over = (await st(c)).x - xu;
    return { preState: pre.state, prePaused: pre.paused, frameMs: fr, responseMs: lag, overshootAfterRelease: +over.toFixed(1), relMs: Date.now() - tu };
  },
  idle: async (c) => { await sleep(LONG ? 60000 : 8000); const t0 = Date.now(); await down(c, 'd'); let lag = -1; const x0 = (await st(c)).x; for (let i = 0; i < 40; i++) { const s = await st(c); if (s.x - x0 > 0.5) { lag = Date.now() - t0; break; } await sleep(10); } await sleep(200); await up(c, 'd'); return { responseMs: lag }; },
};

const srv = await serve(dist);
const c = await launch();
console.log('chrome pid', c.pid);
const rows = [];
try {
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  for (const [name, fn] of Object.entries(SCEN)) {
    if (ONLY && name !== ONLY) continue;
    await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?auto=wren&seed=1&t=40&god=1` });
    let ok = false;
    for (let i = 0; i < 80 && !ok; i++) { await sleep(250); try { ok = await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.keys)'); } catch { /* */ } }
    if (!ok) throw new Error('game did not start');
    await c.ev("(()=>{const a=window.__app;a.sim.enemies.length=0;a.sim.xp=0;return 1})()"); // quiet start: no swarm, no immediate level-up
    await sleep(400);
    await runIt(c);
    const extra = (await fn(c)) || {};
    const v = await verdict(c);
    const row = { scenario: name, ...v, ...extra };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
} finally { c.close(); srv.close(); }
const bad = rows.filter((r) => r.stuck || !r.freshPressMoves || !r.stopsAfter || r.abilityFired === false || r.rightAfterARelease === false || r.keptMoving === false);
console.log(`\n${rows.length} scenarios, ${bad.length} failing: ${bad.map((r) => r.scenario).join(', ') || 'none'}`);
