// W5 world air + AL-5 critters screenshots (harness copied from w4.mjs: headless Chrome over CDP, own port + static server; closes only its own processes).
//   node scripts/w5w.mjs shots dist out
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9474;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-w5w-'));
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
const sheet = (c, frames, labels) => c.ev(`(async()=>{const fr=${JSON.stringify(frames)},lb=${JSON.stringify(labels)};const imgs=await Promise.all(fr.map(f=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+f})));const cv=document.createElement('canvas');cv.width=imgs[0].width*imgs.length+4*(imgs.length-1);cv.height=imgs[0].height+22;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,cv.width,cv.height);imgs.forEach((im,i)=>{g.drawImage(im,i*(im.width+4),22);g.fillStyle='#fff';g.font='13px sans-serif';g.fillText(lb[i],i*(im.width+4)+6,15)});return cv.toDataURL('image/png')})()`);
const heroScreen = (c) => c.ev(`(()=>{const s=window.__app.scene,p=window.__app.sim.player,wv=s.cameras.main.worldView,R=s.game.canvas.getBoundingClientRect();return JSON.stringify({x:R.left+(p.x-wv.x)/wv.width*R.width,y:R.top+(p.y-wv.y)/wv.height*R.height,k:R.width/wv.width})})()`).then(JSON.parse);
// force a critter of a kind next to the hero (visual layer only), bypassing the 6 s calm spell
const force = (c, kind, dx, dy) => c.ev(`(()=>{const sc=window.__app.scene,f=sc.critters.field,p=window.__app.sim.player;f.quiet=99;f.hush=false;const k=${kind};f.spawn({key:900+k,kind:k,x:p.x+(${dx}),y:p.y+(${dy}),h:0.7},0);const s=f.slots.find(z=>z.on&&z.key===900+k);if(s){s.a=1;s.state=1}return !!s})()`);
const cstate = (c) => c.ev(`(()=>{const sc=window.__app.scene;return JSON.stringify({tier:sc.quality.tier,gb:sc.gbOn,air:sc.air.count,fog:sc.air.nFog,motes:sc.air.nAir,edge:sc.air.nEdge,crit:sc.critters.field.live,hush:sc.critters.field.hush,en:window.__app.sim.enemies.length})})()`);
const clip = async (c, w, h) => { const hs = await heroScreen(c); const cw = Math.min(w * 0.9, 680), ch = Math.min(h * 0.8, 400); return { x: Math.max(0, hs.x - cw / 2), y: Math.max(0, hs.y - ch * 0.55), width: cw, height: ch, scale: 1 }; };

async function shots(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4194); const c = await launch();
  const char = process.env.CHAR || 'wren';
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const tier of (process.env.TIERS || 'high,med,low').split(',')) {
      // 1 meadow with fog + fireflies (night-ish, restored glade), full frame
      await open(c, q('&t=' + (process.env.T || 330)), w, h, dpr, tier);
      await sleep(800); await tp(c, 2000, 900); await restore(c, 520); await sleep(2500); await restore(c, 520);
      await shot(c, join(out, `meadow-${char}-${name}-${tier}.jpg`)); console.log('meadow', name, tier, await cstate(c));
      if (tier === 'high' && name === 'desk') { // A/B reference: the same frame without the W5 air
        await open(c, q('&t=' + (process.env.T || 330) + '&fog=0&motes=0&critters=0&edge=0'), w, h, dpr, tier);
        await sleep(800); await tp(c, 2000, 900); await restore(c, 520); await sleep(2500); await restore(c, 520);
        await shot(c, join(out, `meadow-air-off-${char}-${name}-${tier}.jpg`));
        await open(c, q('&t=' + (process.env.T || 330)), w, h, dpr, tier);
        await sleep(800); await tp(c, 2000, 900); await restore(c, 520); await sleep(2500); await restore(c, 520);
      }
      // 2 critter flee strip (hare then sparrow then moth): hero steps toward a critter, 4 frames 0.12 s apart
      if (tier !== 'low') {
        for (const [kn, kind] of [['hare', 1], ['sparrow', 0], ['moth', 2]]) {
          await tp(c, 2000, 900); await restore(c, 520); await sleep(300);
          await force(c, kind, 130, 10); await sleep(500);
          const frames = []; const labels = [];
          const cp = await clip(c, w, h);
          for (let i = 0; i < 4; i++) {
            if (i === 1) await c.ev(`(()=>{const f=window.__app.scene.critters.field,s=f.slots.find(z=>z.on),p=window.__app.sim.player;if(s){p.x=s.x-${kind === 2 ? 30 : 55};p.y=s.y;}return 1})()`);
            await restore(c, 520);
            frames.push((await c.send('Page.captureScreenshot', { format: 'png', clip: cp })).data); labels.push(`${kn} ${tier} ${name} frame ${i + 1}`);
            await sleep(i === 0 ? 400 : 140);
          }
          writeFileSync(join(out, `flee-${kn}-${name}-${tier}.png`), Buffer.from((await sheet(c, frames, labels)).split(',')[1], 'base64'));
        }
        // 2b still: a calm critter set (all three) next to the hero for a close look
        await tp(c, 2000, 900); await restore(c, 520);
        await force(c, 1, 70, 20); await force(c, 0, 105, -10); await force(c, 2, 85, 45); await sleep(1500);
        await shot(c, join(out, `critters-calm-${char}-${name}-${tier}.png`), await clip(c, w, h));
        // 3 swarm: critters hush
        await sleep(200); await autoPick(c); await inject(c, 350); await sleep(300); await autoPick(c);
        for (let i = 0; i < 30; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
        await sleep(1500); await restore(c, 520); await inject(c, 350);
        await shot(c, join(out, `swarm-hush-${char}-${name}-${tier}.jpg`)); console.log('swarm', name, tier, await cstate(c));
      }
      // 4 edge wall: hero at the west + north-west edge
      await open(c, q('&t=' + (process.env.T || 330)), w, h, dpr, tier);
      await sleep(800); await tp(c, 90, 90); await restore(c, 300); await sleep(2000);
      await shot(c, join(out, `edge-nw-${char}-${name}-${tier}.jpg`)); console.log('edge', name, tier, await cstate(c));
      await tp(c, 3910, 2100); await restore(c, 300); await sleep(2000);
      await shot(c, join(out, `edge-e-${char}-${name}-${tier}.jpg`));
    }
  } finally { c.close(); srv.close(); }
}
const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'shots') await shots(a1, a2);
