// EN0-EN2 Husk enemies: screenshots on the REAL build (dist/). Own headless Chrome (debug port 9493 + SLOT), own static server (4211 + SLOT),
// own temp profile; closes only what it opened. Node built-ins only.
//   node scripts/en-shots.mjs world   <outDir>   true size desktop 1280x720 + phone 844x390@2 + 390x844@2 at 0:30 / 4:00 / 8:00 / 11:30 (Wren; Elias at 11:30)
//   node scripts/en-shots.mjs before  <outDir>   the same desktop 4:00 + 0:30 frames with ?husks=0 (the old flat sprites) for before/after
//   node scripts/en-shots.mjs strips  <outDir>   frame strips from the baked atlas (walk x4, tell, hurt, freed body, mask) at 3x and 1x, day + night tint
//   node scripts/en-shots.mjs death   <outDir>   death beat (mask pops, body sinks, warm mote) captured in game at 0.05 / 0.2 / 0.4 / 0.7 s, crop x3
//   node scripts/en-shots.mjs compare <outDir>   in-game crops next to the locked mock-up sheets (docs/mockups/enemies-husks/0x-*.png)
//   node scripts/en-shots.mjs bake               bake time readout (visible headless page)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const SLOT = Number(process.env.SLOT || 0);
const PORT = 9493 + SLOT, HTTP = 4211 + SLOT;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const fmt = (t) => `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}`;

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-en-'));
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
      if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) {
        await c.ev(`window.__app.save.setSettings({quality:'${tier}',brightness:'normal'}); true`);
        return;
      }
    } catch { /* loading */ }
  }
  throw new Error('game did not start');
}
const q = (hero, t, extra = '') => `auto=${hero}&seed=7&t=${t}&god=1&grant=ghost_wolves:speed=3,power=3${extra}`;
const shot = async (c, file, clip) => {
  const r = await c.send('Page.captureScreenshot', { format: file.endsWith('.png') ? 'png' : 'jpeg', quality: 90, ...(clip ? { clip: { ...clip, scale: clip.scale || 1 } } : {}) });
  writeFileSync(file, Buffer.from(r.data, 'base64'));
};
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
async function stage(c, t, n, restored) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;s.time=${t};p.x=2000;p.y=2000;a.scene.cameras.main.centerOn(2000,2000);l.decay=1e9;
    if(${restored}>0){l.stamp(2000,2000,${restored},1);}
    const T=['wolf','wolf','crow','root_crawler','wolf','crow'];for(let k=0;k<${n};k++){const an=(k*2.399)%6.2832,d=55+((k*37)%200);s.spawnEnemy(T[k%T.length],p.x+Math.cos(an)*d*1.5,p.y+Math.sin(an)*d*0.9);}return s.enemies.length})()`);
  await sleep(900);
  await c.ev(`(()=>{window.__app.sim.time=${t};return 1})()`);
  await sleep(250);
}

async function world(out, extra = '', tag = '') {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    const moments = [[30, 26, 0], [240, 40, 160], [480, 50, 260], [690, 50, 330]];
    for (const [t, n, rr] of moments) {
      const views = tag ? [['wren', 'desk']] : [['wren', 'desk'], ['wren', 'land'], ['elias', 'port']].concat(t === 690 ? [['elias', 'desk']] : []);
      for (const [hero, view] of views) {
        if (tag && t > 240) continue;
        const [w, h, dpr] = VIEWS[view];
        await open(c, q(hero, t, extra), w, h, dpr);
        await sleep(400); await stage(c, t, n, rr);
        const name = `${tag || 'en'}-${fmt(t)}-${hero}-${view}.jpg`;
        await shot(c, join(out, name)); console.log('shot', name);
        if (view === 'desk') { await shot(c, join(out, `${tag || 'en'}-${fmt(t)}-${hero}-desk-crop2x.png`), { x: 340, y: 160, width: 600, height: 400, scale: 2 }); }
      }
    }
  } finally { c.close(); srv.close(); }
}

// frame strips straight from the baked atlas (what the game draws), 3x and 1x, at the day tint and the far-night tint
async function strips(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    await open(c, q('wren', 30), 1600, 900, 1);
    await sleep(500);
    for (const type of ['wolf', 'crow', 'root_crawler']) {
      const b64 = await c.ev(`(()=>{const tx=window.__app.scene.textures.get('en_atlas');const src=tx.getSourceImage();
        const names=['w0','w1','w2','w3','t0','t1','h','b','m'].filter(n=>tx.has('${type}:'+n));
        const fr=names.map(n=>tx.get('${type}:'+n));const K=3;const W=fr.reduce((a,f)=>a+f.width*K+16,16),H=Math.max(...fr.map(f=>f.height))*K*2+90;
        const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.fillStyle='#5c6478';g.fillRect(0,0,W,H/2);g.fillStyle='#1b2033';g.fillRect(0,H/2,W,H/2);
        let x=16;g.font='bold 22px sans-serif';
        fr.forEach((f,i)=>{for(const [row,filt] of [[0,'none'],[1,'brightness(0.42) saturate(0.8)']]){g.filter=filt;g.drawImage(src,f.cutX,f.cutY,f.width,f.height,x,10+row*H/2,f.width*K,f.height*K);g.filter='none';
          // 1x inset
          g.drawImage(src,f.cutX,f.cutY,f.width,f.height,x+4,H/2*(row+1)-f.height-26,f.width,f.height);}
          g.fillStyle='#fff';g.fillText({w0:'walk 1',w1:'walk 2',w2:'walk 3',w3:'walk 4',t0:'tell a',t1:'tell b',h:'hurt',b:'freed body',m:'mask'}[names[i]],x,H/2-6);x+=f.width*K+16;});
        return cv.toDataURL('image/png').slice(22);})()`);
      writeFileSync(join(out, `strip-${type}.png`), Buffer.from(b64, 'base64'));
      console.log('strip', type);
    }
  } finally { c.close(); srv.close(); }
}

// death beat in game: one enemy of each type next to the hero, killed, captured at fixed times (sim paused? no: render keeps running, the sim is frozen by app.paused)
async function death(out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    await open(c, q('wren', 240, '&nums=0'), 1280, 720, 1);
    await sleep(400); await stage(c, 240, 0, 200);
    const ts = [0.05, 0.2, 0.4, 0.7];
    for (const tier of ['high', 'low']) {
      await c.ev(`window.__app.save.setSettings({quality:'${tier}'}); true`); await sleep(300);
      for (let k = 0; k < ts.length; k++) {
        await c.ev(`(()=>{const s=window.__app.sim,p=s.player;s.enemies.length=0;const T=['wolf','crow','root_crawler'];T.forEach((ty,i)=>{s.spawnEnemy(ty,p.x+125+i*34,p.y-6);const e=s.enemies[s.enemies.length-1];e.speed=0;e.faceX=-1;});return 1})()`);
        await sleep(250);
        await c.ev(`(()=>{const s=window.__app.sim;for(const e of s.enemies.slice()){s.hurt(e,1e6);}return s.enemies.length})()`);
        await sleep(ts[k] * 1000);
        await c.ev('(()=>{window.__app.paused=true;return 1})()');
        await sleep(30);
        await shot(c, join(out, `death-${tier}-${String(k)}-${ts[k]}s.png`), { x: 900, y: 300, width: 300, height: 80, scale: 3 });
        await c.ev('(()=>{window.__app.paused=false;return 1})()');
        await sleep(1300);
      }
      console.log('death', tier);
    }
  } finally { c.close(); srv.close(); }
}

async function bake() {
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    const r = [];
    for (let i = 0; i < 3; i++) { await open(c, q('wren', 30), 1280, 720, 1); r.push(await c.ev('window.__app.scene.enArt.bake.ms')); }
    console.log('bake ms (3 boots):', r.join(', '));
  } finally { c.close(); srv.close(); }
}

// side-by-side: the locked mock-up sheet (left) next to the in-game atlas strip + a true-size in-game crop (right), per type
async function compare(out) {
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try {
    await open(c, q('wren', 30), 1600, 900, 1);
    const sheets = { wolf: '01-fell-wolf', crow: '02-grave-crow', root_crawler: '03-root-crawler' };
    const crop = readFileSync(join(out, 'en-0m30-wren-desk-crop2x.png')).toString('base64');
    for (const [type, sheet] of Object.entries(sheets)) {
      const a = readFileSync(`docs/mockups/enemies-husks/${sheet}.png`).toString('base64');
      const b = readFileSync(join(out, `strip-${type}.png`)).toString('base64');
      const png = await c.ev(`(async()=>{const L=(s)=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+s;});const [A,B,C]=await Promise.all([L(${JSON.stringify(a)}),L(${JSON.stringify(b)}),L(${JSON.stringify(crop)})]);
        const H=760,wa=A.width*H/A.height,W=Math.round(wa+1000);const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,W,H);
        g.drawImage(A,0,0,wa,H);const wb=980,hb=B.height*wb/B.width;g.drawImage(B,wa+10,10,wb,hb);const hc=H-hb-60,wc=C.width*hc/C.height;g.drawImage(C,wa+10,hb+40,wc,hc);
        g.fillStyle='#000';g.fillRect(0,H-34,W,34);g.fillStyle='#fff';g.font='bold 20px sans-serif';g.fillText('LEFT: locked mock-up sheet   RIGHT: in-game atlas frames (3x / 1x, day + far-night tint) and a 2x crop of the real build at 0:30',10,H-8);
        return cv.toDataURL('image/jpeg',0.88).slice(23);})()`);
      writeFileSync(join(out, `compare-${type}.jpg`), Buffer.from(png, 'base64')); console.log('compare', type);
    }
  } finally { c.close(); srv.close(); }
}

// debug: stage a 4:00 swarm, wait, print EXPR
async function probe() {
  const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
  try { await open(c, q('wren', 240, process.env.EXTRA || ''), 1280, 720, 1); await sleep(400); await stage(c, 240, 40, 160); await sleep(Number(process.env.WAIT || 1500)); console.log(await c.ev(process.env.EXPR)); } finally { c.close(); srv.close(); }
}

const [cmd, out = 'docs/screenshots/en'] = process.argv.slice(2);
if (cmd === 'world') await world(out);
else if (cmd === 'before') await world(out, '&husks=0', 'before');
else if (cmd === 'strips') await strips(out);
else if (cmd === 'death') await death(out);
else if (cmd === 'bake') await bake();
else if (cmd === 'probe') await probe();
else if (cmd === 'compare') await compare(out);
else console.log('usage: node scripts/en-shots.mjs world|before|strips|death|bake <outDir>');
process.exit(0);
