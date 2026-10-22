// S4 Candle Flames verify harness on the REAL build (reads dist/ or DIST=<dir>; npm run build first). Own headless Chrome (debug port 9571) + own
// static server (4281); kills only what it opened and deletes its own temp profile (also on Ctrl+C / errors). PARAMS=x=1 extra URL flags. HERO (elias).
//   node scripts/s4-orbit.mjs shots    <outDir>  desk 1280x720 + 844x390@2x + 390x844@2x, night (0:30) + day (11:30), base / Halo / Wheel / Tide (EVOS); OLD=1 adds ?summons=0
//   node scripts/s4-orbit.mjs contrast <outDir>  WL6 rule (as scripts/s3-raven.mjs): each light vs the same ground with the weapon off, + protan/deutan/tritan
//   node scripts/s4-orbit.mjs coverage <outDir>  friendly coverage near the hero (circle 0.2 x screen height), whole orbit weapon, new vs ?summons=0, per evolution
//   node scripts/s4-orbit.mjs atlas|bake|calm|licks <outDir>  atlas page / lazy bake ms / Calm-motion change rates / Burn licks vs flames crop
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = Number(process.env.CDP || 9571), HTTP = Number(process.env.HTTP || 4281); // CDP/HTTP: run two jobs side by side
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const EVO = { base: '', halo: ':sanctum_halo', wheel: ':judgement_wheel', tide: ':vesper_tide' };
const QUIET = process.env.QUIET === '0' ? '' : '&sway=0&motes=0&critters=0&fog=0&push=0&dawn=0';
const grant = (evo) => `holy_orbit:count=5,speed=5,power=5,radius=5${EVO[evo]}`;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-s4-'));
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
// wait for the lazy flame bake (plain + gold when evolved); ?summons=0 returns at once
const orbBaked = async (c) => { for (let i = 0; i < 80; i++) { if (await c.ev("(()=>{const S=window.__app.scene,a=S.sumArt;if(!S.sumAtlas)return true;const w=window.__app.sim.weapons.find(w=>w.id==='holy_orbit');return !!(a&&a.orbit&&(!w||!w.evo||a.kinds.has('fflatg')))||!!(a&&a.error)})()")) return; await sleep(100); } };
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
    out.push({ ...p, mask: body.length, body: +bm.toFixed(4), ground: +gm.toFixed(4), cr: +cr(bm, gm).toFixed(2), Lbody: +Ls(bm).toFixed(1), Lground: +Ls(gm).toFixed(1) });
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

const HERO = process.env.HERO || 'elias';
const q = (t, evo, sm = '') => `style=a&auto=${HERO}&seed=3&god=1&debug=0&t=${t}&grant=${grant(evo)}${sm}`;
// weapon off for a comparison frame (hitStop holds the sim): lights moved out of view, ribbons cleared, the weapon taken out of the list (ground ring / disc / tide)
const OFF = '(()=>{const S=window.__app.scene,s=window.__app.sim;for(const u of s.units)if(u.kind==="orb"){u.x+=9000;const sl=S.ribSet&&S.ribSet.byId.get(u.id);if(sl)sl.rib.reset();}const i=s.weapons.findIndex(w=>w.id==="holy_orbit");window.__ow=s.weapons.splice(i,1)[0];window.__owi=i;S.orbFlowers=null;return 1})()';
const ON = '(()=>{const s=window.__app.sim;for(const u of s.units)if(u.kind==="orb")u.x-=9000;if(window.__ow){s.weapons.splice(window.__owi,0,window.__ow);window.__ow=null;}return 1})()';
const med = (a2) => { const s2 = [...a2].sort((x, y) => x - y); return s2[s2.length >> 1]; };

async function shots(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = await fresh(null);
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const t of (process.env.TS || '30,690').split(',').map(Number)) for (const evo of (process.env.EVOS || 'base,halo,wheel,tide').split(',')) for (const sm of (process.env.OLD ? ['', '&summons=0'] : [''])) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, q(t, evo, sm), w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await stage(c, t, 26, t > 300 ? 'restored' : 'hollow'); await orbBaked(c);
      await sleep(2400); await refill(c, 22); await autoPick(c);
      // hold the crowd at bay (no guard contraction) unless HOLD=0, so the ring shows open; the Wheel lights still burst on the foes they reach
      if (process.env.HOLD !== '0') await c.ev('(()=>{const s=window.__app.sim,p=s.player;for(const e of s.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y)||1;const R=' + (evo === 'wheel' ? 58 : 96) + ';if(d<R){e.x=p.x+(e.x-p.x)/d*(R+4+(e.id%5)*6);e.y=p.y+(e.y-p.y)/d*(R+4+(e.id%5)*6);}e.speed=0;}return 1})()');
      await sleep(Number(process.env.WAIT || 900));
      if (evo === 'wheel' && !sm) { for (let i = 0; i < 60; i++) { if (await c.ev('!!(window.__app.scene.orbFlowers&&window.__app.scene.orbFlowers.some(f=>window.__app.sim.time-f.t0>0.06&&window.__app.sim.time-f.t0<0.16))')) break; await sleep(15); } }
      if (evo === 'tide' && !sm) { await c.ev('(()=>{for(const e of window.__app.sim.enemies){const p=window.__app.sim.player;if(Math.hypot(e.x-p.x,e.y-p.y)<90)e.x+=200;}return 1})()'); for (let i = 0; i < 200; i++) { if (await c.ev('(()=>{const w=window.__app.sim.weapons.find(w=>w.id==="holy_orbit");return !!(w.rt.tide&&w.rt.tide.out&&w.rt.tide.r>60)})()')) break; await sleep(20); } }
      await c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()'); await sleep(200);
      const ext = JPG ? 'jpg' : 'png', name = `s4-${view}-${t < 300 ? 'night' : 'day'}-${evo}${sm ? '-old' : ''}.${ext}`;
      await png(c, join(out, name), JPG);
      if (view === 'desk') { const r = await c.send('Page.captureScreenshot', { format: JPG ? 'jpeg' : 'png', ...(JPG ? { quality: 80 } : {}), clip: { x: 440, y: 200, width: 400, height: 320, scale: 2 } }); writeFileSync(join(out, `s4-crop2x-${t < 300 ? 'night' : 'day'}-${evo}${sm ? '-old' : ''}.${ext}`), Buffer.from(r.data, 'base64')); }
      console.log('shot', name, await c.ev('JSON.stringify({orbit:window.__app.scene.sumArt&&window.__app.scene.sumArt.orbit,kinds:window.__app.scene.sumArt?[...window.__app.scene.sumArt.kinds].join():"",evo:(window.__app.sim.weapons.find(w=>w.id==="holy_orbit")||{}).evo,frames:[...window.__app.scene.pools.uOrbA.map.values()].filter(r=>r.img.visible).map(r=>r.img.frame.name).join(","),flowers:(window.__app.scene.orbFlowers||[]).length})'));
    }
  } finally { cleanupAll(); }
}

// contrast: every visible light (held still by hitStop) vs the same ground with the weapon off (WL6 rule: median body vs median ground)
async function contrast(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  const rows = [];
  const sizes = (process.env.SIZES || 'desk,land').split(','), ts = (process.env.TS || '30,240,690').split(',').map(Number);
  const tiers = (process.env.TIERS || 'high,low').split(','), grounds = (process.env.GROUNDS || 'hollow,restored,corrupt').split(','), evos = (process.env.EVOS || 'base,halo,wheel,tide').split(',');
  try {
    for (const evo of evos) for (const view of sizes) for (const t of ts) for (const tier of tiers) for (const ground of grounds) {
      const [w, h, dpr] = VIEWS[view];
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          c = await fresh(c);
          await open(c, q(t, evo) + QUIET, w, h, dpr, tier);
          await sleep(400); await stage(c, t, 0, ground); await orbBaked(c); await sleep(1200);
          await c.ev(`(()=>{const a=window.__app,s=a.sim;s.enemies.length=0;s.time=${t};a.scene.hitStop=1e9;return 1})()`); await sleep(300);
          const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect(),k=R.width/wv.width*${dpr};
            const P=(x,y,r)=>({kind:'spirit',x:(R.left+(x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(y-wv.y)/wv.height*R.height)*${dpr},r:r*k});
            const in1=(q)=>q.x>8&&q.y>0.16*R.height*${dpr}&&q.x<R.width*${dpr}-8&&q.y<0.8*R.height*${dpr}; /* not under the DOM HUD bands (timer / boss bar on top, slots + ability at the bottom) */
            const ev=s.weapons.find(w=>w.id==='holy_orbit').evo,K=ev==='judgement_wheel'?1.45:ev==='sanctum_halo'?0.8:1;
            return JSON.stringify(s.units.filter(u=>u.kind==='orb'&&!u.hidden).map(u=>P(u.x,u.y-1,7*K)).filter(in1))})()`));
          const a = await png(c, process.env.KEEP ? join(out, `c-${evo}-${view}-${fmt(t)}-${tier}-${ground}.png`) : null);
          await c.ev(OFF); await sleep(250);
          const b = await png(c, null);
          await c.ev(ON);
          const res = {};
          for (const cb of Object.keys(CB)) res[cb] = JSON.parse(await c.ev(`(${MEASURE_WL6})(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${JSON.stringify(pts)}, ${JSON.stringify(CB[cb])})`));
          const sp = (cb) => res[cb].filter((p) => p.mask >= 6);
          if (sp('none').length < 2) throw new Error('lights not rendered');
          const row = { evo, view, t, tier, ground, lights: sp('none').length, minCR: Math.min(...sp('none').map((p) => p.cr)), medCR: med(sp('none').map((p) => p.cr)),
            cbMedCR: Object.fromEntries(Object.keys(CB).map((cb) => [cb, med(sp(cb).map((p) => p.cr))])), Lflame: med(sp('none').map((p) => p.Lbody)), Lground: med(sp('none').map((p) => p.Lground)) };
          rows.push(row); ok = true; console.log(JSON.stringify(row));
        } catch (e) { console.error('retry', evo, view, t, tier, ground, e.message); await sleep(1200); }
      }
    }
  } finally { writeFileSync(join(out, 'contrast.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
  for (const tier of ['high', 'low']) for (const tt of ['night', 'day']) { const r = rows.filter((x) => x.tier === tier && (tt === 'day' ? x.t > 600 : x.t <= 600)); if (r.length) console.log(`SUMMARY ${tier} ${tt} cells ${r.length}: median-of-row CR min ${Math.min(...r.map((x) => x.medCR))} median ${med(r.map((x) => x.medCR))}, CB min ${Math.min(...r.flatMap((x) => Object.values(x.cbMedCR)))}, per-light min ${Math.min(...r.map((x) => x.minCR))}`); }
}

// friendly coverage near the hero (circle 0.2 x screen height): the whole orbit weapon (flames, halos, ribbons, ground ring / disc, streaks, flowers) new vs ?summons=0
async function coverage(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  const N = Number(process.env.N || 8), rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const evo of (process.env.EVOS || 'base,halo,wheel,tide').split(',')) for (const sm of ['', '&summons=0']) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, q(240, evo, sm).replace('seed=3', 'seed=5') + QUIET, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await stage(c, 240, 30, 'hollow'); await orbBaked(c); await sleep(3000);
      const all = [], noise = [];
      for (let k = 0; k < N; k++) {
        await refill(c, 30); await autoPick(c); await sleep(600);
        await c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()'); await sleep(250);
        const geo = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,p=window.__app.sim.player,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();return JSON.stringify({x:(R.left+(p.x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(p.y-wv.y)/wv.height*R.height)*${dpr},r:0.2*R.height*${dpr}})})()`));
        const a = await png(c, k === 0 && process.env.KEEP ? join(out, `cov-${view}-${evo}${sm ? '-old' : ''}-a.png`) : null);
        await sleep(250); const a2 = await png(c, null);
        await c.ev(OFF); await sleep(250);
        const cc = await png(c, k === 0 && process.env.KEEP ? join(out, `cov-${view}-${evo}${sm ? '-old' : ''}-c.png`) : null);
        await c.ev(ON); await c.ev('(()=>{window.__app.scene.hitStop=0;return 1})()');
        noise.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(a2)}, ${geo.x}, ${geo.y}, ${geo.r})`));
        all.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(cc)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`));
      }
      const pc = (v) => +(100 * v).toFixed(1), mean = (v) => v.reduce((x, y) => x + y, 0) / v.length;
      const row = { view, evo, look: sm ? 'today' : 'S4', allMean: pc(mean(all)), allMax: pc(Math.max(...all)), noiseMax: pc(Math.max(...noise)), n: N };
      rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'coverage.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

async function atlas(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const c = await fresh(null);
  try {
    await open(c, q(30, 'wheel'), 1280, 720, 1, 'high');
    await sleep(500); await stage(c, 30, 4, 'hollow'); await orbBaked(c); await sleep(300);
    const r = await c.ev('window.__app.scene.sumAtlas.cv.toDataURL("image/png")');
    writeFileSync(join(out, 's4-atlas.png'), Buffer.from(r.split(',')[1], 'base64'));
    console.log('atlas', await c.ev('JSON.stringify({...window.__app.scene.sumArt,kinds:[...window.__app.scene.sumArt.kinds]})'));
  } finally { cleanupAll(); }
}

async function bake(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const rows = []; let c = null;
  try {
    for (const evo of ['base', 'wheel']) for (let i = 0; i < Number(process.env.N || 3); i++) {
      c = await fresh(c);
      await open(c, q(30, evo), 1280, 720, 1, 'high');
      await stage(c, 30, 4, 'hollow'); await orbBaked(c);
      const o = JSON.parse(await c.ev('JSON.stringify({...window.__app.scene.sumArt,kinds:[...window.__app.scene.sumArt.kinds]})'));
      const row = { evo, bootMain: +o.wolfMainMs.toFixed(1), bootWall: +o.wolfMs.toFixed(1), lazyMainTotal: +o.evoMs.toFixed(1), lazyMaxStep: +o.evoMaxStepMs.toFixed(1), orbit: o.orbit, kinds: o.kinds.join(','), err: o.error };
      rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'bake.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

// Calm motion (reduced motion on): per-light frame / rotation / scale / alpha changes per second while the ring turns (gate <= 3 crossings/s,
// no flicker or bob: a held frame, no lean, no flare). Also reports the normal-motion rates for reference.
async function calm(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null; const rows = [];
  try {
    for (const evo of (process.env.EVOS || 'base,halo,wheel,tide').split(',')) for (const rm of [true, false]) {
      c = await fresh(c);
      await open(c, q(240, evo), 1280, 720, 1, 'high');
      await stage(c, 240, 30, 'hollow'); await orbBaked(c);
      await c.ev(`(()=>{window.__app.save.setSettings({reducedMotion:${rm}});return 1})()`); await sleep(500);
      const r = JSON.parse(await c.ev(`(async()=>{const S=window.__app.scene,s=window.__app.sim,pl=S.pools.uOrbA;const last=new Map(),ch={fr:0,rot:0,sc:0};let n=0,fr=0;const t0=performance.now();
        while(performance.now()-t0<4000){await new Promise(r=>requestAnimationFrame(r));fr++;for(const v of pl.map.values()){const i=v.img,o=last.get(v.id);const cur={fr:i.frame.name,rot:+i.rotation.toFixed(3),sc:+i.scaleX.toFixed(4)};if(o){for(const k of Object.keys(ch))if(o[k]!==cur[k])ch[k]++;}last.set(v.id,cur);}n=Math.max(n,pl.map.size);}
        const L=Math.max(1,n);return JSON.stringify({lights:n,frames:fr,framePerS:+(ch.fr/L/4).toFixed(2),rotPerS:+(ch.rot/L/4).toFixed(2),scalePerS:+(ch.sc/L/4).toFixed(2)})})()`));
      const row = { evo, calm: rm, ...r }; rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'calm.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

// Burn licks vs orbit flames (gate e): 4x crop around a burning foe next to a light, day + night
async function licks(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  try {
    for (const t of [30, 690]) {
      c = await fresh(c);
      await open(c, q(t, 'base'), 1280, 720, 1, 'high');
      await sleep(400); await stage(c, t, 14, t > 300 ? 'restored' : 'hollow'); await orbBaked(c);
      let e = null;
      for (let i = 0; i < 200 && !e; i++) { await sleep(60); e = JSON.parse(await c.ev(`(()=>{const S=window.__app.scene,s=window.__app.sim;for(const q of s.enemies)if(q.maxHp<1e5){q.hp=q.maxHp=1e6;}const m=s.enemies.find(e=>e.burnT>0.6&&!e.dead&&s.units.some(u=>u.kind==='orb'&&Math.hypot(u.x-e.x,u.y-e.y)<26&&Math.hypot(u.x-e.x,u.y-e.y)>12));if(!m)return 'null';S.hitStop=1e9;for(const e2 of s.enemies)e2.flash=0;for(const o of S.children.list)if(o.aid!==undefined)o.hurtT=-9;if(S.nums&&S.nums.clear)S.nums.clear();const wv=S.cameras.main.worldView,R=S.game.canvas.getBoundingClientRect();return JSON.stringify({x:R.left+(m.x-wv.x)/wv.width*R.width,y:R.top+(m.y-wv.y)/wv.height*R.height})})()`)); }
      if (!e) { console.log('no burning foe seen', t); continue; }
      await sleep(200);
      const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: e.x - 40, y: e.y - 40, width: 80, height: 64, scale: 6 } });
      writeFileSync(join(out, `s4-licks-${t < 300 ? 'night' : 'day'}.png`), Buffer.from(r.data, 'base64')); console.log('licks', t);
    }
  } finally { cleanupAll(); }
}

const [cmd, out] = process.argv.slice(2);
const fn = { shots, contrast, coverage, atlas, bake, calm, licks }[cmd];
if (!fn || !out) { console.log('usage: node scripts/s4-orbit.mjs shots|contrast|coverage|atlas|bake|calm|licks <outDir>'); process.exit(1); }
try { await fn(out); } catch (e) { console.error(e); cleanupAll(); process.exitCode = 1; }
