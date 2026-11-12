// Q8: keyboard path, focus order + visible focus, 44 px targets (phone), the screen-reader summary line and the Calm / reduced-motion path of the Lantern Web on the BUILT dist.
// Usage: node scripts/a11y-tree-smoke.mjs <baseUrl>      (serve dist first: cd dist && python -m http.server 5301)
import { launch, sleep } from './u3-lib.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5301';
const c = await launch(9396);
let fails = 0;
const ok = (name, v, extra = '') => { console.log(v ? 'PASS' : 'FAIL', name, v ? '' : extra); if (!v) fails++; };
const T = '__app.ui.tree';
// a lantern with a starter, a tour already seen, some gold, some lit lanterns
const PREP = (calm) => `(() => { const a = __app, s = a.save.data; a.save.saveNow = () => {}; a.save.saveSoon = () => {}; s.gold = 5000; s.shards = 5; s.hints = 8192; s.settings = { ...s.settings, reducedMotion: ${calm ? 'true' : 'false'} };
  a.chooseStarter('wren', 'chain_lightning'); a.openTree(); return 1; })()`;
try {
  // ---------------------------------------------------------------- desktop: keyboard path + focus order + summary line
  await c.open(`${base}/?x=1`, 1280, 720, 1, false);
  await c.ev(PREP(false)); await sleep(1200);
  const sum = await c.ev("(() => { const e = document.getElementById('ts-sum-line'); return e ? e.textContent : null; })()");
  ok('screen-reader summary line ("N of M lanterns lit, K can light now")', /^\d[\d,]* of \d[\d,]* lanterns lit, \d[\d,]* can light now\.$/.test(sum || ''), String(sum));
  ok('the map points at it (aria-describedby)', await c.ev("document.querySelector('.ts-mapwrap').getAttribute('aria-describedby') === 'ts-sum-line'"));
  ok('summary is a polite live region', await c.ev("(() => { const e = document.getElementById('ts-sum-line'); return e.getAttribute('aria-live') === 'polite' && e.getAttribute('role') === 'status'; })()"));
  await c.ev("(() => { document.body.focus(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1; })()");
  const seen = [];
  for (let i = 0; i < 80; i++) {
    await c.key('Tab', 'Tab', 9); await sleep(40);
    const f = await c.ev("(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { cls: String(e.className).slice(0, 60), tag: e.tagName, inTree: !!e.closest('.ts'), ow: parseFloat(cs.outlineWidth) || 0, os: cs.outlineStyle, bs: cs.boxShadow !== 'none', w: Math.round(r.width), h: Math.round(r.height) }; })()");
    if (f) seen.push(f);
  }
  const names = seen.map((s) => s.cls);
  const idx = (re) => names.findIndex((n) => re.test(n));
  const lap = names.slice(names.findIndex((n) => /mnav__tab/.test(n)));
  const at = (re) => lap.findIndex((n) => re.test(n));
  ok('lap order nav < hero < map < Next lights < rail', at(/mnav__tab/) === 0 && at(/ts-swapb|ts-hplay/) > at(/mnav__tab/) && at(/ts-item/) > at(/ts-hplay/) && at(/ts-nc/) > at(/ts-item/) && at(/ts-lightable/) > at(/ts-nc/), lap.join(' | '));
  ok('Tab reaches the map (its lantern buttons), the Next lights cards and the tool rail', (idx(/ts-mapwrap/) >= 0 || idx(/ts-item/) >= 0) && idx(/ts-nc/) >= 0 && idx(/ts-lightable/) >= 0, names.join(' | '));
  const treeStops = seen.filter((s) => s.inTree);
  ok('every focus stop in the tree has a visible focus (outline or ring)', treeStops.every((s) => (s.os !== 'none' && s.ow >= 2) || s.bs), JSON.stringify(treeStops.filter((s) => !((s.os !== 'none' && s.ow >= 2) || s.bs))));
  // keyboard play: N = best next, Enter twice = light it
  await c.ev(`${T}.mapEl.focus(); 1`);
  const before = await c.ev(`Object.keys(__app.save.data.tree).length`);
  await c.key('n', 'KeyN', 78); await sleep(500);
  const sel = await c.ev(`${T}.selected`);
  ok('N selects the best next lantern', !!sel);
  await c.key('Enter', 'Enter', 13); await sleep(300); await c.key('Enter', 'Enter', 13); await sleep(600);
  ok('Enter, Enter lights it (keyboard only)', (await c.ev(`Object.keys(__app.save.data.tree).length`)) > before);
  await c.key('g', 'KeyG', 71); await sleep(400);
  ok('G opens Goals and Esc closes the panel, then the tree', await c.ev(`${T}.panelMode === 'goals'`));
  await c.key('Escape', 'Escape', 27); await sleep(300);
  ok('Esc closed the panel first (tree still open)', await c.ev(`${T}.isOpen && !${T}.panelMode`));
  // tour keyboard path
  await c.ev("(() => { __app.save.data.hints = 0; __app.ui.tree.close(); __app.openTree(); return 1; })()"); await sleep(1000);
  ok('tour is up and Next is focused', await c.ev("document.activeElement && document.activeElement.classList.contains('ts-tournext')"));
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: String.fromCharCode(13) }); await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await sleep(400);
  ok('Enter on Next goes to step 2', await c.ev("document.querySelector('.ts-tourd').textContent === '2 of 4'"));
  await c.key('Escape', 'Escape', 27); await sleep(300);
  ok('Esc skips the tour and the tree stays open', await c.ev(`${T}.isOpen && !document.querySelector('.ts-tour.open')`));
  ok('the tour is marked seen (hint bit 13)', await c.ev("(__app.save.data.hints & 8192) !== 0"));

  // ---------------------------------------------------------------- Calm: no animation loop once settled, no pulse classes
  await c.open(`${base}/?x=1`, 1280, 720, 1, false);
  await c.ev(PREP(true)); await sleep(500);
  await c.ev("(() => { const t = __app.ui.tree; const s = __app.save.data; for (const id of t.def.list.slice(0, 40)) if (!t.def.nodes[id].teaser) s.tree[id] = 1; t.recompute(); return 1; })()"); await sleep(1500);
  ok('Calm: the tree has no running animation loop when idle', await c.ev(`${T}.raf === 0`), String(await c.ev(`${T}.raf`)));
  ok('Calm: the root carries ts-calm', await c.ev("document.querySelector('.ts').classList.contains('ts-calm')"));
  await c.ev("(() => { const t = __app.ui.tree; t.pulseStart([t.def.list[3]]); t.dirty(); return 1; })()"); await sleep(700);
  ok('Calm: a pulse ring is steady (no loop)', await c.ev(`${T}.raf === 0`));

  // ---------------------------------------------------------------- phone: 44 px targets in the tree, tour, banner
  await c.open(`${base}/?x=1`, 390, 844, 2, true);
  await c.ev(PREP(false)); await sleep(1200);
  await c.ev("(() => { const t = __app.ui.tree; const id = t.def.list.find((q) => t.model.cache[q].s === 'ready'); t.select(id, true); t.setExpanded(true); return 1; })()"); await sleep(900);
  const small = await c.ev("(() => [...document.querySelectorAll('.ts button, .ts [role=button]')].filter((b) => { const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !b.closest('.ts-items') && (r.width < 43.5 || r.height < 43.5); }).map((b) => `${b.className.slice(0, 40)} ${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`))()");
  ok('phone: every visible button in the tree is at least 44x44', small.length === 0, small.join(' ; '));
  await c.ev("(() => { __app.save.data.hints = 0; __app.ui.tree.close(); __app.openTree(); return 1; })()"); await sleep(1000);
  const tour = await c.ev("(() => [...document.querySelectorAll('.ts-tour button')].map((b) => { const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }))()");
  ok('phone: tour buttons are at least 44 px', tour.length === 2 && tour.every((s) => s.split('x').every((n) => Number(n) >= 44)), tour.join(' '));
  ok('no console errors', c.errors.length === 0, JSON.stringify(c.errors.slice(0, 4)));
} finally { c.close(); }
process.exitCode = fails ? 1 : 0;
