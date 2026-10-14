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
data.tree = load('tree');
import { compileTree } from '../src/meta/tree.js';
import { setTreeDef } from '../src/save/schema.js';
export const treeDef = compileTree(data.tree, data);
setTreeDef(treeDef, data);
