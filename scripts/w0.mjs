// W0 (life map + ground blend) checks, copied from a2.mjs: headless Chrome over CDP on its own port, own static server. Closes only the processes it spawned.
// node scripts/a1.mjs perf <distDir>            -> frame ms / sprites / draw calls per tier, normal and with 350 injected enemies
// node scripts/a1.mjs shots <distDir> <outDir>  -> real-run screenshots (desktop + phone) and 1:1 / 3x hero crops
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9446;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-w0-'));
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

const URL0 = 'http://127.0.0.1:4183/';
const key = (c, type, k) => c.send('Input.dispatchKeyEvent', { type, key: k, code: 'Key' + k.toUpperCase(), windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0) });
const walk = async (c, seq) => { for (const [k, ms] of seq) { await key(c, 'keyDown', k); await sleep(ms); await key(c, 'keyUp', k); } };

// node scripts/w0.mjs perf dist: ms/frame per tier with 0 and 350 enemies, plus gb state
async function perf(dir) {
  const srv = await serve(dir, 4183); const c = await launch();
  try {
    if (process.env.CPU) await c.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
    for (const inj of [0, 350]) for (const tier of (process.env.TIERS || 'low,med,high').split(',')) for (const flat of (process.env.FLAT ? ['&ground=flat'] : [''])) {
      await open(c, `${URL0}?style=a&auto=elias&seed=1&t=300&god=1&debug=1${flat}&grant=${GRANT}`, 1280, 720, 1, tier);
      await sleep(3000);
      const acc = { fps: 0, ms: 0, work: 0, sprites: 0, calls: 0, n: 0 };
      for (let i = 0; i < 24; i++) {
        await sleep(500); await autoPick(c); if (inj) await inject(c, inj);
        const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
        if (!r) continue; for (const k of ['fps', 'ms', 'work', 'sprites', 'calls']) acc[k] += r[k]; acc.n++;
      }
      const gb = await c.ev('window.__app.scene.gbOn');
      const n = acc.n || 1; console.log(JSON.stringify({ inj, tier, flat: !!flat, gb, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(2), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), calls: Math.round(acc.calls / n) }));
    }
  } finally { c.close(); srv.close(); }
}

// node scripts/w0.mjs shots dist out: walk a loop so a restored trail forms, shots at 3 viewports x tiers, plus ?life=1 view
async function shots(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4183); const c = await launch();
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const tier of (process.env.TIERS || 'high,low').split(',')) {
      await open(c, `${URL0}?style=a&auto=elias&seed=1&t=${process.env.T || 20}&god=1&debug=0&life=1`, w, h, dpr, tier);
      await sleep(800);
      await walk(c, [['d', 1500], ['s', 1200], ['a', 1500], ['w', 700]]);
      await autoPick(c);
      await sleep(300);
      await shot(c, join(out, `${name}-${tier}.jpg`));
      console.log(name, tier, await c.ev('JSON.stringify({gb:window.__app.scene.gbOn,lm:window.__app.scene.lmOn,life:Array.from(window.__app.scene.life.life).filter(v=>v>0.05).length})'));
    }
  } finally { c.close(); srv.close(); }
}

// node scripts/w0.mjs fallback dist: a forced shader compile failure must not crash and must give the Low look
async function fallback(dir) {
  const srv = await serve(dir, 4183); const c = await launch();
  try {
    await c.send('Page.enable'); await c.send('Runtime.enable');
    await open(c, `${URL0}?style=a&auto=elias&seed=1&t=20&god=1&debug=1&ground=flat`, 1280, 720, 1, 'high');
    await sleep(1500);
    console.log('flat param ->', await c.ev('JSON.stringify({gb:window.__app.scene.gbOn,lmOn:window.__app.scene.lmOn,groundVisible:window.__app.scene.ground.visible})'));
    // inject a bad shader: fail() then applyTier() must restore the tile
    console.log('fail() ->', await c.ev('(()=>{const s=window.__app.scene;s.gb.fail();s.applyTier();return JSON.stringify({gb:s.gbOn,groundVisible:s.ground.visible,failed:s.gb.failed})})()'));
  } finally { c.close(); srv.close(); }
}

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'perf') await perf(a1);
if (cmd === 'shots') await shots(a1, a2);
if (cmd === 'fallback') await fallback(a1);
