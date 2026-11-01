// Win-rate sweep of tree scenarios, both heroes, random + FOCUS picks, in slices.
//   node scripts/review/impact-sweep.mjs <scenario,...> [seeds=48] [seedFrom=1] [focus=0,1]
// scenarios: starter (no tree, GATES=starter), none-all (no tree, GATES=all), half, nogate (the T3 'META=full GATES=all' tree: gate-weapon clusters unbought), full (all clusters + gates).
// half/nogate/full run with GATES=all (every gated weapon open), Blessings on. Prints win %, mean survival, mean damage.
import { runJobs, agg } from './impact-lib.mjs';
const sc = (process.argv[2] || 'starter,full').split(',');
const seeds = Number(process.argv[3] || 48), from = Number(process.argv[4] || 1), FOC = (process.argv[5] || '0,1').split(',').map(Number);
const out = [];
for (const s of sc) {
  const gates = s.startsWith('starter') ? 'starter' : 'all';
  const only = s.endsWith(':sus') ? 'sus' : s.endsWith(':rest') ? 'rest' : null; const s0 = s.split(':')[0];
  const base = s0 === 'starter' || s === 'none-all' ? 'none' : s0 === 'nogate' ? 'nogate' : s0;
  const jobs = [];
  for (const char of ['wren', 'elias']) for (const focus of FOC) for (let k = from; k < from + seeds; k++) jobs.push({ char, seed: k, focus, remove: [], base, only, tag: `${char}/${focus}` });
  const res = await runJobs(jobs, { gates, onProgress: (d, t) => console.error(`${s} ${d}/${t}`) });
  const cell = (ch, f) => agg(jobs.map((j, i) => (j.tag === `${ch}/${f}` ? res[i] : null)).filter(Boolean));
  const row = { s };
  for (const ch of ['wren', 'elias']) for (const f of FOC) row[`${ch}${f ? 'F' : 'R'}`] = cell(ch, f);
  out.push(row);
  const fmt = (x) => (x ? `${x.win.toFixed(0)}% (t ${x.time.toFixed(0)}s)` : '-');
  console.log(`${s.padEnd(9)} seeds ${from}..${from + seeds - 1} | wren R ${fmt(row.wrenR)} F ${fmt(row.wrenF)} | elias R ${fmt(row.eliasR)} F ${fmt(row.eliasF)}`);
}
