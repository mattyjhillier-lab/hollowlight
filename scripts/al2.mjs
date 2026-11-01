// AL-2 (restore-bloom) checks; helpers copied from al1.mjs: headless Chrome over CDP on its own port + own static server. Closes only the processes it spawned.



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

// node scripts/al2.mjs strips dist out -> per viewport/tier: one full frame mid-bloom + a 4-frame strip of one flower popping (stamps life ahead of the hero, away from the clear zone)
const bloomState = (c) => c.ev(`(()=>{const s=window.__app.scene,f=s.sway.field;let buds=0,pop=0,open=0;for(const k of f.slots.values()){if(!k.bloomed)buds++;else if(k.pop>=0)pop++;else open++;}return JSON.stringify({gb:s.gbOn,cap:f.cap,buds,popping:pop,open,sparks:s.sway.sparks.length,pops:f.pops})})()`);
async function strips(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4190); const c = await launch();
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const tier of (process.env.TIERS || 'high,med,low').split(',')) {
      await open(c, `${URL0}?style=a&auto=elias&seed=${process.env.SEED || 3}&t=${process.env.T || 90}&god=1&debug=0&grant=${GRANT}`, w, h, dpr, tier);
      await sleep(800);
      if (process.env.INJ) { await inject(c, Number(process.env.INJ)); await sleep(400); await autoPick(c); await sleep(300); }
      // ground that becomes restored: soft discs just under the bloom threshold (buds appear), then a full stamp (they pop). Outside the 112 clear zone.
      const stamp = (str) => c.ev(`(()=>{const s=window.__app.scene,p=window.__app.sim.player,wv=s.cameras.main.worldView;const sx=(wv.width*0.28);const sy=(wv.height*0.2);for(const [dx,dy] of [[sx,-sy],[-sx,sy*0.8],[sx*0.7,sy*1.1]])s.life.stamp(p.x+dx,p.y+dy,95,${str});return 1})()`);
      await autoPick(c); await stamp(0.497);
      await sleep(600); await stamp(0.497);
      let T = null;
      for (let i = 0; i < 40 && !T; i++) {
        await sleep(100);
        const r = await c.ev(`(()=>{const s=window.__app.scene,cam=s.cameras.main,f=s.sway.field;let any=null;for(const k of f.slots.values()){if(k.bloomed||k.life<0.35)continue;const R=s.game.canvas.getBoundingClientRect(),wv=cam.worldView,sx=R.left+(k.prop.x-wv.x)/wv.width*R.width,sy=R.top+(k.prop.y-wv.y)/wv.height*R.height;if(sx<60||sy<60||sx>${w}-60||sy>${h}-40)continue;const o=JSON.stringify({id:k.prop.id,sx,sy});if(k.prop.flower)return o;if(!any)any=o}return any})()`);
        if (r) T = JSON.parse(r);
      }
      if (T) { // freeze the live update; let the bud fade in fully by hand (life held just under the threshold), then the full stamp
        const step = (n) => c.ev(`(()=>{const s=window.__app.scene,p=window.__app.sim.player;for(let i=0;i<${n};i++)s.sway.update(0.05,window.__app.sim.time,s.cameras.main.worldView,p,s.life,{on:true,cap:s.sway.field.cap,bloom:${tier === 'high' ? 32 : 16},phone:s.swayPhone,reduced:false});return 1})()`);
        await c.ev(`(()=>{window.__app.scene.tickSway=()=>{};return 1})()`);
        await c.ev(`(()=>{const s=window.__app.scene;s.life.decay=1e9;return 1})()`);
        await step(40); await stamp(1);
      }
      console.log(name, tier, await bloomState(c), T ? 'flower found' : 'no popping flower');
      if (!T) await shot(c, join(out, `${name}-${tier}.jpg`));
      if (!T || tier === 'low') continue;
      const frames = []; const cw = Math.min(150, w / 2), ch = Math.min(100, h / 2);
      // freeze the live layer update and step the sway field by hand (0.05 s per call) so the four frames sit at known pop times
      for (const calls of [1, 2, 2, 3]) {
        const st = await c.ev(`(()=>{const s=window.__app.scene,p=window.__app.sim.player;for(let i=0;i<${calls};i++)s.sway.update(0.05,window.__app.sim.time,s.cameras.main.worldView,p,s.life,{on:true,cap:s.sway.field.cap,bloom:${tier === 'high' ? 32 : 16},phone:s.swayPhone,reduced:false});const k=s.sway.field.slots.get(${T.id});return k?JSON.stringify({sc:+k.sc.toFixed(2),pop:+k.pop.toFixed(2),a:+k.alpha.toFixed(2)}):null})()`);
        await sleep(120);
        if (calls === 2 && frames.length === 2) { await autoPick(c); await sleep(200); await shot(c, join(out, `${name}-${tier}.jpg`)); console.log('midbloom', await bloomState(c)); }
        const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, T.sx - cw / 2), y: Math.max(0, T.sy - ch * 0.75), width: cw, height: ch, scale: 3 } });
        frames.push({ data: r.data, st });
      }
      const sheet = await c.ev(`(async()=>{const fr=${JSON.stringify(frames)};const imgs=await Promise.all(fr.map(f=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+f.data})));const cv=document.createElement('canvas');cv.width=imgs[0].width*4+12;cv.height=imgs[0].height+22;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,cv.width,cv.height);imgs.forEach((im,i)=>{g.drawImage(im,i*(im.width+4),22);g.fillStyle='#fff';g.font='13px sans-serif';const s=JSON.parse(fr[i].st||'{}');g.fillText('frame '+(i+1)+'  scale '+s.sc+'  pop '+s.pop+'s',i*(im.width+4)+6,15)});return cv.toDataURL('image/png')})()`);
      writeFileSync(join(out, `strip-${name}-${tier}.png`), Buffer.from(sheet.split(',')[1], 'base64'));
      console.log('strip', name, tier, frames.map((f) => f.st).join(' '));
    }
  } finally { c.close(); srv.close(); }
}
const [cmd2, a1b, a2b] = process.argv.slice(2);
if (cmd2 === 'strips') await strips(a1b, a2b);
if (cmd2 === 'dbg') {
  const srv = await serve(a1b, 4190); const c = await launch();
  try {
    await open(c, `${URL0}?style=a&auto=elias&seed=3&t=90&god=1&debug=0`, 1280, 720, 1, 'high');
    await sleep(800);
    console.log(await c.ev(`(()=>{const s=window.__app.scene,p=window.__app.sim.player,wv=s.cameras.main.worldView;const sx=wv.width*0.28,sy=wv.height*0.2;s.life.stamp(p.x+sx,p.y-sy,140,0.497);return JSON.stringify({p:[p.x,p.y],wv:[wv.x,wv.y,wv.width,wv.height],l:s.life.sample(p.x+sx,p.y-sy),dirty:s.life.dirty,slots:s.sway.field.count,memN:s.sway.field.mem.size})})()`));
    await sleep(700);
    console.log(await c.ev(`(()=>{const s=window.__app.scene,f=s.sway.field;const o=[];for(const k of f.slots.values())o.push([k.prop.flower?1:0,+k.life.toFixed(2),k.bloomed?1:0,+k.alpha.toFixed(2)]);return JSON.stringify({n:o.length,mem:f.mem.size,o:o.slice(0,14)})})()`));
  } finally { c.close(); srv.close(); }
}
