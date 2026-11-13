// Tree smoke: real headless run of the built dist (open tree, pan, zoom, hover, buy a lantern, console errors). node scripts/tree-smoke.mjs http://127.0.0.1:5301/
// (shares its harness with tree-look-shots.mjs) Tree look port: screenshots of the real tree screen (desktop 1280x720, phone 390x844) on a fresh Wren + Chain Lightning save and on grown saves.
//   cd dist && python -m http.server 5301      then      node scripts/tree-look-shots.mjs docs/screenshots/tree-look http://127.0.0.1:5301/ [filter]
// Own headless Chrome with a throwaway profile (deleted at the end). Saves are mutated in memory only (saveNow stubbed).
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'http://127.0.0.1:5301/';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = Number(process.env.CDP_PORT) || 9393;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const D = [1280, 720, 1, false], P = [390, 844, 2, true];
const profile = mkdtempSync(join(tmpdir(), 'hl-look-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--force-color-profile=srgb', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
let ws; const errs = [];
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* wait */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') { errs.push('console.error ' + d.params.args.map((a) => a.value ?? a.description).join(' ')); }
    if (d.method === 'Runtime.exceptionThrown') errs.push('exception ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
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
      s.chars = { ...(s.chars || {}), ${hero}: { xp: 0, keep: 0, woke: true } };
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
  const setZoom = async (z, x = 0, y = 0) => { await ev(`(() => { const t = ${T}; t.fly = null; const fr = t.freeRect(); t.cam.z = ${z}; t.cam.x = ${x} - ((fr[0] + fr[2]) / 2 - t.W / 2) / ${z}; t.cam.y = ${y} - ((fr[1] + fr[3]) / 2 - t.H / 2) / ${z}; t.limit && t.limit(); t.camSig = ''; t.dirty(); return true; })()`); await sleep(500); };
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 }); writeFileSync(join(OUT, `${name}.jpg`), Buffer.from(r.data, 'base64')); console.log('shot', name); };
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${BASE}?debug=0` });
  for (let i = 0; i < 120; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.save)')) break; } catch { /* loading */ } }
  const ok = (name, v) => console.log(v ? 'PASS' : 'FAIL', name);
  await ev(`(() => { const a = window.__app, s = a.save.data; s.gold = 100000; s.shards = 50; a.chooseStarter && a.chooseStarter('wren', 'chain_lightning'); a.openTree(); return true; })()`);
  await sleep(800);
  ok('tree open', await ev(`${T}.isOpen`));
  const z0 = await ev(`${T}.cam.z`), x0 = await ev(`${T}.cam.x`);
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 700, y: 360, deltaX: 0, deltaY: -300 });
  await sleep(400); ok('wheel zoom changes zoom', (await ev(`${T}.cam.z`)) !== z0);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 700, y: 360, button: 'left', clickCount: 1, pointerType: 'mouse' });
  for (let i = 1; i <= 8; i++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700 - i * 20, y: 360, buttons: 1, pointerType: 'mouse' });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 540, y: 360, button: 'left', clickCount: 1, pointerType: 'mouse' });
  await sleep(300); ok('drag pans', (await ev(`${T}.cam.x`)) !== x0);
  // hover a ready lantern
  const nid = await ev(`(() => { const t = ${T}; t.fly = null; const m = t.model; const i = t.def.list.find((q) => m.cache[q].s === 'ready' && t.tierOfId(q) !== 'landmark'); const n = t.def.nodes[i]; t.cam.z = 1; t.cam.x = n.x; t.cam.y = n.y; t.camSig = ''; t.dirty(); return i; })()`);
  await sleep(500);
  const p = await ev(`(() => { const t = ${T}; const n = t.def.nodes['${nid}']; const r = t.mapEl.getBoundingClientRect(); const [x, y] = t.toS(n.x, n.y); return [r.left + x, r.top + y]; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0] - 4, y: p[1] - 4, pointerType: 'mouse' });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], pointerType: 'mouse' });
  await sleep(400);
  ok('hover sets focus', await ev(`!!${T}.focus && ${T}.focus.id === '${nid}'`));
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p[0], y: p[1], button: 'left', clickCount: 1, pointerType: 'mouse' });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p[0], y: p[1], button: 'left', clickCount: 1, pointerType: 'mouse' });
  await sleep(500);
  ok('click selects', (await ev(`${T}.selected`)) === nid);
  const gold0 = await ev(`window.__app.save.data.gold`);
  const clicked = await ev(`(() => { const b = window.__app.ui.tree.buyBtn; if (!b || b.disabled) return false; b.click(); b.click(); return true; })()`); // two taps: the second confirms
  await sleep(600);
  ok('buy button present and bought', clicked && (await ev(`window.__app.save.data.tree['${nid}'] >= 1`)) && (await ev(`window.__app.save.data.gold`)) < gold0);
  ok('lit after buy', await ev(`${T}.model.lit('${nid}')`));
  await ev(`(() => { ${T}.home(); return true; })()`); await sleep(500);
  const ms = await ev(`(() => { const t = ${T}; const a = []; for (let i = 0; i < 40; i++) { const t0 = performance.now(); t.draw(performance.now()); a.push(performance.now() - t0); } return a.reduce((x, y) => x + y, 0) / a.length; })()`);
  console.log('draw ms avg', ms.toFixed(2));
  ok('no console errors / exceptions', errs.length === 0); if (errs.length) console.log(errs.slice(0, 8).join(String.fromCharCode(10)));
} finally {
  try { ws && ws.close(); } catch { /* closed */ }
  proc.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* locked */ }
}
