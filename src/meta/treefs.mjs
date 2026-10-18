// Node-only loader for the skill tree fragments (tests, scripts). The game bundle uses src/data/tree/index.js instead.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeTree } from './treedata.js';

export const TREE_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'data', 'tree');

export function readTreeFiles(dir = TREE_DIR) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith('.json')) out.push({ path: relative(dir, p).split(sep).join('/'), json: JSON.parse(readFileSync(p, 'utf8')) });
    }
  };
  walk(dir);
  return out;
}

// -> { live, v2, info } (see treedata.js). `data` = { weapons, evolutions, characters, chapters, ... } enables the data-aware checks.
export function loadTree(data = null, dir = TREE_DIR) {
  return composeTree(readTreeFiles(dir), data);
}
