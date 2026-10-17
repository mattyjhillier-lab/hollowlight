// W4 (Orbit guard contraction + Orbit speed rate) and Burn (Elias's status). Sim-only rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { GUARD, ORBIT_GAP } from '../src/sim/weapons.js';
import { rateMult, hintText, BURN_RATE, BURN_TIME } from '../src/sim/cards.js';
import { ROLE } from '../src/gfx/palette.js';
import { KIND, prioOf } from '../src/gfx/numpool.js';

const DT = 1 / 60;
const step = (sim, s, input = {}) => { for (let i = 0; i < Math.round(s / DT); i++) sim.step(DT, input); };
const dummy = { name: 'D', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 };
function fresh(ranks = { count: 2, power: 2, radius: 2, speed: 0 }, evo = null, seed = 7) {
  const d = structuredClone(data);
  d.enemies.dummy = dummy;
  const sim = new Sim({ data: d, seed, characterId: 'elias', godMode: true });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
  sim.spawnAcc = [];
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('holy_orbit', ranks, evo);
  return sim;
}
// enemy whose EDGE distance to the hero is `edge` px, on the +x side
const put = (sim, type, edge) => {
  const e = sim.spawnEnemy(type, sim.player.x, sim.player.y);
  e.x = sim.player.x + e.r + sim.player.r + edge; e.y = sim.player.y; e.hp = e.maxHp = 1e9; e.speed = 0;
  return e;
};
const orbW = (sim) => sim.weapons.find((w) => w.id === 'holy_orbit');
const orbDist = (sim) => { const u = orbW(sim).rt.units[0]; return Math.hypot(u.x - sim.player.x, u.y - sim.player.y); };

test('guard-edge-trigger: needs edge < 8 px for 0.2 s; farther foes never trigger', () => {
  const sim = fresh();
  const far = put(sim, 'dummy', 20);
  step(sim, 1);
  assert.equal(orbW(sim).rt.gK, 0, 'edge 20 px: no contraction');
  far.dead = true; sim.enemies = sim.enemies.filter((e) => !e.dead);
  put(sim, 'dummy', 3);
  step(sim, 0.1);
  assert.equal(orbW(sim).rt.gK, 0, 'under 0.2 s: not yet');
  step(sim, 0.7);
  assert.ok(Math.abs(orbDist(sim) - GUARD.to) < 0.5, `ring closed to ${orbDist(sim)}`);
});

test('guard-edge-trigger-boss: a boss in melee triggers it and the base Orbit damages it (C17)', () => {
  const sim = fresh();
  const b = put(sim, 'elder_treant', 4);
  const h0 = b.hp;
  step(sim, 6);
  assert.ok(orbDist(sim) < 15, 'ring pulled in');
  assert.ok(h0 - b.hp > 50, `boss damage ${h0 - b.hp}`);
});

test('guard-hysteresis: closes in 0.25 s, holds >= 0.8 s after the foe leaves, opens over 0.4 s', () => {
  const sim = fresh();
  const e = put(sim, 'dummy', 3);
  step(sim, 0.2 + GUARD.close + 0.1);
  assert.ok(orbDist(sim) < 15);
  e.x += 200; // foe leaves
  step(sim, 0.6);
  assert.ok(orbDist(sim) < 15, 'still closed 0.6 s after the foe left');
  step(sim, 1.5);
  assert.ok(orbDist(sim) > 37, `opened again ${orbDist(sim)}`);
});

test('guard-yields-to-wheel: no contraction while the Candle Wheel stands', () => {
  const sim = fresh();
  sim.ability.cdLeft = 0;
  sim.step(DT, { ability: true });
  assert.ok(sim.zones.some((z) => z.wheel));
  put(sim, 'dummy', 3);
  step(sim, 1.5);
  assert.equal(orbW(sim).rt.gK, 0);
  assert.equal(orbW(sim).rt.gHold || 0, 0);
});

test('guard-hug acceptance: a foe touching Elias takes >= 25% of the ring DPS (base Orbit rank 2)', () => {
  const dps = (edge, atRing) => {
    const sim = fresh();
    const e = put(sim, 'dummy', edge);
    if (atRing) e.x = sim.player.x + orbW(sim).s.radius;
    const h0 = e.hp;
    step(sim, 10);
    return (h0 - e.hp) / 10;
  };
  const ring = dps(0, true), hug = dps(2, false);
  assert.ok(ring > 5, `ring dps ${ring}`);
  assert.ok(hug >= 0.25 * ring, `hug ${hug} vs ring ${ring}`);
});

test('orbit speed rate: +5% hits per rank, gap 0.5 -> 0.4 s at rank 5, card text true', () => {
  const def = data.weapons.holy_orbit;
  assert.equal(def.stats.speed.rate, 0.05);
  assert.equal(ORBIT_GAP, 0.5);
  assert.ok(Math.abs(ORBIT_GAP / rateMult(def, 'speed', 5) - 0.4) < 1e-9);
  assert.ok(hintText(def, 'speed', 0).includes('hit the same foe 5% more often'));
  // a lone light parked on a foe hits it once per gap: more hits per second at speed rank 5 than rank 0
  const perSec = (sp) => {
    const sim = fresh({ count: 0, power: 0, radius: 0, speed: sp });
    const e = put(sim, 'dummy', 50);
    const w = orbW(sim);
    let n = 0;
    const orig = sim.hurt.bind(sim);
    sim.hurt = (t, a, o) => { if (t === e && !(o && o.silent)) n++; return orig(t, a, o); };
    // keep the foe on the first light's path every frame
    for (let i = 0; i < 20 * 60; i++) { const u = w.rt.units && w.rt.units[0]; if (u) { e.x = u.x; e.y = u.y; } sim.step(DT, {}); }
    return n / 20;
  };
  assert.ok(perSec(5) > perSec(0) * 1.15, `${perSec(0)} vs ${perSec(5)}`);
});

test('burn: 20% of the hit per second for 2 s, one instance, strongest wins, time refreshes, ends clean', () => {
  assert.equal(BURN_RATE, 0.2); assert.equal(BURN_TIME, 2);
  const sim = fresh({ count: 0, power: 0, radius: 0, speed: 0 });
  sim.weapons.length = 0;
  const e = put(sim, 'dummy', 50);
  sim._src = 'holy_orbit';
  sim.burn(e, 100);
  assert.equal(e.burnDps, 20); assert.equal(e.burnT, 2);
  sim._src = null;
  step(sim, 1);
  assert.ok(Math.abs(e.burnTot - 20) < 0.5, `1 s of burn ${e.burnTot}`);
  sim.burn(e, 50); // weaker: potency stays, time refreshes
  assert.equal(e.burnDps, 20); assert.ok(e.burnT > 1.9);
  sim.burn(e, 200); // stronger wins, still one instance
  assert.equal(e.burnDps, 40);
  step(sim, 2.2);
  assert.equal(e.burnT <= 0, true); assert.equal(e.burnDps, 0, 'potency ends with the burn');
  assert.ok(Math.abs(e.burnTot - (20 + 40 * 2)) < 1.5, `total ${e.burnTot}`);
  assert.ok(Math.abs((e.maxHp - e.hp) - e.burnTot) < 1e-3, 'counter = HP lost');
});

test('burn: credited to the source weapon (burnBy is part of dotBy)', () => {
  const sim = fresh();
  const e = put(sim, 'dummy', 0); e.x = sim.player.x + orbW(sim).s.radius;
  step(sim, 4);
  assert.ok(e.burnTot > 0, 'plain Orbit burns');
  assert.ok(Math.abs(sim.burnBy.holy_orbit - e.burnTot) < 1e-6);
  assert.ok(sim.dotBy.holy_orbit >= sim.burnBy.holy_orbit - 1e-6);
});

test('burn: the Candle Wheel never applies it (locked lights still hit, no Burn)', () => {
  const sim = fresh();
  sim.ability.cdLeft = 0;
  sim.step(DT, { ability: true });
  const w = sim.zones.find((z) => z.wheel);
  const f = sim.spawnEnemy('dummy', w.x, w.y - w.r); f.hp = f.maxHp = 1e9; f.speed = 0;
  const h0 = f.hp;
  step(sim, 4);
  assert.ok(h0 - f.hp > 0, 'locked lights still hit what crosses the ring');
  assert.equal(f.burnTot, 0); assert.equal(f.burnT, 0, 'no Burn from the Candle Wheel');
});

test('burn: deterministic (same seed, same result) and share of Orbit damage <= 35%', () => {
  const run = () => {
    const s = fresh(); const e = put(s, 'dummy', 0); e.x = s.player.x + orbW(s).s.radius; step(s, 12);
    return [e.hp, e.burnTot, s.burnBy.holy_orbit || 0, s.dmgBy.holy_orbit || 0];
  };
  const a = run(), b = run();
  assert.deepEqual(a, b);
  assert.ok(a[2] / a[3] <= 0.35, `burn share ${a[2] / a[3]}`);
});

test('burn: palette role is lilac (not red, not gold); own number kind, first to be dropped', () => {
  const ch = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  for (const c of [ROLE.burn, ROLE.burnHot]) {
    const [r, g, b] = ch(c);
    assert.ok(b >= r && b > g + 20, `lilac ${c.toString(16)}`);
  }
  assert.notEqual(ROLE.burn, ROLE.evo);
  assert.ok(prioOf(KIND.BURN, 50) < prioOf(KIND.DMG, 1));
  const src = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(src.includes('KIND.BURN') && src.includes('ROLE.burn'));
  assert.ok(/const dripCap = this\.reducedMotion\(\) \? 0/.test(src), 'marks share the reduced-motion/tier drip cap');
});

test('burn: honest card text (Orbit now burns for real)', () => {
  assert.ok(/burn/i.test(data.weapons.holy_orbit.desc) && !/scorch/i.test(data.weapons.holy_orbit.desc));
});
