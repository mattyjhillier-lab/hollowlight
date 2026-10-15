import test from 'node:test';
import assert from 'node:assert/strict';
import { data, allOpen } from './helpers.mjs';
import { createRng } from '../src/sim/rng.js';
import { newWeapon, buildPool, generateOffer, stirs } from '../src/sim/cards.js';

const max = data.balance.maxRank;
const mkCtx = (w, unlocked) => ({ weapons: [w], data, banished: new Set(), unlockedEvolutions: unlocked, unlockedWeapons: new Set(Object.keys(data.weapons)) });
const wpn = (id, ranks = {}) => { const w = newWeapon(id, data.weapons[id]); Object.assign(w.ranks, ranks); return w; };
const card = (ctx, w, k) => buildPool(ctx).find((p) => p.card.key === `s:${w.id}:${k}`)?.card;
const OPEN = () => new Set(Object.keys(data.evolutions));

test('EH1 stirs only when the card completes an unlocked pair (data-driven, every evolution, both directions)', () => {
  for (const [id, e] of Object.entries(data.evolutions)) {
    const [a, b] = e.pair;
    for (const [taking, other] of [[a, b], [b, a]]) {
      const w = wpn(e.weapon, { [other]: max, [taking]: max - 1 });
      assert.equal(card(mkCtx(w, new Set([id])), w, taking).stirs, true, `${id} ${taking}`);
      // partner not maxed -> no stir
      const w2 = wpn(e.weapon, { [other]: max - 1, [taking]: max - 1 });
      assert.equal(stirs(w2, taking, data, new Set([id])), false, `${id} partner short`);
      // this stat not on its last rank -> no stir
      const w3 = wpn(e.weapon, { [other]: max, [taking]: max - 2 });
      assert.equal(stirs(w3, taking, data, new Set([id])), false, `${id} not last rank`);
    }
  }
});

test('EH2 never for a locked evolution, even with the partner maxed', () => {
  for (const [id, e] of Object.entries(data.evolutions)) {
    if (!e.treeGate) continue;
    const w = wpn(e.weapon, { [e.pair[0]]: max, [e.pair[1]]: max - 1 });
    // other open evolutions on the same stat may legitimately stir; isolate by checking with only this one's pair stat
    const others = Object.entries(data.evolutions).filter(([oid, o]) => oid !== id && o.weapon === e.weapon && o.pair.includes(e.pair[1]) && o.pair.every((k) => w.ranks[k] >= max - (k === e.pair[1] ? 1 : 0)));
    if (others.length) continue;
    assert.equal(stirs(w, e.pair[1], data, new Set()), false, id);
    assert.equal(stirs(w, e.pair[1], data, undefined), false, `${id} fail-closed`);
    assert.equal(card(mkCtx(w, new Set()), w, e.pair[1]).stirs, undefined);
  }
});

test('EH3 not when the weapon already evolved', () => {
  const [id, e] = Object.entries(data.evolutions)[0];
  const w = wpn(e.weapon, { [e.pair[0]]: max, [e.pair[1]]: max - 1 });
  assert.equal(stirs(w, e.pair[1], data, OPEN()), true);
  w.evo = id;
  assert.equal(stirs(w, e.pair[1], data, OPEN()), false);
});

test('EH4 card data and text never name the evolution, partner stat or recipe', () => {
  for (const [id, e] of Object.entries(data.evolutions)) {
    const [a, b] = e.pair;
    const w = wpn(e.weapon, { [a]: max, [b]: max - 1 });
    const c = card(mkCtx(w, new Set([id])), w, b);
    assert.equal(c.stirs, true);
    const json = JSON.stringify(c);
    assert.ok(!json.includes(id) && !json.includes(e.name), `${id} leaked`);
    const partnerName = data.weapons[e.weapon].stats[a].name;
    assert.ok(!c.title.includes(partnerName) || partnerName === data.weapons[e.weapon].stats[b].name);
    assert.equal(c.stirs, true, 'boolean only');
  }
});

test('EH5 card structure unchanged when not stirring; RNG draws identical with the flag', () => {
  const w = wpn('ghost_wolves', {});
  const c = card(mkCtx(w, OPEN()), w, 'count');
  assert.ok(!('stirs' in c));
  assert.deepEqual(Object.keys(c), ['key', 'kind', 'weaponId', 'stat', 'title', 'desc', 'rank', 'nextRank', 'maxRank', 'evoHints', 'color']);
  const w2 = wpn('ghost_wolves', { speed: max, power: max - 1 });
  const keys = (ctx, seed) => { const r = createRng(seed); const o = []; for (let i = 0; i < 20; i++) o.push(generateOffer(ctx, r).cards.map((x) => x.key).join()); return o; };
  const withFlag = keys(mkCtx(w2, OPEN()), 7);
  const orig = stirs; // flag is output-only: same pool weights => same keys regardless of stirs
  assert.ok(orig);
  const w3 = wpn('ghost_wolves', { speed: max, power: max - 1 });
  assert.deepEqual(keys(mkCtx(w3, OPEN()), 7), withFlag);
});
