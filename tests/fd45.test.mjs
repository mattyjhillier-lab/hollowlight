// FD4 (map + night select) and FD5 (results night badge / Dawnglass / first dawn / stars / kept line).
// Pure model (nightcopy.js, resultscopy.nightBlock), the night note in the save (hostile input), and the DOM built with textContent only
// (fake DOM whose innerHTML throws), keyboard + radiogroup semantics.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef } from './helpers.mjs';
import { defaultSave, sanitize, setTreeDef } from '../src/save/schema.js';
import { recordTierRun } from '../src/save/tiers.js';
import * as N from '../src/ui/nightcopy.js';
import { nightBlock, resultsView, resultsSummary } from '../src/ui/resultscopy.js';

function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, disabled: false, value: '', style: { setProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, removeAttribute(k) { delete this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    focus() { globalThis.document.activeElement = n; }, click() { n.fire('click', { detail: 1 }); },
    querySelector(sel) { const c = sel.replace(/^\./, ''); let hit = null; const w = (x) => { if (hit) return; if (x._cls && x._cls.has(c)) hit = x; else (x.children || []).forEach(w); }; (n.children || []).forEach(w); return hit; },
    closest() { return null; } };
  n.classList = { add: (...c) => c.forEach((x) => n._cls.add(x)), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c), toggle() {} };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  Object.defineProperty(n, 'outerHTML', { set() { throw new Error('outerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
const { buildNightSelect } = await import('../src/ui/nightsui.js');
const { buildResults } = await import('../src/ui/results.js');
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const find = (root, pred) => { let hit = null; walk(root, (n) => { if (!hit && pred(n)) hit = n; }); return hit; };
const all = (root, pred) => { const out = []; walk(root, (n) => { if (pred(n)) out.push(n); }); return out; };
const key = (k) => ({ key: k, preventDefault() {} });

setTreeDef(treeDef, data);
const CID = 'cursed_forest';
const HARD = [`${CID}:hard`];
const withTiers = (tiers, extra = {}) => { const s = defaultSave(); s.stats.tiers = { [CID]: tiers }; return Object.assign(s, extra); };
const rec = (runs, clears, stars = 0, heroes = {}) => ({ runs, clears, best: { t: 600, kills: 400, level: 15 }, stars, heroes });

test('skip rule: no night screen until there is a night choice (Night Gate inert today = never on the live tree)', () => {
  assert.equal(N.hasNightChoice(defaultSave(), data, treeDef, []), false, 'fresh');
  assert.equal(N.hasNightChoice(withTiers({ normal: rec(5, 2, 1) }), data, treeDef, []), false, 'Twilight cleared but the gate lantern is not live');
  assert.equal(N.hasNightChoice(defaultSave(), data, treeDef, HARD), true, 'Deep Dusk opened');
  assert.equal(N.defaultNight(defaultSave(), data, treeDef, []), 'normal');
});

test('chip states: open (cleared x, stars), NEW until seen, locked with real progress, gate ready -> jump to its lantern', () => {
  const s = withTiers({ normal: rec(12, 2, 3) });
  const tw = N.chipState(s, data, treeDef, HARD, CID, 'normal');
  assert.deepEqual([tw.state, tw.cleared, tw.stars, tw.line, tw.isNew], ['open', 2, 2, 'cleared 2x', false]);
  const dd = N.chipState(s, data, treeDef, HARD, CID, 'hard');
  assert.deepEqual([dd.state, dd.isNew, dd.line], ['open', true, 'Recommended next']);
  N.rememberNight(s, CID, 'hard', ['normal', 'hard']);
  assert.equal(N.chipState(s, data, treeDef, HARD, CID, 'hard').isNew, false, 'NEW shows once');
  const ln = N.chipState(s, data, treeDef, HARD, CID, 'expert');
  assert.deepEqual([ln.state, ln.line, ln.progress], ['locked', 'Clear Cursed Forest on Deep Dusk', { cur: 0, goal: 1 }]); // the live Night Gate lantern's own condition
  // a live gate lantern (stub tree + status): condition met -> 'gate'; unmet -> locked with the condition's own progress
  const def = { list: ['g1'], nodes: { g1: { name: 'Long Night: Cursed Forest', effects: [{ unlock: 'tier', chapter: CID, tier: 'expert' }] } } };
  const ready = N.chipState(s, data, def, HARD, CID, 'expert', () => ({ rank: 0, cond: { done: true, lines: [] } }));
  assert.deepEqual([ready.state, ready.gateId, ready.line], ['gate', 'g1', 'Open it in the Lantern Web']);
  const wait = N.chipState(s, data, def, HARD, CID, 'expert', () => ({ rank: 0, cond: { done: false, lines: [{ text: 'Clear Cursed Forest on Deep Dusk', cur: 0, goal: 1, done: false }] } }));
  assert.deepEqual([wait.state, wait.progress], ['locked', { cur: 0, goal: 1 }]);
  const broken = N.chipState(s, data, def, HARD, CID, 'expert', () => { throw new Error('x'); });
  assert.equal(broken.state, 'locked', 'an unreadable gate never offers a jump');
  const v = N.mapView({ save: s, data, def, openTiers: HARD, heroId: 'wren', heroName: 'Wren', tier: 'expert', closest: [], status: () => ({ rank: 0, cond: { done: true, lines: [] } }) });
  assert.equal(v.canBegin, false, 'Begin is disabled on a gate chip');
  assert.equal(v.side.gate.id, 'g1');
});

test('remembered pick, fresh unlock, first uncleared; forged / unopened tiers never start a run', () => {
  const s = withTiers({ normal: rec(4, 1, 1) });
  assert.equal(N.defaultNight(s, data, treeDef, HARD), 'hard', 'fresh unlock is recommended');
  N.rememberNight(s, CID, 'normal', ['normal', 'hard']);
  assert.equal(N.defaultNight(s, data, treeDef, HARD), 'normal', 'remembered');
  N.rememberNight(s, CID, 'expert');
  assert.equal(N.defaultNight(s, data, treeDef, HARD), 'hard', 'remembered night not open -> first uncleared open night');
  for (const bad of ['expert', 'hard ', '__proto__', null, 7, 'constructor']) assert.equal(N.pickRunTier(bad, HARD, CID), 'normal', String(bad));
  assert.equal(N.pickRunTier('hard', HARD, CID), 'hard');
  assert.equal(N.pickRunTier('hard', [], CID), 'normal');
});

test('side card text is the real tier data and promises nothing that is not built (tier boss shards); Hollow marks (DT2) and per-run Dawnglass (boss + dawn) are live', () => {
  const dd = N.changeLines(data, CID, 'hard');
  assert.ok(dd.length <= 4 && dd[0] === 'Foes are a little tougher and hit harder', dd[0]);
  assert.ok(dd.includes('The Elder Treant is stronger'));
  assert.equal(dd[1], 'From 4:00 some foes bear a Hollow mark', 'Hollow marks live since DT2');
  const ln = N.changeLines(data, CID, 'expert');
  assert.ok(ln[0].startsWith('Foes are twice as tough') && ln[1] === 'From 2:30 more foes bear a Hollow mark' && ln.includes('Hearts come more slowly') && ln.length === 4, ln.join(' | '));
  assert.deepEqual(N.changeLines(data, CID, 'normal'), [N.NIGHT.same.normal, N.NIGHT.same.glassNone]);
  const s = defaultSave();
  assert.deepEqual(N.earnPills(s, data, CID, 'hard', 'wren').map((p) => p.text), ['gold x1.5', '7 from the boss', 'boss +2 · dawn +2', 'first dawn +6 · +1 shard']);
  assert.deepEqual(N.earnPills(s, data, CID, 'normal', 'wren').map((p) => p.text), ['gold x1', '5 from the boss']);
  s.stats.tiers = { [CID]: { hard: rec(2, 1, 1, { wren: { clears: 1, first: true } }) } };
  assert.equal(N.earnPills(s, data, CID, 'hard', 'wren').length, 3, 'first dawn already claimed by Wren');
  assert.equal(N.earnPills(s, data, CID, 'hard', 'elias').length, 4, 'Elias still has it waiting');
  assert.ok(N.earnPills(s, data, CID, 'expert', 'wren').some((p) => p.text === 'boss +3 · dawn +4'));
  assert.equal(N.toolsLine(s, treeDef, 'hard'), '', 'no tier tool owned -> no line');
});

test('save: notes.night is sanitised (known chapter + tier ids only); additive, survives a round trip', () => {
  const s = sanitize({ ...defaultSave(), notes: { night: { map: CID, tier: 'hard', seen: ['normal', 'hard', 'hard', 'bogus', '__proto__', 5] } } });
  assert.deepEqual(s.notes.night, { map: CID, tier: 'hard', seen: ['normal', 'hard'] });
  const h = sanitize({ ...defaultSave(), notes: { night: { map: '__proto__', tier: '<img src=x>', seen: 'x' } } });
  assert.deepEqual(h.notes.night, { map: null, tier: null, seen: [] });
  const u = sanitize({ ...defaultSave(), notes: { night: { map: 'chapter_nine', tier: 'expert' } } });
  assert.equal(u.notes.night.map, null, 'unknown chapter dropped');
  assert.equal(sanitize(defaultSave()).notes.night, undefined, 'old saves unchanged');
  assert.deepEqual(N.nightNote(h), { map: null, tier: null, seen: [] });
});

test('night screen DOM: radiogroup with roving tabindex, locked aria-disabled + Begin disabled, keys 1-3 / arrows / Enter / Esc / T, text only', () => {
  const s = withTiers({ normal: rec(12, 2, 3) });
  const hostile = '<img src=x>';
  const viewFor = (tid) => N.mapView({ save: s, data, def: treeDef, openTiers: HARD, heroId: 'wren', heroName: hostile, tier: tid, closest: [{ name: 'Fourth Card', text: 'Clear Deep Dusk: 0/1' }] });
  const calls = [];
  const v = buildNightSelect({ view: viewFor(null), viewFor, purses: { gold: 2410, shards: 6, glass: 4 }, onBegin: (t) => calls.push(['begin', t]), onBack: () => calls.push(['back']), onTree: (g) => calls.push(['tree', g]) });
  const radios = all(v.root, (n) => n.attrs.role === 'radio');
  assert.equal(radios.length, 3);
  assert.equal(find(v.root, (n) => n.attrs.role === 'radiogroup') !== null, true);
  assert.equal(v.current(), 'hard', 'fresh unlock preselected');
  assert.deepEqual(radios.map((r) => r.attrs['aria-checked']), ['false', 'true', 'false']);
  assert.deepEqual(radios.map((r) => r.attrs.tabindex), ['-1', '0', '-1']);
  assert.equal(radios[2].attrs['aria-disabled'], 'true');
  assert.ok(v.root.textContent.includes(hostile), 'hostile name stays literal text');
  assert.ok(v.root.textContent.includes('Begin with <img'), 'begin label is text');
  v.onKey(key('3'));
  assert.equal(v.current(), 'expert');
  assert.equal(v.begin.disabled, true, 'locked night cannot begin');
  v.onKey(key('Enter'));
  assert.deepEqual(calls, [], 'Enter on a locked night does nothing');
  v.onKey(key('ArrowRight'));
  assert.equal(v.current(), 'normal', 'arrows wrap');
  v.onKey(key('Enter'));
  v.onKey(key('t')); v.onKey(key('Escape'));
  assert.deepEqual(calls, [['begin', 'normal'], ['tree', null], ['back']]);
  assert.ok(v.root.textContent.includes('Next light: Fourth Card: Clear Deep Dusk: 0/1'));
});

test('FD5 results: Twilight = badge only; Deep Dusk first dawn = badge, Dawnglass tile, first-dawn line, stars, named Again; death = kept line', () => {
  const r = { outcome: 'victory', time: 900, level: 19, kills: 1904, gold: 1120, shards: 5, bossKilled: true, chapter: CID, character: 'wren', weapons: [] };
  const tw = nightBlock(r, { night: { id: 'normal', name: 'Twilight', choice: false, waiting: [] }, tier: { tier: 'normal', glass: 0, shards: 0, firstDawn: false, stars: 1, goldBonus: 0 } }, 'Wren', true);
  assert.deepEqual([tw.badge, tw.glass, tw.stars, tw.kept, tw.again, tw.goldLine], ['Twilight', null, null, '', '', '']);
  assert.equal(nightBlock(r, { night: { id: 'normal', name: 'Twilight', choice: true }, tier: {} }, 'Wren', true).again, 'Again · Twilight');
  // a real banked Deep Dusk first dawn (recordTierRun pays it), then the view
  const save = defaultSave();
  const t = recordTierRun(save, { ...r, tier: 'hard' }, { data, unlockedTiers: HARD });
  const bank = { gold: save.gold + 1120, shards: save.shards, dawnglass: save.dawnglass, bestTime: 900, newBest: false, newly: [], closest: [], tier: t, runGold: 1120 + t.goldBonus,
    night: { id: 'hard', name: 'Deep Dusk', choice: true, goldMul: 1.5, firstGlass: 6, waiting: ['Wren', 'Elias'] } };
  const v = resultsView(r, bank, data);
  assert.equal(v.night.badge, 'Deep Dusk · first dawn');
  assert.deepEqual(v.night.glass, { n: 10, sub: '4 + 6 first dawn' }); // boss 2 + dawn 2 + first dawn 6
  assert.equal(v.night.goldLine, 'x1.5 Deep Dusk');
  assert.equal(v.bank.gold, 1680, 'gold incl. the x1.5 bonus');
  assert.equal(v.bank.shards, 6, 'boss 5 + 1 first-dawn shard');
  assert.equal(v.night.firstLine, 'First dawn with Wren on Deep Dusk. Elias has not seen it yet (+6 waiting).');
  assert.deepEqual(v.night.stars.map((x) => x.on), [true, false, false]);
  assert.equal(v.night.again, 'Again · Deep Dusk');
  assert.ok(resultsSummary(v).includes('10 Dawnglass'));
  const res = buildResults({ view: v, onAgain() {}, onMenu() {}, onTree() {} });
  const txt = res.root.textContent;
  for (const s of ['Deep Dusk · first dawn', 'Dawnglass', '+10', '4 + 6 first dawn', 'x1.5 Deep Dusk', 'First dawn with Wren', 'Both heroes', 'Again · Deep Dusk']) assert.ok(txt.includes(s), s);
  // death on Deep Dusk: kept line, no stars, no first dawn
  const d = resultsView({ ...r, outcome: 'defeat', time: 702 }, { ...bank, tier: { tier: 'hard', glass: 0, shards: 0, firstDawn: false, stars: 0, goldBonus: 300 } }, data);
  assert.deepEqual([d.night.badge, d.night.stars, d.night.firstLine, d.night.kept], ['Deep Dusk', null, '', 'What you earned before the fall is always kept.']);
  assert.ok(buildResults({ view: d, onAgain() {}, onMenu() {}, onTree() {} }).root.textContent.includes('always kept'));
  // hostile / forged bank night stays inert and clamped
  const h = nightBlock(r, { night: { id: '<b>', name: '<script>'.repeat(9), waiting: [5, '<i>x</i>'] }, tier: { firstDawn: true, glass: -5, stars: 99 } }, 'Wren', true);
  assert.equal(h.id, 'normal');
  assert.equal(h.name.length, 24);
  assert.equal(nightBlock(r, null, 'Wren', true), null, 'debug run: no night block');
  assert.equal(resultsView(r, null, data).night, null);
});
