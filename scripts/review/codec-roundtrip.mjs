// Compact codec round trip for every ownership/rank state: real live tree (82), v2 view (125), synthetic 2000.
// For each tree: every node alone at every rank 0..maxRank+2 (plus junk values), then random mixed trees.
// decode(encode(t)) must equal the shape-normalised t (ids known to def, rank = min(maxRank, floor(rank)) for rank >= 1).
// Usage: node scripts/review/codec-roundtrip.mjs [randomTrees=3000]
import { data, treeDef } from '../../tests/helpers.mjs';
import { compileTree } from '../../src/meta/tree.js';
import { loadTree } from '../../src/meta/treefs.mjs';
import { encodeTree, decodeTree, encodeSeen, decodeSeen } from '../../src/meta/treecodec.js';
import { buildSynthetic, loadRealData } from '../tree-synth.mjs';
import { rng } from './lib.mjs';

const R = Number(process.argv[2]) || 3000;
const norm = (t, def) => {
  const o = {};
  for (const id of def.list) {
    if (!Object.hasOwn(t, id)) continue;
    const v = t[id];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 1) continue;
    o[id] = Math.min(def.nodes[id].maxRank, Math.floor(v));
  }
  return o;
};
const eq = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

function check(name, def) {
  let bad = 0, cases = 0;
  const one = (t) => {
    cases++;
    const d = decodeTree(JSON.parse(JSON.stringify(encodeTree(t, def, def.treeVersion))), def);
    const want = norm(t, def);
    if (!eq(d.tree, want) || d.v !== def.treeVersion) { bad++; if (bad <= 3) console.log(`  ${name} mismatch`, JSON.stringify(t).slice(0, 120), JSON.stringify(d.tree).slice(0, 120)); }
    const seen = Object.fromEntries(Object.keys(t).map((k) => [k, true]));
    const ds = decodeSeen(JSON.parse(JSON.stringify(encodeSeen(seen, def))), def);
    const wantSeen = Object.fromEntries(def.list.filter((id) => Object.hasOwn(seen, id)).map((id) => [id, true]));
    if (!eq(ds, wantSeen)) { bad++; if (bad <= 3) console.log(`  ${name} seen mismatch`); }
  };
  for (const id of def.list) {
    const m = def.nodes[id].maxRank;
    for (let r = 0; r <= m + 2; r++) one({ [id]: r });
    for (const junk of [0.5, 1.9, -1, 1e308, '2', true, null]) one({ [id]: junk });
  }
  const rand = rng(7);
  for (let i = 0; i < R; i++) {
    const t = {};
    for (const id of def.list) if (rand() < 0.4) t[id] = 1 + Math.floor(rand() * (def.nodes[id].maxRank + 1));
    one(t);
  }
  // everything owned at max
  one(Object.fromEntries(def.list.map((id) => [id, def.nodes[id].maxRank])));
  console.log(`codec ${name}: ${def.list.length} nodes, ${cases} cases, ${bad} mismatches`);
  return bad;
}

const real = loadTree(data);
let bad = 0;
bad += check('live', treeDef);
bad += check('v2', compileTree(real.v2, data));
const syn = buildSynthetic(loadRealData(), 2000);
bad += check('synthetic2000', syn.def);
process.exitCode = bad ? 1 : 0;
