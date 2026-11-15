// DM10 before/after summary of docs/dm10-partials/{before,after}.jsonl. node scripts/dm10-summary.mjs
import { readFileSync } from 'node:fs';
const D = new URL('../docs/dm10-partials/', import.meta.url);
const load = (v) => readFileSync(new URL(v + '.jsonl', D), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const R = { before: load('before'), after: load('after') };
const band = (k) => (k.includes('|half|') ? [30, 55] : [65, 90]);
const keys = [...new Set(R.after.map((r) => r.key))].sort();
const st = (rows) => { const n = rows.length, w = rows.filter((r) => r.win).length, p = w / n; const evo = rows.filter((r) => r.evo != null).map((r) => r.evo); return { n, p: 100 * p, se: 100 * Math.sqrt(p * (1 - p) / n), evo: evo.length ? evo.reduce((a, b) => a + b, 0) / evo.length : NaN, d5: 100 * rows.filter((r) => !r.win && r.t < 300).length / n, meteor: 100 * rows.filter((r) => r.w.includes('dragonfire')).length / n }; };
for (const k of keys) {
  const b = st(R.before.filter((r) => r.key === k)), a = st(R.after.filter((r) => r.key === k)), [lo, hi] = band(k);
  const diff = a.p - b.p, z = diff / Math.hypot(a.se, b.se);
  console.log(`${k.padEnd(26)} before ${b.p.toFixed(0)}+-${b.se.toFixed(1)} (n${b.n}) evo ${b.evo.toFixed(0)}s d5 ${b.d5.toFixed(0)}% | after ${a.p.toFixed(0)}+-${a.se.toFixed(1)} (n${a.n}) evo ${a.evo.toFixed(0)}s d5 ${a.d5.toFixed(0)}% meteor ${a.meteor.toFixed(0)}% | diff ${diff >= 0 ? '+' : ''}${diff.toFixed(0)} z=${z.toFixed(1)} ${Math.abs(z) > 2 ? 'SIG' : 'noise'} | band ${lo}-${hi}: ${a.p >= lo && a.p <= hi ? 'in' : a.p < lo ? 'BELOW' : 'ABOVE'}`);
}
