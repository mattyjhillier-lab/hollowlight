// Skill-tree migration registry (docs/design/skill-tree-v2.md Appendix C.8).
// The save stores the tree version it was written with (compact form: tree.v; pre-compact saves are tree version 2).
// On load, every step above the stored version runs in order, up to the data's core.version. Each step owns a FROZEN price table.
// ADDITIVE content (new cluster, hero, chapter, ring node) needs NO step: nobody owns the new ids. A step is needed only when an
// EXISTING id changes effect/price/ranks or is retired.
//
// step(treeObj, ctx) -> { tree, gold, shards, note?, creep? }   treeObj = { id: rank } (untrusted), gold/shards = refund to add;
// ctx = { creep: the save's untrusted rising-price steps, def: the compiled live tree }; a step that returns `creep` replaces the save's steps.
import { regrow } from './tree-v3.js';
import { retireHeroLanterns } from './tree-v4.js';

export const OLD_TREE_VERSION = 2; // object-form trees written before the compact form existed

export const TREE_STEPS = {
  3: (tree) => {
    const r = regrow(tree);
    return { tree: r.tree, gold: r.refund.gold, shards: r.refund.shards, note: r.refunded > 0 ? { regrowth: { gold: r.refund.gold, shards: r.refund.shards, nodes: r.refunded } } : undefined }; // the 'web has regrown' notice only when something was refunded
  },
  // CHARACTER SYSTEM v2: the hero lanterns retire (tombstones); refunded at the price paid (tree-v4.js)
  4: (tree, ctx) => {
    const r = retireHeroLanterns(tree, ctx);
    return { tree: r.tree, gold: r.gold, shards: r.shards, creep: r.creep, note: r.refunded > 0 || r.gold > 0 ? { regrowth: { gold: r.gold, shards: r.shards, nodes: r.refunded } } : undefined };
  },
};

// Runs steps (from+1 .. to) on an object-form tree. Returns { tree, gold, shards, notes }. Missing steps are skipped (additive versions).
export function runTreeSteps(tree, from, to, steps = TREE_STEPS, ctx = {}) {
  let cur = tree;
  let creep = ctx.creep;
  let gold = 0;
  let shards = 0;
  const notes = {};
  for (let v = from + 1; v <= to; v++) {
    const step = Object.hasOwn(steps, v) ? steps[v] : null;
    if (typeof step !== 'function') continue;
    const r = step(cur, { ...ctx, creep });
    cur = r.tree;
    if (r.creep !== undefined) creep = r.creep;
    gold = Math.min(1e12, gold + r.gold);
    shards = Math.min(1e12, shards + r.shards);
    if (r.note) for (const [k, v] of Object.entries(r.note)) notes[k] = k === 'regrowth' && notes.regrowth ? { gold: notes.regrowth.gold + v.gold, shards: notes.regrowth.shards + v.shards, nodes: notes.regrowth.nodes + v.nodes } : v;
  }
  return { tree: cur, gold, shards, notes, creep };
}
