// Unlock pacing: simulate a player journey (alternating Wren/Elias, bot plays each run with whatever is unlocked
// so far, run results banked into save.stats like src/save does) and report the run number each gate opens.
// No src changes. Usage: node scripts/gates-pace.mjs [journeys=16] [runs=30]   (run in background, ~15 min)
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

if (!isMainThread) {
  const { playGated, unlockedAfter, STARTER_EVOS, GATES, base } = await import('./gates-lib.mjs');
  const { journeys, runs, focus, heroOrder } = workerData;
  const out = [];
  for (const j of journeys) {
    const st = { kills: 0, runs: 0, bestLevel: 0, totalGold: 0, killsByEnemy: {}, bossKills: {}, chapters: {}, evolved: {}, charsUsed: {} };
    const opened = {}; // gate id -> run number (1-based) after which it was unlocked
    const log = [];
    for (let r = 1; r <= runs; r++) {
      const hero = heroOrder[(r - 1) % heroOrder.length];
      const u = unlockedAfter(st);
      const res = playGated({ hero, seed: j * 1000 + r, focus, weapons: [...u.weapons], evos: [...STARTER_EVOS, ...u.evos], tree: null });
      st.runs++; st.kills += res.kills; st.totalGold += res.gold; st.bestLevel = Math.max(st.bestLevel, res.level);
      for (const [k, v] of Object.entries(res.killsByEnemy)) st.killsByEnemy[k] = (st.killsByEnemy[k] || 0) + v;
      if (res.bossKilled) st.bossKills[res.bossId] = (st.bossKills[res.bossId] || 0) + 1;
      const ch = st.chapters[res.chapter] || (st.chapters[res.chapter] = { runs: 0, clears: 0, bestTime: 0 });
      ch.runs++; if (res.outcome === 'victory') ch.clears++; ch.bestTime = Math.max(ch.bestTime, Math.floor(res.time));
      for (const w of res.weapons) if (w.evo) st.evolved[w.evo] = (st.evolved[w.evo] || 0) + 1;
      st.charsUsed[hero] = (st.charsUsed[hero] || 0) + 1;
      const after = unlockedAfter(st);
      for (const id of after.done) if (opened[id] === undefined) opened[id] = r;
      log.push({ r, hero, win: res.outcome === 'victory', t: Math.floor(res.time), lvl: res.level, evos: res.weapons.filter((w) => w.evo).length });
    }
    out.push({ j, opened, log, kills: st.killsByEnemy, evolved: st.evolved });
  }
  parentPort.postMessage(out);
} else {
  const J = Number(process.argv[2] || 16);
  const R = Number(process.argv[3] || 30);
  const { GATES, fmtT } = await import('./gates-lib.mjs');
  const jobs = [];
  for (const focus of [false, true]) for (let j = 1; j <= J; j++) jobs.push({ focus, j });
  const results = { false: [], true: [] };
  let next = 0;
  const lane = async () => {
    while (next < jobs.length) {
      const { focus, j } = jobs[next++];
      const r = await new Promise((res, rej) => {
        const w = new Worker(fileURLToPath(import.meta.url), { workerData: { journeys: [j + (focus ? 500 : 0)], runs: R, focus, heroOrder: ['wren', 'elias'] } });
        w.on('message', res); w.on('error', rej);
      });
      results[focus].push(...r);
    }
  };
  await Promise.all(Array.from({ length: 11 }, lane));
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const pc = (a, p) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
  console.log(`journeys=${J} per bot, ${R} runs each, alternating Wren/Elias starting with Wren, no tree stats (conservative)`);
  for (const focus of [false, true]) {
    const rs = results[focus];
    console.log(`\n== ${focus ? 'focus' : 'random'} bot ==  gate: run number it opens (median p10-p90) | % of journeys that opened it within ${R} runs`);
    for (const g of GATES) {
      const v = rs.map((x) => x.opened[g.id]).filter((x) => x !== undefined);
      console.log(`${g.id.padEnd(18)} ${g.kind.padEnd(6)} ${v.length ? `${String(med(v)).padStart(3)} (${pc(v, 0.1)}-${pc(v, 0.9)})` : '  -         '}  ${Math.round((v.length / rs.length) * 100)}%`);
    }
    const avg = (f) => (rs.reduce((a, x) => a + f(x), 0) / rs.length).toFixed(0);
    console.log(`avg kills over journey: wolf ${avg((x) => x.kills.wolf || 0)}, crow ${avg((x) => x.kills.crow || 0)}, root_crawler ${avg((x) => x.kills.root_crawler || 0)}`);
    const byBucket = [[1, 5], [6, 10], [11, 20], [21, R]].map(([a, b]) => {
      const l = rs.flatMap((x) => x.log.filter((e) => e.r >= a && e.r <= b));
      return `runs ${a}-${b}: win ${Math.round((l.filter((e) => e.win).length / l.length) * 100)}% avg evos ${(l.reduce((s, e) => s + e.evos, 0) / l.length).toFixed(1)} avg time ${fmtT(l.reduce((s, e) => s + e.t, 0) / l.length)}`;
    });
    console.log(byBucket.join('\n'));
  }
}
