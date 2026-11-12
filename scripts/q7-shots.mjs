// Q7 / Far Sight / Kindling Start screenshots (desktop 1280x720, phone 390x844).
//   serve a build:  cd dist && python -m http.server 5302      then
//   node scripts/q7-shots.mjs chase  http://127.0.0.1:5302/   -> docs/screenshots/tree-q7/chase-*.jpg   (chase landmarks on the tree, selected)
//   node scripts/q7-shots.mjs tree <id> [preset]            -> docs/screenshots/tree-q7/tree-<id>-*.jpg (any node selected)
//   node scripts/q7-shots.mjs run <url-params> <name> <secs> -> docs/screenshots/tree-q7/run-<name>-*.jpg (in-run frame after <secs> s)
// Own headless Chrome with a throwaway profile (deleted at the end). Presets: docs/mockups/tree-screen/presets.json.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screenshots', 'tree-q7');
const [MODE = 'chase', A1 = '', A2 = '', A3 = ''] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://127.0.0.1:5302/';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9393;
const ID_RE = /^[a-z0-9_]{1,40}$/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PRESETS = JSON.parse(readFileSync(join(ROOT, 'docs', 'mockups', 'tree-screen', 'presets.json'), 'utf8'));
const D = [1280, 720, 1, false], P = [390, 844, 2, true];
const profile = mkdtempSync(join(tmpdir(), 'hl-q7-'));
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
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 }); writeFileSync(join(OUT, `${name}.jpg`), Buffer.from(r.data, 'base64')); console.log('shot', name); };
  const device = async ([w, h, dpr, mobile]) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile }); await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }); };
  const openTree = async (dev, preset) => {
    await device(dev);
    await send('Page.navigate', { url: `${BASE}?debug=0` });
    for (let i = 0; i < 120; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.save)')) break; } catch { /* loading */ } }
    const p = PRESETS[preset];
    await ev(`(async () => {
      try { localStorage.setItem('hollowlight:tree:pins', '[]'); localStorage.setItem('hollowlight:tree:tip', '1'); } catch {}
      const a = window.__app; const s = a.save.data; const p = ${JSON.stringify(p)};
      s.gold = p.gold; s.shards = p.shards; s.dawnglass = p.dawnglass || 0;
      s.stats = { ...s.stats, ...p.stats }; s.creep = {}; s.seen = {}; s.tree = p.tree; s.notes = { ...(s.notes || {}), starter: { hero: 'wren', weapon: 'ghost_wolves' }, loadout: { hero: 'wren', weapon: 'ghost_wolves' } };
      s.settings = { ...s.settings, reducedMotion: true };
      a.save.saveNow = () => {}; a.save.saveSoon = () => {};
      a.openTree(); return true; })()`);
    for (let i = 0; i < 80; i++) { await sleep(250); if (await ev('!!(window.__app.ui.tree && window.__app.ui.tree.model && window.__app.ui.tree.def)')) break; }
    await sleep(600);
  };
  const T = 'window.__app.ui.tree';
  const focus = async (nid, z) => { await ev(`(() => { const t = ${T}; t.select('${nid}'); const n = t.def.nodes['${nid}']; t.fly = null; t.cam.x = n.x; t.cam.y = n.y; t.cam.z = ${z}; t.limit && t.limit(); t.camSig = ''; t.dirty(); return true; })()`); await sleep(700); };
  mkdirSync(OUT, { recursive: true });
  if (MODE === 'chase' || MODE === 'tree') {
    const ids = MODE === 'chase' ? ['gt_murder_storm', 'gt_spirit_tempest', 'gt_static_storm', 'br_wardrobe'] : [A1];
    const preset = A2 ? Number(A2) : 2; // 2 = early-mid save: the chase seals are still unlit
    for (const nid of ids) {
      if (!ID_RE.test(nid)) throw new Error('bad id');
      for (const [dn, dev, z] of [['desk', D, 0.8], ['phone', P, 0.6]]) { await openTree(dev, preset); await focus(nid, z); await shot(`${MODE === 'chase' ? 'chase' : 'tree'}-${nid}-${dn}`); }
    }
    if (MODE === 'chase') { await openTree(D, preset); await ev(`(() => { const t = ${T}; t.fly = null; t.cam.x = 0; t.cam.y = 0; t.cam.z = 0.2; t.camSig = ''; t.dirty(); return true; })()`); await sleep(700); await shot('chase-overview-desk'); }
  } else if (MODE === 'far') { // whole web at far zoom (the default home view), desktop + phone: node q7-shots.mjs far <preset> <name>
    const preset = Number(A1) || 5, name = (A2 || `far-p${preset}`).replace(/[^a-z0-9_-]/gi, '');
    for (const [dn, dev] of [['desk', D], ['phone', P]]) {
      await openTree(dev, preset);
      await ev(`(() => { const t = ${T}; t.select && t.select(null); t.fly = null; t.home ? t.home() : null; t.camSig = ''; t.dirty(); return true; })()`).catch(() => null);
      await sleep(1500);
      await shot(`${name}-${dn}`);
      if (A3 && ID_RE.test(A3) && dn === 'desk') { // the same zoom with that landmark pushed to the top-right corner (label vs the tool rail)
        await ev(`(() => { const t = ${T}; const n = t.def.nodes['${A3}']; t.fly = null; t.cam.x = n.x - (t.W / 2 - 150) / t.cam.z; t.cam.y = n.y + (t.H / 2 - 150) / t.cam.z; t.camSig = ''; t.fr = null; t.dirty(); return true; })()`);
        await sleep(900);
        await shot(`${name}-${dn}-${A3}`);
      }
    }
  } else if (MODE === 'run') {
    const params = A1.replace(/[^a-zA-Z0-9_=&:.,-]/g, ''); const name = A2.replace(/[^a-z0-9_-]/gi, '') || 'run'; const secs = Math.max(0, Math.min(120, Number(A3) || 3));
    for (const [dn, dev] of [['desk', D], ['phone', P]]) {
      await device(dev);
      await send('Page.navigate', { url: `${BASE}?${params}` });
      let t0 = null;
      for (let i = 0; i < 360; i++) { // wait for the run to start, then `secs` seconds of sim time
        await sleep(250);
        const st = await ev('(() => { const s = window.__app && window.__app.sim; return s ? [s.state, s.time] : null; })()').catch(() => null);
        if (st && st[0] !== 'running') { // a start choice / level-up card: take the first one with the real key
          for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: '1', code: 'Digit1', windowsVirtualKeyCode: 49, text: type === 'keyDown' ? '1' : undefined });
          continue;
        }
        const t = st ? st[1] : null;
        if (t === null) continue;
        if (t0 === null) t0 = t;
        if (t - t0 >= secs) break;
      }
      await sleep(300);
      await shot(`run-${name}-${dn}`);
    }
  }
} finally {
  try { ws && ws.close(); } catch { /* */ }
  try { proc.kill(); } catch { /* */ }
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* */ }
}
