// DM4 Wildfire ablation: Wildfire vs plain Dragonfire Meteor at the SAME ranks in sparse / crowd / boss (read-only, nothing written).
// sparse = 5 slow immortal walkers spread 60-190 px out; crowd = 40 immortal walkers (as stream40); boss = Elder Treant walking in (damage on the boss only).
// Modes: max (all ranks 5) and pair (area + duration 5, the rest at balance.evoTriggerRanks spread). Usage: node scripts/wildfire-ablate.mjs [seeds=8] [secs=20]
import { Sim } from '../src/sim/Sim.js';
import { data, ranksFor } from './evo-same-ranks.mjs';

const SEEDS = Number(process.argv[2] || 8), SECS = Number(process.argv[3] || 20), DT = 1 / 60;
const W = 'dragonfire_meteor', E = 'wildfire';
function run(evo, mode, scen, seed) {
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant(W, ranksFor(W, E, mode), evo);
  const p = sim.player;
  let boss = null;
  const ring = (n, r0, r1) => { for (let i = 0; i < n; i++) { const a = sim.rng.range(0, 6.2832), d = r0 + sim.rng.next() * (r1 - r0); sim.spawnEnemy('walker', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); } };
  if (scen === 'sparse') ring(5, 60, 190);
  else if (scen === 'crowd') ring(40, 25, 170);
  else { sim.time = 600; boss = sim.spawnEnemy('elder_treant', p.x + 70, p.y); }
  let dealt = 0; const orig = sim.hurt.bind(sim);
  sim.hurt = (e, a, o = {}) => { const r = orig(e, a, o); if (sim._src === W && (!boss || e === boss)) dealt += r; return r; };
  const secs = scen === 'boss' ? 40 : SECS;
  for (let t = 0; t < secs / DT; t++) {
    sim.step(DT, {});
    if (scen !== 'boss') for (const e of sim.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 14) { const a = sim.rng.range(0, 6.2832); e.x = p.x + Math.cos(a) * 170; e.y = p.y + Math.sin(a) * 170; }
    if (boss && boss.dead) { return dealt / (t * DT); }
  }
  return dealt / secs;
}
const stat = (f) => { const v = Array.from({ length: SEEDS }, (_, i) => f(i + 1)); const m = v.reduce((a, b) => a + b, 0) / v.length; return { m, lo: Math.min(...v), hi: Math.max(...v) }; };
console.log(`Wildfire vs Dragonfire Meteor, same ranks, ${SEEDS} seeds, ${SECS} s (boss 40 s). ratio = wildfire / base [min-max of per-seed ratios]`);
for (const mode of ['max', 'pair']) for (const scen of ['sparse', 'crowd', 'boss']) {
  const rs = Array.from({ length: SEEDS }, (_, i) => { const b = run(null, mode, scen, i + 1), v = run(E, mode, scen, i + 1); return { b, v, r: b > 0 ? v / b : v > 0 ? Infinity : 1 }; });
  const m = (k) => rs.reduce((a, x) => a + x[k], 0) / rs.length;
  console.log(`${mode.padEnd(5)} ${scen.padEnd(7)} base ${m('b').toFixed(1).padStart(7)}  wildfire ${m('v').toFixed(1).padStart(7)}  ratio ${(m('v') / (m('b') || 1)).toFixed(2)}x [${Math.min(...rs.map((x) => x.r)).toFixed(2)}-${Math.max(...rs.map((x) => x.r)).toFixed(2)}]`);
}
