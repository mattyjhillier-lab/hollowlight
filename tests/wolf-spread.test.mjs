// Ghost Wolves spread rule (LOCKED, Matt playtest 2026-10-20): the pack hunts DIFFERENT foes; no pile-up while free foes exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/Sim.js';

const L = (n) => JSON.parse(readFileSync(new URL(`../src/data/${n}.json`, import.meta.url), 'utf8'));
const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, L(n)]));
data.enemies.dummy = { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 };
data.chapters = { cursed_forest: { ...data.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } };
const DT = 1 / 60;
const mk = (count) => {
  const sim = new Sim({ data, characterId: 'wren', seed: 1, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('ghost_wolves', { count, speed: 1, power: 1, duration: 1 }, null);
  return sim;
};
const foes = (sim, n, rad = 90) => { for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; sim.spawnEnemy('dummy', sim.player.x + Math.cos(a) * rad, sim.player.y + Math.sin(a) * rad); } };
const wolves = (sim) => sim.units.filter((u) => u.kind === 'wolf' && !u.dead);
const ids = (sim) => wolves(sim).map((u) => u.target && u.target.id);
const run = (sim, secs) => { for (let i = 0; i < secs / DT; i++) sim.step(DT, {}); };

test('enough foes in range: every wolf has its OWN target', () => {
  for (const [count, n] of [[3, 6], [5, 8], [7, 12]]) {
    const sim = mk(count); foes(sim, n); run(sim, 3);
    const t = ids(sim);
    assert.equal(wolves(sim).length >= 3, true);
    assert.equal(new Set(t).size, t.length, `${wolves(sim).length} wolves, ${n} foes: ${t}`);
    assert.ok(t.every((x) => x != null));
  }
});

test('fewer foes than wolves: the pack spreads over every foe, none left free', () => {
  const sim = mk(5); foes(sim, 2); run(sim, 3);
  const t = ids(sim);
  assert.equal(new Set(t).size, 2);
  const c = [...new Set(t)].map((id) => t.filter((x) => x === id).length);
  assert.ok(Math.max(...c) - Math.min(...c) <= 1, `uneven ${c}`);
});

test('a lone foe (the boss case) still takes the whole pack', () => {
  const sim = mk(5); foes(sim, 1); run(sim, 3);
  assert.equal(new Set(ids(sim)).size, 1);
});

test('leash: a foe far from the hero is not hunted; a wandering target is dropped', () => {
  const sim = mk(3);
  const far = sim.spawnEnemy('dummy', sim.player.x + 320, sim.player.y);
  run(sim, 2);
  assert.ok(ids(sim).every((x) => x == null), 'far foe ignored');
  assert.ok(!far.dead);
  const near = sim.spawnEnemy('dummy', sim.player.x + 100, sim.player.y);
  run(sim, 1);
  assert.ok(ids(sim).every((x) => x === near.id));
  near.x = sim.player.x + 400; run(sim, 1);
  assert.ok(ids(sim).every((x) => x == null || x !== near.id), 'dropped past the leash');
});

test('a free foe is preferred over a claimed one even if the claimed one is nearer', () => {
  const sim = mk(2);
  const a = sim.spawnEnemy('dummy', sim.player.x + 40, sim.player.y);
  const b = sim.spawnEnemy('dummy', sim.player.x - 120, sim.player.y);
  run(sim, 2);
  assert.deepEqual(new Set(ids(sim)), new Set([a.id, b.id]));
});
