// STALE PROBE (2026-10-30): old gates-lib bot, win rates not comparable to the live game. Ability ablation now: ABILITY=off node scripts/rt-matrix.mjs (see nights-retune-options.md).
// Which parts of the old full tree still drive the win rate AFTER the stat soft cap? (All gates unlocked.)
// Usage: node scripts/gates-ablate.mjs [seeds=48] [scale=0.6]
import { GATES, STARTER_EVOS, runGrid, printGrid } from './gates-lib.mjs';

const seeds = Number(process.argv[2] || 48);
const scale = Number(process.argv[3] || 0.6);
const all = { weapons: GATES.filter((g) => g.kind === 'weapon').map((g) => g.id), evos: [...STARTER_EVOS, ...GATES.filter((g) => g.kind === 'evo').map((g) => g.id)] };
const T = (strip) => ({ preset: 'full', soft: true, scale, strip });
const rows = [
  { name: `soft x${scale}, everything`, ...all, treeSpec: T([]) },
  { name: '  minus rerolls+banishes', ...all, treeSpec: T(['rerolls']) },
  { name: '  minus revive', ...all, treeSpec: T(['revive']) },
  { name: '  minus perks (rush, evoLuck)', ...all, treeSpec: T(['perks']) },
  { name: '  minus heal (levelHeal, hearts)', ...all, treeSpec: T(['heal']) },
  { name: '  minus ability (cd, dur)', ...all, treeSpec: T(['ability']) },
  { name: '  minus rerolls+revive+heal', ...all, treeSpec: T(['rerolls', 'revive', 'heal']) },
  { name: '  stats only (strip all groups)', ...all, treeSpec: T(['rerolls', 'revive', 'perks', 'auto', 'heal', 'ability']) },
];
const res = await runGrid(rows, seeds);
printGrid(rows, res);
