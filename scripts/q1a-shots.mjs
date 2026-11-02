// Q1a: FAR / MID / NEAR screenshots of the tree on a fresh and a mid-game save (desktop 1280x720, phone 390x844) + tree draw-ms probe.
//   serve a build:  cd dist && python -m http.server 5301      then
//   node scripts/q1a-shots.mjs shots http://127.0.0.1:5301/    -> docs/screenshots/tree-q1a/*.jpg
//   node scripts/q1a-shots.mjs perf  http://127.0.0.1:5301/    -> prints draw ms (avg of 80 draws per zoom, desktop and 4x CPU throttle)
// Own headless Chrome with a throwaway profile (deleted at the end). Presets: docs/mockups/tree-screen/presets.json (0 fresh, 4 mid-game, 5 late).
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screenshots', 'tree-q1a');
const MODE = process.argv[2] || 'shots';
const BASE = process.argv[3] || 'http://127.0.0.1:5301/';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9392;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PRESETS = JSON.parse(readFileSync(join(ROOT, 'docs', 'mockups', 'tree-screen', 'presets.json'), 'utf8'));
const D = [1280, 720, 1, false], P = [390, 844, 2, true];
const profile = mkdtempSync(join(tmpdir(), 'hl-q1a-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
let ws;
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* wait */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.log('PAGE ERROR', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(`${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ''}`); return r.result && r.result.value; };
  await send('Page.enable'); await send('Runtime.enable');
  const openTree = async (dev, preset) => {
    const [w, h, dpr, mobile] = dev;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await send('Page.navigate', { url: `${BASE}?debug=0` });
    for (let i = 0; i < 120; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.save)')) break; } catch { /* loading */ } }
    const p = PRESETS[preset];
    await ev(`(async () => {
      try { localStorage.setItem('hollowlight:tree:pins', '[]'); localStorage.setItem('hollowlight:tree:tip', '1'); } catch {}
      const a = window.__app; const s = a.save.data; const p = ${JSON.stringify(p)};
      s.gold = p.gold; s.shards = p.shards; s.dawnglass = p.dawnglass || 0;
      s.stats = { ...s.stats, ...p.stats }; s.creep = {}; s.seen = {}; s.tree = p.tree;
      s.settings = { ...s.settings, reducedMotion: true };
      a.save.saveNow = () => {}; a.save.saveSoon = () => {};
      a.openTree(); return true; })()`);
    await sleep(900);
  };
  const T = 'window.__app.ui.tree';
  const setZoom = async (z, x = 0, y = 0) => { await ev(`(() => { const t = ${T}; t.fly = null; t.cam.x = ${x}; t.cam.y = ${y}; t.cam.z = ${z}; t.limit && t.limit(); t.camSig = ''; t.dirty(); return true; })()`); await sleep(500); };
  if (MODE === 'shots') {
    mkdirSync(OUT, { recursive: true });
    const Z = { desk: { far: 0.2, mid: 0.55, near: 1.0 }, phone: { far: 0.12, mid: 0.4, near: 0.9 } };
    for (const [pn, preset] of [['fresh', 0], ['mid', 4]]) {
      for (const [dn, dev] of [['desk', D], ['phone', P]]) {
        await openTree(dev, preset);
        for (const lod of ['far', 'mid', 'near']) {
          // NEAR looks at a busy lit area (a weapon cluster) on the mid save, the hub on a fresh one
          const c = lod === 'near' && preset ? await ev(`(() => { const t = ${T}; const r = t.view.regions.find((q) => q.kind === 'cluster' && q.lit > 0) || t.view.regions[0]; return [r.x, r.y]; })()`) : [0, 0];
          await setZoom(Z[dn][lod], c[0], c[1]);
          const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 });
          writeFileSync(join(OUT, `${dn}-${pn}-${lod}.jpg`), Buffer.from(r.data, 'base64'));
          console.log('shot', dn, pn, lod);
        }
      }
    }
  } else {
    for (const [pn, preset] of [['fresh', 0], ['mid', 4], ['late', 5]]) {
      await openTree(D, preset);
      for (const th of [1, 4]) {
        await send('Emulation.setCPUThrottlingRate', { rate: th });
        const out = [];
        for (const z of [0.2, 0.55, 1.0]) {
          const ms = await ev(`(() => { const t = ${T}; t.fly = null; t.cam.x = 0; t.cam.y = 0; t.cam.z = ${z}; for (let i = 0; i < 8; i++) t.draw(performance.now());
            const a = []; for (let i = 0; i < 80; i++) { const t0 = performance.now(); t.draw(performance.now()); a.push(performance.now() - t0); } a.sort((x, y) => x - y); return [a.reduce((s, v) => s + v, 0) / a.length, a[Math.floor(a.length * 0.9)]]; })()`);
          out.push(`z${z}: avg ${ms[0].toFixed(2)} p90 ${ms[1].toFixed(2)}`);
        }
        console.log(`${pn} cpu x${th}: ${out.join(' | ')}`);
      }
      await send('Emulation.setCPUThrottlingRate', { rate: 1 });
    }
  }
} finally {
  try { ws && ws.close(); } catch { /* closed */ }
  proc.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* locked */ }
}
