import test from 'node:test';
import assert from 'node:assert/strict';
import { INTRO_IDS, INTRO_MASK, cleanIntros, hasIntro, withIntro, cardFor, introsForOffer, CARDS, VETERAN_SEEN } from '../src/ui/introcopy.js';
import { sanitize, defaultSave, parseSave, serializeSave } from '../src/save/schema.js';

test('bits: clean, set, read; junk is 0', () => {
  for (const bad of [-1, 1.5, NaN, Infinity, '3', null, undefined, {}, [], 2 ** 60]) assert.equal(cleanIntros(bad), bad === 2 ** 60 ? 0 : 0, String(bad));
  assert.equal(cleanIntros(0xffff), INTRO_MASK);
  let b = 0;
  for (const id of INTRO_IDS) { assert.equal(hasIntro(b, id), false); b = withIntro(b, id); assert.equal(hasIntro(b, id), true); }
  assert.equal(b, INTRO_MASK);
  assert.equal(withIntro(5, 'constructor'), 5);
  assert.equal(hasIntro(INTRO_MASK, '__proto__'), false);
});
test('every id has a card; text is short plain strings', () => {
  for (const id of INTRO_IDS) {
    const c = cardFor(id, { abilityName: 'Pelt Dash', key: 'SPACE' });
    assert.ok(c && c.title && c.title.length <= 24, id);
    assert.ok(c.lines.length >= 2 && c.lines.length <= 3, id);
    for (const l of c.lines) { assert.equal(typeof l, 'string'); assert.ok(l.length <= 130, `${id}: ${l}`); assert.ok(!/hollowlight/i.test(l)); }
  }
  assert.deepEqual(Object.keys(CARDS).sort(), [...INTRO_IDS].sort());
  assert.equal(cardFor('nope'), null); assert.equal(cardFor('__proto__'), null); assert.equal(cardFor(5), null);
});
test('ability card follows input and clips hostile ctx', () => {
  assert.match(cardFor('ability', { abilityName: 'Pelt Dash', key: 'SPACE' }).lines.join(' '), /Press SPACE for Pelt Dash/);
  assert.match(cardFor('ability', { abilityName: 'Pelt Dash', touch: true }).lines.join(' '), /Tap the glowing button/);
  const c = cardFor('ability', { abilityName: 'x'.repeat(500), key: '\u0000'.repeat(50) });
  assert.ok(c.lines.join('').length < 220);
});
test('offer -> cards', () => {
  assert.deepEqual(introsForOffer(null), []);
  assert.deepEqual(introsForOffer({ gold: [{ kind: 'evolution' }], cards: [{ kind: 'blessing' }, { kind: 'fallback', fallback: 'shard' }] }), ['evolution', 'blessing', 'shard']);
  assert.deepEqual(introsForOffer({ gold: [], cards: [{ kind: 'stat' }, { kind: 'fallback', fallback: 'heal' }] }), []);
  assert.deepEqual(introsForOffer({ gold: 'x', cards: {}, start: 'siteBless' }), ['blessing']);
});
test('save: default 0, round trip, hostile values dropped', () => {
  assert.equal(defaultSave().intros, 0);
  const s = defaultSave(); s.intros = withIntro(withIntro(0, 'knot'), 'shard');
  assert.equal(parseSave(JSON.stringify(serializeSave(s))).save.intros, s.intros);
  for (const bad of ['7', -3, 1e300, 2.5, null, {}, [1], NaN]) assert.equal(sanitize({ version: 3, intros: bad }).intros, 0, String(bad));
  assert.equal(sanitize({ version: 3, intros: 2 ** 40 + 3 }).intros, 3);
});
test('save: a lantern with runs and no intros field has its own ability marked seen; a fresh one has none', () => {
  const vet = sanitize({ version: 3, stats: { runs: 4 } });
  for (const id of VETERAN_SEEN) assert.equal(hasIntro(vet.intros, id), true);
  assert.equal(hasIntro(vet.intros, 'lamp'), false);
  assert.equal(sanitize({ version: 3, stats: { runs: 0 } }).intros, 0);
  assert.equal(sanitize({ version: 3, stats: { runs: 4 }, intros: 0 }).intros, 0); // an explicit 0 stays 0
});
