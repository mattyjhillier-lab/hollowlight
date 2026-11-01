// CX (codex + celebrations) capture, docs only: real build frames of the Almanac pages, entry points, results ledger, medium / big cards, Calm.
// Own headless Chrome (9534) + own static server (4254) + a temp profile (hl-cx-*) that is deleted at the end. Usage: node scripts/cx-shots.mjs <outDir> [only]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9534, HTTP = 4254;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const ONLY = process.argv[3] || '';

function serve(dir) {
  const root = resolve(dir);
  const srv = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
    const f = resolve(join(root, p));
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(HTTP, '127.0.0.1', () => r(srv)));
}
async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-cx-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = async () => { try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } await sleep(1500); try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } };
  return { send, ev, close, dir };
}
async function open(c, query, w, h, dpr) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}` });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools && window.__app.whispers)')) return; } catch { /* */ } }
  throw new Error('game did not start');
}
async function openTitle(c, w, h, dpr) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/` });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await c.ev('!!(window.__app && window.__app.ui && window.__app.ui.screen && window.__app.ui.screen.id==="title")')) return; } catch { /* */ } }
  throw new Error('title did not show');
}
const shot = async (c, file) => { const r = await c.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(r.data, 'base64')); };
const A = (s) => `(()=>{const a=window.__app,ui=a.ui;${s}})()`;
const KEY = (k) => A(`ui.onKey({key:'${k}',preventDefault(){},ctrlKey:false,altKey:false,metaKey:false,shiftKey:false});return 1`);
// a mid-game lantern: some foes met, wolf pages open, two evolutions found, a gate awake, Twilight + Deep Dusk walked
const STATS = `const st=a.save.data.stats;Object.assign(st,{runs:9,wins:2,kills:5200,markedKills:12,killsByEnemy:{wolf:2318,crow:1904,root_crawler:212,branch_mane:3,treant_pod:41,stoat_piper:30},bossKills:{elder_treant:2},evolved:{howling_legion:6,sanctum_halo:2},charsUsed:{wren:7,elias:2},
  tiers:{cursed_forest:{normal:{runs:8,clears:2,best:{t:840,kills:900,level:30},stars:1,heroes:{wren:{clears:2,first:false}}},hard:{runs:1,clears:0,best:{t:400,kills:300,level:14},stars:0,heroes:{}}}}});a.save.data.tree.gt_phantom_stampede=1;`;
const VS = Object.entries(VIEWS);
const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
const log = {};
try {
  // CX2 the four pages (+ portrait sheet) from the title; CX3 the title entry point
  if (!ONLY || ONLY === 'pages') {
    for (const [vn, [w, h, dpr]] of VS) {
      await c.ev("try{localStorage.clear()}catch(e){};1").catch(() => {});
      await openTitle(c, w, h, dpr); await sleep(400);
      await c.ev(A(`${STATS}a.save.data.codex={v:1,read:'',told:''};ui.showStart(ui.onPick);return 1`)); await sleep(500);
      await shot(c, join(out, `cx3-title-${vn}.png`));
      await c.ev(KEY('j')); await sleep(900);
      await shot(c, join(out, `cx2-foes-${vn}.png`));
      if (vn === 'port') { await c.ev(A("document.querySelector('.cx-item').click();return 1")); await sleep(700); await shot(c, join(out, 'cx2-foes-sheet-port.png')); await c.ev(KEY('Escape')); }
      for (const [k, t] of [['2', 'spirits'], ['3', 'heroes'], ['4', 'nights']]) {
        await c.ev(KEY(k)); await sleep(500);
        if (vn === 'port') { await c.ev(A("document.querySelector('.cx-item').click();return 1")); await sleep(500); }
        await shot(c, join(out, `cx2-${t}-${vn}.png`));
        if (vn === 'port') await c.ev(KEY('Escape'));
      }
      if (vn === 'desk') {
        log.pages = await c.ev(A("return {tot:document.querySelector('.cx-tot').textContent,tabs:[...document.querySelectorAll('.cx-tab')].map(t=>t.textContent),imgs:document.querySelectorAll('.cx-img').length,codex:a.save.data.codex}"));
        await c.ev(KEY('Escape')); await sleep(300);
        log.back = await c.ev(A("return {screen:ui.screen&&ui.screen.id,focus:document.activeElement&&document.activeElement.className,codexOpen:!!ui.codexView}"));
      }
    }
    console.log('pages', JSON.stringify(log.pages), JSON.stringify(log.back));
  }
  // CX3 pause (read-only) + CX4 results ledger + medium cards (real defeat on the real bank path) + CX5 big + Calm
  if (!ONLY || ONLY === 'run') {
    for (const [vn, [w, h, dpr]] of VS) {
      await c.ev("try{localStorage.clear()}catch(e){};1").catch(() => {});
      await open(c, 'auto=wren', w, h, dpr); await sleep(500);
      await c.ev(A(`a.params.auto=null;a.adoptCodex();${STATS}a.togglePause();return 1`)); await sleep(400);
      await shot(c, join(out, `cx3-pause-${vn}.png`));
      await c.ev(KEY('j')); await sleep(700);
      await shot(c, join(out, `cx3-pause-almanac-${vn}.png`));
      if (vn === 'desk') log.pause = await c.ev(A("return {open:!!ui.codexView,paused:a.paused,tot:document.querySelector('.cx-tot').textContent}"));
      await c.ev(KEY('Escape')); await sleep(300);
      if (vn === 'desk') log.pause2 = await c.ev(A("return {open:!!ui.codexView,paused:a.paused}"));
      await c.ev(A('a.togglePause();return 1')); await sleep(300);
      await c.ev(A("a.save.data.stats.evolved.phantom_stampede=1;a.save.data.stats.evolved.vesper_tide=1;a.save.data.stats.killsByEnemy.puffback_toad=4;a.sim.player.hp=0.01;a.sim.state='defeat';return 1"));
      await sleep(1100); await shot(c, join(out, `cx4-medium-${vn}.png`));
      await sleep(500); await c.ev(KEY('x')); await sleep(800);
      await shot(c, join(out, `cx4-medium2-${vn}.png`));
      await c.ev(KEY('Escape')); await sleep(1200);
      await shot(c, join(out, `cx4-results-ledger-${vn}.png`));
      if (vn === 'desk') log.results = await c.ev(A("const l=document.querySelector('.u6-ledger');return {ledger:l&&l.textContent,dropped:document.querySelector('.u6-wrap').getAttribute('data-dropped'),told:a.save.data.codex.told,cel:!!ui.celView}"));
      const big = "const it={size:'big',kind:'whole',title:'The Ghost Wolves are whole',line:'Every hunger in the pack has a name again.',pills:['Title: Friend of Wolves','Lantern ornament: wolf-ear charm'],weapon:'ghost_wolves',color:'#9fd8ff',cue:'tree_whole'};";
      await c.ev(A(`${big}ui.celebrate([it,{...it,size:'medium',kind:'evo',title:'Lightfoot Pack',line:'Wolves do not chase. They wait, they leap, they hold.',sub:'Recipe: Wolf speed + Bite power · written in the Almanac',gold:true}]);return 1`)); await sleep(2400);
      await shot(c, join(out, `cx5-big-${vn}.png`));
      await c.ev(A("ui.celView.finish();document.documentElement.classList.add('reduced-motion');return 1")); await sleep(300);
      await c.ev(A(`${big}ui.celebrate([it]);return 1`)); await sleep(400);
      await shot(c, join(out, `cx5-big-calm-${vn}.png`));
      await c.ev(A("ui.celView.finish();document.documentElement.classList.remove('reduced-motion');return 1"));
    }
    console.log('pause', JSON.stringify(log.pause), JSON.stringify(log.pause2), 'results', JSON.stringify(log.results));
  }
  // CX5 tree: a socket wakes (medium card) + CX6 title chip / colour bands once titles are earned
  if (!ONLY || ONLY === 'tree') {
    for (const [vn, [w, h, dpr]] of VS) {
      await c.ev("try{localStorage.clear()}catch(e){};1").catch(() => {});
      await openTitle(c, w, h, dpr); await sleep(300);
      await c.ev(A(`${STATS}a.save.data.titles={got:['friend_wolves','keeper_foes','walker_nights'],pick:'friend_wolves'};a.save.data.codex={v:1,read:'',told:''};ui.showStart(ui.onPick);return 1`)); await sleep(500);
      await shot(c, join(out, `cx6-title-${vn}.png`));
      await c.ev(A('a.openTree();return 1')); await sleep(1200);
      await c.ev(A("ui.celebrate([{size:'medium',kind:'socket',title:'Lightfoot Pack (Ghost Wolves)',line:'',sub:'Its socket wakes: the evolution can now be found in a run.',cue:''}]);return 1")); await sleep(700);
      await shot(c, join(out, `cx5-tree-${vn}.png`));
      await c.ev(A('ui.celView.finish();return 1'));
    }
  }
  writeFileSync(join(out, 'cx-log.json'), JSON.stringify(log, null, 1));
} finally { await c.close(); srv.close(); }
