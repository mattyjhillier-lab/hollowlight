// Gate measurement: starter kit vs half vs all unlocked vs the old tree. No src changes needed.
// Usage: node scripts/gates-sim.mjs [seeds=48]
import { GATES, STARTER_EVOS, runGrid, printGrid } from './gates-lib.mjs';

const seeds = Number(process.argv[2] || 48);
const upTo = (k) => {
  const g = GATES.slice(0, k);
  return { weapons: g.filter((x) => x.kind === 'weapon').map((x) => x.id), evos: [...STARTER_EVOS, ...g.filter((x) => x.kind === 'evo').map((x) => x.id)] };
};
const mk = (name, k, treeSpec) => ({ name, ...upTo(k), treeSpec });
const half = Math.round(GATES.length / 2);
const rows = [
  mk('A starter kit, no tree', 0, { preset: 'none' }),
  mk('B half unlocked, no tree', half, { preset: 'none' }),
  mk('C all unlocked, no tree (=base)', GATES.length, { preset: 'none' }),
  mk('D all unlocked + OLD full tree', GATES.length, { preset: 'full' }),
  mk('E starter kit + OLD full tree', 0, { preset: 'full' }),
  mk('F half unlocked + OLD half tree', half, { preset: 'half' }),
];
console.log(`seeds=${seeds}  gates=${GATES.length} (half=${half})  starter evos=${STARTER_EVOS.join(',')}`);
const res = await runGrid(rows, seeds);
printGrid(rows, res);
