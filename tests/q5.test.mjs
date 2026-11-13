// Q5a / Q5c: the tree as the HOME screen: Title Play -> tree (a new profile picks its starter first, nothing preselected, then lands on the tree with its spirit
// lit), Play on the tree runs the 3-step loadout and Back returns to the tree, Esc reaches the title, every entry point reaches the tree. The real run of these
// paths on the built dist is scripts/flow-smoke.mjs; here: the wiring, the pure rules and hostile saves.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { cleanPick } from '../src/save/chars.js';
import { INTRO_IDS, VETERAN_SEEN } from '../src/ui/introcopy.js';

const R = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const ui = R('src/ui/ui.js'), app = R('src/app.js'), tree = R('src/ui/treescreen.js');

test('Q5a: Title Play opens the tree home; new lanterns do too; the starter pick comes first for a new profile and returns to the tree', () => {
  assert.ok(/onBegin: \(\) => h\.openTree\(\)/.test(ui), 'title Play = the tree');
  assert.ok(ui.includes('const r = h.createLantern(name); if (r && r.ok) h.openTree();') && ui.includes('const r = h.replaceLantern(id, name); if (r && r.ok) h.openTree();'));
  assert.ok(app.includes('if (this.needsStarter() && this.ui.showStarterHero) { this.ui.starterAfter = () => this.openTree(focusId, back, opts); this.ui.showStarterHero(); return; }'));
  assert.ok(ui.includes('if (after) after();'), 'after the spirit pick: back to the tree');
  assert.ok(/selected: null,\s+copy: \{ kicker: LOADOUT\.starterKicker/.test(ui), 'no spirit preselected on the first pick');
});

test('Q5a: the starter offer stays data-driven and validated (1 hero + 1 of the offered spirits); debug and read-only lanterns never ask', () => {
  assert.ok(app.includes('return !this.isDebugRun() && !this.save.readOnly && !(s.notes && s.notes.starter);'));
  assert.ok(app.includes('if (!this.needsStarter() || !pool.heroes.includes(heroId) || !pool.weapons.includes(weaponId)) return false;'));
  assert.equal(data.balance.starter.weapons.length >= 1, true);
});

test('Q5a/Q5c: Play on the tree starts the loadout and Back / Esc out of it return to the tree; elsewhere to the title', () => {
  assert.ok(ui.includes("else if (dest === 'play') { this.showStart(this.onPick); this.loadoutFromTree = true; this.beginLoadout(); }"));
  assert.ok(ui.includes('leaveLoadout() {') && ui.includes('if (this.loadoutFromTree) { this.loadoutFromTree = false; this.starterAfter = null; if (this.handlers.openTree) { this.handlers.openTree(); return; } }'));
  const hs = ui.slice(ui.indexOf('  showHeroSelect(back = false) {'), ui.indexOf('  // EXTRAS v1: the Lantern Wardrobe drawer'));
  assert.ok(hs.includes('else this.leaveLoadout()'), 'hero step back');
  assert.ok(ui.slice(ui.indexOf('  showNights('), ui.indexOf('  showNights(') + 2200).includes('onBack: () => this.leaveLoadout()'), 'night step back');
  assert.ok(tree.includes("showAlmanac('tree')"), 'the Almanac opens over the tree and Back returns to it');
  assert.ok(app.includes('onClose: () => this.showMenu()'), 'Esc from the tree = the title');
});

test('Q5c: every entry point reaches the tree and comes back (title Skill Tree button, tab row, results Tree, night gate link, profile chip -> new lantern)', () => {
  assert.ok(/onTree: \(\) => h\.openTree\(\),/.test(ui), 'title Skill Tree button');
  assert.ok(ui.includes("else if (dest === 'tree' && h.openTree) h.openTree();"), 'tab row Tree');
  assert.ok(ui.includes('h.openTree(null, null, { pulse: movedIds(cleanMoved(view.moved)) })'), 'results Tree / Continue');
  assert.ok(ui.includes('onTree: (gateId) => { if (h.openTree) h.openTree(gateId, () => this.showNights('), 'the night screen link opens the gate and Back returns to the night screen');
  assert.ok(app.includes('openTree: (focusId, back, opts) => this.openTree(focusId, back, opts)'));
  assert.ok(app.includes("if (typeof back === 'function') api.onClose = back;"));
});

test('Q5c: first-run intro order intact: the new-feature cards are still run cards in the same order, unchanged by the tree home', () => {
  assert.deepEqual(INTRO_IDS, ['lamp', 'road', 'knot', 'blessing', 'evolution', 'shard', 'ability']);
  assert.deepEqual(VETERAN_SEEN, ['ability']);
  assert.ok(!ui.slice(ui.indexOf('showIntro(')).includes('openTree'), 'the intro cards never route to the tree');
});

test('hostile loadout saves: unknown / forged heroes and spirits are dropped before the tree home reads them', () => {
  assert.deepEqual(cleanPick({ hero: 'wren', weapon: 'ghost_wolves' }, data), { hero: 'wren', weapon: 'ghost_wolves' });
  for (const bad of [null, 5, 'x', [], { hero: '__proto__', weapon: 'ghost_wolves' }, { hero: 'wren', weapon: '<img src=x onerror=alert(1)>' }, { hero: 'wren' }, { hero: 'nobody', weapon: 'ghost_wolves' }, { hero: { a: 1 }, weapon: [] }]) {
    const p = cleanPick(bad, data);
    assert.ok(p === null || (Object.hasOwn(data.characters, p.hero) && Object.hasOwn(data.weapons, p.weapon)), JSON.stringify(bad));
  }
  const heroes = app.slice(app.indexOf('      heroes: () => {'), app.indexOf('      setHero: (id) => {'));
  assert.ok(heroes.includes('list.find((h) => h.id === lo.hero && h.awake) || list.find((h) => h.awake) || list[0]'), 'an unknown last hero falls back to an awake one');
  const set = app.slice(app.indexOf('      setHero: (id) => {'), app.indexOf('      clearResetNotice'));
  assert.ok(set.includes('!isAwake(s, id) || this.save.readOnly') && set.includes('Object.hasOwn(data.weapons, w)'));
});

test('LOCKED 2026-11-13: one awake hero skips the hero step going forward; Back from the spirit step never lands on it', () => {
  const hs = ui.slice(ui.indexOf('  showHeroSelect(back = false) {'), ui.indexOf('  // EXTRAS v1: the Lantern Wardrobe drawer'));
  assert.ok(hs.includes('if (!back && ids.length === 1) { this.lastHero = ids[0]; this.showSpiritSelect(ids[0]); return; }'));
  const sp = ui.slice(ui.indexOf('  showSpiritSelect(heroId) {'), ui.indexOf('  showSpiritSelect(heroId) {') + 1200);
  assert.ok(sp.includes('if (!only) { this.showHeroSelect(true); return; }'));
  assert.ok(ui.slice(ui.indexOf('  showWear(heroId) {'), ui.indexOf('  showWear(heroId) {') + 700).includes('onBack: () => this.showHeroSelect(true)'));
});
