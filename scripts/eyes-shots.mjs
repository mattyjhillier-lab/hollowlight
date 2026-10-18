// EYES IN SOCKETS: before/after captures of the Husk eyes on the REAL build (dist/, or DIST=<dir> for the before build). Own headless Chrome
// (debug port 9497 + SLOT), own static server (4215 + SLOT), own temp profile; closes only what it opened. Node built-ins only.
//   node scripts/eyes-shots.mjs shots <outDir>   TAG=before|after: wolf, crow, crawler in a row facing the hero at 0:30 / 4:00 / 11:30,
//                                                 desktop 1280x720 + phone 844x390@2: true-size frame (jpg) + a 3x crop of the row (png)
//   node scripts/eyes-shots.mjs strip <outDir>   4-frame eye strip per species at 0:30 night (look left, look up-right, mid-blink, tell/hurt), 5x crop
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { blinkMul } from '../src/gfx/nightlook.js';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const SLOT = Number(process.env.SLOT || 0);
const PORT = 9497 + SLOT, HTTP = 4215 + SLOT;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], hires: [1280, 720, 3] }; // hires = design check only (3 device px per css px)
const fmt = (t) => `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}`;
const TAG = process.env.TAG || 'after';

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-eyes-'));
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
  const close = () => { try { ws.close(); } catch { /* ignore */ } try { proc.kill(); } catch { /* ignore */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } }, 1500); };
  return { send, ev, close };
}

async function open(c, query, w, h, dpr, tier = 'high') {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}` });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try {
      if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools && window.__app.scene.enArt && window.__app.scene.enArt.on)')) {
        await c.ev(`window.__app.save.setSettings({quality:'${tier}',brightness:'normal'}); true`);
        return;
      }
    } catch { /* loading */ }
  }
  throw new Error('game did not start');
}
const q = (t) => `auto=wren&seed=7&t=${t}&god=1&nums=0&grant=ghost_wolves:speed=1`;
const shot = async (c, file, clip) => {
  const r = await c.send('Page.captureScreenshot', { format: file.endsWith('.png') ? 'png' : 'jpeg', quality: 90, ...(clip ? { clip: { ...clip, scale: clip.scale || 1 } } : {}) });
  writeFileSync(file, Buffer.from(r.data, 'base64'));
};
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
// hero at 2000,2000 (restored patch rr), the three Husks in a row to the right facing the hero, frozen; the summons are hidden so they never cover them
async function stage(c, t, rr, dx = 70) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;s.time=${t};p.x=2000;p.y=2000;a.scene.cameras.main.centerOn(2000,2000);l.decay=1e9;
    if(${rr}>0){l.stamp(2000,2000,${rr},1);}
    const T=['wolf','crow','root_crawler'];T.forEach((ty,i)=>{s.spawnEnemy(ty,p.x+${dx}+i*40,p.y+6);const e=s.enemies[s.enemies.length-1];e.hp=1e9;e.maxHp=1e9;e.speed=0;});return s.enemies.length})()`);
  await sleep(700);
}
const FREEZE = (t, dx) => `(()=>{const s=window.__app.sim,p=s.player;p.x=2000;p.y=2000;s.time=${t};s.enemies.forEach((e,i)=>{e.x=p.x+${dx}+i*40;e.y=p.y+6;e.faceX=-1;e.speed=0;e.tele=0;e.hp=1e9;e.maxHp=1e9;e.flash=0;e.bleedT=0;e.burnT=0;});for(const u of s.units)u.hidden=true;return 1})()`;
const rowClip = (c, dx) => c.ev(`(()=>{const sc=window.__app.scene,wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();const X=(x)=>R.left+(x-wv.x)/wv.width*R.width,Y=(y)=>R.top+(y-wv.y)/wv.height*R.height;
  const x0=X(2000+${dx}-16),x1=X(2000+${dx}+80+18),y0=Y(2006-17),y1=Y(2006+6);return JSON.stringify({x:x0,y:y0,width:x1-x0,height:y1-y0})})()`).then(JSON.parse);

async function shots(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    for (const [t, rr] of [[30, 0], [240, 160], [690, 330]]) {
      for (const view of (process.env.VIEWS || 'desk,land').split(',')) {
        const [w, h, dpr] = VIEWS[view];
        await open(c, q(t), w, h, dpr);
        await sleep(400); await stage(c, t, rr);
        for (let i = 0; i < 6; i++) { await c.ev(FREEZE(t, 70)); await sleep(60); }
        await c.ev('(()=>{window.__app.paused=true;return 1})()'); await sleep(120);
        const name = `${TAG}-${fmt(t)}-${view}`;
        await shot(c, join(out, name + '.jpg'));
        const clip = await rowClip(c, 70);
        await shot(c, join(out, name + '-row3x.png'), { ...clip, scale: 3 });
        await c.ev('(()=>{window.__app.paused=false;return 1})()');
        console.log('shot', name);
      }
    }
  } finally { c.close(); srv.close(); }
}

// 4 frames per species: (1) look left at the hero, (2) hero moved up-right (look shifts), (3) mid-blink (lid closed), (4) wolf tell flare / others hurt squint
async function strip(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    const t = 30, dx = 70;
    await open(c, q(t), 1280, 720, 1);
    await sleep(400); await stage(c, t, 0, dx);
    for (let i = 0; i < 4; i++) { await c.ev(FREEZE(t, dx)); await sleep(60); }
    await c.ev('(()=>{window.__app.paused=true;return 1})()'); // the whole strip is taken paused (render runs, the sim and the summons do not)
    const ids = JSON.parse(await c.ev('JSON.stringify(window.__app.sim.enemies.map(e=>e.id))'));
    const types = ['wolf', 'crow', 'root_crawler'];
    // crop around enemy i's CURRENT position (the camera follows the hero, so it is recomputed per frame)
    const clipOf = (i) => c.ev(`(()=>{const sc=window.__app.scene,e=window.__app.sim.enemies[${i}],wv=sc.cameras.main.worldView,R=sc.game.canvas.getBoundingClientRect();const X=(x)=>R.left+(x-wv.x)/wv.width*R.width,Y=(y)=>R.top+(y-wv.y)/wv.height*R.height;
      return JSON.stringify({x:X(e.x-15),y:Y(e.y-14),width:X(e.x+11)-X(e.x-15),height:Y(e.y+5)-Y(e.y-14)})})()`).then(JSON.parse);
    for (let i = 0; i < 3; i++) {
      // a time that is NOT blinking (for 1, 2, 4) and one inside a blink (3), for this enemy id
      let tOpen = t, tBlink = -1;
      for (let k = 0; k < 4000; k++) { const tt = t + k * 0.01; if (tBlink < 0 && blinkMul(tt, ids[i], false) < 1) tBlink = tt + 0.03; }
      for (let k = 0; k < 400; k++) { const tt = t + k * 0.05; if (blinkMul(tt, ids[i], false) === 1 && blinkMul(tt + 0.2, ids[i], false) === 1) { tOpen = tt; break; } }
      const frames = [['look-left', tOpen, 0, 0, 0], ['look-up-right', tOpen, 1, 0, 0], ['blink', tBlink, 0, 0, 0], [types[i] === 'wolf' ? 'tell-flare' : 'hurt-squint', tOpen, 0, types[i] === 'wolf' ? 1 : 0, types[i] === 'wolf' ? 0 : 1]];
      const pngs = [];
      for (const [label, tt, moveHero, tele, hurt] of frames) {
        await c.ev(FREEZE(tt, dx));
        await c.ev(`(()=>{const s=window.__app.sim,p=s.player;${moveHero ? `p.x=2000+${dx}+${i}*40+60;p.y=2000-70;` : ''}const e=s.enemies[${i}];e.tele=${tele};if(${hurt})e.flash=0.05;s.time=${tt};return 1})()`);
        await sleep(moveHero || tele ? 700 : 450); // let the camera settle
        if (hurt) await c.ev(`(()=>{window.__app.sim.enemies[${i}].flash=0;return 1})()`);
        await sleep(110);
        const clip = await clipOf(i);
        const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 5 } });
        pngs.push([label, r.data]);

      }
      const b64 = await c.ev(`(async()=>{const P=${JSON.stringify(pngs)};const L=(s)=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+s;});const I=await Promise.all(P.map(p=>L(p[1])));
        const W=I.reduce((a,i)=>a+i.width+12,12),H=I[0].height+44;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,W,H);let x=12;g.font='bold 20px sans-serif';g.fillStyle='#fff';
        I.forEach((im,k)=>{g.drawImage(im,x,6);g.fillText(P[k][0],x,H-10);x+=im.width+12;});return cv.toDataURL('image/png').slice(22);})()`);
      writeFileSync(join(out, `${TAG}-strip-${types[i]}.png`), Buffer.from(b64, 'base64'));
      console.log('strip', types[i]);
    }
  } finally { c.close(); srv.close(); }
}

// debug: stage the row at T (default 30), print EXPR
async function probe() {
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try { const t = Number(process.env.T || 30); await open(c, q(t), 1280, 720, 1, process.env.TIER || 'high'); await sleep(400); await stage(c, t, 0); for (let i = 0; i < 4; i++) { await c.ev(FREEZE(t, 70)); await sleep(60); } console.log(await c.ev(process.env.EXPR)); } finally { c.close(); srv.close(); }
}

const [cmd, out = 'docs/screenshots/eyes'] = process.argv.slice(2);
if (cmd === 'probe') await probe();
else if (cmd === 'shots') await shots(out);
else if (cmd === 'strip') await strip(out);
else console.log('usage: node scripts/eyes-shots.mjs shots|strip <outDir>');
