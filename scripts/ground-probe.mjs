// GROUND-PHONE gate: what draws the ground in the first minute of a Wren run, in REAL WebKit (Playwright's MiniBrowser, the iPhone Safari
// engine family; no npm dependency) and/or headless Chrome with CPU throttle + iPhone emulation (390x844, DPR 3, touch).
// Serves a built dist/ plus a harness page that iframes the game (same origin, no service worker), starts a Wren run, walks the hero, and at
// sim seconds 2,5,8,12,20,30,60 records: quality tier, ground shader on/ok/failed (+ why), lightmap, set-B tile paint progress, life under the hero,
// WebGL info, console warnings, and a canvas snapshot (written to <outDir>/<engine>-<t>s.png).
// Usage: node scripts/ground-probe.mjs [webkit|chrome4|chrome6|all=all] [outDir=docs/screenshots/ground-phone] [distDir=dist]
// Exit 1 if at any mark >= 2 s the ground shader is off while the tier is Med/High (or the shader failed). Exit 3: browser not found.
import http from 'node:http';
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [which = 'all', outArg = 'docs/screenshots/ground-phone', distArg = 'dist'] = process.argv.slice(2);
const dist = path.resolve(here, '..', distArg), out = path.resolve(here, '..', outArg);
const MARKS = [2, 5, 8, 12, 20, 30, 60];
if (!existsSync(path.join(dist, 'index.html'))) { console.error('no build at', dist, '(npm run build first)'); process.exit(2); }
mkdirSync(out, { recursive: true });

const HARNESS = `<!doctype html><meta charset="utf-8"><title>ground-probe</title><style>body{margin:0;background:#000}iframe{border:0;width:390px;height:844px}</style><iframe id="f"></iframe>
<script>
const q = new URLSearchParams(location.search), tag = q.get('tag'), marks = q.get('marks').split(',').map(Number);
const post = (p, o) => fetch('/__' + p + '?tag=' + tag, { method: 'POST', body: typeof o === 'string' ? o : JSON.stringify(o) }).catch(() => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = document.getElementById('f'), logs = [];
f.src = '/index.html?perf=1&god=1&seed=1' + (q.get('extra') || '');
const hook = (w) => { if (!w || w.__gpHooked) return; w.__gpHooked = 1; for (const k of ['warn', 'error']) { const o = w.console[k].bind(w.console); w.console[k] = (...a) => { logs.push(k + ': ' + a.map(String).join(' ').slice(0, 300)); o(...a); }; } w.addEventListener('error', (e) => logs.push('onerror: ' + e.message)); };
const iv = setInterval(() => { try { hook(f.contentWindow); } catch {} }, 5);
const key = (w, type, code) => w.dispatchEvent(new w.KeyboardEvent(type, { code, key: code.replace('Key', '').toLowerCase(), bubbles: true }));
(async () => {
  try {
    let w; for (let i = 0; i < 900; i++) { w = f.contentWindow; if (w && w.__app && w.__app.scene && w.__app.scene.sys && w.__app.save) break; await sleep(200); }
    clearInterval(iv); hook(w);
    const app = w.__app, sc = app.scene, gl = sc.renderer.gl;
    const glInfo = gl ? { webgl2: typeof w.WebGL2RenderingContext !== 'undefined' && gl instanceof w.WebGL2RenderingContext, maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE), units: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), fragHigh: (gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT) || {}).precision, renderer: gl.getParameter(gl.RENDERER), canvas: sc.game.canvas.width + 'x' + sc.game.canvas.height, dpr: w.devicePixelRatio } : null;
    await sleep(1500);
    const tBoot = performance.now();
    app.startRun('wren');
    for (let i = 0; i < 8000; i++) { if (app.sim && app.sim.time > 0.02) break; await sleep(25); }
    const tRun = performance.now();
    const dirs = ['KeyD', 'KeyS', 'KeyA', 'KeyW']; let di = 0, lastTurn = 0; key(w, 'keydown', dirs[0]);
    const rows = []; let mi = 0;
    while (mi < marks.length) {
      const s = app.sim;
      if (s && s.state === 'levelup' && s.offer) { const c = s.offer.cards.find((c) => c.kind !== 'evolution') || s.offer.cards[0]; if (c) app.pick(c.key); }
      if (s && s.time - lastTurn > 3) { key(w, 'keyup', dirs[di]); di = (di + 1) % 4; key(w, 'keydown', dirs[di]); lastTurn = s.time; }
      if (s && s.time >= marks[mi]) {
        const gb = sc.gb, b = sc.bState, p = s.player, pb = sc.prebake;
        const row = { t: marks[mi], wall: Math.round((performance.now() - tRun) / 100) / 10, tier: sc.quality.tier, mode: sc.quality.mode, avgMs: +(sc.quality.avgMs || 0).toFixed(1), work: +(sc.quality.avgWork || 0).toFixed(1), paced: !!sc.quality.paced, warm: Math.round((sc.warmMs || 0) / 100) / 10,
          gbOn: sc.gbOn, gbOk: gb.ok, gbFailed: gb.failed, gbSh: !!gb.sh, gbVisible: !!(gb.sh && gb.sh.visible), groundVisible: sc.ground.visible, lmOn: sc.lmOn,
          bReady: b ? +b.ready.toFixed(2) : null, bLazy: b && b.lazy ? (b.lazy.done ? 'done' : 'painting') : 'none', prebake: pb ? pb.mode + ' ' + (pb.done ? 'done' : Math.round(pb.p * 100) + '%') : 'off',
          lifeHero: +sc.life.sample(p.x, p.y).toFixed(2), lifeOff: +sc.life.sample(p.x + 150, p.y + 150).toFixed(2), glErr: gl ? gl.getError() : -1, status: w.__probe && w.__probe.status ? w.__probe.status() : '' };
        rows.push(row);
        const img = await new Promise((r) => { sc.game.renderer.snapshot((im) => r(im)); });
        await post('shot', JSON.stringify({ t: marks[mi], src: img.src }));
        mi++;
      }
      await sleep(50);
    }
    post('done', { tag, glInfo, startWaitMs: Math.round(tRun - tBoot), rows, logs: logs.slice(0, 40) });
  } catch (e) { post('done', { tag, error: String((e && e.stack) || e), logs }); }
})();
</script>`;

const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
let done = null;
const srv = http.createServer((req, res) => {
  const [u0, qs = ''] = (req.url || '/').split('?'); const u = decodeURIComponent(u0); const tag = new URLSearchParams(qs).get('tag') || 'x';
  if (req.method === 'POST' && (u === '/__done' || u === '/__shot')) {
    const parts = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n < 64e6) parts.push(c); });
    req.on('end', () => {
      res.end('ok'); const b = Buffer.concat(parts).toString();
      if (u === '/__shot') { try { const j = JSON.parse(b); const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(j.src || ''); if (m && Number.isFinite(j.t)) writeFileSync(path.join(out, `${tag.replace(/[^a-z0-9-]/gi, '')}-${j.t | 0}s.png`), Buffer.from(m[1], 'base64')); } catch { /* bad shot */ } }
      else if (done) done(b);
    });
    return;
  }
  if (u === '/__h.html') { res.setHeader('content-type', 'text/html'); res.end(HARNESS); return; }
  if (u.endsWith('sw.js')) { res.statusCode = 404; res.end(); return; }
  const f = path.resolve(dist, '.' + (u === '/' ? '/index.html' : u));
  if (!f.startsWith(dist) || !existsSync(f)) { res.statusCode = 404; res.end(); return; }
  res.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream'); res.end(readFileSync(f));
});
await new Promise((r) => srv.listen(5396, '127.0.0.1', r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (tag, extra = '') => `http://127.0.0.1:5396/__h.html?tag=${tag}&marks=${MARKS.join(',')}&extra=${encodeURIComponent(extra)}`;
const wait = (ms) => { const got = new Promise((r) => { done = r; }); return Promise.race([got, sleep(ms).then(() => null)]); };

async function webkit() {
  const pw = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const wkDir = existsSync(pw) ? readdirSync(pw).filter((d) => d.startsWith('webkit-')).sort().pop() : null;
  const exe = process.env.WEBKIT_EXE || (wkDir ? path.join(pw, wkDir, 'Playwright.exe') : '');
  if (!exe || !existsSync(exe)) return { tag: 'webkit', error: 'WebKit MiniBrowser not found' };
  const p = spawn(exe, [url('webkit')], { stdio: 'ignore' });
  const raw = await wait(240000); p.kill();
  return raw ? JSON.parse(raw) : { tag: 'webkit', error: 'timeout' };
}

async function chrome(rate) {
  const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  if (!existsSync(exe)) return { tag: 'chrome' + rate, error: 'Chrome not found' };
  const dir = mkdtempSync(path.join(tmpdir(), 'gpchrome-'));
  const p = spawn(exe, ['--headless=new', '--remote-debugging-port=9336', `--user-data-dir=${dir}`, '--no-first-run', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
  let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch('http://127.0.0.1:9336/json')).json(); if (tabs.length) break; } catch { /* starting */ } await sleep(300); }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  await send('Emulation.setCPUThrottlingRate', { rate });
  const tag = 'chrome' + rate;
  const got = wait(300000);
  await send('Page.navigate', { url: url(tag) });
  const raw = await got; ws.close(); p.kill();
  return raw ? JSON.parse(raw) : { tag, error: 'timeout' };
}

const runs = [];
if (which === 'all' || which === 'webkit') runs.push(await webkit());
if (which === 'all' || which === 'chrome4') runs.push(await chrome(4));
if (which === 'all' || which === 'chrome6') runs.push(await chrome(6));
srv.close();
let fail = false;
for (const r of runs) {
  if (r.error) { console.error(r.tag, 'ERROR', r.error); fail = true; continue; }
  for (const x of r.rows) if (x.gbFailed || (x.tier !== 'low' && !x.gbOn)) { fail = true; console.error(r.tag, `t=${x.t}s tier ${x.tier} but ground shader off (failed=${x.gbFailed})`); }
}
writeFileSync(path.join(out, 'probe.json'), JSON.stringify(runs, null, 1));
console.log(JSON.stringify(runs, null, 1));
process.exit(fail ? 1 : 0);
