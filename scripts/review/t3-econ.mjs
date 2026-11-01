// Economy readout for the live tree and the full (all-live) view: totals by region and runs-to-complete at a given gold per run.
//   node scripts/review/t3-econ.mjs [goldPerRun=1800] [humanFactor=0.75]
// Gold per run comes from the bot (starter loss ~700, win ~2,700; full tree + all gates ~3,600): see docs/design/difficulty-tiers-economy-v1.md 9.3.
import { data } from '../../tests/helpers.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
import { compileTree, totalCost, costFor } from '../../src/meta/tree.js';
const gpr = Number(process.argv[2] || 1800), hf = Number(process.argv[3] || 0.75);
const c = loadTree(data);
const live = compileTree(c.live, data), all = compileTree(c.v2, data);
const regionOf = (def, id) => { const n = def.nodes[id]; const info = c.info.nodes.find((x) => x.id === id); return info.tool ? `tool:${info.tool}` : info.cluster ? `weapon:${info.cluster}` : info.role === 'hero' ? 'hero' : 'rings'; };
function table(def, label) {
  const by = {};
  let keystonePairs = 0;
  const skip = new Set();
  for (const id of def.list) { const n = def.nodes[id]; if (n.teaser) continue; if (n.excludes.length && skip.has(id)) continue; for (const x of n.excludes) skip.add(x); }
  for (const id of def.list) {
    const n = def.nodes[id]; if (n.teaser || skip.has(id)) continue;
    const r = regionOf(def, id), b = by[r] || (by[r] = { nodes: 0, gold: 0, shards: 0, glass: 0 });
    b.nodes++;
    for (let k = 1; k <= n.maxRank; k++) { const x = costFor(n, k); b.gold += x.gold; b.shards += x.shards; b.glass += x.glass; }
  }
  const tot = Object.values(by).reduce((a, b) => ({ nodes: a.nodes + b.nodes, gold: a.gold + b.gold, shards: a.shards + b.shards, glass: a.glass + b.glass }), { nodes: 0, gold: 0, shards: 0, glass: 0 });
  console.log(`\n${label}: ${tot.nodes} nodes (exclusive pairs counted once), ${tot.gold} gold, ${tot.shards} shards, ${tot.glass} Dawnglass`);
  for (const [r, b] of Object.entries(by).sort()) console.log(`  ${r.padEnd(24)} ${String(b.nodes).padStart(3)} nodes ${String(b.gold).padStart(6)} gold ${String(b.shards).padStart(3)} shards ${String(b.glass).padStart(3)} glass`);
  console.log(`  runs to buy everything: bot ${(tot.gold / gpr).toFixed(0)} (${gpr} gold/run), human ${(tot.gold / (gpr * hf)).toFixed(0)} (x${hf})`);
  return tot;
}
const a = table(live, 'LIVE tree (what a player can buy now)');
const b = table(all, 'FULL tree (live + inert tool nodes)');
console.log(`\nAll-ranks sum from totalCost(): live ${JSON.stringify(totalCost(live))} (exclusive pairs both counted)`);
