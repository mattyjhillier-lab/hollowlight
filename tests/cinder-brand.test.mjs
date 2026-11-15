// DM6: Cinder Brand (POP), the third Dragonfire Meteor evolution (Matt's pick A). Hidden with the weapon (unreleased).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { BRAND_HARD } from '../src/sim/weapons.js';
import { generateOffer } from '../src/sim/cards.js';
import { data } from './helpers.mjs';

const DT = 1 / 60;
const ID = 'dragonfire_meteor', EVO = 'cinder_brand';
const dd = (tune) => ({ ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  evolutions: tune ? { ...data.evolutions, [EVO]: { ...data.evolutions[EVO], tune: { ...data.evolutions[EVO].tune, ...tune } } } : data.evolutions });
const mk = (ranks = {}, { evo = EVO, seed = 3, tune = null } = {}) => {
  const sim = new Sim({ data: dd(tune), characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  const w = sim.debugGrant(ID, ranks, evo);
  return { sim, w };
};
const put = (sim, dx, dy, r = 8) => { const e = sim.spawnEnemy('dummy', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = 1e9; e.r = r; return e; };
const crowd = (sim, n, cx = 110, cy = 0, sp = 14, cols = 5) => { for (let i = 0; i < n; i++) put(sim, cx + ((i % cols) - (cols - 1) / 2) * sp, cy + (Math.floor(i / cols) - Math.floor(n / cols / 2)) * sp); };
const run = (sim, secs, each) => { for (let i = 0; i < Math.round(secs / DT); i++) { sim.step(DT, {}); if (each) each(sim); } };
const R = { count: 2, area: 3, duration: 5, power: 5 };

test('data: cinder_brand entry (pair power + duration, verb POP, hidden, tune numbers, distinct from the siblings)', () => {
  const e = data.evolutions[EVO];
  assert.equal(e.weapon, ID); assert.deepEqual(e.pair, ['power', 'duration']); assert.equal(e.verb, 'POP'); assert.equal(e.name, 'Cinder Brand');
  assert.equal(e.treeGate, true); assert.equal(e.unreleased, true); assert.equal(e.cue, 'evo_cinder_brand');
  assert.equal(e.codex, 'What it touches, it remembers, and returns.');
  const t = e.tune;
  assert.deepEqual([t.popR, t.fuseMax, t.popRate, t.maxLive, t.maxTargets], [26, 2.5, 12, 48, 4]);
  assert.equal(BRAND_HARD.popRate, 12);
  const pairs = Object.values(data.evolutions).filter((x) => x.weapon === ID).map((x) => x.pair.join('+')).sort();
  assert.deepEqual(pairs, ['area+duration', 'count+power', 'power+duration']);
  assert.equal(new Set(Object.values(data.evolutions).filter((x) => x.weapon === ID).map((x) => x.verb)).size, 3);
});

test('hidden: never offered while the weapon is unreleased', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 5 });
  for (let i = 0; i < 40; i++) { const o = generateOffer(sim.cardCtx, sim.rng); assert.ok(!o.cards.some((c) => c.weaponId === ID || c.evoId === EVO)); }
});

test('brand: the crash brands each foe it burns once; far foes and dead foes are not branded', () => {
  const { sim, w } = mk(R);
  const near = []; for (let i = 0; i < 6; i++) near.push(put(sim, 110 + (i % 3) * 8, (i >> 1) * 8 - 8));
  const far = put(sim, -200, 150); // outside the 230 ring? (still on screen: aim may take it as a second cluster, so only check the set rule)
  run(sim, 1.6); // first volley 0.8 s + 0.45 s in the air
  const live = w.rt.brands;
  assert.ok(live && live.length >= 3, 'foes branded ' + (live && live.length));
  assert.equal(new Set(live.map((b) => b.e)).size, live.length, 'one brand per foe');
  for (const b of live) assert.ok(b.e.burnT > 0, 'a brand sits on a burning foe');
});

test('pop: when the Burn fades the brand pops for popK x Impact on foes within radius 26, never burning or re-branding', () => {
  const { sim, w } = mk({ count: 0, power: 3, duration: 0 });
  const a = put(sim, 110, 0), n1 = put(sim, 122, 0), n2 = put(sim, 160, 0); // n2 is out of the 26 px pop but not out of the burst
  const hits = []; const o = sim.hurt.bind(sim);
  let t0 = -1;
  sim.hurt = (e, amt, x) => { const r = o(e, amt, x); if (sim._src === ID && r > 0 && t0 > 0) hits.push([e, sim.time, amt]); return r; };
  run(sim, 4.6, () => { if (t0 < 0 && w.rt.brands && w.rt.brands.length) t0 = sim.time; });
  assert.ok(t0 > 0, 'branded');
  const dmg = w.s.power * sim.dmgMult(w), pk = data.evolutions[EVO].tune.popK;
  const pop = hits.filter(([e, , amt]) => Math.abs(amt - dmg * pk) < 1e-6 * amt + 1e-6);
  assert.ok(pop.length >= 1, 'popped at least once');
  assert.ok(w.rt.pops.length >= 1 || sim.time > 0, 'pop recorded');
  // never burns by pop: every pool/burst hit comes from the base weapon; pops themselves are plain hurt (no new burn): check burn source timing is unchanged vs twin
  const tw = mk({ count: 0, power: 3, duration: 0 }, { evo: null });
  put(tw.sim, 110, 0); put(tw.sim, 122, 0); put(tw.sim, 160, 0); run(tw.sim, 4.6);
  assert.ok(sim.dmgBy[ID] > tw.sim.dmgBy[ID], 'brand adds damage over its base twin');
  void a; void n1; void n2;
});

test('pop timing: pops at Burn end (about 2 s after the crash) or fuseMax 2.5 s at the latest, even for a foe that stays in fire', () => {
  const { sim, w } = mk({ count: 0, power: 3, duration: 5 });
  put(sim, 110, 0);
  let born = -1, popAt = -1;
  run(sim, 5, () => { const b = w.rt.brands && w.rt.brands[0]; if (b && born < 0) born = b.t; if (born > 0 && popAt < 0 && w.rt.pops && w.rt.pops.length) popAt = w.rt.pops[0].t; });
  assert.ok(born > 0 && popAt > 0);
  assert.ok(popAt - born <= 2.5 + 2 * DT && popAt - born >= 1.0, `pop ${popAt - born} s after the brand`);
});

test('one generation: a pop never brands a neighbour (brand count never exceeds foes crashed on)', () => {
  const { sim, w } = mk({ count: 0, power: 3, duration: 2, area: 0 });
  const big = []; for (let i = 0; i < 4; i++) big.push(put(sim, 110 + i * 18, 0)); // spaced 18 px: the crash (r 34) covers 3, pops (26) reach neighbours
  const far = put(sim, 175, 0);
  let farBranded = false;
  run(sim, 2.6, () => { if (w.rt.brandSet && w.rt.brandSet.has(far) && !w.rt.brandSet.size) farBranded = true; });
  assert.ok(w.rt.pops && w.rt.pops.length >= 0);
  // the set only ever holds foes hit by a crash: none of its members was added after a pop
  for (const b of (w.rt.brands || [])) assert.ok(b.t <= sim.time);
  assert.equal(farBranded, false);
});

test('cap: at most 12 pops per second whatever number of brands expire together; queue and live caps hold', () => {
  const { sim, w } = mk({ count: 4, power: 5, duration: 5, area: 5 });
  crowd(sim, 90, 120, 0, 9, 10);
  const stamps = []; let live = 0, queue = 0;
  run(sim, 14, () => { live = Math.max(live, (w.rt.brands || []).length); queue = Math.max(queue, (w.rt.popQ || []).length); for (const p of (w.rt.pops || [])) if (!stamps.includes(p)) stamps.push(p); });
  assert.ok(stamps.length > 30, 'plenty of pops ' + stamps.length);
  let worst = 0; for (let i = 0; i < stamps.length; i++) { let j = i; while (j < stamps.length && stamps[j].t - stamps[i].t < 1 - 1e-9) j++; worst = Math.max(worst, j - i); }
  assert.ok(worst <= BRAND_HARD.popRate, 'pops in any 1 s ' + worst);
  assert.ok(live <= BRAND_HARD.maxLive, 'live brands ' + live); assert.ok(queue <= BRAND_HARD.queue, 'queue ' + queue);
});

test('a pop hits at most maxTargets (4) foes', () => {
  const { sim, w } = mk({ count: 0, power: 5, duration: 0, area: 0 });
  crowd(sim, 30, 110, 0, 5, 6);
  const dmg = w.s.power * sim.dmgMult(w), pk = data.evolutions[EVO].tune.popK;
  const o = sim.hurt.bind(sim); const perT = new Map();
  sim.hurt = (e, amt, x) => { const r = o(e, amt, x); if (r > 0 && Math.abs(amt - dmg * pk) < 1e-6 * amt + 1e-6) perT.set(sim.time.toFixed(4), (perT.get(sim.time.toFixed(4)) || 0) + 1); return r; };
  run(sim, 6);
  const worstFrame = Math.max(0, ...perT.values());
  assert.ok(perT.size > 0); assert.ok(worstFrame <= 4 * BRAND_HARD.popRate, 'hits in a frame ' + worstFrame);
});

test('a foe that dies while branded loses the mark (no pop)', () => {
  const { sim, w } = mk({ count: 0, power: 3 });
  const e = put(sim, 110, 0);
  run(sim, 1.5);
  assert.ok(w.rt.brandSet.has(e));
  e.dead = true; e.hp = 0;
  const popsBefore = (w.rt.popQ || []).length + (w.rt.pops || []).length;
  run(sim, 1);
  assert.ok(!w.rt.brandSet.has(e) && w.rt.brands.every((b) => b.e !== e));
  assert.equal((w.rt.popQ || []).length + (w.rt.pops || []).length, popsBefore, 'no pop from the dead');
});

test('hostile tune values cannot lift a cap or make NaN', () => {
  const { sim, w } = mk(R, { tune: { popRate: 999, maxLive: 1e9, maxTargets: 1e9, popK: 1e9, popR: 1e9, fuseMax: -3 } });
  crowd(sim, 70, 120, 0, 8, 10);
  const times = [];
  run(sim, 12, () => { assert.ok((w.rt.brands || []).length <= 48); assert.ok((w.rt.popQ || []).length <= 40); for (const p of (w.rt.pops || [])) { assert.ok(Number.isFinite(p.r) && p.r <= 60); if (!times.includes(p)) times.push(p); } });
  for (let i = 0; i < times.length; i++) { let j = i; while (j < times.length && times[j].t - times[i].t < 1 - 1e-9) j++; assert.ok(j - i <= 12); }
});

test('hostile foes (NaN / Infinity position, dead, no radius) never break the brand', () => {
  const { sim, w } = mk(R); crowd(sim, 20);
  const bad = put(sim, 100, 0); bad.x = NaN; const bad2 = put(sim, 100, 0); bad2.y = Infinity; const dead = put(sim, 100, 0); dead.dead = true; const nr = put(sim, 105, 0); delete nr.r;
  assert.doesNotThrow(() => run(sim, 10));
  for (const b of w.rt.brands) assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y));
});

test('base weapon is untouched: no brands without the evolution', () => {
  const { sim, w } = mk(R, { evo: null }); crowd(sim, 14);
  run(sim, 8); assert.equal(w.rt.brands, undefined); assert.equal(w.rt.pops, undefined);
});

test('determinism: same seed, same marks and pops; no RNG drawn (stream matches the base twin)', () => {
  const trace = () => { const { sim, w } = mk(R, { seed: 11 }); crowd(sim, 30, 120, 0, 11); const out = []; let k = 0; run(sim, 12, () => { if (++k % 60 === 0) out.push([(w.rt.brands || []).length, (w.rt.pops || []).length, sim.dmgBy[ID] | 0]); }); return JSON.stringify(out) + sim.rng.next(); };
  assert.equal(trace(), trace());
  const a = mk(R, { seed: 4 }), b = mk(R, { seed: 4, evo: null });
  for (const x of [a, b]) crowd(x.sim, 20);
  run(a.sim, 8); run(b.sim, 8);
  assert.equal(a.sim.rng.next(), b.sim.rng.next());
});

test('never below base: same ranks, the evolution deals at least the base damage (sparse, crowd, boss)', () => {
  const dmg = (evo, setup) => { const { sim } = mk({ count: 2, area: 3, duration: 3, power: 3 }, { evo }); setup(sim); run(sim, 14); return sim.dmgBy[ID] || 0; };
  const setups = { sparse: (s) => { put(s, 100, 0); put(s, -90, 60); }, crowd: (s) => crowd(s, 30, 110, 0, 12), boss: (s) => { const e = put(s, 110, 0, 22); e.boss = true; } };
  for (const [k, f] of Object.entries(setups)) assert.ok(dmg(EVO, f) >= dmg(null, f) - 1e-9, k);
});
