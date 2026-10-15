// Minimal headless-Chrome CDP driver (no dependencies; Node 22+ global WebSocket).
// Usage: node scripts/cdp.mjs shots <outDir> [baseUrl]   | node scripts/cdp.mjs perf [baseUrl]
// Needs `npm run build && npx vite preview --port 4173` running.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-chrome-'));
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--autoplay-policy=no-user-gesture-required', ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ }
    await sleep(250);
  }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') console.error('PAGE ERR', d.params.args.map((a) => a.value || a.description).join(' '));
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };
  const close = () => { try { ws.close(); proc.kill(); } catch { /* ignore */ } };
  return { send, ev, close };
}

async function open(c, url, w, h, dpr) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable');
  await c.send('Runtime.enable');
  await c.send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try {
      if (await c.ev('!!(window.__app && window.__app.sim)')) {
        if (process.env.Q) await c.ev(`window.__app.save.setSettings({quality:'${process.env.Q}'}); true`);
        return;
      }
    } catch { /* loading */ }
  }
  console.error(await c.ev('JSON.stringify({rs:document.readyState,app:typeof window.__app,sim:!!(window.__app&&window.__app.sim),href:location.href,txt:document.body.innerText.slice(0,200)})'));
  throw new Error('run did not start: ' + url);
}

// Top the live enemy count up to n (dev only; bypasses the sim spawn cap) so swarms can be measured on demand.
async function inject(c, n) {
  await c.ev(`(()=>{const s=window.__app.sim;const T=['wolf','crow','root_crawler'];let k=0;while(s.enemies.length<${n}){const a=(k*2.399)%6.2832,d=50+((k*37)%260);s.spawnEnemy(T[k%3],s.player.x+Math.cos(a)*d,s.player.y+Math.sin(a)*d);k++;}return s.enemies.length})()`);
}

// Dismiss any level-up overlay so the sim keeps running during measurements.
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");

const simT = (c) => c.ev('window.__app.sim.time');
async function waitSim(c, fn, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if (await c.ev(fn)) return true; await sleep(100); }
  return false;
}

async function shot(c, file) {
  const r = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(r.data, 'base64'));
}

const GRANT = process.env.NOGRANT ? '' : 'ghost_wolves:speed=3,power=3;raven_flock:power=3;spirit_bolts:power=3,pierce=2;holy_orbit:power=2';

export async function shots(out, base) {
  mkdirSync(out, { recursive: true });
  const c = await launch();
  try {
    for (const st of ['a', 'b']) {
      for (const [tag, w, h, dpr] of [['', 1280, 720, 1], ['phone-', 390, 844, 2]]) {
        const q = (t) => `${base}/?style=${st}&auto=wren&seed=1&t=${t}&god=1&debug=1&grant=${GRANT}`;
        await open(c, q(300), w, h, dpr);
        await waitSim(c, 'window.__app.sim.time > 306');
        await shot(c, join(out, `${st}-${tag}midrun.raw.png`));
        await open(c, q(358), w, h, dpr);
        await waitSim(c, 'window.__app.sim.time > 364');
        await shot(c, join(out, `${st}-${tag}swarm.raw.png`));
        await open(c, q(598), w, h, dpr);
        await waitSim(c, '!!window.__app.sim.boss');
        await c.ev('(()=>{const s=window.__app.sim;const b=s.boss;s.player.x=b.x-110;s.player.y=b.y+30;return true})()');
        await sleep(900);
        await shot(c, join(out, `${st}-${tag}boss.raw.png`));
        if (tag === '') {
          // level-up overlay
          await open(c, `${base}/?style=${st}&auto=wren&seed=2&t=120&god=1&debug=1&rr=2&ban=2`, w, h, dpr);
          await waitSim(c, 'window.__app.sim.state === "levelup"', 60000);
          await sleep(900);
          await shot(c, join(out, `${st}-levelup.raw.png`));
        }
      }
    }
  } finally { c.close(); }
}

// Per style x tier: run from t=300 for `secs`, sample scene.perf.rec twice a second.
export async function perf(base, secs = 12, throttle = 1, styles = ['a', 'b'], tiers = ['low', 'med', 'high'], size = (process.env.SIZE || '1280,720,1').split(',').map(Number)) {
  const c = await launch();
  const rows = [];
  try {
    if (throttle > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    for (const st of styles) {
      for (const tier of tiers) {
        await open(c, `${base}/?style=${st}&auto=wren&seed=1&t=${process.env.T || 300}&god=1&debug=1&grant=${GRANT}`, ...size);
        await c.ev(`window.__app.save.setSettings({quality:'${tier}'}); true`);
        await sleep(3000);
        const acc = { fps: 0, ms: 0, work: 0, sprites: 0, particles: 0, calls: 0, n: 0 };
        for (let i = 0; i < secs * 2; i++) {
          await sleep(500);
          await autoPick(c);
          if (process.env.INJECT) await inject(c, Number(process.env.INJECT));
          const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
          if (!r) continue;
          for (const k of ['fps', 'ms', 'work', 'sprites', 'particles', 'calls']) acc[k] += r[k];
          acc.n++;
        }
        const gpu = await c.ev('(()=>{const g=document.createElement("canvas").getContext("webgl");const e=g&&g.getExtension("WEBGL_debug_renderer_info");return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):"?"})()');
        const n = acc.n || 1;
        rows.push({ style: st, tier, throttle, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(1), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), particles: Math.round(acc.particles / n), calls: Math.round(acc.calls / n), gpu });
        console.log(JSON.stringify(rows[rows.length - 1]));
      }
    }
  } finally { c.close(); }
  return rows;
}

// Zoomed crop around the player at DPR 2 (art inspection). node scripts/cdp.mjs closeup <outDir> [t]
export async function closeup(out, base, t = 358) {
  mkdirSync(out, { recursive: true });
  const c = await launch();
  try {
    for (const st of ['a', 'b']) {
      await open(c, `${base}/?style=${st}&auto=wren&seed=1&t=${t}&god=1&debug=1&grant=${GRANT}`, 1280, 720, 2);
      await waitSim(c, `window.__app.sim.time > ${Number(t) + 6}`);
      const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 400, y: 160, width: 480, height: 300, scale: 2 } });
      writeFileSync(join(out, `${st}-closeup.png`), Buffer.from(r.data, 'base64'));
    }
  } finally { c.close(); }
}

// Luma stats of the play-area crop (x 5-95%, y 20-82%) of a PNG data string, computed in the page (no deps).
const LUMA_JS = (b64) => `(async()=>{const im=new Image();im.src='data:image/png;base64,${b64}';await im.decode();const W=im.width,H=im.height;const cv=document.createElement('canvas');const x0=Math.round(W*0.05),x1=Math.round(W*0.95),y0=Math.round(H*0.2),y1=Math.round(H*0.82);cv.width=x1-x0;cv.height=y1-y0;const g=cv.getContext('2d');g.drawImage(im,x0,y0,x1-x0,y1-y0,0,0,x1-x0,y1-y0);const d=g.getImageData(0,0,cv.width,cv.height).data;const h=new Uint32Array(256);let sum=0,n=0;for(let i=0;i<d.length;i+=4){const l=Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);h[l]++;sum+=l;n++;}const pc=(p)=>{let a=0;for(let v=0;v<256;v++){a+=h[v];if(a>=n*p)return v;}return 255};return {mean:+(sum/n).toFixed(1),median:pc(0.5),p95:pc(0.95),p995:pc(0.995)}})()`;

// Re-encode a PNG smaller for docs: optional downscale and colour quantisation (step q) so it stays under ~300 KB.
const SHRINK_JS = (b64, scale, q) => `(async()=>{const im=new Image();im.src='data:image/png;base64,${b64}';await im.decode();const cv=document.createElement('canvas');cv.width=Math.round(im.width*${scale});cv.height=Math.round(im.height*${scale});const g=cv.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,0,0,cv.width,cv.height);const id=g.getImageData(0,0,cv.width,cv.height);const d=id.data;for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,Math.round(d[i]/${q})*${q});d[i+1]=Math.min(255,Math.round(d[i+1]/${q})*${q});d[i+2]=Math.min(255,Math.round(d[i+2]/${q})*${q});}g.putImageData(id,0,0);return cv.toDataURL('image/png').split(',')[1]})()`;

// node scripts/cdp.mjs wow <outDir> <tag> [baseUrl]: desktop + phone screenshots at t=300 (env T) with luma stats, tier from env Q (default auto->as set).
export async function wow(out, tag, base) {
  mkdirSync(out, { recursive: true });
  const c = await launch();
  const res = {};
  try {
    for (const [name, w, h, dpr] of [['desktop', 1280, 720, 1], ['phone', 390, 844, 2]]) {
      await open(c, `${base}/?style=a&auto=wren&seed=1&t=${process.env.T || 300}&god=1&debug=1&grant=${GRANT}`, w, h, dpr);
      if (process.env.Q) await c.ev(`window.__app.save.setSettings({quality:'${process.env.Q}'}); true`);
      if (process.env.INJECT) await inject(c, Number(process.env.INJECT));
      for (let k = 0; k < 14; k++) { await sleep(500); await autoPick(c); }
      const r = await c.send('Page.captureScreenshot', { format: 'png' });
      res[name] = await c.ev(LUMA_JS(r.data));
      let small = r.data;
      const tries = process.env.NOSHRINK ? [] : [[1, 6], [1, 10], [0.75, 8], [0.75, 14], [0.6, 12]];
      for (const [sc, q] of tries) {
        small = await c.ev(SHRINK_JS(r.data, sc, q));
        if (Buffer.from(small, 'base64').length < 290 * 1024) break;
      }
      writeFileSync(join(out, `${tag}-${name}.png`), Buffer.from(small, 'base64'));
      res[name].kb = Math.round(Buffer.from(small, 'base64').length / 1024);
      res[name].info = await c.ev('(()=>{const s=window.__app.scene;const z=s.cameras.main.zoom;return {zoom:+z.toFixed(3),view:[Math.round(s.cameras.main.worldView.width),Math.round(s.cameras.main.worldView.height)],tier:s.quality.tier,heroPx:Math.round(26*z/(window.devicePixelRatio||1))}})()');
    }
    console.log(JSON.stringify(res));
  } finally { c.close(); }
}

// node scripts/cdp.mjs shrink <file.png>: re-encode in place under ~290 KB.
async function shrinkFile(file) {
  const c = await launch();
  try {
    const raw = readFileSync(file).toString('base64');
    for (const [sc, q] of [[1, 6], [1, 10], [0.75, 8], [0.75, 14], [0.6, 12]]) {
      const out = await c.ev(SHRINK_JS(raw, sc, q));
      writeFileSync(file, Buffer.from(out, 'base64'));
      if (Buffer.from(out, 'base64').length < 290 * 1024) break;
    }
  } finally { c.close(); }
}

// node scripts/cdp.mjs sheet <out.png>: greyscale silhouette sheet of hero, enemies and summons (outline-readability check).
async function sheet(file) {
  const c = await launch();
  try {
    await open(c, 'http://localhost:4173/?style=a&auto=wren&seed=1&t=300&god=1&debug=1', 1280, 720, 1);
    const b64 = await c.ev(`(()=>{const keys=['hero_wren','hero_elias','wolf','crow','root','wolfU','raven','orb','bolt','gem'];const H=120;const cv=document.createElement('canvas');cv.width=keys.length*130;cv.height=H+10;const g=cv.getContext('2d');g.fillStyle='#808080';g.fillRect(0,0,cv.width,cv.height);keys.forEach((k,i)=>{const im=window.__game.textures.get(k).getSourceImage();const s=Math.min(110/im.width,110/im.height);g.filter='grayscale(1)';g.drawImage(im,i*130+10,5,im.width*s,im.height*s);g.filter='none';});return cv.toDataURL('image/png').split(',')[1]})()`);
    writeFileSync(file, Buffer.from(b64, 'base64'));
  } finally { c.close(); }
}

const [cmd, a1, a2, a3] = process.argv.slice(2);
if (cmd === 'sheet') await sheet(a1);
if (cmd === 'shrink') await shrinkFile(a1);
if (cmd === 'wow') await wow(a1, a2, a3 || 'http://localhost:4173');
// Dev probe: node scripts/cdp.mjs probe <style> <outFile>  (env JS = expression run in the page after load, Q = tier)
if (cmd === 'probe') {
  const c = await launch();
  try {
    await open(c, `http://localhost:4173/?style=${a1}&auto=wren&seed=1&t=358&god=1&debug=1&grant=${GRANT}`, 1280, 720, 1);
    await waitSim(c, 'window.__app.sim.time > 364');
    if (process.env.JS) console.log(await c.ev(process.env.JS));
    await sleep(1200);
    await shot(c, a2);
  } finally { c.close(); }
}
if (cmd === 'closeup') await closeup(a1, 'http://localhost:4173', a2 || 358);
if (cmd === 'shots') await shots(a1, a2 || 'http://localhost:4173');
else if (cmd === 'perf') {
  const th = Number(process.env.THROTTLE || 1);
  const tiers = process.env.TIERS ? process.env.TIERS.split(',') : undefined;
  await perf(a1 || 'http://localhost:4173', Number(process.env.SECS || 12), th, process.env.STYLES ? process.env.STYLES.split(',') : undefined, tiers);
}
process.exit(0);
