// WARDROBE v2 Ring Keepsakes (docs/design/wardrobe-v2.md; LOCKED 'WARDROBE v2 PICKS' + 'WARDROBE SANDBOX LOCKED AS-IS'): data, reserved-colour rule,
// ring completion from the tree, the append-only earned list (hostile saves), wear/take off, the ring shelf view + drawer. Zero power throughout.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { validateCosmetics, cleanCosm, cosmOwned, resolveCosm, isPlain, RESERVED, COSTUME_ROLES, EARNED_CAP, rgb, lum, dist } from '../src/meta/cosmetics.js';
import { ringStates, syncEarned, costumesOfRing } from '../src/meta/costumes.js';
import { defaultSave, sanitize, serializeSave, parseSave } from '../src/save/schema.js';
import { wearView, wearingLine } from '../src/ui/wearcopy.js';

const info = composeTree(readTreeFiles(), data).info;
const C = data.cosmetics;
const clone = (o) => JSON.parse(JSON.stringify(o));
const fresh = (patch = {}) => Object.assign(defaultSave(), patch);
const RINGS = ['hearth', 'wick', 'dusk', 'far', 'deep'];
const ringIdx = (rid) => info.ringTiers.findIndex((t) => t.id === rid);
const realIn = (rid) => def.list.filter((id) => !def.nodes[id].teaser && !def.nodes[id].inert && info.ringOf[id] === ringIdx(rid));
const treeOf = (ids) => Object.fromEntries(ids.map((id) => [id, 1]));
const ALL_ENEMY = [['#5b4f63', 'enemy body'], ['#8a7d92', 'enemy top'], ['#3e3a58', 'crow body'], ['#6c6890', 'crow top'], ['#4e3b34', 'root body']];

test('data: five Ring Keepsakes + Dawnbearer per hero, sandbox names, validates, zero power fields only', () => {
  assert.doesNotThrow(() => validateCosmetics(clone(C), data.characters));
  for (const h of ['wren', 'elias']) {
    const L = C.costumes[h];
    assert.deepEqual(L.map((x) => x.ring), [...RINGS, 'dawn']);
    assert.equal(L.at(-1).name, 'Dawnbearer');
    assert.equal(L.at(-1).rise, 1);
    assert.deepEqual(L.at(-1).motifs, ['stitch', 'wick', 'star', 'fringe', 'core']);
    for (const x of L) assert.deepEqual(Object.keys(x).filter((k) => !['id', 'name', 'ring', 'motifs', 'rise', ...COSTUME_ROLES].includes(k)), [], 'palette + motifs only: no power field');
  }
  assert.deepEqual(C.costumes.wren.map((x) => x.name), ['Hearthwarm', 'Wickwhite', 'Duskwrap', 'Fogmoss', 'Ashveil', 'Dawnbearer']);
  assert.deepEqual(C.costumes.elias.map((x) => x.name), ['Hearthwarm', 'Wickwhite', 'Duskcoat', 'Fogmoss', 'Ashcoat', 'Dawnbearer']);
  assert.deepEqual(info.ringTiers.map((t) => t.id), RINGS, 'costume rings are the tree\'s distance rings');
});

test('RESERVED-COLOUR check: no costume colour sits on a reserved colour; motif light in the lantern band; base / mantle clear of enemy bodies', () => {
  for (const [h, L] of Object.entries(C.costumes)) for (const x of L) for (const k of COSTUME_ROLES) {
    for (const r of RESERVED) assert.ok(dist(x[k], r) >= 24, `${h}/${x.id}.${k} ${x[k]} too close to reserved ${r}`);
  }
  for (const [h, L] of Object.entries(C.costumes)) for (const x of L) {
    const g = lum(x.glow);
    assert.ok(g >= 150 && g <= 245, `${x.id} motif light brightness ${g.toFixed(0)}`);
    for (const k of ['base', 'mantle']) for (const [ec, en] of ALL_ENEMY) assert.ok(dist(x[k], ec) >= 45, `${h}/${x.id}.${k} ${x[k]} vs ${en}: ${dist(x[k], ec).toFixed(1)} (needs 45)`);
  }
  // a reserved colour in a costume is refused at boot
  for (const bad of ['#ffd36b', '#ff4a3a', '#8a6fe0']) { const c = clone(C); c.costumes.wren[0].trim = bad; assert.throws(() => validateCosmetics(c, data.characters), /reserved/); }
  assert.ok(rgb('#ffffff').length === 3);
});

test('data refusals: bad ring, rune, motif, duplicate ring / id, unknown hero, bad name, bad rise', () => {
  const t = (f, re) => { const c = clone(C); f(c); assert.throws(() => validateCosmetics(c, data.characters), re); };
  t((c) => { c.costumes.wren[0].ring = 'nowhere'; }, /ring/);
  t((c) => { c.costumes.wren[1].ring = 'hearth'; }, /ring/);
  t((c) => { c.costumes.wren[0].motifs = ['laser']; }, /motifs/);
  t((c) => { c.costumes.wren[0].motifs = ['star', 'star']; }, /motifs/);
  t((c) => { c.costumes.wren[0].motifs = []; }, /motifs/);
  t((c) => { c.rings[0].rune = 'M0 0 <script>'; }, /rune/);
  t((c) => { c.rings[0].line = '<b>x</b>'; }, /line/);
  t((c) => { c.costumes.wren[0].name = '<img>'; }, /name/);
  t((c) => { c.costumes.wren[0].base = 'red'; }, /#rrggbb/);
  t((c) => { c.costumes.wren[5].rise = 2; }, /rise/);
  t((c) => { c.costumes.elias[0].id = 'wren_hearth'; }, /bad id/);
  t((c) => { c.costumes.mallory = c.costumes.wren; }, /unknown hero/);
  t((c) => { c.costumes.wren[0].id = '__proto__'; }, /bad id/);
});

test('ring completion = every real lantern of that distance ring (the tree arc\'s definition); teasers do not count', () => {
  for (const rid of RINGS) {
    const ids = realIn(rid);
    assert.ok(ids.length > 3, `${rid} has real lanterns`);
    const some = ringStates(fresh({ tree: treeOf(ids.slice(1)) }), def, info).find((s) => s.id === rid);
    assert.equal(some.done, false); assert.equal(some.owned, ids.length - 1); assert.equal(some.total, ids.length);
    const all = ringStates(fresh({ tree: treeOf(ids) }), def, info).find((s) => s.id === rid);
    assert.equal(all.done, true); assert.equal(all.frac, 1);
    for (const o of ringStates(fresh({ tree: treeOf(ids) }), def, info)) if (o.id !== rid) assert.equal(o.done, false, 'closing one ring closes only that ring');
  }
  const teaser = def.list.find((id) => def.nodes[id].teaser);
  if (teaser) { const k = info.ringOf[teaser]; const ids = def.list.filter((id) => !def.nodes[id].teaser && !def.nodes[id].inert && info.ringOf[id] === k); assert.equal(ringStates(fresh({ tree: treeOf(ids) }), def, info)[k].done, true, 'a teaser never blocks a ring'); }
});

test('syncEarned: a closed ring earns both heroes\' Keepsake once; Dawnbearer after all five; idempotent; never un-earns', () => {
  const s = fresh({ tree: treeOf(realIn('hearth')) });
  const r = syncEarned(s, data, def, info);
  assert.deepEqual(r.rings, ['hearth']); assert.equal(r.dawn, false);
  assert.deepEqual(r.added.sort(), ['elias_hearth', 'wren_hearth']);
  assert.deepEqual(s.cosm.earned, ['wren_hearth', 'elias_hearth']);
  assert.deepEqual(syncEarned(s, data, def, info), { added: [], rings: [], dawn: false }, 'idempotent: no second toast');
  // refund / a lantern added later: the ring is no longer complete, the costume stays earned
  s.tree = {};
  assert.deepEqual(syncEarned(s, data, def, info).added, []);
  assert.deepEqual(cleanCosm(s.cosm, data).earned, ['wren_hearth', 'elias_hearth']);
  assert.ok(cosmOwned(s, data, def).costumes.wren.has('wren_hearth'));
  // all five rings, one by one: Dawnbearer arrives with the fifth
  let t = {};
  for (const [i, rid] of RINGS.entries()) {
    t = { ...t, ...treeOf(realIn(rid)) }; s.tree = t;
    const x = syncEarned(s, data, def, info);
    assert.equal(x.dawn, i === 4, rid);
    if (rid !== 'hearth') assert.deepEqual(x.rings, [rid]);
  }
  assert.deepEqual(s.cosm.earned.length, 12);
  assert.ok(s.cosm.earned.includes('wren_dawn') && s.cosm.earned.includes('elias_dawn'));
  // earning is idempotent and the worn map survives a sync
  s.cosm.worn.costume = { wren: 'wren_hearth' };
  syncEarned(s, data, def, info);
  assert.equal(cleanCosm(s.cosm, data).worn.costume.wren, 'wren_hearth');
});

test('syncEarned: Dawnbearer survives a refund (earned by the list, not by the live tree)', () => {
  const s = fresh({ tree: treeOf(RINGS.flatMap(realIn)) });
  assert.equal(syncEarned(s, data, def, info).dawn, true);
  s.tree = treeOf(realIn('hearth')); // respec down to one ring
  assert.deepEqual(syncEarned(s, data, def, info).added, []);
  assert.equal(cosmOwned(s, data, def).costumes.elias.has('elias_dawn'), true);
});

test('cleanCosm HOSTILE earned / worn: wrong types, unknown, forged keys, oversized, duplicates, cap', () => {
  const bad = [null, 5, 'x', [], { earned: 'wren_hearth' }, { earned: { a: 1 } }, { earned: [1, null, {}, [], 'nope', '__proto__', 'constructor', 'wren_hearth'] }, { earned: new Array(100000).fill('wren_hearth') },
    { earned: Array.from({ length: 5000 }, (_, i) => `x${i}`) }, { worn: { costume: 'wren_hearth' } }, { worn: { costume: { __proto__: { wren: 'wren_hearth' } } } }, { worn: { costume: { wren: 7, elias: ['elias_hearth'], mallory: 'wren_hearth', constructor: 'wren_hearth' } } }];
  for (const b of bad) {
    const c = cleanCosm(b, data);
    assert.ok(Array.isArray(c.earned) && c.earned.length <= EARNED_CAP);
    assert.ok(c.earned.every((id) => C.costumes.wren.concat(C.costumes.elias).some((x) => x.id === id)));
    assert.equal(new Set(c.earned).size, c.earned.length);
    assert.deepEqual(Object.keys(c.worn.costume).filter((k) => !['wren', 'elias'].includes(k)), []);
    assert.equal(Object.getPrototypeOf(c.worn.costume), Object.prototype);
  }
  assert.deepEqual(cleanCosm({ earned: bad[6].earned }, data).earned, ['wren_hearth']);
  assert.deepEqual(cleanCosm({ earned: ['elias_deep', 'wren_hearth', 'wren_hearth'] }, data).earned, ['wren_hearth', 'elias_deep'], 'stable data order, deduped');
  assert.equal(cleanCosm({ worn: { costume: { wren: 'elias_hearth' } } }, data).worn.costume.wren, undefined, 'a costume of another hero is not accepted');
  assert.equal(cleanCosm({ worn: { costume: { wren: 'wren_dawn' } } }, data).worn.costume.wren, 'wren_dawn', 'known id kept; ownership is checked at resolve');
});

test('save: default has an empty earned list; old saves load; export/import round-trips; a forged save cannot wear what is not earned', () => {
  const d = defaultSave();
  assert.deepEqual(d.cosm, { worn: { flame: null, trail: null, look: {} } }, 'nothing earned: the save is byte-identical to the pre-WARDROBE v2 shape');
  const old = clone(defaultSave()); old.cosm = { worn: { flame: null, trail: null, look: {} } };
  assert.deepEqual(cleanCosm(sanitize(old).cosm, data).earned, []);
  assert.deepEqual(sanitize({ ...defaultSave(), cosm: { earned: ['wren_hearth', 'zzz'] } }).cosm, { worn: { flame: null, trail: null, look: {} }, earned: ['wren_hearth'] });
  const s = fresh({ tree: treeOf(realIn('wick')) });
  syncEarned(s, data, def, info); s.cosm.worn.costume = { wren: 'wren_wick' };
  const back = parseSave(JSON.stringify(serializeSave(s)));
  assert.equal(back.ok, true);
  assert.deepEqual(back.save.cosm.earned, ['wren_wick', 'elias_wick']);
  assert.equal(back.save.cosm.worn.costume.wren, 'wren_wick');
  assert.equal(serializeSave(s).version, serializeSave(defaultSave()).version, 'no schema version bump');
  const forged = fresh({ cosm: { worn: { costume: { wren: 'wren_dawn' } }, earned: [] } });
  assert.equal(resolveCosm(forged, data, def, 'wren').costume, null, 'worn but not earned = the everyday look');
  assert.equal(resolveCosm(fresh({ cosm: { worn: { costume: { wren: 'wren_dawn' } }, earned: ['wren_dawn'] } }), data, def, 'wren').costume.name, 'Dawnbearer');
});

test('resolve: a worn earned costume is passed as plain palette data; isPlain is false with a costume; other hero untouched', () => {
  const s = fresh({ cosm: { worn: { costume: { wren: 'wren_hearth' } }, earned: ['wren_hearth', 'elias_hearth'] } });
  const v = resolveCosm(s, data, def, 'wren');
  assert.equal(v.costume.id, 'wren_hearth'); assert.equal(v.costume.hero, 'wren'); assert.deepEqual(v.costume.motifs, ['stitch']); assert.equal(v.costume.rise, 0);
  for (const k of COSTUME_ROLES) assert.match(v.costume[k], /^#[0-9a-f]{6}$/);
  assert.equal(isPlain(v), false);
  assert.equal(resolveCosm(s, data, def, 'elias').costume, null);
  assert.equal(isPlain(resolveCosm(fresh(), data, def, 'wren')), true, 'nothing worn: the plain paths');
});

test('ring shelf view: locked wording like the tree arc, earned wording, peeking never wears, wear / take off are explicit', () => {
  const ids = realIn('wick');
  const s = fresh({ tree: treeOf(ids.slice(0, 4)) });
  const v = wearView(s, data, def, 'wren', null, info);
  const it = Object.fromEntries(v.costume.items.map((x) => [x.id, x]));
  assert.deepEqual(v.costume.items.map((x) => x.ring), [...RINGS, 'dawn']);
  assert.equal(it.wren_wick.owned, false);
  assert.equal(it.wren_wick.need, `Finish the Wick: 4 of ${ids.length} lanterns`);
  assert.equal(it.wren_dawn.need, 'Close all five rings: 0 of 5');
  assert.ok(Math.abs(it.wren_wick.frac - 4 / ids.length) < 1e-9);
  assert.equal(v.costume.sel, null);
  assert.deepEqual(wearView(s, data, def, 'wren', { costume: 'wren_wick' }, info).costume.sel, null, 'a locked pick never sticks');
  syncEarned(s, data, def, info); s.tree = { ...s.tree, ...treeOf(realIn('hearth')) }; syncEarned(s, data, def, info);
  const v2 = wearView(s, data, def, 'wren', null, info);
  const i2 = Object.fromEntries(v2.costume.items.map((x) => [x.id, x]));
  assert.equal(i2.wren_hearth.owned, true); assert.equal(i2.wren_hearth.need, 'Earned: the Hearth ring is closed.'); assert.equal(i2.wren_hearth.frac, 1);
  assert.equal(wearView(s, data, def, 'wren', { costume: 'wren_hearth' }, info).costume.sel, 'wren_hearth');
  assert.equal(wearView(s, data, def, 'wren', { costume: 'wren_hearth' }, info).sel.costume, 'wren_hearth');
  assert.equal(wearingLine(wearView(s, data, def, 'wren', { costume: 'wren_hearth' }, info)), 'Hearthwarm · Hearth · Thread · Frost wisp');
  assert.equal(wearView(s, data, def, 'wren', { costume: null }, info).costume.sel, null, 'take off');
  assert.equal(wearView(s, data, def, 'elias', null, info).costume.items[4].name, 'Ashcoat');
  // no info (old caller): the shelf still builds, with no progress numbers
  assert.doesNotThrow(() => wearView(s, data, def, 'wren'));
  assert.equal(costumesOfRing(data, 'hearth').length, 2);
});

test('zero power: costumes change nothing the sim reads (sim data carries no cosmetics; the tree aggregate is untouched by earned)', async () => {
  const { aggregateMods } = await import('../src/meta/tree.js');
  const s = fresh({ tree: treeOf(realIn('hearth')) });
  const before = JSON.stringify(aggregateMods(s.tree, def, data));
  syncEarned(s, data, def, info); s.cosm.worn.costume = { wren: 'wren_hearth' };
  assert.equal(JSON.stringify(aggregateMods(s.tree, def, data)), before);
  const src = (await import('node:fs')).readFileSync(new URL('../src/sim/Sim.js', import.meta.url), 'utf8');
  assert.ok(!/costume|cosm\b/i.test(src), 'the sim never reads costumes');
});

// ---- the drawer (fake DOM; the canvas stage is skipped because there is no canvas, the shelf and detail are real) ----
function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, disabled: false, style: { setProperty(k, v) { n.style[k] = v; } },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, removeAttribute(k) { delete this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; }, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    focus() { globalThis.document.activeElement = n; }, click() { if (!n.disabled) n.fire('click'); }, querySelector() { return null; } };
  n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };
const { buildWear } = await import('../src/ui/wearui.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };

test('drawer: shelf of six, locked = preview only (button disabled), earned = Wear on / Take off through onWear, no innerHTML', () => {
  const s = fresh({ tree: treeOf(realIn('hearth').concat(realIn('wick').slice(0, 3))) });
  syncEarned(s, data, def, info);
  const calls = [];
  const mk = () => buildWear({ view: wearView(s, data, def, 'wren', null, info), viewFor: (sel) => wearView(s, data, def, 'wren', sel, info), onWear: (sel) => { calls.push(sel); }, onBack: () => {}, calm: true });
  const ui = mk();
  const med = (id) => find(ui.root, (n) => n.attrs['data-id'] === id && n.attrs.role === 'radio')[0];
  assert.equal(find(ui.root, (n) => n.attrs.role === 'radio' && /^wren_/.test(n.attrs['data-id'] || '')).length, 6);
  assert.match(med('wren_wick').attrs['aria-label'], /locked/);
  assert.match(med('wren_hearth').attrs['aria-label'], /earned/);
  const btn = () => find(ui.root, (n) => n.tag === 'button' && /wr-btn/.test(n.className))[0];
  med('wren_wick').click(); // peek at a locked one
  assert.equal(ui.peek(), 'wren_wick');
  assert.equal(btn().textContent, 'Not yet yours'); assert.equal(btn().disabled, true);
  btn().click(); assert.equal(calls.length, 0, 'a locked costume can never be worn');
  assert.match(ui.root.textContent, /Finish the Wick: 3 of \d+ lanterns/);
  med('wren_hearth').click();
  assert.equal(btn().textContent, 'Wear on Wren'); assert.equal(btn().disabled, false);
  assert.equal(calls.length, 0, 'trying on does not save');
  btn().click();
  assert.equal(calls.length, 1); assert.equal(calls[0].costume, 'wren_hearth');
  assert.equal(btn().textContent, 'Take off');
  btn().click();
  assert.equal(calls.at(-1).costume, null);
  // the drawer's own Wear button hands back the other choices unchanged
  ui.onKey({ key: 'Enter', preventDefault() {} });
  assert.equal(calls.at(-1).flame, 'hearth');
  ui.destroy();
});
