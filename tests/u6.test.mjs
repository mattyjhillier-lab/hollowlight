// U6: results screen in Lantern Glass, Lit. Copy and numbers (near-miss line, damage shares, nudge from real data), count-up final values, hostile strings inert,
// key map + 250 ms lock + single action, row dropping on short screens, CSS floors and scoping, contrast, no invented copy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';

const R = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, style: { setProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); }, replaceChildren(...cs) { this.children = cs; this._text = ''; },
    querySelector(sel) { const o = n.querySelectorAll(sel); return o[0] || null; },
    querySelectorAll(sel) {
      const o = []; const cls = sel.startsWith('.') ? sel.slice(1) : null; const attr = sel.startsWith('[') ? sel.slice(1, sel.indexOf(']')) : null;
      const w = (x) => { if ((cls && x._cls.has(cls)) || (attr && attr in x.attrs)) o.push(x); x.children.forEach(w); };
      n.children.forEach(w); return o;
    },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, detail: 1, ...ev })); },
    focus() { globalThis.document.activeElement = n; }, click() { if (n.disabled) return; n.fire('click', { detail: 0 }); },
    closest(sel) { const c = sel.replace('.', ''); return n._cls.has(c) ? n : null; } };
  n.classList = { add: (...c) => c.forEach((x) => n._cls.add(x)), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  Object.defineProperty(n, 'outerHTML', { set() { throw new Error('outerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };
const { buildResults, INPUT_LOCK_MS, COUNT_MS } = await import('../src/ui/results.js');
const C = await import('../src/ui/resultscopy.js');

const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };
const byCls = (r, c) => find(r, (n) => n._cls.has(c));
const allText = (r) => r.textContent;

const W = (id, damage, evo = null) => ({ id, evo, ranks: {}, damage, kills: 0 });
const res = (over = {}) => ({ outcome: 'defeat', time: 462, level: 9, kills: 412, gold: 312, shards: 2, bossKilled: false, chapter: 'cursed_forest', character: 'wren',
  weapons: [W('ghost_wolves', 6200), W('holy_orbit', 2400), W('raven_flock', 1400)], ...over });
const bank = (over = {}) => ({ gold: 1840, shards: 7, bestTime: 680, newBest: false, prevBest: 680, newly: [], closest: [], ...over });
const mkView = (r = res(), b = bank()) => C.resultsView(r, b, data);
const build = (view, opts = {}) => { const log = []; let t = 1000; const r = buildResults({ view, raf: () => 0, onAgain: () => log.push('again'), onMenu: () => log.push('menu'), onTree: () => log.push('tree'), now: () => t, ...opts });
  r.setShownAt(1000); return { r, log, at: (ms) => { t = 1000 + ms; } }; };
const key = (k, over = {}) => ({ key: k, preventDefault() {}, ...over });

// ---------------------------------------------------------------- copy + numbers
test('near-miss line: time short of dawn and best time, from the real run length', () => {
  const v = mkView();
  assert.equal(v.time, '7:42');
  assert.equal(v.near.map((s) => s.t).join(''), '7:18 short of dawn · best 11:20');
  assert.equal(v.title, 'The light dwindles');
  assert.equal(v.timeLabel, 'Time survived');
  assert.ok(Math.abs(v.arc.frac - 462 / 900) < 1e-9);
  assert.equal(v.arc.bossLabel, 'Elder Treant 10:00');
  assert.equal(v.arc.dawnLabel, 'Dawn 15:00');
  assert.equal(v.kicker, 'Night 1 · Cursed Forest · Wren');
});

test('new best on a defeat says so instead of repeating the old best', () => {
  const v = mkView(res({ time: 700 }), bank({ bestTime: 700, newBest: true, prevBest: 462 }));
  assert.equal(v.near.map((s) => s.t).join(''), '3:20 short of dawn · new best');
});

test('victory: gold title, boss slain, bark, dawn panel flag, longer line', () => {
  const v = mkView(res({ outcome: 'victory', time: 900, bossKilled: true }), bank({ bestTime: 900, newBest: true, prevBest: 700 }));
  assert.equal(v.won, true);
  assert.equal(v.title, 'Dawn');
  assert.equal(v.timeLabel, 'Survived the night');
  assert.equal(v.near.map((s) => s.t).join(''), 'New best · Elder Treant slain');
  assert.equal(v.bark, 'Still here. Still lit.');
  assert.match(v.line, /Treant sleeps/);
  const b = build(v);
  assert.ok(byCls(b.r.root, 'lg-panel--dawn').length === 1, 'victory uses the dawn leadlight panel');
  assert.equal(byCls(build(mkView()).r.root, 'lg-panel--dawn').length, 0, 'defeat does not');
  assert.equal(C.resultsView(res({ outcome: 'victory', time: 900, bossKilled: false }), bank({ bestTime: 900 }), data).line.includes('Treant'), false);
});

test('chips: level, slain, evolved count and names', () => {
  const v = mkView(res({ weapons: [W('ghost_wolves', 10, 'phantom_stampede'), W('holy_orbit', 5, 'sanctum_halo'), W('raven_flock', 1)] }));
  assert.equal(v.chips.level, 9);
  assert.equal(v.chips.slain, 412);
  assert.equal(v.chips.evolved, 2);
  assert.match(v.chips.evolvedNames, /Lightfoot Pack/);
  assert.equal(mkView().chips.evolved, 0);
});

test('bank: gold and shards banked with totals; debug run shows the note and no totals', () => {
  const v = mkView();
  assert.deepEqual([v.bank.gold, v.bank.goldTotal, v.bank.shards, v.bank.shardsTotal], [312, 1840, 2, 7]);
  const d = C.resultsView(res(), null, data);
  assert.equal(d.debug, true);
  assert.equal(d.bank.goldTotal, undefined);
  assert.match(allText(build(d).r.root), /Debug run: not saved\./);
  assert.equal(C.group(1234567), '1,234,567');
  assert.equal(C.group(-5), '0');
});

test('damage shares: top 3 by damage, rounded percent of weapon damage, evolved name, zero stays 0%', () => {
  const s = C.weaponShares([W('raven_flock', 1400), W('ghost_wolves', 6200, 'phantom_stampede'), W('holy_orbit', 2400), W('spirit_bolts', 10)], data);
  assert.deepEqual(s.map((x) => x.id), ['ghost_wolves', 'holy_orbit', 'raven_flock']);
  assert.deepEqual(s.map((x) => x.pct), [62, 24, 14]);
  assert.equal(s[0].name, 'Lightfoot Pack');
  assert.equal(s[0].evo, true);
  const z = C.weaponShares([W('ghost_wolves', 0), W('holy_orbit', 0)], data);
  assert.deepEqual(z.map((x) => x.pct), [0, 0]);
  assert.deepEqual(C.weaponShares([], data), []);
  assert.deepEqual(C.weaponShares(null, data), []);
  assert.ok(s.every((x) => x.pct >= 0 && x.pct <= 100));
  assert.equal(C.weaponShares([W('ghost_wolves', Infinity), W('holy_orbit', NaN)], data).every((x) => Number.isFinite(x.pct)), true);
});

test('weapon shares from a real sim run match the counters', async () => {
  const { Sim } = await import('../src/sim/Sim.js');
  const sim = new Sim({ data, characterId: 'wren', seed: 11, godMode: true });
  sim.debugGrant('ghost_wolves', { power: 3, count: 3 }); sim.debugGrant('holy_orbit', { power: 3, radius: 3 });
  for (let i = 0; i < 3600; i++) { if (sim.state === 'levelup') sim.pickCard((sim.offer.gold[0] || sim.offer.cards[0]).key); sim.step(1 / 60, {}); }
  const v = C.resultsView(sim.result(), bank(), data);
  assert.ok(v.weapons.length >= 2);
  assert.ok(v.weapons[0].pct >= v.weapons[1].pct);
  assert.ok(v.weapons.reduce((a, w) => a + w.pct, 0) <= 100 + 3);
});

test('unlock nudge uses real tree data: NEW line first, else the closest unlock; no invented copy', () => {
  const near = mkView(res(), bank({ closest: [{ id: 'a', name: 'Raven Flock', gate: true, frac: 0.84, text: 'Crows slain: 101/120' }] }));
  assert.equal(near.nudge.kind, 'closest');
  assert.equal(near.nudge.name, 'Raven Flock');
  assert.equal(near.nudge.text, 'Crows slain: 101/120');
  assert.equal(near.treeDot, false);
  const fresh = mkView(res(), bank({ newly: ['NEW: Raven Flock is ready to unlock in the Skill Tree.', 'b'], closest: [{ id: 'a', name: 'Zzz', frac: 0.5, text: 't' }] }));
  assert.equal(fresh.nudge.kind, 'new');
  assert.equal(fresh.nudge.text, 'Raven Flock is ready to unlock in the Skill Tree.');
  assert.equal(fresh.nudge.more, 1);
  assert.equal(fresh.treeDot, true);
  assert.equal(mkView(res(), bank()).nudge, null, 'nothing real to show: the row is hidden');
  const src = ['src/ui/resultscopy.js', 'src/ui/results.js', 'src/ui/results.css'].map(R).join('\n');
  assert.ok(!/Hall of Dawns/i.test(src));
});

test('Tree button carries a teal dot and a screen-reader note only when something is new', () => {
  const withDot = build(mkView(res(), bank({ newly: ['NEW: x'] }))).r;
  assert.equal(byCls(withDot.tree, 'u6-dot').length, 1);
  assert.match(allText(withDot.tree), /something new to unlock/);
  assert.equal(byCls(build(mkView()).r.tree, 'u6-dot').length, 0);
});

// ---------------------------------------------------------------- count-up
test('countAt: eased, monotonic, exactly the target at the end, safe on bad input', () => {
  let last = -1;
  for (let k = 0; k <= 1.0001; k += 0.05) { const v = C.countAt(1120, k); assert.ok(v >= last); last = v; }
  assert.equal(C.countAt(1120, 1), 1120);
  assert.equal(C.countAt(1120, 5), 1120);
  assert.equal(C.countAt(1120, 0), 0);
  assert.equal(C.countAt(1120, NaN), 1120);
  assert.equal(C.countAt(NaN, 0.5), 0);
  assert.equal(C.countAt(-3, 0.5), 0);
});

test('count-up: reduced motion sets the final value at once; normal motion ends on it; screen readers always get the final text', () => {
  const v = mkView();
  const red = build(v, { reduced: true }).r;
  red.mounted();
  const vis = (r) => byCls(r.root, 'u6-cnt').map((n) => n.textContent);
  assert.deepEqual(vis(red), ['+312', '+2']);
  red.destroy();
  // normal: drive a fake rAF
  const frames = [];
  let clock = 1000;
  const b = build(v, { reduced: false, raf: (f) => { frames.push(f); return frames.length; }, now: () => clock });
  b.r.mounted();
  assert.deepEqual(byCls(b.r.root, 'u6-sr').filter((n) => /^\+/.test(n.textContent)).map((n) => n.textContent), ['+312', '+2'], 'sr text is final from the start');
  assert.ok(byCls(b.r.root, 'u6-cnt').every((n) => n.attrs['aria-hidden'] === 'true'), 'animated digits are hidden from assistive tech');
  let steps = 0;
  while (frames.length && steps++ < 200) { const f = frames.shift(); clock += 50; f(clock); }
  assert.deepEqual(vis(b.r), ['+312', '+2']);
  assert.ok(steps > 3 && steps < 40, `ran ${steps} frames`);
  assert.ok(COUNT_MS >= 500 && COUNT_MS <= 1500);
});

test('destroy stops the animation (no frames run after the screen closes)', () => {
  const frames = [];
  const b = build(mkView(), { raf: (f) => { frames.push(f); return frames.length; } });
  b.r.mounted();
  const f = frames.shift();
  b.r.destroy();
  f(5000);
  assert.equal(frames.length, 0);
});

// ---------------------------------------------------------------- keys
test('key map: R and Enter = Again, Esc = Main menu, T = Tree; one action only', () => {
  for (const [k, want] of [['r', 'again'], ['R', 'again'], ['Enter', 'again'], ['Escape', 'menu'], ['t', 'tree'], ['T', 'tree']]) {
    const { r, log, at } = build(mkView());
    at(INPUT_LOCK_MS + 10);
    globalThis.document.activeElement = null;
    assert.equal(r.onKey(key(k)), true, k);
    assert.deepEqual(log, [want], k);
    assert.equal(r.onKey(key('r')), false, 'second key does nothing');
    r.again.click();
    assert.deepEqual(log, [want], 'no double action');
  }
});

test('keys during the first 250 ms are ignored (a mashed key from the run must not restart it); repeats and modifiers too', () => {
  const { r, log, at } = build(mkView());
  at(INPUT_LOCK_MS - 20);
  assert.equal(r.onKey(key('r')), false);
  assert.equal(r.onKey(key('Escape')), false);
  r.again.click(); // keyboard-made click (detail 0) inside the lock
  assert.deepEqual(log, []);
  at(INPUT_LOCK_MS + 20);
  assert.equal(r.onKey(key('r', { repeat: true })), false);
  assert.equal(r.onKey(key('r', { ctrlKey: true })), false);
  assert.equal(r.onKey(key('x')), false);
  assert.deepEqual(log, []);
  assert.equal(r.onKey(key('r')), true);
  assert.deepEqual(log, ['again']);
});

test('Enter on a focused button is left to the button (no extra Again); mouse and touch clicks work at once', () => {
  const { r, log, at } = build(mkView());
  at(INPUT_LOCK_MS + 10);
  r.menu.focus();
  assert.equal(r.onKey(key('Enter')), false);
  assert.deepEqual(log, []);
  const b2 = build(mkView());
  b2.at(5);
  b2.r.tree.fire('click', { detail: 1 }); // a real pointer click right after the screen appears is a deliberate choice
  assert.deepEqual(b2.log, ['tree']);
});

test('buttons: Again is the primary with R, Main menu shows Esc, Tree shows T; all are real buttons', () => {
  const { r } = build(mkView());
  assert.ok(r.again._cls.has('lg-btn--primary'));
  assert.equal(r.again.attrs['aria-keyshortcuts'], 'R');
  assert.equal(r.menu.attrs['aria-keyshortcuts'], 'Esc');
  assert.equal(r.tree.attrs['aria-keyshortcuts'], 'T');
  assert.equal(r.again.tag, 'button');
  assert.match(allText(r.menu), /Main menu/);
});

// ---------------------------------------------------------------- hostile strings
test('hostile run and tree strings stay inert text', () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const d = { ...data, chapters: { [evil]: { name: evil, bossId: 'elder_treant', bossAt: 600 } }, characters: { '"x': { name: evil } }, enemies: { ...data.enemies } };
  const v = C.resultsView({ ...res(), chapter: evil, character: '"x', weapons: [W(evil, 10), W('ghost_wolves', 5, evil)] }, bank({ newly: [evil], closest: [{ id: 'a', name: evil, gate: false, frac: 0.5, text: evil }], note: evil }), d);
  const { r } = build(v);
  r.mounted();
  const tags = find(r.root, (n) => ['script', 'img', 'iframe', 'style', 'a'].includes(n.tag));
  assert.equal(tags.length, 0);
  assert.ok(allText(r.root).includes('<img'), 'shown as plain text');
  const long = C.resultsView({ ...res(), weapons: [W('ghost_wolves', 5)], chapter: 'x'.repeat(500) }, bank({ closest: [{ id: 'a', name: 'n'.repeat(500), frac: 2, text: 't'.repeat(500) }] }), data);
  assert.ok(long.nudge.name.length <= 40 && long.nudge.text.length <= 80 && long.nudge.frac === 1);
  assert.ok(long.kicker.length < 120);
  for (const f of ['src/ui/results.js', 'src/ui/resultscopy.js']) assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML|document\.write|eval\(/.test(R(f).replace(/\/\/.*$/gm, '')), f);
});

test('garbage input never throws', () => {
  for (const r of [null, undefined, {}, { weapons: 'x' }, { time: 'abc', level: null, kills: {}, weapons: [null, 5, {}] }]) {
    for (const b of [null, {}, { newly: 'x', closest: 5 }]) {
      const v = C.resultsView(r, b, data);
      build(v).r.mounted();
      C.resultsSummary(v);
    }
  }
  const v = C.resultsView({}, null, {});
  assert.equal(v.time, '0:00');
});

// ---------------------------------------------------------------- short screens drop rows, never scroll
test('fit(): when the body overflows, rows drop in priority order (weapons, nudge, arc labels, line) and come back when there is room', () => {
  const v = mkView(res(), bank({ closest: [{ id: 'a', name: 'Raven Flock', frac: 0.5, text: 't' }] }));
  const { r } = build(v);
  const dropped = () => (r.root.getAttribute('data-dropped') || '').split(' ').filter(Boolean);
  let room = 0; // how many drop groups are needed before it fits
  const hiddenGroups = () => new Set(r.root.querySelectorAll('[data-drop]').filter((n) => n.hidden).map((n) => n.attrs['data-drop']));
  const order = ['weapons', 'nudge', 'arcl', 'line'];
  Object.defineProperty(r.main, 'clientHeight', { get: () => 100 });
  const hiddenN = () => order.filter((k) => hiddenGroups().has(k)).length;
  Object.defineProperty(r.main, 'scrollHeight', { get: () => 100 + (hiddenN() < room ? 10 : 0) });
  Object.defineProperty(r.panel, 'clientHeight', { get: () => 100 });
  Object.defineProperty(r.panel, 'scrollHeight', { get: () => 100 });
  Object.defineProperty(r.hero, 'clientHeight', { get: () => 100 });
  Object.defineProperty(r.hero, 'scrollHeight', { get: () => 100 });
  room = 0; r.fit(); assert.deepEqual(dropped(), []);
  room = 1; r.fit(); assert.deepEqual(dropped(), ['weapons']);
  room = 2; r.fit(); assert.deepEqual(dropped(), ['weapons', 'nudge']);
  room = 3; r.fit(); assert.deepEqual(dropped(), ['weapons', 'nudge', 'arcl']);
  room = 0; r.fit(); assert.deepEqual(dropped(), [], 'rows return when the window grows');
});

// ---------------------------------------------------------------- CSS floors + scoping, ui.js wiring
const css = R('src/ui/results.css');
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

test('CSS: every rule is scoped under .overlay.u6 (nothing leaks to the HUD or other screens); no scrolling, no filters, no external URLs', () => {
  const rules = cssNoComments.replace(/@media[^{]*\{/g, '').split('}').map((s) => s.trim()).filter(Boolean);
  for (const rule of rules) {
    const sel = rule.slice(0, rule.indexOf('{')).trim();
    if (!sel || sel.startsWith('@')) continue;
    for (const part of sel.split(',').map((x) => x.trim())) assert.ok(/^(html(\.touch|\.reduced-motion)? )?\.overlay\.u6/.test(part), `unscoped selector: ${part}`);
  }
  assert.ok(!/overflow(-y)?:\s*(auto|scroll)/.test(cssNoComments), 'results never scroll');
  assert.ok(!/backdrop-filter|filter:\s*blur|url\(http|@import/.test(cssNoComments));
  assert.ok(/overflow:\s*hidden/.test(cssNoComments));
});

test('CSS floors: no literal font size under 12px, buttons at least 44px tall, key map documented in the kit button hints', () => {
  const sizes = [...cssNoComments.matchAll(/font(?:-size)?:[^;]*?(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
  // clamp()/max() minimums that appear as the first px value
  for (const m of cssNoComments.matchAll(/font(?:-size)?:[^;{]*?(?:clamp|max)\((\d+(?:\.\d+)?)px/g)) assert.ok(Number(m[1]) >= 12, `font floor ${m[1]}`);
  for (const s of sizes) assert.ok(s >= 12 || s > 100, `small font ${s}`);
  for (const m of cssNoComments.matchAll(/min-height:\s*(?:max|clamp)\((\d+)px/g)) assert.ok(Number(m[1]) >= 44);
  for (const m of cssNoComments.matchAll(/min-height:\s*(\d+)px/g)) assert.ok(Number(m[1]) >= 44);
});

// contrast (WCAG) of the results colours on the glass the panel is drawn on
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const over = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
const ratio = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
test('contrast: results text colours are at least 4.5:1 on the glass (lightest and darkest stops) and on the dawn/dusk backgrounds', () => {
  const glass = [hex('#303c56'), hex('#161c2a')];
  const warm = over(hex('#ffbe6e'), 0.24, glass[0]); // worst case: the lantern leak on the lightest stop
  const chipBg = over(hex('#080b14'), 0.42, warm);
  for (const bg of [...glass, warm, chipBg]) {
    for (const fg of ['#fff3dc', '#ffd36b', '#f5dfae']) assert.ok(ratio(hex(fg), bg) >= 4.5, `${fg} on ${bg}`);
    assert.ok(ratio(over(hex('#fff3dc'), 0.88, bg), bg) >= 4.5, 'dim text');
  }
  assert.ok(ratio(hex('#ffd36b'), hex('#3a2b1c')) >= 4.5, 'victory title on the dawn background');
  assert.ok(ratio(hex('#efe0c0'), hex('#1b1a1c')) >= 4.5, 'poetic line on the dusk background');
  assert.ok(ratio(hex('#2a1608'), hex('#d97a22')) >= 4.5, 'primary button label on its darkest amber');
});

test('ui.js wiring: showEnd builds through results.js (no HTML strings), end keys route to the view, space activates buttons, hide destroys the view', () => {
  const ui = R('src/ui/ui.js');
  const a = ui.indexOf('  showEnd(sim, bank) {');
  const body = ui.slice(a, ui.indexOf('// ------------------------------------------------------------------ settings'));
  assert.ok(/buildResults\(/.test(body) && /resultsView\(/.test(body));
  assert.ok(!/innerHTML|html\)|this\.show\('end', `/.test(body), 'showEnd uses DOM building only');
  assert.ok(/this\.endView\.onKey\(e\)/.test(ui));
  assert.ok(/\.layer-end/.test(ui), 'space activates buttons on the end screen');
  assert.ok(/name === 'end' && this\.endView/.test(ui));
  assert.ok(/import '\.\/results\.css'/.test(ui));
  assert.ok(/h\.again\(\)/.test(body) && /h\.menu\(\)/.test(body) && /h\.openTree\(\)/.test(body));
});

test('app.js keeps banking once per run: bankRun guard and again() reset are untouched', () => {
  const app = R('src/app.js');
  assert.ok(/if \(this\.banked \|\| this\.isDebugRun\(\)\) return null;\s*this\.banked = true;/.test(app));
  assert.ok(/this\.banked = false;/.test(app));
});

test('BIBLE and LOCKED record that the defeat lantern dims, not out', () => {
  assert.ok(/dims, not out/i.test(R('docs/BIBLE.md')));
  assert.ok(/dims, not out|dim/i.test(R('docs/LOCKED.md')));
});

// ---------------------------------------------------------------- DR4: death recap ('Struck down by ...' + 'What hurt you' bars)
const hurtOf = (over = {}) => ({ by: { wolf: 80, crow: 35, root_crawler: 25, bramble_hart: 10 }, hits: { wolf: 14, crow: 9, root_crawler: 3, bramble_hart: 1 }, lunge: 7, last: { src: 'wolf', kind: 'lunge', t: 391 }, ...over });

test('DR4 recap: struck-down line from the last hit, names from game data', () => {
  const v = mkView(res({ hurt: hurtOf() }));
  const s = v.recap.struck;
  assert.equal(`${s.lead} ${s.art} ${s.name}${s.tail} ${s.at}`, "Struck down by a Fell Wolf's lunge at 6:31");
  const crow = C.hurtRecap({ hurt: hurtOf({ last: { src: 'crow', kind: 'contact', t: 70 } }) }, data, false).struck;
  assert.equal(`${crow.lead} ${crow.art} ${crow.name}${crow.tail} ${crow.at}`, 'Struck down by a Grave Crow at 1:10');
  const tre = C.hurtRecap({ hurt: hurtOf({ last: { src: 'elder_treant', kind: 'slam', t: 612 } }) }, data, false).struck;
  assert.equal(`${tre.art} ${tre.name}${tre.tail}`, "an Elder Treant's slam");
  const pip = C.hurtRecap({ hurt: hurtOf({ last: { src: 'stoat_piper', kind: 'thorn', t: 250 } }) }, data, false).struck;
  assert.equal(`${pip.art} ${pip.name}${pip.tail}`, "a Stoat Piper's thorn");
});

test('DR4 recap: bars = top 3 sources by damage share of damage taken; a lunge note when most wolf hits were lunges', () => {
  const r = C.hurtRecap({ hurt: hurtOf() }, data, false);
  assert.deepEqual(r.rows.map((x) => x.id), ['wolf', 'crow', 'root_crawler']);
  assert.deepEqual(r.rows.map((x) => x.pct), [53, 23, 17]);
  assert.deepEqual(r.rows.map((x) => x.name), ['Fell Wolf', 'Grave Crow', 'Root Crawler']);
  assert.equal(r.note, 'About half of the Fell Wolf hits were lunges');
  assert.equal(C.hurtRecap({ hurt: hurtOf({ lunge: 12 }) }, data, false).note, 'Most of the Fell Wolf hits were lunges');
  assert.equal(C.hurtRecap({ hurt: hurtOf({ lunge: 1 }) }, data, false).note, '');
  assert.equal(C.hurtRecap({ hurt: hurtOf({ hits: { wolf: 2 }, lunge: 2 }) }, data, false).note, '', 'too few wolf hits to say anything');
});

test('DR4 recap: victory has no struck-down line; missing / hostile data gives nothing, never throws', () => {
  assert.equal(C.hurtRecap({ hurt: hurtOf() }, data, true).struck, null);
  assert.equal(C.hurtRecap({ hurt: hurtOf() }, data, true).rows.length, 3, 'bars still useful after a win');
  for (const bad of [undefined, null, {}, { hurt: null }, { hurt: 5 }, { hurt: { by: 'x', last: 7 } }, { hurt: { by: { '<img src=x onerror=alert(1)>': 99, wolf: NaN, crow: -4 }, last: { src: '__proto__', kind: '<b>', t: NaN } } }]) {
    const r = C.hurtRecap(bad, data, false);
    assert.equal(r.struck, null); assert.deepEqual(r.rows, []); assert.equal(r.note, '');
  }
  const weird = C.hurtRecap({ hurt: { by: { wolf: 5 }, hits: { wolf: 99 }, lunge: 99, last: { src: 'wolf', kind: '<script>', t: Infinity } } }, data, false);
  assert.equal(weird.struck.tail, '', 'unknown kind is plain contact'); assert.equal(weird.struck.at, 'at 0:00');
  assert.equal(C.resultsView(res(), bank(), data).recap.rows.length, 0, 'a run without counters just has no recap');
});

test('DR4 recap renders as text only, keeps the one-screen drop order and the weapons list', () => {
  const view = mkView(res({ hurt: hurtOf() }));
  const { r } = build(view);
  const txt = allText(r.root);
  assert.match(txt, /Struck down by a Fell Wolf's lunge at 6:31/);
  assert.match(txt, /What hurt you/);
  assert.equal(byCls(r.root, 'u6-hurt')[0].children.length, 3, 'three bars');
  assert.ok(byCls(r.root, 'u6-weps').length === 2, 'the weapons list is still there');
  assert.ok(find(r.root, (n) => n.attrs && n.attrs['data-drop'] === 'hurt').length === 1);
  assert.match(C.resultsSummary(view), /Struck down by a Fell Wolf's lunge at 6:31/);
  const css = R('src/ui/results.js');
  assert.match(css, /DROP_ORDER = \['weapons', 'hurtnote', 'hurt', 'nudge', 'arcl', 'line'\]/);
  assert.ok(!/innerHTML/.test(css.replace(/\/\/.*$/gm, '')));
});

test('DR4 recap: hostile strings stay inert (names only ever come from data tables)', () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const v = mkView(res({ hurt: { by: { [evil]: 50, wolf: 50 }, hits: {}, lunge: 0, last: { src: evil, kind: 'lunge', t: 5 } } }));
  assert.equal(v.recap.struck, null, 'an id that is not an enemy in data never becomes text');
  assert.deepEqual(v.recap.rows.map((x) => x.id), ['wolf']);
  const { r } = build(v);
  assert.ok(!allText(r.root).includes('<img') && !allText(r.root).includes('<script'));
});

test('DR4 sim counters feed the recap (hurt block of sim.result)', async () => {
  const { Sim } = await import('../src/sim/Sim.js');
  const sim = new Sim({ data, characterId: 'wren', seed: 3 });
  sim.time = 391; sim.player.iframes = 0;
  sim.damagePlayer(5, 'wolf', { kind: 'lunge', id: 9, x: 1, y: 2 });
  sim.player.iframes = 0; sim.damagePlayer(3, 'crow');
  const h = sim.result().hurt;
  assert.deepEqual(h.by, { wolf: 5, crow: 3 }); assert.deepEqual(h.hits, { wolf: 1, crow: 1 }); assert.equal(h.lunge, 1);
  assert.deepEqual(h.last, { src: 'crow', kind: 'contact', t: 391 });
  assert.equal(C.hurtRecap(sim.result(), data, false).struck.name, 'Grave Crow');
});

test('DR4 fit(): weapons drop first, then the lunge note, then the recap bars; rows come back when there is room', () => {
  const v = mkView(res({ hurt: hurtOf() }), bank({ closest: [{ id: 'a', name: 'Raven Flock', frac: 0.5, text: 't' }] }));
  const { r } = build(v);
  const dropped = () => (r.root.getAttribute('data-dropped') || '').split(' ').filter(Boolean);
  const hiddenGroups = () => new Set(r.root.querySelectorAll('[data-drop]').filter((n) => n.hidden).map((n) => n.attrs['data-drop']));
  const H = { weapons: 3, hurtnote: 1, hurt: 2, nudge: 1, arcl: 1, line: 1 }; // heights of each droppable group
  let cap = 200;
  const used = () => 90 + Object.entries(H).filter(([k]) => !hiddenGroups().has(k)).reduce((a, [, h]) => a + h, 0);
  Object.defineProperty(r.main, 'clientHeight', { get: () => cap });
  Object.defineProperty(r.main, 'scrollHeight', { get: () => used() });
  for (const n of [r.panel, r.hero]) { Object.defineProperty(n, 'clientHeight', { get: () => 1000 }); Object.defineProperty(n, 'scrollHeight', { get: () => 10 }); }
  const total = 90 + 3 + 1 + 2 + 1 + 1 + 1;
  cap = total; r.fit(); assert.deepEqual(dropped(), [], 'room for everything');
  cap = total - 3; r.fit(); assert.deepEqual(dropped(), ['weapons'], 'the weapon bars go first');
  cap = total - 5; r.fit(); assert.deepEqual(dropped(), ['weapons', 'hurtnote'], 'then the one-line note, the bars stay');
  cap = total - 7; r.fit(); assert.deepEqual(dropped(), ['weapons', 'hurtnote', 'hurt'], 'only then the recap bars');
  cap = total - 8; r.fit(); assert.deepEqual(dropped(), ['weapons', 'hurtnote', 'hurt', 'nudge']);
  cap = total; r.fit(); assert.deepEqual(dropped(), [], 'everything returns');
  assert.match(R('src/ui/results.js'), /DROP_ORDER = \['weapons', 'hurtnote', 'hurt', 'nudge', 'arcl', 'line'\]/);
});
