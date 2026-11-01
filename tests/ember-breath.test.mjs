// EW1: Ember Breath (docs/design/new-weapon-hero-v1.md W-A). Staged: treeGate + unreleased, no tree node, not in any live pool.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { emberHit, EMBER } from '../src/sim/weapons.js';
import { startableWeapons, starterPool } from '../src/meta/starter.js';
import { hintText, generateOffer } from '../src/sim/cards.js';
import { data, treeDef } from './helpers.mjs';

const DT = 1 / 60;
const dd = { ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } } };
const mk = (ranks = {}, seed = 3) => {
  const sim = new Sim({ data: dd, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('ember_breath', ranks);
  sim.player.hx = 1; sim.player.hy = 0;
  return sim;
};
const put = (sim, dx, dy, r, boss = false) => { const e = sim.spawnEnemy('dummy', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = 1e9; e.r = r; if (boss) e.boss = true; return e; };
const run = (sim, secs) => { for (let i = 0; i < Math.round(secs / DT); i++) sim.step(DT, {}); };
const hitLog = (sim) => { const log = []; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { const src = sim._src; const r = o(e, a, x); if (src === 'ember_breath' && r > 0 && !(x && x.silent)) log.push({ e, a: r, t: sim.time }); return r; }; return log; };

test('EW1 data: stats, staging flags, boss coefficient, colour', () => {
  const w = data.weapons.ember_breath, st = w.stats;
  assert.equal(w.treeGate, true); assert.equal(w.unreleased, true); assert.equal(w.color, '#ffb35c'); assert.deepEqual(w.tags, []);
  assert.deepEqual(Object.keys(st), ['power', 'area', 'cooldown', 'duration']);
  assert.deepEqual([st.power.name, st.area.name, st.cooldown.name, st.duration.name], ['Heat', 'Reach', 'Breath', 'Smoulder']);
  assert.equal(st.power.base, 4.2); assert.equal(st.power.perRank, 1.5); assert.equal(st.area.base, 80); assert.equal(st.area.perRank, 12);
  assert.equal(st.cooldown.base, 2.4); assert.equal(st.cooldown.perRank, -0.2); assert.equal(st.duration.base, 1.5); assert.equal(st.duration.perRank, 0.5);
  assert.ok(w.boss > 1);
  for (const k of Object.keys(st)) assert.ok(hintText(w, k, 0).length > 8 && !hintText(w, k, 0).includes('{'), k);
});

test('EW1 staging: never in the starter offer, startable list, card pool; no tree node', () => {
  assert.ok(!starterPool(data).weapons.includes('ember_breath'));
  assert.ok(!data.balance.starter.weapons.includes('ember_breath'));
  assert.deepEqual(startableWeapons(data, treeDef, {}), []);
  assert.ok(!treeDef.hearts || !treeDef.hearts.ember_breath);
  const sim = new Sim({ data, characterId: 'wren', seed: 5 });
  for (let i = 0; i < 40; i++) assert.ok(!generateOffer(sim.cardCtx, sim.rng).cards.some((c) => c.weaponId === 'ember_breath'));
});

test('EW1 cone geometry: 70 degrees, reach 80, edge-based', () => {
  const p = { x: 0, y: 0 };
  const E = (x, y, r = 8) => ({ x, y, r });
  assert.ok(emberHit(p, 0, 80, E(70, 0)));
  assert.ok(!emberHit(p, 0, 80, E(100, 0)), 'beyond reach + body');
  assert.ok(emberHit(p, 0, 80, E(86, 0)), 'body edge inside reach');
  assert.ok(emberHit(p, 0, 80, E(50 * Math.cos(0.6), 50 * Math.sin(0.6))), '34 degrees in');
  assert.ok(!emberHit(p, 0, 80, E(50 * Math.cos(0.9), 50 * Math.sin(0.9), 2)), '52 degrees out');
  assert.ok(!emberHit(p, 0, 80, E(-40, 0)), 'behind');
  assert.ok(Math.abs(EMBER.half * 2 - 70 * Math.PI / 180) < 1e-9);
});

test('EW1 four ticks over the breath, everything in the cone, Burn set once per foe per breath', () => {
  const sim = mk();
  const a = put(sim, 50, 0, 8), b = put(sim, 60, 20, 8), c = put(sim, -50, 0, 8);
  const log = hitLog(sim);
  let burns = 0; const ob = sim.burn.bind(sim); sim.burn = (...x) => { burns++; return ob(...x); };
  run(sim, 1.2); // first breath starts after 0.5 s
  const first = log.filter((h) => h.e === a);
  assert.equal(first.length, 4, 'four ticks');
  assert.ok(first[3].t - first[0].t >= 0.4 && first[3].t - first[0].t <= 0.5, 'spread over the breath');
  assert.equal(log.filter((h) => h.e === b).length, 4);
  assert.equal(log.filter((h) => h.e === c).length, 0, 'behind the hero is untouched');
  assert.equal(burns, 2, 'one Burn per foe per breath');
  assert.ok(Math.abs(first[0].a - 4.2 * sim.dmgMult(sim.weapons[0])) < 1e-6);
  assert.ok(a.burnT > 0 && a.burnT <= 1.5 + 1e-9, 'Smoulder 1.5 s at rank 0');
  assert.ok(Math.abs(a.burnDps - 0.25 * first[0].a * sim.tfx.burnMul) < 1e-6);
});

test('EW1 cadence follows Breath (cooldown)', () => {
  for (const [cd, expect] of [[0, 2.4], [5, 1.4]]) {
    const sim = mk({ cooldown: cd }); put(sim, 40, 0, 8);
    const log = hitLog(sim); run(sim, 9);
    const starts = log.filter((h, i) => i === 0 || h.t - log[i - 1].t > 0.9).map((h) => h.t);
    assert.ok(starts.length >= 3);
    assert.ok(Math.abs((starts[2] - starts[1]) - expect) < 0.05, `cadence ${starts[2] - starts[1]}`);
  }
});

test('EW1 aims at the thickest group in front', () => {
  const sim = mk();
  for (let i = 0; i < 5; i++) put(sim, 50, -45 + i * 3, 6);
  put(sim, 50, 45, 6);
  const log = hitLog(sim); run(sim, 1);
  const sides = new Set(log.map((h) => (h.e.y < sim.player.y ? 'up' : 'down')));
  assert.ok(sides.has('up'), 'the crowd is breathed on');
  assert.ok(!sides.has('down'), 'the lone foe is not');
});

test('EW1 boss clause: a big body in reach is always hit, even off the heading, and takes the boss coefficient', () => {
  const sim = mk();
  const boss = put(sim, 0, 70, 30, true); // 90 degrees off the heading
  for (let i = 0; i < 6; i++) put(sim, 60, -10 + i * 4, 5); // a crowd ahead would otherwise win
  const log = hitLog(sim); run(sim, 1.3);
  const hits = log.filter((h) => h.e === boss);
  assert.equal(hits.length, 4);
  assert.ok(Math.abs(hits[0].a - 4.2 * sim.dmgMult(sim.weapons[0]) * data.weapons.ember_breath.boss) < 1e-6);
});

test('EW1 deterministic: same seed, same result; the handler draws no RNG', async () => {
  const go = () => { const sim = mk({ power: 2 }, 11); for (let i = 0; i < 12; i++) put(sim, 40 + (i % 4) * 8, (i - 6) * 6, 7); run(sim, 6); return sim.enemies.map((e) => e.hp.toFixed(6)).join(','); };
  assert.equal(go(), go());
  const { WEAPON_BEHAVIOURS } = await import('../src/sim/weapons.js');
  assert.ok(!/rng|Math\.random/.test(WEAPON_BEHAVIOURS.ember_breath.update.toString()));
});

test('EW1 hostile inputs: NaN heading, no foes, dead foes, clamped debug ranks, NaN foe positions', () => {
  const sim = mk({ area: 99, cooldown: -4, power: NaN });
  assert.ok(sim.weapons[0].ranks.area <= 5 && sim.weapons[0].ranks.cooldown >= 0);
  sim.player.hx = NaN; sim.player.hy = NaN;
  run(sim, 3);
  const e = put(sim, 30, 0, 8); e.dead = true; run(sim, 3);
  assert.equal(emberHit({ x: 0, y: 0 }, NaN, 80, { x: 10, y: 0, r: 5 }), false);
  assert.ok(Number.isFinite(sim.player.x));
});
