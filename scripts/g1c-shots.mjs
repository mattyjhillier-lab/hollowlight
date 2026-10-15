// G1c screenshots: node scripts/g1c-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// Real UI path, no debug params: fresh profile -> title; tree; a normal run ended by zeroing player hp in the page, with the save stats pre-seeded.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9334;
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


const sleep0 = sleep;
const [out, base = 'http://localhost:4173'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const c = await launch();
const png = async (name) => {
  const r = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, name), Buffer.from(r.data, 'base64'));
};
const load = async (w, h, dpr, seed) => {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: base + '/' });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await c.ev('!!(window.__app && window.__app.ui)')) break; } catch { /* loading */ } }
  if (seed) { await c.ev(`(()=>{const a=window.__app;Object.assign(a.save.data.stats.killsByEnemy,${JSON.stringify(seed)});a.save.saveNow();return 1})()`); }
  await c.ev('window.__app.showMenu(); 1');
  await sleep(600);
};
const sizes = [['desktop', 1280, 720, 1], ['phone', 390, 844, 2]];
const report = {};
try {
  for (const [tag, w, h, dpr] of sizes) {
    await c.ev('localStorage.clear(); 1').catch(() => {});
    await load(w, h, dpr);
    await c.ev('localStorage.clear(); 1');
    await load(w, h, dpr);
    await png(`title-${tag}.png`);
    // tree
    await c.ev('window.__app.openTree(); 1'); await sleep(900);
    await png(`tree-hub-${tag}.png`);
    await c.ev("window.__app.ui.tree.select('gt_raven_flock'); 1"); await sleep(500);
    await png(`tree-weapon-gate-${tag}.png`);
    await c.ev("window.__app.ui.tree.select('gt_dire_alpha'); 1"); await sleep(500);
    await png(`tree-hidden-evo-gate-${tag}.png`);
    report[tag] = await c.ev(`(()=>{const t=document.querySelector('.layer-tree');const r=(e)=>{const b=e.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom)]};return {vw:innerWidth,vh:innerHeight,top:r(document.querySelector('.tree-top')),view:r(document.querySelector('.tree-view')),panel:r(document.querySelector('.tree-panel')),panelScroll:document.querySelector('.tree-panel').scrollHeight>document.querySelector('.tree-panel').clientHeight,panelText:document.querySelector('.tree-panel').innerText,docScroll:document.documentElement.scrollWidth>innerWidth,gateNodes:document.querySelectorAll('.tree-node.gate').length}})()`);
    // real run, ended in-page
    await c.ev('window.__app.ui.tree.close(); 1'); await sleep(400);
    await load(w, h, dpr, { crow: 4490, root_crawler: 700, wolf: 3000 });
    await c.ev("window.__app.startRun('wren'); 1"); await sleep(1500);
    await c.ev("(()=>{const s=window.__app.sim;s.killsByEnemy.crow=20;s.kills+=20;s.player.iframes=0;s.damagePlayer(99999);return 1})()");
    await sleep(2500);
    await png(`results-${tag}.png`);
    report[tag].results = await c.ev("document.querySelector('.layer-end').innerText");
    // first-run hint is visible on title; check toast mechanics separately
  }
  console.log(JSON.stringify(report, null, 1));
} finally { c.close(); }
process.exit(0);
