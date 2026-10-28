// Map events v1 'Hollow Places' screenshots on the REAL build (dist/): Lamp Posts (badges), Lantern Road (timer chip, thread, arrows),
// Hollow Knot (fight, pulse tell, HP ring, restored), edge arrows. Own headless Chrome (port 9563), own static server (4273), temp profile.
//   node scripts/ev-shots.mjs <outDir>   desk 1280x720 + phone landscape 844x390@2 + portrait 390x844@2 (copied from scripts/mini-shots.mjs)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9563, HTTP = 4273;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const MIX = ['wolf', 'wolf', 'crow', 'root_crawler', 'wolf', 'crow', 'stoat_piper', 'wolf'];

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-ev-'));
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
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; const to = setTimeout(() => { pending.delete(i); rej(new Error('cdp timeout: ' + method)); }, 90000); pending.set(i, { res: (v) => { clearTimeout(to); res(v); }, rej: (e) => { clearTimeout(to); rej(e); } }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => new Promise((done) => { try { ws.close(); } catch { /* ignore */ } try { proc.kill(); } catch { /* ignore */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } done(); }, 2000); });
  return { send, ev, close };
}

async function open(c, query, w, h, dpr) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}` });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools && window.__app.scene.siteView)')) { await c.ev("window.__app.save.setSettings({quality:'high',brightness:'normal'}); true"); return; } } catch { /* loading */ }
  }
  throw new Error('game did not start');
}
const shot = async (c, file, clip) => {
  const r = await c.send('Page.captureScreenshot', { format: file.endsWith('.png') ? 'png' : 'jpeg', quality: 90, ...(clip ? { clip: { ...clip, scale: clip.scale || 1 } } : {}) });
  writeFileSync(file, Buffer.from(r.data, 'base64'));
};
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
const settle = async (c) => { for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) return; await autoPick(c); await sleep(150); } };
const fmt = (t) => `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}`;


const clear = (c) => c.ev(`(()=>{const s=window.__app.sim;s.enemies=s.enemies.filter(e=>e.knot);for(const k in s.alive)s.alive[k]=0;s.xp=-1e9;s.miniNext=99;s.mini=null;return 1})()`);
const crowd = (c, n) => c.ev(`(()=>{const s=window.__app.sim,p=s.player,T=${JSON.stringify(MIX)};for(let k=0;k<${n};k++){const an=(k*2.399)%6.2832,d=120+((k*37)%140);s.spawnEnemy(T[k%T.length],p.x+Math.cos(an)*d*1.5,p.y+Math.sin(an)*d*0.9);}return 1})()`);
async function main(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    for (const view of ['desk', 'land', 'port']) {
      const [w, h, dpr] = VIEWS[view];
      const hero = view === 'port' ? 'elias' : 'wren';
      await open(c, `auto=${hero}&seed=7&t=40&god=1&grant=ghost_wolves:speed=3,power=3`, w, h, dpr);
      await sleep(600); await settle(c); await clear(c);
      // 1 lamps: the four near lamps set round the hero, each showing its reward glyph; one already lit
      await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player;p.x=2000;p.y=2000;a.scene.cameras.main.centerOn(2000,2000);const L=s.sites.list.filter(q=>q.kind==='lamp'&&q.state==='awake');const P=[[-120,-40],[110,-50],[-70,60],[150,55]];L.forEach((q,i)=>{q.x=p.x+P[i][0];q.y=p.y+P[i][1];});return L.length})()`);
      await crowd(c, 10); await sleep(1200);
      await shot(c, join(out, `ev-1-lamps-${view}.jpg`));
      if (view === 'desk') await shot(c, join(out, `ev-1-lamps-desk-crop2x.png`), { x: 390, y: 200, width: 500, height: 300, scale: 2 });
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player,q=s.sites.list.find(q=>q.kind==='lamp'&&q.state==='awake'&&q.reward==='gold');p.x=q.x;p.y=q.y;return 1})()`);
      await sleep(500); await shot(c, join(out, `ev-2-lamp-lit-${view}.jpg`));
      // 3 road: lit the first lantern (timer chip), the other two off screen = edge arrows
      await clear(c);
      await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player;s.time=135;s.sites.step(0.01);const r=s.sites.list.find(q=>q.kind==='road');p.x=r.lanterns[0].x;p.y=r.lanterns[0].y;return r.state})()`);
      await sleep(400); await settle(c); await sleep(300);
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player,r=s.sites.list.find(q=>q.kind==='road');p.x+=60;p.y+=10;return r.state})()`);
      await crowd(c, 8); await sleep(900);
      await shot(c, join(out, `ev-3-road-active-${view}.jpg`));
      // 4 road done: stand by the middle lantern with all three lit (thread + ribbon of colour)
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player,r=s.sites.list.find(q=>q.kind==='road');p.x=r.lanterns[1].x;p.y=r.lanterns[1].y;return 1})()`);
      await sleep(300);
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player,r=s.sites.list.find(q=>q.kind==='road');const L=r.lanterns;L[2].x=p.x+150;L[2].y=p.y+30;L[0].x=p.x-150;L[0].y=p.y-30;p.x=L[2].x;p.y=L[2].y;return 1})()`);
      await sleep(500); await settle(c);
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player,r=s.sites.list.find(q=>q.kind==='road');p.x=r.lanterns[1].x;p.y=r.lanterns[1].y+40;return r.state})()`);
      await sleep(1400); await shot(c, join(out, `ev-4-road-done-${view}.jpg`));
      // 5 knot: awake (badge) beside the hero, then the fight with the pulse tell + HP ring
      await clear(c);
      await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player;s.time=335;s.sites.step(0.01);const k=s.sites.list.find(q=>q.kind==='knot');p.x=k.x+300;p.y=k.y;return k.state})()`);
      await sleep(900); await shot(c, join(out, `ev-5-knot-awake-${view}.jpg`));
      await c.ev(`(()=>{const s=window.__app.sim,p=s.player,k=s.sites.list.find(q=>q.kind==='knot');p.x=k.x+130;p.y=k.y+20;return 1})()`);
      await sleep(2500);
      await c.ev(`(()=>{const s=window.__app.sim,k=s.sites.list.find(q=>q.kind==='knot');if(k.foe)k.foe.hp=k.foe.maxHp*0.55;k.pulseT=0.01;return k.state})()`);
      await settle(c); await c.ev(`(()=>{const s=window.__app.sim,k=s.sites.list.find(q=>q.kind==='knot');k.pulseT=0.01;k.tell=0;return 1})()`);
      await sleep(450); await freeze(c, true); await sleep(200);
      await shot(c, join(out, `ev-6-knot-pulse-${view}.jpg`));
      if (view === 'desk') await shot(c, join(out, `ev-6-knot-pulse-desk-crop2x.png`), { x: 340, y: 160, width: 600, height: 380, scale: 2 });
      await freeze(c, false);
      await c.ev(`(()=>{const s=window.__app.sim,k=s.sites.list.find(q=>q.kind==='knot');if(k.foe){k.foe.hp=0;k.foe.dead=true;}return 1})()`);
      await sleep(1600); await settle(c); await sleep(400);
      await shot(c, join(out, `ev-7-knot-restored-${view}.jpg`));
      console.log('shots', view);
    }
  } finally { await c.close(); srv.close(); }
}
const freeze = (c, on) => c.ev(`(()=>{window.__app.scene.hitStop=${on ? 999 : 0};return 1})()`);
main(process.argv[2] || 'docs/screenshots/events');
