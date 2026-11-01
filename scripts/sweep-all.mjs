// Parallel balance sweep: both characters x both bots, merged table.
// Usage: node scripts/sweep-all.mjs [seeds=24] [chars=wren,elias] [startWeapons=kindred]   (startWeapons: comma list of weapon ids, or 'kindred')
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  const out = [];
  for (const sd of workerData.seeds) {
    const r = playRun(workerData.char, sd, workerData.weapon ? { weapon: workerData.weapon } : {});
    out.push({ outcome: r.outcome, time: r.time, level: r.level, evo: r.marks.evo ?? null, bossKill: r.marks.bossKill ?? null, evos: r.evolved.length, levelups: r.levelups, filler: r.filler, fillerFirst: r.marks.filler ?? null, hearts: r.hearts, magnets: r.magnets, hurts: r.hurts, hurtBy: r.hurtBy || {}, lvl: Object.fromEntries([1, 3, 5, 10].map((k) => [k, r.marks[k]?.lvl ?? null])) });
  }
  parentPort.postMessage(out);
} else {
  const { GATES } = await import('./bot.mjs');
  console.log(`sweep-all: GATES=${GATES} META=${process.env.META || 'none'}`);
  const N = Number(process.argv[2] || 24);
  const chars = (process.argv[3] || 'wren,elias').split(',');
  const weapons = (process.argv[4] || 'kindred').split(',').map((w) => (w === 'kindred' ? null : w));
  const CH = 4;
  const S0 = Number(process.env.SEED_FROM || 1);
  const jobs = [];
  for (const char of chars) for (const weapon of weapons) for (const focus of [false, true]) for (let c = 0; c < CH; c++) {
    const seeds = []; for (let s = S0 + c; s < S0 + N; s += CH) seeds.push(s);
    jobs.push(new Promise((res, rej) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { char, seeds, weapon }, env: { ...process.env, FOCUS: focus ? '1' : '0' } });
      w.on('message', (m) => res({ key: `${char}${weapon ? '+' + weapon : ''}/${focus ? 'focus' : 'random'}`, runs: m }));
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
  const fshare = (rs) => { const f = rs.map((r) => (r.levelups ? (100 * r.filler) / r.levelups : 0)); const ff = rs.map((r) => r.fillerFirst).filter((v) => v != null); return `${med(f).toFixed(0).padStart(3)}/${String(pc(f, 0.9).toFixed(0)).padStart(3)}  ${fmt(med(ff))}`; };
  console.log('bot             win%  lvl  L@5m  firstEvo(p10/p90)  evolved  evos  hearts mag  fill%(med/p90) 1stFill  [deaths <5:00 | 10-11:00 boss | >=11:00]  bossTTK(med)  times');
  for (const [k, runs] of Object.entries(groups).sort()) {
    const n = runs.length;
    const d = runs.filter((r) => r.outcome !== 'victory').map((r) => r.time).sort((a, b) => a - b);
    const evo = runs.map((r) => r.evo).filter((v) => v != null);
    console.log(`${k.padEnd(15)} ${String(Math.round((runs.length - d.length) / n * 100)).padStart(3)}%  ${String(med(runs.map((r) => r.level))).padStart(3)}  ${String(med(runs.map((r) => r.lvl[5]).filter((v) => v != null))).padStart(3)}   ${fmt(med(evo))} (${fmt(pc(evo, 0.1))}/${fmt(pc(evo, 0.9))})   ${evo.length}/${n}     ${med(runs.map((r) => r.evos))}   ${mean(runs.map((r) => r.hearts)).toFixed(1).padStart(5)} ${mean(runs.map((r) => r.magnets)).toFixed(1).padStart(4)}  ${fshare(runs)}  [${d.filter((t) => t < 300).length} | ${d.filter((t) => t >= 600 && t < 660).length} | ${d.filter((t) => t >= 660).length}]  ${fmt(med(runs.map((r) => r.bossKill).filter((v) => v != null).map((v) => v - 600)))}  ${d.map(fmt).join(' ')}`);
    // damage taken by source (EN3-EN5 readout): share of all damage the hero took, telegraph types listed when present
    const tot = {}; let all = 0;
    for (const r of runs) for (const [src, v] of Object.entries(r.hurtBy)) { tot[src] = (tot[src] || 0) + v; all += v; }
    const share = Object.entries(tot).sort((a, b) => b[1] - a[1]).map(([src, v]) => `${src} ${(100 * v / (all || 1)).toFixed(1)}%`).join(', ');
    console.log(`${''.padEnd(15)} dmg taken by source: ${share}`);
  }
}
