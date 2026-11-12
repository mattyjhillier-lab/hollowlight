// Tree look port (LOCKED from the sandbox): the thread web (every thread real, three states), the hover/select focus path, the starter on the hub,
// the one-time restart notice, and source rules (no innerHTML from data, no image path built by the screen, locked tune values used).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef as def } from './helpers.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { buildTreeView } from '../src/meta/treeview.js';
import { TreeModel } from '../src/ui/treemodel.js';
import { TreeScreen } from '../src/ui/treescreen.js';
import { defaultSave } from '../src/save/schema.js';
import { starterNodes } from '../src/meta/starter.js';

const composed = composeTree(readTreeFiles(), data);
const view = buildTreeView(composed.info, def, data);
const save = (o = {}) => ({ ...defaultSave(), gold: 0, shards: 0, tree: {}, creep: {}, seen: {}, ...o });
const NOTES = { starter: { hero: 'wren', weapon: 'chain_lightning' } };
const starterTree = () => Object.fromEntries(starterNodes(composed.info, 'chain_lightning').map((id) => [id, 1]));

// a TreeScreen with just enough state for its pure parts (no DOM)
const screen = (s) => {
  const t = new TreeScreen({}, () => null);
  t.def = def; t.data = data; t.view = view; t.api = { save: () => s };
  t.model = new TreeModel(def, data, view); t.model.recompute(s, []);
  t.hoverFocus = null; t.selected = null; t.reduced = true;
  t.buildThreads();
  return t;
};

test('threads: every drawn thread joins two real lanterns (or the hub), none is a teaser, none longer than linkFar, cross links are the view links', () => {
  const t = screen(save({ notes: NOTES, tree: starterTree() }));
  assert.ok(t.threads.length > 250, `threads ${t.threads.length}`);
  const seen = new Set();
  for (const e of t.threads) {
    for (const id of [e.a, e.b]) assert.ok(id === 'hub' || (def.nodes[id] && !def.nodes[id].teaser), id);
    if (!e.cross) assert.ok(Math.hypot(e.ax - e.bx, e.ay - e.by) <= view.linkFar + 1e-6, `${e.a}-${e.b} too long`);
    const k = e.a < e.b ? `${e.a}|${e.b}` : `${e.b}|${e.a}`;
    assert.ok(!seen.has(k), 'duplicate thread');
    seen.add(k);
    assert.ok(/^#[0-9a-f]{6}$/i.test(e.col), `thread colour ${e.a}-${e.b} ${e.col}`);
  }
  const cross = t.threads.filter((e) => e.cross).length;
  assert.ok(cross > 0 && cross <= view.links.length);
  // the far evolution seals hang from their spirit's heart, never from the hub
  assert.ok(!t.threads.some((e) => e.a === 'hub' && Math.hypot(e.bx, e.by) > view.linkFar));
});

test('focus: the path runs from the nearest lit lantern through real threads to the lantern; a lit lantern has no path; nothing selected = no focus', () => {
  const s = save({ notes: NOTES, tree: starterTree() });
  const t = screen(s);
  t.setFocus(); assert.equal(t.focus, null);
  const far = def.list.find((id) => !def.nodes[id].teaser && t.model.cache[id].s === 'notyet' && view.ringOf[id] >= 2);
  t.hoverFocus = far; t.setFocus();
  assert.ok(t.focus && t.focus.id === far && t.focus.edges.size >= 1);
  // the edges chain: every focus edge touches two focus nodes, and exactly one end of the chain is lit (or the hub)
  const lit = (id) => id === 'hub' || t.model.lit(id);
  let litEnds = 0;
  for (const i of t.focus.edges) { const e = t.threads[i]; assert.ok(!e.cross); assert.ok(t.focus.nodes.has(e.a) && t.focus.nodes.has(e.b)); }
  for (const id of t.focus.nodes) if (lit(id)) litEnds++;
  assert.equal(litEnds, 1, 'the chain starts at one lit lantern (the nearest)');
  const mine = [...t.focus.nodes];
  assert.equal(mine.length, t.focus.edges.size + 1, 'a simple path');
  const heart = starterNodes(composed.info, 'chain_lightning')[0];
  t.hoverFocus = heart; t.setFocus();
  assert.equal(t.focus.edges.size, 0, 'an owned lantern is its own focus');
  t.hoverFocus = null; t.selected = far; t.setFocus(); assert.equal(t.focus.id, far, 'selection also focuses');
  t.hoverFocus = 'not_a_node'; t.selected = null; t.setFocus(); assert.equal(t.focus, null, 'hostile id');
});

test('starter: caption and tag come from the validated notes + game data; hostile notes show nothing', () => {
  const s = save({ notes: NOTES, tree: starterTree() });
  const t = screen(s);
  const st = t.starterInfo(s);
  assert.equal(st.hero, 'wren'); assert.equal(st.weapon, 'chain_lightning');
  assert.equal(st.caption, `${data.characters.wren.name.split(',')[0]} · ${data.weapons.chain_lightning.name}`);
  assert.equal(st.heart, composed.info.clusters.chain_lightning.heart);
  assert.ok(/^#[0-9a-f]{6}$/i.test(st.color));
  assert.equal(t.starterInfo(save({ notes: { starter: { hero: '__proto__', weapon: 'chain_lightning' } } })), null);
  assert.equal(t.starterInfo(save({ notes: { starter: { hero: 'wren', weapon: '<img onerror=1>' } } })), null);
  assert.equal(t.starterInfo(save({})), null);
});

test('restart notice: numbers re-validated, text via textContent only, cleared once dismissed or when the tree closes', () => {
  const src = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  const fn = src.slice(src.indexOf('  resetNotice() {'), src.indexOf('  regrowthNote() {'));
  assert.ok(fn.includes('Math.min(x, 1e9)') && fn.includes("el('p', 'ts-noticep'") && fn.includes('dismissNotice'));
  assert.ok(!/innerHTML|insertAdjacentHTML/.test(fn));
  assert.ok(src.includes('if (this.noticeShown) this.dismissNotice();'), 'closing the tree counts as seen');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes('clearResetNotice') && app.includes('delete this.save.data.notes.treeResetNotice'));
});

test('look source rules: locked tune values used, no image path built by the screen, ring progress uses real lanterns only', () => {
  const src = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  for (const k of ['LOOK.medSize', 'LOOK.thrLit', 'LOOK.thrAvail', 'LOOK.thrLocked', 'LOOK.bright', 'LOOK.labelDensity', 'LOOK.glow']) assert.ok(src.includes(k), k);
  assert.ok(!/new Image|\.src\s*=/.test(src.replace(/\/\/.*$/gm, '')));
  assert.ok(src.includes('ringProgress(this.def, this.view.ringOf'));
});

test('hero panel + next lights: desktop only, hero data from the api, no innerHTML, Play goes through the loadout flow', () => {
  const src = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  assert.ok(src.includes("toggle('ts-hero-on', !this.small && this.W >= 860)"));
  const hp = src.slice(src.indexOf('  buildHeroPanel() {'), src.indexOf('  drawWeb(t) {'));
  assert.ok(!/innerHTML|insertAdjacentHTML/.test(hp));
  assert.ok(hp.includes("navTo('play')") && hp.includes("navTo('almanac')") && hp.includes('toggleGoals(false)'));
  const ui = readFileSync(new URL('../src/ui/ui.js', import.meta.url), 'utf8');
  assert.ok(ui.includes("dest === 'play'") && ui.includes('this.beginLoadout()'));
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes('setHero: (id)') && app.includes('isAwake(s, id)') && app.includes('Object.hasOwn(data.weapons, w)'));
});

test('veil + gardens: forks behind an unlit seal are veiled, a lit seal clears its own', () => {
  const st = starterNodes(composed.info, 'chain_lightning');
  const s = save({ notes: NOTES, tree: Object.fromEntries(st.map((id) => [id, 1])) });
  const t = screen(s);
  t.unfurl = new Map(); t.sealPrev = null; t.veilState();
  assert.ok(view.gardens.length >= 9, 'three magic gardens x three branches');
  const g = view.gardens.find((x) => x.seal === st[1]);
  assert.ok(g, 'starter seal is a garden seal');
  for (const f of g.forks) for (const id of f) assert.ok(!t.veil.has(id), 'lit seal: its forks are shown');
  const other = view.gardens.find((x) => x.seal !== st[1] && !s.tree[x.seal]);
  for (const f of other.forks) for (const id of f) assert.ok(t.veil.has(id), 'unlit seal: forks veiled');
  assert.ok(t.fogs.length >= 1 && t.fogs.every((f) => Number.isFinite(f.x) && f.r > 0));
});
