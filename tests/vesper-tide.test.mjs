// W12 Vesper Tide (Holy Orbit third evolution, recipe Orbit size + Orbit speed): the ring breathes 14 px <-> 1.7 x Orbit size,
// hits made while it pushes OUT deal x2; the W4 guard contraction wins; Burn as locked; all four Orbit stats keep working.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { GUARD } from '../src/sim/weapons.js';

const DT = 1 / 60;
const step = (sim, s, input = {}) => { for (let i = 0; i < Math.round(s / DT); i++) sim.step(DT, input); };
const dummy = { name: 'D', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 };
const R5 = { count: 2, power: 2, radius: 5, speed: 5 };
function fresh(ranks = R5, evo = 'vesper_tide', seed = 7) {
  const d = structuredClone(data);
  d.enemies.dummy = dummy;
  const sim = new Sim({ data: d, seed, characterId: 'elias', godMode: true });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
  sim.spawnAcc = [];
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('holy_orbit', ranks, evo);
  return sim;
}
const ow = (sim) => sim.weapons.find((w) => w.id === 'holy_orbit');
const dist = (sim) => { const u = ow(sim).rt.units[0]; return Math.hypot(u.x - sim.player.x, u.y - sim.player.y); };
const put = (sim, edge) => {
  const e = sim.spawnEnemy('dummy', sim.player.x, sim.player.y);
  e.x = sim.player.x + e.r + sim.player.r + edge; e.y = sim.player.y; e.hp = e.maxHp = 1e9; e.speed = 0;
  return e;
};

test('data: vesper_tide is a tree-gated Holy Orbit evolution, recipe Orbit size + Orbit speed, card text <= 96 chars', () => {
  const e = data.evolutions.vesper_tide;
  assert.equal(e.weapon, 'holy_orbit'); assert.deepEqual([...e.pair].sort(), ['radius', 'speed']);
  assert.equal(e.treeGate, true); assert.ok(e.desc.length <= 96);
  assert.ok(!data.evolutions.sanctum_halo.pair.includes('speed') && !data.evolutions.judgement_wheel.pair.includes('radius'), 'recipe pair is unique among the Orbit evolutions');
});

test('breathing curve: radius follows 14 + (1.7 R - 14)(0.5 - 0.5 cos phi), reaches both ends, never leaves [14, 1.7 R]', () => {
  const sim = fresh();
  const w = ow(sim), R = w.s.radius * sim.mods.area, t = data.evolutions.vesper_tide.tune;
  let lo = 1e9, hi = 0;
  for (let i = 0; i < 12 / DT; i++) {
    sim.step(DT, {});
    const d = dist(sim); lo = Math.min(lo, d); hi = Math.max(hi, d);
    const want = 14 + (R * t.tide - 14) * (0.5 - 0.5 * Math.cos(w.rt.ph));
    assert.ok(Math.abs(d - want) < 0.5, `radius ${d.toFixed(2)} vs curve ${want.toFixed(2)}`);
  }
  assert.ok(lo < 16, `draws in to ~14 px (min ${lo.toFixed(1)})`);
  assert.ok(Math.abs(hi - R * 1.7) < 2, `swells to 1.7 x Orbit size (max ${hi.toFixed(1)} vs ${(R * 1.7).toFixed(1)})`);
});

test('phase rate = tune.phase x Orbit speed (rank 5 breathes faster than rank 0)', () => {
  const rate = (sp) => { const sim = fresh({ ...R5, speed: sp }); step(sim, 1); return ow(sim).rt.ph; };
  assert.ok(rate(5) > rate(0) * 1.2);
  assert.ok(Math.abs(rate(0) - ow(fresh({ ...R5, speed: 0 })).s.speed * data.evolutions.vesper_tide.tune.phase) < 0.1);
});

test('crest: hits made while the ring pushes OUT deal x2.0, drawing in x1.0 (hit amounts spied)', () => {
  const sim = fresh({ count: 2, power: 2, radius: 3, speed: 2 });
  const e = put(sim, 40); // parked where the breathing ring sweeps over it
  const hits = [];
  const o = sim.hurt.bind(sim);
  sim.hurt = (t, a, x) => { if (t === e && !(x && x.silent)) hits.push({ a, c: ow(sim).rt.crest, out: Math.sin(ow(sim).rt.ph) > 0 }); return o(t, a, x); };
  step(sim, 20);
  const out = hits.filter((h) => h.out), inn = hits.filter((h) => !h.out);
  assert.ok(out.length > 3 && inn.length > 3, `saw both phases (${out.length} out, ${inn.length} in)`);
  const base = inn[0].a;
  for (const h of inn) assert.ok(Math.abs(h.a - base) < 1e-9 && h.c === 1);
  for (const h of out) { assert.equal(h.c, 2); assert.ok(Math.abs(h.a - 2 * base) < 1e-9); }
});

test('guard priority: a foe touching Elias closes the ring to 14 px even mid-swell, and a closing ring never gets the crest', () => {
  const sim = fresh();
  step(sim, 0.3);
  put(sim, 3);
  let crestWhileGuard = 0, closedAtSwell = false;
  for (let i = 0; i < 3 / DT; i++) {
    sim.step(DT, {});
    const w = ow(sim);
    if (w.rt.gK > 0 && w.rt.crest !== 1) crestWhileGuard++;
    if (w.rt.gK >= 1 && Math.sin(w.rt.ph) > 0) { closedAtSwell = true; assert.ok(dist(sim) <= GUARD.to + 0.5, `closed ring ${dist(sim).toFixed(1)}`); }
  }
  assert.equal(crestWhileGuard, 0);
  assert.ok(closedAtSwell, 'test saw the guard hold during a swell phase');
  // the foe leaves: the ring opens again and breathes
  sim.enemies.forEach((e) => { e.dead = true; }); sim.enemies = sim.enemies.filter((e) => !e.dead);
  let hi = 0; for (let i = 0; i < 6 / DT; i++) { sim.step(DT, {}); hi = Math.max(hi, dist(sim)); }
  assert.ok(hi > 60, `breathes again after the guard (max ${hi.toFixed(0)})`);
});

test('Burn: ring hits apply it (strongest wins, one instance), share of Orbit damage <= 35%; deterministic', () => {
  const run = () => { const sim = fresh(); const e = put(sim, 30); step(sim, 15); return { burn: sim.burnBy.holy_orbit || 0, dmg: sim.dmgBy.holy_orbit || 0, hp: e.hp }; };
  const a = run(), b = run();
  assert.deepEqual(a, b);
  assert.ok(a.burn > 0, 'Burn applied');
  assert.ok(a.burn / (a.dmg + a.burn) <= 0.35 && a.burn / Math.max(1, a.dmg) <= 0.35, `burn share ${(a.burn / a.dmg * 100).toFixed(0)}%`);
});

test('D1: Orbit count, size, speed and power all matter after evolving', () => {
  const dps = (ranks) => { const sim = fresh(ranks); const e = put(sim, 30); const h0 = e.hp; step(sim, 20); return h0 - e.hp; };
  const base = { count: 2, power: 2, radius: 3, speed: 3 };
  const b = dps(base);
  const lights = (ranks) => { const sim = fresh(ranks); sim.step(DT, {}); return ow(sim).rt.units.length; };
  assert.ok(lights({ ...base, count: 5 }) > lights({ ...base, count: 0 }), 'count = lights');
  assert.ok(dps({ ...base, power: 5 }) > b * 1.1, 'power = damage');
  const reach = (r) => { const sim = fresh({ ...base, radius: r }); let hi = 0; for (let i = 0; i < 8 / DT; i++) { sim.step(DT, {}); hi = Math.max(hi, dist(sim)); } return hi; };
  assert.ok(reach(5) > reach(0) * 1.2, 'size = swell reach');
  const phase = (sp) => { const sim = fresh({ ...base, speed: sp }); step(sim, 2); return ow(sim).rt.ph; };
  assert.ok(phase(5) > phase(0), 'speed = breathing rate');
});

test('never below base: an Orbit foe near the ring takes at least the plain-ring damage (single, equal ranks)', () => {
  const dps = (evo) => { const sim = fresh(R5, evo); const e = put(sim, 30); const h0 = e.hp; step(sim, 20); return h0 - e.hp; };
  assert.ok(dps('vesper_tide') >= dps(null) * 0.98);
});
