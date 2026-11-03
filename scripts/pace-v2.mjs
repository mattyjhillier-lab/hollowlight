// Q0 pacing model v2 (docs/design/skill-tree-rework-v2.md section 9; results: docs/design/skill-tree-pacing-v2.md). READ-ONLY w.r.t. src/.
// One JOURNEY = a new profile (real SaveStore + grantStarter) that picks 1 hero + 1 of 5 spirits, then plays run after run with the LIVE bot
// (scripts/bot.mjs playRun: dodge, Blessings, random-pick bot), the run's tree = aggregateMods(save.tree) of what the greedy buyer owns, banks each run
// through the real SaveStore.bankRun (stats.killsByEnemy, clears, boss kills, tiers, Dawnglass, Bond) and buys with the real tree.js buy().
// HUMAN FACTOR 0.75: kills (per enemy type), gold, gems, chests, marked, ability uses, blessings are scaled by 0.75 (stochastic rounding);
//   every victory is kept only with probability 0.75 (else banked as a defeat: no boss kill, no shards); a defeat's survive time x0.75.
// Usage:  node scripts/pace-v2.mjs run out.jsonl [journeysPerCell=8] [maxRuns=70] [workers=11]   (resumes; one JSON line per journey)
//         node scripts/pace-v2.mjs report out.jsonl
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';

export const HF = 0.75;
export const HEROES = ['wren', 'elias'];
export const WEAPONS = ['ghost_wolves', 'raven_flock', 'spirit_bolts', 'chain_lightning', 'holy_orbit'];
// Set-A landmarks in the order of the v2 sheet (section 6). The Long Night expert gate = gt_cursed_forest_expert.
export const LANDMARKS = ['sp_reroll1', 'gt_holy_orbit', 'gt_spirit_bolts', 'gt_raven_flock', 'gt_chain_lightning', 'gt_cursed_forest_hard', 'sp_auto', 'rs_start', 'rs_bless', 'cd_fourth', 'gt_cursed_forest_expert', 'rs_slot5', 'li_last'];
export const VEILED = ['gt_phantom_stampede', 'gt_murder_storm'];
// diamond-tier rewards (v1 sheet 2.1: keystones / masteries); "wide" adds evolution sockets and unlock-gated beads.
export const DIAMOND_KINDS = ['key', 'mastery'];
export const WIDE_KINDS = ['key', 'mastery', 'socket', 'bead'];

// ---- pure stats helpers (unit-tested) ----
export const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
// times: run numbers (null = never within the cap, counted at cap+1). Returns the gaps between consecutive events, starting from run 0.
export function gapList(times, cap) {
  const t = times.map((x) => (x == null ? cap + 1 : x)).sort((a, b) => a - b);
  const out = []; let prev = 0;
  for (const x of t) { out.push({ from: prev, to: x, gap: x - prev }); prev = x; }
  return out;
}
// aim: no gap > 5 runs while the gap starts before run 30, and > 8 after. Returns the gaps that break it.
export function gapFailures(times, cap, early = 5, late = 8, split = 30) {
  return gapList(times, cap).filter((g) => g.gap > (g.from < split ? early : late) && g.to <= cap + 1 && g.gap > 0);
}

// =============================================================== worker
async function setup() {
  const dir = new URL('../src/data/', import.meta.url);
  const load = (n) => JSON.parse(readFileSync(new URL(`${n}.json`, dir), 'utf8'));
  const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters', 'tiers'].map((n) => [n, load(n)]));
  const { loadTree } = await import('../src/meta/treefs.mjs');
  const T = await import('../src/meta/tree.js');
  const composed = loadTree(data); data.tree = composed.live;
  const def = T.compileTree(data.tree, data);
  const S = await import('../src/save/schema.js'); S.setTreeDef(def, data);
  const { SaveStore } = await import('../src/save/store.js');
  const { grantStarter } = await import('../src/meta/starter.js');
  const C = await import('../src/save/chars.js');
  const { tierIndex, TIER_IDS } = await import('../src/sim/tiers.js');
  return { data, composed, def, T, S, SaveStore, grantStarter, C, tierIndex, TIER_IDS };
}

const bots = {};
async function botFor(tier) {
  if (!bots[tier]) {
    Object.assign(process.env, { TIER: tier, FOCUS: '0', GATES: 'starter', BLESS: 'on', META: 'none', BOND: '0', ENDLESS: '0', ASSIST: '0', SITES: '0' });
    bots[tier] = await import(`./bot.mjs?tier=${tier}`); // one module instance per tier: bot.mjs reads TIER at import
  }
  return bots[tier];
}

async function journey(env, { hero0, weapon, j, maxRuns }) {
  const { data, composed, def, T, SaveStore, grantStarter, C, tierIndex } = env;
  const store = new SaveStore(null); // in-memory
  store.data = env.S.defaultSave();
  grantStarter(store.data, data, composed.info, def, hero0, weapon);
  const save = () => store.data;
  let s = (j * 7919 + 17) >>> 0; // journey rng (human factor, keepsakes), mulberry32
  const rng = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const sr = (v) => Math.floor(v * HF + rng()); // stochastic rounding of a scaled count
  const lm = {}; // id -> { met, avail, bought, own0 }
  for (const id of [...LANDMARKS, ...VEILED]) lm[id] = { met: null, avail: null, bought: null, own0: (save().tree[id] | 0) >= 1 };
  const diamonds = []; // { id, kind, run }
  const log = [];
  const fails = {}; // consecutive losses per tier index
  let backoff = 0;
  const income = [];
  const nodeInfo = (id) => T.nodeStatus(def, save(), id, data);
  const scan = (r) => {
    for (const id of Object.keys(lm)) {
      const L = lm[id];
      if (L.own0 || (save().tree[id] | 0) >= 1) continue;
      const st = nodeInfo(id);
      if (L.met === null && st.cond && st.cond.done) L.met = r;
      if (L.avail === null && st.buyable && st.affordable) L.avail = r;
    }
  };
  const buyAll = (r) => {
    for (let guard = 0; guard < 400; guard++) {
      const cands = [];
      for (const id of def.list) {
        const n = def.nodes[id];
        if (n.teaser || (save().tree[id] | 0) >= n.maxRank) continue;
        const st = nodeInfo(id);
        if (!st.buyable) continue;
        cands.push({ id, st, lm: Object.hasOwn(lm, id) });
      }
      const afford = cands.filter((c) => c.st.affordable);
      const avgInc = income.length ? income.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, income.length) : 0;
      const gold = save().gold;
      // save up for a landmark that is open and only short of gold, and within ~1.5 runs of income
      const wait = cands.some((c) => c.lm && !c.st.affordable && c.st.next.shards <= save().shards && c.st.next.glass <= (save().dawnglass || 0) && c.st.next.gold - gold <= 1.5 * avgInc);
      const reserve = Object.keys(lm).filter((id) => !lm[id].own0 && (save().tree[id] | 0) < 1 && lm[id].met !== null).reduce((a, id) => a + def.nodes[id].cost.shards, 0);
      // goal-seeking: the missing path nodes / gate ancestors of a landmark whose condition is met count as landmark-class purchases
      const pathSet = new Set();
      for (const id of Object.keys(lm)) if (!lm[id].own0 && lm[id].met !== null && (save().tree[id] | 0) < 1) { for (const x of T.pathToHub(def, id, save().tree).ids) if (x !== id && (save().tree[x] | 0) < 1) pathSet.add(x); for (const g of def.nodes[id].gateAnc || []) if ((save().tree[g] | 0) < 1) pathSet.add(g); }
      let pool = afford.filter((c) => c.lm || pathSet.has(c.id));
      if (!pool.length && !wait) pool = afford.filter((c) => !c.lm && (!(c.st.next.shards || c.st.next.glass) || (save().shards - c.st.next.shards >= reserve && !c.st.next.glass)));
      if (!pool.length) return;
      pool.sort((a, b) => a.st.next.gold - b.st.next.gold || a.st.next.shards - b.st.next.shards);
      const pick = pool[0];
      const res = T.buy(save(), pick.id, def, data);
      if (!res.ok) return;
      if (pick.lm && lm[pick.id].bought === null) lm[pick.id].bought = r;
      const k = def.nodes[pick.id].kind;
      if (WIDE_KINDS.includes(k) && !pick.lm) diamonds.push({ id: pick.id, kind: k, run: r });
    }
  };
  for (let r = 1; r <= maxRuns; r++) {
    const open = T.aggregateMods(save().tree, def, data).unlocks.tiers || [];
    const tiers = ['normal', 'hard', 'expert'].filter((t) => t === 'normal' || open.includes(`cursed_forest:${t}`));
    let ti = tiers.length - 1;
    if ((fails[ti] || 0) >= 5) { if (backoff < 3) { ti = Math.max(0, ti - 1); backoff++; } else { backoff = 0; fails[ti] = 3; } }
    const tier = tiers[ti];
    const awake = HEROES.filter((h) => C.isAwake(save(), h));
    const hero = awake.length > 1 ? awake[(r - 1) % awake.length] : awake[0] || hero0;
    const agg = T.aggregateMods(save().tree, def, data, { tier: tierIndex(tier) });
    const bot = await botFor(tier);
    const bond = C.bondLevel(save(), data, hero);
    const res = bot.playRun(hero, j * 1000 + r, { weapon, tree: agg, bond });
    // ---- human factor
    const won = res.outcome === 'victory';
    const keep = won && rng() < HF;
    const kbe = {}; let kills = 0;
    for (const [k, v] of Object.entries(res.killsByEnemy)) { const n = sr(v); if (n > 0) { kbe[k] = n; kills += n; } }
    const dropBoss = won && !keep;
    const elig = C.keepsakeEligible(save(), data, def);
    let keepsake = null;
    if (elig.length) { const pk = 1 - (1 - 0.35) ** sr(res.chests || 0) * (res.bossKilled && !dropBoss ? 0.5 : 1); if (rng() < pk) keepsake = elig[Math.floor(rng() * elig.length)]; }
    const r2 = { ...res, outcome: keep ? 'victory' : 'defeat', time: keep ? res.time : won ? Math.min(res.time, 590) : res.time * HF, killsByEnemy: kbe, kills, gold: sr(res.gold), gems: sr(res.gems || 0), chests: sr(res.chests || 0), marked: sr(res.marked || 0), abilityUses: sr(res.abilityUses || 0), blessings: sr(res.blessings || 0), sites: null, endless: null, keepsake, ...(dropBoss ? { bossKilled: false, bossId: null, shards: 0 } : {}) };
    const b = store.bankRun(r2, { def, data, unlockedTiers: open });
    const earned = b.runGold;
    income.push(earned);
    const tIdx = tierIndex(tier);
    fails[tIdx] = keep ? 0 : (fails[tIdx] || 0) + 1;
    scan(r);
    const goldBefore = save().gold, shardsBefore = save().shards;
    buyAll(r);
    const kd = {}; for (const k of ['wolf', 'crow', 'root_crawler']) kd[k] = kbe[k] || 0;
    log.push({ r, hero, tier: tIdx, win: keep ? 1 : 0, gold: earned, kills, kd, boss: r2.bossKilled ? 1 : 0, sh: r2.shards | 0, wallet: goldBefore, shW: shardsBefore, spent: goldBefore - save().gold, lvl: res.level, t: Math.round(r2.time), evos: res.evolved.length });
    if (LANDMARKS.every((id) => lm[id].own0 || lm[id].bought !== null)) break;
  }
  const keepsLm = Object.fromEntries(Object.entries(lm).map(([k, v]) => [k, [v.met, v.avail, v.bought, v.own0 ? 1 : 0]]));
  return { hero0, weapon, j, runs: log.length, lm: keepsLm, diamonds, log, kills: save().stats.killsByEnemy, bossKills: save().stats.bossKills };
}

if (!isMainThread) {
  const env = await setup();
  for (const job of workerData.jobs) parentPort.postMessage(await journey(env, { ...job, maxRuns: workerData.maxRuns }));
}

// =============================================================== report
export function report(file, cap = 70) {
  const rows = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const out = [];
  const P = (s) => out.push(s);
  const fmt = (a) => (a.length ? `${pct(a, 0.25)}/${pct(a, 0.5)}/${pct(a, 0.9)}` : '-');
  const groups = { ALL: rows };
  for (const w of WEAPONS) groups[`start:${w}`] = rows.filter((r) => r.weapon === w);
  for (const h of HEROES) groups[`hero:${h}`] = rows.filter((r) => r.hero0 === h);
  const times = (r, sel) => LANDMARKS.filter((id) => !r.lm[id][3]).map((id) => r.lm[id][1]).concat(sel(r));
  for (const [name, rs] of Object.entries(groups)) {
    if (!rs.length) continue;
    P(`\n## ${name}  (${rs.length} journeys, cap ${cap} runs)`);
    P('landmark | p25/p50/p90 run it is AFFORDABLE+UNLOCKED | % reached | condition-met p50 | bought p50 | n(not owned at start)');
    for (const id of [...LANDMARKS, ...VEILED]) {
      const use = rs.filter((r) => !r.lm[id][3]);
      if (!use.length) { P(`${id.padEnd(24)} owned at start in all journeys`); continue; }
      const av = use.map((r) => r.lm[id][1] ?? cap + 1), met = use.map((r) => r.lm[id][0] ?? cap + 1), bt = use.map((r) => r.lm[id][2] ?? cap + 1);
      P(`${id.padEnd(24)} ${fmt(av).padEnd(12)} ${String(Math.round((100 * use.filter((r) => r.lm[id][1] != null).length) / use.length)).padStart(3)}%   met ${pct(met, 0.5)}  bought ${pct(bt, 0.5)}  n=${use.length}`);
    }
    const sets = { 'landmarks only': () => [], '+ diamonds (key/mastery bought)': (r) => r.diamonds.filter((d) => DIAMOND_KINDS.includes(d.kind)).map((d) => d.run), '+ wide (socket/bead/key/mastery)': (r) => r.diamonds.map((d) => d.run) };
    for (const [label, sel] of Object.entries(sets)) {
      const mx = rs.map((r) => Math.max(...gapList(times(r, sel), cap).filter((g) => g.to <= cap).map((g) => g.gap), 0));
      const bad = rs.map((r) => gapFailures(times(r, sel), cap));
      P(`max gap (${label}): p25/p50/p90 = ${fmt(mx)}, journeys breaking the aim (>5 before run 30, >8 after): ${bad.filter((b) => b.length).length}/${rs.length}`);
    }
  }
  const med = LANDMARKS.map((id) => ({ id, m: pct(rows.filter((r) => !r.lm[id][3]).map((r) => r.lm[id][1] ?? cap + 1), 0.5) })).filter((x) => x.m != null).sort((a, b) => a.m - b.m);
  P('\n## ALL: landmarks ordered by median affordable+unlocked run, gap to the previous');
  let prev = 0; for (const x of med) { P(`${x.id.padEnd(24)} p50 ${String(x.m).padStart(3)}  gap ${x.m - prev}`); prev = x.m; }
  P('\n## Gold per run (human factor applied, after the tier bonus), mean / p50 [n]');
  const phase = [[1, 1], [2, 5], [6, 15], [16, 30], [31, 70]];
  for (const [a, b] of phase) for (const [lab, f] of [['win', (e) => e.win === 1], ['loss', (e) => e.win === 0]]) {
    const g = rows.flatMap((r) => r.log.filter((e) => e.r >= a && e.r <= b && f(e)).map((e) => e.gold));
    if (g.length) P(`runs ${a}-${b} ${lab}: mean ${Math.round(g.reduce((x, y) => x + y, 0) / g.length)} p50 ${pct(g, 0.5)} [${g.length}]`);
  }
  const r1 = rows.map((r) => r.log[0]);
  P(`run 1: ${r1.filter((e) => e.win).length} wins of ${r1.length}; gold p25/p50/p90 ${fmt(r1.map((e) => e.gold))}; wallet after run 1 >= 150 in ${r1.filter((e) => e.wallet >= 150).length}/${r1.length}; loss-run 1 gold min ${Math.min(...r1.filter((e) => !e.win).map((e) => e.gold), 1e9)}`);
  const winPh = [[1, 5], [6, 10], [11, 20], [21, 40], [41, 70]].map(([a, b]) => { const l = rows.flatMap((r) => r.log.filter((e) => e.r >= a && e.r <= b)); return l.length ? `runs ${a}-${b}: win ${Math.round((100 * l.filter((e) => e.win).length) / l.length)}% (n=${l.length}) tier mix ${[0, 1, 2].map((t) => Math.round((100 * l.filter((e) => e.tier === t).length) / l.length)).join('/')}%` : null; }).filter(Boolean);
  P('\n## Win rate (human-factored) and tier mix by phase\n' + winPh.join('\n'));
  const kc = (k) => rows.map((r) => r.log.reduce((a, e) => a + (e.kd[k] || 0), 0) / r.log.length);
  const mean = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
  P(`mean kills per run: wolf ${mean(kc('wolf'))}, crow ${mean(kc('crow'))}, root_crawler ${mean(kc('root_crawler'))}`);
  return out.join('\n');
}

// =============================================================== main
const isCli = isMainThread && process.argv[1] && /pace-v2\.mjs$/.test(process.argv[1]);
if (isCli) {
  const mode = process.argv[2];
  if (mode === 'report') console.log(report(process.argv[3], Number(process.argv[4] || 70)));
  else if (mode === 'run') {
    const out = process.argv[3] || 'pace-v2.jsonl', N = Number(process.argv[4] || 8), R = Number(process.argv[5] || 70), NW = Number(process.argv[6] || 11);
    const done = new Set();
    if (existsSync(out)) for (const l of readFileSync(out, 'utf8').split('\n')) if (l) { const o = JSON.parse(l); done.add(`${o.hero0}|${o.weapon}|${o.j}`); }
    const jobs = [];
    for (let j = 1; j <= N; j++) for (const hero0 of HEROES) for (const weapon of WEAPONS) if (!done.has(`${hero0}|${weapon}|${j}`)) jobs.push({ hero0, weapon, j });
    console.error(`pace-v2: ${jobs.length} journeys to do (${done.size} done), cap ${R} runs, ${NW} workers`);
    let next = 0, n = 0; const t0 = Date.now();
    const lane = async () => {
      while (next < jobs.length) {
        const job = jobs[next++];
        await new Promise((res, rej) => {
          const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: [job], maxRuns: R } });
          w.on('message', (m) => { appendFileSync(out, JSON.stringify(m) + '\n'); n++; console.error(`${n}/${jobs.length} ${((Date.now() - t0) / 60000).toFixed(1)} min (${job.hero0}/${job.weapon}/${job.j}: ${m.runs} runs)`); });
          w.on('error', rej); w.on('exit', res);
        });
      }
    };
    await Promise.all(Array.from({ length: NW }, lane));
    console.error(`done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  } else console.error('usage: pace-v2.mjs run out.jsonl [journeys] [maxRuns] [workers] | report out.jsonl [cap]');
}
