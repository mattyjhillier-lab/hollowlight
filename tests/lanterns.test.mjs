// FD1 lantern store: legacy copy, index validation, names, quota, import-as-new/replace, max 3, hostile input.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import './helpers.mjs'; // registers the skill tree with the save validator
import { SaveStore, SAVE_KEY, BACKUP_KEY, DAMAGED_KEY } from '../src/save/store.js';
import { Lanterns, INDEX_KEY, lanternKeys, cleanName, parseIndex, MAX_LANTERNS } from '../src/save/lanterns.js';
import { parseSave, serializeSave, SAVE_VERSION } from '../src/save/schema.js';

function mem(limit = Infinity) {
  const m = new Map();
  const size = () => [...m.values()].reduce((a, v) => a + v.length, 0);
  return {
    m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { v = String(v); if (size() - (m.get(k) || '').length + v.length > limit) throw new Error('QuotaExceededError'); m.set(k, v); },
    removeItem: (k) => m.delete(k),
  };
}
const V2 = readFileSync(new URL('./fixtures/save-v2.json', import.meta.url), 'utf8');
const v3Text = () => JSON.stringify(serializeSave(parseSave(V2).save));
const L1 = lanternKeys('l1');
const GOLD = parseSave(V2).save.gold; // after migration (v2 tree refunds)

test('fresh device: one lantern, index written, no legacy keys created', () => {
  const st = mem();
  const L = new Lanterns(st).init();
  assert.deepEqual(L.list(), [{ id: 'l1', name: 'Lantern 1' }]);
  assert.equal(L.active, 'l1');
  assert.equal(JSON.parse(st.getItem(INDEX_KEY)).v, 1);
  assert.equal(st.getItem(SAVE_KEY), null);
  const s = L.openActive(); s.load(); s.data.gold = 7; s.saveNow();
  assert.equal(JSON.parse(st.getItem(L1.save)).gold, 7);
  assert.equal(st.getItem(SAVE_KEY), null);
});

for (const [label, text] of [['real v2 fixture', V2], ['real v3 save', v3Text()]]) {
  test(`legacy ${label} is COPIED byte for byte into lantern 1 and loads unchanged; legacy keys untouched`, () => {
    const st = mem();
    st.setItem(SAVE_KEY, text); st.setItem(BACKUP_KEY, text);
    const before = new SaveStore(mem()); before.storage.setItem(SAVE_KEY, text); const want = before.load();
    const L = new Lanterns(st).init();
    assert.equal(st.getItem(L1.save), text); assert.equal(st.getItem(L1.backup), text);
    const s = L.openActive(); const got = s.load();
    assert.deepEqual(serializeSave(got), serializeSave(want));
    assert.equal(got.gold, GOLD);
    s.data.gold += 1; s.saveNow();
    assert.equal(st.getItem(SAVE_KEY), text); assert.equal(st.getItem(BACKUP_KEY), text); // copy, not move
    // second boot: no re-copy over newer lantern progress
    const L2 = new Lanterns(st).init(); const s2 = L2.openActive(); s2.load();
    assert.equal(s2.data.gold, got.gold);
  });
}

test('legacy damaged main + good backup: both copied raw, lantern restores from backup as before', () => {
  const st = mem(); st.setItem(SAVE_KEY, '{oops'); st.setItem(BACKUP_KEY, V2);
  const L = new Lanterns(st).init(); const s = L.openActive(); s.load();
  assert.equal(s.data.gold, GOLD);
  assert.equal(st.getItem(L1.damaged), '{oops');
  assert.equal(st.getItem(DAMAGED_KEY), null);
});

test('legacy newer-version save stays read-only inside lantern 1 (24b)', () => {
  const st = mem(); const fut = JSON.stringify({ version: SAVE_VERSION + 1, gold: 999 });
  st.setItem(SAVE_KEY, fut);
  const s = new Lanterns(st).init().openActive(); s.load();
  assert.equal(s.readOnly, true); assert.equal(s.saveNow(), false);
  assert.equal(st.getItem(L1.save), fut); assert.equal(s.exportText(), fut);
});

test('quota full during legacy copy: no half copy, session runs on the legacy save, retried next boot', () => {
  const st = mem(V2.length * 2 + 10); st.setItem(SAVE_KEY, V2); st.setItem(BACKUP_KEY, V2);
  const L = new Lanterns(st).init();
  assert.equal(L.legacyMode, true); assert.ok(L.note);
  assert.equal(st.getItem(L1.save), null); assert.equal(st.getItem(INDEX_KEY), null);
  const s = L.openActive(); s.load();
  assert.equal(s.data.gold, GOLD); assert.equal(s.keys.save, SAVE_KEY);
  assert.equal(L.create('Bo').ok, false);
});

test('storage blocked entirely: works in memory, nothing throws', () => {
  const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('x'); } };
  const L = new Lanterns(bad).init(); const s = L.openActive(); s.load();
  assert.equal(s.saveNow(), false); assert.equal(L.persistent, false);
  const L0 = new Lanterns(null).init(); assert.equal(L0.openActive().load().gold, 0);
});

test('names: whitelist, length, trim, collapse, unicode letters ok, hostile rejected', () => {
  assert.deepEqual(cleanName('  Matt   H '), { ok: true, name: 'Matt H' });
  assert.equal(cleanName("O'Neil-2").ok, true);
  assert.equal(cleanName('Zoë').ok, true);
  assert.equal(cleanName('x'.repeat(16)).ok, true);
  for (const bad of ['', '   ', 'x'.repeat(17), 'y'.repeat(100000), '<img src=x>', 'a‮b', 'a\u0000b', 'a"b', 'a&b', '😀', 42, null, {}, ['a']]) assert.equal(cleanName(bad).ok, false, String(bad).slice(0, 20));
});

test('max 3 lanterns, lowest free slot, rename, switch, delete (+ last one replaced by a fresh lantern)', () => {
  const st = mem(); const L = new Lanterns(st).init();
  assert.equal(L.create('Bo').id, 'l2');
  assert.equal(L.create().id, 'l3');
  assert.equal(L.list()[2].name, 'Lantern 3');
  const r = L.create('Dee'); assert.equal(r.ok, false); assert.equal(r.code, 'full');
  assert.equal(L.list().length, MAX_LANTERNS);
  assert.equal(L.create('<b>').ok, false);
  assert.equal(L.rename('l2', 'Bobby').ok, true);
  assert.equal(L.rename('l2', 'bad<').ok, false);
  assert.equal(L.rename('l9', 'Ok').ok, false);
  assert.equal(L.setActive('l2').ok, true);
  assert.equal(L.setActive('__proto__').ok, false);
  const s = L.openActive(); s.load(); s.data.gold = 50; s.saveNow();
  assert.equal(JSON.parse(st.getItem(lanternKeys('l2').save)).gold, 50);
  const L2 = new Lanterns(st).init();
  assert.equal(L2.active, 'l2'); assert.equal(L2.list()[1].name, 'Bobby');
  assert.equal(L2.remove('l2').ok, true);
  assert.equal(st.getItem(lanternKeys('l2').save), null); assert.equal(L2.active, 'l1');
  assert.equal(L2.create('New').id, 'l2'); // reused slot starts empty
  const s2 = L2.open('l2'); assert.equal(s2.load().gold, 0);
  L2.remove('l1'); L2.remove('l2'); L2.remove('l3');
  assert.deepEqual(L2.list(), [{ id: 'l1', name: 'Lantern 1' }]);
});

test('hostile index: proto pollution, wrong types, giant, duplicates, >3, bad ids', () => {
  const cases = [
    '{"__proto__":{"polluted":1},"v":1,"active":"l1","list":[{"id":"l1","name":"A","__proto__":{"x":1}}]}',
    JSON.stringify({ v: 1, active: 'l2', list: [{ id: 'l1', name: 'A' }, { id: 'l1', name: 'B' }, { id: 'l2', name: 'C' }, { id: 'l3', name: 'D' }, { id: 'l4', name: 'E' }] }),
    JSON.stringify({ v: 1, active: { toString: 1 }, list: [{ id: '../save', name: 'x' }, { id: 'l2', name: '<script>' }, { id: 1 }, null, 'l3', [] ] }),
    JSON.stringify({ v: '1', list: [{ id: 'l1' }] }),
    JSON.stringify({ v: 1, list: 'l1' }),
    JSON.stringify({ v: 1, list: [] }),
    '[1,2]', 'null', '{bad', '"x"',
    JSON.stringify({ v: 1, list: [{ id: 'l1', name: 'x'.repeat(5000) }] }),
  ];
  for (const t of cases) {
    const st = mem(); st.setItem(INDEX_KEY, t);
    const L = new Lanterns(st).init();
    assert.ok(L.list().length >= 1 && L.list().length <= 3, t.slice(0, 40));
    const ids = L.list().map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const e of L.list()) { assert.match(e.id, /^l[1-3]$/); assert.equal(cleanName(e.name).ok, true); assert.deepEqual(Object.keys(e), ['id', 'name']); }
    assert.ok(ids.includes(L.active));
    assert.equal(({}).polluted, undefined); assert.equal(({}).x, undefined);
    L.openActive().load(); // never throws
  }
  const p = parseIndex(cases[1]); assert.deepEqual(p.index.list.map((x) => x.id), ['l1', 'l2', 'l3']); assert.equal(p.index.list[0].name, 'A');
  assert.equal(parseIndex(cases[2]).index.list[0].name, 'Lantern 2');
});

test('damaged index is rebuilt from existing lantern saves (no legacy re-copy, no data loss)', () => {
  const st = mem(); st.setItem(SAVE_KEY, V2);
  const L = new Lanterns(st).init(); L.create('Bo');
  const s = L.open('l2'); s.load(); s.data.gold = 33; s.saveNow();
  st.setItem(INDEX_KEY, '{broken');
  const R = new Lanterns(st).init();
  assert.deepEqual(R.list().map((x) => x.id), ['l1', 'l2']); assert.ok(R.note);
  const r2 = R.open('l2'); r2.load(); assert.equal(r2.data.gold, 33);
  assert.equal(parseIndex(st.getItem(INDEX_KEY)).ok, true);
});

test('newer-version index (24b): never written, all lanterns read-only, no mutations', () => {
  const st = mem(); const L = new Lanterns(st).init();
  const s = L.openActive(); s.load(); s.data.gold = 5; s.saveNow();
  const fut = JSON.stringify({ v: 2, active: 'l1', list: [{ id: 'l1', name: 'Matt' }], extra: { new: true } });
  st.setItem(INDEX_KEY, fut);
  const F = new Lanterns(st).init();
  assert.equal(F.locked, true); assert.ok(F.note);
  const fs = F.openActive(); fs.load();
  assert.equal(fs.readOnly, true); assert.equal(fs.data.gold, 5);
  const saved = st.getItem(L1.save);
  assert.equal(fs.saveNow(), false); assert.equal(fs.bankRun({ gold: 100, time: 10 }).gold >= 0, true);
  assert.equal(st.getItem(L1.save), saved);
  for (const r of [F.create('X'), F.rename('l1', 'Y'), F.remove('l1'), F.setActive('l1'), F.importReplace('l1', V2), F.importNew(V2)]) assert.equal(r.ok, false);
  assert.equal(st.getItem(INDEX_KEY), fut);
  // unparseable future index still locks
  st.setItem(INDEX_KEY, JSON.stringify({ v: 9, lanterns: {} })); assert.equal(new Lanterns(st).init().locked, true);
});

test('import as new lantern + replace a chosen one; hostile imports rejected; quota rolls back', () => {
  const st = mem(); const L = new Lanterns(st).init();
  const r = L.importNew(V2, 'Friend'); assert.equal(r.ok, true); assert.equal(r.id, 'l2');
  const s = L.open('l2'); s.load(); assert.equal(s.data.gold, GOLD);
  assert.equal(L.list()[1].name, 'Friend');
  const hostile = ['{bad', 'x'.repeat(300 * 1024), JSON.stringify({ version: 99 }), JSON.stringify([1]), 42, null];
  for (const h of hostile) { assert.equal(L.importNew(h).ok, false); assert.equal(({}).polluted, undefined); }
  assert.equal(L.list().length, 2);
  const pp = L.importNew('{"__proto__":{"polluted":1},"version":3,"gold":"9e99","tree":{"__proto__":{"x":1}}}'); // valid shape: sanitised, never pollutes
  assert.equal(pp.ok, true); assert.equal(({}).polluted, undefined); assert.equal(({}).x, undefined);
  const ps = L.open(pp.id); ps.load(); assert.ok(Number.isFinite(ps.data.gold)); L.remove(pp.id);
  assert.equal(L.importNew(V2, 'bad<name>').ok, false); assert.equal(L.list().length, 2);
  // replace: old save becomes the backup
  const a = L.open('l1'); a.load(); a.data.gold = 11; a.saveNow();
  assert.equal(L.importReplace('l1', V2).ok, true);
  assert.equal(JSON.parse(st.getItem(L1.backup)).gold, 11);
  assert.equal(JSON.parse(st.getItem(L1.save)).gold, GOLD);
  assert.equal(L.importReplace('l3', V2).ok, false); // not lit
  assert.equal(L.importReplace('l1', '{bad').ok, false);
  assert.equal(JSON.parse(st.getItem(L1.save)).gold, GOLD);
  // full
  L.create(); assert.equal(L.importNew(V2).code, 'full');
  // quota: index fits but the imported save does not -> lantern removed again
  const q = mem(); const Q = new Lanterns(q).init(); q.setItem('filler', 'x');
  const lim = [...q.m.values()].reduce((x, v) => x + v.length, 0) + 300;
  const q2 = mem(lim); for (const [k, v] of q.m) q2.setItem(k, v);
  const Q2 = new Lanterns(q2).init();
  const rq = Q2.importNew(V2, 'Big'); assert.equal(rq.ok, false); assert.equal(rq.code, 'storage');
  assert.deepEqual(Q2.list().map((x) => x.id), ['l1']); assert.equal(q2.getItem(lanternKeys('l2').save), null);
  assert.equal(parseIndex(q2.getItem(INDEX_KEY)).index.list.length, 1);
  assert.ok(Q);
});

test('replace on a lantern holding a newer-version save is refused and keeps it byte for byte', () => {
  const st = mem(); const L = new Lanterns(st).init();
  const fut = JSON.stringify({ version: SAVE_VERSION + 1, gold: 1 }); st.setItem(L1.save, fut);
  assert.equal(L.importReplace('l1', V2).ok, false); assert.equal(st.getItem(L1.save), fut);
});

test('lanternKeys only accepts the three slot ids', () => {
  for (const bad of ['l0', 'l4', '__proto__', 'l1:x', '', null]) assert.throws(() => lanternKeys(bad));
});

test('two tabs: a stale tab adopts the stored index before changing it (never reuses or wipes a lit slot)', () => {
  const st = mem(); const A = new Lanterns(st).init(); const B = new Lanterns(st).init();
  assert.equal(A.create('Ann').id, 'l2');
  const s = A.open('l2'); s.load(); s.data.gold = 77; s.saveNow();
  const r = B.create('Ben'); assert.equal(r.id, 'l3');
  assert.equal(JSON.parse(st.getItem(lanternKeys('l2').save)).gold, 77);
  assert.deepEqual(parseIndex(st.getItem(INDEX_KEY)).index.list.map((x) => x.name), ['Lantern 1', 'Ann', 'Ben']);
  st.setItem(INDEX_KEY, JSON.stringify({ v: 2, list: [] }));
  assert.equal(A.rename('l1', 'Zed').ok, false); assert.equal(A.locked, true);
});
