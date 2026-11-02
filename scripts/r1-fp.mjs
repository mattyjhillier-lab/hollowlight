import { data } from '../tests/helpers.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
const c = composeTree(readTreeFiles(), data);
for (const r of c.info.regions) console.log(r.id.padEnd(22), r.kind.padEnd(8), JSON.stringify(r.centre), 'r', r.r, r.accent);
let reach = 0; for (const [id, p] of Object.entries(c.info.positions)) reach = Math.max(reach, Math.hypot(...p)); console.log('reach', Math.round(reach));
