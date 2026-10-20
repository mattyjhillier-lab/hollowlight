// Regenerate selected entries of tests/fixtures/tree-v2-rescale.json from the live tree (deliberate golden edit).
//   node scripts/review/regold.mjs id,id,...
import { readFileSync, writeFileSync } from 'node:fs';
import { data } from '../../tests/helpers.mjs';
import { compileTree } from '../../src/meta/tree.js';
import { composeTree } from '../../src/meta/treedata.js';
import { readTreeFiles } from '../../src/meta/treefs.mjs';
const live = compileTree(composeTree(readTreeFiles(), data).live, data);
const p = new URL('../../tests/fixtures/tree-v2-rescale.json', import.meta.url);
const gold = JSON.parse(readFileSync(p, 'utf8'));
const snap = (n) => ({ effects: n.effects, cost: n.cost, rankCost: n.rankCost, maxRank: n.maxRank, requires: [...n.requires].sort(), requiresAny: n.requiresAny ? [...n.requiresAny] : null, excludes: [...n.excludes].sort(), unlock: n.unlock });
for (const id of (process.argv[2] || '').split(',').filter(Boolean)) { if (!gold[id]) throw new Error('not in golden: ' + id); gold[id] = JSON.parse(JSON.stringify(snap(live.nodes[id]))); }
writeFileSync(p, JSON.stringify(gold, null, 1) + '\n');
