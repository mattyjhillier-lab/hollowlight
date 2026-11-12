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

// ---------------------------------------------------------------- first-visit tour + banner extras
import { tourDue, TOUR, HINT, HINT_COUNT, HINT_MASK, cleanHints, withBit, hasBit, startBits, TIPS_AGAIN } from '../src/ui/whispers.js';
import { parseSave, serializeSave } from '../src/save/schema.js';

test('tour gating: only a lantern with no finished run, Tips on, not seen yet; hostile input is never due', () => {
  assert.equal(tourDue(0, 0, undefined), true);
  assert.equal(tourDue(0, 0, true), true);
  assert.equal(tourDue(0, 0, false), false, 'Tips off');
  assert.equal(tourDue(0, 1, true), false, 'a veteran never sees it');
  assert.equal(tourDue(0, 25, true), false);
  assert.equal(tourDue(withBit(0, 'tour'), 0, true), false, 'seen');
  for (const bad of [NaN, -1, 0.5, '0', null, undefined, {}, [], Infinity]) assert.equal(tourDue(0, bad, true), false, String(bad));
  assert.equal(tourDue('junk', 0, true), true, 'garbage hint bits read as 0');
});

test('tour bit: append-only (bit 13), masked by cleanHints, does not stop a fresh lantern starting its first-minute ladder', () => {
  assert.equal(HINT.tour, 13); assert.equal(HINT_COUNT, 14); assert.equal(HINT_MASK, (1 << 14) - 1);
  assert.equal(Object.keys(HINT).length, HINT_COUNT);
  assert.equal(withBit(0, 'tour'), 1 << 13); assert.equal(hasBit(1 << 13, 'tour'), true);
  assert.equal(cleanHints(1 << 14), 0, 'a bit beyond the known ones is dropped'); assert.equal(cleanHints(2 ** 53), 0); assert.equal(cleanHints(-1), 0); assert.equal(cleanHints(1.5), 0);
  assert.equal(cleanHints(0b1111111111111 | (1 << 13)), HINT_MASK);
  for (const id of Object.keys(HINT)) if (id !== 'tour') assert.equal(HINT[id] < 13, true, 'old bits keep their meaning');
  assert.equal(startBits(1 << 13, 0) & TIPS_AGAIN, TIPS_AGAIN, 'tour seen, first run: ladder still starts');
  assert.equal(startBits(1 << 13, 0), (1 << 13) | TIPS_AGAIN);
  assert.equal(startBits(0, 0), TIPS_AGAIN);
  assert.equal(startBits(1 << 5, 0), 1 << 5, 'a lantern with other bits already has its ladder state');
  assert.equal(startBits(1 << 13, 3), 1 << 13, 'a lantern with runs is left alone');
});

test('tour bit survives a save round trip; hostile hint values are masked, not trusted', () => {
  const s = defaultSave(); s.hints = withBit(TIPS_AGAIN, 'tour');
  assert.equal(parseSave(JSON.stringify(serializeSave(s))).save.hints, s.hints);
  const hostile = JSON.parse(JSON.stringify(serializeSave(s))); hostile.hints = (1 << 20) | (1 << 13);
  assert.equal(parseSave(JSON.stringify(hostile)).save.hints, 1 << 13);
  hostile.hints = '8192'; assert.equal(parseSave(JSON.stringify(hostile)).save.hints, 0);
});

test('tour copy: four short plain steps pointing at known places; the screen draws them with textContent', () => {
  assert.equal(TOUR.length, 4);
  for (const S of TOUR) { assert.ok(['start', 'ready', 'next', 'almanac'].includes(S.at)); assert.ok(S.t.length <= 40 && S.p.length <= 170, S.t); assert.ok(!/hollowlight|<|>/i.test(S.t + S.p)); }
  const src = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  const fn = src.slice(src.indexOf('  tourStart() {'), src.indexOf('  drawWeb(t) {'));
  assert.ok(fn.includes('this.tourH.textContent = S.t') && fn.includes('this.tourP.textContent = S.p') && !/innerHTML/.test(fn));
  assert.ok(src.includes("if (this.tourOpen && k === 'Escape')"), 'Esc skips the tour');
  assert.ok(src.includes('if (this.tourOpen) this.tourEnd();'), 'closing the tree ends it (seen)');
  assert.ok(src.includes('if (!this.tourStart() && !(this.pulseSet && this.pulseSet.size)) this.showTip(false);'), 'the tour replaces the older tip');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes("tourDue: () => this.canKeepHints() && tourDue(") && app.includes("withBit(this.save.data.hints, 'tour')"), 'never in debug runs or read-only lanterns');
});

test('banner: condition leaves follow the condLines order; path info is the chain from your light; lit lantern has none', () => {
  const s = save({ notes: NOTES, tree: starterTree() });
  const t = screen(s); t.veil = new Set();
  const c = { t: 'all', of: [{ t: 'killEnemy', id: 'crow', n: 50 }, { t: 'any', of: [{ t: 'runs', n: 3 }, { t: 'totalKills', n: 9 }] }] };
  assert.deepEqual(t.condLeaves(c).map((x) => x.t), ['killEnemy', 'runs', 'totalKills']);
  assert.deepEqual(t.condLeaves(null), []); assert.deepEqual(t.condLeaves('x'), []);
  const deep = { t: 'all', of: [] }; let cur = deep; for (let i = 0; i < 20; i++) { const n = { t: 'all', of: [] }; cur.of.push(n); cur = n; }
  assert.ok(t.condLeaves(deep).length === 0);
  const far = def.list.find((id) => !def.nodes[id].teaser && t.model.cache[id].s === 'notyet' && view.ringOf[id] >= 2);
  const P = t.pathInfo(far);
  assert.ok(P.steps.length >= 1 && P.steps.at(-1) === far && P.gold >= 0);
  assert.ok(!P.steps.some((id) => t.model.lit(id)), 'only lanterns still to light');
  assert.deepEqual(t.pathInfo(starterNodes(composed.info, 'chain_lightning')[0]), { steps: [], gold: 0 });
  assert.deepEqual(t.pathInfo('nope'), { steps: [], gold: 0 });
  const src = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  const tile = src.slice(src.indexOf('  renderTile(id) {'), src.indexOf('  renderChips(id) {'));
  assert.ok(!/innerHTML/.test(tile) && tile.includes("setAttribute('src', url)") && tile.includes('Object.hasOwn(E, leaf.id)'), 'foe art only for known enemy ids, via our own portrait urls');
  const ui = readFileSync(new URL('../src/ui/ui.js', import.meta.url), 'utf8');
  assert.ok(ui.includes('function enemyPortrait(id)') && ui.includes("typeof id === 'string' ? portraitUrl(id)"));
});
