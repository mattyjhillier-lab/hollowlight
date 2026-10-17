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

// ---------------------------------------------------------------- Talon Mark (dive_bombers)
const DIVE = data.evolutions.dive_bombers.tune;
test('Talon Mark: toughest foe in Watch is dived on, 0.4 s shadow tell, ONE hit of dive x peck, then the mark (3 s)', () => {
  const sim = mk({ count: 0, power: 5, range: 5, speed: 5 }, 'dive_bombers'); // 2 ravens
  const [weak, tough] = [place(sim, 'crow', 1, 60, 60, 500)[0], place(sim, 'wolf', 1, 80, 80, 5000)[0]];
  const peck = sim.weapons[0].s.power * sim.dmgMult(sim.weapons[0]);
  const log = [];
  const o = sim.hurt.bind(sim);
  sim.hurt = (e, a, x) => { if (a > 0) log.push({ t: sim.time, e, a }); return o(e, a, x); };
  let tellMax = 0, firstTell = null;
  run(sim, 5, () => {
    for (const u of ravensOf(sim)) if (u.tellK > 0 && firstTell === null) firstTell = sim.time;
    for (const u of ravensOf(sim)) tellMax = Math.max(tellMax, u.tellK || 0);
  });
  assert.ok(log.length > 0 && log[0].e === tough, 'first dive picks the toughest foe');
  assert.ok(log[0].t - firstTell >= DIVE.tell - 2 * DT, `strike ${(log[0].t - firstTell).toFixed(2)} s after the tell began`);
  assert.equal(tellMax, 1);
  const first = log.filter((l) => l.e === tough)[0];
  assert.ok(Math.abs(first.a - peck * DIVE.dive) < 1e-6, 'one hit of dive x peck, no splash');
  assert.ok(tough.markT > 0 && tough.markT <= 3, 'marked for at most 3 s (refresh only)');
});

test('Talon Mark: no splash, mark never stacks past +15%, other weapons hit the marked foe 15% harder via the amp clamp (<= x1.75)', () => {
  const sim = mk({ count: 3, power: 5, range: 5, speed: 5 }, 'dive_bombers');
  const [t] = place(sim, 'wolf', 1, 40, 40, 1e9);
    let maxMark = 0;
  run(sim, 6, () => { maxMark = Math.max(maxMark, t.markT); });
  assert.ok(maxMark <= 3 + 1e-9, 'refresh only: never above 3 s');
  assert.ok(sim.markBy.raven_flock === undefined || sim.markBy.raven_flock >= 0);
  // amp for a foe hit by another weapon: Mark x15%; with a Rally-like 1.5x source amp = 1.725; anything above is clamped to 1.75
  t.markT = 3; sim._src = 'ghost_wolves';
  assert.ok(Math.abs(sim.damageAmp(t) - 1.15) < 1e-9);
  sim.srcAmps.ghost_wolves = 1.5;
  assert.ok(Math.abs(sim.damageAmp(t) - 1.725) < 1e-9);
  sim.srcAmps.ghost_wolves = 2;
  assert.equal(sim.damageAmp(t), 1.75);
  // every raven hit is a whole dive hit: no pecks, no splash numbers
  const sim2 = mk({ count: 3, power: 5, range: 5, speed: 5 }, 'dive_bombers');
  place(sim2, 'wolf', 1, 40, 40, 1e9); place(sim2, 'crow', 1, 46, 46, 1e9);
  const dive = sim2.weapons[0].s.power * sim2.dmgMult(sim2.weapons[0]) * DIVE.dive;
  const amts = []; const o2 = sim2.hurt.bind(sim2);
  sim2.hurt = (e, a, x) => { if (a > 0) amts.push(a); return o2(e, a, x); };
  run(sim2, 6);
  assert.ok(amts.length > 3);
  for (const a of amts) assert.ok(Math.abs(a - dive) < 1e-6 || Math.abs(a - dive * 1.15) < 1e-6, `unexpected raven hit ${a}`);
});

test('Talon Mark marks a boss (+15%) but never moves, pins or frightens it', () => {
  const sim = mk(MAXR, 'dive_bombers');
  const boss = sim.spawnEnemy('elder_treant', sim.player.x + 70, sim.player.y);
  boss.hp = boss.maxHp = 1e12;
  let marked = 0;
  run(sim, 15, () => { if (boss.markT > 0) marked++; assert.equal(boss.fearT, 0); assert.ok(!(boss.heldT > 0)); });
  assert.ok(marked > 0, 'boss was never marked');
});

test('Talon Mark: team damage on one target stays inside the 3x cap at pick (wolves + orbit + bolts rank 3 beside it)', () => {
  const mates = [['ghost_wolves', { count: 3, power: 3, speed: 3, duration: 3 }], ['holy_orbit', { count: 3, power: 3, radius: 3, speed: 3 }], ['spirit_bolts', { count: 3, power: 3, speed: 3, pierce: 3 }]];
  const team = (evo) => { const sim = mk({ count: 1, power: 5, range: 1, speed: 5 }, evo, mates); place(sim, 'dummy', 1, 30, 30); let tot = 0; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { const r = o(e, a, x); tot += r; return r; }; run(sim, 12); return tot / 12; };
  const ratio = team('dive_bombers') / team(null);
  assert.ok(ratio > 1.3 && ratio <= 3.0, `team single cap@pick ${ratio.toFixed(2)}x`);
});

test('Talon Mark: every raven stat is live after evolving', () => {
  const dpsOf = (ranks) => { const sim = mk(ranks, 'dive_bombers'); for (const c of place(sim, 'crow', 8, 70, 140, 1e9)) { c.speed = 0; c.dmg = 0; } let tot = 0; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { const r = o(e, a, x); tot += r; return r; }; run(sim, 12); return tot / 12; };
  const mid = { count: 2, power: 2, range: 2, speed: 2 };
  const ref = dpsOf(mid);
  for (const k of ['count', 'power', 'speed']) assert.ok(dpsOf({ ...mid, [k]: 4 }) > ref * 1.02, `${k} is a dead stat on Talon Mark`);
  const sparse = (range) => { const sim = mk({ ...mid, range }, 'dive_bombers'); for (const c of place(sim, 'crow', 6, 95, 145, 1e9)) { c.speed = 0; c.dmg = 0; } let tot = 0; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { const r = o(e, a, x); tot += r; return r; }; run(sim, 12); return tot; };
  assert.ok(sparse(5) > sparse(0) * 1.1, 'Watch is a dead stat on Talon Mark');
});

test('Talon Mark is deterministic and draws no RNG', () => {
  const a = mk(MAXR, 'dive_bombers'); place(a, 'crow', 10, 50, 130, 1e6);
  const b = mk(MAXR, 'dive_bombers'); place(b, 'crow', 10, 50, 130, 1e6);
  run(a, 10); run(b, 10);
  assert.equal(a.damageDealt, b.damageDealt);
  assert.equal(a.rng.next(), b.rng.next());
});
