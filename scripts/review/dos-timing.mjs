// Parse-time DoS probe: worst-case hostile saves at (just under) the 200 KB cap, timed through the real parseSave.
// Usage: node scripts/review/dos-timing.mjs
import { treeDef } from '../../tests/helpers.mjs';
import { parseSave, MAX_SAVE_BYTES } from '../../src/save/schema.js';

const CAP = MAX_SAVE_BYTES - 64;
const fill = (prefix, piece, suffix) => {
  const n = Math.floor((CAP - prefix.length - suffix.length) / piece.length);
  return prefix + piece.repeat(n) + suffix;
};
const manyKeys = (field, valueOf = (i) => '1') => {
  let s = `{"version":3,${field}:{`;
  let i = 0;
  const parts = [];
  let len = s.length + 2;
  for (;;) { const p = `"k${i}":${valueOf(i)}`; if (len + p.length + 1 > CAP) break; parts.push(p); len += p.length + 1; i++; }
  return s + parts.join(',') + '}}';
};
const keysNested = (outer, inner, mk) => {
  let s = `{"version":3,${outer}:{${inner}:{`;
  const parts = [];
  let len = s.length + 3;
  for (let i = 0; ; i++) { const p = mk(i); if (len + p.length + 1 > CAP) break; parts.push(p); len += p.length + 1; }
  return s + parts.join(',') + '}}}';
};
const idsB64 = 'A'.repeat(4096);
const cases = {
  deepArrays: fill('{"version":3,"unlocks":', '[', ''),
  deepArraysClosed: (() => { const n = Math.floor((CAP - 40) / 2); return '{"version":3,"unlocks":' + '['.repeat(n) + ']'.repeat(n) + '}'; })(),
  deepObjects: (() => { const n = Math.floor((CAP - 40) / 7); return '{"version":3,"notes":' + '{"a":'.repeat(n) + '1' + '}'.repeat(n) + '}'; })(),
  unlocksManyKeys: manyKeys('"unlocks"'),
  killsManyKeys: keysNested('"stats"', '"killsByEnemy"', (i) => `"e${i}":1`),
  v3ObjectTreeManyKeys: manyKeys('"tree"'),
  v2TreeManyKeys: manyKeys('"tree"').replace('"version":3', '"version":2'),
  compactOManyKeys: keysNested('"tree"', '"o"', (i) => `"f${i}":"AA"`).replace('{"version":3,"tree":{', '{"version":3,"tree":{"v":3,'),
  compactRManyKeys: keysNested('"tree"', '"r"', (i) => `"k${i}":2`).replace('{"version":3,"tree":{', '{"version":3,"tree":{"v":3,"o":{"core":"_____"},'),
  compactBigBitsets: JSON.stringify({ version: 3, tree: { v: 3, o: Object.fromEntries(Object.keys(treeDef.frags).map((k) => [k, '_'.repeat(4096)])), r: {} }, seen: { o: Object.fromEntries(Object.keys(treeDef.frags).map((k) => [k, '_'.repeat(4096)])) } }),
  recentRunsHuge: (() => { const one = '{"t":1,"k":{"wolf":1},"e":["a"],"b":true,"c":true}'; return fill('{"version":3,"stats":{"recentRuns":[', one + ',', one + ']}}'); })(),
  recentRunsWideK: JSON.stringify({ version: 3, stats: { recentRuns: Array.from({ length: 10 }, () => ({ k: Object.fromEntries(Array.from({ length: 1500 }, (_, i) => [`e${i}`, 1])) })) } }),
  longStrings: fill('{"version":3,"settings":{"quality":"', 'x', '"}}'),
  idsB64Long: JSON.stringify({ version: 3, tree: { v: 3, o: { core: idsB64 } } }),
};
let worst = 0;
for (const [name, text] of Object.entries(cases)) {
  const times = [];
  let res;
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    try { res = parseSave(text); } catch (e) { res = { ok: false, code: `THROW ${e && e.name}: ${String(e && e.message).slice(0, 60)}` }; }
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  worst = Math.max(worst, times[2]);
  console.log(`${name.padEnd(22)} ${String(text.length).padStart(7)} chars  median ${times[2].toFixed(1).padStart(7)} ms  -> ${res.ok ? 'ok' : res.code}`);
}
console.log(`worst median ${worst.toFixed(1)} ms`);
