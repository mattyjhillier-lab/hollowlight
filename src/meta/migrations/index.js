// Skill-tree migration registry (docs/design/skill-tree-v2.md Appendix C.8).
// The save stores the tree version it was written with (compact form: tree.v; pre-compact saves are tree version 2).
// On load, every step above the stored version runs in order, up to the data's core.version. Each step owns a FROZEN price table.
// ADDITIVE content (new cluster, hero, chapter, ring node) needs NO step: nobody owns the new ids. A step is needed only when an
// EXISTING id changes effect/price/ranks or is retired.
//
// step(treeObj, ctx) -> { tree, gold, shards, note? }   treeObj = { id: rank } (untrusted), gold/shards = refund to add.
import { regrow } from './tree-v3.js';

export const OLD_TREE_VERSION = 2; // object-form trees written before the compact form existed

export const TREE_STEPS = {
  3: (tree) => {
    const r = regrow(tree);
    return { tree: r.tree, gold: r.refund.gold, shards: r.refund.shards, note: r.refunded > 0 ? { regrowth: { gold: r.refund.gold, shards: r.refund.shards, nodes: r.refunded } } : undefined }; // the 'web has regrown' notice only when something was refunded
  },
};

// Runs steps (from+1 .. to) on an object-form tree. Returns { tree, gold, shards, notes }. Missing steps are skipped (additive versions).
export function runTreeSteps(tree, from, to, steps = TREE_STEPS) {
  let cur = tree;
  let gold = 0;
  let shards = 0;
  const notes = {};
  for (let v = from + 1; v <= to; v++) {
    const step = Object.hasOwn(steps, v) ? steps[v] : null;
    if (typeof step !== 'function') continue;
    const r = step(cur);
    cur = r.tree;
    gold = Math.min(1e12, gold + r.gold);
    shards = Math.min(1e12, shards + r.shards);
    if (r.note) Object.assign(notes, r.note);
  }
  return { tree: cur, gold, shards, notes };
}
