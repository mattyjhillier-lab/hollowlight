// W5: Sanctum Halo = A Consecrated Ring (docs/design/evolutions-second-review.md 4.5, LOCKED): lights x2 (cap 12), ring = Orbit size x1.5,
// contact 0.6x, the ground disc inside the ring applies BURN (instead of zone damage, no heal until W5b) to up to 20 foes,
// guard contraction applies, D1 (stats keep working after evolving).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { data, measureRatios, ranksFor } from '../scripts/evo-same-ranks.mjs';

const DT = 1 / 60;
const mk = (ranks, evo = 'sanctum_halo', seed = 5, ch = 'elias') => {
  const sim = new Sim({ data, characterId: ch, seed, godMode: true });
  sim.weapons.length = 0;
  sim.ability.cdLeft = 1e9;
  sim.rollDrops = () => {};
  sim.debugGrant('holy_orbit', ranks, evo);
  return sim;
};
const R = (o = {}) => ({ count: 1, power: 1, radius: 1, speed: 1, ...o });
const dummy = (sim, dx, dy) => { const e = sim.spawnEnemy('dummy', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = 1e9; e.speed = 0; e.dmg = 0; return e; };
const run = (sim, secs) => { for (let i = 0; i < secs / DT; i++) sim.step(DT, {}); };

test('Halo: lights x2 capped at 12, ring = Orbit size x1.5, burning ground is not a zone and does not heal', () => {
  for (const [count, want] of [[1, 6], [3, 10], [4, 12], [5, 12]]) { // base Orb count = 2 + rank
    const sim = mk(R({ count }));
    run(sim, 0.5);
    const orbs = sim.units.filter((u) => u.kind === 'orb');
    assert.equal(orbs.length, want, `count rank ${count}`);
  }
  const sim = mk(R({ radius: 3 }));
  run(sim, 0.5);
  const o = sim.units.find((u) => u.kind === 'orb');
  const ring = (38 + 6 * 3) * 1.5;
  assert.ok(Math.abs(Math.hypot(o.x - sim.player.x, o.y - sim.player.y) - ring) < 0.5, 'ring radius');
  assert.equal(sim.zones.length, 0, 'no separate zone damage object');
});

test('Halo: ground burns up to 20 foes inside the ring, none outside, tagged to Holy Orbit', () => {
  const sim = mk(R({ radius: 2 }));
  const inside = [];
  for (let i = 0; i < 30; i++) { const a = i * 0.7; inside.push(dummy(sim, Math.cos(a) * 30, Math.sin(a) * 30)); }
  const out = dummy(sim, 200, 0);
  run(sim, 0.8);
  const burning = inside.filter((e) => e.burnT > 0).length;
  assert.ok(burning >= 20 && burning <= 24, `burning inside ${burning}`); // 20 per tick, the second tick can reach others
  assert.equal(out.burnT, 0, 'outside the ring');
  assert.ok((sim.burnBy.holy_orbit || 0) > 0);
  assert.equal(sim.healed ?? 0, 0);
});

test('Halo: one tick sets at most 20 foes alight', () => {
  const sim = mk(R());
  const es = [];
  for (let i = 0; i < 40; i++) { const a = i * 0.5; es.push(dummy(sim, Math.cos(a) * 25, Math.sin(a) * 25)); }
  sim.step(DT, {});
  assert.equal(es.filter((e) => e.burnT > 0).length, 20);
});

test('Halo: the contracted ring still burns the foe pressing against Elias (not empty-handed)', () => {
  const sim = mk(R({ radius: 5 }));
  const e = dummy(sim, sim.player.r + 8 + 2, 0); // edge distance ~2 px
  run(sim, 2.5);
  assert.ok(sim.weapons[0].rt.gK > 0.9, 'ring closed');
  assert.ok(e.burnT > 0 || e.burnTot > 0, 'burning');
  assert.ok(e.maxHp - e.hp > 0, 'took damage');
});

test('Halo: the Candle Wheel suppresses the ground burn (the ability never applies Burn)', () => {
  const sim = mk(R());
  sim.ability.cdLeft = 0; sim.useAbility();
  const e = dummy(sim, 20, 0);
  run(sim, 1.5);
  assert.equal(e.burnT, 0);
  assert.equal(sim.burnBy.holy_orbit || 0, 0);
});

test('Halo D1: every Holy Orbit stat still changes the evolved Halo (no no-ops)', () => {
  const dps = (ranks, secs = 6) => { const sim = mk(ranks); const e = dummy(sim, 0, 0); const r = sim.weapons[0].s.radius * 1.5 * sim.mods.area; e.x = sim.player.x + r; e.y = sim.player.y; const h = e.hp; run(sim, secs); return (h - e.hp) / secs; };
  assert.ok(dps(R({ power: 4 })) > dps(R({ power: 1 })) * 1.4, 'power');
  assert.ok(dps(R({ speed: 5 })) > dps(R({ speed: 1 })) * 1.2, 'speed');
  const n = (r) => { const sim = mk(r); run(sim, 0.3); return sim.units.filter((u) => u.kind === 'orb').length; };
  assert.ok(n(R({ count: 3 })) > n(R({ count: 1 })), 'count');
  const rad = (r) => { const sim = mk(r); run(sim, 0.3); const o = sim.units.find((u) => u.kind === 'orb'); return Math.hypot(o.x - sim.player.x, o.y - sim.player.y); };
  assert.ok(rad(R({ radius: 4 })) > rad(R({ radius: 1 })) + 20, 'size');
});

test('Halo: hug DPS >= 25% of ring DPS, Burn share <= 35% of Orbit damage', () => {
  const go = (hug) => {
    const sim = mk({ count: 5, power: 2, radius: 5, speed: 2 });
    const e = dummy(sim, 0, 0);
    const rr = sim.weapons[0].s.radius * 1.5 * sim.mods.area;
    e.x = sim.player.x + (hug ? e.r + sim.player.r + 2 : rr); e.y = sim.player.y;
    const h = e.hp; run(sim, 10);
    return { dps: (h - e.hp) / 10, burn: (sim.burnBy.holy_orbit || 0) / Math.max(1, sim.dmgBy.holy_orbit || 1) };
  };
  const ring = go(false), hug = go(true);
  assert.ok(hug.dps >= 0.25 * ring.dps, `hug ${hug.dps.toFixed(1)} ring ${ring.dps.toFixed(1)}`);
  assert.ok(ring.burn <= 0.35 && hug.burn <= 0.35, `burn share ${ring.burn} ${hug.burn}`);
});

test('Halo: cap at pick (pair 5, others 1) <= 3.0x base in stream40/single and never below base; boss >= 1.0x and <= 3.0x', () => {
  const res = measureRatios({ secs: 10, seeds: [1], modes: ['pair', 'max'], only: ['sanctum_halo'] }).sanctum_halo;
  assert.ok(res.pair.stream40.ratio <= 3.0, `stream40 ${res.pair.stream40.ratio}`);
  for (const m of ['pair', 'max']) for (const [sc, c] of Object.entries(res[m])) assert.ok(c.ratio >= 0.98, `${m} ${sc} ${c.ratio}`);
  const boss = (evo, ranks) => {
    const sim = mk(ranks, evo);
    const b = sim.spawnEnemy('elder_treant', sim.player.x + 70, sim.player.y);
    b.hp = b.maxHp = 1e12; const h = b.hp; run(sim, 25); return h - b.hp;
  };
  for (const other of [1, 2]) {
    const rk = { count: 5, radius: 5, power: other, speed: other };
    const r = boss('sanctum_halo', rk) / boss(null, rk);
    assert.ok(r >= 1.0 && r <= 3.0, `boss ratio at others r${other}: ${r.toFixed(2)}`);
  }
});

test('Halo is deterministic (same seed, same damage and burn)', () => {
  const go = () => { const sim = mk(R({ count: 3, radius: 3 }), 'sanctum_halo', 9); for (let i = 0; i < 12; i++) dummy(sim, 20 + i * 6, i * 4 - 20); run(sim, 4); return [sim.dmgBy.holy_orbit, sim.burnBy.holy_orbit, sim.rng.next()]; };
  assert.deepEqual(go(), go());
});
