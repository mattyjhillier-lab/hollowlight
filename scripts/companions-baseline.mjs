// Companions C1 BASELINE (Update B, before any companion change): resumable sweep, one JSONL partial per set in docs/companions-baseline/.
// Usage: node scripts/companions-baseline.mjs <set> <seeds> <hero:weapon,...> [workers=9]
//   set = fresh (GATES=starter META=none BOND=0) | mid (GATES=preset META=half BOND=0) | max (GATES=preset META=full BOND=25); Twilight, blessings on, ability on.
//   Both bots (random FOCUS=0, focus FOCUS=1) per combo. Every finished seed is appended at once; re-run the same command to resume.
//        node scripts/companions-baseline.mjs --sum   (prints SUMMARY lines for every set on disk)
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
const OUT = fileURLToPath(new URL('../docs/companions-baseline', import.meta.url));
const SETS = { fresh: { GATES: 'starter', META: 'none', BOND: '0', band: [15, 30] }, mid: { GATES: 'preset', META: 'half', BOND: '0', band: [30, 55] }, max: { GATES: 'preset', META: 'full', BOND: '25', band: [65, 90] } };
const parse = (l) => { try { return JSON.parse(l); } catch { return null; } }; // a line cut by a shutdown is skipped (that seed re-runs)
const rows = (f) => (existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map(parse).filter(Boolean) : []);
function summary() {
  for (const set of Object.keys(SETS)) {
    const R = rows(`${OUT}/${set}.jsonl`);
    if (!R.length) continue;
    const [lo, hi] = SETS[set].band;
    console.log(`== ${set} (GATES=${SETS[set].GATES} META=${SETS[set].META} BOND=${SETS[set].BOND}, Twilight) band ${lo}-${hi}`);
    const keys = [...new Set(R.map((r) => `${r.combo}/${r.focus ? 'focus' : 'random'}`))].sort();
    for (const k of keys) {
      const g = R.filter((r) => `${r.combo}/${r.focus ? 'focus' : 'random'}` === k), n = g.length, w = g.filter((r) => r.win).length, p = w / n;
      const d = g.filter((r) => !r.win).map((r) => r.time / 60), early = d.filter((t) => t < 5).length;
      const ev = g.filter((r) => r.evo != null).map((r) => r.evo), evo = ev.length ? ev.reduce((a, b) => a + b, 0) / ev.length : NaN;
      const b = [6, 8, 10, 12, 14].map((c, i, a) => d.filter((t) => t >= (i ? a[i - 1] : 0) && t < c).length);
      const pc = p * 100, tag = pc < lo ? 'BELOW' : pc > hi ? 'ABOVE' : 'in';
      console.log(`${k.padEnd(34)} n=${String(n).padStart(3)} win ${pc.toFixed(0).padStart(3)}% +-${(100 * Math.sqrt(p * (1 - p) / n)).toFixed(1)} ${tag.padEnd(5)} firstEvo ${isNaN(evo) ? '  -' : `${Math.floor(evo / 60)}:${String(Math.round(evo % 60)).padStart(2, '0')}`} (${ev.length}/${n} evolved)  deaths<5:00 ${early}  deaths by min <6/8/10/12/14/later: ${b.join('/')}/${d.filter((t) => t >= 14).length}`);
    }
  }
}
if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  for (const sd of workerData.seeds) {
    const r = playRun(workerData.hero, sd, { weapon: workerData.weapon });
    appendFileSync(workerData.file, JSON.stringify({ combo: workerData.combo, focus: workerData.focus, seed: sd, win: r.outcome === 'victory' ? 1 : 0, time: Math.round(r.time), evo: r.marks.evo ?? null, boss: r.bossKilled ? 1 : 0, w: r.weaponIds, ev: r.evolved }) + '\n');
    parentPort.postMessage(sd);
  }
} else if (process.argv[2] === '--sum') summary();
else {
  const [set, N, combos, W = '9'] = process.argv.slice(2);
  if (!SETS[set]) throw new Error(`set must be one of ${Object.keys(SETS).join('/')}`);
  const workers = Math.max(1, Math.min(9, Number(W) || 9)); // shared machine: never more than 9
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/${set}.jsonl`, done = new Set(rows(file).map((r) => `${r.combo}/${r.focus}/${r.seed}`)), jobs = [];
  for (const combo of combos.split(',')) for (const focus of [0, 1]) {
    const ss = [];
    for (let s = 1; s <= Number(N); s++) if (!done.has(`${combo}/${focus}/${s}`)) ss.push(s);
    for (let k = 0; k < ss.length; k += 5) jobs.push({ combo, focus, seeds: ss.slice(k, k + 5) });
  }
  console.log(`${set}: ${done.size} done, ${jobs.reduce((a, j) => a + j.seeds.length, 0)} to run, ${workers} workers`);
  const { band, ...env } = SETS[set];
  let next = 0;
  const lane = async () => { while (next < jobs.length) { const j = jobs[next++], [hero, weapon] = j.combo.split(':'); await new Promise((res, rej) => { const w = new Worker(fileURLToPath(import.meta.url), { workerData: { hero, weapon, combo: j.combo, seeds: j.seeds, focus: j.focus, file }, env: { ...process.env, ...env, TIER: 'normal', WEAPON: '', PREFER_W: '', ABILITY: '', BLESS: '', TREE_UNRELEASED: '', FOCUS: String(j.focus) } }); w.on('exit', res); w.on('error', rej); }); } };
  await Promise.all(Array.from({ length: Math.min(workers, jobs.length || 1) }, lane));
  summary();
}
