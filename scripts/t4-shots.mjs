// T4 tree screen check: screenshots of the REAL game screen at 1280x720, 844x390@2x, 390x844@2x (docs/screenshots/tree/),
// functional checks (buy flow, keyboard focus, pins, Esc, console errors), colour-blind (greyscale) legend shot, and perf at the
// live tree and a synthetic 1000-node tree (desktop and a 4x CPU-throttled phone proxy). Own headless Chrome; the throwaway profile
// is DELETED at the end (also on failure).
//   npx vite --port 5287 --strictPort   (in another shell)   then   node scripts/t4-shots.mjs [filter]
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthTree, loadRealData } from './tree-synth.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screenshots', 'tree');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:5287/';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9391;
const ONLY = process.argv[2] || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PRESETS = JSON.parse(readFileSync(join(ROOT, 'docs', 'mockups', 'tree-screen', 'presets.json'), 'utf8'));
const D = [1280, 720, 1, false], L = [844, 390, 2, true], P = [390, 844, 2, true];

const profile = mkdtempSync(join(tmpdir(), 'hl-t4-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
let errors = 0;
const report = {};
let ws;
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* wait */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') { errors++; console.log('PAGE ERROR', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); }
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') { errors++; console.log('CONSOLE ERROR', d.params.args.map((a) => a.value || a.description).join(' ')); }
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(`${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description || ''}`); return r.result && r.result.value; };
  await send('Page.enable'); await send('Runtime.enable');

  const setDev = async ([w, h, dpr, mobile]) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  };
  // load the game, put a timeline preset into the in-memory save (sanitised by the real rules), open the tree
  const openTree = async (dev, preset, { tip = false, calm = true } = {}) => {
    await setDev(dev);
    await send('Page.navigate', { url: `${BASE}?debug=0` });
    for (let i = 0; i < 120; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.save)')) break; } catch { /* loading */ } }
    const p = PRESETS[preset];
    await ev(`(async () => {
      const T = await import('/src/meta/tree.js'); const A = await import('/src/app.js');
      try { localStorage.setItem('hollowlight:tree:pins', '[]'); ${tip ? "localStorage.removeItem('hollowlight:tree:tip');" : "localStorage.setItem('hollowlight:tree:tip', '1');"} } catch {}
      const a = window.__app; const s = a.save.data; const p = ${JSON.stringify(p)};
      s.gold = p.gold; s.shards = p.shards; s.dawnglass = p.dawnglass || 0;
      s.stats = { ...s.stats, ...p.stats }; s.creep = {}; s.seen = {};
      s.tree = T.sanitizeTree(p.tree, s.stats, A.treeDef, a.data);
      s.settings = { ...s.settings, reducedMotion: ${calm} };
      a.save.saveNow = () => {}; a.save.saveSoon = () => {}; // never write this preset to disk
      a.openTree(); return true; })()`);
    await sleep(700);
  };
  const shot = async (name, gray = false) => {
    if (gray) await ev("document.documentElement.style.filter='grayscale(1)';true");
    await sleep(250);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, 'base64'));
    if (gray) await ev("document.documentElement.style.filter='';true");
  };
  const T = 'window.__app.ui.tree';
  const VIEWS = [
    ['desk-run3', D, 2, ''], ['desk-run10', D, 3, ''], ['desk-run1', D, 1, ''],
    ['desk-far', D, 3, `${T}.home()`], ['desk-selected', D, 2, `${T}.select('gt_raven_flock', true)`],
    ['desk-best', D, 3, `${T}.nextAfford()`], ['desk-goals', D, 3, `${T}.toggleGoals(true)`], ['desk-help', D, 2, `${T}.openSheet('help')`],
    ['desk-index', D, 3, `${T}.openSheet('idx')`], ['desk-new', D, 0, '', { tip: true }], ['desk-tip', D, 2, '', { tip: true }],
    ['desk-run50', D, 5, ''],
    ['phl-run3', L, 2, ''], ['phl-selected', L, 2, `${T}.select('wf_rend', true)`], ['phl-goals', L, 3, `${T}.toggleGoals(true)`], ['phl-far', L, 3, `${T}.home()`],
    ['php-run3', P, 2, ''], ['php-selected', P, 2, `${T}.select('gt_raven_flock', true)`], ['php-goals', P, 3, `${T}.toggleGoals(true)`], ['php-new', P, 0, '', { tip: true }], ['php-help', P, 2, `${T}.openSheet('help')`],
  ];
  for (const [name, dev, preset, act, opt] of VIEWS) {
    if (ONLY && !name.includes(ONLY)) continue;
    await openTree(dev, preset, opt || {});
    if (act) { await ev(`(${act}, true)`); await sleep(600); }
    await shot(name);
  }
  if (!ONLY || ONLY === 'gray') { await openTree(D, 2); await ev(`${T}.openSheet('help'), true`); await shot('desk-help-greyscale', true); await openTree(D, 3); await shot('desk-run10-greyscale', true); }

  if (!ONLY || ONLY === 'check') {
    // functional checks on the real screen
    await openTree(D, 1);
    report.buy = await ev(`(async () => { const t = ${T}; const s = window.__app.save.data; const g0 = s.gold; const b = t.model.best && t.model.best.id;
      t.nextAfford(); await new Promise((r) => setTimeout(r, 300)); const bb = t.buyBtn; bb.click(); const mid = s.gold; bb.click();
      return { best: b, g0, mid, g1: s.gold, owned: (s.tree[b] || 0) >= 1, msg: t.pMsg.textContent, step: t.stepText.textContent }; })()`);
    report.keys = await ev(`(async () => { const t = ${T}; const sel0 = t.selected; const it = document.activeElement; const isItem = it && it.classList.contains('ts-item');
      const fire = (k) => (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      fire('ArrowRight'); await new Promise((r) => setTimeout(r, 100)); const sel1 = t.selected; fire('ArrowDown'); await new Promise((r) => setTimeout(r, 100)); const sel2 = t.selected;
      const focusOk = document.activeElement && document.activeElement.classList.contains('ts-item') && document.activeElement.dataset.id === sel2;
      fire('Escape'); const afterEsc = t.selected; fire('?'); const help = t.sheetOpen; fire('Escape'); const helpClosed = !t.sheetOpen;
      const tabbable = document.querySelectorAll('.ts-item[tabindex="0"]').length; const items = document.querySelectorAll('.ts-item').length;
      fire('g'); const goals = t.panelMode; fire('g');
      return { sel0, focusedItemAfterN: isItem, sel1, sel2, focusOk, afterEsc, help, helpClosed, tabbable, items, goals, open: t.isOpen }; })()`);
    report.pin = await ev(`(async () => { const t = ${T}; const ch = t.def.list.find((id) => t.model.cache[id].s === 'challenge'); if (!ch) return 'no challenge';
      t.select(ch); t.pinBtn.click(); const ls = localStorage.getItem('hollowlight:tree:pins'); const rows = t.model.goalRows().map((r) => r.id);
      t.pinBtn.click(); return { ch, ls, firstGoal: rows[0], pinned: rows[0] === ch, after: localStorage.getItem('hollowlight:tree:pins') }; })()`);
    report.unreached = await ev(`(() => { const t = ${T}; const id = t.def.list.find((x) => t.model.cache[x].v === 'unreached'); t.select(id); return { id, state: t.pState.textContent, steps: [...t.pSteps.querySelectorAll('li')].map((l) => l.textContent) }; })()`);
    report.price = await ev(`(() => { const t = ${T}; const s = window.__app.save.data; const ids = t.def.list.filter((x) => t.model.cache[x].d.next && t.def.cgroup[x]); let hit = null;
      for (const x of ids) { const n = t.model.priceNote(x); if (n.startsWith('Price has risen')) { hit = x; break; } }
      if (!hit) return { note: 'no risen price at this preset' }; t.select(hit); const T2 = t.model.cache[hit].d.next.gold; return { id: hit, shown: t.buyBtn.textContent, next: T2, meta: t.pMeta.textContent }; })()`);
    report.innerHTML = await ev("document.querySelector('.ts').innerHTML.includes('<script')");
    report.escClose = await ev(`(() => { const t = ${T}; const f = (k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k })); f('Escape'); f('Escape'); f('Escape'); return !t.isOpen; })()`);
    // perf: live tree
    const perf = async (label) => ev(`(async () => { const t = ${T}; const d0 = performance.now(); for (let i = 0; i < 30; i++) t.draw(performance.now()); const draw = (performance.now() - d0) / 30;
      const fr = []; let last = performance.now(); let k = 0; t.reduced = false; await new Promise((res) => { const step = (now) => { fr.push(now - last); last = now; t.pan(6, 2); if (++k < 90) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
      fr.sort((a, b) => a - b); return { label: '${label}', nodes: t.def.list.length, drawMs: +draw.toFixed(2), frameMedian: +fr[45].toFixed(2), frameP95: +fr[85].toFixed(2), items: document.querySelectorAll('.ts-item').length, lod: t.lodNow }; })()`);
    report.perf = [];
    await openTree(D, 3); report.perf.push(await perf('live desk mid'));
    await ev(`${T}.home(), true`); await sleep(300); report.perf.push(await perf('live desk far'));
    // synthetic 1000-node tree (v2 view of the real fragments + generated constellations)
    const syn = synthTree(loadRealData(), 1000);
    const openSyn = async (dev, throttle) => {
      await openTree(dev, 4);
      await send('Emulation.setCPUThrottlingRate', { rate: throttle });
      return ev(`(async () => { const TD = await import('/src/meta/treedata.js'); const TR = await import('/src/meta/tree.js'); const TV = await import('/src/meta/treeview.js');
        const syn = ${JSON.stringify({ files: syn.files, data: syn.data })}; const data = { ...window.__app.data, ...syn.data };
        const t0 = performance.now(); const c = TD.composeTree(syn.files, data); const def = TR.compileTree(c.v2, data); const view = TV.buildTreeView(c.info, def, data); const t1 = performance.now();
        const s = window.__app.save.data; const save = { ...s, tree: TR.sanitizeTree(${JSON.stringify(PRESETS[4].tree)}, s.stats, def, data) };
        const t = ${T}; t.close(); const o0 = performance.now();
        t.open({ def, data, view, save: () => save, buy: (id) => TR.buy(save, id, def, data), respec: () => TR.respec(save, def), markSeen: () => {}, onClose: () => {} });
        const o1 = performance.now(); return { nodes: def.list.length, buildMs: +(t1 - t0).toFixed(1), openMs: +(o1 - o0).toFixed(1) }; })()`);
    };
    report.synDesk = await openSyn(D, 1); await sleep(300);
    if (ONLY === 'check') { // profile: where the far-zoom frame goes at 1000 nodes
      await ev(`${T}.home(), true`); await sleep(600);
      report.prof = await ev(`(() => { const t = ${T}; const acc = {}; const wrap = (k) => { const f = t[k].bind(t); t[k] = (...a) => { const s = performance.now(); const r = f(...a); acc[k] = (acc[k] || 0) + performance.now() - s; return r; }; };
        ['drawRegions', 'drawFarSlots', 'drawRegionNames', 'drawLabels', 'drawLinks', 'nodeShape', 'affordMark', 'syncItems', 'placeEdge', 'freeRect'].forEach(wrap);
        const s0 = performance.now(); for (let i = 0; i < 20; i++) { t.cam.x += 5; t.draw(performance.now()); t.syncItems(); t.placeEdge(); } const tot = (performance.now() - s0) / 20;
        const o = { total: +tot.toFixed(2) }; for (const k in acc) o[k] = +(acc[k] / 20).toFixed(2); return o; })()`);
    }
    report.perf.push(await perf('1000 desk start'));
    await ev(`${T}.home(), true`); await sleep(300); report.perf.push(await perf('1000 desk far'));
    if (!ONLY) { await ev(`${T}.reduced = true, ${T}.camSig = '', ${T}.dirty(), true`); await sleep(300); await shot('desk-1000-far'); }
    report.synPhone = await openSyn(P, 4); await sleep(500);
    report.perf.push(await perf('1000 phone x4 start'));
    await ev(`${T}.home(), true`); await sleep(300); report.perf.push(await perf('1000 phone x4 far'));
    if (ONLY === 'check') report.profPhone = await ev(`(() => { const t = ${T}; const c = t.ctx; const acc = {}; const wrap = (o, k, name) => { const f = o[k].bind(o); o[k] = (...a) => { const s = performance.now(); const r = f(...a); acc[name] = (acc[name] || 0) + performance.now() - s; return r; }; };
        ['drawRegions', 'drawFarSlots', 'drawRegionNames', 'idsIn'].forEach((k) => wrap(t, k, k)); ['fill', 'clearRect', 'drawImage', 'arc', 'stroke', 'fillText'].forEach((k) => wrap(c, k, 'ctx.' + k));
        const s0 = performance.now(); for (let i = 0; i < 10; i++) { t.cam.x += 5; t.draw(performance.now()); } const tot = (performance.now() - s0) / 10;
        const o = { total: +tot.toFixed(2) }; for (const k in acc) o[k] = +(acc[k] / 10).toFixed(2); return o; })()`);
    await ev(`${T}.zoomAt(${T}.W/2, ${T}.H/2, 6), true`); await sleep(300); report.perf.push(await perf('1000 phone x4 mid'));
    await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
  report.errors = errors;
  console.log(JSON.stringify(report, null, 1));
} finally {
  const exited = new Promise((r) => { if (proc.exitCode !== null) r(); else proc.once('exit', r); });
  try { ws && ws.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); } catch { /* closed */ }
  await Promise.race([exited, sleep(5000)]);
  try { ws && ws.close(); } catch { /* closed */ }
  try { proc.kill(); } catch { /* gone */ }
  await sleep(1500); // child processes let go of the profile files
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (e) { console.log('profile cleanup failed', profile, e.message); }
}
