// CHARACTER SYSTEM v2 save layer (CH3): chars block (Bond XP, keepsakes, awake), starter set, loadout, stats.startWeapon, bankRun,
// the legacy seed for pre-v2 saves, and tree step 4 (hero lanterns retired as tombstones, refunded at the price paid). Hostile inputs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { defaultSave, sanitize, parseSave, serializeSave } from '../src/save/schema.js';
import { SaveStore } from '../src/save/store.js';
import { cleanChars, cleanPick, legacySeed, keepsakeEligible, bankChars, isAwake, bondLevel } from '../src/save/chars.js';
import { bondDef, levelOf, xpToLevel, maxXp, runBondXp, levelCost } from '../src/meta/bond.js';
import { grantStarter, starterNodes, startableWeapons } from '../src/meta/starter.js';
import { encodeTree, b64urlEncode, decodeTreeRaw } from '../src/meta/treecodec.js';
import { costFor, respec, conditionProgress, compileTree } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { PRICES_V4, frozenCost, retireHeroLanterns } from '../src/meta/migrations/tree-v4.js';

const D = bondDef(data.balance);
const info = composeTree(readTreeFiles(), data).info;
const mem = () => { const m = new Map(); let writes = 0; return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { writes++; m.set(k, String(v)); }, removeItem: (k) => m.delete(k), m, get writes() { return writes; } }; };

test('Bond curve: cap 25, cost 100 + 60 (L-1), slow (about 110 typical runs to cap)', () => {
  assert.equal(D.cap, 25);
  assert.equal(levelCost(D, 1), 100); assert.equal(levelCost(D, 25), 1540);
  assert.equal(maxXp(D), 20500);
  assert.equal(levelOf(D, 99), 0); assert.equal(levelOf(D, 100), 1); assert.equal(levelOf(D, 1e9), 25);
  for (const bad of [NaN, -5, '200', null, undefined]) assert.equal(levelOf(D, bad), 0);
  assert.equal(xpToLevel(D, 10), 3700, 'the sheet cap-10 total');
});

test('Bond XP per run: 1 per 25 kills, 15 per chest, 40 boss, 3 per minute, 30 dawn, capped 260; junk clamped', () => {
  assert.equal(runBondXp(D, { kills: 2500, chests: 2, bossKilled: true, time: 900, outcome: 'victory' }), 100 + 30 + 40 + 45 + 30);
  assert.equal(runBondXp(D, { kills: 1e9, chests: 1e9, bossKilled: true, time: 1e9, outcome: 'victory' }), 260);
  assert.equal(runBondXp(D, { kills: -5, chests: 'x', bossKilled: 'yes', time: NaN, outcome: 'win' }), 0);
  assert.equal(runBondXp(D, null), 0);
});

test('cleanChars: known ids only, prototype keys, bad shapes, clamps (xp to the cap total, keepsakes to need, woke strict true)', () => {
  const raw = JSON.parse('{"__proto__":{"xp":5},"constructor":{"xp":1},"wren":{"xp":1e15,"keep":3,"woke":true},"elias":{"xp":-4,"keep":99,"woke":"yes"},"nope":{"xp":5},"WREN":{"xp":1}}');
  const c = cleanChars(raw, data);
  assert.deepEqual(Object.keys(c).sort(), ['elias', 'wren']);
  assert.deepEqual(c.wren, { xp: maxXp(D), keep: 0, woke: true }, 'an awake hero carries no keepsakes');
  assert.deepEqual(c.elias, { xp: 0, keep: 5, woke: false });
  assert.equal({}.xp, undefined);
  for (const junk of [null, 5, 'x', [], [{ xp: 1 }]]) assert.deepEqual(cleanChars(junk, data), {});
  assert.deepEqual(cleanPick({ hero: 'wren', weapon: 'chain_lightning' }, data), { hero: 'wren', weapon: 'chain_lightning' });
  for (const p of [{ hero: 'nope', weapon: 'holy_orbit' }, { hero: 'wren', weapon: '__proto__' }, { hero: 'wren' }, 'wren', null]) assert.equal(cleanPick(p, data), null);
});

test('sanitize: a fresh profile has no awake hero and no starter; notes.starter / loadout and stats.startWeapon are validated', () => {
  const f = sanitize(defaultSave());
  assert.deepEqual(f.chars, {});
  assert.equal(f.notes.starter, undefined);
  const s = sanitize({ ...defaultSave(), chars: { wren: { xp: 150, keep: 0, woke: true } }, notes: { starter: { hero: 'wren', weapon: 'ghost_wolves' }, loadout: { hero: 'elias', weapon: '<img>' } }, stats: { ...defaultSave().stats, startWeapon: { ghost_wolves: 3, 'bad key': 2, holy_orbit: -1 } } });
  assert.deepEqual(s.notes.starter, { hero: 'wren', weapon: 'ghost_wolves' });
  assert.equal(s.notes.loadout, undefined);
  assert.deepEqual(s.stats.startWeapon, { ghost_wolves: 3, holy_orbit: 0 });
  assert.equal(bondLevel(s, data, 'wren'), 1);
  assert.ok(isAwake(s, 'wren') && !isAwake(s, 'elias'));
  // round trip through disk
  const back = parseSave(JSON.stringify(serializeSave(s))).save;
  assert.deepEqual(back.chars, s.chars); assert.deepEqual(back.notes.starter, s.notes.starter);
});

test('legacy seed: a played pre-v2 save keeps both heroes awake, Bond from history (100/run, max level 5), both launch hearts, startWeapon seeded', () => {
  const old = { ...defaultSave(), stats: { ...defaultSave().stats, runs: 13, charsUsed: { wren: 3, elias: 10 } }, tree: { su_bond: 1, wf_fang: 1 } };
  delete old.chars;
  const s = sanitize(old);
  assert.deepEqual(s.chars.wren, { xp: 300, keep: 0, woke: true });
  assert.deepEqual(s.chars.elias, { xp: xpToLevel(D, 5) <= 1000 ? xpToLevel(D, 5) : 1000, keep: 0, woke: true });
  assert.equal(bondLevel(s, data, 'elias'), 4, '1000 XP = level 4 (cap 5 = 1100 XP)');
  assert.deepEqual(s.notes.starter, { hero: 'elias', weapon: 'holy_orbit' }, 'most played hero');
  assert.equal(s.tree.gt_ghost_wolves, 1); assert.equal(s.tree.gt_holy_orbit, 1);
  assert.equal(s.tree.wf_fang, 1, 'a wolf lantern behind the new heart is kept (hearts added before the tree is sanitised)');
  assert.deepEqual(s.stats.startWeapon, { ghost_wolves: 3, holy_orbit: 10 });
  // once seeded, never again (chars present); an unplayed old save is a new profile
  const again = sanitize({ ...s, chars: {} });
  assert.deepEqual(again.chars, {});
  const unplayed = { ...defaultSave() }; delete unplayed.chars;
  assert.deepEqual(sanitize(unplayed).chars, {});
  assert.deepEqual(legacySeed({ charsUsed: { wren: 1e9 } }, data).chars.wren.xp, xpToLevel(D, 5));
});

test('starter set: heart + first socket gate, hero awake, notes; startable weapons follow the hearts', () => {
  assert.deepEqual(starterNodes(info, 'ghost_wolves'), ['gt_ghost_wolves']);
  assert.deepEqual(starterNodes(info, 'raven_flock'), ['gt_raven_flock', 'gt_dive_bombers'], 'a weapon with a gated first socket gets that evolution too');
  for (const w of Object.keys(data.weapons)) assert.ok(starterNodes(info, w).length >= 1, w);
  const s = sanitize(defaultSave());
  assert.deepEqual(startableWeapons(data, def, s.tree), []);
  assert.equal(grantStarter(s, data, info, def, 'elias', 'chain_lightning'), true);
  assert.deepEqual(startableWeapons(data, def, s.tree), ['chain_lightning']);
  assert.ok(isAwake(s, 'elias') && !isAwake(s, 'wren'));
  assert.deepEqual(s.notes.starter, { hero: 'elias', weapon: 'chain_lightning' });
  const t = sanitize(s);
  assert.deepEqual(Object.keys(t.tree).sort(), starterNodes(info, 'chain_lightning').sort(), 'the grant survives sanitize');
  for (const bad of [['nope', 'holy_orbit'], ['wren', 'nope'], ['__proto__', 'holy_orbit']]) assert.equal(grantStarter(sanitize(defaultSave()), data, info, def, ...bad), false);
});

test('bankRun: Bond XP and a keepsake bank once with the gold (one save write); 5 keepsakes wake a hero; never for the hero in play or an awake one', () => {
  const st = mem();
  const store = new SaveStore(st);
  grantStarter(store.data, data, info, def, 'wren', 'ghost_wolves');
  store.saveNow();
  const w0 = st.writes;
  const run = { outcome: 'defeat', time: 600, level: 20, kills: 1000, gold: 50, chests: 1, character: 'wren', startWeapon: 'ghost_wolves', keepsake: 'elias', weapons: [{ id: 'ghost_wolves' }] };
  const b = store.bankRun(run, { def, data, unlockedTiers: [] });
  assert.equal(st.writes - w0, 2, 'one save write per run (+ its backup copy)');
  assert.deepEqual(b.bond, { hero: 'wren', gain: 40 + 15 + 30, from: 0, to: 0, xp: 85, keepsake: { id: 'elias', count: 1, need: 5, woke: false } });
  assert.equal(store.data.stats.startWeapon.ghost_wolves, 1);
  assert.equal(store.data.stats.chests, 1, 'chests are banked (the old line sat inside a comment)');
  for (let i = 0; i < 4; i++) store.bankRun(run, { def, data, unlockedTiers: [] });
  assert.ok(isAwake(store.data, 'elias'), 'five keepsakes wake Elias');
  assert.equal(store.data.chars.elias.keep, 0);
  const more = store.bankRun({ ...run, keepsake: 'elias' }, { def, data, unlockedTiers: [] });
  assert.equal(more.bond.keepsake, null, 'an awake hero takes no keepsakes');
  assert.equal(store.bankRun({ ...run, keepsake: 'wren' }, { def, data, unlockedTiers: [] }).bond.keepsake, null, 'never the hero in play');
  assert.equal(store.bankRun({ ...run, keepsake: '__proto__', character: '<x>' }, { def, data, unlockedTiers: [] }).bond.hero, null);
  assert.equal(levelOf(D, store.data.chars.wren.xp), bondLevel(store.data, data, 'wren'));
});

test('keepsake eligibility: sleeping heroes whose hint is met; the startWeapon condition reads runs started with a spirit', () => {
  const s = sanitize(defaultSave());
  grantStarter(s, data, info, def, 'wren', 'ghost_wolves');
  assert.deepEqual(keepsakeEligible(s, data, def), []);
  s.stats.killsByEnemy.root_crawler = 400;
  assert.deepEqual(keepsakeEligible(s, data, def), ['elias']);
  s.chars.elias = { xp: 0, keep: 0, woke: true };
  assert.deepEqual(keepsakeEligible(s, data, def), []);
  const c = { t: 'startWeapon', id: 'holy_orbit', n: 8 };
  assert.deepEqual(conditionProgress(c, { startWeapon: { holy_orbit: 3 } }, def, data).lines[0], { text: 'Start 8 runs with Holy Orbit', cur: 3, goal: 8, done: false });
  assert.equal(def.nodes.gt_vesper_tide.unlock.of[1].t, 'startWeapon');
});

// ---------------------------------------------------------------- tree step 4: hero lanterns retire (tombstones), exact refunds
const v3disk = (ownLive, ownHero, creep = {}, extra = {}) => {
  const t = encodeTree(ownLive, def, 3);
  const bits = (ids, order) => { let b = 0; for (const id of ids) b |= 1 << order.indexOf(id); return b ? b64urlEncode([b]) : null; };
  const wr = bits(ownHero.filter((i) => i.startsWith('ch_wren') || i.startsWith('wr_')), ['ch_wren', 'wr_grip', 'wr_spark']);
  const el = bits(ownHero.filter((i) => i === 'ch_elias' || i.startsWith('el_')), ['ch_elias', 'el_wheel', 'el_lamp']);
  t.o = { ...t.o, ...(wr ? { wr } : {}), ...(el ? { el } : {}) };
  return JSON.stringify({ ...defaultSave(), gold: 1000, stats: { ...defaultSave().stats, runs: 20, charsUsed: { wren: 12, elias: 8 } }, tree: t, creep, ...extra, chars: undefined });
};

test('step 4: the raw decode still sees the retired hero lanterns (tombstones keep their fragment slots)', () => {
  const disk = JSON.parse(v3disk({}, ['ch_wren', 'wr_spark', 'el_lamp']));
  assert.deepEqual(Object.keys(decodeTreeRaw(disk.tree, def).tree).sort(), ['ch_wren', 'el_lamp', 'wr_spark']);
  for (const id of Object.keys(PRICES_V4)) assert.ok(def.retiredIds[id] && !def.nodes[id], id);
});

test('step 4: owned hero lanterns are refunded at the price paid (rising price bounded), dropped, and the notice shows once', () => {
  const r = parseSave(v3disk({}, ['ch_wren', 'wr_grip', 'ch_elias'], { ch_wren: 0, wr_grip: 1, ch_elias: 9999 }));
  assert.ok(r.ok);
  const s = r.save;
  for (const id of Object.keys(PRICES_V4)) assert.equal(s.tree[id], undefined, id);
  // wr_grip was bought after ch_wren (1 step); ch_elias's forged 9999 steps are bounded by what was possible (0 other orbit lanterns owned)
  const want = frozenCost(PRICES_V4.ch_wren, 1, 0).gold + frozenCost(PRICES_V4.wr_grip, 1, 1).gold + frozenCost(PRICES_V4.ch_elias, 1, 0).gold;
  assert.equal(want, 600 + 970 + 600);
  assert.equal(s.gold, 1000 + want);
  assert.deepEqual(s.notes.regrowth, { gold: want, shards: 0, nodes: 3 });
  // a save written at tree version 4 never runs it again
  const again = parseSave(JSON.stringify(serializeSave(s))).save;
  assert.equal(again.gold, s.gold);
});

test('step 4: a live lantern bought after a hero lantern keeps an exact refund (its stored step above the new bound is paid back now)', () => {
  // history: gt_ghost_wolves (flat) -> su_call (0 steps) -> ch_wren (1 step) -> wf_fang (2 steps)
  const own = { su_bond: 1, su_call: 1, wf_fang: 1 };
  const creep = { su_call: 0, ch_wren: 1, wf_fang: 2 };
  const paid = costFor(def.nodes.su_bond, 1, 0, def.creep).gold + costFor(def.nodes.su_call, 1, 0, def.creep).gold + frozenCost(PRICES_V4.ch_wren, 1, 1).gold + costFor(def.nodes.wf_fang, 1, 2, def.creep).gold;
  const s = parseSave(v3disk(own, ['ch_wren'], creep)).save;
  assert.equal(s.tree.wf_fang, 1);
  assert.equal(s.creep.wf_fang, 1, 'clamped to the purchases still owned');
  const gold0 = s.gold;
  respec(s, def);
  assert.equal(s.gold - 1000, paid, `everything paid comes back: ${s.gold - 1000} vs ${paid} (after ${gold0 - 1000} at migration)`);
});

test('step 4 hostile: junk ranks, prototype keys, NaN creep, non-object trees', () => {
  assert.deepEqual(retireHeroLanterns(null, { def }), { tree: {}, gold: 0, shards: 0, creep: {}, refunded: 0 });
  const raw = JSON.parse('{"__proto__":{"ch_wren":1},"ch_wren":"7","wr_grip":-1,"el_wheel":true,"el_lamp":1e99,"wf_fang":1}');
  const r = retireHeroLanterns(raw, { def, creep: JSON.parse('{"__proto__":5,"el_lamp":"x","el_wheel":NaN}'.replace('NaN', 'null')) });
  assert.deepEqual(Object.keys(r.tree), ['wf_fang']);
  assert.equal(r.gold, 900 + 400, 'el_wheel (true = rank 1) + el_lamp (rank clamped to 1); "7" and -1 are not ranks');
  assert.equal({}.ch_wren, undefined);
});

test('the live tree compiles with the retired hero lanterns and a third hero needs no step (additive)', () => {
  assert.equal(def.treeVersion, 4);
  assert.doesNotThrow(() => compileTree(composeTree(readTreeFiles(), data).live, data));
});
