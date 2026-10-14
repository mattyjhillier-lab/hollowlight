// Evolution DPS probe: maxed base weapon vs each evolution against static dummy swarms (god mode, no waves).
// Usage: node scripts/evo-dps.mjs [seconds=30]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
const data = {
  ...base,
  enemies: { ...base.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 },
    walker: { name: 'Walker', hp: 1e9, speed: 40, dmg: 0, r: 7, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  chapters: { cursed_forest: { ...base.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } },
};
const SECS = Number(process.argv[2] || 30);
// single = one static boss-like target 30px out; stream10/stream40 = walkers that march at the player, recycled to a 170px ring on contact (a steady horde)
const SCEN = { single: ['dummy', 1], stream10: ['walker', 10], stream40: ['walker', 40] };

function measure(weaponId, evo, scen, seed) {
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0;
  const def = data.weapons[weaponId];
  const ranks = Object.fromEntries(Object.keys(def.stats).map((k) => [k, base.balance.maxRank]));
  sim.debugGrant(weaponId, ranks, evo);
  const [type, n] = SCEN[scen];
  const p = sim.player;
  for (let i = 0; i < n; i++) {
    const a = sim.rng.range(0, 6.2832);
    const d = n === 1 ? 30 : 25 + sim.rng.next() * 145;
    sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
  }
  const DT = 1 / 60;
  let d0 = 0;
  for (let t = 0; t < (SECS + 3) / DT; t++) {
    if (t === Math.round(3 / DT)) d0 = sim.damageDealt;
    sim.step(DT, {});
    if (type === 'walker') for (const e of sim.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 14) { const a = sim.rng.range(0, 6.2832); e.x = p.x + Math.cos(a) * 170; e.y = p.y + Math.sin(a) * 170; }
  }
  return (sim.damageDealt - d0) / SECS;
}

const avg = (weaponId, evo, scen) => [1, 2, 3].reduce((s, sd) => s + measure(weaponId, evo, scen, sd), 0) / 3;
const rows = [];
for (const [wid] of Object.entries(data.weapons)) {
  const b = Object.fromEntries(Object.keys(SCEN).map((s) => [s, avg(wid, null, s)]));
  rows.push({ id: `${wid} (maxed base)`, ...b, ratio: null });
  for (const [eid, e] of Object.entries(data.evolutions)) {
    if (e.weapon !== wid) continue;
    const v = Object.fromEntries(Object.keys(SCEN).map((s) => [s, avg(wid, eid, s)]));
    rows.push({ id: `  ${eid}`, ...v, ratio: Object.fromEntries(Object.keys(SCEN).map((s) => [s, v[s] / b[s]])) });
  }
}
console.log('DPS over', SECS, 's vs static dummies. single=1 static target, stream10 / stream40 = marching horde');
for (const r of rows) {
  const f = (v) => v.toFixed(0).padStart(6);
  console.log(`${r.id.padEnd(34)} ${Object.keys(SCEN).map((s) => f(r[s]) + (r.ratio ? ` (${r.ratio[s].toFixed(2)}x)` : '         ')).join('  ')}`);
}
