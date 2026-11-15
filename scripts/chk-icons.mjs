// CHK: ability icon shots (Wren Pelt Dash vs Elias Sanctuary Ring): in-run button + hero select + tree hero card, desk + phone.
// node scripts/chk-icons.mjs <outDir> [prefix]   (reads dist/)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9493, HTTP = 4293, out = process.argv[2] || 'docs/screenshots/chk', pre = process.argv[3] || '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css' };
mkdirSync(out, { recursive: true });
const root = resolve('dist');
const srv = await new Promise((r) => { const s = createServer((req, res) => { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = resolve(join(root, p)); if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); }); s.listen(HTTP, '127.0.0.1', () => r(s)); });
const dir = mkdtempSync(join(tmpdir(), 'hl-ico-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const shot = async (name, clip) => { const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 3 } } : {}) }); writeFileSync(join(out, `${pre}${name}.png`), Buffer.from(r.data, 'base64')); console.log('shot', name); };
const VIEWS = { desk: [1280, 720, 1, false], phone: [390, 844, 2, true] };
async function nav(url, v) {
  const [w, h, dpr, mob] = VIEWS[v];
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: mob });
  await send('Emulation.setTouchEmulationEnabled', mob ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/${url}` });
}
for (const v of ['desk', 'phone']) {
  for (const hero of ['wren', 'elias']) {
    await nav(`?auto=${hero}&seed=1&t=60&god=1&debug=0`, v);
    for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app&&window.__app.sim&&window.__app.scene&&window.__app.scene.pools)')) break; } catch {} }
    await sleep(2500); await shot(`run-${hero}-${v}`);
    await ev('(()=>{__app.sim.ability.cdLeft=0;return 1})()'); await sleep(900);
    const bx = await ev("(()=>{const e=document.querySelector('.ability, .hud-ability, [class*=ability]');const r=(document.querySelector('.ability')||e).getBoundingClientRect();return {x:Math.max(0,r.x-20),y:Math.max(0,r.y-20),width:r.width+40,height:r.height+40};})()");
    await shot(`btn-ready-${hero}-${v}`, bx);
  }
  // hero select + tree card (fresh profile seeded with both heroes)
  await nav('?debug=0', v);
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app&&window.__app.ui&&window.__app.ui.screen)')) break; } catch {} }
  await ev("(()=>{const A=__app,d=A.save.data;d.chars={wren:{xp:0,keep:0,woke:true},elias:{xp:0,keep:0,woke:true}};d.stats.runs=3;d.stats.charsUsed={wren:2,elias:1};A.save.save&&A.save.save();return 1})()");
  await ev("(()=>{const b=document.querySelector('.pwa-no');if(b)b.click();return 1})()");
  await sleep(600);
  try { await ev("(()=>{const A=__app;A.ui.loadoutFromTree=false;A.ui.showStart(A.ui.onPick);A.ui.beginLoadout&&A.ui.beginLoadout();return 1})()"); } catch (e) { console.log('hero select nav failed', e.message); }
  await sleep(1500); await shot(`heroselect-${v}`);
  try { await ev("(()=>{__app.openTree();return 1})()"); } catch (e) { console.log('tree nav failed', e.message); }
  await sleep(3000); await shot(`tree-${v}`);
}
try { ws.close(); proc.kill(); } catch {} srv.close(); setTimeout(() => process.exit(0), 500);
