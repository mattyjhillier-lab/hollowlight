// G1b: the shipped data flip (updated for CHARACTER SYSTEM v2: run 1 = the starter weapon + its first evolution; every weapon is behind
// its heart: 18 permanent gate nodes) (docs/design/progression-gates-v1.md, g1-review.md T11-T16).
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { aggregateMods, sanitizeTree, describeNode, closestUnlocks, respec, buy, compileTree } from '../src/meta/tree.js';
import { Sim } from '../src/sim/Sim.js';
import { buildPool, goldCards, newWeapon } from '../src/sim/cards.js';
import { defaultSave } from '../src/save/schema.js';

const gatedW = Object.keys(data.weapons).filter((w) => data.weapons[w].treeGate).sort();
const gatedE = Object.keys(data.evolutions).filter((e) => data.evolutions[e].treeGate).sort();
const gateNodes = def.list.filter((i) => def.nodes[i].permanent && !def.nodes[i].effects.some((e) => e.unlock === 'tier')); // weapon / evolution gates (the Night Gate's tier gates are tested in dt1.test.mjs)
const gateOf = (kind, id) => gateNodes.filter((n) => def.nodes[n].effects.some((e) => e.unlock === kind && e.id === id));
const weaponKeys = (sim) => {
  const s = new Set();
  for (let i = 0; i < 60; i++) { sim.beginLevelUp(); for (const c of sim.offer.cards) if (c.kind === 'weapon') s.add(c.weaponId); }
  return s;
};
const withNodes = (ids) => aggregateMods(Object.fromEntries(ids.map((i) => [i, 1])), def, data);

// CHARACTER SYSTEM v2 (LOCKED 2026-10-24): EVERY weapon is a tree gate; a new profile owns only its starter weapon's heart (src/meta/starter.js).
test('T11 starter pool (v2): no tree = no weapon card (the starting spirit is in slot 1); the old launch hearts give Wren Orbit and Elias Wolves', () => {
  assert.deepEqual([...weaponKeys(new Sim({ data, characterId: 'wren', seed: 3 }))], []);
  assert.deepEqual([...weaponKeys(new Sim({ data, characterId: 'elias', seed: 3 }))], []);
  const launch = withNodes(['gt_ghost_wolves', 'gt_holy_orbit']);
  assert.deepEqual([...weaponKeys(new Sim({ data, characterId: 'wren', seed: 3, tree: launch }))], ['holy_orbit']);
  assert.deepEqual([...weaponKeys(new Sim({ data, characterId: 'elias', seed: 3, tree: launch }))], ['ghost_wolves']);
});

test('T12 ungated evolutions are exactly howling_legion + sanctum_halo; all 5 weapons + 13 evolutions are gated; no hero tree gate', () => {
  const open = Object.keys(data.evolutions).filter((e) => !data.evolutions[e].treeGate).sort();
  assert.deepEqual(open, ['howling_legion', 'sanctum_halo']);
  assert.deepEqual(gatedW, ['chain_lightning', 'ghost_wolves', 'holy_orbit', 'raven_flock', 'spirit_bolts']);
  assert.equal(gatedE.length, 13);
  assert.ok(Object.values(data.characters).every((c) => !c.treeGate), 'heroes wake by keepsakes, never by the tree');
});

test('T13 every gated weapon/evolution has exactly one gate node; gate nodes are permanent, hub-attached, cheap, no shards', () => {
  assert.equal(gateNodes.length, 18);
  for (const w of gatedW) assert.equal(gateOf('weapon', w).length, 1, w);
  for (const e of gatedE) assert.equal(gateOf('evolution', e).length, 1, e);
  for (const id of gateNodes) {
    const n = def.nodes[id];
    assert.deepEqual(n.requires, [], `${id} hangs off the hub`);
    assert.equal(n.maxRank, 1);
    assert.ok(n.cost.gold >= 100 && n.cost.gold <= 600 && n.cost.shards === 0, `${id} cost`);
    assert.ok(n.unlock, `${id} has an unlock condition`);
    assert.equal(n.hidden, n.effects[0].unlock === 'evolution', `${id}: evolution gates hidden, weapon gates visible`);
  }
});

test('T14 evolution gate text never names its pair stats (hidden recipes), but names evolution + weapon', () => {
  for (const e of gatedE) {
    const n = def.nodes[gateOf('evolution', e)[0]];
    const evo = data.evolutions[e];
    const text = [n.name, n.desc, n.flavour].join(' ').toLowerCase();
    for (const k of evo.pair) {
      const sname = data.weapons[evo.weapon].stats[k].name.toLowerCase();
      assert.ok(!text.includes(sname), `${n.id} leaks "${sname}"`);
      assert.ok(!new RegExp(`\\b${k}\\b`).test(text), `${n.id} leaks key ${k}`);
    }
    assert.equal(n.name, evo.name);
    assert.ok(n.desc.includes(data.weapons[evo.weapon].name));
  }
});

test('hidden reveal: evolution gates read ??? until progress starts, then show name + weapon; weapon gates always show', () => {
  const save = defaultSave();
  const dire = describeNode(def, save, 'gt_dire_alpha', data);
  assert.equal(dire.name, '???');
  assert.ok(!dire.desc.includes('The Alpha'));
  save.stats.evolved = { howling_legion: 1 };
  const after = describeNode(def, save, 'gt_dire_alpha', data);
  assert.equal(after.name, 'The Alpha (Ghost Wolves)');
  assert.ok(after.desc.includes('Ghost Wolves'));
  assert.ok(closestUnlocks(def, save, data, 99).some((r) => r.id === 'gt_dire_alpha' && r.name === 'The Alpha (Ghost Wolves)'));
  assert.equal(describeNode(def, defaultSave(), 'gt_raven_flock', data).name, 'Raven Flock');
});

test('locked evolution: at the trigger a starter run gets only the free evolution; owning the gate node adds it', () => {
  const mkSim = (tree) => { const s = new Sim({ data, characterId: 'wren', seed: 5, tree }); s.debugGrant('ghost_wolves', { power: 5, speed: 5, duration: 5 }); return s; };
  assert.deepEqual(goldCards(mkSim(null).cardCtx).map((c) => c.evoId), ['howling_legion']);
  const open = mkSim(withNodes(['gt_phantom_stampede']));
  assert.deepEqual(goldCards(open.cardCtx).map((c) => c.evoId).sort(), ['howling_legion', 'phantom_stampede']);
  // below the trigger nothing is offered
  const low = new Sim({ data, characterId: 'wren', seed: 5 });
  low.debugGrant('ghost_wolves', { count: 5, duration: 5 });
  assert.deepEqual(goldCards(low.cardCtx), []);
});

test('flow v2: stat cards in the real pool carry no recipe weight or hint', () => {
  const s = new Sim({ data, characterId: 'wren', seed: 5, tree: withNodes(['gt_phantom_stampede']) });
  for (const p of buildPool(s.cardCtx).filter((x) => x.card.kind === 'stat')) { assert.equal(p.w, 1); assert.equal(p.card.evoHints, undefined); }
});

test('owning a weapon gate node adds that weapon card to the pool; its evolution stays locked without its own node', () => {
  const s = new Sim({ data, characterId: 'wren', seed: 3, tree: withNodes(['gt_raven_flock']) });
  assert.deepEqual([...weaponKeys(s)].sort(), ['raven_flock']);
  const w = newWeapon('raven_flock', data.weapons.raven_flock);
  w.ranks.count = 5; w.ranks.range = 5; w.ranks.speed = 5;
  const sim = new Sim({ data, seed: 2, tree: withNodes(['gt_raven_flock']) });
  sim.weapons.push(w);
  assert.deepEqual(goldCards(sim.cardCtx), [], 'murder_storm still needs its own gate node');
});

test('T15 owned gate nodes are kept whatever the stats say (M1: conditions gate BUYING, never owning); junk keys ignored', () => {
  const forged = Object.fromEntries(gateNodes.map((i) => [i, 1]));
  const stats = { ...defaultSave().stats, evolved: { howling_legion: 1, sanctum_halo: 1 } };
  assert.deepEqual(Object.keys(sanitizeTree(forged, defaultSave().stats, def, data)).sort(), Object.keys(sanitizeTree(forged, stats, def, data)).sort());
  assert.deepEqual(sanitizeTree(JSON.parse('{"__proto__":{"gt_raven_flock":1},"gt_nope":1}'), stats, def, data), {});
});

test('respec keeps gate nodes in the real tree and refunds the rest', () => {
  const save = { ...defaultSave(), gold: 1e6, shards: 0, tree: { gt_ghost_wolves: 1 }, stats: { ...defaultSave().stats, evolved: { howling_legion: 1 } } };
  assert.ok(buy(save, 'su_bond', def, data).ok && buy(save, 'gt_phantom_stampede', def, data).ok);
  respec(save, def);
  assert.deepEqual(save.tree, { gt_ghost_wolves: 1, gt_phantom_stampede: 1 });
});

test('removing a gate node makes compileTree fail (unreachable content)', () => {
  const raw = JSON.parse(JSON.stringify(data.tree));
  raw.nodes = raw.nodes.filter((n) => n.id !== 'gt_soul_lance');
  assert.throws(() => compileTree(raw, data), /soul_lance.*no unlocking node/);
});
