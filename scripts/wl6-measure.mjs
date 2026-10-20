// WL6 measurement harness on the REAL build (no runtime override; the arc and night look are in src/). Reads dist/ (npm run build first).
// Own Chrome process (debug port 9483), own static server (4201); closes only what it opened. Headless Chrome, software GL, so timings are not perf data (use scripts/pace.mjs).
//   node scripts/wl6-measure.mjs shots   <outDir>            true-size + phone frames at the 5 moments (Wren/Elias, swarm), JPEG
//   node scripts/wl6-measure.mjs contrast <outDir>           contrast gates G1/G2/G3 (WL6d full matrix): 5 moments x 3 enemy types x 3 distances x tier x size x ground (GROUNDS=hollow,restored,corrupt) x colour-blind sim (CBS=none,protan,deutan,tritan) -> <outDir>/cells.jsonl (resumable) + printed summary
//   node scripts/wl6-measure.mjs summary  <outDir>           re-read <outDir>/cells.jsonl (+ DIRS=a,b) and print/write the gate summary (summary.txt)
//   node scripts/wl6-measure.mjs strip    <outDir>           4-frame strip per moment (0:30, 4:00, 8:00) showing eye motion (WL6b2), zoomed crop around the hero
//   node scripts/wl6-measure.mjs vib      <outDir>           WL6c vibrancy: restored meadow with vibrancy on vs the same spot with ?vib=0 at 4:00 / 8:00 / 11:30 / 14:30 (desk + phone), mean chroma of ground+props vs enemy interiors
//   node scripts/wl6-measure.mjs settings <outDir>           Settings > Picture screenshots (desktop + phone)
// env: DIST (default dist), TIERS (high,low; use high,med,low), GROUNDS, CBS, SIZES (desk,land,port), TS (30,240,480,690,870), BRIGHT (normal|brighter|clear|auto, default normal), PARAMS (extra url query), ONLY (name filter), HERO.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { appendFileSync, mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const SLOT = Number(process.env.SLOT || 0); // parallel slices: SLOT=1,2 use other ports (run each with its own SIZES/TS, same outDir is fine)
const PORT = 9483 + SLOT, HTTP = 4201 + SLOT;
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
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; const to = setTimeout(() => { pending.delete(i); rej(new Error('cdp timeout: ' + method)); }, 90000); pending.set(i, { res: (v) => { clearTimeout(to); res(v); }, rej: (e) => { clearTimeout(to); rej(e); } }); ws.send(JSON.stringify({ id: i, method, params })); }); // 90 s timeout: a hung Chrome becomes a retry instead of a stuck run
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
// Colour-blindness simulation matrices (Machado et al. 2009, severity 1.0, applied to LINEAR RGB), used to re-measure eye/body contrast as a protan/deutan/tritan viewer would see it.
const CB = {
  none: null,
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
};
const NL = String.fromCharCode(10);
const MEASURE = `(async (b64, b64g, pts, dpr, cbm) => {
  const load = (b) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; });
  const [im, ig] = await Promise.all([load(b64), load(b64g)]);
  const mk = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); return g; };
  const g = mk(im), gg = mk(ig);
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const L = (d, i) => {
    let r = lin(d[i]), gg2 = lin(d[i + 1]), b = lin(d[i + 2]);
    if (cbm) { const r2 = cl(cbm[0] * r + cbm[1] * gg2 + cbm[2] * b), g2 = cl(cbm[3] * r + cbm[4] * gg2 + cbm[5] * b), b2 = cl(cbm[6] * r + cbm[7] * gg2 + cbm[8] * b); r = r2; gg2 = g2; b = b2; }
    return 0.2126 * r + 0.7152 * gg2 + 0.0722 * b;
  };
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

// Full matrix: view x moment x tier x ground (hollow | restored | corrupt) x colour-blind simulation, 3 enemy types x 3 distances per capture.
// Resumable: every finished capture is appended to <out>/cells.jsonl and skipped on the next run (RESUME=0 to redo); each capture retries up to 3 times with a fresh Chrome.
// env: SIZES, TS, TIERS (high,med,low), GROUNDS (hollow,restored,corrupt), CBS (none,protan,deutan,tritan), BRIGHT, DIST
// TYPES=a,b,c measures other enemy ids (exactly 3; EN3-EN5: TYPES=stoat_piper,puffback_toad,bramble_hart); default the batch 1 trio
const MTYPES = (() => { const t = (process.env.TYPES || 'wolf,crow,root_crawler').split(',').filter((x) => /^[a-z_]{1,32}$/.test(x)); return t.length === 3 ? t : ['wolf', 'crow', 'root_crawler']; })();
async function contrast(out) {
  mkdirSync(out, { recursive: true });
  const file = join(out, 'cells.jsonl');
  const done = new Set(); const rows = [];
  if (existsSync(file) && process.env.RESUME !== '0') for (const l of readFileSync(file, 'utf8').split(NL)) { if (!l.trim()) continue; const r = JSON.parse(l); rows.push(r); done.add(r.key); }
  const srv = await serve(process.env.DIST || 'dist'); let c = await launch();
  const grounds = (process.env.GROUNDS || 'hollow').split(','); const cbs = (process.env.CBS || 'none').split(',');
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const t of (process.env.TS || '30,240,480,690,870').split(',').map(Number)) for (const tier of (process.env.TIERS || 'high,low').split(',')) for (const ground of grounds) {
      const key = `${BRIGHT}|${view}|${t}|${tier}|${ground}`;
      if (done.has(key + '|' + cbs[0])) continue;
      const [w, h, dpr] = VIEWS[view];
      const portrait = h > w;
      let res = null;
      for (let attempt = 0; attempt < 3 && !res; attempt++) {
        try {
          await open(c, q('wren', t), w, h, dpr, tier);
          const cx = 2600, cy = 2600;
          await sleep(600); await setup(c, cx, cy, t, ground === 'restored' ? 420 : 0); await sleep(1200);
          if (process.env.DENS) await c.ev(`(()=>{const d=window.__app.scene.dens;if(d){d.update=function(){return d.k;};d.k=${Number(process.env.DENS) || 1};}return 1})()`); // DR3: pin the crowd-density value (1 = thick crowd: common enemies drawn 20% quieter) to measure the worst case; ignored by builds without the density rule
          if (ground === 'corrupt') await c.ev(`(()=>{const l=window.__app.scene.life;for(let k=0;k<4;k++)l.stampCorr(${cx},${cy},460,1);return 1})()`);
          await c.ev(`(()=>{const s=window.__app.sim,p=s.player;s.enemies.length=0;const T=${JSON.stringify(MTYPES)};
            for(let i=0;i<3;i++)for(let j=0;j<3;j++){s.spawnEnemy(T[i],p.x+100,p.y);s.enemies[s.enemies.length-1]._va=i*3+j;}return s.enemies.length})()`);
          const POS = `(()=>{const s=window.__app.sim,p=s.player;const D=[70,140,220];s.enemies=s.enemies.filter(e=>e._va!=null);for(const e of s.enemies){const i=(e._va/3)|0,j=e._va%3;
            ${portrait ? 'e.x=p.x-80+i*80;e.y=p.y+D[j];' : 'e.x=p.x+D[j];e.y=p.y-70+i*70;'}e.faceX=-1;e.speed=0;e.tele=0;e.grace=99;e.state='run';e.hp=1e9;e.maxHp=1e9;e.flash=0;e.bleedT=0;e.burnT=0;}for(const o of window.__app.scene.children.list)if(o.aid!==undefined)o.hurtT=-9;s.time=${t + 0.37 * attempt};return s.enemies.length})()`;
          // POS also ends the Husk hurt frame: the harness holds the sim clock, so a hit taken while staging kept the 0.14 s hurt squint on forever
          for (let i = 0; i < 8; i++) { await c.ev(POS); await sleep(50); }
          await c.ev(POS); await sleep(60);
          const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();const D=[70,140,220];return JSON.stringify(s.enemies.filter(e=>e._va!=null).map(e=>({type:e.type,dist:D[e._va%3],x:R.left+(e.x-wv.x)/wv.width*R.width,y:R.top+(e.y-wv.y)/wv.height*R.height,r:e.r*R.width/wv.width*1.05})))})()`));
          const b64 = await shot(c, process.env.KEEP ? join(out, `contrast-${view}-${fmt(t)}-${tier}-${ground}.png`) : null, false);
          await c.ev('(()=>{window.__app.sim.enemies.length=0;return 1})()'); await sleep(150);
          const b64g = (await c.send('Page.captureScreenshot', { format: 'png' })).data;
          res = {};
          for (const cb of cbs) res[cb] = JSON.parse(await c.ev(`(${MEASURE})(${JSON.stringify(b64)}, ${JSON.stringify(b64g)}, ${JSON.stringify(pts)}, ${dpr}, ${JSON.stringify(CB[cb])})`));
          // a frame is only valid if every enemy rendered (mask > 0) and, for the unsimulated pass, no eye is caught mid-blink (a blink is 0.12 s of every >= 3 s, so
          // a miss that disappears at another held time is a harness frame, not a player-visible gap): retry at a shifted sim time (new blink phase), up to 2 times
          const bad = res[cbs[0]].some((x) => !x.mask || (x.eyeCR < 3 && Math.abs(x.dL) < 6));
          if (bad && attempt < 2 && !process.env.NO_BLINK_RETRY) throw new Error('retry: unrendered enemy or blink-dim eye in the frame');
        } catch (err) {
          console.error(`retry ${attempt + 1} for ${key}: ${err.message}`); res = null;
          if (!String(err.message).startsWith('retry:')) { try { c.close(); } catch { /* ignore */ } await sleep(1500); c = await launch(); }
        }
      }
      if (!res) { console.error('GAVE UP ' + key); continue; }
      for (const cb of cbs) {
        const r = { key: key + '|' + cb, bright: BRIGHT, view, t, tier, ground, cb, cells: res[cb].map((x) => ({ type: x.type, dist: x.dist, mask: x.mask, ground: x.ground, body: x.body, peak: x.peak, eyeCR: x.eyeCR, bodyCR: x.bodyCR, dL: x.dL, dark: x.dark })) };
        appendFileSync(file, JSON.stringify(r) + NL); rows.push(r); done.add(r.key);
      }
      console.log('contrast', view, fmt(t), tier, ground, cbs.join('/'));
    }
  } finally { try { c.close(); } catch { /* ignore */ } srv.close(); }
  console.log(summarise(rows).join(NL));
}

// ---- gate summary over cells.jsonl rows ----
const okCell = (t, x) => x.mask > 0 && (x.eyeCR >= 3 || Math.abs(x.dL) >= 6);
const strictCell = (t, x) => (t >= 690 ? x.mask > 0 && Math.abs(x.dL) >= 6 : okCell(t, x));
function summarise(rows) {
  const flat = [];
  const uniq = new Map(); for (const r of rows) uniq.set(r.key, r); // slices may overlap: last write wins
  for (const r of uniq.values()) for (const x of r.cells) flat.push({ ...x, bright: r.bright, view: r.view, t: r.t, tier: r.tier, ground: r.ground, cb: r.cb }); // run-level fields win over the cell's own luminance 'ground'
  const cnt = (flt, f = okCell) => { const a = flat.filter(flt); return `${a.filter((x) => f(x.t, x)).length}/${a.length}`; };
  const L = [`cells: ${flat.length}`];
  L.push(`G1|G2 (eyes>=3:1 OR |dL*|>=6) all: ${cnt(() => true)}; strict daylight reading: ${cnt(() => true, strictCell)}`);
  for (const k of ['bright', 'view', 'tier', 'ground', 'cb', 't']) for (const v of new Set(flat.map((x) => x[k]))) L.push(`  ${k}=${v}: ${cnt((x) => x[k] === v)} (strict ${cnt((x) => x[k] === v, strictCell)})`);
  L.push(`G1 eyes alone >= 3:1 (moments up to 8:00): ${cnt((x) => x.t <= 480, (t, x) => x.mask > 0 && x.eyeCR >= 3)}`);
  L.push(`G3 enemy pixels below RGB 12: ${flat.reduce((a, x) => a + (x.dark || 0), 0)}`);
  const miss = flat.filter((x) => !okCell(x.t, x));
  L.push('misses: ' + (miss.map((x) => `${x.bright}/${x.view}/${x.tier}/${fmt(x.t)}/${x.ground}/${x.cb}/${x.type[0]}${x.dist}(eye ${x.eyeCR}, dL ${x.dL}${x.mask ? '' : ', NO MASK'})`).join('; ') || 'none'));
  const sm = flat.filter((x) => !strictCell(x.t, x));
  L.push('strict misses: ' + (sm.map((x) => `${x.bright}/${x.view}/${x.tier}/${fmt(x.t)}/${x.ground}/${x.cb}/${x.type[0]}${x.dist}(eye ${x.eyeCR}, dL ${x.dL})`).join('; ') || 'none'));
  return L;
}

// node scripts/wl6-measure.mjs summary <outDir>  (extra dirs via DIRS=a,b): re-reads cells.jsonl and prints/writes the gate summary (summary.txt)
async function summary(out) {
  const rows = [];
  for (const d of [out, ...(process.env.DIRS ? process.env.DIRS.split(',') : [])]) {
    const f = join(d, 'cells.jsonl');
    if (existsSync(f)) for (const l of readFileSync(f, 'utf8').split(NL)) if (l.trim()) rows.push(JSON.parse(l));
  }
  const lines = summarise(rows);
  writeFileSync(join(out, 'summary.txt'), lines.join(NL));
  console.log(lines.join(NL));
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
if (!cmd || !out) { console.error('usage: wl6-measure.mjs shots|contrast|summary|strip|vib|settings <outDir>'); process.exit(1); }
if (cmd === 'shots') await shots(out);
else if (cmd === 'contrast') await contrast(out);
else if (cmd === 'vib') await vibrancy(out);
else if (cmd === 'summary') await summary(out);
else if (cmd === 'strip') await strip(out);
else if (cmd === 'settings') await settingsShots(out);
process.exit(0);
