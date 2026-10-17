import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { refreshStats } from '../src/sim/cards.js';

// W1b: wolf base speed 90 -> 110 (r5 170) so rank-0 wolves keep up with a running Wren.
const DT = 1 / 60;
function lag(speedBase) {
  const d = structuredClone(data);
  d.weapons.ghost_wolves.stats.speed.base = speedBase;
  d.chapters.cursed_forest = { ...d.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 };
  const sim = new Sim({ data: d, characterId: 'wren', seed: 3, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('ghost_wolves', { count: 0, power: 0, speed: 0, duration: 0 });
  for (const w of sim.weapons) refreshStats(w, sim.data);
  sim.time = 480;
  let maxD = 0, sumD = 0, n = 0;
  for (let i = 0; i < 30 / DT; i++) {
    for (let k = sim.enemies.length; k < 60; k++) {
      const a = sim.rng.range(0, 6.28), r = 160 + 60 * sim.rng.next();
      sim.spawnEnemy(sim.rng.chance(0.5) ? 'wolf' : 'crow', sim.player.x + Math.cos(a) * r, sim.player.y + Math.sin(a) * r);
    }
    sim.step(DT, { x: 1, y: 0.2 });
    if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; }
    for (const u of sim.units) if (!u.dead) { const dd = Math.hypot(u.x - sim.player.x, u.y - sim.player.y); maxD = Math.max(maxD, dd); sumD += dd; n++; }
  }
  return { maxD, avgD: sumD / Math.max(1, n) };
}

test('wolf speed data: base 110, +12/rank, r5 170', () => {
  const s = data.weapons.ghost_wolves.stats.speed;
  assert.equal(s.base, 110);
  assert.equal(s.base + s.perRank * 5, 170);
});

test('wolf-speed-keeps-up: rank-0 wolves stay near a running Wren and beat the old 90 speed', () => {
  const now = lag(data.weapons.ghost_wolves.stats.speed.base);
  const old = lag(90);
  assert.ok(now.avgD < 140, `avg lag ${now.avgD}`);
  assert.ok(now.maxD < 250, `max lag ${now.maxD}`);
  assert.ok(now.avgD < old.avgD - 10, `new ${now.avgD} vs old ${old.avgD}`);
});

// W7rem: Wolf speed also shortens the bite gap by 4% per rank (rank 0 unchanged).
import { rateMult, hintText } from '../src/sim/cards.js';
test('wolf speed rate: +4% bite rate per rank, rank 0 neutral, hint honest', () => {
  const def = data.weapons.ghost_wolves;
  assert.equal(def.stats.speed.rate, 0.04);
  assert.equal(rateMult(def, 'speed', 0), 1);
  assert.ok(Math.abs(rateMult(def, 'speed', 5) - 1.2) < 1e-9);
  assert.ok(hintText(def, 'speed', 1).includes('bite 4% faster'));
});
test('wolf speed rate: rank-5 speed bites more often than rank 0 (same other ranks)', () => {
  const bites = (sp) => {
    const d = structuredClone(data);
    d.enemies.dummy = { name: 'D', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 };
    d.chapters.cursed_forest = { ...d.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 };
    const sim = new Sim({ data: d, characterId: 'wren', seed: 5, godMode: true });
    sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
    sim.debugGrant('ghost_wolves', { count: 0, power: 0, speed: sp, duration: 0 });
    sim.spawnEnemy('dummy', sim.player.x + 20, sim.player.y);
    const e = sim.enemies[0]; const hp0 = e.hp;
    for (let i = 0; i < 600; i++) sim.step(1 / 60, {});
    return hp0 - e.hp;
  };
  const a = bites(0), b = bites(5);
  assert.ok(b > a * 1.1, `${a} vs ${b}`);
});
