// Review scratch probe (weapons-review.md). In-memory data edits only; no files written.
// 1) Dire Alpha single-target ratio at primary multipliers 3.2 / 5.0 / 5.4.
// 2) Rank-0 wolf lag and DPS while the hero runs a circle, wolf speed 90 vs 110.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';
import { refreshStats } from '../src/sim/cards.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const mk = () => {
  const b = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
  b.enemies.dummy = { name: 'D', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 };
  b.chapters.cursed_forest = { ...b.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 };
  return b;
};
const DT = 1 / 60;
function run(data, ranks, evo, setup, input, secs) {
  const sim = new Sim({ data, characterId: 'wren', seed: 3, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('ghost_wolves', ranks, evo);
  for (const w of sim.weapons) refreshStats(w, sim.data);
  setup(sim);
  let dmg = 0, maxD = 0, sumD = 0, n = 0;
  const h = sim.hurt.bind(sim); sim.hurt = (e, a, o) => { if (!e.dead) dmg += Math.min(a, e.hp); return h(e, a, o); };
  for (let i = 0; i < secs / DT; i++) {
    if (setup.tick) setup.tick(sim);
    sim.step(DT, input(i * DT));
    if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; }
    for (const u of sim.units) if (!u.dead) { const d = Math.hypot(u.x - sim.player.x, u.y - sim.player.y); maxD = Math.max(maxD, d); sumD += d; n++; }
  }
  return { dps: dmg / secs, maxD, avgD: sumD / Math.max(1, n) };
}
const MAX = { count: 5, power: 5, speed: 5, duration: 5 };
const single = (s) => s.spawnEnemy('dummy', s.player.x + 30, s.player.y);
for (const m of [3.2, 5.0, 5.4]) {
  const d = mk(); const base = run(d, MAX, null, single, () => ({}), 20).dps;
  d.evolutions.dire_alpha.tune.dmg = m; const ev = run(d, MAX, 'dire_alpha', single, () => ({}), 20).dps;
  console.log(`dire_alpha single primary x${m}: ${ev.toFixed(0)} vs base ${base.toFixed(0)} = ${(ev / base).toFixed(2)}x`);
}
const swarm = (s) => { s.time = 480; };
swarm.tick = (s) => { const k = 60 - s.enemies.length; for (let i = 0; i < k; i++) { const a = s.rng.range(0, 6.28), r = 160 + 60 * s.rng.next(); s.spawnEnemy(s.rng.chance(0.5) ? 'wolf' : 'crow', s.player.x + Math.cos(a) * r, s.player.y + Math.sin(a) * r); } };
const straight = () => ({ x: 1, y: 0.2 });
for (const spd of [90, 110]) {
  const d = mk(); d.weapons.ghost_wolves.stats.speed.base = spd;
  const r0 = { count: 0, power: 0, speed: 0, duration: 0 };
  const a = run(d, r0, null, swarm, straight, 30);
  console.log(`wolves r0 speed ${spd} running straight in swarm: dps ${a.dps.toFixed(1)} avgDist ${a.avgD.toFixed(0)} maxDist ${a.maxD.toFixed(0)}`);
}
