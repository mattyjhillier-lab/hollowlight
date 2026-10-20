// Elder Treant fight frame cost (perf gate, boss-treant-v1 (h)): the boss view's OWN per-frame work (BossView.update + drawTells, timed in the page) and
// the scene work (sc.workMs) in the arena with N foes held inside the ring, per quality tier; GPU Chrome (d3d11), headless.
// Usage: node scripts/boss-perf.mjs <distDir> [tiers=high,med,low] [foes=350] [secs=15]   (own Chrome 9561 + own server 4281)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9561, HTTP = 4281;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [dist, tiersArg, foesArg, secsArg] = process.argv.slice(2);
if (!dist) { console.error('usage: node scripts/boss-perf.mjs <distDir> [tiers] [foes] [secs]'); process.exit(2); }
const FOES = Number(foesArg || 350), SECS = Number(secsArg || 15);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
const root = resolve(dist);
const srv = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
  const f = resolve(join(root, p));
  if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => srv.listen(HTTP, '127.0.0.1', r));
const dir = mkdtempSync(join(tmpdir(), 'hl-boss-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', '--use-angle=d3d11', '--ignore-gpu-blocklist',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
console.log('chrome pid', proc.pid);
for (let i = 0; i < 240; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); let exc = 0;
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.method === 'Page.javascriptDialogOpening') ws.send(JSON.stringify({ id: 900000 + (++id), method: 'Page.handleJavaScriptDialog', params: { accept: true } })); if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') console.error('PAGE ERR', JSON.stringify(d.params.args.map((a) => a.value ?? a.description)).slice(0, 300)); if (d.method === 'Runtime.exceptionThrown') { exc++; console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); } if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pending.has(i)) { pending.delete(i); rej(new Error('cdp timeout ' + method)); } }, 60000); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const until = async (expr, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await ev(expr)) return true; } catch { /* */ } await sleep(60); } throw new Error('timeout: ' + expr); };
// a page-side wrapper: time BossView.update + drawTells; keep FOES alive near the hero (the ring clamps them in the fight); auto-pick cards
const WRAP = (foes) => `(()=>{const a=window.__app,sc=a.scene,bv=sc.bossView;window.__bt={t:0,n:0,w:0};const u=bv.update.bind(bv),d=bv.drawTells.bind(bv);
  bv.update=(...x)=>{const t0=performance.now();u(...x);window.__bt.t+=performance.now()-t0};bv.drawTells=(...x)=>{const t0=performance.now();d(...x);window.__bt.t+=performance.now()-t0};
  sc.game.events.on('postrender',()=>{const b=window.__bt;b.n++;b.w+=sc.workMs||0});
  clearInterval(window.__inj);window.__inj=setInterval(()=>{const s=a.sim;if(!s)return;s.xp=Math.min(s.xp,0);if(s.state==='levelup')a.pick((s.offer.gold[0]||s.offer.cards[0]).key);if(s.state!=='running')return;s.player.hp=s.player.maxHp;let k=0;const T=['wolf','crow','root_crawler'];while(s.enemies.length<${foes}){const an=(k*2.399)%6.2832,dd=50+((k*37)%200);s.spawnEnemy(T[k%3],s.player.x+Math.cos(an)*dd,s.player.y+Math.sin(an)*dd);k++}if(s.boss&&s.boss.hp<s.boss.maxHp*0.4)s.boss.hp=s.boss.maxHp*0.9},300);return 1})()`;
const READ = '(()=>{const b=window.__bt,s=window.__app.sim;return {frames:b.n,bossMs:+(b.t/Math.max(1,b.n)).toFixed(3),workMs:+(b.w/Math.max(1,b.n)).toFixed(2),foes:s.enemies.length,fight:!!s.fight}})()';
try {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (const tier of (tiersArg || 'high,med,low').split(',').filter((t) => ['high', 'med', 'low'].includes(t))) {
    for (const phase of ['crowd', 'fight']) {
      await send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?auto=wren&seed=3&t=${phase === 'fight' ? 838 : 780}&god=1&grant=holy_orbit:power=3` });
      await until('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.bossView)', 90000);
      await ev(`window.__app.save.setSettings({quality:'${tier}',reducedMotion:false}),1`);
      if (phase === 'fight') await until('window.__app.sim.fight && window.__app.sim.fight.stage === "fight"', 30000);
      else await sleep(2500);
      await ev(WRAP(FOES));
      await sleep(1500);
      await ev('(()=>{window.__bt.t=0;window.__bt.n=0;window.__bt.w=0;return 1})()');
      await sleep(SECS * 1000);
      console.log(tier, phase, JSON.stringify(await ev(READ)));
    }
  }
  console.log('page exceptions', exc);
} finally {
  try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } srv.close();
  setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500);
}
