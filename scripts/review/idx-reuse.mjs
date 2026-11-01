// Retirement / idx-reuse probe (in memory only; the real fragment files are not touched).
//  A. Retire sp_cd4 (2100 gold + 2 shards) and give its (core, idx 16) slot to a NEW node: does compose/compile accept it, does
//     the idx snapshot logic of tests/treedata.test.mjs accept it once the new id is added, and does an old v3 save that owned
//     sp_cd4 now own the new node for free?
//  B. Can a future migration step (the documented way to refund a retired node) even see the retired node? parseSave hands the
//     steps decodeTree(save.tree, CURRENT def).tree, so we check what that contains.
//  C. Same for a maxRank cut (rv_wide 2 -> 1): can a step see the rank that must be refunded?
// Usage: node scripts/review/idx-reuse.mjs
import { data, treeDef } from '../../tests/helpers.mjs';
import { compileTree, sanitizeTree, presetTree } from '../../src/meta/tree.js';
import { composeTree } from '../../src/meta/treedata.js';
import { readTreeFiles } from '../../src/meta/treefs.mjs';
import { encodeTree, decodeTree, decodeTreeRaw } from '../../src/meta/treecodec.js';
import { readJson, BIG_STATS } from './lib.mjs';

const clone = (x) => JSON.parse(JSON.stringify(x));
let findings = 0;

// an old v3 save (current data) that owns the cd chain incl. sp_cd4, and rv_wide at rank 2
const owned = presetTree(treeDef, 'full', true); // every live node incl. sp_cd4 and rv_wide at rank 2
const clean = sanitizeTree(owned, BIG_STATS, treeDef, data);
const disk = JSON.parse(JSON.stringify(encodeTree(clean, treeDef, 3)));
console.log(`old save owns ${Object.keys(clean).length} nodes, sp_cd4=${clean.sp_cd4}, rv_wide=${clean.rv_wide}`);

// ---- A
const fs = clone(readTreeFiles());
const core = fs.find((f) => f.path === 'core.json').json;
const i = core.nodes.findIndex((n) => n.id === 'sp_cd4');
const old = core.nodes[i];
core.nodes.splice(i, 1, { ...clone(old), id: 'sp_echo', name: 'Echo', desc: 'A brand-new node reusing a retired slot', effects: [{ mod: 'abilityCd', pct: -3 }] });
core.retired.push({ id: 'sp_cd4', frag: 'core', idx: old.idx });
let defA = null;
try { defA = compileTree(composeTree(fs, data).live, data); console.log('A: compose + compile ACCEPT a new node on a retired id\'s idx'); } catch (e) { console.log('A: rejected:', e.message); }
if (defA) {
  // the snapshot test logic, with the new id added to the snapshot the way the failure message tells a developer to
  const snap = { ...readJson('tests/fixtures/tree-ids.json'), sp_echo: ['core', old.idx] };
  const now = Object.fromEntries(composeTree(fs, data).info.nodes.map((n) => [n.id, [n.frag, n.idx]]));
  let snapOk = true;
  for (const [id, v] of Object.entries(snap)) { if (core.retired.some((t) => t.id === id)) { if (now[id] !== undefined) snapOk = false; continue; } if (JSON.stringify(now[id]) !== JSON.stringify(v)) snapOk = false; }
  for (const id of Object.keys(now)) if (!snap[id]) snapOk = false;
  console.log(`A: idx snapshot test would ${snapOk ? 'PASS (does not catch the reuse)' : 'fail'}`);
  const got = sanitizeTree(decodeTree(disk, defA).tree, BIG_STATS, defA, data);
  if (got.sp_echo) { findings++; console.log('A: FINDING the old save now owns sp_echo for free (bit 16 of "core" was sp_cd4)'); }
}

// ---- B
const fsB = clone(readTreeFiles());
const coreB = fsB.find((f) => f.path === 'core.json').json;
coreB.nodes = coreB.nodes.filter((n) => n.id !== 'sp_cd4');
coreB.retired.push({ id: 'sp_cd4', frag: 'core', idx: 16 });
coreB.version = 4;
const defB = compileTree(composeTree(fsB, data).live, data);
const seenByStep = decodeTreeRaw(disk, defB).tree;
console.log(`B: tree handed to a v4 step has ${Object.keys(seenByStep).length} nodes, sp_cd4 present: ${Object.hasOwn(seenByStep, 'sp_cd4')}`);
if (!Object.hasOwn(seenByStep, 'sp_cd4')) { findings++; console.log('B: FINDING the retired node is invisible to the migration step, so its 2100 gold + 2 shards can never be refunded'); }

// ---- C
const fsC = clone(readTreeFiles());
const rv = fsC.find((f) => f.path === 'clusters/raven_flock.json').json;
const wide = [...rv.outline, ...rv.gates].find((n) => n.id === 'rv_wide');
wide.maxRank = 1;
fsC.find((f) => f.path === 'core.json').json.version = 4;
const defC = compileTree(composeTree(fsC, data).live, data);
const rankSeen = decodeTreeRaw(disk, defC).tree.rv_wide;
console.log(`C: rv_wide rank handed to a v4 step: ${rankSeen} (save had 2)`);
if (rankSeen !== 2) { findings++; console.log('C: FINDING the cut rank is clamped away before any step runs, so rank 2 (960 gold) cannot be refunded'); }

console.log(`idx-reuse: ${findings} findings`);
process.exitCode = findings ? 1 : 0;
