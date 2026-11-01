// DM3: Dragonfire Meteor screenshots + draw-cost probe on the REAL build (dist/; run `npm run build` first). Own Chrome (port 9492) + own static server (4292); closes only what it opened.
//   node scripts/meteor-shots.mjs shots <outDir>   flight / impact / pool (rank 1 + 5) / crowd frames: desk (1280x720 = true 640x360 x2) + phone (390x844 @2x), High / Med / Low + Calm
//   node scripts/meteor-shots.mjs cost             ms per MeteorLayer.update and per game frame with 350 foes, per tier, art on vs off (relative only: headless software GL)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9492, HTTP = 4292;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], phone: [390, 844, 2] };
const R1 = 'dragonfire_meteor', R5 = 'dragonfire_meteor:power=5,area=5,count=5,duration=5';

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-meteor-'));
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
// a still hero with one tight crowd ~115 px to the right (+ stragglers); foes cannot die or move, so the pools keep burning them
const stage = (c, n) => c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player;s.enemies.length=0;s.xpNeeded=1e9;
  const T=['wolf','crow','root_crawler'];
  const mk=(x,y)=>{const e=s.spawnEnemy(T[s.enemies.length%3],x,y);e.hp=e.maxHp=1e9;e.speed=0;};
  if(${n}>60){for(let k=0;k<${n};k++){const th=k*2.399,d=70+((k*37)%190);mk(p.x+Math.cos(th)*d*1.5,p.y+Math.sin(th)*d*0.9);}}
  else{for(let k=0;k<${n};k++){const th=k*2.399,d=6+((k*13)%46);mk(p.x+115+Math.cos(th)*d,p.y-6+Math.sin(th)*d*0.8);}
    for(let k=0;k<6;k++)mk(p.x-120+k*18,p.y+70-k*20);}
  p.hp=p.maxHp;return s.enemies.length})()`);
const wep = "window.__app.sim.weapons.find(w=>w.id==='dragonfire_meteor')";
// freeze the game loop on the frame the condition holds (the last rendered frame stays on screen), shoot, wake
const freezeWhen = (c, expr, ms = 25000) => c.ev(`new Promise((res)=>{const t0=performance.now();const f=()=>{let ok=false;try{ok=!!(${expr})}catch(e){}if(ok){window.__app.scene.game.loop.sleep();res(true)}else if(performance.now()-t0>${ms})res(false);else requestAnimationFrame(f)};requestAnimationFrame(f)})`);
const wake = (c) => c.ev('window.__app.scene.game.loop.wake(); true');
const shot = async (c, file, clip) => { const r = await c.send('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: 2 } } : { format: 'png' }); writeFileSync(file, Buffer.from(r.data, 'base64')); };
const around = (c, wx, wy, w, h) => c.ev(`(()=>{const sc=window.__app.scene,cv=sc.game.canvas,r=cv.getBoundingClientRect(),wv=sc.cameras.main.worldView,k=r.width/wv.width;return {x:Math.max(0,r.left+(${wx}-wv.x)*k-${w}/2),y:Math.max(0,r.top+(${wy}-wv.y)*k-${h}/2),width:${w},height:${h}}})()`);
const STATES = {
  flight: `(()=>{const w=${wep};return w&&w.rt.fly&&w.rt.fly.some(f=>f.t<0.2&&f.t>0.08)})()`,
  impact: `(()=>{const m=window.__app.scene.meteor;return m.imp.length&&m.imp[0].t>0.05&&m.imp[0].t<0.16})()`,
  pool: `(()=>{const w=${wep};return w&&w.rt.pools&&w.rt.pools.length>=1&&w.rt.pools[0].life<(w.s.duration||3)-0.9})()`,
  crowd: `(()=>{const w=${wep};return w&&w.rt.pools&&w.rt.pools.length>=3&&window.__app.scene.meteor.imp.length>=1&&window.__app.scene.meteor.imp[0].t>0.06})()`,
};
const focus = (c, st) => c.ev(`(()=>{const w=${wep},m=window.__app.scene.meteor;const f=${JSON.stringify(st)};if(f==='flight'){const b=w.rt.fly[0];return b?[b.x,b.y-30]:null}if(f==='impact'&&m.imp[0])return [m.imp[0].x,m.imp[0].y];const q=w.rt.pools[0];return q?[q.x,q.y]:null})()`);

const ONLY = process.argv[4] ? new RegExp(process.argv[4]) : null; // optional name filter, e.g. 'desk-high-r5'
async function one(c, out, view, tier, calm, rank, state, n = 22, t = 60, tag = '') {
  if (ONLY && !ONLY.test(`${view}-${tier}${calm ? '-calm' : ''}-r${rank}-${state}${tag}`)) return;
  await open(c, view, tier, calm, rank === 5 ? R5 : R1, t); await stage(c, n);
  const ok = await freezeWhen(c, STATES[state]);
  const name = `${view}-${tier}${calm ? '-calm' : ''}-r${rank}-${state}${tag}`;
  if (!ok) { console.log(name, 'STATE NOT REACHED'); await wake(c); return; }
  await shot(c, join(out, name + '.png'));
  const f = await focus(c, state);
  if (f) { const clip = await around(c, f[0], f[1], view === 'desk' ? 330 : 180, view === 'desk' ? 190 : 150); await shot(c, join(out, name + '-zoom.png'), clip); }
  console.log(name, JSON.stringify(await c.ev('({sprites:window.__app.scene.meteor.sprites})')));
  await wake(c);
}
async function shots(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve('dist'); const c = await launch();
  try {
    for (const [view, tier, calm, rank, state, n, t, tag] of [
      ['desk', 'high', 0, 1, 'flight'], ['desk', 'high', 0, 1, 'impact'], ['desk', 'high', 0, 1, 'pool'],
      ['desk', 'high', 0, 5, 'flight'], ['desk', 'high', 0, 5, 'impact'], ['desk', 'high', 0, 5, 'pool'], ['desk', 'high', 0, 5, 'crowd'],
      ['desk', 'high', 0, 5, 'crowd', 22, 700, '-night'], ['desk', 'high', 0, 5, 'pool', 4, 60, '-sparse'], ['desk', 'high', 0, 1, 'pool', 4, 60, '-sparse'], ['desk', 'high', 0, 5, 'pool', 4, 700, '-sparse-night'],
      ['desk', 'med', 0, 5, 'pool'], ['desk', 'med', 0, 5, 'crowd'],
      ['desk', 'low', 0, 5, 'flight'], ['desk', 'low', 0, 5, 'pool'], ['desk', 'low', 0, 5, 'crowd'],
      ['desk', 'high', 1, 5, 'flight'], ['desk', 'high', 1, 5, 'pool'],
      ['phone', 'high', 0, 5, 'flight'], ['phone', 'high', 0, 5, 'pool'], ['phone', 'high', 0, 5, 'crowd'], ['phone', 'low', 0, 5, 'pool'], ['phone', 'low', 0, 5, 'crowd'],
    ]) await one(c, out, view, tier, calm, rank, state, n || 22, t || 60, tag || '');
  } finally { c.close(); srv.close(); }
}
async function cost() {
  const srv = await serve('dist'); const c = await launch();
  try {
    for (const tier of ['high', 'med', 'low']) {
      await open(c, 'desk', tier, 0, R5); const n = await stage(c, 350);
      const run = (art) => c.ev(`new Promise((res)=>{const sc=window.__app.scene,m=sc.meteor,o=Object.getPrototypeOf(m).update;
        let ms=0,calls=0;m.update=function(x){const t=performance.now();${art ? 'o.call(this,x)' : 'void 0'};ms+=performance.now()-t;calls++};
        let frames=0;const t0=performance.now();const f=()=>{frames++;if(performance.now()-t0>7000){delete m.update;res({art:${art},frames,frameMs:+((performance.now()-t0)/frames).toFixed(2),layerMsAvg:+(ms/Math.max(1,calls)).toFixed(4),sprites:m.sprites})}else requestAnimationFrame(f)};requestAnimationFrame(f)})`);
      const on = await run(true), off = await run(false), on2 = await run(true);
      console.log(tier, 'foes', n, JSON.stringify({ on, off, on2 }));
    }
  } finally { c.close(); srv.close(); }
}
async function atlas(out) { // the baked sprite sheet at 4x (inspection only)
  mkdirSync(out, { recursive: true });
  const srv = await serve('dist'); const c = await launch();
  try {
    await open(c, 'desk', 'high', 0, R1); await stage(c, 22); await sleep(2500);
    const d = await c.ev(`(()=>{const t=window.__app.scene.textures.get('mt_atlas').getSourceImage(),o=document.createElement('canvas');o.width=t.width*4;o.height=t.height*4;const g=o.getContext('2d');g.fillStyle='#3a4a66';g.fillRect(0,0,o.width,o.height);g.imageSmoothingEnabled=true;g.drawImage(t,0,0,o.width,o.height);return o.toDataURL('image/png')})()`);
    writeFileSync(join(out, 'atlas-4x.png'), Buffer.from(d.split(',')[1], 'base64'));
  } finally { c.close(); srv.close(); }
}
const mode = process.argv[2];
if (mode === 'atlas') { await atlas(process.argv[3] || 'docs/screenshots/meteor'); process.exit(0); }
if (mode === 'shots') await shots(process.argv[3] || 'docs/screenshots/meteor'); else if (mode === 'cost') await cost(); else console.log('usage: shots <outDir> | cost');
process.exit(0);
