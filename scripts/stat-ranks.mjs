// Stat-rank probe (read-only, analysis only): for every base weapon and every stat, DPS at ranks 0..5
// with the other three stats held at a mid-run rank (default 2), in single / swarm / kite scenarios.
// Also reports the bleed share of Ghost Wolves damage, and Pouncing Pack coverage (distinct targets, leap/maul time).
// Usage: node scripts/stat-ranks.mjs [others=2] [seeds=2] [filter]
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
const DT = 1 / 60;
const OTHERS = Number(process.argv[2] ?? 2);
const SEEDS = Number(process.argv[3] ?? 2);
const FILTER = process.argv[4] || '';

const ring = (sim, type, n, r0, r1) => {
  const p = sim.player;
  for (let i = 0; i < n; i++) {
    const a = sim.rng.range(0, 6.2832);
    const d = r0 + sim.rng.next() * (r1 - r0);
    sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
  }
};
const refill = (sim, n) => { const k = n - sim.enemies.length; if (k > 0) ring(sim, sim.rng.chance(0.5) ? 'wolf' : 'crow', k, 160, 220); };
function kite(sim) {
  const p = sim.player; let ax = 0, ay = 0;
  for (const e of sim.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 90) { const w = (90 - d) / 90; ax += dx / d * w; ay += dy / d * w; } }
  const c = sim.balance.worldSize / 2; ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004;
  return { x: ax, y: ay };
}
const SCEN = {
  single: { secs: 20, setup: (s) => ring(s, 'dummy', 1, 30, 30), input: () => ({}) },
  // sparse: six static foes 95-145 px out (an early, thin wave): shows reach stats (Raven Watch) that crowds hide
  sparse: { secs: 20, setup: (s) => ring(s, 'dummy', 6, 95, 145), input: () => ({}) },
  swarm: { secs: 25, setup: (s) => { s.time = 480; refill(s, 60); }, tick: (s) => refill(s, 60), input: () => ({}) },
  kite: { secs: 25, setup: (s) => { s.time = 480; refill(s, 60); }, tick: (s) => refill(s, 60), input: (s) => kite(s) },
};

export function run(wid, ranks, evo, scen, seed) {
  const sc = SCEN[scen];
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.patches = []; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant(wid, ranks, evo);
  sc.setup(sim);
  const m = { eff: 0, bleed: 0, hitsTaken: 0, frames: 0, distinct: 0, wolfFrames: 0, leap: 0, maul: 0, unitFrames: 0 };
  const orig = sim.hurt.bind(sim);
  sim.hurt = (e, a, o = {}) => {
    if (!e.dead && a > 0) { const eff = Math.min(a, Math.max(0, e.hp)); m.eff += eff; if (o.silent) m.bleed += eff; }
    return orig(e, a, o);
  };
  const dp = sim.damagePlayer.bind(sim); sim.damagePlayer = (a) => { if (sim.player.iframes <= 0) m.hitsTaken++; return dp(a); };
  const n = Math.round(sc.secs / DT);
  for (let i = 0; i < n; i++) {
    if (sc.tick) sc.tick(sim);
    sim.step(DT, sc.input(sim));
    if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; }
    m.frames++;
    const wolves = sim.units.filter((u) => !u.dead && u.kind === 'wolf');
    if (wolves.length) {
      const tg = new Set();
      for (const u of wolves) { m.unitFrames++; if (u.leap) m.leap++; else if (u.maul > 0) m.maul++; if (u.target && !u.target.dead) tg.add(u.target.id); }
      m.distinct += tg.size; m.wolfFrames++;
    }
  }
  const secs = m.frames * DT;
  return { dps: m.eff / secs, bleedShare: m.eff ? m.bleed / m.eff : 0, taken: m.hitsTaken / secs,
    distinct: m.wolfFrames ? m.distinct / m.wolfFrames : 0, units: m.wolfFrames ? m.unitFrames / m.wolfFrames : 0,
    leap: m.unitFrames ? m.leap / m.unitFrames : 0, maul: m.unitFrames ? m.maul / m.unitFrames : 0 };
}
const avg = (f) => { let a = null; for (let s = 1; s <= SEEDS; s++) { const r = f(s); if (!a) a = { ...r }; else for (const k in r) a[k] += r[k]; } for (const k in a) a[k] /= SEEDS; return a; };

if (process.argv[1] && process.argv[1].endsWith('stat-ranks.mjs')) {
  console.log(`Stat ranks 0..5 (other stats at rank ${OTHERS}), DPS averaged over ${SEEDS} seeds. Cells: dps (% vs previous rank).`);
  for (const [wid, def] of Object.entries(data.weapons)) {
    if (FILTER && !wid.includes(FILTER)) continue;
    console.log(`\n== ${wid}`);
    for (const stat of Object.keys(def.stats)) {
      for (const scen of Object.keys(SCEN)) {
        const cells = []; let prev = null; let bl = '';
        for (let r = 0; r <= 5; r++) {
          const ranks = Object.fromEntries(Object.keys(def.stats).map((k) => [k, k === stat ? r : OTHERS]));
          const x = avg((sd) => run(wid, ranks, null, scen, sd));
          cells.push(`${Math.round(x.dps).toString().padStart(5)}${prev ? ` (${x.dps >= prev ? '+' : ''}${Math.round((x.dps / prev - 1) * 100)}%)` : '       '}`);
          prev = x.dps || 1e-9;
          if (wid === 'ghost_wolves') bl += ` ${Math.round(x.bleedShare * 100)}`;
        }
        console.log(`  ${stat.padEnd(9)} ${scen.padEnd(7)} ${cells.join(' ')}${bl ? `  | bleed% r0..5:${bl}` : ''}`);
      }
    }
  }
  if (!FILTER || FILTER.includes('wolves')) {
    console.log('\n== Wolves coverage (all stats max): distinct targets held by the pack, share of wolf-time leaping / mauling, hits taken/s');
    const max = Object.fromEntries(Object.keys(data.weapons.ghost_wolves.stats).map((k) => [k, 5]));
    for (const evo of [null, 'phantom_stampede', 'howling_legion', 'dire_alpha']) for (const scen of ['swarm', 'kite']) {
      const x = avg((sd) => run('ghost_wolves', max, evo, scen, sd));
      console.log(`  ${(evo || 'base').padEnd(17)} ${scen.padEnd(6)} dps ${Math.round(x.dps).toString().padStart(4)}  wolves ${x.units.toFixed(1)}  distinct targets ${x.distinct.toFixed(1)}  leap ${Math.round(x.leap * 100)}%  maul ${Math.round(x.maul * 100)}%  bleed ${Math.round(x.bleedShare * 100)}%  taken/s ${x.taken.toFixed(2)}`);
    }
  }
}
