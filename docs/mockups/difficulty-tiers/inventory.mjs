// Difficulty tiers + tree upgrade groups + economy: the DESIGN DATA behind docs/design/difficulty-tiers-economy-v1.md.
// Design-only (not game code). `node inventory.mjs` prints every table in the sheet, so every number is reproducible.
// Numbers marked est are estimates to be replaced by bot measurements in the D-chunks (section 12 of the sheet).

// ------------------------------------------------------------------ tiers (option A, per chapter, data in chapters.json)
export const TIERS = {
  normal: { name: 'Twilight', order: 0, enemyHp: 1.0, enemyDmg: 1.0, rate: 1.0, bossHp: 1.0, affix: null, heartPity: 1.0,
    rewards: { gold: 1.0, bossShards: 5, glass: { boss: 0, dawn: 0, firstClear: 0, elite: 0, runCap: 0 } } },
  hard: { name: 'Deep Dusk', order: 1, enemyHp: 1.45, enemyDmg: 1.15, rate: 1.15, bossHp: 1.5, heartPity: 1.0,
    affix: { from: 240, share: 0.05, max: 1, pool: ['ironbark', 'swiftshade', 'emberwake'] },
    rewards: { gold: 1.5, bossShards: 7, glass: { boss: 2, dawn: 2, firstClear: 6, elite: 1, eliteCap: 2, runCap: 6 } } },
  expert: { name: 'Long Night', order: 2, enemyHp: 2.0, enemyDmg: 1.3, rate: 1.3, bossHp: 2.0, heartPity: 1.3,
    affix: { from: 150, share: 0.1, max: 1, pool: ['ironbark', 'swiftshade', 'emberwake', 'hollowheart'] },
    rewards: { gold: 2.0, bossShards: 10, glass: { boss: 3, dawn: 4, firstClear: 10, elite: 1, eliteCap: 3, runCap: 10 } } },
};

export const AFFIXES = {
  ironbark: { verb: 'outlast it', effect: 'hp x1.8, speed x0.85', look: 'pale bark plates over the mask, heavier outline', tell: 'static (shape only)' },
  swiftshade: { verb: 'out-turn it', effect: 'speed x1.3, hp x0.8', look: 'cold violet motion streak (existing WL6c streak, always on)', tell: 'streak' },
  emberwake: { verb: 'step out of it', effect: 'on death leaves a 28 px red-orange ring for 1.2 s (dmg = its contact dmg / s)', look: 'ember cracks in the mask', tell: 'ring telegraph 0.6 s, above vignette' },
  hollowheart: { verb: 'kill it first', effect: 'nearby (60 px) enemies +15% speed while it lives (no stacking)', look: 'hollow chest glow, thin violet threads to neighbours', tell: 'threads' },
};

// ------------------------------------------------------------------ resources
export const RESOURCES = {
  gold: { identity: 'grave coins the Hollow left behind', source: 'every kill, chests, boss', sink: 'every lantern', save: 'save.gold (exists, clamp 1e12)' },
  shards: { identity: 'soul shards: a boss\'s freed light', source: 'boss kill (5/7/10 by tier); masteries none', sink: 'capstones, keystones, masteries, tier gates', save: 'save.shards (exists)' },
  glass: { identity: 'DAWNGLASS: morning light caught in glass, only where the night is deepest', source: 'Deep Dusk / Long Night only: boss, dawn (victory), first clear per hero, affixed elites (capped)', sink: 'Daybreak lanterns (tier-locked options), Long Night gate, cosmetic lantern tints (never dead)', save: 'save.dawnglass (new, integer, clamp 0..1e9)' },
};

// ------------------------------------------------------------------ nodes for the four groups + Dusk Gate
// kind: knot|lantern|gate|keystone|mastery. pool: combat|sustain|util|info|choice|tier. pe = budget weight (est = ablation later)
// scope: 'all' = every tier; 'hard+' = applies only on Deep Dusk and Long Night (tier-scoped, D3 option A)
// moved = existing id, place changes only (no effect change unless noted)
const N = (o) => ({ ranks: 1, shards: 0, glass: 0, scope: 'all', moved: false, pe: 0, ...o });
export const GROUPS = {
  satchel: { title: 'Satchel (Collection & Pickup)', emblem: 'satchel', bearing: 126, nodes: [
    N({ id: 'li_reach', moved: true, name: 'Wider Lantern', eff: 'Gem pickup range +4% per rank (was +6% x1)', ranks: 4, gold: 200, rankCost: 1.5, pool: 'util', cat: 'pickup', unlock: '' }),
    N({ id: 'li_scav', moved: true, name: 'Scavenger', eff: 'Gem pickup range +4% (was +6%)', gold: 450, pool: 'util', cat: 'pickup', unlock: 'slay 500 wolves OR 800 crows (as v2)' }),
    N({ id: 'co_pull', name: 'Eager Gems', eff: 'Gems fly to you 15% faster per rank (magnetSpeed 260 -> 377 at r3)', ranks: 3, gold: 260, rankCost: 1.6, pool: 'util', cat: 'pull', unlock: '' }),
    N({ id: 'co_call', name: 'Lantern Call', eff: 'On level-up, gems within 2x your pickup range fly to you', gold: 1100, pool: 'util', cat: 'collect', pe: 0.05, unlock: 'reach level 35 in a run' }),
    N({ id: 'li_hearts', moved: true, name: 'Kinder Hearts', eff: 'Hearts +5% AND heart pity 30 s -> 25 s (re-weighted, same 0.2 sustain)', gold: 840, pool: 'sustain', cat: 'heartDrop', pe: 0.2, unlock: '' }),
    N({ id: 'li_heal', moved: true, name: 'Mending Light', eff: 'Hearts heal +5% (as v2)', gold: 900, pool: 'sustain', cat: 'heartHeal', pe: 0.2, unlock: '' }),
    N({ id: 'li_magnet', moved: true, name: 'Lodestar', eff: 'r1 Soul Magnets +25% (as v2); r2 magnet pity 30 s -> 24 s', ranks: 2, gold: 750, rankCost: 1.4, pool: 'util', cat: 'magnet', unlock: '' }),
    N({ id: 'co_glean', kind: 'mastery', name: 'Gleaner', eff: 'Experience +2% (XP utility cap 7.5% holds: li_study 3% + 2%)', gold: 1400, shards: 1, pool: 'util', cat: 'xp', unlock: 'collect 60000 gems (lifetime)' }),
  ] },
  cards: { title: 'Card Fan (Cards & Information)', emblem: 'cardfan', bearing: 342, nodes: [
    N({ id: 'sp_reroll2', moved: true, name: 'Third Glance', eff: '+1 reroll (as v2)', gold: 270, pool: 'sustain', cat: 'reroll', pe: 0.1, unlock: '' }),
    N({ id: 'sp_reroll3', moved: true, name: 'Fourth Glance', eff: '+1 reroll (as v2)', gold: 600, pool: 'sustain', cat: 'reroll', pe: 0.1, unlock: '' }),
    N({ id: 'sp_ban2', moved: true, name: 'Second Snuff', eff: '+1 banish (as v2)', gold: 330, pool: 'sustain', cat: 'banish', pe: 0.1, unlock: '' }),
    N({ id: 'sp_ban3', moved: true, name: 'Third Snuff', eff: '+1 banish (as v2)', gold: 720, pool: 'sustain', cat: 'banish', pe: 0.1, unlock: '' }),
    N({ id: 'cd_stir', name: 'Louder Stirring', eff: '"Something stirs" also lights when the PARTNER stat is rank 2+ (earlier hint); still never names an evolution', gold: 600, pool: 'info', cat: 'info', unlock: 'evolve weapons 3 times' }),
    N({ id: 'cd_peek', name: 'Second Sight', eff: 'See the next level-up offer, dimmed, under the current one (it can still change if a pick removes a card)', gold: 900, pool: 'choice', cat: 'choice', pe: 0.05, unlock: 'reach level 30 in a run' }),
    N({ id: 'cd_bars', name: "Hunter's Eye", eff: 'Thin health bars + affix name on affixed enemies and minibosses (boss bar stays free)', gold: 500, pool: 'info', cat: 'info', unlock: 'slay 20 affixed enemies OR 3 Grey Alphas' }),
    N({ id: 'cd_radar', name: 'Lantern Compass', eff: 'Edge arrows also point to chests and to the next miniboss 20 s before it arrives', gold: 700, pool: 'info', cat: 'info', unlock: 'open 5 chests' }),
    N({ id: 'cd_favour', name: 'Favoured Spirit', eff: 'At run start mark one weapon: its stat cards weigh x1.5 (inside the evoNudge cap; recipes stay hidden)', gold: 1200, pool: 'choice', cat: 'choice', pe: 0.2, unlock: 'evolve weapons 8 times' }),
    N({ id: 'cd_fourth', kind: 'keystone', name: 'Fourth Card', eff: 'Level-ups offer 4 cards (offerSize 3 -> 4); gold cards stay max 3', gold: 2000, glass: 8, scope: 'hard+', pool: 'tier', cat: 'choice', pe: 1.0, unlock: 'clear Cursed Forest on Deep Dusk' }),
  ] },
  almanac: { title: 'Almanac (Mastery & Bestiary)', emblem: 'almanac', bearing: 198, nodes: [] },
  hearthkey: { title: 'Hearth-key (Run Start & Safety)', emblem: 'hearthkey', bearing: 54, nodes: [
    N({ id: 'sp_auto', moved: true, name: 'Steady Hand', eff: 'Ability fires itself below 30% health (as v2)', gold: 1050, pool: 'util', cat: 'autoAbility', unlock: 'survive 5:00 in Cursed Forest' }),
    N({ id: 'rs_autoset', name: 'Chosen Moment', eff: 'Pick the auto-fire rule in Settings: below 30% / below 50% / when 25+ foes are near / off', gold: 900, pool: 'util', cat: 'autoAbility', unlock: 'use your ability 100 times' }),
    N({ id: 'rs_start', name: 'Kindred Start', eff: 'At 0:00 choose your second spirit from 3 of your unlocked weapons (a free weapon card)', gold: 1500, pool: 'choice', cat: 'choice', pe: 0.2, unlock: 'wake 1 sleeping spirit (any weapon gate)' }),
    N({ id: 'rs_bless', name: 'Lantern Blessing', eff: 'Start with one Blessing rank (choose 1 of 3); counts toward the Blessing caps', gold: 1800, shards: 2, pool: 'choice', cat: 'choice', pe: 0.3, unlock: 'take 15 Blessings' }),
    N({ id: 'li_last', moved: true, name: 'Last Light', eff: 'Once per run a killing blow returns you at 20% health (as v2; the one revive)', gold: 900, shards: 5, pool: 'sustain', cat: 'revive', pe: 4.0, unlock: 'clear Cursed Forest' }),
    N({ id: 'rs_slot5', kind: 'keystone', name: 'Fifth Hook', eff: 'A 5th weapon slot (balance.weaponSlots 4 -> 5)', gold: 3000, shards: 3, glass: 12, scope: 'hard+', pool: 'tier', cat: 'slot', pe: 1.5, unlock: 'clear Deep Dusk with Wren AND with Elias' }),
  ] },
  nightgate: { title: 'Night Gate (Difficulty)', emblem: 'nightgate', bearing: 270, nodes: [
    N({ id: 'gt_cursed_forest_hard', kind: 'gate', name: 'Deep Dusk: Cursed Forest', eff: 'Unlocks the Deep Dusk tier (permanent, kept on respec)', gold: 1200, shards: 2, pool: 'none', cat: 'gate', unlock: 'clear Cursed Forest (Twilight)' }),
    N({ id: 'gt_cursed_forest_expert', kind: 'gate', name: 'Long Night: Cursed Forest', eff: 'Unlocks the Long Night tier (permanent)', gold: 2500, shards: 4, glass: 10, pool: 'none', cat: 'gate', unlock: 'clear Cursed Forest on Deep Dusk' }),
    N({ id: 'df_ward', kind: 'keystone', name: 'Dawnward (pair A)', eff: 'Long Night only: hearts heal +10%, all damage -1% (excludes df_vigil)', gold: 1800, glass: 10, scope: 'expert', pool: 'tier', cat: 'tierSus', pe: 0.4, unlock: 'clear Long Night once' }),
    N({ id: 'df_vigil', kind: 'keystone', name: 'Night Vigil (pair B)', eff: 'Long Night only: all damage +2%, max health -3% (excludes df_ward)', gold: 1800, glass: 10, scope: 'expert', pool: 'tier', cat: 'tierDmg', pe: 0.6, unlock: 'clear Long Night once' }),
    N({ id: 'df_star', kind: 'mastery', name: 'Three Dawns', eff: 'Cosmetic: your lantern burns with a dawn rim on the map + results (no power)', gold: 1000, glass: 6, pool: 'none', cat: 'cosmetic', unlock: 'earn all 9 stars in Cursed Forest' }),
  ] },
};

// Almanac lore lanterns: per enemy type 2 lore lanterns (+1% damage vs that type each) + 1 tell lantern (its tell shows 0.1 s earlier)
// Counts sized from bot kill rates per run (wolf ~800, crow ~900, crawler ~190; human ~1.5x slower). New Husk types: est.
export const LORE = [
  ['wolf', 'Fell Wolf', [1000, 4000, 12000]],
  ['crow', 'Grave Crow', [1000, 4000, 12000]],
  ['root_crawler', 'Root Crawler', [250, 1000, 3000]],
  ['stoat_piper', 'Stoat Piper (EN3)', [200, 800, 2500]],
  ['husk_b', 'Husk type 5 (EN4/EN5, area denial)', [200, 800, 2500]],
  ['husk_c', 'Husk type 6 (EN6, heavy charge)', [150, 600, 1800]],
  ['grey_alpha', 'Branch-Mane / Grey Alpha (miniboss)', [5, 20, 60]],
  ['elder_treant', 'Elder Treant (boss)', [1, 5, 15]],
];
const pre = { wolf: 'wolf', crow: 'crow', root_crawler: 'crawl', stoat_piper: 'stoat', husk_b: 'hb', husk_c: 'hc', grey_alpha: 'alpha', elder_treant: 'treant' };
for (const [eid, nm, [a, b, c]] of LORE) {
  const G = GROUPS.almanac.nodes;
  const cost = eid === 'elder_treant' || eid === 'grey_alpha' ? [300, 700, 500] : [200, 500, 400];
  G.push(N({ id: `bs_${pre[eid]}1`, name: `${nm}: Habits`, eff: `+1% damage vs ${nm}`, gold: cost[0], pool: 'combat', cat: 'lore', unlock: `slay ${a} ${nm}` }));
  G.push(N({ id: `bs_${pre[eid]}2`, name: `${nm}: Weakness`, eff: `+1% damage vs ${nm} (lore cap 2% per type)`, gold: cost[1], pool: 'combat', cat: 'lore', unlock: `slay ${b} ${nm}` }));
  G.push(N({ id: `bs_${pre[eid]}3`, name: `${nm}: Tells`, eff: `its attack tell shows 0.1 s earlier (readability; boss/miniboss: the tell ring is brighter)`, gold: cost[2], pool: 'info', cat: 'tells', unlock: `slay ${c} ${nm}` }));
}
GROUPS.almanac.nodes.push(N({ id: 'bs_page', kind: 'mastery', name: 'Full Almanac', eff: 'Codex page art + all Almanac lanterns glow; +1 Blessing choice in chests (3 -> 4 shown; no power beyond the Blessing caps)', gold: 2000, shards: 2, pool: 'choice', cat: 'choice', pe: 0.05, unlock: 'every Habits lantern lit' }));

// mastery per weapon / hero: ALREADY in the v2 tree (constellation masteries wf_third, rv_oath, bo_twin, cl_crown, or_seventh; hero lanterns). Not duplicated.

// ------------------------------------------------------------------ budget (Chapter 1 / Twilight scope)
// v2 rule (skill-tree-v2 section 8) vs proposed rule. S = face sums of the v2 inventory (unchanged nodes).
const soft = (S, C) => (S <= 0 ? 0 : C * (1 - Math.exp(-S / C)));
const V2 = { dmg: [3, 1, 3.0], tagS: [6, 0.35, 8.5], tagM: [6, 0.35, 4.0], cast: [4, 0.3, 2.0], area: [6, 0.12, 5.0], hp: [6, 0.2, 9.0], heal: [1.5, 0.4, 1.3], status: [8, 0.15, 10.0] };
const WPN = { cap: 8, w: 0.08, S: [20, 20, 22, 22, 20] };
const PROP = { dmg: [2.5, 1, 3.0], tagS: [5, 0.35, 8.5], tagM: [5, 0.35, 4.0], cast: [3, 0.3, 2.0], area: [4, 0.12, 5.0], hp: [6, 0.2, 9.0], heal: [1.5, 0.4, 1.3], status: [8, 0.15, 10.0], lore: [2, 0.6, 2.0] };
const WPNP = { cap: 7, w: 0.08, S: WPN.S };
export function budget(rule, wpn, choicePE) {
  const rows = [];
  let pe = 0, cap = 0;
  for (const [k, [C, w, S]] of Object.entries(rule)) { const st = soft(S, C); rows.push([k, C, w, S, st, st * w, C * w]); pe += st * w; cap += C * w; }
  let wpe = 0; for (const S of wpn.S) wpe += soft(S, wpn.cap) * wpn.w;
  rows.push(['wpn (5 weapons)', wpn.cap, wpn.w, wpn.S.reduce((a, b) => a + b, 0), null, wpe, wpn.cap * wpn.w * 5]);
  pe += wpe; cap += wpn.cap * wpn.w * 5;
  if (choicePE) { rows.push(['choice (discrete, est)', '-', '-', '-', null, choicePE, choicePE]); pe += choicePE; cap += choicePE; }
  return { rows, pe, cap };
}
export function choiceSum(scope = 'all') {
  let s = 0; for (const g of Object.values(GROUPS)) for (const n of g.nodes) if (n.pool === 'choice' && n.scope === scope) s += n.pe; return s;
}

// ------------------------------------------------------------------ costs
export function nodeCost(n) { let g = 0; for (let k = 1; k <= n.ranks; k++) g += Math.max(10, Math.round((n.gold * Math.pow(n.rankCost || 1, k - 1)) / 10) * 10); return { g, s: n.shards * n.ranks, d: n.glass * n.ranks }; }
export function groupCost() {
  const out = {};
  for (const [k, gr] of Object.entries(GROUPS)) {
    const t = { n: 0, nNew: 0, g: 0, gNew: 0, s: 0, d: 0 };
    const seenPair = new Set();
    for (const n of gr.nodes) {
      const c = nodeCost(n); t.n++; if (!n.moved) { t.nNew++; t.gNew += c.g; }
      t.g += c.g; t.s += c.s; t.d += c.d;
    }
    out[k] = t;
  }
  return out;
}

// ------------------------------------------------------------------ economy (MODEL; bot-measured inputs where marked)
// Measured 2026-10-18 (scripts/bot.mjs wren 8): starter Normal loss mean 468 gold (dies ~5:00), win 2689 + 5 shards;
// META=full GATES=all Normal win ~3600 (gold nodes +~24%), loss at 11:00 2257. Human ~0.75x the bot's gold per run (shorter runs).
export const INCOME = {
  normal: { win: 2700, loss: 700, shardsWin: 5 },
  hard: { win: 2700 * 1.5 * 1.12, loss: 1400 * 1.5, shardsWin: 7 },
  expert: { win: 2700 * 2.0 * 1.12, loss: 1600 * 2.0, shardsWin: 10 },
};
export function glassPerRun(tier, win, firstClearHeroes = 0, elites = 2) {
  const g = TIERS[tier].rewards.glass; if (!g.runCap) return 0;
  const run = (win ? g.boss + g.dawn : 0.6 * g.boss) + Math.min(g.eliteCap, elites * g.elite);
  return Math.min(g.runCap, run) + firstClearHeroes * g.firstClear;
}

// Staged player model: win chance by tier rises with tree share owned (f). Returns runs per milestone.
export function simulatePlayer({ human = 1, totalGold, totalShards, glassNeed, seed = 1 } = {}) {
  let gold = 0, shards = 0, glass = 0, spentG = 0, spentS = 0, spentD = 0, runs = 0, clears = { normal: 0, hard: 0, expert: 0 };
  let hard = false, expert = false; const firsts = { hard: new Set(), expert: new Set() };
  const ms = {};
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pw = { normal: (f) => 0.25 + 0.5 * f, hard: (f) => 0.05 + 0.4 * f, expert: (f) => 0.0 + 0.3 * Math.max(0, f - 0.3) / 0.7 };
  while (runs < 400) {
    runs++;
    const f = Math.min(1, spentG / totalGold);
    const tier = expert && pw.expert(f) >= 0.1 ? 'expert' : hard && pw.hard(f) >= 0.15 ? 'hard' : 'normal';
    const hero = runs % 2 ? 'wren' : 'elias';
    const win = rnd() < pw[tier](f);
    const inc = INCOME[tier];
    gold += (win ? inc.win : inc.loss) * human; if (win) shards += inc.shardsWin; else if (rnd() < 0.15) shards += inc.shardsWin; // boss killed but died later
    let fc = 0; if (win && tier !== 'normal' && !firsts[tier].has(hero)) { firsts[tier].add(hero); fc = 1; }
    glass += tier === 'normal' ? 0 : glassPerRun(tier, win, fc);
    if (win) clears[tier]++;
    // spend: gold nodes as gold allows (shards proportional), tier gates as soon as conditions hold
    const buy = Math.max(0, Math.min(gold, totalGold - spentG)); spentG += buy; gold -= buy;
    const bs = Math.max(0, Math.min(shards, totalShards - spentS)); spentS += bs; shards -= bs;
    if (!hard && clears.normal >= 1 && spentG >= 1200) { hard = true; ms.hardUnlocked ??= runs; }
    if (hard && !expert && clears.hard >= 1 && glass >= 10) { expert = true; glass -= 10; spentD += 10; ms.expertUnlocked ??= runs; }
    if (expert) { const bd = Math.min(glass, glassNeed - spentD); spentD += bd; glass -= bd; }
    if (clears.normal >= 1) ms.firstClear ??= runs;
    if (clears.hard >= 1) ms.firstHard ??= runs;
    if (clears.expert >= 1) ms.firstExpert ??= runs;
    if (spentG >= totalGold) ms.goldDone ??= runs;
    if (spentS >= totalShards) ms.shardsDone ??= runs;
    if (spentD >= glassNeed) ms.glassDone ??= runs;
    if (ms.goldDone && ms.shardsDone && ms.glassDone && ms.firstExpert) break;
  }
  return ms;
}

// ------------------------------------------------------------------ print
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('inventory.mjs')) {
  const f1 = (x) => (typeof x === 'number' ? (Math.round(x * 100) / 100).toString() : String(x));
  console.log('## Budget v2 rule (skill-tree-v2 s8)');
  const a = budget(V2, WPN, 0); for (const r of a.rows) console.log(r.map(f1).join(' | ')); console.log('combat PE at total', f1(a.pe), 'at cap', f1(a.cap));
  const cs = choiceSum('all');
  console.log('\n## Budget PROPOSED rule (Twilight scope), choice nodes (scope all) PE', f1(cs));
  const b = budget(PROP, WPNP, cs); for (const r of b.rows) console.log(r.map(f1).join(' | ')); console.log('combat PE at total', f1(b.pe), 'at cap', f1(b.cap));
  console.log('tier-scoped (hard+) choice PE', f1(GROUPS.cards.nodes.concat(GROUPS.hearthkey.nodes).filter((n) => n.scope === 'hard+').reduce((s, n) => s + n.pe, 0)), 'expert-scoped PE (larger side of pair)', 0.6);
  console.log('\n## Group costs');
  const gc = groupCost(); let T = { n: 0, nNew: 0, g: 0, gNew: 0, s: 0, d: 0 };
  for (const [k, t] of Object.entries(gc)) { console.log(k, JSON.stringify(t)); for (const x in T) T[x] += t[x]; }
  console.log('ALL', JSON.stringify(T));
  console.log('\n## Nodes');
  for (const [k, g] of Object.entries(GROUPS)) for (const n of g.nodes) { const c = nodeCost(n); console.log(`| ${n.id} | ${k} | ${n.moved ? 'moved' : 'NEW'} | ${n.name} | ${n.eff} | ${n.ranks} | ${c.g} | ${c.s} | ${c.d} | ${n.unlock || '-'} | ${n.pool}${n.pe ? ' ' + n.pe : ''} | ${n.scope} |`); }
  console.log('\n## Dawnglass per run');
  for (const t of ['hard', 'expert']) console.log(t, 'win', glassPerRun(t, true), 'loss', glassPerRun(t, false), 'first-clear win', glassPerRun(t, true, 1));
  const glassNeed = Object.values(GROUPS).flatMap((g) => g.nodes).reduce((s, n) => s + n.glass * n.ranks, 0) - 10; // df_ward/df_vigil: only one side needed
  const totalGold = 74000 + T.gNew; const totalShards = 29 + T.s - 5 /* li_last already counted in 29 */;
  console.log('\n## Economy model: total gold', totalGold, 'shards', totalShards, 'dawnglass (one side of the pair)', glassNeed);
  for (const human of [1, 0.75]) {
    const out = []; for (let seed = 1; seed <= 40; seed++) out.push(simulatePlayer({ human, totalGold, totalShards, glassNeed, seed }));
    const med = (k) => { const v = out.map((o) => o[k]).filter((x) => x).sort((p, q) => p - q); return v.length ? `${v[Math.floor(v.length / 2)]} (p90 ${v[Math.floor(v.length * 0.9)]}, ${v.length}/40)` : 'never'; };
    console.log(`human factor ${human}:`, ['firstClear', 'hardUnlocked', 'firstHard', 'expertUnlocked', 'firstExpert', 'goldDone', 'shardsDone', 'glassDone'].map((k) => `${k} ${med(k)}`).join('; '));
  }
}
