// E7 Almanac "Places": save safety (hostile input, append-only keys, old saves unchanged), the model, the copy. UI test lives in codexui.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { data, treeDef } from './helpers.mjs';
import { ENTRY_KEYS, MAX_BITS_HEX, cleanBits, bitsToSet, setToBits, almanac, tabOfKey, placeTimes } from '../src/meta/codex.js';
import { queue } from '../src/meta/celebrate.js';
import { PLACE, PLACE_IDS, CX, CEL } from '../src/ui/codexcopy.js';
import { defaultSave, sanitize, parseSave, serializeSave, cleanSites, SITE_KEYS } from '../src/save/schema.js';
import { SaveStore } from '../src/save/store.js';

const save = (stats = {}, extra = {}) => sanitize({ ...defaultSave(1), stats: { ...defaultSave(1).stats, ...stats }, ...extra });
const fx = (n) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');
const memLocal = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };

test('E7 append-only: the pre-E7 keys keep their bits, new keys come after, all fit 256', () => {
  assert.deepEqual(ENTRY_KEYS.slice(0, 11), ['f:wolf', 'f:crow', 'f:root_crawler', 'f:stoat_piper', 'f:puffback_toad', 'f:bramble_hart', 'f:branch_mane', 'f:elder_treant', 'f:treant_pod', 'f:treant_sapling', 'f:marks']);
  const PIN = { 'e:phantom_stampede': 23, 'h:wren': 38, 'h:elias': 39, 'n:cursed_forest:normal': 40, 'l:1': 43, 'c:ghost_wolves': 47, 'c:foes': 52, 'c:spirits': 53, 'c:nights': 54, 'c:book': 55 };
  for (const [k, i] of Object.entries(PIN)) assert.equal(ENTRY_KEYS.indexOf(k), i, k);
  assert.deepEqual(ENTRY_KEYS.slice(56), ['s:lamp', 's:road', 's:knot', 'sp:lamp:tells', 'sp:road:tells', 'sp:knot:tells', 'c:places', 'c:dragonfire_meteor', 'e:wildfire', 'e:cinder_wyrm', 'e:cinder_brand', 'p:ophimber']); // DM8 appends p:ophimber; DM4 appends e:wildfire, DM5 e:cinder_wyrm, DM6 e:cinder_brand (evolutions.json needs a codex key)
  assert.ok(ENTRY_KEYS.length <= MAX_BITS_HEX * 4);
  assert.equal(new Set(ENTRY_KEYS).size, ENTRY_KEYS.length);
  const old = new Set(['f:wolf', 'e:dire_alpha', 'c:book', 'l:4', 'c:nights']);
  assert.deepEqual(bitsToSet(setToBits(old)), old);
  assert.equal(setToBits(new Set(['c:book'])).length, 14); // bit 55 -> nibble 13: the same text an old build wrote
});

test('E7 stats.sites: hostile values are clamped or dropped, unknown keys vanish, all-zero stays absent', () => {
  assert.equal(cleanSites(undefined), null);
  assert.equal(cleanSites({}), null);
  for (const bad of ['x', 5, [], null, true, [1, 2, 3]]) assert.equal(cleanSites(bad), null, String(bad));
  const hostile = JSON.parse('{"lamps":"9","roads":-5,"knots":1e99,"wLamps":null,"wRoads":[7],"wKnots":{"a":1},"__proto__":{"lamps":9},"evil":1,"constructor":4}');
  const c = cleanSites(hostile);
  assert.deepEqual(c, { lamps: 0, roads: 0, knots: 1e9, wLamps: 0, wRoads: 0, wKnots: 0 });
  assert.deepEqual(Object.keys(c), SITE_KEYS.slice());
  assert.equal(cleanSites({ lamps: Infinity }), null); // not a finite number -> 0 -> absent
  assert.equal(cleanSites({ lamps: 3.9 }).lamps, 3);
  assert.equal(cleanSites({ lamps: NaN }), null);
  const d = defaultSave(1);
  assert.equal(Object.hasOwn(sanitize(d).stats, 'sites'), false);
  assert.equal(Object.hasOwn(sanitize({ ...d, stats: { ...d.stats, sites: { lamps: -1, evil: 9 } } }).stats, 'sites'), false);
  const s = sanitize({ ...d, stats: { ...d.stats, sites: { lamps: 4, evil: 9, wLamps: 'a' } } });
  assert.deepEqual(s.stats.sites, { lamps: 4, roads: 0, knots: 0, wLamps: 0, wRoads: 0, wKnots: 0 });
  assert.equal(({}).lamps, undefined);
  assert.equal(Object.getPrototypeOf(s.stats.sites), Object.prototype);
  const back = parseSave(JSON.stringify(serializeSave(s)));
  assert.ok(back.ok); assert.deepEqual(back.save.stats.sites, s.stats.sites);
  // a whole hostile save text (proto key at the top and in stats)
  const evil = parseSave('{"version":3,"__proto__":{"x":1},"stats":{"__proto__":{"sites":{"lamps":5}},"sites":{"__proto__":{"lamps":7},"roads":2}}}');
  assert.ok(evil.ok);
  assert.equal(evil.save.stats.sites.lamps, 0); assert.equal(evil.save.stats.sites.roads, 2);
  assert.equal({}.x, undefined);
});

test('E7 codex bitset keys: hostile text and out-of-range bits for the new keys', () => {
  for (const bad of [null, 5, {}, [], '__proto__', 'f'.repeat(65), '<img>', '-1', '1g3']) assert.equal(cleanBits(bad), '', String(bad));
  const keys = new Set(['s:lamp', 'sp:knot:tells', 'c:places']);
  assert.deepEqual(bitsToSet(setToBits(keys)), keys);
  assert.ok(cleanBits('f'.repeat(64)).length <= Math.ceil(ENTRY_KEYS.length / 4)); // bits past the list are dropped
  assert.equal(setToBits(new Set(['s:nope', 'sp:x', '__proto__', 'c:places'])), setToBits(new Set(['c:places'])));
  const s = sanitize({ ...defaultSave(1), codex: { v: 1, read: 'f'.repeat(32), told: '__proto__', evil: 1 } });
  assert.equal(s.codex.told, '');
  assert.ok(s.codex.read.length <= Math.ceil(ENTRY_KEYS.length / 4));
});

test('E7 old saves load unchanged: real fixtures re-save byte-identically to the pre-E7 build (golden), no sites key added', () => {
  const gold = JSON.parse(fx('places-golden.json'));
  const L = JSON.parse(fx('ls-659be88.json')).dump['hollowlight:lantern:l1:save'];
  for (const [n, t] of [['ls659', L], ['v2', fx('save-v2.json')]]) {
    const r = parseSave(t);
    assert.ok(r.ok, n);
    const out = JSON.stringify(serializeSave(r.save));
    assert.equal(createHash('sha256').update(out).digest('hex'), createHash('sha256').update(gold[n]).digest('hex'), `${n} output equals the golden build (re-recorded at the S1 tree restart, v5: only gold / shards / tree / creep / seen / notes moved)`);
    assert.equal(Object.hasOwn(r.save.stats, 'sites'), false);
  }
});

test('E7 c:book and the page totals are unchanged for existing saves; Places never joins the book', () => {
  const stats = { killsByEnemy: { wolf: 5 }, runs: 2 };
  const b0 = almanac(save(stats), data, treeDef);
  const b1 = almanac(save({ ...stats, sites: { lamps: 20, roads: 9, knots: 9, wLamps: 20, wRoads: 9, wKnots: 9 } }), data, treeDef);
  assert.deepEqual(b1.pages, b0.pages);
  assert.equal(b1.complete.has('c:book'), b0.complete.has('c:book'));
  for (const k of ['s:lamp', 'sp:lamp:tells', 'c:places']) assert.equal(b0.unlocked.has(k), false);
  assert.ok(b1.unlocked.has('c:places'));
});

test('E7 model: grey until it wakes, then name + line + gift; Tells open at the count; 3 + 3 = 6; c:places only when all six', () => {
  const fresh = almanac(save({}, { tree: { gt_ghost_wolves: 1 } }), data, treeDef);
  const ft = fresh.tabs.find((t) => t.id === 'places');
  assert.deepEqual([ft.found, ft.total, ft.fresh], [0, 6, false]);
  for (const p of fresh.places) { assert.equal(p.known, false); assert.equal(p.name, ''); assert.equal(p.line, ''); assert.equal(p.gift, ''); assert.equal(p.tells.text, ''); assert.match(p.hint, /Somewhere in .+\. Keep walking\./); }
  assert.equal(fresh.unlocked.size, 0);
  const woke = almanac(save({ sites: { wLamps: 1 } }), data, treeDef);
  const lamp = woke.places.find((p) => p.id === 'lamp');
  assert.ok(lamp.known && lamp.name === 'Lamp Posts' && lamp.line && lamp.gift && !lamp.tells.open);
  assert.equal(woke.places.find((p) => p.id === 'road').known, false);
  assert.equal(woke.tabs.find((t) => t.id === 'places').found, 1);
  assert.ok(woke.unlocked.has('s:lamp') && !woke.unlocked.has('sp:lamp:tells'));
  const open = almanac(save({ sites: { wLamps: 9, lamps: PLACE.lamp.at } }), data, treeDef);
  const l2 = open.places.find((p) => p.id === 'lamp');
  assert.ok(l2.tells.open && /0:40/.test(l2.tells.text) && /4:20/.test(l2.tells.text) && /10:20/.test(l2.tells.text), l2.tells.text);
  assert.equal(open.tabs.find((t) => t.id === 'places').found, 2);
  const all = almanac(save({ sites: { lamps: 50, roads: 50, knots: 50, wLamps: 50, wRoads: 50, wKnots: 50 } }), data, treeDef);
  assert.equal(all.tabs.find((t) => t.id === 'places').found, 6);
  assert.ok(all.complete.has('c:places'));
  const road = all.places.find((p) => p.id === 'road').tells.text, knot = all.places.find((p) => p.id === 'knot').tells.text;
  assert.ok(/2:10/.test(road) && /8:00/.test(road) && /90/.test(road) && /110/.test(road), road);
  assert.ok(/5:30/.test(knot) && /9:20/.test(knot), knot);
  for (const k of ['s:knot', 'sp:road:tells', 'c:places']) assert.equal(tabOfKey(k), 'places');
  for (const id of PLACE_IDS) assert.equal(Object.hasOwn(PLACE[id], 'riddle'), false); // rewards are visible in the world: no riddles
});

test('E7 the Tells copy matches the live chapter data (times, timers, who gives what)', () => {
  const S = data.chapters.cursed_forest.sites;
  const t = placeTimes(S);
  assert.deepEqual(t.lamp, ['0:40', '4:20', '10:20']); assert.deepEqual(t.road, ['2:10', '8:00']); assert.deepEqual(t.knot, ['5:30', '9:20']); assert.deepEqual(t.roadTimer, [90, 110]);
  assert.equal(S.roads.list[0].set.bless, true); assert.ok(!S.roads.list[1].set.bless);
  assert.equal(S.knots.list[0].reward.bless, true); assert.ok(!S.knots.list[0].reward.shard); assert.equal(S.knots.list[1].reward.shard, 1);
  assert.ok(S.roads.list.every((r) => r.set.magnet)); assert.ok(S.knots.list.every((k) => k.reward.heart && k.reward.gold > 0 && k.reward.xp > 0));
  assert.ok(S.lamps.groups.every((g) => g.kinds.includes('xp') && g.kinds.includes('gold') && g.kinds.includes('heart')));
  for (const bad of [null, undefined, {}, { lamps: { groups: [{ t: -1 }] } }, { lamps: { groups: [{ t: 'x' }, {}, {}] }, roads: { list: [] }, knots: { list: [] } }]) assert.equal(placeTimes(bad), null);
});

test('E7 celebration: c:places is one big moment, told once, outside the book', () => {
  assert.ok(CEL.tabWhole.places && CEL.wholeLine.places);
  const book = almanac(save({ sites: { lamps: 50, roads: 50, knots: 50, wLamps: 50, wRoads: 50, wKnots: 50 } }), data, treeDef);
  const q = queue(book, { v: 1, read: '', told: '' }, data, { won: true });
  assert.equal(q.big.length, 1); assert.equal(q.big[0].key, 'c:places'); assert.equal(q.big[0].title, 'The places are whole');
  assert.ok(q.tell.includes('c:places'));
  const again = queue(book, { v: 1, read: '', told: setToBits(new Set(q.tell)) }, data, { won: true });
  assert.equal(again.big.length, 0);
});

test('E7 bankRun: counters add once per run, clamp, ignore forged values; no sites = no key', () => {
  const store = new SaveStore(memLocal());
  const base = { outcome: 'defeat', time: 100, kills: 1, gold: 0, shards: 0, level: 2, chapter: 'cursed_forest', character: 'wren' };
  store.bankRun({ ...base, sites: { lamp: [3, 4], road: [1, 2], knot: [0, 2] }, siteWoke: { lamp: 4, road: 1, knot: 1 } });
  assert.deepEqual(store.data.stats.sites, { lamps: 3, roads: 1, knots: 0, wLamps: 4, wRoads: 1, wKnots: 1 });
  store.bankRun({ ...base, sites: { lamp: [2, 4], road: [0, 2], knot: [1, 2] } }); // wakes missing: at least the finished ones
  assert.deepEqual(store.data.stats.sites, { lamps: 5, roads: 1, knots: 1, wLamps: 6, wRoads: 1, wKnots: 2 });
  store.bankRun({ ...base, sites: { lamp: [1e12, 4], road: ['x', 1], knot: [-5] }, siteWoke: { lamp: Infinity, road: {}, knot: '9' } }); // a numeric string counts like the other counters (pos), still capped at 24 per run
  assert.deepEqual(store.data.stats.sites, { lamps: 29, roads: 1, knots: 1, wLamps: 30, wRoads: 1, wKnots: 11 });
  store.bankRun({ ...base, sites: 'junk', siteWoke: [1, 2] });
  assert.equal(store.data.stats.sites.lamps, 29);
  const s2 = new SaveStore(memLocal());
  s2.bankRun({ ...base, sites: null });
  assert.equal(Object.hasOwn(s2.data.stats, 'sites'), false);
});

test('E7 debug / bot runs never bank (bankRun returns before the store is touched); wakes are counted in memory only', () => {
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(src, /bankRun\(sim\) \{\s*if \(this\.banked \|\| this\.isDebugRun\(\)\) return null;/);
  assert.match(src, /isDebugRun\(\) \{[^}]*p\.auto[^}]*p\.god[^}]*p\.debug/);
  assert.ok(src.includes('this.siteWoke'));
  assert.ok(!/save\.[a-zA-Z.]*sites\s*=/.test(src), 'app.js never writes stats.sites itself');
});

test('E7 copy: plain, bounded, riddle-free; Tells thresholds are small whole numbers', () => {
  const all = [];
  const T = { lamp: ['a', 'b', 'c'], road: ['a', 'b'], knot: ['a', 'b'], roadTimer: [1, 2] };
  for (const id of PLACE_IDS) { const P = PLACE[id]; all.push(P.name, P.line, P.gift, P.done(7), P.what, P.tells(T)); assert.ok(Number.isInteger(P.at) && P.at >= 3 && P.at <= 12); }
  all.push(CX.tabs.places, CX.placeHint('X'), CX.placeWhere('X'), CX.placeWoke(1), CX.placeWoke(2), CX.placeTellsNext('lamps lit', 8, 3), CX.placeLabelNew, CEL.tabWhole.places, CEL.wholeLine.places);
  for (const t of all) { assert.equal(typeof t, 'string'); assert.ok(t.length > 0 && t.length < 200, t); assert.ok(!/[<>{}]|riddle/i.test(t), t); assert.ok(!/Hollowlight/i.test(t), t); }
});
