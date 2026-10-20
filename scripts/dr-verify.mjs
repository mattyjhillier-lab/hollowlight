// Damage-readability verify (DR1-DR4): stage the real build at the design moments, freeze on a real hit, capture 30/120/300 ms frames and
// compute the readability metrics. Same staging as dr-shots.mjs; metrics as dr-mock.mjs plus numbers-near-'-N'. Own Chrome 9533 + server 4253.
// Usage: DIST=dist node scripts/dr-verify.mjs <outdir> [m1|m2|m3|m4|m5] [desk,land,port]   (writes metrics-<tag>.json next to the shots)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = Number(process.env.CDP_PORT || 9533), HTTP = Number(process.env.HTTP_PORT || 4253);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const ONLY = process.argv[3] || '';
const ONLYV = (process.argv[4] || '').split(',').filter(Boolean);
const SEED = Number(process.env.SEED || 7);
const NOSHOT = process.env.NOSHOT === '1';
const metrics = [];

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-drv-'));
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
const capture = async (c) => (await c.send('Page.captureScreenshot', { format: 'png' })).data;
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");

async function stage(c, t, mix, restored) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xp=-1e9;if(${t}>=600){s.bossSpawned=true;s.bossKilled=true;s.boss=null;}s.time=${t};p.x=2000;p.y=2000;p.hp=p.maxHp*0.62;a.scene.cameras.main.centerOn(2000,2000);l.decay=1e9;
    if(${restored}>0){l.stamp(2000,2000,${restored},1);}
    const M=${JSON.stringify(mix)};let k=0;for(const [ty,n,d0,d1] of M){for(let i=0;i<n;i++,k++){const an=(k*2.399)%6.2832,d=d0+((k*37)%Math.max(1,d1-d0));s.spawnEnemy(ty,p.x+Math.cos(an)*d*1.6,p.y+Math.sin(an)*d*0.95);const e=s.enemies[s.enemies.length-1];e.grace=0;if(ty==='stoat_piper'||ty==='bramble_hart'){e.hp=1e6;e.maxHp=1e6;e.aiCd=0.3;}}}
    s.player.iframes=1.2;window.__keep&&clearInterval(window.__keep);window.__keep=setInterval(()=>{if(!window.__hit&&s.state==='running')p.hp=Math.max(p.hp,p.maxHp*0.62);},30);return s.enemies.length})()`);
}
// freeze the SIM (hitStop) on the first hit (by `want` or any); render-time cues keep running. Records attacker context at the hit.
async function waitHit(c, want, maxWait) {
  await c.ev(`(()=>{const a=window.__app,s=a.sim;window.__hit=null;const o=window.__o0=window.__o0||s.damagePlayer.bind(s);const W=${JSON.stringify(want)};
    s.damagePlayer=function(am,src,meta){const p=s.player;
      if(p.iframes>0||s.state!=='running'||window.__hit)return o(am,src,meta);
      if(W!==null&&src!==W)return;
      let n40=0,n80=0;for(const e of s.enemies){if(e.dead)continue;const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<40)n40++;if(d<80)n80++;}
      window.__hit={src,kind:meta&&meta.kind,id:meta&&meta.id,am,n40,n80,t:s.time};a.scene.hitStop=1e9;return o(am,src,meta);};return 1})()`);
  const t0 = Date.now(); let h = null;
  let forced = false;
  while (Date.now() - t0 < maxWait) {
    if (!forced && want === null && Date.now() - t0 > 7000) { forced = true; // crowds where nothing reaches her naturally: a real hit from the nearest enemy (same code path, with meta)
      await c.ev("(()=>{const s=window.__app.sim,p=s.player;let b=null,bd=1e9;for(const e of s.enemies){if(e.dead||e.boss)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){bd=d;b=e;}}if(b){p.iframes=0;s.damagePlayer(b.dmg,b.type,{kind:b.state==='charge'?(b.type==='wolf'?'lunge':'charge'):'contact',id:b.id,x:b.x,y:b.y});}return 1})()"); }
    h = await c.ev("(()=>{const a=window.__app,s=a.sim;s.xp=-1e9;if(s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);if(s.player.hp<s.player.maxHp*0.4)s.player.hp=s.player.maxHp*0.62;return window.__hit})()"); if (h) break; await sleep(15); }
  return h;
}
const METRIC = (b64, cx, cy, R) => `(async()=>{const i=new Image();await new Promise(r=>{i.onload=r;i.src='data:image/png;base64,${b64}';});const W=i.width,H=i.height;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(i,0,0);const d=g.getImageData(0,0,W,H).data;
  let red=0,lr=0,n=0;const R2=${R}*${R};for(let y=Math.max(0,${cy}-${R});y<Math.min(H,${cy}+${R});y++)for(let x=Math.max(0,${cx}-${R});x<Math.min(W,${cx}+${R});x++){const dx=x-${cx},dy=y-${cy};if(dx*dx+dy*dy>R2)continue;const k=(y*W+x)*4,r=d[k],gg=d[k+1],b=d[k+2];n++;if(r>170&&gg<120&&b<110&&r-gg>80)red++;if(r>225&&gg>105&&gg<150&&b>100&&b<145&&r-gg>85)lr++;}
  return {redPct:+(100*red/n).toFixed(2),lightRedPx:lr};})()`;
// occluders: enemy sprites drawn above the hero body, overlapping her box, opaque (alpha > 0.6), south of her; tells live; numbers near the damage-taken number
const OCC = `(()=>{const S=window.__app.scene,s=window.__app.sim,p=s.player;const hb=S.heroOut.getBounds();let occ=0,tells=0;const hd=((S.rig&&S.rig.depth)||60000)+p.y;for(const e of s.enemies){if(e.dead)continue;if(e.tele)tells++;const pl=S.pools[e.type];const r=pl&&pl.map.get(e.id);if(!r||!r.img.visible)continue;const b=r.img.getBounds();if(b.right>hb.left&&b.left<hb.right&&b.bottom>hb.top&&b.top<hb.bottom){if(r.img.depth>hd&&r.img.alpha>0.6&&e.y>p.y)occ++;}}
  const N=S.nums.pool.slots;let hx=null;for(const q of N){if(q.on&&q.kind===3)hx=q;}let near=0;if(hx)for(const q of N){if(q.on&&q.kind!==3&&Math.abs(q.x-hx.x)<40&&Math.abs(q.y-hx.y)<30)near++;}
  return {occluders:occ,tellsLive:tells,hurtNum:!!hx,numsNearHurt:near,heroHitA:+(S.heroHit?S.heroHit.alpha:0).toFixed(2),hfT:S.hitFx?+S.hitFx.t.toFixed(2):null,hfN:S.hitFx?S.hitFx.count:null}})()`;

const CROWD = [['wolf', 130, 60, 330], ['crow', 110, 50, 330], ['root_crawler', 50, 70, 330], ['stoat_piper', 8, 150, 200], ['puffback_toad', 10, 60, 200], ['bramble_hart', 4, 150, 220], ['wolf', 38, 330, 420]];
const MOMENTS = [
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
      if (ONLYV.length && !ONLYV.includes(view)) continue;
      const [w, h, dpr] = VIEWS[view];
      await open(c, `auto=${hero}&seed=${SEED}&t=${t}&grant=${grant}`, w, h, dpr);
      await sleep(500); await stage(c, t, mix, restored); await sleep(pre);
      for (let i = 0; i < 6; i++) { await autoPick(c); await sleep(60); }
      await c.ev(`(()=>{const s=window.__app.sim;s.time=${t};s.xp=-1e9;return 1})()`);
      const R = Math.round(Math.min(w, h) * dpr * 0.2), cx = Math.round(w * dpr / 2), cy = Math.round(h * dpr / 2);
      const rec = async (tag) => { const b64 = await capture(c); const o = await c.ev(OCC); if (!NOSHOT) writeFileSync(join(out, `${name}-${view}-${tag}.png`), Buffer.from(b64, 'base64')); const m = await c.ev(METRIC(b64, cx, cy, R)); const r = { name, view, tag, ...m, ...o }; metrics.push(r); console.log(JSON.stringify(r)); };
      if (name.startsWith('m4') || name.startsWith('m5')) await rec('crowd');
      const hit = await waitHit(c, want, 20000);
      if (!hit) { console.log('no hit', name, view); await c.ev('(()=>{window.__app.scene.hitStop=0;return 1})()'); continue; }
      metrics.push({ name, view, tag: 'hit', ...hit }); console.log(JSON.stringify({ name, view, hit }));
      // pin the render-time cues (hit state, numbers, rig hurt timer) to exact ages so a slow machine still captures 30 / 120 / 300 ms after the hit
      await c.ev("(()=>{const S=window.__app.scene;if(S.hitFx)S.hitFx.update=function(){};const o=S.nums.update.bind(S.nums);S.nums.update=function(){o(0);};for(const q of S.nums.pool.slots)if(q.on&&q.age>0.45){q.on=false;q.dirty=false;}return 1})()"); // numbers older than 0.45 s at the hit would already be gone: drop them so the 'near the -N' count is only what really sits beside it
      for (const ms of (view === 'desk' ? [30, 120, 300] : [60, 200])) {
        await c.ev(`(()=>{const S=window.__app.scene,t=${ms}/1000;if(S.hitFx)S.hitFx.t=t;if(S.rig)S.rig.hurtT=t;for(const q of S.nums.pool.slots)if(q.on)q.age=t;return 1})()`);
        await sleep(150);
        await rec(`hit-${ms}ms`);
      }
      await c.ev('(()=>{window.__app.scene.hitStop=0;window.__app.sim.damagePlayer=window.__o0;return 1})()');
    }
  }
} finally { writeFileSync(join(out, `metrics-${ONLY || 'all'}.json`), JSON.stringify(metrics, null, 1)); c.close(); srv.close(); }
