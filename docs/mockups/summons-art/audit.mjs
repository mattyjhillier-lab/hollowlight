// Summons art AUDIT: captures the CURRENT in-game summon looks from a real build (dist), per weapon + evolution, night (0:30) and grey light (11:30),
// desktop 1280x720 full frame + a 2x crop around the hero, plus summon-free PLATES (same staging, weapons removed) for the mock-up composites.
// node audit.mjs <outDir> [distDir]   (ONLY=<tag prefix> to limit). Own headless Chrome (debug port 9531), own static server (4237), own temp
// profile; closes only what it opened. Node built-ins only, no deps, no network. Mock-up tooling, NOT game code.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9531, HTTP = 4237;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const [out, dist = 'dist'] = process.argv.slice(2);
const ONLY = process.env.ONLY || '';
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-sa-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
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
  return { send, ev, close: () => { try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500); } };
}
const MIX = ['wolf', 'wolf', 'crow', 'root_crawler', 'wolf', 'crow'];
// [tag, hero, weaponId, ranks, evo]
const CASES = [
  ['wolves-base', 'wren', 'ghost_wolves', 'count=4,power=3,speed=3', ''],
  ['wolves-echo', 'wren', 'ghost_wolves', 'count=5,duration=5,power=2', 'howling_legion'],
  ['wolves-alpha', 'wren', 'ghost_wolves', 'power=5,duration=5,count=3', 'dire_alpha'],
  ['wolves-trails', 'wren', 'ghost_wolves', 'speed=5,power=5,count=3', 'phantom_stampede'],
  ['ravens-base', 'wren', 'raven_flock', 'count=4,power=2', ''],
  ['ravens-wall', 'wren', 'raven_flock', 'count=5,range=5', 'murder_storm'],
  ['ravens-talon', 'wren', 'raven_flock', 'speed=5,power=5,count=3', 'dive_bombers'],
  ['ravens-spear', 'wren', 'raven_flock', 'range=5,speed=5,count=4', 'spearhead'],
  ['bolts-base', 'elias', 'spirit_bolts', 'count=3,power=2', ''],
  ['bolts-tempest', 'elias', 'spirit_bolts', 'count=5,speed=5', 'spirit_tempest'],
  ['bolts-lance', 'elias', 'spirit_bolts', 'power=5,pierce=5,count=2', 'soul_lance'],
  ['bolts-pages', 'elias', 'spirit_bolts', 'speed=5,pierce=5,count=3', 'returning_pages'],
  ['chain-base', 'elias', 'chain_lightning', 'chains=3,power=2', ''],
  ['chain-judg', 'elias', 'chain_lightning', 'chains=5,power=5', 'thunder_judgment'],
  ['chain-static', 'elias', 'chain_lightning', 'cooldown=5,area=5,chains=2', 'static_storm'],
  ['chain-tether', 'elias', 'chain_lightning', 'chains=5,area=5', 'storm_tether'],
  ['orbit-base', 'elias', 'holy_orbit', 'count=4,radius=2', ''],
  ['orbit-halo', 'elias', 'holy_orbit', 'count=5,radius=5', 'sanctum_halo'],
  ['orbit-wheel', 'elias', 'holy_orbit', 'power=5,speed=5,count=4', 'judgement_wheel'],
  ['orbit-tide', 'elias', 'holy_orbit', 'radius=5,speed=5,count=4', 'vesper_tide'],
  ['plate', 'wren', '', '', ''], ['plate', 'elias', '', '', ''],
];
const MOMENTS = [[30, 'night'], [690, 'day']];
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
mkdirSync(out, { recursive: true });
const srv = await serve(dist); const c = await launch();
try {
  for (const [tag, hero, wid, ranks, evo] of CASES) {
    if (ONLY && !tag.startsWith(ONLY)) continue;
    const views = tag === 'plate' ? ['desk', 'land', 'port'] : ['desk'];
    for (const [t, mood] of MOMENTS) for (const view of views) {
      const [w, h, dpr] = VIEWS[view];
      const grant = wid ? `&grant=${wid}:${ranks}${evo ? ':' + evo : ''}` : '';
      await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
      await c.send('Page.enable'); await c.send('Runtime.enable');
      await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?auto=${hero}&seed=7&t=${t}&god=1${grant}` });
      let ok = false;
      for (let i = 0; i < 80 && !ok; i++) { await sleep(250); try { ok = await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)'); } catch { /* loading */ } }
      if (!ok) throw new Error('no game ' + tag);
      await c.ev(`window.__app.save.setSettings({quality:'high',brightness:'normal'}); true`);
      for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()"); await sleep(80); }
      await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;s.time=${t};p.x=2000;p.y=2000;a.scene.cameras.main.centerOn(2000,2000);l.decay=1e9;
        if(${t > 300 ? 1 : 0}){l.stamp(2000,2000,300,1);}
        const W=${JSON.stringify(wid)};if(W){s.weapons=s.weapons.filter(w=>w.id===W);}else{s.weapons.length=0;}s.units.length=0;s.projectiles.length=0;
        const T=${JSON.stringify(MIX)};for(let k=0;k<34;k++){const an=(k*2.399)%6.2832,d=95+((k*37)%200);s.spawnEnemy(T[k%T.length],p.x+Math.cos(an)*d*1.5,p.y+Math.sin(an)*d*0.9);}return s.weapons.length})()`);
      for (const [k, wait] of (tag === 'plate' ? [[0, 1300]] : [[0, 1300], [1, 900]])) {
        await sleep(wait);
        for (let i = 0; i < 20; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await c.ev("(()=>{const a=window.__app,s=a.sim;s.xpNeeded=1e9;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()"); await sleep(120); }
        await sleep(350);
        await c.ev(`(()=>{window.__app.sim.time=${t};return 1})()`);
        const name = `${tag}${tag === 'plate' ? '-' + hero : ''}-${mood}-${view}${k ? '-b' : ''}`;
        const r = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
        writeFileSync(join(out, name + '.jpg'), Buffer.from(r.data, 'base64'));
        if (view === 'desk' && tag !== 'plate') { const r2 = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 400, y: 200, width: 480, height: 320, scale: 2 } }); writeFileSync(join(out, name + '-crop2x.png'), Buffer.from(r2.data, 'base64')); }
        console.log('shot', name);
      }
    }
  }
} finally { c.close(); srv.close(); }
process.exit(0);
