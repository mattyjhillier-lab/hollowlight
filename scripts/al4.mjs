// AL-4 creature-reactive foliage checks (harness copied from w4.mjs: headless Chrome over CDP, own port + static server; closes only its own processes).
//   node scripts/al4.mjs perf dist | strips dist out
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9472;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-al4-'));
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
const URL1 = 'http://127.0.0.1:4194/';
const q = (extra) => `${URL1}?style=a&auto=${process.env.CHAR || 'wren'}&seed=${process.env.SEED || 3}&god=1&debug=0${extra || ''}&grant=${GRANT}`;
const key = (c, type, k) => c.send('Input.dispatchKeyEvent', { type, key: k, code: 'Key' + k.toUpperCase(), windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0) });
const tp = (c, x, y) => c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;p.x=${x};p.y=${y};a.scene.cameras.main.centerOn(${x},${y});l.decay=1e9;return 1})()`);
const restore = (c, r = 460) => c.ev(`(()=>{const l=window.__app.scene.life,p=window.__app.sim.player;l.stamp(p.x,p.y,${r},1);return 1})()`);
const pst = (c) => c.ev(`(()=>{const s=window.__app.scene,pf=s.push;let mxT=0,nT=0,mxB=0,nB=0;for(const k of s.sway.field.slots.values()){const a=k.pst?Math.abs(k.pst.pa):0;if(a>0.02)nT++;mxT=Math.max(mxT,a)}for(const k of s.props.field.slots.values()){const a=k.pst?Math.abs(k.pst.pa):0;if(a>0.01)nB++;mxB=Math.max(mxB,a)}return JSON.stringify({tier:s.quality.tier,gb:s.gbOn,sources:pf.n,budget:pf.budget,tufts:s.sway.field.count,leaningTufts:nT,maxTuft:+mxT.toFixed(2),props:s.props.field.count,leaningProps:nB,maxProp:+mxB.toFixed(2),enemies:window.__app.sim.enemies.length})})()`);

async function perf(dir) {
  const srv = await serve(dir, 4194); const c = await launch();
  try {
    if (process.env.CPU) await c.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
    for (const inj of (process.env.INJS || '350').split(',').map(Number)) for (const tier of (process.env.TIERS || 'low,med,high').split(',')) for (const push of (process.env.PUSH || '1,0').split(',')) {
      await open(c, q('&t=300&push=' + push), 1280, 720, 1, tier);
      await tp(c, 2000, 1000); await restore(c);
      await sleep(2500);
      const acc = { fps: 0, ms: 0, work: 0, sprites: 0, calls: 0, n: 0 };
      let held = null;
      for (let i = 0; i < 24; i++) {
        const want = (i % 8) < 4 ? 'd' : 'a';
        if (held !== want) { if (held) await key(c, 'keyUp', held); await key(c, 'keyDown', want); held = want; }
        await sleep(500); await autoPick(c); await restore(c); if (inj) await inject(c, inj);
        if (i < 6) continue;
        const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
        if (!r) continue; for (const k of ['fps', 'ms', 'work', 'sprites', 'calls']) acc[k] += r[k]; acc.n++;
      }
      if (held) await key(c, 'keyUp', held);
      const n = acc.n || 1; console.log(JSON.stringify({ inj, tier, push, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(2), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), calls: Math.round(acc.calls / n) }), await pst(c));
    }
  } finally { c.close(); srv.close(); }
}

// 4-frame contact sheet (PNG, labelled) from base64 frames
const sheet = (c, frames, labels) => c.ev(`(async()=>{const fr=${JSON.stringify(frames)},lb=${JSON.stringify(labels)};const imgs=await Promise.all(fr.map(f=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+f})));const cv=document.createElement('canvas');cv.width=imgs[0].width*imgs.length+4*(imgs.length-1);cv.height=imgs[0].height+22;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,cv.width,cv.height);imgs.forEach((im,i)=>{g.drawImage(im,i*(im.width+4),22);g.fillStyle='#fff';g.font='13px sans-serif';g.fillText(lb[i],i*(im.width+4)+6,15)});return cv.toDataURL('image/png')})()`);
const heroScreen = (c) => c.ev(`(()=>{const s=window.__app.scene,p=window.__app.sim.player,wv=s.cameras.main.worldView,R=s.game.canvas.getBoundingClientRect();return JSON.stringify({x:R.left+(p.x-wv.x)/wv.width*R.width,y:R.top+(p.y-wv.y)/wv.height*R.height,k:R.width/wv.width})})()`).then(JSON.parse);

// hero walks right through restored grass: 4 frames 0.14 s apart round the hero (foliage ahead leans away, behind springs back), then a swarm frame set
async function strips(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4194); const c = await launch();
  const char = process.env.CHAR || 'wren';
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const tier of (process.env.TIERS || 'high,med,low').split(',')) {
      await open(c, q('&t=120'), w, h, dpr, tier);
      await sleep(800);
      await tp(c, 2000, 900); await restore(c); await sleep(2200);
      // walking strip
      await key(c, 'keyDown', 'd'); await sleep(500);
      const frames = []; const labels = []; const states = [];
      for (let i = 0; i < 4; i++) {
        await restore(c);
        const hs = await heroScreen(c); const cw = Math.min(w * 0.9, 680), ch = Math.min(h * 0.8, 400);
        const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, hs.x - cw / 2), y: Math.max(0, hs.y - ch * 0.55), width: cw, height: ch, scale: 1 } });
        frames.push(r.data); labels.push(`${char} ${tier} walking, frame ${i + 1}  (+${(i * 0.15).toFixed(2)} s)`);
        states.push(await pst(c));
        await sleep(120);
      }
      await key(c, 'keyUp', 'd');
      writeFileSync(join(out, `strip-${char}-${name}-${tier}.png`), Buffer.from((await sheet(c, frames, labels)).split(',')[1], 'base64'));
      console.log('strip', char, name, tier, states[2]);
      await shot(c, join(out, `walk-${char}-${name}-${tier}.jpg`));
      if (tier === 'low') continue;
      // swarm: 350 enemies, hero walking; 4 full-frame (cropped round the hero) frames
      await autoPick(c); await inject(c, 350); await sleep(300); await autoPick(c);
      for (let i = 0; i < 30; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
      await key(c, 'keyDown', 'd'); await sleep(400);
      const sf = []; const sl = []; let sst = null;
      for (let i = 0; i < 4; i++) {
        await restore(c); await inject(c, 350); await autoPick(c);
        const hs = await heroScreen(c); const cw = Math.min(w * 0.9, 680), ch = Math.min(h * 0.8, 400);
        const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, hs.x - cw / 2), y: Math.max(0, hs.y - ch * 0.55), width: cw, height: ch, scale: 1 } });
        sf.push(r.data); sl.push(`${char} ${tier} swarm, frame ${i + 1}  (+${(i * 0.2).toFixed(2)} s)`); sst = await pst(c);
        await sleep(160);
      }
      await key(c, 'keyUp', 'd');
      writeFileSync(join(out, `swarm-strip-${char}-${name}-${tier}.png`), Buffer.from((await sheet(c, sf, sl)).split(',')[1], 'base64'));
      console.log('swarm', char, name, tier, sst);
      await shot(c, join(out, `swarm-${char}-${name}-${tier}.jpg`));
    }
  } finally { c.close(); srv.close(); }
}
const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'perf') await perf(a1);
if (cmd === 'strips') await strips(a1, a2);
