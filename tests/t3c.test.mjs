// T3c: connected-unlock rule (links open from either side, four exceptions), the data patch (bridges, next ranks beside their parent,
// 'needs all' -> 'any one'), rising price (+8% per purchase in a group, refunds exact), the tier gold bonus and the eased Deep Dusk.
// LOCKED 2026-10-21 rows 'Tree look + connected-unlock rule' and 'Tree economy + Deep Dusk'. Save / import input is hostile.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { compileTree, nodeStatus, canBuy, buy, respec, spentOf, sanitizeTree, sanitizeCreep, creepCount, isLinked, costFor } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { connectIssues, layoutIssues } from '../src/meta/treelayout.js';
import { defaultSave, parseSave, sanitize, serializeSave } from '../src/save/schema.js';
import { recordTierRun } from '../src/save/tiers.js';
import { SaveStore } from '../src/save/store.js';
import { resolveTier } from '../src/sim/tiers.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const composed = composeTree(readTreeFiles(), data);
const v2 = compileTree(composed.v2, data);
const rich = (tree = {}) => ({ ...defaultSave(), gold: 1e6, shards: 99, tree: { ...tree }, stats: { ...defaultSave().stats, killsByEnemy: { wolf: 1e6, crow: 1e6, root_crawler: 1e6 }, chapters: { cursed_forest: { runs: 99, clears: 99, bestTime: 900 } }, runs: 99 } });
const st = (s, id) => nodeStatus(def, s, id, data);
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

// ------------------------------------------------------------------ data patch
test('T3c patch: every live lantern links to something lit, no far links, every group has a gold-only way in; the inert groups are pending only', () => {
  assert.deepEqual(connectIssues(composed.info, def), []);
  const inert = new Set(composed.info.nodes.filter((n) => n.inert).map((n) => n.id));
  const pend = connectIssues(composed.info, v2);
  assert.equal(pend.length, 6, pend.join('\n'));
  for (const i of pend) assert.ok((i.match(/\b[a-z]{2}_[a-z0-9_]+/g) || []).every((x) => inert.has(x) || !composed.info.nodes.some((n) => n.id === x)), i);
  assert.deepEqual(layoutIssues(composed.info, v2), []);
  // the four bridges: 250 gold, gem pull +5% (utility only), Dusk ring, only br_satchel is live (the other three wait with their groups)
  for (const b of ['br_satchel', 'br_almanac', 'br_cardfan', 'br_hearthkey']) { const n = v2.nodes[b]; assert.equal(n.cost.gold, 250); assert.deepEqual(n.effects, [{ perk: 'gemPull', pct: 5 }]); assert.ok(!n.unlock && n.requiresAny.length === 2); }
  assert.ok(def.nodes.br_satchel && !def.nodes.br_almanac && def.pending.br_almanac);
  assert.deepEqual(['li_reach', 'co_pull'].map((i) => def.nodes[i].requires), [['br_satchel'], ['br_satchel']]);
  assert.deepEqual([def.nodes.sp_cd1.requires, def.nodes.sp_cd1.requiresAny], [[], ['sp_reroll1', 'sp_ban1']], 'needs-all join is now any-one');
  assert.deepEqual(v2.nodes.bs_page.requiresAny, ['bs_wolf1', 'bs_crow1', 'bs_crawl1', 'bs_treant1']);
  // next ranks sit beside their parent (<= 350)
  for (const id of ['su_pot', 'sp_reroll2', 'sp_reroll3', 'sp_ban2', 'sp_ban3', 'sp_auto', 'li_hearts', 'li_heal', 'li_magnet', 'su_rush', 'ma_cast', 'ma_area', 'ma_attune', 'ma_pow3', 'sp_edge', 'su_key', 'ma_key', 'li_lantern', 'li_glass', 'li_last', 'li_elder', 'sp_mastery', 'ma_ascend', 'li_dawn']) {
    const n = v2.nodes[id];
    for (const p of [...n.requires, ...(n.requiresAny || [])]) assert.ok(Math.hypot(n.x - v2.nodes[p].x, n.y - v2.nodes[p].y) <= 350, `${id} beside ${p}`);
  }
});

test('T3c validator refuses a far hub root, a far link, a group whose only ways in are challenges and a bridge into challenges', () => {
  const fs = clone(readTreeFiles());
  const core = fs.find((f) => f.path === 'core.json').json;
  core.nodes.find((n) => n.id === 'li_reach').requires = [];
  let c = composeTree(fs, data);
  assert.match(connectIssues(c.info, compileTree(c.live, data)).join('|'), /li_reach hangs from the hub/);
  const fs2 = clone(readTreeFiles());
  const sat = fs2.find((f) => f.path === 'tools/satchel.json').json;
  sat.nodes.find((n) => n.id === 'co_pull').unlock = { t: 'runs', n: 3 };
  fs2.find((f) => f.path === 'core.json').json.nodes.find((n) => n.id === 'li_reach').unlock = { t: 'runs', n: 3 };
  c = composeTree(fs2, data);
  const iss = connectIssues(c.info, compileTree(c.live, data)).join('|');
  assert.match(iss, /group satchel: every way in is a challenge/);
  assert.match(iss, /bridge br_satchel leads only to challenges/);
  const fs3 = clone(readTreeFiles());
  fs3.find((f) => f.path === 'core.json').json.nodes.find((n) => n.id === 'li_dawn').place = { ring: 'dusk', i: 0 };
  c = composeTree(fs3, data);
  assert.match(connectIssues(c.info, compileTree(c.v2, data)).join('|'), /li_vow -> li_dawn is a far link/);
});

test('T3c place {near, at}: a lantern sits at its parent + offset (chains resolve), and bad references fail', () => {
  const p = composed.info.positions;
  assert.deepEqual(p.li_elder, [Math.round((p.li_last[0] + 74) * 10) / 10, Math.round((p.li_last[1] + 51) * 10) / 10]);
  const bad = (fn, re) => { const fs = clone(readTreeFiles()); fn(fs.find((f) => f.path === 'core.json').json); assert.throws(() => composeTree(fs, data), re); };
  bad((c) => { c.nodes.find((n) => n.id === 'li_elder').place = { near: 'nope_zz', at: [10, 10] }; }, /place\.near/);
  bad((c) => { c.nodes.find((n) => n.id === 'li_elder').place = { near: 'li_elder', at: [10, 10] }; }, /place\.near/);
  bad((c) => { c.nodes.find((n) => n.id === 'li_elder').place = { near: 'li_last', at: [900, 0] }; }, /place\.at/);
  bad((c) => { c.nodes.find((n) => n.id === 'li_elder').place = { near: 'li_last', at: [10, 10], x: 1 }; }, /place\.near/);
  bad((c) => { c.nodes.find((n) => n.id === 'li_last').place = { near: 'li_elder', at: [10, 10] }; }, /cannot be resolved/);
});

// ------------------------------------------------------------------ the rule
test('T3c connected rule: a fresh save can light only the Hearth/Wick lanterns that touch the hub and the hub challenges; far groups wait for their bridge', () => {
  const s = rich();
  assert.equal(st(s, 'su_bond').state, 'available');
  assert.equal(st(s, 'li_reach').state, 'locked', 'Satchel root waits for its bridge');
  assert.equal(st(s, 'co_pull').state, 'locked');
  assert.equal(st(s, 'br_satchel').state, 'locked');
  assert.match(st(s, 'br_satchel').reason, /one of/);
  assert.equal(st(s, 'gt_raven_flock').state, 'available', 'E1: a weapon heart is a hub challenge');
  for (const id of def.list) {
    const n = def.nodes[id];
    if (n.teaser || n.requires.length || n.requiresAny) continue;
    assert.ok(n.permanent || n.cluster || Math.hypot(n.x, n.y) <= 360, `${id} touches the hub`);
  }
  assert.ok(buy(s, 'su_bond', def, data).ok && buy(s, 'su_pot', def, data).ok && buy(s, 'br_satchel', def, data).ok);
  assert.equal(st(s, 'li_reach').state, 'available');
  assert.equal(st(s, 'co_pull').state, 'available');
});

test('T3c links open from EITHER side: an owned child opens its parent; any one owned neighbour is enough', () => {
  const s = rich({ sp_cd3: 1 }); // e.g. kept by the sanitiser after a data re-link
  assert.equal(st(s, 'sp_cd2').state, 'available', 'opened from its child');
  assert.equal(st(s, 'sp_cd1').state, 'locked', 'two steps away is not linked');
  assert.equal(st(rich({ sp_ban1: 1 }), 'sp_cd1').state, 'available', 'any one of its two joins');
  assert.equal(st(rich({ li_reach: 1 }), 'br_satchel').state, 'available', 'a bridge opens from the group side too');
  // synthetic chain hub -> a -> b(condition) -> c: owning c (e.g. reached around a loop) opens b's far side for gold lanterns behind it
  const B = { branches: { spirit: { name: 'S', angle: 90 } } };
  const nd = (id, extra = {}) => ({ id, name: id, desc: 'd', branch: 'spirit', ring: 1, ang: 0, cost: { gold: 10 }, effects: [{ mod: 'damage', pct: 1 }], ...extra });
  const t = compileTree({ ...B, nodes: [nd('a'), nd('b', { requires: ['a'], ang: 40 }), nd('c', { requires: ['b'], ang: 80 }), nd('d', { requires: ['c'], ang: 120 })] }, null);
  const ss = { gold: 1e6, shards: 0, tree: { d: 1 }, stats: {} };
  assert.equal(nodeStatus(t, ss, 'c', null).state, 'available');
  assert.equal(nodeStatus(t, ss, 'b', null).state, 'locked');
  assert.equal(t.creep, 0, 'a made-up tree without core.price has flat prices');
});

test('T3c exceptions: E1 hearts are hub challenges; E2 seals and every lantern of a gated constellation wait for the heart; E3 starter seals are lit; the gate stays on every route', () => {
  const s = rich();
  assert.equal(st(s, 'gt_dive_bombers').state, 'locked', 'E2: Raven seal sleeps until the Raven heart is lit');
  assert.match(st(s, 'gt_dive_bombers').reason, /Requires/);
  assert.notEqual(st(s, 'gt_phantom_stampede').state, 'locked', 'E3: a starter (Wolves) seal is linked from run 1');
  assert.equal(isLinked(def, {}, 'gt_phantom_stampede'), true);
  buy(s, 'gt_raven_flock', def, data);
  assert.notEqual(st(s, 'gt_dive_bombers').state, 'locked', 'E2: the seal opens once its spirit is woken (then only its own condition remains)');
  assert.equal(isLinked(def, s.tree, 'gt_dive_bombers'), true);
  // a forged neighbour cannot open a gated constellation without its heart
  const f = rich({ rv_quill: 1 });
  assert.equal(st(f, 'rv_talon').state, 'locked');
  assert.match(st(f, 'rv_talon').reason, /Raven/);
  assert.equal(canBuy(f, 'rv_talon', def, data).ok, false);
});

test('T3c sanitiser: links and conditions gate BUYING only (an owned lantern is kept), a missing weapon gate still drops it with a full refund', () => {
  const kept = sanitizeTree({ li_reach: 2, sp_cd3: 1, li_last: 1 }, {}, def, data);
  assert.deepEqual(kept, { li_reach: 2, sp_cd3: 1, li_last: 1 });
  const refund = { gold: 0, shards: 0 };
  assert.deepEqual(sanitizeTree({ rv_talon: 1 }, {}, def, data, refund), {});
  assert.equal(refund.gold, def.nodes.rv_talon.cost.gold);
  // gates keep requires [] and are never dropped
  assert.deepEqual(sanitizeTree({ gt_dive_bombers: 1 }, {}, def, data), { gt_dive_bombers: 1 });
});

// ------------------------------------------------------------------ rising price
test('T3c rising price: +8% per purchase on the rest of the group; the price shown is the price paid; other groups and gates stay flat', () => {
  assert.equal(def.creep, 0.08);
  const s = rich();
  s.gold = 100000;
  const g0 = s.gold;
  const before = st(s, 'su_pot').next.gold;
  assert.equal(before, 390, 'base');
  buy(s, 'su_bond', def, data);
  const shown = st(s, 'su_pot').next.gold;
  assert.equal(shown, Math.round((390 * 1.08) / 10) * 10, 'one step in the Summoner ring');
  const magic = st(s, 'ma_focus').next.gold;
  assert.equal(magic, def.nodes.ma_focus.cost.gold, 'the Magic ring is another group');
  const goldBefore = s.gold;
  const r = buy(s, 'su_pot', def, data);
  assert.equal(r.cost.gold, shown); assert.equal(goldBefore - s.gold, shown, 'paid what was shown');
  assert.deepEqual(s.creep, { su_pot: 1 });
  assert.equal(st(s, 'su_rush').next.gold, Math.round((def.nodes.su_rush.cost.gold * 1.08 * 1.08) / 10) * 10, 'two steps');
  assert.equal(st(s, 'gt_raven_flock').next.gold, def.nodes.gt_raven_flock.cost.gold, 'gates stay flat');
  // a multi-rank lantern keeps the step it was first bought at
  buy(s, 'su_rush', def, data);
  const s2 = rich(); s2.gold = 1e6;
  for (const id of ['li_vigor', 'li_study', 'li_coin']) assert.ok(buy(s2, id, def, data).ok, id);
  assert.ok(buy(s2, 'br_satchel', def, data).ok);
  const k = creepCount(def, s2.tree, 'li_reach');
  assert.ok(k >= 4);
  const r1 = buy(s2, 'li_reach', def, data);
  assert.equal(r1.cost.gold, costFor(def.nodes.li_reach, 1, k, 0.08).gold);
  buy(s2, 'li_vow', def, data); // another Light purchase meanwhile
  assert.equal(st(s2, 'li_reach').next.gold, costFor(def.nodes.li_reach, 2, k, 0.08).gold, 'rank 2 priced at its first-purchase step');
  assert.equal(s.gold <= g0, true);
});

test('T3c respec refunds EXACTLY what was paid (rising price included) and clears the price steps; a second respec pays nothing', () => {
  const s = rich(); s.gold = 50000;
  for (const id of ['su_bond', 'su_pot', 'su_rush', 'sp_reroll1', 'sp_reroll2', 'li_vigor', 'li_study', 'li_coin', 'br_satchel', 'li_reach', 'li_reach', 'gt_raven_flock']) assert.ok(buy(s, id, def, data).ok, id);
  const paid = 50000 - s.gold;
  const gate = def.nodes.gt_raven_flock.cost.gold;
  const out = respec(s, def);
  assert.equal(out.gold, paid - gate, 'everything but the permanent gate comes back, to the coin');
  assert.equal(s.gold, 50000 - gate);
  assert.deepEqual(s.tree, { gt_raven_flock: 1 });
  assert.deepEqual(s.creep, {});
  assert.equal(respec(s, def).gold, 0);
  // after the respec the group is fresh again: base prices
  assert.equal(st(s, 'su_pot').next.gold, 390);
});

test('T3c save: price steps survive save / load / export / import; hostile steps are dropped or clamped to what was legally possible', () => {
  const s = rich(); s.gold = 50000;
  for (const id of ['su_bond', 'su_pot', 'su_rush']) buy(s, id, def, data);
  const text = JSON.stringify(serializeSave(sanitize(s)));
  const back = parseSave(text);
  assert.ok(back.ok);
  assert.deepEqual(back.save.creep, { su_pot: 1, su_rush: 2 });
  const store = new SaveStore(mem());
  store.data = back.save; store.saveNow(true);
  const st2 = new SaveStore(store.storage); st2.load();
  assert.deepEqual(st2.data.creep, { su_pot: 1, su_rush: 2 });
  const imp = st2.checkImport(st2.exportText());
  assert.ok(imp.ok); assert.deepEqual(imp.save.creep, { su_pot: 1, su_rush: 2 });
  // hostile: prototype keys, unknown / unowned / gate ids, strings, NaN, huge and negative steps
  const evil = JSON.parse(`{"version":3,"gold":0,"tree":{"su_bond":1,"su_pot":1,"su_rush":1,"gt_raven_flock":1},"creep":{"__proto__":{"x":1},"constructor":5,"su_pot":1e99,"su_rush":-3,"su_key":4,"gt_raven_flock":9,"nope":2,"su_bond":"2"}}`);
  const c = sanitize(evil).creep;
  assert.equal(({}).x, undefined);
  assert.deepEqual(c, { su_pot: 2 }, 'su_pot clamped to the 2 other Summoner purchases owned; the rest dropped');
  assert.equal(Object.getPrototypeOf(c), Object.prototype);
  for (const bad of [null, [], 'x', 5, undefined, { su_pot: { a: 1 } }]) assert.deepEqual(sanitizeCreep(bad, { su_pot: 1, su_bond: 1 }, def), {});
  // a forged step can never refund more than the most that could have been paid
  const f = sanitize(evil);
  const max = spentOf(f.tree, def, { su_pot: 2, su_rush: 2, su_bond: 2 }).gold;
  assert.ok(respec(f, def).gold <= max);
  // an old save (no creep field) loads with base prices = what it paid
  assert.deepEqual(sanitize({ version: 3, tree: { su_bond: 1, su_pot: 1 } }).creep, {});
});

test('T3c a lantern dropped for a missing gate is refunded at what it cost, rising price included', () => {
  const refund = { gold: 0, shards: 0 };
  sanitizeTree({ gt_raven_flock: 0, rv_talon: 1, rv_quill: 1 }, {}, def, data, refund, { rv_quill: 1 });
  assert.equal(refund.gold, def.nodes.rv_talon.cost.gold + costFor(def.nodes.rv_quill, 1, 1, 0.08).gold);
});

// ------------------------------------------------------------------ tiers
test('T3c tier gold bonus is paid where the run is banked: Deep Dusk x1.5, Long Night x2.0, Twilight and an unopened tier x1', () => {
  const OPEN = ['cursed_forest:hard', 'cursed_forest:expert'];
  const run = (tier, gold = 1001) => ({ outcome: 'defeat', time: 400, level: 20, kills: 900, gold, chapter: 'cursed_forest', character: 'wren', tier });
  const s = sanitize({ version: 3, gold: 0 });
  assert.equal(recordTierRun(s, run('hard'), { data, unlockedTiers: OPEN }).goldBonus, 500);
  assert.equal(s.gold, 500); assert.equal(s.stats.totalGold, 500);
  assert.equal(recordTierRun(s, run('expert'), { data, unlockedTiers: OPEN }).goldBonus, 1001);
  assert.equal(recordTierRun(s, run('normal'), { data, unlockedTiers: OPEN }).goldBonus, 0);
  assert.equal(recordTierRun(s, run('expert'), { data, unlockedTiers: [] }).goldBonus, 0, 'a tier the save has not opened pays Twilight');
  assert.equal(recordTierRun(s, run('hard', 1e99), { data, unlockedTiers: OPEN }).goldBonus, 5e8, 'gold clamped');
  for (const g of [-5, NaN, 'x', null]) assert.equal(recordTierRun(sanitize({ version: 3 }), run('hard', g), { data, unlockedTiers: OPEN }).goldBonus, 0);
  // through bankRun: the results screen's run gold includes the bonus; the bank total matches
  const store = new SaveStore(mem());
  store.data = sanitize({ version: 3, gold: 100 });
  const b = store.bankRun(run('hard', 800), { def, data, unlockedTiers: OPEN });
  assert.equal(b.runGold, 1200); assert.equal(b.gold, 1300); assert.equal(store.data.stats.totalGold, 1200);
  const b2 = store.bankRun(run('normal', 800), { def, data, unlockedTiers: OPEN });
  assert.equal(b2.runGold, 800); assert.equal(b2.gold, 2100);
});

test('T3c Deep Dusk eased: enemy HP x1.2 (reopened from 1.45), other Deep Dusk multipliers unchanged, Long Night unchanged', () => {
  const h = resolveTier(data.tiers, 'cursed_forest', 'hard');
  assert.deepEqual([h.enemyHp, h.enemyDmg, h.density, h.bossHp, h.goldMul], [1.2, 1.15, 1.15, 1.5, 1.5]);
  const e = resolveTier(data.tiers, 'cursed_forest', 'expert');
  assert.deepEqual([e.enemyHp, e.enemyDmg, e.density, e.bossHp, e.goldMul], [2, 1.3, 1.3, 2, 2]);
});
