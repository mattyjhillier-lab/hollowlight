// EXTRAS v1 (2) Cosmetics: Wardrobe lantern cluster (zero power, gold-only way in, connected rule, own price group, budget unchanged) +
// 'Wear' drawer (owned = tree lanterns + Bond deeds; worn validated) + render-only resolve. Hostile data, saves and picks are refused.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { validateCosmetics, validateCosmTree, cosmOwned, cleanCosm, resolveCosm, isPlain } from '../src/meta/cosmetics.js';
import { aggregateMods, nodeStatus, buy, presetTree, costFor, creepSteps } from '../src/meta/tree.js';
import { defaultSave, sanitize, serializeSave, parseSave } from '../src/save/schema.js';
import { wearView, wearingLine } from '../src/ui/wearcopy.js';

const C = data.cosmetics;
const WD = def.list.filter((id) => def.nodes[id].effects.some((e) => e.cosm !== undefined));
const clone = (o) => JSON.parse(JSON.stringify(o));
const fresh = (patch = {}) => Object.assign(defaultSave(), patch);

function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, disabled: false, style: { setProperty(k, v) { n.style[k] = v; } },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, removeAttribute(k) { delete this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; }, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    focus() { globalThis.document.activeElement = n; }, click() { n.fire('click'); }, querySelector() { return null; } };
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

test('cosmetics data: validates; reserved / out-of-band / bad style / unknown hero / two defaults are refused', () => {
  assert.doesNotThrow(() => validateCosmetics(clone(C), data.characters));
  let c = clone(C); c.flames.moon_teal.glow = '#ffd36b'; assert.throws(() => validateCosmetics(c, data.characters), /reserved/); // evolution gold
  c = clone(C); c.flames.moon_teal.glow = '#ff4a3a'; assert.throws(() => validateCosmetics(c, data.characters), /reserved|band/); // danger red
  c = clone(C); c.flames.moon_teal.glow = '#203040'; assert.throws(() => validateCosmetics(c, data.characters), /brightness band/); // a dim flame
  c = clone(C); c.flames.moon_teal.glow = 'red'; assert.throws(() => validateCosmetics(c, data.characters), /#rrggbb/);
  c = clone(C); c.trails.petal.style = 'laser'; assert.throws(() => validateCosmetics(c, data.characters), /style/);
  c = clone(C); c.looks.mallory = C.looks.wren; assert.throws(() => validateCosmetics(c, data.characters), /unknown hero/);
  c = clone(C); c.flames.ember.default = true; assert.throws(() => validateCosmetics(c, data.characters), /one default/);
  c = clone(C); c.looks.wren[1].bond = 99; assert.throws(() => validateCosmetics(c, data.characters), /Bond level/);
  c = clone(C); c.flames.moon_teal.name = '<b>x</b>'; assert.throws(() => validateCosmetics(c, data.characters), /name/);
});

test('Wardrobe cluster: 8 zero-power lanterns, gold-only bridge from Coin Sense / Magnet, every way in reachable, power aggregate unchanged', () => {
  assert.deepEqual(WD.sort(), ['br_wardrobe', 'wd_ember', 'wd_firefly', 'wd_lilac', 'wd_motes', 'wd_petal', 'wd_rose', 'wd_white']);
  assert.doesNotThrow(() => validateCosmTree(def, C));
  const b = def.nodes.br_wardrobe;
  assert.deepEqual([b.cost.gold, b.cost.shards, b.cost.glass || 0, b.unlock], [250, 0, 0, null]);
  assert.deepEqual(b.requiresAny, ['li_coin', 'li_magnet']);
  for (const id of WD) if (id !== 'br_wardrobe') assert.ok(def.nodes[id].requires.length === 1, id);
  // zero power: the full tree with and without every Wardrobe lantern aggregates to the same effects (cosmetics are not in the sim mods)
  const full = presetTree(def, 'full', true);
  const noW = Object.fromEntries(Object.entries(full).filter(([id]) => !WD.includes(id)));
  assert.deepEqual(aggregateMods(full, def, data), aggregateMods(noW, def, data));
  // a 'cosmetic' that also carries power is refused at boot
  const bad = { list: ['x'], nodes: { x: { effects: [{ cosm: 'flame', id: 'ember' }, { mod: 'damage', pct: 5 }] } } };
  assert.throws(() => validateCosmTree(bad, C), /mixes/);
  assert.throws(() => validateCosmTree({ list: ['x'], nodes: { x: { effects: [{ cosm: 'flame', id: 'hearth' }] } } }, C), /default/);
});

test('Wardrobe prices: own rising-price group (never raises a power lantern); glass lanterns need Dawnglass; gold ones wait for a fully lit web', () => {
  const s = fresh({ gold: 100000, dawnglass: 20, tree: { li_study: 1, li_coin: 1 } });
  const before = nodeStatus(def, s, 'li_vow', data).next.gold;
  assert.equal(buy(s, 'br_wardrobe', def, data).ok, true);
  assert.equal(nodeStatus(def, s, 'li_vow', data).next.gold, before, 'Light ring prices untouched by a Wardrobe purchase');
  assert.equal(def.cgroup.br_wardrobe, 'cosm');
  assert.equal(buy(s, 'wd_rose', def, data).ok, true);
  assert.equal(s.dawnglass, 15);
  const lil = nodeStatus(def, s, 'wd_lilac', data);
  assert.equal(nodeStatus(def, s, 'wd_white', data).state, 'available');
  assert.equal(buy(s, 'wd_white', def, data).ok, true);
  const L = nodeStatus(def, s, 'wd_lilac', data);
  assert.equal(L.state, 'condition');
  assert.equal(L.cond.lines[0].text, 'Light every lantern in the Web');
  assert.ok(L.cond.lines[0].goal > 100 && L.cond.lines[0].cur < L.cond.lines[0].goal);
  // every power lantern lit -> Lilac Hush opens (cosmetic lanterns do not count towards 'every lantern')
  const all = presetTree(def, 'full', true);
  for (const id of WD) delete all[id];
  const s2 = fresh({ gold: 1e6, dawnglass: 50, tree: { ...all, br_wardrobe: 1, wd_white: 1 } });
  assert.equal(nodeStatus(def, s2, 'wd_lilac', data).state, 'available');
  assert.ok(nodeStatus(def, s2, 'wd_lilac', data).next.gold >= 6000);
  assert.ok(costFor(def.nodes.wd_firefly, 1, creepSteps(def, s2, 'wd_firefly'), def.creep).gold > 9000, 'rising price inside the Wardrobe');
});

test('ownership: tree lanterns + Bond deeds; worn is validated; anything not owned falls back to the default', () => {
  const s = fresh({ tree: { li_study: 1, li_coin: 1, br_wardrobe: 1, wd_petal: 1 }, chars: { wren: { xp: 5000, keep: 0, woke: true } } });
  const o = cosmOwned(s, data, def);
  assert.deepEqual([...o.flames].sort(), ['hearth', 'moon_teal']);
  assert.deepEqual([...o.trails].sort(), ['petal', 'thread']);
  assert.deepEqual([...o.looks.wren].sort(), ['wren_fox', 'wren_frost', 'wren_moss']); // Bond 11
  assert.deepEqual([...o.looks.elias], ['elias_lilac']);
  s.cosm = { worn: { flame: 'moon_teal', trail: 'petal', look: { wren: 'wren_moss' } } };
  const v = resolveCosm(s, data, def, 'wren');
  assert.deepEqual([v.flame.id, v.trail.id, v.look.id, v.trail.style], ['moon_teal', 'petal', 'wren_moss', 'petal']);
  assert.equal(isPlain(v), false);
  s.cosm = { worn: { flame: 'lilac_hush', trail: 'firefly', look: { wren: 'wren_star' } } }; // forged: none owned
  const f = resolveCosm(s, data, def, 'wren');
  assert.deepEqual([f.flame.id, f.trail.id, f.look.id], ['hearth', 'thread', 'wren_frost']);
  assert.equal(isPlain(f), true);
  assert.equal(isPlain(resolveCosm(fresh(), data, def, 'elias')), true, 'a new lantern wears the defaults (old render paths)');
});

test('save: cosm is additive, known ids only, prototype keys and junk dropped; round-trips through export/import', () => {
  assert.deepEqual(defaultSave().cosm, { worn: { flame: null, trail: null, look: {} } });
  const raw = JSON.parse('{"worn":{"flame":"ember","trail":"<script>","look":{"wren":"elias_sky","elias":"elias_sky","__proto__":"x","mallory":"wren_fox"},"extra":1},"owned":["lilac_hush"]}');
  assert.deepEqual(cleanCosm(raw, data), { worn: { flame: 'ember', trail: null, look: { elias: 'elias_sky' } } });
  for (const bad of [null, 5, 'x', [], { worn: [] }, { worn: { flame: 7, trail: {}, look: [] } }]) assert.deepEqual(cleanCosm(bad, data), { worn: { flame: null, trail: null, look: {} } });
  const s = sanitize({ ...defaultSave(), cosm: { worn: { flame: 'dawn_rose', trail: 'motes', look: { wren: 'wren_fox' } } } });
  assert.deepEqual(s.cosm.worn, { flame: 'dawn_rose', trail: 'motes', look: { wren: 'wren_fox' } });
  const back = parseSave(JSON.stringify(serializeSave(s)));
  assert.equal(back.ok, true);
  assert.deepEqual(back.save.cosm, s.cosm);
  assert.deepEqual(sanitize({ ...defaultSave(), cosm: undefined }).cosm, defaultSave().cosm, 'older saves get the empty block');
});

test('Wear view + drawer: states, Bond progress lines, locked items cannot be picked, Wear hands back owned ids only; no innerHTML', () => {
  const s = fresh({ dawnglass: 0, tree: { li_study: 1, li_coin: 1, br_wardrobe: 1 }, chars: { wren: { xp: 1000, keep: 0, woke: true } } });
  const v = wearView(s, data, def, 'wren');
  assert.deepEqual(v.tabs.map((t) => t.label), ['Flame', 'Trail', "Wren's look"]);
  const f = Object.fromEntries(v.items.flame.map((i) => [i.id, i]));
  assert.equal(f.hearth.worn, true); assert.equal(f.moon_teal.owned, true); assert.equal(f.dawn_rose.line, '5 Dawnglass in the Wardrobe');
  assert.equal(f.lilac_hush.line.startsWith('Light every lantern in the Web'), true);
  const L = Object.fromEntries(v.items.look.map((i) => [i.id, i]));
  assert.equal(L.wren_fox.line, 'Bond 5 with Wren · 4/5'); assert.equal(L.wren_fox.owned, false);
  assert.equal(wearingLine(v), 'Hearth · Thread · Frost wisp');
  assert.deepEqual(wearView(s, data, def, 'wren', { flame: 'lilac_hush', trail: 'motes', look: 'wren_star' }).sel, { flame: 'hearth', trail: 'thread', look: 'wren_frost' }, 'a locked pick never sticks');
  let worn = null;
  const ui = buildWear({ view: v, viewFor: (sel) => wearView(s, data, def, 'wren', sel), onWear: (sel) => { worn = sel; }, onBack: () => {} });
  const item = (id) => find(ui.root, (n) => n.attrs['data-id'] === id && n.attrs.role === 'radio')[0];
  item('dawn_rose').click(); // locked: nothing
  item('moon_teal').click();
  assert.equal(item('moon_teal').attrs['aria-checked'], 'true');
  assert.equal(item('dawn_rose').attrs['aria-disabled'], 'true');
  ui.onKey({ key: 'Enter', preventDefault() {} });
  assert.deepEqual(worn, { flame: 'moon_teal', trail: 'thread', look: 'wren_frost' });
  ui.onKey({ key: '3', preventDefault() {} });
  assert.equal(ui.tab(), 'look');
  for (const n of find(ui.root, (x) => x.attrs.role === 'radio')) assert.ok(n.attrs['aria-label'] && n.attrs.tabindex !== undefined);
});
