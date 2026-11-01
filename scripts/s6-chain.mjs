// S6 Chain Lightning 'Storm Thread' verify harness (infra copied from scripts/s5-bolt.mjs) on the REAL build (reads dist/ or DIST=<dir>; npm run build first).
// Own headless Chrome (debug port 9567) + own static server (4277); kills only what it opened and deletes its own temp profile. PARAMS=x=1 extra URL flags.
//   node scripts/s6-chain.mjs shots    <outDir>  desk 1280x720 + 844x390@2x + 390x844@2x, night (0:30) + day (11:30), base / Judgment / Static / Tether (EVOS), frozen on a strike
//   node scripts/s6-chain.mjs hud      <outDir>  Thunder Judgment: strikes and chain pixels above the HUD band (top 16% of the canvas) on frozen strike frames (40 foes)
//   node scripts/s6-chain.mjs coverage <outDir>  friendly coverage near the hero (circle 0.2 x screen height): chain visuals on vs hidden, new vs ?summons=0, per evolution
//   node scripts/s6-chain.mjs contrast <outDir>  WL6 rule: arc pixels vs the same frame with the chain hidden (disc on each arc / pillar), High/Low, night/day
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = Number(process.env.CDP || 9567), HTTP = Number(process.env.HTTP || 4277); // CDP/HTTP: run two jobs side by side
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const EVO = { base: '', judgment: ':thunder_judgment', static: ':static_storm', tether: ':storm_tether' };
const QUIET = process.env.QUIET === '0' ? '' : '&sway=0&motes=0&critters=0&fog=0&push=0&dawn=0';
const grant = (evo) => `chain_lightning:chains=5,power=5,cooldown=5,area=5${EVO[evo]}`;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-s6-'));
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

// poll until a chain strike of the wanted kind is in sim.fx, then freeze the sim in the same evaluate (fx kept on screen)
const FXK = { base: "f.kind==='bolt'&&!f.pillar&&!f.field", judgment: "f.kind==='bolt'&&f.pillar", static: "f.kind==='bolt'&&f.field", tether: 'true' };
async function freezeOn(c, evo) {
  const body = evo === 'tether' ? "if(w&&w.rt.tethers&&w.rt.tethers.length){sc.hitStop=1e9;return true}return false" : `if(s.fx.some(f=>${FXK[evo]})){sc.hitStop=1e9;return true}return false`;
  for (let i = 0; i < 400; i++) {
    if (await c.ev(`(()=>{const a=window.__app,s=a.sim,sc=a.scene;const w=s.weapons.find(w=>w.id==='chain_lightning');${body}})()`)) return true;
    await sleep(15);
  }
  return false;
}
const unfreeze = (c) => c.ev('(()=>{window.__app.scene.hitStop=0;return 1})()');
const geoJs = (dpr) => `(()=>{const sc=window.__app.scene,p=window.__app.sim.player,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();return JSON.stringify({x:(R.left+(p.x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(p.y-wv.y)/wv.height*R.height)*${dpr},r:0.2*R.height*${dpr},top:R.top*${dpr},h:R.height*${dpr},w:R.width*${dpr},left:R.left*${dpr}})})()`;
// hide every chain visual (fx strikes, tethers, the Static field ring, crack-star scorches) and restore it
const HIDE = "(()=>{const s=window.__app.sim,sc=window.__app.scene;window.__fx=s.fx;s.fx=s.fx.filter(f=>!(f.kind==='bolt'||f.kind==='judgetell'||f.kind==='judgeflash'));const w=s.weapons.find(w=>w.id==='chain_lightning');window.__ch=w?{t:w.rt.tethers,r:w.rt.fieldR}:null;if(w){w.rt.tethers=[];w.rt.fieldR=0;}if(sc.crack){sc.crack.__c=sc.crack.cap;sc.crack.cap=0;}return 1})()";
// hud gate: hide only the strikes (pillars) + scorches; the sky-darkening tell and its radius ring (W11b, not pillar art) stay in both frames
const HIDE_B = HIDE.replace("||f.kind==='judgetell'||f.kind==='judgeflash'", '');
const SHOW = "(()=>{const s=window.__app.sim,sc=window.__app.scene;s.fx=window.__fx;const w=s.weapons.find(w=>w.id==='chain_lightning');if(w&&window.__ch){w.rt.tethers=window.__ch.t;w.rt.fieldR=window.__ch.r;}if(sc.crack&&sc.crack.__c!=null)sc.crack.cap=sc.crack.__c;return 1})()";

async function shots(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = await fresh(null);
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const t of (process.env.TS || '30,690').split(',').map(Number)) for (const evo of (process.env.EVOS || 'base,judgment,static,tether').split(',')) for (const sm of (process.env.OLD ? ['', '&summons=0'] : [''])) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${grant(evo)}${sm}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await stage(c, t, 30, t > 300 ? 'restored' : 'hollow');
      await sleep(2000); await refill(c, 30); await autoPick(c); await sleep(Number(process.env.WAIT || 300));
      const ok = await freezeOn(c, evo); await sleep(200);
      const ext = JPG ? 'jpg' : 'png', name = `s6-${view}-${t < 300 ? 'night' : 'day'}-${evo}${sm ? '-old' : ''}.${ext}`;
      await png(c, join(out, name), JPG);
      if (view === 'desk') { const r = await c.send('Page.captureScreenshot', { format: JPG ? 'jpeg' : 'png', ...(JPG ? { quality: 80 } : {}), clip: { x: 390, y: 160, width: 500, height: 400, scale: 2 } }); writeFileSync(join(out, `s6-crop2x-${t < 300 ? 'night' : 'day'}-${evo}${sm ? '-old' : ''}.${ext}`), Buffer.from(r.data, 'base64')); }
      console.log('shot', name, 'frozenOnStrike', ok, await c.ev("JSON.stringify({evo:(window.__app.sim.weapons.find(w=>w.id==='chain_lightning')||{}).evo,fx:window.__app.sim.fx.filter(f=>f.kind==='bolt').length,decals:window.__app.scene.crack?window.__app.scene.crack.live(window.__app.sim.time):-1})"));
    }
  } finally { cleanupAll(); }
}

// chain pixels above the HUD band: diff of the frozen strike frame vs the same frame with the chain hidden, rows above top + 16% of the canvas
const ABOVE = `(async (a64, b64, y0, x0, w, c64) => {
  const load = (b) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + b; });
  const [ia, ib, ic] = await Promise.all([load(a64), load(b64), load(c64)]);
  const mk = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); return g; };
  const H = Math.max(1, Math.round(y0)), da = mk(ia).getImageData(Math.round(x0), 0, Math.round(w), H).data, db = mk(ib).getImageData(Math.round(x0), 0, Math.round(w), H).data, dc = mk(ic).getImageData(Math.round(x0), 0, Math.round(w), H).data;
  const D = (p, q, i) => Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 24;
  let n = 0; for (let i = 0; i < da.length; i += 4) if (D(da, db, i) && D(dc, db, i) && !D(da, dc, i)) n++; // a pixel counts only when steady across two frozen frames (numbers float in real time)
  return n;
})`;
async function hud(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null; const rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const sm of ['', '&summons=0']) for (let k = 0; k < Number(process.env.N || 4); k++) {
      const [w, h, dpr] = VIEWS[view];
      if (k === 0) { c = await fresh(c); await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=240&grant=${grant('judgment')}${QUIET}${sm}`, w, h, dpr, process.env.TIER || 'high'); await sleep(400); await stage(c, 240, 40, 'hollow'); await sleep(1500); }
      await refill(c, 40); await autoPick(c);
      const ok = await freezeOn(c, 'judgment'); await sleep(250);
      const geo = JSON.parse(await c.ev(geoJs(dpr)));
      const a = await png(c, k === 0 && process.env.KEEP ? join(out, `hud-${view}${sm ? '-old' : ''}.png`) : null);
      if (process.env.KEEP && k === 0) await c.ev('1');
      const strikes = await c.ev("window.__app.sim.fx.filter(f=>f.kind==='bolt'&&f.pillar).length"); await sleep(250); const a2 = await png(c, null);
      await c.ev(HIDE_B); await sleep(250); const b = await png(c, null); await c.ev(SHOW);
      const above = await c.ev(`(${ABOVE})(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${geo.top + 0.16 * geo.h}, ${geo.left}, ${geo.w}, ${JSON.stringify(a2)})`);
      await unfreeze(c); await sleep(900);
      const row = { view, look: sm ? 'today' : 'S6', strikes, frozen: ok, pxAboveHudBand: above }; rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'hud.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

async function coverage(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  const N = Number(process.env.N || 6), rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const evo of (process.env.EVOS || 'base,judgment,static,tether').split(',')) for (const sm of ['', '&summons=0']) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=240&grant=${grant(evo)}${QUIET}${sm}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await stage(c, 240, 30, 'hollow'); await sleep(2000);
      const all = [];
      for (let k = 0; k < N; k++) {
        await refill(c, 30); await autoPick(c);
        await freezeOn(c, evo); await sleep(250);
        const geo = JSON.parse(await c.ev(geoJs(dpr)));
        const a = await png(c, k === 0 && process.env.KEEP ? join(out, `cov-${view}-${evo}${sm ? '-old' : ''}-a.png`) : null);
        await sleep(200); const a2 = await png(c, null);
        await c.ev(HIDE); await sleep(250);
        const cc = await png(c, null); await c.ev(SHOW); await unfreeze(c);
        all.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(cc)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`));
        await sleep(500);
      }
      const pc = (v) => +(100 * v).toFixed(1), mean = (v) => v.reduce((x, y) => x + y, 0) / v.length;
      const row = { view, evo, look: sm ? 'today' : 'S6', allMean: pc(mean(all)), allMax: pc(Math.max(...all)), n: N };
      rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'coverage.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

async function contrast(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null; const rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land').split(',')) for (const t of (process.env.TS || '30,240,690').split(',').map(Number)) for (const tier of (process.env.TIERS || 'high,low').split(',')) for (const evo of (process.env.EVOS || 'base,judgment').split(',')) for (const sm of ['', '&summons=0']) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=${t}&grant=${grant(evo)}${QUIET}${sm}`, w, h, dpr, tier);
      await sleep(400); await stage(c, t, 30, t > 300 ? 'restored' : 'hollow'); await sleep(1800); await refill(c, 30); await autoPick(c);
      await freezeOn(c, evo); await sleep(250);
      const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect(),o=[];for(const f of window.__app.sim.fx){if(f.kind!=='bolt')continue;const q=f.pts;for(let i=1;i<q.length;i++){const x=f.pillar?q[1].x:(q[i-1].x+q[i].x)/2,y=f.pillar?q[1].y-30:(q[i-1].y+q[i].y)/2;const X=(R.left+(x-wv.x)/wv.width*R.width)*${dpr},Y=(R.top+(y-wv.y)/wv.height*R.height)*${dpr};if(Y>(R.top+0.18*R.height)*${dpr}&&Y<(R.top+0.8*R.height)*${dpr}&&X>8&&X<(R.left+R.width)*${dpr}-8)o.push({x:X,y:Y,r:22*${dpr}});if(f.pillar)break;}}return JSON.stringify(o.slice(0,12))})()`));
      const a = await png(c, null); await c.ev(HIDE); await sleep(250); const b = await png(c, null); await c.ev(SHOW);
      const m = JSON.parse(await c.ev(`(${MEASURE_WL6})(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${JSON.stringify(pts)}, null)`)).filter((q) => q.cr);
      const crs = m.map((q) => q.cr).sort((x, y) => x - y), cc = m.map((q) => q.crCore).sort((x, y) => x - y);
      const row = { view, t, tier, evo, look: sm ? 'today' : 'S6', n: crs.length, coreMed: cc.length ? cc[cc.length >> 1] : null, coreMin: cc.length ? cc[0] : null, medCR: crs.length ? crs[crs.length >> 1] : null, minCR: crs.length ? crs[0] : null }; rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'contrast.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

const [cmd, out] = process.argv.slice(2);
const fn = { shots, hud, coverage, contrast }[cmd];
if (!fn || !out) { console.log('usage: node scripts/s6-chain.mjs shots|hud|coverage|contrast <outDir>'); process.exit(1); }
try { await fn(out); } catch (e) { console.error(e); cleanupAll(); process.exitCode = 1; }
