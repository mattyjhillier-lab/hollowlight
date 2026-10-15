// W2: Rally the Pack (Wren). Deterministic sim tests; see docs/design/weapons-and-summons-v1.1.md chunk W2.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';

const DT = 1 / 60;
const quiet = (opts = {}) => {
  const sim = new Sim({ data, seed: 7, characterId: 'wren', godMode: true, ...opts });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
  sim.spawnAcc = [];
  return sim;
};
const run = (sim, s, input = {}) => { for (let i = 0, n = Math.round(s / DT); i < n; i++) sim.step(DT, input); };
const cast = (sim) => { sim.ability.cdLeft = 0; sim.step(DT, { ability: true }); };

test('rally: Wren has Rally the Pack, Elias keeps Sanctuary, no Pack Howl left', () => {
  assert.equal(data.characters.wren.ability.id, 'rally_pack');
  assert.equal(data.characters.wren.ability.name, 'Rally the Pack');
  assert.equal(data.characters.elias.ability.id, 'sanctuary');
  assert.ok(!/howl/i.test(JSON.stringify(data.characters)));
  const sim = quiet();
  assert.equal(sim.ability.cdLeft, 10); // starts on cooldown
  assert.equal(sim.rally, null);
});

test('rally-pins-toughest: wolves converge on the toughest non-boss enemy and it is held for the window', () => {
  const sim = quiet();
  const p = sim.player;
  const weak = sim.spawnEnemy('wolf', p.x + 60, p.y + 10);
  const tough = sim.spawnEnemy('root_crawler', p.x - 70, p.y);
  tough.hp = 5000; tough.maxHp = 5000; // the toughest by far, not a boss
  cast(sim);
  assert.equal(sim.rally.target, tough);
  const x0 = tough.x, y0 = tough.y;
  run(sim, 2);
  assert.ok(Math.hypot(tough.x - x0, tough.y - y0) < 0.5, 'pinned enemy does not move');
  const wolves = sim.units.filter((u) => u.kind === 'wolf');
  assert.ok(wolves.length >= 1);
  assert.ok(wolves.every((u) => u.target === tough), 'every wolf converged on the rallied enemy');
  assert.ok(tough.hp < 5000, 'wolves bite it');
  assert.ok(weak && weak.heldT <= 0 || weak.heldT === undefined, 'others are not pinned');
});

test('rally-boss-no-pin: a boss is bitten but never pinned; non-boss is preferred when both are near', () => {
  const sim = quiet();
  const p = sim.player;
  const boss = sim.spawnEnemy('elder_treant', p.x + 50, p.y);
  cast(sim);
  assert.equal(sim.rally.target, boss, 'boss is the fallback when nothing else is near');
  const hp0 = boss.hp;
  for (let i = 0; i < 240; i++) { sim.step(DT, {}); assert.ok(!(boss.heldT > 0), 'boss never held'); assert.equal(boss.fearT, 0); }
  assert.ok(boss.hp < hp0, 'wolves attack the boss');
  const sim2 = quiet();
  const b2 = sim2.spawnEnemy('elder_treant', sim2.player.x + 50, sim2.player.y);
  const c2 = sim2.spawnEnemy('root_crawler', sim2.player.x - 60, sim2.player.y);
  cast(sim2);
  assert.equal(sim2.rally.target, c2);
  assert.ok(b2);
});

test('rally-no-fear: nothing flees and the hero gets no speed boost', () => {
  const sim = quiet();
  const es = [];
  for (let i = 0; i < 8; i++) es.push(sim.spawnEnemy('wolf', sim.player.x + 30 + i * 6, sim.player.y + (i % 3) * 8));
  cast(sim);
  run(sim, 3);
  assert.ok(es.every((e) => !(e.fearT > 0)));
  assert.equal(sim.buffs.speedBoost, 0);
  assert.equal(sim.buffs.speedMult, 1);
});

function damageTaken(bonus, weaponId = 'ghost_wolves') {
  const sim = quiet();
  if (weaponId !== 'ghost_wolves') { sim.weapons.length = 0; sim.debugGrant(weaponId, { power: 3, speed: 3, count: 3, range: 3, duration: 3, area: 3 }); }
  sim.ability.bonus = bonus;
  const dummy = sim.spawnEnemy('elder_treant', sim.player.x + 45, sim.player.y);
  cast(sim);
  run(sim, 5);
  return dummy.maxHp - dummy.hp;
}

test('rally-wolves-only: +50% on wolf damage, ravens and orbit damage unchanged', () => {
  const wolfRatio = damageTaken(0.5) / damageTaken(0);
  assert.ok(wolfRatio > 1.4 && wolfRatio < 1.6, `wolf ratio ${wolfRatio}`);
  for (const id of ['raven_flock', 'holy_orbit']) {
    assert.equal(damageTaken(0.5, id), damageTaken(0, id), `${id} unchanged by Rally`);
  }
});

test('rally-cooldown-duration: 6 s window, 60 s cooldown, end event, cannot recast early', () => {
  const sim = quiet();
  cast(sim);
  assert.ok(sim.ability.cdLeft > 59 && sim.ability.cdLeft <= 60);
  assert.ok(sim.buffs.rally > 5.9 && sim.buffs.rally <= 6);
  assert.ok(sim.events.some((e) => e.type === 'rally'));
  run(sim, 5.8);
  assert.ok(sim.buffs.rally > 0 && sim.rally);
  run(sim, 0.4);
  assert.equal(sim.rally, null);
  assert.equal(sim.buffs.rally, 0);
  assert.ok(sim.events.some((e) => e.type === 'rallyEnd'));
  const left = sim.ability.cdLeft;
  sim.step(DT, { ability: true });
  assert.ok(sim.ability.cdLeft < left && !sim.rally, 'on cooldown');
});

test('rally-retargets: when the rallied enemy dies the pack picks the next toughest', () => {
  const sim = quiet();
  const a = sim.spawnEnemy('wolf', sim.player.x + 40, sim.player.y);
  const b = sim.spawnEnemy('root_crawler', sim.player.x - 40, sim.player.y);
  b.hp = 900; a.hp = 800;
  cast(sim);
  assert.equal(sim.rally.target, b);
  b.dead = true;
  sim.step(DT, {});
  assert.equal(sim.rally.target, a);
});

test('rally-determinism: same seed, same casts, same result', () => {
  const go = () => {
    const sim = quiet({ seed: 21 });
    for (let i = 0; i < 12; i++) sim.spawnEnemy(i % 2 ? 'wolf' : 'root_crawler', sim.player.x + 30 + i * 9, sim.player.y + ((i * 7) % 50) - 25);
    cast(sim);
    run(sim, 8);
    return JSON.stringify([sim.kills, sim.enemies.map((e) => [Math.round(e.hp * 100), Math.round(e.x * 100)])]);
  };
  assert.equal(go(), go());
});
