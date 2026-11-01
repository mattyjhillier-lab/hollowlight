// EW2: Ember Breath screenshots + draw-cost probe on the REAL build (dist/). Own Chrome (port 9491) + own static server (4291); closes only what it opened.
//   node scripts/ember-shots.mjs shots <outDir>     mid-breath frames: desk (true size 640x360 x2) + phone, high / med / low tier, plus a Calm-motion frame
//   node scripts/ember-shots.mjs cost              CPU ms per drawEmberBreath call (live breath) and per game frame with 350 foes, per tier
// Headless software GL: use the numbers as relative costs only (pace.mjs / a real phone is the perf truth).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9491, HTTP = 4291;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], phone: [390, 844, 2] };
const GRANT = 'ember_breath:power=5,area=5';

function serve(dir) {
  const root = resolve(dir);
  const srv = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = resolve(join(root, p));
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(HTTP, '127.0.0.1', () => r(srv)));
}
async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-ember-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; const to = setTimeout(() => { pending.delete(i); rej(new Error('cdp timeout: ' + method)); }, 90000); pending.set(i, { res: (v) => { clearTimeout(to); res(v); }, rej: (e) => { clearTimeout(to); rej(e); } }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch { /* ignore */ } try { proc.kill(); } catch { /* ignore */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } }, 1500); };
  return { send, ev, close };
}
async function open(c, view, tier, calm) {
  const [w, h, dpr] = VIEWS[view];
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?style=a&auto=wren&seed=3&god=1&debug=0&t=60&grant=${GRANT}` });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) { await c.ev(`window.__app.save.setSettings({quality:'${tier}',reducedMotion:${!!calm}}); true`); return; } } catch { /* loading */ }
  }
  throw new Error('run did not start');
}
// a still hero facing right with a crowd in the cone, a few off to the sides; the hero never moves (bot idle) so frames compare
const stage = (c, n) => c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player;s.enemies.length=0;s.xpNeeded=1e9;p.hx=1;p.hy=0;
  const T=['wolf','crow','root_crawler'];for(let k=0;k<${n};k++){const th=((k*2.399)%6.2832),d=30+((k*37)%${n > 60 ? 260 : 60});const e=s.spawnEnemy(T[k%3],p.x+Math.cos(th)*d*(${n > 60 ? 1.5 : 1}),p.y+Math.sin(th)*d*(${n > 60 ? 0.9 : 0.7}));e.hp=e.maxHp=1e9;e.speed=0;}
  for(let k=0;k<7;k++){const e=s.spawnEnemy(T[k%3],p.x+44+k*5,p.y-14+k*5);e.hp=e.maxHp=1e9;e.speed=0;}
  const keep=s.player.hp;s.player.hp=s.player.maxHp;return s.enemies.length})()`);
const shot = async (c, file) => { const r = await c.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(r.data, 'base64')); };
const waitBreath = (c, tmin) => c.ev(`new Promise((res)=>{const t0=performance.now();const f=()=>{const w=window.__app.sim.weapons.find(x=>x.id==='ember_breath');if(w&&w.rt.br&&w.rt.br.t>=${tmin})res(w.rt.br.t);else if(performance.now()-t0>20000)res(-1);else requestAnimationFrame(f)};f()})`);

async function shots(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve('dist'); const c = await launch();
  try {
    for (const [view, tier, calm] of [['desk', 'high', 0], ['desk', 'med', 0], ['desk', 'low', 0], ['desk', 'high', 1], ['phone', 'high', 0], ['phone', 'low', 0]]) {
      await open(c, view, tier, calm); await stage(c, 40);
      for (const [name, tmin] of [['early', 0.1], ['mid', 0.3], ['late', 0.55]]) {
        const t = await waitBreath(c, tmin); await shot(c, join(out, `${view}-${tier}${calm ? '-calm' : ''}-${name}.png`)); console.log(view, tier, calm ? 'calm' : '', name, 'breath t=', t);
      }
    }
  } finally { c.close(); srv.close(); }
}
async function cost() {
  const srv = await serve('dist'); const c = await launch();
  try {
    for (const tier of ['high', 'med', 'low']) {
      await open(c, 'desk', tier, 0); const n = await stage(c, 350);
      const r = await c.ev(`new Promise((res)=>{const sc=window.__app.scene;const o=sc.drawEmberBreath.bind(sc);let ms=0,calls=0,live=0;
        sc.drawEmberBreath=(...a)=>{const t=performance.now();o(...a);const d=performance.now()-t;ms+=d;calls++;if(sc.emb)live++;};
        let frames=0;const t0=performance.now();const f=()=>{frames++;if(performance.now()-t0>8000){const ft=(performance.now()-t0)/frames;res({frames,frameMs:+ft.toFixed(2),calls,callMsAvg:+(ms/calls).toFixed(4),liveCalls:live,callMsPerLive:+(ms/Math.max(1,live)).toFixed(4)})}else requestAnimationFrame(f)};f()})`);
      console.log(tier, 'foes', n, JSON.stringify(r));
    }
  } finally { c.close(); srv.close(); }
}
const mode = process.argv[2];
if (mode === 'shots') await shots(process.argv[3] || 'docs/screenshots/ember-breath'); else if (mode === 'cost') await cost(); else console.log('usage: shots <outDir> | cost');
process.exit(0);
