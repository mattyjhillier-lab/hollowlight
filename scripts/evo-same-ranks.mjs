// Same-ranks probe: each evolution vs its base weapon at the SAME stat ranks, in static/stream scenarios (god mode, no waves).
// Usage: node scripts/evo-same-ranks.mjs [seconds=20] [seeds=2]   (read-only; exports measureRatios for tests/evo-promises.test.mjs)
// ranks 'max' = every stat maxed; 'pair' = only the evolution's recipe pair maxed, other stats rank 1 (how it first unlocks in a run).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
export const data = {
  ...base,
  enemies: { ...base.enemies,
    dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 },
    walker: { name: 'Walker', hp: 1e9, speed: 40, dmg: 0, r: 7, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  chapters: { cursed_forest: { ...base.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } },
};
export const SCEN = { single: ['dummy', 1], stream10: ['walker', 10], stream40: ['walker', 40] };

export function ranksFor(weaponId, evoId, mode) {
  const def = data.weapons[weaponId];
  const max = base.balance.maxRank;
  const pair = evoId ? data.evolutions[evoId].pair : [];
  return Object.fromEntries(Object.keys(def.stats).map((k) => [k, mode === 'max' || pair.includes(k) ? max : 1]));
}

export function measure(weaponId, evoId, scen, mode, seed, secs) {
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0;
  // 'base' side uses the ranks of the evolution being compared, so both sides have identical stats.
  sim.debugGrant(weaponId, ranksFor(weaponId, evoId ?? measure.cmp, mode), evoId);
  const [type, n] = SCEN[scen];
  const p = sim.player;
  for (let i = 0; i < n; i++) {
    const a = sim.rng.range(0, 6.2832);
    const d = n === 1 ? 30 : 25 + sim.rng.next() * 145;
    sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
  }
  const DT = 1 / 60;
  let d0 = 0;
  for (let t = 0; t < (secs + 3) / DT; t++) {
    if (t === Math.round(3 / DT)) d0 = sim.damageDealt;
    sim.step(DT, {});
    if (type === 'walker') for (const e of sim.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 14) { const a = sim.rng.range(0, 6.2832); e.x = p.x + Math.cos(a) * 170; e.y = p.y + Math.sin(a) * 170; }
  }
  return (sim.damageDealt - d0) / secs;
}

// Returns { [evoId]: { [mode]: { [scen]: { base, evo, ratio } } } }
export function measureRatios({ secs = 20, seeds = [1, 2], modes = ['max', 'pair'], scens = Object.keys(SCEN), only = null } = {}) {
  const avg = (fn) => seeds.reduce((s, sd) => s + fn(sd), 0) / seeds.length;
  const out = {};
  for (const [eid, e] of Object.entries(data.evolutions)) {
    if (only && !only.includes(eid)) continue;
    out[eid] = {};
    for (const mode of modes) {
      out[eid][mode] = {};
      for (const sc of scens) {
        measure.cmp = eid;
        const b = avg((sd) => measure(e.weapon, null, sc, mode, sd, secs));
        const v = avg((sd) => measure(e.weapon, eid, sc, mode, sd, secs));
        out[eid][mode][sc] = { base: b, evo: v, ratio: b > 0 ? v / b : v > 0 ? Infinity : 1 };
      }
    }
  }
  return out;
}

if (process.argv[1]?.endsWith('evo-same-ranks.mjs')) {
  const secs = Number(process.argv[2] || 20);
  const nSeeds = Number(process.argv[3] || 2);
  const res = measureRatios({ secs, seeds: Array.from({ length: nSeeds }, (_, i) => i + 1) });
  console.log(`Evolution vs base at the SAME ranks, DPS over ${secs}s x ${nSeeds} seeds. cell = evo DPS (ratio to base). INF = base does 0.`);
  const f = (c) => `${c.evo.toFixed(0).padStart(5)} (${Number.isFinite(c.ratio) ? c.ratio.toFixed(2).padStart(5) + 'x' : '  INF '})`;
  for (const [eid, modes] of Object.entries(res)) for (const [mode, sc] of Object.entries(modes)) {
    console.log(`${eid.padEnd(18)} ${mode.padEnd(4)} ${Object.keys(sc).map((s) => `${s} ${f(sc[s])}`).join('  ')}`);
  }
}
