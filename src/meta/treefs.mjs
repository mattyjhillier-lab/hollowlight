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

// TREE-GEN1 checker hook: `--extra <dir>` adds test-only fragments (a synthetic hero / weapon) and merges `<dir>-data.json` (characters,
// weapons, evolutions) over the game data, so tree-validate / tree-timeline can prove a new hero needs no code. Plain repo-relative paths only.
export function addExtra(files, data, dir) {
  if (!dir) return { files, data };
  if (typeof dir !== 'string' || !/^[\w/-]{1,120}$/.test(dir) || dir.includes('..') || dir.startsWith('/')) throw new Error('--extra must be a plain repo-relative directory');
  const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
  const extra = readTreeFiles(join(root, dir));
  const d = { ...data };
  let over = {};
  try { over = JSON.parse(readFileSync(join(root, `${dir}-data.json`), 'utf8')); } catch { over = {}; }
  for (const k of ['characters', 'weapons', 'evolutions']) if (over && typeof over[k] === 'object' && over[k]) d[k] = { ...data[k], ...over[k] };
  return { files: [...files, ...extra], data: d };
}

// -> { live, v2, info } (see treedata.js). `data` = { weapons, evolutions, characters, chapters, ... } enables the data-aware checks.
export function loadTree(data = null, dir = TREE_DIR) {
  return composeTree(readTreeFiles(dir), data);
}
