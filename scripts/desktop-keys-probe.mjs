// Desktop polish check (headless Chrome over CDP, in-process Vite): real key events for 1-6 tabs and F full screen, then ?probe=1 + boot guard
// at desktop sizes with window-controls-overlay emulation, in an --app window. Usage: node scripts/desktop-keys-probe.mjs [outDir]
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startDev } from './_devserver.mjs';
const out = process.argv[2] || path.join(tmpdir(), 'dk-probe'); mkdirSync(out, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = await startDev(5194); const URL0 = 'http://127.0.0.1:5194/';
const PORT = 9351; const dir = mkdtempSync(path.join(tmpdir(), 'hl-dk-'));
const proc = spawn(CHROME, ['--no-first-run', '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--enable-unsafe-swiftshader', `--app=${URL0}?debug=1`], { stdio: 'ignore' });
let w1 = false; let fails = 0; const check = (n, ok, x = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${n} ${x}`); };
try {
  let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.some((t) => t.type === 'page')) break; } catch { /* retry */ } await sleep(250); }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const waitFor = async (e, ms = 40000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(e)) return true; await sleep(300); } return false; };
  const press = async (code, key, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key, windowsVirtualKeyCode: vk, text: type === 'keyDown' ? key : undefined }); await sleep(500); };
  const shot = async (n) => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync(path.join(out, n + '.jpg'), Buffer.from(r.result.data, 'base64')); };
  const active = () => ev('window.__app.ui.navActive()');
  await send('Page.enable'); await send('Runtime.enable');
  for (const [w, h] of [[1920, 1001], [2560, 1080]]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    // CDP cannot emulate display-mode, so a script stub makes matchMedia report window-controls-overlay (JS paths only: probe, boot guard, phone.js; the CSS env(titlebar-area-*) rules are not triggered)
    if (!w1) { w1 = true; await send('Page.addScriptToEvaluateOnNewDocument', { source: "(()=>{const o=window.matchMedia.bind(window);window.matchMedia=(q)=>{const r=o(q);if(/display-mode/.test(q)){const on=/window-controls-overlay/.test(q);return new Proxy(r,{get:(t,k)=>k==='matches'?on:(typeof t[k]==='function'?t[k].bind(t):t[k])})}return r}})()" }); }
    await send('Page.navigate', { url: `${URL0}?debug=1&probe=1` });
    check(`${w}x${h} boots to the title`, await waitFor('!!(window.__app && window.__app.ui && window.__app.ui.layers.start && window.__app.ui.layers.start.style.display === "flex")'));
    await sleep(1500);
    const probe = await ev("document.getElementById('probe') ? document.getElementById('probe').textContent : ''");
    check(`${w}x${h} probe overlay present`, /inner \d+x\d+/.test(probe));
    check(`${w}x${h} probe reports display-mode window-controls-overlay`, /display-mode [a-z,-]*window-controls-overlay[a-z,-]* +hidden/.test(probe), (probe.match(/display-mode [a-z,-]+ +hidden/) || ['no boot display-mode line'])[0]);
    check(`${w}x${h} boot guard ready, no errors`, /boot ready \d+ ms {2}errors 0/.test(probe), (probe.match(/boot [^\n]*/) || [''])[0]);
    check(`${w}x${h} not html.phone`, !(await ev("document.documentElement.classList.contains('phone')")));
    await shot(`probe-${w}x${h}`);
    await ev("document.getElementById('probe') && document.getElementById('probe').remove()");
    await ev("window.__app.ui.navTo('home')"); await sleep(600);
    const seq = [['Digit3', '3', 51, 'tree'], ['Digit4', '4', 52, 'goals'], ['Digit6', '6', 54, 'settings'], ['Digit3', '3', 51, 'tree'], ['Digit1', '1', 49, null]];
    for (const [c, k, vk, want] of seq) { await press(c, k, vk); const a = await active(); check(`${w}x${h} key ${k} -> ${want || 'home'}`, a === (want || 'home'), String(a)); }
    await ev("window.__app.ui.navTo('almanac')"); await sleep(600); await press('Digit3', '3', 51);
    check(`${w}x${h} digit ignored on Almanac`, (await active()) === 'almanac');
    await ev("window.__app.ui.navTo('home')"); await sleep(500);
    const canFs = await ev('!!(window.__app.ui.pwa && window.__app.ui.pwa.canFullscreen && window.__app.ui.pwa.canFullscreen())');
    if (canFs) {
      await press('KeyF', 'f', 70); await sleep(600);
      check(`${w}x${h} F enters full screen`, await ev('!!document.fullscreenElement'));
      await press('KeyF', 'f', 70); await sleep(600);
      check(`${w}x${h} F again exits full screen`, !(await ev('!!document.fullscreenElement')));
    } else console.log(`SKIP ${w}x${h} F: pwa.canFullscreen() false in this headless window (logic covered by tests/deskkeys.test.mjs)`);
  }
} finally { try { proc.kill(); } catch { /* gone */ } await srv.close(); }
console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
