// Dump every compiled node of the live (game) tree or the full v2 view: id, kind, effects, cost, requires, unlock.  node scripts/review/t3-dump.mjs [live|v2]
import { data } from '../../tests/helpers.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
import { compileTree } from '../../src/meta/tree.js';
const c = loadTree(data); const d = compileTree(process.argv[2] === 'v2' ? c.v2 : c.live, data);
for (const id of d.list) { const n = d.nodes[id]; console.log(id, '|', n.kind, '|', JSON.stringify(n.effects), '|', JSON.stringify(n.cost), n.maxRank > 1 ? 'x' + n.maxRank + ' rc' + n.rankCost : '', '| req', n.requires.join(','), n.requiresAny ? 'any:' + n.requiresAny : '', '|', n.unlock ? JSON.stringify(n.unlock) : ''); }
