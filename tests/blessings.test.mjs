import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { createRng } from '../src/sim/rng.js';
import { Sim } from '../src/sim/Sim.js';
import { newWeapon, generateOffer, rerollOffer, banishCard } from '../src/sim/cards.js';
import { validateBlessings, blessingCount, healSwap } from '../src/sim/blessings.js';

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
  assert.equal(blessingCount(def), 8);
  assert.deepEqual(IDS.sort(), ['dawnlit_soles', 'kind_fortune', 'kindled_spirits', 'patient_lantern', 'steady_heart', 'wide_hush', 'wider_glow', 'wrapped_warmth']);
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
    assert.equal(cards.filter((c) => c.kind === 'blessing').length, 1);
    assert.deepEqual(cards.filter((c) => c.kind === 'fallback').map((c) => c.key), ['f:heal'], 'LATE HEAL SLOT: exactly one heal card');
  }
  const c0 = ctxWith();
  const { cards } = generateOffer(c0, createRng(1));
  assert.equal(cards.filter((c) => c.key === 'f:heal').length, 1);
  assert.equal(cards.filter((c) => c.kind === 'blessing').length, 2);
});

// LEVEL-UP PACING (LOCKED 2026-11-16): Blessings join the weighted draw from the first level-up, at most draw.maxPerOffer while real cards remain.
const oneWeapon = (id = 'spirit_bolts', ranks = {}, extra = {}) => {
  const w = newWeapon(id, data.weapons[id]);
  Object.assign(w.ranks, ranks);
  return { weapons: [w], data, banished: new Set(), blessings: def, blessRanks: {}, ...extra };
};
const share = (ctx, n = 2000, seed = 3) => { const rng = createRng(seed); let b = 0; for (let i = 0; i < n; i++) if (generateOffer(ctx, rng).cards.some((c) => c.kind === 'blessing')) b++; return b / n; };

test('draw rule validates; missing or bad draw falls back to the fill-only rule', () => {
  assert.equal(def.draw.maxPerOffer, 1);
  assert.ok(def.draw.scale > 0 && def.draw.scale <= 1);
  for (const bad of [undefined, null, 'x', { scale: -1, maxPerOffer: 1 }, { scale: NaN, maxPerOffer: 1 }, { scale: 99, maxPerOffer: 1 }, { scale: 0.1, maxPerOffer: 1.5 }, { scale: 0.1, maxPerOffer: 9 }, { scale: 0.1 }]) {
    const v = validateBlessings({ ...data.blessings, draw: bad });
    assert.equal(v.draw.scale, 0, JSON.stringify(bad));
    assert.equal(blessingCount(v), 8, 'bad draw never drops the Blessings themselves');
  }
  // scale 0 = old rule: with 3+ real cards no Blessing is ever offered
  const old = { ...oneWeapon(), blessings: validateBlessings({ ...data.blessings, draw: undefined }) };
  for (let i = 0; i < 200; i++) assert.ok(generateOffer(old, createRng(i)).cards.every((x) => x.kind === 'stat'));
});

test('level 1, one weapon: a Blessing on roughly 1 offer in 3, never more than one, never starving stat cards', () => {
  const c = oneWeapon();
  const p = share(c);
  assert.ok(p > 0.25 && p < 0.45, `share ${p}`);
  const rng = createRng(11);
  for (let i = 0; i < 500; i++) {
    const { cards } = generateOffer(c, rng);
    assert.equal(cards.length, 3);
    assert.ok(cards.filter((x) => x.kind === 'blessing').length <= 1);
    assert.ok(cards.filter((x) => x.kind === 'stat').length >= 2);
    assert.ok(!cards.some((x) => x.kind === 'fallback'));
  }
});

test('more Blessings once weapon stat cards run out; one weapon fully maxed = all Blessings, no fallback', () => {
  const two = oneWeapon('spirit_bolts', { power: 5, speed: 5 }); // 2 real cards left
  const rng = createRng(2);
  for (let i = 0; i < 200; i++) { const { cards } = generateOffer(two, rng); assert.equal(real(cards).length, 2); assert.deepEqual(cards.filter((x) => x.kind !== 'stat').map((x) => x.key), ['f:heal']); }
  const maxed = oneWeapon();
  maxAll(maxed.weapons[0]);
  for (let i = 0; i < 200; i++) { const { cards } = generateOffer(maxed, rng); assert.equal(cards.filter((x) => x.key === 'f:heal').length, 1); assert.equal(cards.filter((x) => x.kind === 'blessing').length, 2); assert.equal(new Set(cards.map((x) => x.key)).size, 3); }
  // many open weapon cards (a tree run) dilute the Blessing share: real cards keep the offer
  const open = oneWeapon('spirit_bolts', {}, { unlockedWeapons: new Set(Object.keys(data.weapons)) });
  assert.ok(share(open) < share(oneWeapon()) / 2);
});

test('blessing draw is deterministic per seed and uses one rng step per card', () => {
  const keys = (seed) => { const rng = createRng(seed); return Array.from({ length: 30 }, () => generateOffer(oneWeapon(), rng).cards.map((c) => c.key).join(',')).join('|'); };
  assert.equal(keys(8), keys(8));
  let calls = 0;
  const counting = { next: () => { calls++; return 0.37; }, shuffle: (a) => a };
  generateOffer(oneWeapon(), counting);
  assert.equal(calls, 3);
});

test('banish/reroll with a Blessing on screen keep the one-per-offer cap and never repeat a card', () => {
  const rng = createRng(21);
  for (let i = 0; i < 300; i++) {
    const c = oneWeapon();
    let offer = generateOffer(c, rng);
    if (i % 2) offer = rerollOffer(c, rng, offer);
    else offer = banishCard(c, rng, offer, offer.cards.find((x) => x.kind === 'stat').key);
    assert.equal(new Set(offer.cards.map((x) => x.key)).size, offer.cards.length);
    assert.ok(offer.cards.filter((x) => x.kind === 'blessing').length <= 1);
    assert.equal(offer.cards.length, 3);
  }
  // banishing a Blessing removes it for the run; the replacement may be another Blessing only once the cap allows it
  const c = oneWeapon();
  let offer;
  for (let s = 0; !(offer && offer.cards.some((x) => x.kind === 'blessing')); s++) offer = generateOffer(c, createRng(s));
  const victim = offer.cards.find((x) => x.kind === 'blessing').key;
  offer = banishCard(c, rng, offer, victim);
  assert.ok(!offer.cards.some((x) => x.key === victim));
  for (let i = 0; i < 300; i++) assert.ok(!generateOffer(c, rng).cards.some((x) => x.key === victim));
});

test('maxed or capped Blessings leave the mixed draw; hostile ctx never throws or duplicates', () => {
  const ranks = Object.fromEntries(IDS.map((id) => [id, 99]));
  const c = { ...oneWeapon(), blessRanks: ranks };
  for (let i = 0; i < 100; i++) assert.ok(generateOffer(c, createRng(i)).cards.every((x) => x.kind === 'stat'));
  const hostile = [{ ...oneWeapon(), blessRanks: { kindled_spirits: NaN, __proto__: null } }, { ...oneWeapon(), blessRanks: { wider_glow: -5, dawnlit_soles: Infinity } }, { ...oneWeapon(), blessRanks: undefined }];
  for (const h of hostile) for (let i = 0; i < 50; i++) {
    const { cards } = generateOffer(h, createRng(i));
    assert.equal(cards.length, 3);
    assert.equal(new Set(cards.map((x) => x.key)).size, 3);
  }
  // an exclude set with junk (non-strings) is tolerated
  const { cards } = banishCard(oneWeapon(), createRng(1), { cards: [{ key: 's:spirit_bolts:power', kind: 'stat' }, { key: 5 }, { key: null }], gold: [] }, 's:spirit_bolts:power');
  assert.ok(cards.length >= 1);
});

test('no duplicate blessing within one offer, including after banish and reroll', () => {
  const c = ctxWith();
  const rng = createRng(4);
  for (let i = 0; i < 200; i++) {
    let offer = generateOffer(c, rng);
    if (i % 3 === 1) offer = rerollOffer(c, rng, offer);
    if (i % 3 === 2) offer = banishCard({ ...c, banished: new Set() }, rng, offer, offer.cards[0].key);
    assert.equal(new Set(offer.cards.map((x) => x.key)).size, offer.cards.length);
    assert.ok(offer.cards.every((x) => /^b:/.test(x.key) || x.key === 'f:heal'));
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
  assert.ok(offer.cards.every((x) => x.kind === 'blessing' || x.key === 'f:heal'));
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

test('late heal slot: every late offer keeps exactly one heal card; the swap never doubles it', () => {
  const sim = lowHpSim(3);
  sim.beginLevelUp();
  const heals = (o) => o.cards.filter((c) => c.key === 'f:heal');
  assert.equal(heals(sim.offer).length, 1, 'low hp: one heal card');
  assert.ok(sim.offer.cards.some((c) => c.kind === 'blessing'), 'Blessings fill the other slots');
  sim.pickCard('f:heal');
  assert.ok(sim.player.hp > sim.player.maxHp * 0.2);
  sim.pickCard(sim.offer.cards.find((c) => c.kind === 'blessing').key);
  assert.equal(heals(sim.offer).length, 1, 'next late offer still holds one');
  const healthy = lowHpSim(1);
  healthy.player.hp = healthy.player.maxHp * 0.9;
  healthy.beginLevelUp();
  assert.equal(heals(healthy.offer).length, 1, 'healthy too: the slot is kept');
  assert.ok(!healthy.offer.cards.some((c) => c.swapped), 'a natural heal card is not a swap');
});

test('banishing the heal card removes it for the run', () => {
  const sim = lowHpSim(1);
  sim.banishesLeft = 2;
  sim.beginLevelUp();
  assert.ok(sim.offer.cards.some((c) => c.key === 'f:heal'));
  assert.ok(sim.banish('f:heal'));
  assert.ok(!sim.offer.cards.some((c) => c.key === 'f:heal'));
});

test('bless caps hold with extreme tree mods and absurd ranks', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 1, tree: { mods: { damage: 9, pickup: 9, speed: 9, gold: 9 } } });
  for (const id of IDS) sim.blessRanks[id] = 1e9;
  const b = sim.bless;
  assert.ok(b.damage <= 1.06 + 1e-9 && b.speed <= 1.04 + 1e-9 && b.pickup <= 1.24 + 1e-9 && b.gold <= 1.24 + 1e-9 && b.maxHp <= 1.12 + 1e-9);
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
  assert.equal(sim.player.maxHp, Math.round(base * 1.04));
  assert.ok(Math.abs(sim.player.hp - (base - 20 + (sim.player.maxHp - base))) < 1e-9);
  sim.state = 'levelup';
  sim.offer = { cards: [{ key: 'b:wrapped_warmth', kind: 'blessing', blessId: 'wrapped_warmth', rank: 1 }], gold: [] };
  sim.pickCard('b:wrapped_warmth');
  assert.equal(sim.blessRanks.wrapped_warmth, 2);
  assert.equal(sim.player.maxHp, Math.round(base * 1.08));
  assert.ok(Number.isFinite(sim.player.hp) && sim.player.hp <= sim.player.maxHp);
  const sp = new Sim({ data, characterId: 'wren', seed: 3 });
  const sp0 = sp.bless.speed;
  sp.setBlessRank('dawnlit_soles', 2);
  assert.ok(Math.abs(sp.bless.speed - sp0 * 1.04) < 1e-9);
});

test('blessing effects reach the sim: gold and summon damage', () => {
  const a = new Sim({ data, characterId: 'wren', seed: 3 });
  const b = new Sim({ data, characterId: 'wren', seed: 3 });
  b.setBlessRank('kindled_spirits', 3);
  const w = a.weapons[0];
  assert.ok(Math.abs(b.dmgMult(b.weapons[0]) / a.dmgMult(w) - 1.06) < 1e-9);
});

test('Blessings from the start: a real run sees Blessings early and almost never a fallback-only offer', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 7, godMode: true });
  const DT = 1 / 60;
  let offers = 0, withB = 0, firstB = null, onlyFallback = 0;
  while ((sim.state === 'running' || sim.state === 'levelup') && sim.time < 900) {
    if (sim.state === 'levelup') {
      const o = sim.offer;
      offers++;
      if (o.cards.some((c) => c.kind === 'blessing')) { withB++; if (firstB === null) firstB = sim.level; }
      if (!o.gold.length && o.cards.every((c) => c.kind === 'fallback') && offers <= 34) onlyFallback++; // 20 stat ranks + 14 Blessing ranks: no filler before they are all used
      const stats = o.cards.filter((c) => c.kind === 'stat').sort((x, y) => y.rank - x.rank);
      sim.pickCard(o.gold[0]?.key ?? stats[0]?.key ?? o.cards[0].key);
      continue;
    }
    sim.step(DT, { x: Math.sin(sim.time / 3), y: Math.cos(sim.time / 4) });
  }
  assert.ok(offers >= 10);
  assert.ok(firstB !== null && firstB <= 8, `first Blessing at level ${firstB}`);
  assert.ok(withB / offers > 0.25);
  assert.equal(onlyFallback, 0, `fallback-only offers ${onlyFallback}`);
});

// BLESSINGS 2 (LOCKED 2026-11-17): Patient Lantern, Steady Heart, Wide Hush.
test('new blessings: data, text, caps and fail-closed', () => {
  const want = { patient_lantern: ['abilityCd', 0.03, 'It waits, then it warms.'], steady_heart: ['heartHeal', 0.04, 'Kindness stays a little longer.'], wide_hush: ['area', 0.02, 'Their glow spills over the edges.'] };
  for (const [id, [eff, per, whisper]] of Object.entries(want)) {
    const d = data.blessings.items[id];
    assert.equal(d.effect, eff); assert.equal(d.perRank, per); assert.equal(d.ranks, 3); assert.equal(d.weight, 0.7); assert.equal(d.whisper, whisper);
    assert.ok(def.items[id], `${id} validates`);
  }
  assert.deepEqual([def.caps.abilityCd, def.caps.heartHeal, def.caps.area], [1.09, 1.12, 1.06]);
  const cut = JSON.parse(JSON.stringify(data.blessings)); delete cut.caps.area;
  assert.equal(blessingCount(validateBlessings(cut)), 0, 'a missing new cap fails closed');
  const unk = JSON.parse(JSON.stringify(data.blessings)); unk.items.patient_lantern.effect = 'warp';
  assert.ok(!validateBlessings(unk).items.patient_lantern, 'unknown effect is dropped');
});

test('new blessings: effects reach the sim, floor and caps hold', () => {
  const mk = (tree) => new Sim({ data, seed: 1, characterId: 'wren', tree });
  const sim = mk();
  const a0 = sim.abilityCooldown, h0 = sim.tfx.heartHeal, m0 = sim.mods.area;
  sim.setBlessRank('patient_lantern', 3); sim.setBlessRank('steady_heart', 3); sim.setBlessRank('wide_hush', 3);
  assert.ok(Math.abs(sim.abilityCooldown - a0 / 1.09) < 1e-9);
  assert.ok(Math.abs(sim.tfx.heartHeal - h0 * 1.12) < 1e-9);
  assert.ok(Math.abs(sim.mods.area - m0 * 1.06) < 1e-9);
  sim.setBlessRank('wide_hush', 0); assert.equal(sim.mods.area, m0, 'back to base');
  // tree already near the floor: the 30 s floor still holds
  const fast = mk({ mods: { abilityCd: 0.5 } });
  fast.setBlessRank('patient_lantern', 3);
  assert.ok(fast.abilityCooldown >= Math.min(fast.ability.cooldown, data.balance.abilityCdFloor ?? 30) - 1e-9);
  // combined cap trims a Blessing when the tree already holds most of the room
  const tree = mk({ mods: { area: 1.12 } });
  tree.setBlessRank('wide_hush', 3);
  assert.ok(tree.mods.area <= 1.16 + 1e-9);
  // cards draw
  const c = ctxWith(); const ids = new Set();
  for (let i = 0; i < 40; i++) for (const k of generateOffer(c, createRng(i)).cards) ids.add(k.blessId);
  for (const id of Object.keys({ patient_lantern: 1, steady_heart: 1, wide_hush: 1 })) assert.ok(ids.has(id), id);
});

// BLESSINGS 2 FIX (LOCKED 2026-11-27): Wide Hush never moves Holy Orbit's ring; a low-HP offer with no Blessing still gets a heal card.
test('Wide Hush: Orbit ring distance stays on the tree area, lights reach further', () => {
  const run = (hush) => {
    const sim = new Sim({ data, seed: 1, characterId: 'elias', tree: { mods: { area: 1.05 } } });
    if (hush) sim.setBlessRank('wide_hush', 3);
    sim.addWeapon?.('holy_orbit');
    return sim;
  };
  const a = run(false), b = run(true);
  assert.ok(b.mods.area > a.mods.area, 'blessing raises mods.area');
  assert.equal(b.baseFx.area, a.baseFx.area, 'tree-only area is untouched');
  for (const sim of [a, b]) { sim.step?.(0.5); }
  const ring = (sim) => { const w = sim.weapons.find((x) => x.id === 'holy_orbit'); return w ? Math.hypot(w.rt.units?.[0]?.x - sim.player.x, w.rt.units?.[0]?.y - sim.player.y) : null; };
  const ra = ring(a), rb = ring(b);
  if (ra != null && rb != null && Number.isFinite(ra) && Number.isFinite(rb)) assert.ok(Math.abs(ra - rb) < 1e-6, `ring ${ra} vs ${rb}`);
});

test('low HP with no Blessing in the offer: the last stat card becomes the heal card, once per cooldown', () => {
  const ctx = { blessings: def, banished: new Set() };
  const stat = (k) => ({ key: k, kind: 'stat' });
  const cards = [{ key: 'w', kind: 'weapon' }, stat('s1'), stat('s2')];
  const heal = () => ({ key: 'f:heal', kind: 'fallback', fallback: 'heal' });
  const out = healSwap(cards, ctx, 20, 100, 100, 0, heal);
  assert.deepEqual(out.map((c) => c.key), ['w', 's1', 'f:heal']);
  assert.ok(out[2].swapped);
  assert.equal(healSwap(cards, ctx, 90, 100, 100, 0, heal), cards, 'healthy: untouched');
  assert.equal(healSwap(cards, ctx, 20, 100, 10, 50, heal), cards, 'cooldown: untouched');
  const onlyReal = [{ key: 'w', kind: 'weapon' }, { key: 'e', kind: 'evolution' }];
  assert.equal(healSwap(onlyReal, ctx, 20, 100, 100, 0, heal), onlyReal, 'never replaces a weapon or evolution card');
  const withB = [stat('s1'), { key: 'b:x', kind: 'blessing' }, stat('s2')];
  assert.deepEqual(healSwap(withB, ctx, 20, 100, 100, 0, heal).map((c) => c.key), ['s1', 'f:heal', 's2'], 'a Blessing is still swapped first');
});
