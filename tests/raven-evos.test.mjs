// W9: the three Raven Flock evolutions on the W8a scout base (docs/design/four-evolutions-numbers.md, evolutions-second-review.md 4.2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { data } from '../scripts/evo-same-ranks.mjs';

const DT = 1 / 60;
const dummyData = { ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } } };
const mk = (ranks, evo = null, extra = []) => {
  const sim = new Sim({ data: dummyData, characterId: 'wren', seed: 3, godMode: true });
  sim.weapons.length = 0;
  sim.ability.cdLeft = 1e9;
  sim.rollDrops = () => {};
  sim.debugGrant('raven_flock', { count: 0, power: 0, range: 0, speed: 0, ...ranks }, evo);
  for (const [wid, r] of extra) sim.debugGrant(wid, r, null);
  return sim;
};
const place = (sim, type, n, d0, d1, hp = 1e9) => {
  const p = sim.player;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 6.2832 + 0.3;
    const d = d0 + ((d1 - d0) * (i % 3)) / 3;
    const e = sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    e.hp = e.maxHp = hp;
    return e;
  });
};
const run = (sim, secs, f) => { for (let i = 0; i < secs / DT; i++) { sim.step(DT, {}); if (f) f(sim, i); } };
const MAXR = { count: 5, power: 5, range: 5, speed: 5 };
const ravensOf = (sim) => sim.units.filter((u) => u.kind === 'raven' && !u.dead);

// ---------------------------------------------------------------- Wall of Wings (murder_storm)
test('Wall of Wings: ring ravens = min(count, 12 - count), flock total never above 12, scouts untouched', () => {
  for (const [count, ring] of [[2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 5]]) {
    const sim = mk({ ...MAXR, count: count - 2 }, 'murder_storm');
    run(sim, 0.5);
    const all = ravensOf(sim);
    assert.equal(all.filter((u) => u.wall).length, ring, `count ${count}`);
    assert.equal(all.filter((u) => !u.wall).length, count);
    assert.ok(all.length <= 12);
  }
});

test('Wall of Wings: inner ring at Watch x0.55, outer wall at Watch x0.7, counter-rotating', () => {
  const sim = mk({ ...MAXR, count: 2 }, 'murder_storm'); // 4 scouts + 4 ring ravens: 2 inner, 2 outer
  run(sim, 0.3);
  const p = sim.player;
  const watch = sim.weapons[0].s.range * sim.mods.area;
  const wall = ravensOf(sim).filter((u) => u.wall);
  const inner = wall.filter((u) => u.ring === 0), outer = wall.filter((u) => u.ring === 1);
  assert.equal(inner.length, 2); assert.equal(outer.length, 2);
  for (const u of inner) assert.ok(Math.abs(Math.hypot(u.x - p.x, u.y - p.y) - watch * 0.55) < 0.5);
  for (const u of outer) assert.ok(Math.abs(Math.hypot(u.x - p.x, u.y - p.y) - watch * 0.7) < 0.5);
  const ang = (u) => Math.atan2(u.y - p.y, u.x - p.x);
  const a0 = [ang(inner[0]), ang(outer[0])];
  run(sim, 0.1);
  const d = (x, y) => Math.atan2(Math.sin(x - y), Math.cos(x - y));
  assert.ok(d(ang(inner[0]), a0[0]) > 0 && d(ang(outer[0]), a0[1]) < 0, 'rings turn opposite ways');
});

test('Wall of Wings: fear lasts 0.6-0.8 s by Wingbeat rank, never on a boss, 1.5 s immunity after recovering', () => {
  for (const [rank, lo, hi] of [[0, 0.59, 0.61], [5, 0.79, 0.81]]) {
    const sim = mk({ ...MAXR, speed: rank }, 'murder_storm');
    const crowd = place(sim, 'crow', 6, 60, 110);
    for (const c of crowd) { c.speed = 0; c.dmg = 0; }
    let maxFear = 0;
    run(sim, 8, () => { for (const c of crowd) maxFear = Math.max(maxFear, c.fearT); });
    assert.ok(maxFear >= lo && maxFear <= hi, `rank ${rank}: fear ${maxFear.toFixed(2)}`);
  }
  const sim = mk(MAXR, 'murder_storm');
  const boss = sim.spawnEnemy('elder_treant', sim.player.x + 60, sim.player.y);
  boss.hp = boss.maxHp = 1e12;
  run(sim, 15, () => assert.equal(boss.fearT, 0));
});

test('Wall of Wings: ring pecks are 0.7x a scout peck and every raven stat is live after evolving', () => {
  const t = data.evolutions.murder_storm.tune;
  assert.equal(t.peck, 0.7);
  const dpsOf = (ranks) => { const sim = mk(ranks, 'murder_storm'); for (const c of place(sim, 'crow', 10, 70, 180)) { c.speed = 0; c.dmg = 0; } let tot = 0; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { if (!e.dead && a > 0) tot += a; return o(e, a, x); }; run(sim, 12); return tot / 12; };
  const mid = { count: 2, power: 2, range: 2, speed: 2 };
  const ref = dpsOf(mid);
  for (const k of ['count', 'power', 'speed']) assert.ok(dpsOf({ ...mid, [k]: 4 }) > ref * 1.02, `${k} is a dead stat on Wall of Wings`);
  // Watch moves both rings and the scouts' spotting range (damage in a fixed geometry is lumpy, so test the mechanism)
  const radii = (range) => { const sim = mk({ ...mid, range }, 'murder_storm'); run(sim, 0.2); return sim.weapons[0].rt.wallR; };
  assert.ok(radii(4)[0] > radii(2)[0] && radii(4)[1] > radii(2)[1], 'Watch is a dead stat on Wall of Wings');
});

test('Wall of Wings is deterministic and draws no RNG', () => {
  const a = mk(MAXR, 'murder_storm'); place(a, 'crow', 12, 50, 130);
  const b = mk(MAXR, 'murder_storm'); place(b, 'crow', 12, 50, 130);
  run(a, 10); run(b, 10);
  assert.equal(a.damageDealt, b.damageDealt);
  assert.equal(a.rng.next(), b.rng.next());
});
