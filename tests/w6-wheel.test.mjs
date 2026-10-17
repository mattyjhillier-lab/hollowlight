// Wheel A: Judgement Wheel = Bursting Lights (docs/design/evolutions-second-review.md 4.5, LOCKED): spin x1.8, blast 34 px + 3 px per
// Orbit size rank, dmg 1.5x, rest 1.2 s, per-foe blast gate 0.1 s, Burn from blasts, guard contraction inherited, a burst ring never a planted wheel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { data, measureRatios } from '../scripts/evo-same-ranks.mjs';

const DT = 1 / 60;
const mk = (ranks, evo = 'judgement_wheel', seed = 5) => {
  const sim = new Sim({ data, characterId: 'elias', seed, godMode: true });
  sim.weapons.length = 0;
  sim.ability.cdLeft = 1e9;
  sim.rollDrops = () => {};
  sim.debugGrant('holy_orbit', ranks, evo);
  return sim;
};
const R = (o = {}) => ({ count: 1, power: 2, radius: 1, speed: 2, ...o });
const dummy = (sim, dx, dy) => { const e = sim.spawnEnemy('dummy', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = 1e9; e.speed = 0; e.dmg = 0; return e; };
const run = (sim, secs, f) => { for (let i = 0; i < secs / DT; i++) { sim.step(DT, {}); if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; } if (f) f(sim); } };

test('Wheel: blast radius = 34 px + 3 px per Orbit size rank (the gold rim sits 3 px outside)', () => {
  for (const rank of [0, 2, 5]) {
    const sim = mk(R({ radius: rank }));
    const r0 = 38 + 6 * rank;
    dummy(sim, r0 + 3, 0);
    let seen = null;
    run(sim, 3, (s) => { const f = s.fx.find((x) => x.kind === 'ring' && x.color === '#ffd98a'); if (f && !seen) seen = f.r; });
    assert.ok(seen !== null, `no blast at rank ${rank}`);
    assert.equal(seen, 34 + 3 * rank + 3);
  }
});

test('Wheel: a blast hits a foe near the light but not touching it, and sets it alight; far foes are untouched', () => {
  const sim = mk(R());
  const touch = dummy(sim, 38 + 6 + 3, 0);
  const near = dummy(sim, 38 + 6 + 3, 30); // ~30 px from the touched foe, inside the blast
  const far = dummy(sim, -120, 0);
  run(sim, 1.5);
  assert.ok(touch.hp < touch.maxHp, 'touched foe hurt');
  assert.ok(near.hp < near.maxHp || near.burnTot > 0, 'blast reached the near foe');
  assert.equal(far.hp, far.maxHp);
  assert.ok((sim.burnBy.holy_orbit || 0) > 0, 'Burn from blasts is tagged to Holy Orbit');
});

test('Wheel: each light rests 1.2 s after a burst and the ring never plants anything', () => {
  const sim = mk(R({ count: 0 }));
  dummy(sim, 38 + 6 + 3, 0);
  let t0 = null, rest = 0;
  run(sim, 4, (s) => {
    const u = s.units.filter((x) => x.kind === 'orb');
    if (t0 === null && u.some((x) => x.disabledT > 1.1)) t0 = s.time;
    if (u.some((x) => x.disabledT > 0)) rest = Math.max(rest, ...u.map((x) => x.disabledT));
    assert.equal(s.zones.length, 0, 'no planted zone');
    for (const x of u) assert.ok(Math.hypot(x.x - s.player.x, x.y - s.player.y) <= 60, 'lights stay on the ring');
  });
  assert.ok(t0 !== null, 'a light burst');
  assert.ok(Math.abs(rest - 1.2) < 0.03, `rest ${rest}`);
});

test('Wheel: the guard contraction is inherited (ring closes on a hugging foe), the Candle Wheel never applies Burn', () => {
  const sim = mk(R({ radius: 4 }));
  dummy(sim, sim.player.r + 8 + 2, 0);
  run(sim, 2.5);
  assert.ok(sim.weapons[0].rt.gK > 0.9, 'ring closed');
  const s2 = mk(R());
  s2.ability.cdLeft = 0; s2.useAbility();
  run(s2, 0.8);
  const u = s2.units.find((x) => x.kind === 'orb');
  dummy(s2, u.x - s2.player.x, u.y - s2.player.y);
  run(s2, 1);
  assert.equal(s2.burnBy.holy_orbit || 0, 0, 'locked lights burst but never burn');
});

test('Wheel: spin x1.8 over the base ring', () => {
  const a = mk(R()), b = mk(R(), null);
  run(a, 1); run(b, 1);
  assert.ok(Math.abs(a.weapons[0].rt.ang / b.weapons[0].rt.ang - 1.8) < 0.01);
});

test('Wheel: boss >= 1.0x of the base ring at max ranks, hug DPS >= 25% of ring DPS, never below base', () => {
  const boss = (evo) => {
    const sim = mk({ count: 5, power: 5, radius: 5, speed: 5 }, evo);
    const b = sim.spawnEnemy('elder_treant', sim.player.x + 70, sim.player.y);
    b.hp = b.maxHp = 1e12; const h = b.hp; run(sim, 25); return h - b.hp;
  };
  assert.ok(boss('judgement_wheel') / boss(null) >= 1.0, 'boss ratio');
  const go = (hug) => {
    const sim = mk({ count: 5, power: 2, radius: 5, speed: 2 });
    const e = dummy(sim, 0, 0);
    e.x = sim.player.x + (hug ? e.r + sim.player.r + 2 : 38 + 30); e.y = sim.player.y;
    const h = e.hp; run(sim, 10); return (h - e.hp) / 10;
  };
  assert.ok(go(true) >= 0.25 * go(false));
  const res = measureRatios({ secs: 10, seeds: [1], modes: ['pair', 'max'], only: ['judgement_wheel'] }).judgement_wheel;
  for (const m of ['pair', 'max']) for (const [sc, c] of Object.entries(res[m])) assert.ok(c.ratio >= 0.98, `${m} ${sc} ${c.ratio}`);
});

// Cap at pick (pair 5, others 1): <= 3.0x in the immortal stream scenarios. The Wheel's AoE blast against a one-light base ring is far over
// it in stream40 (LOCKED W6 records the measured numbers and two alternatives). Listed so the guard flips to failing if it changes.
test('Wheel: cap at pick is known over 3x only in stream40 (flips when the alternatives are applied)', () => {
  const res = measureRatios({ secs: 10, seeds: [1], modes: ['pair'], only: ['judgement_wheel'] }).judgement_wheel.pair;
  assert.ok(res.single.ratio <= 3.0 && res.stream10.ratio <= 3.0, `single/stream10 ${res.single.ratio} ${res.stream10.ratio}`);
  assert.ok(res.stream40.ratio > 3.0, `stream40 now ${res.stream40.ratio}: it passes the cap, remove this expectation`);
});

test('Wheel is deterministic', () => {
  const go = () => { const sim = mk(R({ count: 3 }), 'judgement_wheel', 9); for (let i = 0; i < 10; i++) dummy(sim, 40 + i * 4, i * 5 - 25); run(sim, 4); return [sim.dmgBy.holy_orbit, sim.burnBy.holy_orbit, sim.rng.next()]; };
  assert.deepEqual(go(), go());
});
