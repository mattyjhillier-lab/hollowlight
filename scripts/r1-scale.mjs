import { data } from '../tests/helpers.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { tierOf } from '../src/meta/treetier.js';
const c = composeTree(readTreeFiles(), data);
const g = { landmark: 120, diamond: 30, dot: 18 };
const need = (a, b) => (a === b ? g[a] : (g[a] + g[b]) / 2);
for (const [wid] of Object.entries(c.info.clusters)) {
  const ns = c.info.nodes.filter((n) => n.cluster === wid);
  let best = 0, who = '';
  for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) {
    const a = ns[i], b = ns[j];
    const d = Math.hypot(...[0, 1].map((k) => c.info.positions[a.id][k] - c.info.positions[b.id][k])) / c.info.scale;
    const s = need(tierOf(a), tierOf(b)) / d;
    if (s > best) { best = s; who = `${a.id}/${b.id}`; }
  }
  console.log(wid, best.toFixed(2), who);
}
