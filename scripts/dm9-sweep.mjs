// DM9 resumable paired ability ablation for Ophimber's Rise. One cell = (hero, weapon, gates/meta, bot focus, rise patch); each seed writes
// its row to a JSONL partial file the moment it finishes, so a shutdown loses at most the running seeds. Re-run the same command to resume.
// Usage: node scripts/dm9-sweep.mjs <label> <seeds> [hero=hearthwarden] [weapon=dragonfire_meteor] [workers=10]
//   env: GATES, META, TIER, BOND as bot.mjs; FOCUS=0|1|both (default both); RISE_PATCH='{"hit":1.0}'. Summary: node scripts/dm9-sweep.mjs --sum <label>
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
const OUT = fileURLToPath(new URL('../docs/dm9-partials', import.meta.url)); // partial results (JSONL), committed so a shutdown loses nothing
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const se = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, a.length - 1) / (a.length || 1)); };
function rows(file) { return existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []; }
function summary(label) {
  const R = rows(`${OUT}/${label}.jsonl`);
  for (const f of [0, 1]) {
    const g = R.filter((r) => r.focus === f); if (!g.length) continue;
    const d = g.map((r) => r.on.win - r.off.win), on = mean(g.map((r) => r.on.win)) * 100, off = mean(g.map((r) => r.off.win)) * 100;
    const share = 100 * g.reduce((a, r) => a + r.on.abDmg, 0) / Math.max(1, g.reduce((a, r) => a + r.on.dmg, 0));
    console.log(`${label} ${f ? 'focus ' : 'random'} n=${g.length}  win on ${on.toFixed(1)} off ${off.toFixed(1)}  delta ${(mean(d) * 100).toFixed(1)} +-${(se(d) * 100).toFixed(1)}  share ${share.toFixed(1)}%  uses ${mean(g.map((r) => r.on.uses)).toFixed(1)}  time ${mean(g.map((r) => r.on.time)).toFixed(0)}/${mean(g.map((r) => r.off.time)).toFixed(0)}`);
  }
}
if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  for (const sd of workerData.seeds) {
    const row = { seed: sd, focus: workerData.focus };
    for (const ab of ['on', 'off']) {
      process.env.ABILITY = ab;
      const r = playRun(workerData.hero, sd, { weapon: workerData.weapon });
      row[ab] = { win: r.outcome === 'victory' ? 1 : 0, time: r.time, hurts: r.hurts, uses: r.abilityUses || 0, dmg: r.dmg || 0, abDmg: r.abilityDmg || 0 };
    }
    appendFileSync(workerData.file, JSON.stringify(row) + '\n');
    parentPort.postMessage(sd);
  }
} else if (process.argv[2] === '--sum') summary(process.argv[3]);
else {
  const [label, N, hero = 'hearthwarden', weapon = 'dragonfire_meteor', W = '10'] = process.argv.slice(2);
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/${label}.jsonl`;
  const done = new Set(rows(file).map((r) => `${r.focus}:${r.seed}`));
  const foci = (process.env.FOCUS || 'both') === 'both' ? [0, 1] : [Number(process.env.FOCUS)];
  const todo = [];
  for (let s = 1; s <= Number(N); s++) for (const f of foci) if (!done.has(`${f}:${s}`)) todo.push({ s, f });
  console.log(`${label}: ${done.size} done, ${todo.length} to run`);
  const nW = Math.min(Number(W), todo.length || 1), ws = [];
  for (let i = 0; i < nW; i++) {
    const mine = todo.filter((_, j) => j % nW === i);
    // each worker handles one focus value per seed; split by focus inside
    for (const f of foci) { const seeds = mine.filter((t) => t.f === f).map((t) => t.s); if (seeds.length) ws.push(new Promise((res, rej) => { const w = new Worker(fileURLToPath(import.meta.url), { workerData: { hero, weapon, seeds, focus: f, file }, env: { ...process.env, FOCUS: String(f) } }); w.on('exit', res); w.on('error', rej); })); }
  }
  await Promise.all(ws);
  summary(label);
}
