// DM7: Ophimber's Rise screenshots + draw-cost probe on the REAL build (dist/; run `npm run build` first). Own Chrome (port 9494) + own static server (4294); closes only what it opened.
//   node scripts/rise-shots.mjs shots <outDir> [nameFilter]   pet / preview / sweep / two rings / all three / fading: desk (1280x720 = true 640x360 x2) + phone (390x844 @2x), High / Med / Low + Calm.
//   node scripts/rise-shots.mjs cost             ms per RiseLayer.update with ~350 foes, per tier, art on vs off (relative only: headless software GL).
// Lucinda has no hero rig yet (DM7 is the ability + Ophimber art only), so the shots run as Wren and swap in her hidden ability (sim only; the app cannot start her).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9494, HTTP = 4294;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], phone: [390, 844, 2] };

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-rise-'));
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
async function open(c, view, tier, calm, grant, t = 60) {
  const [w, h, dpr] = VIEWS[view];
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${grant}` });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) { await c.ev(`window.__app.save.setSettings({quality:'${tier}',reducedMotion:${!!calm}}); true`); return; } } catch { /* loading */ }
  }
  throw new Error('run did not start');
}

// immortal still foes: a few on every ring band (so the burn shows), stragglers between, a tight pack outside; she stands still
const stage = (c, n = 1) => c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player;s.chapter={...s.chapter,waves:[],events:[]};s.spawnAcc=[];s.enemies.length=0;s.xpNeeded=1e9;
  const T=['wolf','crow','root_crawler'];
  const mk=(x,y)=>{const e=s.spawnEnemy(T[s.enemies.length%3],x,y);e.hp=e.maxHp=1e9;e.speed=0;};
  for(const [r,k] of [[48,5],[88,8],[128,11]])for(let j=0;j<k;j++){const th=j/k*6.2832+r;mk(p.x+Math.sin(th)*r,p.y-Math.cos(th)*r*0.98);}
  for(let j=0;j<9;j++){const th=j*2.1,d=64+((j*29)%50);mk(p.x+Math.sin(th)*d,p.y-Math.cos(th)*d);}
  for(let j=0;j<${n}*8;j++){mk(p.x+150+((j*13)%34),p.y+10+((j*29)%30));}
  p.hp=p.maxHp;s.ability.cdLeft=0;return s.enemies.length})()`);
const cast = (c) => c.ev(`(()=>{const a=window.__app,s=a.sim;s.character=a.data.hiddenCharacters.hearthwarden;s.ability.id='ophimbers_rise';s.ability.cdLeft=0;return s.useAbility()})()`);
const freezeWhen = (c, expr, ms = 25000) => c.ev(`new Promise((res)=>{const t0=performance.now();const f=()=>{let ok=false;try{ok=!!(${expr})}catch(e){}if(ok){window.__app.scene.game.loop.sleep();res(true)}else if(performance.now()-t0>${ms})res(false);else requestAnimationFrame(f)};f()})`);
const wake = (c) => c.ev('window.__app.scene.game.loop.wake(); true');
const shot = async (c, file, clip) => { const r = await c.send('Page.captureScreenshot', clip ? { format: 'jpeg', quality: 80, clip: { ...clip, scale: 2 } } : { format: 'jpeg', quality: 80 }); writeFileSync(file, Buffer.from(r.data, 'base64')); };
const around = (c, wx, wy, w, h) => c.ev(`(()=>{const sc=window.__app.scene,cv=sc.game.canvas,r=cv.getBoundingClientRect(),wv=sc.cameras.main.worldView,k=r.width/wv.width;return {x:Math.max(0,r.left+(${wx}-wv.x)*k-${w}/2),y:Math.max(0,r.top+(${wy}-wv.y)*k-${h}/2),width:${w},height:${h}}})()`);
const AT = (lo, hi) => `(()=>{const R=window.__app.sim.rise;return R&&R.t>=${lo}&&R.t<${hi}})()`;
const STATES = { pet: AT(0.3, 0.38), preview: AT(0.2, 0.26), sweep: AT(0.55, 0.66), two: AT(1.0, 1.08), full: AT(2.5, 2.6), out: AT(5.0, 5.1) };
const ONLY = process.argv[4] ? new RegExp(process.argv[4]) : null;
async function one(c, out, view, tier, calm, state, t = 60, tag = '') {
  const name = `${view}-${tier}${calm ? '-calm' : ''}-${state}${tag}`;
  if (ONLY && !ONLY.test(name)) return;
  await open(c, view, tier, calm, 'ghost_wolves', t); await stage(c); await cast(c);
  const ok = await freezeWhen(c, STATES[state]);
  if (!ok) { console.log(name, 'STATE NOT REACHED'); await wake(c); return; }
  await shot(c, join(out, name + '.jpg'));
  const f = await c.ev('(()=>{const s=window.__app.sim;return [s.rise.x,s.rise.y]})()');
  if (state === 'pet') { const clip = await around(c, f[0] + 10, f[1] - 24, view === 'desk' ? 220 : 140, view === 'desk' ? 150 : 120); await shot(c, join(out, name + '-zoom.jpg'), clip); }
  console.log(name, JSON.stringify(await c.ev('({sprites:window.__app.scene.rise.sprites,t:+window.__app.sim.rise.t.toFixed(2)})')));
  await wake(c);
}
async function shots(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve('dist'); const c = await launch();
  try {
    for (const [view, tier, calm, state, t, tag] of [
      ['desk', 'high', 0, 'pet'], ['desk', 'high', 0, 'preview'], ['desk', 'high', 0, 'sweep'], ['desk', 'high', 0, 'two'], ['desk', 'high', 0, 'full'], ['desk', 'high', 0, 'out'],
      ['desk', 'high', 0, 'full', 700, '-night'], ['desk', 'med', 0, 'sweep'], ['desk', 'med', 0, 'full'], ['desk', 'low', 0, 'full'], ['desk', 'low', 0, 'preview'],
      ['desk', 'high', 1, 'sweep'], ['desk', 'high', 1, 'full'],
      ['phone', 'high', 0, 'preview'], ['phone', 'high', 0, 'full'], ['phone', 'med', 0, 'full'], ['phone', 'low', 0, 'full'], ['phone', 'high', 1, 'full'],
    ]) await one(c, out, view, tier, calm, state, t || 60, tag || '');
  } finally { c.close(); srv.close(); }
}
async function cost() {
  const srv = await serve('dist'); const c = await launch();
  try {
    for (const tier of ['high', 'med', 'low']) {
      await open(c, 'desk', tier, 0, 'ghost_wolves'); const n = await stage(c, 40); await cast(c);
      const run = (art) => c.ev(`new Promise((res)=>{const sc=window.__app.scene,m=sc.rise,o=Object.getPrototypeOf(m).update;
        let ms=0,calls=0;m.update=function(x){const t=performance.now();${art ? 'o.call(this,x)' : 'void 0'};ms+=performance.now()-t;calls++};
        let frames=0;const t0=performance.now();const f=()=>{frames++;const s=window.__app.sim;if(!s.rise){s.ability.cdLeft=0;s.useAbility()}if(performance.now()-t0>7000){delete m.update;res({art:${art},frames,frameMs:+((performance.now()-t0)/frames).toFixed(2),layerMsAvg:+(ms/Math.max(1,calls)).toFixed(4),sprites:m.sprites})}else requestAnimationFrame(f)};f()})`);
      const on = await run(true), off = await run(false), on2 = await run(true);
      console.log(tier, 'foes', n, JSON.stringify({ on, off, on2 }));
    }
  } finally { c.close(); srv.close(); }
}
const mode = process.argv[2];
if (mode === 'shots') await shots(process.argv[3] || 'docs/screenshots/dm7'); else if (mode === 'cost') await cost(); else console.log('usage: shots <outDir> [nameFilter] | cost');
process.exit(0);
