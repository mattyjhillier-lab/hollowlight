// S5 Ink Glyph Orb verify harness (copy of scripts/s3-raven.mjs) on the REAL build (reads dist/ or DIST=<dir>; npm run build first). Own headless Chrome (debug port 9561) + own
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
const PORT = Number(process.env.CDP || 9565), HTTP = Number(process.env.HTTP || 4275); // CDP/HTTP: run two jobs side by side
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const EVO = { base: '', tempest: ':spirit_tempest', lance: ':soul_lance', pages: ':returning_pages' };
const QUIET = process.env.QUIET === '0' ? '' : '&sway=0&motes=0&critters=0&fog=0&push=0&dawn=0';
const grant = (evo) => `spirit_bolts:count=5,speed=5,power=5,pierce=5${EVO[evo]}`;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-s5-'));
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
const K = { spirit_tempest: 'gtorn', soul_lance: 'glance', returning_pages: 'gpage' };
const ravenBaked = async (c) => { for (let i = 0; i < 80; i++) { if (await c.ev(`(()=>{const S=window.__app.scene,a=S.sumArt;if(!S.sumAtlas)return true;const w=window.__app.sim.weapons.find(w=>w.id==='spirit_bolts');const K=${JSON.stringify(K)};return !!(a&&a.bolt&&(!w||!w.evo||a.kinds.has(K[w.evo])))||!!(a&&a.error)})()`)) return; await sleep(100); } };
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
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const t of (process.env.TS || '30,690').split(',').map(Number)) for (const evo of (process.env.EVOS || 'base,tempest,lance,pages').split(',')) for (const sm of (process.env.OLD ? ['', '&summons=0'] : [''])) {
      const [w, h, dpr] = VIEWS[view];
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${grant(evo)}${sm}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await stage(c, t, 26, t > 300 ? 'restored' : 'hollow'); await ravenBaked(c);
      await sleep(2400); await refill(c, 22); await autoPick(c); await sleep(Number(process.env.WAIT || 500));
      await c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()'); await sleep(200);
      const ext = JPG ? 'jpg' : 'png', name = `s5-${view}-${t < 300 ? 'night' : 'day'}-${evo}${sm ? '-old' : ''}.${ext}`;
      await png(c, join(out, name), JPG);
      if (view === 'desk') { const r = await c.send('Page.captureScreenshot', { format: JPG ? 'jpeg' : 'png', ...(JPG ? { quality: 80 } : {}), clip: { x: 390, y: 160, width: 500, height: 400, scale: 2 } }); writeFileSync(join(out, `s5-crop2x-${t < 300 ? 'night' : 'day'}-${evo}${sm ? '-old' : ''}.${ext}`), Buffer.from(r.data, 'base64')); }
      console.log('shot', name, await c.ev('JSON.stringify({bolt:window.__app.scene.sumArt&&window.__app.scene.sumArt.bolt,kinds:window.__app.scene.sumArt?[...window.__app.scene.sumArt.kinds].join():"",evo:(window.__app.sim.weapons.find(w=>w.id==="spirit_bolts")||{}).evo,frames:[...window.__app.scene.pools.uGlyph.map.values()].filter(r=>r.img.visible).map(r=>r.img.frame.name).slice(0,8).join(",")})'));
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
  const tiers = (process.env.TIERS || 'high,low').split(','), grounds = (process.env.GROUNDS || 'hollow,restored,corrupt').split(','), evos = (process.env.EVOS || 'base,tempest').split(',');
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
          for (let i = 0; i < 40; i++) { await sleep(100); if (await c.ev('window.__app.sim.projectiles.filter(b=>!b.dead).length') >= 5) break; }
          // glyphs: 5 in a row above the hero (frozen, heading +x); 3 mint XP gems in a row below (the 'foe' slot of the raven harness = the gem here)
          const POS = `(()=>{const a=window.__app,s=a.sim,p=s.player;a.scene.hitStop=1e9;s.enemies.length=0;s.gems.length=0;const B=s.projectiles.filter(b=>!b.dead).slice(0,5);const sp=${portrait ? 30 : 50};
            B.forEach((b,i)=>{b.x=p.x+(i-2)*sp;b.y=p.y-${h < 500 ? 48 : 70};b.vx=200;b.vy=0;b.ang=0;b.life=99;});for(let i=0;i<3;i++)s.gems.push({id:s.nextId++,x:p.x+(i-1)*${portrait ? 50 : 70},y:p.y+60,v:1,mag:false});
            for(const o of a.scene.children.list)if(o.aid!==undefined)o.hurtT=-9;s.time=${t};return B.length})()`;
          await c.ev(POS); await sleep(250); await c.ev(POS); await sleep(250);
          const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect(),k=R.width/wv.width*${dpr};
            const RR=2.5*1.3*1.6;/* disc ~ the orb incl. ink rim (0.55 x RR measured) */const P=(x,y,r,kind)=>({kind,x:(R.left+(x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(y-wv.y)/wv.height*R.height)*${dpr},r:r*k});
            const in1=(q)=>q.x>8&&q.y>8&&q.x<R.width*${dpr}-8&&q.y<R.height*${dpr}-8;
            return JSON.stringify([...s.projectiles.filter(b=>!b.dead).slice(0,5).map(b=>P(b.x,b.y,RR,'spirit')).filter(in1),...s.gems.map(g=>P(g.x,g.y,6,'crow'))])})()`));
          const a = await png(c, process.env.KEEP ? join(out, `c-${evo}-${view}-${fmt(t)}-${tier}-${ground}.png`) : null);
          if (process.env.KEEP) { // 3x crop of the measured ravens + crows (look review)
            const xs = pts.map((q) => q.x / dpr), ys = pts.map((q) => q.y / dpr), x0 = Math.max(0, Math.min(...xs) - 30), y0 = Math.max(0, Math.min(...ys) - 30);
            const r3 = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: x0, y: y0, width: Math.min(w - x0, Math.max(...xs) - x0 + 30), height: Math.min(h - y0, Math.max(...ys) - y0 + 30), scale: 3 } });
            writeFileSync(join(out, `z-${evo}-${view}-${fmt(t)}-${tier}-${ground}.png`), Buffer.from(r3.data, 'base64'));
          }
          await c.ev('(()=>{const s=window.__app.sim;s.enemies.length=0;for(const b of s.projectiles)b.x+=9000;for(const g of s.gems)g.x+=9000;return 1})()'); await sleep(250);
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
  for (const tier of ['high', 'low']) { const r = rows.filter((x) => x.tier === tier); if (r.length) console.log(`SUMMARY ${tier} cells ${r.length}: median-of-row CR min ${Math.min(...r.map((x) => x.medCR))} median ${med(r.map((x) => x.medCR))}, per-raven min ${Math.min(...r.map((x) => x.minCR))}; glyph - XP gem L* gap min (info) ${Math.min(...r.flatMap((x) => Object.values(x.gap)))} (gate >= 25, all CB sims)`); }
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
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const evo of (process.env.EVOS || 'base,tempest,lance,pages').split(',')) for (const sm of ['', '&summons=0']) {
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
        await c.ev('(()=>{const s=window.__app.sim;window.__hid=[];for(const b of s.projectiles)if(!b.dead){b.x+=9000;window.__hid.push(b);}window.__fx=s.fx.slice();s.fx=s.fx.filter(f=>f.color!=="#7ff0ff");return 1})()'); await sleep(250);
        const cc = await png(c, k === 0 && process.env.KEEP ? join(out, `cov-${view}-${evo}${sm ? '-old' : ''}-c.png`) : null);
        await c.ev('(()=>{const s=window.__app.sim;for(const b of window.__hid)b.x-=9000;window.__app.scene.hitStop=0;return 1})()');
        noise.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(a2)}, ${geo.x}, ${geo.y}, ${geo.r})`));
        all.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(cc)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`));
      }
      const pc = (v) => +(100 * v).toFixed(1), mean = (v) => v.reduce((x, y) => x + y, 0) / v.length;
      const row = { view, evo, look: sm ? 'today' : 'S5', allMean: pc(mean(all)), allMax: pc(Math.max(...all)), noiseMax: pc(Math.max(...noise)), n: N };
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
    for (const evo of ['base', 'tempest']) for (let i = 0; i < Number(process.env.N || 3); i++) {
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=30&grant=${grant(evo)}`, 1280, 720, 1, 'high');
      await stage(c, 30, 4, 'hollow'); await ravenBaked(c);
      const o = JSON.parse(await c.ev('JSON.stringify({...window.__app.scene.sumArt,kinds:[...window.__app.scene.sumArt.kinds]})'));
      const row = { evo, bootMain: +o.wolfMainMs.toFixed(1), lazyMainTotal: +o.evoMs.toFixed(1), lazyMaxStep: +o.evoMaxStepMs.toFixed(1), bolt: o.bolt, kinds: o.kinds.join(','), err: o.error };
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

// Gem-confusion contact sheet (cross-cutting gate (a)): 5 glyph orbs (heading +x, tails) in a row with a mint XP gem under each, frozen, at 1x on the
// real build, for GLYPH_K 1.0 and 1.3, night (0:30) + day (11:30); panels colour / greyscale / protan / deutan / tritan (sheet-*.png, 1x and 3x),
// plus numbers: median L* of the orb vs the gem and the share of dark ink pixels (L* < 40) in each mark (the tail / ink rim is the separating cue).
const PANELS = `(async (b64, mats) => {
  const i = await new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + b64; });
  const W = i.width, H = i.height, out = document.createElement('canvas'); out.width = W * mats.length; out.height = H;
  const o = out.getContext('2d'), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true });
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }, gam = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055), cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  mats.forEach((m, k) => { g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, W, H); const a = d.data;
    for (let p = 0; p < a.length; p += 4) { let r = lin(a[p]), gg = lin(a[p + 1]), b = lin(a[p + 2]);
      if (m === 'grey') { const y = 0.2126 * r + 0.7152 * gg + 0.0722 * b; r = gg = b = y; } else if (m) { const r2 = cl(m[0] * r + m[1] * gg + m[2] * b), g2 = cl(m[3] * r + m[4] * gg + m[5] * b), b2 = cl(m[6] * r + m[7] * gg + m[8] * b); r = r2; gg = g2; b = b2; }
      a[p] = gam(r); a[p + 1] = gam(gg); a[p + 2] = gam(b); }
    g.putImageData(d, 0, 0); o.drawImage(cv, k * W, 0); });
  return out.toDataURL('image/png').split(',')[1];
})`;
async function sheet(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null; const rows = [];
  try {
    for (const t of [30, 690]) for (const K of [1.0, 1.3]) {
      c = await fresh(c);
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${grant('base')}${QUIET}`, 1280, 720, 1, 'high');
      await sleep(400); await stage(c, t, 12, t > 300 ? 'restored' : 'hollow'); await ravenBaked(c);
      let n = 0; for (let i = 0; i < 40 && n < 5; i++) { await sleep(100); n = await c.ev('window.__app.sim.projectiles.filter(b=>!b.dead).length'); }
      const POS = `(()=>{const a=window.__app,s=a.sim,p=s.player;a.scene.glyphK=${K};a.scene.hitStop=1e9;s.enemies.length=0;s.gems.length=0;const B=s.projectiles.filter(b=>!b.dead).slice(0,5);
        B.forEach((b,i)=>{b.x=p.x+(i-2)*26+6;b.y=p.y+40;b.vx=200;b.vy=0;b.ang=0;b.life=99;s.gems.push({id:s.nextId++,x:b.x,y:p.y+62,v:1,mag:false});});return B.length})()`;
      const nb = await c.ev(POS); await sleep(300); await c.ev(POS); await sleep(300);
      const geo = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,p=s.player,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();const X=(x)=>R.left+(x-wv.x)/wv.width*R.width,Y=(y)=>R.top+(y-wv.y)/wv.height*R.height;
        return JSON.stringify({x:X(p.x-80),y:Y(p.y+24),w:X(p.x+80)-X(p.x-80),h:Y(p.y+76)-Y(p.y+24),orbs:s.projectiles.filter(b=>!b.dead).slice(0,5).map(b=>[X(b.x)-X(p.x-80),Y(b.y)-Y(p.y+24)]),gems:s.gems.map(g=>[X(g.x)-X(p.x-80),Y(g.y)-Y(p.y+24)]),k:R.width/wv.width})})()`));
      const clip = { x: geo.x, y: geo.y, width: geo.w, height: geo.h, scale: 1 };
      const one = (await c.send('Page.captureScreenshot', { format: 'png', clip })).data;
      const tag = `${t < 300 ? 'night' : 'day'}-${K.toFixed(1)}x`;
      const mats = [null, 'grey', CB.protan, CB.deutan, CB.tritan];
      const pan = await c.ev(`(${PANELS})(${JSON.stringify(one)}, ${JSON.stringify(mats)})`);
      writeFileSync(join(out, `sheet-${tag}.png`), Buffer.from(pan, 'base64'));
      const three = (await c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 3 } })).data;
      writeFileSync(join(out, `sheet3x-${tag}.png`), Buffer.from(await c.ev(`(${PANELS})(${JSON.stringify(three)}, ${JSON.stringify([null, 'grey'])})`), 'base64'));
      // numbers: discs around each orb (r = 0.6 x orb size incl. the tail box) and each gem, mask = differs from the ground sample under the mark
      const m = JSON.parse(await c.ev(`(async (b64, geo, K) => { const i = await new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + b64; });
        const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); const d = g.getImageData(0, 0, i.width, i.height).data;
        const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }, Ls = (y) => (y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y);
        const L = (x, y) => { const q = (y * i.width + x) * 4; return Ls(0.2126 * lin(d[q]) + 0.7152 * lin(d[q + 1]) + 0.0722 * lin(d[q + 2])); };
        const ground = L(2, 2);
        const zone = (cx, cy, x0, x1, y0, y1) => { const v = []; for (let y = Math.max(0, Math.round(cy + y0)); y < Math.min(i.height, cy + y1); y++) for (let x = Math.max(0, Math.round(cx + x0)); x < Math.min(i.width, cx + x1); x++) { const l = L(x, y); if (Math.abs(l - ground) > 6) v.push(l); } v.sort((a, b) => a - b); return { n: v.length, med: v.length ? +v[v.length >> 1].toFixed(1) : null, dark: v.length ? +(v.filter((l) => l < 40).length / v.length).toFixed(2) : 0 }; };
        const r = 2.5 * K * geo.k * 1.3;
        return JSON.stringify({ ground: +ground.toFixed(1), orb: geo.orbs.map(([x, y]) => zone(x, y, -r * 3.2, r * 1.2, -r * 1.3, r * 1.3)), gem: geo.gems.map(([x, y]) => zone(x, y, -6 * geo.k / 2.4 * 2.4, 6 * geo.k, -7 * geo.k, 7 * geo.k)) }); })(${JSON.stringify(one)}, ${JSON.stringify(geo)}, ${K})`));
      const med = (a2) => { const s2 = a2.filter((x) => x != null).sort((x, y) => x - y); return s2[s2.length >> 1]; };
      const row = { tag, bolts: nb, ground: m.ground, orbL: med(m.orb.map((z) => z.med)), gemL: med(m.gem.map((z) => z.med)), orbDark: med(m.orb.map((z) => z.dark)), gemDark: med(m.gem.map((z) => z.dark)), orbPx: med(m.orb.map((z) => z.n)), gemPx: med(m.gem.map((z) => z.n)) };
      rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'sheet.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

// Deterministic coverage (timing-free): 8 projectiles of the weapon frozen on a ring of 0.6 x the 0.2-screen-height circle around the hero, heading
// outward (as a volley leaving the hero); covered fraction of the circle with vs without them; S5 vs ?summons=0 (today). env SIZES, EVOS, TIER.
async function covfix(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null; const rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const evo of (process.env.EVOS || 'base,tempest,lance,pages').split(',')) {
      const row = { view, evo };
      for (const sm of ['', '&summons=0']) {
        const [w, h, dpr] = VIEWS[view];
        c = await fresh(c);
        await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=240&grant=${grant(evo)}${QUIET}${sm}`, w, h, dpr, process.env.TIER || 'high');
        await sleep(400); await stage(c, 240, 12, 'hollow'); await ravenBaked(c);
        for (let i = 0; i < 60; i++) { await sleep(100); if (await c.ev('window.__app.sim.projectiles.filter(b=>!b.dead).length') >= 3) break; }
        const POS = `(()=>{const a=window.__app,s=a.sim,p=s.player,sc=a.scene;sc.hitStop=1e9;s.enemies.length=0;s.fx.length=0;const live=s.projectiles.filter(b=>!b.dead);if(!live.length)return 0;
          const R0=0.6*0.2*sc.cameras.main.worldView.height;s.projectiles.length=0;for(let i=0;i<8;i++){const b={...live[i%live.length],id:900000+i,hit:new Set()};const an=i*Math.PI/4+0.3;b.x=p.x+Math.cos(an)*R0;b.y=p.y+Math.sin(an)*R0;b.vx=Math.cos(an)*200;b.vy=Math.sin(an)*200;b.ang=an;b.life=99;b.dead=false;s.projectiles.push(b);}
          return 8})()`;
        const nb = await c.ev(POS); await sleep(300); await c.ev(POS); await sleep(300);
        const geo = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,p=window.__app.sim.player,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();return JSON.stringify({x:(R.left+(p.x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(p.y-wv.y)/wv.height*R.height)*${dpr},r:0.2*R.height*${dpr}})})()`));
        const a = await png(c, process.env.KEEP ? join(out, `cf-${view}-${evo}${sm ? '-old' : ''}.png`) : null); await sleep(200); const a2 = await png(c, null);
        await c.ev('(()=>{const s=window.__app.sim;for(const b of s.projectiles)b.x+=9000;return 1})()'); await sleep(300);
        const cc = await png(c, null);
        const v = await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(cc)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`);
        row[sm ? 'today' : 'S5'] = +(100 * v).toFixed(1); row.n = nb;
      }
      row.diff = +(row.S5 - row.today).toFixed(1); rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'covfix.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

const [cmd, out] = process.argv.slice(2);
const fn = { shots, contrast, coverage, atlas, bake, omen, sheet, covfix }[cmd];
if (!fn || !out) { console.log('usage: node scripts/s3-raven.mjs shots|contrast|coverage|atlas|bake <outDir>'); process.exit(1); }
try { await fn(out); } catch (e) { console.error(e); cleanupAll(); process.exitCode = 1; }
