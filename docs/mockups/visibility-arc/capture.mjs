// W6 VISIBILITY + VIBRANCY ARC mock-up capture (design only; edits NOTHING in src/).
// Renders the REAL dev build (a snapshot of dist/index.html) in headless Chrome over CDP and applies the proposed
// arc as a RUNTIME debug override injected from this script (ambient, Low tint, lantern radius, far-enemy tint,
// eye glow, rim, saturation). Saturation is a whole-camera colour matrix here (mock only; the design applies it
// to restored layers only). Own Chrome process + own port + own static server; closes only what it opened.
//   node docs/mockups/visibility-arc/capture.mjs <distDir> <outDir> [frames|contrast|all]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9481, HTTP = 4199;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const GRANT = 'holy_orbit:power=3;ghost_wolves:speed=3,power=3';

// ---- the proposed arcs: [tSec, ambient (Med/High lightmap), Low multiply tint, lantern radius, far body value,
//      eye alpha, rim alpha, saturation of restored world, dawn wash alpha]
export const ARCS = {
  A: [
    [0, 0x222b54, 0x6c76aa, 150, 0.40, 1.0, 0.85, 0.80, 0],
    [180, 0x242e5a, 0x707cb0, 150, 0.40, 1.0, 0.85, 0.82, 0],
    [300, 0x2c3868, 0x7c8abc, 145, 0.45, 1.0, 0.75, 0.88, 0],
    [480, 0x3c4a80, 0x8e9cc8, 140, 0.55, 0.9, 0.6, 0.95, 0],
    [600, 0x56609a, 0xa4acd4, 135, 0.58, 0.75, 0.35, 1.0, 0],
    [690, 0x7a74a8, 0xbeb4d6, 130, 0.48, 0.7, 0, 1.08, 0.04],
    [780, 0xa8889c, 0xdcc0c4, 130, 0.55, 0.55, 0, 1.16, 0.10],
    [870, 0xe0b8a8, 0xf2dccc, 130, 0.68, 0.4, 0, 1.26, 0.20],
    [900, 0xffe2c4, 0xfff0dc, 130, 0.75, 0.3, 0, 1.30, 0.30],
  ],
  B: [
    [0, 0x404e84, 0x8a98d0, 140, 0.85, 0.7, 0, 0.85, 0],
    [300, 0x46548a, 0x909ed4, 135, 0.85, 0.65, 0, 0.9, 0],
    [600, 0x60689e, 0xa8b0d8, 130, 0.88, 0.5, 0, 1.0, 0],
    [780, 0xa8889c, 0xdcc0c4, 130, 0.9, 0.35, 0, 1.12, 0.10],
    [900, 0xffe2c4, 0xfff0dc, 130, 0.92, 0.25, 0, 1.25, 0.30],
  ],
  C: [
    [0, 0x0e1226, 0x4a5078, 165, 0.10, 1.0, 0, 0.75, 0],
    [300, 0x161c3a, 0x56608a, 160, 0.14, 1.0, 0, 0.8, 0],
    [480, 0x242e5a, 0x707cb0, 150, 0.25, 1.0, 0.2, 0.9, 0],
    [600, 0x3c4a80, 0x8e9cc8, 140, 0.45, 0.9, 0.2, 1.0, 0],
    [690, 0x6a6a9c, 0xb0acd0, 130, 0.62, 0.7, 0.1, 1.08, 0.04],
    [780, 0xa8889c, 0xdcc0c4, 130, 0.80, 0.5, 0, 1.16, 0.10],
    [900, 0xffe2c4, 0xfff0dc, 130, 0.92, 0.25, 0, 1.30, 0.30],
  ],
};

function serve(dir, port) {
  const root = resolve(dir);
  const srv = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = resolve(join(root, p));
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(port, '127.0.0.1', () => r(srv)));
}

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-va-'));
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

async function open(c, url, w, h, dpr, tier) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) { if (tier) await c.ev(`window.__app.save.setSettings({quality:'${tier}'}); true`); return; } } catch { /* loading */ }
  }
  throw new Error('run did not start: ' + url);
}

// In-page override (debug only; never shipped). Keyframes come from ARCS; cfg = { K, rim, eyes, sat, t }.
const OVERRIDE = `window.__VA = function (cfg) {
  const a = window.__app, sc = a.scene, s = a.sim;
  const lerp = (x, y, t) => x + (y - x) * t;
  const lerpC = (c1, c2, t) => ((lerp(c1 >> 16 & 255, c2 >> 16 & 255, t) | 0) << 16) | ((lerp(c1 >> 8 & 255, c2 >> 8 & 255, t) | 0) << 8) | (lerp(c1 & 255, c2 & 255, t) | 0);
  const at = (K, ts) => { let i = 1; while (i < K.length - 1 && ts > K[i][0]) i++; const p = K[i - 1], q = K[i]; const t = Math.max(0, Math.min(1, (ts - p[0]) / (q[0] - p[0])));
    return { amb: lerpC(p[1], q[1], t), low: lerpC(p[2], q[2], t), lan: lerp(p[3], q[3], t), farV: lerp(p[4], q[4], t), eyeA: lerp(p[5], q[5], t), rimA: lerp(p[6], q[6], t), sat: lerp(p[7], q[7], t), dawn: lerp(p[8], q[8], t) }; };
  if (sc.__va) { sc.__va.cfg = cfg; return 1; }
  const st = { hide: false, cfg, k: null, eyes: [], cores: [], rims: {} };
  sc.__va = st;
  const ADD = 1;
  const gi = sc.pools.haloC.inv;
  const EYE = { wolf: [[6.2, -1.6]], crow: [[3.9, -1.2]], root_crawler: [[-2, -0.8], [2.2, -0.8]] };
  const oG = sc.updateGrade;
  sc.updateGrade = function (f) {
    oG.call(this, f);
    const K = st.cfg && st.cfg.K; if (!K) { st.k = null; return; }
    const k = at(K, (st.cfg.t != null ? st.cfg.t : f * 900)); st.k = k;
    this.ambient = k.amb;
    if (!this.lmOn) { this.gradeTint = -1; this.setGround(k.low); }
    if (this.lmOn && k.dawn > 0) this.dawn.setVisible(true).setAlpha(k.dawn); else this.dawn.setVisible(false);
  };
  const lm = sc.lm, oA = lm.add.bind(lm);
  lm.add = function (x, y, r, col, al) { if (st.k && col === 0xffcf7a && r > 80) r = r / 130 * st.k.lan; return oA(x, y, r, col, al); };
  const cam = sc.cameras.main;
  const getEye = (arr, i, tint, key) => { let im = arr[i]; if (!im) { im = sc.add.image(0, 0, key).setBlendMode(ADD).setTint(tint); arr[i] = im; } im.setVisible(true); return im; };
  const oD = sc.draw;
  sc.draw = function () {
    oD.call(this);
    let ne = 0; const nr = {};
    const k = st.k;
    if (k) {
      if (st.cfg.sat !== false && this.renderer.type === 1 && cam.postFX) {
        if (!st.cm) st.cm = cam.postFX.addColorMatrix();
        st.cm.reset(); st.cm.saturate(k.sat - 1);
      }
      const p = s.player, R = k.lan, inner = R * 0.75, outer = R * 1.25;
      const lowT = this.quality.tier === 'low';
      const eyeCap = lowT ? 40 : this.quality.tier === 'med' ? 120 : 200;
      for (let pass = 0; pass < 2; pass++) for (const e of s.enemies) {
        const pool = this.pools[e.type]; if (!pool) continue;
        const ent = pool.map.get(e.id); if (!ent || ent.stamp !== pool.stamp) continue;
        const img = ent.img;
        const dx = e.x - p.x, dy = e.y - (p.y - 4), d = Math.sqrt(dx * dx + dy * dy);
        if ((pass === 0) !== (d < R * 1.8)) continue; // near band first, so caps keep the closest
        if (e.boss) { if (pass === 0 || d >= R * 1.8) { img.setTint(0xffffff); img.tq = -1; } continue; }
        const lit = Math.max(0, Math.min(1, (outer - d) / (outer - inner)));
        if (e.flash > 0 || e.bleedT > 0) continue;
        const v = k.farV + (1 - k.farV) * lit;
        const r = Math.min(255, v * 0.86 * 255) | 0, g = Math.min(255, v * 0.93 * 255) | 0, b = Math.min(255, v * 255) | 0;
        img.setTint((r << 16) | (g << 8) | b); img.tq = -1;
        const off = 1 - lit;
        if (off > 0.02 && st.cfg.eyes !== false && ne < eyeCap && EYE[e.type]) {
          const fl = img.flipX ? -1 : 1;
          for (const [ox, oy] of EYE[e.type]) {
            if (ne >= eyeCap) break;
            const x = e.x + ox * fl, y = e.y + oy;
            getEye(st.eyes, ne, 0xff6a3a, 'glow').setPosition(x, y).setDepth(120001 + e.y * 1e-5).setDisplaySize(9, 9).setAlpha(k.eyeA * off);
            getEye(st.cores, ne, 0xffe2b0, 'glow').setPosition(x, y).setDepth(120001.5 + e.y * 1e-5).setDisplaySize(4.2, 4.2).setAlpha(k.eyeA * off);
            ne++;
          }
        }
        if (st.cfg.rim && k.rimA > 0 && off > 0.02 && !lowT) {
          const key = img.texture.key; const arr = st.rims[key] || (st.rims[key] = []); const i = nr[key] || 0; nr[key] = i + 1;
          let ri = arr[i]; if (!ri) { ri = sc.add.image(0, 0, key); arr[i] = ri; }
          ri.setVisible(true).setPosition(e.x, e.y).setFlipX(img.flipX).setScale(img.scaleX * 1.14, img.scaleY * 1.14).setDepth(img.depth - 0.2).setTintFill(0xa8bce0).setAlpha(k.rimA * off * 0.75);
        }
      }
    }
    for (let i = ne; i < st.eyes.length; i++) { st.eyes[i].setVisible(false); st.cores[i].setVisible(false); }
    for (const key of Object.keys(st.rims)) for (let i = nr[key] || 0; i < st.rims[key].length; i++) st.rims[key][i].setVisible(false);
    if (st.hide) {
      for (const e of s.enemies) { const pool = this.pools[e.type]; const ent = pool && pool.map.get(e.id); if (ent) ent.img.setVisible(false); }
      for (const im of st.eyes.concat(st.cores)) im.setVisible(false);
      for (const key of Object.keys(st.rims)) for (const im of st.rims[key]) im.setVisible(false);
    } else for (const e of s.enemies) { const pool = this.pools[e.type]; const ent = pool && pool.map.get(e.id); if (ent) ent.img.setVisible(true); }
  };
  return 1;
};`;

const URL1 = `http://127.0.0.1:${HTTP}/`;
const q = (hero, t) => `${URL1}?style=a&auto=${hero}&seed=3&god=1&debug=0&t=${t}&grant=${GRANT}`;
const shot = async (c, file, clip) => { const jpg = file.endsWith('.jpg'); const r = await c.send('Page.captureScreenshot', { format: jpg ? 'jpeg' : 'png', ...(jpg ? { quality: 86 } : {}), ...(clip ? { clip } : {}) }); writeFileSync(file, Buffer.from(r.data, 'base64')); return r.data; };
const setup = (c, x, y, t, restoreR) => c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;s.time=${t};p.x=${x};p.y=${y};a.scene.cameras.main.centerOn(${x},${y});l.decay=1e9;
  const R=${restoreR};if(R>0){l.stamp(x0=${x},${y},R,1);l.stamp(${x}+R*0.9,${y}-R*0.4,R*0.6,1);l.stamp(${x}-R*0.8,${y}+R*0.5,R*0.5,1);}return 1})()`.replace('x0=', ''));
const holdTime = (c, t) => c.ev(`(()=>{const s=window.__app.sim;s.time=${t};return 1})()`);
const inject = (c, n, minD, maxD) => c.ev(`(()=>{const s=window.__app.sim;const T=['wolf','crow','root_crawler'];let k=0;while(s.enemies.length<${n}){const a=(k*2.399)%6.2832,d=${minD}+((k*37)%${maxD - minD});s.spawnEnemy(T[k%3],s.player.x+Math.cos(a)*d*1.5,s.player.y+Math.sin(a)*d*0.9);k++;}return s.enemies.length})()`);
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
const fmt = (t) => `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}`;

// 5 moments: [tSec, enemies in view, restore radius]
const MOMENTS = [[30, 40, 0], [240, 90, 220], [480, 150, 330], [690, 170, 460], [870, 160, 620]];
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };

async function frame(c, hero, view, tier, opt, t, n, rr, file) {
  const [w, h, dpr] = VIEWS[view];
  await open(c, q(hero, t), w, h, dpr, tier);
  await c.ev(OVERRIDE);
  await c.ev(`window.__VA(${opt === 'now' ? 'null' : JSON.stringify({ K: ARCS[opt], rim: opt !== 'B', t })})`);
  await sleep(700); await setup(c, 2000, 2000, t, rr); await sleep(1500);
  await autoPick(c); await inject(c, n, 40, 330); await sleep(250); await autoPick(c);
  for (let i = 0; i < 20; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await holdTime(c, t); await sleep(350); await holdTime(c, t);
  await shot(c, file);
}

async function frames(dist, out) {
  mkdirSync(join(out, 'frames'), { recursive: true });
  const srv = await serve(dist, HTTP); const c = await launch();
  const only = process.env.ONLY;
  try {
    const jobs = [];
    // option A (recommended): 5 moments, desktop for both heroes, phones (Wren landscape, Elias portrait)
    for (const [t, n, rr] of MOMENTS) {
      jobs.push(['wren', 'desk', 'high', 'A', t, n, rr]);
      jobs.push(['elias', 'desk', 'high', 'A', t, n, rr]);
      jobs.push(['wren', 'land', 'high', 'A', t, n, rr]);
      jobs.push(['elias', 'port', 'high', 'A', t, n, rr]);
      jobs.push(['wren', 'desk', 'high', 'now', t, n, rr]); // current build ARC for comparison
    }
    // options B and C at 0:30 and 8:00 (desktop, Wren); tiers Med/Low for A at 0:30
    for (const opt of ['B', 'C']) for (const [t, n, rr] of [MOMENTS[0], MOMENTS[2]]) jobs.push(['wren', 'desk', 'high', opt, t, n, rr]);
    for (const tier of ['med', 'low']) jobs.push(['wren', 'desk', tier, 'A', 30, 40, 0]);
    for (const j of jobs) {
      const [hero, view, tier, opt, t, n, rr] = j;
      const name = `${opt}-${fmt(t)}-${hero}-${view}-${tier}.jpg`;
      if (only && !name.includes(only)) continue;
      await frame(c, hero, view, tier, opt, t, n, rr, join(out, 'frames', name));
      console.log('shot', name);
    }
  } finally { c.close(); srv.close(); }
}

// Contrast harness: hero on Hollow ground, 3 enemy types frozen at 3 distances (inside the pool, edge, far).
// Measures WCAG relative-luminance contrast of (a) the eye peak and (b) the body silhouette vs the local ground.
const MEASURE = `(async (b64, b64g, pts) => {
  const load = (b) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; });
  const [im, ig] = await Promise.all([load(b64), load(b64g)]);
  const mk = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d'); g.drawImage(i, 0, 0); return g; };
  const g = mk(im), gg = mk(ig);
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (d, i) => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
  const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const Ls = (y) => (y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y);
  const out = [];
  for (const p of pts) {
    const r = Math.max(6, Math.round(p.r * 1.5)); const x0 = Math.round(p.x - r), y0 = Math.round(p.y - r), w = 2 * r;
    const d = g.getImageData(x0, y0, w, w).data, dg = gg.getImageData(x0, y0, w, w).data;
    const body = [], grd = [], all = []; let mx = 0, mrgb = '';
    for (let i = 0; i < d.length; i += 4) {
      const a = L(d, i), b = L(dg, i); grd.push(b);
      const diff = Math.abs(d[i] - dg[i]) + Math.abs(d[i + 1] - dg[i + 1]) + Math.abs(d[i + 2] - dg[i + 2]);
      if (diff > 12) { body.push(a); all.push([a, b]); if (a > mx) { mx = a; mrgb = d[i] + '/' + d[i + 1] + '/' + d[i + 2]; } }
    }
    if (!body.length) { out.push({ ...p, mask: 0 }); continue; }
    body.sort((a, b) => a - b); grd.sort((a, b) => a - b);
    const ground = grd[grd.length >> 1]; const bm = body[body.length >> 1]; const peak = body[Math.max(0, body.length - 3)];
    // share of silhouette pixels that differ from what was behind them by >= 1.5:1
    let sep = 0; for (const [a, b] of all) if (cr(a, b) >= 1.5) sep++;
    out.push({ ...p, mask: body.length, ground: +ground.toFixed(4), body: +bm.toFixed(4), peak: +peak.toFixed(4), mrgb, eyeCR: +cr(peak, ground).toFixed(2), bodyCR: +cr(bm, ground).toFixed(2), dL: +(Ls(bm) - Ls(ground)).toFixed(1), eyedL: +(Ls(peak) - Ls(ground)).toFixed(1), sep15: +(sep / all.length).toFixed(2) });
  }
  return JSON.stringify(out);
})`;

async function contrast(dist, out) {
  mkdirSync(join(out, 'contrast'), { recursive: true });
  const srv = await serve(dist, HTTP); const c = await launch();
  const rows = [];
  try {
    for (const opt of (process.env.OPTS || 'now,A,B,C').split(',')) for (const t of (process.env.TS || '30,480,690').split(',').map(Number)) for (const tier of (process.env.TIERS || 'high,low').split(',')) {
      await open(c, q('wren', t), 1280, 720, 1, tier);
      await c.ev(OVERRIDE);
      await c.ev(`window.__VA(${opt === 'now' ? 'null' : JSON.stringify({ K: ARCS[opt], rim: opt !== 'B', t, sat: false })})`);
      await sleep(700); await setup(c, 2600, 2600, t, 0); await sleep(1200);
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player;s.enemies.length=0;const T=['wolf','crow','root_crawler'];
        for(let i=0;i<3;i++)for(let j=0;j<3;j++){s.spawnEnemy(T[i],p.x+100,p.y);const e=s.enemies[s.enemies.length-1];e._va=i*3+j;}return s.enemies.length})()`);
      const POS = `(()=>{const s=window.__app.sim,p=s.player;const D=[70,140,220];s.enemies=s.enemies.filter(e=>e._va!=null);for(const e of s.enemies){const i=(e._va/3)|0,j=e._va%3;e.x=p.x+D[j];e.y=p.y-70+i*70;e.faceX=-1;e.speed=0;e.tele=0;e.hp=1e9;e.maxHp=1e9;e.flash=0;e.bleedT=0;e.burnT=0;}s.time=${t};return s.enemies.length})()`;
      for (let i = 0; i < 8; i++) { await c.ev(POS); await sleep(50); }
      await c.ev(POS);
      const pts = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,s=window.__app.sim,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();const D=[70,140,220];return JSON.stringify(s.enemies.map(e=>({type:e.type,dist:D[e._va%3],x:R.left+(e.x-wv.x)/wv.width*R.width,y:R.top+(e.y-wv.y)/wv.height*R.height,r:e.r*R.width/wv.width*1.05})))})()`));
      if (process.env.DBG) console.log(await c.ev(`(()=>{const v=window.__app.scene.__va;return JSON.stringify({k:v.k,n:v.eyes.length,e:v.eyes.slice(0,3).map(i=>[i.visible,i.alpha,i.x,i.y,i.depth,i.displayWidth,i.blendMode,i.texture.key])})})()`), await c.ev(`(()=>{const sc=window.__app.scene,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();return JSON.stringify({wv:[wv.x,wv.y,wv.width,wv.height],R:[R.left,R.top,R.width,R.height],p:[window.__app.sim.player.x,window.__app.sim.player.y]})})()`));
      const b64 = await shot(c, join(out, 'contrast', `contrast-${opt}-${fmt(t)}-${tier}.png`));
      await c.ev('window.__app.scene.__va.hide=true'); await c.ev(POS); await sleep(120);
      const b64g = (await c.send('Page.captureScreenshot', { format: 'png' })).data;
      await c.ev('window.__app.scene.__va.hide=false');
      const res = JSON.parse(await c.ev(`(${MEASURE})(${JSON.stringify(b64)}, ${JSON.stringify(b64g)}, ${JSON.stringify(pts)})`));
      for (const r of res) rows.push({ mrgb: r.mrgb, opt, t, tier, type: r.type, dist: r.dist, ground: r.ground, body: r.body, peak: r.peak, eyeCR: r.eyeCR, bodyCR: r.bodyCR, sep15: r.sep15, dL: r.dL, eyedL: r.eyedL, mask: r.mask });
      console.log('contrast', opt, t, tier);
    }
  } finally { c.close(); srv.close(); }
  writeFileSync(join(out, 'contrast', 'contrast.json'), JSON.stringify(rows, null, 1));
  const lines = ['opt,t,tier,type,dist,ground,body,peak,eyeCR,bodyCR,dL,eyedL,sep15', ...rows.map((r) => [r.opt, r.t, r.tier, r.type, r.dist, r.ground, r.body, r.peak, r.eyeCR, r.bodyCR, r.dL, r.eyedL, r.sep15].join(','))];
  writeFileSync(join(out, 'contrast', 'contrast.csv'), lines.join('\n'));
}

// ---- index.html + PNG sheets (reads frames/ and contrast/contrast.json in <out>) ----
function page(out) {
  const rows = JSON.parse(readFileSync(join(out, 'contrast', 'contrast.json'), 'utf8')).filter((r) => r.dist != null && r.eyeCR != null);
  const T = [[30, '0:30 deep night'], [240, '4:00 night'], [480, '8:00 blue hour'], [690, '11:30 rose pre-dawn (boss came at 10:00)'], [870, '14:30 sunrise']];
  const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const img = (f) => `<figure><img src="frames/${f}" alt="${esc(f)}" loading="eager"><figcaption>${esc(f.replace('.jpg', ''))}</figcaption></figure>`;
  const Yl = (c) => { const l = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * l(c >> 16 & 255) + 0.7152 * l(c >> 8 & 255) + 0.0722 * l(c & 255); };
  const CUR = [[0, 0x7f6cb9], [225, 0x526097], [495, 0x3d4d82], [720, 0x6c5990], [855, 0xb08a8a], [900, 0xffe2c4]];
  const W = 900, H = 260, px = (t) => 40 + t / 900 * (W - 60), py = (y) => H - 30 - Math.sqrt(y) * (H - 50);
  const line = (K, col, dash) => `<polyline fill="none" stroke="${col}" stroke-width="2.5" ${dash ? 'stroke-dasharray="6 4"' : ''} points="${K.map((k) => `${px(k[0]).toFixed(1)},${py(Yl(k[1])).toFixed(1)}`).join(' ')}"/>`;
  const ticks = [0, 180, 300, 480, 600, 690, 780, 870, 900].map((t) => `<line x1="${px(t)}" x2="${px(t)}" y1="${H - 30}" y2="${H - 25}" stroke="#889"/><text x="${px(t)}" y="${H - 12}" font-size="11" text-anchor="middle" fill="#bbc">${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</text>`).join('');
  const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ambient brightness over the run"><rect x="0" y="0" width="${W}" height="${H}" fill="#151a2c"/>${ticks}<line x1="${px(600)}" x2="${px(600)}" y1="10" y2="${H - 30}" stroke="#ff9a6a" stroke-dasharray="3 3"/><text x="${px(600) + 4}" y="40" font-size="11" fill="#ff9a6a">boss 10:00</text>${line(CUR, '#8a8aa0', true)}${line(ARCS.C, '#6a7fd0')}${line(ARCS.B, '#7fc9b8')}${line(ARCS.A, '#ffcf7a')}<text x="48" y="22" font-size="12" fill="#ffcf7a">A (recommended)</text><text x="170" y="22" font-size="12" fill="#7fc9b8">B</text><text x="200" y="22" font-size="12" fill="#6a7fd0">C</text><text x="230" y="22" font-size="12" fill="#8a8aa0">current build (dashed)</text></svg>`;
  const tbl = (opt) => {
    const cell = (t, tier, d) => rows.filter((r) => r.opt === opt && r.t === t && r.tier === tier && r.dist === d).map((r) => `<span class="${r.eyeCR >= 3 ? 'ok' : Math.abs(r.dL) >= 6 ? 'sil' : 'bad'}">${r.type[0]} ${r.eyeCR.toFixed(1)}/${r.dL > 0 ? '+' : ''}${r.dL}</span>`).join(' ');
    return `<table><caption>${opt === 'now' ? 'Current build' : 'Option ' + opt}: eye contrast (WCAG) / body delta L* vs ground (w wolf, c crow, r root crawler). Green = eyes >= 3:1; amber = silhouette |dL*| >= 6 only; red = neither.</caption><tr><th>moment</th><th>tier</th><th>70 (inside)</th><th>140 (edge)</th><th>220 (outside)</th></tr>${T.map(([t, n]) => ['high', 'low'].map((tier) => `<tr><td>${esc(n.split(' ')[0])}</td><td>${tier}</td>${[70, 140, 220].map((d) => `<td>${cell(t, tier, d)}</td>`).join('')}</tr>`).join('')).join('')}</table>`;
  };
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Visibility Arc Mockups</title>
<style>:root{--bg:#0f1220;--fg:#e8e0ff;--mut:#9fb3c8;--warm:#ffcf7a}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif;padding:16px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 8px;color:var(--warm)}p{color:var(--mut);max-width:1100px}
.grid{display:grid;gap:10px}.g3{grid-template-columns:repeat(3,minmax(0,1fr))}.g5{grid-template-columns:repeat(5,minmax(0,1fr))}figure{margin:0}img{width:100%;display:block;border:1px solid #2a3150;border-radius:4px}figcaption{font-size:11px;color:var(--mut);padding:2px 0}
.phones{display:grid;grid-template-columns:2.2fr 1fr;gap:10px;align-items:start}table{border-collapse:collapse;margin:8px 0 18px;font-size:12px}td,th{border:1px solid #2a3150;padding:3px 6px;text-align:left}caption{text-align:left;color:var(--mut);padding:4px 0}.ok{color:#7fe0a0}.sil{color:#ffcf7a}.bad{color:#ff8a82}
.eyes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.crop{aspect-ratio:5/4;overflow:hidden;border:1px solid #2a3150;border-radius:4px}.crop img{width:250%;max-width:none;border:0;transform:translate(-57.5%,-16%)}
svg{width:100%;max-width:900px;height:auto}@media (max-width:700px){.g5,.g3{grid-template-columns:repeat(2,minmax(0,1fr))}.phones,.eyes{grid-template-columns:1fr}}</style></head><body>
<h1>W6 Visibility + Vibrancy Arc: mock-ups</h1><p>Real dev build (dist snapshot) in headless Chrome with a runtime debug override of the arc (nothing in src/ changed). Seed 3, god mode, enemies injected for a swarm, restored area grows with the moment. Saturation here is a whole-camera colour matrix (the build applies it to restored layers only). Eyes are drawn only outside the pool in the mock. Design: docs/design/visibility-arc-v1.md.</p>
<h2>The arc: ambient brightness over the run</h2>${svg}
<h2>Option A (recommended), 5 moments, Wren, desktop 1280x720</h2><div class="grid g5">${T.map(([t]) => img(`A-${fmt(t)}-wren-desk-high.jpg`)).join('')}</div>
<h2>Option A, Elias, desktop 1280x720</h2><div class="grid g5">${T.map(([t]) => img(`A-${fmt(t)}-elias-desk-high.jpg`)).join('')}</div>
<h2>Current build ARC at the same moments (comparison)</h2><div class="grid g5">${T.map(([t]) => img(`now-${fmt(t)}-wren-desk-high.jpg`)).join('')}</div>
<h2>Option A on phones: Wren landscape 844x390, Elias portrait 390x844 (@2x)</h2>${T.map(([t, n]) => `<p>${esc(n)}</p><div class="phones">${img(`A-${fmt(t)}-wren-land-high.jpg`)}${img(`A-${fmt(t)}-elias-port-high.jpg`)}</div>`).join('')}
<h2>Three options at 0:30 (top) and 8:00 (bottom): A, B, C</h2><div class="grid g3">${['A', 'B', 'C'].map((o) => img(`${o}-0m30-wren-desk-high.jpg`)).join('')}</div><div class="grid g3" style="margin-top:10px">${['A', 'B', 'C'].map((o) => img(`${o}-8m00-wren-desk-high.jpg`)).join('')}</div>
<h2>Tiers at 0:30 (option A): High, Med, Low</h2><div class="grid g3">${['high', 'med', 'low'].map((tr) => img(`A-0m30-wren-desk-${tr}.jpg`)).join('')}</div>
<h2>Eyes in the dark vs the lantern pool (0:30, crop): current, A, B, C</h2><p>Hero at the left edge (lantern pool); wolf, crow, root crawler rows at 70, 140 and 220 world units.</p><div class="eyes">${['now', 'A', 'B', 'C'].map((o) => `<figure><div class="crop"><img src="contrast/eyes-${o}-0m30-high.jpg" alt="${o} eyes"></div><figcaption>${o === 'now' ? 'current build' : 'option ' + o}</figcaption></figure>`).join('')}</div>
<h2>Measured contrast (harness, 1 frame per cell)</h2>${['now', 'A', 'B', 'C'].map(tbl).join('')}
</body></html>`;
  writeFileSync(join(out, 'index.html'), html);
}

async function sheets(out) {
  page(out);
  const srv = await serve(out, HTTP); const c = await launch();
  try {
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
    await c.send('Page.enable'); await c.send('Runtime.enable');
    await c.send('Page.navigate', { url: URL1 }); await sleep(2500);
    await c.ev('Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))).then(()=>1)');
    const fullH = await c.ev('document.documentElement.scrollHeight');
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: fullH, deviceScaleFactor: 1, mobile: false }); await sleep(800);
    const secs = JSON.parse(await c.ev(`JSON.stringify([...document.querySelectorAll('h2')].map((h,i)=>{const b=h.getBoundingClientRect();let y1=b.bottom;let s=h.nextElementSibling;while(s&&s.tagName!=='H2'){y1=Math.max(y1,s.getBoundingClientRect().bottom);s=s.nextElementSibling}return {i,y:b.top+scrollY-6,h:y1-b.top+12}}))`));
    const names = ['sheet-1-arc', 'sheet-2-optionA-wren', 'sheet-3-optionA-elias', 'sheet-4-current', 'sheet-5-phones', 'sheet-6-options', 'sheet-7-tiers', 'sheet-8-eyes', 'sheet-9-contrast'];
    for (const s2 of secs) {
      const r = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: s2.y, width: 1600, height: Math.min(s2.h, 7000), scale: s2.i === 4 ? 0.6 : 1 } });
      writeFileSync(join(out, `${names[s2.i] || 'sheet-' + s2.i}.png`), Buffer.from(r.data, 'base64'));
    }
  } finally { c.close(); srv.close(); }
}

const [dist, out, cmd = 'all'] = process.argv.slice(2);
if (cmd === 'sheets') { await sheets(dist); process.exit(0); }
if (!dist || !out) { console.error('usage: capture.mjs <distDir> <outDir> [frames|contrast|all]'); process.exit(1); }
if (cmd === 'contrast' || cmd === 'all') await contrast(dist, out);
if (cmd === 'frames' || cmd === 'all') await frames(dist, out);
