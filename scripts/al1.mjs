// AL-1 (grass/flower sway) checks, helpers copied from w1.mjs: headless Chrome over CDP on its own port + own static server. Closes only the processes it spawned.
//   node scripts/al1.mjs perf dist           -> frame ms / sprites / draw calls per tier with 0 and 350 enemies, sway on vs ?sway=0
//   node scripts/al1.mjs shots dist out      -> swarm screenshots (desktop, phone landscape, phone portrait) + 3-frame motion strips
//   node scripts/al1.mjs atlas dist out      -> dump the atlas and measure sprite contrast vs the restored tile base colour
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9455;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
const GRANT = 'holy_orbit:power=3;ghost_wolves:speed=3,power=3;raven_flock:power=3;spirit_bolts:power=3,pierce=2';

function serve(dir, port) {
  const root = resolve(dir);
  const srv = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = resolve(join(root, p));
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(port, '127.0.0.1', () => r(srv)));
}

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-al1-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') console.error('PAGE ERR', d.params.args.map((a) => a.value || a.description).join(' '));
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch { /* ignore */ } try { proc.kill(); } catch { /* ignore */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } }, 1500); };
  return { send, ev, close };
}

async function open(c, url, w, h, dpr, tier) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await c.ev('!!(window.__app && window.__app.sim)')) { if (tier) await c.ev(`window.__app.save.setSettings({quality:'${tier}'}); true`); return; } } catch { /* loading */ }
  }
  throw new Error('run did not start: ' + url);
}
const inject = (c, n) => c.ev(`(()=>{const s=window.__app.sim;const T=['wolf','crow','root_crawler'];let k=0;while(s.enemies.length<${n}){const a=(k*2.399)%6.2832,d=50+((k*37)%260);s.spawnEnemy(T[k%3],s.player.x+Math.cos(a)*d,s.player.y+Math.sin(a)*d);k++;}return s.enemies.length})()`);
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
const shot = async (c, file, clip) => { const jpg = file.endsWith('.jpg'); const r = await c.send('Page.captureScreenshot', { format: jpg ? 'jpeg' : 'png', ...(jpg ? { quality: 82 } : {}), ...(clip ? { clip } : {}) }); writeFileSync(file, Buffer.from(r.data, 'base64')); return r.data; };

const URL0 = 'http://127.0.0.1:4190/';
const key = (c, type, k) => c.send('Input.dispatchKeyEvent', { type, key: k, code: 'Key' + k.toUpperCase(), windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0) });
const walk = async (c, seq) => { for (const [k, ms] of seq) { await key(c, 'keyDown', k); await sleep(ms); await key(c, 'keyUp', k); } };

const swayInfo = (c) => c.ev(`(()=>{const s=window.__app.scene;const f=s.sway.field;let a=0,n=0,mx=0;for(const k of f.slots.values()){if(k.alpha>0.3)a++;n++;mx=Math.max(mx,Math.abs(k.ang));}return JSON.stringify({gb:s.gbOn,cap:f.cap,slots:n,visible:a,maxLeanDeg:+(mx*57.3).toFixed(1)})})()`);

// perf: 0 and 350 enemies per tier, sway on vs off; the hero walks in a loop so a restored trail (and sway sprites) exist
async function perf(dir) {
  const srv = await serve(dir, 4190); const c = await launch();
  try {
    if (process.env.CPU) await c.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
    for (const inj of [0, 350]) for (const tier of (process.env.TIERS || 'low,med,high').split(',')) for (const sw of ['1', '0']) {
      await open(c, `${URL0}?style=a&auto=elias&seed=1&t=300&god=1&debug=1&sway=${sw}&grant=${GRANT}`, 1280, 720, 1, tier);
      await sleep(3000);
      const acc = { fps: 0, ms: 0, work: 0, sprites: 0, calls: 0, n: 0 }; let sw0 = '';
      for (let i = 0; i < 24; i++) {
        await sleep(500); await autoPick(c); if (inj) await inject(c, inj);
        if (process.env.FULL) await c.ev(`(()=>{const a=window.__app,p=a.sim.player,l=a.scene.life;for(let k=0;k<8;k++){const g=k*0.785;l.stamp(p.x+Math.cos(g)*220,p.y+Math.sin(g)*160,150,1);}return 1})()`); // worst case: restored ground across the whole view (cap binds)
        const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
        if (!r) continue; for (const k of ['fps', 'ms', 'work', 'sprites', 'calls']) acc[k] += r[k]; acc.n++;
      }
      sw0 = await swayInfo(c);
      const n = acc.n || 1; console.log(JSON.stringify({ inj, tier, sway: sw, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(2), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), calls: Math.round(acc.calls / n) }), sw0);
    }
  } finally { c.close(); srv.close(); }
}

// shots: swarm of 350 enemies, hero auto-plays ~14 s so a restored trail exists. Per viewport: one full screenshot + a 3-frame zoom strip.
async function shots(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4190); const c = await launch();
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const tier of (process.env.TIERS || 'high,med,low').split(',')) {
      await open(c, `${URL0}?style=a&auto=elias&seed=${process.env.SEED || 3}&t=${process.env.T || 90}&god=1&debug=0&grant=${GRANT}`, w, h, dpr, tier);
      await sleep(600);
      await walk(c, [['d', 2500], ['s', 2200], ['a', 2800], ['w', 1500], ['d', 1500]]); await autoPick(c);
      if (process.env.INJ !== '0') await inject(c, 350); await sleep(500); await autoPick(c);
      await shot(c, join(out, `${process.env.NAME || ''}${name}-${tier}.jpg`));
      console.log(name, tier, await swayInfo(c));
      if (tier !== 'high' && tier !== 'low') continue;
      if (tier === 'low') continue;
      // motion strip: follow the most visible sprite far from the hero, crop 3 frames 0.9 s apart at 3x, label the lean angle
      const tgt = await c.ev(`(()=>{const s=window.__app.scene,cam=s.cameras.main,f=s.sway.field;let b=null;for(const k of f.slots.values()){const sx=(k.prop.x-cam.worldView.x)*cam.zoom/${dpr},sy=(k.prop.y-cam.worldView.y)*cam.zoom/${dpr};if(sx<60||sy<60||sx>${w}-60||sy>${h}-40)continue;const dd=Math.hypot(k.prop.x-s.sim.player.x,k.prop.y-s.sim.player.y);if(k.alpha<0.8||dd<95)continue;if(!b||dd<b.dd){b={id:k.prop.id,sx,sy,dd};}}return b?JSON.stringify(b):null})()`);
      if (!tgt) continue;
      const T = JSON.parse(tgt); const frames = [];
      const cw = Math.min(150, w / 2), ch = Math.min(100, h / 2);
      for (let i = 0; i < 3; i++) {
        await autoPick(c);
        const ang = await c.ev(`(()=>{const k=window.__app.scene.sway.field.slots.get(${T.id});return k?+(k.ang*57.3).toFixed(1):null})()`);
        const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, T.sx - cw / 2), y: Math.max(0, T.sy - ch * 0.8), width: cw, height: ch, scale: 3 } });
        frames.push({ data: r.data, ang }); await sleep(1100);
      }
      const sheet = await c.ev(`(async()=>{const fr=${JSON.stringify(frames)};const imgs=await Promise.all(fr.map(f=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+f.data})));const cv=document.createElement('canvas');cv.width=imgs[0].width*3+8;cv.height=imgs[0].height+22;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,cv.width,cv.height);imgs.forEach((im,i)=>{g.drawImage(im,i*(im.width+4),22);g.fillStyle='#fff';g.font='14px sans-serif';g.fillText('t+'+(i*1.1).toFixed(1)+'s  lean '+fr[i].ang+' deg',i*(im.width+4)+6,15)});return cv.toDataURL('image/png')})()`);
      writeFileSync(join(out, `${process.env.NAME || ''}strip-${name}-${tier}.png`), Buffer.from(sheet.split(',')[1], 'base64'));
      console.log('strip', name, tier, frames.map((f) => f.ang).join(' / '));
    }
  } finally { c.close(); srv.close(); }
}

// atlas: dump atlas.png and measure sprite pixel contrast vs the restored base colours (luminance, 99th pct of covered pixels)
async function atlas(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4190); const c = await launch();
  try {
    await open(c, `${URL0}?style=a&auto=elias&seed=1&t=20&god=1`, 1280, 720, 1, 'high');
    const res = await c.ev(`(()=>{const im=window.__app.scene.textures.get('ambAtlas').getSourceImage();const g=im.getContext('2d').getImageData(0,0,im.width,im.height).data;
      const L=(r,g2,b)=>0.2126*r+0.7152*g2+0.0722*b; const base={A:L(116,186,92),B:L(80,124,72)};
      const o=[];for(let f=0;f<10;f++){const x0=(f%5)*64,y0=Math.floor(f/5)*64;const v=[];let cov=0;for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=((y0+y)*im.width+x0+x)*4;if(g[i+3]<200)continue;cov++;const l=L(g[i],g[i+1],g[i+2]);const b=f>=3&&f<6?base.B:base.A;v.push(Math.abs(l-b)/b);}v.sort((a,b)=>a-b);o.push({f,cov,p50:+v[(v.length*0.5)|0].toFixed(3),p99:+v[(v.length*0.99)|0].toFixed(3),max:+v[v.length-1].toFixed(3)});}
      return JSON.stringify({w:im.width,h:im.height,o,url:im.toDataURL('image/png')})})()`);
    const r = JSON.parse(res);
    writeFileSync(join(out, 'atlas.png'), Buffer.from(r.url.split(',')[1], 'base64'));
    console.log(r.o.map((x) => JSON.stringify(x)).join('\n'));
  } finally { c.close(); srv.close(); }
}
const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'perf') await perf(a1);
if (cmd === 'shots') await shots(a1, a2);
if (cmd === 'atlas') await atlas(a1, a2);
if (cmd === 'dbg') {
  const srv = await serve(a1, 4190); const c = await launch();
  try {
    await open(c, `${URL0}?style=a&auto=elias&seed=3&t=90&god=1&debug=0`, 1280, 720, 1, 'high');
    await sleep(6000);
    console.log(await c.ev(`(()=>{const s=window.__app.scene,f=s.sway.field,p=s.sim.player;const wv=s.cameras.main.worldView;let lifeMax=0;for(let i=0;i<s.life.life.length;i++)lifeMax=Math.max(lifeMax,s.life.life[i]);return JSON.stringify({cap:f.cap,refreshes:f.refreshes,wv:[wv.x,wv.y,wv.right,wv.bottom],p:[p.x,p.y],lifeHere:s.life.sample(p.x,p.y),lifeMax,slots:f.count,pool:s.sway.all.length,on:window.__app.params.sway,gbOn:s.gbOn})})()`));
  } finally { c.close(); srv.close(); }
}
