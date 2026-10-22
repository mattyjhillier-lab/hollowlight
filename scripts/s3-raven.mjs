// S3 Letter Ravens verify harness on the REAL build (reads dist/ or DIST=<dir>; npm run build first). Own headless Chrome (debug port 9561) + own
// static server (4271); kills only what it opened and deletes its own temp profile (also on Ctrl+C / errors). PARAMS=x=1 extra URL flags.
//   node scripts/s3-raven.mjs shots    <outDir>  desk 1280x720 + 844x390@2x + 390x844@2x, night (0:30) + day (11:30), flock / Wall / Talon / Spearhead (EVOS), PNG
//   node scripts/s3-raven.mjs contrast <outDir>  WL6 rule (scripts/wl6-measure.mjs): raven vs ground contrast and raven - Grave Crow L* gap (greyscale + protan/deutan/
//                                                tritan); EVOS base,talon,wall (wall: the ring ravens where they fly, 'ravens visible on the Wall ring at 1x')
//   node scripts/s3-raven.mjs coverage <outDir>  friendly coverage near the hero (circle 0.2 x screen height): the whole raven weapon (ravens, halos, ribbons,
//                                                wakes, ring feathers / rings) new vs ?summons=0 (today), per evolution; env SIZES, EVOS, N
//   node scripts/s3-raven.mjs atlas    <outDir>  the baked sum_atlas page after the raven bake (frame review)
//   node scripts/s3-raven.mjs bake     <outDir>  lazy raven bake (plain + gold) main-thread ms, cold loads
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = Number(process.env.CDP || 9561), HTTP = Number(process.env.HTTP || 4271); // CDP/HTTP: run two jobs side by side
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const EVO = { base: '', wall: ':murder_storm', talon: ':dive_bombers', spear: ':spearhead' };
const QUIET = process.env.QUIET === '0' ? '' : '&sway=0&motes=0&critters=0&fog=0&push=0&dawn=0';
const grant = (evo) => `raven_flock:count=5,speed=5,power=5,range=5${EVO[evo]}`;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-s3-'));
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
// wait for the lazy raven bake (plain + gold when evolved); ?summons=0 returns at once
const ravenBaked = async (c) => { for (let i = 0; i < 60; i++) { if (await c.ev("(()=>{const S=window.__app.scene,a=S.sumArt;if(!S.sumAtlas)return true;const w=window.__app.sim.weapons.find(w=>w.id==='raven_flock');return !!(a&&a.raven&&(!w||!w.evo||a.kinds.has('rflatg')))||!!(a&&a.error)})()")) return; await sleep(100); } };
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

async function shots(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = await fresh(null);
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const t of (process.env.TS || '30,690').split(',').map(Number)) for (const evo of (process.env.EVOS || 'base,wall,talon,spear').split(',')) for (const sm of (process.env.OLD ? ['', '&summons=0'] : [''])) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${grant(evo)}${sm}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await stage(c, t, 26, t > 300 ? 'restored' : 'hollow'); await ravenBaked(c);
      await sleep(2400); await refill(c, 22); await autoPick(c); await sleep(Number(process.env.WAIT || 500));
      await c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()'); await sleep(200);
      const ext = JPG ? 'jpg' : 'png', name = `s3-${view}-${t < 300 ? 'night' : 'day'}-${evo}${sm ? '-old' : ''}.${ext}`;
      await png(c, join(out, name), JPG);
      if (view === 'desk') { const r = await c.send('Page.captureScreenshot', { format: JPG ? 'jpeg' : 'png', ...(JPG ? { quality: 80 } : {}), clip: { x: 390, y: 160, width: 500, height: 400, scale: 2 } }); writeFileSync(join(out, `s3-crop2x-${t < 300 ? 'night' : 'day'}-${evo}${sm ? '-old' : ''}.${ext}`), Buffer.from(r.data, 'base64')); }
      console.log('shot', name, await c.ev('JSON.stringify({raven:window.__app.scene.sumArt&&window.__app.scene.sumArt.raven,kinds:window.__app.scene.sumArt?[...window.__app.scene.sumArt.kinds].join():"",evo:(window.__app.sim.weapons.find(w=>w.id==="raven_flock")||{}).evo,frames:[...window.__app.scene.pools.uRavenA.map.values()].filter(r=>r.img.visible).map(r=>r.img.frame.name).join(",")})'));
    }
  } finally { cleanupAll(); }
}

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
async function contrast(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  const rows = [];
  const sizes = (process.env.SIZES || 'desk,land').split(','), ts = (process.env.TS || '30,240,690').split(',').map(Number);
  const tiers = (process.env.TIERS || 'high,low').split(','), grounds = (process.env.GROUNDS || 'hollow,restored,corrupt').split(','), evos = (process.env.EVOS || 'base,talon,wall').split(',');
  try {
    for (const evo of evos) for (const view of sizes) for (const t of ts) for (const tier of tiers) for (const ground of grounds) {
      const [w, h, dpr] = VIEWS[view];
      const portrait = h > w, wall = evo === 'wall';
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          c = await fresh(c);
          await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${grant(evo)}${QUIET}`, w, h, dpr, tier);
          await sleep(400); await stage(c, t, 0, ground); await ravenBaked(c); await sleep(900);
          // scouts: 5 in a row above the hero (held still, one pose each frame); Wall: the ring ravens stay where they fly. 3 Grave Crows in a row below.
          const POS = `(()=>{const a=window.__app,s=a.sim,p=s.player;s.enemies.length=0;for(let i=0;i<3;i++){s.spawnEnemy('crow',p.x+(i-1)*${portrait ? 50 : 70},p.y+70);}
            for(const e of s.enemies){e.faceX=1;e.speed=0;e.tele=0;e.grace=99;e.state='run';e.hp=1e9;e.maxHp=1e9;e.flash=0;}
            const W=s.units.filter(u=>u.kind==='raven'&&!u.wall&&!u.wedge);const sp=${portrait ? 30 : 50};${wall ? '' : 'W.forEach((u,i)=>{u.x=p.x+(i-(W.length-1)/2)*sp;u.y=p.y-' + (h < 500 ? 48 : 70) + ';u.faceX=1;u.st="return";u.target=null;});'}
            a.scene.hitStop=1e9;for(const o of a.scene.children.list)if(o.aid!==undefined)o.hurtT=-9;s.time=${t};return W.length})()`;
          await c.ev(POS); await sleep(250); await c.ev(POS); await sleep(250);
          const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect(),k=R.width/wv.width*${dpr};
            const RR=9*12.5/16.8;/* the wolf harness disc (9 u for a 16.8 u wolf) scaled to the 12.5 u raven */const P=(x,y,r,kind)=>({kind,x:(R.left+(x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(y-wv.y)/wv.height*R.height)*${dpr},r:r*k});
            const in1=(q)=>q.x>8&&q.y>8&&q.x<R.width*${dpr}-8&&q.y<R.height*${dpr}-8;
            return JSON.stringify([...s.units.filter(u=>u.kind==='raven'&&(${wall ? 'u.wall' : '!u.wall&&!u.wedge'})).map(u=>P(u.x,u.y,RR,'spirit')).filter(in1),...s.enemies.map(e=>P(e.x,e.y-3,e.r*1.6,'crow'))])})()`));
          const a = await png(c, process.env.KEEP ? join(out, `c-${evo}-${view}-${fmt(t)}-${tier}-${ground}.png`) : null);
          if (process.env.KEEP) { // 3x crop of the measured ravens + crows (look review)
            const xs = pts.map((q) => q.x / dpr), ys = pts.map((q) => q.y / dpr), x0 = Math.max(0, Math.min(...xs) - 30), y0 = Math.max(0, Math.min(...ys) - 30);
            const r3 = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: x0, y: y0, width: Math.min(w - x0, Math.max(...xs) - x0 + 30), height: Math.min(h - y0, Math.max(...ys) - y0 + 30), scale: 3 } });
            writeFileSync(join(out, `z-${evo}-${view}-${fmt(t)}-${tier}-${ground}.png`), Buffer.from(r3.data, 'base64'));
          }
          await c.ev('(()=>{const s=window.__app.sim;s.enemies.length=0;window.__wr=null;for(const u of s.units)if(u.kind===\'raven\')u.x+=9000;const w=s.weapons.find(w=>w.id===\'raven_flock\');if(w&&w.rt.wallR){window.__wr=w.rt.wallR;w.rt.wallR=null;}return 1})()'); await sleep(250);
          const b = await png(c, null);
          const res = {};
          for (const cb of Object.keys(CB)) res[cb] = JSON.parse(await c.ev(`(${MEASURE_WL6})(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${JSON.stringify(pts)}, ${JSON.stringify(CB[cb])})`));
          if (res.none.some((p) => p.mask < 6)) throw new Error('unrendered creature');
          const sp = (cb) => res[cb].filter((p) => p.kind === 'spirit'), fe = (cb) => res[cb].filter((p) => p.kind === 'crow');
          const med = (a2) => { const s2 = [...a2].sort((x, y) => x - y); return s2[s2.length >> 1]; };
          const row = { evo, view, t, tier, ground, ravens: sp('none').length, minCR: Math.min(...sp('none').map((p) => p.cr)), medCR: med(sp('none').map((p) => p.cr)), maskPx: med(sp('none').map((p) => p.mask)),
            gap: Object.fromEntries(Object.keys(CB).map((cb) => [cb, +(med(sp(cb).map((p) => p.Lbody)) - med(fe(cb).map((p) => p.Lbody))).toFixed(1)])),
            Lraven: med(sp('none').map((p) => p.Lbody)), Lcrow: med(fe('none').map((p) => p.Lbody)), Lground: med(sp('none').map((p) => p.Lground)) };
          rows.push(row); ok = true;
          console.log(JSON.stringify(row));
        } catch (e) { console.error('retry', evo, view, t, tier, ground, e.message); await sleep(1200); }
      }
    }
  } finally { writeFileSync(join(out, 'contrast.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
  const med = (a2) => { const s2 = [...a2].sort((x, y) => x - y); return s2[s2.length >> 1]; };
  for (const tier of ['high', 'low']) { const r = rows.filter((x) => x.tier === tier); if (r.length) console.log(`SUMMARY ${tier} cells ${r.length}: median-of-row CR min ${Math.min(...r.map((x) => x.medCR))} median ${med(r.map((x) => x.medCR))}, per-raven min ${Math.min(...r.map((x) => x.minCR))}; raven - Grave Crow L* gap min ${Math.min(...r.flatMap((x) => Object.values(x.gap)))} (gate >= 25, all CB sims)`); }
}

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
async function coverage(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  const N = Number(process.env.N || 8), rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const evo of (process.env.EVOS || 'base,wall,talon,spear').split(',')) for (const sm of ['', '&summons=0']) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=240&grant=${grant(evo)}${QUIET}${sm}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await stage(c, 240, 30, 'hollow'); await ravenBaked(c); await sleep(3000);
      const all = [], noise = [];
      for (let k = 0; k < N; k++) {
        await refill(c, 30); await autoPick(c); await sleep(600);
        await c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()'); await sleep(250);
        const geo = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,p=window.__app.sim.player,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();return JSON.stringify({x:(R.left+(p.x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(p.y-wv.y)/wv.height*R.height)*${dpr},r:0.2*R.height*${dpr}})})()`));
        const a = await png(c, k === 0 && process.env.KEEP ? join(out, `cov-${view}-${evo}${sm ? '-old' : ''}-a.png`) : null);
        await sleep(250); const a2 = await png(c, null);
        // no raven weapon: ravens hidden, their spirit ribbons cleared, Wall rings/feathers off (wallR), Talon marks kept (status, not friendly art)
        await c.ev('(()=>{const S=window.__app.scene,s=window.__app.sim;window.__hid=[];for(const u of s.units)if(u.kind==="raven"&&!u.hidden){u.hidden=true;window.__hid.push(u);const sl=S.ribSet&&S.ribSet.byId.get(u.id);if(sl)sl.rib.reset();}const w=s.weapons.find(w=>w.id==="raven_flock");window.__wr=w.rt.wallR;w.rt.wallR=null;return 1})()'); await sleep(250);
        const cc = await png(c, k === 0 && process.env.KEEP ? join(out, `cov-${view}-${evo}${sm ? '-old' : ''}-c.png`) : null);
        await c.ev('(()=>{const s=window.__app.sim;for(const u of window.__hid)u.hidden=false;const w=s.weapons.find(w=>w.id==="raven_flock");w.rt.wallR=window.__wr;window.__app.scene.hitStop=0;return 1})()');
        noise.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(a2)}, ${geo.x}, ${geo.y}, ${geo.r})`));
        all.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(cc)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`));
      }
      const pc = (v) => +(100 * v).toFixed(1), mean = (v) => v.reduce((x, y) => x + y, 0) / v.length;
      const row = { view, evo, look: sm ? 'today' : 'S3', allMean: pc(mean(all)), allMax: pc(Math.max(...all)), noiseMax: pc(Math.max(...noise)), n: N };
      rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'coverage.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

async function atlas(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const c = await fresh(null);
  try {
    await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=30&grant=${grant('talon')}`, 1280, 720, 1, 'high');
    await sleep(500); await stage(c, 30, 4, 'hollow'); await ravenBaked(c); await sleep(300);
    const r = await c.ev('window.__app.scene.sumAtlas.cv.toDataURL("image/png")');
    writeFileSync(join(out, 's3-atlas.png'), Buffer.from(r.split(',')[1], 'base64'));
    console.log('atlas', await c.ev('JSON.stringify({...window.__app.scene.sumArt,kinds:[...window.__app.scene.sumArt.kinds]})'));
  } finally { cleanupAll(); }
}

async function bake(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const rows = []; let c = null;
  try {
    for (const evo of ['base', 'talon']) for (let i = 0; i < Number(process.env.N || 3); i++) {
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=30&grant=${grant(evo)}`, 1280, 720, 1, 'high');
      await stage(c, 30, 4, 'hollow'); await ravenBaked(c);
      const o = JSON.parse(await c.ev('JSON.stringify({...window.__app.scene.sumArt,kinds:[...window.__app.scene.sumArt.kinds]})'));
      const row = { evo, bootMain: +o.wolfMainMs.toFixed(1), ravenMainTotal: +o.evoMs.toFixed(1), ravenMaxStep: +o.evoMaxStepMs.toFixed(1), raven: o.raven, kinds: o.kinds.join(','), err: o.error };
      rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'bake.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

async function omen(out) { // Talon Mark omen close-up (wax-seal disc + locked chevron), 4x clip around a marked foe, day + night
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  try {
    for (const t of [30, 690]) {
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${grant('talon')}`, 1280, 720, 1, 'high');
      await sleep(400); await stage(c, t, 14, t > 300 ? 'restored' : 'hollow'); await ravenBaked(c);
      let e = null;
      for (let i = 0; i < 250 && !e; i++) { await sleep(100); e = JSON.parse(await c.ev(`(()=>{const S=window.__app.scene,s=window.__app.sim;for(const q of s.enemies)if(q.maxHp<1e5){q.hp=q.maxHp=1e6;}const m=s.enemies.find(e=>e.markT>1.5&&!e.dead);if(!m)return 'null';S.hitStop=1e9;const wv=S.cameras.main.worldView,R=S.game.canvas.getBoundingClientRect();return JSON.stringify({x:R.left+(m.x-wv.x)/wv.width*R.width,y:R.top+(m.y-wv.y)/wv.height*R.height})})()`)); }
      if (!e) { console.log('no mark seen', t); continue; }
      await sleep(200);
      const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: e.x - 50, y: e.y - 60, width: 100, height: 90, scale: 4 } });
      writeFileSync(join(out, `s3-omen-${t < 300 ? 'night' : 'day'}.png`), Buffer.from(r.data, 'base64')); console.log('omen', t);
    }
  } finally { cleanupAll(); }
}

const [cmd, out] = process.argv.slice(2);
const fn = { shots, contrast, coverage, atlas, bake, omen }[cmd];
if (!fn || !out) { console.log('usage: node scripts/s3-raven.mjs shots|contrast|coverage|atlas|bake <outDir>'); process.exit(1); }
try { await fn(out); } catch (e) { console.error(e); cleanupAll(); process.exitCode = 1; }
