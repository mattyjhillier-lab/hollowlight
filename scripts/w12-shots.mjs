// W12 Vesper Tide shots: node scripts/w12-shots.mjs <outDir> [baseUrl]: a real auto-played Elias run with Vesper Tide granted; freezes the sim at four phases of the breath (swell start, mid swell, crest, drawing back) and captures a zoom at each plus a full frame. Needs a build served (vite preview). Kills only its own Chrome.
// Chain Lightning evolutions in action (Thunder Judgment tell + sky pillars, Static Storm field, Storm Tether arcs); desktop + phone. Headless Chrome over CDP, own PID only.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = Number(process.env.CDP || 9391);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-w11-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
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
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
  const f = join(out, name + '.jpg');
  writeFileSync(f, Buffer.from(r.data, 'base64'));
  const kb = Math.round(statSync(f).size / 1024);
  console.log(`  shot ${name}.jpg ${kb}KB`);
  if (kb > 300) check(`size ${name}`, false, kb + 'KB');
};

async function load(w, h, mobile, query) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.ui && window.__app.ui.hudView)')) break; } catch { /* loading */ } }
  if (process.env.QUALITY) await ev(`(() => { const sc = window.__app.scene; sc.quality.setMode('${process.env.QUALITY}'); sc.applyTier(); })()`); // QUALITY=high|med|low forces the tier
  if (process.env.CALM === '1') await ev("window.__app.save.setSettings({reducedMotion:true}); document.documentElement.classList.add('reduced-motion'); true"); // CALM=1 reduced motion
  await sleep(600);
}
const SUF = (process.env.QUALITY ? '-' + process.env.QUALITY : '') + (process.env.CALM === '1' ? '-calm' : '');

const GRANT = 'grant=' + encodeURIComponent('holy_orbit:count=4,power=4,radius=5,speed=5:vesper_tide');
const VIEWS = [['desktop-1280x720', 1280, 720, false], ['phone-land-844x390', 844, 390, true]];
const zoom = async (name, w, h, mobile, z = 3) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, clip: { x: w / 2 - 260, y: h / 2 - 150, width: 520, height: 300, scale: mobile ? 2 : 2 } });
  writeFileSync(join(out, `${name}.jpg`), Buffer.from(r.data, 'base64'));
};
// phase targets (rt.ph mod 2pi): 0.9 = swelling out, 1.9 = near the crest, 3.4 = just drawing back (ripple), 4.6 = drawn in
const PH = [['1-swell', 0.9], ['2-crest', 1.9], ['3-drawback', 3.4], ['4-drawn', 4.6]];
const pred = (t) => `(() => { const s = window.__app.sim; const w = s.weapons.find((x) => x.id === 'holy_orbit'); if (!w || !w.rt.tide) return { ok: false }; const p = ((w.rt.ph % 6.2832) + 6.2832) % 6.2832; return { ok: Math.abs(p - ${t}) < 0.06 && s.enemies.length > 8 && !(w.rt.gK > 0), n: p, r: w.rt.tide.r }; })()`;
const STATE = `window.__app.sim.state`;
try {
  for (const [tag, w, h, mobile] of VIEWS) {
    console.log(`== ${tag}`);
    await load(w, h, mobile, `?auto=elias&seed=2&t=330&god=1&rr=2&ban=1${mobile ? '&touch=1' : ''}&${GRANT}`);
    for (const [mname, t] of PH) {
      let got = false, info = null;
      for (let i = 0; i < 6000 && !got; i++) {
        if ((await ev(STATE)) === 'levelup') { await ev('window.__app.sim.offer && window.__app.sim.pick && window.__app.sim.pick(0)').catch(() => {}); continue; }
        info = await ev(pred(t));
        if (info.ok) {
          got = true;
          await ev('(() => { const s = window.__app.sim; s.__step = s.step; s.step = () => {}; })()');
          await sleep(250);
          await zoom(`swell-${mname}-${tag}${SUF}-zoom`, w, h, mobile); if (mname === '2-crest') await shot(`swell-${mname}-${tag}${SUF}-full`);
          await ev('(() => { const s = window.__app.sim; s.step = s.__step; })()');
        } else await sleep(8);
      }
      check(`${tag}: swell ${mname} captured`, got, JSON.stringify(info));
    }
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
