// FD2/FD3 front door: title lantern chip / purses / Continue whisper / tree dot / New game, and the "Whose lantern?" screen.
// Pure helpers (lanterncopy.js), DOM built with textContent only (fake DOM whose innerHTML throws), hostile names, read-only peek, hold-to-confirm.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef } from './helpers.mjs';
import { defaultSave, serializeSave } from '../src/save/schema.js';
import { Lanterns, lanternKeys, INDEX_KEY } from '../src/save/lanterns.js';
import * as C from '../src/ui/lanterncopy.js';

function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, disabled: false, value: '', style: { setProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, removeAttribute(k) { delete this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    focus() { globalThis.document.activeElement = n; }, click() { n.fire('click', { detail: 1 }); }, select() {} };
  n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  Object.defineProperty(n, 'outerHTML', { set() { throw new Error('outerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
const { buildTitle } = await import('../src/ui/title.js');
const { buildLanternScreen, buildChip, buildPurses } = await import('../src/ui/lanternsui.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };
const texts = (r) => { const o = []; walk(r, (n) => { if (n._text) o.push(n._text); }); return o.join(' | '); };
const byText = (r, t) => find(r, (n) => n.tag === 'button' && n.textContent.includes(t));

function mem() { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => m.delete(k) }; }
const save = (patch = {}) => Object.assign(defaultSave(), patch);
const HOSTILE = '<img src=x onerror=alert(1)>';

test('fmt / lastLit / exportFileName are bounded and plain', () => {
  assert.equal(C.fmt(2410), '2,410'); assert.equal(C.fmt(-5), '0'); assert.equal(C.fmt('x'), '0'); assert.equal(C.fmt(1234567), '1,234,567');
  const now = Date.UTC(2026, 9, 23, 12);
  assert.equal(C.lastLit(now - 1000, now), 'today');
  assert.equal(C.lastLit(now - 2 * 864e5, now), '2 days ago');
  assert.equal(C.lastLit(now + 9e9, now), 'today');
  assert.equal(C.lastLit('nope', now), 'never');
  assert.equal(C.exportFileName("Sam O'Neil"), 'wispwick-sam-o-neil.json');
  assert.equal(C.exportFileName(HOSTILE), 'wispwick-img-src-x-onerror-alert.json');
  assert.equal(C.exportFileName('../../'), 'wispwick-lantern.json');
});

test('most played hero: only real heroes, hostile counts ignored', () => {
  assert.equal(C.mostPlayedHero({ charsUsed: { wren: 3, elias: 9 } }, data), 'elias');
  assert.equal(C.mostPlayedHero({ charsUsed: { __proto__: { wren: 99 }, ghost: 50, wren: 'x' } }, data), null);
  assert.equal(C.mostPlayedHero(null, data), null);
});

test('Dawnglass purse hidden until Deep Dusk is seen; purses clamp', () => {
  assert.equal(C.showGlass(save()), false);
  assert.deepEqual(C.purses(save({ gold: 12, shards: 3 })), { gold: 12, shards: 3, glass: null });
  assert.equal(C.showGlass(save({ dawnglass: 2 })), true);
  assert.equal(C.showGlass(save(), ['cursed_forest:hard']), true);
  assert.equal(C.showGlass(save(), ['cursed_forest:normal']), false);
  const s = save(); s.stats.wins = 1; assert.equal(C.showGlass(s), true);
  assert.equal(C.purses(save({ gold: -4, shards: NaN })).gold, 0);
});

test('Continue whisper: hero + the night the next run starts on (Twilight until the map screen exists)', () => {
  const s = save();
  assert.deepEqual(C.nextNight(s, data, ['cursed_forest:hard']), { id: 'normal', name: 'Twilight' });
  assert.equal(C.nextNight(s, data, ['cursed_forest:hard'], ['normal', 'hard']).name, 'Twilight');
  s.stats.tiers = { cursed_forest: { normal: { runs: 3, clears: 1, best: { t: 0, kills: 0, level: 0 }, stars: 1, heroes: {} } } };
  assert.equal(C.nextNight(s, data, ['cursed_forest:hard'], ['normal', 'hard']).name, 'Deep Dusk');
  assert.equal(C.continueWhisper('Wren', { name: 'Twilight' }), 'Wren · Twilight is waiting');
  assert.equal(C.continueWhisper('', null), 'Twilight is waiting');
});

test('tree dot: on only when a buyable lantern is affordable', () => {
  assert.equal(C.treeAffordable(treeDef, save(), data), false);
  assert.equal(C.treeAffordable(treeDef, save({ gold: 1e9, shards: 1e6 }), data), true);
  assert.equal(C.treeAffordable(null, save(), data), false);
});

test('night rows: Twilight always, harder nights once opened or played; stars from bits', () => {
  const s = save();
  assert.deepEqual(C.nightRows(s, data).map((r) => r.id), ['normal']);
  s.stats.tiers = { cursed_forest: { normal: { runs: 1, clears: 1, best: { t: 0, kills: 0, level: 0 }, stars: 5, heroes: {} } } };
  const r = C.nightRows(s, data, ['cursed_forest:hard']);
  assert.deepEqual(r.map((x) => [x.id, x.stars, x.played]), [['normal', 2, true], ['hard', 0, false]]);
});

test('lantern summary + label: names and lines are text; empty / newer / damaged saves', () => {
  const s = save({ gold: 2410, shards: 6 }); s.stats.runs = 14; s.stats.charsUsed = { wren: 5 };
  const sum = C.lanternSummary({ id: 'l1', name: 'Matt' }, { status: 'ok', save: s, text: 't' }, data, [], s.updatedAt);
  assert.equal(sum.hero, 'wren');
  assert.deepEqual(sum.lines, ['14 nights · last lit today', '2,410 gold · 6 shards']);
  assert.match(C.lightLabel({ ...sum, active: true }), /^Light it \(current\): Matt\. 14 nights/);
  assert.deepEqual(C.lanternSummary({ id: 'l2', name: 'X' }, { status: 'empty', save: null, text: null }, data).lines, ['Not lit yet']);
  assert.equal(C.lanternSummary({ id: 'l2', name: 'X' }, { status: 'newer', save: null, text: '{}' }, data).lines[0], 'From a newer version');
  assert.equal(C.lanternSummary({ id: 'l2', name: 'X' }, { status: 'damaged', save: null, text: '{' }, data).canExport, true);
});

test('hold-to-confirm: needs 1.5 s held, or two activations within 5 s', () => {
  const h = C.holdState();
  h.press(0); assert.equal(h.tick(1000), false); h.release(); assert.equal(h.progress(1200), 0);
  h.press(2000); assert.equal(h.tick(3499), false); assert.equal(h.tick(3500), true); assert.equal(h.done, true);
  const a = C.holdState();
  assert.equal(a.activate(0), false); assert.equal(a.armed, true); assert.equal(a.activate(6000), false); assert.equal(a.activate(7000), true);
});

test('peek is read-only: never writes, even for damaged or newer saves', () => {
  const st = mem();
  const L = new Lanterns(st).init();
  L.create('Sam');
  const k = lanternKeys('l2');
  const before = () => JSON.stringify([...st.m.entries()]);
  assert.equal(L.peek('l2').status, 'empty');
  st.setItem(k.save, '{broken');
  let snap = before(); assert.equal(L.peek('l2').status, 'damaged'); assert.equal(before(), snap);
  st.setItem(k.save, JSON.stringify({ ...serializeSave(save()), version: 999 }));
  snap = before(); assert.equal(L.peek('l2').status, 'newer'); assert.equal(before(), snap);
  st.setItem(k.save, JSON.stringify(serializeSave(save({ gold: 77 }))));
  assert.equal(L.peek('l2').save.gold, 77);
  assert.equal(L.peek('l3'), null);
  assert.ok(st.getItem(INDEX_KEY));
});

test('title (FD2): chip, purses, Continue whisper, tree dot, New game; menu order stays Continue, Tree, Settings, New game, then chip', () => {
  const calls = [];
  const t = buildTitle({ hasProgress: true, lantern: { id: 'l1', name: HOSTILE }, purses: { gold: 2410, shards: 6, glass: null }, whisper: 'Wren · Twilight is waiting', treeDot: true,
    newGame: { free: 2 }, treeLine: '2,410 gold · 6 shards', onSwitch: () => calls.push('sw'), onNew: () => calls.push('new') });
  const btns = find(t.root, (n) => n.tag === 'button');
  assert.deepEqual(btns.map((b) => b.textContent.slice(0, 8)), ['Continue', 'Skill Tr', 'Settings', 'New game', HOSTILE.slice(0, 8)]);
  const s = texts(t.root);
  for (const w of ['Wren · Twilight is waiting', '2,410 gold · 6 shards', 'Light a new lantern · 2 of 3 free', '2,410', 'Switch lantern', 'something can be bought']) assert.ok(s.includes(w), w);
  assert.equal(find(t.root, (n) => n._cls.has('fd-coin--glass')).length, 0);
  assert.equal(find(t.root, (n) => n._cls.has('fd-dot')).length, 1);
  assert.equal(t.chip.getAttribute('aria-label'), `${HOSTILE}. Switch lantern`);
  t.chip.click(); t.newGame.click();
  assert.deepEqual(calls, ['sw', 'new']);
  const t2 = buildTitle({ hasProgress: false, lantern: { id: 'l1', name: 'Lantern 1' }, purses: { gold: 0, shards: 0, glass: 4 } });
  assert.equal(t2.newGame, null);
  assert.ok(texts(t2.root).includes('Begin'));
  assert.equal(find(t2.root, (n) => n._cls.has('fd-coin--glass')).length, 1);
  assert.equal(find(buildPurses({ gold: 1, shards: 2 }), (n) => n.attrs.role === 'img').map((n) => n.attrs['aria-label']).join(','), '1 gold,2 soul shards');
  assert.equal(buildChip({ id: 'evil', name: 'A' }).getAttribute('type'), 'button');
});

const cardsOf = () => [
  { id: 'l1', name: HOSTILE, hero: 'wren', lines: ['14 nights · last lit today'], nights: [{ id: 'normal', name: 'Twilight', stars: 2, open: true, played: true }], status: 'ok', canExport: true, active: true },
  { id: 'l2', name: 'Sam', hero: null, lines: ['Not lit yet'], nights: [], status: 'empty', canExport: false, active: false },
];

test('"Whose lantern?" (FD3): cards, Light it, More menu, rename, export, empty slot; hostile names stay text', () => {
  const calls = [];
  const v = buildLanternScreen({ cards: cardsOf(), canCreate: true, portraits: { wren: 'w.webp' },
    onLight: (id) => calls.push(`light:${id}`), onRename: (id, n) => { calls.push(`ren:${id}:${n}`); return { ok: false, error: 'Use letters' }; },
    onExport: (id) => calls.push(`exp:${id}`), onCreate: (n) => { calls.push(`new:${n}`); return { ok: true }; }, onBack: () => calls.push('back') });
  const s = texts(v.root);
  for (const w of ['Whose lantern tonight?', HOSTILE, 'Sam', 'New lantern', 'Lanterns live in this browser only', 'Current']) assert.ok(s.includes(w), w);
  assert.equal(find(v.root, (n) => n.tag === 'li').length, 3);
  assert.equal(find(v.root, (n) => n.tag === 'h2' && n._text === HOSTILE).length, 1);
  const lights = find(v.root, (n) => n._cls.has('fd-light'));
  assert.match(lights[0].getAttribute('aria-label'), /^Light it \(current\): </);
  lights[1].click();
  const more = find(v.root, (n) => n._cls.has('fd-more'));
  assert.equal(more.length, 2);
  more[1].click();
  assert.equal(more[1].getAttribute('aria-expanded'), 'true');
  assert.equal(byText(v.root, 'Export').find((b) => b.textContent === 'Export').disabled, true); // empty lantern: nothing to export
  byText(v.root, 'Rename')[0].click();
  const input = find(v.root, (n) => n.tag === 'input')[0];
  assert.equal(input.getAttribute('maxlength'), '16');
  input.value = 'Sam!';
  input.fire('keydown', { key: 'Enter' });
  assert.ok(texts(v.root).includes('Use letters'));
  v.onKey({ key: 'Escape', preventDefault() {} }); // closes the open form, not the screen
  assert.ok(!calls.includes('back'));
  v.onKey({ key: 'Escape', preventDefault() {} });
  more[0].click(); byText(v.root, 'Export').find((b) => b.textContent === 'Export').click();
  find(v.root, (n) => n._cls.has('fd-new'))[0].click();
  const nin = find(v.root, (n) => n.tag === 'input').pop();
  nin.value = 'Pip'; nin.fire('keydown', { key: 'Enter' });
  assert.deepEqual(calls, ['light:l2', 'ren:l2:Sam!', 'back', 'exp:l1', 'new:Pip']);
});

test('delete needs the hold (or two activations); replace mode has no empty slot and relights through the hold', () => {
  const calls = [];
  const v = buildLanternScreen({ cards: cardsOf(), canCreate: true, onDelete: (id) => { calls.push(`del:${id}`); return { ok: true }; } });
  find(v.root, (n) => n._cls.has('fd-more'))[0].click();
  byText(v.root, 'Delete')[0].click();
  const hold = find(v.root, (n) => n._cls.has('fd-hold'))[0];
  assert.match(hold.getAttribute('aria-label'), /Hold to put out/);
  assert.ok(texts(v.root).includes('Export first'));
  hold.click(); // a pointer click (detail 1) is not a hold
  hold.fire('click', { detail: 0 }); // first AT activation arms
  assert.deepEqual(calls, []);
  hold.fire('click', { detail: 0 });
  assert.deepEqual(calls, ['del:l1']);
  const r = buildLanternScreen({ mode: 'replace', cards: cardsOf(), canCreate: false, onReplace: (id, n) => { calls.push(`rep:${id}:${n}`); return { ok: true }; } });
  assert.ok(texts(r.root).includes('All three lanterns are lit'));
  assert.equal(find(r.root, (n) => n._cls.has('fd-new')).length, 0);
  assert.equal(find(r.root, (n) => n._cls.has('fd-more')).length, 0);
  find(r.root, (n) => n._cls.has('fd-light'))[1].click();
  const rin = find(r.root, (n) => n.tag === 'input')[0]; rin.value = 'Bo';
  const rh = find(r.root, (n) => n._cls.has('fd-hold'))[0];
  rh.fire('click', { detail: 0 }); rh.fire('click', { detail: 0 });
  assert.deepEqual(calls.slice(-1), ['rep:l2:Bo']);
  const locked = buildLanternScreen({ cards: cardsOf(), locked: true, note: 'newer' });
  find(locked.root, (n) => n._cls.has('fd-more'))[0].click();
  assert.equal(byText(locked.root, 'Delete')[0].disabled, true);
  assert.equal(byText(locked.root, 'Rename')[0].disabled, true);
});

test('FD sources: no innerHTML / outerHTML / insertAdjacentHTML / document.write', () => {
  for (const f of ['src/ui/lanternsui.js', 'src/ui/lanterncopy.js', 'src/ui/title.js', 'src/save/lanterns.js']) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); // code only
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src), f);
  }
  const ui = readFileSync(new URL('../src/ui/ui.js', import.meta.url), 'utf8');
  assert.ok(!/innerHTML/.test(ui.slice(ui.indexOf('showLanterns('), ui.indexOf('showHeroSelect() {'))));
});
