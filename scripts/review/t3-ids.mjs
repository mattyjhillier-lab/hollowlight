// Appends the (fragment, idx) of every id that is not yet in tests/fixtures/tree-ids.json (deliberate, append-only; never edits an existing entry).
import { readFileSync, writeFileSync } from 'node:fs';
import { loadRealData } from '../tree-synth.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
const f = new URL('../../tests/fixtures/tree-ids.json', import.meta.url);
const snap = JSON.parse(readFileSync(f, 'utf8'));
const c = loadTree(loadRealData());
let n = 0;
for (const x of c.info.nodes) if (!snap[x.id]) { snap[x.id] = [x.frag, x.idx]; n++; }
writeFileSync(f, JSON.stringify(snap, null, 1) + '\n');
console.log('added', n, 'ids');
