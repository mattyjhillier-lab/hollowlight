// W7b Lightfoot Pack (Light Trails, id phantom_stampede): trail rules in the sim. Deterministic, no RNG.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/Sim.js';

const L = (n) => JSON.parse(readFileSync(new URL(`../src/data/${n}.json`, import.meta.url), 'utf8'));
const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, L(n)]));
data.enemies.dummy = { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 };
data.chapters = { cursed_forest: { ...data.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } };
const DT = 1 / 60;
const mk = (ranks = { count: 3, speed: 5, power: 5, duration: 5 }, seed = 1) => {
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('ghost_wolves', ranks, 'phantom_stampede');
  return sim;
};
const W = (sim) => sim.weapons[0];
const run = (sim, secs, input = () => ({})) => { for (let i = 0; i < secs / DT; i++) sim.step(DT, input(sim)); };
const walkRight = () => ({ x: 1, y: 0 });
const park = (sim) => { for (const u of sim.units) { u.retarget = 99; u.target = null; u.x = sim.player.x - 20; u.y = sim.player.y; u.lx = u.x; u.ly = u.y; } };

test('data: Lightfoot Pack has the trail keys and none of the leap/pin/maul keys; texts are honest', () => {
  const e = data.evolutions.phantom_stampede;
  assert.equal(e.name, 'Lightfoot Pack');
  assert.match(e.desc, /trail of light that bleeds/);
  for (const k of ['leapHit', 'leapCd', 'maul', 'dmg']) assert.equal(e.tune[k], undefined, k);
  for (const k of ['space', 'ttl0', 'ttlPer', 'hw0', 'hwPer', 'trailHit', 'gate', 'cap']) assert.ok(Number.isFinite(e.tune[k]), k);
});

test('trail points: lifetime 1.2 + 0.22 x Wolf speed rank, half-width 5 + 0.8 x rank', () => {
  for (const s of [1, 5]) {
    const sim = mk({ count: 3, speed: s, power: 1, duration: 1 });
    sim.spawnEnemy('dummy', sim.player.x + 120, sim.player.y);
    run(sim, 2);
    const tr = W(sim).rt.trail;
    assert.ok(tr.length > 0, 'trail exists');
    for (const q of tr) assert.ok(Math.abs(q.hw - (5 + 0.8 * s)) < 1e-9, `hw rank ${s}`);
    const maxT = Math.max(...tr.map((q) => q.t));
    assert.ok(maxT <= 1.2 + 0.22 * s + 1e-9 && maxT > 0, `ttl rank ${s}: ${maxT}`);
  }
  // a fresh point carries the full lifetime
  const sim = mk({ count: 1, speed: 5, power: 1, duration: 1 });
  sim.spawnEnemy('dummy', sim.player.x + 300, sim.player.y);
  let fresh = 0;
  for (let i = 0; i < 120; i++) { const n0 = (W(sim).rt.trail || []).length; sim.step(DT, {}); const tr = W(sim).rt.trail; if (tr.length > n0) fresh = Math.max(fresh, tr[tr.length - 1].t); }
  assert.ok(Math.abs(fresh - 2.3) < 1e-6, `fresh ttl ${fresh}`);
});

test('trail points expire and are only dropped by moving wolves (7 px spacing)', () => {
  const sim = mk({ count: 1, speed: 1, power: 1, duration: 1 });
  sim.spawnEnemy('dummy', sim.player.x + 100, sim.player.y);
  run(sim, 1.5);
  const w = W(sim);
  assert.ok(w.rt.trail.length > 0);
  for (let i = 1; i < w.rt.trail.length; i++) {
    const a = w.rt.trail[i - 1]; const b = w.rt.trail[i];
    if (a.id === b.id) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 7 - 1e-6, 'spacing');
  }
  park(sim);
  for (const q of w.rt.trail) q.t = 0.05;
  const stale = w.rt.trail.slice();
  run(sim, 0.2);
  for (const q of stale) assert.ok(!w.rt.trail.includes(q), 'expired points are gone');
});

test('point cap: live trail points never exceed 360', () => {
  const sim = mk({ count: 6, speed: 5, power: 5, duration: 5 });
  for (let i = 0; i < 40; i++) { const c = sim.spawnEnemy('crow', sim.player.x + (i % 8) * 25 - 100, sim.player.y + Math.floor(i / 8) * 25 - 60); c.hp = c.maxHp = 1e9; c.dmg = 0; }
  let peak = 0;
  for (let i = 0; i < 20 / DT; i++) { sim.step(DT, i % 120 < 60 ? { x: 1, y: 0 } : { x: -1, y: 0 }); peak = Math.max(peak, W(sim).rt.trail.length); }
  assert.ok(peak <= 360, `peak ${peak}`);
  assert.ok(peak > 20);
});

test('per-foe gate: a foe standing in many overlapping trail points takes at most one trail hit per 0.4 s', () => {
  const sim = mk({ count: 1, speed: 3, power: 3, duration: 1 });
  const e = sim.spawnEnemy('dummy', sim.player.x + 200, sim.player.y);
  const w = W(sim);
  w.rt.trail = [];
  const hits = [];
  const orig = sim.hurt.bind(sim);
  sim.hurt = (t, a, o) => { if (t === e && sim._src === 'ghost_wolves' && !o?.silent) hits.push(sim.time); return orig(t, a, o); };
  for (let i = 0; i < 3 / DT; i++) {
    park(sim);
    for (let k = 0; k < 5; k++) w.rt.trail.push({ x: e.x + k, y: e.y, t: 1, hw: 8, id: 0 });
    sim.step(DT, {});
  }
  assert.ok(hits.length >= 6 && hits.length <= 8, `hits ${hits.length}`);
  for (let i = 1; i < hits.length; i++) assert.ok(hits[i] - hits[i - 1] >= 0.4 - 1e-6, 'gap');
});

test('trail hit = 0.24 x bite, scales with Bite power, applies Rend bleed once for 4 s', () => {
  const probe = (power) => {
    const sim = mk({ count: 1, speed: 3, power, duration: 3 });
    const e = sim.spawnEnemy('dummy', sim.player.x + 400, sim.player.y);
    const w = W(sim);
    park(sim);
    w.rt.trail = [{ x: e.x, y: e.y, t: 1, hw: 8, id: 0 }];
    const seen = [];
    const orig = sim.hurt.bind(sim);
    sim.hurt = (t, a, o) => { if (t === e && !o?.silent) seen.push(a); return orig(t, a, o); };
    sim.step(DT, {});
    return { first: seen[0], bite: w.s.power * sim.dmgMult(w), bleedDps: e.bleedDps, bleedT: e.bleedT, rend: w.s.duration };
  };
  const a = probe(1); const b = probe(5);
  assert.ok(Math.abs(a.first - 0.24 * a.bite) < 1e-6, 'trail hit = 0.24 x bite');
  assert.ok(b.first > a.first * 2, 'Bite power raises trail damage');
  assert.ok(Math.abs(b.bleedDps - b.bite * b.rend) < 1e-6, 'bleed = bite x Rend');
  assert.ok(b.bleedT > 3.9 && b.bleedT <= 4, 'bleed time 4 s');
});

test('trails never frighten or pin: a boss only takes damage', () => {
  const sim = mk();
  const boss = sim.spawnEnemy('elder_treant', sim.player.x + 70, sim.player.y);
  boss.hp = boss.maxHp = 1e12;
  for (let i = 0; i < 20 / DT; i++) { sim.step(DT, walkRight()); assert.equal(boss.fearT || 0, 0); assert.ok(!(boss.heldT > 0)); }
  assert.ok(boss.hp < boss.maxHp, 'boss took damage');
});

test('no leap/pin/maul state exists on wolves', () => {
  const sim = mk();
  sim.spawnEnemy('crow', sim.player.x + 80, sim.player.y);
  for (let i = 0; i < 10 / DT; i++) { sim.step(DT, {}); for (const u of sim.units) { assert.equal(u.leap, undefined); assert.equal(u.maul, undefined); } }
});

test('determinism: same seed gives identical trail state and damage', () => {
  const go = () => { const sim = mk(undefined, 7); for (let i = 0; i < 40; i++) sim.spawnEnemy('crow', sim.player.x + 60 + i, sim.player.y + i); run(sim, 8, walkRight); return [sim.damageDealt, W(sim).rt.trail.length, sim.kills]; };
  assert.deepEqual(go(), go());
});

test('no dead stat after evolving: Pack size, Wolf speed, Bite power and Rend all change the evolved output', () => {
  const out = (ranks) => {
    const sim = mk(ranks, 3);
    for (let i = 0; i < 30; i++) { const a = i * 0.7; sim.spawnEnemy('dummy', sim.player.x + Math.cos(a) * 60, sim.player.y + Math.sin(a) * 60); }
    run(sim, 10, () => ({ x: Math.cos(sim.time), y: Math.sin(sim.time) }));
    return sim.damageDealt;
  };
  const base = { count: 3, speed: 3, power: 3, duration: 3 };
  const d0 = out(base);
  for (const k of ['count', 'speed', 'power', 'duration']) assert.ok(out({ ...base, [k]: 5 }) > d0 * 1.02, `${k} must matter`);
});
