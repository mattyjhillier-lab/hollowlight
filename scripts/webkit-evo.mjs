// FREEZE-1 gate: the evolve moment in a REAL WebKit engine (the iPhone Safari family), because Chrome never shows this class of stall (it clips SVG
// filter regions; WebKit filtered a 6000 x 6000 du region per frame and froze ~30 s on an iPhone). Uses the WebKit MiniBrowser that Playwright
// already keeps on this PC (%LOCALAPPDATA%/ms-playwright/webkit-*/Playwright.exe; no npm dependency, nothing downloaded). It opens a small window.
// Serves a built dist/ plus an inline harness page that iframes the game (same origin), starts a run with the weapon maxed, evolves at sim EVO_AT s
// exactly as a card pick does, and reports the summon bake cost (SUM_ART.evoMs / evoMaxStepMs) and main-thread stalls (a 100 ms timer that came late).
// Usage: node scripts/webkit-evo.mjs [distDir=dist] [evo ids comma|all|<weapon id>] [seconds after evolve=20]
// Budget (exit 1): bake step <= 150 ms, bake total <= 3000 ms, no main-thread stall > 1000 ms after the evolve. Exit 3: WebKit not found.
import http from 'node:http';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [distArg = 'dist', sel = 'ghost_wolves', afterS = '20'] = process.argv.slice(2);
const dist = path.resolve(here, '..', distArg);
const EVOS = JSON.parse(readFileSync(path.join(here, '..', 'src', 'data', 'evolutions.json'), 'utf8'));
const WEAPONS = JSON.parse(readFileSync(path.join(here, '..', 'src', 'data', 'weapons.json'), 'utf8'));
const ids = sel === 'all' ? Object.keys(EVOS) : Object.hasOwn(WEAPONS, sel) ? Object.keys(EVOS).filter((k) => EVOS[k].weapon === sel) : sel.split(',').filter((k) => Object.hasOwn(EVOS, k));
const STEP_BUDGET = 150, TOTAL_BUDGET = 3000, STALL_BUDGET = 1000, EVO_AT = 12;
const pw = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const wkDir = existsSync(pw) ? readdirSync(pw).filter((d) => d.startsWith('webkit-')).sort().pop() : null;
const exe = process.env.WEBKIT_EXE || (wkDir ? path.join(pw, wkDir, 'Playwright.exe') : '');
if (!exe || !existsSync(exe)) { console.error('WebKit MiniBrowser not found (set WEBKIT_EXE)'); process.exit(3); }
if (!existsSync(path.join(dist, 'index.html'))) { console.error('no build at', dist, '(npm run build first)'); process.exit(2); }

const HARNESS = `<!doctype html><meta charset="utf-8"><title>webkit-evo</title><style>body{margin:0;background:#000}iframe{border:0;width:844px;height:390px}</style><iframe id="f"></iframe>
<script>
const q = new URLSearchParams(location.search), evo = q.get('evo'), weapon = q.get('w'), ranks = q.get('r'), after = +q.get('after'), evoAt = +q.get('at');
const post = (p, o) => fetch('/__' + p, { method: 'POST', body: JSON.stringify(o) }).catch(() => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const f = document.getElementById('f');
f.src = '/index.html?perf=1&god=1&seed=1&grant=' + weapon + ':' + ranks;
(async () => {
  try {
    let w; for (let i = 0; i < 900; i++) { w = f.contentWindow; if (w && w.__app && w.__app.scene && w.__app.scene.sys && w.__app.save) break; await sleep(200); }
    const app = w.__app; await sleep(1500);
    app.startRun('wren');
    for (let i = 0; i < 4000; i++) { if (app.sim && app.sim.time > 0.02) break; await sleep(25); }
    let evolved = 0, prev = performance.now(); const stalls = [];
    while (!evolved || performance.now() - evolved < after * 1000) {
      const now = performance.now(); if (evolved && now - prev > 100 + 250) stalls.push(Math.round(now - prev - 100)); prev = now;
      const s = app.sim;
      if (s && s.state === 'levelup' && s.offer) { const c = s.offer.cards.find((c) => c.kind !== 'evolution') || s.offer.cards[0]; if (c) app.pick(c.key); }
      if (!evolved && s && s.time >= evoAt) {
        const wp = s.weapons.find((x) => x.id === weapon);
        for (const u of s.units) if (u.owner === weapon) u.dead = true;
        s.pushEvent('evolve', { id: evo }); s.debugGrant(weapon, { ...wp.ranks }, evo); evolved = performance.now(); prev = evolved;
      }
      await sleep(100);
    }
    const S = app.scene.sumArt || {};
    post('done', { evo, evoMs: Math.round(S.evoMs || 0), evoMaxStepMs: Math.round(S.evoMaxStepMs || 0), maxStall: Math.max(0, ...stalls), stalls: stalls.slice(0, 12), kinds: [...(S.kinds || [])].join(' ') });
  } catch (e) { post('done', { evo, error: String((e && e.stack) || e) }); }
})();
</script>`;
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
let done = null;
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (req.method === 'POST' && u === '/__done') { let b = ''; req.on('data', (c) => { if (b.length < 65536) b += c; }); req.on('end', () => { res.end('ok'); if (done) done(b); }); return; }
  if (u === '/__h.html') { res.setHeader('content-type', 'text/html'); res.end(HARNESS); return; }
  if (u.endsWith('sw.js')) { res.statusCode = 404; res.end(); return; } // no service worker in the harness
  const f = path.resolve(dist, '.' + (u === '/' ? '/index.html' : u));
  if (!f.startsWith(dist) || !existsSync(f)) { res.statusCode = 404; res.end(); return; }
  res.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream'); res.end(readFileSync(f));
});
await new Promise((r) => srv.listen(5395, '127.0.0.1', r));
const out = []; let fail = false;
for (const evo of ids) {
  const weapon = EVOS[evo].weapon, ranks = Object.keys(WEAPONS[weapon].stats).map((k) => k + '=5').join(',');
  const got = new Promise((r) => { done = r; });
  const p = spawn(exe, [`http://127.0.0.1:5395/__h.html?evo=${evo}&w=${weapon}&r=${ranks}&after=${+afterS}&at=${EVO_AT}`], { stdio: 'ignore' });
  const raw = await Promise.race([got, new Promise((r) => setTimeout(() => r(null), 240000 + +afterS * 1000))]);
  p.kill();
  let r; try { r = raw ? JSON.parse(raw) : { evo, error: 'timeout (the page froze or never started)' }; } catch { r = { evo, error: 'bad result' }; }
  r.over = !!(r.error || r.evoMaxStepMs > STEP_BUDGET || r.evoMs > TOTAL_BUDGET || r.maxStall > STALL_BUDGET);
  if (r.over) fail = true;
  out.push(r);
  console.error(evo, r.error || `bake ${r.evoMs} ms (step ${r.evoMaxStepMs}), worst stall ${r.maxStall} ms`, r.over ? 'OVER BUDGET' : 'ok');
}
srv.close();
console.log(JSON.stringify({ engine: path.basename(path.dirname(exe)), dist: distArg, budget: { STEP_BUDGET, TOTAL_BUDGET, STALL_BUDGET }, runs: out }, null, 1));
process.exit(fail ? 1 : 0);
