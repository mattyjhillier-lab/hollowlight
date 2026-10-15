// A1 (Wren v2 rig) checks: headless Chrome over CDP on its own port, own static server. Closes only the processes it spawned.
// node scripts/a1.mjs perf <distDir>            -> frame ms / sprites / draw calls per tier, normal and with 350 injected enemies
// node scripts/a1.mjs shots <distDir> <outDir>  -> real-run screenshots (desktop + phone) and 1:1 / 3x hero crops
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9444;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
const GRANT = 'ghost_wolves:speed=3,power=3;raven_flock:power=3;spirit_bolts:power=3,pierce=2;holy_orbit:power=2';

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
  const dir = mkdtempSync(join(tmpdir(), 'hl-a1-'));
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
const shot = async (c, file, clip) => { const r = await c.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) }); writeFileSync(file, Buffer.from(r.data, 'base64')); return r.data; };

async function perf(dir) {
  const srv = await serve(dir, 4181); const c = await launch(); const rows = [];
  try {
    for (const inj of [0, 350]) for (const tier of ['low', 'med', 'high']) {
      await open(c, `http://127.0.0.1:4181/?style=a&auto=wren&seed=1&t=300&god=1&debug=1&grant=${GRANT}`, 1280, 720, 1, tier);
      await sleep(3000);
      const acc = { fps: 0, ms: 0, work: 0, sprites: 0, calls: 0, n: 0 };
      for (let i = 0; i < 24; i++) {
        await sleep(500); await autoPick(c); if (inj) await inject(c, inj);
        const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
        if (!r) continue; for (const k of ['fps', 'ms', 'work', 'sprites', 'calls']) acc[k] += r[k]; acc.n++;
      }
      const n = acc.n || 1; rows.push({ inj, tier, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(2), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), calls: Math.round(acc.calls / n) });
      console.log(JSON.stringify(rows[rows.length - 1]));
    }
  } finally { c.close(); srv.close(); }
}

// Real-run frames. Movement is driven by the page's own key events (simulating W/A/S/D) so the rig sees real motion.
async function shots(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4181); const c = await launch();
  const key = (type, k) => c.send('Input.dispatchKeyEvent', { type, key: k, code: k === 'a' ? 'KeyA' : k === 'd' ? 'KeyD' : k === 'w' ? 'KeyW' : 'KeyS', windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0) });
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) {
      await open(c, `http://127.0.0.1:4181/?style=a&auto=wren&seed=1&t=${process.env.T || 6}&god=1&debug=1`, w, h, dpr, process.env.Q || 'high');
      await sleep(1500);
      const info = await c.ev('(()=>{const s=window.__app.scene,z=s.cameras.main.zoom;return {zoom:z,dpr:devicePixelRatio,px:z/devicePixelRatio}})()');
      console.log(name, JSON.stringify(info));
      const cropAround = async () => {
        const pos = await c.ev('(()=>{const s=window.__app.scene,cam=s.cameras.main,p=window.__app.sim.player;const r=s.scale.canvas.getBoundingClientRect();return {x:r.left+(p.x-cam.worldView.x)*cam.zoom/devicePixelRatio,y:r.top+(p.y-cam.worldView.y)*cam.zoom/devicePixelRatio,z:cam.zoom/devicePixelRatio}})()');
        return pos;
      };
      const seq = [['idle', null, 1800], ['right', 'd', 1100], ['left', 'a', 1100], ['up', 'w', 900], ['down', 's', 900]];
      for (const [tag, k, ms] of seq) {
        if (k) await key('keyDown', k);
        await sleep(ms);
        await autoPick(c);
        await shot(c, join(out, `${name}-${tag}.png`));
        if (name === 'desk' || name === 'land') {
          const p = await cropAround(); const half = 45; const clip = { x: Math.max(0, p.x - half), y: Math.max(0, p.y - half), width: half * 2, height: half * 2, scale: 4 };
          await shot(c, join(out, `crop-${name}-${tag}.png`), clip);
        }
        if (k) await key('keyUp', k);
      }
      await c.ev('(()=>{const s=window.__app.sim;s.player.hp=Math.max(1,s.player.hp);return 1})()');
      await inject(c, 40); await sleep(1400); await shot(c, join(out, `${name}-crowd.png`));
      if (name === 'desk') {
        // hurt frame: take damage (god mode may block hp loss: force the rig's hurt flag through the sim hook when available)
        await c.ev('window.__app.sim.player.iframes=0;window.__app.sim.player.hp=Math.max(5,window.__app.sim.player.hp-1);true');
        await sleep(120); await shot(c, join(out, `${name}-hurt.png`));
      }
    }
  } finally { c.close(); srv.close(); }
}

// node scripts/a1.mjs atlas <distDir> <outDir>: dumps the rig atlas + flat sprites as PNGs (art inspection)
async function atlas(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4181); const c = await launch();
  try {
    await open(c, `http://127.0.0.1:4181/?style=a&auto=wren&seed=1&t=300&god=1&debug=1`, 1280, 720, 1, 'high');
    for (const k of ['wren_rig', 'hero_wren', 'hero_wren_o', 'pup_sit', 'pup_run']) {
      const b64 = await c.ev(`(()=>{const im=window.__game.textures.get('${k}').getSourceImage();const Z=${process.env.Z||1};const cv=document.createElement('canvas');cv.width=im.width*Z;cv.height=im.height*Z;const g=cv.getContext('2d');g.fillStyle='#46506a';g.fillRect(0,0,cv.width,cv.height);g.drawImage(im,0,0,cv.width,cv.height);return cv.toDataURL('image/png').split(',')[1]})()`);
      writeFileSync(join(out, `tex-${k}.png`), Buffer.from(b64, 'base64'));
    }
  } finally { c.close(); srv.close(); }
}

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'atlas') await atlas(a1, a2);
if (cmd === 'perf') await perf(a1);
if (cmd === 'shots') await shots(a1, a2);
process.exit(0);
