// Ablation on the live tree: which parts still drive the win rate after the stat soft cap, and how much do the hero ability and the
// evolutions add? All gated weapons open. Runs on the LIVE bot (dodge, Blessings, Bond, map events) via scripts/live-probe.mjs.
// Targets (LOCKED): abilities a modest share of power (ability on - off about +2 to +5 win points per characters-v2.md 5.1; scripts/ability-ablate.mjs
// is the per-starting-weapon paired version); evolutions 1.8-2.3x base (scripts/evo-*.mjs measure that directly, this row shows the run-level effect).
// Usage: node scripts/gates-ablate.mjs [seeds=32] [scale=1]   (random bot; full-tree runs are the slow ones: ~15 s each on a loaded 6-core PC, so 32 seeds = 448 runs; pass 10-16 for a quick look)
import { runLive, summarise } from './live-probe.mjs';

const seeds = Number(process.argv[2] || 32);
const scale = Number(process.argv[3] || 1);
const heroes = ['wren', 'elias'], SIG = { wren: 'ghost_wolves', elias: 'holy_orbit' };
const T = (strip = []) => ({ open: true, soft: true, scale, strip });
const rows = [
  { name: `soft x${scale}, everything`, tree: 'full', spec: T() },
  { name: '  minus safety nets (rerolls, revive, heal)', tree: 'full', spec: T(['rerolls', 'revive', 'heal']) },
  { name: '  minus perks (rush, evoLuck)', tree: 'full', spec: T(['perks']) },
  { name: '  minus ability tree nodes (cd, dur)', tree: 'full', spec: T(['ability']) },
  { name: '  hero ability never used (bot)', tree: 'full', spec: T(), ability: false },
  { name: '  no gated evolutions (starter evo stays)', tree: 'full', spec: T(['evos']) },
  { name: '  stats only (strip all groups)', tree: 'full', spec: T(['rerolls', 'revive', 'perks', 'auto', 'heal', 'ability']) },
];
const jobs = [];
for (const row of rows) for (const hero of heroes) for (let seed = 1; seed <= seeds; seed++) jobs.push({ key: `${row.name}|${hero}`, hero, weapon: SIG[hero], seed, tree: row.tree, spec: row.spec, ability: row.ability });
const res = await runLive(jobs);
console.log(`seeds=${seeds}, live bot (random picks), Twilight, Bond 0, soft cap scale ${scale}, all gates open (win% +-SE | median level | first evo | evolutions/run)`);
console.log(`${'row'.padEnd(36)} ${heroes.map((h) => h.padStart(26)).join(' ')}`);
for (const row of rows) console.log(`${row.name.padEnd(36)} ${heroes.map((h) => { const s = summarise(res.get(`${row.name}|${h}`)); return `${String(s.win).padStart(3)}% +-${s.se} L${s.lvl} ${s.evo} e${s.nEvo}`.padStart(26); }).join(' ')}`);
