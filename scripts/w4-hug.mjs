// W4 probe (analysis only): Holy Orbit with the guard contraction. For Orbit size ranks 0..5 (others at rank OTHERS, default 2):
// ring DPS (immortal dummy parked on the ring), hug DPS (dummy 2 px edge from Elias), boss melee DPS (Elder Treant adjacent),
// and Burn share of Orbit damage in the hug + boss cases. Also reports evolutions (sanctum_halo / judgement_wheel) at pick ranks.
// Usage: node scripts/w4-hug.mjs [others=2] [seconds=12]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
const data = {
  ...base,
  enemies: { ...base.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  chapters: { cursed_forest: { ...base.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } },
};
const OTHERS = Number(process.argv[2] ?? 2);
const SECS = Number(process.argv[3] ?? 12);
const DT = 1 / 60;

function run(ranks, evo, mode) {
  const sim = new Sim({ data, characterId: 'elias', seed: 11, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('holy_orbit', ranks, evo);
  const w = sim.weapons[0];
  const type = mode === 'boss' ? 'elder_treant' : 'dummy';
  const e = sim.spawnEnemy(type, sim.player.x, sim.player.y);
  e.hp = e.maxHp = 1e9; e.speed = 0;
  const ringR = w.s.radius * sim.mods.area * (evo === 'sanctum_halo' ? 1.6 : 1);
  e.x = sim.player.x + (mode === 'ring' ? ringR : e.r + sim.player.r + 2); e.y = sim.player.y;
  const h0 = e.hp;
  for (let i = 0; i < SECS / DT; i++) sim.step(DT, {});
  const dealt = h0 - e.hp;
  return { dps: dealt / SECS, burn: (sim.burnBy.holy_orbit || 0) / Math.max(1, sim.dmgBy.holy_orbit || 1) };
}
const f = (v) => v.toFixed(1).padStart(6);
console.log(`Holy Orbit guard probe (others r${OTHERS}, ${SECS}s). DPS on an immortal target; burn = share of Orbit damage`);
console.log('stat/evo        ring    hug  boss | hug/ring  burn(hug) burn(boss)');
for (let r = 0; r <= 5; r++) {
  const ranks = { count: OTHERS, power: OTHERS, radius: r, speed: OTHERS };
  const a = run(ranks, null, 'ring'), b = run(ranks, null, 'hug'), c = run(ranks, null, 'boss');
  console.log(`radius r${r}      ${f(a.dps)} ${f(b.dps)} ${f(c.dps)} |  ${(b.dps / a.dps).toFixed(2)}     ${(b.burn * 100).toFixed(0)}%      ${(c.burn * 100).toFixed(0)}%`);
}
for (const [evo, pair] of [['sanctum_halo', ['count', 'radius']], ['judgement_wheel', ['power', 'speed']]]) {
  const ranks = { count: OTHERS, power: OTHERS, radius: OTHERS, speed: OTHERS };
  for (const k of pair) ranks[k] = 5;
  const a = run(ranks, evo, 'ring'), b = run(ranks, evo, 'hug'), c = run(ranks, evo, 'boss');
  console.log(`${evo.padEnd(14)} ${f(a.dps)} ${f(b.dps)} ${f(c.dps)} |  ${(b.dps / a.dps).toFixed(2)}     ${(b.burn * 100).toFixed(0)}%      ${(c.burn * 100).toFixed(0)}%`);
}
