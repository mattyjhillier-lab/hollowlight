// EN6-EN9 Branch-Mane miniboss + Lantern Reliquary: screenshots on the REAL build (dist/). Own headless Chrome (debug port 9561), own static server
// (4271), own temp profile (deleted on close); closes only what it opened. Node built-ins only.
//   node scripts/mini-shots.mjs world <outDir>   desk 1280x720 + phone 844x390@2 + 390x844@2 at NIGHT (3:20, Branch-Mane #1) and DAY (11:30, #3):
//                                                 walk + crowd, charge-lane tell, howl veins, chest on the ground (all three tiers), chest open beat,
//                                                 the countdown chip (3:05) and the Large chest's choice screens; 2x crops on desktop
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9561, HTTP = 4271;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const MIX = ['wolf', 'wolf', 'crow', 'root_crawler', 'wolf', 'crow', 'stoat_piper', 'puffback_toad'];

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-mini-'));
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
    try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools && window.__app.scene.miniView)')) { await c.ev("window.__app.save.setSettings({quality:'high',brightness:'normal'}); true"); return; } } catch { /* loading */ }
  }
  throw new Error('game did not start');
}
const shot = async (c, file, clip) => {
  const r = await c.send('Page.captureScreenshot', { format: file.endsWith('.png') ? 'png' : 'jpeg', quality: 90, ...(clip ? { clip: { ...clip, scale: clip.scale || 1 } } : {}) });
  writeFileSync(file, Buffer.from(r.data, 'base64'));
};
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
const fmt = (t) => `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}`;

// a calm crowd + the Branch-Mane 95 u right of the hero (facing her); idx = which scheduled one (hp)
async function stage(c, t, idx, n) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  return c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player;s.enemies.length=0;for(const k in s.alive)s.alive[k]=0;s.xpNeeded=1e9;s.time=${t};s.miniNext=99;p.x=2000;p.y=2000;a.scene.cameras.main.centerOn(2000,2000);
    const T=${JSON.stringify(MIX)};for(let k=0;k<${n};k++){const an=(k*2.399)%6.2832,d=90+((k*37)%170);s.spawnEnemy(T[k%T.length],p.x+Math.cos(an)*d*1.5,p.y+Math.sin(an)*d*0.9);}
    const m=s.spawnMini({hp:${[700, 1600, 3200][idx]},odds:[0,0,100]});m.x=p.x+95;m.y=p.y-8;m.grace=0;m.howlCd=99;m.aiCd=99;return s.enemies.length})()`);
}
const freeze = (c, on) => c.ev(`(()=>{window.__app.scene.hitStop=${on ? 999 : 0};return 1})()`); // the scene's hit-stop holds the sim (render keeps going)

async function world(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    for (const [t, idx, light] of [[200, 0, 'night'], [690, 2, 'day']]) {
      for (const view of ['desk', 'land', 'port']) {
        const [w, h, dpr] = VIEWS[view];
        const hero = view === 'port' ? 'elias' : 'wren';
        await open(c, `auto=${hero}&seed=7&t=${t}&god=1&grant=ghost_wolves:speed=3,power=3`, w, h, dpr);
        await sleep(400); await stage(c, t, idx, 22);
        await sleep(3000); // the arrival banner (2.4 s) clears first
        await c.ev(`(()=>{const s=window.__app.sim,m=s.mini,p=s.player;m.x=p.x+100;m.y=p.y-10;m.state='run';m.tele=false;return 1})()`);
        await sleep(250);
        const base = `mini-${light}-${fmt(t)}-${view}`;
        const crop = view === 'desk' ? { x: 390, y: 160, width: 500, height: 330, scale: 2 } : null;
        await shot(c, join(out, `${base}-1-walk.jpg`)); if (crop) await shot(c, join(out, `${base}-1-walk-crop2x.png`), crop);
        // charge tell: the lane locked toward the hero (frozen mid-tell)
        await c.ev(`(()=>{const s=window.__app.sim,m=s.mini,p=s.player;m.x=p.x+110;m.y=p.y-6;const d=Math.hypot(p.x-m.x,p.y-m.y);m.state='tele';m.tele=true;m.stT=0.3;m.dx=(p.x-m.x)/d;m.dy=(p.y-m.y)/d;m.faceX=-1;m.aiCd=99;return 1})()`);
        await sleep(120); await freeze(c, true); await sleep(250);
        await shot(c, join(out, `${base}-2-charge-tell.jpg`)); if (crop) await shot(c, join(out, `${base}-2-charge-tell-crop2x.png`), crop);
        await freeze(c, false);
        // howl: pose + the vein ring
        await c.ev(`(()=>{const s=window.__app.sim,m=s.mini;m.state='run';m.tele=false;m.howlCd=0;m.aiCd=99;return 1})()`);
        await sleep(520); await freeze(c, true); await sleep(200);
        await shot(c, join(out, `${base}-3-howl.jpg`)); if (crop) await shot(c, join(out, `${base}-3-howl-crop2x.png`), crop);
        await freeze(c, false);
        // the Reliquary: all three tiers on the ground beside the hero (the miniboss gone), then a Small one opening
        await c.ev(`(()=>{const s=window.__app.sim,p=s.player;s.enemies=s.enemies.filter(e=>!e.mini);s.alive.branch_mane=0;s.mini=null;s.pickups.length=0;for(const [i,tr] of [[0,0],[1,1],[2,2]]){const k=s.addPickup('chest',p.x+50+i*34,p.y+18);k.tier=tr;k.ttl=Infinity;}return 1})()`);
        await sleep(700);
        await shot(c, join(out, `${base}-4-chests.jpg`)); if (crop) await shot(c, join(out, `${base}-4-chests-crop2x.png`), { x: 520, y: 260, width: 300, height: 180, scale: 3 });
        await c.ev(`(()=>{const s=window.__app.sim,p=s.player;const k=s.pickups.find(q=>q.type==='chest'&&q.tier===0);k.x=p.x;k.y=p.y;return 1})()`);
        await sleep(260); await shot(c, join(out, `${base}-5-open.jpg`)); if (crop) await shot(c, join(out, `${base}-5-open-crop2x.png`), crop);
        // a Large one: the Blessing choice screen, then the free stat rank
        await c.ev(`(()=>{const s=window.__app.sim,p=s.player;const k=s.pickups.find(q=>q.type==='chest'&&q.tier===2);k.x=p.x;k.y=p.y;return 1})()`);
        await sleep(900); await shot(c, join(out, `${base}-6-choice-bless.jpg`));
        await autoPick(c); await sleep(700); await shot(c, join(out, `${base}-7-choice-stat.jpg`));
        await autoPick(c); await sleep(300);
        // the countdown chip 15 s before the next one
        await c.ev(`(()=>{const s=window.__app.sim;s.pickups.length=0;s.mini=null;s.miniSched=[{t:s.time+15,hp:700,odds:[55,40,5]}];s.miniNext=0;return 1})()`);
        await sleep(700); await shot(c, join(out, `${base}-8-chip.jpg`), view === 'port' ? null : { x: 0, y: 0, width: w, height: Math.round(h * 0.35) });
        console.log('shots', base);
      }
    }
  } finally { await c.close(); srv.close(); }
}

const [mode, out] = process.argv.slice(2);
if (mode === 'world') await world(out || 'docs/screenshots/minibosses');
else console.log('usage: node scripts/mini-shots.mjs world <outDir>');
