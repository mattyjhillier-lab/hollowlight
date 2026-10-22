// S1 Ghost Wolf A verify harness on the REAL build (reads dist/; npm run build first). Own headless Chrome (debug port 9547) + own static server (4261);
// kills only what it opened and deletes its own temp profile (also on Ctrl+C / errors). HEADED=1 = real GPU window, PARAMS=x=1&y=0 extra URL flags.
//   node scripts/s1-wolf.mjs shots    <outDir>   true-size desktop 1280x720 + phone 844x390@2x + 390x844@2x, night (0:30) + day (11:30), new wolves and ?summons=0, PNG
//   node scripts/s1-wolf.mjs contrast <outDir>   wolf body vs ground (Hollow / restored / corrupted) contrast ratio, and wolf vs Fell Wolf body L* gap (none/protan/deutan/tritan),
//                                                 5 moments x high/low x desk (env SIZES, TS, TIERS, GROUNDS) -> <outDir>/contrast.json + printed summary
//   node scripts/s1-wolf.mjs occ      <outDir>   DR3: occluders over the hero (enemies + wolves drawn in front, alpha > 0.6, overlapping her box) at the staged 350 crowd, 60 samples
//   node scripts/s1-wolf.mjs bake     <outDir>   wolf bake time (SUM_ART.wolfMs) over 5 cold loads
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9547, HTTP = 4261;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const GRANT = process.env.GRANT || 'ghost_wolves:count=5,speed=3,power=3'; // S2: GRANT=ghost_wolves:count=5,speed=5,power=5:dire_alpha etc. for the evolved looks
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-s1-'));
  // HEADED=1: real GPU (d3d11 ANGLE), window on screen; default headless (software GL: bloom and blending can differ a little from a real GPU)
  const head = process.env.HEADED ? ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1400,900', '--disable-features=CalculateNativeWinOcclusion'] : ['--headless=new'];
  const proc = spawn(CHROME, [...head, `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
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
async function open(c, query, w, h, dpr, tier) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}${process.env.PARAMS ? '&' + process.env.PARAMS : ''}` });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) { await c.ev(`window.__app.save.setSettings({quality:'${tier}',brightness:'normal'}); true`); return; } } catch { /* loading */ }
  }
  throw new Error('run did not start: ' + query);
}
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
const png = async (c, file) => { const r = await c.send('Page.captureScreenshot', { format: 'png' }); if (file) writeFileSync(file, Buffer.from(r.data, 'base64')); return r.data; };
// stage: clear enemies, park the hero, stamp restored ground / corruption, freeze the sim (hitStop) after `run` ms so the wolves sit still
async function stage(c, t, ground, nEnemies, run = 1500) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;s.xp=-1e9;s.time=${t};const X=p.x,Y=p.y;a.scene.cameras.main.centerOn(X,Y);l.decay=1e9;
    ${ground === 'restored' ? 'l.stamp(X,Y,420,1);' : ''}${ground === 'corrupt' ? 'for(let k=0;k<4;k++)l.stampCorr(X,Y,460,1);' : ''}
    let k=0;while(s.enemies.length<${nEnemies}){const an=(k*2.399)%6.2832,d=90+((k*37)%200);s.spawnEnemy(['wolf','crow','root_crawler'][k%3],p.x+Math.cos(an)*d*1.5,p.y+Math.sin(an)*d*0.9);k++;}return 1})()`);
  await sleep(run);
  for (let i = 0; i < 6; i++) { await autoPick(c); await sleep(60); }
}

async function shots(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    for (const [view, hero] of [['desk', 'wren'], ['land', 'wren'], ['port', 'wren']]) for (const t of [30, 690]) for (const sm of ['', '&summons=0']) {
      const [w, h, dpr] = VIEWS[view];
      await open(c, `style=a&auto=${hero}&seed=3&god=1&debug=0&t=${t}&grant=${GRANT}${sm}`, w, h, dpr, 'high');
      await sleep(500); await stage(c, t, t > 300 ? 'restored' : 'hollow', 26, 2600);
      await sleep(120);
      const name = `${view}-${t < 300 ? 'night' : 'day'}-${sm ? 'old' : 'new'}.png`;
      await png(c, join(out, name)); console.log('shot', name, await c.ev('JSON.stringify({wolf:window.__app.scene.sumArt&&window.__app.scene.sumArt.wolf,ms:window.__app.scene.sumArt&&+window.__app.scene.sumArt.wolfMs.toFixed(1)})'));
    }
    // 2x crops around the hero for the contact sheet: freeze, then capture a clip
    for (const t of [30, 690]) for (const sm of ['', '&summons=0']) {
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${GRANT}${sm}`, 1280, 720, 1, 'high');
      await sleep(500); await stage(c, t, t > 300 ? 'restored' : 'hollow', 26, 2600);
      await sleep(120);
      const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 440, y: 210, width: 400, height: 300, scale: 2 } });
      const name = `crop2x-${t < 300 ? 'night' : 'day'}-${sm ? 'old' : 'new'}.png`;
      writeFileSync(join(out, name), Buffer.from(r.data, 'base64')); console.log('shot', name);
    }
  } finally { cleanupAll(); }
}

// ---- contrast ----
const CB = {
  none: null,
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
};
// per point (body centre x, y and a search radius r, device px): the creature's SILHOUETTE = pixels that differ between shot H (creatures drawn,
// halos off) and shot B (no creatures, no halos). body = median luminance of the silhouette CORE (silhouette eroded 1 px, so the tinted outline
// is excluded) in shot A (the frame as the player sees it, halos on); ground = median of a ring 2-6 px outside the silhouette in shot A (what
// surrounds it on screen, its own glow included). Contrast ratio (WCAG) and L* (CIE) per colour-blind simulation.
const MEASURE = `(async (b64, b64h, b64g, pts, cbm) => {
  const load = (b) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; });
  const [ia, ih, ig] = await Promise.all([load(b64), load(b64h), load(b64g)]);
  const mk = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); return g; };
  const ga = mk(ia), gh = mk(ih), gg = mk(ig);
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const L = (d, i) => { let r = lin(d[i]), g2 = lin(d[i + 1]), b = lin(d[i + 2]);
    if (cbm) { const r2 = cl(cbm[0] * r + cbm[1] * g2 + cbm[2] * b), g3 = cl(cbm[3] * r + cbm[4] * g2 + cbm[5] * b), b2 = cl(cbm[6] * r + cbm[7] * g2 + cbm[8] * b); r = r2; g2 = g3; b = b2; }
    return 0.2126 * r + 0.7152 * g2 + 0.0722 * b; };
  const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const Ls = (y) => (y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y);
  const med = (a) => { a.sort((x, y) => x - y); return a[a.length >> 1]; };
  const out = [];
  for (const p of pts) {
    const r = Math.max(6, Math.round(p.r)), R = r + 8, x0 = Math.round(p.x - R), y0 = Math.round(p.y - R), w = 2 * R;
    const da = ga.getImageData(x0, y0, w, w).data, dh = gh.getImageData(x0, y0, w, w).data, dg = gg.getImageData(x0, y0, w, w).data;
    const m = new Uint8Array(w * w);
    for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) {
      if ((xx - R) * (xx - R) + (yy - R) * (yy - R) > r * r) continue;
      const i = (yy * w + xx) * 4;
      if (Math.abs(dh[i] - dg[i]) + Math.abs(dh[i + 1] - dg[i + 1]) + Math.abs(dh[i + 2] - dg[i + 2]) > 30) m[yy * w + xx] = 1;
    }
    const at = (xx, yy) => (xx < 0 || yy < 0 || xx >= w || yy >= w ? 0 : m[yy * w + xx]);
    const body = [], grd = []; let sil = 0;
    for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4;
      if (m[yy * w + xx]) { sil++; if (at(xx - 1, yy) && at(xx + 1, yy) && at(xx, yy - 1) && at(xx, yy + 1)) body.push(L(da, i)); continue; }
      let near = 99; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (at(xx + dx, yy + dy)) near = Math.min(near, Math.max(Math.abs(dx), Math.abs(dy)));
      if (near >= 2 && near <= 6) grd.push(L(da, i));
    }
    if (body.length < 6 || grd.length < 6) { out.push({ ...p, mask: body.length }); continue; }
    const bm = med(body), gm = med(grd);
    out.push({ ...p, mask: body.length, sil, body: +bm.toFixed(4), ground: +gm.toFixed(4), cr: +cr(bm, gm).toFixed(2), Lbody: +Ls(bm).toFixed(1), Lground: +Ls(gm).toFixed(1) });
  }
  return JSON.stringify(out);
})`;

// METHOD=wl6 (default, the gate): the same rule as scripts/wl6-measure.mjs for enemies: mask = every pixel inside r that changes when the
// creatures are removed (body, outline and its own glow), body = median luminance of the mask in shot A, ground = median of the same pixels
// in shot B (the frame without the creatures: their light pools go with them). METHOD=sil: silhouette core vs the ring around it (diagnostic).
const MEASURE_WL6 = `(async (b64, b64h, b64g, pts, cbm) => {
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
  await serve(process.env.DIST || 'dist'); let c = await launch();
  const rows = [];
  const sizes = (process.env.SIZES || 'desk').split(','), ts = (process.env.TS || '30,240,480,690,870').split(',').map(Number);
  const tiers = (process.env.TIERS || 'high,low').split(','), grounds = (process.env.GROUNDS || 'hollow,restored,corrupt').split(',');
  try {
    for (const view of sizes) for (const t of ts) for (const tier of tiers) for (const ground of grounds) {
      const [w, h, dpr] = VIEWS[view];
      const portrait = h > w;
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${GRANT}`, w, h, dpr, tier);
          await sleep(500); await stage(c, t, ground, 0, 900);
          // 5 wolves in a row (above the hero) + 3 Fell Wolves in a row (below), all held still; sim frozen so nothing drifts
          const POS = `(()=>{const a=window.__app,s=a.sim,p=s.player;s.enemies.length=0;for(let i=0;i<3;i++){s.spawnEnemy('wolf',p.x+(i-1)*${portrait ? 50 : 70},p.y+70);}
            for(const e of s.enemies){e.faceX=1;e.speed=0;e.tele=0;e.grace=99;e.state='run';e.hp=1e9;e.maxHp=1e9;e.flash=0;}
            const W=s.units.filter(u=>u.kind==='wolf');const sp=${portrait ? 32 : 60};W.forEach((u,i)=>{u.x=p.x+(i-(W.length-1)/2)*sp;u.y=p.y-70;u.faceX=1;u.target=null;u.atkCd=0;});a.scene.hitStop=1e9;for(const o of a.scene.children.list)if(o.aid!==undefined)o.hurtT=-9;s.time=${t};return W.length})()`;
          const nW = await c.ev(POS); await sleep(250); await c.ev(POS); await sleep(250);
          const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect(),k=R.width/wv.width*${dpr};
            const P=(x,y,r,kind)=>({kind,x:(R.left+(x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(y-wv.y)/wv.height*R.height)*${dpr},r:r*k});
            return JSON.stringify([...s.units.filter(u=>u.kind==='wolf'${process.env.NOSHADE ? '&&!u.shade' : ''}${process.env.SHADEONLY ? '&&u.shade' : ''}).map(u=>P(u.x,u.y-(u.r>6?4:1),u.r>6?15:9,'spirit')),...s.enemies.map(e=>P(e.x,e.y-3,e.r*1.6,'fell'))])})()`));
          const a = await png(c, process.env.KEEP ? join(out, `c-${view}-${fmt(t)}-${tier}-${ground}.png`) : null);
          await c.ev('(()=>{const S=window.__app.scene;S.__h=S.quality.caps.halos;S.quality.caps.halos=0;return 1})()'); await sleep(250);
          const hh = await png(c, null);
          await c.ev('(()=>{const s=window.__app.sim;s.enemies.length=0;for(const u of s.units)if(u.kind===\'wolf\')u.x+=9000;return 1})()'); await sleep(250);
          const b = await png(c, null);
          await c.ev('(()=>{const S=window.__app.scene;S.quality.caps.halos=S.__h;return 1})()');
          const res = {};
          for (const cb of Object.keys(CB)) res[cb] = JSON.parse(await c.ev(`(${process.env.METHOD === 'sil' ? MEASURE : MEASURE_WL6})(${JSON.stringify(a)}, ${JSON.stringify(hh)}, ${JSON.stringify(b)}, ${JSON.stringify(pts)}, ${JSON.stringify(CB[cb])})`));
          if (res.none.some((p) => p.mask < 6)) throw new Error('unrendered creature');
          const sp = (cb) => res[cb].filter((p) => p.kind === 'spirit'), fe = (cb) => res[cb].filter((p) => p.kind === 'fell');
          const med = (a2) => { const s2 = [...a2].sort((x, y) => x - y); return s2[s2.length >> 1]; };
          const row = { view, t, tier, ground, wolves: nW, minCR: Math.min(...sp('none').map((p) => p.cr)), medCR: med(sp('none').map((p) => p.cr)),
            gap: Object.fromEntries(Object.keys(CB).map((cb) => [cb, +(med(sp(cb).map((p) => p.Lbody)) - med(fe(cb).map((p) => p.Lbody))).toFixed(1)])),
            Lwolf: med(sp('none').map((p) => p.Lbody)), Lfell: med(fe('none').map((p) => p.Lbody)), Lground: med(sp('none').map((p) => p.Lground)) };
          rows.push(row); ok = true;
          console.log(JSON.stringify(row));
        } catch (e) { console.error('retry', view, t, tier, ground, e.message); try { c.close(); } catch { /* */ } await sleep(1200); c = await launch(); }
      }
    }
  } finally { writeFileSync(join(out, 'contrast.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
  const crMin = Math.min(...rows.map((r) => r.minCR)), gapMin = Math.min(...rows.flatMap((r) => Object.values(r.gap)));
  console.log(`SUMMARY cells ${rows.length}: wolf body vs ground contrast min ${crMin} (gate >= 3), wolf - Fell Wolf L* gap min ${gapMin} (gate >= 25, all CB sims)`);
}

async function occ(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); let c = null;
  const CROWD = [['wolf', 130, 60, 330], ['crow', 110, 50, 330], ['root_crawler', 50, 70, 330], ['stoat_piper', 8, 150, 200], ['puffback_toad', 10, 60, 200], ['bramble_hart', 4, 150, 220], ['wolf', 38, 330, 420]];
  const OCC = `(()=>{const S=window.__app.scene,s=window.__app.sim,p=s.player;const hb=S.heroOut.getBounds();const hd=60000+p.y;let en=0,wo=0,wAll=0;
    const hit=(b)=>b.right>hb.left&&b.left<hb.right&&b.bottom>hb.top&&b.top<hb.bottom;
    for(const e of s.enemies){if(e.dead)continue;const pl=S.pools[e.type];const r=pl&&pl.map.get(e.id);if(!r||!r.img.visible)continue;if(hit(r.img.getBounds())&&r.img.depth>hd&&r.img.alpha>0.6&&e.y>p.y)en++;}
    for(const r of S.pools.uWolfA.map.values()){if(!r.img.visible)continue;wAll++;if(hit(r.img.getBounds())&&r.img.depth>hd&&r.img.alpha>0.6)wo++;}
    for(const r of S.pools.uWolf.map.values()){if(!r.img.visible)continue;wAll++;if(hit(r.img.getBounds())&&r.img.depth>hd&&r.img.alpha>0.6)wo++;}
    return {en,wo,wAll,n:s.enemies.length}})()`;
  const res = {};
  try {
    for (const sm of ['', '&summons=0']) for (const view of ['desk', 'land', 'port']) {
      const [w, h, dpr] = VIEWS[view];
      if (c) { c.close(); cleanups.splice(cleanups.indexOf(c.close), 1); await sleep(1000); }
      c = await launch(); // a fresh Chrome per view: the 350-crowd page can stall software GL
      await open(c, `style=a&auto=wren&seed=7&god=1&t=690&grant=ghost_wolves:count=5,speed=5,power=5;raven_flock:count=3${sm}`, w, h, dpr, 'high');
      await sleep(500);
      for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
      await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xp=-1e9;s.bossSpawned=true;s.bossKilled=true;s.boss=null;s.time=690;p.x=2000;p.y=2000;a.scene.cameras.main.centerOn(2000,2000);l.decay=1e9;l.stamp(2000,2000,330,1);
        const M=${JSON.stringify(CROWD)};let k=0;for(const [ty,n,d0,d1] of M){for(let i=0;i<n;i++,k++){const an=(k*2.399)%6.2832,d=d0+((k*37)%Math.max(1,d1-d0));s.spawnEnemy(ty,p.x+Math.cos(an)*d*1.6,p.y+Math.sin(an)*d*0.95);}}return s.enemies.length})()`);
      await sleep(1500);
      const samp = [];
      for (let i = 0; i < 60; i++) { await autoPick(c); await c.ev('(()=>{const s=window.__app.sim;s.xp=-1e9;s.time=690;return 1})()'); samp.push(await c.ev(OCC)); await sleep(100); }
      const key = `${view}${sm ? '-old' : '-new'}`;
      const tot = samp.map((x) => x.en + x.wo);
      res[key] = { maxTotal: Math.max(...tot), meanTotal: +(tot.reduce((a, b) => a + b, 0) / tot.length).toFixed(2), maxWolf: Math.max(...samp.map((x) => x.wo)), meanWolf: +(samp.reduce((a, b) => a + b.wo, 0) / samp.length).toFixed(2), framesOver2: tot.filter((x) => x > 2).length, wolvesDrawn: samp[samp.length - 1].wAll, enemies: samp[samp.length - 1].n };
      console.log(key, JSON.stringify(res[key]));
    }
  } finally { writeFileSync(join(out, 'occluders.json'), JSON.stringify(res, null, 1)); cleanupAll(); }
}

async function bake(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist');
  const ms = [];
  try {
    for (let i = 0; i < 5; i++) {
      let c = null;
      for (let k = 0; k < 3 && !c; k++) { try { c = await launch(); } catch (e) { console.error('launch retry', e.message); await sleep(3000); } }
      if (!c) continue;
      await open(c, `style=a&auto=wren&seed=3&god=1&t=30&grant=${GRANT}`, 1280, 720, 1, 'high');
      for (let k = 0; k < 40; k++) { const r = await c.ev('JSON.stringify(window.__app.scene.sumArt)'); const o = JSON.parse(r); if (o.wolf || o.error) { ms.push([+o.wolfMs.toFixed(1), +o.wolfMainMs.toFixed(1)]); if (o.error) console.log('ERR', o.error); break; } await sleep(100); }
      c.close(); cleanups.splice(cleanups.indexOf(c.close), 1); await sleep(2500);
    }
  } finally { writeFileSync(join(out, 'bake.json'), JSON.stringify(ms)); cleanupAll(); }
  console.log('wolf bake ms [wall incl. async decode, main thread] (cold loads, headless):', JSON.stringify(ms));
}

async function probe(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=30&grant=${GRANT}`, 1280, 720, 1, 'high');
    await sleep(500); await stage(c, 30, 'hollow', 0, 1500);
    console.log(await c.ev(`(()=>{const S=window.__app.scene,s=window.__app.sim;const k={};for(const u of s.units)k[u.kind]=(k[u.kind]||0)+1;const vis=[...S.pools.uWolfA.map.values()].map(r=>({f:r.img.frame.name,x:r.img.x|0,y:r.img.y|0,a:r.img.alpha,s:+r.img.scaleX.toFixed(3),d:r.img.depth|0,v:r.img.visible}));
      return JSON.stringify({st:s.state,hs:S.hitStop,t:s.time,p:[s.player.x|0,s.player.y|0],k,art:S.sumArt,old:S.pools.uWolf.map.size,vis,wolves:s.units.filter(u=>u.kind==='wolf').map(u=>[u.x|0,u.y|0,u.hidden])})})()`));
    console.log(await c.ev(`(()=>{const S=window.__app.scene;const r=[...S.pools.uWolfA.map.values()][0];const i=r&&r.img;const cam=S.cameras.main;return JSON.stringify({pipe:i&&i.pipeline&&i.pipeline.name,post:i&&(i.postPipelines||[]).map(p=>p.name),tint:i&&[i.tintTopLeft,i.tintFill,i.blendMode],camPost:(cam.postPipelines||[]).map(p=>p.name),camFx:cam.postFX&&cam.postFX.list.map(f=>f.type||f.constructor.name),tier:S.quality.tier})})()`));
    console.log(await c.ev(`(()=>{const o=[];for(const e of document.querySelectorAll('body *')){const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;const r=e.getBoundingClientRect();if(r.width>600&&r.height>300&&(cs.backdropFilter!=='none'||parseFloat(cs.opacity)>0&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'))o.push([e.id,e.className,cs.backdropFilter,cs.backgroundColor,cs.opacity]);}return JSON.stringify(o)})()`));
    console.log('BIG', await c.ev(`(()=>{const S=window.__app.scene;const o=[];for(const g of S.children.list){if(!g.visible||(g.alpha??1)<=0)continue;const w=g.displayWidth||g.width||0,h=g.displayHeight||g.height||0;if((g.depth>=60000||g.depth<0)&&(w>300||g.type==='Graphics'||g.type==='RenderTexture'))o.push([g.type,(g.texture&&g.texture.key)||'',Math.round(g.depth),Math.round(w),Math.round(h),g.blendMode,+(g.alpha??1).toFixed(2),g.scrollFactorX]);}return JSON.stringify(o)})()`));
    for (let i = 0; i < 3; i++) { await sleep(500); console.log(await c.ev(`(()=>{const S=window.__app.scene,s=window.__app.sim;return JSON.stringify({fr:S.game.loop.frame,t:s.time,w:s.units.filter(u=>u.kind==='wolf').map(u=>[u.x|0,u.y|0]).slice(0,2),p:[s.player.x|0,s.player.y|0],vis:document.visibilityState})})()`)); }
    const r = await c.ev(`(()=>{const S=window.__app.scene;return S.sumAtlas.cv.toDataURL('image/png')})()`);
    writeFileSync(join(out, 'atlas.png'), Buffer.from(r.split(',')[1], 'base64'));
  } finally { cleanupAll(); }
}

async function bisect(out) {
  await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${process.env.T || 30}&grant=${GRANT}`, 1280, 720, 1, 'high');
    await sleep(500); await stage(c, Number(process.env.T || 30), 'hollow', 0, 1200);
    await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player;s.units.filter(u=>u.kind==='wolf').forEach((u,i)=>{u.x=p.x-120+i*60;u.y=p.y-70;u.faceX=1;u.target=null;});a.scene.hitStop=1e9;return 1})()`);
    await sleep(300);
    const box = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView;const u=s.units.filter(u=>u.kind==='wolf')[2];return JSON.stringify({x:(u.x-wv.x)/wv.width*1280,y:(u.y-wv.y)/wv.height*720})})()`));
    const meas = async (tag) => { await sleep(200); const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: box.x - 20, y: box.y - 20, width: 40, height: 30, scale: 1 } });
      writeFileSync(join(out, tag + '.png'), Buffer.from(r.data, 'base64')); console.log('clip', tag); };
    mkdirSync(out, { recursive: true });
    await meas('0-base');
    await c.ev('(()=>{const S=window.__app.scene;if(S.bloom){S.cameras.main.postFX.remove(S.bloom);S.bloom=null;}S.params0=1;return 1})()'); await meas('1-nobloom');
    await c.ev('(()=>{const S=window.__app.scene;S.vig.setVisible(false);return 1})()'); await meas('2-novig');
    await c.ev('(()=>{const S=window.__app.scene;for(const g of S.children.list)if(g.type==="Graphics"&&g.depth>60000)g.setVisible(false);return 1})()'); await meas('3-nogfx');
    await c.ev('(()=>{const S=window.__app.scene;S.pools.haloU.map.forEach(r=>r.img.setVisible(false));S.haloHide=1;return 1})()'); await meas('4-nohalo');
  } finally { cleanupAll(); }
}

const [cmd, out] = process.argv.slice(2);
const fn = { shots, contrast, occ, bake, probe, bisect }[cmd];
if (!fn || !out) { console.log('usage: node scripts/s1-wolf.mjs shots|contrast|occ|bake <outDir>'); process.exit(1); }
try { await fn(out); } catch (e) { console.error(e); cleanupAll(); process.exitCode = 1; }
