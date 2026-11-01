// Writes tests/fixtures/tree-v2-rescale.json: the per-id values Appendix A of skill-tree-v2.md specifies (T3a golden).
// Run ONCE from the pre-fold v2 view (this is how the fixture was generated); the test then pins the live tree to it.
import { writeFileSync } from 'node:fs';
import { data } from '../../tests/helpers.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
import { compileTree } from '../../src/meta/tree.js';
const d = compileTree(loadTree(data).v2, data);
const out = {};
for (const id of d.list) {
  const n = d.nodes[id];
  out[id] = { effects: n.effects, cost: n.cost, rankCost: n.rankCost, maxRank: n.maxRank, requires: [...n.requires].sort(), requiresAny: n.requiresAny ? [...n.requiresAny] : null, excludes: [...n.excludes].sort(), unlock: n.unlock };
}
writeFileSync(new URL('../../tests/fixtures/tree-v2-rescale.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out).length, 'ids');
