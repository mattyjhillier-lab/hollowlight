// Screenshots of menu + in-run screens at phone/desktop sizes (headless Chrome + in-process Vite; one node process).
// Usage: node scripts/phone-shots.mjs <outDir> <prefix> <WxH[@dpr][p]>,... [screens]  (p = portrait/mobile emulation off? no: mobile is on unless size is flagged d)
// Size suffix: L = Larger text (data-text=larger); @2 = dpr 2; "d" suffix = desktop (no mobile/touch emulation). Example: 915x412,1280x720d,1000x460@2
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startDev } from './_devserver.mjs';
const [outDir, prefix, sizeArg, screenArg] = process.argv.slice(2);
const sizes = sizeArg.split(',').map((x) => { const m = /^(\d+)x(\d+)(?:@(\d))?(d)?(L)?$/.exec(x); return { name: x, w: +m[1], h: +m[2], dpr: +(m[3] || 1), mobile: !m[4], larger: !!m[5] }; });
const want = screenArg ? screenArg.split(',') : ['front', 'settings', 'almanac', 'almanac-foes', 'goals', 'tree', 'chars', 'hud', 'levelup', 'pause', 'results'];
mkdirSync(outDir, { recursive: true });
const srv = await startDev(5193);
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dir = mkdtempSync(path.join(tmpdir(), 'hlchrome-'));
const p = spawn(chrome, ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${dir}`, '--no-first-run', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch('http://127.0.0.1:9334/json')).json(); if (tabs.length) break; } catch {} await sleep(300); }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { await ev("if(!document.getElementById('nop')){const s=document.createElement('style');s.id='nop';s.textContent='[data-probe]{display:none!important}';document.head.append(s)}"); await sleep(150); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(outDir, name), Buffer.from(r.result.data, 'base64')); };
const menu = {
  // fallback card icons (heal / gold / shard) next to two weapon icons on a dark plate, to check the set reads as one family
  cardicons: "ui.hideAll(); import('/src/ui/cardicons.js').then(m=>{const d=document;const w=d.createElement('div');w.setAttribute('data-icons','');w.style.cssText='position:fixed;inset:0;z-index:99;background:#14100c;display:flex;flex-wrap:wrap;gap:12px;align-content:center;justify-content:center';const defs=d.createElementNS('http://www.w3.org/2000/svg','svg');for(const c of [{kind:'fallback',fallback:'heal'},{kind:'fallback',fallback:'gold'},{kind:'fallback',fallback:'shard'},{kind:'blessing',blessId:'wider_glow'},{kind:'weapon',weaponId:'ghost_wolves'}]){const s=m.cardIcon(d,c);s.style.cssText='width:96px;height:96px';w.append(s)}d.body.append(w)})",
  front: 'ui.hideAll(); ui.showStart(ui.onPick)', treeexp: "ui.navTo('tree'); setTimeout(()=>{const t=ui.tree,ids=t.def.list;t.select(ids.reduce((a,i)=>JSON.stringify(t.def.nodes[i]).length>JSON.stringify(t.def.nodes[a]).length?i:a,ids[0]));t.setExpanded(true)},500)", treesel: "ui.navTo('tree'); setTimeout(()=>{const t=ui.tree,ids=t.def.list;t.select(ids.reduce((a,i)=>JSON.stringify(t.def.nodes[i]).length>JSON.stringify(t.def.nodes[a]).length?i:a,ids[0]))},500)", home: "ui.navTo('home')", settings: "ui.navTo('settings')", almanac: "ui.navTo('almanac')", goals: "ui.navTo('goals')", tree: "ui.navTo('tree')", chars: "ui.navTo('character')",
};
const tabClick = { 'settings-controls': ["settings", ".layer-settings [role=tab]", 2], 'almanac-foes': ["almanac", ".layer-codex [role=tab]", 1] };
try {
  for (const s of sizes) {
    await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: s.dpr, mobile: s.mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: s.mobile, maxTouchPoints: s.mobile ? 5 : 0 });
    const menuWant = want.filter((k) => menu[k] || tabClick[k]);
    if (menuWant.length) {
      await send('Page.navigate', { url: 'http://127.0.0.1:5193/?debug=1' + (process.env.SHOT_QS || '') });
      for (let i = 0; i < 120; i++) { if (await ev('!!(window.__app && window.__app.ui)')) break; await sleep(500); }
      await sleep(1500);
      if (process.env.SHOT_JS_FILE) { await ev(readFileSync(process.env.SHOT_JS_FILE, 'utf8')); await sleep(500); } // e.g. seed a mid-game save before the screens open
      for (const k of menuWant) {
        const base = tabClick[k] ? tabClick[k][0] : k;
        await ev(`(()=>{const ui=window.__app.ui; ${menu[base]}})()`); await sleep(900);
        if (tabClick[k]) { await ev(`document.querySelectorAll('${tabClick[k][1]}')[${tabClick[k][2]}]?.click()`); await sleep(600); }
        await shot(`${prefix}-${s.name}-${k}.png`);
      }
    }
    const runWant = want.filter((k) => ['hud', 'levelup', 'pause', 'results', 'results-rich'].includes(k));
    if (runWant.length) {
      await send('Page.navigate', { url: 'http://127.0.0.1:5193/?debug=1&auto=wren&seed=1&t=200&god=1' });
      for (let i = 0; i < 120; i++) { if (await ev('!!(window.__app && window.__app.sim)')) break; await sleep(500); }
      await sleep(2500);
      if (s.larger) { await ev("document.documentElement.dataset.text='larger'"); await sleep(600); }
      for (const k of runWant) {
        if (k === 'hud') await shot(`${prefix}-${s.name}-hud.png`);
        if (k === 'pause') { await ev('window.__app.togglePause()'); await sleep(700); await shot(`${prefix}-${s.name}-pause.png`); await ev('window.__app.togglePause()'); await sleep(300); }
        if (k === 'levelup') { await ev('(()=>{const a=window.__app;a.sim.beginLevelUp();a.ui.showLevelUp(a.sim)})()'); await sleep(1000); await shot(`${prefix}-${s.name}-levelup.png`); await ev('(()=>{const a=window.__app;a.ui.hideLevelUp();a.sim.state="running"})()'); await sleep(300); }
        if (k === 'results-rich') { await ev('(()=>{const a=window.__app;a.sim.state="dead";a.sim.level=14;a.sim.kills=1234;a.sim.gold=345;a.sim.shards=6;a.ui.showEnd(a.sim,a.bankRun(a.sim))})()'); await sleep(2200); await shot(`${prefix}-${s.name}-results-rich.png`); }
        if (k === 'results') { await ev('(()=>{const a=window.__app;a.sim.state="dead";a.ui.showEnd(a.sim,a.bankRun(a.sim))})()'); await sleep(2200); await shot(`${prefix}-${s.name}-results.png`); }
      }
    }
  }
} finally { ws.close(); p.kill(); await srv.close(); }
process.exit(0);
