import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers.mjs'; // registers the skill tree with the save validator
import { SaveStore, SAVE_KEY, BACKUP_KEY } from '../src/save/store.js';
import { parseSave, defaultSave, sanitize, MIGRATIONS, MAX_SAVE_BYTES, SAVE_VERSION } from '../src/save/schema.js';

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };

test('roundtrip via storage', () => {
  const st = memStorage();
  const a = new SaveStore(st);
  a.load();
  a.bankRun({ gold: 120, shards: 5, kills: 300, time: 600, outcome: 'victory' });
  const b = new SaveStore(st);
  const d = b.load();
  assert.equal(d.gold, 120);
  assert.equal(d.shards, 5);
  assert.equal(d.stats.runs, 1);
  assert.equal(d.stats.wins, 1);
  assert.equal(d.stats.bestTime, 600);
});

test('bankRun: best time flag and accumulation', () => {
  const s = new SaveStore(memStorage());
  s.load();
  assert.equal(s.bankRun({ gold: 10, shards: 0, kills: 1, time: 100, outcome: 'defeat' }).newBest, true);
  assert.equal(s.bankRun({ gold: 10, shards: 0, kills: 1, time: 50, outcome: 'defeat' }).newBest, false);
  const r = s.bankRun({ gold: 5, shards: 5, kills: 1, time: 200, outcome: 'victory' });
  assert.equal(r.gold, 25);
  assert.equal(r.shards, 5);
  assert.equal(r.bestTime, 200);
  assert.equal(s.data.stats.runs, 3);
});

test('rolling backup keeps previous save', () => {
  const st = memStorage();
  const s = new SaveStore(st);
  s.load();
  s.bankRun({ gold: 1, time: 1, outcome: 'defeat' });
  s.bankRun({ gold: 2, time: 1, outcome: 'defeat' });
  assert.equal(JSON.parse(st.m.get(BACKUP_KEY)).gold, 1);
  assert.equal(JSON.parse(st.m.get(SAVE_KEY)).gold, 3);
});

test('migration chain from fake old version', () => {
  const saved = { ...MIGRATIONS };
  try {
    MIGRATIONS[1] = (o) => ({ ...o, version: 2, gold: o.coins });
    // pretend current version is 2 by checking the table is applied through parseSave only when SAVE_VERSION allows
    assert.equal(typeof MIGRATIONS[1], 'function');
    const up = MIGRATIONS[1]({ version: 1, coins: 7 });
    assert.equal(up.version, 2);
    assert.equal(up.gold, 7);
    // current-version saves pass through untouched
    assert.equal(parseSave(JSON.stringify({ version: SAVE_VERSION, gold: 9 })).save.gold, 9);
  } finally {
    delete MIGRATIONS[1];
    Object.assign(MIGRATIONS, saved);
  }
});

test('corrupt JSON main falls back to backup, then fresh', () => {
  const st = memStorage();
  const good = defaultSave();
  good.gold = 42;
  st.setItem(BACKUP_KEY, JSON.stringify(good));
  st.setItem(SAVE_KEY, '{not json');
  const s = new SaveStore(st);
  assert.equal(s.load().gold, 42);
  assert.ok(s.loadNote);
  st.setItem(BACKUP_KEY, 'garbage');
  const s2 = new SaveStore(st);
  assert.equal(s2.load().gold, 0);
});

test('oversized save refused', () => {
  const big = JSON.stringify({ version: 1, pad: 'x'.repeat(MAX_SAVE_BYTES + 10) });
  const r = parseSave(big);
  assert.equal(r.ok, false);
  assert.equal(r.code, 'size');
});

test('wrong types and out-of-range numbers are clamped/defaulted', () => {
  const r = parseSave(JSON.stringify({
    version: 1, gold: 'lots', shards: -5, stats: { runs: 1e99, wins: null, bestTime: 'x', kills: 3.7 },
    settings: { musicVol: 9, sfxVol: 'loud', screenShake: 'yes', quality: 'ultra', damageNumbers: false },
    unlocks: [1, 2], tree: { good_id: 3, 'bad id!': 1, nested: { a: 1 } },
  }));
  assert.ok(r.ok);
  const d = r.save;
  assert.equal(d.gold, 0);
  assert.equal(d.shards, 0);
  assert.equal(d.stats.runs, 1e12);
  assert.equal(d.stats.wins, 0);
  assert.equal(d.stats.kills, 3);
  assert.equal(d.stats.bestTime, 0);
  assert.equal(d.settings.musicVol, 1);
  assert.equal(d.settings.sfxVol, 0.8);
  assert.equal(d.settings.screenShake, true);
  assert.equal(d.settings.quality, 'auto');
  assert.equal(d.settings.damageNumbers, false);
  assert.deepEqual(d.unlocks, {});
  assert.deepEqual(d.tree, {}); // v2: tree ids are validated against the real skill tree, unknown ids are dropped
});

test('non-object / bad version payloads rejected', () => {
  for (const t of ['[]', '5', 'null', '"x"', '{}', '{"version":"1"}', '{"version":0}', '{"version":1.5}']) {
    assert.equal(parseSave(t).ok, false, t);
  }
  assert.equal(parseSave(undefined).ok, false);
});

test('prototype pollution payload is neutralised', () => {
  const evil = '{"version":1,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},'
    + '"settings":{"__proto__":{"polluted":true}},"stats":{"__proto__":{"polluted":true}},'
    + '"unlocks":{"__proto__":1,"constructor":1,"prototype":1,"ok":1},"tree":{"__proto__":{"x":1}}}';
  const r = parseSave(evil);
  assert.ok(r.ok);
  assert.equal({}.polluted, undefined);
  assert.equal(r.save.polluted, undefined);
  assert.equal(Object.getPrototypeOf(r.save), Object.prototype);
  assert.deepEqual(Object.keys(r.save.unlocks), ['ok']);
  assert.deepEqual(r.save.tree, {});
  assert.equal(Object.hasOwn(r.save.settings, 'polluted'), false);
  assert.deepEqual(Object.keys(r.save).sort(), Object.keys(defaultSave()).sort());
});

test('unknown future version refused and existing save kept', () => {
  const st = memStorage();
  const s = new SaveStore(st);
  s.load();
  s.bankRun({ gold: 50, time: 1, outcome: 'defeat' });
  const r = s.checkImport(JSON.stringify({ version: SAVE_VERSION + 1, gold: 999999 }));
  assert.equal(r.ok, false);
  assert.equal(r.code, 'future');
  assert.match(r.error, /newer/);
  assert.equal(s.data.gold, 50);
  // a stored future-version save is not loaded as-is either
  st.setItem(SAVE_KEY, JSON.stringify({ version: 99, gold: 5 }));
  assert.equal(new SaveStore(st).load().gold, 0);
});

test('storage unavailable: game still runs in memory', () => {
  for (const stg of [broken, null]) {
    const s = new SaveStore(stg);
    assert.doesNotThrow(() => s.load());
    const r = s.bankRun({ gold: 30, shards: 5, kills: 2, time: 10, outcome: 'victory' });
    assert.equal(r.gold, 30);
    assert.equal(s.data.gold, 30);
    assert.equal(s.persistent, false);
    s.setSettings({ screenShake: false });
    assert.doesNotThrow(() => s.flush());
  }
});

test('import validation: valid file sanitised, applied only on request', () => {
  const s = new SaveStore(memStorage());
  s.load();
  const exp = JSON.stringify({ ...defaultSave(), gold: 77, extra: 'ignored', settings: { ...defaultSave().settings, quality: 'high' } });
  const r = s.checkImport(exp);
  assert.ok(r.ok);
  assert.equal(r.save.extra, undefined);
  assert.equal(s.data.gold, 0);
  s.applyImport(r.save);
  assert.equal(s.data.gold, 77);
  assert.equal(s.data.settings.quality, 'high');
  assert.equal(JSON.parse(s.exportText()).gold, 77);
  assert.equal(s.checkImport('not json').ok, false);
});

test('settings update clamps and reset works', () => {
  const s = new SaveStore(memStorage());
  s.load();
  s.setSettings({ musicVol: 5, quality: 'bogus', reducedMotion: true });
  assert.equal(s.data.settings.musicVol, 1);
  assert.equal(s.data.settings.quality, 'auto');
  assert.equal(s.data.settings.reducedMotion, true);
  s.flush();
  s.reset();
  assert.equal(s.data.gold, 0);
  assert.deepEqual(sanitize(s.data), { ...s.data, updatedAt: s.data.updatedAt });
});
