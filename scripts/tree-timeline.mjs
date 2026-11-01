// Skill tree PROGRESSION TIMELINE simulation (LOCKED 2026-10-18 'SKILL TREE = TOP PRIORITY', quality gate 1; 'TREE PULL PRINCIPLE' pacing rule).
// Simulates human-like players over many runs against the REAL compiled tree (src/data/tree via composeTree + compileTree, real
// nodeStatus / buy / conditionProgress / softFactors). Runs are a MODEL (not the Sim): income, kills and win odds come from the
// measured economy numbers in docs/design/difficulty-tiers-economy-v1.md 9.3 and skill-tree-v2.md 9-10 (calibration block below).
// Read-only w.r.t. src/. Deterministic (seeded).
//
//   node scripts/tree-timeline.mjs                      design tree (all 156 nodes incl. inert tool/tier nodes treated as built), 24 players x 100 runs
//   node scripts/tree-timeline.mjs --live               only the nodes the game runs today (inert nodes excluded: no tiers, no Almanac)
//   node scripts/tree-timeline.mjs --nodes 1000         growth check: real tree + synthetic constellations (scripts/tree-synth.mjs), chapters + economy rule C.13
//   options: --players N  --runs N  --seed N  --json out.json  --presets out.json (snapshot saves for the tree-screen prototype)
//   CONNECTED-UNLOCK analysis (LOCKED 2026-10-21; scripts/tree-connected-patch.mjs; docs/design/tree-connected-patch.md):
//     --rule connected|today   connected (default) = the locked rule + its four exceptions on the dry-run patched tree; today = the old rules
//     --price creep|flat|depth|both   creep (default, BUILT in T3c) = the engine's rising price (core.price.creep, 8%; --creep overrides): each
//                                     purchase raises the rest of its group (gates/hearts/seals/masteries/keys/keystones stay flat); flat = no rise;
//                                     depth = gold rises along depth (--k slope per step, total tree gold kept); both = depth + creep
//     --econ 36k|1018          income calibration: 36k = bot measured 2026-10-21 with the Elder Treant at 36000 HP (default); 1018 = the old one
//     --tiers live|proposal    tier rewards: live = src/data/tiers.json; proposal = TIER_PROPOSAL below
//     --links both|directed    both (default, BUILT in T3c: tree.js isLinked) = any linked neighbour opens it; directed = the old one-way
//                              requires, modelled on top of the engine for comparison only
import { writeFileSync } from 'node:fs';
import { readTreeFiles, addExtra } from '../src/meta/treefs.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { compileTree, nodeStatus, buy, conditionProgress, softFactors, presetTree, aggregateMods } from '../src/meta/tree.js';
import { loadRealData, synthTree } from './tree-synth.mjs';
import { connectedPatch, makeConnected } from './tree-connected-patch.mjs';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const flag = (n) => args.includes(n);
const NODES = Number(val('--nodes', 0));
const LIVE = flag('--live');
const PLAYERS = Math.max(1, Math.min(200, Number(val('--players', NODES ? 12 : 24))));
const RUNS = Math.max(1, Math.min(1000, Number(val('--runs', NODES ? 320 : 100))));
const SEED = Number(val('--seed', 7));
const safeOut = (p) => { if (p && (!/^[\w./\\:-]+\.json$/.test(p) || p.includes('..'))) { console.error('output path must be a plain .json path'); process.exit(1); } return p; };
const JSON_OUT = safeOut(val('--json', null));
const PRESETS_OUT = safeOut(val('--presets', null));
const RULE = val('--rule', 'connected') === 'today' ? 'today' : 'connected';
const PRICE = ['flat', 'depth', 'creep', 'both'].includes(val('--price', 'creep')) ? val('--price', 'creep') : 'creep';
const K = Math.max(0, Math.min(1, Number(val('--k', 0.12))));
const CREEP_ARG = val('--creep', null);
const ECON = val('--econ', '36k') === '1018' ? '1018' : '36k';
const TIERS = val('--tiers', 'live') === 'proposal' ? 'proposal' : 'live';
const LINKS = val('--links', 'both') === 'directed' ? 'directed' : 'both'; // both = a link works in either direction (Matt's words: linked to ANY owned lantern)

// ------------------------------------------------------------------ calibration (MODEL; sources in the header)
const CAL = {
  goldWin: 2689, // bot Twilight win gold (economy 9.3); human = x humanGold (overwritten by --econ 36k below)
  humanGold: 0.75,
  killsFull: { wolf: 800, crow: 900, root_crawler: 190 }, // bot per full run (skill-tree-v2 9)
  humanKills: 0.85,
  ramp: 1.4, // kills / gold accumulate as (t/900)^ramp (density ramps up through the run)
  strongKit: 0.25, // a full tree kills ~25% more (META=full win ~3,600 gold vs 2,689)
  runSecs: 900, bossAt: 840,
  chapterGold: 0.6, // growth mode: chapter k pays x(1 + 0.6 (k-1)) gold (C.13 'chapter gold multiplier', a design parameter)
  clusterRuns: 5, // growth mode: a constellation costs ~5 runs of gold at its chapter (C.13 economy rule)
  perChapterClusters: 7,
};
// --econ 36k: bot sweep 2026-10-21 (boss HP 36000, Blessings on, random pick, scratch econ sweep in the analysis report): Twilight win gold
// starter Wren/Elias mean, full tree (GATES=all META=full) win gold; the model keeps the loss curve (t/900)^ramp, checked against the measured loss gold.
// measured 2026-10-21 (48 seeds per cell): Twilight win gold starter Wren 2,800 / Elias 2,792, full tree 2,979 / 3,008 (strongKit ~0.07 on a win;
// the full tree mostly earns more by living longer: loss gold 1,848-1,977 at ~11:00 vs 801-1,021 at ~7:40 starter). Deep Dusk full tree: win
// 6% / 8%, win gold 2,466 / 3,039; Long Night full tree: win 6% / 0% (32 seeds). NOTE tiers.json goldMul is NOT applied anywhere in src today.
const ECON36 = { goldWin: Number(process.env.GOLD_WIN || 2800), strongKit: Number(process.env.STRONG_KIT || 0.07) };
const CALIB = val('--calib', 'measured') === 'model' ? 'model' : 'measured';
// --ddwin W: the bot's measured full-tree Deep Dusk win rate (0..1); the model scales its hard-tier odds so a full tree + full skill wins W
// (default 0.07 = the 1.45x HP measurement of 2026-10-21; T3c re-measure at 1.2x HP is in docs/LOCKED.md 'T3c BUILT')
const DD_M = Math.max(0.01, Math.min(1.5, Number(val('--ddwin', 0.07)) / 0.35)); // measured = Deep Dusk / Long Night odds scaled to the bot sweep above
if (ECON === '36k') Object.assign(CAL, ECON36);
// tier rewards: live data or the proposal (gold multiplier, shards per boss, Dawnglass [boss, dawn, first clear, -, marked cap, run cap])
const TIERS_LIVE = JSON.parse(readFileSync(new URL('../src/data/tiers.json', import.meta.url), 'utf8')).template;
const TIER_PROPOSAL = {
  hard: { goldMul: 1.6, shards: 7, firstShards: 2, glass: { boss: 2, dawn: 3, first: 8, markedCap: 2, runCap: 7 } },
  expert: { goldMul: 2.2, shards: 10, firstShards: 3, glass: { boss: 3, dawn: 5, first: 12, markedCap: 3, runCap: 11 } },
};
const tierPay = (t) => {
  const L = TIERS_LIVE[t];
  const P = TIERS === 'proposal' && TIER_PROPOSAL[t] ? { ...L, ...TIER_PROPOSAL[t], glass: { ...L.glass, ...TIER_PROPOSAL[t].glass } } : L;
  return { goldMul: P.goldMul, shards: P.shards, firstShards: P.firstShards || 0, g: [P.glass.boss, P.glass.dawn, P.glass.first, P.glass.marked, P.glass.markedCap, P.glass.runCap] };
};
// win odds (human model), calibrated to the locked bands: no-tree Twilight 15-30%; full tree 45-75%; Deep Dusk full 25-40 (+daybreak 35-55); Long Night 5-15 (+daybreak 15-30)
function winP(tier, f, opts, skill, day) {
  const m = CALIB !== 'measured' || tier === 'normal' ? 1 : tier === 'hard' ? DD_M : 0.17; // full tree + full skill: hard 0.35 -> 0.07 (Deep Dusk 1.45x HP), expert 0.18 -> 0.03 (bot)
  return m * winP0(tier, f, opts, skill, day);
}
function winP0(tier, f, opts, skill, day) {
  if (tier === 'normal') return 0.2 + 0.15 * skill + 0.12 * f + 0.1 * opts;
  if (tier === 'hard') return 0.02 + 0.08 * skill + 0.15 * f + 0.1 * opts + 0.12 * day.hard;
  return 0.0 + 0.05 * skill + 0.08 * f + 0.05 * opts + 0.12 * day.expert;
}

// ------------------------------------------------------------------ tree
// --extra <dir>: test-only fragments + <dir>-data.json (TREE-GEN1: a synthetic third hero needs no code here)
const X = addExtra(readTreeFiles(), loadRealData(), val('--extra', null));
const data = X.data;
let files = X.files;
const chapterOf = new Map(); // growth mode: synthetic node id -> chapter
if (NODES) {
  const s = synthTree(data, NODES, files);
  files = s.files;
  Object.assign(data, s.data);
  const avgIncome = (k) => CAL.goldWin * CAL.humanGold * 0.55 * (1 + CAL.chapterGold * (k - 1)); // ~0.55 = mean of wins and losses
  let ci = 0;
  for (const f of files) {
    const j = f.json;
    if (!(f.path.startsWith('clusters/zw'))) continue;
    const ch = 2 + Math.floor(ci++ / CAL.perChapterClusters);
    const specs = [...j.outline, ...j.gates];
    const sum = specs.reduce((a, n) => a + n.cost.gold, 0);
    const k = (CAL.clusterRuns * avgIncome(ch)) / sum;
    for (const n of specs) { n.cost.gold = Math.max(10, Math.round((n.cost.gold * k) / 10) * 10); chapterOf.set(n.id, ch); }
  }
}
const composed = composeTree(files, data);
const rawTree = LIVE ? composed.live : composed.v2;
const patched = RULE === 'connected' ? connectedPatch(rawTree, composed.info, data) : null;
const def = patched ? patched.def : compileTree(rawTree, data);
const linkedHub = RULE === 'connected' ? makeConnected(def, composed.info) : () => true;
// rising price lives in the engine now (nodeStatus / buy / respec read def.creep and save.creep): the model only picks the rate
const CREEP = PRICE === 'creep' || PRICE === 'both' ? (CREEP_ARG !== null ? Math.max(0, Math.min(0.3, Number(CREEP_ARG))) : def.creep) : 0;
def.creep = CREEP;
const HEART = {}; for (const [w, c] of Object.entries(composed.info.clusters)) HEART[w] = c.heart;
const nb = (id) => [...def.nodes[id].requires, ...(def.nodes[id].requiresAny || []), ...def.children[id]];
const linked = (s, id) => {
  if (LINKS === 'directed' || def.nodes[id].permanent) return linkedHub(s, id);
  const n = def.nodes[id]; const own = (x) => ((s.tree || {})[x] || 0) >= 1;
  if (n.cluster && HEART[n.cluster] && !own(HEART[n.cluster])) return false; // a gated constellation still needs its heart
  if (nb(id).some(own)) return true;
  return !n.requires.length && !n.requiresAny && linkedHub(s, id);
};
// status and purchase are the engine's own (connected-unlock rule + rising price are built in tree.js); --links directed additionally holds
// back lanterns not linked from their parent side (statusAll), for comparison only
const statusOf = (s, id) => nodeStatus(def, s, id, data);
const buyNode = (s, id) => buy(s, id, def, data);
const cosmOnly = (n) => n.effects.length > 0 && n.effects.every((e) => e && e.cosm !== undefined); // EXTRAS v1 Wardrobe: zero-power looks
const IDS = def.list.filter((id) => !def.nodes[id].teaser && !cosmOnly(def.nodes[id])); // the power timeline leaves the Wardrobe out (an optional gold sink, its own price group)
const W = Object.keys(composed.info.clusters).length;
// depth = lanterns from the hub along the links (requires: deepest parent; requiresAny: nearest parent); a hub-linked lantern inside a
// gated constellation counts from its heart (E2/E1)
const heartOf = {}; for (const [w, c] of Object.entries(composed.info.clusters)) heartOf[w] = c.heart;
const DEPTH = {};
for (const id of def.order) {
  const n = def.nodes[id];
  const all = n.requires.map((r) => DEPTH[r] ?? 1);
  const any = (n.requiresAny || []).map((r) => DEPTH[r] ?? 1);
  let d = Math.max(all.length ? Math.max(...all) : 0, any.length ? Math.min(...any) : 0);
  if (!all.length && !any.length && n.cluster && heartOf[n.cluster] && heartOf[n.cluster] !== id) d = 1;
  DEPTH[id] = d + 1;
}
if (LINKS === 'both') { // undirected distance from the hub-linked entries
  const q = def.list.filter((id) => !def.nodes[id].requires.length && !def.nodes[id].requiresAny);
  for (const id of def.list) delete DEPTH[id];
  for (const id of q) DEPTH[id] = 1;
  for (let i = 0; i < q.length; i++) for (const x of nb(q[i])) if (DEPTH[x] === undefined) { DEPTH[x] = DEPTH[q[i]] + 1; q.push(x); }
}
const priced = (id) => !def.nodes[id].permanent && !def.nodes[id].teaser;
const goldOfAll = (id, g) => { const n = def.nodes[id]; let t = 0; for (let r = 1; r <= n.maxRank; r++) t += Math.max(10, Math.round((g * Math.pow(n.rankCost, r - 1)) / 10) * 10); return t; };
const BASE = Object.fromEntries(def.list.map((id) => [id, def.nodes[id].cost.gold]));
if (PRICE === 'depth' || PRICE === 'both') {
  const ids = def.list.filter((id) => priced(id) && BASE[id] > 0);
  const flatTot = ids.reduce((a, id) => a + goldOfAll(id, BASE[id]), 0);
  const raw = Object.fromEntries(ids.map((id) => [id, BASE[id] * (1 + K * (DEPTH[id] - 1))]));
  const tot = ids.reduce((a, id) => a + goldOfAll(id, raw[id]), 0);
  for (const id of ids) BASE[id] = Math.max(10, Math.round((raw[id] * flatTot) / tot / 10) * 10);
}
const resetPrices = () => { for (const id of def.list) def.nodes[id].cost.gold = BASE[id]; };
resetPrices();
const rule = def.rule;
const peOf = (tree) => {
  const f = softFactors(tree, def);
  if (!f) return 0;
  let pe = 0;
  for (const [cat, i] of Object.entries(f.info)) pe += i.total * (cat.startsWith('wpn:') ? (rule.perWeapon.weight * rule.perWeapon.refWeapons) / W : rule.categories[cat] ? rule.categories[cat].weight : 0);
  return pe;
};
const PE_FULL = peOf(presetTree(def, 'full'));
const weaponOfGate = {}; const evoOfGate = {}; const tierOfGate = {};
for (const id of IDS) for (const e of def.nodes[id].effects) {
  if (e.unlock === 'weapon') weaponOfGate[id] = e.id;
  if (e.unlock === 'evolution') evoOfGate[id] = e.id;
  if (e.unlock === 'tier') tierOfGate[id] = e.tier;
}
const STARTER_W = Object.keys(data.weapons).filter((w) => !data.weapons[w].treeGate);
const STARTER_E = Object.keys(data.evolutions).filter((e) => !data.evolutions[e].treeGate);
const GATED_W = Object.keys(data.weapons).filter((w) => data.weapons[w].treeGate && !w.startsWith('zw'));
const GATED_E = Object.keys(data.evolutions).filter((e) => data.evolutions[e].treeGate && !e.startsWith('zw'));
// heroes from the data (TREE-GEN1): the first is the model players' favourite, each hero's signature = its starting weapon
const HEROES = Object.keys(data.characters).filter((h) => !data.characters[h].treeGate);
const SIG = Object.fromEntries(HEROES.map((h) => [h, data.characters[h].kindred || data.characters[h].weapon])); // CHARACTER SYSTEM v2: the kindred spirit = the model's starting weapon
const regionOf = (id) => { const n = def.nodes[id]; return n.cluster || (n.frag && n.frag !== 'core' ? n.frag : n.region || 'rings'); };
const REGIONS = {};
for (const id of IDS) (REGIONS[regionOf(id)] ||= []).push(id);
const hasTiers = IDS.some((id) => tierOfGate[id]);
// exclusive pairs (keystones): only one side can ever be owned, so 'everything' = all nodes minus the smaller side of each group
const exclSeen = new Set(); let exclLost = 0;
for (const id of IDS) { const ex = def.nodes[id].excludes; if (!ex.length || exclSeen.has(id)) continue; const g = [id, ...ex]; g.forEach((x) => exclSeen.add(x)); exclLost += g.length - 1; }
const OWNABLE = IDS.length - exclLost;

// ------------------------------------------------------------------ rng
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ------------------------------------------------------------------ one player
const TRY = CALIB === 'measured' ? 0.05 : 0.12; // a player tries a tier when it looks winnable at all
function newSave() {
  return {
    // CHARACTER SYSTEM v2: every weapon is a tree gate; the model player owns the hearts of the heroes' kindred spirits from run 1 (starter grant + one cheap heart)
    gold: 0, shards: 0, dawnglass: 0, tree: Object.fromEntries([...new Set(Object.values(SIG))].map((w) => def.hearts[w]).filter(Boolean).map((h) => [h, 1])),
    stats: { kills: 0, runs: 0, bestLevel: 0, totalGold: 0, killsByEnemy: {}, bossKills: {}, chapters: { cursed_forest: { runs: 0, clears: 0, bestTime: 0 } }, evolved: {}, charsUsed: {}, startWeapon: {}, tiers: { cursed_forest: {} }, markedKills: 0, chests: 0, gems: 0, abilityUses: 0, blessingsTaken: 0 },
  };
}
const owned = (s, id) => (s.tree[id] || 0) >= 1;
const MAX_CH = Math.max(1, ...chapterOf.values());
const chapterReached = (s) => (NODES ? Math.min(MAX_CH, 1 + Math.floor(s.stats.chapters.cursed_forest.clears / 3)) : 1); // growth: the next chapter opens every 3 clears

function statusAll(s) {
  const out = { afford: [], short: [], cond: [], lockedPre: 0, held: 0, goldLeft: 0 };
  for (const id of IDS) {
    if (NODES && chapterOf.has(id) && chapterOf.get(id) > chapterReached(s)) continue; // a later chapter's band is fogged
    const st = statusOf(s, id);
    if (st.state === 'owned') continue;
    if (st.state !== 'excluded' && st.state !== 'teaser' && !def.nodes[id].unlock) { out.goldLeft++; (out.goldIds ||= []).push(id); } // a gold-only lantern still to buy somewhere
    if ((st.state === 'available' || st.state === 'condition') && !linked(s, id)) { out.held++; out.lockedPre++; continue; } // the rule: not linked to anything lit
    if (st.state === 'available') (st.affordable ? out.afford : out.short).push({ id, st });
    else if (st.state === 'condition') out.cond.push({ id, st });
    else if (st.state === 'locked') out.lockedPre++;
  }
  return out;
}

function simulatePlayer(p) {
  resetPrices();
  const R = rng(SEED * 1000 + p);
  const trait = { saver: R() < 0.4, favMain: 0.55 + R() * 0.15, skillRate: 10 + R() * 8 };
  const s = newSave();
  const rows = [];
  const ms = {};
  const mark = (k, r) => { if (ms[k] === undefined) ms[k] = r; };
  const income = []; // last gold incomes
  const shardsIn = [];
  const fracHist = new Map(); // node id -> [frac per run]
  const snaps = {};
  const firstBuy = {};
  let noBuy = 0;
  const snapshot = (r) => { snaps[r] = JSON.parse(JSON.stringify({ gold: s.gold, shards: s.shards, dawnglass: s.dawnglass, tree: s.tree, stats: s.stats })); };
  snapshot(0);
  for (let r = 1; r <= RUNS; r++) {
    // ---- options + power at run start
    const weapons = [...STARTER_W.filter((w) => !w.startsWith('zw')), ...GATED_W.filter((w) => IDS.some((g) => weaponOfGate[g] === w && owned(s, g)))];
    const evos = [...STARTER_E, ...GATED_E.filter((e) => IDS.some((g) => evoOfGate[g] === e && owned(s, g)))];
    const opts = 0.5 * ((weapons.length - 2) / 3) + 0.5 * ((evos.length - 2) / 13);
    const f = PE_FULL > 0 ? peOf(s.tree) / PE_FULL : 0;
    const skill = 1 - Math.exp(-r / trait.skillRate);
    const day = { hard: (owned(s, 'cd_fourth') ? 0.5 : 0) + (owned(s, 'rs_slot5') ? 0.5 : 0), expert: 0 };
    day.expert = 0.5 * day.hard + (owned(s, 'df_ward') || owned(s, 'df_vigil') ? 0.5 : 0);
    // ---- choose hero and tier
    // the favourite (first hero) most runs; another hero when its own lanterns wait on its play count (2 heroes: the same draws as before)
    const others = HEROES.slice(1);
    const wants = others.filter((h) => IDS.some((id) => !owned(s, id) && def.nodes[id].unlock && JSON.stringify(def.nodes[id].unlock).includes(`"${h}"`) && nodeStatus(def, s, id, data).state === 'condition'));
    const pickOther = () => { const l = wants.length ? wants : others; return l.length === 1 ? l[0] : l[Math.floor(R() * l.length)]; };
    const hero = others.length && R() < (wants.length ? 0.5 : 1 - trait.favMain) ? pickOther() : HEROES[0];
    const tiers = s.stats.tiers.cursed_forest;
    const clears = (t) => (tiers[t] ? tiers[t].clears : 0);
    let tier = 'normal';
    if (owned(s, 'gt_cursed_forest_expert') && clears('hard') >= 1 && winP('expert', f, opts, skill, day) >= TRY && R() < 0.75) tier = 'expert';
    else if (owned(s, 'gt_cursed_forest_hard') && winP('hard', f, opts, skill, day) >= TRY && R() < 0.75) tier = 'hard';
    const pw = winP(tier, f, opts, skill, day);
    const win = R() < pw;
    const t = win ? CAL.runSecs : Math.round(270 + R() * 570); // deaths spread 4:30-14:00
    const frac = Math.pow(t / CAL.runSecs, CAL.ramp);
    const pay = tierPay(tier);
    const tierMul = pay.goldMul;
    const dens = tier === 'normal' ? 1 : tier === 'hard' ? 1.15 : 1.3;
    const ch = chapterReached(s);
    const mods = aggregateMods(s.tree, def, data, { tier: tier === 'normal' ? 0 : tier === 'hard' ? 1 : 2 });
    // ---- bank the run (like save.bankRun)
    const kitMul = 1 + CAL.strongKit * f;
    const gold = Math.round(CAL.goldWin * CAL.humanGold * frac * tierMul * kitMul * mods.mods.gold * (1 + CAL.chapterGold * (ch - 1)) * (0.85 + R() * 0.3));
    const st = s.stats;
    let kills = 0;
    for (const [e, k] of Object.entries(CAL.killsFull)) { const n = Math.round(k * CAL.humanKills * frac * dens * kitMul); st.killsByEnemy[e] = (st.killsByEnemy[e] || 0) + n; kills += n; }
    const boss = win || (t >= CAL.bossAt + 20 && R() < 0.5);
    const T = (tiers[tier] ||= { runs: 0, clears: 0, stars: 0, heroes: {} });
    T.runs++;
    let shards = 0; let glass = 0;
    const tierData = pay;
    const [gBoss, gDawn, gFirst, , gMarkCap, gCap] = tierData.g;
    if (boss) { st.bossKills.elder_treant = (st.bossKills.elder_treant || 0) + 1; shards += tierData.shards; glass += gBoss; }
    const marked = tier === 'normal' ? 0 : Math.round(kills * (tier === 'hard' ? 0.05 : 0.1) * Math.max(0, 1 - 240 / Math.max(t, 241)));
    st.markedKills += marked;
    glass += Math.min(gMarkCap, marked);
    if (win) {
      glass += gDawn;
      st.chapters.cursed_forest.clears++;
      T.clears++;
      const H = (T.heroes[hero] ||= { clears: 0, first: false });
      H.clears++;
      if (!H.first) { H.first = true; glass += gFirst; shards += tierData.firstShards; }
      T.stars |= 1;
      if (HEROES.length > 1 && HEROES.every((h) => T.heroes[h])) T.stars |= 2; // every hero cleared (save/tiers.js bothHeroes)
      if (R() < 0.3) T.stars |= 4;
    }
    glass = Math.min(glass, gCap + (win && T.heroes[hero].clears === 1 ? gFirst : 0));
    st.chapters.cursed_forest.runs++;
    st.chapters.cursed_forest.bestTime = Math.max(st.chapters.cursed_forest.bestTime, t);
    // evolutions: first ~3:20, then every ~3:40; signature first, only weapons the player owns, only recipes it knows
    const nEvo = Math.max(0, Math.min(4, Math.floor((t - 200) / 220)));
    const pool = [SIG[hero], ...weapons.filter((w) => w !== SIG[hero]).sort(() => R() - 0.5)].slice(0, 4);
    let done = 0;
    for (const w of pool) {
      if (done >= nEvo) break;
      const known = evos.filter((e) => data.evolutions[e] && data.evolutions[e].weapon === w);
      if (!known.length) continue;
      known.sort((a, b) => (st.evolved[a] || 0) - (st.evolved[b] || 0)); // humans try the new recipe
      st.evolved[known[0]] = (st.evolved[known[0]] || 0) + 1;
      done++;
    }
    const level = Math.round(6 + (2.9 * t) / 60 + (win ? R() * 6 : 0));
    st.bestLevel = Math.max(st.bestLevel, level);
    st.kills += kills; st.gems += Math.round(kills * 1.05); st.chests += Math.floor(t / 300); st.abilityUses += Math.floor(t / 60); st.blessingsTaken += Math.max(0, Math.floor((level - 15) / 6));
    st.charsUsed[hero] = (st.charsUsed[hero] || 0) + 1;
    st.startWeapon[SIG[hero]] = (st.startWeapon[SIG[hero]] || 0) + 1;
    st.runs++; st.totalGold += gold;
    s.gold += gold; s.shards += shards; s.dawnglass += glass;
    income.push(gold); shardsIn.push(shards);
    if (win) mark(tier === 'normal' ? 'first Twilight clear' : tier === 'hard' ? 'first Deep Dusk clear' : 'first Long Night clear', r);

    // ---- open the tree: what does the player see BEFORE buying? (the prototype presets are these moments)
    if ([1, 3, 10, 25, 50].includes(r)) snapshot(r);
    const pre = statusAll(s);
    const avgG = Math.max(1, income.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, income.length));
    const avgS = shardsIn.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, shardsIn.length);
    const runsShort = (stt) => {
      const n = stt.next;
      const g = Math.max(0, n.gold - s.gold) / avgG;
      const sh = n.shards > s.shards ? (avgS > 0 ? (n.shards - s.shards) / avgS : 99) : 0;
      const gl = n.glass > s.dawnglass ? 99 : 0;
      return Math.max(g, sh, gl);
    };
    const nearest = pre.short.length ? Math.min(...pre.short.map((x) => runsShort(x.st))) : Infinity;
    // condition goals in progress and their estimated runs left (from this player's own progress rate)
    let condNear = Infinity; let condVisible = 0;
    for (const { id, st: cs } of pre.cond) {
      const fr = cs.cond ? cs.cond.frac : 0;
      const h = fracHist.get(id) || []; h.push(fr); fracHist.set(id, h);
      if (fr > 0) condVisible++;
      const back = h.length > 5 ? h[h.length - 6] : h[0];
      const rate = (fr - back) / Math.max(1, Math.min(5, h.length - 1));
      if (rate > 0) condNear = Math.min(condNear, (1 - fr) / rate);
    }
    // ---- buy (human-ish): permanent gates first, then cheapest; savers hold gold for a near gate/keystone/mastery
    let bought = 0;
    const boughtIds = [];
    for (let guard = 0; guard < 400; guard++) {
      const now = statusAll(s);
      if (!now.afford.length) break;
      const big = now.short.filter((x) => (def.nodes[x.id].permanent || def.nodes[x.id].keystone || (x.st.next.shards > 0)) && runsShort(x.st) <= 1);
      now.afford.sort((a, b) => (def.nodes[b.id].permanent - def.nodes[a.id].permanent) || (a.st.next.gold - b.st.next.gold) || (R() - 0.5));
      let pick = now.afford[0];
      if (trait.saver && big.length && !def.nodes[pick.id].permanent) {
        const need = Math.min(...big.map((x) => x.st.next.gold));
        if (s.gold - pick.st.next.gold < need) break;
      }
      const res = buyNode(s, pick.id);
      if (!res.ok) break;
      bought++; boughtIds.push(pick.id);
    }
    noBuy = bought ? 0 : noBuy + 1;
    for (const id of boughtIds) {
      if (weaponOfGate[id]) mark(`wake ${data.weapons[weaponOfGate[id]].name}`, r);
      if (evoOfGate[id] && !ms['first evolution socket']) mark('first evolution socket', r);
      if (tierOfGate[id]) mark(`open ${tierOfGate[id] === 'hard' ? 'Deep Dusk' : 'Long Night'}`, r);
    }
    if (bought) mark('first purchase', r);
    const ownN = IDS.filter((id) => owned(s, id)).length;
    for (const q of [0.25, 0.5, 0.75, 0.9]) if (ownN >= q * IDS.length) mark(`${q * 100}% of nodes`, r);
    if (ownN >= OWNABLE) mark('whole tree', r);
    for (const id of boughtIds) if (firstBuy[id] === undefined) firstBuy[id] = r;
    for (const [reg, ids] of Object.entries(REGIONS)) if (ids.every((id) => owned(s, id))) mark(`complete ${reg}`, r);
    const post = statusAll(s);
    const frontier = post.afford.length + post.short.length; // lanterns linked + condition met (buyable with enough gold) after this run's buys
    if (post.goldLeft === 0) mark('no gold lantern left (sink opens)', r);
    if (process.env.DEBUG_NTB && frontier === 0 && post.goldLeft > 0) console.error(`nothing to buy: player ${p} run ${r}: gold-only left ${post.goldIds.join(',')}`);
    const somethingNext = pre.afford.length > 0 || nearest <= 2 || condNear <= 3;
    const visible = pre.afford.length + pre.short.length + condVisible > 0;
    rows.push({
      r, hero, tier, win, t, gold, shards, glass, bank: s.gold,
      owned: ownN, pe: peOf(s.tree), weapons: weapons.length, evos: evos.length,
      affordPre: pre.afford.length, affordPost: post.afford.length, short: pre.short.length, nearestRuns: nearest, condVisible, condNear, bought,
      frontier, held: pre.held, nothingToBuy: frontier === 0 && post.goldLeft > 0, spent: income.reduce((a, b) => a + b, 0) - s.gold,
      deadAfford: !(pre.afford.length > 0 || nearest <= 2), deadChase: !somethingNext, deadVisible: !visible && ownN < OWNABLE, wall: noBuy >= 3 && ownN < OWNABLE,
      done: ownN >= OWNABLE,
    });
  }
  return { rows, ms, snaps, firstBuy };
}

// ------------------------------------------------------------------ run + report
const t0 = performance.now();
const players = Array.from({ length: PLAYERS }, (_, i) => simulatePlayer(i + 1));
const q = (a, p) => { const b = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(b.length * p))] : NaN; };
const med = (a) => q(a, 0.5);
const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '-');
const mode = NODES ? `GROWTH ${def.list.length} nodes (synthetic constellations on chapter bands, C.13 economy rule)` : LIVE ? `LIVE tree (${IDS.length} buyable nodes the game runs today; inert tool/tier nodes excluded)` : `DESIGN tree (${IDS.length} buyable nodes: live + inert tool/tier nodes treated as built)`;
const out = [];
const log = (s = '') => { out.push(s); console.log(s); };
log(`Skill tree timeline: ${mode}`);
log(`Links: ${LINKS}. Rule: ${RULE}${patched ? ` (dry-run patch: ${patched.edits.length} edits, ${patched.bridges.length} bridges; unlinked ${patched.report.unreachable.length}, far links ${patched.report.far.length})` : ''}. Price: ${PRICE}${PRICE === 'depth' || PRICE === 'both' ? ` k=${K}` : ''}${PRICE === 'creep' || PRICE === 'both' ? ` creep=${CREEP}` : ''}. Econ: ${ECON} (win gold ${CAL.goldWin}, calib ${CALIB}). Tier rewards: ${TIERS}.`);
log(`${PLAYERS} human-model players x ${RUNS} runs, seed ${SEED}. Full-tree combat PE ${PE_FULL.toFixed(2)}. Tiers modelled: ${hasTiers ? 'yes' : 'no (tier gates inert)'}. ${Math.round(performance.now() - t0)} ms`);
log(`heroes: ${HEROES.join(', ')}`);
log('MODEL, not the Sim: income/kills/win odds calibrated to economy 9.3 and the locked win bands (header of this script).');
log('');
const CK = NODES ? [1, 2, 3, 5, 10, 20, 40, 60, 80, 100, 140, 180, 220, 260, 300].filter((r) => r <= RUNS) : [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].filter((r) => r <= RUNS);
log('run | owned (of ' + OWNABLE + ' ownable) | buyable (linked, condition met; any gold) | power PE | weapons/evos open | gold this run | affordable after the run | nearest not-affordable (runs) | goals in progress | win% | dead: nothing near / nothing to chase');
for (const r of CK) {
  const rs = players.map((p) => p.rows[r - 1]);
  const pc = (k) => Math.round((rs.filter((x) => x[k]).length / rs.length) * 100);
  log(`${String(r).padStart(3)} | ${fmt(med(rs.map((x) => x.owned)))} (${fmt(q(rs.map((x) => x.owned), 0.1))}-${fmt(q(rs.map((x) => x.owned), 0.9))}) | ${fmt(med(rs.map((x) => x.frontier)))} (p10 ${fmt(q(rs.map((x) => x.frontier), 0.1))}) | ${fmt(med(rs.map((x) => x.pe)), 2)} | ${fmt(med(rs.map((x) => x.weapons)))}/${fmt(med(rs.map((x) => x.evos)))} | ${fmt(med(rs.map((x) => x.gold)))} | ${fmt(med(rs.map((x) => x.affordPre)))} [buys ${fmt(med(rs.map((x) => x.bought)))}] (p10 ${fmt(q(rs.map((x) => x.affordPre), 0.1))}) | ${fmt(med(rs.map((x) => x.nearestRuns)), 1)} | ${fmt(med(rs.map((x) => x.condVisible)))} | ${pc('win')}% | ${pc('deadAfford')}% / ${pc('deadChase')}%`);
}
log('');
log('Milestones: run number, median (p10-p90), share of players who reached it');
const keys = [...new Set(players.flatMap((p) => Object.keys(p.ms)))];
const orderK = (k) => med(players.map((p) => p.ms[k] ?? Infinity));
keys.sort((a, b) => orderK(a) - orderK(b));
const synthK = keys.filter((k) => /^(wake Z |complete zw)/.test(k));
if (synthK.length) {
  const comp = synthK.filter((k) => k.startsWith('complete')).map((k) => orderK(k));
  log(`  (synthetic constellations: ${synthK.length / 2} woken and completed; first completed at run ${fmt(Math.min(...comp))}, last at run ${fmt(Math.max(...comp))}; one line each omitted)`);
}
for (const k of keys.filter((x) => !synthK.includes(x))) {
  const v = players.map((p) => p.ms[k]).filter((x) => x !== undefined);
  log(`  ${k.padEnd(34)} ${fmt(med(v)).padStart(4)} (${fmt(q(v, 0.1))}-${fmt(q(v, 0.9))})  ${Math.round((v.length / PLAYERS) * 100)}%`);
}
log('');
// dead zones: runs where a player had nothing affordable and nothing within 2 runs (pacing rule), or nothing at all to chase
const dz = (k) => players.map((p) => p.rows.filter((x) => x[k] && !x.done).map((x) => x.r));
const summarise = (lists, label) => {
  const all = lists.flat();
  const hist = {};
  for (const r of all) { const b = r <= 10 ? '1-10' : r <= 25 ? '11-25' : r <= 50 ? '26-50' : r <= 100 ? '51-100' : r <= 200 ? '101-200' : '201+'; hist[b] = (hist[b] || 0) + 1; }
  const runsTot = players.reduce((a, p) => a + p.rows.filter((x) => !x.done).length, 0);
  log(`  ${label}: ${all.length} of ${runsTot} player-runs (${((all.length / Math.max(1, runsTot)) * 100).toFixed(1)}%); by run band ${JSON.stringify(hist)}`);
};
log('Dead zones (only runs before the player owns everything):');
summarise(dz('deadAfford'), 'A. pacing rule broken (nothing affordable now, nearest node > 2 runs away)');
summarise(dz('deadChase'), 'B. nothing to chase (A and no condition goal within ~3 runs)');
summarise(dz('deadVisible'), 'C. nothing visible at all (no buyable or in-progress node)');
summarise(dz('wall'), 'D. grind wall (3+ runs in a row without a purchase)');
summarise(dz('nothingToBuy'), 'E. NOTHING TO BUY (target 0): no linked lantern with its condition met, while gold-only lanterns remain');
const heldRuns = players.flatMap((p) => p.rows.filter((x) => x.held > 0 && !x.done));
log(`  lanterns held back by the connected rule (buyable under today's rules but not linked): median ${fmt(med(heldRuns.map((x) => x.held)))} in ${heldRuns.length} player-runs; run 1 ${fmt(med(players.map((p) => p.rows[0].held)))}, run 3 ${fmt(med(players.map((p) => p.rows[Math.min(2, RUNS - 1)].held)))}, run 10 ${fmt(med(players.map((p) => p.rows[Math.min(9, RUNS - 1)].held)))}`);
{
  const byD = {};
  for (const id of IDS) if (priced(id) && BASE[id] > 0) (byD[DEPTH[id]] ||= []).push(BASE[id]);
  log(`  price by depth (rank-1 gold, mean [n]): ${Object.entries(byD).sort((a, b) => a[0] - b[0]).map(([d, a]) => `d${d} ${Math.round(a.reduce((x, y) => x + y, 0) / a.length)} [${a.length}]`).join(', ')}`);
  const spentEnd = players.map((p) => p.rows[p.rows.length - 1].spent);
  log(`  gold spent by run ${RUNS}: median ${fmt(med(spentEnd))}; bank at run ${RUNS}: median ${fmt(med(players.map((p) => p.rows[p.rows.length - 1].bank)))}`);
}
// the longest stretch without a purchase per player
const longest = players.map((p) => { let m = 0, c = 0; for (const x of p.rows) { if (x.done) break; c = x.bought ? 0 : c + 1; m = Math.max(m, c); } return m; });
log(`  longest stretch without a purchase: median ${med(longest)}, max ${Math.max(...longest)} runs`);
log('');
const fin = players.map((p) => p.ms['whole tree'] ?? Infinity);
// long poles: the nodes bought last (median first-buy run)
const allIds = IDS.map((id) => [id, med(players.map((p) => p.firstBuy[id] ?? Infinity))]).sort((a, b) => b[1] - a[1]);
log(`Long poles (bought last, median run): ${allIds.slice(0, 10).map(([id, r]) => `${id} ${fmt(r)}`).join(', ')}`);
log(`Whole tree (all ${OWNABLE} ownable): median run ${fmt(med(fin))}, ${Math.round((fin.filter(Number.isFinite).length / PLAYERS) * 100)}% finished within ${RUNS} runs.`);

{
  const msMed = (k) => { const v = players.map((p) => p.ms[k]).filter((x) => x !== undefined); return v.length ? `${fmt(med(v))} (${Math.round((v.length / PLAYERS) * 100)}%)` : '-'; };
  const allRuns = players.flatMap((p) => p.rows.filter((x) => !x.done));
  const pct = (k) => ((allRuns.filter((x) => x[k]).length / Math.max(1, allRuns.length)) * 100).toFixed(1);
  const r1 = players.map((p) => p.rows[0]);
  log(`SUMMARY links=${LINKS} rule=${RULE} price=${PRICE} econ=${ECON} tiers=${TIERS} | run1 buyable ${fmt(med(r1.map((x) => x.affordPre)))} buys ${fmt(med(r1.map((x) => x.bought)))} | buyable@3/10/25 ${[3, 10, 25].map((r) => fmt(med(players.map((p) => p.rows[Math.min(r, RUNS) - 1].frontier)))).join('/')} | nothing-to-buy ${pct('nothingToBuy')}% | dead A ${pct('deadAfford')}% B ${pct('deadChase')}% wall ${pct('wall')}% | 50% ${msMed('50% of nodes')} 90% ${msMed('90% of nodes')} sink ${msMed('no gold lantern left (sink opens)')} whole ${msMed('whole tree')} | Twilight ${msMed('first Twilight clear')} DD open ${msMed('open Deep Dusk')} DD clear ${msMed('first Deep Dusk clear')} LN clear ${msMed('first Long Night clear')}`);
}
if (JSON_OUT) { writeFileSync(JSON_OUT, JSON.stringify({ mode, players: PLAYERS, runs: RUNS, seed: SEED, peFull: PE_FULL, rows: players.map((p) => p.rows), milestones: players.map((p) => p.ms) })); console.log(`wrote ${JSON_OUT}`); }
if (PRESETS_OUT) {
  // the median player by 'whole tree' run (or by owned count at the end) gives the prototype its save presets
  const order = players.map((p, i) => [i, p.rows[Math.min(24, p.rows.length - 1)].owned]).sort((a, b) => a[1] - b[1]);
  const pl = players[order[Math.floor(order.length / 2)][0]];
  const presets = Object.entries(pl.snaps).map(([r, sv]) => ({ label: Number(r) === 0 ? 'New save' : `Run ${r} just banked`, run: Number(r), ...sv }));
  writeFileSync(PRESETS_OUT, JSON.stringify(presets));
  console.log(`wrote ${PRESETS_OUT} (${presets.length} presets)`);
}
