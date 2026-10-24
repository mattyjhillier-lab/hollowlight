// CHARACTER SYSTEM v2 ability ablation (CH2 done check): paired seeds, ability ON vs OFF, per hero x starting weapon x bot.
// Target (characters-v2.md 5.1): ON - OFF = +2 to +5 win points for EVERY starting weapon; damage share <= 10% (both v2 abilities deal none).
// Usage: node scripts/ability-ablate.mjs [seeds=48] [heroes=wren,elias] [weapons=ghost_wolves,holy_orbit]   (GATES / TIER / META as bot.mjs)
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  const out = [];
  for (const sd of workerData.seeds) {
    const row = { seed: sd };
    for (const ab of ['on', 'off']) {
      process.env.ABILITY = ab; // read by the bot on every input frame
      const r = playRun(workerData.hero, sd, { weapon: workerData.weapon });
      row[ab] = { win: r.outcome === 'victory' ? 1 : 0, time: r.time, hurts: r.hurts, hpLost: r.hpLost, uses: r.abilityUses || 0 };
    }
    out.push(row);
  }
  parentPort.postMessage(out);
} else {
  const N = Number(process.argv[2] || 48);
  const heroes = (process.argv[3] || 'wren,elias').split(',');
  const weapons = (process.argv[4] || 'ghost_wolves,holy_orbit').split(',');
  const CH = 3;
  const jobs = [];
  for (const hero of heroes) for (const weapon of weapons) for (const focus of [false, true]) for (let c = 0; c < CH; c++) {
    const seeds = []; for (let s = 1 + c; s <= N; s += CH) seeds.push(s);
    jobs.push(new Promise((res, rej) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { hero, weapon, seeds }, env: { ...process.env, FOCUS: focus ? '1' : '0' } });
      w.on('message', (m) => res({ key: `${hero}+${weapon}/${focus ? 'focus' : 'random'}`, rows: m }));
      w.on('error', rej);
    }));
  }
  const all = await Promise.all(jobs);
  const groups = {};
  for (const j of all) (groups[j.key] ||= []).push(...j.rows);
  const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const se = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, a.length - 1) / (a.length || 1)); };
  console.log(`ability-ablate: GATES=${process.env.GATES || 'starter'} seeds=${N} (paired)`);
  console.log('hero+weapon/bot                win% on  off   delta(+-SE)   time on/off (mean s)   hits on/off   uses/run');
  for (const [k, rows] of Object.entries(groups).sort()) {
    const d = rows.map((r) => r.on.win - r.off.win);
    const won = mean(rows.map((r) => r.on.win)) * 100, woff = mean(rows.map((r) => r.off.win)) * 100;
    console.log(`${k.padEnd(30)} ${won.toFixed(0).padStart(5)} ${woff.toFixed(0).padStart(4)}   ${(mean(d) * 100 >= 0 ? '+' : '') + (mean(d) * 100).toFixed(1)} (+-${(se(d) * 100).toFixed(1)})   ${mean(rows.map((r) => r.on.time)).toFixed(0)}/${mean(rows.map((r) => r.off.time)).toFixed(0)}   ${mean(rows.map((r) => r.on.hurts)).toFixed(0)}/${mean(rows.map((r) => r.off.hurts)).toFixed(0)}   ${mean(rows.map((r) => r.on.uses)).toFixed(1)}`);
  }
}
