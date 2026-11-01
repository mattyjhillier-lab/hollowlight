// DM4: Wildfire (SPREAD), the first Dragonfire Meteor evolution. Hidden with the weapon (unreleased).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { WILDFIRE_HARD } from '../src/sim/weapons.js';
import { generateOffer } from '../src/sim/cards.js';
import { data } from './helpers.mjs';

const DT = 1 / 60;
const ID = 'dragonfire_meteor';
const dd = (tune) => ({ ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  evolutions: tune ? { ...data.evolutions, wildfire: { ...data.evolutions.wildfire, tune: { ...data.evolutions.wildfire.tune, ...tune } } } : data.evolutions });
const mk = (ranks = {}, { evo = 'wildfire', seed = 3, tune = null } = {}) => {
  const sim = new Sim({ data: dd(tune), characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  const w = sim.debugGrant(ID, ranks, evo);
  return { sim, w };
};
const put = (sim, dx, dy, r = 8) => { const e = sim.spawnEnemy('dummy', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = 1e9; e.r = r; return e; };
const crowd = (sim, n, cx = 110, cy = 0, sp = 14, cols = 5) => { for (let i = 0; i < n; i++) put(sim, cx + ((i % cols) - (cols - 1) / 2) * sp, cy + (Math.floor(i / cols) - Math.floor(n / cols / 2)) * sp); };
const run = (sim, secs, each) => { for (let i = 0; i < Math.round(secs / DT); i++) { sim.step(DT, {}); if (each) each(sim); } };
const R = { count: 4, area: 5, duration: 5, power: 3 };

test('data: wildfire entry (pair, verb, hidden, tune numbers (spec, retuned in DM4 for the 1.8-2.3x home band: grow 0.5, tickK 0.8))', () => {
  const e = data.evolutions.wildfire;
  assert.equal(e.weapon, ID); assert.deepEqual(e.pair, ['area', 'duration']); assert.equal(e.verb, 'SPREAD'); assert.equal(e.name, 'Wildfire');
  assert.equal(e.treeGate, true); assert.equal(e.unreleased, true); assert.equal(e.cue, 'evo_wildfire');
  assert.equal(e.desc, 'Fire creeps from patch to patch wherever foes stand in it.');
  const t = e.tune;
  assert.deepEqual([t.seedEvery, t.reachMin, t.reachMax, t.childR, t.childLife, t.grow, t.tickK, t.maxGen, t.maxKids, t.maxLive, t.seedRate], [1.2, 20, 30, 0.8, 0.7, 0.5, 0.8, 2, 2, 6, 3]);
  assert.deepEqual(Object.values(data.evolutions).filter((x) => x.weapon === ID).map((x) => x.pair.join('+')), ['area+duration']);
});

test('hidden: never offered while the weapon is unreleased', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 5 });
  for (let i = 0; i < 40; i++) { const o = generateOffer(sim.cardCtx, sim.rng); assert.ok(!o.cards.some((c) => c.weaponId === ID || c.evoId === 'wildfire')); }
});

test('seeding: nothing to creep toward while every foe is already burning; then a child 20-30 px toward the unburnt foe after >= 1.2 s', () => {
  const { sim, w } = mk(R);
  put(sim, 120, 0);
  let kid = null;
  run(sim, 3.0, () => { if (!kid) kid = w.rt.pools.find((q) => q.gen === 1) || null; }); // ready to seed since ~2.7 s, but nothing is un-burning
  assert.equal(kid, null, 'a lone foe burns inside its own fire: nothing un-burning in reach');
  const p0 = w.rt.pools.find((q) => q.gen === 0);
  assert.ok(p0, 'parent still burning');
  put(sim, 120 + p0.r + 16, 0); // just outside the swelling fire, inside the 30 px reach
  const t0 = sim.time; let at = -1;
  run(sim, 2.0, () => { if (at < 0) { kid = w.rt.pools.find((q) => q.gen === 1) || null; if (kid) at = sim.time; } });
  assert.ok(kid && at > t0, 'child seeded');
  const par = kid.par, d = Math.hypot(kid.x - par.x, kid.y - par.y);
  assert.ok(d >= 20 - 1e-6 && d <= 30 + 1e-6, `child ${d.toFixed(1)} px from parent`);
  assert.ok(Math.abs(kid.r0 - par.r0 * 0.8) < 1e-9 && Math.abs(kid.life0 - par.life0 * 0.7) < 1e-9, '0.8 radius, 0.7 life');
  assert.ok(kid.x > par.x, 'toward the foe');
});

test('seed interval: first child >= 1.2 s after its parent, children >= 1.2 s apart, at most 2 per pool', () => {
  const { sim, w } = mk({ count: 0, area: 5, duration: 5 });
  crowd(sim, 40, 110, 0, 12);
  const born = new Map();
  run(sim, 8, () => { for (const q of w.rt.pools) if (!born.has(q)) born.set(q, sim.time); });
  const byPar = new Map();
  for (const [q, t] of born) if (q.par) { const a = byPar.get(q.par) || []; a.push(t); byPar.set(q.par, a); }
  assert.ok(byPar.size > 0, 'something seeded');
  for (const [par, ts] of byPar) {
    assert.ok(ts.length <= 2, 'at most 2 children per pool');
    ts.sort((a, b) => a - b);
    assert.ok(ts[0] - born.get(par) >= 1.2 - 2 * DT, `first child ${ts[0] - born.get(par)} s after its parent`);
    if (ts.length > 1) assert.ok(ts[1] - ts[0] >= 1.2 - 2 * DT, 'children at least 1.2 s apart');
  }
});

test('caps: generations <= 2, live pools <= 6, seeds <= 3 per second over a long dense fight (1 fireball: reaches gen 2; 5 fireballs: reaches the 6-pool cap)', () => {
  const g = mk({ count: 0, area: 5, duration: 5, power: 5 });
  crowd(g.sim, 64, 120, 0, 34, 8);
  let gen = 0; run(g.sim, 20, () => { for (const q of g.w.rt.pools) gen = Math.max(gen, q.gen); });
  assert.equal(gen, 2, 'grandchildren appear, none beyond');
  const { sim, w } = mk({ count: 5, area: 5, duration: 5, power: 5 });
  crowd(sim, 64, 120, 0, 34, 8);
  let maxLive = 0, maxGen = 0, burst = 0; const times = []; const seen = new Set();
  run(sim, 30, () => {
    maxLive = Math.max(maxLive, w.rt.pools.length);
    for (const q of w.rt.pools) { maxGen = Math.max(maxGen, q.gen); if (q.par && !seen.has(q)) { seen.add(q); times.push(sim.time); } }
    burst = Math.max(burst, times.filter((t) => sim.time - t < 1 - 1e-9).length);
  });
  assert.ok(seen.size > 3, 'plenty of seeding happened');
  assert.equal(maxLive, 6, 'reaches but never exceeds 6');
  assert.ok(maxGen <= 2);
  assert.ok(burst <= 3, `seeds/s ${burst}`);
  assert.equal(WILDFIRE_HARD.maxLive, 6);
});

test('hostile tune values cannot lift a cap', () => {
  const { sim, w } = mk({ count: 5, area: 5, duration: 5 }, { tune: { maxLive: 99, maxGen: 9, maxKids: 9, seedRate: 99, seedEvery: -5, childR: 50, childLife: NaN, grow: 'x', reachMax: 1e9, retry: -1 } });
  crowd(sim, 60, 120, 0, 11);
  let maxLive = 0, maxGen = 0;
  run(sim, 20, () => { maxLive = Math.max(maxLive, w.rt.pools.length); for (const q of w.rt.pools) { maxGen = Math.max(maxGen, q.gen); assert.ok(Number.isFinite(q.r) && q.r > 0 && q.r <= 120, 'finite sane radius'); assert.ok(q.kids <= 2); } });
  assert.ok(maxLive <= 6 && maxGen <= 2);
});

test('hostile foes (NaN / Infinity position, dead) never break or exceed the caps', () => {
  const { sim, w } = mk({ count: 3, area: 5, duration: 5 });
  crowd(sim, 30);
  const bad = put(sim, 100, 0); bad.x = NaN; const bad2 = put(sim, 100, 0); bad2.y = Infinity; const dead = put(sim, 100, 0); dead.dead = true;
  run(sim, 10, () => assert.ok(w.rt.pools.length <= 6));
  for (const q of w.rt.pools) assert.ok(Number.isFinite(q.x) && Number.isFinite(q.y));
});

test('shared lockout: one pool tick per foe per 0.5 s however many Wildfire pools overlap', () => {
  const { sim, w } = mk({ count: 0, area: 5, duration: 5, power: 2 });
  crowd(sim, 30, 110, 0, 10);
  const hits = []; const o = sim.hurt.bind(sim);
  sim.hurt = (e, a, x) => { const r = o(e, a, x); if (sim._src === ID && r > 0 && !(x && x.silent)) hits.push([e, sim.time, a]); return r; };
  run(sim, 12);
  const tick = Math.min(...hits.map((h) => h[2])); // the pool tick is the smaller hit (the landing burst is much bigger)
  const times = new Map();
  for (const [e, t, a] of hits) if (Math.abs(a - tick) < 1e-9) { const l = times.get(e) || []; l.push(t); times.set(e, l); }
  let n = 0;
  for (const l of times.values()) for (let i = 1; i < l.length; i++) { n++; assert.ok(l[i] - l[i - 1] >= 0.5 - 2 * DT, `gap ${l[i] - l[i - 1]}`); }
  assert.ok(n > 20 && w.rt.pools.length >= 1);
});

test('a landing at the cap drops a child before any parent', () => {
  const { sim, w } = mk({ count: 4, area: 5, duration: 5 });
  crowd(sim, 60, 120, 0, 11);
  const f = { x: 120, y: 0, t: 0.01, r: 40, dmg: 5, life: 5 };
  run(sim, 8);
  while (w.rt.pools.length < 6) w.rt.pools.push({ x: 0, y: 0, r: 5, r0: 5, life: 5, life0: 5, t: 0.5, dmg: 1, gen: 0, kids: 0, sd: 9, occ: false, par: null });
  w.rt.pools[2].gen = 1; w.rt.pools[4].gen = 1;
  const keep = w.rt.pools.filter((q, i) => i !== 2);
  w.rt.fly.push(f);
  sim.step(DT, {}); sim.step(DT, {});
  assert.ok(w.rt.pools.length <= 6);
  assert.ok(keep.every((q) => w.rt.pools.includes(q) || q.life <= 0), 'oldest child (index 2) dropped, every parent kept');
});

test('Wildfire pools swell 1.0 -> 1.5 and tick at 0.8 x Impact (base pool stays 0.3 and fixed)', () => {
  const a = mk({ count: 1, area: 3, duration: 3, power: 3 }), b = mk({ count: 1, area: 3, duration: 3, power: 3 }, { evo: null });
  for (const x of [a, b]) put(x.sim, 120, 0);
  run(a.sim, 2.5); run(b.sim, 2.5);
  const pa = a.w.rt.pools.find((q) => q.gen === 0), pb = b.w.rt.pools[0];
  assert.ok(pa.r > pa.r0 && pa.r <= pa.r0 * 1.5 + 1e-9);
  assert.equal(pb.r, pb.r0);
  assert.ok(Math.abs(pa.dmg / pb.dmg - 0.8 / 0.3) < 1e-9);
});

test('base weapon is untouched: no children without the evolution, cap stays 5', () => {
  const { sim, w } = mk({ count: 4, area: 5, duration: 5 }, { evo: null });
  crowd(sim, 60, 120, 0, 11);
  let mx = 0; run(sim, 15, () => { mx = Math.max(mx, w.rt.pools.length); assert.ok(w.rt.pools.every((q) => q.gen === 0 && !q.par)); });
  assert.equal(mx, 5);
});

test('determinism: same seed, same pools (positions, generations) every second', () => {
  const trace = () => { const { sim, w } = mk(R, { seed: 11 }); crowd(sim, 45, 120, 0, 11); const out = []; let k = 0; run(sim, 15, () => { if (++k % 60 === 0) out.push(w.rt.pools.map((q) => [q.gen, +q.x.toFixed(3), +q.y.toFixed(3), +q.r.toFixed(3)])); }); return JSON.stringify(out) + sim.rng.next(); };
  assert.equal(trace(), trace());
});

test('no RNG is drawn by seeding (stream matches the base-weapon twin)', () => {
  const a = mk(R, { seed: 4 }), b = mk(R, { seed: 4, evo: null });
  for (const x of [a, b]) crowd(x.sim, 20);
  run(a.sim, 6); run(b.sim, 6);
  assert.equal(a.sim.rng.next(), b.sim.rng.next());
});

test('never below base: same ranks, the evolution deals at least the base damage (sparse, crowd, boss)', () => {
  const dmg = (evo, setup) => { const { sim } = mk({ count: 2, area: 3, duration: 3, power: 3 }, { evo }); setup(sim); run(sim, 12); return sim.dmgBy[ID] || 0; };
  const setups = { sparse: (s) => { put(s, 100, 0); put(s, -90, 60); }, crowd: (s) => crowd(s, 30, 110, 0, 12), boss: (s) => { const e = put(s, 90, 0, 22); e.boss = true; } };
  for (const [k, f] of Object.entries(setups)) assert.ok(dmg('wildfire', f) >= dmg(null, f) - 1e-9, k);
});
