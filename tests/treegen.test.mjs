// TREE-GEN1 (LOCKED 'TREE IS CHARACTER-AGNOSTIC', Matt 2026-10-24): a synthetic THIRD hero (test-only data in tests/fixtures/hero3*,
// different weapon / ability / HP / damage profile) and a synthetic weapon fragment go through every tree path with NO source edits:
// compose, compile, layout, budget, buy, aggregateMods, a Sim run, the tree screen model, the Almanac + celebrations, tree-validate
// and the timeline sim. Also: no tree / mod / status / budget / validator / screen module names a hero id.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { data } from './helpers.mjs';
import { compileTree, nodeStatus, buy, aggregateMods } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { budgetOf } from '../src/meta/treebudget.js';
import { layoutIssues, connectIssues } from '../src/meta/treelayout.js';
import { buildTreeView } from '../src/meta/treeview.js';
import { TreeModel } from '../src/ui/treemodel.js';
import { almanac, markRead, markTold, adopt, defaultCodex } from '../src/meta/codex.js';
import { queue } from '../src/meta/celebrate.js';
import { Sim } from '../src/sim/Sim.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FX = fileURLToPath(new URL('./fixtures/hero3', import.meta.url));
const clone = (x) => JSON.parse(JSON.stringify(x));
const extra = JSON.parse(readFileSync(new URL('./fixtures/hero3-data.json', import.meta.url), 'utf8'));
const D = { ...data, characters: { ...data.characters, ...extra.characters } };
const files = () => [...clone(readTreeFiles()), ...clone(readTreeFiles(FX))];
const composed = composeTree(files(), D);
const def = compileTree(composed.live, D);
const v2 = compileTree(composed.v2, D);
const realC = composeTree(readTreeFiles(), data);
const realV2 = compileTree(realC.v2, data);
const W = (c) => Object.keys(c.info.clusters).length;
const SABLE = ['ch_sable', 'zs_hour', 'zs_motes'];
const save = (o = {}) => ({ gold: 1e6, shards: 99, dawnglass: 0, tree: {}, creep: {}, ...o, stats: { kills: 0, runs: 12, killsByEnemy: {}, bossKills: {}, chapters: {}, evolved: {}, charsUsed: { sable: 12 }, tiers: {}, ...(o.stats || {}) } });

test('GEN1 the third hero is data only: composes with no core.json edit (own prefix self-registers, ch_<hero> shared lantern)', () => {
  for (const id of SABLE) assert.ok(def.nodes[id] && !def.nodes[id].inert, id);
  assert.equal(def.list.length, compileTree(realC.live, data).list.length + 3);
  assert.equal(composed.info.heroes.sable.signature, 'spirit_bolts');
  // dormant until the signature weapon's heart is lit (weapon nodes and hero lanterns gate by the weapon heart)
  for (const id of SABLE) assert.deepEqual(def.nodes[id].requires, ['gt_spirit_bolts'], id);
  // ch_ is a shared hero prefix but only as ch_<own hero id>; a hero cannot take another prefix's ids
  const bad = (mut, re) => { const fs = files(); mut(fs.find((f) => f.path === 'heroes/sable.json').json); assert.throws(() => composeTree(fs, D), re); };
  bad((h) => { h.lanterns[0].id = 'ch_wren2'; }, /ch_sable|prefix "ch"/);
  bad((h) => { h.lanterns[1].id = 'wr_hour'; }, /not owned by sable/);
  bad((h) => { h.prefix = 'wf'; }, /prefix "wf"/);
  // an unknown character still fails loudly
  assert.throws(() => composeTree(files(), data), /hero sable: unknown character/);
});

test('GEN1 layout, connected-unlock rule and power budget hold with the third hero (hero lanterns add choices, not combat power past the caps)', () => {
  assert.deepEqual(layoutIssues(composed.info, v2), []);
  assert.deepEqual(connectIssues(composed.info, def).filter((i) => /sable|zs_/.test(typeof i === 'string' ? i : JSON.stringify(i))), []);
  const b = budgetOf(v2, composed.info.core.budget, W(composed));
  assert.deepEqual(b.violations, []);
  assert.ok(b.combatAtCap <= composed.info.core.budget.base.combat && b.sustainPE <= composed.info.core.budget.base.sustain);
  const base = budgetOf(realV2, realC.info.core.budget, W(realC));
  assert.ok(Math.abs(b.sustainPE - base.sustainPE) < 1e-9, 'no sustain added');
});

test('GEN1 buy flow: locked behind the Spirit Bolts heart, then bought with the hero\'s own unlock counts', () => {
  const s = save();
  assert.equal(nodeStatus(def, s, 'ch_sable', D).state, 'locked');
  s.tree.gt_spirit_bolts = 1;
  for (const id of SABLE) assert.ok(buy(s, id, def, D).ok, id);
  const fresh = save({ stats: { charsUsed: { sable: 2 } } });
  fresh.tree.gt_spirit_bolts = 1;
  assert.equal(nodeStatus(def, fresh, 'ch_sable', D).state, 'condition', 'Play 3 runs as Sable');
});

test('GEN1 mods: weapon bonus, a NEW ability parameter declared in characters data, a new visual; bad values fail closed', () => {
  const tree = { gt_spirit_bolts: 1, ch_sable: 1, zs_hour: 1, zs_motes: 1 };
  const m = aggregateMods(tree, def, D);
  assert.ok(m.weaponBonus.spirit_bolts.power.pct > 3.5 && m.weaponBonus.spirit_bolts.power.pct <= 4);
  assert.equal(m.ability.hourSecs, 0.5);
  assert.ok(m.visuals.includes('sableMotes'));
  // existing heroes' parameters are untouched (same keys, same values) and no-node trees carry no hero keys at all
  assert.deepEqual(aggregateMods({}, def, D).ability, { dur: 1, autoHp: 0 });
  const r = aggregateMods({ wr_grip: 1, el_wheel: 1 }, def, D);
  assert.equal(r.ability.rallySecs, 0.5); assert.equal(r.ability.wheel, 8);
  const badTree = (eff) => { const fs = files(); fs.find((f) => f.path === 'heroes/sable.json').json.lanterns[1].effects = [eff]; return () => compileTree(composeTree(fs, D).live, D); };
  assert.throws(badTree({ ability: 'hourSecs', secs: 9 }), /secs/);
  assert.throws(badTree({ ability: 'hourSecs', pct: 5 }), /secs/);
  assert.throws(badTree({ ability: 'nopeSecs', secs: 1 }), /unknown ability effect/);
  assert.throws(badTree({ ability: '__proto__', secs: 1 }), /unknown ability effect/);
  assert.throws(badTree({ visual: 'nopeVisual' }), /unknown visual effect/);
  // a hero's parameter only exists because its character data declares it
  const noDecl = clone(D); delete noDecl.characters.sable.ability.tree;
  assert.throws(() => compileTree(composeTree(files(), noDecl).live, noDecl), /unknown ability effect/);
});

test('GEN1 a Sim run as the third hero applies the tree (HP, weapon, damage profile) and its unknown ability is harmless', () => {
  const tree = aggregateMods({ gt_spirit_bolts: 1, ch_sable: 1, zs_hour: 1, li_vigor: 1 }, def, D);
  const s = new Sim({ data: D, characterId: 'sable', seed: 5, tree });
  const b = new Sim({ data: D, characterId: 'sable', seed: 5 });
  assert.equal(b.player.maxHp, 110);
  assert.ok(s.player.maxHp > b.player.maxHp, 'HP node scales the hero\'s own 110 HP');
  assert.equal(s.weapons[0].id, 'spirit_bolts');
  const pick = (x) => { while (x.state === 'levelup') x.pickCard((x.offer.gold[0] || x.offer.cards[0]).key); };
  for (let i = 0; i < 60 * 40; i++) { pick(s); pick(b); s.step(1 / 60, { x: i % 240 < 120 ? 1 : -1, y: 0, ability: i === 600 }); b.step(1 / 60, { x: i % 240 < 120 ? 1 : -1, y: 0 }); }
  assert.ok(s.time > 39 && s.state === 'running', `${s.time} ${s.state}`);
  assert.equal(s.abilityUses, 1, 'the unknown ability fires (cooldown spent) and does nothing harmful');
  assert.ok(s.kills >= 0 && Number.isFinite(s.player.hp));
});

test('GEN1 tree screen model: the hero region, colours and lantern states come from data', () => {
  const view = buildTreeView(composed.info, def, D);
  for (const id of SABLE) assert.ok(view.regionOf[id], id);
  const s = save(); s.tree.gt_spirit_bolts = 1;
  const m = new TreeModel(def, D, view).recompute(s, []);
  for (const id of SABLE) assert.ok(m.cache[id], id);
  assert.notEqual(m.cache.ch_sable.s, 'locked');
});

test('GEN1 Almanac + celebrations: the hero page, NEW dot and celebrate-once work from its codexBit in characters data', () => {
  const s = save({ stats: { charsUsed: { sable: 2 } } });
  s.codex = adopt(defaultCodex(), { unlocked: new Set() });
  const b = almanac(s, D, def);
  const h = b.heroes.find((x) => x.id === 'sable');
  assert.ok(h && h.walked && h.name === 'Sable' && h.weapon === 'Spirit Bolts' && h.ability === 'Still Hour');
  assert.ok(b.unlocked.has('h:sable') && b.isNew('h:sable'));
  const read = markRead(s.codex, ['h:sable']);
  assert.ok(!almanac({ ...s, codex: read }, D, def).isNew('h:sable'), 'read bit persists');
  const q1 = queue(b, s.codex, D);
  assert.ok([...q1.big, ...q1.medium, ...q1.small].some((i) => i.key === 'h:sable') || q1.more > 0);
  const told = markTold(s.codex, ['h:sable']);
  const q2 = queue(almanac({ ...s, codex: told }, D, def), told, D);
  assert.ok(![...q2.big, ...q2.medium, ...q2.small].some((i) => i.key === 'h:sable'), 'celebrated once');
});

// ---------------------------------------------------------------- a synthetic weapon fragment (live, not inert) gates by its heart
function motesFiles() {
  const fs = clone(readTreeFiles());
  const src = JSON.stringify(fs.find((f) => f.path === 'clusters/spirit_bolts.json').json);
  const evo = { spirit_tempest: 'zt_tempest', soul_lance: 'zt_lance', returning_pages: 'zt_pages' };
  let j = src.replace(/"bo_/g, '"zt_').replace(/spirit_bolts/g, 'test_motes').replace(/"prefix":"bo"/, '"prefix":"zt"').replace(/"slot":"sky3"/, '"slot":"far1"');
  for (const [a, b] of Object.entries(evo)) j = j.split(a).join(b);
  fs.push({ path: 'clusters/test_motes.json', json: JSON.parse(j) });
  const d = clone(D);
  d.weapons.test_motes = { ...clone(d.weapons.spirit_bolts), id: 'test_motes', name: 'Test Motes' };
  for (const [a, b] of Object.entries(evo)) d.evolutions[b] = { ...clone(d.evolutions[a]), id: b, weapon: 'test_motes' };
  return { fs, d };
}

test('GEN1 a new weapon fragment is data only (prefix self-registers) and every one of its lanterns waits for its heart', () => {
  const { fs, d } = motesFiles();
  const c = composeTree(fs, d);
  const g = compileTree(c.live, d);
  const ids = g.list.filter((id) => id.startsWith('zt_'));
  assert.ok(ids.length >= 10);
  const s = save();
  for (const id of ids) assert.equal(nodeStatus(g, s, id, d).state, 'locked', id);
  s.tree.gt_test_motes = 1;
  assert.ok(ids.some((id) => nodeStatus(g, s, id, d).state === 'available'));
  const b = budgetOf(compileTree(c.v2, d), c.info.core.budget, W(c));
  assert.deepEqual(b.violations, []);
  const base = budgetOf(realV2, realC.info.core.budget, W(realC));
  assert.ok(Math.abs(b.combatAtCap - base.combatAtCap) < 1e-9, 'a new weapon adds choices, not power');
});

// ---------------------------------------------------------------- the checkers accept the third hero (scripts, --extra)
test('GEN1 tree-validate and the timeline sim run with the third hero (--extra), no source edits', () => {
  const v = execFileSync(process.execPath, ['scripts/tree-validate.mjs', '--extra', 'tests/fixtures/hero3'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(v, /fragments compose/);
  assert.doesNotMatch(v, /^FAIL/m);
  const t = execFileSync(process.execPath, ['scripts/tree-timeline.mjs', '--extra', 'tests/fixtures/hero3', '--players', '4', '--runs', '60'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(t, /heroes: wren, elias, sable/);
  const m = t.match(/nothing-to-buy (\d+(?:\.\d+)?)%/);
  assert.ok(m, 'timeline prints its nothing-to-buy share');
  assert.equal(Number(m[1]), 0, 'nothing-to-buy stays 0% with the third hero');
});

// ---------------------------------------------------------------- source rule: tree / mod / status / budget / validator / screen code names no hero
test('GEN1 source rule: no hero id in the tree, codex, budget, validator or screen modules', () => {
  const heroes = Object.keys(data.characters);
  const mods = ['src/meta/tree.js', 'src/meta/treedata.js', 'src/meta/treebudget.js', 'src/meta/treelayout.js', 'src/meta/treeview.js', 'src/meta/treecodec.js', 'src/meta/status.js', 'src/meta/celebrate.js',
    'src/ui/treemodel.js', 'src/ui/treescreen.js', 'src/ui/codexui.js', 'scripts/tree-validate.mjs', 'scripts/tree-budget.mjs', 'scripts/tree-timeline.mjs', 'scripts/tree-synth.mjs'];
  for (const f of mods) {
    const code = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const h of heroes) assert.doesNotMatch(code, new RegExp(`['"\`]${h}['"\`]`), `${f} names ${h}`);
  }
  // codex.js keeps the frozen append-only bit list (save format: h:wren / h:elias hold bits 38 / 39 forever) and nothing else
  const cx = readFileSync(new URL('../src/meta/codex.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  for (const h of heroes) assert.equal(cx.split(`'${h}'`).length - 1, 0, `codex.js names ${h} outside the bit list`);
  assert.ok(readdirSync(new URL('../src/data/tree/heroes', import.meta.url)).length === heroes.length, 'one hero fragment per character');
});
