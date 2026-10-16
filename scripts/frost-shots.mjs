// Frost check: node scripts/frost-shots.mjs <outDir> [baseUrl] (needs a built dist served by vite preview --port 4173). Spawns own Chrome, kills only that PID.
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
async function load(w, h, mobile, query) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.ui && window.__app.ui.hudView)')) break; } catch { /* loading */ } }
  await sleep(700);
}
const rect = (sel) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return e?{op:+getComputedStyle(e).opacity}:null})()`);
const grant = encodeURIComponent('raven_flock;spirit_bolts;holy_orbit');
for (const [tag, w, h, mobile] of [['desk', 1280, 720, false], ['land', 844, 390, true], ['port', 390, 844, true]]) {
  await load(w, h, mobile, `?auto=wren&seed=1&god=1&t=420&grant=${grant}${mobile ? '&touch=1' : ''}`);
  await ev("(()=>{const s=window.__app.sim,p=s.player,ids=Object.keys(s.data?.enemies||{}).filter(k=>!/boss|treant/.test(k));const id=ids[0]||'wolf';for(let i=0;i<350;i++){const a=i*2.399,r=60+(i%25)*9;s.spawnEnemy(['wolf','crow','root_crawler'][i%3],p.x+Math.cos(a)*r,p.y+Math.sin(a)*r)}return 1})()");
  for (const pct of [10, 10, 25, 40]) {
    await ev(`(()=>{const p=window.__app.sim.player;p.hp=p.maxHp*${pct / 100};return 1})()`);
    await ev("document.querySelector('.h-frost').style.transition='none';1");
    await sleep(2500);
    await shot(`${tag}-${pct}`);
    const f = await rect('.h-frost');
    console.log(`  ${tag} ${pct}% frost opacity ${f.op}`);
  }
}
console.log(fails ? `${fails} FAILED` : 'DONE');
try { ws.close(); proc.kill(); } catch { /* ignore */ }
process.exit(0);
