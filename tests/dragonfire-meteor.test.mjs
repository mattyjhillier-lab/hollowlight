// DM1 + DM2: Dragonfire Meteor (docs/design/fire-weapon-lucinda-v2.md). Staged: treeGate + unreleased, in no live pool.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { METEOR, WEAPON_BEHAVIOURS } from '../src/sim/weapons.js';
import { startableWeapons, starterPool } from '../src/meta/starter.js';
import { hintText, generateOffer } from '../src/sim/cards.js';
import { ENTRY_KEYS } from '../src/meta/codex.js';
import { data, treeDef } from './helpers.mjs';

const DT = 1 / 60;
const ID = 'dragonfire_meteor';
const dd = { ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } } };
const mk = (ranks = {}, seed = 3, grant = true) => {
  const sim = new Sim({ data: dd, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  if (grant) sim.debugGrant(ID, ranks);
  return sim;
};
const put = (sim, dx, dy, r = 8, boss = false) => { const e = sim.spawnEnemy('dummy', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = 1e9; e.r = r; if (boss) e.boss = true; return e; };
const run = (sim, secs) => { for (let i = 0; i < Math.round(secs / DT); i++) sim.step(DT, {}); };
const hitLog = (sim) => { const log = []; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { const src = sim._src; const r = o(e, a, x); if (src === ID && r > 0 && !(x && x.silent)) log.push({ e, a: r, t: sim.time }); return r; }; return log; };

test('DM1 data: stats, staging flags, boss, colour, no fire tag', () => {
  const w = data.weapons[ID], st = w.stats;
  assert.equal(w.name, 'Dragonfire Meteor'); assert.equal(w.treeGate, true); assert.equal(w.unreleased, true); assert.equal(w.color, '#ffb35c'); assert.deepEqual(w.tags, []);
  assert.equal(w.boss, 1.4); assert.equal(w.cd, 2.6);
  assert.deepEqual(Object.keys(st), ['count', 'power', 'area', 'duration']);
  assert.deepEqual([st.count.name, st.power.name, st.area.name, st.duration.name], ['Fireballs', 'Impact', 'Blaze', 'Embers']);
  assert.deepEqual([st.count.base, st.count.perRank, st.power.base, st.power.perRank, st.area.base, st.area.perRank, st.duration.base, st.duration.perRank], [1, 0.6, 14, 5.6, 34, 5, 2.5, 0.5]);
  for (const k of Object.keys(st)) assert.ok(hintText(w, k, 0).length > 8 && !hintText(w, k, 0).includes('{'), k);
  assert.ok(!data.weapons.ember_breath);
  assert.deepEqual(data.balance.starter.weapons, ['ghost_wolves', 'raven_flock', 'spirit_bolts', 'chain_lightning', 'holy_orbit']);
});

test('DM1 staging: never in starter offer, startable list, card pool, tree hearts; codex slot renamed in place', () => {
  assert.ok(!starterPool(data).weapons.includes(ID));
  assert.ok(!starterPool({ ...data, balance: { ...data.balance, starter: { heroes: ['*'], weapons: ['*'] } } }).weapons.includes(ID));
  assert.deepEqual(startableWeapons(data, treeDef, {}), []);
  assert.ok(!treeDef.hearts || !treeDef.hearts[ID]);
  const sim = new Sim({ data, characterId: 'wren', seed: 5 });
  for (let i = 0; i < 40; i++) assert.ok(!generateOffer(sim.cardCtx, sim.rng).cards.some((c) => c.weaponId === ID));
  assert.ok(ENTRY_KEYS.includes('c:dragonfire_meteor') && !ENTRY_KEYS.includes('c:ember_breath'));
  assert.equal(ENTRY_KEYS.indexOf('c:dragonfire_meteor'), 63, 'same slot: no key moved (DM4-DM6 appended e:wildfire, e:cinder_wyrm, e:cinder_brand after it, DM8 p:ophimber)');
  assert.ok(!ENTRY_KEYS.some((k) => k === 'weapon:' + ID), 'no Almanac weapon entry until the release switch');
});

test('DM2 first volley 0.8 s after the pick, then every 2.6 s', () => {
  const sim = mk();
  put(sim, 120, 0);
  const log = hitLog(sim);
  const launches = []; const o = sim.pushEvent.bind(sim); sim.pushEvent = (t, x) => { if (t === 'ember' && (!launches.length || sim.time - launches[launches.length - 1] > 0.1)) launches.push(sim.time); return o(t, x); };
  run(sim, 0.7); assert.equal(log.length, 0);
  run(sim, 6);
  assert.ok(Math.abs(launches[0] - 0.8) < 0.03, `first launch ${launches[0]}`);
  assert.ok(Math.abs(log[0].t - 1.25) < 0.05, `first impact ${log[0].t}`);
  const second = launches.find((t) => t > 2);
  assert.ok(Math.abs(second - 3.4) < 0.05, `second launch ${second}`);
});

test('DM2 aim: the densest cluster, within 50-230 px, never random', () => {
  const sim = mk();
  put(sim, 100, 0); // lone foe
  for (let i = 0; i < 6; i++) put(sim, (i % 3) * 8, -150 + Math.floor(i / 3) * 8); // 6-foe cluster north
  for (let i = 0; i < 3; i++) put(sim, -180, 60 + i * 6);
  run(sim, 0.85);
  const f = sim.weapons[0].rt.fly;
  assert.equal(f.length, 1);
  assert.ok(Math.abs(f[0].x - sim.player.x) < 25 && Math.abs(f[0].y - (sim.player.y - 146)) < 12, `landed ${f[0].x - sim.player.x},${f[0].y - sim.player.y}`);
  const d = Math.hypot(f[0].x - sim.player.x, f[0].y - sim.player.y); assert.ok(d >= 50 && d <= 230);
});

test('DM2 aim: foes closer than 50 or beyond 230 are not targets; none in range means no volley', () => {
  const sim = mk();
  put(sim, 30, 0); put(sim, 300, 0);
  run(sim, 3); assert.equal(sim.weapons[0].rt.fly.length, 0); assert.equal(sim.weapons[0].rt.pools.length, 0);
  put(sim, 0, 100); run(sim, 0.1); assert.equal(sim.weapons[0].rt.fly.length, 1, 'fires as soon as one is in the ring');
});

test('DM2 extra fireballs take the next-densest clusters, spaced; one cluster means they ring it', () => {
  const sim = mk({ count: 3 }); // 3 fireballs
  for (let i = 0; i < 5; i++) put(sim, 150, i * 6);
  for (let i = 0; i < 4; i++) put(sim, -150, i * 6);
  for (let i = 0; i < 3; i++) put(sim, 0, 150 + i * 6);
  run(sim, 0.85);
  const f = sim.weapons[0].rt.fly; assert.equal(f.length, 3);
  const r = data.weapons[ID].stats.area.base;
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(Math.hypot(f[i].x - f[j].x, f[i].y - f[j].y) >= r * 1.4 - 1e-6);
  assert.ok(f[0].x - sim.player.x > 100, 'densest first');
  const one = mk({ count: 5 }); // 4 fireballs
  for (let i = 0; i < 6; i++) put(one, 120 + (i % 3) * 5, (i >> 1) * 5);
  run(one, 0.85);
  const g = one.weapons[0].rt.fly; assert.equal(g.length, 4);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(Math.hypot(g[i].x - g[j].x, g[i].y - g[j].y) > 10, 'never stacked');
});

test('DM2 impact: burst damage + Burn through the shared status path; pool follows', () => {
  const sim = mk();
  const a = put(sim, 0, 120), far = put(sim, 0, 120 + 60);
  const log = hitLog(sim);
  let args = null; const ob = sim.burn.bind(sim); sim.burn = (...x) => { if (!args) args = x; return ob(...x); };
  run(sim, 1.3);
  const first = log.find((h) => h.e === a);
  assert.ok(first, 'hit');
  assert.ok(Math.abs(first.a - 14 * sim.dmgMult(sim.weapons[0])) < 1e-6);
  assert.deepEqual(args.slice(2), [2, 0.2]);
  assert.ok(Math.abs(a.burnDps - 0.2 * 14 * sim.dmgMult(sim.weapons[0]) * sim.tfx.burnMul) < 1e-6);
  assert.equal(a.burnSrc, ID);
  assert.ok(!log.some((h) => h.e === far), 'outside the burst radius');
  assert.equal(sim.weapons[0].rt.pools.length, 1);
  assert.ok(Math.abs(sim.weapons[0].rt.pools[0].r - 0.9 * 34) < 1e-9);
});

test('DM2 pool: ticks every 0.5 s at 0.3 x Impact for Embers seconds, then ends', () => {
  const sim = mk();
  const a = put(sim, 0, 120);
  const log = hitLog(sim);
  run(sim, 3.8); // before the second volley lands
  const ticks = log.filter((h) => h.e === a && h.t > 1.3);
  const imp = 14 * sim.dmgMult(sim.weapons[0]);
  assert.ok(ticks.length >= 3 && ticks.length <= 5, `ticks ${ticks.length}`);
  assert.ok(Math.abs(ticks[0].a - 0.3 * imp) < 1e-6);
  for (let i = 1; i < ticks.length; i++) assert.ok(ticks[i].t - ticks[i - 1].t >= 0.49);
  assert.equal(sim.weapons[0].rt.pools.length, 0, '1.25 + 2.5 s: the pool has burnt out');
  run(sim, 3); assert.ok(sim.weapons[0].rt.pools.length <= 1);
});

test('DM2 HARD cap: at most 5 live pools, the oldest dropped', () => {
  const sim = mk({ count: 5, duration: 5 });
  for (let i = 0; i < 8; i++) put(sim, -200 + i * 60, 100 + (i % 2) * 40);
  let max = 0;
  for (let i = 0; i < 60 * 30; i++) { sim.step(DT, {}); max = Math.max(max, sim.weapons[0].rt.pools.length); }
  assert.equal(max, METEOR.maxPools);
  const w = sim.weapons[0], base = { y: 2, r: 3, life: 9, t: 9, dmg: 0 };
  w.rt.pools.length = 0; for (let i = 0; i < 5; i++) w.rt.pools.push({ ...base, x: i });
  w.rt.fly.push({ x: 99, y: 99, t: 0.001, r: 10, dmg: 0, life: 3 });
  sim.step(DT, {});
  assert.equal(w.rt.pools.length, 5); assert.equal(w.rt.pools[0].x, 1, 'oldest (x=0) dropped'); assert.equal(w.rt.pools[4].x, 99);
});

test('DM2 per-target lockout: overlapping pools never tick one foe twice in 0.5 s', () => {
  const sim = mk();
  const a = put(sim, 0, 100);
  const w = sim.weapons[0]; sim.step(DT, {}); w.rt.cd = 1e9; // init runtime, then no volley
  for (let i = 0; i < 5; i++) w.rt.pools.push({ x: a.x + i, y: a.y, r: 30, life: 10, t: 0.01 + i * 0.1, dmg: 2 });
  const log = hitLog(sim);
  run(sim, 4);
  assert.ok(log.length >= 6, `${log.length} ticks`);
  for (let i = 1; i < log.length; i++) assert.ok(log[i].t - log[i - 1].t >= 0.49, `gap ${log[i].t - log[i - 1].t}`);
  assert.ok(log.length <= 4 / 0.5 + 1, `${log.length} ticks in 4 s from 5 pools`);
});

test('DM2 boss clause: 1.4 x impact via the weapon rule; pools tick a boss at 0.5 x', () => {
  const sim = mk();
  const b = put(sim, 0, 120, 8, true), n = put(sim, 0, 130);
  const log = hitLog(sim);
  run(sim, 2.3);
  const bi = log.find((h) => h.e === b), ni = log.find((h) => h.e === n);
  assert.ok(Math.abs(bi.a / ni.a - 1.4) < 1e-6);
  const bt = log.filter((h) => h.e === b)[1], nt = log.filter((h) => h.e === n)[1];
  assert.ok(Math.abs(bt.a / nt.a - 0.5 * 1.4) < 1e-6, `${bt.a / nt.a}`);
});

test('DM2 determinism: same seed same numbers; the handler draws no RNG', () => {
  const go = () => { const sim = mk({ count: 3, power: 2 }, 9); for (let i = 0; i < 20; i++) put(sim, 80 + (i % 5) * 20, -100 + i * 7); run(sim, 12); return [sim.damageDealt, sim.weapons[0].rt.pools.length]; };
  assert.deepEqual(go(), go());
  assert.ok(!/rng|Math\.random/.test(WEAPON_BEHAVIOURS[ID].update.toString()));
  const a = mk({}, 4), b = mk({}, 4, false);
  put(a, 0, 120); put(b, 0, 120);
  run(a, 8); run(b, 8);
  assert.equal(a.rng.next(), b.rng.next(), 'same RNG state with and without the Meteor');
});

test('DM2 hostile input: NaN positions, empty list, non-finite stats, dead foes never crash', () => {
  const sim = mk();
  run(sim, 2); // empty field
  const bad = put(sim, 0, 100); bad.x = NaN; const bad2 = put(sim, 0, 100); bad2.y = Infinity;
  const dead = put(sim, 0, 120); dead.dead = true;
  const ok = put(sim, 0, 130);
  const w = sim.weapons[0];
  w.s.area = NaN; w.s.power = NaN; w.s.count = NaN; w.s.duration = NaN;
  assert.doesNotThrow(() => run(sim, 8));
  assert.ok(Number.isFinite(ok.hp) && Number.isFinite(sim.damageDealt));
  const p = sim.player; const px = p.x; p.x = NaN;
  assert.doesNotThrow(() => run(sim, 1)); p.x = px;
  assert.ok(w.rt.pools.length <= 5);
});
