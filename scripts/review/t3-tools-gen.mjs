// One-off (T3b, 2026-10-18): writes the five TOOL CLUSTER fragments (src/data/tree/tools/*.json) and moves / rescales the eleven existing ids
// that live in them (core.json). Source of every number: docs/design/difficulty-tiers-economy-v1.md section 8.2. After this run the JSON is the
// source of truth (hand-editable); this script is kept only as provenance. Idempotent.
//   Almanac lanterns are written only for enemies that exist today (wolf, crow, root_crawler, elder_treant); the Husk and miniboss trios are
//   additive later (new ids in the same fragment, next free idx) once EN3-EN7 land and their ids are final.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'src', 'data', 'tree');
const enemies = JSON.parse(readFileSync(join(root, 'src', 'data', 'enemies.json'), 'utf8'));
const w = (p, j) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(j, null, 1) + '\n'); };
const r1 = (v) => Math.round(v * 10) / 10;
const ringAt = (n, r, i, start = -90) => { const a = ((start + (360 * i) / n) * Math.PI) / 180; return [r1(r * Math.cos(a)), r1(r * Math.sin(a))]; };

// ---- core.json: namespaces, budget, the eleven moved ids
const core = JSON.parse(readFileSync(join(dir, 'core.json'), 'utf8'));
for (const [p, t] of [['co', 'satchel'], ['cd', 'cardfan'], ['bs', 'almanac'], ['rs', 'hearthkey'], ['df', 'nightgate']]) core.namespaces[p] = { kind: 'tool', owners: [t] };
core.budget.utility.pickup = 20; // Satchel: range steps (li_reach 4 x 4% + li_scav 4%); the combined cap with Blessings (1.45) keeps the total in check
core.budget.sustain.heartPity = 0.016; // per second taken off the heart pity timer (Kinder Hearts: 5 s = 0.08, with +3% hearts = the old 0.2)
core.budget.loreShare = 0.2; // Almanac: one type's +1% is worth 0.2 face points (average share of damage dealt to typed foes)
core.budget.perTier = { 1: { combat: 2.5, sustain: 0 }, 2: { combat: 0.6, sustain: 0 } }; // Deep Dusk +2.5 (Fourth Card 1.0 + Fifth Hook 1.5), Long Night +0.6 more (the larger keystone side)
const by = Object.fromEntries(core.nodes.map((n) => [n.id, n]));

Object.assign(by.li_reach, { name: 'Wider Lantern', desc: 'Gem pickup range +4% per rank.', maxRank: 4, rankCost: 1.5, cost: { gold: 200 }, effects: [{ mod: 'pickup', pct: 4 }], requires: [] });
Object.assign(by.li_scav, { name: 'Scavenger', desc: 'Gem pickup range +4%.', effects: [{ mod: 'pickup', pct: 4 }] });
Object.assign(by.li_hearts, { name: 'Kinder Hearts', desc: 'Hearts drop +3% and come 5 s sooner when you have not seen one.', effects: [{ drop: 'heart', pct: 3 }, { drop: 'heartPity', secs: -5 }] });
Object.assign(by.li_magnet, { name: 'Lodestar', desc: 'Per rank: Soul Magnets +12.5% and 3 s sooner when you have not seen one.', maxRank: 2, rankCost: 1.4, cost: { gold: 750 }, effects: [{ drop: 'magnet', pct: 12.5 }, { drop: 'magnetPity', secs: -3 }] });

// ---- positions (local offsets from the far-slot centre): one ring each, Almanac gets a centre lantern
const satchel = ['li_reach', 'co_pull', 'li_scav', 'co_call', 'li_hearts', 'li_heal', 'li_magnet', 'co_glean'];
const cardfan = ['sp_reroll2', 'sp_reroll3', 'sp_ban2', 'sp_ban3', 'cd_stir', 'cd_peek', 'cd_bars', 'cd_radar', 'cd_favour', 'cd_fourth'];
const hearthkey = ['sp_auto', 'rs_autoset', 'rs_start', 'rs_bless', 'li_last', 'rs_slot5'];
const nightgate = ['gt_cursed_forest_hard', 'gt_cursed_forest_expert', 'df_ward', 'df_vigil', 'df_star'];
const types = [['wolf', 'Fell Wolf', [1000, 4000, 12000]], ['crow', 'Grave Crow', [1000, 4000, 12000]], ['root_crawler', 'Root Crawler', [250, 1000, 3000]], ['elder_treant', 'Elder Treant', [1, 5, 15]]];
const almanacRing = []; for (const [id] of types) for (const k of [1, 2, 3]) almanacRing.push(`bs_${id === 'root_crawler' ? 'crawl' : id === 'elder_treant' ? 'treant' : id}${k}`);
const posOf = {};
const lay = (ids, r, start) => ids.forEach((id, i) => { posOf[id] = ringAt(ids.length, r, i, start); });
lay(satchel, 90); lay(cardfan, 110); lay(hearthkey, 80); lay(nightgate, 85); lay(almanacRing, 130); posOf.bs_page = [0, 0];
satchel.forEach((id, i) => { if (by[id]) by[id].place = { tool: 'satchel', at: posOf[id] }; });
cardfan.forEach((id) => { if (by[id]) by[id].place = { tool: 'cardfan', at: posOf[id] }; });
hearthkey.forEach((id) => { if (by[id]) by[id].place = { tool: 'hearthkey', at: posOf[id] }; });
w(join(dir, 'core.json'), core);

// ---- helpers for new specs
let idxOf = {};
const mk = (tool, id, kind, name, desc, effects, cost, rest = {}) => { const i = (idxOf[tool] = (idxOf[tool] ?? -1) + 1); return { id, idx: i, kind, name, desc, cost, effects, ...rest, place: { at: posOf[id] } }; };
const clean = (o) => JSON.parse(JSON.stringify(o));

// ---- Satchel (live: the simple hooks are built in the sim)
idxOf = {};
w(join(dir, 'tools', 'satchel.json'), clean({
  kind: 'tool', tool: 'satchel', prefix: 'co', slot: 'far4', name: 'The Satchel', blurb: 'Gems, pickups and fortune: small, cheap steps that make every run feel kinder.',
  nodes: [
    mk('satchel', 'co_pull', 'ring', 'Eager Gems', 'Gems fly to you 15% faster per rank.', [{ perk: 'gemPull', pct: 15 }], { gold: 260 }, { branch: 'light', maxRank: 3, rankCost: 1.6, requires: [] }),
    mk('satchel', 'co_call', 'ring', 'Lantern Call', 'On level-up, gems within twice your pickup range fly to you.', [{ perk: 'gemCall' }], { gold: 1100 }, { branch: 'light', requires: ['co_pull'], unlock: { t: 'bestLevel', n: 35 } }),
    mk('satchel', 'co_glean', 'ring', 'Gleaner', 'Experience +2%.', [{ mod: 'xp', pct: 2 }], { gold: 1400, shards: 1 }, { branch: 'light', requires: ['li_scav'], unlock: { t: 'gems', n: 60000 } }),
  ],
}));

// ---- Card Fan (the moved reroll/banish lanterns are live; the new information / choice perks are INERT until their sim / UI chunks)
idxOf = {};
w(join(dir, 'tools', 'cardfan.json'), clean({
  kind: 'tool', tool: 'cardfan', prefix: 'cd', slot: 'far10', name: 'The Card Fan', blurb: 'Cards and information: see more, choose better, never learn a recipe early.',
  nodes: [
    mk('cardfan', 'cd_stir', 'ring', 'Louder Stirring', '"Something stirs" also lights when the partner stat is at rank 2. It never names an evolution.', [{ info: 'stir' }], { gold: 600 }, { branch: 'spirit', inert: true, unlock: { t: 'evolveWeapon', id: 'any', n: 3 } }),
    mk('cardfan', 'cd_peek', 'ring', 'Second Sight', 'See the next level-up offer, dimmed, under the current one. It can still change if a pick removes a card.', [{ info: 'peek', pe: 0.05 }], { gold: 900 }, { branch: 'spirit', inert: true, requires: ['sp_reroll2'], unlock: { t: 'bestLevel', n: 30 } }),
    mk('cardfan', 'cd_bars', 'ring', "Hunter's Eye", 'Thin health bars and the mark name on Hollow-marked foes. Boss and miniboss bars stay free.', [{ info: 'bars' }], { gold: 500 }, { branch: 'spirit', inert: true, unlock: { t: 'killMarked', n: 20 } }),
    mk('cardfan', 'cd_radar', 'ring', 'Lantern Compass', 'Edge arrows also point to chests and to the next miniboss 20 s before it arrives.', [{ info: 'compass' }], { gold: 700 }, { branch: 'spirit', inert: true, unlock: { t: 'openChest', n: 5 } }),
    mk('cardfan', 'cd_favour', 'ring', 'Favoured Spirit', 'At run start mark one weapon: its stat cards weigh x1.5. Recipes stay hidden.', [{ perk: 'favour', pe: 0.2 }], { gold: 1200 }, { branch: 'spirit', inert: true, requires: ['cd_stir'], unlock: { t: 'evolveWeapon', id: 'any', n: 8 } }),
    mk('cardfan', 'cd_fourth', 'ring', 'Fourth Card', 'Level-ups offer four cards. Works on Deep Dusk and Long Night only.', [{ perk: 'offerSize', n: 1, pe: 1 }], { gold: 2000, glass: 8 }, { branch: 'spirit', inert: true, requires: ['cd_peek'], scope: { minChapter: 1, minTier: 1 }, unlock: { t: 'clearTier', chapter: 'cursed_forest', tier: 'hard' } }),
  ],
}));

// ---- Almanac (all INERT: lore damage + Tells need the sim / UI chunks)
idxOf = {};
const alm = [];
for (const [id, nm, [a, b, c]] of types) {
  const pre = id === 'root_crawler' ? 'crawl' : id === 'elder_treant' ? 'treant' : id;
  const boss = !!enemies[id].boss;
  const cond = (n) => (boss ? { t: 'bossKill', id, n } : { t: 'killEnemy', id, n });
  const cost = boss ? [300, 700, 500] : (id === 'root_crawler' ? [200, 500, 400] : [200, 500, 400]);
  alm.push(mk('almanac', `bs_${pre}1`, 'ring', `${nm}: Habits`, `+1% damage against ${nm}.`, [{ lore: id, pct: 1 }], { gold: cost[0] }, { branch: 'spirit', inert: true, unlock: cond(a) }));
  alm.push(mk('almanac', `bs_${pre}2`, 'ring', `${nm}: Weakness`, `+1% more damage against ${nm} (2% per type at most).`, [{ lore: id, pct: 1 }], { gold: cost[1] }, { branch: 'spirit', inert: true, requires: [`bs_${pre}1`], unlock: cond(b) }));
  alm.push(mk('almanac', `bs_${pre}3`, 'ring', `${nm}: Tells`, `Its attack tell shows 0.1 s earlier.`, [{ info: 'tells', enemy: id }], { gold: cost[2] }, { branch: 'spirit', inert: true, requires: [`bs_${pre}2`], unlock: cond(c) }));
}
alm.push(mk('almanac', 'bs_page', 'ring', 'Full Almanac', 'The codex pages light up and chests show one more Blessing to choose from. No power beyond the Blessing caps.', [{ info: 'codex', pe: 0.05 }, { perk: 'blessChoice', pe: 0 }], { gold: 2000, shards: 2 }, {
  branch: 'spirit', inert: true, requires: ['bs_wolf1', 'bs_crow1', 'bs_crawl1', 'bs_treant1'],
  unlock: { t: 'all', of: [{ t: 'killEnemy', id: 'wolf', n: 1000 }, { t: 'killEnemy', id: 'crow', n: 1000 }, { t: 'killEnemy', id: 'root_crawler', n: 250 }, { t: 'bossKill', id: 'elder_treant', n: 1 }] },
}));
w(join(dir, 'tools', 'almanac.json'), clean({ kind: 'tool', tool: 'almanac', prefix: 'bs', slot: 'far6', name: 'The Almanac', blurb: 'What you have learned of the Hollow: Habits, Weakness and Tells for every foe you have faced.', nodes: alm }));

// ---- Hearth-key (moved Steady Hand + Last Light live; the rest INERT)
idxOf = {};
w(join(dir, 'tools', 'hearthkey.json'), clean({
  kind: 'tool', tool: 'hearthkey', prefix: 'rs', slot: 'far2', name: 'The Hearth-key', blurb: 'How a run begins and how it is kept safe.',
  nodes: [
    mk('hearthkey', 'rs_autoset', 'ring', 'Chosen Moment', 'Pick the auto-fire rule in Settings: below 30% health, below 50%, when 25+ foes are near, or off.', [{ perk: 'autoRule' }], { gold: 900 }, { branch: 'spirit', inert: true, requires: ['sp_auto'], unlock: { t: 'abilityUses', n: 100 } }),
    mk('hearthkey', 'rs_start', 'ring', 'Kindred Start', 'At 0:00 choose your second spirit from three of your unlocked weapons (a free weapon card).', [{ perk: 'startWeapon', pe: 0.2 }], { gold: 1500 }, { branch: 'spirit', inert: true, unlock: { t: 'any', of: [{ t: 'killEnemy', id: 'crow', n: 4500 }, { t: 'killEnemy', id: 'root_crawler', n: 1500 }, { t: 'bossKill', id: 'elder_treant', n: 2 }] } }),
    mk('hearthkey', 'rs_bless', 'ring', 'Lantern Blessing', 'Start with one Blessing rank (choose one of three). It counts toward the Blessing caps.', [{ perk: 'startBlessing', pe: 0.3 }], { gold: 1800, shards: 2 }, { branch: 'spirit', inert: true, requires: ['rs_start'], unlock: { t: 'blessings', n: 15 } }),
    mk('hearthkey', 'rs_slot5', 'ring', 'Fifth Hook', 'A fifth weapon slot. Works on Deep Dusk and Long Night only.', [{ perk: 'weaponSlot', n: 1, pe: 1.5 }], { gold: 3000, shards: 3, glass: 12 }, {
      branch: 'spirit', inert: true, requires: ['rs_bless'], scope: { minChapter: 1, minTier: 1 },
      unlock: { t: 'all', of: [{ t: 'clearTier', chapter: 'cursed_forest', tier: 'hard', hero: 'wren' }, { t: 'clearTier', chapter: 'cursed_forest', tier: 'hard', hero: 'elias' }] },
    }),
  ],
}));

// ---- Night Gate (all INERT: no map-select UI and no Dawnglass income until DT3 / DT7)
idxOf = {};
w(join(dir, 'tools', 'nightgate.json'), clean({
  kind: 'tool', tool: 'nightgate', prefix: 'df', slot: 'far8', name: 'The Night Gate', blurb: 'Deeper nights and the lanterns only they can light.',
  nodes: [
    mk('nightgate', 'gt_cursed_forest_hard', 'gate', 'Deep Dusk: Cursed Forest', 'Opens the Deep Dusk night of the Cursed Forest. Kept when you reset the web.', [{ unlock: 'tier', chapter: 'cursed_forest', tier: 'hard' }], { gold: 1200, shards: 2 }, { branch: 'spirit', inert: true, unlock: { t: 'clearChapter', id: 'cursed_forest' } }),
    mk('nightgate', 'gt_cursed_forest_expert', 'gate', 'Long Night: Cursed Forest', 'Opens the Long Night of the Cursed Forest. Kept when you reset the web.', [{ unlock: 'tier', chapter: 'cursed_forest', tier: 'expert' }], { gold: 2500, shards: 4, glass: 10 }, { branch: 'spirit', inert: true, requires: ['gt_cursed_forest_hard'], unlock: { t: 'clearTier', chapter: 'cursed_forest', tier: 'hard' } }),
    mk('nightgate', 'df_ward', 'key', 'Dawnward', 'Long Night only: hearts heal +10%, all damage -1%. The other side of this pair is closed.', [{ drop: 'heartHeal', pct: 10, pe: 0.4 }, { mod: 'damage', pct: -1 }], { gold: 1800, glass: 10 }, { branch: 'spirit', inert: true, keystone: true, requires: ['gt_cursed_forest_expert'], excludes: ['df_vigil'], scope: { minChapter: 1, minTier: 2 }, unlock: { t: 'clearTier', chapter: 'cursed_forest', tier: 'expert' } }),
    mk('nightgate', 'df_vigil', 'key', 'Night Vigil', 'Long Night only: all damage +2%, max health -3%. The other side of this pair is closed.', [{ mod: 'damage', pct: 2, pe: 0.6 }, { player: 'maxHp', pct: -3 }], { gold: 1800, glass: 10 }, { branch: 'spirit', inert: true, keystone: true, requires: ['gt_cursed_forest_expert'], excludes: ['df_ward'], scope: { minChapter: 1, minTier: 2 }, unlock: { t: 'clearTier', chapter: 'cursed_forest', tier: 'expert' } }),
    mk('nightgate', 'df_star', 'ring', 'Three Dawns', 'Your lantern burns with a dawn rim on the map and the results screen. No power.', [{ visual: 'threeDawns' }], { gold: 1000, glass: 6 }, { branch: 'spirit', inert: true, requires: ['gt_cursed_forest_hard'], unlock: { t: 'stars', chapter: 'cursed_forest', n: 9 } }),
  ],
}));
console.log('tool fragments written');
