// HUD-1 check: node scripts/hud1-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// Headless Chrome over CDP: real run screenshots (1280x720, 844x390@2x, 390x844@2x), strip fade, frost, boss bar (staged via
// ?t=598 debug start), and the HUD screen-area measurement (game canvas hidden, page transparent, pixels with alpha >= 35%).
// Spawns its own Chrome and kills only that PID. Nothing here touches the real save (debug params never save).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9341;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-hud1-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--autoplay-policy=no-user-gesture-required',
  ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
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
const [out, base = 'http://localhost:4173'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 });
  const f = join(out, name + '.jpg');
  writeFileSync(f, Buffer.from(r.data, 'base64'));
  const kb = Math.round(statSync(f).size / 1024);
  console.log(`  shot ${name}.jpg ${kb}KB`);
  if (kb > 300) check(`size ${name}`, false, kb + 'KB');
};

// --- minimal PNG (8-bit RGBA) alpha counter
function alphaFrac(b64, minA) {
  const buf = Buffer.from(b64, 'base64');
  let p = 8, w = 0, h = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8);
    if (type === 'IHDR') { w = buf.readUInt32BE(p + 8); h = buf.readUInt32BE(p + 12); if (buf[p + 16] !== 8 || buf[p + 17] !== 6) throw new Error('png not RGBA8'); }
    if (type === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * bpp;
  let prev = Buffer.alloc(stride), cur, n = 0, o = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[o++]; cur = Buffer.from(raw.subarray(o, o + stride)); o += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = cur[i];
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) if (cur[x * bpp + 3] >= minA * 255) n++;
    prev = cur;
  }
  return { n, w, h, frac: n / (w * h) };
}

async function load(w, h, mobile, query) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.ui && window.__app.ui.hudView)')) break; } catch { /* loading */ } }
  await sleep(700);
}
const rect = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,vis:getComputedStyle(e).display!=='none',op:+getComputedStyle(e).opacity}})()`);
const measure = async (tag, label) => {
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await ev("(()=>{let s=document.getElementById('hl-measure');if(!s){s=document.createElement('style');s.id='hl-measure';document.head.append(s)}s.textContent='html,body,#app,#stage{background:transparent!important;box-shadow:none!important}#game{visibility:hidden!important}.hurtflash,.toast{display:none!important}';return 1})()");
  await sleep(200);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const a = alphaFrac(r.data, 0.35);
  const st = await rect('#stage');
  const dpr = a.w / (await ev('innerWidth'));
  const pctV = (a.frac * 100).toFixed(1), pctS = ((a.n / (st.w * st.h * dpr * dpr)) * 100).toFixed(1);
  console.log(`  AREA ${tag} ${label}: ${pctV}% of viewport, ${pctS}% of stage`);
  await ev("document.getElementById('hl-measure').textContent=''; 1");
  await send('Emulation.setDefaultBackgroundColorOverride', {});
  return { viewport: +pctV, stage: +pctS };
};

const grant = encodeURIComponent('raven_flock;spirit_bolts;holy_orbit');
const areas = {};
async function session(tag, w, h, mobile) {
  console.log(`== ${tag} ${w}x${h}`);
  const touch = mobile ? '&touch=1' : '';
  // 1 early run (1 weapon)
  await load(w, h, mobile, `?auto=wren&seed=1&god=1${touch}`);
  await sleep(2500);
  await shot(`${tag}-1-early`);
  const hv = (sel) => rect(sel);
  check(`${tag}: lantern plate visible`, (await hv('.h-lantern')).vis);
  const gold = await ev("getComputedStyle(document.querySelector('.h-goldnum')).color + '|' + getComputedStyle(document.querySelector('.h-coin')).borderTopColor");
  check(`${tag}: gold counter is cream/brass, not evolution gold`, !gold.includes('255, 211, 107') && !gold.includes('255, 210, 122'), gold);
  check(`${tag}: no Kills counter in HUD`, !(await ev("/kills/i.test(document.querySelector('.hud').textContent)")));
  check(`${tag}: no backdrop-filter / filter in HUD`, await ev("[...document.querySelectorAll('.hud, .hud *')].every(e=>{const c=getComputedStyle(e);return (c.backdropFilter||'none')==='none' && (c.filter||'none')==='none'})"));
  // 2 mid-run, 4 weapons, strip visible then faded
  await load(w, h, mobile, `?auto=wren&seed=1&god=1&t=300&grant=${grant}${touch}`);
  // debug-run staging only (never saved): ability cooling
  await ev('(()=>{const s=window.__app.sim;s.ability.cdLeft=17;return 1})()');
  await sleep(1500);
  await shot(`${tag}-2-mid-strip-visible`);
  check(`${tag}: strip full right after start`, !(await ev("document.querySelector('.h-strip').classList.contains('low')")));
  await ev("(()=>{const s=window.__app.sim;if(s.state==='levelup'){const c=document.querySelector('.card');if(c)c.click()}return 1})()");
  await sleep(500);
  areas[tag] = { noBoss: await measure(tag, 'mid, 4 weapons, ability cooling, no boss') };
  // Real fade timing is covered by the unit tests (game-time clock). Here: clear any pending level-up, jump the idle clock 9 s, and check the DOM + CSS.
  await ev("(()=>{const s=window.__app.sim;if(s.state==='levelup'){const c=document.querySelector('.card');if(c)c.click()}return 1})()");
  await sleep(600);
  await ev('(()=>{const a=window.__app,h=a.ui.hudView;h.fade.last=a.sim.time-9;return 1})()');
  await sleep(600);
  const low = await ev("document.querySelector('.h-strip').classList.contains('low')");
  console.log('  after wait', await ev('JSON.stringify((()=>{const s=window.__app.sim;return {t:s.time,state:s.state,lvl:s.level,last:window.__app.ui.hudView.fade.last,low:document.querySelector(".h-strip").className}})())'));
  check(`${tag}: strip fades after ~8s idle`, low);
  // headless software rendering is slow, so the 0.8 s CSS fade may not have finished: jump to the end state for the check/shot
  await ev("document.querySelector('.h-strip').style.transition='none'; 1");
  await sleep(400);
  await shot(`${tag}-3-mid-strip-faded`);
  const rs = await rect('.h-strip');
  check(`${tag}: faded strip opacity ~0.4`, Math.abs(rs.op - 0.4) < 0.05, 'op=' + rs.op);
  await ev("document.querySelector('.h-strip').style.transition=''; document.querySelector('.h-strip').dispatchEvent(new PointerEvent('pointerenter'))");
  await sleep(1000);
  check(`${tag}: hover wakes strip`, !(await ev("document.querySelector('.h-strip').classList.contains('low')")));
  // level-up wake: fade again then force a level
  await ev("(()=>{const h=window.__app.ui.hudView;h.fade.last=-100;h.applyFade(h.t);return 1})()");
  check(`${tag}: strip faded again (test hook)`, await ev("document.querySelector('.h-strip').classList.contains('low')"));
  // 3 low HP + frost
  await ev('(()=>{const p=window.__app.sim.player;p.hp=p.maxHp*0.18;return 1})()');
  await sleep(1400);
  await shot(`${tag}-4-low-hp-frost`);
  const fo = await rect('.h-frost');
  check(`${tag}: frost visible at 18% HP`, fo.op > 0.3, 'op=' + fo.op);
  const lowCls = await ev("document.querySelector('.h-lantern').classList.contains('low')");
  check(`${tag}: lantern ember at 18% HP`, lowCls);
  // 4 boss (staged: starts at 9:58, boss wakes at 10:00)
  await load(w, h, mobile, `?auto=wren&seed=1&god=1&t=598&grant=${grant}${touch}`);
  await ev('(()=>{const s=window.__app.sim;s.ability.cdLeft=17;return 1})()');
  await sleep(5500);
  check(`${tag}: boss bar appears`, (await rect('.h-boss')).vis);
  await shot(`${tag}-5-boss`);
  areas[tag].boss = await measure(tag, 'mid + boss bar');
  // hit targets
  const tgt = [];
  for (const sel of mobile ? ['.touch-pause', '.touch-ability'] : ['.h-pause', '.h-ability']) {
    const r = await rect(sel);
    tgt.push(`${sel} ${Math.round(r.w)}x${Math.round(r.h)}`);
    check(`${tag}: ${sel} >= 44px`, r.w >= 44 && r.h >= 44);
  }
  console.log('  targets', tgt.join(', '));
  // overlap check: strip must not sit under the stick zone on phones (zone is floating; strip is read-only)
  const small = await ev("(()=>{let min=99;for(const e of document.querySelectorAll('.hud .h-num,.hud .h-hpmax,.hud .h-bossname,.hud .h-abkey')){const c=getComputedStyle(e);if(c.display==='none')continue;min=Math.min(min,parseFloat(c.fontSize))}return min})()");
  console.log('  smallest HUD text', small + 'px');
}
const only = (process.env.ONLY || 'desk,land,port').split(',');
if (only.includes('desk')) await session('desk', 1280, 720, false);
if (only.includes('land')) await session('land', 844, 390, true);
if (only.includes('port')) await session('port', 390, 844, true);
console.log('AREAS', JSON.stringify(areas));
writeFileSync(join(out, 'areas.json'), JSON.stringify(areas, null, 1));
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
try { ws.close(); proc.kill(); } catch { /* ignore */ }
process.exit(fails ? 1 : 0);
