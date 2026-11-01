// W2 trails checks (harness copied from al1.mjs: headless Chrome over CDP, own port + static server; closes only its own processes).
//   node scripts/w3c.mjs perf dist | shots dist out [CHAR=wren|elias]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9461;
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
  const dir = mkdtempSync(join(tmpdir(), 'hl-w3c-'));
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
const URL1 = 'http://127.0.0.1:4192/';
const q = (extra) => `${URL1}?style=a&auto=${process.env.CHAR || 'wren'}&seed=${process.env.SEED || 3}&god=1&debug=0${extra || ''}&grant=${GRANT}`;
const cinfo = (c) => c.ev(`(()=>{const s=window.__app.scene,l=s.life;let n=0,mx=0;for(const v of l.corr){if(v>0.2)n++;if(v>mx)mx=v}return JSON.stringify({tier:s.quality.tier,gb:s.gbOn,cellsOver02:n,max:+mx.toFixed(2),enemies:window.__app.sim.enemies.length,blobs:s.corrBlobs.filter(b=>b.visible).length,bl:s.corrBlobs.filter(b=>b.visible).slice(0,3).map(b=>[Math.round(b.x),Math.round(b.y),+b.alpha.toFixed(2),+b.scaleX.toFixed(2),b.depth])})})()`);

async function perf(dir) {
  const srv = await serve(dir, 4192); const c = await launch();
  try {
    if (process.env.CPU) await c.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
    for (const inj of (process.env.INJS || '0,350').split(',').map(Number)) for (const tier of (process.env.TIERS || 'low,med,high').split(',')) {
      await open(c, q('&t=300'), 1280, 720, 1, tier);
      await sleep(3000);
      const acc = { fps: 0, ms: 0, work: 0, sprites: 0, calls: 0, n: 0 };
      for (let i = 0; i < 24; i++) {
        await sleep(500); await autoPick(c); if (inj) await inject(c, inj);
        if (i < 8) continue; // let corruption bloom first
        const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
        if (!r) continue; for (const k of ['fps', 'ms', 'work', 'sprites', 'calls']) acc[k] += r[k]; acc.n++;
      }
      const n = acc.n || 1; console.log(JSON.stringify({ inj, tier, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(2), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), calls: Math.round(acc.calls / n) }), await cinfo(c));
    }
  } finally { c.close(); srv.close(); }
}

// shots: start | swarm (350 enemies, ~BLOOM s of real time) | boundary (restored patch inside a big corrupted patch, wolves on the ink)
async function shots(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4192); const c = await launch();
  try {
    for (const [name, w, h, dpr] of [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]]) for (const tier of (process.env.TIERS || 'high,med,low').split(',')) {
      await open(c, q('&t=' + (process.env.T || 120)), w, h, dpr, tier);
      await sleep(1500);
      await shot(c, join(out, `start-${name}-${tier}.jpg`));
      for (let i = 0; i < Number(process.env.BLOOM || 24); i++) { await inject(c, 350); await autoPick(c); await sleep(500); }
      for (let i = 0; i < 40; i++) { await autoPick(c); await sleep(120); if (await c.ev("window.__app.sim.state==='running'")) break; }
      await shot(c, join(out, `swarm-${name}-${tier}.jpg`));
      console.log(name, tier, 'swarm', await cinfo(c));
      // boundary: far away patch
      await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;p.x=2400;p.y=2400;
        for(let i=0;i<60;i++)l.stampCorr(2400,2400,260,0.2); l.stamp(2400,2400,95,1);
        for(let k=0;k<8;k++){const an=k*0.785;s.spawnEnemy(k%2?'wolf':'root_crawler',p.x+Math.cos(an)*(130+(k%3)*30),p.y+Math.sin(an)*(110+(k%3)*30));}
        for(let k=0;k<12;k++)s.spawnEnemy('root_crawler',p.x+230+(k%4)*14,p.y-60+Math.floor(k/4)*14);
        return 1})()`);
      await sleep(1400); await autoPick(c);
      await c.ev(`(()=>{const l=window.__app.scene.life;l.stamp(2400,2400,95,1);return 1})()`);
      await sleep(250);
      await shot(c, join(out, `boundary-${name}-${tier}.jpg`));
      await shot(c, join(out, `boundary-${name}-${tier}.png`));
    }
  } finally { c.close(); srv.close(); }
}

// contrast: render ground crop at hero-free spot with full corruption, measure p99 local contrast of the ink region and compare enemy tint vs ink luminance
async function contrast(dir, out) {
  mkdirSync(out, { recursive: true });
  const srv = await serve(dir, 4192); const c = await launch();
  try {
    await open(c, q('&t=60'), 1280, 720, 1, 'high');
    await sleep(800);
    await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;p.x=3000;p.y=1000;for(let i=0;i<60;i++)l.stampCorr(3000,1000,500,0.3);return 1})()`);
    await sleep(1200);
    const d = await shot(c, join(out, 'ink-full.png'));
    const r = await c.ev(`(async()=>{const im=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+${JSON.stringify(d)}});const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const g=cv.getContext('2d');g.drawImage(im,0,0);
      const x0=60,y0=240,W=400,H=300;const px=g.getImageData(x0,y0,W,H).data;const L=new Float32Array(W*H);for(let i=0;i<W*H;i++)L[i]=(0.2126*px[i*4]+0.7152*px[i*4+1]+0.0722*px[i*4+2])/255;
      const R=6;const dev=[];let mean=0;for(let y=R;y<H-R;y+=2)for(let x=R;x<W-R;x+=2){let lo=1,hi=0;for(let dy=-R;dy<=R;dy+=3)for(let dx=-R;dx<=R;dx+=3){const v=L[(y+dy)*W+x+dx];if(v<lo)lo=v;if(v>hi)hi=v}dev.push(hi-lo);mean+=L[y*W+x]}
      dev.sort((a,b)=>a-b);return JSON.stringify({meanLum:+(mean/dev.length).toFixed(3),p50:+dev[dev.length>>1].toFixed(3),p99:+dev[Math.floor(dev.length*0.99)].toFixed(3),p999:+dev[Math.floor(dev.length*0.999)].toFixed(3)})})()`);
    console.log('ink local contrast (12px box max-min, of 1.0):', r);
  } finally { c.close(); srv.close(); }
}
const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'perf') await perf(a1);
if (cmd === 'shots') await shots(a1, a2);
if (cmd === 'cost') { const srv = await serve(a1, 4192); const c = await launch(); try { await open(c, q('&t=300'), 1280, 720, 1, process.env.TIER || 'high'); await sleep(1500); await inject(c, 350);
  console.log(await c.ev(`(()=>{const s=window.__app.scene,sim=window.__app.sim;const t0=performance.now();for(let i=0;i<200;i++)s.tickCorruption(sim);const a=(performance.now()-t0)/200;const t1=performance.now();for(let i=0;i<50;i++){s.life.dirty=true;s.life.acc=1;s.life.update(0.1)}const b=(performance.now()-t1)/50;return JSON.stringify({tickCorruptionMs:+a.toFixed(3),lifeUpdateMs:+b.toFixed(3)})})()`)); } finally { c.close(); srv.close(); } }
if (cmd === 'contrast') await contrast(a1, a2);
