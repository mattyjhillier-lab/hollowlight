// MEASURE ONLY, supplement to tempest-standstill.mjs: the evolution is GRANTED at the start of minute 7 (sim.time jumped to T0),
// so move vs stand-still can be compared with the evolution in hand (a stand-still hero dies before it can earn one: see the main probe).
// Kit: solo = only the granted weapon (pair 5, others 3); team = + Ghost Wolves and Holy Orbit base ranks 3. 'base' = Spirit Bolts pair 5, no evolution.
// Usage: node scripts/tempest-standstill-grant.mjs out.jsonl [seeds=32] [workers=12] [T0=420]
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
const ARMS = [['spirit_bolts', 'spirit_tempest'], ['spirit_bolts', 'soul_lance'], ['spirit_bolts', 'returning_pages'], ['spirit_bolts', 'base'], ['chain_lightning', 'thunder_judgment'], ['holy_orbit', 'judgement_wheel']];
if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  const { liveTreeFactory } = await import('./live-tree.mjs');
  const { treeFor, data } = await liveTreeFactory();
  const T0 = workerData.T0;
  for (const j of workerData.jobs) {
    let x0, y0, init = false, k0 = 0, h0 = 0;
    const ranksOf = (wid, pair, v) => Object.fromEntries(Object.keys(data.weapons[wid].stats).map((k) => [k, pair.includes(k) ? 5 : v]));
    const r = playRun('wren', j.seed, {
      weapon: j.weapon, tree: treeFor('half', j.weapon, 'normal', { open: true }), bond: 0,
      onStep: (sim) => {
        if (!init) {
          init = true; x0 = sim.player.x; y0 = sim.player.y;
          sim.time = T0;
          const pair = j.evo === 'base' ? ['power', 'speed'] : data.evolutions[j.evo].pair;
          sim.debugGrant(j.weapon, ranksOf(j.weapon, pair, 3), j.evo === 'base' ? null : j.evo);
          if (j.team) for (const m of ['ghost_wolves', 'holy_orbit']) if (m !== j.weapon) sim.debugGrant(m, ranksOf(m, [], 3), null);
          k0 = sim.kills; h0 = sim.player.hp;
        }
        if (j.stand) { sim.player.x = x0; sim.player.y = y0; }
      },
    });
    parentPort.postMessage({ key: j.key, seed: j.seed, win: r.outcome === 'victory', t: Math.round(r.time), kills: r.kills, k0, hpLost: Math.round(r.hpLost) });
  }
} else {
  const out = process.argv[2], SEEDS = Number(process.argv[3] || 32), NW = Number(process.argv[4] || 12), T0 = Number(process.argv[5] || 420);
  const done = new Set();
  if (existsSync(out)) for (const l of readFileSync(out, 'utf8').split('\n')) if (l) { const o = JSON.parse(l); done.add(`${o.key}#${o.seed}`); }
  const jobs = [];
  for (const team of [false, true]) for (const [weapon, evo] of ARMS) for (const stand of [false, true]) for (let seed = 1; seed <= SEEDS; seed++) {
    const key = `T${T0}|${team ? 'team' : 'solo'}|${weapon}|${evo}|${stand ? 'stand' : 'move'}`;
    if (!done.has(`${key}#${seed}`)) jobs.push({ key, weapon, evo, stand, team, seed });
  }
  const groups = new Map();
  for (const j of jobs) { const g = String(j.stand); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(j); }
  const chunks = [];
  for (const [g, js] of groups) { js.sort((a, b) => a.seed - b.seed); for (let i = 0; i < js.length; i += 4) chunks.push({ stand: g === 'true', jobs: js.slice(i, i + 4) }); }
  console.error(`${jobs.length} runs`);
  let next = 0, n = 0; const t0 = Date.now();
  const lane = async () => { while (next < chunks.length) { const c = chunks[next++]; await new Promise((res, rej) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: c.jobs, T0 }, env: { ...process.env, TIER: 'normal', FOCUS: '0', GATES: 'starter', BLESS: 'on', META: 'none', BOND: '0', ENDLESS: '0', ASSIST: '0', ABILITY: c.stand ? 'off' : 'on' } });
    w.on('message', (m) => { appendFileSync(out, JSON.stringify(m) + '\n'); if (++n % 50 === 0) console.error(`${n}/${jobs.length} ${((Date.now() - t0) / 60000).toFixed(1)} min`); });
    w.on('error', rej); w.on('exit', res); }); } };
  await Promise.all(Array.from({ length: NW }, lane));
  console.error(`done ${n} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}
