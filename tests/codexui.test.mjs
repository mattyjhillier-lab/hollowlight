// CX2-CX5 Almanac screen + celebration cards + results ledger on a fake DOM: textContent only (innerHTML throws), hostile strings inert,
// keyboard (1-4, Tab, arrows, Esc), NEW dots read once, accessible names, 44 px targets in CSS, Calm, queue order, skip rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef } from './helpers.mjs';
import { defaultSave, sanitize } from '../src/save/schema.js';

function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, offsetTop: 0, isConnected: true,
    style: { setProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, removeAttribute(k) { delete this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); },
    insertBefore(c, ref) { const i = this.children.indexOf(ref); if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; },
    replaceChildren(...cs) { this.children = [...cs]; this._text = ''; },
    get firstChild() { return this.children[0] || null; }, get lastChild() { return this.children[this.children.length - 1] || null; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    focus() { globalThis.document.activeElement = n; n.fire('focus'); }, click() { n.fire('click'); } };
  n.classList = { add: (...c) => c.forEach((x) => n._cls.add(x)), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c), toggle: (c, on) => { const v = on === undefined ? !n._cls.has(c) : !!on; if (v) n._cls.add(c); else n._cls.delete(c); return v; } };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  Object.defineProperty(n, 'outerHTML', { set() { throw new Error('outerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };
const { buildAlmanac } = await import('../src/ui/codexui.js');
const { buildCelebration, MIN_SHOW_MS } = await import('../src/ui/celebrateui.js');
const { almanac } = await import('../src/meta/codex.js');
const { buildResults } = await import('../src/ui/results.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (root, pred) => { let out = null; walk(root, (n) => { if (!out && pred(n)) out = n; }); return out; };
const all = (root, pred) => { const out = []; walk(root, (n) => { if (pred(n)) out.push(n); }); return out; };
const key = (k, extra = {}) => ({ key: k, preventDefault() {}, ...extra });

const save = (stats) => sanitize({ ...defaultSave(1), stats: { ...defaultSave(1).stats, ...stats } });

test('CX2 Almanac: four tabs with counts, NEW dots, opens on the newest page, read marks reported once', () => {
  const book = almanac(save({ killsByEnemy: { wolf: 2318, crow: 5 }, evolved: { howling_legion: 1 }, charsUsed: { wren: 2 }, runs: 2 }), data, treeDef);
  const reads = [];
  const v = buildAlmanac({ book, onRead: (k) => reads.push(...k), onBack: () => {} });
  const tabs = all(v.root, (n) => n.getAttribute && n.getAttribute('role') === 'tab');
  assert.equal(tabs.length, 4);
  assert.ok(tabs[0].textContent.includes('Foes') && tabs[0].textContent.includes('2 / 11'));
  assert.equal(v.current(), 'foes');
  assert.ok(reads.includes('f:wolf') && reads.includes('fp:wolf:habits'), 'the first known foe was opened and read');
  const n1 = reads.length;
  v.onKey(key('2'));
  assert.equal(v.current(), 'spirits');
  assert.ok(reads.includes('e:howling_legion'));
  v.onKey(key('1'));
  assert.equal(reads.filter((k) => k === 'f:wolf').length, 1, 'read once');
  assert.ok(reads.length >= n1);
  // the entry shows the staged pages: open text, the next page with progress, the sealed one
  find(v.list, (n) => n.getAttribute && /^Fell Wolf/.test(n.getAttribute('aria-label') || '')).click();
  const txt = v.entry.textContent;
  assert.ok(txt.includes('Fell Wolf') && txt.includes('Hunts in twos') && txt.includes('Next page at 4,000 slain (2,318)') && txt.includes('Sealed until 12,000 slain'));
  // unknown foes: silhouette + ?????, accessible name says unknown, no name leaks
  const unk = all(v.list, (n) => n.classList && n.classList.contains('is-unk'));
  assert.ok(unk.length > 0);
  for (const u of unk) { assert.match(u.getAttribute('aria-label'), /^(Unknown foe|Hollow marks, not met)/); assert.ok(!/Stoat|Toad|Hart/.test(u.textContent)); }
});

test('CX2 keyboard: Tab on an item switches page, arrows move, Esc closes (back one step)', () => {
  const book = almanac(save({ killsByEnemy: { wolf: 10, crow: 10 } }), data, treeDef);
  let back = 0;
  const v = buildAlmanac({ book, onBack: () => back++ });
  v.focusFirst();
  assert.equal(v.onKey(key('Tab')), true);
  assert.equal(v.current(), 'spirits');
  v.focusFirst();
  v.onKey(key('Tab', { shiftKey: true }));
  assert.equal(v.current(), 'foes');
  v.focusFirst();
  const before = globalThis.document.activeElement;
  v.onKey(key('ArrowRight'));
  assert.notEqual(globalThis.document.activeElement, before);
  v.onKey(key('Escape'));
  assert.equal(back, 1);
});

test('CX2 hostile strings stay text; pause = read only (no title picker); recipe hidden until found', () => {
  const book = almanac(save({ killsByEnemy: { wolf: 1 } }), data, treeDef);
  book.foes[0].name = '<img src=x onerror=alert(1)>';
  book.foes[0].line = '<script>bad()</script>';
  const v = buildAlmanac({ book, from: 'pause', titles: { got: ['friend_wolves'], pick: 'friend_wolves' } });
  assert.ok(v.root.textContent.includes('<img src=x onerror=alert(1)>'));
  assert.equal(v.titleBtn, null);
  assert.ok(v.root.textContent.includes('Read only while the night waits'));
  v.onKey(key('2'));
  assert.ok(!/Recipe:/.test(v.root.textContent), 'no recipe before the first take');
  const css = readFileSync(new URL('../src/ui/codex.css', import.meta.url), 'utf8');
  assert.match(css, /\.cx-btn \{[^}]*min-height: 44px/);
  assert.match(css, /\.cx-tab \{[^}]*min-height: 44px/);
  assert.match(css, /orientation: portrait/);
  assert.match(css, /lg-calm/);
});

test('CX6 title picker cycles earned titles only', () => {
  const book = almanac(save({}), data, treeDef);
  const picks = [];
  const v = buildAlmanac({ book, titles: { got: ['friend_wolves', 'keeper_foes'], pick: 'friend_wolves' }, onPickTitle: (t) => picks.push(t) });
  assert.match(v.titleBtn.textContent, /Friend of Wolves/);
  v.titleBtn.click(); v.titleBtn.click();
  assert.deepEqual(picks, ['keeper_foes', 'friend_wolves']);
});

test('CX4/CX5 celebration cards: order kept, cue per card, any key next, Esc skips all, held keys ignored, live region, Calm class', () => {
  let t = 0;
  const timers = { setTimeout: () => 1, clearTimeout: () => {} };
  const cues = [];
  let done = 0;
  const items = [
    { size: 'big', kind: 'whole', title: 'The Ghost Wolves are whole', line: 'x', pills: ['Title: Friend of Wolves'], weapon: 'ghost_wolves', cue: 'tree_whole', sr: 'The Hollow remembers: whole' },
    { size: 'medium', kind: 'evo', title: '<b>Lightfoot</b>', line: 'y', sub: 'Recipe: a + b', weapon: 'ghost_wolves', gold: true, cue: 'evo_phantom_stampede' },
    { size: 'medium', kind: 'evo', title: 'Howling Legion', cue: 'evo_howling_legion' },
  ];
  const c = buildCelebration(items, { calm: true, sound: (id) => cues.push(id), onDone: () => done++, now: () => t, timers });
  assert.ok(c.root.classList.contains('lg-calm'));
  c.start();
  assert.deepEqual(cues, ['tree_whole']);
  assert.ok(c.root.textContent.includes('The Hollow remembers'));
  assert.equal(find(c.root, (n) => n.getAttribute && n.getAttribute('role') === 'status').textContent, 'The Hollow remembers: whole');
  c.onKey(key('x')); // too soon: a key held from the run
  assert.equal(c.index(), 0);
  t += MIN_SHOW_MS + 1;
  c.onKey(key('x'));
  assert.equal(c.index(), 1);
  assert.ok(c.root.textContent.includes('<b>Lightfoot</b>'));
  assert.deepEqual(cues, ['tree_whole', 'evo_phantom_stampede']);
  t += MIN_SHOW_MS + 1;
  c.onKey(key('Escape'));
  assert.equal(c.isDone(), true);
  assert.equal(done, 1);
  assert.equal(cues.length, 2, 'skipped cards play no sound');
});

test('CX4 results: ledger line + Almanac link (J), hostile names inert, link only when supplied', () => {
  const view = { won: false, kicker: 'k', title: 't', line: 'l', time: '1:00', timeLabel: 'x', near: [], arc: { frac: 0.1, boss: null, dawnLabel: 'Dawn' }, chips: { level: 1, slain: 2, evolved: 0 }, bank: { gold: 1, shards: 0 }, weapons: [], recap: null, nudge: null };
  let opened = 0;
  const r = buildResults({ view, reduced: true, ledger: { lead: 'The Hollow remembers: ', names: '<i>x</i>, Fell Wolf', more: '+3 more in the Almanac' }, onAlmanac: () => opened++, now: () => 1e6 });
  assert.ok(r.root.textContent.includes('<i>x</i>, Fell Wolf') && r.root.textContent.includes('+3 more in the Almanac'));
  r.setShownAt(0);
  r.onKey(key('j'));
  assert.equal(opened, 1);
  const r2 = buildResults({ view, reduced: true });
  assert.equal(r2.almanac, null);
});
