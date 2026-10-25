// FINAL RETUNE baseline matrix (docs/design/final-retune-plan.md). Read-only w.r.t. src/: bot.mjs playRun with an explicit tree.
// Cells: hero x starting weapon x tree {none, half, full} x tier {normal, hard, expert} x Bond {0, 25}; random-pick bot, Blessings on, dodge on.
// Tree states: none = brand-new save (starter grant of the starting weapon only); half/full = presetTree(half|full) WITH the gate nodes
// (other weapons/evolutions open as bought) plus the starting weapon's starter grant.
// Usage: node scripts/rt-matrix.mjs out.jsonl [headSeeds=96] [otherSeeds=24] [workers=10] [focusSeeds=48] [midSeeds=48]   (appends one JSON line per run; resumes)
//   Priorities (run in order; seeds interleaved inside each, so a time-limited run leaves a priority's cells with about equal seeds):
//   0 no-tree Twilight Bond-0 random (headSeeds) | 1 same, FOCUS (focusSeeds) | 2 half/full tree Twilight Bond-0 random (midSeeds) |
//   3 Deep Dusk / Long Night Bond 0, and Bond 25 on no/full tree Twilight + Deep Dusk (otherSeeds). Not measured: Bond 25 on the half tree / Long Night.
//   CELLS=<regex> limits the cells (matched against the cell key).
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';

const HEROES = ['wren', 'elias'];
const WEAPONS = ['ghost_wolves', 'raven_flock', 'spirit_bolts', 'chain_lightning', 'holy_orbit'];
const TREES = ['none', 'half', 'full'];
const TIERS = ['normal', 'hard', 'expert'];
const BONDS = [0, 25];

if (!isMainThread) {
  const { playRun } = await import('./bot.mjs'); // env TIER + FOCUS set per worker; GATES=starter
  const { compileTree, presetTree, aggregateMods } = await import('../src/meta/tree.js');
  const { loadTree } = await import('../src/meta/treefs.mjs');
  const { starterNodes } = await import('../src/meta/starter.js');
  const { tierIndex } = await import('../src/sim/tiers.js');
  const dir = new URL('../src/data/', import.meta.url);
  const load = (n) => JSON.parse(readFileSync(new URL(`${n}.json`, dir), 'utf8'));
  const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
  const composed = loadTree(data); data.tree = composed.live;
  const def = compileTree(data.tree, data);
  const treeFor = (name, weapon, tier) => {
    const own = Object.fromEntries(starterNodes(composed.info, weapon).map((id) => [id, 1]));
    const t = name === 'none' ? own : { ...presetTree(def, name, true), ...own };
    return aggregateMods(t, def, data, { tier: tierIndex(tier) });
  };
  for (const j of workerData.jobs) {
    const r = playRun(j.hero, j.seed, { weapon: j.weapon, tree: treeFor(j.tree, j.weapon, j.tier), bond: j.bond, endless: false, assist: false });
    parentPort.postMessage({ key: j.key, seed: j.seed, win: r.outcome === 'victory', t: Math.round(r.time), lvl: r.level, evo: r.marks.evo ?? null, nEvo: r.evolved.length, bossKill: r.marks.bossKill ?? null, minis: r.minis, w: r.weaponIds.length, kills: r.kills, gold: r.gold });
  }
} else {
  const out = process.argv[2] || 'rt-matrix.jsonl';
  const HEAD = Number(process.argv[3] || 96), OTHER = Number(process.argv[4] || 24), NW = Number(process.argv[5] || 10), FOC = Number(process.argv[6] || 48), MID = Number(process.argv[7] || 48);
  const only = process.env.CELLS ? new RegExp(process.env.CELLS) : null;
  const done = new Set();
  if (existsSync(out)) for (const l of readFileSync(out, 'utf8').split('\n')) if (l) { const o = JSON.parse(l); done.add(`${o.key}#${o.seed}`); }
  const groups = new Map(); // tier|focus -> jobs
  const add = (hero, weapon, tree, tier, bond, focus, n, pri) => {
    const key = `${hero}|${weapon}|${tree}|${tier}|b${bond}|${focus ? 'focus' : 'random'}`;
    if (only && !only.test(key)) return;
    for (let seed = 1; seed <= n; seed++) if (!done.has(`${key}#${seed}`)) {
      const g = `${pri}|${tier}|${focus ? 1 : 0}`; if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push({ key, hero, weapon, tree, tier, bond, seed });
    }
  };
  for (const hero of HEROES) for (const weapon of WEAPONS) for (const tree of TREES) for (const tier of TIERS) for (const bond of BONDS) {
    const tw0 = tier === 'normal' && bond === 0;
    if (tw0 && tree === 'none') { add(hero, weapon, tree, tier, bond, false, HEAD, 0); add(hero, weapon, tree, tier, bond, true, FOC, 1); }
    else if (tw0) add(hero, weapon, tree, tier, bond, false, MID, 2);
    else if (bond === 0 || (tree !== 'half' && tier !== 'expert')) add(hero, weapon, tree, tier, bond, false, OTHER, 3);
    // not measured (time budget): Bond 25 on the half tree and on Long Night
  }
  const chunks = [];
  for (const [g, jobs] of groups) { // interleave seeds so a time-limited run still covers every cell
    jobs.sort((a, b) => a.seed - b.seed || a.key.localeCompare(b.key));
    const [pri, tier, focus] = g.split('|');
    for (let i = 0; i < jobs.length; i += 4) chunks.push({ pri: Number(pri), tier, focus, jobs: jobs.slice(i, i + 4), s: jobs[i].seed });
  }
  chunks.sort((a, b) => a.pri - b.pri || a.s - b.s);
  const total = chunks.reduce((a, c) => a + c.jobs.length, 0);
  console.error(`rt-matrix: ${total} runs to do (${done.size} already in ${out}), ${chunks.length} chunks, ${NW} workers`);
  let next = 0, n = 0; const t0 = Date.now();
  const lane = async () => {
    while (next < chunks.length) {
      const c = chunks[next++];
      await new Promise((res, rej) => {
        const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: c.jobs }, env: { ...process.env, TIER: c.tier, FOCUS: c.focus, GATES: 'starter', BLESS: 'on', META: 'none', BOND: '0', ENDLESS: '0', ASSIST: '0' } });
        w.on('message', (m) => { appendFileSync(out, JSON.stringify(m) + '\n'); if (++n % 200 === 0) console.error(`${n}/${total} ${((Date.now() - t0) / 60000).toFixed(1)} min`); });
        w.on('error', rej); w.on('exit', res);
      });
    }
  };
  await Promise.all(Array.from({ length: NW }, lane));
  console.error(`done ${n} runs in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}
