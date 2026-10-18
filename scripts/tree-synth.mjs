// Synthetic skill trees for tests and perf checks (docs/design/skill-tree-v2.md C.12): the real launch fragments plus generated
// constellations on the reserved far slots and chapter bands. TEST DATA ONLY: nothing here ships.
//   import { synthTree } from './tree-synth.mjs';  const { files, data, count } = synthTree(data, 1000);
//   node scripts/tree-synth.mjs 2000     -> prints node count and compile time
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { compileTree } from '../src/meta/tree.js';

const TEMPLATE = ['knot', 'knot', 'verb', 'knot', 'kin', 'mastery', 'knot', 'verb', 'knot', 'kin', 'knot'];
const b36 = (n) => n.toString(36).padStart(2, '0');

export function loadRealData() {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
  const L = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
  return Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, L(n)]));
}

// Slot for the k-th synthetic constellation: the far slots the five tool clusters leave free (far1, far3, far5, far7, far9), then two per chapter band starting at band 2.
const FREE_FAR = ['far1', 'far3', 'far5', 'far7', 'far9'];
export function synthSlot(k) {
  if (k < FREE_FAR.length) return FREE_FAR[k];
  const j = k - FREE_FAR.length;
  return `band${2 + Math.floor(j / 2)}.${1 + (j % 2)}`;
}

// n = approximate total node count (>= the 125 launch nodes). Returns fresh copies of the real files + generated fragments.
export function synthTree(realData, n, baseFiles = readTreeFiles()) {
  const files = JSON.parse(JSON.stringify(baseFiles));
  const core = files.find((f) => f.path === 'core.json').json;
  const data = JSON.parse(JSON.stringify(realData));
  // launch size = every node of the real fragments (core ring nodes + clusters + heroes + tool clusters)
  let count = 0;
  for (const f of baseFiles) { if (f.path.startsWith('emblems/')) continue; const j = f.json; for (const l of [j.nodes, j.gates, j.outline, j.lanterns]) if (Array.isArray(l)) count += l.length; }
  const K = Math.max(0, Math.ceil((n - count) / 15));
  const bands = new Set();
  files.find((f) => f.path === 'clusters/ghost_wolves.json');
  for (let i = 0; i < K; i++) {
    const pre = `z${b36(i)}`;
    const wid = `zw${i}`;
    const evos = [`${wid}_a`, `${wid}_b`, `${wid}_c`];
    const slot = synthSlot(i);
    const m = /^band(\d+)\./.exec(slot);
    if (m) bands.add(Number(m[1]));
    core.namespaces[pre] = { kind: 'cluster', owners: [wid] };
    data.weapons[wid] = { id: wid, name: `Z ${i}`, type: i % 2 ? 'magic' : 'summon', treeGate: true, stats: { count: {}, power: {}, radius: {}, duration: {} } };
    for (const e of evos) data.evolutions[e] = { id: e, name: e, weapon: wid, treeGate: true };
    const stat = ['power', 'radius', 'duration'];
    const outline = TEMPLATE.map((kind, j) => {
      const spec = { id: `${pre}_n${j}`, idx: j + 4, kind, inert: true, name: `Node ${j}`, desc: `Synthetic ${kind}`, cost: { gold: 300 + 40 * j, ...(kind === 'mastery' ? { shards: 1 } : {}) }, effects: [{ weapon: wid, stat: stat[j % 3], pct: kind === 'mastery' ? 1 : 2 }] };
      if (kind === 'mastery') spec.effects.push({ weapon: wid, stat: 'power', pct: 1 });
      if (kind === 'mastery' || kind === 'kin') spec.unlock = { t: 'useCharacter', id: 'wren', n: 5 };
      if (kind === 'verb') spec.effects = [{ weapon: wid, stat: 'radius', add: 1 }];
      return spec;
    });
    const gate = (id, effect, idx, cond) => ({ id: `gt_${id}`, idx, kind: 'socket', inert: true, name: `Gate ${id}`.slice(0, 40), desc: 'Synthetic gate', cost: { gold: 300 }, effects: [effect], unlock: cond, hidden: true });
    const heart = { ...gate(wid, { unlock: 'weapon', id: wid }, 0, { t: 'clearChapter', id: 'cursed_forest' }), kind: 'heart' };
    const gates = [heart, gate(evos[0], { unlock: 'evolution', id: evos[0] }, 1, { t: 'evolveWeapon', id: 'any', n: 1 }), gate(evos[1], { unlock: 'evolution', id: evos[1] }, 2, { t: 'evolveWeapon', id: 'any', n: 2 }), gate(evos[2], { unlock: 'evolution', id: evos[2] }, 3, { t: 'evolveWeapon', id: 'any', n: 3 })];
    files.push({
      path: `clusters/${wid}.json`,
      json: {
        kind: 'cluster', weapon: wid, prefix: pre, emblem: 'wolf', slot, chapter: 'cursed_forest', region: 'syn', hero: null, heart: `gt_${wid}`, starterEvo: null,
        sockets: { a: { evo: evos[0], gate: `gt_${evos[0]}` }, b: { evo: evos[1], gate: `gt_${evos[1]}` }, c: { evo: evos[2], gate: `gt_${evos[2]}` } },
        gates, outline,
      },
    });
    count += 15;
  }
  // chapter fragments for the bands we used (empty node lists; their prefixes are registered)
  for (const k of bands) {
    core.namespaces[`c${k}`] = { kind: 'chapter', owners: [`band${k}`] };
    files.push({ path: `chapters/band${k}.json`, json: { kind: 'chapter', chapter: `band${k}`, order: k, prefix: `c${k}`, future: true, nodes: [] } });
  }
  return { files, data, count };
}

// compose + compile the v2 view; returns { ms, composed, def }
export function buildSynthetic(realData, n) {
  const { files, data, count } = synthTree(realData, n);
  const t0 = performance.now();
  const composed = composeTree(files, data);
  const t1 = performance.now();
  const def = compileTree(composed.v2, data);
  const t2 = performance.now();
  return { ms: t2 - t0, msCompose: t1 - t0, msCompile: t2 - t1, composed, def, count, data, files };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const n = Number(process.argv[2] || 1000);
  const r = buildSynthetic(loadRealData(), n);
  console.log(`synthetic tree: ${r.def.list.length} nodes, compose ${r.msCompose.toFixed(1)} ms + compileTree ${r.msCompile.toFixed(1)} ms (cold single run)`);
}
