// FINAL RETUNE baseline matrix (docs/design/final-retune-plan.md). Read-only w.r.t. src/: bot.mjs playRun with an explicit tree.
// Cells: hero x starting weapon x tree {none, half, full} x tier {normal, hard, expert} x Bond {0, 25}; Blessings on, dodge on.
// Tree states: none = brand-new save (starter grant of the starting weapon only); half/full = presetTree(half|full) WITH the gate nodes
// (other weapons/evolutions open as bought) plus the starting weapon's starter grant.
// Usage: node scripts/rt-matrix.mjs out.jsonl [headSeeds=96] [otherSeeds=24] [workers=10] [focusSeeds=48]   (appends one JSON line per run; resumes)
//   Priorities (LOCKED 'FINAL RETUNE TARGETS' 2026-10-25 headline cells first; seeds interleaved inside each priority):
//   0 Twilight random: fresh (none, Bond 0), mid (half, Bond 0), maxed (full, Bond 25)  (headSeeds)
//   1 fresh Twilight FOCUS (focusSeeds) | 2 Long Night maxed (full, Bond 25) random (headSeeds)
//   3 context (otherSeeds): Twilight full Bond 0 and none Bond 25; Deep Dusk none/half/full Bond 0 + full Bond 25; Long Night half/full Bond 0.
//   CELLS=<regex> limits the cells (matched against the cell key).
//   RT_ASSIST=1 (Gentle Light) / RT_ENDLESS=1 (stay in the dark after a dawn): bot field becomes random-assist / random-endless; endless lines add dark (s past dawn).
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
    const r = playRun(j.hero, j.seed, { weapon: j.weapon, tree: treeFor(j.tree, j.weapon, j.tier), bond: j.bond, endless: !!workerData.endless, assist: !!workerData.assist });
    parentPort.postMessage({ key: j.key, seed: j.seed, win: r.outcome === 'victory', t: Math.round(r.time), lvl: r.level, evo: r.marks.evo ?? null, nEvo: r.evolved.length, bossKill: r.marks.bossKill ?? null, minis: r.minis, w: r.weaponIds.length, kills: r.kills, gold: r.gold, ...(workerData.endless ? { win: !!r.endless || r.outcome === 'victory', dark: r.endless ? Math.round(r.endless.dark) : null } : {}) });
  }
} else {
  const out = process.argv[2] || 'rt-matrix.jsonl';
  const HEAD = Number(process.argv[3] || 96), OTHER = Number(process.argv[4] || 24), NW = Number(process.argv[5] || 10), FOC = Number(process.argv[6] || 48);
  const AS = process.env.RT_ASSIST === '1', EN = process.env.RT_ENDLESS === '1', EXTRA = AS ? '-assist' : EN ? '-endless' : '';
  const only = process.env.CELLS ? new RegExp(process.env.CELLS) : null;
  const done = new Set();
  if (existsSync(out)) for (const l of readFileSync(out, 'utf8').split('\n')) if (l) { const o = JSON.parse(l); done.add(`${o.key}#${o.seed}`); }
  const groups = new Map(); // tier|focus -> jobs
  const add = (hero, weapon, tree, tier, bond, focus, n, pri) => {
    const key = `${hero}|${weapon}|${tree}|${tier}|b${bond}|${focus ? 'focus' : 'random'}${EXTRA}`;
    if (only && !only.test(key)) return;
    for (let seed = 1; seed <= n; seed++) if (!done.has(`${key}#${seed}`)) {
      const g = `${pri}|${tier}|${focus ? 1 : 0}`; if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push({ key, hero, weapon, tree, tier, bond, seed });
    }
  };
  const CTX = new Set(['full|normal|0', 'none|normal|25', 'none|hard|0', 'half|hard|0', 'full|hard|0', 'full|hard|25', 'half|expert|0', 'full|expert|0']);
  for (const hero of HEROES) for (const weapon of WEAPONS) for (const tree of TREES) for (const tier of TIERS) for (const bond of BONDS) {
    const c = `${tree}|${tier}|${bond}`;
    if (c === 'none|normal|0') { add(hero, weapon, tree, tier, bond, false, HEAD, 0); add(hero, weapon, tree, tier, bond, true, FOC, 1); }
    else if (c === 'half|normal|0' || c === 'full|normal|25') add(hero, weapon, tree, tier, bond, false, HEAD, 0);
    else if (c === 'full|expert|25') add(hero, weapon, tree, tier, bond, false, HEAD, 2);
    else if (CTX.has(c)) add(hero, weapon, tree, tier, bond, false, OTHER, 3);
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
        const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: c.jobs, assist: AS, endless: EN }, env: { ...process.env, TIER: c.tier, FOCUS: c.focus, GATES: 'starter', BLESS: 'on', META: 'none', BOND: '0', ENDLESS: '0', ASSIST: '0' } });
        w.on('message', (m) => { appendFileSync(out, JSON.stringify(m) + '\n'); if (++n % 200 === 0) console.error(`${n}/${total} ${((Date.now() - t0) / 60000).toFixed(1)} min`); });
        w.on('error', rej); w.on('exit', res);
      });
    }
  };
  await Promise.all(Array.from({ length: NW }, lane));
  console.error(`done ${n} runs in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}
