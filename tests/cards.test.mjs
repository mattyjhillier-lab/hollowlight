import test from 'node:test';
import assert from 'node:assert/strict';
import { data, allOpen } from './helpers.mjs';
import { createRng } from '../src/sim/rng.js';
import {
  newWeapon, buildPool, generateOffer, rerollOffer, banishCard, applyCard,
  availableEvolutions, goldCards, xpForLevel, evoTrigger,
} from '../src/sim/cards.js';

const ids = Object.keys(data.weapons);
const mk = (...weaponIds) => ({
  weapons: weaponIds.map((id) => newWeapon(id, data.weapons[id])),
  data,
  banished: new Set(),
});
// Shipped data gates 3 weapons + 9 evolutions behind the tree (G1b). mkOpen = the old everything-unlocked context.
const mkOpen = (...weaponIds) => allOpen(mk(...weaponIds));
const maxStat = (w, stat) => { w.ranks[stat] = data.balance.maxRank; };

test('data sanity: every evolution points at a real weapon and real stats', () => {
  for (const [id, evo] of Object.entries(data.evolutions)) {
    const def = data.weapons[evo.weapon];
    assert.ok(def, `${id} weapon exists`);
    for (const s of evo.pair) assert.ok(def.stats[s], `${id} stat ${s} exists`);
    assert.notEqual(evo.pair[0], evo.pair[1]);
  }
  // 5 weapons, 2-3 evolutions each, 15 total in this build
  assert.equal(Object.keys(data.evolutions).length, 15);
});

test('open slots: a tree-less run offers no weapon card (v2: every weapon is a tree gate); unlocked weapons join the pool', () => {
  const pool = buildPool(mk('ghost_wolves'));
  const keys = (p) => new Set(p.filter((x) => x.card.kind === 'weapon').map((x) => x.card.weaponId));
  assert.deepEqual(keys(pool), new Set(), 'no tree: only the starting spirit (CHARACTER SYSTEM v2 starter set)');
  const open = buildPool(mkOpen('ghost_wolves'));
  assert.deepEqual(keys(open), new Set(ids.filter((i) => i !== 'ghost_wolves')));
  assert.equal(open.filter((p) => p.card.kind === 'stat').length, 4);
});

test('slots full: only stat cards for owned weapons are offered', () => {
  const ctx = mk('ghost_wolves', 'raven_flock', 'spirit_bolts', 'chain_lightning');
  assert.equal(ctx.weapons.length, data.balance.weaponSlots);
  const pool = buildPool(ctx);
  assert.ok(pool.every((p) => p.card.kind === 'stat'));
  assert.equal(pool.length, 16);
  const rng = createRng(5);
  for (let i = 0; i < 200; i++) {
    const offer = generateOffer(ctx, rng);
    assert.ok(offer.cards.every((c) => c.kind === 'stat' && ctx.weapons.some((w) => w.id === c.weaponId)));
  }
});

test('offers have 3 distinct cards', () => {
  const ctx = mk('ghost_wolves');
  const rng = createRng(11);
  for (let i = 0; i < 200; i++) {
    const { cards } = generateOffer(ctx, rng);
    assert.equal(cards.length, 3);
    assert.equal(new Set(cards.map((c) => c.key)).size, 3);
  }
});

test('maxed stats leave the pool; applying a stat card raises the rank by one', () => {
  const ctx = mk('ghost_wolves');
  const w = ctx.weapons[0];
  maxStat(w, 'speed');
  assert.ok(!buildPool(ctx).some((p) => p.card.key === 's:ghost_wolves:speed'));
  const card = buildPool(ctx).find((p) => p.card.key === 's:ghost_wolves:power').card;
  applyCard(ctx, card);
  assert.equal(w.ranks.power, 1);
  assert.equal(w.s.power, data.weapons.ghost_wolves.stats.power.base + data.weapons.ghost_wolves.stats.power.perRank);
});

test('ranks never exceed the max', () => {
  const ctx = mk('ghost_wolves');
  const w = ctx.weapons[0];
  const card = buildPool(ctx).find((p) => p.card.key === 's:ghost_wolves:power').card;
  for (let i = 0; i < 12; i++) applyCard(ctx, card);
  assert.equal(w.ranks.power, data.balance.maxRank);
});

const TRIG = data.balance.evoTriggerRanks;
// give a weapon exactly n stat ranks, spread over its stats (any distribution counts: flow v2)
const giveRanks = (w, n, order = Object.keys(w.ranks)) => { let left = n; for (const k of order) { const t = Math.min(data.balance.maxRank, left); w.ranks[k] = t; left -= t; } };

test('EV1 evolution gold cards appear at the trigger rank total, whatever stats the ranks are in', () => {
  const ctx = mkOpen('ghost_wolves');
  const w = ctx.weapons[0];
  giveRanks(w, TRIG - 1);
  assert.deepEqual(availableEvolutions(w, data, ctx.unlockedEvolutions), []);
  assert.deepEqual(goldCards(ctx), []);
  for (const order of [['power', 'speed', 'duration', 'count'], ['count', 'duration', 'speed', 'power'], ['speed', 'count', 'power', 'duration']]) {
    const w2 = newWeapon('ghost_wolves', data.weapons.ghost_wolves);
    giveRanks(w2, TRIG, order);
    assert.equal(availableEvolutions(w2, data, ctx.unlockedEvolutions).length, 3, order.join());
  }
  giveRanks(w, TRIG);
  const offer = generateOffer(ctx, createRng(2));
  assert.equal(offer.gold.length, 3);
  assert.ok(offer.gold.every((g) => g.kind === 'evolution' && g.weaponId === 'ghost_wolves'));
});

test('EV1 every UNLOCKED evolution of the weapon is offered; one unlocked still gives one gold card; none gives none', () => {
  const ctx = mkOpen('ghost_wolves');
  const w = ctx.weapons[0];
  giveRanks(w, TRIG);
  assert.deepEqual(new Set(availableEvolutions(w, data, ctx.unlockedEvolutions)), new Set(['phantom_stampede', 'dire_alpha', 'howling_legion']));
  assert.deepEqual(availableEvolutions(w, data, new Set(['dire_alpha'])).sort(), ['dire_alpha', 'howling_legion']); // the free one is always open
  assert.deepEqual(goldCards({ ...ctx, unlockedEvolutions: new Set() }).map((c) => c.evoId), ['howling_legion']);
  const o = mkOpen('raven_flock'); giveRanks(o.weapons[0], TRIG);
  assert.deepEqual(goldCards({ ...o, unlockedEvolutions: new Set() }), [], 'a gated-only weapon with none unlocked has no trigger');
});

test('EV1 the 3-card cap is PER WEAPON: two weapons due at once show up to 3 each', () => {
  const ctx = mkOpen('ghost_wolves', 'holy_orbit');
  for (const w of ctx.weapons) giveRanks(w, TRIG);
  const gold = goldCards(ctx);
  assert.equal(gold.filter((c) => c.weaponId === 'ghost_wolves').length, 3);
  assert.equal(gold.filter((c) => c.weaponId === 'holy_orbit').length, 3);
  assert.equal(gold.length, 6);
});

test('EV1 Louder Stirring (evoEarly) offers the awakening one rank sooner, never below the floor', () => {
  const ctx = mkOpen('ghost_wolves');
  const w = ctx.weapons[0];
  giveRanks(w, TRIG - 1);
  assert.equal(goldCards(ctx).length, 0);
  assert.equal(goldCards({ ...ctx, evoEarly: true }).length, 3);
  giveRanks(w, TRIG - 2);
  assert.equal(goldCards({ ...ctx, evoEarly: true }).length, 0);
  assert.equal(evoTrigger({ balance: { evoTriggerRanks: 3 } }, true), 3, 'floor holds');
  assert.equal(evoTrigger({ balance: { evoTriggerRanks: 'x' } }), 15, 'bad data falls back');
});

test('taking an evolution replaces the base weapon and removes the other choices and stat cards', () => {
  const ctx = mkOpen('ghost_wolves');
  const w = ctx.weapons[0];
  maxStat(w, 'power'); maxStat(w, 'speed'); maxStat(w, 'duration'); w.ranks.count = TRIG - 15;
  const gold = goldCards(ctx);
  const dire = gold.find((c) => c.evoId === 'dire_alpha');
  applyCard(ctx, dire);
  assert.equal(w.evo, 'dire_alpha');
  assert.deepEqual(availableEvolutions(w, data, ctx.unlockedEvolutions), []);
  assert.deepEqual(goldCards(ctx), []);
  // D1 (Matt 2026-10-16): non-recipe stats keep appearing; recipe stats are maxed so they have left the pool.
  const stats = buildPool(ctx).filter((p) => p.card.kind === 'stat' && p.card.weaponId === 'ghost_wolves').map((p) => p.card.stat).sort();
  assert.deepEqual(stats, ['count', 'speed'].sort().filter((k) => w.ranks[k] < data.balance.maxRank));
});

test('D1: an evolved weapon keeps offering every stat not at max, no nudge, no stirs, never the weapon or an evolution card', () => {
  for (const [evoId, evo] of Object.entries(data.evolutions)) {
    const ctx = mkOpen(evo.weapon);
    const w = ctx.weapons[0];
    giveRanks(w, TRIG);
    applyCard(ctx, goldCards(ctx).find((c) => c.evoId === evoId));
    assert.equal(w.evo, evoId);
    const rest = Object.keys(data.weapons[evo.weapon].stats).filter((k) => w.ranks[k] < data.balance.maxRank);
    const pool = buildPool(ctx);
    const mine = pool.filter((p) => p.card.weaponId === evo.weapon);
    assert.deepEqual(mine.map((p) => p.card.stat).sort(), rest.sort(), `${evoId} offers exactly the stats not yet at max`);
    for (const p of mine) {
      assert.equal(p.card.kind, 'stat');
      assert.equal(p.w, 1, `${evoId} ${p.card.stat}: no weighting`);
      assert.equal(p.card.stirs, undefined);
      assert.equal(p.card.evoHints, undefined);
    }
    assert.ok(!pool.some((p) => p.card.kind === 'weapon' && p.card.weaponId === evo.weapon), 'weapon card not re-offered');
    assert.deepEqual(goldCards(ctx), [], 'no further evolution');
    // taking the cards ranks the stat up and removes it at max
    for (const k of rest) { while (w.ranks[k] < data.balance.maxRank) applyCard(ctx, buildPool(ctx).find((p) => p.card.key === `s:${evo.weapon}:${k}`).card); assert.equal(w.ranks[k], data.balance.maxRank); }
    assert.ok(!buildPool(ctx).some((p) => p.card.weaponId === evo.weapon), 'all maxed -> weapon leaves the pool (fallbacks cover)');
    assert.equal(w.evo, evoId, 'still evolved, cannot re-evolve');
  }
});

test('weapon cards are weighted up so new weapons show up reasonably often', () => {
  const ctx = mkOpen('ghost_wolves', 'raven_flock', 'spirit_bolts');
  const rng = createRng(99);
  let withWeapon = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    if (generateOffer(ctx, rng).cards.some((c) => c.kind === 'weapon')) withWeapon++;
  }
  const rate = withWeapon / N;
  assert.ok(rate > 0.25 && rate < 0.95, `rate ${rate}`);
});

test('fallback cards fill the offer when everything is maxed', () => {
  const ctx = mk('ghost_wolves', 'raven_flock', 'spirit_bolts', 'chain_lightning');
  for (const w of ctx.weapons) for (const k of Object.keys(w.ranks)) maxStat(w, k);
  const offer = generateOffer(ctx, createRng(3));
  assert.equal(offer.cards.length, 3);
  assert.ok(offer.cards.every((c) => c.kind === 'fallback'));
});

test('banish removes the card from this offer and from the pool for the rest of the run', () => {
  const ctx = mk('ghost_wolves');
  const rng = createRng(8);
  let offer = generateOffer(ctx, rng);
  const victim = offer.cards[0].key;
  offer = banishCard(ctx, rng, offer, victim);
  assert.equal(offer.cards.length, 3);
  assert.ok(!offer.cards.some((c) => c.key === victim));
  for (let i = 0; i < 100; i++) {
    assert.ok(!generateOffer(ctx, rng).cards.some((c) => c.key === victim));
  }
});

test('reroll redraws normal cards but keeps gold evolution cards', () => {
  const ctx = mk('ghost_wolves');
  const w = ctx.weapons[0];
  maxStat(w, 'speed'); maxStat(w, 'power');
  const rng = createRng(4);
  const offer = generateOffer(ctx, rng);
  const again = rerollOffer(ctx, rng, offer);
  assert.equal(again.cards.length, 3);
  assert.deepEqual(again.gold, offer.gold);
});

test('xp curve is increasing', () => {
  let prev = 0;
  for (let l = 1; l < 60; l++) {
    const need = xpForLevel(l, data.balance);
    assert.ok(need >= prev);
    prev = need;
  }
});

test('EV1 a focused player readies a first evolution after roughly 15-30 level-ups (4 weapons held, everything unlocked)', () => {
  const ids4 = ['ghost_wolves', 'raven_flock', 'spirit_bolts', 'chain_lightning'];
  const results = [];
  for (let seed = 1; seed <= 300; seed++) {
    const rng = createRng(seed);
    const ctx = mkOpen(...ids4);
    const target = ctx.weapons[0];
    let n = 0;
    for (n = 1; n <= 90; n++) {
      const offer = generateOffer(ctx, rng);
      const card = offer.gold[0]
        || offer.cards.find((c) => c.kind === 'stat' && c.weaponId === target.id)
        || offer.cards.find((c) => c.kind === 'stat') || offer.cards[0];
      if (card.kind !== 'fallback') applyCard(ctx, card);
      if (availableEvolutions(target, data, ctx.unlockedEvolutions).length) break;
    }
    results.push(n);
  }
  results.sort((a, b) => a - b);
  const median = results[150];
  console.log('median level-ups to ready an evolution:', median);
  assert.ok(median >= 15 && median <= 30, `median ${median}`);
});
