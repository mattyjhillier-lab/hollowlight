// Lucinda + Ophimber art screenshots on the REAL build (dist/; run `npm run build` first). Own Chrome (port 9494) + own static server (4294); closes only what it opened.
//   node scripts/lucinda-shots.mjs shots <outDir> [nameFilter]   walk / still (perched) / hurt / Rise cast: desk (1280x720 = true 640x360 x2) + phone (390x844 @2x), High / Med / Low + Calm.
// Lucinda is hidden (characters.json unreleased) and the app cannot start her, so the shots run as Wren, then swap the run's hero to hearthwarden and rebind the rig.
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

const prep = (c) => c.ev(`(()=>{const a=window.__app,s=a.sim,sc=a.scene;s.chapter={...s.chapter,waves:[],events:[]};s.spawnAcc=[];s.enemies.length=0;s.xpNeeded=1e9;
  s.characterId='hearthwarden';s.character=a.data.hiddenCharacters.hearthwarden;s.ability.id='ophimbers_rise';s.ability.cdLeft=0;s.player.hp=s.player.maxHp;
  sc.bindSim(s);return sc.rig.id+':'+sc.rig.active})()`);
const walk = (c, on, dir = 1) => c.ev(`(()=>{window.__mvOn=${on ? 1 : 0};window.__mvDir=${dir};if(!window.__mvLoop){window.__mvLoop=1;let t0=performance.now();const f=()=>{const n=performance.now(),d=Math.min(0.05,(n-t0)/1000);t0=n;if(window.__mvOn){const p=window.__app.sim.player;p.faceX=window.__mvDir;p.x+=window.__mvDir*78*d}requestAnimationFrame(f)};f()}return 1})()`);
const cast = (c) => c.ev('window.__app.sim.useAbility()');
const freezeWhen = (c, expr, ms = 25000) => c.ev(`new Promise((res)=>{const t0=performance.now();const f=()=>{let ok=false;try{ok=!!(${expr})}catch(e){}if(ok){window.__app.scene.game.loop.sleep();res(true)}else if(performance.now()-t0>${ms})res(false);else requestAnimationFrame(f)};f()})`);
const wake = (c) => c.ev('window.__app.scene.game.loop.wake(); true');
const shot = async (c, file, clip) => { const r = await c.send('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: clip.scale || 3 } } : { format: 'png' }); writeFileSync(file, Buffer.from(r.data, 'base64')); };
const around = (c, dx, dy, w, h) => c.ev(`(()=>{const sc=window.__app.scene,cv=sc.game.canvas,r=cv.getBoundingClientRect(),wv=sc.cameras.main.worldView,k=r.width/wv.width,p=window.__app.sim.player;return {x:Math.max(0,r.left+(p.x+${dx}-wv.x)*k-${w}/2),y:Math.max(0,r.top+(p.y+${dy}-wv.y)*k-${h}/2),width:${w},height:${h}}})()`);
const RT = (lo, hi) => `(()=>{const R=window.__app.sim.rise;return R&&R.t>=${lo}&&R.t<${hi}})()`;
const ONLY = process.argv[4] ? new RegExp(process.argv[4]) : null;
const sleepMs = (c, ms) => c.ev(`new Promise((r)=>setTimeout(r,${ms}))`);
async function one(c, out, view, tier, calm, state, t = 60) {
  const name = `${view}-${tier}${calm ? '-calm' : ''}-${state}`;
  if (ONLY && !ONLY.test(name)) return;
  await open(c, view, tier, calm, 'ghost_wolves', t);
  const rig = await prep(c);
  if (rig !== 'hearthwarden:true') { console.log(name, 'RIG NOT ACTIVE', rig); return; }
  let ok = true;
  if (state === 'walk') { await walk(c, true, 1); await sleepMs(c, 1600); ok = await freezeWhen(c, 'true'); }
  else if (state === 'walkL') { await walk(c, true, -1); await sleepMs(c, 1600); ok = await freezeWhen(c, 'true'); }
  else if (state === 'still') { await sleepMs(c, 1800); ok = await freezeWhen(c, 'true'); }
  else if (state === 'hurt') { await sleepMs(c, 400); await c.ev('(()=>{const s=window.__app.sim;s.godMode=false;s.player.hp-=8;return 1})()'); ok = await freezeWhen(c, 'window.__app.scene.rig.hurtT>0.06 && window.__app.scene.rig.hurtT<0.2', 4000); }
  else { await sleepMs(c, 600); await cast(c); ok = await freezeWhen(c, state === 'rise' ? RT(0.32, 0.4) : state === 'rise2' ? RT(1.15, 1.25) : RT(2.5, 2.6)); }
  if (!ok) { console.log(name, 'STATE NOT REACHED'); await wake(c); return; }
  await shot(c, join(out, name + '.png'));
  const isD = view === 'desk';
  const clip = await around(c, -12, -2, isD ? 300 : 200, isD ? 180 : 160); clip.scale = isD ? 3 : 3; await shot(c, join(out, name + '-zoom.png'), clip);
  console.log(name, JSON.stringify(await c.ev('({rig:window.__app.scene.rig.id,pet:window.__app.scene.rig.petOn,sprites:window.__app.scene.rise.sprites})')));
  await wake(c);
}
async function shots(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve('dist'); const c = await launch();
  try {
    for (const [view, tier, calm, state] of [
      ['desk', 'high', 0, 'walk'], ['desk', 'high', 0, 'walkL'], ['desk', 'high', 0, 'still'], ['desk', 'high', 0, 'hurt'], ['desk', 'high', 0, 'rise'], ['desk', 'high', 0, 'rise2'], ['desk', 'high', 0, 'full'],
      ['desk', 'med', 0, 'walk'], ['desk', 'med', 0, 'still'], ['desk', 'med', 0, 'rise'],
      ['desk', 'low', 0, 'walk'], ['desk', 'low', 0, 'still'], ['desk', 'low', 0, 'rise'],
      ['desk', 'high', 1, 'walk'], ['desk', 'high', 1, 'still'], ['desk', 'high', 1, 'rise'],
      ['phone', 'high', 0, 'walk'], ['phone', 'high', 0, 'still'], ['phone', 'high', 0, 'rise'], ['phone', 'med', 0, 'still'], ['phone', 'low', 0, 'still'], ['phone', 'high', 1, 'still'],
    ]) await one(c, out, view, tier, calm, state);
  } finally { c.close(); srv.close(); }
}
async function atlas(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve('dist'); const c = await launch();
  try {
    await open(c, 'desk', 'high', 0, 'ghost_wolves', 60);
    for (const k of ['lucinda_rig', 'ophimber_pet', 'hero_hearthwarden']) { const d = await c.ev(`(()=>{const t=window.__app.scene.textures.get('${k}');const s=t.getSourceImage();const b=document.createElement('canvas');b.width=s.width;b.height=s.height;const x=b.getContext('2d');x.fillStyle='#4a6a8a';x.fillRect(0,0,b.width,b.height);x.drawImage(s,0,0);return b.toDataURL('image/png')})()`); writeFileSync(join(out, 'atlas-' + k + '.png'), Buffer.from(d.split(',')[1], 'base64')); console.log(k); }
  } finally { c.close(); srv.close(); }
}
const mode = process.argv[2];
if (mode === 'shots') await shots(process.argv[3] || 'docs/screenshots/lucinda-art'); else if (mode === 'atlas') await atlas(process.argv[3] || 'docs/screenshots/lucinda-art'); else console.log('usage: shots <outDir> [nameFilter]');
process.exit(0);
