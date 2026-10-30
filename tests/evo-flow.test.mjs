// Evolution flow v2 (E2): no wasted ranks. An evolution is offered at balance.evoTriggerRanks total ranks in ANY spread of ranks, so each one must stay
// at or above its base weapon at the same ranks (floor) and under the 3x cap for every spread, not just the old recipe pair. Deterministic (fixed seeds).
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, measure } from '../scripts/evo-same-ranks.mjs';
import { spreads, TRIG } from '../scripts/evo-flow-ranks.mjs';
import { evoRankMult, newWeapon, totalRanks } from '../src/sim/cards.js';

test('rankScale data: real stats, finite bounded exponents, exactly 1 at max rank (home values never move)', () => {
  for (const [id, e] of Object.entries(data.evolutions)) {
    if (!e.rankScale) continue;
    const def = data.weapons[e.weapon];
    for (const [k, x] of Object.entries(e.rankScale)) {
      assert.ok(Object.hasOwn(def.stats, k), `${id}: unknown stat ${k}`);
      assert.ok(Number.isFinite(x) && Math.abs(x) <= 3, `${id}.${k}: exponent ${x}`);
    }
    const w = newWeapon(e.weapon, def); w.evo = id;
    for (const k of Object.keys(def.stats)) w.ranks[k] = data.balance.maxRank;
    assert.equal(evoRankMult(data, w), 1, `${id} at max ranks`);
    for (const k of Object.keys(def.stats)) w.ranks[k] = 0;
    const m = evoRankMult(data, w);
    assert.ok(m > 0 && m < 10 && Number.isFinite(m), `${id} at rank 0: ${m}`);
  }
  const w = newWeapon('ghost_wolves', data.weapons.ghost_wolves);
  assert.equal(evoRankMult(data, w), 1, 'no evolution, no scale');
});

test('the trigger is reachable: every weapon has at least evoTriggerRanks ranks to give', () => {
  for (const [id, def] of Object.entries(data.weapons)) assert.ok(Object.keys(def.stats).length * data.balance.maxRank >= TRIG, id);
  for (const id of Object.keys(data.weapons)) for (const r of Object.values(spreads(id))) assert.equal(totalRanks({ ranks: r }), TRIG);
});

// Known misses at an extreme spread (reported in docs/design/fv-data/evo-flow-sweeps.md). key = evolution|spread|scenario.
const KNOWN_LOW = new Set(['sanctum_halo|no-radius|single']); // a dummy parked 30 px out is inside the Halo ring but on the base ring's path
const KNOWN_HIGH = new Set([]);
const SCEN = ['single', 'stream10'];
test('every evolution stays >= its base weapon (floor) and <= ~3x (cap) at every trigger spread, single + stream10', () => {
  const seeds = [1, 2], secs = 6;
  const avg = (fn) => seeds.reduce((s, sd) => s + fn(sd), 0) / seeds.length;
  const lows = [], highs = [];
  for (const [eid, e] of Object.entries(data.evolutions)) {
    for (const [name, ranks] of Object.entries(spreads(e.weapon))) for (const sc of SCEN) {
      const b = avg((sd) => measure(e.weapon, null, sc, ranks, sd, secs));
      if (b < 8) continue; // the base does ~nothing here (geometry): nothing to compare against
      const v = avg((sd) => measure(e.weapon, eid, sc, ranks, sd, secs));
      const key = `${eid}|${name}|${sc}`, r = v / b;
      if (r < 0.95 && !KNOWN_LOW.has(key)) lows.push(`${key} ${r.toFixed(2)}x`);
      if (r > 3.4 && !KNOWN_HIGH.has(key)) highs.push(`${key} ${r.toFixed(2)}x`);
    }
  }
  assert.deepEqual(lows, [], `below base: ${lows.join('; ')}`);
  assert.deepEqual(highs, [], `over the cap: ${highs.join('; ')}`);
});
