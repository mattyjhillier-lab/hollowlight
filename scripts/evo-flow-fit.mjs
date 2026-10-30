// Evolution flow v2 (E2): fit evolutions.json "rankScale" exponents so each evolution's ratio to its base weapon at every trigger-rank spread
// stays close to its ratio at max rank (the accepted home value). Coordinate descent on a log-ratio loss. Read-only: prints a JSON patch.
// Usage: node scripts/evo-flow-fit.mjs [filter] [secs=10] [seeds=2]
import { data, measure } from './evo-same-ranks.mjs';
import { spreads } from './evo-flow-ranks.mjs';

const filter = process.argv[2] || '';
const secs = Number(process.argv[3] || 10);
const seeds = Array.from({ length: Number(process.argv[4] || 2) }, (_, i) => i + 1);
const SCENS = ['single', 'stream10', 'stream40'];
const GRID = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
const avg = (fn) => seeds.reduce((s, sd) => s + fn(sd), 0) / seeds.length;
const out = {};
for (const [eid, e] of Object.entries(data.evolutions)) {
  if (filter && !eid.includes(filter)) continue;
  const stats = Object.keys(data.weapons[e.weapon].stats).filter((k) => k !== 'power');
  const sp = spreads(e.weapon);
  const mx = spreads(e.weapon, 20).balanced;
  const bmax = {}, rmax = {};
  for (const sc of SCENS) { bmax[sc] = avg((sd) => measure(e.weapon, null, sc, mx, sd, secs)); rmax[sc] = avg((sd) => measure(e.weapon, eid, sc, mx, sd, secs)); }
  const use = SCENS.filter((sc) => bmax[sc] > 8 && rmax[sc] > 8); // skip scenarios where a side does ~nothing at max (geometry artefacts)
  const base = {};
  for (const [name, r] of Object.entries(sp)) for (const sc of use) base[`${name}|${sc}`] = avg((sd) => measure(e.weapon, null, sc, r, sd, secs));
  const loss = (rs) => {
    e.rankScale = rs;
    let L = 0;
    for (const [name, r] of Object.entries(sp)) for (const sc of use) {
      const b = base[`${name}|${sc}`], v = avg((sd) => measure(e.weapon, eid, sc, r, sd, secs));
      const ratio = Math.min(20, Math.max(0.05, v / Math.max(b, 1)));
      const target = rmax[sc] / bmax[sc];
      L += Math.log(ratio / target) ** 2;
    }
    return L;
  };
  let best = Object.fromEntries(stats.map((k) => [k, 0]));
  let bl = loss(best);
  const l0 = bl;
  for (let pass = 0; pass < 2; pass++) for (const k of stats) for (const g of GRID) {
    const t = { ...best, [k]: g };
    const l = loss(t);
    if (l < bl - 1e-9) { bl = l; best = t; }
  }
  const trimmed = Object.fromEntries(Object.entries(best).filter(([, v]) => v !== 0));
  delete e.rankScale;
  out[eid] = trimmed;
  console.log(`${eid.padEnd(18)} loss ${l0.toFixed(2)} -> ${bl.toFixed(2)}  scen ${use.join(',') || '(none)'}  rankScale ${JSON.stringify(trimmed)}`);
}
console.log(JSON.stringify(out));
