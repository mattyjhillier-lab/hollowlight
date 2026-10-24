// CHARACTER SYSTEM v2 (LOCKED 2026-10-24): one shared body, any starting spirit, Bond read once at run start, Pelt Dash (Wren) and
// Sanctuary Ring (Elias). Replaces the retired Rally the Pack / Candle Wheel tests (rally.test.mjs, wheel.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { bondDef, bondBonus } from '../src/meta/bond.js';

const DT = 1 / 60;
const quiet = (opts = {}) => {
  const sim = new Sim({ data, seed: 7, characterId: 'wren', godMode: true, ...opts });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
  sim.spawnAcc = [];
  return sim;
};
const run = (sim, s, input = {}) => { for (let i = 0, n = Math.round(s / DT); i < n; i++) sim.step(DT, input); };
const cast = (sim, input = {}) => { sim.ability.cdLeft = 0; sim.step(DT, { ...input, ability: true }); };

test('v2 data: identical bodies (no hp/speed/traits/weapon), kindred spirit, the two locked abilities at 60 s', () => {
  for (const [id, c] of Object.entries(data.characters)) {
    for (const k of ['hp', 'speed', 'traits', 'traitText', 'weapon', 'treeGate']) assert.equal(c[k], undefined, `${id}.${k} is gone`);
    assert.ok(Object.hasOwn(data.weapons, c.kindred), `${id} kindred is a weapon`);
    assert.equal(c.ability.cooldown, 60);
    assert.ok(c.keepsake && c.keepsake.name && c.keepsake.hint, `${id} has a keepsake`);
  }
  assert.equal(data.characters.wren.ability.id, 'pelt_dash');
  assert.equal(data.characters.elias.ability.id, 'sanctuary_ring');
  const w = new Sim({ data, seed: 1, characterId: 'wren' }), e = new Sim({ data, seed: 1, characterId: 'elias' });
  assert.equal(w.player.maxHp, data.balance.body.hp);
  assert.equal(e.player.maxHp, w.player.maxHp);
  assert.equal(e.player.speed, w.player.speed);
});

test('start weapon: any weapon id fills slot 1 at rank 1; a bad id falls back to the kindred spirit', () => {
  for (const wid of Object.keys(data.weapons)) {
    const s = new Sim({ data, seed: 1, characterId: 'elias', startWeapon: wid });
    assert.deepEqual(s.weapons.map((w) => w.id), [wid]);
    assert.equal(s.result().startWeapon, wid);
  }
  for (const bad of ['nope', '__proto__', 7, null, { x: 1 }]) assert.equal(new Sim({ data, seed: 1, characterId: 'wren', startWeapon: bad }).weapons[0].id, 'ghost_wolves');
});

test('abilities never read a weapon id (weapon-agnostic by rule)', () => {
  const src = readFileSync(new URL('../src/sim/Sim.js', import.meta.url), 'utf8');
  const a = src.indexOf('  useAbility() {'), b = src.indexOf('  cleanupDead() {');
  const body = src.slice(a, b);
  for (const wid of Object.keys(data.weapons)) assert.ok(!body.includes(wid), `useAbility/dashShove mention ${wid}`);
  assert.ok(!/srcAmps/.test(body));
});

test('Pelt Dash: 130 px along the heading in 0.2 s, untouchable 0.5 s, then 60 s cooldown', () => {
  const sim = quiet();
  run(sim, 0.2, { x: 0, y: -1 }); // heading north
  const x0 = sim.player.x, y0 = sim.player.y;
  cast(sim);
  assert.ok(sim.player.iframes >= 0.5 - DT);
  run(sim, 0.25);
  assert.ok(Math.abs(sim.player.x - x0) < 0.5);
  assert.ok(Math.abs(y0 - sim.player.y - 130) < 2, `dashed ${y0 - sim.player.y}`);
  assert.equal(sim.dash, null);
  assert.ok(sim.ability.cdLeft > 59);
  assert.equal(sim.useAbility(), false, 'no recast on cooldown');
  assert.ok(sim.events.some((e) => e.type === 'dash'));
});

test('Pelt Dash: hits during the window do nothing; foes in the way are shoved aside once, never damaged; bosses and immune foes stay', () => {
  const sim = new Sim({ data, seed: 7, characterId: 'wren' });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 }; sim.spawnAcc = []; sim.weapons.length = 0;
  run(sim, 0.1, { x: 1, y: 0 });
  const p = sim.player;
  const foe = sim.spawnEnemy('root_crawler', p.x + 60, p.y + 3);
  const boss = sim.spawnEnemy('root_crawler', p.x + 90, p.y - 2); boss.boss = true;
  const hp0 = foe.hp, by = boss.y;
  cast(sim, { x: 1, y: 0 });
  const hpP = p.hp;
  sim.damagePlayer(10, 'test');
  assert.equal(p.hp, hpP, 'untouchable');
  run(sim, 0.25, { x: 1, y: 0 });
  assert.equal(foe.hp, hp0, 'no damage');
  assert.ok(Math.abs(foe.y - p.y) > 20, 'shoved to the side');
  assert.ok(Math.abs(boss.y - by) < 3, 'the boss is not shoved');
});

test('Sanctuary Ring: r80 for 6 s, heals 1.5 HP/s inside, slows non-boss foes inside 40%, no damage, then 60 s cooldown', () => {
  const sim = quiet({ characterId: 'elias', godMode: false });
  sim.weapons.length = 0;
  sim.player.hp = 50;
  cast(sim);
  const z = sim.zones.find((q) => q.sanctuary);
  assert.ok(z && z.r === 80 && Math.abs(z.ttl - 6) < 0.05 && z.dps === 0);
  run(sim, 2);
  assert.ok(sim.player.hp > 52.5 && sim.player.hp < 53.5, `healed ${sim.player.hp}`);
  // slow: the same foe walks 40% slower inside than outside (no other movement rule in play)
  const p = sim.player;
  const a = sim.spawnEnemy('root_crawler', p.x + 40, p.y);
  const hpA = a.hp;
  const xa = a.x; sim.step(DT, {}); const inside = Math.abs(a.x - xa);
  sim.zones.length = 0;
  const xb = a.x; sim.step(DT, {}); const outside = Math.abs(a.x - xb);
  assert.ok(Math.abs(inside / outside - 0.6) < 0.05, `inside/outside ${inside / outside}`);
  assert.equal(a.hp, hpA, 'the ring deals no damage');
  assert.ok(sim.ability.cdLeft > 50);
});

test('Sanctuary Ring: bosses are not slowed; the ring expires; deterministic', () => {
  const sim = quiet({ characterId: 'elias' });
  sim.weapons.length = 0;
  cast(sim);
  const p = sim.player;
  const b = sim.spawnEnemy('root_crawler', p.x + 40, p.y); b.boss = true;
  const x0 = b.x; sim.step(DT, {}); const inside = Math.abs(b.x - x0);
  sim.zones.length = 0;
  const x1 = b.x; sim.step(DT, {}); assert.ok(Math.abs(inside - Math.abs(b.x - x1)) < 1e-6, 'boss speed unchanged');
  const s2 = quiet({ characterId: 'elias' }); cast(s2); run(s2, 6.2);
  assert.equal(s2.zones.filter((z) => z.sanctuary).length, 0);
  const A = quiet({ characterId: 'elias' }), B = quiet({ characterId: 'elias' });
  for (const s of [A, B]) { cast(s); run(s, 3, { x: 1, y: 0.3 }); }
  assert.deepEqual(A.zones.map((z) => [z.x, z.y, z.ttl]), B.zones.map((z) => [z.x, z.y, z.ttl]));
});

test('Bond: read once at Sim start (HP, ward, speed); level 0 is the plain body; clamped; never changes mid-run', () => {
  const D = bondDef(data.balance);
  assert.equal(D.cap, 25);
  const b25 = bondBonus(D, 25);
  assert.ok(Math.abs(b25.hpMul - 1.04) < 1e-9 && Math.abs(b25.ward - 0.03) < 1e-9 && Math.abs(b25.speedMul - 1.03) < 1e-9, 'cap 25 = the sheet cap-10 total');
  assert.deepEqual(bondBonus(D, 99), b25);
  for (const bad of [-1, 1.5, '7', NaN, null]) assert.equal(bondBonus(D, bad).hpMul, 1);
  const s0 = new Sim({ data, seed: 3, characterId: 'wren' });
  const s = new Sim({ data, seed: 3, characterId: 'wren', bond: 25 });
  assert.equal(s.player.maxHp, Math.round(s0.player.maxHp * 1.04));
  assert.ok(Math.abs(s.player.speed / s0.player.speed - 1.03) < 1e-9);
  s.player.iframes = 0; const h = s.player.hp; s.damagePlayer(10, 'test');
  assert.ok(Math.abs(h - s.player.hp - 9.7) < 1e-9, 'ward 3%');
  assert.equal(s.result().bond, 25);
  for (const bad of ['5', -3, 2.5, {}]) assert.equal(new Sim({ data, seed: 3, characterId: 'wren', bond: bad }).bondLevel, 0);
});

test('keepsakes: drop only for listed sleeping heroes, at most one per run, own RNG (runs without one are byte-identical)', () => {
  const play = (keep) => { const s = new Sim({ data, seed: 11, characterId: 'wren', keepsakes: keep }); for (let i = 0; i < 60 * 60; i++) { if (s.state === 'levelup') { s.pickCard(s.offer.cards[0].key); continue; } s.step(DT, { x: 0.3, y: 0.1 }); } return s; };
  const a = play(null), b = play(['elias']);
  assert.deepEqual([a.kills, a.time, a.player.hp, a.level], [b.kills, b.time, b.player.hp, b.level], 'the keepsake roll never touches the run RNG');
  const s = new Sim({ data, seed: 2, characterId: 'wren', keepsakes: ['elias', 'wren', 'nope', '__proto__'] });
  assert.deepEqual(s.keepFor, ['elias'], 'the hero in play and unknown ids are dropped');
  s.keepDef = { need: 5, chest: 1, boss: 1 };
  s.rollKeepsake('chest', 0, 0); s.rollKeepsake('boss', 0, 0);
  assert.equal(s.keepsake, 'elias');
  assert.equal(s.events.filter((e) => e.type === 'keepsake').length, 1, 'max one per run');
  assert.equal(new Sim({ data, seed: 2, characterId: 'wren' }).result().keepsake, null);
});
