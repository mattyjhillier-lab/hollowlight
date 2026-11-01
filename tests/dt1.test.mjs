// DT1 Night Gate live: the two tier gates open Deep Dusk / Long Night in the tree (conditions, costs, connected rule, permanence), the map
// screen appears once there is a choice, a Deep Dusk run uses the tier's enemy HP, and hostile saves cannot forge a night open or mint glass.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { nodeStatus, buy, respec, aggregateMods, sanitizeTree } from '../src/meta/tree.js';
import { defaultSave, sanitize } from '../src/save/schema.js';
import { hasNightChoice, pickRunTier } from '../src/ui/nightcopy.js';
import { resolveTier } from '../src/sim/tiers.js';
import { newlyLine } from '../src/meta/gatewords.js';
import { Sim } from '../src/sim/Sim.js';
import { buildPool } from '../src/sim/cards.js';

const HARD = 'gt_cursed_forest_hard', EXPERT = 'gt_cursed_forest_expert', CID = 'cursed_forest';
const open = (s) => aggregateMods(s.tree, def, data).unlocks.tiers;

test('DT1 both tier gates are live, permanent, hub challenges with their locked conditions and prices', () => {
  for (const id of [HARD, EXPERT]) { assert.ok(def.nodes[id], id); assert.equal(def.nodes[id].permanent, true, id); assert.equal(def.nodes[id].maxRank, 1); }
  assert.deepEqual([def.nodes[HARD].cost.gold, def.nodes[HARD].cost.shards, def.nodes[HARD].cost.glass || 0], [1200, 2, 0]);
  assert.deepEqual([def.nodes[EXPERT].cost.gold, def.nodes[EXPERT].cost.shards, def.nodes[EXPERT].cost.glass], [2500, 4, 10]);
  assert.deepEqual(def.nodes[HARD].unlock, { t: 'clearChapter', id: CID });
  assert.deepEqual(def.nodes[EXPERT].unlock, { t: 'clearTier', chapter: CID, tier: 'hard' });
  assert.deepEqual(def.nodes[EXPERT].requires, [HARD]);
  assert.equal(newlyLine(def, HARD, data), 'NEW: Deep Dusk: Cursed Forest is ready to unlock in the Skill Tree (1200 gold + 2 shards).');
  assert.equal(newlyLine(def, EXPERT, data), 'NEW: Long Night: Cursed Forest is ready to unlock in the Skill Tree (2500 gold + 4 shards + 10 Dawnglass).');
  for (const id of ['df_ward', 'df_vigil', 'df_star']) assert.equal(def.nodes[id], undefined, `${id} still pending (no sim / cosmetic hook)`);
});

test('DT1 end to end: Twilight clear -> buy Deep Dusk -> the night choice appears -> Deep Dusk clear + glass -> buy Long Night; gates survive respec', () => {
  const s = defaultSave();
  assert.equal(nodeStatus(def, s, HARD, data).state, 'condition', 'needs one Twilight clear');
  assert.equal(hasNightChoice(s, data, def, open(s)), false, 'no choice yet: hero select starts Twilight');
  s.stats.chapters[CID] = { runs: 1, clears: 1, bestTime: 900 };
  assert.equal(hasNightChoice(s, data, def, open(s)), true, 'gate ready -> the map screen exists (skip rule)');
  s.gold = 1199; s.shards = 2;
  assert.equal(buy(s, HARD, def, data).ok, false, 'one gold short');
  s.gold = 1200;
  assert.equal(buy(s, HARD, def, data).ok, true);
  assert.deepEqual([s.gold, s.shards], [0, 0]);
  assert.deepEqual(open(s), [`${CID}:hard`]);
  assert.equal(pickRunTier('hard', open(s), CID), 'hard');
  assert.equal(pickRunTier('expert', open(s), CID), 'normal', 'Long Night still closed');
  assert.equal(nodeStatus(def, s, EXPERT, data).state, 'condition');
  s.stats.tiers = { [CID]: { hard: { runs: 1, clears: 1, best: { t: 900, kills: 1, level: 1 }, stars: 1, heroes: {} } } };
  s.gold = 2500; s.shards = 4; s.dawnglass = 9;
  assert.equal(buy(s, EXPERT, def, data).ok, false, 'needs 10 Dawnglass');
  s.dawnglass = 10;
  assert.equal(buy(s, EXPERT, def, data).ok, true);
  assert.equal(s.dawnglass, 0);
  assert.deepEqual(open(s).sort(), [`${CID}:expert`, `${CID}:hard`]);
  respec(s, def);
  assert.deepEqual(open(s).sort(), [`${CID}:expert`, `${CID}:hard`], 'gates are kept on respec');
});

test('DT1 a Deep Dusk run uses the tier knobs (enemy HP 1.1, damage 1.15, boss HP 1.5); Twilight stays identity', () => {
  const t = resolveTier(data.tiers, CID, 'hard');
  assert.deepEqual([t.enemyHp, t.enemyDmg, t.bossHp], [1.1, 1.15, 1.5]);
  const a = new Sim({ data, characterId: 'wren', chapterId: CID, seed: 3, tier: 'hard' });
  const b = new Sim({ data, characterId: 'wren', chapterId: CID, seed: 3 });
  assert.equal(a.tier.id, 'hard'); assert.equal(a.tier.enemyHp, 1.1);
  assert.equal(b.tier.id, 'normal'); assert.equal(b.tier.enemyHp, 1);
});

test('DT1 hostile saves: forged gates / glass / tier records are clamped or dropped', () => {
  // Long Night owned without its Deep Dusk gate ancestor: dropped (refunded), Deep Dusk alone kept (owned gates are kept, M1)
  const t1 = sanitizeTree({ [EXPERT]: 1 }, defaultSave().stats, def, data);
  assert.equal(t1[EXPERT], undefined, 'gate ancestor missing');
  const t2 = sanitizeTree({ [HARD]: 7, [EXPERT]: '1' }, defaultSave().stats, def, data);
  assert.equal(t2[HARD], 1, 'rank clamped to 1');
  for (const g of [-1, 1e15, 'lots', NaN, null, {}, [5]]) {
    const s = sanitize({ version: 3, dawnglass: g });
    assert.ok(Number.isInteger(s.dawnglass) && s.dawnglass >= 0 && s.dawnglass <= 1e9, String(g));
  }
  const s = sanitize({ version: 3, stats: { tiers: { [CID]: { hard: { runs: 1, clears: 99, stars: 99, heroes: { wren: { clears: 5, first: 'yes' }, ghost: { first: true } } }, nightmare: { runs: 3 } }, __proto__: {} } } });
  const h = s.stats.tiers[CID].hard;
  assert.deepEqual([h.clears, h.stars, h.heroes.wren.clears, h.heroes.wren.first, h.heroes.ghost], [1, 7, 1, false, undefined]);
  assert.equal(s.stats.tiers[CID].nightmare, undefined);
});

// ---- slice 2: Fourth Card + Fifth Hook live (Dawnglass sinks; tier-bought power, Deep Dusk / Long Night only)
const owned = (ids) => Object.fromEntries(ids.map((i) => [i, 1]));
test('DT1b Fourth Card + Fifth Hook are live with their locked prices, conditions and links', () => {
  assert.deepEqual([def.nodes.cd_fourth.cost.gold, def.nodes.cd_fourth.cost.glass], [2000, 8]);
  assert.deepEqual([def.nodes.rs_slot5.cost.gold, def.nodes.rs_slot5.cost.shards, def.nodes.rs_slot5.cost.glass], [3000, 3, 12]);
  const s = defaultSave();
  s.tree = owned(['br_cardfan', 'cd_peek', 'br_hearthkey', 'rs_bless']);
  s.gold = 1e6; s.shards = 100; s.dawnglass = 7;
  assert.equal(nodeStatus(def, s, 'cd_fourth', data).state, 'condition', 'needs a Deep Dusk clear');
  s.stats.tiers = { [CID]: { hard: { runs: 1, clears: 1, best: { t: 900, kills: 1, level: 1 }, stars: 1, heroes: { wren: { clears: 1, first: true } } } } };
  assert.equal(buy(s, 'cd_fourth', def, data).ok, false, '8 Dawnglass needed');
  s.dawnglass = 20;
  assert.equal(buy(s, 'cd_fourth', def, data).ok, true); assert.equal(s.dawnglass, 12);
  assert.equal(nodeStatus(def, s, 'rs_slot5', data).state, 'condition', 'needs Deep Dusk cleared with Elias too');
  s.stats.tiers[CID].hard.heroes.elias = { clears: 1, first: true }; s.stats.tiers[CID].hard.clears = 2; s.stats.tiers[CID].hard.runs = 2;
  assert.equal(buy(s, 'rs_slot5', def, data).ok, true); assert.equal(s.dawnglass, 0);
});

test('DT1b the sim gets 4 cards / 5 slots on Deep Dusk and Long Night only; Twilight keeps 3 / 4; the 5th weapon card is offered', () => {
  const t = owned(['cd_fourth', 'rs_slot5']);
  const mk = (tier) => new Sim({ data, characterId: 'wren', chapterId: CID, seed: 5, tier, tree: aggregateMods(t, def, data, { tier: ['normal', 'hard', 'expert'].indexOf(tier) }) });
  const [tw, dd, ln] = [mk('normal'), mk('hard'), mk('expert')];
  assert.deepEqual([tw.offerSize, tw.weaponSlots], [data.balance.offerSize, data.balance.weaponSlots]);
  assert.deepEqual([dd.offerSize, dd.weaponSlots], [data.balance.offerSize + 1, data.balance.weaponSlots + 1]);
  assert.deepEqual([ln.offerSize, ln.weaponSlots], [data.balance.offerSize + 1, data.balance.weaponSlots + 1]);
  // four weapons held: Twilight offers no new weapon card, Deep Dusk (5 hooks) still does
  const four = Object.keys(data.weapons).slice(0, 4).map((id) => ({ id, evo: null, ranks: Object.fromEntries(Object.keys(data.weapons[id].stats).map((k) => [k, 0])) }));
  const spare = Object.keys(data.weapons)[4];
  const ctx = (sim) => ({ ...sim.cardCtx, weapons: four, unlockedWeapons: new Set(Object.keys(data.weapons)) });
  assert.equal(buildPool(ctx(tw)).some((p) => p.card.kind === 'weapon'), false);
  assert.ok(buildPool(ctx(dd)).some((p) => p.card.kind === 'weapon' && p.card.weaponId === spare));
});
