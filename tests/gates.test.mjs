// G1a gate plumbing: tree-gated evolutions (weapons were gated already). Nothing shipped is gated yet,
// so these use data copies that opt in. See docs/design/g1-review.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data as base, treeDef as realDef } from './helpers.mjs';
import { compileTree, aggregateMods, respec, buy, sanitizeTree, closestUnlocks, presetTree } from '../src/meta/tree.js';
import { availableEvolutions, buildPool, goldCards, newWeapon, evoOpen } from '../src/sim/cards.js';
import { Sim } from '../src/sim/Sim.js';
import { defaultSave, sanitize } from '../src/save/schema.js';

const gd = { ...base, evolutions: { ...base.evolutions, phantom_stampede: { ...base.evolutions.phantom_stampede, treeGate: true } } };
const B = { branches: { spirit: { name: 'S', angle: 90 } } };
const node = (id, extra = {}) => ({ id, name: id, desc: 'd', branch: 'spirit', ring: 1, ang: 0, cost: { gold: 10 }, effects: [{ mod: 'damage', pct: 5 }], ...extra });
const gate = (id = 'g_ps', extra = {}) => node(id, { ring: 2, effects: [{ unlock: 'evolution', id: 'phantom_stampede' }], ...extra });
const raw = (nodes) => ({ ...B, nodes });
const comp = (nodes, d = gd) => compileTree(raw(nodes), d);

const wolf = (ranks) => { const w = newWeapon('ghost_wolves', gd.weapons.ghost_wolves); Object.assign(w.ranks, ranks); return w; };
const maxed = () => wolf({ speed: 5, power: 5 });
const ctx = (weapons, set) => ({ weapons, data: gd, banished: new Set(), unlockedEvolutions: set });
const entry = (pool, key) => pool.find((p) => p.card.key === key);
const OPEN = () => new Set(['phantom_stampede']);

test('T1 evolution unlock compiles and aggregates', () => {
  const d = comp([gate()]);
  assert.deepEqual(aggregateMods({ g_ps: 1 }, d, gd).unlocks.evolutions, ['phantom_stampede']);
  assert.deepEqual(aggregateMods({}, d, gd).unlocks.evolutions, []);
  assert.equal(new Sim({ data: gd, seed: 1, tree: aggregateMods({ g_ps: 1 }, d, gd) }).unlockedEvolutions.has('phantom_stampede'), true);
  assert.equal(new Sim({ data: gd, seed: 1 }).unlockedEvolutions.size, 0);
});

test('T2 compileTree rejects unknown evolution id', () => {
  assert.throws(() => comp([node('x', { effects: [{ unlock: 'evolution', id: 'nope' }] })]), /unknown evolution/);
  assert.throws(() => comp([node('x', { effects: [{ unlock: 'evolution', id: '__proto__' }] })]), /unknown evolution|unlock needs an id/);
});

test('T3 rejects unlock node with maxRank>1', () => {
  assert.throws(() => comp([gate('g_ps', { maxRank: 2 })]), /maxRank 1/);
});

test('T4 rejects unreachable gated content, dead unlock nodes and gate nodes hanging off stat nodes', () => {
  assert.throws(() => comp([node('a')]), /no unlocking node/);
  assert.throws(() => compileTree(raw([gate()]), base), /not gated/);
  const gw = { ...gd, weapons: { ...gd.weapons, raven_flock: { ...gd.weapons.raven_flock, treeGate: true } } };
  assert.throws(() => comp([gate()], gw), /raven_flock.*no unlocking node/);
  assert.throws(() => comp([node('a'), gate('g_ps', { requires: ['a'] })]), /only require other unlock nodes/);
  const gw2 = { ...gd, weapons: { ...gd.weapons, ghost_wolves: { ...gd.weapons.ghost_wolves, treeGate: true } } };
  comp([gate('g0', { effects: [{ unlock: 'weapon', id: 'ghost_wolves' }] }), gate('g_ps', { requires: ['g0'], ang: 40 })], gw2); // chained gates are fine
});

test('T5 locked evolution: no gold card even with pair maxed', () => {
  const w = maxed();
  assert.deepEqual(availableEvolutions(w, gd, new Set()), []);
  assert.deepEqual(goldCards(ctx([w], new Set())), []);
  assert.deepEqual(goldCards(ctx([w], undefined)), []);
});

test('T6 locked evolution: no pair nudge, evoHints excludes it (no recipe leak)', () => {
  const locked = buildPool(ctx([wolf({})], new Set()));
  const open = buildPool(ctx([wolf({})], OPEN()));
  assert.equal(entry(locked, 's:ghost_wolves:speed').w, 1);
  assert.equal(entry(open, 's:ghost_wolves:speed').w, base.balance.evoNudge.pair);
  assert.equal(entry(locked, 's:ghost_wolves:speed').card.evoHints, 0);
  assert.equal(entry(open, 's:ghost_wolves:speed').card.evoHints, 1);
  // the partner-rank bonus must not apply to a locked pair either: power weight differs only because dire_alpha (ungated) pairs it
  const a = entry(buildPool(ctx([wolf({ speed: 3 })], new Set())), 's:ghost_wolves:power').w;
  const b = entry(buildPool(ctx([wolf({ speed: 3 })], OPEN())), 's:ghost_wolves:power').w;
  assert.ok(a < b, `locked ${a} < open ${b}`);
});

test('T7 unlocked evolution: gold card returns', () => {
  assert.deepEqual(availableEvolutions(maxed(), gd, OPEN()), ['phantom_stampede']);
  assert.deepEqual(goldCards(ctx([maxed()], OPEN())).map((c) => c.evoId), ['phantom_stampede']);
});

test('T8 availableEvolutions without a set is fail-closed; ungated stay open', () => {
  assert.deepEqual(availableEvolutions(maxed(), gd), []);
  assert.deepEqual(availableEvolutions(maxed(), base), ['phantom_stampede']);
  assert.equal(evoOpen({ treeGate: true }, 'x', null), false);
  assert.equal(evoOpen({}, 'x'), true);
});

test('T9 respec keeps unlock nodes and refunds the rest', () => {
  const d = comp([node('a'), gate('g_ps', { cost: { gold: 300 } })]);
  const save = { ...defaultSave(), gold: 1000, shards: 0 };
  assert.ok(buy(save, 'a', d, gd).ok && buy(save, 'g_ps', d, gd).ok);
  assert.equal(save.gold, 690);
  const refund = respec(save, d);
  assert.deepEqual(save.tree, { g_ps: 1 });
  assert.equal(refund.gold, 10);
  assert.equal(save.gold, 700);
  assert.deepEqual(respec(save, d), { gold: 0, shards: 0 });
  assert.deepEqual(aggregateMods(save.tree, d, gd).unlocks.evolutions, ['phantom_stampede']);
});

test('T10 bad grant evo / weapon / ranks are ignored (no crash)', () => {
  const s = new Sim({ data: base, seed: 1 });
  const w = s.debugGrant('ghost_wolves', { power: 99, nope: 3 }, 'not_real');
  assert.equal(w.evo, null);
  assert.equal(w.ranks.power, base.balance.maxRank);
  assert.equal(Object.hasOwn(w.ranks, 'nope'), false);
  assert.equal(s.debugGrant('ghost_wolves', {}, 'sanctum_halo').evo, null, 'evolution of another weapon rejected');
  assert.equal(s.debugGrant('__proto__'), null);
  assert.equal(s.debugGrant('ghost_wolves', {}, 'phantom_stampede').evo, 'phantom_stampede');
  assert.doesNotThrow(() => s.result());
});

test('T15 forged gate node is dropped; save.unlocks and prototype keys never unlock anything', () => {
  const d = comp([gate('g_ps', { unlock: { t: 'evolveWeapon', id: 'ghost_wolves', n: 1 } })]);
  assert.deepEqual(sanitizeTree({ g_ps: 1 }, {}, d, gd), {}, 'unmet condition');
  assert.deepEqual(sanitizeTree({ g_ps: 1 }, { evolved: { phantom_stampede: 1 } }, d, gd), { g_ps: 1 }, 'met condition');
  assert.deepEqual(sanitizeTree(JSON.parse('{"__proto__":{"g_ps":1},"constructor":1}'), {}, d, gd), {});
  const forged = sanitize({ ...defaultSave(), unlocks: { phantom_stampede: true, raven_flock: true }, tree: { g_ps: 1 } });
  assert.deepEqual(aggregateMods(sanitizeTree(forged.tree, forged.stats, d, gd), d, gd).unlocks.evolutions, [], 'save.unlocks is not a gate source');
  const sim = new Sim({ data: gd, seed: 1, tree: aggregateMods(sanitizeTree(forged.tree, forged.stats, d, gd), d, gd) });
  assert.equal(sim.unlockedEvolutions.size, 0);
});

test('T16 v2 save with owned nodes loads unchanged after G1a', () => {
  const owned = { su_key: 1, sp_reroll1: 1 };
  const clean = sanitizeTree(owned, defaultSave().stats, realDef, base);
  const out = sanitize(JSON.parse(JSON.stringify({ ...defaultSave(), gold: 5, tree: owned })));
  assert.equal(out.version, 2);
  assert.deepEqual(out.tree, clean);
  assert.ok(Object.keys(clean).length >= 1);
});

test('closestUnlocks reveals names once progress has begun (same rule as describeNode)', () => {
  const save = { ...defaultSave(), stats: { ...defaultSave().stats, killsByEnemy: { wolf: 1, crow: 1, root_crawler: 1 } } };
  const rows = closestUnlocks(realDef, save, base, 99);
  assert.ok(rows.length > 0);
  for (const r of rows) assert.notEqual(r.name, '???');
});

test('presetTree skips gate nodes unless asked', () => {
  const d = comp([node('a'), gate()]);
  assert.deepEqual(Object.keys(presetTree(d, 'full')), ['a']);
  assert.deepEqual(Object.keys(presetTree(d, 'full', true)).sort(), ['a', 'g_ps']);
});
