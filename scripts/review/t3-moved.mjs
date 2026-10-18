// Writes tests/fixtures/tree-t3b-moved.json: the values of the existing ids the tool-cluster build (T3b / DT4) changed AFTER the T3a golden.
import { writeFileSync } from 'node:fs';
import { data } from '../../tests/helpers.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
import { compileTree } from '../../src/meta/tree.js';
const d = compileTree(loadTree(data).live, data);
const out = {};
for (const id of ['li_reach', 'li_scav', 'li_hearts', 'li_magnet']) {
  const n = d.nodes[id];
  out[id] = { effects: n.effects, cost: n.cost, rankCost: n.rankCost, maxRank: n.maxRank, requires: [...n.requires].sort(), requiresAny: n.requiresAny ? [...n.requiresAny] : null, excludes: [...n.excludes].sort(), unlock: n.unlock };
}
writeFileSync(new URL('../../tests/fixtures/tree-t3b-moved.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out));
