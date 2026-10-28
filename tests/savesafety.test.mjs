// A1 SAVE SAFETY: a corrupt / partial / oversized / hostile / newer save never crashes; the bad blob is kept (bounded) with a calm note and
// an export path; old saves load; the backup reminder is gentle. Fuzz-style, seeded (deterministic).
import test from 'node:test';
import assert from 'node:assert/strict';
import { treeDef } from './helpers.mjs';
import { parseSave, sanitize, serializeSave, defaultSave, MAX_SAVE_BYTES, SAVE_VERSION } from '../src/save/schema.js';
import { SaveStore, SAVE_KEY, BACKUP_KEY, DAMAGED_KEY, DAMAGED_MAX } from '../src/save/store.js';
import { Lanterns, INDEX_KEY, lanternKeys } from '../src/save/lanterns.js';
import { shouldNudge, NUDGE } from '../src/save/nudge.js';
import { presetTree } from '../src/meta/tree.js';
import { rng, BIG_STATS, memStorage } from '../scripts/review/lib.mjs';
import { installDom, texts } from './a11ydom.mjs';

const full = () => sanitize({ ...defaultSave(), gold: 1000, shards: 3, stats: BIG_STATS, tree: presetTree(treeDef, 'full', true) });
const goodText = () => JSON.stringify(serializeSave(full()));
const polluted = () => ({}).polluted !== undefined || Object.prototype.polluted !== undefined;

const HOSTILE = [undefined, null, true, false, 0, -1, 1e308, -1e308, NaN, 'x', '', '<img src=x onerror=alert(1)>', [], [1, 2], {}, { a: 1 },
  JSON.parse('{"__proto__":{"polluted":1}}'), new Array(50).fill('z')];

function mutate(text, r) {
  const a = text.split('');
  const n = 1 + Math.floor(r() * 6);
  const junk = '{}[],:"0x\\-';
  for (let i = 0; i < n; i++) {
    const op = Math.floor(r() * 4), at = Math.floor(r() * a.length);
    if (op === 0) a.splice(at, 1);
    else if (op === 1) a.splice(at, 0, junk[Math.floor(r() * junk.length)]);
    else if (op === 2) a[at] = String.fromCharCode(32 + Math.floor(r() * 90));
    else a.length = Math.max(1, at); // truncation (a partial write)
  }
  return a.join('');
}

function shapeOk(s) {
  assert.equal(s.version, SAVE_VERSION);
  for (const k of ['gold', 'shards', 'dawnglass']) assert.ok(Number.isFinite(s[k]) && s[k] >= 0, k);
  assert.equal(typeof s.settings.muted, 'boolean');
  assert.ok(Array.isArray(s.stats.recentRuns) && s.stats.recentRuns.length <= 10);
  assert.deepEqual(sanitize(s, s.createdAt), sanitize(sanitize(s, s.createdAt), s.createdAt), 'sanitize is idempotent');
}

test('A1 fuzz: 400 randomly corrupted save texts never throw; each parses to a clean save or a coded refusal', () => {
  const base = goodText(); const r = rng(20261028);
  const codes = new Set();
  for (let i = 0; i < 400; i++) {
    const t = mutate(base, r);
    const res = parseSave(t);
    if (res.ok) shapeOk(res.save); else { assert.ok(['json', 'shape', 'version', 'future', 'migrate', 'size', 'type'].includes(res.code), res.code); codes.add(res.code); }
  }
  assert.ok(codes.has('json'), 'some were broken JSON');
  assert.equal(polluted(), false);
});

test('A1 fuzz: every field replaced by a wrong type (one at a time and all at once) never throws and stays clean', () => {
  const disk = serializeSave(full());
  const paths = [...Object.keys(disk).map((k) => [k]), ...Object.keys(disk.stats).map((k) => ['stats', k]), ...Object.keys(disk.settings).map((k) => ['settings', k]), ['notes', 'backup'], ['notes', 'night'], ['notes', 'starter']];
  for (const p of paths) for (const v of HOSTILE) {
    const o = structuredClone(disk); let t = o;
    for (const k of p.slice(0, -1)) { if (!t[k] || typeof t[k] !== 'object') t[k] = {}; t = t[k]; }
    t[p[p.length - 1]] = v;
    o.version = 3;
    const res = parseSave(JSON.stringify(o));
    if (res.ok) shapeOk(res.save);
  }
  const r = rng(7);
  for (let i = 0; i < 60; i++) {
    const o = { version: 3 };
    for (const k of Object.keys(disk)) if (k !== 'version') o[k] = HOSTILE[Math.floor(r() * HOSTILE.length)];
    const res = parseSave(JSON.stringify(o));
    assert.ok(res.ok, 'a wrong-typed v3 still loads as fresh defaults'); shapeOk(res.save);
  }
  assert.equal(polluted(), false);
});

test('A1 fuzz: __proto__ / constructor keys everywhere never pollute and never survive', () => {
  const evil = '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}}}';
  const t = `{"version":3,"__proto__":{"polluted":1},"gold":5,"stats":{"__proto__":{"polluted":1},"killsByEnemy":${evil},"chapters":${evil},"recentRuns":[${evil}]},"unlocks":${evil},"tree":${evil},"seen":${evil},"chars":${evil},"creep":${evil},"notes":{"__proto__":{"x":1},"backup":${evil},"night":${evil}},"codex":${evil},"titles":${evil},"cosm":${evil},"settings":${evil}}`;
  const res = parseSave(t);
  assert.ok(res.ok); assert.equal(res.save.gold, 5);
  const keys = []; const w = (o) => { if (o && typeof o === 'object') for (const k of Object.keys(o)) { keys.push(k); w(o[k]); } };
  w(res.save);
  assert.ok(!keys.includes('__proto__') && !keys.includes('constructor') && !keys.includes('polluted'));
  assert.equal(polluted(), false);
});

test('A1 fuzz: huge arrays / maps inside the size cap are clamped; over the cap is refused unparsed; deep nesting copes', () => {
  const o = serializeSave(full());
  o.stats = { ...o.stats, recentRuns: new Array(20000).fill(0), killsByEnemy: Object.fromEntries(Array.from({ length: 3000 }, (_, i) => [`e${i}`, 5])) };
  o.unlocks = Object.fromEntries(Array.from({ length: 2500 }, (_, i) => [`u${i}`, true]));
  const t = JSON.stringify(o);
  assert.ok(t.length <= MAX_SAVE_BYTES, `fits the cap (${t.length})`);
  const res = parseSave(t);
  assert.ok(res.ok); assert.ok(res.save.stats.recentRuns.length <= 10); assert.ok(Object.keys(res.save.stats.killsByEnemy).length <= 128); assert.ok(Object.keys(res.save.unlocks).length <= 2000);
  assert.equal(parseSave(JSON.stringify({ version: 3, pad: 'x'.repeat(MAX_SAVE_BYTES) })).code, 'size');
  const deep = `{"version":3,"stats":${'['.repeat(5000)}${']'.repeat(5000)}}`;
  assert.doesNotThrow(() => parseSave(deep));
});

test('A1 store: a damaged / oversized / wrong-shape main save falls back, keeps a BOUNDED copy, says so calmly, never throws', () => {
  for (const bad of ['{oops', '', 'null', '[]', '"str"', '{"version":"3"}', '{"version":0}', 'x'.repeat(MAX_SAVE_BYTES * 3), goodText().slice(0, -40)]) {
    const mem = memStorage(); mem.setItem(SAVE_KEY, bad);
    const s = new SaveStore(mem);
    assert.doesNotThrow(() => s.load());
    assert.equal(s.data.gold, 0); assert.equal(s.readOnly, false);
    assert.match(s.loadNote, /could not be read/); assert.match(s.loadNote, /Settings > Saves/);
    const kept = mem.getItem(DAMAGED_KEY);
    assert.ok(kept !== null && kept.length <= DAMAGED_MAX, 'bounded copy kept');
    assert.equal(kept, bad.slice(0, DAMAGED_MAX));
    assert.equal(s.damagedText(), bad === '' ? null : kept);
    assert.ok(s.exportText().length <= DAMAGED_MAX, 'export hands over the kept copy until real progress');
    assert.equal(s.saveNow(), true); assert.equal(mem.getItem(DAMAGED_KEY), kept, 'saves never overwrite the kept copy');
  }
  const mem = memStorage(); mem.setItem(SAVE_KEY, '{oops'); mem.setItem(BACKUP_KEY, goodText());
  const s = new SaveStore(mem); s.load();
  assert.equal(s.data.gold, 1000); assert.match(s.loadNote, /last good copy/); assert.equal(s.damagedText(), '{oops');
});

test('A1 store: a storage that throws on every call (or returns junk) still boots a fresh in-memory save', () => {
  const boom = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); }, removeItem() { throw new Error('x'); } };
  const s = new SaveStore(boom); assert.doesNotThrow(() => s.load()); assert.equal(s.persistent, false);
  const junk = { getItem: () => 12345, setItem() {}, removeItem() {} };
  const j = new SaveStore(junk); assert.doesNotThrow(() => j.load()); assert.equal(j.data.gold, 0);
  const L = new Lanterns(boom); assert.doesNotThrow(() => L.init()); assert.doesNotThrow(() => L.openActive().load());
  const mem = memStorage(); mem.setItem(INDEX_KEY, '{"v":1,"active":"l9","list":[{"id":"__proto__"},{"id":"l2","name":"<b>x</b>"}]}');
  mem.setItem(lanternKeys('l2').save, '{"version":3,"gold":"lots"}');
  const L2 = new Lanterns(mem).init(); const st = L2.openActive(); st.load();
  assert.equal(L2.active, 'l2'); assert.equal(st.data.gold, 0);
});

test('A1 H1 (24b step 1): a newer save is still locked read-only, kept byte for byte, exportable, never counted as damaged', () => {
  const mem = memStorage(); const v4 = JSON.stringify({ ...serializeSave(full()), version: SAVE_VERSION + 1, futureField: [1, 2, 3] });
  mem.setItem(SAVE_KEY, v4);
  const s = new SaveStore(mem); s.load();
  assert.equal(s.readOnly, true); assert.match(s.loadNote, /newer version/); assert.equal(mem.getItem(DAMAGED_KEY), null);
  s.markBackup(); s.setSettings({ textSize: 'large' }); s.flush(); s.saveNow();
  assert.equal(mem.getItem(SAVE_KEY), v4); assert.equal(s.exportText(), v4);
  assert.equal(shouldNudge(s.data, { readOnly: s.readOnly }), false, 'no reminder on a locked save');
});

test('A1 old saves load: v1 and v2 envelopes migrate, keep gold and settings, and gain the new fields at their defaults', () => {
  const v1 = { version: 1, gold: 77, shards: 2, stats: { runs: 3, kills: 900 }, settings: { musicVol: 0.3, muted: true }, tree: { anything: 1 } };
  const v2 = { version: 2, gold: 50, stats: { runs: 1 }, settings: { quality: 'low' }, tree: {} };
  for (const [raw, gold] of [[v1, 77], [v2, 50]]) {
    const mem = memStorage(); mem.setItem(SAVE_KEY, JSON.stringify(raw));
    const s = new SaveStore(mem); s.load();
    assert.equal(s.loadNote, null); assert.ok(s.data.gold >= gold); assert.equal(s.data.version, SAVE_VERSION);
    assert.equal(s.data.settings.backupNudge, true);
  }
  const mem = memStorage(); mem.setItem(SAVE_KEY, JSON.stringify(v1));
  const s = new SaveStore(mem); s.load();
  assert.equal(s.data.settings.musicVol, 0.3); assert.equal(s.data.settings.muted, true);
});

test('A1 backup reminder: never early, never on a locked save, off switch honoured, Export / Not now restart the count (runs AND days)', () => {
  const DAY = 86400000; const now = 1e12;
  const sv = (runs, backup, set = {}) => sanitize({ ...defaultSave(), stats: { runs }, notes: backup ? { backup } : {}, settings: set });
  assert.equal(shouldNudge(sv(NUDGE.runs - 1), { now }), false);
  assert.equal(shouldNudge(sv(NUDGE.runs), { now }), true);
  assert.equal(shouldNudge(sv(NUDGE.runs, null, { backupNudge: false }), { now }), false);
  assert.equal(shouldNudge(sv(40, { r: 35, t: now - 30 * DAY }), { now }), false, 'too few runs since the last backup');
  assert.equal(shouldNudge(sv(40, { r: 20, t: now - 2 * DAY }), { now }), false, 'too soon since the last backup');
  assert.equal(shouldNudge(sv(40, { r: 20, t: now - 8 * DAY }), { now }), true);
  assert.equal(shouldNudge(sv(40, { r: 20, t: now + 99 * DAY }), { now }), true, 'a clock that went backwards does not silence it forever');
  assert.equal(shouldNudge(sv(40), { now, readOnly: true }), false);
  const mem = memStorage(); const s = new SaveStore(mem); s.load(); s.data.stats.runs = 30;
  assert.equal(shouldNudge(s.data, { now }), true);
  s.markBackup(now); s.flush();
  assert.equal(shouldNudge(s.data, { now }), false);
  assert.deepEqual(JSON.parse(mem.getItem(SAVE_KEY)).notes.backup, { r: 30, t: now }, 'persisted');
  for (const v of HOSTILE) assert.doesNotThrow(() => shouldNudge(sanitize({ ...defaultSave(), notes: { backup: v } }), { now }));
});

test('A1 UI: title reminder + damaged-copy download are inert text; Not now / Export close it; Settings has the switch', async () => {
  installDom();
  const { buildTitle } = await import('../src/ui/title.js');
  const log = [];
  const t = buildTitle({ nudge: { onExport: () => { log.push('ex'); return true; }, onLater: () => log.push('later') } });
  assert.ok(t.nudge); assert.match(texts(t.root), /browser only/);
  t.nudge.export.click(); assert.deepEqual(log, ['ex']); assert.match(texts(t.nudge.root), /Backup saved/);
  const t2 = buildTitle({ nudge: { onLater: () => log.push('later') } }); t2.nudge.later.click(); assert.equal(t2.nudge.root.removed, true); assert.ok(log.includes('later'));
  assert.equal(buildTitle({ note: 'Save damaged', nudge: {} }).nudge, null, 'never stacked on a recovery note');
  const { buildSettings } = await import('../src/ui/settings.js');
  const api = { setSetting: (p) => log.push(p), exportSave: () => '{}', maxSaveBytes: 1, checkImport: () => ({ ok: false }), applyImport() {}, resetSave() {}, damagedText: () => '<script>x</script>' };
  const s = buildSettings({ settings: { backupNudge: true }, api, onBack() {}, onRebuild() {} });
  assert.ok(s.buttons.damaged); assert.ok(!texts(s.root).includes('<script>'));
  s.buttons.nudge.click(); assert.deepEqual(log[log.length - 1], { backupNudge: false });
  assert.equal(buildSettings({ settings: {}, api: { ...api, damagedText: () => null }, onBack() {}, onRebuild() {} }).buttons.damaged, null);
});
