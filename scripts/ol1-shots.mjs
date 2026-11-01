// OL1 outline strips (docs only): real build, real key input, the hero cropped at 3x for each facing / flip / walk phase, Wren + Elias,
// Med/High rig and Low flat sprite. Writes one PNG strip per hero x tier: <out>/<tag>-<hero>-<tier>.png
// Usage: node scripts/ol1-shots.mjs <distDir> <outDir> <tag>   (own Chrome 9544 + own static server 4264)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9544, HTTP = 4264;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [dist, out, tag] = process.argv.slice(2);
if (!dist || !out || !tag) { console.error('usage: node scripts/ol1-shots.mjs <distDir> <outDir> <tag>'); process.exit(2); }
mkdirSync(out, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const root = resolve(dist);
const srv = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
  const f = resolve(join(root, p));
  if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => srv.listen(HTTP, '127.0.0.1', r));
const dir = mkdtempSync(join(tmpdir(), 'hl-ol-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
console.log('chrome pid', proc.pid);
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const KEYS = { d: ['d', 'KeyD', 68], a: ['a', 'KeyA', 65], w: ['w', 'KeyW', 87], s: ['s', 'KeyS', 83] };
const key = (type, k) => { const [kk, code, vk] = KEYS[k]; return send('Input.dispatchKeyEvent', { type, key: kk, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(type === 'keyDown' ? { text: kk } : {}) }); };

const W = 1280, H = 720, BOX = 88, Z = 3;
// keep the hero lit and the outline at full strength; nothing else on screen near her
const hold = "(()=>{const a=window.__app,s=a.sim;s.enemies.length=0;s.xp=-1e9;s.player.iframes=0;s.player.hp=s.player.maxHp;a.scene.heroOutA=1;return 1})()";
async function crop(label) {
  const c = await ev(`(()=>{const sc=window.__app.scene,cam=sc.cameras.main,p=window.__app.sim.player;const dpr=window.devicePixelRatio||1;const r=sc.game.canvas.getBoundingClientRect();const sx=(p.x-cam.scrollX-cam.width/2)*cam.zoom+cam.width/2,sy=(p.y-cam.scrollY-cam.height/2)*cam.zoom+cam.height/2;return {x:r.left+sx/dpr,y:r.top+sy/dpr}})()`);
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: c.x - BOX / 2, y: c.y - BOX * 0.62, width: BOX, height: BOX, scale: Z } });
  return { label, data: r.data };
}
const shots = {};
try {
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.enable'); await send('Runtime.enable');
  for (const hero of ['wren', 'elias']) {
    for (const tier of ['high', 'low']) {
      await send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?auto=${hero}&seed=3&t=20&god=1` });
      let ok = false; for (let i = 0; i < 80 && !ok; i++) { await sleep(250); try { ok = await ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)'); } catch { /* */ } }
      if (!ok) throw new Error('no run');
      await ev(`window.__app.save.setSettings({quality:'${tier}',reducedMotion:false}),1`);
      await ev(hold); await sleep(600);
      const row = [];
      const snap = async (label) => { await ev(hold); await sleep(16); row.push(await crop(label)); };
      await snap('still right');
      await key('keyDown', 'd'); await sleep(250); await snap('walk R a'); await sleep(90); await snap('walk R b'); await sleep(90); await snap('walk R c');
      await key('keyUp', 'd'); await key('keyDown', 'a'); await sleep(40); await snap('flip'); await sleep(250); await snap('walk L a'); await sleep(90); await snap('walk L b');
      await key('keyUp', 'a'); await sleep(500); await snap('still left');
      await key('keyDown', 'w'); await sleep(250); await snap('up (L)'); await key('keyUp', 'w');
      await key('keyDown', 's'); await sleep(250); await snap('down (L)'); await key('keyUp', 's');
      shots[`${hero}-${tier}`] = row;
    }
  }
  // compose the strips in the browser (labels under each crop)
  await send('Page.navigate', { url: 'about:blank' }); await sleep(300);
  for (const [k, row] of Object.entries(shots)) {
    const png = await ev(`(async()=>{const row=${JSON.stringify(row)};const S=${BOX * Z},L=22;const cv=document.createElement('canvas');cv.width=S*row.length;cv.height=S+L;const g=cv.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,cv.width,cv.height);
      for(let i=0;i<row.length;i++){const im=new Image();im.src='data:image/png;base64,'+row[i].data;await im.decode();g.drawImage(im,i*S,0,S,S);g.fillStyle='#eee';g.font='15px sans-serif';g.fillText(row[i].label,i*S+6,S+16);g.strokeStyle='#333';g.strokeRect(i*S+0.5,0.5,S-1,S-1);}
      return cv.toDataURL('image/png').slice(22)})()`);
    writeFileSync(join(out, `${tag}-${k}.png`), Buffer.from(png, 'base64'));
    console.log('wrote', `${tag}-${k}.png`);
  }
} finally {
  try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } srv.close();
  setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500);
}
