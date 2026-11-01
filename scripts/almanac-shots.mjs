// Almanac delegation capture (crow / crawler Tells pages, Full Almanac riddles), docs only. Usage: node scripts/almanac-shots.mjs <outDir>
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
const STATS = `const st=a.save.data.stats;Object.assign(st,{runs:20,wins:5,kills:30000,killsByEnemy:{wolf:13000,crow:12500,root_crawler:3500},bossKills:{elder_treant:6},evolved:{howling_legion:6},charsUsed:{wren:7,elias:2}});Object.assign(a.save.data.tree,{br_almanac:1,bs_wolf1:1,bs_crow1:1,bs_crow2:1,bs_crow3:1,bs_crawl1:1,bs_crawl2:1,bs_crawl3:1,bs_page:1,gt_ghost_wolves:1,gt_phantom_stampede:1,gt_dire_alpha:1,gt_raven_flock:1,gt_murder_storm:1,gt_dive_bombers:1,gt_spearhead:1});`;
const click = (name) => A(`const it=[...document.querySelectorAll('.cx-item')].find(e=>e.textContent.includes('${name}'));if(!it)return 'missing';it.click();return 'ok'`);
const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
try {
  for (const [vn, [w, hh, dpr]] of Object.entries(VIEWS)) {
    await c.ev("try{localStorage.clear()}catch(e){};1").catch(() => {});
    await openTitle(c, w, hh, dpr); await sleep(400);
    await c.ev(A(`${STATS}a.save.data.codex={v:1,read:'',told:''};ui.showStart(ui.onPick);return 1`)); await sleep(500);
    await c.ev(KEY('j')); await sleep(900);
    for (const [name, f] of [['Grave Crow', 'crow'], ['Root Crawler', 'crawler']]) {
      console.log(vn, name, await c.ev(click(name))); await sleep(700);
      console.log(await c.ev(A("const p=document.querySelector('.cx-detail,.cx-sheet,.cx-page')||document.body;return [...document.querySelectorAll('.cx-page-line,.cx-pg,p')].map(e=>e.textContent).filter(t=>/lunge|plods/.test(t)).join(' | ')")));
      await shot(c, join(out, `almanac-${f}-tells-${vn}.png`));
      if (vn === 'port') await c.ev(KEY('Escape'));
    }
    await c.ev(KEY('2')); await sleep(600);
    if (vn === 'port') { await c.ev(A("document.querySelector('.cx-item').click();return 1")); await sleep(500); }
    console.log(vn, 'riddles', await c.ev(A("return [...document.querySelectorAll('.cx-riddle')].length+' '+document.querySelector('.cx-tot').textContent")));
    await shot(c, join(out, `almanac-riddles-${vn}.png`));
  }
} finally { await c.close(); srv.close(); }
