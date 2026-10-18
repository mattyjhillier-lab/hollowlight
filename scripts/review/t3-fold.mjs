// One-off (T3a): fold each node's `v2` block into the node itself, drop `v2` / `inert` / legacy `ord` / numeric `ring` + `ang`.
// After this the fragment data IS the v2 tree. Run once; idempotent.
import { readTreeFiles, TREE_DIR } from '../../src/meta/treefs.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const fold = (s) => {
  if (s.v2) { for (const [k, v] of Object.entries(s.v2)) s[k] = v; delete s.v2; }
  delete s.inert; delete s.ord;
  if (typeof s.ring === 'number') delete s.ring;
  if (typeof s.ang === 'number') delete s.ang;
};
let changed = 0;
for (const f of readTreeFiles()) {
  const j = f.json;
  const lists = [j.nodes, j.gates, j.outline, j.lanterns].filter(Array.isArray);
  for (const l of lists) for (const s of l) fold(s);
  const txt = JSON.stringify(j, null, 1) + '\n';
  writeFileSync(join(TREE_DIR, f.path), txt);
  changed++;
}
console.log('rewrote', changed, 'files');
