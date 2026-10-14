// Parallel balance sweep: both characters x both bots, merged table.
// Usage: node scripts/sweep-all.mjs [seeds=24] [chars=wren,elias]
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  const out = [];
  for (const sd of workerData.seeds) {
    const r = playRun(workerData.char, sd);
    out.push({ outcome: r.outcome, time: r.time, level: r.level, evo: r.marks.evo ?? null, evos: r.evolved.length, hearts: r.hearts, magnets: r.magnets, hurts: r.hurts, lvl: Object.fromEntries([1, 3, 5, 10].map((k) => [k, r.marks[k]?.lvl ?? null])) });
  }
  parentPort.postMessage(out);
} else {
  const N = Number(process.argv[2] || 24);
  const chars = (process.argv[3] || 'wren,elias').split(',');
  const CH = 4;
  const jobs = [];
  for (const char of chars) for (const focus of [false, true]) for (let c = 0; c < CH; c++) {
    const seeds = []; for (let s = 1 + c; s <= N; s += CH) seeds.push(s);
    jobs.push(new Promise((res, rej) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { char, seeds }, env: { ...process.env, FOCUS: focus ? '1' : '0' } });
      w.on('message', (m) => res({ key: `${char}/${focus ? 'focus' : 'random'}`, runs: m }));
      w.on('error', rej);
    }));
  }
  const all = await Promise.all(jobs);
  const groups = {};
  for (const j of all) (groups[j.key] ||= []).push(...j.runs);
  const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
  const pc = (a, p) => [...a].sort((x, y) => x - y)[Math.floor(a.length * p)];
  console.log('bot             win%  lvl  L@5m  firstEvo(p10/p90)  evolved  evos  hearts mag  [deaths <5:00 | >=10:00] times');
  for (const [k, runs] of Object.entries(groups).sort()) {
    const n = runs.length;
    const d = runs.filter((r) => r.outcome !== 'victory').map((r) => r.time).sort((a, b) => a - b);
    const evo = runs.map((r) => r.evo).filter((v) => v != null);
    console.log(`${k.padEnd(15)} ${String(Math.round((runs.length - d.length) / n * 100)).padStart(3)}%  ${String(med(runs.map((r) => r.level))).padStart(3)}  ${String(med(runs.map((r) => r.lvl[5]).filter((v) => v != null))).padStart(3)}   ${fmt(med(evo))} (${fmt(pc(evo, 0.1))}/${fmt(pc(evo, 0.9))})   ${evo.length}/${n}     ${med(runs.map((r) => r.evos))}   ${mean(runs.map((r) => r.hearts)).toFixed(1).padStart(5)} ${mean(runs.map((r) => r.magnets)).toFixed(1).padStart(4)}  [${d.filter((t) => t < 300).length} | ${d.filter((t) => t >= 600).length}]  ${d.map(fmt).join(' ')}`);
  }
}
