// Review scratch probe (weapons-review.md): win% with wolf base speed overridden in memory only.
// Usage: WOLFSPD=110 WOLFPR=12 node scripts/review-probe-wolfspeed.mjs [seeds]   (no files written)
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  const { refreshStats } = await import('../src/sim/cards.js');
  const spd = Number(process.env.WOLFSPD || 90), pr = Number(process.env.WOLFPR || 14);
  let patched = false;
  const patch = (sim) => {
    if (patched) return; patched = true;
    const st = sim.data.weapons.ghost_wolves.stats.speed; st.base = spd; st.perRank = pr;
    for (const w of sim.weapons) refreshStats(w, sim.data);
  };
  parentPort.postMessage(workerData.seeds.map((sd) => playRun(workerData.char, sd, { onOffer: patch }).outcome === 'victory'));
} else {
  const N = Number(process.argv[2] || 96);
  const CH = 4; const jobs = [];
  for (const char of ['wren', 'elias']) for (const focus of [false, true]) for (let c = 0; c < CH; c++) {
    const seeds = []; for (let s = 1 + c; s < 1 + N; s += CH) seeds.push(s);
    jobs.push(new Promise((res, rej) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { char, seeds }, env: { ...process.env, FOCUS: focus ? '1' : '0' } });
      w.on('message', (m) => res({ key: `${char}/${focus ? 'focus' : 'random'}`, m })); w.on('error', rej);
    }));
  }
  const g = {};
  for (const j of await Promise.all(jobs)) (g[j.key] ||= []).push(...j.m);
  console.log(`WOLFSPD=${process.env.WOLFSPD || 90} WOLFPR=${process.env.WOLFPR || 14} N=${N}`);
  for (const [k, v] of Object.entries(g).sort()) console.log(k.padEnd(14), `${(100 * v.filter(Boolean).length / v.length).toFixed(0)}%`);
}
