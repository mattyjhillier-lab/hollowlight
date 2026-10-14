// Balance sweep: many seeded bot runs, summary table.
// Usage: node scripts/sweep.mjs [characterId] [seeds]   (FOCUS=1 for focused-pick bot)
import { playRun } from './bot.mjs';

const char = process.argv[2] || 'wren';
const seeds = Number(process.argv[3] || 20);
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);

const runs = [];
const s0 = Number(process.env.SEED_FROM || 1);
for (let sd = s0; sd < s0 + seeds; sd++) runs.push(playRun(char, sd));

const wins = runs.filter((r) => r.outcome === 'victory').length;
const deaths = runs.filter((r) => r.outcome !== 'victory').map((r) => r.time);
const evoFirst = runs.map((r) => r.marks.evo).filter((v) => v != null);
const evoCount = runs.map((r) => r.evolved.length);
const levels = runs.map((r) => r.level);
const bossDeaths = runs.filter((r) => r.outcome !== 'victory' && r.time >= 600).length;

console.log(`${char} ${process.env.FOCUS === '1' ? 'FOCUS' : 'random'} x${seeds}`);
console.log(`  win rate        ${Math.round((wins / seeds) * 100)}% (${wins}/${seeds})`);
console.log(`  level median    ${med(levels)} (min ${Math.min(...levels)}, max ${Math.max(...levels)})`);
console.log(`  first evo       median ${fmt(med(evoFirst))} (p10 ${fmt([...evoFirst].sort((a, b) => a - b)[Math.floor(evoFirst.length * 0.1)])}, p90 ${fmt([...evoFirst].sort((a, b) => a - b)[Math.floor(evoFirst.length * 0.9)])}), ${evoFirst.length}/${seeds} runs evolved at all`);
console.log(`  evolutions/run  median ${med(evoCount)} (min ${Math.min(...evoCount)}, max ${Math.max(...evoCount)})`);
console.log(`  death times     ${deaths.length ? deaths.sort((a, b) => a - b).map(fmt).join(' ') : 'none'}${deaths.length ? `  (${bossDeaths} at/after boss)` : ''}`);
const m = (k) => runs.map((r) => r.marks[k]?.lvl).filter((v) => v != null);
console.log(`  level @1/3/5/10 min  ${[1, 3, 5, 10].map((k) => med(m(k))).join(' / ')}`);
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
console.log(`  hearts/run ${mean(runs.map((r) => r.hearts)).toFixed(1)}  magnets/run ${mean(runs.map((r) => r.magnets)).toFixed(1)}  hits taken/run ${mean(runs.map((r) => r.hurts)).toFixed(0)}  alive@end ${Math.round(mean(runs.map((r) => r.alive)))}`);
if (process.env.VERBOSE) for (const r of runs) console.log(`    ${r.outcome} ${fmt(r.time)} L${r.level} hearts ${r.hearts} evo [${r.evolved}] w [${r.weaponIds}] hp/en@min ${Object.entries(r.marks).filter(([k]) => k !== 'evo').map(([k, v]) => `${k}:${v.hp}/${v.en}`).join(' ')}`);
