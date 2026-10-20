// Elder Treant balance sweep (boss-treant-v1 (h) targets): wren/elias x random/FOCUS, N seeds each, parallel workers.
// Usage: node scripts/boss-sweep.mjs [seeds=96] [label]   Env: GATES, META, TIER, DODGE=0, BLESS (as bot.mjs), SEED_FROM, HEROES=wren,elias, PICKS=random,focus
// Prints per cell: overall win %, reached-the-boss %, P(beat | reach), fight length (median / p90, wins), boss share of all defeats, death times,
// the adds' share of the kit's damage in the fight, and which move landed the killing blow.
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  parentPort.postMessage(workerData.seeds.map((sd) => {
    const r = playRun(workerData.char, sd);
    return { win: r.outcome === 'victory', time: r.time, fight: r.fight, boss: r.boss, last: r.hurt && r.hurt.last, level: r.level };
  }));
} else {
  const { GATES, BLESS, DODGE, TIER } = await import('./bot.mjs');
  const N = Number(process.argv[2] || 96);
  const label = process.argv[3] || '';
  const S0 = Number(process.env.SEED_FROM || 1);
  const heroes = (process.env.HEROES || 'wren,elias').split(',').filter((h) => /^[a-z]+$/.test(h));
  const picks = (process.env.PICKS || 'random,focus').split(',');
  const CH = Number(process.env.WORKERS_PER_CELL || 3);
  const jobs = [];
  for (const char of heroes) for (const pk of picks) for (let c = 0; c < CH; c++) {
    const seeds = []; for (let s = S0 + c; s < S0 + N; s += CH) seeds.push(s);
    jobs.push(new Promise((res, rej) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { char, seeds }, env: { ...process.env, FOCUS: pk === 'focus' ? '1' : '0' } });
      w.on('message', (m) => res({ key: `${char}/${pk}`, runs: m })); w.on('error', rej);
    }));
  }
  const groups = {};
  for (const j of await Promise.all(jobs)) (groups[j.key] ||= []).push(...j.runs);
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const ci = (p, n) => (n ? Math.round(196 * Math.sqrt((p * (1 - p)) / n)) : 0);
  const q = (a, f) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))] : null);
  const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
  console.log(`boss-sweep ${label} GATES=${GATES} META=${process.env.META || 'none'} TIER=${TIER} BLESS=${BLESS} DODGE=${DODGE ? 'on' : 'off'} N=${N}`);
  console.log('cell           win%(+/-)  reach%  beat|reach(+/-)  fight med/p90 (wins)  fight med (all)  bossShareOfDefeats  deaths<5:00  death p10/p50/p90  addsDmg%  killedBy');
  for (const [k, rs] of Object.entries(groups).sort()) {
    const n = rs.length, w = rs.filter((r) => r.win).length, reach = rs.filter((r) => r.fight), beat = reach.filter((r) => r.win);
    const defeats = rs.filter((r) => !r.win), inFight = defeats.filter((r) => r.fight);
    const fwin = beat.map((r) => r.fight.time), fall = reach.map((r) => r.fight.time);
    const dt = defeats.map((r) => r.time);
    const adds = reach.reduce((a, r) => a + (r.boss ? r.boss.dmgAdds : 0), 0), bossD = reach.reduce((a, r) => a + (r.boss ? r.boss.dmgBoss : 0), 0);
    const kb = {};
    for (const r of inFight) { const kk = r.last ? `${r.last.src === 'elder_treant' ? '' : r.last.src + ':'}${r.last.kind}` : '?'; kb[kk] = (kb[kk] || 0) + 1; }
    const pw = w / n, pb = reach.length ? beat.length / reach.length : 0;
    console.log(`${k.padEnd(14)} ${String(pct(w, n)).padStart(3)}% +/-${String(ci(pw, n)).padStart(2)}  ${String(pct(reach.length, n)).padStart(4)}%   ${String(pct(beat.length, reach.length)).padStart(3)}% +/-${String(ci(pb, reach.length)).padStart(2)} (n${reach.length})   ${String(q(fwin, 0.5)?.toFixed(0) ?? '-').padStart(4)} / ${String(q(fwin, 0.9)?.toFixed(0) ?? '-').padStart(4)} s          ${String(q(fall, 0.5)?.toFixed(0) ?? '-').padStart(4)} s         ${String(pct(inFight.length, defeats.length)).padStart(3)}% (${inFight.length}/${defeats.length})        ${dt.filter((t) => t < 300).length}          ${fmt(q(dt, 0.1))} ${fmt(q(dt, 0.5))} ${fmt(q(dt, 0.9))}   ${String(pct(adds, adds + bossD)).padStart(3)}%   ${Object.entries(kb).sort((a, b) => b[1] - a[1]).map(([a, b]) => `${a} ${b}`).join(', ')}`);
  }
}
