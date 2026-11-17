// BLESSINGS FROM THE START: before/after table from docs/blessings-partials (run.sh). before = BLESS_DRAW=old on this code
// (fresh all cells, Meteor mid/max); mid/max cells without a before file fall back to docs/companions-baseline (same bots/seeds/settings).
// node scripts/blessings-compare.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const P = (s) => fileURLToPath(new URL(`../docs/${s}`, import.meta.url));
const rows = (f) => (existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
// B2=1: BLESSINGS 2 mode: before = docs/blessings-partials/after (the shipped 5-Blessing rule), after = docs/blessings2-partials (8 Blessings).
const B2 = process.env.B2 === '1';
const DA = B2 ? 'blessings2-partials' : 'blessings-partials/after', DB = B2 ? 'blessings-partials/after' : 'blessings-partials/before';
const BANDS = { fresh: [15, 30], mid: [30, 55], max: [65, 90] };
const mmss = (s) => (Number.isFinite(s) ? `${Math.floor(Math.round(s) / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}` : '  -');
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
function stats(g) {
  const n = g.length, p = g.filter((r) => r.win).length / n, d = g.filter((r) => !r.win).map((r) => r.time / 60);
  const ev = g.filter((r) => r.evo != null).map((r) => r.evo);
  const so = ev.slice().sort((x, y) => x - y);
  return { med: so.length ? so[so.length >> 1] : NaN, n, p: 100 * p, se: 100 * Math.sqrt(p * (1 - p) / n), evo: avg(ev), evoN: ev.length, early: d.filter((t) => t < 5).length, spread: [6, 8, 10, 12, 14].map((c, i, a) => d.filter((t) => t >= (i ? a[i - 1] : 0) && t < c).length).concat([d.filter((t) => t >= 14).length]) };
}
const key = (r) => `${r.combo}/${r.focus ? 'focus' : 'random'}`;
let flags = 0;
for (const set of Object.keys(BANDS)) {
  const A = rows(P(`${DA}/${set}.jsonl`));
  if (!A.length) continue;
  const Bown = rows(P(`${DB}/${set}.jsonl`)), Bbase = rows(P(`companions-baseline/${set}.jsonl`));
  const [lo, hi] = BANDS[set];
  console.log(`== ${set} band ${lo}-${hi}   win before -> after (diff, 2SE)   firstEvo before -> after   deaths<5:00   deaths <6/8/10/12/14/later after`);
  for (const k of [...new Set(A.map(key))].sort()) {
    const a = stats(A.filter((r) => key(r) === k));
    const own = Bown.filter((r) => key(r) === k), src = own.length >= 100 ? 'dev' : 'C1'; // a full re-run (cells changed since C1) or the C1 rows
    const b = stats(own.length >= 100 ? own : Bbase.filter((r) => key(r) === k));
    const diff = a.p - b.p, se2 = 2 * Math.sqrt(a.se ** 2 + b.se ** 2), dEvo = a.evo - b.evo;
    // wrong direction beyond noise: further outside the band than before by more than 2 SE, or (fresh) leaving the band
    const worse = (b.p > hi && diff > se2) || (b.p < lo && diff < -se2) || (b.p >= lo && b.p <= hi && (a.p > hi + se2 / 2 || a.p < lo - se2 / 2));
    const evoBad = dEvo > 30, earlyBad = a.early > b.early + 4;
    if (worse || evoBad || earlyBad) flags++;
    console.log(`${k.padEnd(36)} ${b.p.toFixed(0).padStart(3)} -> ${a.p.toFixed(0).padStart(3)} (${diff >= 0 ? '+' : ''}${diff.toFixed(0)}, ${se2.toFixed(0)}) ${src}  ${mmss(b.evo)} -> ${mmss(a.evo)} (${dEvo >= 0 ? '+' : ''}${Math.round(dEvo)}s; median ${mmss(b.med)}->${mmss(a.med)}; evolved ${b.evoN}->${a.evoN})  ${b.early} -> ${a.early}  ${a.spread.join('/')}${worse ? '  BAND-WORSE' : ''}${evoBad ? '  EVO-SLIP' : ''}${earlyBad ? '  EARLY-DEATHS' : ''}`);
  }
}
// One-weapon starter runs (fresh): card mix per run.
console.log('== fresh one-weapon runs: per run means (offered cards R real / B Blessing / F fallback; picks R/B/F), level reached, share with every rank used by level 23, fallback-only share of offers');
for (const [lab, f] of [['before', B2 ? 'blessings-partials/after' : 'blessings-partials/before'], ['after', B2 ? 'blessings2-partials' : 'blessings-partials/after']]) {
  const R = rows(P(`${f}/fresh.jsonl`)).filter((r) => r.mix && r.w && r.w.length === 1 && r.seed <= 20); // seeds 1-20 of every cell on both sides
  if (!R.length) continue;
  const m = (k) => avg(R.map((r) => r.mix[k]));
  const used23 = R.filter((r) => r.mix.allUsedLvl != null && r.mix.allUsedLvl <= 23).length / R.length;
  const reach23 = R.filter((r) => r.lvl >= 23);
  const offers = R.reduce((a, r) => a + r.mix.oR + r.mix.oB + r.mix.oF, 0), fb = R.reduce((a, r) => a + r.mix.oF, 0);
  const fbPick = R.reduce((a, r) => a + r.mix.pF, 0), picks = R.reduce((a, r) => a + r.mix.pR + r.mix.pB + r.mix.pF, 0);
  console.log(`${lab.padEnd(7)} n=${R.length} level ${avg(R.map((r) => r.lvl)).toFixed(1)}  offered R ${m('oR').toFixed(1)} B ${m('oB').toFixed(1)} F ${m('oF').toFixed(1)}  picked R ${m('pR').toFixed(1)} B ${m('pB').toFixed(1)} F ${m('pF').toFixed(1)}  all ranks used by L23: ${(100 * used23).toFixed(0)}% of runs (${(100 * reach23.filter((r) => r.mix.allUsedLvl != null && r.mix.allUsedLvl <= 23).length / Math.max(1, reach23.length)).toFixed(0)}% of runs reaching L23)  fallback cards ${(100 * fb / offers).toFixed(0)}% of cards shown, ${(100 * fbPick / picks).toFixed(0)}% of picks  first offer with no weapon/stat card: median level L${[...R.map((r) => r.mix.allUsedLvl ?? 99)].sort((x, y) => x - y)[R.length >> 1]}`);
}
// Identity check: BLESS_DRAW=old must reproduce the C1 rows for cells whose data did not change since C1 (everything but Meteor).
if (!B2) {
  const C1 = new Map(rows(P('companions-baseline/fresh.jsonl')).map((r) => [`${key(r)}/${r.seed}`, r]));
  let same = 0, diff = 0;
  for (const r of rows(P('blessings-partials/before/fresh.jsonl'))) {
    if (r.combo.endsWith('dragonfire_meteor')) continue;
    const c = C1.get(`${key(r)}/${r.seed}`);
    if (!c) continue;
    if (c.win === r.win && c.time === r.time && c.evo === r.evo) same++; else diff++;
  }
  console.log(`identity check (before rule vs C1 rows, non-Meteor fresh): ${same} identical, ${diff} different`);
}
console.log(flags ? `${flags} cell(s) flagged` : 'no cell flagged');
