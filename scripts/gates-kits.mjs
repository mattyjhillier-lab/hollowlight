// Starter-kit candidates: which second starter weapon keeps a no-tree starter run near the 15-30% target? (Twilight, Bond 0)
// Runs on the LIVE bot (dodge, Blessings, Bond, map events) via scripts/live-probe.mjs; tree = brand-new save (the hero's starter grant) plus the
// candidate second weapon's starter grant (its heart + first evolution gate). Compare with rt-matrix.mjs 'none' cells.
// Usage: node scripts/gates-kits.mjs [seeds=32] [bots=random]   (bots: random | random,focus; ~3.4 s/run on a loaded 6-core PC = 15 min for 256 runs)
import { runLive, summarise } from './live-probe.mjs';
const seeds = Number(process.argv[2] || 32);
const SIG = { wren: 'ghost_wolves', elias: 'holy_orbit' };
const cands = { wren: ['raven_flock', 'spirit_bolts', 'holy_orbit', null], elias: ['raven_flock', 'spirit_bolts', 'ghost_wolves', null] };
const BOTS = (process.argv[3] || 'random').split(',').map((b) => b === 'focus');
const jobs = [];
for (const [hero, list] of Object.entries(cands)) for (const second of list) for (const focus of BOTS) for (let seed = 1; seed <= seeds; seed++) {
  jobs.push({ key: `${hero}|${second || '(signature only)'}|${focus ? 'focus' : 'random'}`, hero, weapon: SIG[hero], seed, focus, tree: 'none', spec: { extra: second ? [second] : [] } });
}
const res = await runLive(jobs);
console.log(`seeds=${seeds}, live bot, Twilight, no tree (win% +-SE, median level, median first evolution)`);
console.log('hero  kit second weapon     ' + BOTS.map((f) => (f ? 'focus' : 'random')).join(' | '));
for (const [hero, list] of Object.entries(cands)) for (const second of list) {
  const c = (b) => { const s = summarise(res.get(`${hero}|${second || '(signature only)'}|${b}`)); return `${String(s.win).padStart(3)}% +-${s.se} (L${s.lvl}, ${s.evo})`; };
  console.log(`${hero.padEnd(6)}${(second || '(signature only)').padEnd(20)} ${BOTS.map((f) => c(f ? 'focus' : 'random')).join(' | ')}`);
}
