// Finer ablation at tiny caps: what is left once stat nodes are almost nothing? Usage: node scripts/gates-ablate2.mjs [seeds=24]
import { GATES, STARTER_EVOS, runGrid, printGrid } from './gates-lib.mjs';
const seeds = Number(process.argv[2] || 24);
const all = { weapons: GATES.filter((g) => g.kind === 'weapon').map((g) => g.id), evos: [...STARTER_EVOS, ...GATES.filter((g) => g.kind === 'evo').map((g) => g.id)] };
const G = ['rerolls', 'revive', 'perks', 'auto', 'heal', 'ability'];
const rows = [
  { name: 'x0.1 everything', ...all, treeSpec: { preset: 'full', soft: true, scale: 0.1 } },
  { name: 'x0.1 minus all groups', ...all, treeSpec: { preset: 'full', soft: true, scale: 0.1, strip: G } },
  { name: 'x0.1 minus groups, minus flat', ...all, treeSpec: { preset: 'full', soft: true, scale: 0.1, strip: [...G, 'flat'] } },
  { name: 'x0.1 verbs only (rerolls,revive,perks,auto)', ...all, treeSpec: { preset: 'full', soft: true, scale: 0.1, strip: ['heal', 'ability', 'flat'] } },
  { name: 'x0.3 minus groups, minus flat', ...all, treeSpec: { preset: 'full', soft: true, scale: 0.3, strip: [...G, 'flat'] } },
  { name: 'x1 minus groups, minus flat (pure stat)', ...all, treeSpec: { preset: 'full', soft: true, scale: 1, strip: [...G, 'flat'] } },
];
const res = await runGrid(rows, seeds);
printGrid(rows, res);
