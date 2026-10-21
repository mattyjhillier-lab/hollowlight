// Independent adversarial review of save v3 + skill tree T1/T2 (docs/design/save-v3-review.md).
// Every finding is a test. Tests named in KNOWN_FAILING reproduce an OPEN finding: they run as `todo` (reported, not counted
// as failures) so `npm test` stays green. The fix step removes a name from KNOWN_FAILING once its fix lands.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { data, treeDef } from './helpers.mjs';
import { setTreeDef, parseSave, sanitize, serializeSave, defaultSave, MAX_SAVE_BYTES, SANITIZE_WARNINGS, STAT_KEY_CAPS } from '../src/save/schema.js';
import { SaveStore, SAVE_KEY, BACKUP_KEY, DAMAGED_KEY } from '../src/save/store.js';
import { compileTree, presetTree, sanitizeTree, costFor } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { encodeTree, decodeTree, encodeSeen, decodeSeen, b64urlDecode } from '../src/meta/treecodec.js';
import { TREE_STEPS } from '../src/meta/migrations/index.js';
import { budgetOf } from '../src/meta/treebudget.js';
import { rng, v1RandomBuys, BIG_STATS, isGateV1, memStorage, ROOT } from '../scripts/review/lib.mjs';

// ---- open findings (see docs/design/save-v3-review.md); remove a name here when its fix lands
export const KNOWN_FAILING = [];
const T = (name, fn) => test(name, KNOWN_FAILING.includes(name) ? { todo: 'open review finding (KNOWN_FAILING)' } : {}, fn);

const clone = (x) => JSON.parse(JSON.stringify(x));
const withDef = (def, fn) => { setTreeDef(def, data); try { return fn(); } finally { setTreeDef(treeDef, data); } };
const files = () => clone(readTreeFiles());
const core = (fs) => fs.find((f) => f.path === 'core.json').json;
const cluster = (fs, w) => fs.find((f) => f.path === `clusters/${w}.json`).json;
const specIn = (c, id) => [...c.gates, ...c.outline].find((n) => n.id === id);
const liveOf = (fs) => compileTree(composeTree(fs, data).live, data);
const fullSave = (over = {}) => sanitize({ ...defaultSave(), gold: 1000, shards: 3, stats: BIG_STATS, tree: presetTree(treeDef, 'full', true), ...over });
const allObjects = (v, out = []) => { if (v && typeof v === 'object') { out.push(v); for (const k of Object.keys(v)) allObjects(v[k], out); } return out; };

// ================================================================ SECURITY (currently passing regressions)
T('R01 prototype keys at every depth (envelope, stats, tree object + compact {v,o,r}, seen, notes, recentRuns) never pollute or survive', () => {
  const P = '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}},"prototype":{"polluted":1}}';
  const texts = [
    `{"version":3,"__proto__":{"gold":1e9},"gold":5,"stats":{"__proto__":{"runs":9},"killsByEnemy":${P},"chapters":${P},"recentRuns":[{"k":${P},"e":["__proto__","constructor"]}]},"unlocks":${P},"tree":{"v":3,"o":${P},"r":${P}},"seen":{"o":${P}},"notes":{"__proto__":{"x":1},"regrowth":${P}},"settings":${P}}`,
    `{"version":2,"gold":5,"tree":${P},"seen":${P},"notes":${P}}`,
    `{"version":3,"gold":5,"tree":${P},"seen":${P}}`,
  ];
  for (const t of texts) {
    const r = parseSave(t);
    assert.ok(r.ok, t.slice(0, 40));
    assert.equal(({}).polluted, undefined);
    assert.equal(Object.prototype.polluted, undefined);
    for (const o of allObjects(r.save)) {
      assert.ok(!Object.hasOwn(o, '__proto__') && !Object.hasOwn(o, 'prototype') && !Object.hasOwn(o, 'polluted'), 'no bad key survives');
      const proto = Object.getPrototypeOf(o);
      assert.ok(proto === Object.prototype || proto === Array.prototype || proto === null);
    }
    assert.ok(r.save.gold <= 5 + 1e6);
  }
});

T('R02 numeric junk: huge, negative, float, string, bool, nested values are clamped or dropped; ranks stay integers 1..maxRank', () => {
  const r = parseSave(JSON.stringify({ version: 3, gold: -1e300, shards: 1e300, stats: { runs: 1.7, kills: '9', bestTime: -5, killsByEnemy: { wolf: 1e300, crow: -3, root_crawler: '7' } }, tree: { v: 3, o: { core: '_____' }, r: { sp_reroll1: 1e300, sp_ban1: -9, rv_wide: 1.9, or_wide: '2' } } }));
  assert.ok(r.ok);
  const s = r.save;
  assert.equal(s.gold, 0); assert.equal(s.shards, 1e12); assert.equal(s.stats.runs, 1); assert.equal(s.stats.kills, 0); assert.equal(s.stats.bestTime, 0);
  assert.deepEqual(s.stats.killsByEnemy, { wolf: 1e9, crow: 0 });
  for (const [id, v] of Object.entries(s.tree)) assert.ok(Number.isInteger(v) && v >= 1 && v <= treeDef.nodes[id].maxRank, id);
  for (const v of [Infinity, NaN]) assert.equal(parseSave(`{"version":3,"gold":${v}}`).ok, false, 'not JSON');
  for (const v of ['3', 2.5, 0, -1, null, true, 1e300]) assert.equal(parseSave(JSON.stringify({ version: v })).ok, false, String(v));
});

T('R03 base64url bitsets: invalid chars, padding, length%4==1, over-long, stray high bits, empty, unknown fragments, holes and inert idx', () => {
  for (const s of ['AA==', 'A', 'AAAAA', 'A+/A', 'A A', 'AA\u0000', 'АA', 'A'.repeat(4097), 12, null, {}, []]) assert.equal(b64urlDecode(s), null, JSON.stringify(s).slice(0, 20));
  assert.deepEqual([...b64urlDecode('')], []);
  assert.deepEqual([...b64urlDecode('AB')], [0], 'stray low bits of the final char are ignored');
  const all = decodeTree({ v: 3, o: Object.fromEntries(Object.keys(treeDef.frags).map((k) => [k, '_'.repeat(4096)])), r: {} }, treeDef).tree;
  assert.ok(Object.keys(all).every((id) => Object.hasOwn(treeDef.nodes, id)), 'all-ones bitsets only yield live ids');
  assert.ok(Object.keys(all).every((id) => !treeDef.pending[id]), 'inert ids are never decoded');
  assert.deepEqual(decodeTree({ v: 3, o: { zz: '____', CORE: '____', 'core​': '____' } }, treeDef).tree, {}, 'unknown / look-alike fragment keys are dropped');
  assert.deepEqual(decodeSeen({ o: { core: 7 } }, treeDef), {});
});

T('R04 Regrowth refunds EXACTLY what v1 charged (independent v1 buy simulator, 300 random histories): gold/shards after = start - spent on gates', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const rand = rng(seed);
    const { tree, spent, gateSpent, byId } = v1RandomBuys(rand, 1 + Math.floor(rand() * 120));
    const r = parseSave(JSON.stringify({ version: 2, gold: 200000 - spent.gold, shards: 100 - spent.shards, stats: BIG_STATS, tree }));
    assert.ok(r.ok);
    assert.equal(r.save.gold, 200000 - gateSpent.gold, `seed ${seed} gold`);
    assert.equal(r.save.shards, 100 - gateSpent.shards, `seed ${seed} shards`);
    assert.deepEqual(Object.keys(r.save.tree).sort(), Object.keys(tree).filter((id) => isGateV1(byId[id])).sort(), `seed ${seed} gates`);
  }
});

T('R05 the refund cannot be replayed: forged tree.v (null, 0, 2, -1, 2.5, "2"), object-form tree in a v3 envelope, re-serialised saves', () => {
  const once = parseSave(JSON.stringify({ version: 2, gold: 0, stats: BIG_STATS, tree: presetTree(treeDef, 'full', true) })).save;
  assert.ok(once.gold > 50000);
  const disk = serializeSave(once);
  for (const v of [null, 0, 2, -1, 2.5, '2', 1]) {
    const s = parseSave(JSON.stringify({ ...disk, tree: { ...disk.tree, v } }));
    assert.ok(s.ok); assert.equal(s.save.gold, once.gold, `tree.v=${JSON.stringify(v)}`);
  }
  const future = parseSave(JSON.stringify({ ...disk, tree: { ...disk.tree, v: 99 } }));
  assert.equal(future.ok, false); assert.equal(future.code, 'future');
  const forgedNotes = parseSave(JSON.stringify({ ...disk, notes: { regrowth: { gold: 1e30, shards: -1, nodes: 1e9 } } })).save;
  assert.equal(forgedNotes.gold, once.gold, 'notes never touch the bank');
  assert.deepEqual(forgedNotes.notes.regrowth, { gold: 1e12, shards: 0, nodes: 1e4 });
});

T('R06 parse-time DoS: worst-case 200 KB saves (deep nesting, 40k keys, giant bitsets, 4k recent runs) parse in < 300 ms, never throw', () => {
  const cap = MAX_SAVE_BYTES - 64;
  const keys = (n, mk) => Array.from({ length: n }, (_, i) => mk(i)).join(',');
  const cases = [
    '{"version":3,"unlocks":' + '['.repeat(cap - 40),
    '{"version":3,"unlocks":' + '['.repeat((cap - 40) >> 1) + ']'.repeat((cap - 40) >> 1) + '}',
    '{"version":3,"notes":' + '{"a":'.repeat(24000) + '1' + '}'.repeat(24000) + '}',
    `{"version":3,"unlocks":{${keys(15000, (i) => `"k${i}":1`)}}}`,
    `{"version":3,"stats":{"killsByEnemy":{${keys(15000, (i) => `"e${i}":1`)}}}}`,
    `{"version":2,"tree":{${keys(15000, (i) => `"k${i}":1`)}}}`,
    `{"version":3,"tree":{"v":3,"o":{${keys(10000, (i) => `"f${i}":"AA"`)}},"r":{${keys(4000, (i) => `"k${i}":2`)}}}}`,
    JSON.stringify({ version: 3, stats: { recentRuns: Array.from({ length: 3000 }, () => ({ t: 1, k: { wolf: 1 }, e: ['a'], b: true })) } }),
  ];
  for (const t of cases) {
    assert.ok(t.length <= MAX_SAVE_BYTES, `case is ${t.length} chars`);
    const t0 = performance.now();
    const r = parseSave(t);
    const ms = performance.now() - t0;
    assert.ok(typeof r.ok === 'boolean');
    assert.ok(ms < 300, `${t.slice(0, 30)}... took ${ms.toFixed(0)} ms`);
  }
  assert.equal(parseSave('x'.repeat(MAX_SAVE_BYTES + 1)).code, 'size');
});

T('R07 compact codec round-trips every single-node rank state and 300 random mixes on the live (82) and v2 (125) trees', () => {
  const v2 = compileTree(composeTree(readTreeFiles(), data).v2, data);
  for (const def of [treeDef, v2]) {
    const norm = (t) => Object.fromEntries(def.list.filter((id) => Object.hasOwn(t, id) && t[id] >= 1).map((id) => [id, Math.min(def.nodes[id].maxRank, Math.floor(t[id]))]));
    const rt = (t) => decodeTree(clone(encodeTree(t, def, 3)), def).tree;
    for (const id of def.list) for (let r = 0; r <= def.nodes[id].maxRank + 1; r++) assert.deepEqual(rt({ [id]: r }), norm({ [id]: r }), `${id}@${r}`);
    const rand = rng(11);
    for (let i = 0; i < 300; i++) {
      const t = {};
      for (const id of def.list) if (rand() < 0.5) t[id] = 1 + Math.floor(rand() * def.nodes[id].maxRank);
      assert.deepEqual(rt(t), norm(t));
      const seen = Object.fromEntries(Object.keys(t).map((k) => [k, true]));
      assert.deepEqual(decodeSeen(clone(encodeSeen(seen, def)), def), seen);
    }
  }
});

T('R16 no DOM sink exists anywhere in src (no innerHTML/outerHTML/insertAdjacentHTML/eval/ui.show with html)', () => {
  const hits = [];
  const walk = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(js|mjs)$/.test(f.name)) {
        const src = readFileSync(p, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n'); // code only, not comments
        for (const re of [/\.innerHTML\s*\+?=/g, /insertAdjacentHTML/g, /\.outerHTML\s*=/g, /document\.write/g, /\beval\s*\(/g, /new Function\s*\(/g]) for (const m of src.matchAll(re)) hits.push(`${p.slice(ROOT.length + 1)}:${m[0]}`);
        for (const m of src.matchAll(/\b(?:this|ui|host|app\.ui)\.show\(\s*'[a-z]+'\s*,/g)) hits.push(`${p.slice(ROOT.length + 1)}:show-with-html ${m[0]}`);
      }
    }
  };
  walk(join(ROOT, 'src'));
  assert.deepEqual(hits.map((h) => h.replace(/\\/g, '/')), [], 'an HTML sink appeared: it must never receive save/import data');
});

T('R17 an import cannot bypass the graph: inert nodes, missing weapon gates, rivals and teasers are dropped (links gate buying only since T3c)', () => {
  const forged = { ...Object.fromEntries(treeDef.pendingList.map((id) => [id, 1])), wf_third: 1, rv_oath: 1, ma_key: 1, li_glass: 1, tz_marsh: 1, tz_crown: 1 };
  const s = parseSave(JSON.stringify({ version: 3, gold: 0, stats: BIG_STATS, tree: forged })).save;
  assert.ok(!treeDef.pendingList.some((id) => s.tree[id]), 'no inert node');
  assert.ok(s.tree.wf_third && !s.tree.rv_oath, 'connected-unlock rule: an unlinked owned lantern is kept (it gates buying), a lantern without its weapon gate is dropped');
  assert.ok(!(s.tree.ma_key && s.tree.li_glass) || !treeDef.nodes.ma_key.excludes.includes('li_glass'));
  assert.ok(!s.tree.tz_marsh && !s.tree.tz_crown, 'teasers');
  const v2 = compileTree(composeTree(readTreeFiles(), data).v2, data);
  assert.equal(sanitizeTree({ rv_watch: 1 }, BIG_STATS, v2, data).rv_watch, undefined, 'gate enforced on every requiresAny route');
  assert.equal(sanitizeTree({ gt_raven_flock: 1, rv_watch: 1 }, BIG_STATS, v2, data).rv_watch, 1, 'gate owned: kept');
});

T('R18 sanitize is idempotent and the store round trip (save, load, export, import) is lossless for a full tree', () => {
  const s = fullSave();
  assert.deepEqual(sanitize(clone(s)), s);
  const mem = memStorage();
  const a = new SaveStore(mem); a.data = clone(s); a.saveNow();
  const b = new SaveStore(mem); b.load();
  assert.deepEqual(b.data.tree, s.tree); assert.equal(b.data.gold, s.gold);
  const imp = b.checkImport(b.exportText());
  assert.ok(imp.ok); assert.deepEqual(imp.save.tree, s.tree);
});

T('R19 two tabs migrating the same v2 save cannot duplicate gold (last writer wins, same refund)', () => {
  const mem = memStorage();
  mem.setItem(SAVE_KEY, JSON.stringify({ version: 2, gold: 100, stats: BIG_STATS, tree: { sp_reroll1: 1, sp_ban1: 1 } }));
  const a = new SaveStore(mem); a.load();
  const b = new SaveStore(mem); b.load();
  a.saveNow(); b.saveNow();
  const c = new SaveStore(mem); c.load();
  assert.equal(c.data.gold, 100 + 150 + 150);
});

// ================================================================ OPEN FINDINGS (todo until fixed)
T('R08 a save from a NEWER version is never overwritten (no silent wipe on downgrade / rollback)', () => {
  const mem = memStorage();
  const v4 = JSON.stringify({ ...serializeSave(fullSave()), version: 4 });
  mem.setItem(SAVE_KEY, v4); mem.setItem(BACKUP_KEY, v4);
  const s = new SaveStore(mem); s.load();
  s.saveNow(); s.saveNow();
  assert.ok([...mem.m.values()].includes(v4), 'the newer save must survive in storage (read-only mode or a kept copy)');
});

T('R09 a damaged save with no usable backup is quarantined, not overwritten', () => {
  const mem = memStorage();
  const broken = JSON.stringify(serializeSave(fullSave())).slice(0, -7); // truncated write
  mem.setItem(SAVE_KEY, broken);
  const s = new SaveStore(mem); s.load();
  assert.match(String(s.loadNote), /damaged/);
  s.saveNow(); s.saveNow();
  assert.ok([...mem.m.values()].includes(broken), 'the damaged text must be kept under its own key for recovery');
});

T('R10 a retired id\'s (fragment, idx) can never be given to a new node', () => {
  const fs = files();
  const c = core(fs);
  const i = c.nodes.findIndex((n) => n.id === 'sp_cd4');
  c.nodes.splice(i, 1, { ...clone(c.nodes[i]), id: 'sp_echo', name: 'Echo', desc: 'reuses a retired slot', effects: [{ mod: 'abilityCd', pct: -3 }] });
  c.retired.push({ id: 'sp_cd4', frag: 'core', idx: c.nodes[i].idx });
  assert.throws(() => liveOf(fs), /idx|retired/, 'compose must reject reuse of a retired (frag, idx), else old saves own the new node for free');
});

T('R11 a migration step can see a node that was retired (so it can refund it)', () => {
  const disk = serializeSave(fullSave());
  const fs = files();
  const c = core(fs);
  const gone = c.nodes.find((n) => n.id === 'sp_cd4');
  c.nodes = c.nodes.filter((n) => n.id !== 'sp_cd4');
  c.retired.push({ id: 'sp_cd4', frag: 'core', idx: gone.idx });
  c.version = 4;
  const def = liveOf(fs);
  let seenByStep = null;
  TREE_STEPS[4] = (tree) => { seenByStep = { ...tree }; return { tree, gold: 0, shards: 0 }; };
  try { withDef(def, () => parseSave(JSON.stringify(disk))); } finally { delete TREE_STEPS[4]; }
  assert.ok(seenByStep, 'step 4 ran');
  assert.equal(seenByStep.sp_cd4, 1, 'the retired node (2100 gold + 2 shards) must reach the step that refunds it');
});

T('R12 a migration step can see the full owned rank of a node whose maxRank was cut', () => {
  const disk = serializeSave(fullSave());
  disk.tree.r = { ...disk.tree.r, rv_wide: 2 }; // an older build allowed two ranks; the rescale cut Watch to one (T3a)
  const fs = files();
  core(fs).version = 4;
  const def = liveOf(fs);
  let seenByStep = null;
  TREE_STEPS[4] = (tree) => { seenByStep = { ...tree }; return { tree, gold: 0, shards: 0 }; };
  try { withDef(def, () => parseSave(JSON.stringify(disk))); } finally { delete TREE_STEPS[4]; }
  assert.equal(seenByStep && seenByStep.rv_wide, 2, 'rank 2 (960 gold) must reach the step');
});

T('R13 a bought node whose unlock condition later gets stricter is kept or refunded, never silently lost', () => {
  const stats = clone(BIG_STATS); stats.killsByEnemy.wolf = 2000; // meets wf_third today (1000), not the v2 value (4000)
  const before = fullSave({ stats });
  assert.equal(before.tree.wf_third, 1);
  const fs = files();
  specIn(cluster(fs, 'ghost_wolves'), 'wf_third').unlock = { t: 'killEnemy', id: 'wolf', n: 4000 };
  const def = liveOf(fs);
  const after = withDef(def, () => parseSave(JSON.stringify(serializeSave(before))).save);
  const price = costFor(treeDef.nodes.wf_third, 1).gold;
  assert.ok(after.tree.wf_third === 1 || after.gold >= before.gold + price, `wf_third dropped and gold ${before.gold} -> ${after.gold} (price ${price})`);
});

T('R14 a permanent gate is never dropped because its unlock condition changed', () => {
  const stats = clone(BIG_STATS); stats.killsByEnemy.crow = 5000;
  const before = fullSave({ stats });
  assert.equal(before.tree.gt_raven_flock, 1);
  const fs = files();
  specIn(cluster(fs, 'raven_flock'), 'gt_raven_flock').unlock = { t: 'killEnemy', id: 'crow', n: 6000 };
  const def = liveOf(fs);
  const after = withDef(def, () => parseSave(JSON.stringify(serializeSave(before))).save);
  assert.equal(after.tree.gt_raven_flock, 1, 'a bought weapon unlock must stay owned');
});

T('R15 tree budget checks the sustain ceiling on EVERY side of an exclusive pair', () => {
  const fs = files();
  const l = core(fs).nodes.find((n) => n.id === 'li_lantern');
  const g = core(fs).nodes.find((n) => n.id === 'li_glass');
  l.v2 = { ...(l.v2 || {}), effects: [...((l.v2 && l.v2.effects) || l.effects), { drop: 'heart', pct: 10 }] }; // Lantern side: sustain 5.4
  g.v2 = { ...(g.v2 || {}), effects: [{ mod: 'damage', pct: 3 }, { player: 'maxHp', pct: -4 }] }; // Glass side scores higher
  const c = composeTree(fs, data);
  const b = budgetOf(compileTree(c.v2, data), c.info.core.budget, Object.keys(c.info.clusters).length);
  assert.match(b.violations.join('|'), /sustain/, 'a player who picks the Lantern side is over the sustain ceiling');
});

// ================================================================ FIXES: H1 / M2 / L7 / L8 extra coverage
test('H1 newer-version save: read-only session, message, export gives the kept file, import/reset/settings never write', () => {
  const mem = memStorage();
  const v4 = JSON.stringify({ ...serializeSave(fullSave()), version: 4 });
  mem.setItem(SAVE_KEY, v4); mem.setItem(BACKUP_KEY, v4);
  const s = new SaveStore(mem); s.load();
  assert.equal(s.readOnly, true);
  assert.match(s.loadNote, /newer version of Hollowlight/);
  assert.equal(s.saveNow(), false);
  s.setSettings({ musicVol: 0.1 }); s.flush();
  assert.equal(s.reset(), false);
  assert.equal(s.applyImport(defaultSave()), false);
  assert.equal(s.exportText(), v4, 'export still hands over the newer file');
  assert.equal(mem.getItem(SAVE_KEY), v4); assert.equal(mem.getItem(BACKUP_KEY), v4);
  // main damaged but backup newer: also locked, backup kept
  const m2 = memStorage(); m2.setItem(SAVE_KEY, '{oops'); m2.setItem(BACKUP_KEY, v4);
  const s2 = new SaveStore(m2); s2.load(); s2.saveNow();
  assert.equal(s2.readOnly, true); assert.equal(m2.getItem(BACKUP_KEY), v4);
  // forged newer tree version inside a v3 envelope is also locked
  const disk = serializeSave(fullSave());
  const tv = JSON.stringify({ ...disk, tree: { ...disk.tree, v: 99 } });
  const m3 = memStorage(); m3.setItem(SAVE_KEY, tv);
  const s3 = new SaveStore(m3); s3.load(); s3.saveNow();
  assert.equal(s3.readOnly, true); assert.equal(m3.getItem(SAVE_KEY), tv);
  // a newer-version write by another tab/build that lands mid-session is never overwritten either
  const m4 = memStorage(); const s4 = new SaveStore(m4); s4.load(); s4.saveNow();
  m4.setItem(SAVE_KEY, v4);
  assert.equal(s4.saveNow(), false); assert.equal(m4.getItem(SAVE_KEY), v4); assert.equal(s4.readOnly, true);
});

test('M2 damaged save: copy kept under its own key (never overwritten by saves), note set, export returns it until real progress', () => {
  const mem = memStorage();
  const broken = JSON.stringify(serializeSave(fullSave())).slice(0, -7);
  mem.setItem(SAVE_KEY, broken);
  const s = new SaveStore(mem); s.load();
  assert.equal(mem.getItem(DAMAGED_KEY), broken);
  s.saveNow(); s.saveNow(); s.setSettings({ musicVol: 0.2 }); s.flush();
  assert.equal(mem.getItem(DAMAGED_KEY), broken);
  assert.equal(s.exportText(), broken);
  assert.match(s.loadNote, /copy of the damaged file was kept/);
});

test('L7 never writes an empty tree when the tree data is not registered', () => {
  const mem = memStorage();
  const a = new SaveStore(mem); a.data = fullSave(); a.saveNow();
  const good = mem.getItem(SAVE_KEY);
  setTreeDef(null, null);
  try { const b = new SaveStore(mem); b.data = defaultSave(); assert.equal(b.saveNow(), false); } finally { setTreeDef(treeDef, data); }
  assert.equal(mem.getItem(SAVE_KEY), good);
});

test('L8 two tabs: the second tab refuses to overwrite a newer write and adopts it', () => {
  const mem = memStorage();
  const a = new SaveStore(mem); a.load();
  const b = new SaveStore(mem); b.load();
  a.data.gold = 500; assert.equal(a.saveNow(), true);
  b.data.gold = 7;
  assert.equal(b.saveNow(), false);
  assert.equal(b.data.gold, 500, 'adopted the newer copy');
  assert.match(b.loadNote, /Another tab/);
  b.data.gold = 600; assert.equal(b.saveNow(), true, 'after adopting it can save again');
  const c = new SaveStore(mem); c.load(); assert.equal(c.data.gold, 600);
});

test('L5 the combat budget can fail: five health nodes stuffed into +3% damage report a saturated category; baseline is clean', () => {
  const run = (mut) => {
    const fs = files(); mut(fs);
    const c = composeTree(fs, data);
    return budgetOf(compileTree(c.v2, data), c.info.core.budget, Object.keys(c.info.clusters).length);
  };
  assert.deepEqual(run(() => {}).violations, []);
  const b = run((fs) => {
    const hp = core(fs).nodes.filter((n) => !n.keystone && (n.effects || []).some((e) => e.player === 'maxHp')).slice(0, 5);
    assert.ok(hp.length >= 3);
    for (const n of hp) n.v2 = { ...(n.v2 || {}), effects: [{ mod: 'damage', pct: 3 }, { mod: 'damage', pct: 3 }] };
  });
  assert.match(b.violations.join('|'), /saturated/);
});

test('M3 a revive / reroll hidden behind an exclusive pair is caught on the side that has it', () => {
  const fs = files();
  const l = core(fs).nodes.find((n) => n.id === 'li_lantern');
  l.v2 = { ...(l.v2 || {}), effects: [...((l.v2 && l.v2.effects) || l.effects), { unlock: 'rerolls', n: 9 }] };
  const c = composeTree(fs, data);
  const b = budgetOf(compileTree(c.v2, data), c.info.core.budget, Object.keys(c.info.clusters).length);
  assert.match(b.violations.join('|'), /rerolls/);
});

test('L3 stat-map caps: a valid key beyond the cap is counted (never silent); the shipped roster fits with room to spare', () => {
  assert.ok(Object.keys(data.enemies).length * 2 <= STAT_KEY_CAPS.killsByEnemy, 'enemy roster x2 must fit killsByEnemy');
  assert.ok(Object.keys(data.weapons).length + 8 <= STAT_KEY_CAPS.weaponsUsed && Object.keys(data.characters).length + 8 <= STAT_KEY_CAPS.charsUsed);
  const before = SANITIZE_WARNINGS.capped;
  const many = Object.fromEntries(Array.from({ length: STAT_KEY_CAPS.killsByEnemy + 5 }, (_, i) => [`e${i}`, 1]));
  const out = sanitize({ ...defaultSave(), stats: { ...defaultSave().stats, killsByEnemy: many } });
  assert.equal(Object.keys(out.stats.killsByEnemy).length, STAT_KEY_CAPS.killsByEnemy);
  assert.equal(SANITIZE_WARNINGS.capped - before, 5);
});

test('L9 the regrowth notice exists only when something was refunded', () => {
  assert.deepEqual(parseSave(JSON.stringify({ version: 2, gold: 5, tree: {} })).save.notes, {});
  assert.deepEqual(parseSave(JSON.stringify({ version: 2, gold: 5, tree: { gt_raven_flock: 1 } })).save.notes, {}, 'only permanent gates: nothing refunded');
  assert.equal(parseSave(JSON.stringify({ version: 2, gold: 5, tree: { sp_reroll1: 1 } })).save.notes.regrowth.nodes, 1);
});
