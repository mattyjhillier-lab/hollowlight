// DR before/after table from dr-verify logs (JSON lines). Usage: node scripts/dr-summary.mjs <before.log> <after.log> [<after2.log> ...]
// Per moment x view, mean over the hit frames: sprites drawn over the hero (occluders), live tells, red-orange % near the hero, numbers beside the '-N'.
import { readFileSync } from 'node:fs';
const load = (files) => files.flatMap((f) => readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith('{') && l.includes('"tag"')).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
const [b, ...a] = process.argv.slice(2);
const agg = (rows) => { const m = new Map(); for (const r of rows) { if (!String(r.tag).startsWith('hit-')) continue; const k = `${r.name.slice(0, 2)} ${r.view}`; if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return m; };
const mean = (rs, k) => (rs.reduce((s, r) => s + (r[k] || 0), 0) / Math.max(1, rs.length)).toFixed(1);
const B = agg(load([b])), A = agg(load(a));
console.log('moment view     | before: occl tells red% near#  | after: occl tells red% near#');
for (const k of [...B.keys()].sort()) { const x = B.get(k), y = A.get(k) || []; const f = (rs) => ['occluders', 'tellsLive', 'redPct', 'numsNearHurt'].map((q) => mean(rs, q).padStart(5)).join(' '); console.log(`${k.padEnd(15)} | ${f(x)}  | ${y.length ? f(y) : '(no data)'}`); }
