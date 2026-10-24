import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def, ungated } from './helpers.mjs';
const udata = ungated(data); // synthetic trees compile against ungated data (shipped data requires a real gate node per gated item)
import {
  compileTree, canBuy, buy, respec, spentOf, totalCost, costFor, nodeStatus, sanitizeTree, aggregateMods, presetTree,
  conditionProgress, metConditions, closestUnlocks, describeNode, queryRect, pathToHub, emptyEffects,
} from '../src/meta/tree.js';
import { Sim } from '../src/sim/Sim.js';
import { SaveStore } from '../src/save/store.js';
import { parseSave, defaultSave, sanitize, SAVE_VERSION } from '../src/save/schema.js';

const DT = 1 / 60;
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const richSave = (extra = {}) => ({ ...defaultSave(), gold: 1e7, shards: 100, ...extra });
const E = (id, i = 0) => def.nodes[id].effects[i];
const soft = (S, C) => C * (1 - Math.exp(-S / C)); // the budget soft cap: total = C(1 - e^(-S/C))
const chain = (id) => def.order.filter((x) => x !== id && pathToHub(def, id).ids.has(x)); // every node on the way to `id`, parents first
const ownedPath = (save, ids) => { for (const id of ids) { const r = buy(save, id, def, data); assert.ok(r.ok, `${id}: ${r.reason}`); } };

// ---- minimal synthetic trees for validation tests
const B = { branches: { spirit: { name: 'S', angle: 90 } } };
const node = (id, extra = {}) => ({ id, name: id, desc: 'd', branch: 'spirit', ring: 1, ang: 0, cost: { gold: 10 }, effects: [{ mod: 'damage', pct: 5 }], ...extra });
const raw = (nodes) => ({ ...B, nodes });
const bad = (nodes, re) => assert.throws(() => compileTree(raw(nodes), udata), re);

test('real tree compiles: ~60+ nodes, 4 branches, enough locked and teaser nodes', () => {
  assert.ok(def.list.length >= 120 && def.list.length <= 200, `nodes ${def.list.length}`);
  assert.deepEqual(Object.keys(def.branches).sort(), ['light', 'magic', 'spirit', 'summoner']);
  const locked = def.list.filter((i) => def.nodes[i].unlock && !def.nodes[i].teaser);
  assert.ok(locked.length >= 12, `locked ${locked.length}`);
  assert.ok(def.list.filter((i) => def.nodes[i].teaser).length >= 3);
  assert.ok(def.list.some((i) => def.nodes[i].hidden));
  assert.ok(def.list.some((i) => def.nodes[i].keystone));
  const condTypes = new Set();
  const walk = (c) => { if (c.of) c.of.forEach(walk); else condTypes.add(c.t); };
  for (const i of locked) walk(def.nodes[i].unlock);
  for (const t of ['killEnemy', 'clearChapter', 'surviveTime', 'evolveWeapon', 'startWeapon', 'bossKill', 'totalGold', 'bestLevel']) assert.ok(condTypes.has(t), t);
  assert.ok(!condTypes.has('useCharacter'), 'v2: hero-in-condition became weapon-in-condition (the tree is character-agnostic)');
});

test('validation rejects duplicate ids, unknown/self prerequisites, cycles, bad costs, overlaps', () => {
  bad([node('a'), node('a', { ang: 90 })], /duplicate/);
  bad([node('a', { requires: ['zzz'] })], /unknown prerequisite/);
  bad([node('a', { requires: ['a'] })], /unknown prerequisite/);
  bad([node('a', { requires: ['b'] }), node('b', { requires: ['a'], ang: 90 })], /cycle/);
  bad([node('a', { cost: { gold: -5 } })], /bad cost/);
  bad([node('a', { cost: { gold: 1.5 } })], /bad cost/);
  bad([node('a', { cost: { gold: 1e9 } })], /bad cost/);
  bad([node('a', { maxRank: 0 })], /maxRank/);
  bad([node('a', { ring: 0 })], /ring/);
  bad([node('a', { ang: Infinity })], /angle/);
  bad([node('a'), node('b')], /overlaps/);
  bad([node('__proto__')], /bad node id/);
  bad([node('constructor')], /bad node id/);
  bad([node('hub')], /bad node id/);
  bad([node('a', { branch: 'nope' })], /branch/);
  bad([node('a', { effects: [] })], /no effects/);
  bad([node('a', { effects: [{ mod: 'godmode', pct: 5 }] })], /unknown mod/);
  bad([node('a', { effects: [{ mod: 'damage', pct: 9999 }] })], /out of range/);
  bad([node('a', { effects: [{ weapon: 'nope', stat: 'power', pct: 5 }] })], /unknown weapon/);
  bad([node('a', { effects: [{ weapon: 'ghost_wolves', stat: 'nonsense', pct: 5 }] })], /no matching weapon/);
  bad([node('a', { effects: [{ unlock: 'weapon', id: 'nope' }] })], /unknown weapon/);
  bad([node('a', { effects: [{ unlock: 'rerolls', n: 99 }] })], /out of range/);
  bad([node('a', { unlock: { t: 'killEnemy', id: 'dragon', n: 5 } })], /unknown enemies/);
  bad([node('a', { unlock: { t: 'killEnemy', id: 'wolf', n: -1 } })], /positive/);
  bad([node('a', { unlock: { t: 'rm -rf', n: 1 } })], /unknown condition/);
  bad([node('a', { teaser: true, unlock: { t: 'totalKills', n: 1 } })], /teaser/);
  bad([node('a', { excludes: ['b'] }), node('b', { requires: ['a'], ang: 90 })], /excludes/);
  bad([node('a', { unlock: { t: 'all', of: [] } })], /children/);
  assert.throws(() => compileTree({ nodes: 'x' }, udata), /nodes array/);
  // a teaser may reference things that do not exist yet
  assert.doesNotThrow(() => compileTree(raw([node('t', { teaser: true, effects: [], unlock: { t: 'killEnemy', id: 'bog_witch', n: 9 } })]), udata));
});

test('costs: rank scaling, totals recomputed from nodes', () => {
  const n = node('a', { maxRank: 3, cost: { gold: 100, shards: 1 }, rankCost: 2 });
  const d = compileTree(raw([n]), udata);
  assert.deepEqual(costFor(d.nodes.a, 1), { gold: 100, shards: 1, glass: 0 });
  assert.deepEqual(costFor(d.nodes.a, 3), { gold: 400, shards: 1, glass: 0 });
  assert.deepEqual(spentOf({ a: 2 }, d), { gold: 300, shards: 2, glass: 0 });
  assert.deepEqual(spentOf({ a: 99, ghost: 5, __proto__: { a: 3 } }, d), { gold: 700, shards: 3, glass: 0 }); // junk ids ignored, rank clamped to the node max
  const t = totalCost(def);
  assert.ok(t.gold > 40000 && t.gold < 125000, `total gold ${t.gold}`); // includes the Wardrobe's 24,250 zero-power gold sink (EXTRAS v1)
  assert.ok(t.shards >= 20 && t.shards <= 60, `total shards ${t.shards}`);
});

test('buy: root nodes, gold/shard checks, prerequisites, ranks, atomic failure', () => {
  const s = defaultSave();
  assert.equal(canBuy(s, 'sp_reroll1', def, data).ok, false); // 0 gold
  s.gold = 1000;
  assert.equal(canBuy(s, 'sp_reroll2', def, data).ok, false);
  assert.match(canBuy(s, 'sp_reroll2', def, data).reason, /Requires/);
  const before = JSON.stringify(s);
  assert.equal(buy(s, 'sp_reroll2', def, data).ok, false);
  assert.equal(JSON.stringify(s), before, 'failed buy changes nothing');
  const r = buy(s, 'sp_reroll1', def, data);
  assert.ok(r.ok);
  assert.equal(s.tree.sp_reroll1, 1);
  assert.equal(s.gold, 1000 - r.cost.gold);
  assert.equal(buy(s, 'sp_reroll1', def, data).ok, false, 'max rank 1 already owned');
  // multi-rank (no shipped node has more than one rank since the v2 rescale: a synthetic tree proves the rank path)
  const md = compileTree(raw([node('a', { maxRank: 2, cost: { gold: 10 }, rankCost: 2 })]), udata);
  const m = richSave();
  assert.equal(buy(m, 'a', md, data).rank, 1);
  assert.equal(buy(m, 'a', md, data).rank, 2);
  assert.equal(buy(m, 'a', md, data).ok, false);
  assert.equal(m.gold, 1e7 - 10 - 20);
  // shards
  const sh = richSave({ shards: 0 });
  ownedPath(sh, ['su_bond', 'su_rush']);
  assert.match(buy(sh, 'su_key', def, data).reason, /enough/);
  // hostile ids
  for (const id of ['__proto__', 'constructor', 'toString', 'hub', '', 'nope', null, 5, {}]) assert.equal(buy(richSave(), id, def, data).ok, false);
  assert.equal({}.polluted, undefined);
});

test('unlock conditions gate buying; teasers never buyable', () => {
  const s = richSave();
  s.stats.runs = 2; // the Wolves heart (v2) asks for 2 runs
  s.stats.killsByEnemy.wolf = 3000; // enough for the path (Red Thread needs 2500) but not for the chin lantern (4000)
  ownedPath(s, chain('wf_third'));
  assert.equal(nodeStatus(def, s, 'wf_third', data).state, 'condition');
  assert.equal(buy(s, 'wf_third', def, data).ok, false);
  s.stats.killsByEnemy.wolf = 4000;
  assert.equal(nodeStatus(def, s, 'wf_third', data).state, 'available');
  assert.ok(buy(s, 'wf_third', def, data).ok);
  assert.equal(nodeStatus(def, s, 'tz_marsh', data).state, 'teaser');
  assert.equal(buy(s, 'tz_marsh', def, data).ok, false);
});

test('keystones are mutually exclusive', () => {
  const s = richSave();
  ownedPath(s, ['su_bond', 'su_rush', 'su_key', 'ma_focus', 'ma_attune']);
  assert.equal(nodeStatus(def, s, 'ma_key', data).state, 'excluded');
  assert.equal(buy(s, 'ma_key', def, data).ok, false);
  const t = sanitizeTree({ su_bond: 1, su_rush: 1, su_key: 1, ma_focus: 1, ma_attune: 1, ma_key: 1 }, defaultSave().stats, def, data);
  assert.ok(t.su_key && !t.ma_key, 'edited save cannot hold both rivals');
});

test('respec refunds everything for free and clears the tree', () => {
  const s = defaultSave();
  s.gold = 5000; s.shards = 3;
  ownedPath(s, ['sp_reroll1', 'sp_ban1', 'su_bond', 'su_pot']);
  const spent = spentOf(s.tree, def, s.creep); // rising price: what was actually paid
  assert.ok(spent.gold > spentOf(s.tree, def).gold, 'su_pot was bought after su_bond in the Summoner ring, so it cost one rising-price step more');
  const goldAfter = s.gold;
  const out = respec(s, def);
  assert.deepEqual(out, spent);
  assert.equal(s.gold, goldAfter + spent.gold);
  assert.equal(s.gold, 5000);
  assert.deepEqual(s.tree, {});
  assert.deepEqual(s.creep, {}, 'price steps cleared with the tree');
  respec(s, def);
  assert.equal(s.gold, 5000, 'second respec refunds nothing');
});

test('sanitizeTree: unknown ids, junk, huge/negative ranks, prerequisite and condition violations', () => {
  const stats = defaultSave().stats;
  const evil = JSON.parse('{"__proto__":{"x":1},"constructor":3,"sp_reroll1":99999,"sp_ban1":-4,"su_bond":"2","li_vigor":1.9,"nope":1,"sp_cd1":1,"sp_cd3":1,"wf_third":1,"li_last":1,"tz_marsh":1,"ma_focus":1e300}');
  const t = sanitizeTree(evil, stats, def, data);
  assert.equal({}.x, undefined);
  assert.equal(t.sp_reroll1, 1, 'rank clamped to node max');
  assert.equal(t.sp_ban1, undefined, 'negative dropped');
  assert.equal(t.su_bond, undefined, 'string rank dropped');
  assert.equal(t.li_vigor, 1, 'fractional floored');
  assert.equal(t.nope, undefined);
  // connected-unlock rule (2026-10-21): links and conditions gate BUYING only; an owned lantern is never dropped for them
  assert.equal(t.sp_cd1, 1, 'kept: links gate buying, not owning');
  assert.equal(t.sp_cd3, 1, 'kept although sp_cd2 is not owned');
  assert.equal(t.wf_third, undefined, 'v2: dropped (refunded) without the Wolves heart, its gate');
  assert.equal(sanitizeTree({ ...evil, gt_ghost_wolves: 1 }, stats, def, data).wf_third, 1, 'kept once the heart is owned');
  assert.equal(t.li_last, 1, 'kept: conditions gate buying only');
  assert.equal(t.tz_marsh, undefined, 'teaser');
  assert.equal(t.ma_focus, 1, 'huge rank clamped to max');
  assert.equal(Object.getPrototypeOf(t), Object.prototype);
  for (const bad of [null, [], 'x', 5, undefined]) assert.deepEqual(sanitizeTree(bad, stats, def, data), {});
});

test('edited stats cannot be abused beyond clamps; stored totals are not trusted', () => {
  const r = parseSave(JSON.stringify({
    version: 2, gold: 5, tree: { sp_reroll1: 1 },
    stats: { killsByEnemy: { wolf: 1e99, '__proto__': 5, 'bad key': 3, crow: -4, root_crawler: 'x', ...Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`e${i}`, 1])) }, chapters: { cursed_forest: { clears: 1e99, bestTime: -5, runs: 'a' }, __proto__: { clears: 1 } }, evolved: [1, 2], bossKills: { elder_treant: 2.9 }, bestLevel: 1e99, totalGold: -1 },
  }));
  assert.ok(r.ok);
  const st = r.save.stats;
  assert.equal(st.killsByEnemy.wolf, 1e9);
  assert.equal(st.killsByEnemy.crow, 0);
  assert.equal(st.killsByEnemy.root_crawler, undefined);
  assert.equal(Object.hasOwn(st.killsByEnemy, '__proto__'), false);
  assert.ok(Object.keys(st.killsByEnemy).length <= 128);
  assert.equal(st.chapters.cursed_forest.clears, 1e9);
  assert.equal(st.chapters.cursed_forest.bestTime, 0);
  assert.equal(st.chapters.cursed_forest.runs, 0);
  assert.deepEqual(st.evolved, {});
  assert.equal(st.bossKills.elder_treant, 2);
  assert.equal(st.bestLevel, 1e6);
  assert.equal(st.totalGold, 0);
  assert.equal({}.clears, undefined);
});

test('migration v1 -> v2: carries gold/stats/settings, resets placeholder tree, adds stat maps', () => {
  const v1 = { version: 1, createdAt: 5, updatedAt: 6, gold: 321, shards: 4, stats: { runs: 3, wins: 1, kills: 99, bestTime: 700, totalPlayTime: 1500 }, unlocks: {}, tree: { sp_reroll1: 1, junk: 7 }, settings: { musicVol: 0.2, quality: 'low' } };
  const r = parseSave(JSON.stringify(v1));
  assert.ok(r.ok);
  assert.equal(r.save.version, SAVE_VERSION);
  assert.equal(r.save.gold, 321);
  assert.equal(r.save.shards, 4);
  assert.equal(r.save.stats.kills, 99);
  assert.equal(r.save.settings.quality, 'low');
  assert.deepEqual(r.save.tree, { gt_ghost_wolves: 1, gt_holy_orbit: 1 }, 'v1 tree was a placeholder; a played pre-v2 save keeps the old run-1 pool (both launch hearts)');
  assert.deepEqual(r.save.stats.killsByEnemy, {});
  assert.deepEqual(r.save.seen, {});
  // an older save that never had these fields at all
  assert.ok(parseSave('{"version":1}').ok);
  // a v2 save goes through the v3 Regrowth: non-permanent nodes are refunded at their old price (150 + 150), unknown ids vanish
  const v2 = parseSave(JSON.stringify({ ...v1, version: 2, tree: { sp_reroll1: 1, sp_ban1: 1, junk: 7 } }));
  assert.deepEqual(v2.save.tree, { gt_ghost_wolves: 1, gt_holy_orbit: 1 }, 'v2 legacy profile: the old run-1 pool hearts');
  assert.equal(v2.save.gold, 321 + 300);
  assert.deepEqual(v2.save.notes, { regrowth: { gold: 300, shards: 0, nodes: 2 }, starter: { hero: 'wren', weapon: 'ghost_wolves' } });
});

test('seen flags are sanitised', () => {
  const r = parseSave(JSON.stringify({ version: 2, seen: { sp_reroll1: true, nope: true, sp_ban1: 'yes', __proto__: true } }));
  assert.deepEqual(r.save.seen, { sp_reroll1: true });
  const st = new SaveStore(mem());
  st.load();
  st.markSeen('sp_ban1');
  st.markSeen('not_a_node');
  assert.deepEqual(st.data.seen, { sp_ban1: true });
});

test('every condition type: progress, text and completion', () => {
  const stats = {
    killsByEnemy: { wolf: 340 }, chapters: { cursed_forest: { runs: 4, clears: 1, bestTime: 612 } }, evolved: { phantom_stampede: 1, spirit_tempest: 2 },
    charsUsed: { wren: 2 }, bossKills: { elder_treant: 1 }, kills: 5000, totalGold: 9000, bestLevel: 31, runs: 7,
  };
  const P = (c) => conditionProgress(c, stats, def, data);
  assert.equal(P({ t: 'killEnemy', id: 'wolf', n: 1000 }).frac, 0.34);
  assert.equal(P({ t: 'killEnemy', id: 'wolf', n: 1000 }).lines[0].text, 'Slay 1000 Fell Wolf');
  assert.equal(P({ t: 'killEnemy', id: 'crow', n: 10 }).done, false);
  assert.equal(P({ t: 'clearChapter', id: 'cursed_forest' }).done, true);
  assert.equal(P({ t: 'clearChapter', id: 'cursed_forest', n: 2 }).frac, 0.5);
  assert.equal(P({ t: 'surviveTime', chapter: 'cursed_forest', seconds: 600 }).done, true);
  assert.equal(P({ t: 'surviveTime', chapter: 'cursed_forest', seconds: 900 }).done, false);
  assert.equal(P({ t: 'evolveWeapon', id: 'any', n: 3 }).done, true);
  assert.equal(P({ t: 'evolveWeapon', id: 'ghost_wolves' }).done, true, 'phantom_stampede belongs to ghost_wolves');
  assert.equal(P({ t: 'evolveWeapon', id: 'holy_orbit' }).done, false);
  assert.equal(P({ t: 'useCharacter', id: 'wren', n: 3 }).frac, 2 / 3);
  assert.equal(P({ t: 'useCharacter', id: 'elias' }).done, false);
  assert.equal(P({ t: 'bossKill', id: 'elder_treant' }).done, true);
  assert.equal(P({ t: 'totalKills', n: 5000 }).done, true);
  assert.equal(P({ t: 'totalGold', n: 20000 }).frac, 0.45);
  assert.equal(P({ t: 'bestLevel', n: 50 }).frac, 0.62);
  assert.equal(P({ t: 'runs', n: 7 }).done, true);
  const all = P({ t: 'all', of: [{ t: 'clearChapter', id: 'cursed_forest' }, { t: 'killEnemy', id: 'wolf', n: 680 }] });
  assert.equal(all.done, false);
  assert.ok(Math.abs(all.frac - 0.75) < 1e-9);
  const any = P({ t: 'any', of: [{ t: 'killEnemy', id: 'wolf', n: 680 }, { t: 'killEnemy', id: 'crow', n: 800 }] });
  assert.equal(any.done, false);
  assert.equal(any.frac, 0.5);
  assert.equal(P({ t: 'any', of: [{ t: 'killEnemy', id: 'wolf', n: 100 }, { t: 'killEnemy', id: 'crow', n: 800 }] }).done, true);
  assert.equal(conditionProgress(null, stats, def, data).done, true);
  // garbage stats never throw
  for (const junk of [null, undefined, 5, 'x', [], { killsByEnemy: 'x', chapters: [] }]) assert.doesNotThrow(() => conditionProgress({ t: 'killEnemy', id: 'wolf', n: 5 }, junk, def, data));
});

test('hidden and teaser nodes stay vague until progress begins; progress is shown after', () => {
  const s = defaultSave();
  const d0 = describeNode(def, s, 'li_dawn', data);
  assert.equal(d0.name, '???');
  assert.match(d0.condLines[0].text, /unknown/i);
  s.stats.bestLevel = 10;
  const d1 = describeNode(def, s, 'li_dawn', data);
  assert.equal(d1.name, 'Dawnlight');
  assert.equal(d1.condLines[0].cur, 10);
  const t = describeNode(def, s, 'tz_marsh', data);
  assert.equal(t.name, '???');
  assert.equal(t.state, 'teaser');
});

test('closestUnlocks ranks by progress; newly-met conditions come from a banked run', () => {
  const st = new SaveStore(mem());
  st.load();
  const ctx = { def, data };
  const b1 = st.bankRun({ outcome: 'defeat', time: 240, level: 12, kills: 400, gold: 500, shards: 0, killsByEnemy: { wolf: 400, crow: 100 }, character: 'wren', chapter: 'cursed_forest', weapons: [{ id: 'ghost_wolves', evo: null }] }, ctx);
  assert.deepEqual(b1.newlyMet, []);
  const c = closestUnlocks(def, st.data, data, 3);
  assert.equal(c.length, 3);
  assert.ok(c[0].frac >= c[1].frac && c[1].frac >= c[2].frac);
  assert.ok(c.every((x) => /\d+\/\d+/.test(x.text)));
  const b2 = st.bankRun({ outcome: 'victory', time: 900, level: 50, kills: 3000, gold: 2000, shards: 5, killsByEnemy: { wolf: 3700, crow: 8000, root_crawler: 50 }, bossKilled: true, bossId: 'elder_treant', character: 'wren', chapter: 'cursed_forest', weapons: [{ id: 'ghost_wolves', evo: 'phantom_stampede' }] }, ctx);
  for (const id of ['wf_third', 'rv_oath', 'li_last', 'li_elder', 'li_dawn', 'li_vow', 'li_scav']) assert.ok(b2.newlyMet.includes(id), id);
  assert.ok(!b2.newlyMet.includes('wf_fang'), 'nodes without a condition never appear');
  const s = st.data.stats;
  assert.equal(s.killsByEnemy.wolf, 4100);
  assert.equal(s.chapters.cursed_forest.clears, 1);
  assert.equal(s.chapters.cursed_forest.runs, 2);
  assert.equal(s.chapters.cursed_forest.bestTime, 900);
  assert.equal(s.bossKills.elder_treant, 1);
  assert.equal(s.evolved.phantom_stampede, 1);
  assert.equal(s.charsUsed.wren, 2);
  assert.equal(s.weaponsUsed.ghost_wolves, 2);
  assert.equal(s.totalGold, 2500);
  assert.equal(s.bestLevel, 50);
  // metConditions equals the satisfied set
  assert.ok(metConditions(def, s, data).has('li_last'));
});

test('a real headless run records per-enemy kills that unlock a node', () => {
  const sim = new Sim({ data, seed: 3, godMode: true });
  for (let i = 0; i < 60 * 150; i++) {
    if (sim.state === 'levelup') { sim.pickCard((sim.offer.gold[0] || sim.offer.cards[0]).key); continue; }
    sim.step(DT, { x: 0, y: 0 });
  }
  const res = sim.result();
  assert.ok(res.killsByEnemy.wolf > 0 || res.killsByEnemy.crow > 0, JSON.stringify(res.killsByEnemy));
  assert.equal(Object.values(res.killsByEnemy).reduce((a, b) => a + b, 0), res.kills);
  assert.equal(res.character, 'wren');
  assert.equal(res.chapter, 'cursed_forest');
  const total = Object.values(res.killsByEnemy).reduce((a, b) => a + b, 0);
  // small custom tree: kill 20 of the most-killed enemy
  const top = Object.entries(res.killsByEnemy).sort((a, b) => b[1] - a[1])[0];
  const d = compileTree(raw([node('hunt', { unlock: { t: 'killEnemy', id: top[0], n: Math.min(20, top[1]) } })]), udata);
  const st = new SaveStore(mem());
  st.load();
  assert.equal(metConditions(d, st.data.stats, data).size, 0);
  const b = st.bankRun(res, { def: d, data });
  assert.deepEqual(b.newlyMet, ['hunt']);
  assert.ok(total > 0);
});

test('aggregateMods math: sums per rank, clamps, tag expansion', () => {
  const none = aggregateMods({}, def, data);
  assert.deepEqual(none, emptyEffects());
  const a = aggregateMods({ sp_edge: 1, sp_cd1: 1, sp_cd2: 1, sp_cd3: 1, sp_cd4: 1, ma_cast: 1, ma_area: 1, su_bond: 1, ma_focus: 1, li_vigor: 1, li_regen: 1 }, def, data);
  // every capped effect passes through the soft cap total = C(1 - e^(-S/C)) (docs/design/skill-tree-v2.md section 8)
  assert.ok(Math.abs(a.mods.damage - (1 + soft(E('sp_edge').pct, def.rule.categories.dmg.cap) / 100)) < 1e-9);
  assert.ok(Math.abs(a.mods.abilityCd - 0.55) < 1e-9, `abilityCd ${a.mods.abilityCd}`);
  assert.ok(Math.abs(a.mods.cooldown - (1 + soft(-E('ma_cast').pct, def.rule.categories.cast.cap) / -100)) < 1e-9);
  assert.ok(Math.abs(a.mods.area - (1 + soft(E('ma_area').pct, 8) / 100)) < 1e-9);
  assert.ok(Math.abs(a.player.maxHp - (1 + soft(E('li_vigor').pct, 12) / 100)) < 1e-9);
  assert.ok(Math.abs(a.player.levelHeal - soft(E('li_regen').pct, 3)) < 1e-9);
  const tagS = soft(E('su_bond').pct, def.rule.categories.tagS.cap), tagM = soft(E('ma_focus').pct, def.rule.categories.tagM.cap);
  assert.ok(Math.abs(a.weaponBonus.ghost_wolves.power.pct - tagS) < 1e-9, 'summon tag expands to wolves');
  assert.ok(Math.abs(a.weaponBonus.raven_flock.power.pct - tagS) < 1e-9);
  assert.ok(Math.abs(a.weaponBonus.spirit_bolts.power.pct - tagM) < 1e-9, 'magic tag expands to bolts');
  assert.ok(Math.abs(a.weaponBonus.holy_orbit.power.pct - tagM) < 1e-9);
  assert.equal(a.weaponBonus.ghost_wolves.speed, undefined);
  // reroll / banish / auto / revive / rush
  const v = aggregateMods({ sp_reroll1: 1, sp_reroll2: 1, sp_reroll3: 1, sp_ban1: 1, sp_auto: 1, li_last: 1, su_rush: 1, ma_attune: 1 }, def, data);
  assert.equal(v.meta.rerolls, 3);
  assert.equal(v.meta.banishes, 1);
  assert.equal(v.ability.autoHp, 0.3);
  assert.equal(v.player.revive, E('li_last').frac);
  assert.equal(v.rush.secs, 4);
  assert.ok(v.rush.pct < 10 && v.rush.pct > 8, `rush ${v.rush.pct} (10% before the tag cap)`);
  assert.equal(v.evoLuck, 1.5);
  // keystone trade-off
  const k = aggregateMods({ su_key: 1 }, def, data);
  assert.ok(Math.abs(k.weaponBonus.ghost_wolves.power.pct - soft(E('su_key', 0).pct, def.rule.categories.tagS.cap)) < 1e-9);
  assert.equal(k.weaponBonus.spirit_bolts.power.pct, E('su_key', 1).pct, 'penalties pass through the cap unscaled');
  assert.ok(E('su_key', 0).pct > 0 && E('su_key', 1).pct < 0, 'keystone trades one side for the other');
  // hostile ranks cannot push values out of bounds
  const h = aggregateMods({ sp_cd1: 1e9, li_vigor: 1e9, sp_reroll1: 1e9 }, def, data);
  assert.equal(h.mods.abilityCd, 0.5);
  assert.ok(h.player.maxHp <= 5);
  assert.equal(h.meta.rerolls, 9);
  // unknown ids are ignored
  assert.deepEqual(aggregateMods({ nope: 5 }, def, data), emptyEffects());
});

test('presets: none/half/full are valid, full respects rivals and teasers', () => {
  assert.deepEqual(presetTree(def, 'none'), {});
  const full = presetTree(def, 'full');
  assert.ok(!full.tz_marsh);
  assert.ok(!(full.su_key && full.ma_key) && !(full.li_lantern && full.li_glass));
  assert.deepEqual(sanitizeTree(full, { ...defaultSave().stats, killsByEnemy: { wolf: 1e6, crow: 1e6, root_crawler: 1e6 } }, def, data).su_bond, 1);
  const half = presetTree(def, 'half');
  const sh = spentOf(half, def).gold;
  assert.ok(sh > 0 && sh <= totalCost(def).gold * 0.5 + 1);
});

test('layout: coordinates are finite, virtualised queries return only nearby nodes, path reaches the hub', () => {
  for (const id of def.list) assert.ok(Number.isFinite(def.nodes[id].x) && Number.isFinite(def.nodes[id].y));
  const all = queryRect(def, -1e5, -1e5, 1e5, 1e5);
  assert.equal(all.length, def.list.length);
  const near = queryRect(def, -150, -150, 150, 150);
  assert.ok(near.length < 12 && near.length > 0);
  for (const id of near) assert.ok(Math.abs(def.nodes[id].x) <= 150 && Math.abs(def.nodes[id].y) <= 150);
  const p = pathToHub(def, 'wf_third');
  assert.ok(p.ids.has('wf_third') && p.ids.size >= 6, 'the chin lantern is reached along the wolf thread');
  assert.ok([...p.edges].some((e) => e.startsWith('hub>')), 'a starter constellation hangs off the hub');
});

test('scalability: a generated 600-node tree compiles and queries quickly', () => {
  const nodes = [];
  for (let i = 0; i < 600; i++) {
    const ring = 4 + Math.floor(i / 30);
    nodes.push(node(`n${i}`, { ring, ang: ((i % 30) * 360) / 30 + (ring % 2) * 6, requires: ring > 4 ? [`n${i - 30}`] : [] }));
  }
  const t0 = performance.now();
  const d = compileTree(raw(nodes), udata);
  const ms = performance.now() - t0;
  assert.equal(d.list.length, 600);
  assert.ok(ms < 1500, `compile ${ms}ms`);
  assert.ok(queryRect(d, -300, -300, 300, 300).length < 80);
});

// ---------------------------------------------------------------- effects in a headless run
const run = (sim, secs, input = { x: 0, y: 0 }) => {
  for (let i = 0; i < Math.round(secs / DT); i++) {
    if (sim.state === 'levelup') { sim.pickCard((sim.offer.gold[0] || sim.offer.cards[0]).key); continue; }
    sim.step(DT, input);
  }
};
const fx = (owned) => aggregateMods(owned, def, data);

test('effects: damage nodes raise damage dealt (summed over 6 seeds: one seed is chaotic)', () => {
  let da = 0;
  let db = 0;
  for (let seed = 11; seed < 17; seed++) {
    const a = new Sim({ data, seed, godMode: true });
    const b = new Sim({ data, seed, godMode: true, tree: fx({ sp_edge: 1, su_bond: 1, su_pot: 1, wf_fang: 1, ch_wren: 1 }) });
    run(a, 25); run(b, 25);
    da += a.damageDealt; db += b.damageDealt;
  }
  assert.ok(db > da * 1.01, `${db} vs ${da}`);
});

test('effects: weapon bonuses change real weapon stats (count, power, pierce)', () => {
  const cd = compileTree(raw([node('c', { effects: [{ weapon: 'ghost_wolves', stat: 'count', add: 1 }, { weapon: 'ghost_wolves', stat: 'power', pct: 10 }] })]), udata);
  const sim = new Sim({ data, seed: 1, tree: aggregateMods({ c: 1 }, cd, data) });
  const w = sim.weapons[0];
  assert.equal(w.s.count, 3);
  assert.ok(Math.abs(w.s.power - 7 * 1.1) < 1e-9, `power ${w.s.power}`);
  const real = new Sim({ data, seed: 1, tree: fx({ su_bond: 1, wf_fang: 1 }) });
  assert.ok(Math.abs(real.weapons[0].s.power - 7 * (1 + (soft(E('su_bond').pct, def.rule.categories.tagS.cap) + soft(E('wf_fang').pct, def.rule.perWeapon.cap)) / 100)) < 1e-9);
  sim.debugGrant('ghost_wolves', { count: 2, power: 1 });
  assert.equal(sim.weapons[0].s.count, 5, 'bonus persists through rank-ups and debug grants');
  run(sim, 5);
  assert.equal(sim.units.filter((u) => u.kind === 'wolf').length, 5);
  const s2 = new Sim({ data, seed: 1, characterId: 'elias', tree: fx({ ma_cast: 1, bo_pierce: 1 }) });
  s2.addWeapon('spirit_bolts');
  assert.equal(s2.weapons[1].s.pierce, 1);
  assert.ok(Math.abs(s2.mods.cooldown - (1 - soft(-E('ma_cast').pct, def.rule.categories.cast.cap) / 100)) < 1e-9);
});

test('effects: reroll and banish are unavailable at the start and unlocked by the tree', () => {
  const a = new Sim({ data, seed: 5 });
  a.beginLevelUp();
  assert.equal(a.canReroll(), false);
  assert.equal(a.canBanish(), false);
  const b = new Sim({ data, seed: 5, tree: fx({ sp_reroll1: 1, sp_reroll2: 1, sp_ban1: 1 }) });
  assert.equal(b.rerollsLeft, 2);
  assert.equal(b.banishesLeft, 1);
  b.beginLevelUp();
  assert.ok(b.reroll() && b.rerollsLeft === 1);
  const key = b.offer.cards[0].key;
  assert.ok(b.banish(key) && b.banishesLeft === 0);
  assert.ok(!b.offer.cards.some((c) => c.key === key));
});

test('effects: ability cooldown reductions respect the 30s floor', () => {
  const sim = new Sim({ data, seed: 1, tree: fx({ sp_reroll1: 1, sp_ban1: 1, sp_cd1: 1, sp_cd2: 1, sp_cd3: 1, sp_cd4: 1 }) });
  assert.ok(sim.abilityCooldown >= 30 && sim.abilityCooldown < 36, `cd ${sim.abilityCooldown}`);
  sim.mods.abilityCd = 0.1; // even a hostile multiplier cannot beat the floor
  assert.equal(sim.abilityCooldown, 30);
  sim.ability.cdLeft = 0;
  assert.ok(sim.useAbility());
  assert.equal(sim.ability.cdLeft, 30);
  assert.equal(new Sim({ data, seed: 1 }).abilityCooldown, 60);
});

test('effects: ability duration, auto-activate at low health', () => {
  const sim = new Sim({ data, seed: 1, godMode: false, tree: fx({ sp_reroll1: 1, sp_ban1: 1, sp_cd1: 1, sp_cd2: 1, sp_dur: 1, sp_auto: 1 }) });
  sim.ability.cdLeft = 0;
  sim.step(DT, {});
  assert.equal(sim.ability.cdLeft > 0, false, 'full health: no auto use');
  sim.player.hp = sim.player.maxHp * 0.2;
  sim.step(DT, {});
  assert.ok(sim.ability.cdLeft > 0, 'auto-activated');
  assert.ok(Math.abs(sim.player.iframes - 0.5 * 1.15) < 0.02, `Pelt Dash untouchable ${sim.player.iframes} (0.5 s x 1.15)`);
});

test('effects: max health, regeneration, hearts', () => {
  const sim = new Sim({ data, seed: 1, godMode: true, tree: fx({ li_vigor: 1, li_regen: 1 }) });
  assert.equal(sim.player.maxHp, Math.round(data.balance.body.hp * (1 + soft(E('li_vigor').pct, 12) / 100)));
  sim.player.hp = 10;
  sim.xp = sim.xpNeeded + 1;
  sim.checkLevelUp();
  assert.ok(Math.abs(sim.player.hp - (10 + sim.player.maxHp * soft(E('li_regen').pct, 3) / 100)) < 1e-9, `hp ${sim.player.hp}`);
  const reg = new Sim({ data, seed: 1, godMode: true, tree: { player: { regen: 1 } } });
  reg.player.hp = 10;
  reg.weapons.length = 0;
  run(reg, 5);
  assert.ok(reg.player.hp > 14 && reg.player.hp < 16, `hp ${reg.player.hp}`);
  const heal = new Sim({ data, seed: 1, tree: { drops: { heartHeal: 2 } } });
  heal.player.hp = 1;
  heal.pickups.push({ id: 99, type: 'heart', x: heal.player.x, y: heal.player.y, ttl: 5 });
  heal.step(DT, {});
  assert.ok(heal.player.hp > 1 + data.balance.body.hp * 0.3 * 1.9, `hp ${heal.player.hp}`);
});

test('effects: Last Light revives once; level-up rush buffs summons; attunement raises pair-card weight', () => {
  const sim = new Sim({ data, seed: 2, tree: { player: { revive: 0.4 } } });
  sim.player.hp = 1;
  sim.damagePlayer(999);
  assert.equal(sim.state, 'running');
  assert.equal(Math.round(sim.player.hp), Math.round(data.balance.body.hp * 0.4));
  assert.ok(sim.player.iframes > 1);
  sim.player.iframes = 0;
  sim.damagePlayer(999);
  assert.equal(sim.state, 'defeat', 'only once per run');

  const r = new Sim({ data, seed: 2, tree: fx({ su_bond: 1, su_rush: 1 }) });
  const w = r.weapons[0];
  const base = r.dmgMult(w);
  r.xp = r.xpNeeded + 1;
  r.checkLevelUp();
  assert.ok(r.buffs.rush > 3);
  assert.ok(Math.abs(r.dmgMult(w) - base * (1 + r.tfx.rush.pct / 100)) < 1e-9);
  assert.equal(new Sim({ data, seed: 2 }).dmgMult(w), base);

  const luck = new Sim({ data, seed: 2, tree: fx({ ma_attune: 1 }) });
  assert.equal(luck.cardCtx.evoLuck, 1.5);
});

test('unlock schema: weapon gate and hero gate work with data that opts in (v2: every shipped weapon is gated; heroes wake by keepsakes)', () => {
  // G1b gated three weapons; CHARACTER SYSTEM v2 (2026-10-24) gates all five (the starter set grants one heart).
  assert.deepEqual(Object.keys(data.weapons).filter((w) => data.weapons[w].treeGate).sort(), ['chain_lightning', 'ghost_wolves', 'holy_orbit', 'raven_flock', 'spirit_bolts']);
  assert.ok(Object.values(data.characters).every((c) => !c.treeGate), 'no hero is a tree gate');
  const gated = { ...udata, weapons: { ...udata.weapons, ghost_wolves: { ...udata.weapons.ghost_wolves, treeGate: true } } };
  const d = compileTree(raw([node('uw', { effects: [{ unlock: 'weapon', id: 'ghost_wolves' }, { unlock: 'abilityUpgrade', id: 'long_howl' }, { unlock: 'modifier', id: 'hard_dusk' }] })]), gated);
  const off = new Sim({ data: gated, characterId: 'elias', seed: 4 });
  const on = new Sim({ data: gated, characterId: 'elias', seed: 4, tree: aggregateMods({ uw: 1 }, d, gated) });
  const pool = (s) => s.offer.cards.concat(s.offer.gold).map((c) => c.key);
  let seenOff = false, seenOn = false;
  for (let i = 0; i < 30; i++) {
    off.beginLevelUp(); on.beginLevelUp();
    if (pool(off).includes('w:ghost_wolves')) seenOff = true;
    if (pool(on).includes('w:ghost_wolves')) seenOn = true;
  }
  assert.equal(seenOff, false, 'gated weapon never offered without the unlock');
  assert.equal(seenOn, true, 'offered once unlocked');
  const agg = aggregateMods({ uw: 1 }, d, gated);
  assert.deepEqual(agg.unlocks.abilityUpgrades, ['long_howl']);
  assert.deepEqual(agg.unlocks.modifiers, ['hard_dusk']);
  assert.throws(() => compileTree(raw([node('uh', { effects: [{ unlock: 'hero', id: 'ghost' }] })]), udata), /unknown hero/);
});

// ---------------------------------------------------------------- G1e: gate dependency + wording
const gatedNodes = ['rv_talon', 'rv_wide', 'rv_oath', 'bo_pierce', 'bo_swift', 'bo_twin', 'cl_arc', 'cl_power', 'cl_storm'];
const gateOfWeapon = { raven_flock: 'gt_raven_flock', spirit_bolts: 'gt_spirit_bolts', chain_lightning: 'gt_chain_lightning' };

test('G1e: a node for a gated weapon cannot be bought without its gate; owning the gate allows it', () => {
  for (const id of gatedNodes) {
    const wid = def.nodes[id].effects[0].weapon;
    assert.ok(def.nodes[id].gateAnc.includes(gateOfWeapon[wid]), `${id} requires ${gateOfWeapon[wid]}`);
  }
  const s = richSave({ stats: { ...defaultSave().stats, killsByEnemy: { crow: 5000 } } });
  s.tree = { su_bond: 1, su_pot: 1 };
  const c = canBuy(s, 'rv_talon', def, data);
  assert.equal(c.ok, false);
  assert.equal(c.reason, 'Locked: unlock Raven Flock first');
  assert.equal(nodeStatus(def, s, 'rv_wide', data).reason, 'Locked: unlock Raven Flock first', 'deep chain nodes show the gate too');
  assert.equal(buy(s, 'rv_talon', def, data).ok, false);
  assert.equal(s.tree.rv_talon, undefined);
  assert.ok(buy(s, 'gt_raven_flock', def, data).ok);
  assert.ok(buy(s, 'rv_talon', def, data).ok, 'gate owned -> node buyable');
});

test('G1e: compileTree rejects a node targeting a gated weapon without (transitively) requiring its gate', () => {
  const d1 = ungated(data);
  d1.weapons.raven_flock = { ...d1.weapons.raven_flock, treeGate: true };
  const g = node('gt_rf', { effects: [{ unlock: 'weapon', id: 'raven_flock' }] });
  const stat = (id, extra) => node(id, { ring: 2, ang: 40, effects: [{ weapon: 'raven_flock', stat: 'power', pct: 5 }], ...extra });
  assert.throws(() => compileTree(raw([g, stat('rv_x')]), d1), /rv_x: targets gated weapon "raven_flock".*require its unlock node/);
  assert.throws(() => compileTree(raw([g, node('mid', { ring: 2, ang: 90 }), stat('rv_y', { requires: ['mid'] })]), d1), /rv_y/);
  assert.ok(compileTree(raw([g, stat('rv_ok', { requires: ['gt_rf'] })]), d1), 'direct gate prerequisite is fine');
  assert.ok(compileTree(raw([g, stat('rv_a', { requires: ['gt_rf'] }), stat('rv_b', { ring: 3, ang: 80, requires: ['rv_a'] })]), d1), 'transitive is fine');
});

test('G1e: nodes behind an evolution gate show ??? until that gate has progress or is owned', () => {
  const d1 = ungated(data);
  d1.evolutions.dire_alpha = { ...d1.evolutions.dire_alpha, treeGate: true };
  const g = node('gt_da', { effects: [{ unlock: 'evolution', id: 'dire_alpha' }], unlock: { t: 'totalKills', n: 100 }, hidden: true });
  const d = compileTree(raw([g, node('after', { ring: 2, ang: 40, requires: ['gt_da'] })]), d1);
  const none = { ...defaultSave(), tree: {} };
  const m = describeNode(d, none, 'after', d1);
  assert.equal(m.masked, true);
  assert.equal(m.name, '???');
  assert.ok(!/Dire|Alpha/i.test(JSON.stringify(m)), 'never names the locked evolution');
  assert.ok(!/Dire|Alpha/i.test(nodeStatus(d, none, 'after', d1).reason), 'reason does not name it either');
  const prog = { ...defaultSave(), tree: {}, stats: { ...defaultSave().stats, kills: 10 } };
  assert.equal(describeNode(d, prog, 'after', d1).masked, false, 'progress begun -> revealed');
});

test('G1e: no non-gate node text names a locked weapon or evolution (data-driven over tree.json)', () => {
  const lockedW = Object.entries(data.weapons).filter(([, w]) => w.treeGate);
  const lockedE = Object.entries(data.evolutions).filter(([, e]) => e.treeGate);
  const words = [...lockedW.map(([, w]) => w.name), ...lockedE.map(([, e]) => e.name), 'raven', 'bolt', 'lightning', 'tempest', 'stampede', 'judgment', 'judgement', 'alpha', 'lance'];
  assert.ok(lockedW.length === 5 && lockedE.length === 13);
  for (const id of def.list) {
    const n = def.nodes[id];
    if (n.permanent || n.gateAnc.some((g) => def.nodes[g].effects.some((e) => e.unlock === 'weapon'))) continue; // gate nodes and locked-weapon nodes may name their weapon
    const text = `${n.name} ${n.desc} ${n.flavour}`.toLowerCase();
    for (const w of words) assert.ok(!new RegExp(`\\b${w.toLowerCase()}`).test(text), `${id} mentions "${w}": ${text}`);
  }
});

test('G1e: old saves that own gated-weapon nodes without the gate are repaired with a full refund', () => {
  const paid = (ids) => spentOf(Object.fromEntries(ids.map((i) => [i, 1])), def);
  const raw0 = { ...defaultSave(), gold: 100, shards: 2, tree: { su_bond: 1, su_pot: 1, rv_talon: 1, rv_quill: 1, ma_focus: 1, ma_cast: 1, cl_arc: 1, cl_power: 1 } };
  raw0.stats.killsByEnemy = {};
  const fixed = sanitize(raw0);
  assert.deepEqual(Object.keys(fixed.tree).sort(), ['ma_cast', 'ma_focus', 'su_bond', 'su_pot']);
  const exp = spentOf({ rv_talon: 1, rv_quill: 1, cl_arc: 1, cl_power: 1 }, def);
  assert.equal(fixed.gold, 100 + exp.gold, 'spent gold refunded, not silently deleted');
  assert.equal(fixed.shards, 2 + exp.shards);
  // idempotent: a repaired save refunds nothing more
  assert.equal(sanitize(JSON.parse(JSON.stringify(fixed))).gold, fixed.gold);
  // save with the gate owned (and its condition met) keeps everything
  const ok = { ...defaultSave(), gold: 5, tree: { su_bond: 1, su_pot: 1, gt_raven_flock: 1, rv_talon: 1 } };
  ok.stats.killsByEnemy = { crow: 5000 };
  assert.deepEqual(sanitize(ok).tree, ok.tree);
  assert.equal(sanitize(ok).gold, 5);
  assert.ok(paid(['su_bond']).gold > 0);
});
