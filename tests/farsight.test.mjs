// FAR SIGHT (LOCKED 'LAMP-LIGHTER LANDMARK = FAR SIGHT' + 'NEW VERB DETAILS LOCKED', 2026-11-12): a Satchel landmark (co_far) that unlocks
// after 120 lamps lit (banked stats.sites.lamps); owning it shows unlit lamps' rewards as small edge embers. Information only: the sim never reads it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { aggregateMods, conditionProgress, describeNode, nodeStatus } from '../src/meta/tree.js';
import { budgetOf, effectTerms } from '../src/meta/treebudget.js';
import { Sim } from '../src/sim/Sim.js';
import { farSightTargets, arrowTargets, FAR_SIGHT } from '../src/gfx/siteview.js';
import { defaultSave, parseSave, serializeSave } from '../src/save/schema.js';
import { computeTierSizes } from '../src/meta/treetier.js';

const N = def.nodes.co_far;
const ROAD = ['co_seek1', 'co_seek2', 'co_seek3', 'co_seek4', 'co_seek5', 'co_seek6'];

test('Far Sight node: Satchel landmark, 120 lamps, 1800 gold, information only (0 PE, like the Hunter Eye bars), reached by a 6-lantern gold road', () => {
  assert.ok(N, 'co_far exists');
  assert.equal(N.name, 'Far Sight');
  assert.deepEqual(N.unlock, { t: 'lamps', n: 120 });
  assert.equal(N.cost.gold, 1800);
  assert.deepEqual(N.effects, [{ info: 'lamps' }]);
  assert.equal(N.chase, true);
  assert.equal(computeTierSizes(def).tier.co_far, 'landmark');
  for (const id of ROAD) { const r = def.nodes[id]; assert.ok(r && !r.unlock && r.cost.gold >= 250 && r.cost.gold <= 600, id); }
  assert.deepEqual(N.requires, ['co_seek6']);
  assert.deepEqual(def.nodes.co_seek1.requires, ['co_pull']);
  assert.ok(!/Hollowlight|Lamplighter/i.test(`${N.name} ${N.desc}`), 'Elias keeps the Lamplighter title');
  const t = effectTerms(N.effects[0], def.rule); assert.deepEqual(t.map((x) => [x.cat, x.face, x.pool]), [['info', 0, 'none']]);
  const W = Object.keys(data.weapons).length; assert.deepEqual(budgetOf(def, def.rule, W).violations, []);
});

test('Far Sight condition reads the banked lamp count; hostile counters never unlock it or throw', () => {
  const st = (sites) => ({ ...defaultSave().stats, ...(sites === undefined ? {} : { sites }) });
  assert.equal(conditionProgress(N.unlock, st({ lamps: 60 }), def, data).frac, 0.5);
  assert.equal(conditionProgress(N.unlock, st({ lamps: 120 }), def, data).done, true);
  assert.equal(conditionProgress(N.unlock, st({ lamps: 500 }), def, data).lines[0].cur, 120);
  assert.equal(conditionProgress(N.unlock, st({ lamps: 0 }), def, data).lines[0].text, 'Light 120 lamps');
  for (const bad of [undefined, null, 'x', [], { lamps: 'NaN' }, { lamps: -50 }, { lamps: Infinity }, { lamps: NaN }, { __proto__: { lamps: 999 } }]) {
    const p = conditionProgress(N.unlock, st(bad), def, data);
    assert.equal(p.done, false, JSON.stringify(bad)); assert.ok(p.frac >= 0 && p.frac < 1);
  }
  // through the real save parser: a hostile save cannot forge an unlock beyond the clamp, and a clean save round-trips
  const raw = { ...defaultSave(), stats: { ...defaultSave().stats, sites: { lamps: '1e12', evil: 5, roads: -1 } } };
  const s = parseSave(JSON.stringify(raw)).save;
  assert.ok(!s.stats.sites || !(s.stats.sites.lamps > 0), 'string counters are dropped');
  const ok = parseSave(JSON.stringify(serializeSave({ ...defaultSave(), stats: { ...defaultSave().stats, sites: { lamps: 130 } } }))).save;
  assert.equal(ok.stats.sites.lamps, 130);
  assert.equal(nodeStatus(def, { ...ok, tree: {} }, 'co_far', data).cond.done, true);
});

test('Far Sight shows its name and progress as a chase landmark; owning it adds the lamps info flag only', () => {
  const d = describeNode(def, { ...defaultSave(), tree: {} }, 'co_far', data);
  assert.equal(d.masked, false); assert.equal(d.name, 'Far Sight');
  const off = aggregateMods({}, def, data), on = aggregateMods({ co_far: 1 }, def, data);
  assert.ok(!off.info.includes('lamps')); assert.ok(on.info.includes('lamps'));
  const strip = (o) => JSON.stringify({ ...o, info: [] });
  assert.equal(strip(on), strip(off), 'no other effect');
});

test('Far Sight never changes the simulation: same seed with and without the node is byte-identical (sites on)', () => {
  const runOf = (tree) => {
    const sim = new Sim({ data, seed: 11, sites: true, godMode: true, tree: aggregateMods(tree, def, data) });
    for (let i = 0; i < 60 * 70; i++) { if (sim.state === 'levelup') sim.pickCard(sim.offer.cards[0]?.key ?? sim.offer.gold[0].key); sim.step(1 / 60, { x: Math.sin(i / 90), y: Math.cos(i / 130) }); }
    return { sim, sig: JSON.stringify([sim.time, sim.player.x, sim.player.y, sim.player.hp, sim.kills, sim.gold, sim.level, sim.sites.list.map((s) => [s.id, s.state, s.x, s.y])]) };
  };
  const a = runOf({}), b = runOf({ co_far: 1 });
  assert.equal(a.sim.tfx.farSight, false); assert.equal(b.sim.tfx.farSight, true);
  assert.equal(a.sig, b.sig);
});

test('farSightTargets: awake unlit lamps only, off screen, inside the radius, not already arrowed, nearest first, capped', () => {
  const view = { x0: 0, y0: 0, x1: 640, y1: 360 }, p = { x: 320, y: 180 };
  const L = (id, x, y, o = {}) => ({ id, kind: 'lamp', state: 'awake', reward: 'gold', x, y, ...o });
  const list = [L(1, 320 + 700, 180), L(2, 320 - 500, 180, { reward: 'xp' }), L(3, 320, 180 + 400, { reward: 'heart' }), L(4, 320, 180 - 600),
    L(5, 320 + 850, 180 + 100), L(6, 400, 200), L(7, 320 + 2000, 180), L(8, -400, 180, { state: 'done' }), L(9, -400, 200, { state: 'sleep' }),
    { id: 10, kind: 'knot', state: 'awake', x: -300, y: 180 }, L(11, -300, 100, { reward: '<img>' })];
  const sites = { list, active: null };
  const out = farSightTargets(sites, p, view, []);
  assert.deepEqual(out.map((a) => a.s.id), [3, 2, 4, 1], 'nearest four, on-screen / far / done / sleeping / knots / bad rewards skipped');
  assert.ok(out.length <= FAR_SIGHT.cap);
  const arrows = arrowTargets(sites, p, view);
  const out2 = farSightTargets(sites, p, view, arrows);
  for (const a of arrows) assert.ok(!out2.some((e) => e.s === a.s), 'never doubles an edge arrow');
  for (const bad of [null, undefined, {}, { list: 'x' }, { list: [null, 5, 'a'] }]) assert.doesNotThrow(() => farSightTargets(bad, p, view, null));
  assert.deepEqual(farSightTargets({ list: [null, 5] }, p, view, null), []);
  assert.deepEqual(farSightTargets(sites, p, view, [], [], NaN), [], 'a bad radius shows nothing');
});
