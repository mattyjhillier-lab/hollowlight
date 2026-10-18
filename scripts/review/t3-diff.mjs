// Diff of the v1 fixture vs the current v2 view: counts effect / price / requires / maxRank changes on existing ids.
import { readFileSync } from 'node:fs';
import { data } from '../../tests/helpers.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
import { compileTree } from '../../src/meta/tree.js';
const V1 = JSON.parse(readFileSync(new URL('../../tests/fixtures/tree-v1.json', import.meta.url), 'utf8'));
const c = loadTree(data);
const g = compileTree(V1, data), d = compileTree(c.v2, data);
const J = JSON.stringify;
const out = { effects: [], cost: [], requires: [], maxRank: [], other: [] };
for (const id of g.list) {
  const a = g.nodes[id], b = d.nodes[id];
  if (!b) { out.other.push(`${id} missing in v2`); continue; }
  if (J(a.effects) !== J(b.effects)) out.effects.push(id);
  if (J(a.cost) !== J(b.cost) || a.rankCost !== b.rankCost) out.cost.push(id);
  if (J([...a.requires].sort()) !== J([...b.requires].sort()) || J(a.requiresAny || null) !== J(b.requiresAny || null)) out.requires.push(id);
  if (a.maxRank !== b.maxRank) out.maxRank.push(`${id} ${a.maxRank}->${b.maxRank}`);
  for (const k of ['name', 'unlock', 'excludes', 'hidden', 'teaser', 'keystone']) if (J(a[k]) !== J(b[k])) out.other.push(`${id}.${k}`);
}
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])));
if (process.argv[2]) console.log(J(out, null, 1));
