// Tree look port: screenshots of the real tree screen (desktop 1280x720, phone 390x844) on a fresh Wren + Chain Lightning save and on grown saves.
//   cd dist && python -m http.server 5301      then      node scripts/tree-look-shots.mjs docs/screenshots/tree-look http://127.0.0.1:5301/ [filter]
// Own headless Chrome with a throwaway profile (deleted at the end). Saves are mutated in memory only (saveNow stubbed).
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, process.argv[2] || 'docs/screenshots/tree-look');
const BASE = process.argv[3] || 'http://127.0.0.1:5301/';
const ONLY = process.argv[4] || '';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9393;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const D = [1280, 720, 1, false], P = [390, 844, 2, true];
const profile = mkdtempSync(join(tmpdir(), 'hl-look-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--force-color-profile=srgb', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
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
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(`${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ''}`); return r.result.value; };
  await send('Page.enable'); await send('Runtime.enable');
  const T = 'window.__app.ui.tree';
  // lit = how many extra lanterns to light after the starter (breadth first along real edges), weapon = starter weapon id, restart = show the notice
  const openTree = async (dev, { lit = 0, weapon = 'chain_lightning', hero = 'wren', restart = false } = {}) => {
    const [w, h, dpr, mobile] = dev;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await send('Page.navigate', { url: `${BASE}?debug=0` });
    for (let i = 0; i < 120; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.save)')) break; } catch { /* loading */ } }
    await ev(`(async () => {
      try { localStorage.setItem('hollowlight:tree:pins', '[]'); localStorage.setItem('hollowlight:tree:tip', '1'); } catch {}
      const a = window.__app; const s = a.save.data;
      a.save.saveNow = () => {}; a.save.saveSoon = () => {};
      s.gold = 5000; s.shards = 20; s.settings = { ...s.settings, reducedMotion: true };
      s.notes = { ...(s.notes || {}), starter: { hero: '${hero}', weapon: '${weapon}' }, loadout: { hero: '${hero}', weapon: '${weapon}' } };
      ${restart ? 's.notes.treeResetNotice = { gold: 12345, shards: 7, glass: 3, nodes: 41 };' : ''}
      a.openTree();
      const t = ${T}; const st = t.view.starterOf ? t.view.starterOf(s.notes) : null; s.tree = {}; if (st) { if (st.heart) s.tree[st.heart] = 1; if (st.seal) s.tree[st.seal] = 1; }
      let n = ${lit}; const def = t.def; const par = new Map();
      for (const e of def.edges) { if (!par.has(e.to)) par.set(e.to, []); par.get(e.to).push(e.from); }
      for (let guard = 0; guard < 4000 && n > 0; guard++) {
        let pick = null;
        for (const id of def.list) { const nd = def.nodes[id]; if (s.tree[id] || nd.teaser || nd.inert) continue; const ps = [...(par.get(id) || []), ...(nd.requiresAny || [])]; if (ps.some((p) => p === 'hub' || s.tree[p])) { pick = id; break; } }
        if (!pick) break; s.tree[pick] = 1; n--;
      }
      t.recompute(); return true; })()`);
    await sleep(900);
  };
  const setZoom = async (z, x = 0, y = 0) => { await ev(`(() => { const t = ${T}; t.fly = null; t.cam.x = ${x}; t.cam.y = ${y}; t.cam.z = ${z}; t.limit && t.limit(); t.camSig = ''; t.dirty(); return true; })()`); await sleep(500); };
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 }); writeFileSync(join(OUT, `${name}.jpg`), Buffer.from(r.data, 'base64')); console.log('shot', name); };
  mkdirSync(OUT, { recursive: true });
  const want = (n) => !ONLY || n.includes(ONLY);
  const starterPos = `(() => { const t = ${T}; const st = t.view.starterOf(window.__app.save.data.notes); const n = t.def.nodes[st.heart]; return [n.x, n.y]; })()`;
  for (const [dn, dev, Z] of [['desk', D, { far: 0.2, mid: 0.4, near: 0.9 }], ['phone', P, { far: 0.11, mid: 0.3, near: 0.8 }]]) {
    if (want(`${dn}-fresh`)) {
      await openTree(dev, { lit: 0, restart: dn === 'desk' });
      await setZoom(Z.far); await shot(`${dn}-fresh-far`);
      await setZoom(Z.mid); await shot(`${dn}-fresh-mid`);
      const sp = await ev(starterPos); await setZoom(Z.near, sp[0], sp[1]); await shot(`${dn}-fresh-near-starter`);
      await setZoom(Z.near, 0, 0); await shot(`${dn}-fresh-near-hub`);
      await setZoom(0.45, -900, 1100); await shot(`${dn}-fresh-hero-medallion`);
    }
    if (want(`${dn}-grown`)) {
      await openTree(dev, { lit: 70 });
      await setZoom(Z.far); await shot(`${dn}-grown-far`);
      await setZoom(Z.mid); await shot(`${dn}-grown-mid`);
    }
    if (want(`${dn}-full`)) {
      await openTree(dev, { lit: 5000 });
      await setZoom(Z.far); await shot(`${dn}-full-far`);
    }
  }
  if (want('hover')) {
    await openTree(D, { lit: 20 });
    const far = await ev(`(() => { const t = ${T}; const m = t.model; const ids = t.def.list.filter((i) => m.cache[i].s === 'ready' || m.cache[i].s === 'open'); return ids.length ? ids[ids.length - 1] : null; })()`);
    if (far) {
      await ev(`(() => { const t = ${T}; const n = t.def.nodes['${far}']; t.fly = null; t.cam.x = n.x; t.cam.y = n.y; t.cam.z = 0.6; t.camSig = ''; t.dirty(); return true; })()`);
      await sleep(600);
      const p = await ev(`(() => { const t = ${T}; const n = t.def.nodes['${far}']; const r = t.mapEl.getBoundingClientRect(); const [x, y] = t.toS(n.x, n.y); return [r.left + x, r.top + y]; })()`);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0] - 5, y: p[1] - 5, pointerType: 'mouse' });
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], pointerType: 'mouse' });
      await sleep(500); await shot('desk-hover-path');
    }
  }
  if (want('perf')) {
    await openTree(D, { lit: 5000 });
    for (const th of [1, 4]) {
      await send('Emulation.setCPUThrottlingRate', { rate: th });
      const out = [];
      for (const z of [0.2, 0.4, 0.9]) {
        const ms = await ev(`(() => { const t = ${T}; t.fly = null; t.cam.x = 0; t.cam.y = 0; t.cam.z = ${z}; for (let i = 0; i < 8; i++) t.draw(performance.now());
          const a = []; for (let i = 0; i < 80; i++) { const t0 = performance.now(); t.draw(performance.now()); a.push(performance.now() - t0); } a.sort((x, y) => x - y); return [a.reduce((s, v) => s + v, 0) / a.length, a[Math.floor(a.length * 0.9)]]; })()`);
        out.push(`z${z}: avg ${ms[0].toFixed(2)} p90 ${ms[1].toFixed(2)}`);
      }
      console.log(`full cpu x${th}: ${out.join(' | ')}`);
    }
  }
} finally {
  try { ws && ws.close(); } catch { /* closed */ }
  proc.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* locked */ }
}
