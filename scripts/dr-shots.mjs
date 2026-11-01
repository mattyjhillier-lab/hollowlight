// Damage-readability capture (docs only): real build frames of hit moments + a 350-enemy crowd. Own Chrome (9531) + own static server (4251).
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9531, HTTP = 4251;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const ONLY = process.argv[3] || '';

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-dr-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  console.log('chrome pid', proc.pid);
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500); };
  return { send, ev, close };
}
async function open(c, query, w, h, dpr) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}` });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) { await c.ev("window.__app.save.setSettings({quality:'high',brightness:'normal'}); true"); return; } } catch { /* */ } }
  throw new Error('game did not start');
}
const shot = async (c, file, clip) => { const r = await c.send('Page.captureScreenshot', { format: file.endsWith('.png') ? 'png' : 'jpeg', quality: 90, ...(clip ? { clip: { ...clip, scale: clip.scale || 1 } } : {}) }); writeFileSync(file, Buffer.from(r.data, 'base64')); };
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");

// mix: [[type, count, dMin, dMax]]; restored: life-map stamp radius
async function stage(c, t, mix, restored) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xp=-1e9;if(${t}>=600){s.bossSpawned=true;s.bossKilled=true;s.boss=null;}s.time=${t};p.x=2000;p.y=2000;p.hp=p.maxHp*0.62;a.scene.cameras.main.centerOn(2000,2000);l.decay=1e9;
    if(${restored}>0){l.stamp(2000,2000,${restored},1);}
    const M=${JSON.stringify(mix)};let k=0;for(const [ty,n,d0,d1] of M){for(let i=0;i<n;i++,k++){const an=(k*2.399)%6.2832,d=d0+((k*37)%Math.max(1,d1-d0));s.spawnEnemy(ty,p.x+Math.cos(an)*d*1.6,p.y+Math.sin(an)*d*0.95);const e=s.enemies[s.enemies.length-1];e.grace=0;if(ty==='stoat_piper'||ty==='bramble_hart'){e.hp=1e6;e.maxHp=1e6;e.aiCd=0.3;}}}
    s.player.iframes=1.2;return s.enemies.length})()`);
}
// wait for a hit (src filter optional), freeze the sim after `ms`, capture
async function hitShots(c, name, want, delays, clipFn, maxWait = 9000) {
  await c.ev(`(()=>{const a=window.__app,s=a.sim;window.__hit=null;const o=window.__o0=window.__o0||s.damagePlayer.bind(s);s.damagePlayer=function(am,src){const p=s.player;if(p.iframes<=0&&!window.__hit&&(${JSON.stringify(want)}===null||src===${JSON.stringify(want)})){window.__hit={src,t:s.time,x:p.x,y:p.y,am};a.freeze=true;}
    else if(window.__hit||(${JSON.stringify(want)}!==null&&src!==${JSON.stringify(want)})){return;} return o(am,src);};return 1})()`);
  const t0 = Date.now(); let h = null;
  while (Date.now() - t0 < maxWait) { h = await c.ev("(()=>{const a=window.__app,s=a.sim;s.xp=-1e9;if(s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);if(s.player.hp<s.player.maxHp*0.4)s.player.hp=s.player.maxHp*0.62;return window.__hit})()"); if (h) break; await sleep(15); }
  if (!h) { console.log('no hit', name); return null; }
  // the sim is frozen right after the hit; render-time feedback (flash, number, HUD flash) keeps animating
  let last = 0;
  for (const ms of delays) { await sleep(Math.max(0, ms - last)); last = ms; await shot(c, join(out, `${name}-${ms}ms.png`)); if (clipFn) await shot(c, join(out, `${name}-${ms}ms-crop2x.png`), clipFn()); }
  console.log('hit', name, JSON.stringify(h));
  const ctx = await c.ev(`(()=>{const s=window.__app.sim,p=s.player,v=s.view;let over=0,n80=0,inv=0;for(const e of s.enemies){if(e.dead)continue;const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<p.r+e.r*0.85)over++;if(d<80)n80++;if(Math.abs(e.x-p.x)<v.hw&&Math.abs(e.y-p.y)<v.hh)inv++;}return {over,n80,inv,en:s.enemies.length,hp:p.hp,max:p.maxHp,view:v}})()`);
  writeFileSync(join(out, `${name}.json`), JSON.stringify({ hit: h, ctx }, null, 1));
  return h;
}
const unfreeze = (c) => c.ev('(()=>{window.__app.freeze=false;return 1})()');

const CROWD = [['wolf', 130, 60, 330], ['crow', 110, 50, 330], ['root_crawler', 50, 70, 330], ['stoat_piper', 8, 150, 200], ['puffback_toad', 10, 60, 200], ['bramble_hart', 4, 150, 220], ['wolf', 38, 330, 420]];
const MOMENTS = [
  // name, t, hero, grant, mix, restored, want, views, preWait
  ['m1-dark-0m40', 40, 'wren', 'ghost_wolves:speed=2,power=2', [['wolf', 10, 70, 180], ['crow', 6, 90, 200]], 0, 'wolf', ['desk', 'land', 'port'], 300],
  ['m2-swarm-4m00', 240, 'wren', 'ghost_wolves:speed=4,power=4;raven_flock', [['wolf', 60, 40, 260], ['crow', 40, 50, 260], ['root_crawler', 14, 60, 260], ['stoat_piper', 4, 150, 190], ['puffback_toad', 4, 60, 160]], 120, 'stoat_piper', ['desk', 'land', 'port'], 400],
  ['m3-hart-6m20', 380, 'wren', 'ghost_wolves:speed=5,power=5:phantom_stampede', [['bramble_hart', 2, 110, 130], ['wolf', 30, 60, 260], ['crow', 20, 60, 260], ['root_crawler', 10, 60, 260]], 200, 'bramble_hart', ['desk'], 400],
  ['m4-crowd-11m30', 690, 'wren', 'ghost_wolves:speed=5,power=5:phantom_stampede;raven_flock:count=3', CROWD, 330, null, ['desk', 'land', 'port'], 1500],
  ['m5-elias-11m30', 690, 'elias', 'holy_orbit:count=4,power=4', CROWD, 330, null, ['desk'], 1500],
];

const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
try {
  for (const [name, t, hero, grant, mix, restored, want, views, pre] of MOMENTS) {
    if (ONLY && !name.startsWith(ONLY)) continue;
    for (const view of views) {
      const [w, h, dpr] = VIEWS[view];
      await open(c, `auto=${hero}&seed=7&t=${t}&grant=${grant}`, w, h, dpr);
      await sleep(500); await stage(c, t, mix, restored);
      await sleep(pre);
      for (let i = 0; i < 6; i++) { await autoPick(c); await sleep(60); } await c.ev(`(()=>{const s=window.__app.sim;s.time=${t};s.xp=-1e9;return 1})()`);
      // calm 'before' frame of the crowd (no hit yet): the crowd-readability baseline
      if (name.startsWith('m4') || name.startsWith('m5')) { await shot(c, join(out, `${name}-${view}-crowd.png`)); }
      const clip = view === 'desk' ? () => ({ x: 440, y: 210, width: 400, height: 300, scale: 2 }) : null;
      await hitShots(c, `${name}-${view}-hit`, want, view === 'desk' ? [30, 120, 300] : [60], view === 'desk' ? clip : null, 20000);
      
      await unfreeze(c);
    }
  }
} finally { c.close(); srv.close(); }
