// S2 wolf evolutions verify harness on the REAL build (reads dist/ or DIST=<dir>; npm run build first). Own headless Chrome (debug port 9551) + own
// static server (4263); kills only what it opened and deletes its own temp profile (also on Ctrl+C / errors). PARAMS=x=1 extra URL flags.
//   node scripts/s2-wolf.mjs shots    <outDir>   desk 1280x720 + 844x390@2x + 390x844@2x, night (0:30) + day (11:30), per evolution (alpha, legion, trails), PNG
//   node scripts/s2-wolf.mjs coverage <outDir>   friendly coverage near the hero (circle of 0.2 x screen height): Light Trails trail-only pixels and the
//                                                 whole wolf weapon (wolves, echoes, halos, trail, ribbons) per evolution; env SIZES (desk,land,port), EVOS, N
//   node scripts/s2-wolf.mjs atlas    <outDir>   the baked sum_atlas page (frame review)
//   node scripts/s2-wolf.mjs depth    <outDir>   paws / trail under every pickup and number (depth audit in a live Light Trails run)
// Coverage rule: a pixel is covered when it changes (|dR|+|dG|+|dB| > 24, the WL6 mask rule) between the frame as seen and the same frozen frame
// with that layer removed. Sim frozen (hitStop) while the pair is taken.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9551, HTTP = 4263;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const EVO = { base: '', alpha: ':dire_alpha', legion: ':howling_legion', trails: ':phantom_stampede' };
// ambient layers that animate on real time are off for coverage (QUIET=0 keeps them): they are not friendly pixels and only add noise
const QUIET = process.env.QUIET === '0' ? '' : '&sway=0&motes=0&critters=0&fog=0&push=0&dawn=0';
const grant = (evo) => `ghost_wolves:count=5,speed=5,power=5,duration=5${EVO[evo]}`;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-s2-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  let ws = null;
  const close = () => { try { ws && ws.close(); } catch { /* ignore */ } try { proc.kill(); } catch { /* ignore */ } for (let i = 0; i < 20; i++) { try { rmSync(dir, { recursive: true, force: true }); break; } catch { /* locked: retry */ } const t = Date.now(); while (Date.now() - t < 150) { /* wait for Chrome to exit */ } } };
  cleanups.push(close);
  let up = false;
  for (let i = 0; i < 160 && !up; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) up = true; } catch { /* retry */ } if (!up) await sleep(250); }
  if (!up) throw new Error('chrome did not start');
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
    try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) { await c.ev(`window.__app.save.setSettings({quality:'${tier}',brightness:'normal'}); true`); break; } } catch { /* loading */ }
  }
  for (let i = 0; i < 40; i++) { if (await c.ev('!!(window.__app.scene.sumArt===undefined||window.__app.scene.sumArt.wolf||window.__app.scene.sumArt.error||!window.__app.scene.sumAtlas)')) break; await sleep(100); }
}
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
const png = async (c, file) => { const r = await c.send('Page.captureScreenshot', { format: 'png' }); if (file) writeFileSync(file, Buffer.from(r.data, 'base64')); return r.data; };
// a crowd around the parked hero so the pack runs (and Legion prey falls); ground stamped restored for the day moments
async function stage(c, t, n, restored) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;s.xp=-1e9;s.time=${t};s.bossSpawned=true;s.bossKilled=true;s.boss=null;a.scene.cameras.main.centerOn(p.x,p.y);l.decay=1e9;${restored ? 'l.stamp(p.x,p.y,420,1);' : ''}return 1})()`);
  await refill(c, n);
}
const refill = (c, n) => c.ev(`(()=>{const s=window.__app.sim,p=s.player;let k=s.enemies.length*7;while(s.enemies.filter(e=>!e.dead).length<${n}){const an=(k*2.399)%6.2832,d=70+((k*37)%150);s.spawnEnemy(['wolf','crow','root_crawler'][k%3],p.x+Math.cos(an)*d*1.5,p.y+Math.sin(an)*d*0.9);k++;}s.time=Math.min(s.time,890);s.xp=-1e9;return 1})()`);

async function shots(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const t of [30, 690]) for (const evo of (process.env.EVOS || 'alpha,legion,trails').split(',')) {
      const [w, h, dpr] = VIEWS[view];
      await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=${t}&grant=${grant(evo)}`, w, h, dpr, process.env.TIER || 'high');
      await sleep(400); await stage(c, t, 26, t > 300);
      await sleep(2600); await refill(c, 20); await autoPick(c); await sleep(500);
      await c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()'); await sleep(200);
      const name = `s2-${view}-${t < 300 ? 'night' : 'day'}-${evo}.png`;
      await png(c, join(out, name));
      if (view === 'desk') { // 2x crop around the hero for the look review
        const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 440, y: 210, width: 400, height: 300, scale: 2 } });
        writeFileSync(join(out, `s2-crop2x-${t < 300 ? 'night' : 'day'}-${evo}.png`), Buffer.from(r.data, 'base64'));
      }
      console.log('shot', name, await c.ev('JSON.stringify({art:window.__app.scene.sumArt&&window.__app.scene.sumArt.wolf,evo:(window.__app.sim.weapons.find(w=>w.id==="ghost_wolves")||{}).evo,units:window.__app.sim.units.map(u=>u.kind).join(",")})'));
    }
  } finally { cleanupAll(); }
}

// covered-pixel fraction inside the circle (cx, cy, r) between two PNGs (device px)
// With a third shot (a2 = the same frozen frame again) a pixel counts only when it differs from BOTH a and a2 and a/a2 agree (rejects flicker).
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
  await serve(process.env.DIST || 'dist'); let c = await launch();
  const N = Number(process.env.N || 8), rows = [];
  try {
    for (const view of (process.env.SIZES || 'desk,land,port').split(',')) for (const evo of (process.env.EVOS || 'base,alpha,legion,trails').split(',')) for (const tier of (process.env.TIERS || 'high').split(',')) {
      const [w, h, dpr] = VIEWS[view];
      c.close(); cleanups.splice(cleanups.indexOf(c.close), 1); await sleep(2500); // a fresh Chrome per cell: a heavy page can stall software GL
      c = null; for (let k = 0; k < 4 && !c; k++) { try { c = await launch(); } catch (e) { console.error('launch retry', e.message); await sleep(4000); } }
      if (!c) throw new Error('chrome did not start after retries');
      await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=240&grant=${grant(evo)}${QUIET}`, w, h, dpr, tier);
      await sleep(400); await stage(c, 240, 30, false); await sleep(3000);
      const trail = [], all = [], noise = [], paws = [];
      for (let k = 0; k < N; k++) {
        await refill(c, 30); await autoPick(c); await sleep(600);
        await c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()'); await sleep(250);
        const geo = JSON.parse(await c.ev(`(()=>{const sc=window.__app.scene,p=window.__app.sim.player,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();return JSON.stringify({x:(R.left+(p.x-wv.x)/wv.width*R.width)*${dpr},y:(R.top+(p.y-wv.y)/wv.height*R.height)*${dpr},r:0.2*R.height*${dpr}})})()`));
        const a = await png(c, k === 0 && process.env.KEEP ? join(out, `cov-${view}-${evo}-${tier}-a.png`) : null);
        await sleep(250); const a2 = await png(c, null); // noise floor: the same frozen frame again
        // P: the same frame without the pawprints only (Light Trails breakdown: paws vs soft ribbon)
        await c.ev('(()=>{const L=window.__app.scene.pawLayer;window.__pawHide=1;if(L){L.__r=L.render;L.render=function(){this.clear();return 0};}return 1})()'); await sleep(250);
        const pp = await png(c, null);
        await c.ev('(()=>{const L=window.__app.scene.pawLayer;if(L&&L.__r){L.render=L.__r;delete L.__r;}return 1})()'); await sleep(250);
        // B: the same frame without the Light Trails trail (sim trail points emptied while frozen)
        await c.ev('(()=>{const w=window.__app.sim.weapons.find(w=>w.id==="ghost_wolves");window.__trailSave=w.rt.trail;w.rt.trail=[];return 1})()'); await sleep(250);
        const b = await png(c, null);
        // C: no wolf weapon at all (wolves + echoes hidden, their spirit ribbons cleared, trail empty)
        await c.ev('(()=>{const S=window.__app.scene,s=window.__app.sim;window.__hid=[];for(const u of s.units)if((u.kind==="wolf"||u.kind==="echo")&&!u.hidden){u.hidden=true;window.__hid.push(u);const sl=S.ribSet.byId.get(u.id);if(sl)sl.rib.reset();}return 1})()'); await sleep(250);
        const cc = await png(c, k === 0 && process.env.KEEP ? join(out, `cov-${view}-${evo}-${tier}-c.png`) : null);
        await c.ev('(()=>{const w=window.__app.sim.weapons.find(w=>w.id==="ghost_wolves");w.rt.trail=window.__trailSave;for(const u of window.__hid)u.hidden=false;window.__app.scene.hitStop=0;return 1})()');
        paws.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(pp)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`));
        noise.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(a2)}, ${geo.x}, ${geo.y}, ${geo.r})`));
        trail.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`));
        all.push(await c.ev(`(${COVER})(${JSON.stringify(a)}, ${JSON.stringify(cc)}, ${geo.x}, ${geo.y}, ${geo.r}, ${JSON.stringify(a2)})`));
      }
      const pc = (v) => +(100 * v).toFixed(1), mean = (v) => v.reduce((x, y) => x + y, 0) / v.length;
      const row = { view, evo, tier, trailMean: pc(mean(trail)), trailMax: pc(Math.max(...trail)), allMean: pc(mean(all)), allMax: pc(Math.max(...all)), noiseMax: pc(Math.max(...noise)), pawMean: pc(mean(paws)), pawMax: pc(Math.max(...paws)), n: N };
      rows.push(row); console.log(JSON.stringify(row));
    }
  } finally { writeFileSync(join(out, 'coverage.json'), JSON.stringify(rows, null, 1)); cleanupAll(); }
}

async function depth(out) {
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    await open(c, `style=a&auto=wren&seed=5&god=1&debug=0&t=240&grant=${grant('trails')}`, 1280, 720, 1, 'high');
    await sleep(400); await stage(c, 240, 30, false); await sleep(3000);
    const r = await c.ev(`(()=>{const S=window.__app.scene;const pl=S.pawLayer;const paws=pl?pl.all.filter(i=>i.visible):[];let pick=1e9;for(const k of ['heart','magnet','gem','gemB','gemC'])if(S.pools[k])for(const v of S.pools[k].map.values())pick=Math.min(pick,v.img.depth);
      const txt=S.children.list.filter(o=>o.type==='Text'||o.type==='BitmapText').map(o=>o.depth);return JSON.stringify({paws:paws.length,pawDepth:paws.length?Math.max(...paws.map(i=>i.depth)):null,ribbon:S.ribLayer.all.length?S.ribLayer.all[0].depth:null,minPickupDepth:pick,minTextDepth:txt.length?Math.min(...txt):null,dom:!!document.querySelector('.dmg,.num,#nums')})})()`);
    console.log(r); writeFileSync(join(out, 'depth.json'), r);
  } finally { cleanupAll(); }
}

async function atlas(out) { // the baked summon atlas page as PNG (frame review)
  mkdirSync(out, { recursive: true });
  await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    await open(c, `style=a&auto=wren&seed=3&god=1&debug=0&t=30&grant=${grant('alpha')}`, 1280, 720, 1, 'high');
    const r = await c.ev('window.__app.scene.sumAtlas.cv.toDataURL("image/png")');
    writeFileSync(join(out, 's2-atlas.png'), Buffer.from(r.split(',')[1], 'base64')); console.log('atlas', await c.ev('JSON.stringify(window.__app.scene.sumArt)'));
  } finally { cleanupAll(); }
}

const [cmd, out] = process.argv.slice(2);
const fn = { shots, coverage, depth, atlas }[cmd];
if (!fn || !out) { console.log('usage: node scripts/s2-wolf.mjs shots|coverage|depth <outDir>'); process.exit(1); }
try { await fn(out); } catch (e) { console.error(e); cleanupAll(); process.exitCode = 1; }
