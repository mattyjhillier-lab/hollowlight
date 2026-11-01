// S7 shared FX 'Light in, light out' + S8 verify harness (infra copied from scripts/s6-chain.mjs) on the REAL build (reads dist/ or DIST=<dir>).
// Own headless Chrome (debug port 9568) + own static server (4278); kills only what it opened and deletes its own temp profile.
//   node scripts/s7-fx.mjs shots    <outDir>  desk 1280x720 + 844x390@2x + 390x844@2x, night 0:30 + day 11:30, all five evolved / base, frozen ~0.1 s after the spirits respawn
//   node scripts/s7-fx.mjs coverage <outDir>  friendly coverage near the hero (0.2 screen-h circle): S7 FX alone, and every friendly visual S7 vs ?summons=0
//   node scripts/s7-fx.mjs matrix   <outDir>  S8 contrast matrix: 0:30 / 4:00 / 8:00 / 11:30 / dawn x High / Med / Low, all five evolved, 350 staged foes (WL6 disc per kind)
//   node scripts/s7-fx.mjs sheet    <outDir>  S8 cross-weapon confusion contact sheet (wolf / raven / bolt / chain / flame / XP gem at 1x, colour + greyscale, night + day)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = Number(process.env.CDP || 9568), HTTP = Number(process.env.HTTP || 4278); // CDP/HTTP: run two jobs side by side
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const QUIET = process.env.QUIET === '0' ? '' : '&sway=0&motes=0&critters=0&fog=0&push=0&dawn=0';
const fmt = (t) => `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}`;
const cleanups = [];
const cleanupAll = () => { while (cleanups.length) { try { cleanups.pop()(); } catch { /* ignore */ } } };
process.on('SIGINT', () => { cleanupAll(); process.exit(130); });

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
  return new Promise((r) => srv.listen(HTTP, '127.0.0.1', () => { cleanups.push(() => srv.close()); r(srv); }));
}
async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-s7-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  let ws = null;
  const close = () => { try { ws && ws.close(); } catch { /* ignore */ } try { proc.kill(); } catch { /* ignore */ } for (let i = 0; i < 20; i++) { try { rmSync(dir, { recursive: true, force: true }); break; } catch { /* locked: retry */ } const t = Date.now(); while (Date.now() - t < 150) { /* wait for Chrome to exit */ } } };
  cleanups.push(close);
  let up = false;
  for (let i = 0; i < 160 && !up; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) up = true; } catch { /* retry */ } if (!up) await sleep(250); }
  if (!up) { close(); cleanups.splice(cleanups.indexOf(close), 1); throw new Error('chrome did not start'); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; const to = setTimeout(() => { pending.delete(i); rej(new Error('cdp timeout: ' + method)); }, 90000); pending.set(i, { res: (v) => { clearTimeout(to); res(v); }, rej: (e) => { clearTimeout(to); rej(e); } }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  return { send, ev, close };
}
const fresh = async (c) => { if (c) { c.close(); cleanups.splice(cleanups.indexOf(c.close), 1); await sleep(2000); } for (let k = 0; k < 4; k++) { try { return await launch(); } catch (e) { console.error('launch retry', e.message); await sleep(4000); } } throw new Error('chrome did not start after retries'); };
async function open(c, query, w, h, dpr, tier) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}${process.env.PARAMS ? '&' + process.env.PARAMS : ''}` });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) { await c.ev(`window.__app.save.setSettings({quality:'${tier}',brightness:'normal'}); true`); break; } } catch { /* loading */ }
  }
}
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
const JPG = !!process.env.JPG; // shots as JPEG for docs/screenshots
const png = async (c, file, jpg = false) => { const r = await c.send('Page.captureScreenshot', jpg ? { format: 'jpeg', quality: 72 } : { format: 'png' }); if (file) writeFileSync(file, Buffer.from(r.data, 'base64')); return r.data; };
async function stage(c, t, n, ground) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;s.xp=-1e9;s.time=${t};s.bossSpawned=true;s.bossKilled=true;s.boss=null;a.scene.cameras.main.centerOn(p.x,p.y);l.decay=1e9;
    ${ground === 'restored' ? 'l.stamp(p.x,p.y,420,1);' : ''}${ground === 'corrupt' ? 'for(let k=0;k<4;k++)l.stampCorr(p.x,p.y,460,1);' : ''}return 1})()`);
  await refill(c, n);
}
const refill = (c, n) => c.ev(`(()=>{const s=window.__app.sim,p=s.player;let k=s.enemies.length*7;while(s.enemies.filter(e=>!e.dead).length<${n}){const an=(k*2.399)%6.2832,d=70+((k*37)%150);s.spawnEnemy(['wolf','crow','root_crawler'][k%3],p.x+Math.cos(an)*d*1.5,p.y+Math.sin(an)*d*0.9);k++;}s.time=Math.min(s.time,890);s.xp=-1e9;return 1})()`);

// ---- contrast (WL6 rule, same as scripts/s1-wolf.mjs METHOD=wl6) ----
const CB = {
  none: null,
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
};
const MEASURE_WL6 = `(async (b64, b64g, pts, cbm) => {
  const load = (b) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; });
  const [im, ig] = await Promise.all([load(b64), load(b64g)]);
  const mk = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); return g; };
  const g = mk(im), gg = mk(ig);
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const L = (d, i) => { let r = lin(d[i]), g2 = lin(d[i + 1]), b = lin(d[i + 2]);
    if (cbm) { const r2 = cl(cbm[0] * r + cbm[1] * g2 + cbm[2] * b), g3 = cl(cbm[3] * r + cbm[4] * g2 + cbm[5] * b), b2 = cl(cbm[6] * r + cbm[7] * g2 + cbm[8] * b); r = r2; g2 = g3; b = b2; }
    return 0.2126 * r + 0.7152 * g2 + 0.0722 * b; };
  const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const Ls = (y) => (y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y);
  const out = [];
  for (const p of pts) {
    const r = Math.max(4, Math.round(p.r * 0.55)); const x0 = Math.round(p.x - r), y0 = Math.round(p.y - r), w = 2 * r;
    const d = g.getImageData(x0, y0, w, w).data, dg = gg.getImageData(x0, y0, w, w).data;
    const body = [], grd = [];
    for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) {
      if ((xx - r) * (xx - r) + (yy - r) * (yy - r) > r * r) continue;
      const i = (yy * w + xx) * 4;
      if (Math.abs(d[i] - dg[i]) + Math.abs(d[i + 1] - dg[i + 1]) + Math.abs(d[i + 2] - dg[i + 2]) > 24) { body.push(L(d, i)); grd.push(L(dg, i)); }
    }
    if (body.length < 6) { out.push({ ...p, mask: body.length }); continue; }
    body.sort((a, b) => a - b); grd.sort((a, b) => a - b);
    const bm = body[body.length >> 1], gm = grd[grd.length >> 1];
    const bp = body[Math.floor(body.length * 0.9)]; out.push({ ...p, mask: body.length, crCore: +cr(bp, gm).toFixed(2), body: +bm.toFixed(4), ground: +gm.toFixed(4), cr: +cr(bm, gm).toFixed(2), Lbody: +Ls(bm).toFixed(1), Lground: +Ls(gm).toFixed(1) });
  }
  return JSON.stringify(out);
})`;
// covered-pixel fraction inside the circle (cx, cy, r) between two PNGs (device px); a pixel counts only when it differs from both a and a2 and a/a2 agree
const COVER = `(async (a64, b64, cx, cy, r, a264) => {
  const load = (b) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + b; });
  const [ia, ib, ia2] = await Promise.all([load(a64), load(b64), load(a264 || a64)]);
  const mk = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); return g; };
  const x0 = Math.max(0, Math.round(cx - r)), y0 = Math.max(0, Math.round(cy - r)), w = Math.min(ia.width - x0, Math.round(2 * r)), h = Math.min(ia.height - y0, Math.round(2 * r));
  const da = mk(ia).getImageData(x0, y0, w, h).data, db = mk(ib).getImageData(x0, y0, w, h).data, d2 = mk(ia2).getImageData(x0, y0, w, h).data;
  const D = (p, q, i) => Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 24;
  let n = 0, cov = 0;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const dx = x0 + xx - cx, dy = y0 + yy - cy; if (dx * dx + dy * dy > r * r) continue;
    n++; const i = (yy * w + xx) * 4;
    if (D(da, db, i) && (!a264 || (D(d2, db, i) && !D(da, d2, i)))) cov++;
  }
  return cov / n;
})`;


// ---- S7 / S8 ----
const geoJs = (dpr) => `(()=>{const sc=window.__app.scene,p=window.__app.sim.player,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();return JSON.stringify({x:(R.left+(p.x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(p.y-wv.y)/wv.height*R.height)*${dpr},r:0.2*R.height*${dpr},top:R.top*${dpr},h:R.height*${dpr},w:R.width*${dpr},left:R.left*${dpr}})})()`;
const R5 = { ghost_wolves: 'count=5,power=5,speed=5,duration=5', raven_flock: 'count=5,power=5,range=5,speed=5', spirit_bolts: 'count=5,power=5,speed=5,pierce=5', chain_lightning: 'chains=5,power=5,cooldown=5,area=5', holy_orbit: 'count=5,power=5,radius=5,speed=5' };
const EVO5 = { ghost_wolves: 'howling_legion', raven_flock: 'murder_storm', spirit_bolts: 'spirit_tempest', chain_lightning: 'thunder_judgment', holy_orbit: 'sanctum_halo' }; // the busiest look per weapon (most rims / decals)
const ALL5 = Object.keys(R5).map((id) => `${id}:${R5[id]}:${EVO5[id]}`).join(';');
const BASE5 = Object.keys(R5).map((id) => `${id}:${R5[id]}`).join(';');
const freeze = (c) => c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()');
// respawn the persistent spirits (a debug re-grant kills the old units: despawn motes; the new ones gather from the lantern)
const regrant = (c, spec) => c.ev(`(()=>{const s=window.__app.sim;for(const part of ${JSON.stringify(spec)}.split(';')){const [id,st,evo]=part.split(':');const r={};for(const kv of st.split(',')){const [k,v]=kv.split('=');r[k]=+v;}if(id==='ghost_wolves'||id==='holy_orbit'||id==='raven_flock'){for(const u of s.units)if(u.owner===id)u.dead=true;const w=s.weapons.find(w=>w.id===id);if(w){w.evo=null;w.rt={};}s.debugGrant(id,r,evo||null);}}return 1})()`);
const s7state = (c) => c.ev("(()=>{const sc=window.__app.scene,t=window.__app.sim.time;return JSON.stringify({beats:sc.beats.live(t),hits:sc.verbs.live(t),cracks:sc.crack?sc.crack.live(t):0,rims:sc.rimB.n,rimCap:sc.rimB.cap,units:window.__app.sim.units.length,proj:window.__app.sim.projectiles.length,tier:sc.quality.tier})})()");
const HIDE7 = '(()=>{const sc=window.__app.scene;for(const g of [sc.lioG,sc.verbG,sc.verbN])g.setVisible(false);return 1})()';
const SHOW7 = '(()=>{const sc=window.__app.scene;for(const g of [sc.lioG,sc.verbG,sc.verbN])g&&g.setVisible(true);return 1})()';
// every friendly visual off (units, shots, chain strikes / tethers / scorches, S7 beats), restored by SHOWALL; the sim is frozen meanwhile
const HIDEALL = "(()=>{const s=window.__app.sim,sc=window.__app.scene;window.__h={u:s.units,p:s.projectiles,fx:s.fx,dl:sc.drawLightInOut};s.units=[];s.projectiles=[];s.fx=s.fx.filter(f=>!(f.kind==='bolt'||f.kind==='judgetell'||f.kind==='judgeflash'||f.kind==='ring'));const w=s.weapons.find(w=>w.id==='chain_lightning');window.__ch=w?{t:w.rt.tethers,r:w.rt.fieldR}:null;if(w){w.rt.tethers=[];w.rt.fieldR=0;}if(sc.crack){sc.crack.__c=sc.crack.cap;sc.crack.cap=0;}sc.drawLightInOut=function(){};if(sc.lioG)for(const g of [sc.lioG,sc.verbG,sc.verbN])g.setVisible(false);return 1})()";
const SHOWALL = "(()=>{const s=window.__app.sim,sc=window.__app.scene,h=window.__h;s.units=h.u;s.projectiles=h.p;s.fx=h.fx;sc.drawLightInOut=h.dl;const w=s.weapons.find(w=>w.id==='chain_lightning');if(w&&window.__ch){w.rt.tethers=window.__ch.t;w.rt.fieldR=window.__ch.r;}if(sc.crack&&sc.crack.__c!=null)sc.crack.cap=sc.crack.__c;if(sc.lioG)for(const g of [sc.lioG,sc.verbG,sc.verbN])g.setVisible(true);return 1})()";
// the URL grant spec is capped at 300 chars (params.js, kept): the full five-weapon loadout is granted in-page, then the lazy art bakes are awaited
const grantAll = async (c, spec) => {
  await c.ev(`(()=>{const s=window.__app.sim;for(const part of ${JSON.stringify(spec)}.split(';')){const [id,st,evo]=part.split(':');const r={};for(const kv of st.split(',')){const [k,v]=kv.split('=');r[k]=+v;}s.debugGrant(id,r,evo||null);}return 1})()`);
  for (let i = 0; i < 120; i++) { await sleep(250); if (await c.ev("(()=>{const S=window.__app.scene.sumArt;return !window.__app.scene.sumAtlas||(S.pending.size===0&&S.raven&&S.bolt&&S.orbit&&S.wolf)})()")) return true; }
  return false;
};
const unfr = (c) => c.ev('(()=>{window.__app.scene.hitStop=0;return 1})()');

async function shots(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const t of (process.env.TS || '30,690').split(',').map(Number)) for (const look of (process.env.LOOKS || 'evolved,base').split(',')) for (const sm of (process.env.OLD ? ['', '&summons=0'] : [''])) {
      const [w, h, dpr] = VIEWS[view], spec = look === 'evolved' ? ALL5 : BASE5;
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=ghost_wolves${QUIET}${sm}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await grantAll(c, spec); await stage(c, t, 40, t > 300 ? 'restored' : 'hollow');
      await sleep(2200); await refill(c, 40); await autoPick(c);
      await regrant(c, spec); await sleep(60);
      for (let i = 0; i < 30; i++) { if (await c.ev("(()=>{const sc=window.__app.scene,t=window.__app.sim.time;if(sc.beats.buf.filter(b=>b.on&&b.kind===0&&t-b.t0<0.2).length>2&&sc.verbs.live(t)>=2){sc.hitStop=1e9;return true}return false})()")) break; await sleep(8); }
      await freeze(c); await sleep(250);
      const name = `s7-${view}-${t < 300 ? 'night' : 'day'}-${look}${sm ? '-old' : ''}.${JPG ? 'jpg' : 'png'}`;
      await png(c, join(out, name), JPG);
      if (view === 'desk') { const r = await c.send('Page.captureScreenshot', { format: JPG ? 'jpeg' : 'png', ...(JPG ? { quality: 80 } : {}), clip: { x: 440, y: 210, width: 400, height: 300, scale: 2 } }); writeFileSync(join(out, `s7-crop2x-${t < 300 ? 'night' : 'day'}-${look}${sm ? '-old' : ''}.${JPG ? 'jpg' : 'png'}`), Buffer.from(r.data, 'base64')); }
      if (view === 'desk') { // 4x close-ups of each verb hit (wolf claws / raven star + feather / glyph ink) at true size x4, away from the HUD
        const got = new Set();
        for (let tries = 0; tries < 400 && got.size < 3; tries++) {
          const hs = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,t=window.__app.sim.time,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect(),o=[];for(const d of sc.verbs.buf){const a=t-d.t0;if(a<0||a>=0.06||${JSON.stringify([...got])}.includes(d.v))continue;const x=R.left+(d.x-wv.x)/wv.width*R.width,y=R.top+(d.y-wv.y)/wv.height*R.height;if(y>R.height*0.25&&y<R.height*0.8&&x>R.width*0.12&&x<R.width*0.85){o.push({v:d.v,x,y});}}if(o.length)sc.hitStop=1e9;return JSON.stringify(o.slice(0,1))})()`));
          if (!hs.length) { await unfr(c); await sleep(10); continue; }
          await sleep(120);
          const hh = hs[0]; got.add(hh.v);
          const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: hh.x - 30, y: hh.y - 36, width: 60, height: 60, scale: 4 } }); writeFileSync(join(out, `s7-hit-${hh.v}-${t < 300 ? 'night' : 'day'}-${look}${sm ? '-old' : ''}.png`), Buffer.from(r.data, 'base64'));
          await unfr(c);
        }
      }
      console.log('shot', name, await s7state(c));
      if (process.env.PROBE) console.log(await c.ev(process.env.PROBE));
    }
  } finally { cleanupAll(); }
}

// gate (b): friendly coverage near the hero. s7Only = S7 graphics on vs off (same frame); total = every friendly visual on vs off, S7 build vs ?summons=0
async function coverage(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  const N = Number(process.env.N || 5), rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const sm of ['', '&summons=0']) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=240&grant=ghost_wolves${QUIET}${sm}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await grantAll(c, ALL5); await stage(c, 240, 30, 'hollow'); await sleep(2000);
      const s7 = [], tot = [];
      for (let k = 0; k < N; k++) {
        await refill(c, 30); await autoPick(c);
        if (k % 2 === 0) { await regrant(c, ALL5); await sleep(110); } // half the frames carry spawn / despawn beats
        await freeze(c); await sleep(250);
        const geo = JSON.parse(await c.ev(geoJs(dpr)));
        const a = await png(c, null); await sleep(150); const a2 = await png(c, null);
        if (!sm) { await c.ev(HIDE7); await sleep(200); const b7 = await png(c, null); await c.ev(SHOW7); s7.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(b7)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`)); }
        await c.ev(HIDEALL); await sleep(250); const b = await png(c, null); await c.ev(SHOWALL);
        tot.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`));
        await unfr(c); await sleep(600);
      }
      const pc = (v) => +(100 * v).toFixed(1), mean = (v) => (v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0);
      const row = { view, look: sm ? 'today' : 'S7', totalMean: pc(mean(tot)), totalMax: pc(Math.max(...tot)), s7Mean: sm ? null : pc(mean(s7)), s7Max: sm ? null : pc(Math.max(...s7)), n: N };
      rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'coverage.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

// S8 gate (f): contrast across the arc, all five evolved, staged crowd (350), High / Med / Low. Per kind: WL6 disc on each friendly body vs the same frame with every friendly visual hidden.
const KINDS_JS = `(()=>{const s=window.__app.sim,sc=window.__app.scene,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect(),D=DPR,o=[],p=s.player;
  const put=(k,x,y,r)=>{const X=(R.left+(x-wv.x)/wv.width*R.width)*D,Y=(R.top+(y-wv.y)/wv.height*R.height)*D;if(Y>(R.top+0.18*R.height)*D&&Y<(R.top+0.9*R.height)*D&&X>8&&X<(R.left+R.width)*D-8&&Math.hypot(x-p.x,y-p.y)>14)o.push({k,x:X,y:Y,r:r*D*R.width/wv.width});};
  const n={};for(const u of s.units){if(u.hidden)continue;const k=u.kind==='orb'?'flame':u.kind==='echo'?'wolf':u.kind;if((n[k]=(n[k]||0)+1)>8)continue;put(k,u.x,u.y-(k==='wolf'?3:k==='flame'?4:0),k==='wolf'?9:k==='flame'?6:7);}
  for(const b of s.projectiles){if((n.bolt=(n.bolt||0)+1)>8)continue;put('bolt',b.x,b.y,6);}
  for(const f of s.fx){if(f.kind!=='bolt'||!f.pts)continue;const q=f.pts;for(let i=1;i<q.length&&(n.chain=(n.chain||0)+1)<=8;i++){const x=f.pillar?q[1].x:(q[i-1].x+q[i].x)/2,y=f.pillar?q[1].y-30:(q[i-1].y+q[i].y)/2;put('chain',x,y,10);if(f.pillar)break;}}
  return JSON.stringify(o)})()`;
async function matrix(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null; const rows = [];
  const MOM = { '0:30': 30, '4:00': 240, '8:00': 480, '11:30': 690, dawn: 520 };
  try {
    for (const view of (process.env.SIZES || 'desk').split(',')) for (const mom of (process.env.MOMS || '0:30,4:00,8:00,11:30,dawn').split(',')) for (const tier of (process.env.TIERS || 'high,med,low').split(',')) {
      const [w, h, dpr] = VIEWS[view], t = MOM[mom];
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=${t}&grant=ghost_wolves${mom === 'dawn' ? '&sway=0&push=0' : QUIET}`, w, h, dpr, tier);
      await sleep(400); await grantAll(c, ALL5); await stage(c, t, Number(process.env.CROWD || 350), t > 300 ? 'restored' : 'hollow'); await sleep(2200); await refill(c, Number(process.env.CROWD || 350)); await autoPick(c);
      for (let i = 0; i < 200; i++) { if (await c.ev("window.__app.sim.fx.some(f=>f.kind==='bolt')")) break; await sleep(15); }
      await freeze(c); await sleep(300);
      const pts = JSON.parse(await c.ev(KINDS_JS.replace('DPR', String(dpr))));
      const a = await png(c, process.env.KEEP ? join(out, `m-${view}-${mom.replace(':', '')}-${tier}.png`) : null);
      await c.ev(HIDEALL); await sleep(300); const b = await png(c, null); await c.ev(SHOWALL);
      const m = JSON.parse(await c.ev(`(${MEASURE_WL6})(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${JSON.stringify(pts)}, null)`)).filter((q) => q.cr);
      const by = {};
      for (const q of m) (by[q.k] = by[q.k] || []).push(q);
      const row = { view, mom, tier, crowd: await c.ev('window.__app.sim.enemies.filter(e=>!e.dead).length'), s7: JSON.parse(await s7state(c)) };
      for (const [k, v] of Object.entries(by)) { const cr = v.map((q) => q.cr).sort((x, y) => x - y), cc = v.map((q) => q.crCore).sort((x, y) => x - y); row[k] = { n: v.length, med: cr[cr.length >> 1], min: cr[0], core: cc[cc.length >> 1], pass: cr[cr.length >> 1] >= 3 || cc[cc.length >> 1] >= 3 }; }
      rows.push(row); console.log(JSON.stringify(row));
      await unfr(c);
    }
  } finally { writeFileSync(join(out, 'matrix.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

// S8 gate (a): cross-weapon confusion contact sheet. Each friendly look + the mint XP gem cut out of a live frame at 1x, colour row + greyscale row, night + day.
async function sheet(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null; const cells = [];
  try {
    for (const t of [30, 690]) {
      const [w, h, dpr] = VIEWS.desk;
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=${t}&grant=ghost_wolves${QUIET}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await grantAll(c, BASE5); await stage(c, t, 12, t > 300 ? 'restored' : 'hollow'); await sleep(2200); await refill(c, 12); await autoPick(c);
      await c.ev("(()=>{const s=window.__app.sim,p=s.player;for(let i=0;i<3;i++)s.addGem(p.x+40+i*12,p.y+30,5);return 1})()");
      for (let i = 0; i < 600; i++) { if (await c.ev("(()=>{const s=window.__app.sim,p=s.player;const ok=s.fx.some(f=>f.kind==='bolt')&&s.projectiles.some(b=>{const d=Math.hypot(b.x-p.x,b.y-p.y);return d>20&&d<110&&b.y>p.y-60});if(ok)window.__app.scene.hitStop=1e9;return ok})()")) break; await sleep(15); }
      await freeze(c); await sleep(300);
      const pick = JSON.parse(await c.ev(`(()=>{const s=window.__app.sim,sc=window.__app.scene,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect(),p=s.player;const P=(x,y)=>[R.left+(x-wv.x)/wv.width*R.width,R.top+(y-wv.y)/wv.height*R.height];const o={};
        const ins=(u)=>{const q=P(u.x,u.y);return q[0]>30&&q[0]<R.right-30&&q[1]>R.top+0.2*R.height&&q[1]<R.bottom-30};const far=(u)=>Math.hypot(u.x-p.x,u.y-p.y)>16&&ins(u);const wolf=s.units.find(u=>u.kind==='wolf'&&far(u)),orb=s.units.find(u=>u.kind==='orb'&&!u.hidden&&far(u)),rav=s.units.find(u=>u.kind==='raven'&&far(u)),b=s.projectiles.find(far),gem=(s.gems||[]).find(far)||(s.gems||[])[0],f=s.fx.find(f=>f.kind==='bolt'&&f.pts&&f.pts.length>1);
        if(wolf)o.wolf=P(wolf.x,wolf.y-3);if(rav)o.raven=P(rav.x,rav.y);if(b)o.bolt=P(b.x,b.y);if(orb)o.flame=P(orb.x,orb.y-4);if(gem)o.gem=P(gem.x,gem.y);if(f){const q=f.pts;o.chain=P((q[0].x+q[1].x)/2,(q[0].y+q[1].y)/2);}return JSON.stringify(o)})()`));
      for (const [k, xy] of Object.entries(pick)) cells.push({ k, t, b64: (await c.send('Page.captureScreenshot', { format: 'png', clip: { x: xy[0] - 24, y: xy[1] - 24, width: 48, height: 48, scale: 1 } })).data });
    }
    // compose: rows night colour / night grey / day colour / day grey, columns wolf raven bolt chain flame gem (1x cells shown at 2x for the doc)
    const order = ['wolf', 'raven', 'bolt', 'chain', 'flame', 'gem'];
    const b64 = await c.ev(`(async (cells, order) => {
      const S = 96, cv = document.createElement('canvas'); cv.width = order.length * S + 8 * (order.length + 1); cv.height = 4 * S + 5 * 8 + 18; const g = cv.getContext('2d');
      g.fillStyle = '#20232b'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false; g.fillStyle = '#e8e8e8'; g.font = '11px sans-serif';
      order.forEach((k, i) => g.fillText(k, 8 + i * (S + 8), 12));
      for (const cell of cells) {
        const i = order.indexOf(cell.k); if (i < 0) continue;
        const im = await new Promise((r) => { const m = new Image(); m.onload = () => r(m); m.src = 'data:image/png;base64,' + cell.b64; });
        const row = cell.t < 300 ? 0 : 2, x = 8 + i * (S + 8), y = 18 + row * (S + 8);
        g.drawImage(im, x, y, S, S);
        g.filter = 'grayscale(1)'; g.drawImage(im, x, y + S + 8, S, S); g.filter = 'none';
      }
      return cv.toDataURL('image/png').split(',')[1];
    })(${JSON.stringify(cells)}, ${JSON.stringify(order)})`);
    writeFileSync(join(out, 's8-confusion-sheet.png'), Buffer.from(b64, 'base64'));
    console.log('sheet cells', cells.map((x) => x.k + '@' + x.t).join(' '));
  } finally { cleanupAll(); }
}

const [cmd, out] = process.argv.slice(2);
const fn = { shots, coverage, matrix, sheet }[cmd];
if (!fn || !out) { console.log('usage: node scripts/s7-fx.mjs shots|coverage|matrix|sheet <outDir>'); process.exit(1); }
try { await fn(out); } catch (e) { console.error(e); cleanupAll(); process.exitCode = 1; }
