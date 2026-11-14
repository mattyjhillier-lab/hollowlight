// FREEZE-1: the evolve-moment hitch + late-run cost, measured in headless Chrome (no deps, Node 22+) with CPU throttling and a phone profile.
// For each evolution: start a run with the weapon's stats maxed (no evolution yet) at sim time T, play SETTLE s, then evolve exactly as a card pick does
// (owner units die, 'evolve' event, the evolution applied), and record every rAF frame for AFTER s. Reports p50/p95/max/long frames, the ?perf=1 probe
// tags of the long frames, the summon-bake totals (SUM_ART.evoMs / evoMaxStepMs) and the JS heap / canvas count / texture estimate.
// Usage: node scripts/evo-hitch.mjs <baseUrl> [evo ids comma|all|wolves] [throttle=4] [profile=iphone|android|desktop] [quality=auto|high|med|low|saver] [T=300] [after=12]
// Exit code 1 if any evolution's worst frame in the AFTER window is over BUDGET_MS (default 500, env BUDGET_MS) or the bake main-thread step is over 120 ms.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const EVOS = JSON.parse(readFileSync(path.join(here, '..', 'src', 'data', 'evolutions.json'), 'utf8'));
const WEAPONS = JSON.parse(readFileSync(path.join(here, '..', 'src', 'data', 'weapons.json'), 'utf8'));
const [base, sel = 'wolves', thrS = '4', profile = 'iphone', quality = 'auto', TS = '300', afterS = '12'] = process.argv.slice(2);
if (!base) { console.error('usage: node scripts/evo-hitch.mjs <baseUrl> [evos] [throttle] [profile] [quality] [T] [after]'); process.exit(2); }
const thr = +thrS, T = +TS, AFTER = +afterS, SETTLE = 8;
const BUDGET_MS = +(process.env.BUDGET_MS || 500), STEP_BUDGET = 120;
const ids = sel === 'all' ? Object.keys(EVOS) : sel === 'wolves' ? Object.keys(EVOS).filter((k) => EVOS[k].weapon === 'ghost_wolves') : sel.split(',');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9300 + Math.floor(Math.random() * 60);
const dir = mkdtempSync(path.join(tmpdir(), 'evohitch-'));
const gpu = process.env.SWIFT ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'];
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--enable-precise-memory-info', '--autoplay-policy=no-user-gesture-required', ...gpu, 'about:blank'], { stdio: 'ignore' });
let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch { /* retry */ } await sleep(300); }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await Promise.race([send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), sleep(60000).then(() => null)]); return r ? r.result?.result?.value : undefined; };

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
};
await send('Page.enable');
// frame recorder + canvas counter (installed before any page script)
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__fr=[];(function f(t){window.__fr.push(t);if(window.__fr.length>40000)window.__fr.splice(0,20000);requestAnimationFrame(f)})(0);
window.__cv=0;const __ce=document.createElement.bind(document);document.createElement=function(t,...r){if(String(t).toLowerCase()==='canvas')window.__cv++;return __ce(t,...r)};
${profile === 'iphone' ? "Object.defineProperty(Navigator.prototype,'maxTouchPoints',{get:()=>5});" : ''}` });
if (profile !== 'desktop') {
  await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 3, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setUserAgentOverride', { userAgent: UA[profile] || UA.iphone, platform: profile === 'iphone' ? 'iPhone' : 'Linux armv8l' });
} else await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setCPUThrottlingRate', { rate: thr });

const pct = (a, q) => (a.length ? a[Math.min(a.length - 1, Math.floor(a.length * q))] : 0);
const stats = (fr, from, to) => { const w = []; for (let i = 1; i < fr.length; i++) if (fr[i - 1] >= from && fr[i] <= to) w.push(fr[i] - fr[i - 1]); const s = [...w].sort((a, b) => a - b); return { n: s.length, p50: +pct(s, 0.5).toFixed(1), p95: +pct(s, 0.95).toFixed(1), max: +(s[s.length - 1] || 0).toFixed(0), over50: s.filter((d) => d > 50).length, over500: s.filter((d) => d > 500).length, over2000: s.filter((d) => d > 2000).length }; };
const out = []; let fail = false;
for (const evo of ids) {
  const e = EVOS[evo]; if (!e) { console.error('unknown evo', evo); continue; }
  const ranks = Object.keys(WEAPONS[e.weapon].stats).map((k) => k + '=5').join(',');
  const saver = quality === 'saver';
  await send('Page.navigate', { url: `${base}/?perf=1&god=1&seed=1&t=${T}&grant=${e.weapon}:${ranks}` });
  for (let i = 0; i < 200; i++) { if (await ev('!!(window.__app && window.__app.scene && window.__app.scene.sys && window.__app.save)')) break; await sleep(300); }
  await sleep(1500);
  await ev(`(window.__app.save.setSettings({quality:${JSON.stringify(saver ? 'auto' : quality)},batterySaver:${saver}}), window.__app.applySettings(), 0)`);
  await ev("(window.__app.startRun('wren'), 0)");
  let ok = false; for (let i = 0; i < 600; i++) { if (await ev(`!!(window.__app.sim && window.__app.sim.time > ${T + 0.5})`)) { ok = true; break; } await sleep(100); }
  if (!ok) { out.push({ evo, error: 'run never started' }); continue; }
  await sleep(SETTLE * 1000);
  const pre = await ev(`(()=>{const a=window.__app,s=a.sim,sc=a.scene,S=sc.sumArt||{};return {simT:+s.time.toFixed(1),enemies:s.enemies.length,units:s.units.length,tier:sc.quality.tier,mode:sc.prebake?sc.prebake.mode:'none',evoMs:S.evoMs||0,kinds:[...(S.kinds||[])].join(' ')}})()`);
  const t0 = await ev(`(()=>{const a=window.__app,s=a.sim;for(const u of s.units)if(u.owner===${JSON.stringify(e.weapon)})u.dead=true;s.pushEvent('evolve',{id:${JSON.stringify(evo)}});s.debugGrant(${JSON.stringify(e.weapon)},Object.fromEntries(${JSON.stringify(Object.keys(WEAPONS[e.weapon].stats))}.map(k=>[k,5])),${JSON.stringify(evo)});return performance.now()})()`);
  await sleep(AFTER * 1000);
  const fr = await ev('window.__fr.slice()');
  const after = stats(fr, t0 - 50, t0 + AFTER * 1000);
  const before = stats(fr, t0 - SETTLE * 1000 + 1000, t0 - 50);
  const post = await ev(`(()=>{const a=window.__app,sc=a.scene,S=sc.sumArt||{},P=window.__probe;const L=P?P.long.filter(l=>l.ms>50).slice(0,8).map(l=>Math.round(l.ms)+'ms '+l.tags.slice(0,5).join(', ')):[];let b=0;try{const T=sc.textures.list;for(const k in T)for(const r of T[k].source||[])b+=(r.width||0)*(r.height||0)*4}catch(e){}return {evoMs:+(S.evoMs||0).toFixed(0),evoMaxStepMs:+(S.evoMaxStepMs||0).toFixed(0),kinds:[...(S.kinds||[])].join(' '),pending:[...(S.pending||[])].join(' '),heapMB:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(0):-1,canvases:window.__cv,texMB:+(b/1048576).toFixed(0),long:L,tier:sc.quality.tier}})()`);
  const r = { evo, profile, quality, throttle: thr, pre, before, after, post };
  if (after.max > BUDGET_MS || post.evoMaxStepMs > STEP_BUDGET) { r.overBudget = true; fail = true; }
  out.push(r);
  console.error(evo, 'after max', after.max, 'ms, >500:', after.over500, ' bake', post.evoMs, 'ms (step', post.evoMaxStepMs, ')');
}
console.log(JSON.stringify({ base, budgetMs: BUDGET_MS, stepBudget: STEP_BUDGET, runs: out }, null, 1));
ws.close(); proc.kill();
process.exit(fail ? 1 : 0);
