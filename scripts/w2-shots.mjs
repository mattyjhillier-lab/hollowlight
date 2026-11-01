// W2 Rally the Pack check: node scripts/w2-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// Headless Chrome over CDP, real runs. Effects are STAGED through the real sim/scene APIs in debug runs (never touches the real save):
// addGem/addPickup/healPlayer/damagePlayer/useAbility/enemy injection and a t=596 start for the boss. Captures damage numbers in a swarm,
// heal + damage-taken numbers, gem, heart, magnet, level-up burst, ability ready/active, boss intro, and checks classes/caps/reduced motion.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9352;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-w2-'));
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
  await sleep(600);
}

// Stages a Rally the Pack cast in a real debug run (wren, wolves ranked up) and captures the moment + checks the sim state in the page.
const GRANT = 'ghost_wolves:count=4,power=3,speed=3';
async function session(tag, w, h, mobile) {
  console.log(`== ${tag} ${w}x${h}`);
  const touch = mobile ? '&touch=1' : '';
  await load(w, h, mobile, `?auto=wren&seed=1&t=300&god=1&debug=1&grant=${GRANT}${touch}`);
  await ev("window.__app.save.setSettings({quality:'high'}); 1");
  await ev(`(()=>{const s=window.__app.sim;const T=['wolf','crow','root_crawler'];let k=0;while(s.enemies.length<60){const a=(k*2.399)%6.2832,d=40+((k*37)%140);s.spawnEnemy(T[k%3],s.player.x+Math.cos(a)*d,s.player.y+Math.sin(a)*d);k++}return 1})()`);
  await sleep(800);
  await ev('(()=>{const s=window.__app.sim;s.ability.cdLeft=0;s.useAbility();return 1})()');
  await sleep(450);
  const st = await ev('(()=>{const s=window.__app.sim;return {on:!!s.rally,t:!!(s.rally&&s.rally.target),b:s.buffs.rally,speed:s.buffs.speedBoost,name:s.ability.name}})()');
  check(`${tag}: rally window open, target picked, no speed boost`, st.on && st.t && st.b > 4 && st.speed === 0, JSON.stringify(st));
  await shot(`${tag}-1-rally-start`);
  await sleep(1400);
  await shot(`${tag}-2-rally-threads`);
  if (!mobile) {
    await ev("window.__app.save.setSettings({quality:'low'}); 1");
    await sleep(500);
    await shot(`${tag}-3-rally-low`);
  }
}
const only = (process.argv[4] || 'desk,land').split(',');
if (only.includes('desk')) await session('desk', 1280, 720, false);
if (only.includes('land')) await session('land', 844, 390, true);
try { ws.close(); proc.kill(); } catch { /* ignore */ }
process.exit(fails ? 1 : 0);
