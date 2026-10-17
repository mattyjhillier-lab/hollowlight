// W1a: evolution promises (docs/design/weapons-review.md section 5). Deterministic, no RNG-order dependence on other weapons.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { data, measureRatios, ranksFor } from '../scripts/evo-same-ranks.mjs';

const DT = 1 / 60;
const mk = (evo, weaponId, seed = 3, mode = 'max') => {
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0;
  sim.debugGrant(weaponId, ranksFor(weaponId, evo, mode), evo);
  return sim;
};
const ringAt = (sim, type, n, d0, d1) => {
  const p = sim.player;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + 0.3;
    const d = d0 + ((d1 - d0) * (i % 4)) / 4;
    out.push(sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d));
  }
  return out;
};

// Known promise breakers, encoded so the guard still covers every other evolution and FLIPS TO FAILING if one of these changes by accident.
// key = evolution|rank mode|scenario. Remove an entry when the later chunk fixes it.
const EXPECTED_FAIL = new Set([
]);
const FLOOR = 0.98; // noise allowance on a deterministic 1-seed run

test('no evolution does less than its base weapon at the same ranks (known failures listed)', () => {
  const res = measureRatios({ secs: 10, seeds: [1] });
  const seenFail = new Set();
  for (const [eid, modes] of Object.entries(res)) for (const [mode, scs] of Object.entries(modes)) for (const [sc, c] of Object.entries(scs)) {
    const key = `${eid}|${mode}|${sc}`;
    if (c.ratio < FLOOR) seenFail.add(key);
    if (!EXPECTED_FAIL.has(key)) assert.ok(c.ratio >= FLOOR, `${key}: evolution ${c.evo.toFixed(0)} vs base ${c.base.toFixed(0)} = ${c.ratio.toFixed(2)}x`);
  }
  for (const k of EXPECTED_FAIL) assert.ok(seenFail.has(k), `${k} is listed as expected-fail but now passes: remove it from EXPECTED_FAIL`);
});

test('bosses are never frightened by any weapon or evolution', () => {
  const combos = [];
  for (const [wid, w] of Object.entries(data.weapons)) {
    combos.push([wid, null]);
    for (const [eid, e] of Object.entries(data.evolutions)) if (e.weapon === wid) combos.push([wid, eid]);
  }
  for (const [wid, eid] of combos) {
    const sim = mk(eid, wid);
    const boss = sim.spawnEnemy('elder_treant', sim.player.x + 75, sim.player.y);
    boss.hp = boss.maxHp = 1e12;
    const crowd = ringAt(sim, 'crow', 6, 70, 140);
    for (const c of crowd) c.hp = c.maxHp = 1e12;
    for (let t = 0; t < 20 / DT; t++) {
      sim.step(DT, {});
      assert.equal(boss.fearT, 0, `${eid || wid}: boss frightened at t=${(t * DT).toFixed(1)}s`);
    }
  }
});

test('Wall of Wings (murder_storm) still frightens ordinary enemies (the guard does not disable the wall)', () => {
  const sim = mk('murder_storm', 'raven_flock');
  
  const crowd = ringAt(sim, 'crow', 8, 70, 140);
  for (const c of crowd) { c.hp = c.maxHp = 1e12; c.speed = 0; }
  let frightened = 0;
  for (let t = 0; t < 20 / DT; t++) { sim.step(DT, {}); if (crowd.some((c) => c.fearT > 0)) frightened++; }
  assert.ok(frightened > 0, 'no ordinary enemy was ever frightened');
});

test('Wall of Wings fear cooldown: 1.5 s after an enemy recovers it cannot be re-frightened', () => {
  const sim = mk('murder_storm', 'raven_flock');
  const crowd = ringAt(sim, 'crow', 4, 70, 140);
  for (const c of crowd) { c.hp = c.maxHp = 1e12; c.speed = 0; c.dmg = 0; }
  const state = new Map(crowd.map((c) => [c, { afraid: false, endT: null, starts: 0, minGap: Infinity }]));
  for (let t = 0; t < 40 / DT; t++) {
    sim.step(DT, {});
    for (const c of crowd) {
      const s = state.get(c);
      const afraid = c.fearT > 0;
      if (afraid && !s.afraid) {
        s.starts++;
        if (s.endT !== null) s.minGap = Math.min(s.minGap, sim.time - s.endT);
      }
      if (!afraid && s.afraid) s.endT = sim.time;
      s.afraid = afraid;
    }
  }
  const starts = [...state.values()].reduce((a, s) => a + s.starts, 0);
  assert.ok(starts >= 4, `fear should trigger repeatedly across the crowd (got ${starts})`);
  for (const s of state.values()) assert.ok(s.minGap >= 1.5 - 2 * DT, `re-frightened ${s.minGap.toFixed(2)}s after recovering`);
});

test('Talon Mark (dive_bombers): with enough enemies in range no two concurrent dives share a target', () => {
  const sim = mk('dive_bombers', 'raven_flock');
  const crowd = ringAt(sim, 'crow', 12, 40, 120);
  for (const c of crowd) { c.hp = c.maxHp = 1e12; c.speed = 0; c.dmg = 0; }
  let multi = 0;
  for (let t = 0; t < 30 / DT; t++) {
    sim.step(DT, {});
    const ids = sim.units.filter((u) => u.kind === 'raven' && u.st === 'dive' && u.target && !u.target.dead).map((u) => u.target.id);
    if (ids.length > 1) multi++;
    assert.equal(new Set(ids).size, ids.length, `two ravens diving at one target at t=${(t * DT).toFixed(1)}s`);
  }
  assert.ok(multi > 0, 'test never saw two concurrent dives (not sensitive)');
});

test('W9/W7b/W10 cap at pick: Lightfoot Pack, Wall of Wings, Spearhead, Spirit Tempest, Soul Lance, Returning Pages and Vesper Tide stay <= 3.0x their base (pair 5 + others rank 1) in single, stream10 and stream40', () => {
  for (const eid of ['phantom_stampede', 'murder_storm', 'spearhead', 'spirit_tempest', 'soul_lance', 'returning_pages', 'vesper_tide']) {
    const res = measureRatios({ secs: 10, seeds: [1], modes: ['pair'], only: eid });
    for (const [sc, c] of Object.entries(res[eid].pair)) {
      // Vesper Tide single: the plain ring never reaches a dummy parked at 30 px (base 0), the swell does: no ratio, so cap the absolute DPS instead
      if (c.base === 0) { assert.ok(c.evo < 60, `${eid} ${sc}: base 0, evo ${c.evo.toFixed(0)} DPS`); continue; }
      assert.ok(c.ratio <= 3.0, `${eid} ${sc}: ${c.ratio.toFixed(2)}x at pick`);
    }
  }
});
