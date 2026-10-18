import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));

export const data = {
  balance: load('balance'),
  weapons: load('weapons'),
  evolutions: load('evolutions'),
  characters: load('characters'),
  enemies: load('enemies'),
  chapters: load('chapters'),
};
data.tree = loadTree(data).live; // fragments in src/data/tree/
data.blessings = load('blessings');
import { compileTree } from '../src/meta/tree.js';
import { loadTree } from '../src/meta/treefs.mjs';
import { setTreeDef } from '../src/save/schema.js';
export const treeDef = compileTree(data.tree, data);
setTreeDef(treeDef, data);

// Shipped data gates 3 weapons + 9 evolutions behind the skill tree (G1b). Synthetic-tree tests use a copy
// with the gates removed (so a small made-up tree is not "unreachable"); gameplay tests that want the old
// everything-open behaviour use allOpen() on a card context.
const strip = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => { const { treeGate, ...rest } = v; return [k, rest]; }));
export const ungated = (d = data) => ({ ...d, weapons: strip(d.weapons), evolutions: strip(d.evolutions) });
export const allOpen = (ctx) => ({
  ...ctx,
  unlockedWeapons: new Set(Object.keys(data.weapons)),
  unlockedEvolutions: new Set(Object.keys(data.evolutions)),
});
