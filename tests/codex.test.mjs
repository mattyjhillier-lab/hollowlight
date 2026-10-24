// CX1-CX7 Almanac: model, save fields (hostile input), celebration queue, riddles. Pure modules only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef } from './helpers.mjs';
import { ENTRY_KEYS, MAX_BITS_HEX, cleanBits, bitsToSet, setToBits, cleanCodex, cleanTitles, almanac, adopt, markRead, markTold, withTitles, pageSpec, WOLF_HABITS_DEFAULT, TITLE_IDS, tabOfKey } from '../src/meta/codex.js';
import { queue, ledgerLine, sizeOf, CAP } from '../src/meta/celebrate.js';
import { RIDDLE, FOE, TITLES } from '../src/ui/codexcopy.js';
import { defaultSave, sanitize, parseSave, serializeSave } from '../src/save/schema.js';
import { SaveStore } from '../src/save/store.js';
import { TIER_IDS } from '../src/sim/tiers.js';

const save = (stats = {}, extra = {}) => sanitize({ ...defaultSave(1), stats: { ...defaultSave(1).stats, ...stats }, ...extra });

test('CX1 ENTRY_KEYS: unique, fits the hex field, covers every enemy / evolution / hero / tier (append-only list)', () => {
  assert.equal(new Set(ENTRY_KEYS).size, ENTRY_KEYS.length);
  assert.ok(ENTRY_KEYS.length <= MAX_BITS_HEX * 4);
  for (const id of Object.keys(data.enemies)) assert.ok(ENTRY_KEYS.includes(`f:${id}`), id);
  for (const id of Object.keys(data.evolutions)) assert.ok(ENTRY_KEYS.includes(`e:${id}`), id);
  for (const id of Object.keys(data.characters)) assert.ok(ENTRY_KEYS.includes(`h:${id}`), id);
  for (const t of TIER_IDS) assert.ok(ENTRY_KEYS.includes(`n:cursed_forest:${t}`), t);
  for (const w of Object.keys(data.weapons)) assert.ok(ENTRY_KEYS.includes(`c:${w}`), w);
  // pinned head of the list: bit positions never move
  assert.deepEqual(ENTRY_KEYS.slice(0, 3), ['f:wolf', 'f:crow', 'f:root_crawler']);
  assert.equal(ENTRY_KEYS.indexOf('e:phantom_stampede'), 23);
  for (const id of Object.keys(data.enemies)) assert.ok(Object.hasOwn(FOE, id), `copy for ${id}`);
});

test('CX1 bitsets round-trip; hostile input -> empty / masked', () => {
  const keys = new Set(['f:wolf', 'e:dire_alpha', 'c:book', 'l:4']);
  assert.deepEqual(bitsToSet(setToBits(keys)), keys);
  assert.equal(setToBits(new Set(['nope', '__proto__'])), '');
  for (const bad of [null, undefined, 5, {}, [], 'XYZ', 'f'.repeat(65), '0x1f', '1f ', '<img>', 'ＦＦ']) assert.equal(cleanBits(bad), '', String(bad));
  assert.equal(cleanBits('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').length <= Math.ceil(ENTRY_KEYS.length / 4), true); // bits beyond the list dropped
  assert.equal(cleanBits('000'), ''); // trailing zero nibbles trimmed
});

test('CX1 save fields: defaults, validation, unknown keys dropped, survives serialise + parse, hostile values', () => {
  const d = defaultSave(1);
  assert.deepEqual(d.codex, { v: 0, read: '', told: '' });
  assert.deepEqual(d.titles, { got: [], pick: '' });
  const bad = sanitize({ ...d, codex: { v: 7, read: 'zz', told: 5, evil: 1, __proto__: { x: 1 } }, titles: { got: ['friend_wolves', 'admin', 'friend_wolves', 3, '__proto__'], pick: 'admin', x: 1 } });
  assert.deepEqual(bad.codex, { v: 0, read: '', told: '' });
  assert.deepEqual(bad.titles, { got: ['friend_wolves'], pick: '' });
  for (const v of [null, 'str', 42, [], { got: 'x' }]) { const s = sanitize({ ...d, codex: v, titles: v }); assert.deepEqual(s.codex, { v: 0, read: '', told: '' }); assert.deepEqual(s.titles.got, []); }
  const many = sanitize({ ...d, titles: { got: Array(5000).fill('keeper_foes'), pick: 'keeper_foes' } });
  assert.deepEqual(many.titles, { got: ['keeper_foes'], pick: 'keeper_foes' });
  const good = sanitize({ ...d, codex: { v: 1, read: setToBits(new Set(['f:wolf'])), told: '1' }, titles: { got: ['walker_nights', 'friend_wolves'], pick: 'walker_nights' } });
  const back = parseSave(JSON.stringify(serializeSave(good)));
  assert.ok(back.ok);
  assert.deepEqual(back.save.codex, good.codex);
  assert.deepEqual(back.save.titles, { got: ['friend_wolves', 'walker_nights'], pick: 'walker_nights' });
  // an old v3 save without the fields reads as defaults (v 0: adopted on first open)
  const old = { ...JSON.parse(JSON.stringify(serializeSave(d))) }; delete old.codex; delete old.titles;
  const r = parseSave(JSON.stringify(old));
  assert.ok(r.ok); assert.equal(r.save.codex.v, 0);
  assert.equal(cleanTitles({ got: ['friend_wolves'], pick: 'keeper_foes' }).pick, '');
  assert.deepEqual(cleanCodex({ v: 1, read: 'f', told: '' }).v, 1);
});

test('CX1 store: setCodex / setTitles validate and write debounced', () => {
  const st = new SaveStore(null);
  st.load();
  const c = st.setCodex({ v: 1, read: 'GG', told: '3' });
  assert.deepEqual(c, { v: 1, read: '', told: '3' });
  assert.deepEqual(st.setTitles({ got: ['nope', 'hollow_remembers'], pick: 'nope' }), { got: ['hollow_remembers'], pick: '' });
  clearTimeout(st.timer);
});

test('CX1 pages: same counts as the Almanac tree nodes; pending nodes stay out of the book', () => {
  const w = pageSpec(treeDef, 'wolf');
  assert.deepEqual(w.map((p) => [p.page, p.at, p.live]), [['habits', WOLF_HABITS_DEFAULT, true], ['weakness', 4000, true], ['tells', 12000, true]]);
  const c = pageSpec(treeDef, 'crow');
  assert.deepEqual(c.map((p) => [p.at, p.live]), [[1000, true], [4000, true], [12000, false]]); // bs_crow3 pending since T6
  const t = pageSpec(treeDef, 'elder_treant');
  assert.deepEqual(t.map((p) => p.at), [1, 5, 15]);
});

test('CX1 almanac: fresh save = all unknown, no names leak, no recipes', () => {
  const b = almanac(save(), data, treeDef);
  assert.equal(b.unlocked.size, 0);
  for (const f of b.foes) { assert.equal(f.known, false); assert.equal(f.name || '', ''); assert.equal(f.line || '', ''); }
  for (const w of b.spirits) for (const e of w.evos) { assert.equal(e.recipe, undefined); assert.equal(e.name, undefined); assert.equal(e.riddle, undefined); }
  assert.deepEqual(b.tabs.map((t) => t.found), [0, 0, 0, 0]);
  assert.equal(b.pages.found, 0);
  assert.ok(b.pages.total > 30);
  // non-gated evolutions are sealed (awake) even on a fresh save; gated ones sleep with a vague line until progress begins
  const gw = b.spirits.find((w) => w.id === 'ghost_wolves');
  assert.equal(gw.evos.find((e) => e.id === 'howling_legion').state, 'sealed');
  assert.equal(gw.evos.find((e) => e.id === 'dire_alpha').state, 'sleeping');
  assert.equal(b.spirits.find((w) => w.id === 'raven_flock').known, false);
});

test('CX1 almanac: kills open foes and pages at the thresholds; found evolutions show the recipe', () => {
  const s = save({ killsByEnemy: { wolf: 4100, crow: 10 }, bossKills: { elder_treant: 1 }, evolved: { howling_legion: 6 }, charsUsed: { wren: 3 }, runs: 3, wins: 1 });
  const b = almanac(s, data, treeDef);
  const wolf = b.foes.find((f) => f.id === 'wolf');
  assert.equal(wolf.name, 'Fell Wolf');
  assert.deepEqual(wolf.pages.map((p) => p.open), [true, true, false]);
  assert.equal(wolf.pages[2].text, '');
  const tr = b.foes.find((f) => f.id === 'elder_treant');
  assert.ok(tr.known); assert.deepEqual(tr.pages.map((p) => p.open), [true, false, false]);
  const hl = b.spirits.find((w) => w.id === 'ghost_wolves').evos.find((e) => e.id === 'howling_legion');
  assert.equal(hl.state, 'found'); assert.deepEqual(hl.recipe, ['Pack size', 'Rend']); assert.equal(hl.taken, 6);
  assert.ok(b.unlocked.has('h:wren') && !b.unlocked.has('h:elias'));
  assert.ok(b.unlocked.has('l:1') && b.unlocked.has('l:2') && !b.unlocked.has('l:3'));
  assert.equal(b.tabs.find((t) => t.id === 'spirits').found, 1);
  assert.ok(b.isNew('f:wolf')); // nothing read yet
  const r = markRead(s.codex, ['f:wolf', 'bogus']);
  assert.ok(!almanac({ ...s, codex: r }, data, treeDef).isNew('f:wolf'));
});

test('CX7 riddles: one stat of the pair only, never both; shown only with the Full Almanac (or forced preview)', () => {
  for (const [id, ev] of Object.entries(data.evolutions)) {
    const r = RIDDLE[id];
    assert.ok(r, id);
    assert.ok(ev.pair.includes(r.stat), `${id} riddle stat in pair`);
    const other = ev.pair.find((p) => p !== r.stat);
    const lab = data.weapons[ev.weapon].stats[other].name.toLowerCase();
    assert.ok(!r.line.toLowerCase().includes(lab), `${id} riddle must not name ${lab}`);
    assert.ok(r.line.length <= 70);
  }
  const s = save();
  const sealed = (b) => b.spirits.flatMap((w) => w.evos).filter((e) => e.state === 'sealed');
  assert.ok(sealed(almanac(s, data, treeDef)).every((e) => !e.riddle));
  assert.ok(sealed(almanac(s, data, treeDef, { riddles: true })).every((e) => typeof e.riddle === 'string' && e.riddle));
  assert.ok(Object.hasOwn(treeDef.pending, 'bs_page'), 'Full Almanac stays inert until Matt reads the riddles');
});

test('CX1 adopt: an old save holds its progress as read + told (no flood); a v1 codex is untouched', () => {
  const s = save({ killsByEnemy: { wolf: 50 }, evolved: { sanctum_halo: 1 } });
  const b = almanac(s, data, treeDef);
  const c = adopt(s.codex, b);
  assert.equal(c.v, 1);
  assert.deepEqual(bitsToSet(c.read), b.unlocked);
  assert.deepEqual(adopt(c, almanac(save(), data, treeDef)), c);
  assert.equal(queue(almanac({ ...s, codex: c }, data, treeDef), c, data).tell.length, 0);
});

test('CX4 queue: sizes, caps (1 big + 3 medium), order, once only, defeat holds bigs for the title', () => {
  assert.equal(sizeOf('c:book'), 'big'); assert.equal(sizeOf('e:soul_lance'), 'medium'); assert.equal(sizeOf('f:wolf'), 'small');
  const evolved = Object.fromEntries(Object.keys(data.evolutions).map((k) => [k, 1]));
  const s = save({ killsByEnemy: { wolf: 5, crow: 5, stoat_piper: 1 }, evolved, runs: 1 });
  const b = almanac(s, data, treeDef);
  const q = queue(b, s.codex, data, { won: true });
  assert.equal(q.big.length, CAP.big);
  assert.equal(q.medium.length, CAP.medium);
  assert.equal(q.waiting, 5, 'the other completions wait'); // 5 weapon pages + spirits tab, one shown
  assert.ok(q.more >= 12);
  assert.ok(q.medium.every((i) => i.kind === 'evo' && i.gold && /Recipe: /.test(i.sub) && i.cue.startsWith('evo_')));
  assert.ok(q.big[0].pills.length === 2 && q.big[0].cue === 'tree_whole');
  for (const k of q.tell) assert.ok(!k.startsWith('c:') || q.big.some((i) => i.key === k), 'held bigs are not told');
  const told = markTold(s.codex, q.tell);
  const q2 = queue(b, told, data, { won: true });
  assert.equal(q2.medium.length + q2.small.length, 0, 'never twice');
  assert.equal(q2.big.length, 1);
  // defeat: no bigs, mediums and smalls kept
  const qd = queue(b, s.codex, data, { won: false });
  assert.equal(qd.big.length, 0); assert.equal(qd.medium.length, 3); assert.ok(qd.small.length > 0);
  assert.ok(qd.tell.every((k) => !k.startsWith('c:')));
  const qt = queue(b, markTold(s.codex, qd.tell), data, { place: 'title' });
  assert.equal(qt.big.length, 1); assert.equal(qt.medium.length, 0);
  const led = ledgerLine(qd);
  assert.ok(led.names.split(', ').length <= CAP.ledger && /^\+\d+ more in the Almanac$/.test(led.more));
});

test('CX6 titles: earned from completions only, never removed, pick defaults to the newest, fixed list', () => {
  const evolved = Object.fromEntries(Object.keys(data.evolutions).filter((k) => data.evolutions[k].weapon === 'ghost_wolves').map((k) => [k, 2]));
  const b = almanac(save({ evolved }), data, treeDef);
  assert.deepEqual(b.earned, ['friend_wolves']);
  const t = withTitles(undefined, b.earned);
  assert.deepEqual(t, { got: ['friend_wolves'], pick: 'friend_wolves' });
  assert.deepEqual(withTitles({ got: ['friend_wolves'], pick: 'friend_wolves' }, []), t);
  for (const id of TITLE_IDS) assert.ok(TITLES[id].name.length <= 24);
  assert.equal(tabOfKey('fp:wolf:tells'), 'foes'); assert.equal(tabOfKey('c:book'), '');
});
