// Second review (read-only analysis): at the moment the bot TAKES an evolution, what ranks do the weapon's other stats have?
// Evolved weapons are final (cards.js buildPool skips w.evo), so these are the weapon's ranks for the rest of the run.
// Usage: GATES=all node scripts/evo-pick-ranks.mjs [seeds=24] [heroes=wren,elias]
import { playRun } from './bot.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const evos = JSON.parse(readFileSync(join(dir, 'evolutions.json'), 'utf8'));
const seeds = Number(process.argv[2] || 24);
const heroes = (process.argv[3] || 'wren,elias').split(',');
const rec = {}; // evoId -> [{ t, ranks }]
for (const hero of heroes) for (let sd = 1; sd <= seeds; sd++) {
  playRun(hero, sd, {
    onOffer(sim) {
      const g = sim.offer.gold[0];
      if (!g) return;
      const w = sim.weapons.find((x) => x.id === g.weaponId);
      (rec[g.evoId] ||= []).push({ t: sim.time, ranks: { ...w.ranks }, hero });
    },
  });
}
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log(`Bot (GATES=${process.env.GATES || 'starter'}) x${seeds} seeds per hero [${heroes}]: ranks of the NON-recipe stats when the evolution is taken (median, min-max)`);
for (const [id, list] of Object.entries(rec)) {
  const pair = evos[id].pair;
  const others = Object.keys(list[0].ranks).filter((k) => !pair.includes(k));
  const cells = others.map((k) => { const v = list.map((r) => r.ranks[k]); return `${k} ${med(v)} (${Math.min(...v)}-${Math.max(...v)})`; });
  console.log(`${id.padEnd(18)} n=${String(list.length).padStart(3)}  at ${Math.round(med(list.map((r) => r.t)))}s  ${cells.join('  ')}`);
}
