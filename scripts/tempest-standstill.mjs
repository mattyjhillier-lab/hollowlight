// MEASURE ONLY (Spirit Tempest stand-still probe). Reuses bot.mjs playRun + live-tree.mjs treeFor (rt-matrix harness).
// Arms: move|stand x forced evolution (forced = when several gold evolutions are offered, the named one is picked).
// stand = player position pinned to its start after every step, ability off (zero movement, same card rule).
// Usage: node scripts/tempest-standstill.mjs out.jsonl [seeds=24] [workers=10]   (resumes)
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';

const ARMS = [ // [weapon, evolution]
  ['spirit_bolts', 'spirit_tempest'], ['spirit_bolts', 'soul_lance'], ['spirit_bolts', 'returning_pages'],
  ['chain_lightning', 'thunder_judgment'], ['holy_orbit', 'judgement_wheel'],
];
if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  const { liveTreeFactory } = await import('./live-tree.mjs');
  const { treeFor } = await liveTreeFactory();
  for (const j of workerData.jobs) {
    let x0, y0, kEvo = null, tEvo = null, hpEvo = null;
    const r = playRun('wren', j.seed, {
      weapon: j.weapon, tree: treeFor(j.tree, j.weapon, j.tier, { open: true }), bond: 0,
      onOffer: (sim) => { const g = sim.offer.gold.filter((o) => o.key.includes(j.evo)); if (g.length) sim.offer.gold = g; },
      onStep: (sim) => {
        if (x0 === undefined) { x0 = sim.player.x; y0 = sim.player.y; }
        if (j.stand) { sim.player.x = x0; sim.player.y = y0; }
        if (tEvo === null && sim.weapons.some((w) => w.evo === j.evo)) { tEvo = sim.time; kEvo = sim.kills ?? 0; }
      },
    });
    parentPort.postMessage({ key: j.key, seed: j.seed, win: r.outcome === 'victory', t: Math.round(r.time), evoT: tEvo === null ? null : Math.round(tEvo), got: r.evolved.includes(j.evo), kills: r.kills, kEvo, hpLost: Math.round(r.hpLost), lvl: r.level });
  }
} else {
  const out = process.argv[2] || 'tempest-standstill.jsonl';
  const SEEDS = Number(process.argv[3] || 24), NW = Number(process.argv[4] || 10);
  const done = new Set();
  if (existsSync(out)) for (const l of readFileSync(out, 'utf8').split('\n')) if (l) { const o = JSON.parse(l); done.add(`${o.key}#${o.seed}`); }
  const jobs = [];
  for (const tier of ['normal', 'hard']) for (const tree of ['none', 'half']) for (const [weapon, evo] of ARMS) for (const stand of [false, true]) for (let seed = 1; seed <= SEEDS; seed++) {
    const key = `${tier}|${tree}|${weapon}|${evo}|${stand ? 'stand' : 'move'}`;
    if (!done.has(`${key}#${seed}`)) jobs.push({ key, weapon, evo, stand, tree, tier, seed });
  }
  console.error(`${jobs.length} runs`);
  // one worker per (tier, stand) group: ABILITY env and TIER env are read at bot import
  const groups = new Map();
  for (const j of jobs) { const g = `${j.tier}|${j.stand}`; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(j); }
  const chunks = [];
  for (const [g, js] of groups) { const [tier, stand] = g.split('|'); js.sort((a, b) => a.seed - b.seed); for (let i = 0; i < js.length; i += 4) chunks.push({ tier, stand: stand === 'true', jobs: js.slice(i, i + 4) }); }
  let next = 0, n = 0; const t0 = Date.now();
  const lane = async () => {
    while (next < chunks.length) {
      const c = chunks[next++];
      await new Promise((res, rej) => {
        const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: c.jobs }, env: { ...process.env, TIER: c.tier, FOCUS: '0', GATES: 'starter', BLESS: 'on', META: 'none', BOND: '0', ENDLESS: '0', ASSIST: '0', ABILITY: c.stand ? 'off' : 'on' } });
        w.on('message', (m) => { appendFileSync(out, JSON.stringify(m) + '\n'); if (++n % 50 === 0) console.error(`${n}/${jobs.length} ${((Date.now() - t0) / 60000).toFixed(1)} min`); });
        w.on('error', rej); w.on('exit', res);
      });
    }
  };
  await Promise.all(Array.from({ length: NW }, lane));
  console.error(`done ${n} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}
