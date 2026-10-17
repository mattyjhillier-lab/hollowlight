// WL6 measurement harness on the REAL build (no runtime override; the arc and night look are in src/). Reads dist/ (npm run build first).
// Own Chrome process (debug port 9483), own static server (4201); closes only what it opened. Headless Chrome, software GL, so timings are not perf data (use scripts/pace.mjs).
//   node scripts/wl6-measure.mjs shots   <outDir>            true-size + phone frames at the 5 moments (Wren/Elias, swarm), JPEG
//   node scripts/wl6-measure.mjs contrast <outDir>           contrast gates G1/G2/G3: 5 moments x 3 enemy types x 3 distances x tier x size -> contrast.csv/json
//   node scripts/wl6-measure.mjs strip    <outDir>           4-frame strip per moment (0:30, 4:00, 8:00) showing eye motion (WL6b2), zoomed crop around the hero
//   node scripts/wl6-measure.mjs vib      <outDir>           WL6c vibrancy: restored meadow with vibrancy on vs the same spot with ?vib=0 at 4:00 / 8:00 / 11:30 / 14:30 (desk + phone), mean chroma of ground+props vs enemy interiors
//   node scripts/wl6-measure.mjs settings <outDir>           Settings > Picture screenshots (desktop + phone)
// env: DIST (default dist), TIERS (high,low), SIZES (desk,land,port), TS (30,240,480,690,870), BRIGHT (normal|brighter|clear|auto, default normal), PARAMS (extra url query), ONLY (name filter), HERO.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9483, HTTP = 4201;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const GRANT = 'holy_orbit:power=3;ghost_wolves:speed=3,power=3';
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const MOMENTS = [[30, 40, 0], [240, 90, 220], [480, 150, 330], [690, 170, 460], [870, 160, 620]]; // [t, swarm size, restored radius]
const fmt = (t) => `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}`;

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-wl6-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch { /* ignore */ } try { proc.kill(); } catch { /* ignore */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } }, 1500); };
  return { send, ev, close };
}

const BRIGHT = process.env.BRIGHT || 'normal';
async function open(c, query, w, h, dpr, tier) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}${process.env.PARAMS ? '&' + process.env.PARAMS : ''}` });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try {
      if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) {
        await c.ev(`window.__app.save.setSettings({quality:'${tier}',brightness:'${BRIGHT}'}); true`);
        return;
      }
    } catch { /* loading */ }
  }
  throw new Error('run did not start: ' + query);
}
const q = (hero, t) => `style=a&auto=${hero}&seed=3&god=1&debug=0&t=${t}&grant=${GRANT}`;
const shot = async (c, file, jpg = true) => { const r = await c.send('Page.captureScreenshot', { format: jpg ? 'jpeg' : 'png', ...(jpg ? { quality: 84 } : {}) }); if (file) writeFileSync(file, Buffer.from(r.data, 'base64')); return r.data; };
const setup = (c, x, y, t, R) => c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;s.time=${t};p.x=${x};p.y=${y};a.scene.cameras.main.centerOn(${x},${y});l.decay=1e9;
  const R=${R};if(R>0){l.stamp(${x},${y},R,1);l.stamp(${x}+R*0.9,${y}-R*0.4,R*0.6,1);l.stamp(${x}-R*0.8,${y}+R*0.5,R*0.5,1);}return 1})()`);
const holdTime = (c, t) => c.ev(`(()=>{window.__app.sim.time=${t};return 1})()`);
const inject = (c, n, minD, maxD) => c.ev(`(()=>{const s=window.__app.sim;const T=['wolf','crow','root_crawler'];let k=0;while(s.enemies.length<${n}){const a=(k*2.399)%6.2832,d=${minD}+((k*37)%${maxD - minD});s.spawnEnemy(T[k%3],s.player.x+Math.cos(a)*d*1.5,s.player.y+Math.sin(a)*d*0.9);k++;}return s.enemies.length})()`);
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
async function settle(c, t) {
  for (let i = 0; i < 20; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await holdTime(c, t); await sleep(350); await holdTime(c, t);
}

async function shots(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  const only = process.env.ONLY;
  try {
    const jobs = [];
    const tiers = (process.env.TIERS || 'high').split(',');
    const heroes = (process.env.HERO || 'wren,elias').split(',');
    for (const [t, n, rr] of MOMENTS) {
      for (const tier of tiers) for (const hero of heroes) jobs.push([hero, 'desk', tier, t, n, rr]);
      jobs.push(['wren', 'land', tiers[0], t, n, rr]);
      jobs.push(['elias', 'port', tiers[0], t, n, rr]);
    }
    for (const [hero, view, tier, t, n, rr] of jobs) {
      const name = `${BRIGHT}-${fmt(t)}-${hero}-${view}-${tier}.jpg`;
      if (only && !name.includes(only)) continue;
      const [w, h, dpr] = VIEWS[view];
      await open(c, q(hero, t), w, h, dpr, tier);
      await sleep(600); await setup(c, 2000, 2000, t, rr); await sleep(1400);
      await autoPick(c); await inject(c, n, 40, 330); await sleep(250); await autoPick(c);
      await settle(c, t);
      await shot(c, join(out, name));
      console.log('shot', name);
    }
  } finally { c.close(); srv.close(); }
}

// ---- contrast ----
const MEASURE = `(async (b64, b64g, pts, dpr) => {
  const load = (b) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; });
  const [im, ig] = await Promise.all([load(b64), load(b64g)]);
  const mk = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); return g; };
  const g = mk(im), gg = mk(ig);
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (d, i) => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
  const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const Ls = (y) => (y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y);
  const out = [];
  for (const p of pts) {
    const r = Math.max(6, Math.round(p.r * 1.5 * dpr)); const x0 = Math.round(p.x * dpr - r), y0 = Math.round(p.y * dpr - r), w = 2 * r;
    const d = g.getImageData(x0, y0, w, w).data, dg = gg.getImageData(x0, y0, w, w).data;
    const body = [], grd = []; let dark = 0;
    for (let i = 0; i < d.length; i += 4) {
      const b = L(dg, i); grd.push(b);
      const diff = Math.abs(d[i] - dg[i]) + Math.abs(d[i + 1] - dg[i + 1]) + Math.abs(d[i + 2] - dg[i + 2]);
      if (diff > 12) { body.push(L(d, i)); if (d[i] < 12 && d[i + 1] < 12 && d[i + 2] < 12) dark++; }
    }
    if (!body.length) { out.push({ ...p, mask: 0 }); continue; }
    body.sort((a, b) => a - b); grd.sort((a, b) => a - b);
    const ground = grd[grd.length >> 1]; const bm = body[body.length >> 1]; const peak = body[Math.max(0, body.length - 3)];
    out.push({ ...p, mask: body.length, dark, ground: +ground.toFixed(4), body: +bm.toFixed(4), peak: +peak.toFixed(4), eyeCR: +cr(peak, ground).toFixed(2), bodyCR: +cr(bm, ground).toFixed(2), dL: +(Ls(bm) - Ls(ground)).toFixed(1) });
  }
  return JSON.stringify(out);
})`;

async function contrast(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  const rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const t of (process.env.TS || '30,240,480,690,870').split(',').map(Number)) for (const tier of (process.env.TIERS || 'high,low').split(',')) {
      const [w, h, dpr] = VIEWS[view];
      const portrait = h > w;
      await open(c, q('wren', t), w, h, dpr, tier);
      await sleep(600); await setup(c, 2600, 2600, t, 0); await sleep(1200);
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player;s.enemies.length=0;const T=['wolf','crow','root_crawler'];
        for(let i=0;i<3;i++)for(let j=0;j<3;j++){s.spawnEnemy(T[i],p.x+100,p.y);s.enemies[s.enemies.length-1]._va=i*3+j;}return s.enemies.length})()`);
      const POS = `(()=>{const s=window.__app.sim,p=s.player;const D=[70,140,220];s.enemies=s.enemies.filter(e=>e._va!=null);for(const e of s.enemies){const i=(e._va/3)|0,j=e._va%3;
        ${portrait ? 'e.x=p.x-80+i*80;e.y=p.y+D[j];' : 'e.x=p.x+D[j];e.y=p.y-70+i*70;'}e.faceX=-1;e.speed=0;e.tele=0;e.hp=1e9;e.maxHp=1e9;e.flash=0;e.bleedT=0;e.burnT=0;}s.time=${t};return s.enemies.length})()`;
      for (let i = 0; i < 8; i++) { await c.ev(POS); await sleep(50); }
      await c.ev(POS); await sleep(60);
      const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();const D=[70,140,220];return JSON.stringify(s.enemies.filter(e=>e._va!=null).map(e=>({type:e.type,dist:D[e._va%3],x:R.left+(e.x-wv.x)/wv.width*R.width,y:R.top+(e.y-wv.y)/wv.height*R.height,r:e.r*R.width/wv.width*1.05})))})()`));
      const b64 = await shot(c, process.env.KEEP ? join(out, `contrast-${view}-${fmt(t)}-${tier}.png`) : null, false);
      await c.ev('(()=>{window.__app.sim.enemies.length=0;return 1})()'); await sleep(150);
      const b64g = (await c.send('Page.captureScreenshot', { format: 'png' })).data;
      const res = JSON.parse(await c.ev(`(${MEASURE})(${JSON.stringify(b64)}, ${JSON.stringify(b64g)}, ${JSON.stringify(pts)}, ${dpr})`));
      for (const r of res) rows.push({ view, t, tier, type: r.type, dist: r.dist, mask: r.mask, ground: r.ground, body: r.body, peak: r.peak, eyeCR: r.eyeCR, bodyCR: r.bodyCR, dL: r.dL, dark: r.dark });
      console.log('contrast', view, fmt(t), tier);
    }
  } finally { c.close(); srv.close(); }
  writeFileSync(join(out, 'contrast.json'), JSON.stringify(rows, null, 1));
  writeFileSync(join(out, 'contrast.csv'), ['view,t,tier,type,dist,mask,ground,body,peak,eyeCR,bodyCR,dL,darkPx', ...rows.map((r) => [r.view, r.t, r.tier, r.type, r.dist, r.mask, r.ground, r.body, r.peak, r.eyeCR, r.bodyCR, r.dL, r.dark].join(','))].join('\n'));
  // gate summary
  const ok = (r) => r.mask > 0 && (r.eyeCR >= 3 || Math.abs(r.dL) >= 6);
  const strict = (r) => (r.t >= 690 ? r.mask > 0 && Math.abs(r.dL) >= 6 : ok(r));
  const sum = (f, flt = () => true) => { const a = rows.filter(flt); return `${a.filter(f).length}/${a.length}`; };
  const lines = [`BRIGHT=${BRIGHT} PARAMS=${process.env.PARAMS || ''}`, `G1|G2 (eyes>=3:1 OR |dL*|>=6): all ${sum(ok)}, outside pool(220) ${sum(ok, (r) => r.dist === 220)}, inside(70) ${sum(ok, (r) => r.dist === 70)}`, `strict (>=11:30 needs silhouette): ${sum(strict)}`];
  for (const view of new Set(rows.map((r) => r.view))) for (const tier of new Set(rows.map((r) => r.tier))) lines.push(`${view} ${tier}: ${sum(ok, (r) => r.view === view && r.tier === tier)}`);
  lines.push(`G3 enemy pixels below RGB 12: ${rows.reduce((a, r) => a + (r.dark || 0), 0)}`);
  lines.push('strict misses: ' + rows.filter((r) => !strict(r)).map((r) => `${r.view}/${r.tier}/${fmt(r.t)}/${r.type[0]}${r.dist}(eye ${r.eyeCR}, dL ${r.dL})`).join('; '));
  lines.push('misses: ' + rows.filter((r) => !ok(r)).map((r) => `${r.view}/${r.tier}/${fmt(r.t)}/${r.type[0]}${r.dist}(eye ${r.eyeCR}, dL ${r.dL}${r.mask ? '' : ', NO MASK'})`).join('; '));
  writeFileSync(join(out, 'summary.txt'), lines.join('\n'));
  console.log(lines.join('\n'));
}


async function strip(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    for (const [t, n, rr] of [[30, 40, 0], [240, 70, 220], [480, 110, 330]]) {
      const [w, h, dpr] = VIEWS.desk;
      await open(c, q('wren', t), w, h, dpr, 'high');
      await sleep(600); await setup(c, 2000, 2000, t, rr); await sleep(1200);
      await autoPick(c); await inject(c, n, 50, 240); await sleep(250); await autoPick(c);
      await settle(c, t);
      await c.ev("(()=>{window.__app.sim.player.speed=0;return 1})()");
      const frames = [];
      for (let k = 0; k < 4; k++) {
        for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(60); }
        await c.ev("(()=>{const s=window.__app.sim;s.xpNeeded=1e9;s.state==='running'&&(s.player.hp=s.player.maxHp);return 1})()");
        const clip = { x: w / 2 - 230, y: h / 2 - 130, width: 460, height: 260, scale: 2 };
        const r = await c.send('Page.captureScreenshot', { format: 'png', clip });
        frames.push(r.data);
        await sleep(700);
      }
      const sheet = await c.ev(`(async (fr) => { const ims = await Promise.all(fr.map((b) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; })));
        const cv = document.createElement('canvas'); cv.width = ims[0].width * 2; cv.height = ims[0].height * 2; const g = cv.getContext('2d');
        ims.forEach((i, k) => g.drawImage(i, (k % 2) * i.width, ((k / 2) | 0) * i.height)); return cv.toDataURL('image/jpeg', 0.85).split(',')[1]; })(${JSON.stringify(frames)})`);
      writeFileSync(join(out, `eye-strip-${fmt(t)}.jpg`), Buffer.from(sheet, 'base64'));
      writeFileSync(join(out, `after-${fmt(t)}-wren-desk-high.jpg`), Buffer.from((await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 86 })).data, 'base64'));
      console.log('strip', fmt(t));
    }
  } finally { c.close(); srv.close(); }
}

// ---- WL6c vibrancy: same spot on/off, chroma of the restored world vs enemy interiors (enemies must be unchanged) ----
const CHROMA = `(async (b64, pts, box) => {
  const im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b64; });
  const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
  const chroma = (d) => { let s = 0, n = 0, y = 0; for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); s += mx - mn; y += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; } return [s / n, y / n]; };
  const gd = g.getImageData(box[0], box[1], box[2], box[3]).data; const [gc, gy] = chroma(gd);
  let es = 0, en = 0;
  for (const p of pts) { const r = Math.max(3, Math.round(p.r)); const d = g.getImageData(Math.round(p.x - r), Math.round(p.y - r), 2 * r, 2 * r).data; const [c] = chroma(d); es += c; en++; }
  return JSON.stringify({ ground: +gc.toFixed(2), groundY: +gy.toFixed(1), enemy: en ? +(es / en).toFixed(2) : 0 });
})`;

async function vibrancy(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  const rows = [];
  try {
    for (const [t, rr] of [[240, 330], [480, 330], [690, 460], [870, 620]]) for (const view of (process.env.SIZES || 'desk,port').split(',')) for (const mode of ['off', 'on']) {
      const [w, h, dpr] = VIEWS[view];
      await open(c, q('wren', t), w, h, dpr, process.env.TIER || 'high');
      if (mode === 'off') { await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${q('wren', t)}&vib=0` }); for (let i = 0; i < 80; i++) { await sleep(250); try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) break; } catch { /* loading */ } } await c.ev(`window.__app.save.setSettings({quality:'${process.env.TIER || 'high'}',brightness:'${BRIGHT}'}); true`); }
      await sleep(600); await setup(c, 2000, 2000, t, rr); await sleep(1500);
      await autoPick(c); await settle(c, t);
      await c.ev("(()=>{const s=window.__app.sim;s.enemies.length=0;return 1})()");
      await holdTime(c, t); await sleep(500); await holdTime(c, t);
      const ground = await shot(c, join(out, `meadow-${fmt(t)}-${view}-vib${mode}.jpg`));
      const gpng = (await c.send('Page.captureScreenshot', { format: 'png' })).data;
      // enemies: frozen ring of 12, then measure their interiors
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player;const T=['wolf','crow','root_crawler'];for(let k=0;k<12;k++){const a=k*0.5236,d=${h > w ? 70 : 80}+(k%3)*25;s.spawnEnemy(T[k%3],p.x+Math.cos(a)*d*(${h > w ? 0.6 : 1.4}),p.y+Math.sin(a)*d*(${h > w ? 1.4 : 0.8}));s.enemies[s.enemies.length-1]._va=k;}return s.enemies.length})()`);
      const FREEZE = `(()=>{const s=window.__app.sim;for(const e of s.enemies){if(e._va==null)continue;if(e._x===undefined){e._x=e.x;e._y=e.y;}e.x=e._x;e.y=e._y;e.speed=0;e.tele=0;e.hp=1e9;e.maxHp=1e9;e.flash=0;}s.time=${t};return 1})()`;
      for (let i = 0; i < 6; i++) { await c.ev(FREEZE); await sleep(60); }
      await c.ev(FREEZE);
      const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();return JSON.stringify(s.enemies.filter(e=>e._va!=null).map(e=>({x:(R.left+(e.x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(e.y-wv.y)/wv.height*R.height)*${dpr},r:e.r*0.5*R.width/wv.width*${dpr}})))})()`));
      const epng = (await c.send('Page.captureScreenshot', { format: 'png' })).data;
      // ground box: central band away from the HUD, in image pixels
      const box = [Math.round(w * dpr * 0.1), Math.round(h * dpr * 0.18), Math.round(w * dpr * 0.8), Math.round(h * dpr * 0.62)];
      const gm = JSON.parse(await c.ev(`(${CHROMA})(${JSON.stringify(gpng)}, [], ${JSON.stringify(box)})`));
      const em = JSON.parse(await c.ev(`(${CHROMA})(${JSON.stringify(epng)}, ${JSON.stringify(pts)}, [0,0,8,8])`));
      rows.push({ t, view, mode, groundChroma: gm.ground, groundY: gm.groundY, enemyChroma: em.enemy });
      void ground;
      console.log('vib', fmt(t), view, mode, gm.ground, em.enemy);
    }
  } finally { c.close(); srv.close(); }
  writeFileSync(join(out, 'vibrancy.json'), JSON.stringify(rows, null, 1));
  const lines = ['t,view,groundChroma_off,groundChroma_on,ratio,enemyChroma_off,enemyChroma_on'];
  for (const t of [240, 480, 690, 870]) for (const view of new Set(rows.map((r) => r.view))) {
    const a = rows.find((r) => r.t === t && r.view === view && r.mode === 'off'); const b = rows.find((r) => r.t === t && r.view === view && r.mode === 'on');
    if (a && b) lines.push([fmt(t), view, a.groundChroma, b.groundChroma, (b.groundChroma / a.groundChroma).toFixed(3), a.enemyChroma, b.enemyChroma].join(','));
  }
  writeFileSync(join(out, 'vibrancy.csv'), lines.join(String.fromCharCode(10)));
  console.log(lines.join(String.fromCharCode(10)));
}

async function settingsShots(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    for (const view of ['desk', 'port']) {
      const [w, h, dpr] = VIEWS[view];
      await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
      await c.send('Page.enable'); await c.send('Runtime.enable');
      await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?style=a` });
      for (let i = 0; i < 80; i++) { await sleep(250); try { if (await c.ev('!!(window.__app && window.__app.ui && window.__app.scene)')) break; } catch { /* loading */ } }
      await sleep(1200);
      await c.ev("(()=>{window.__app.ui.showSettings();return 1})()"); await sleep(500);
      await c.ev("(()=>{const b=[...document.querySelectorAll('[role=tab]')].find(x=>x.getAttribute('data-id')==='picture');if(b)b.click();return 1})()"); await sleep(400);
      await shot(c, join(out, `settings-picture-${view}.jpg`));
      await c.ev("(()=>{const o=[...document.querySelectorAll('.u4-seg__opt')].find(x=>x.getAttribute('data-v')==='brighter');if(o)o.click();return 1})()"); await sleep(300);
      await shot(c, join(out, `settings-picture-${view}-brighter.jpg`));
      console.log('settings', view);
    }
  } finally { c.close(); srv.close(); }
}

const [cmd, out] = process.argv.slice(2);
if (!cmd || !out) { console.error('usage: wl6-measure.mjs shots|contrast|strip|vib|settings <outDir>'); process.exit(1); }
if (cmd === 'shots') await shots(out);
else if (cmd === 'contrast') await contrast(out);
else if (cmd === 'vib') await vibrancy(out);
else if (cmd === 'strip') await strip(out);
else if (cmd === 'settings') await settingsShots(out);
process.exit(0);
