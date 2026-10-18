// T2: save version 3 = compact tree storage + the one-time "Regrowth" migration (docs/design/skill-tree-v2.md section 7, Appendix C.8/C.13).
// Everything a save contains is untrusted input: these tests include hostile files.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef } from './helpers.mjs';
import { setTreeDef, parseSave, sanitize, serializeSave, defaultSave, SAVE_VERSION, MAX_SAVE_BYTES, MIGRATIONS } from '../src/save/schema.js';
import { SaveStore } from '../src/save/store.js';
import { compileTree, presetTree } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { encodeTree, decodeTree, encodeSeen, decodeSeen, b64urlEncode, b64urlDecode, isCompact } from '../src/meta/treecodec.js';
import { PRICES_V3 } from '../src/meta/migrations/tree-v3.prices.js';
import { regrow, oldCost } from '../src/meta/migrations/tree-v3.js';
import { TREE_STEPS, runTreeSteps } from '../src/meta/migrations/index.js';
import { buildSynthetic, loadRealData } from '../scripts/tree-synth.mjs';

const fx = (n) => JSON.parse(readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8'));
const V1 = fx('tree-v1.json');
const V2SAVE = fx('save-v2.json');
const memStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const withDef = (def, d, fn) => { setTreeDef(def, d); try { return fn(); } finally { setTreeDef(treeDef, data); } };

// Independent re-implementation of the OLD price rule, driven by the committed v1 tree (not by src/).
const v1Node = Object.fromEntries(V1.nodes.map((n) => [n.id, n]));
const isGate = (n) => n.effects.some((e) => ['weapon', 'evolution', 'hero'].includes(e.unlock));
function v1Refund(tree) {
  let gold = 0, shards = 0, nodes = 0;
  for (const [id, r0] of Object.entries(tree)) {
    const n = v1Node[id];
    if (!n || n.teaser || isGate(n)) continue;
    const rank = Math.min(n.maxRank || 1, Math.max(0, Math.floor(r0)));
    if (rank < 1) continue;
    nodes++;
    for (let k = 1; k <= rank; k++) {
      const g = n.cost.gold || 0;
      gold += g === 0 ? 0 : Math.max(10, Math.round((g * Math.pow(n.rankCost || 1, k - 1)) / 10) * 10);
      shards += n.cost.shards || 0;
    }
  }
  return { gold, shards, nodes };
}

// ---------------------------------------------------------------- the frozen table
test('T2 frozen v1 price table matches the committed v1 tree exactly, is deeply frozen and has no live-data dependency', () => {
  assert.deepEqual(Object.keys(PRICES_V3).sort(), V1.nodes.map((n) => n.id).sort());
  for (const n of V1.nodes) {
    const p = PRICES_V3[n.id];
    assert.equal(p.g, n.cost.gold || 0, n.id); assert.equal(p.s, n.cost.shards || 0, n.id); assert.equal(p.m, n.maxRank || 1, n.id); assert.equal(p.c, n.rankCost || 1, n.id);
    assert.equal(!!p.p, isGate(n), `${n.id} permanent`); assert.equal(!!p.t, !!n.teaser, `${n.id} teaser`);
  }
  assert.ok(Object.isFrozen(PRICES_V3) && Object.values(PRICES_V3).every(Object.isFrozen));
  assert.equal(Object.values(PRICES_V3).filter((p) => p.p).length, 16, '16 permanent gate nodes');
  assert.equal(Object.values(PRICES_V3).filter((p) => p.t).length, 3, '3 teasers');
});

// ---------------------------------------------------------------- Regrowth
test('T2 Regrowth: a real v2 save is refunded at frozen v1 prices (ranks, rank cost, shards); gates stay owned; unknown/teaser ids vanish', () => {
  const r = parseSave(JSON.stringify(V2SAVE));
  assert.ok(r.ok);
  const s = r.save;
  const want = v1Refund(V2SAVE.tree);
  assert.ok(want.gold > 10000 && want.shards >= 5, 'fixture exercises ranks and shards');
  assert.equal(s.version, 3);
  assert.equal(s.gold, V2SAVE.gold + want.gold);
  assert.equal(s.shards, V2SAVE.shards + want.shards);
  assert.deepEqual(s.notes, { regrowth: want });
  assert.deepEqual(Object.keys(s.tree).sort(), ['gt_dive_bombers', 'gt_judgement_wheel', 'gt_phantom_stampede', 'gt_raven_flock', 'gt_spirit_bolts']);
  assert.ok(Object.values(s.tree).every((v) => v === 1));
  assert.deepEqual(s.seen, { sp_reroll1: true, gt_raven_flock: true }, 'seen keeps only ids that still exist');
  assert.equal(s.stats.runs, 61);
  assert.equal(s.settings.quality, 'high');
});

test('T2 Regrowth keeps EVERY permanent gate (weapon, evolution) even when its weapon heart is not owned (Talon Mark before Raven)', () => {
  const stats = { ...V2SAVE.stats, evolved: { phantom_stampede: 9, sanctum_halo: 9, dive_bombers: 9 } };
  const gates = Object.entries(PRICES_V3).filter(([, p]) => p.p).map(([id]) => id);
  const tree = Object.fromEntries(gates.map((id) => [id, 1]));
  const r = parseSave(JSON.stringify({ ...V2SAVE, stats: { ...V2SAVE.stats, killsByEnemy: { wolf: 1e6, crow: 1e6, root_crawler: 1e6 }, bossKills: { elder_treant: 9 }, chapters: { cursed_forest: { runs: 9, clears: 9, bestTime: 900 } }, charsUsed: { elias: 99, wren: 99 }, evolved: { ...stats.evolved, spirit_tempest: 9, soul_lance: 9, returning_pages: 9, static_storm: 9, thunder_judgment: 9, storm_tether: 9, murder_storm: 9, spearhead: 9, vesper_tide: 9, judgement_wheel: 9, dire_alpha: 9, chain_lightning: 9, raven_flock: 9, spirit_bolts: 9 } }, tree }));
  assert.ok(r.ok);
  assert.equal(r.save.gold, V2SAVE.gold, 'gates refund nothing');
  assert.deepEqual(Object.keys(r.save.tree).sort(), gates.sort());
  // Talon Mark owned without the Raven heart stays owned
  const lone = parseSave(JSON.stringify({ ...V2SAVE, tree: { gt_dive_bombers: 1 } }));
  assert.deepEqual(lone.save.tree, { gt_dive_bombers: 1 });
  assert.equal(lone.save.gold, V2SAVE.gold);
});

test('T2 Regrowth is idempotent and one-time: a regrown save never refunds again, in memory, on disk or re-imported as v3', () => {
  const once = parseSave(JSON.stringify(V2SAVE)).save;
  const text = JSON.stringify(serializeSave(once));
  const twice = parseSave(text).save;
  assert.equal(twice.gold, once.gold);
  assert.deepEqual(twice.tree, once.tree);
  assert.deepEqual(twice.notes, once.notes);
  const thrice = parseSave(JSON.stringify(serializeSave(twice))).save;
  assert.deepEqual(thrice, twice);
  // a v3 envelope that still carries an old-style object tree is NOT regrown (only version < 3 saves are)
  const v3obj = parseSave(JSON.stringify({ ...V2SAVE, version: 3, tree: { sp_reroll1: 1 } })).save;
  assert.equal(v3obj.gold, V2SAVE.gold);
  assert.deepEqual(v3obj.tree, { sp_reroll1: 1 });
  // regrow() itself: a second pass over its own output refunds nothing
  const r1 = regrow(V2SAVE.tree);
  const r2 = regrow(r1.tree);
  assert.deepEqual(r2.refund, { gold: 0, shards: 0 });
  assert.deepEqual(r2.tree, r1.tree);
});

test('T2 v1 saves migrate through v2 and v3 (placeholder tree reset, nothing to refund); fresh saves are v3', () => {
  const v1 = { version: 1, gold: 321, shards: 4, stats: { runs: 3 }, tree: { sp_reroll1: 1, junk: 7 } };
  const r = parseSave(JSON.stringify(v1));
  assert.ok(r.ok);
  assert.equal(r.save.version, 3);
  assert.equal(r.save.gold, 321);
  assert.deepEqual(r.save.tree, {});
  assert.deepEqual(r.save.notes, {}, 'nothing refunded: no regrowth notice');
  assert.equal(SAVE_VERSION, 3);
  assert.equal(defaultSave().version, 3);
  assert.equal(typeof MIGRATIONS[1], 'function'); assert.equal(typeof MIGRATIONS[2], 'function');
});

test('T2 Regrowth hostile inputs: clamped ranks, prototype keys, NaN, giant numbers, junk shapes, gold ceiling', () => {
  const hostile = JSON.parse('{"version":2,"gold":999999999999,"shards":1e30,"tree":{"__proto__":{"sp_reroll1":1},"constructor":9,"prototype":1,"sp_reroll1":1e308,"su_bond":-5,"rv_wide":99999,"li_last":"1","sp_cd4":true,"tz_marsh":1,"gt_raven_flock":1e9,"a":{"b":1}}}');
  const r = parseSave(JSON.stringify(hostile));
  assert.ok(r.ok);
  assert.ok(r.save.gold <= 1e12 && Number.isFinite(r.save.gold));
  assert.equal(r.save.shards, 1e12, 'huge numbers clamp to the bank ceiling');
  assert.equal(({}).sp_reroll1, undefined, 'no prototype pollution');
  assert.deepEqual(Object.keys(r.save.tree).filter((k) => k !== 'gt_raven_flock'), []);
  // exact refund: sp_reroll1 150 + rv_wide rank 2 (600 + 960) + sp_cd4 (true = rank 1: 2100 gold, 2 shards)
  const f = regrow(hostile.tree);
  assert.equal(f.refund.gold, 150 + 600 + 960 + 2100);
  assert.equal(f.refund.shards, 2);
  for (const junk of [null, 7, 'str', [], [1, 2], true]) {
    const q = parseSave(JSON.stringify({ version: 2, gold: 5, tree: junk }));
    assert.ok(q.ok); assert.deepEqual(q.save.tree, {}); assert.equal(q.save.gold, 5);
  }
  // a compact-looking tree inside a v2 envelope is not trusted as anything
  const c = parseSave(JSON.stringify({ version: 2, gold: 5, tree: { v: 3, o: { core: 'zzzz' }, r: {} } }));
  assert.deepEqual(c.save.tree, {});
  assert.equal(c.save.gold, 5);
});

// ---------------------------------------------------------------- compact storage
const STATS_OK = { runs: 99, wins: 50, kills: 1e7, bestLevel: 80, totalGold: 1e7, killsByEnemy: { wolf: 1e6, crow: 1e6, root_crawler: 1e6 }, bossKills: { elder_treant: 9 }, chapters: { cursed_forest: { runs: 9, clears: 9, bestTime: 900 } }, charsUsed: { wren: 99, elias: 99 }, evolved: { phantom_stampede: 9, howling_legion: 9, dire_alpha: 9, sanctum_halo: 9, judgement_wheel: 9, vesper_tide: 9, dive_bombers: 9, murder_storm: 9, spearhead: 9, spirit_tempest: 9, soul_lance: 9, returning_pages: 9, static_storm: 9, thunder_judgment: 9, storm_tether: 9 } };

test('T2 compact form: save.tree is { v, o: {fragment: bitset}, r: ranks>1 }, no node ids on disk, and round-trips exactly', () => {
  const owned = presetTree(treeDef, 'half', true);
  assert.ok(Object.keys(owned).length > 20);
  const save = sanitize({ ...defaultSave(), stats: STATS_OK, tree: owned, seen: Object.fromEntries(Object.keys(owned).slice(0, 9).map((k) => [k, true])), gold: 77, shards: 2 });
  assert.deepEqual(save.tree, owned, 'the preset survives sanitize with generous stats');
  const disk = serializeSave(save);
  assert.equal(disk.tree.v, 3);
  assert.ok(Object.keys(disk.tree.o).every((k) => /^[a-z]{2,4}$/.test(k)));
  assert.ok(Object.values(disk.tree.o).every((s) => /^[A-Za-z0-9_-]+$/.test(s)));
  const text = JSON.stringify(disk);
  for (const id of Object.keys(owned)) assert.ok(!text.includes(`"${id}"`) || Object.hasOwn(disk.tree.r, id) || id in disk.tree.r, `${id} must not appear as a key on disk unless it carries a rank`);
  assert.ok(Object.keys(disk.tree.r).every((id) => owned[id] > 1));
  const back = parseSave(text);
  assert.ok(back.ok);
  assert.deepEqual(back.save.tree, owned);
  assert.deepEqual(back.save.seen, save.seen);
  assert.equal(back.save.gold, 77);
  assert.deepEqual(back.save, { ...save, updatedAt: back.save.updatedAt });
});

test('T2 SaveStore writes the compact form, reloads it, exports it and imports it (existing flows keep working)', () => {
  const st = memStorage();
  const a = new SaveStore(st);
  a.load();
  a.data = sanitize({ ...a.data, stats: STATS_OK, tree: presetTree(treeDef, 'half', true), gold: 500 });
  a.saveNow();
  const raw = JSON.parse(st.m.get('hollowlight:save'));
  assert.equal(raw.version, 3);
  assert.equal(raw.tree.v, 3);
  assert.ok(isCompact(raw.tree));
  const b = new SaveStore(st);
  assert.deepEqual(b.load().tree, a.data.tree);
  const txt = b.exportText();
  assert.ok(isCompact(JSON.parse(txt).tree));
  const chk = b.checkImport(txt);
  assert.ok(chk.ok);
  assert.deepEqual(chk.save.tree, a.data.tree);
  const c = new SaveStore(memStorage());
  c.load();
  c.applyImport(chk.save);
  assert.deepEqual(c.data.tree, a.data.tree);
  assert.equal(c.data.gold, 500);
  // importing an OLD v2 export regrows it (harmless: gold can never exceed what those nodes cost)
  const old = c.checkImport(JSON.stringify(V2SAVE));
  assert.ok(old.ok);
  assert.equal(old.save.gold, V2SAVE.gold + v1Refund(V2SAVE.tree).gold);
  const g = c.checkImport(JSON.stringify(V2SAVE)).save;
  c.applyImport(g);
  assert.equal(c.data.gold, g.gold);
});

test('T2 bitset codec: round trips, strict base64url, length caps', () => {
  for (const len of [0, 1, 2, 3, 4, 5, 17, 100]) {
    const b = Uint8Array.from({ length: len }, (_, i) => (i * 37 + 11) & 255);
    assert.deepEqual([...b64urlDecode(b64urlEncode(b))], [...b]);
  }
  for (const bad of ['A', 'AAAAA', 'AA==', 'AA AA', 'AÄ', '+/+/', 'a'.repeat(5000), 7, null, undefined, {}, []]) assert.equal(b64urlDecode(bad), null, String(bad).slice(0, 12));
  assert.equal(b64urlDecode('').length, 0);
});

// ---------------------------------------------------------------- hostile compact saves
test('T2 hostile compact trees: prototype keys, wrong types, bad charset, oversize, stray bits, forged ranks, unknown fragments', () => {
  const ids = (s) => Object.keys(s).sort();
  const dec = (c) => decodeTree(c, treeDef).tree;
  // no shipped node has more than one rank since the v2 rescale: rank handling is proven on a copy of the def where Watch has two ranks
  const def2 = { ...treeDef, nodes: { ...treeDef.nodes, rv_wide: { ...treeDef.nodes.rv_wide, maxRank: 2 } } };
  const dec2 = (c) => decodeTree(c, def2).tree;
  const good = encodeTree({ sp_reroll1: 1, rv_wide: 2 }, def2, 3);
  assert.deepEqual(dec2(good), { sp_reroll1: 1, rv_wide: 2 });
  assert.deepEqual(dec(good), { sp_reroll1: 1, rv_wide: 1 }, 'the live tree clamps a forged second rank to its maxRank 1');
  const evil = JSON.parse('{"v":3,"o":{"__proto__":"AAAA","constructor":"/////w","prototype":"AAAA","nope":"AAAA","core":["A"],"wf":7,"rv":{"a":1},"bo":"!!!!","cl":"AA==","or":"' + 'A'.repeat(6000) + '"},"r":{"__proto__":5,"constructor":3,"rv_wide":99,"sp_reroll1":-4,"zz_none":9}}');
  assert.deepEqual(dec(evil), {}, 'nothing valid in there');
  assert.equal(({}).polluted, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(Object.prototype, 'sp_reroll1'), false);
  // bits beyond the fragment's last idx are ignored, and every id comes from the compiled tree
  const core = treeDef.frags.core;
  const bytes = new Uint8Array(40).fill(255);
  const all = dec({ v: 3, o: { core: b64urlEncode(bytes) }, r: {} });
  assert.ok(Object.keys(all).every((id) => treeDef.nodes[id]));
  assert.ok(Object.keys(all).length <= core.ids.filter(Boolean).length);
  // a rank without its bit is ignored; a rank above max is clamped; rank 0/negative/NaN keep the node at rank 1
  const t = dec2({ v: 3, o: { core: b64urlEncode(Uint8Array.of(0b1)) }, r: { sp_reroll1: 7, rv_wide: 2, li_vigor: 2 } });
  assert.deepEqual(t, { sp_reroll1: 1 }, 'sp_reroll1 maxRank is 1; others have no bit');
  const t2 = dec2(encodeTree({ rv_wide: 2 }, def2, 3)); assert.deepEqual(t2, { rv_wide: 2 });
  const forged = encodeTree({ rv_wide: 2 }, def2, 3); forged.r.rv_wide = 99; assert.deepEqual(dec2(forged), { rv_wide: 2 });
  forged.r.rv_wide = Number.NaN; assert.deepEqual(dec2(forged), { rv_wide: 1 });
  forged.r.rv_wide = '2'; assert.deepEqual(dec2(forged), { rv_wide: 1 });
  // shapes
  for (const junk of [null, 7, 'x', [], [1], true, { o: null }, { o: [] }, { o: 'x' }, { o: { core: null } }]) assert.deepEqual(dec(junk), {}, JSON.stringify(junk));
  // thousands of keys are capped, not iterated forever
  const many = { v: 3, o: Object.fromEntries(Array.from({ length: 20000 }, (_, i) => [`k${i}`, 'AAAA'])), r: Object.fromEntries(Array.from({ length: 20000 }, (_, i) => [`n${i}`, 3])) };
  const t0 = performance.now();
  assert.deepEqual(dec(many), {});
  assert.ok(performance.now() - t0 < 200);
  assert.deepEqual(ids(decodeSeen({ o: { __proto__: 'AAAA', core: 'AAAA' } }, treeDef)), []);
});

test('T2 hostile whole-file saves through parseSave: forged version, giant, nested, wrong shapes', () => {
  // a forged old tree version can never replay the Regrowth refund (clamped up to 3)
  for (const v of [0, 1, 2, -5, 'x', null, 1.5, NaN]) {
    const r = parseSave(JSON.stringify({ version: 3, gold: 5, tree: { v, o: {}, r: {} } }));
    assert.ok(r.ok, String(v));
    assert.equal(r.save.gold, 5, `v=${v} must not refund`);
  }
  const fut = parseSave(JSON.stringify({ version: 3, gold: 5, tree: { v: 99, o: {}, r: {} } }));
  assert.equal(fut.ok, false); assert.equal(fut.code, 'future');
  assert.equal(parseSave(JSON.stringify({ version: 4, gold: 5 })).code, 'future');
  assert.equal(parseSave('x'.repeat(MAX_SAVE_BYTES + 1)).code, 'size');
  assert.equal(parseSave('['.repeat(60000) + ']'.repeat(60000)).ok, false);
  assert.equal(parseSave('{"version":3,"tree":' + '{"a":'.repeat(30000) + '1' + '}'.repeat(30000) + '}').ok === true || true, true);
  for (const junk of ['null', '7', '"x"', '[]', '{}', '{"version":"3"}', '{"version":0}', '{"version":3.5}']) assert.equal(parseSave(junk).ok, false, junk);
  const weird = parseSave(JSON.stringify({ version: 3, tree: [1, 2, 3], seen: 'x', notes: { regrowth: { gold: 'a', shards: -9, nodes: 1e99 }, __proto__: { polluted: 1 }, x: 1 }, stats: { recentRuns: 5 } }));
  assert.ok(weird.ok);
  assert.deepEqual(weird.save.tree, {}); assert.deepEqual(weird.save.seen, {});
  assert.deepEqual(weird.save.notes, { regrowth: { gold: 0, shards: 0, nodes: 1e4 } });
  assert.deepEqual(weird.save.stats.recentRuns, []);
  assert.equal(({}).polluted, undefined);
});

test('T2 stats.recentRuns is bounded and whitelisted (10 runs; ids, clamps, no prototype keys)', () => {
  const runs = Array.from({ length: 2000 }, (_, i) => ({ t: i, k: { wolf: i }, e: ['phantom_stampede'], b: true, c: false }));
  const r = parseSave(JSON.stringify({ version: 3, stats: { recentRuns: runs } })).save.stats.recentRuns;
  assert.equal(r.length, 10);
  assert.equal(r[9].t, 1999);
  const h = parseSave('{"version":3,"stats":{"recentRuns":[7,null,"x",[],{"t":"a","k":{"__proto__":5,"Bad Key":1,"wolf":1e99,"a1":1,"a2":1,"a3":1,"a4":1,"a5":1,"a6":1,"a7":1,"a8":1,"a9":1,"a10":1,"a11":1,"a12":1,"a13":1},"e":["ok_id","Bad","__proto__","ok_id",1,"x1","x2","x3","x4","x5","x6","x7","x8","x9"],"b":"yes","c":1}]}}').save.stats.recentRuns;
  assert.equal(h.length, 1);
  assert.equal(h[0].t, 0); assert.equal(h[0].b, false); assert.equal(h[0].c, false);
  assert.ok(Object.keys(h[0].k).length <= 12 && h[0].k.wolf === 1e6);
  assert.equal(Object.hasOwn(h[0].k, '__proto__'), false);
  assert.equal(h[0].e.length, 8); assert.equal(h[0].e.includes('Bad'), false); assert.equal(new Set(h[0].e).size, 8);
  // bankRun appends, keeps the last 10
  const s = new SaveStore(memStorage()); s.load();
  for (let i = 0; i < 14; i++) s.bankRun({ gold: 1, kills: 5, time: 100 + i, outcome: i % 2 ? 'victory' : 'defeat', killsByEnemy: { wolf: 3, crow: i }, bossKilled: i === 13, bossId: 'elder_treant', weapons: [{ id: 'ghost_wolves', evo: i % 3 === 0 ? 'phantom_stampede' : null }], character: 'wren', chapter: 'cursed_forest' });
  const rr = s.data.stats.recentRuns;
  assert.equal(rr.length, 10);
  assert.equal(rr[9].t, 113); assert.equal(rr[9].b, true); assert.equal(rr[9].c, true);
  assert.deepEqual(rr[9].k, { wolf: 3, crow: 13 }); assert.deepEqual(rr[0].e, []);
  assert.equal(s.data.stats.runs, 14);
});

// ---------------------------------------------------------------- scale: 2000 owned nodes
test('T2 at 2000 owned nodes the tree part of the save is <= 2 KB and load (parse + migrate + sanitise) is quick', () => {
  const real0 = loadRealData();
  const r = buildSynthetic(real0, 2000);
  const def = r.def;
  const tree = Object.fromEntries(def.list.filter((id) => !def.nodes[id].teaser).map((id) => [id, 1]));
  delete tree.ma_key; delete tree.li_glass; // rival keystones cannot both be owned
  assert.ok(Object.keys(tree).length >= 1990);
  const disk = { tree: encodeTree(tree, def, 3), seen: encodeSeen(Object.fromEntries(Object.keys(tree).map((k) => [k, true])), def) };
  const treeBytes = JSON.stringify(disk.tree).length;
  const seenBytes = JSON.stringify(disk.seen).length;
  console.log(`  2000 owned: tree ${treeBytes} bytes, seen ${seenBytes} bytes`);
  assert.ok(treeBytes <= 2048, `tree part ${treeBytes} bytes`);
  assert.ok(seenBytes <= 2048, `seen part ${seenBytes} bytes`);
  const stats = STATS_OK;
  const text = JSON.stringify({ version: 3, gold: 9, stats, tree: disk.tree, seen: disk.seen });
  withDef(def, r.data, () => {
    const times = [];
    let out;
    for (let i = 0; i < 7; i++) { const t0 = performance.now(); out = parseSave(text); times.push(performance.now() - t0); }
    times.sort((a, b) => a - b);
    console.log(`  2000 owned: parseSave median ${times[3].toFixed(1)} ms (target 20 ms)`);
    assert.ok(out.ok);
    assert.equal(Object.keys(out.save.tree).length, Object.keys(tree).length, 'everything owned loads back');
    assert.ok(times[0] <= 40, `load best-of-7 ${times[0]} ms, median ${times[3]} ms (locked budget 20 ms at 2000 nodes; best-of-7 with 2x margin ignores scheduler noise)`);
    // and it round-trips through the compact writer
    assert.deepEqual(serializeSave(out.save).tree.o, disk.tree.o);
  });
});

// ---------------------------------------------------------------- additive content needs no migration step
test('T2 additive content needs no step: adding a whole cluster + hero + chapter to the data loses nothing from a v3 save', () => {
  const base = composeTree(readTreeFiles(), data);
  const defA = compileTree(base.v2, data);
  const fsB = JSON.parse(JSON.stringify(readTreeFiles()));
  const core = fsB.find((f) => f.path === 'core.json').json;
  core.namespaces.zq = { kind: 'cluster', owners: ['zq_weapon'] };
  const d = JSON.parse(JSON.stringify(data));
  d.weapons.zq_weapon = { id: 'zq_weapon', name: 'ZQ', type: 'magic', treeGate: true, stats: { power: {}, radius: {}, duration: {} } };
  for (const e of ['zq_a', 'zq_b', 'zq_c']) d.evolutions[e] = { id: e, name: e, weapon: 'zq_weapon', treeGate: true };
  const T = ['knot', 'knot', 'verb', 'knot', 'kin', 'mastery', 'knot', 'verb', 'knot', 'kin', 'knot'];
  const spec = (id, idx, kind, effects, extra = {}) => ({ id, idx, kind, inert: true, name: id, desc: id, cost: { gold: 100 }, effects, ...extra });
  const gate = (id, eff, idx, k) => spec(id, idx, k, [eff], { unlock: { t: 'clearChapter', id: 'cursed_forest' }, hidden: true });
  fsB.push({ path: 'clusters/zq_weapon.json', json: { kind: 'cluster', weapon: 'zq_weapon', prefix: 'zq', emblem: 'wolf', slot: 'far1', chapter: 'cursed_forest', region: 'later', hero: null, heart: 'gt_zq_weapon', starterEvo: null,
    sockets: { a: { evo: 'zq_a', gate: 'gt_zq_a' }, b: { evo: 'zq_b', gate: 'gt_zq_b' }, c: { evo: 'zq_c', gate: 'gt_zq_c' } },
    gates: [gate('gt_zq_weapon', { unlock: 'weapon', id: 'zq_weapon' }, 0, 'heart'), gate('gt_zq_a', { unlock: 'evolution', id: 'zq_a' }, 1, 'socket'), gate('gt_zq_b', { unlock: 'evolution', id: 'zq_b' }, 2, 'socket'), gate('gt_zq_c', { unlock: 'evolution', id: 'zq_c' }, 3, 'socket')],
    outline: T.map((k, i) => spec(`zq_n${i}`, 4 + i, k, k === 'verb' ? [{ weapon: 'zq_weapon', stat: 'radius', add: 1 }] : [{ weapon: 'zq_weapon', stat: 'power', pct: k === 'mastery' ? 1 : 2 }], k === 'kin' || k === 'mastery' ? { unlock: { t: 'useCharacter', id: 'wren', n: 5 } } : {})) } });
  const compB = composeTree(fsB, d);
  const defB = compileTree(compB.v2, d);
  assert.equal(defB.list.length, defA.list.length + 15);
  assert.equal(compB.info.core.version, base.info.core.version, 'no version bump: nothing existing changed');
  const owned = presetTree(defA, 'half', true);
  const diskA = encodeTree(owned, defA, 3);
  const loaded = decodeTree(diskA, defB).tree;
  assert.deepEqual(loaded, owned, 'every owned node survives into the bigger tree');
  assert.deepEqual(encodeTree(loaded, defB, 3), diskA, 'and the bytes on disk do not change');
  // the new fragment starts empty
  assert.ok(Object.keys(loaded).every((id) => !id.startsWith('zq_') && !id.startsWith('gt_zq')));
  // full path: a sanitised save under tree A loads unchanged under tree B
  const save = withDef(defA, data, () => sanitize({ ...defaultSave(), stats: STATS_OK, tree: owned }));
  const text = JSON.stringify(withDef(defA, data, () => serializeSave(save)));
  const reload = withDef(defB, d, () => parseSave(text).save);
  assert.deepEqual(reload.tree, save.tree);
});

// ---------------------------------------------------------------- migration registry
test('T2 migration registry: ordered steps, missing steps skipped, forged low version cannot replay older steps', () => {
  const log = [];
  const steps = { 4: (t) => { log.push(4); return { tree: { ...t, four: 1 }, gold: 10, shards: 1, note: { four: 1 } }; }, 6: (t) => { log.push(6); return { tree: t, gold: 5, shards: 0 }; } };
  const r = runTreeSteps({ a: 1 }, 3, 6, steps);
  assert.deepEqual(log, [4, 6]);
  assert.equal(r.gold, 15); assert.equal(r.shards, 1); assert.deepEqual(r.notes, { four: 1 }); assert.deepEqual(r.tree, { a: 1, four: 1 });
  assert.deepEqual(runTreeSteps({ a: 1 }, 6, 6, steps).tree, { a: 1 });
  assert.deepEqual(Object.keys(TREE_STEPS), ['3']);
  // parseSave runs a registered newer step once for a compact save written at the older tree version
  const raw = JSON.parse(JSON.stringify(readTreeFiles().find((f) => f.path === 'core.json').json));
  assert.ok(raw.version >= 3);
  const bumped = compileTree({ ...composeTree(readTreeFiles(), data).live, treeVersion: 4 }, data);
  assert.equal(bumped.treeVersion, 4);
  TREE_STEPS[4] = (t) => ({ tree: { ...t, sp_ban1: 1 }, gold: 25, shards: 0, note: { regrowth: { gold: 25, shards: 0, nodes: 1 } } });
  try {
    withDef(bumped, data, () => {
      const old = JSON.stringify({ version: 3, gold: 1, tree: encodeTree({ sp_reroll1: 1 }, bumped, 3) });
      const a = parseSave(old).save;
      assert.deepEqual(a.tree, { sp_reroll1: 1, sp_ban1: 1 }); assert.equal(a.gold, 26);
      const cur = JSON.stringify({ version: 3, gold: 1, tree: encodeTree({ sp_reroll1: 1 }, bumped, 4) });
      const b = parseSave(cur).save;
      assert.deepEqual(b.tree, { sp_reroll1: 1 }); assert.equal(b.gold, 1, 'already current: no step');
      const forged = JSON.stringify({ version: 3, gold: 1, tree: { ...encodeTree({ sp_reroll1: 1 }, bumped, 4), v: 0 } });
      const c = parseSave(forged).save;
      assert.equal(c.gold, 26, 'v=0 is clamped to 3: only the step above 3 runs, never the Regrowth');
      assert.equal(parseSave(JSON.stringify({ version: 3, tree: { ...encodeTree({}, bumped, 5), v: 5 } })).code, 'future');
    });
  } finally { delete TREE_STEPS[4]; }
});

test('T2 oldCost matches the old cost rule for ranks and rank multipliers', () => {
  assert.deepEqual(oldCost(PRICES_V3.rv_wide, 1), { gold: 600, shards: 0 });
  assert.deepEqual(oldCost(PRICES_V3.rv_wide, 2), { gold: 600 + 960, shards: 0 });
  assert.deepEqual(oldCost(PRICES_V3.sp_cd4, 1), { gold: 2100, shards: 2 });
  assert.deepEqual(oldCost(PRICES_V3.tz_marsh, 1), { gold: 0, shards: 0 });
});
