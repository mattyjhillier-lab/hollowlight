// DM5 Cinder Wyrm ablation: Wyrm vs plain Dragonfire Meteor at the SAME ranks in sparse / crowd / boss (read-only, nothing written).
// sparse = 5 slow immortal walkers spread 60-190 px out; medium = 14 spread 40-200 px out; crowd = 40 immortal walkers (as stream40); boss = Elder Treant walking in (damage on the boss only).
// Modes: max (all ranks 5) and pair (area + duration 5, the rest at balance.evoTriggerRanks spread). Usage: node scripts/wyrm-ablate.mjs [seeds=8] [secs=20]
import { Sim } from '../src/sim/Sim.js';
import { data, ranksFor } from './evo-same-ranks.mjs';

const SEEDS = Number(process.argv[2] || 8), SECS = Number(process.argv[3] || 20), DT = 1 / 60;
const W = 'dragonfire_meteor', E = 'cinder_wyrm';
if (process.env.TUNE) Object.assign(data.evolutions[E].tune, JSON.parse(process.env.TUNE)); // quick tuning probe: TUNE='{"hitK":1.5}'
const MODES = (process.env.MODES || 'max,pair').split(','), SCENS = (process.env.SCENS || 'sparse,medium,crowd,tight,boss').split(',');
function run(evo, mode, scen, seed) {
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant(W, ranksFor(W, E, mode), evo);
  const p = sim.player;
  let boss = null;
  const ring = (n, r0, r1) => { for (let i = 0; i < n; i++) { const a = sim.rng.range(0, 6.2832), d = r0 + sim.rng.next() * (r1 - r0); sim.spawnEnemy('walker', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); } };
  if (scen === 'sparse') ring(5, 60, 190);
  else if (scen === 'medium') ring(14, 40, 200);
  else if (scen === 'crowd') ring(40, 25, 170);
  else if (scen === 'tight') { for (let i = 0; i < 40; i++) { const a = sim.rng.range(0, 6.2832), d = sim.rng.next() * 60; const e = sim.spawnEnemy('walker', p.x + 120 + Math.cos(a) * d, p.y + Math.sin(a) * d); e.speed = 0; } } // worst case for the cap: 40 packed foes under the loop
  else { sim.time = 600; boss = sim.spawnEnemy('elder_treant', p.x + 110, p.y); } // kited: pushed back out to 110-130 px whenever it reaches 60 px (the base weapon cannot aim inside 50 px)
  let dealt = 0; const orig = sim.hurt.bind(sim);
  sim.hurt = (e, a, o = {}) => { const r = orig(e, a, o); if (sim._src === W && (!boss || e === boss)) dealt += r; return r; };
  const secs = scen === 'boss' ? 40 : SECS;
  for (let t = 0; t < secs / DT; t++) {
    sim.step(DT, {});
    if (scen !== 'boss') for (const e of sim.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 14) { const a = sim.rng.range(0, 6.2832); e.x = p.x + Math.cos(a) * 170; e.y = p.y + Math.sin(a) * 170; }
    if (boss && Math.hypot(boss.x - p.x, boss.y - p.y) < 60) { const a = sim.rng.range(0, 6.2832); boss.x = p.x + Math.cos(a) * 120; boss.y = p.y + Math.sin(a) * 120; }
    if (boss && boss.dead) { return dealt / (t * DT); }
  }
  return dealt / secs;
}
const stat = (f) => { const v = Array.from({ length: SEEDS }, (_, i) => f(i + 1)); const m = v.reduce((a, b) => a + b, 0) / v.length; return { m, lo: Math.min(...v), hi: Math.max(...v) }; };
console.log(`Cinder Wyrm vs Dragonfire Meteor, same ranks, ${SEEDS} seeds, ${SECS} s (boss 40 s). ratio = wyrm / base [min-max of per-seed ratios]`);
for (const mode of MODES) for (const scen of SCENS) {
  const rs = Array.from({ length: SEEDS }, (_, i) => { const b = run(null, mode, scen, i + 1), v = run(E, mode, scen, i + 1); return { b, v, r: b > 0 ? v / b : v > 0 ? Infinity : 1 }; });
  const m = (k) => rs.reduce((a, x) => a + x[k], 0) / rs.length;
  console.log(`${mode.padEnd(5)} ${scen.padEnd(7)} base ${m('b').toFixed(1).padStart(7)}  wyrm ${m('v').toFixed(1).padStart(7)}  ratio ${(m('v') / (m('b') || 1)).toFixed(2)}x [${Math.min(...rs.map((x) => x.r)).toFixed(2)}-${Math.max(...rs.map((x) => x.r)).toFixed(2)}]`);
}
