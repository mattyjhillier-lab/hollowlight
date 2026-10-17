// G1b: the shipped data flip. Run 1 = Ghost Wolves + Holy Orbit + 2 starter evolutions; the rest is behind
// 16 permanent gate nodes (docs/design/progression-gates-v1.md, g1-review.md T11-T16).
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { aggregateMods, sanitizeTree, describeNode, closestUnlocks, respec, buy, compileTree } from '../src/meta/tree.js';
import { Sim } from '../src/sim/Sim.js';
import { buildPool, goldCards, newWeapon } from '../src/sim/cards.js';
import { defaultSave } from '../src/save/schema.js';

const gatedW = Object.keys(data.weapons).filter((w) => data.weapons[w].treeGate).sort();
const gatedE = Object.keys(data.evolutions).filter((e) => data.evolutions[e].treeGate).sort();
const gateNodes = def.list.filter((i) => def.nodes[i].permanent);
const gateOf = (kind, id) => gateNodes.filter((n) => def.nodes[n].effects.some((e) => e.unlock === kind && e.id === id));
const weaponKeys = (sim) => {
  const s = new Set();
  for (let i = 0; i < 60; i++) { sim.beginLevelUp(); for (const c of sim.offer.cards) if (c.kind === 'weapon') s.add(c.weaponId); }
  return s;
};
const withNodes = (ids) => aggregateMods(Object.fromEntries(ids.map((i) => [i, 1])), def, data);

test('T11 starter pool: Wren sees only holy_orbit as a weapon card, Elias only ghost_wolves', () => {
  assert.deepEqual([...weaponKeys(new Sim({ data, characterId: 'wren', seed: 3 }))], ['holy_orbit']);
  assert.deepEqual([...weaponKeys(new Sim({ data, characterId: 'elias', seed: 3 }))], ['ghost_wolves']);
});

test('T12 starter evolutions are exactly howling_legion + sanctum_halo; 3 weapons + 13 evolutions are gated; heroes open', () => {
  const open = Object.keys(data.evolutions).filter((e) => !data.evolutions[e].treeGate).sort();
  assert.deepEqual(open, ['howling_legion', 'sanctum_halo']);
  assert.deepEqual(gatedW, ['chain_lightning', 'raven_flock', 'spirit_bolts']);
  assert.equal(gatedE.length, 13);
  assert.ok(Object.values(data.characters).every((c) => !c.treeGate), 'Wren + Elias are both open at launch');
});

test('T13 every gated weapon/evolution has exactly one gate node; gate nodes are permanent, hub-attached, cheap, no shards', () => {
  assert.equal(gateNodes.length, 16);
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

test('locked evolution: pair maxed in a starter run gives no gold card; owning the gate node restores it', () => {
  const mkSim = (tree) => { const s = new Sim({ data, characterId: 'wren', seed: 5, tree }); s.debugGrant('ghost_wolves', { power: 5, speed: 5 }); return s; };
  assert.deepEqual(goldCards(mkSim(null).cardCtx), []);
  const open = mkSim(withNodes(['gt_phantom_stampede']));
  assert.deepEqual(goldCards(open.cardCtx).map((c) => c.evoId), ['phantom_stampede']);
  // a starter evolution still works with no tree at all
  const starter = new Sim({ data, characterId: 'wren', seed: 5 });
  starter.debugGrant('ghost_wolves', { count: 5, duration: 5 });
  assert.deepEqual(goldCards(starter.cardCtx).map((c) => c.evoId), ['howling_legion']);
});

test('locked evolution: its stat gets no pair nudge or hint in the real pool', () => {
  const s = new Sim({ data, characterId: 'wren', seed: 5 });
  const speed = buildPool(s.cardCtx).find((p) => p.card.key === 's:ghost_wolves:speed');
  assert.equal(speed.w, 1, 'speed is only in the locked phantom_stampede pair, so no nudge');
  assert.equal(speed.card.evoHints, 0);
  const o = new Sim({ data, characterId: 'wren', seed: 5, tree: withNodes(['gt_phantom_stampede']) });
  assert.equal(buildPool(o.cardCtx).find((p) => p.card.key === 's:ghost_wolves:speed').w, data.balance.evoNudge.pair);
});

test('owning a weapon gate node adds that weapon card to the pool; its evolution stays locked without its own node', () => {
  const s = new Sim({ data, characterId: 'wren', seed: 3, tree: withNodes(['gt_raven_flock']) });
  assert.deepEqual([...weaponKeys(s)].sort(), ['holy_orbit', 'raven_flock']);
  const w = newWeapon('raven_flock', data.weapons.raven_flock);
  w.ranks.count = 5; w.ranks.range = 5;
  const sim = new Sim({ data, seed: 2, tree: withNodes(['gt_raven_flock']) });
  sim.weapons.push(w);
  assert.deepEqual(goldCards(sim.cardCtx), [], 'murder_storm still needs its own gate node');
});

test('T15 forged save: gate nodes whose condition is unmet are dropped; met ones kept; junk keys ignored', () => {
  const forged = Object.fromEntries(gateNodes.map((i) => [i, 1]));
  assert.deepEqual(sanitizeTree(forged, defaultSave().stats, def, data), {});
  const stats = { ...defaultSave().stats, evolved: { howling_legion: 1, sanctum_halo: 1 } };
  assert.deepEqual(Object.keys(sanitizeTree(forged, stats, def, data)).sort(), ['gt_judgement_wheel', 'gt_phantom_stampede']);
  assert.deepEqual(sanitizeTree(JSON.parse('{"__proto__":{"gt_raven_flock":1},"gt_nope":1}'), stats, def, data), {});
});

test('respec keeps gate nodes in the real tree and refunds the rest', () => {
  const save = { ...defaultSave(), gold: 1e6, shards: 0, stats: { ...defaultSave().stats, evolved: { howling_legion: 1 } } };
  assert.ok(buy(save, 'su_bond', def, data).ok && buy(save, 'gt_phantom_stampede', def, data).ok);
  respec(save, def);
  assert.deepEqual(save.tree, { gt_phantom_stampede: 1 });
});

test('removing a gate node makes compileTree fail (unreachable content)', () => {
  const raw = JSON.parse(JSON.stringify(data.tree));
  raw.nodes = raw.nodes.filter((n) => n.id !== 'gt_soul_lance');
  assert.throws(() => compileTree(raw, data), /soul_lance.*no unlocking node/);
});
