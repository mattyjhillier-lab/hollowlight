// W2 trails checks (harness copied from al1.mjs: headless Chrome over CDP, own port + static server; closes only its own processes).
//   node scripts/w2t.mjs perf dist | shots dist out [CHAR=wren|elias]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9456;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-w2t-'));
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

const URL0 = 'http://127.0.0.1:4191/';
const key = (c, type, k) => c.send('Input.dispatchKeyEvent', { type, key: k, code: 'Key' + k.toUpperCase(), windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0) });
const walk = async (c, seq) => { for (const [k, ms] of seq) { await key(c, 'keyDown', k); await sleep(ms); await key(c, 'keyUp', k); } };

const info = (c) => c.ev(`(()=>{const s=window.__app.scene;return JSON.stringify({segs:s.ribSet.count,drawn:s.ribSet.drawn,slots:s.ribSet.activeSlots(),created:s.ribLayer.created,shown:s.ribLayer.shown,tier:s.quality.tier})})()`);
const CHAR = process.env.CHAR || 'wren';
const q = (extra) => `${URL0}?style=a&auto=${CHAR}&seed=${process.env.SEED || 3}&god=1&debug=1${extra || ''}&grant=${GRANT}`;

async function perf(dir) {
  const srv = await serve(dir, 4191); const c = await launch();
  try {
    if (process.env.CPU) await c.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
    for (const inj of (process.env.INJS || "0,350").split(",").map(Number)) for (const tier of (process.env.TIERS || 'low,med,high').split(',')) for (const tr of (process.env.TR || "1,0").split(",")) {
      await open(c, q(`&t=300&trails=${tr}`), 1280, 720, 1, tier);
      await sleep(3000);
      const acc = { fps: 0, ms: 0, work: 0, sprites: 0, calls: 0, n: 0 };
      const dirs = ['d', 's', 'a', 'w']; let dk = null;
      for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) { if (dk) await key(c, 'keyUp', dk); dk = dirs[(i / 4) | 0]; await key(c, 'keyDown', dk); } // keep the hero moving so ribbons exist
        await sleep(500); await autoPick(c); if (inj) await inject(c, inj);
        const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
        if (!r) continue; for (const k of ['fps', 'ms', 'work', 'sprites', 'calls']) acc[k] += r[k]; acc.n++;
      }
      if (dk) await key(c, 'keyUp', dk);
      const n = acc.n || 1; console.log(JSON.stringify({ inj, tier, trails: tr, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(2), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), calls: Math.round(acc.calls / n) }), await info(c));
    }
  } finally { c.close(); srv.close(); }
}

// shots: per viewport + tier a swarm screenshot; plus a 4-frame walking strip (crop around the hero, 0.35 s apart)
async function shots(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4191); const c = await launch();
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const tier of (process.env.TIERS || 'high,med,low').split(',')) {
      await open(c, q(`&t=${process.env.T || 90}`), w, h, dpr, tier);
      await sleep(600);
      await walk(c, [['d', 1800], ['s', 1500]]); await autoPick(c);
      // strip while holding a walk direction
      await key(c, 'keyDown', 'a');
      const frames = [];
      const cw = Math.min(w, 300), ch = Math.min(h, 190);
      for (let i = 0; i < 4; i++) { await sleep(350); frames.push((await c.send('Page.captureScreenshot', { format: 'png', clip: { x: (w - cw) / 2, y: (h - ch) / 2, width: cw, height: ch, scale: dpr === 1 ? 2 : 1.5 } })).data); }
      await key(c, 'keyUp', 'a');
      const sheet = await c.ev(`(async()=>{const fr=${JSON.stringify(frames)};const imgs=await Promise.all(fr.map(f=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+f})));const W=imgs[0].width,H=imgs[0].height;const cv=document.createElement('canvas');cv.width=W*2+4;cv.height=H*2+4;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,cv.width,cv.height);imgs.forEach((im,i)=>g.drawImage(im,(i%2)*(W+4),Math.floor(i/2)*(H+4)));return cv.toDataURL('image/jpeg',0.86)})()`);
      writeFileSync(join(out, `${CHAR}-strip-${name}-${tier}.jpg`), Buffer.from(sheet.split(',')[1], 'base64'));
      if (process.env.INJ !== '0') await inject(c, 350); await sleep(500); await autoPick(c);
      await shot(c, join(out, `${CHAR}-swarm-${name}-${tier}.jpg`));
      console.log(name, tier, await info(c));
    }
  } finally { c.close(); srv.close(); }
}
const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'perf') await perf(a1);
if (cmd === 'shots') await shots(a1, a2);
