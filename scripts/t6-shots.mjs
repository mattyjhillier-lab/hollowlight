// T6 screenshots: the run-start offers (Kindred Start, Favoured Spirit, Lantern Blessing), Second Sight under a level-up, and the
// Chosen Moment setting, at desktop 1280x720, phone landscape 844x390 and phone portrait 390x844.
//   node scripts/t6-shots.mjs <outDir> [baseUrl]   (needs `npm run build && npx vite preview --port 4199`)
// ?meta=full is a debug preview (never banks). Spawns its own headless Chrome, kills only that PID and deletes its temp profile.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9341;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [out = 'docs/screenshots/t6', base = 'http://localhost:4199'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const prof = mkdtempSync(join(tmpdir(), 'hl-t6-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
let ws;
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
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
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(out, `${name}.png`), Buffer.from(r.data, 'base64'));
    console.log(`  shot ${name}.png`);
  };
  const load = async (w, h, dpr, query) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: w < 600 || h < 600 });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url: `${base}/${query}` });
    for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim)')) break; } catch { /* loading */ } }
    await sleep(900);
  };
  const pick = (key) => ev(`(window.__app.pick(${JSON.stringify(key)}), window.__app.sim.state + ':' + (window.__app.sim.offer && window.__app.sim.offer.start || ''))`);
  const sizes = [['desk', 1280, 720, 1], ['land', 844, 390, 2], ['port', 390, 844, 2]];
  for (const [tag, w, h, dpr] of sizes) {
    await load(w, h, dpr, '?meta=full&auto=wren&seed=4');
    const s0 = await ev('window.__app.sim.state + ":" + window.__app.sim.offer.start');
    console.log(tag, s0);
    await shot(`${tag}-1-kindred`);
    await sleep(300); console.log(await pick(await ev('window.__app.sim.offer.cards[0].key')));
    await sleep(500); await shot(`${tag}-2-favour`);
    await sleep(300); console.log(await pick(await ev('window.__app.sim.offer.cards[0].key')));
    await sleep(500); await shot(`${tag}-3-blessing`);
    await sleep(300); console.log(await pick(await ev('window.__app.sim.offer.cards[0].key')));
    // first level-up with Second Sight (Louder Stirring and the Almanac are live in this preset too)
    await ev('(()=>{const s=window.__app.sim; s.xp = s.xpNeeded; s.checkLevelUp(); return s.state})()');
    await sleep(700); await shot(`${tag}-4-second-sight`);
    console.log('peek', await ev('(document.querySelector(".lu-ptext")||{}).textContent || "none"'));
    if (tag !== 'land') {
      await ev(`(()=>{const a=window.__app; a.save.data.tree.rs_autoset=1; a.pick(a.sim.offer.cards[0].key); a.togglePause(); a.ui.showSettings('', 'controls'); return 1})()`);
      await sleep(600); await shot(`${tag}-5-settings-auto-rule`);
      console.log('autoRule row', await ev('[...document.querySelectorAll(".layer-settings *")].some(e=>e.textContent==="Ability fires itself")'));
    }
  }
} finally {
  try { ws && ws.close(); } catch { /* closed */ }
  try { if (process.platform === 'win32') spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); else proc.kill(); } catch { /* gone */ }
  await sleep(3000);
  try { rmSync(prof, { recursive: true, force: true }); } catch { /* locked: retry below */ }
  if (existsSync(prof)) { await sleep(1500); try { rmSync(prof, { recursive: true, force: true }); } catch (e) { console.error('profile not removed', prof); } }
}
