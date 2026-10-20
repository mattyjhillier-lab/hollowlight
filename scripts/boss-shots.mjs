// Elder Treant fight screenshots (docs only): real build, headless Chrome, true size at desktop 1280x720, phone landscape 844x390 @2x, phone portrait 390x844 @2x.
// Frames: arrival (ring forming, the wake + banner), each move's tell (forced through the sim's own startMove), phases 2 / 3, the victory beat (kneel, mask,
// flood x2, hero line, results) and a defeat in the fight (results). Also prints bake time / atlas size and counts PAGE EXC (must be 0).
// Usage: node scripts/boss-shots.mjs <distDir> <outDir> [sizes=desk,land,port] [tier=high]   (own Chrome 9561 + own static server 4281; kills only its own Chrome)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9561, HTTP = 4281;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [dist, out, sizesArg, tierArg] = process.argv.slice(2);
if (!dist || !out) { console.error('usage: node scripts/boss-shots.mjs <distDir> <outDir> [sizes] [tier]'); process.exit(2); }
const TIER = ['high', 'med', 'low'].includes(tierArg) ? tierArg : 'high';
mkdirSync(out, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
const root = resolve(dist);
const srv = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
  const f = resolve(join(root, p));
  if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => srv.listen(HTTP, '127.0.0.1', r));
const dir = mkdtempSync(join(tmpdir(), 'hl-boss-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', '--use-angle=d3d11', '--ignore-gpu-blocklist',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
console.log('chrome pid', proc.pid);
for (let i = 0; i < 240; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); let exc = 0;
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.method === 'Page.javascriptDialogOpening') ws.send(JSON.stringify({ id: 900000 + (++id), method: 'Page.handleJavaScriptDialog', params: { accept: true } })); if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') console.error('PAGE ERR', JSON.stringify(d.params.args.map((a) => a.value ?? a.description)).slice(0, 300)); if (d.method === 'Runtime.exceptionThrown') { exc++; console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); } if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pending.has(i)) { pending.delete(i); rej(new Error('cdp timeout ' + method)); } }, 60000); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const until = async (expr, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await ev(expr)) return true; } catch { /* */ } await sleep(60); } throw new Error('timeout: ' + expr); };
const SIZES = { desk: [1280, 720, 1, false], land: [844, 390, 2, true], port: [390, 844, 2, true] };
// metrics per shot (DR2 + boss readability): red-orange share in a 240 px box round the hero; boss body vs the ring floor around it (CIE L*)
// (runs in the page; sent as source text)
async function metFn(b64, hx, hy, bx, by, bh, dpr) {
  const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = (r, gg, b) => { const y = 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; };
  const box = (x0, y0, w, h) => { x0 = Math.max(0, Math.round(x0 * dpr)); y0 = Math.max(0, Math.round(y0 * dpr)); w = Math.min(c.width - x0, Math.round(w * dpr)); h = Math.min(c.height - y0, Math.round(h * dpr)); return w > 0 && h > 0 ? g.getImageData(x0, y0, w, h).data : new Uint8ClampedArray(0); };
  const mean = (d) => { let s = 0, k = 0; for (let i = 0; i < d.length; i += 4) { s += L(d[i], d[i + 1], d[i + 2]); k++; } return k ? +(s / k).toFixed(1) : null; };
  const d = box(hx - 120, hy - 120, 240, 240); let ro = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { n++; const r = d[i], gg = d[i + 1], b = d[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); if (r > 170 && r === mx && (mx - mn) / mx > 0.45 && gg < r * 0.62 && gg > r * 0.18 && b < r * 0.5) ro++; }
  return { ro: n ? +(100 * ro / n).toFixed(2) : 0, bossL: bh > 0 ? mean(box(bx - bh * 0.14, by - bh * 0.55, bh * 0.28, bh * 0.35)) : null, groundL: bh > 0 ? mean(box(bx + bh * 0.45, by - bh * 0.1, bh * 0.3, bh * 0.2)) : null };
}
const POS = "(()=>{const sc=window.__app.scene,cam=sc.cameras.main,s=window.__app.sim,cv=sc.game.canvas,rc=cv.getBoundingClientRect(),kx=rc.width/cv.width,ky=rc.height/cv.height;const scr=(x,y)=>[rc.left+((x-cam.scrollX-cam.width/2)*cam.zoom+cam.width/2)*kx,rc.top+((y-cam.scrollY-cam.height/2)*cam.zoom+cam.height/2)*ky];const b=s.boss;return {h:scr(s.player.x,s.player.y),b:b?scr(b.x,b.y):[0,0],bh:b?85*cam.zoom*ky:0,dpr:window.devicePixelRatio||1}})()";
const metrics = {};
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); console.log('wrote', name);
  try {
    const p = await ev(POS);
    const m = await ev('(' + metFn.toString() + ')(' + JSON.stringify(r.data) + ',' + [p.h[0], p.h[1], p.b[0], p.b[1], p.bh, p.dpr].join(',') + ')');
    metrics[name] = m; console.log('  metrics', name, JSON.stringify(m));
  } catch (e) { console.log('  metrics failed', name, String(e.message).slice(0, 120)); }
};
const S = 'window.__app.sim', F = 'window.__app.sim.fight', BV = 'window.__app.scene.bossView';
// keep the hero at a spot relative to the boss, full HP; the boss idle (no move of its own)
const place = (dx, dy) => ev(`(()=>{const s=${S},b=s.boss,f=s.fight;s.player.x=b.x+${dx};s.player.y=b.y+${dy};f.clampIn(s.player,8);s.player.hp=s.player.maxHp;f.gapT=1e9;return 1})()`);
const force = (move) => ev(`(()=>{const s=${S},b=s.boss,f=s.fight;f.cancelMove();f.startMove(b,Math.hypot(s.player.x-b.x,s.player.y-b.y),'${move}');return 1})()`);
// force a move and wait until its tell is k of the way through (retried: a level-up card or a phase stagger can cancel it)
const poseTell = async (mv, dx, dy, k) => { for (let i = 0; i < 4; i++) { try { await place(dx, dy); await force(mv); await tellAt(k); return; } catch (e) { if (i === 3) throw e; } } };
const tellAt = (k) => until(`${F}.move && (${S}.time - ${F}.tells[0].t0) >= ${k} * (${F}.tells[0].t1 - ${F}.tells[0].t0)`, 6000);

try {
  await send('Page.enable'); await send('Runtime.enable');
  for (const sz of (sizesArg || 'desk,land,port').split(',')) {
    const [W, H, dpr, mobile] = SIZES[sz];
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: dpr, mobile, screenWidth: W, screenHeight: H });
    // ---- defeat in the fight
    console.log('defeat: load');
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?auto=wren&seed=4&t=838&god=1` });
    await until('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.bossView)', 90000);
    await ev(`window.__app.save.setSettings({quality:'${TIER}',reducedMotion:false}),1`);
    await ev("(()=>{clearInterval(window.__bp);window.__bp=setInterval(()=>{const a=window.__app,s=a&&a.sim;if(!s)return;s.xp=Math.min(s.xp,0);if(s.state==='levelup')a.pick((s.offer.gold[0]||s.offer.cards[0]).key)},50);return 1})()");
    await until(`${F} && ${F}.stage === 'fight'`, 20000);
    await ev(`(()=>{const s=${S},b=s.boss;s.time+=81;b.hp=b.maxHp*0.5;b.floorHp=b.maxHp*0.33;s.fight.phase=1;s.fight.fightT=81;s.godMode=false;s.player.hp=5;s.player.iframes=0;s.fight.lastHitT=-9;s.fight.cancelMove();s.player.x=b.x+70;s.player.y=b.y;s.fight.startMove(b,70,'sweep');return 1})()`);
    console.log('defeat: forced'); await until(`${S}.state==='defeat'`, 8000); console.log('defeat: dead');
    await until(`!!document.querySelector('.u6-wrap')`, 15000); await sleep(1600); await shot(`${sz}-50-defeat-results`);
    // ---- arrival + fight + victory (god mode, Elias with a small kit)
    if (process.env.ONLY !== 'defeat') {
    await send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?auto=elias&seed=3&t=836&god=1&grant=holy_orbit:power=3` });
    await until('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.bossView)', 90000);
    await ev(`window.__app.save.setSettings({quality:'${TIER}',reducedMotion:false}),1`);
    await ev("(()=>{clearInterval(window.__bp);window.__bp=setInterval(()=>{const a=window.__app,s=a&&a.sim;if(!s)return;s.xp=Math.min(s.xp,0);if(s.state==='levelup')a.pick((s.offer.gold[0]||s.offer.cards[0]).key)},50);return 1})()");
    await ev('window.__app.paused=true,1');
    await until(`${BV}.baked.ok`, 60000);
    const info = await ev(`(()=>{const i=${BV}.baked.info;return {ms:Math.round(i.ms),mb:+(i.bytes/1048576).toFixed(2),w:i.layout.w,h:i.layout.h}})()`);
    console.log(sz, 'bake', JSON.stringify(info));
    await ev('window.__app.paused=false,1');
    await until(`${F} && ${F}.introT > 0.85`); await shot(`${sz}-01-arrival-ring`);
    await until(`${F}.introT > 2.35`); await shot(`${sz}-02-arrival-wake`);
    await until(`${F}.stage === 'fight'`);
    await ev(`${S}.weapons.length=0,1`); // no damage while we pose the tells
    for (const [mv, dx, dy] of [['slam', 50, 20], ['eruption', 110, 30], ['seeds', 120, 40]]) { await poseTell(mv, dx, dy, 0.6); await shot(`${sz}-1${mv === 'slam' ? 0 : mv === 'eruption' ? 1 : 2}-tell-${mv}`); await until(`!${F}.move`, 6000); }
    // phase 2 + its tells
    await ev(`(()=>{const b=${S}.boss;b.hp=b.floorHp;return 1})()`); await sleep(250); await shot(`${sz}-20-phase2-call`);
    await until(`!(${S}.boss.staggerT>0)`, 5000);
    for (const [mv, dx, dy] of [['sweep', 80, 10], ['fan', 140, -20]]) { await poseTell(mv, dx, dy, 0.7); await shot(`${sz}-2${mv === 'sweep' ? 1 : 2}-tell-${mv}`); await until(`!${F}.move`, 6000); }
    await ev(`(()=>{const s=${S};for(const e of s.enemies) if(!e.boss){e.hp=0;e.dead=true;} return 1})()`);
    // phase 3 + its tells
    await ev(`(()=>{const b=${S}.boss;b.hp=b.floorHp;return 1})()`); await sleep(250); await shot(`${sz}-30-phase3-call`);
    await until(`!(${S}.boss.staggerT>0)`, 5000);
    await ev(`(()=>{const s=${S};for(const e of s.enemies) if(!e.boss){e.hp=0;e.dead=true;} return 1})()`);
    for (const [mv, dx, dy] of [['lanes', 90, 30], ['nova', 70, 40]]) { await poseTell(mv, dx, dy, 0.7); if (process.env.DEBUG) console.log(mv, await ev(`JSON.stringify({a:${F}.arena,t:${F}.tells.map(t=>[t.x|0,t.y|0,+t.ax.toFixed(2),+t.ay.toFixed(2),t.len|0]),b:[${S}.boss.x|0,${S}.boss.y|0],p:[${S}.player.x|0,${S}.player.y|0],wv:(({x,y,width,height})=>[x|0,y|0,width|0,height|0])(window.__app.scene.cameras.main.worldView)})`)); await shot(`${sz}-3${mv === 'lanes' ? 1 : 2}-tell-${mv}`); await until(`!${F}.move`, 6000); }
    // victory beat
    await place(110, 40);
    await ev(`(()=>{const s=${S};s.hurt(s.boss,1e9);return 1})()`);
    await until(`${S}.state==='victory' && ${BV}.vicT>0.8`); await shot(`${sz}-40-victory-kneel`);
    await until(`${BV}.vicT>2.1`); await shot(`${sz}-41-victory-mask`);
    await until(`${BV}.vicT>3.0`); await shot(`${sz}-42-victory-flood`);
    await until(`${BV}.vicT>4.3`); await shot(`${sz}-43-victory-flood-full`);
    await until(`${BV}.vicT>5.4`); await shot(`${sz}-44-victory-line`);
    await until(`!!document.querySelector('.u6-wrap')`, 15000); await sleep(1400); await shot(`${sz}-45-victory-results`);
    }
  }
  console.log('page exceptions', exc);
  writeFileSync(join(out, `metrics-${TIER}.json`), JSON.stringify(metrics, null, 1));
} finally {
  try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } srv.close();
  setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500);
}
