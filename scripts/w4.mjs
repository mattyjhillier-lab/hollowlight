// W4 props + AL-3 checks (harness copied from w3c.mjs: headless Chrome over CDP, own port + static server; closes only its own processes).
//   node scripts/w4.mjs perf dist | shots dist out
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9471;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-w4-'));
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
const cinfo = (c) => c.ev(`(()=>{const s=window.__app.scene,l=s.life;let n=0,mx=0;for(const v of l.corr){if(v>0.2)n++;if(v>mx)mx=v}return JSON.stringify({tier:s.quality.tier,gb:s.gbOn,cellsOver02:n,max:+mx.toFixed(2),enemies:window.__app.sim.enemies.length,blobs:s.corrBlobs.filter(b=>b.visible).length,bl:s.corrBlobs.filter(b=>b.visible).slice(0,3).map(b=>[Math.round(b.x),Math.round(b.y),+b.alpha.toFixed(2),+b.scaleX.toFixed(2),b.depth])})})()`);

const pinfo = (c) => c.ev(`(()=>{const s=window.__app.scene,L=s.props;let imgs=0,vis=0;for(const im of L.all)if(im.visible)vis++;return JSON.stringify({tier:s.quality.tier,gb:s.gbOn,props:L.count,visImgs:vis,pool:L.pool.length,all:L.all.length,petals:L.petals.petals.length,enemies:window.__app.sim.enemies.length})})()`);
const tp = (c, x, y) => c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xpNeeded=1e9;p.x=${x};p.y=${y};a.scene.cameras.main.centerOn(${x},${y});l.decay=1e9;return 1})()`);
const live = (c, mode) => c.ev(`(()=>{const l=window.__app.scene.life,p=window.__app.sim.player;const m=${JSON.stringify(mode)};if(m==='all')l.stamp(p.x,p.y,420,1);else if(m==='half'){for(let i=0;i<8;i++)l.stamp(p.x+120+i*30,p.y+(i%2?-40:40),150,1);}return 1})()`);

async function perf(dir) {
  const srv = await serve(dir, 4194); const c = await launch();
  try {
    if (process.env.CPU) await c.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
    for (const inj of (process.env.INJS || '0,350').split(',').map(Number)) for (const tier of (process.env.TIERS || 'low,med,high').split(',')) for (const props of (process.env.PROPS || '1,0').split(',')) {
      await open(c, q('&t=300&props=' + props), 1280, 720, 1, tier);
      await tp(c, 2000, 1000); await live(c, 'all');
      await sleep(2500);
      const acc = { fps: 0, ms: 0, work: 0, sprites: 0, calls: 0, n: 0 };
      for (let i = 0; i < 20; i++) {
        await sleep(500); await autoPick(c); if (inj) await inject(c, inj);
        if (i < 6) continue;
        const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
        if (!r) continue; for (const k of ['fps', 'ms', 'work', 'sprites', 'calls']) acc[k] += r[k]; acc.n++;
      }
      const n = acc.n || 1; console.log(JSON.stringify({ inj, tier, props, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(2), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), calls: Math.round(acc.calls / n) }), await pinfo(c));
    }
  } finally { c.close(); srv.close(); }
}

// scenes: meadow (Meadow Run), forest (Dead Grove), split (restored right half vs Hollow left), swarm-meadow, swarm-forest, hollow-forest
const SCENES = { meadow: [2000, 900, 'all'], forest: [700, 700, 'all'], split: [1900, 1100, 'half'], 'hollow-forest': [3300, 700, null], 'swarm-meadow': [2000, 900, 'all'], 'swarm-forest': [700, 700, 'all'] };
async function shots(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4194); const c = await launch();
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const tier of (process.env.TIERS || 'high,med,low').split(',')) {
      await open(c, q('&t=' + (process.env.T || 120)), w, h, dpr, tier);
      await sleep(800);
      for (const [sn, [x, y, mode]] of Object.entries(SCENES)) {
        if (process.env.ONLY && !process.env.ONLY.split(',').includes(sn)) continue;
        await tp(c, x, y); if (mode) await live(c, mode);
        await sleep(2600);
        if (sn.startsWith('swarm')) { for (let i = 0; i < 5; i++) { await inject(c, 350); await autoPick(c); await sleep(400); } await inject(c, 350); await sleep(250); for (let i = 0; i < 40; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); } await sleep(150); }
        await shot(c, join(out, `${sn}-${name}-${tier}.jpg`));
        if (process.env.PNG) await shot(c, join(out, `${sn}-${name}-${tier}.png`));
        console.log(sn, name, tier, await pinfo(c));
      }
    }
  } finally { c.close(); srv.close(); }
}
const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'perf') await perf(a1);
if (cmd === 'shots') await shots(a1, a2);
if (cmd === 'atlas') { const srv = await serve(a1, 4194); const c = await launch(); try { await open(c, q('&t=60'), 800, 450, 1, 'high'); await sleep(500);
  const d = await c.ev(`window.__app.scene.textures.get('propAtlas').getSourceImage().toDataURL('image/png')`);
  writeFileSync(a2, Buffer.from(d.split(',')[1], 'base64')); console.log('atlas', a2); } finally { c.close(); srv.close(); } }
