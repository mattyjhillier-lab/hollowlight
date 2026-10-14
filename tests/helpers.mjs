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
