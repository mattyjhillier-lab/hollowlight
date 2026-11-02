import { data } from '../tests/helpers.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
const c = composeTree(readTreeFiles(), data);
const P = c.info.positions;
const by = {};
for (const n of c.info.nodes) { const k = n.cluster || n.tool || n.region + ':' + (n.frag); (by[k] ||= []).push(n); }
for (const [k, ns] of Object.entries(by)) {
  const rs = ns.map((n) => Math.hypot(...P[n.id])); 
  console.log(k.padEnd(22), ns.length, 'r', Math.round(Math.min(...rs)), Math.round(Math.max(...rs)), ns.map(n=>n.kind).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{}));
}
console.log(Object.keys(P).length, 'centres', c.info.centres, c.info.toolCentres);
import { compileTree } from '../src/meta/tree.js';
const def = compileTree(c.live, data);
for (const cl of ['ghost_wolves']) {
  for (const n of c.info.nodes.filter((x) => x.cluster === cl)) { const d = def.nodes[n.id]; console.log(n.id, n.kind, n.role, JSON.stringify(P[n.id]), 'req', d.requires, d.requiresAny||'', 'ch', def.children[n.id]); }
}
for (const id of def.list) if (!def.nodes[id].cluster && !def.nodes[id].tool) { const n=def.nodes[id]; console.log(id, n.kind, Math.round(n.x),Math.round(n.y), n.requires.join(','), n.requiresAny||'', n.permanent?'perm':'' , n.teaser?'teaser':''); }
