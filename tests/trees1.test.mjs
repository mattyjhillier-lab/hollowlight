// S1 (tree rework build, 2026-11-12): branch templates in the magic gardens, roads to every landmark, the atlas layout (orbit tiers,
// auto-slot, gaps, determinism, links), the starter set, hidden-recipe safety, the budget, and the v5 restart migration (golden v4 saves,
// exact refunds, idempotent, hostile input). LOCKED: TREE BRANCH STRUCTURE (+ AMENDMENT forks), MAGIC-ONLY, ALWAYS SOMETHING TO BUY UP TO,
// HEROES ON THE TREE, STARTER HANDLING, TREE RESTART SCOPE = REFUND EVERYTHING.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef as def } from './helpers.mjs';
import { compileTree, nodeStatus, buy, describeNode, pathToHub, spentOf } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { layoutIssues, connectIssues, gapIssues } from '../src/meta/treelayout.js';
import { budgetOf } from '../src/meta/treebudget.js';
import { grantStarter, starterNodes } from '../src/meta/starter.js';
import { buildTreeView, starterOf } from '../src/meta/treeview.js';
import { placeRegions, angDiff } from '../src/meta/treeatlas.js';
import { restartTree, STARTER_V5 } from '../src/meta/migrations/tree-v5.js';
import { PRICES_V4, STARTER_V4 } from '../src/meta/migrations/tree-v5.prices.js';
import { TREE_STEPS, runTreeSteps } from '../src/meta/migrations/index.js';
import { defaultSave, parseSave, serializeSave, sanitize } from '../src/save/schema.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const files = () => clone(readTreeFiles());
const get = (fs, p) => fs.find((f) => f.path === p).json;
const C = composeTree(readTreeFiles(), data);
const V2 = compileTree(C.v2, data);
const MAGIC = ['holy_orbit', 'spirit_bolts', 'chain_lightning'];
const rich = (tree = {}) => ({ ...defaultSave(), gold: 1e7, shards: 999, dawnglass: 999, tree: { ...tree }, stats: { ...defaultSave().stats, runs: 99, killsByEnemy: { wolf: 1e6, crow: 1e6, root_crawler: 1e6 }, bossKills: { elder_treant: 99 }, chapters: { cursed_forest: { runs: 99, clears: 99, bestTime: 900 } }, evolved: Object.fromEntries(Object.keys(data.evolutions).map((e) => [e, 9])), startWeapon: Object.fromEntries(Object.keys(data.weapons).map((w) => [w, 99])) } });
const st = (s, id) => nodeStatus(def, s, id, data);

// ---------------------------------------------------------------- branch templates
test('S1 every magic weapon is a garden: one branch per evolution = 3 dots -> lead-in diamond -> seal -> 2 forks of 2 dots -> diamond', () => {
  for (const w of MAGIC) {
    const c = C.info.clusters[w];
    assert.ok(c.garden, w);
    assert.equal(c.branchInfo.length, Object.keys(data.evolutions).filter((e) => data.evolutions[e].weapon === w).length, `${w}: one branch per evolution`);
    const ids = new Set([c.heart]);
    for (const b of c.branchInfo) {
      assert.equal(b.lead.length, 3); assert.equal(b.forks.length, 2);
      for (const f of b.forks) assert.equal(f.length, 3);
      for (const id of [...b.lead, b.diamond, b.seal, ...b.forks.flat()]) { assert.ok(!ids.has(id), `${id} used once`); ids.add(id); }
      // requires: heart -> lead -> lead -> lead -> diamond -> seal; forks hang only off the seal
      assert.deepEqual(def.nodes[b.lead[0]].requires, [c.heart]);
      assert.deepEqual(def.nodes[b.lead[1]].requires, [b.lead[0]]);
      assert.deepEqual(def.nodes[b.diamond].requires, [b.lead[2]]);
      assert.deepEqual(def.nodes[b.seal].requires, [b.diamond]);
      for (const f of b.forks) { assert.deepEqual(def.nodes[f[0]].requires, [b.seal]); assert.deepEqual(def.nodes[f[2]].requires, [f[1]]); assert.deepEqual(def.children[f[2]], [], 'a fork ends in a leaf'); }
      assert.deepEqual([...def.children[b.seal]].sort(), b.forks.map((f) => f[0]).sort(), 'nothing but its forks hangs off a seal');
    }
    assert.equal(ids.size, 34, `${w}: 34 nodes`);
  }
});

test('S1 the starter evolution without a gate gets a zero-power landmark seal (new id); hidden seals stay hidden', () => {
  const halo = def.nodes.or_halo;
  assert.equal(halo.kind, 'socket'); assert.deepEqual(halo.effects, [{ echo: 'sanctum_halo' }]); assert.equal(halo.permanent, false);
  const b = budgetOf(V2, C.info.core.budget, 5);
  assert.deepEqual(b.violations, []);
  for (const w of MAGIC) for (const br of C.info.clusters[w].branchInfo) if (def.nodes[br.seal].effects.some((e) => e.unlock === 'evolution')) assert.equal(def.nodes[br.seal].hidden, true, br.seal);
  // Wolves / Ravens keep their small outline clusters (companions-to-be): no branches
  for (const w of ['ghost_wolves', 'raven_flock']) { assert.equal(C.info.clusters[w].garden, false); assert.equal(C.info.clusters[w].outline.length, 11); }
});

test('S1 a seal lights only after its lead-in diamond; fork nodes stay masked until the seal is lit', () => {
  const s = rich({ gt_spirit_bolts: 1 });
  const b = C.info.clusters.spirit_bolts.branchInfo.find((x) => x.seal === 'gt_soul_lance');
  assert.equal(st(s, 'gt_soul_lance').state, 'locked', 'the lead-in diamond is not bought');
  for (const id of b.lead) assert.ok(buy(s, id, def, data).ok, id);
  assert.equal(st(s, 'gt_soul_lance').state, 'locked');
  { const r = buy(s, b.diamond, def, data); assert.ok(r.ok, r.reason); }
  assert.equal(st(s, 'gt_soul_lance').state, 'available');
  for (const f of b.forks) for (const id of f) { assert.equal(st(s, id).state, 'locked'); assert.equal(describeNode(def, s, id, data).masked, true, `${id} veiled before its seal`); }
  assert.ok(buy(s, 'gt_soul_lance', def, data).ok);
  for (const f of b.forks) { assert.equal(st(s, f[0]).state, 'available'); assert.equal(describeNode(def, s, f[0], data).masked, false); }
});

test('S1 hidden-recipe safety: no lead-in, seal or fork names its evolution\'s pair (both stat names together), and no lead-in names the evolution', () => {
  for (const w of MAGIC) for (const b of C.info.clusters[w].branchInfo) {
    const evo = data.evolutions[b.evo];
    const pair = evo.pair.map((k) => data.weapons[w].stats[k].name.toLowerCase());
    for (const id of [...b.lead, b.diamond, b.seal, ...b.forks.flat()]) {
      const n = def.nodes[id];
      const text = [n.name, n.desc, n.flavour].join(' ').toLowerCase();
      assert.ok(!pair.every((p) => text.includes(p)), `${id} names the recipe of ${b.evo}`);
      assert.ok(!/recipe|pair stat/.test(text), `${id} talks about recipes`);
    }
    for (const id of [...b.lead, b.diamond]) assert.ok(!def.nodes[id].name.toLowerCase().includes(evo.name.toLowerCase()), `${id} names ${evo.name}`);
  }
});

// ---------------------------------------------------------------- roads + connectivity
test('S1 every landmark is reached by a bought road; roads are generic (never a gated weapon), leave from the hub web or another road, and are never far links', () => {
  const ends = new Set(C.info.roads.map((r) => r.to));
  for (const w of Object.keys(C.info.clusters)) assert.ok(ends.has(C.info.clusters[w].heart), `${w} heart`);
  for (const id of ['br_satchel', 'br_almanac', 'br_cardfan', 'br_hearthkey', 'br_wardrobe', 'gt_cursed_forest_hard', 'gt_cursed_forest_expert']) assert.ok(ends.has(id), id);
  for (const r of C.info.roads) {
    assert.ok(r.ids.length >= 3, `${r.to}: at least 3 lanterns`);
    for (const id of r.ids) {
      const n = def.nodes[id];
      assert.equal(n.region, 'paths');
      assert.ok(!n.cluster, `${id} belongs to no constellation`);
      for (const e of n.effects) assert.ok(!(typeof e.weapon === 'string' && !e.weapon.startsWith('@')), `${id}: generic effects only`);
      assert.ok(!n.unlock, `${id}: a road is gold only`);
    }
  }
  assert.deepEqual(connectIssues(C.info, def), []);
  assert.deepEqual(connectIssues(C.info, V2), []);
  // every lantern reaches the hub through its requires (the forks only through their own seal)
  for (const id of def.list) if (!def.nodes[id].teaser) { const p = pathToHub(def, id).ids; assert.ok([...p].some((x) => !def.nodes[x].requires.length && !def.nodes[x].requiresAny), id); }
});

test('S1 connectIssues catches a fork that is not a leaf, a fork hanging off something else, and a link on a fork', () => {
  const info = clone(C.info);
  const d = { ...def, nodes: { ...def.nodes }, children: { ...def.children } };
  const b = C.info.clusters.holy_orbit.branchInfo[0];
  d.nodes[b.forks[0][1]] = { ...d.nodes[b.forks[0][1]], requires: [b.lead[0]] };
  d.children[b.forks[0][2]] = ['sp_reroll1'];
  info.links = [[b.forks[1][2], 'sp_reroll1']];
  const iss = connectIssues(info, d).join('|');
  assert.match(iss, new RegExp(`fork ${b.forks[0][1]} must require only ${b.forks[0][0]}`));
  assert.match(iss, new RegExp(`sp_reroll1 requires the fork lantern ${b.forks[0][2]}`));
  assert.match(iss, /touches a fork leaf/);
});

test('S1 render-only links: between different regions, never on a fork, at most 2 per lantern, never gating', () => {
  assert.ok(C.info.links.length >= 1);
  for (const [a, b] of C.info.links) {
    assert.notEqual(C.info.regionKey[a], C.info.regionKey[b]);
    assert.ok(!def.nodes[a].requires.includes(b) && !def.nodes[b].requires.includes(a));
  }
  const s = rich({ [C.info.links[0][0]]: 1 });
  assert.equal(st(s, C.info.links[0][1]).state === 'available' && !def.nodes[C.info.links[0][1]].requires.includes(C.info.links[0][0]) && !(def.children[C.info.links[0][0]] || []).includes(C.info.links[0][1]), false, 'a link never opens a lantern by itself');
});

// ---------------------------------------------------------------- atlas
test('S1 layout: deterministic, gaps clean (landmark 120 / diamond 30 / dot 18, mixed = mean), regions never overlap, every node on a ring tier', () => {
  const again = composeTree(readTreeFiles(), data);
  assert.deepEqual(again.info.positions, C.info.positions);
  assert.deepEqual(again.info.links, C.info.links);
  assert.deepEqual(gapIssues(C.info), []);
  assert.deepEqual(layoutIssues(C.info, V2), []);
  const v = buildTreeView(C.info, def, data);
  const names = v.ringTiers.map((t) => t.name);
  assert.deepEqual(names, C.info.core.atlas.tiers.map((t) => t.name));
  for (const id of def.list) assert.ok(v.ringOf[id] >= 0 && v.ringOf[id] < names.length, id);
  // weapons are scattered (different distances AND angles), heroes are display-only medallions
  const orbit = (w) => C.info.regions.find((r) => r.id === `c:${w}`).orbit;
  assert.ok(orbit('chain_lightning').tier > orbit('holy_orbit').tier);
  const hero = C.info.regions.filter((r) => r.kind === 'hero');
  assert.deepEqual(hero.map((r) => r.hero).sort(), Object.keys(data.characters).sort());
  for (const h of hero) assert.ok(h.display && !def.list.some((id) => C.info.regionKey[id] === h.id), `${h.id} owns no node`);
});

test('S1 auto-slot: a region with no orbit takes a free angle at the first tier with room, an explicit orbit on top of another is nudged', () => {
  const atlas = C.info.core.atlas;
  const placed = placeRegions([{ id: 'a', foot: 400, orbit: { tier: 1, angle: 0 } }, { id: 'b', foot: 400, orbit: { tier: 1, angle: 0 } }, { id: 'c', foot: 400 }, { id: 'd', foot: 400 }], atlas, 500);
  assert.equal(placed.a.angle, 0); assert.equal(placed.a.auto, false);
  assert.ok(placed.b.auto && (angDiff(placed.b.angle, 0) > 0 || placed.b.tier > 1), 'nudged');
  for (const k of ['c', 'd']) assert.ok(placed[k].auto);
  const all = Object.values(placed);
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) assert.ok(Math.hypot(all[i].centre[0] - all[j].centre[0], all[i].centre[1] - all[j].centre[1]) >= 800 + atlas.regionGap - 1e-6);
  assert.deepEqual(placeRegions([{ id: 'c', foot: 400 }, { id: 'd', foot: 400 }], atlas, 500), placeRegions([{ id: 'c', foot: 400 }, { id: 'd', foot: 400 }], atlas, 500), 'deterministic');
  // a new weapon fragment with no orbit lands in a free slot and moves nothing else
  const fs = files();
  const motes = clone(get(fs, 'clusters/spirit_bolts.json'));
  const j = JSON.parse(JSON.stringify(motes).replace(/"bo_/g, '"zt_').replace(/spirit_bolts/g, 'test_motes').replace(/"prefix":"bo"/, '"prefix":"zt"').replace(/spirit_tempest/g, 'zt_tempest').replace(/soul_lance/g, 'zt_lance').replace(/returning_pages/g, 'zt_pages'));
  delete j.orbit;
  fs.push({ path: 'clusters/test_motes.json', json: j });
  const d = clone(data);
  d.weapons.test_motes = { ...clone(d.weapons.spirit_bolts), name: 'Test Motes' };
  for (const [a, b] of [['spirit_tempest', 'zt_tempest'], ['soul_lance', 'zt_lance'], ['returning_pages', 'zt_pages']]) d.evolutions[b] = { ...clone(d.evolutions[a]), weapon: 'test_motes' };
  const c2 = composeTree(fs, d);
  const rec = c2.info.regions.find((r) => r.id === 'c:test_motes');
  assert.ok(rec.orbit.auto);
  for (const r of C.info.regions) if (r.id !== 'hub') assert.deepEqual(c2.info.regions.find((x) => x.id === r.id).centre, r.centre, `${r.id} did not move`);
  assert.deepEqual(layoutIssues(c2.info, compileTree(c2.v2, d)), []);
});

// ---------------------------------------------------------------- starter
test('S1 starter: the starter heart + first seal are lit where they sit; every neighbour is buyable (no free road, no forced join)', () => {
  for (const w of MAGIC) {
    const s = rich();
    grantStarter(s, data, C.info, def, 'wren', w);
    const c = C.info.clusters[w], b = c.branchInfo.find((x) => x.socket === 'a');
    assert.deepEqual(Object.keys(s.tree).sort(), [c.heart, b.seal].sort(), w);
    assert.deepEqual(starterNodes(C.info, w), [c.heart, b.seal]);
    assert.deepEqual(STARTER_V5[w], [c.heart, b.seal], `${w}: the migration's frozen starter set matches the data`);
    for (const id of [b.lead[0], b.diamond, ...b.forks.map((f) => f[0]), C.info.roads.find((r) => r.to === c.heart).ids.at(-1)]) assert.equal(st(s, id).state, 'available', `${w}: ${id}`);
    const road = C.info.roads.find((r) => r.to === c.heart);
    assert.ok(road.ids.every((id) => !(s.tree[id] >= 1)), 'the road home is not given for free');
    const v = buildTreeView(C.info, def, data);
    assert.deepEqual(v.starterOf(s.notes), { hero: 'wren', weapon: w, heart: c.heart, seal: b.seal });
  }
  for (const w of ['ghost_wolves', 'raven_flock']) assert.deepEqual(STARTER_V5[w], starterNodes(C.info, w));
  for (const bad of [null, {}, { starter: { hero: 'x', weapon: 'holy_orbit' } }, { starter: { hero: 'wren', weapon: '__proto__' } }, { starter: 'wren' }]) assert.equal(starterOf(C.info, data, bad), null);
});

// ---------------------------------------------------------------- budget
test('S1 budget: each magic weapon pool rises about 5% PE (soft cap 17.2), status stays inside its shared cap, the rule ceiling holds', () => {
  const b = budgetOf(V2, C.info.core.budget, 5);
  assert.deepEqual(b.violations, []);
  const soft = (S, Cc) => Cc * (1 - Math.exp(-S / Cc));
  for (const w of MAGIC) {
    const S = b.rows[`wpn:${w}`].S;
    const gain = soft(S, 17.2) / soft(24, 17.2) - 1;
    assert.ok(gain > 0.03 && gain < 0.07, `${w}: PE ${(gain * 100).toFixed(1)}%`);
  }
  for (const w of ['ghost_wolves', 'raven_flock']) assert.ok(b.rows[`wpn:${w}`].S <= 24);
  assert.ok(b.rows.status.S <= 14, 'the shared status pool did not grow');
  assert.ok(b.combatAtCap <= C.info.core.budget.base.combat);
});

// ---------------------------------------------------------------- v5 restart migration
const FX = JSON.parse(readFileSync(new URL('./fixtures/tree-v4-saves.json', import.meta.url), 'utf8')).saves;

test('S1 restart: golden v4 saves migrate to the v5 starter set and get back EXACTLY what they paid (gold, shards, Dawnglass), once', () => {
  for (const [name, f] of Object.entries(FX)) {
    const r = parseSave(f.disk);
    assert.ok(r.ok, name);
    const s = r.save;
    assert.equal(s.gold - f.gold, f.paid.gold, `${name} gold`);
    assert.equal(s.shards - f.shards, f.paid.shards, `${name} shards`);
    assert.equal(s.dawnglass - f.dawnglass, f.paid.glass, `${name} Dawnglass`);
    assert.deepEqual(Object.keys(s.tree).sort(), [...STARTER_V5[f.weapon]].sort(), `${name}: tree = the v5 starter set`);
    assert.deepEqual(s.creep, {});
    if (f.paid.gold || f.paid.shards || f.paid.glass) assert.deepEqual(s.notes.treeResetNotice, { gold: f.paid.gold, shards: f.paid.shards, glass: f.paid.glass, nodes: Object.keys(f.tree).filter((id) => !STARTER_V4[f.weapon].includes(id)).length });
    else assert.equal(s.notes.treeResetNotice, undefined, `${name}: nothing to tell`);
    // untouched: stats, chars, codex, notes.starter
    assert.equal(s.stats.runs, 80); assert.deepEqual(s.notes.starter, { hero: f.hero, weapon: f.weapon });
    // idempotent: re-saving and re-loading never refunds again
    const again = parseSave(JSON.stringify(serializeSave(s))).save;
    assert.equal(again.gold, s.gold); assert.deepEqual(again.tree, s.tree);
  }
});

test('S1 restart: the step is pure, idempotent, never refunds a starter grant, never pays more than the frozen v4 price, and survives hostile input', () => {
  const late = FX.late_all;
  const r1 = restartTree(late.tree, { creep: late.creep, starter: late.weapon });
  const r2 = restartTree(r1.tree, { creep: r1.creep, starter: late.weapon });
  assert.deepEqual([r2.gold, r2.shards, r2.glass, r2.refunded], [0, 0, 0, 0], 'a restarted tree refunds nothing');
  assert.deepEqual(r2.tree, r1.tree);
  assert.equal(restartTree({ gt_holy_orbit: 1, or_halo: 1 }, { starter: 'holy_orbit' }).gold, 0);
  assert.equal(restartTree({ gt_spirit_bolts: 1, gt_spirit_tempest: 1 }, { starter: 'spirit_bolts' }).gold, 0, 'the starter grant was free');
  assert.equal(restartTree({ gt_spirit_bolts: 1, gt_spirit_tempest: 1 }, { starter: 'holy_orbit' }).gold, PRICES_V4.gt_spirit_bolts.g + PRICES_V4.gt_spirit_tempest.g, 'a bought heart + seal come back');
  // the most it can pay: every frozen node at its maximum rank and maximum steps
  let max = 0; for (const p of Object.values(PRICES_V4)) max += p.g * p.m * 10;
  assert.ok(r1.gold <= max);
  // hostile
  for (const junk of [null, 7, 'x', [], [1]]) assert.deepEqual(restartTree(junk, { starter: 'holy_orbit' }).tree, { gt_holy_orbit: 1, or_halo: 1 });
  const evil = JSON.parse('{"__proto__":{"sp_reroll1":1},"constructor":1,"sp_reroll1":"9","sp_ban1":1e99,"li_vigor":-3,"sp_cd1":true,"sp_reroll2":2.7}');
  const e = restartTree(evil, { starter: '__proto__', creep: JSON.parse('{"__proto__":9,"sp_ban1":1e99,"sp_cd1":"4"}') });
  assert.deepEqual(e.tree, {}, 'unknown starter: nothing granted');
  // ranks: "9" and -3 are not ranks, 1e99 and 2.7 clamp to 1, true = 1; sp_ban1's forged 1e99 steps are bounded by the 2 other Spirit-ring purchases
  assert.equal(e.gold, Math.round((150 * 1.08 * 1.08) / 10) * 10 + 300 + 270);
  assert.equal(e.refunded, 3);
  assert.equal(({}).sp_reroll1, undefined);
  // a v5 tree forged down to v4 never restarts again
  const v5 = restartTree({ or_halo: 1, sp_reroll1: 1, or_way1: 1 }, { starter: 'holy_orbit' });
  assert.ok(v5.replay); assert.equal(v5.gold, 0); assert.deepEqual(v5.tree, { or_halo: 1, sp_reroll1: 1, or_way1: 1 });
  // the registry runs it once, sums Dawnglass, and its notice is validated on load
  assert.equal(typeof TREE_STEPS[5], 'function');
  const run = runTreeSteps({ cd_fourth: 1 }, 4, 5, TREE_STEPS, { starter: null });
  assert.deepEqual([run.glass, run.notes.treeResetNotice.glass], [8, 8]);
  const forged = sanitize({ ...defaultSave(), notes: { treeResetNotice: { gold: 1e99, shards: -5, glass: 'x', nodes: 1e9, __proto__: { a: 1 }, extra: 1 } } });
  assert.deepEqual(forged.notes.treeResetNotice, { gold: 1e12, shards: 0, glass: 0, nodes: 1e4 });
  assert.equal(sanitize({ ...defaultSave(), notes: { treeResetNotice: 'yes' } }).notes.treeResetNotice, undefined);
});

test('S1 restart: a whole late v4 save refunds the same as respec-everything at v4 prices (spentOf on the v4 ids, starter excluded)', () => {
  const f = FX.late_all;
  const owned = { ...f.tree }; for (const id of STARTER_V4[f.weapon]) delete owned[id];
  const r = restartTree(f.tree, { creep: f.creep, starter: f.weapon });
  assert.equal(r.gold, f.paid.gold); assert.equal(r.shards, f.paid.shards); assert.equal(r.glass, f.paid.glass);
  assert.ok(Object.keys(owned).length > 100);
  assert.ok(spentOf(owned, def, f.creep).gold >= 0);
});
