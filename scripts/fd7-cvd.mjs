// FD7 harness (front-door-v1 sections 9 + 11): node scripts/fd7-cvd.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4192`).
// Part 1 (pure maths): the three tier colours + locked-name grey under protan / deutan / tritan (Machado 2009, severity 1.0), CIE76 delta E
// between each pair and WCAG contrast on the screen background. Part 2 (own Chrome on port 9393, temp profile deleted at the end): the map screen
// with Chrome's emulated vision deficiencies at 1280x720 and 844x390@2x, every tier selected, plus reduced-motion checks (running animations).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------- part 1
const TIERS = { Twilight: '#ffb867', 'Deep Dusk': '#9aa8ff', 'Long Night': '#d4ccff', 'Locked name': '#8f98b4' };
const BG = '#0e121c';
const M = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const clamp = (x) => Math.min(1, Math.max(0, x));
const sim = (rgb, kind) => { const l = rgb.map(lin); return !kind ? l : M[kind].map((r) => clamp(r[0] * l[0] + r[1] * l[1] + r[2] * l[2])); };
const Y = (l) => 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
const lab = (l) => {
  const X = (0.4124 * l[0] + 0.3576 * l[1] + 0.1805 * l[2]) / 0.95047, Yv = Y(l), Z = (0.0193 * l[0] + 0.1192 * l[1] + 0.9505 * l[2]) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Yv) - 16, 500 * (f(X) - f(Yv)), 200 * (f(Yv) - f(Z))];
};
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const contrast = (a, b) => { const [hi, lo] = [Y(a), Y(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
console.log('tier colour distance (CIE76 delta E; shapes + names always carry the meaning, this is the colour bonus)');
let minDE = 999;
for (const kind of [null, 'protan', 'deutan', 'tritan']) {
  const labs = Object.fromEntries(Object.entries(TIERS).map(([k, v]) => [k, lab(sim(hex(v), kind))]));
  const prs = [['Twilight', 'Deep Dusk'], ['Deep Dusk', 'Long Night'], ['Twilight', 'Long Night']];
  console.log(' ', (kind || 'normal').padEnd(7), prs.map(([a, b]) => `${a}/${b} ${dE(labs[a], labs[b]).toFixed(1)}`).join(' | '));
  for (const [a, b] of prs) minDE = Math.min(minDE, dE(labs[a], labs[b]));
}
for (const kind of [null, 'protan', 'deutan', 'tritan']) {
  const bg = sim(hex(BG), kind);
  console.log('  contrast on bg', (kind || 'normal').padEnd(7), Object.entries(TIERS).map(([k, v]) => `${k} ${contrast(sim(hex(v), kind), bg).toFixed(1)}`).join(' | '));
  for (const [k, v] of Object.entries(TIERS)) if (contrast(sim(hex(v), kind), bg) < 3) fail(`${k} contrast < 3:1 under ${kind || 'normal'}`);
}
console.log('  min pair delta E across all views:', minDE.toFixed(1));

// ---------------------------------------------------------------- part 2
const out = process.argv[2] || 'docs/screenshots/front-door/fd7'; const base = process.argv[3] || 'http://localhost:4192';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
if (!CHROME) { console.log('no Chrome: maths only'); process.exit(fails ? 1 : 0); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9393;
const dir = mkdtempSync(join(tmpdir(), 'hl-fd7-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };
const open = async (url, w, h, dpr, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.ui.screen)')) break; } catch { /* loading */ } }
  await ev('document.fonts.ready.then(()=>1)'); await sleep(600);
};
const shot = async (name) => { mkdirSync(out, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
const key = async (k, code, vk) => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); };
const SEED = `(()=>{const A=__app;A.chooseStarter('wren','ghost_wolves');const d=A.save.data;d.gold=2410;d.shards=6;d.dawnglass=4;d.stats.runs=14;d.stats.wins=2;d.stats.charsUsed={wren:10,elias:4};
 d.stats.tiers={cursed_forest:{normal:{runs:12,clears:2,best:{t:900,kills:1500,level:19},stars:3,heroes:{wren:{clears:2,first:false},elias:{clears:0,first:false}}}}};A.save.saveNow(true);return 1})()`;
const OPEN = `(()=>{__app.openTiers=()=>['cursed_forest:hard'];return 1})()`;
const DEF = ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
for (const [n, w, h, d, m] of [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true]]) {
  console.log(n);
  const url = `${base}/${m ? '?touch=1' : ''}`;
  await open(url, w, h, d, m); await ev('localStorage.clear()'); await open(url, w, h, d, m);
  await ev(SEED); await open(url, w, h, d, m); await ev(OPEN);
  await ev("__app.ui.showNights('wren')"); await sleep(400);
  if (!(await ev("(()=>{const l=document.querySelector('.layer-nights');return !!l&&l.style.display!=='none'})()"))) fail('map screen did not open');
  for (const def of DEF) {
    await send('Emulation.setEmulatedVisionDeficiency', { type: def });
    await key('2', 'Digit2', 50); await sleep(180); await shot(`map-${def}-dd-${n}`);
    await key('3', 'Digit3', 51); await sleep(180); await shot(`map-${def}-ln-${n}`);
  }
  await send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });
  // reduced motion: OS preference, then the in-game Calm class; no infinite CSS animation may run on the map screen
  for (const how of ['os', 'calm']) {
    if (how === 'os') await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    else { await send('Emulation.setEmulatedMedia', { features: [] }); await ev("document.documentElement.classList.add('reduced-motion')"); }
    await sleep(300);
    const run = await ev("document.querySelector('.layer-nights').getAnimations({subtree:true}).filter(a=>a.playState==='running'&&a.effect&&a.effect.getTiming().iterations===Infinity).map(a=>a.animationName||'anim')");
    console.log('  reduced motion', how, 'infinite running animations:', JSON.stringify(run));
    if (run.length) fail(`${how} reduced motion: ${run}`);
  }
  await send('Emulation.setEmulatedMedia', { features: [] });
  if (errors.length) fail('console ' + errors.splice(0).join(';'));
}
try { ws.close(); proc.kill(); } catch { /* ignore */ }
await sleep(800);
try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
console.log(fails ? `${fails} FAIL` : 'ALL OK');
process.exit(fails ? 1 : 0);
