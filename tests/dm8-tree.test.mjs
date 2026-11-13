// DM8: the Dragonfire Meteor constellation (docs/design/fire-weapon-lucinda-v2.md sections 6 + 8), STAGED: the weapon is `unreleased`, so the
// players' tree never composes its cluster (composeTree opts.unreleased). Purely additive: no released id, price, effect or requires changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef } from './helpers.mjs';
import { compileTree, aggregateMods, sanitizeTree, hasTreeStat } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { computeTierSizes } from '../src/meta/treetier.js';
import { budgetOf } from '../src/meta/treebudget.js';
import { encodeTree, decodeTree } from '../src/meta/treecodec.js';
import { fingerprints, readFixture, releaseProblems } from '../scripts/tree-release.mjs';
import { TREE_STEPS as STEPS } from '../src/meta/migrations/index.js';
import { Sim } from '../src/sim/Sim.js';
import { MANIFEST, resolveMedallion } from '../src/gfx/medallions.js';
import { ENTRY_KEYS, tabOfKey } from '../src/meta/codex.js';

const ID = 'dragonfire_meteor';
const clone = (x) => JSON.parse(JSON.stringify(x));
const files = () => clone(readTreeFiles());
const players = composeTree(files(), data);
const full = composeTree(files(), data, { unreleased: true });
const fullDef = compileTree(full.live, data);
const dmIds = full.info.nodes.filter((n) => n.cluster === ID || n.frag === 'dm').map((n) => n.id);
const NEW_GATES = ['gt_dragonfire_meteor', 'gt_wildfire', 'gt_cinder_wyrm', 'gt_cinder_brand'];

test('DM8 hidden while unreleased: the players\' tree has no Meteor node, region, link or budget term; the reserved slot stays', () => {
  assert.deepEqual(players.info.hiddenClusters, [ID]);
  assert.ok(!players.info.clusters[ID]);
  for (const id of [...dmIds, ...NEW_GATES]) { assert.ok(!treeDef.nodes[id], `${id} is not in the game tree`); assert.ok(!players.info.positions[id], id); }
  assert.ok(!treeDef.list.some((id) => id.startsWith('dm_')));
  assert.ok(!players.info.regions.some((r) => r.id === `c:${ID}`));
  assert.ok(players.info.regions.some((r) => r.id === 'r:meteor' && r.reserved), 'the reserved slot still holds its place');
  assert.ok(!players.info.links.some(([a, b]) => String(a).startsWith('dm_') || String(b).startsWith('dm_')));
  // byte-identical to a tree without the file at all (positions, links, live + v2 raw trees)
  const without = composeTree(files().filter((f) => f.path !== `clusters/${ID}.json`), data);
  assert.deepEqual(players.live, without.live);
  assert.deepEqual(players.v2, without.v2);
  assert.deepEqual(players.info.positions, without.info.positions);
  assert.deepEqual(players.info.links, without.info.links);
  // the same mechanism every unreleased weapon gets: starter / codex skip it, and so does the tree
  assert.equal(data.weapons[ID].unreleased, true);
  for (const e of ['wildfire', 'cinder_wyrm', 'cinder_brand']) assert.equal(data.evolutions[e].unreleased, true, e);
});

test('DM8 purely additive: the released v5 snapshot is unchanged, on the players\' tree and on the full tree', () => {
  const fx = readFixture();
  const v = String(treeDef.treeVersion);
  assert.ok(fx.released[v], 'a released snapshot exists for the current version');
  const retired = new Set(full.info.core.retired.map((t) => t.id));
  assert.deepEqual(releaseProblems(fx, fingerprints(treeDef), treeDef.treeVersion, STEPS, retired), []);
  assert.deepEqual(releaseProblems(fx, fingerprints(fullDef), fullDef.treeVersion, STEPS, retired), []);
  for (const id of dmIds) assert.ok(!(id in fx.released[v]), `${id} is new (never released)`);
  // every node the players have keeps its compiled shape in the full tree (requires, costs, effects, unlocks), so release = nothing moves but the new region
  const fp0 = fingerprints(treeDef), fp1 = fingerprints(fullDef);
  for (const id of treeDef.list) assert.equal(fp1[id], fp0[id], id);
  assert.equal(fullDef.list.length - treeDef.list.length, dmIds.length);
});

test('DM8 shape: a magic-weapon garden (3 spokes: 3 dots, a lead-in diamond, a hidden seal, 2 forks), heart, road and Kindling Start', () => {
  const c = full.info.clusters[ID];
  assert.ok(c && c.garden);
  assert.equal(c.prefix, 'dm'); assert.equal(c.emblem, 'flame'); assert.equal(c.heart, 'gt_dragonfire_meteor');
  assert.deepEqual(c.orbit, { tier: 4, angle: 300 }, 'the reserved Meteor slot');
  assert.ok(!full.info.regions.some((r) => r.id === 'r:meteor'), 'the reserved record gives way to the constellation');
  const tiers = computeTierSizes(fullDef).tier;
  assert.deepEqual(c.branchInfo.map((b) => [b.socket, b.evo, b.seal]), [['a', 'wildfire', 'gt_wildfire'], ['b', 'cinder_wyrm', 'gt_cinder_wyrm'], ['c', 'cinder_brand', 'gt_cinder_brand']]);
  for (const b of c.branchInfo) {
    assert.equal(b.lead.length, 3); assert.equal(b.forks.length, 2); assert.ok(b.forks.every((f) => f.length === 3));
    for (const id of b.lead) assert.equal(tiers[id], 'dot', id);
    assert.equal(tiers[b.diamond], 'diamond'); assert.equal(tiers[b.seal], 'landmark');
    assert.deepEqual(fullDef.nodes[b.seal].requires, [b.diamond], 'the lead-in diamond must be bought before the seal');
    assert.equal(fullDef.nodes[b.seal].hidden, true, 'seals stay veiled (recipes hidden)');
  }
  const heart = fullDef.nodes.gt_dragonfire_meteor;
  assert.deepEqual(heart.effects, [{ unlock: 'weapon', id: ID }]);
  assert.equal(heart.unlock.t, 'killEnemy'); assert.ok(data.enemies[heart.unlock.id]);
  assert.equal(heart.cost.gold, 200);
  assert.deepEqual(heart.requires, ['dm_way5'], 'reached by its own road (a gold-only way in)');
  for (const g of ['gt_wildfire', 'gt_cinder_wyrm', 'gt_cinder_brand']) assert.deepEqual(fullDef.nodes[g].effects, [{ unlock: 'evolution', id: g.slice(3) }]);
  assert.deepEqual(fullDef.nodes.gt_wildfire.unlock, { t: 'evolveWeapon', id: 'any', n: 4 });
  assert.deepEqual(fullDef.nodes.dm_kindling.effects, [{ perk: 'kindle', weapon: ID, pct: 25, secs: 60, pe: 0.1 }]);
  assert.deepEqual(fullDef.nodes.dm_kindling.requires, ['gt_dragonfire_meteor']);
  // the medallion picture exists and is allow-listed
  assert.ok(Object.hasOwn(MANIFEST, 'flame')); assert.equal(resolveMedallion('flame'), 'flame');
});

test('DM8 stat nodes per the spec: 8 x +2% (Impact, Blaze, Embers, Fireballs, two each), 2 x -2% volley cooldown, 2 x Burn +3%', () => {
  const c = full.info.clusters[ID];
  const lead = c.branchInfo.flatMap((b) => [...b.lead, b.diamond]);
  const effs = lead.flatMap((id) => fullDef.nodes[id].effects);
  const two = {};
  for (const e of effs) if (e.weapon === ID && e.pct === 2) two[e.stat] = (two[e.stat] || 0) + 1;
  assert.deepEqual(two, { area: 2, duration: 2, power: 2, count: 2 });
  assert.equal(effs.filter((e) => e.weapon === ID && e.stat === 'cooldown' && e.pct === -2).length, 2);
  assert.deepEqual(['dm_kindle', 'dm_kindle2'].map((id) => fullDef.nodes[id].effects), [[{ status: 'burn', pct: 3 }], [{ status: 'burn', pct: 3 }]]);
  // forks: small (1%) and two zero-power keepsakes each, like the sibling gardens
  for (const b of c.branchInfo) {
    const fe = b.forks.flat().flatMap((id) => fullDef.nodes[id].effects);
    assert.equal(fe.filter((e) => e.echo === b.evo).length, 2);
    assert.ok(fe.every((e) => e.echo !== undefined || Math.abs(e.pct) === 1));
  }
  // budget: inside the rule on the full tree (no ceiling raise needed), and the Kindling set still counts once
  const b = budgetOf(compileTree(full.v2, data), full.info.core.budget, Object.keys(full.info.clusters).length);
  assert.deepEqual(b.violations, []);
  assert.ok(b.combatAtCap <= full.info.core.budget.base.combat);
  assert.ok(Math.abs(b.worstSustainPE - 5) < 1e-9);
});

test('DM8 volley cooldown hook: only a fixed-cd weapon takes a tree "cooldown" stat; the Meteor volley really is 4% quicker', () => {
  assert.ok(hasTreeStat(data.weapons[ID], 'cooldown'));
  assert.ok(hasTreeStat(data.weapons.chain_lightning, 'cooldown'), 'a real Cooldown card stat');
  assert.ok(!hasTreeStat(data.weapons.holy_orbit, 'cooldown') && !hasTreeStat(data.weapons[ID], 'speed') && !hasTreeStat(null, 'cooldown'));
  const agg = aggregateMods({ dm_quick: 1, dm_steady: 1 }, fullDef, data);
  assert.ok(agg.weaponBonus[ID].cooldown.pct < 0 && agg.weaponBonus[ID].cooldown.pct >= -4);
  const launches = (bonus) => {
    const dd = { ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } } };
    const sim = new Sim({ data: dd, characterId: 'wren', seed: 3, godMode: true });
    sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
    sim.debugGrant(ID, {});
    const w = sim.weapons.find((x) => x.id === ID); w.bonus = bonus;
    const e = sim.spawnEnemy('dummy', sim.player.x + 120, sim.player.y); e.hp = e.maxHp = 1e9;
    const out = []; const o = sim.pushEvent.bind(sim); sim.pushEvent = (t, x) => { if (t === 'ember' && (!out.length || sim.time - out[out.length - 1] > 0.1)) out.push(sim.time); return o(t, x); };
    for (let i = 0; i < 6 * 60; i++) sim.step(1 / 60, {});
    return [out[0], out.find((t) => t > out[0] + 1)]; // 'ember' also fires on impact: the next volley is the first event a second later
  };
  const a = launches(null), b = launches({ cooldown: { add: 0, pct: -4 } }), z = launches({ cooldown: { add: 0, pct: -999 } });
  assert.ok(Math.abs((a[1] - a[0]) - 2.6) < 0.03, `base gap ${a[1] - a[0]}`);
  assert.ok(Math.abs((b[1] - b[0]) - 2.6 * 0.96) < 0.03, `-4% gap ${b[1] - b[0]}`);
  assert.ok(z[1] - z[0] >= 1.3 - 0.03, 'a forged bonus is clamped at -50%');
});

test('DM8 hostile saves: Meteor ids or a dm fragment in a save are dropped while unreleased; nothing unlocks the weapon', () => {
  const forged = { gt_dragonfire_meteor: 1, gt_wildfire: 1, dm_blaze: 1, dm_kindle: 1, dm_kindling: 1, sp_reroll1: 1 };
  const clean = sanitizeTree(forged, { runs: 50, kills: 1e6 }, treeDef, data);
  for (const id of Object.keys(forged)) if (id !== 'sp_reroll1') assert.ok(!clean || !(id in clean), id);
  const agg = aggregateMods(forged, treeDef, data);
  assert.ok(!agg.unlocks || !(agg.unlocks.weapons || []).includes(ID));
  assert.ok(!agg.weaponBonus || !agg.weaponBonus[ID]);
  // a compact save carrying the dm fragment (as the full tree would write it) decodes to nothing on the players' tree
  const enc = encodeTree({ gt_dragonfire_meteor: 1, dm_blaze: 1, dm_crash: 1 }, fullDef, fullDef.treeVersion);
  assert.ok(enc.o && enc.o.dm, 'the full tree writes a dm fragment');
  const dec = decodeTree(enc, treeDef);
  assert.deepEqual(Object.keys(dec.tree).filter((id) => id.startsWith('dm_') || NEW_GATES.includes(id)), []);
  for (const v of ['__proto__', 'constructor']) { const o = JSON.parse(`{"o":{"${v}":"AAAA","dm":"////"}}`); assert.doesNotThrow(() => decodeTree(o, treeDef)); }
});

test('DM8 codex: weapon + evolution keys already appended; Ophimber gets a reserved pet slot; Lucinda a hero bit; nothing reordered', () => {
  for (const k of ['c:dragonfire_meteor', 'e:wildfire', 'e:cinder_wyrm', 'e:cinder_brand']) assert.ok(ENTRY_KEYS.includes(k), k);
  assert.equal(ENTRY_KEYS[ENTRY_KEYS.length - 1], 'p:ophimber');
  assert.equal(tabOfKey('p:ophimber'), 'heroes');
  const lu = data.hiddenCharacters ? data.hiddenCharacters.hearthwarden : null;
  const bit = (lu || {}).codexBit;
  assert.ok(Number.isInteger(bit) && bit >= ENTRY_KEYS.length && bit < 256, `hearthwarden codexBit ${bit}`);
  for (const c of Object.values(data.characters)) assert.notEqual(c.codexBit, bit);
});
