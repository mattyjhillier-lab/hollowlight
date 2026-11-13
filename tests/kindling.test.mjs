// KINDLING START (LOCKED 'STARTING SYNERGY = KINDLING START' + 'NEW VERB DETAILS LOCKED', 2026-11-12): one diamond per weapon constellation;
// the run's STARTER weapon runs 25% faster for the first 60 s, fading linearly to nothing. Paid from the sustain/verb ceiling (5.00) by trimming
// Mending Light (li_heal) hearts heal +5% -> +2.5% (-0.10 PE); the set is worth its largest node (only the starter kindles).
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { aggregateMods, compileTree } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { budgetOf, effectTerms } from '../src/meta/treebudget.js';
import { computeTierSizes } from '../src/meta/treetier.js';
import { Sim } from '../src/sim/Sim.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const W = { ghost_wolves: ['wf_kindling', 8, 1500], holy_orbit: ['or_kindling', 10, 1700], raven_flock: ['rv_kindling', 12, 1850], spirit_bolts: ['bo_kindling', 14, 2000], chain_lightning: ['cl_kindling', 16, 2200] };
const Wn = Object.keys(data.weapons).length;

test('Kindling: one diamond per weapon, lit from its heart, a chain of Chapter 1 clears 8-16, 1,500-2,200 gold', () => {
  const tiers = computeTierSizes(def).tier;
  for (const [w, [id, clears, gold]] of Object.entries(W)) {
    const n = def.nodes[id];
    assert.ok(n, id); assert.equal(n.cluster, w); assert.equal(tiers[id], 'diamond');
    assert.deepEqual(n.requires, [`gt_${w}`]);
    assert.deepEqual(n.unlock, { t: 'clearChapter', id: 'cursed_forest', n: clears });
    assert.equal(n.cost.gold, gold);
    assert.deepEqual(n.effects, [{ perk: 'kindle', weapon: w, pct: 25, secs: 60, pe: 0.1 }]);
    assert.equal(n.name, 'Kindling Start');
    assert.ok(Math.hypot(n.x - def.nodes[`gt_${w}`].x, n.y - def.nodes[`gt_${w}`].y) < 380, `${id} sits beside its heart (no far link)`);
  }
});

test('Kindling budget: sustain/verb stays exactly 5.00 because Mending Light gave up the same 0.10 PE', () => {
  const b = budgetOf(def, def.rule, Wn);
  assert.deepEqual(b.violations, []);
  assert.ok(Math.abs(b.worstSustainPE - 5) < 1e-9, `sustain ${b.worstSustainPE}`);
  assert.deepEqual(def.nodes.li_heal.effects, [{ drop: 'heartHeal', pct: 2.5 }]);
  // the trim equals the new verb: the old li_heal without Kindling is the same 5.00
  const d = { ...def, list: def.list.filter((id) => !/_kindling$/.test(id)), nodes: clone(def.nodes) };
  d.nodes.li_heal.effects = [{ drop: 'heartHeal', pct: 5 }];
  assert.ok(Math.abs(budgetOf(d, def.rule, Wn).worstSustainPE - 5) < 1e-9);
  assert.ok(Math.abs((5 - 2.5) * def.rule.sustain.heartHeal - 0.1) < 1e-12, 'li_heal trim = 0.10 PE');
  // only the starter kindles, so the five nodes count once (largest), never 5 x 0.10
  assert.deepEqual(effectTerms(def.nodes.wf_kindling.effects[0], def.rule).map((t) => [t.cat, t.pool, t.face]), [['kindle', 'sustain', 0.1]]);
  const one = { ...def, list: def.list.filter((id) => !/_kindling$/.test(id) || id === 'wf_kindling') };
  assert.ok(Math.abs(budgetOf(one, def.rule, Wn).worstSustainPE - b.worstSustainPE) < 1e-12);
});

test('Kindling hostile data: bad weapon, out-of-range numbers, extra fields and misplaced diamonds fail compile', () => {
  const C = composeTree(readTreeFiles(), data);
  for (const bad of [{ weapon: 'dragon' }, { weapon: '@summon' }, { pct: 500 }, { secs: 0 }, { pe: 0 }, { pe: undefined }, { evil: 1 }]) {
    const live = clone(C.live);
    const n = live.nodes.find((x) => x.id === 'wf_kindling');
    n.effects = [{ ...n.effects[0], ...bad }]; for (const k of Object.keys(n.effects[0])) if (n.effects[0][k] === undefined) delete n.effects[0][k];
    assert.throws(() => compileTree(live, data), /kindle|out of range|unknown/, JSON.stringify(bad));
  }
  for (const mut of [(x) => { x.requires = ['wf_fang']; }, (x) => { x.place = { at: [0, 0] }; }, (x) => { x.kind = 'knot'; }, (x) => { delete x.requires; }]) {
    const fs = clone(readTreeFiles());
    mut(fs.find((f) => f.path.endsWith('ghost_wolves.json')).json.extras[0]);
    assert.throws(() => composeTree(fs, data), /extra/);
  }
  const fs = clone(readTreeFiles());
  const c = fs.find((f) => f.path.endsWith('ghost_wolves.json')).json; c.extras = [1, 2, 3, 4].map(() => clone(c.extras[0]));
  assert.throws(() => composeTree(fs, data), /extras/);
});

const mk = (tree, o = {}) => new Sim({ data, seed: 5, godMode: true, tree: tree ? aggregateMods(tree, def, data) : null, ...o });
const run = (sim, secs, onTick) => { for (let i = 0; i < secs * 60; i++) { if (sim.state === 'levelup') sim.pickCard(sim.offer.cards[0]?.key ?? sim.offer.gold[0].key); sim.step(1 / 60, { x: Math.sin(i / 70), y: Math.cos(i / 110) }); if (onTick) onTick(sim); } };

test('Kindling sim: x1.25 at the start, x1.125 at 30 s, exactly 1 from 60 s; only the starter weapon; no node = no field', () => {
  const s = mk({ wf_kindling: 1 }, { startWeapon: 'ghost_wolves' });
  assert.ok(s.kindle && s.kindle.w === 'ghost_wolves');
  const wolf = s.weapons.find((w) => w.id === 'ghost_wolves');
  assert.equal(s.kindleMul(wolf), 1.25);
  assert.equal(s.kindleMul({ id: 'holy_orbit' }), 1);
  s.time = s.kindle.t0 + 30; assert.ok(Math.abs(s.kindleMul(wolf) - 1.125) < 1e-12);
  s.time = s.kindle.t0 + 60; assert.equal(s.kindleMul(wolf), 1); assert.equal(s.kindleLeft(), 0);
  s.time = s.kindle.t0 + 900; assert.equal(s.kindleMul(wolf), 1);
  assert.equal(mk({ or_kindling: 1 }, { startWeapon: 'ghost_wolves' }).kindle, null, 'another weapon\'s node does nothing');
  assert.equal(mk(null).kindle, null);
  // a forged tree aggregate is clamped or ignored
  for (const k of [{ ghost_wolves: { pct: 999, secs: 9999 } }, { ghost_wolves: { pct: NaN, secs: 60 } }, { ghost_wolves: { pct: -5, secs: 60 } }, Object.create({ ghost_wolves: { pct: 25, secs: 60 } }), 'x']) {
    const f = new Sim({ data, seed: 5, tree: { kindle: k }, startWeapon: 'ghost_wolves' });
    assert.ok(f.kindle === null || (f.kindle.pct <= 50 && f.kindle.secs <= 120), JSON.stringify(k));
  }
});

test('Kindling is deterministic, byte-identical when not owned, and really speeds the starter during the first minute', () => {
  const sig = (s) => JSON.stringify([s.time, s.player.x, s.player.y, s.player.hp, s.kills, s.level, s.xp, s.weapons.map((w) => [w.id, w.ranks, w.evo])]);
  for (const sw of ['ghost_wolves', 'holy_orbit', 'spirit_bolts', 'chain_lightning', 'raven_flock']) {
    const a = mk(null, { startWeapon: sw }), b = mk({}, { startWeapon: sw });
    run(a, 70); run(b, 70);
    assert.equal(sig(a), sig(b), `${sw}: an empty tree is the fresh run`);
    const node = W[sw][0];
    const k1 = mk({ [node]: 1 }, { startWeapon: sw }), k2 = mk({ [node]: 1 }, { startWeapon: sw });
    run(k1, 70); run(k2, 70);
    assert.equal(sig(k1), sig(k2), `${sw}: deterministic`);
    assert.notEqual(sig(k1), sig(a), `${sw}: the kindled run differs`);
  }
});

import { kindleCue, kindleTint } from '../src/gfx/kindlecue.js';
test('Kindling cue (render only): fades with the window, steady in Calm, nothing for hostile input', () => {
  const a = kindleCue(1, false, 0), b = kindleCue(0.5, true, 3), z = kindleCue(0, false, 1);
  assert.ok(a.on && a.ringA > b.ringA && a.flare > b.flare && b.flare > 1);
  assert.equal(kindleCue(0.5, true, 1).ringA, kindleCue(0.5, true, 2).ringA, 'Calm: no flicker');
  assert.ok(b.trailN < a.trailN, 'Calm: shorter, steady trail');
  for (const v of [NaN, -1, 'x', undefined, Infinity]) assert.ok(!kindleCue(v, false, 0).on || kindleCue(v, false, 0).ringA <= 0.32, String(v));
  assert.equal(z.on, false); assert.equal(z.flare, 1);
  assert.equal(kindleTint(data, 'ghost_wolves'), 0x9fd8ff);
  assert.equal(kindleTint(data, '__proto__'), 0xffd27a); assert.equal(kindleTint(null, 'x'), 0xffd27a);
});
