// IPHONE-PERF: where a frame's time goes in a Wren run, in REAL WebKit (Playwright's MiniBrowser, no npm dependency) posing as an iPhone
// (UA, touch, DPR 3 -> LOWMEM path, DPR cap 1.5) and/or headless Chrome with CPU throttle + iPhone emulation. Landscape 844x390.
// For each (tier, run clock) window it records per frame: rAF interval, Phaser callback interval, CPU work (PRE_STEP..POST_RENDER) split into
// sim step / HUD writes / other app glue / scene draw / tickFx / Phaser render, GL draw calls and texture uploads; plus DOM mutations per second,
// running CSS animations and the visible elements carrying GPU-heavy CSS (backdrop-filter, filter, mix-blend-mode, big box-shadow).
// Chrome also reports CDP Layout / RecalcStyle / Script time per frame.
// Usage: node scripts/iphone-perf.mjs [webkit|chrome4|chrome6|all=all] [distDir=dist] [out=<scratch json>]
import http from 'node:http';
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [which = 'all', distArg = 'dist', outArg = ''] = process.argv.slice(2);
const dist = path.resolve(here, '..', distArg);
if (!existsSync(path.join(dist, 'index.html'))) { console.error('no build at', dist, '(npm run build first)'); process.exit(2); }
const W = Number(process.env.PW || 844), H = Number(process.env.PH || 390);
// windows: [tier, start clock s, settle s, measure s]
const WINDOWS = (process.env.WINDOWS || 'low:0:22:8,med:0:22:8,low:170:10:8,med:170:10:8,low:470:12:8,med:470:12:8').split(',').map((s) => { const [tier, t, settle, meas] = s.split(':'); return { tier, t: +t, settle: +settle, meas: +meas }; });

// injected at the top of index.html for the harness only: look like an iPhone before any module reads navigator
const IPHONE = `<script>(()=>{const d=(o,k,v)=>{try{Object.defineProperty(o,k,{get:()=>v,configurable:true})}catch{}};d(navigator,'userAgent','Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1');d(navigator,'maxTouchPoints',5);d(navigator,'hardwareConcurrency',6);d(window,'devicePixelRatio',3);})()</script>`;

const HARNESS = `<!doctype html><meta charset="utf-8"><title>iphone-perf</title><style>body{margin:0;background:#000}iframe{border:0;width:${W}px;height:${H}px}</style><iframe id="f"></iframe>
<script>
const q = new URLSearchParams(location.search), tag = q.get('tag'), wins = JSON.parse(q.get('w'));
const post = (p, o) => fetch('/__' + p + '?tag=' + tag, { method: 'POST', body: JSON.stringify(o) }).then((r) => r.text()).catch(() => '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = document.getElementById('f');
const key = (w, type, code) => w.dispatchEvent(new w.KeyboardEvent(type, { code, key: code.replace('Key', '').toLowerCase(), bubbles: true }));
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2) : 0; };
const avg = (a) => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 0;
async function load(t) {
  f.src = '/index.html?perf=1&god=1&seed=1&iphone=1' + (t ? '&t=' + t : '') + '&n=' + Math.random();
  await sleep(500);
  let w; for (let i = 0; i < 900; i++) { w = f.contentWindow; if (w && w.__app && w.__app.scene && w.__app.scene.sys && w.__app.save && w.__game) break; await sleep(200); }
  return w;
}
function domScan(w) {
  const d = w.document, heavy = [], cs = (e) => w.getComputedStyle(e);
  for (const e of d.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect(); if (r.width * r.height < 4) continue;
    const s = cs(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
    const bf = s.backdropFilter || s.webkitBackdropFilter || 'none', fi = s.filter || 'none', mb = s.mixBlendMode || 'normal', bs = s.boxShadow || 'none', wc = s.willChange || 'auto';
    if (bf !== 'none' || fi !== 'none' || mb !== 'normal' || (bs !== 'none' && r.width * r.height > 4000) || wc !== 'auto') heavy.push({ el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''), area: Math.round(r.width * r.height), bf: bf !== 'none' ? bf : undefined, filter: fi !== 'none' ? fi.slice(0, 80) : undefined, blend: mb !== 'normal' ? mb : undefined, shadow: bs !== 'none' ? bs.slice(0, 60) : undefined, willChange: wc !== 'auto' ? wc : undefined });
  }
  const anims = (d.getAnimations ? d.getAnimations() : []).filter((a) => a.playState === 'running').map((a) => { const t = a.effect && a.effect.target; const kf = a.effect && a.effect.getKeyframes ? [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !['offset', 'computedOffset', 'easing', 'composite'].includes(x))))] : []; return (t ? t.tagName.toLowerCase() + (t.id ? '#' + t.id : '') + (typeof t.className === 'string' && t.className ? '.' + t.className.trim().split(/\\s+/)[0] : '') : '?') + ' ' + (a.animationName || '') + ' [' + kf.join(',') + ']'; });
  return { heavy: heavy.sort((a, b) => b.area - a.area).slice(0, 30), anims, nodes: d.querySelectorAll('*').length };
}
async function measure(w, win) {
  const app = w.__app, g = w.__game, sc = app.scene, gl = sc.renderer.gl;
  app.save.setSettings({ quality: win.tier, batterySaver: false });
  await sleep(300);
  app.startRun('wren');
  for (let i = 0; i < 8000; i++) { if (app.sim && app.sim.time > win.t + 0.02) break; await sleep(25); }
  const dirs = ['KeyD', 'KeyS', 'KeyA', 'KeyW']; let di = 0, lastTurn = 0; key(w, 'keydown', dirs[0]);
  const drive = () => { const s = app.sim; if (!s) return; if (s.state === 'levelup' && s.offer) { const c = s.offer.cards.find((c) => c.kind !== 'evolution') || s.offer.cards[0]; if (c) app.pick(c.key); } if (s.time - lastTurn > 3) { key(w, 'keyup', dirs[di]); di = (di + 1) % 4; key(w, 'keydown', dirs[di]); lastTurn = s.time; } };
  const t0 = performance.now(); while (performance.now() - t0 < win.settle * 1000) { drive(); await sleep(50); }
  // instrument
  const fr = [], raf = []; let cur = null, rafLast = 0, on = true;
  const now = () => w.performance.now();
  const wrap = (o, k, slot) => { const orig = o[k]; o[k] = function (...a) { const t = now(); try { return orig.apply(this, a); } finally { if (cur) cur[slot] += now() - t; } }; return () => { o[k] = orig; }; };
  const undo = [wrap(app.sim, 'step', 'sim'), wrap(app.ui, 'updateHud', 'hud'), wrap(app, 'frame', 'app'), wrap(sc, 'draw', 'draw'), wrap(sc, 'tickFx', 'fx'), wrap(sc, 'measure', 'meas')];
  if (app.touch && app.touch.setAbility) undo.push(wrap(app.touch, 'setAbility', 'hud'));
  if (app.audio && app.audio.frame) undo.push(wrap(app.audio, 'frame', 'audio'));
  const glc = { draws: 0, up: 0, upPx: 0 };
  if (gl) { const o = {}; for (const k of ['drawElements', 'drawArrays']) { o[k] = gl[k]; } gl.drawElements = function (...a) { glc.draws++; return o.drawElements.apply(this, a); }; gl.drawArrays = function (...a) { glc.draws++; return o.drawArrays.apply(this, a); };
    for (const k of ['texImage2D', 'texSubImage2D']) { const orig = gl[k]; gl[k] = function (...a) { glc.up++; const src = a[a.length - 1]; if (src && src.width) glc.upPx += src.width * src.height; else if (typeof a[3] === 'number' && typeof a[4] === 'number') glc.upPx += a[3] * a[4]; return orig.apply(this, a); }; undo.push(() => { gl[k] = orig; }); }
    undo.push(() => { gl.drawElements = o.drawElements; gl.drawArrays = o.drawArrays; }); }
  let mut = 0; const mo = new w.MutationObserver((l) => { mut += l.length; }); mo.observe(w.document.getElementById('ui') || w.document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  let lastPre = 0;
  const pre = () => { const t = now(); cur = { t, dt: lastPre ? t - lastPre : 0, sim: 0, hud: 0, app: 0, draw: 0, fx: 0, meas: 0, audio: 0, _: 0, render: 0, rt: 0 }; lastPre = t; glc.draws = 0; glc.up = 0; glc.upPx = 0; };
  const preR = () => { if (cur) cur.rt = now(); };
  const postR = () => { if (!cur) return; const t = now(); cur.render = t - cur.rt; cur.work = t - cur.t; cur.draws = glc.draws; cur.up = glc.up; cur.upPx = glc.upPx; fr.push(cur); cur = null; };
  g.events.on('prestep', pre); g.events.on('prerender', preR); g.events.on('postrender', postR);
  const rl = (t) => { if (!on) return; if (rafLast) raf.push(t - rafLast); rafLast = t; w.requestAnimationFrame(rl); }; w.requestAnimationFrame(rl);
  await post('mark', { phase: 'start' });
  const t1 = performance.now(); while (performance.now() - t1 < win.meas * 1000) { drive(); await sleep(50); }
  const cdp = await post('mark', { phase: 'end', frames: fr.length });
  on = false; g.events.off('prestep', pre); g.events.off('prerender', preR); g.events.off('postrender', postR); mo.disconnect(); for (const u of undo.reverse()) u();
  const secs = (fr.length ? fr.slice(1) : []);
  const col = (k) => secs.map((x) => x[k]);
  const s = app.sim;
  const out = { tier: win.tier, tierNow: sc.quality.tier, clock: +s.time.toFixed(1), enemies: s.enemies ? (s.enemies.count ?? s.enemies.length ?? null) : null, sprites: sc.countSprites(), parts: sc.parts.count,
    frames: secs.length, rafN: raf.length, raf: { avg: avg(raf), p50: pct(raf, 0.5), p95: pct(raf, 0.95) }, cb: { avg: avg(col('dt')), p95: pct(col('dt'), 0.95) },
    work: { avg: avg(col('work')), p50: pct(col('work'), 0.5), p95: pct(col('work'), 0.95) },
    split: { sim: avg(col('sim')), hud: avg(col('hud')), audio: avg(col('audio')), appOther: +(avg(col('app')) - avg(col('sim')) - avg(col('hud')) - avg(col('audio'))).toFixed(2), draw: avg(col('draw')), fx: avg(col('fx')), measure: avg(col('meas')), render: avg(col('render')), sec: Array.from(sc.sec).map((x) => +x.toFixed(2)) },
    gl: { draws: avg(col('draws')), uploads: avg(col('up')), upKpx: +(avg(col('upPx')) / 1000).toFixed(1) }, mutPerS: Math.round(mut / win.meas), cdp: cdp ? JSON.parse(cdp || 'null') : null, gbOn: sc.gbOn, lmOn: sc.lmOn, canvas: g.canvas.width + 'x' + g.canvas.height };
  out.dom = domScan(w);
  key(w, 'keyup', dirs[di]);
  return out;
}
(async () => {
  const rows = []; let glInfo = null;
  try {
    for (const win of wins) {
      const w = await load(win.t);
      if (!glInfo) { const gl = w.__app.scene.renderer.gl; glInfo = gl ? { renderer: gl.getParameter(gl.RENDERER), canvas: w.__game.canvas.width + 'x' + w.__game.canvas.height, dpr: w.devicePixelRatio, ua: w.navigator.userAgent.slice(0, 40), phone: w.__app.isPhone(), limit: w.__game.loop.fpsLimit } : null; }
      await sleep(1500);
      rows.push(await measure(w, win));
    }
    post('done', { tag, glInfo, rows });
  } catch (e) { post('done', { tag, glInfo, rows, error: String((e && e.stack) || e) }); }
})();
</script>`;

const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
let done = null, onMark = null;
const srv = http.createServer((req, res) => {
  const [u0, qs = ''] = (req.url || '/').split('?'); const u = decodeURIComponent(u0);
  if (req.method === 'POST' && (u === '/__done' || u === '/__mark')) {
    const parts = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n < 16e6) parts.push(c); });
    req.on('end', async () => {
      const b = Buffer.concat(parts).toString();
      if (u === '/__mark') { let r = null; try { r = onMark ? await onMark(JSON.parse(b)) : null; } catch { r = null; } res.end(JSON.stringify(r)); return; }
      res.end('ok'); if (done) done(b);
    });
    return;
  }
  if (u === '/__h.html') { res.setHeader('content-type', 'text/html'); res.end(HARNESS); return; }
  if (u.endsWith('sw.js')) { res.statusCode = 404; res.end(); return; }
  const f = path.resolve(dist, '.' + (u === '/' ? '/index.html' : u));
  if (!f.startsWith(dist) || !existsSync(f)) { res.statusCode = 404; res.end(); return; }
  res.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream');
  if (u === '/index.html' && /(^|&)iphone=1/.test(qs)) { res.end(readFileSync(f, 'utf8').replace(/<head>/i, '<head>' + IPHONE)); return; }
  res.end(readFileSync(f));
});
const PORT = 5397;
await new Promise((r) => srv.listen(PORT, '127.0.0.1', r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (tag) => `http://127.0.0.1:${PORT}/__h.html?tag=${tag}&w=${encodeURIComponent(JSON.stringify(WINDOWS))}`;
const wait = (ms) => { const got = new Promise((r) => { done = r; }); return Promise.race([got, sleep(ms).then(() => null)]); };
const budget = WINDOWS.reduce((a, x) => a + x.settle + x.meas + 25, 60) * 1000 * 2;

async function webkit() {
  const pw = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const wkDir = existsSync(pw) ? readdirSync(pw).filter((d) => d.startsWith('webkit-')).sort().pop() : null;
  const exe = process.env.WEBKIT_EXE || (wkDir ? path.join(pw, wkDir, 'Playwright.exe') : '');
  if (!exe || !existsSync(exe)) return { tag: 'webkit', error: 'WebKit MiniBrowser not found' };
  onMark = null;
  const p = spawn(exe, [url('webkit')], { stdio: 'ignore' });
  const raw = await wait(budget); p.kill();
  return raw ? JSON.parse(raw) : { tag: 'webkit', error: 'timeout' };
}

async function chrome(rate) {
  const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  if (!existsSync(exe)) return { tag: 'chrome' + rate, error: 'Chrome not found' };
  const dir = mkdtempSync(path.join(tmpdir(), 'ipchrome-'));
  const p = spawn(exe, ['--headless=new', '--remote-debugging-port=9337', `--user-data-dir=${dir}`, '--no-first-run', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
  let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch('http://127.0.0.1:9337/json')).json(); if (tabs.length) break; } catch { /* starting */ } await sleep(300); }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: W + 20, height: H + 20, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setCPUThrottlingRate', { rate });
  await send('Performance.enable', { timeDomain: 'threadTicks' });
  const M = ['LayoutDuration', 'RecalcStyleDuration', 'ScriptDuration', 'TaskDuration', 'LayoutCount', 'RecalcStyleCount'];
  let m0 = null;
  const metrics = async () => { const r = await send('Performance.getMetrics'); const o = {}; for (const x of r.result.metrics) if (M.includes(x.name)) o[x.name] = x.value; return o; };
  onMark = async (b) => {
    if (b.phase === 'start') { m0 = await metrics(); return null; }
    const m1 = await metrics(); const n = Math.max(1, b.frames || 1), o = {};
    for (const k of M) o[k] = k.endsWith('Count') ? +((m1[k] - m0[k]) / n).toFixed(2) : +(((m1[k] - m0[k]) * 1000) / n).toFixed(2);
    return o; // ms (or count) per frame
  };
  const tag = 'chrome' + rate;
  const got = wait(budget);
  await send('Page.navigate', { url: url(tag) });
  const raw = await got; ws.close(); p.kill();
  return raw ? JSON.parse(raw) : { tag, error: 'timeout' };
}

const runs = [];
if (which === 'all' || which === 'webkit') runs.push(await webkit());
if (which === 'all' || which === 'chrome4') runs.push(await chrome(4));
if (which === 'all' || which === 'chrome6') runs.push(await chrome(6));
if (which === 'chrome1') runs.push(await chrome(1));
srv.close();
const outFile = outArg || path.join(tmpdir(), 'iphone-perf.json');
writeFileSync(outFile, JSON.stringify(runs, null, 1));
for (const r of runs) {
  console.log('==', r.tag, r.error || '', JSON.stringify(r.glInfo));
  for (const x of r.rows || []) console.log(`${x.tier.padEnd(4)} clk ${String(x.clock).padStart(5)} spr ${x.sprites} raf ${x.raf.avg}/${x.raf.p95} cb ${x.cb.avg} work ${x.work.avg} p95 ${x.work.p95} | sim ${x.split.sim} hud ${x.split.hud} aud ${x.split.audio} app+ ${x.split.appOther} draw ${x.split.draw} fx ${x.split.fx} meas ${x.split.measure} render ${x.split.render} | draws ${x.gl.draws} up ${x.gl.uploads} (${x.gl.upKpx}kpx) mut/s ${x.mutPerS}${x.cdp ? ' | layout ' + x.cdp.LayoutDuration + ' style ' + x.cdp.RecalcStyleDuration + ' (' + x.cdp.RecalcStyleCount + '/f) script ' + x.cdp.ScriptDuration + ' task ' + x.cdp.TaskDuration : ''}`);
}
console.log('json:', outFile);
