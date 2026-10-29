// FIX4: first-20-seconds frame times of a run, headless Chrome (no deps, Node 22+), CPU throttled, phone viewport. Same page-side sampler for any build
// (a plain rAF recorder), so it can compare an old build and the new one. A chain-lightning run (grant) so the first bolts are inside the window.
// Usage: node scripts/fix4-measure.mjs <baseUrl> [throttle=4] [runs=3] [seconds=20] [linger=0]
//   baseUrl e.g. http://localhost:5291  (a static server over dist/). linger = seconds on the front door before Start (a real player lingers).
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const base = process.argv[2], thr = +(process.argv[3] || 4), runs = +(process.argv[4] || 3), secs = +(process.argv[5] || 20), linger = +(process.argv[6] || 0);
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9334;
const dir = mkdtempSync(path.join(tmpdir(), 'hlfix4-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--autoplay-policy=no-user-gesture-required', ...(process.env.HW ? ['--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']), 'about:blank'], { stdio: 'ignore' });
let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch { /* retry */ } await sleep(300); }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await Promise.race([send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), sleep(30000).then(() => null)]); if (!r) { console.error('page not responding to:', expr.slice(0, 60)); return undefined; } return r.result?.result?.value; };
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__fr=[];(function f(t){window.__fr.push(t);requestAnimationFrame(f)})(0);' });
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setCPUThrottlingRate', { rate: thr });
const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(a.length * q))];
const out = [];
for (let r = 0; r < runs; r++) {
  await send('Page.navigate', { url: `${base}/?perf=1&grant=chain_lightning&god=1&seed=${7 + r}` });
  for (let i = 0; i < 200; i++) { if (await ev('!!(window.__app && window.__app.scene && window.__app.scene.sys)')) break; await sleep(300); }
  await sleep(1500 + linger * 1000);
  console.error('run', r, 'scene ready');
  const t0 = await ev('performance.now()');
  await ev("(window.__app.startRun('wren'), 0)");
  let simAt = null; for (let i = 0; i < 400; i++) { if (await ev('!!(window.__app.sim && window.__app.sim.time > 0.05)')) { simAt = await ev('performance.now()'); break; } await sleep(100); }
  console.error('run', r, 'sim started after', Math.round((simAt || 0) - t0), 'ms');
  if (simAt === null) { out.push({ run: r, error: 'run never started' }); continue; }
  for (let k = 0; k < secs + 1; k++) { await sleep(1000); if (k % 5 === 4) console.error('t+', k + 1, 'frames', await ev('window.__fr.length'), 'simt', await ev('window.__app.sim && window.__app.sim.time')); }
  const fr = await ev('window.__fr.slice()');
  const win = []; for (let i = 1; i < fr.length; i++) if (fr[i - 1] >= simAt && fr[i] <= simAt + secs * 1000) win.push(fr[i] - fr[i - 1]);
  const s = [...win].sort((a, b) => a - b);
  const probe = await ev('window.__probe ? JSON.stringify(window.__probe.report(0,' + secs + ')) : null');
  const longs = win.filter((d) => d > 50).length;
  out.push({ run: r, loadMs: Math.round(simAt - t0), frames: s.length, p50: +pct(s, 0.5).toFixed(1), p95: +pct(s, 0.95).toFixed(1), max: +s[s.length - 1].toFixed(0), over50: longs, probeTags: probe ? (JSON.parse(probe).tagged || []).slice(0, 12) : undefined });
}
console.log(JSON.stringify({ base, throttle: thr, seconds: secs, linger, runs: out }, null, 1));
ws.close(); proc.kill();
process.exit(0);
