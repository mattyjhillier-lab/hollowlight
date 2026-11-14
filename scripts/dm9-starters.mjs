// DM9 resumable starter check: win%, defeat times, per hero:weapon x bot, ability ON. Each finished seed is appended to a JSONL partial; re-run to resume.
// Usage: node scripts/dm9-starters.mjs <label> <seeds> <hero:weapon,...> [workers=10]   env: TREE_UNRELEASED=1 META GATES TIER BOND as bot.mjs
//        node scripts/dm9-starters.mjs --sum <label>
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
const OUT = fileURLToPath(new URL('../docs/dm9-partials', import.meta.url)); // partial results (JSONL), committed so a shutdown loses nothing
const rows = (f) => (existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
function summary(label) {
  const R = rows(`${OUT}/${label}.jsonl`), keys = [...new Set(R.map((r) => `${r.combo}/${r.focus ? 'focus' : 'random'}`))].sort();
  for (const k of keys) {
    const g = R.filter((r) => `${r.combo}/${r.focus ? 'focus' : 'random'}` === k), n = g.length, w = g.filter((r) => r.win).length, p = w / n;
    const d = g.filter((r) => !r.win).map((r) => r.time / 60), early = d.filter((t) => t < 5).length;
    const b = [6, 8, 10, 12, 14].map((c, i, a) => d.filter((t) => t >= (i ? a[i - 1] : 0) && t < c).length);
    console.log(`${k.padEnd(40)} n=${n} win ${(p * 100).toFixed(1)}% +-${(100 * Math.sqrt(p * (1 - p) / n)).toFixed(1)}  deaths<5:00 ${early}  by min <6/8/10/12/14: ${b.join('/')} later ${d.filter((t) => t >= 14).length} (<5 counted in first)`);
  }
}
if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  for (const sd of workerData.seeds) {
    const r = playRun(workerData.hero, sd, { weapon: workerData.weapon });
    appendFileSync(workerData.file, JSON.stringify({ combo: workerData.combo, focus: workerData.focus, seed: sd, win: r.outcome === 'victory' ? 1 : 0, time: r.time }) + '\n');
    parentPort.postMessage(sd);
  }
} else if (process.argv[2] === '--sum') summary(process.argv[3]);
else {
  const [label, N, combos, W = '10'] = process.argv.slice(2);
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/${label}.jsonl`, done = new Set(rows(file).map((r) => `${r.combo}/${r.focus}/${r.seed}`)), todo = [];
  for (const combo of combos.split(',')) for (const focus of [0, 1]) for (let s = 1; s <= Number(N); s++) if (!done.has(`${combo}/${focus}/${s}`)) todo.push({ combo, focus, s });
  console.log(`${label}: ${done.size} done, ${todo.length} to run`);
  // bounded pool: at most W worker threads at once, each takes a chunk of 4 seeds of one (combo, bot) cell
  const jobs = [];
  for (const combo of combos.split(',')) for (const focus of [0, 1]) { const ss = todo.filter((t) => t.combo === combo && t.focus === focus).map((t) => t.s); for (let k = 0; k < ss.length; k += 4) jobs.push({ combo, focus, seeds: ss.slice(k, k + 4) }); }
  let next = 0;
  const lane = async () => { while (next < jobs.length) { const j = jobs[next++], [hero, weapon] = j.combo.split(':'); await new Promise((res, rej) => { const w = new Worker(fileURLToPath(import.meta.url), { workerData: { hero, weapon, combo: j.combo, seeds: j.seeds, focus: j.focus, file }, env: { ...process.env, FOCUS: String(j.focus) } }); w.on('exit', res); w.on('error', rej); }); } };
  await Promise.all(Array.from({ length: Math.min(Number(W), jobs.length || 1) }, lane));
  summary(label);
}
