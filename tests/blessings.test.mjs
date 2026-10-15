import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { createRng } from '../src/sim/rng.js';
import { Sim } from '../src/sim/Sim.js';
import { newWeapon, generateOffer, rerollOffer, banishCard } from '../src/sim/cards.js';
import { validateBlessings, blessingCount } from '../src/sim/blessings.js';

const def = validateBlessings(data.blessings);
const IDS = Object.keys(def.items);
const maxAll = (w) => { for (const k of Object.keys(w.ranks)) w.ranks[k] = data.balance.maxRank; };
// Slots full, every stat maxed except `open` (list of "weaponIdx:stat") => that many real cards left.
const ctxWith = (open = [], ranks = {}) => {
  const weapons = ['ghost_wolves', 'raven_flock', 'spirit_bolts', 'chain_lightning'].map((id) => newWeapon(id, data.weapons[id]));
  weapons.forEach(maxAll);
  for (const o of open) { const [i, s] = o.split(':'); weapons[Number(i)].ranks[s] = 0; }
  return { weapons, data, banished: new Set(), blessings: def, blessRanks: { ...ranks } };
};
const real = (cards) => cards.filter((c) => ['weapon', 'stat', 'evolution'].includes(c.kind));

test('blessings data validates and rejects bad ids', () => {
  assert.equal(blessingCount(def), 5);
  assert.deepEqual(IDS.sort(), ['dawnlit_soles', 'kind_fortune', 'kindled_spirits', 'wider_glow', 'wrapped_warmth']);
  const item = { name: 'Ok One', desc: 'Fine text.', effect: 'gold', perRank: 0.05, ranks: 2, weight: 1 };
  const raw = JSON.parse(JSON.stringify({ caps: data.blessings.caps, heal: data.blessings.heal, items: {} }));
  const bad = JSON.parse('{"__proto__": {"name":"x","desc":"y","effect":"gold","perRank":0.05,"ranks":2,"weight":1}}');
  raw.items = Object.assign(JSON.parse('{}'), {
    good: item, 'Bad Id': item, constructor: item, b1: { ...item, ranks: 9 }, b2: { ...item, effect: 'win' }, b3: { ...item, perRank: NaN }, b4: { ...item, name: '<img onerror=x>' }, b5: { ...item, weight: 0 }, b6: { ...item, desc: 5 },
  });
  Object.defineProperty(raw.items, '__proto__', { value: bad.__proto__, enumerable: true });
  const v = validateBlessings(raw);
  assert.deepEqual(Object.keys(v.items), ['good']);
  assert.equal(Object.getPrototypeOf(v.items), null);
  assert.equal(blessingCount(validateBlessings(null)), 0);
  assert.equal(blessingCount(validateBlessings({ items: raw.items })), 0, 'missing caps fails closed');
  assert.equal(blessingCount(validateBlessings({ ...raw, caps: { ...raw.caps, damage: 50 } })), 0, 'absurd cap fails closed');
});

test('offer fills real first then blessings then fallbacks', () => {
  const c1 = ctxWith(['0:power']);
  for (let i = 0; i < 50; i++) {
    const { cards } = generateOffer(c1, createRng(i));
    assert.equal(cards.length, 3);
    assert.equal(real(cards).length, 1);
    assert.equal(cards.filter((c) => c.kind === 'blessing').length, 2);
    assert.ok(!cards.some((c) => c.kind === 'fallback'));
  }
  const c0 = ctxWith();
  const { cards } = generateOffer(c0, createRng(1));
  assert.ok(cards.every((c) => c.kind === 'blessing'));
});

test('no blessing while 3 real cards exist', () => {
  const c = ctxWith(['0:power', '0:speed', '1:power']);
  for (let i = 0; i < 200; i++) assert.ok(generateOffer(c, createRng(i)).cards.every((x) => x.kind === 'stat'));
});

test('no duplicate blessing within one offer, including after banish and reroll', () => {
  const c = ctxWith();
  const rng = createRng(4);
  for (let i = 0; i < 200; i++) {
    let offer = generateOffer(c, rng);
    if (i % 3 === 1) offer = rerollOffer(c, rng, offer);
    if (i % 3 === 2) offer = banishCard({ ...c, banished: new Set() }, rng, offer, offer.cards[0].key);
    assert.equal(new Set(offer.cards.map((x) => x.key)).size, offer.cards.length);
    assert.ok(offer.cards.every((x) => /^b:/.test(x.key)));
  }
});

test('banished blessing never reappears', () => {
  const c = ctxWith();
  const rng = createRng(9);
  let offer = generateOffer(c, rng);
  const victim = offer.cards[0].key;
  offer = banishCard(c, rng, offer, victim);
  assert.ok(!offer.cards.some((x) => x.key === victim));
  for (let i = 0; i < 100; i++) assert.ok(!generateOffer(c, rng).cards.some((x) => x.key === victim));
});

test('maxed blessings leave the pool; keys never collide with other prefixes', () => {
  const c = ctxWith([], { wider_glow: 3, dawnlit_soles: 2 });
  for (let i = 0; i < 100; i++) {
    const { cards } = generateOffer(c, createRng(i));
    assert.ok(!cards.some((x) => x.blessId === 'wider_glow' || x.blessId === 'dawnlit_soles'));
    assert.ok(cards.every((x) => x.kind !== 'blessing' || /^b:[a-z0-9_]+$/.test(x.key)));
  }
});

test('fallbacks only when all blessings are maxed', () => {
  const all = Object.fromEntries(IDS.map((id) => [id, def.items[id].ranks]));
  const { cards } = generateOffer(ctxWith([], all), createRng(2));
  assert.ok(cards.every((x) => x.kind === 'fallback'));
  const one = { ...all, kind_fortune: 0 };
  const o2 = generateOffer(ctxWith([], one), createRng(2)).cards;
  assert.equal(o2.filter((x) => x.kind === 'blessing').length, 1);
  assert.equal(o2.filter((x) => x.kind === 'fallback').length, 2);
});

test('evolution gold card unaffected by blessings', () => {
  const c = ctxWith();
  c.weapons[0].ranks = { ...c.weapons[0].ranks };
  c.unlockedEvolutions = new Set(Object.keys(data.evolutions));
  const w = newWeapon('ghost_wolves', data.weapons.ghost_wolves);
  maxAll(w);
  c.weapons[0] = w;
  const offer = generateOffer(c, createRng(1));
  assert.ok(offer.gold.length >= 1 && offer.gold.every((x) => x.kind === 'evolution'));
  assert.ok(offer.cards.every((x) => x.kind === 'blessing'));
});

function lowHpSim(pending = 3) {
  const sim = new Sim({ data, characterId: 'wren', seed: 5, godMode: false });
  for (const [id, evo] of [['ghost_wolves', null], ['holy_orbit', null]]) sim.debugGrant(id, { power: 5, speed: 5, count: 5, size: 5, duration: 5, radius: 5, area: 5 }, evo);
  // make the real pool empty: max every stat on both weapons
  for (const w of sim.weapons) for (const k of Object.keys(w.ranks)) w.ranks[k] = data.balance.maxRank;
  sim.player.hp = sim.player.maxHp * 0.2;
  sim.pending = pending;
  return sim;
}

test('heal swap needs hp<40pct and respects cooldown (3 pending chain)', () => {
  const sim = lowHpSim(3);
  const swapped = (o) => o.cards.filter((c) => c.swapped);
  sim.beginLevelUp();
  assert.equal(swapped(sim.offer).length, 1, 'low hp: one swap');
  assert.equal(sim.offer.cards.filter((c) => c.key === 'f:heal').length, 1);
  assert.ok(sim.offer.cards.some((c) => c.kind === 'blessing'), 'only the last blessing replaced');
  sim.pickCard('f:heal');
  assert.ok(sim.player.hp > sim.player.maxHp * 0.2);
  sim.player.hp = sim.player.maxHp * 0.1; // low again immediately
  assert.equal(sim.state, 'levelup', 'chain continues');
  assert.equal(swapped(sim.offer).length, 0, 'cannot chain inside the cooldown');
  sim.pickCard(sim.offer.cards[0].key);
  assert.equal(swapped(sim.offer).length, 0, '3rd in chain: still none');
  sim.pickCard(sim.offer.cards[0].key);
  assert.equal(sim.state, 'running');
  sim.time += 46;
  sim.pending = 1;
  sim.beginLevelUp();
  assert.equal(swapped(sim.offer).length, 1, 'ready again after the cooldown');
  const healthy = lowHpSim(1);
  healthy.player.hp = healthy.player.maxHp * 0.5;
  healthy.beginLevelUp();
  assert.equal(swapped(healthy.offer).length, 0, 'above 40pct: no swap');
});

test('banishing the swapped heal disables the swap for the run', () => {
  const sim = lowHpSim(1);
  sim.banishesLeft = 2;
  sim.beginLevelUp();
  assert.ok(sim.offer.cards.some((c) => c.swapped));
  assert.ok(sim.banish('f:heal'));
  assert.ok(!sim.offer.cards.some((c) => c.key === 'f:heal'));
});

test('bless caps hold with extreme tree mods and absurd ranks', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 1, tree: { mods: { damage: 9, pickup: 9, speed: 9, gold: 9 } } });
  for (const id of IDS) sim.blessRanks[id] = 1e9;
  const b = sim.bless;
  assert.ok(b.damage <= 1.06 + 1e-9 && b.speed <= 1.06 + 1e-9 && b.pickup <= 1.24 + 1e-9 && b.gold <= 1.24 + 1e-9 && b.maxHp <= 1.18 + 1e-9);
  assert.equal(sim.mods.damage, 9, 'tree mods untouched');
  sim.blessRanks.wider_glow = NaN; sim.blessRanks.kind_fortune = -5;
  assert.equal(sim.bless.pickup, 1);
  assert.equal(sim.bless.gold, 1);
});

test('forged bless id ignored; debug bless disables banking', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 1 });
  for (const id of ['__proto__', 'constructor', 'toString', 'nope', '']) assert.equal(sim.debugBless(id, 3), false);
  assert.equal(sim.debugBless('wider_glow', Infinity), false);
  assert.equal(sim.debugBless('wider_glow', 99), true);
  assert.equal(sim.blessRanks.wider_glow, 3, 'clamped to max rank');
  assert.equal(({}).wider_glow, undefined);
  assert.equal(Object.keys(sim.blessRanks).length, 1);
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /isDebugRun\(\) \{[^}]*p\.bless/);
});

test('blessing pick changes stats once and sets rank; wrapped warmth heals what it adds; no NaN', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 3 });
  const base = sim.player.maxHp;
  sim.player.hp = base - 20;
  sim.pending = 2;
  sim.state = 'levelup';
  sim.offer = { cards: [{ key: 'b:wrapped_warmth', kind: 'blessing', blessId: 'wrapped_warmth', rank: 0 }], gold: [] };
  sim.pickCard('b:wrapped_warmth');
  assert.equal(sim.blessRanks.wrapped_warmth, 1);
  assert.equal(sim.player.maxHp, Math.round(base * 1.06));
  assert.ok(Math.abs(sim.player.hp - (base - 20 + (sim.player.maxHp - base))) < 1e-9);
  sim.state = 'levelup';
  sim.offer = { cards: [{ key: 'b:wrapped_warmth', kind: 'blessing', blessId: 'wrapped_warmth', rank: 1 }], gold: [] };
  sim.pickCard('b:wrapped_warmth');
  assert.equal(sim.blessRanks.wrapped_warmth, 2);
  assert.equal(sim.player.maxHp, Math.round(base * 1.12));
  assert.ok(Number.isFinite(sim.player.hp) && sim.player.hp <= sim.player.maxHp);
  const sp = new Sim({ data, characterId: 'wren', seed: 3 });
  const sp0 = sp.bless.speed;
  sp.setBlessRank('dawnlit_soles', 2);
  assert.ok(Math.abs(sp.bless.speed - sp0 * 1.06) < 1e-9);
});

test('blessing effects reach the sim: gold and summon damage', () => {
  const a = new Sim({ data, characterId: 'wren', seed: 3 });
  const b = new Sim({ data, characterId: 'wren', seed: 3 });
  b.setBlessRank('kindled_spirits', 3);
  const w = a.weapons[0];
  assert.ok(Math.abs(b.dmgMult(b.weapons[0]) / a.dmgMult(w) - 1.06) < 1e-9);
});

test('seed identical to pre-blessing build until first short offer', () => {
  const run = (d) => {
    const sim = new Sim({ data: d, characterId: 'wren', seed: 7, godMode: true });
    const offers = [];
    const stop = { t: null };
    const DT = 1 / 60;
    while ((sim.state === 'running' || sim.state === 'levelup') && sim.time < 900) {
      if (sim.state === 'levelup') {
        const o = sim.offer;
        const nreal = real(o.cards).length + o.gold.length;
        if (nreal < 3) { stop.t = sim.time; break; }
        offers.push(o.gold.concat(o.cards).map((c) => c.key).join(','));
        const stats = o.cards.filter((c) => c.kind === 'stat').sort((x, y) => y.rank - x.rank);
        sim.pickCard(o.gold[0]?.key ?? stats[0]?.key ?? o.cards[0].key);
        continue;
      }
      sim.step(DT, { x: Math.sin(sim.time / 3), y: Math.cos(sim.time / 4) });
    }
    return { offers, stop: stop.t, px: sim.player.x, kills: sim.kills };
  };
  const withB = run(data);
  const without = run({ ...data, blessings: undefined });
  assert.ok(withB.stop !== null, 'reached a short offer');
  assert.ok(withB.offers.length >= 10);
  // up to (not including) the first short offer, both builds saw exactly the same offers and world
  assert.deepEqual(withB.offers, without.offers.slice(0, withB.offers.length));
  assert.equal(without.stop === null || without.stop >= withB.stop, true);
});
