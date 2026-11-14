// CHK: ground colour over a 15-min run (real build, bot plays ~14 s at each moment; fresh life map each time).
// node scripts/chk-ground.mjs <outDir>   env: DIST, BRIGHT (normal|brighter|clear), GENTLE=1, TS
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9491, HTTP = 4291;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css' };
const out = process.argv[2] || 'docs/screenshots/chk';
mkdirSync(out, { recursive: true });
const root = resolve(process.env.DIST || 'dist');
const srv = await new Promise((r) => { const s = createServer((req, res) => { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = resolve(join(root, p)); if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); }); s.listen(HTTP, '127.0.0.1', () => r(s)); });
const dir = mkdtempSync(join(tmpdir(), 'hl-chk-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const BR = process.env.BRIGHT || 'normal';
const TS = (process.env.TS || '0,120,240,360,480,600,720,840').split(',').map(Number);
const views = { desk: [1280, 720, 1], port: [390, 844, 2] };
const MEAS = `(async (b64) => { const im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/jpeg;base64,' + b64; });
 const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
 const x0 = Math.round(im.width * 0.2), y0 = Math.round(im.height * 0.25), w = Math.round(im.width * 0.6), h = Math.round(im.height * 0.5);
 const d = g.getImageData(x0, y0, w, h).data; let S = 0, C = 0, Y = 0, n = 0, hi = 0;
 for (let i = 0; i < d.length; i += 16) { const r = d[i], gg = d[i+1], b = d[i+2]; const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); S += mx ? (mx - mn) / mx : 0; C += mx - mn; Y += 0.2126*r + 0.7152*gg + 0.0722*b; if (mx - mn > 40) hi++; n++; }
 return { sat: +(S/n).toFixed(3), chroma: +(C/n).toFixed(1), luma: +(Y/n).toFixed(1), vivid: +(hi/n).toFixed(3) }; })`;
const rows = [];
for (const view of (process.env.VIEWS || 'desk').split(',')) {
  const [w, h, dpr] = views[view];
  for (const t of TS) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?auto=wren&seed=1&t=${t}&god=1&debug=0` });
    for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app&&window.__app.sim&&window.__app.scene&&window.__app.scene.pools)')) break; } catch {} }
    await ev(`window.__app.save.setSettings({quality:'high',brightness:'${BR}'${process.env.GENTLE ? ',gentleLight:true' : ''}}); true`);
    if (process.env.ROAM) await ev(`(()=>{const s=window.__app.sim;let k=0;window.__roam=setInterval(()=>{k+=0.1;const p=s.player;const a=k*0.5;p.x+=Math.cos(a)*14;p.y+=Math.sin(a*0.7)*14;},100);return 1})()`);
    await sleep(process.env.ROAM ? 24000 : 14000);
    await ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
    await sleep(600);
    const info = await ev(`(()=>{const a=window.__app,s=a.sim,l=a.scene.life;let n=0,m=0;for(let i=0;i<l.life.length;i++){if(l.life[i]>0.5)n++;} return {simT:+s.time.toFixed(1),restoredCells:n,arcSat:a.scene.arc.sat,arcY:+a.scene.arc.y.toFixed(3),vibS:a.scene.vib&&a.scene.vib.s,R:a.scene.vib&&a.scene.vib.R};})()`);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    const m = await ev(`${MEAS}(${JSON.stringify(shot.data)})`);
    const name = `${BR}${process.env.GENTLE ? '-gentle' : ''}${process.env.ROAM ? '-roam' : ''}-${view}-${String(t / 60).replace('.', '_')}m.jpg`;
    writeFileSync(join(out, name), Buffer.from(shot.data, 'base64'));
    const row = { view, t, ...info, ...m }; rows.push(row); console.log(JSON.stringify(row));
  }
}
writeFileSync(join(out, `ground-${BR}${process.env.GENTLE ? '-gentle' : ''}${process.env.ROAM ? '-roam' : ''}.json`), JSON.stringify(rows, null, 1));
try { ws.close(); proc.kill(); } catch {} srv.close(); setTimeout(() => process.exit(0), 500);
