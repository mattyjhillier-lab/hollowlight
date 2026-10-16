// Run-level stat ablation (read-only, analysis only): the normal bot plays full starter runs (GATES=starter, Blessings on)
// while one stat of the hero's own weapon is removed from every offer. Also counts how often each stat card is SHOWN
// in the baseline (shows the evoNudge effect). Caveat: banning a stat also blocks any evolution that needs it.
// Usage: node scripts/stat-ablate.mjs [hero=wren] [seeds=48]   (FOCUS=1 for the focused bot)
import { playRun } from './bot.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const chars = JSON.parse(readFileSync(join(dir, 'characters.json'), 'utf8'));
const weapons = JSON.parse(readFileSync(join(dir, 'weapons.json'), 'utf8'));
const hero = process.argv[2] || 'wren';
const seeds = Number(process.argv[3] || 48);
const wid = chars[hero].weapon;
const stats = Object.keys(weapons[wid].stats);
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);

const shown = Object.fromEntries(stats.map((k) => [k, 0]));
let offers = 0;
console.log(`${hero} (${wid}) ${process.env.FOCUS === '1' ? 'FOCUS' : 'random'} x${seeds} seeds, starter gates`);
for (const ban of [null, ...stats]) {
  const runs = [];
  for (let sd = 1; sd <= seeds; sd++) {
    runs.push(playRun(hero, sd, {
      onOffer(sim) {
        if (!ban) { offers++; for (const c of sim.offer.cards) if (c.kind === 'stat' && c.weaponId === wid) shown[c.stat]++; return; }
        const keep = sim.offer.cards.filter((c) => !(c.kind === 'stat' && c.weaponId === wid && c.stat === ban));
        if (keep.length) sim.offer.cards = keep;
      },
    }));
  }
  const wins = runs.filter((r) => r.outcome === 'victory').length;
  const deaths = runs.filter((r) => r.outcome !== 'victory').map((r) => r.time);
  const evo = runs.map((r) => r.marks.evo).filter((v) => v != null);
  const ci = Math.round(196 * Math.sqrt((wins / seeds) * (1 - wins / seeds) / seeds));
  console.log(`  ${(ban ? `no ${ban}` : 'baseline').padEnd(14)} win ${String(Math.round((wins / seeds) * 100)).padStart(3)}% (${wins}/${seeds}, +-${ci})  death median ${fmt(med(deaths))}  first evo ${fmt(med(evo))} (${evo.length}/${seeds})  evolved [${[...new Set(runs.flatMap((r) => r.evolved))].join(',')}]`);
}
const tot = Object.values(shown).reduce((a, b) => a + b, 0);
console.log(`  baseline: ${wid} stat cards SHOWN per stat (share of its stat cards, ${offers} offers): ${stats.map((k) => `${k} ${Math.round((shown[k] / tot) * 100)}%`).join(', ')}`);
