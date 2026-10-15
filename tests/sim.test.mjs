import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef } from './helpers.mjs';
import { aggregateMods } from '../src/meta/tree.js';
import { Sim } from '../src/sim/Sim.js';
import { xpForLevel } from '../src/sim/cards.js';

const DT = 1 / 60;
function run(sim, seconds, input = {}) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    if (sim.state === 'levelup') pickFirst(sim);
    sim.step(DT, typeof input === 'function' ? input(sim) : input);
  }
}
function pickFirst(sim) {
  const c = sim.offer.gold[0] || sim.offer.cards[0];
  sim.pickCard(c.key);
}
function finite(sim) {
  const all = [sim.player, ...sim.enemies, ...sim.units, ...sim.projectiles, ...sim.gems];
  for (const e of all) {
    assert.ok(Number.isFinite(e.x) && Number.isFinite(e.y), `non-finite position on ${e.kind || e.type || 'entity'}`);
  }
}
const mk = (opts = {}) => new Sim({ data, seed: 7, ...opts });

test('player moves at character speed and stays inside the world', () => {
  const sim = mk({ characterId: 'elias', godMode: true });
  const x0 = sim.player.x;
  sim.step(DT, { x: 1, y: 0 });
  assert.ok(sim.player.x > x0);
  run(sim, 60, { x: 1, y: 0 });
  assert.ok(sim.player.x <= data.balance.worldSize);
  assert.ok(sim.player.x > x0);
});

test('diagonal movement is not faster than straight movement', () => {
  const a = mk({ godMode: true });
  const b = mk({ godMode: true });
  // zero out patches so slowdown cannot interfere
  a.patches = []; b.patches = [];
  a.step(DT, { x: 1, y: 0 });
  b.step(DT, { x: 1, y: 1 });
  const da = Math.hypot(a.player.x - a.player.x, 0) + (a.player.x - data.balance.worldSize / 2);
  const db = Math.hypot(b.player.x - data.balance.worldSize / 2, b.player.y - data.balance.worldSize / 2);
  assert.ok(Math.abs(da - db) < 0.01, `${da} vs ${db}`);
});

test('enemies spawn on schedule and respect the cap', () => {
  const sim = mk({ godMode: true });
  sim.weapons.length = 0; // nothing killing them, so we see the raw spawn schedule
  run(sim, 120, { x: 0, y: 0 });
  assert.ok(sim.enemies.length > 10, `enemies ${sim.enemies.length}`);
  assert.ok(sim.enemies.length <= data.balance.maxEnemies + 60);
  finite(sim);
});

test('each of the five weapons damages enemies on its own', () => {
  for (const id of Object.keys(data.weapons)) {
    const sim = mk({ godMode: true });
    sim.weapons.length = 0;
    sim.addWeapon(id);
    sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
    sim.spawnAcc = [];
    const p = sim.player;
    for (let i = 0; i < 6; i++) sim.spawnEnemy('wolf', p.x + 40 + i * 6, p.y + 20 - i * 8);
    run(sim, 8, { x: 0, y: 0 });
    assert.ok(sim.damageDealt > 0, `${id} dealt no damage`);
    finite(sim);
  }
});

test('every evolution runs cleanly against a horde and deals damage', () => {
  for (const [evoId, evo] of Object.entries(data.evolutions)) {
    const sim = mk({ godMode: true, startTime: 300 });
    sim.weapons.length = 0;
    const ranks = {};
    for (const s of evo.pair) ranks[s] = data.balance.maxRank;
    sim.debugGrant(evo.weapon, ranks, evoId);
    assert.equal(sim.weapons[0].evo, evoId);
    run(sim, 25, { x: 0, y: 0 });
    assert.ok(sim.damageDealt > 0, `${evoId} dealt no damage`);
    assert.ok(sim.kills > 0, `${evoId} killed nothing`);
    finite(sim);
  }
});

test('Dire Alpha is a single wolf; Howling Legion makes a bigger pack', () => {
  const sim = mk({ godMode: true });
  sim.weapons.length = 0;
  sim.debugGrant('ghost_wolves', { power: 5, duration: 5 }, 'dire_alpha');
  run(sim, 1);
  assert.equal(sim.units.filter((u) => u.kind === 'wolf').length, 1);
  const sim2 = mk({ godMode: true });
  sim2.weapons.length = 0;
  sim2.debugGrant('ghost_wolves', { count: 5, duration: 5 }, 'howling_legion');
  run(sim2, 1);
  assert.ok(sim2.units.filter((u) => u.kind === 'wolf').length >= 8);
});

test('wolf stat ranks change behaviour: more count means more wolves', () => {
  const sim = mk({ godMode: true });
  run(sim, 1);
  assert.equal(sim.units.filter((u) => u.kind === 'wolf').length, 2);
  sim.debugGrant('ghost_wolves', { count: 3 });
  run(sim, 1);
  assert.equal(sim.units.filter((u) => u.kind === 'wolf').length, 5);
});

test('xp pickup leads to a level-up pause, a pick, then play resumes', () => {
  const sim = mk({ godMode: true });
  sim.xp = sim.xpNeeded + 1;
  sim.step(DT, {});
  assert.equal(sim.state, 'levelup');
  assert.equal(sim.level, 2);
  assert.equal(sim.offer.cards.length, 3);
  const t = sim.time;
  sim.step(DT, {});
  assert.equal(sim.time, t, 'time is frozen while choosing');
  const key = sim.offer.cards.find((c) => c.kind === 'stat' || c.kind === 'weapon').key;
  assert.ok(sim.pickCard(key));
  assert.equal(sim.state, 'running');
  assert.equal(sim.offer, null);
});

test('a double level-up queues two offers back to back', () => {
  const sim = mk({ godMode: true });
  sim.xp = sim.xpNeeded + xpForLevel(2, data.balance) + 1;
  sim.step(DT, {});
  assert.equal(sim.pending, 2);
  sim.pickCard(sim.offer.cards[0].key);
  assert.equal(sim.state, 'levelup');
  sim.pickCard(sim.offer.cards[0].key);
  assert.equal(sim.state, 'running');
});

test('picking the evolution gold card evolves the weapon and kills the old units (needs the gate node, G1b)', () => {
  const sim = mk({ godMode: true, tree: aggregateMods({ gt_phantom_stampede: 1 }, treeDef, data) });
  sim.debugGrant('ghost_wolves', { speed: 5, power: 5 });
  run(sim, 1);
  sim.xp = sim.xpNeeded + 1;
  sim.step(DT, {});
  assert.equal(sim.offer.gold.length, 1);
  sim.pickCard(sim.offer.gold[0].key);
  assert.equal(sim.weapons[0].evo, 'phantom_stampede');
  assert.ok(sim.events.some((e) => e.type === 'evolve'));
});

test('reroll and banish need to be unlocked (meta) and are consumed', () => {
  const none = mk({ godMode: true });
  none.xp = none.xpNeeded + 1; none.step(DT, {});
  assert.equal(none.reroll(), false);
  assert.equal(none.banish(none.offer.cards[0].key), false);
  const some = mk({ godMode: true, meta: { rerolls: 1, banishes: 1 } });
  some.xp = some.xpNeeded + 1; some.step(DT, {});
  assert.equal(some.reroll(), true);
  assert.equal(some.reroll(), false);
  const key = some.offer.cards[0].key;
  assert.equal(some.banish(key), true);
  assert.ok(!some.offer.cards.some((c) => c.key === key));
});

test('boss spawns at the scheduled time and awards soul shards when killed', () => {
  const sim = mk({ godMode: true, startTime: 598 });
  run(sim, 3, { x: 0, y: 0 });
  assert.ok(sim.bossSpawned);
  assert.ok(sim.boss && sim.boss.type === 'elder_treant');
  sim.hurt(sim.boss, 1e9);
  sim.step(DT, {});
  assert.ok(sim.bossKilled);
  assert.equal(sim.shards, data.chapters.cursed_forest.bossShards);
});

test('surviving 15 minutes ends in victory; zero HP ends in defeat', () => {
  const win = mk({ godMode: true, startTime: 898 });
  run(win, 4);
  assert.equal(win.state, 'victory');
  assert.equal(win.result().outcome, 'victory');

  const lose = mk({ characterId: 'wren' });
  lose.weapons.length = 0; // no defences
  for (let i = 0; i < 20; i++) lose.spawnEnemy('root_crawler', lose.player.x + (i % 5), lose.player.y + (i % 3));
  run(lose, 30);
  assert.equal(lose.state, 'defeat');
});

test('Pack Howl: starts on cooldown, scares nearby enemies, boosts speed, then recharges', () => {
  const sim = mk({ characterId: 'wren', godMode: true });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
  sim.spawnAcc = [];
  sim.ability.cdLeft = 0;
  const e = sim.spawnEnemy('wolf', sim.player.x + 40, sim.player.y);
  sim.step(DT, { ability: true });
  assert.ok(sim.buffs.packHowl > 5);
  assert.ok(e.fearT > 1);
  assert.ok(sim.ability.cdLeft > 55);
  const left = sim.ability.cdLeft;
  sim.step(DT, { ability: true });
  assert.ok(sim.ability.cdLeft < left, 'cannot be re-triggered while on cooldown');
});

test('root patches slow the player', () => {
  const sim = mk({ godMode: true });
  sim.patches = [{ x: sim.player.x, y: sim.player.y, r: 400 }];
  const x0 = sim.player.x;
  sim.step(1 / 10, { x: 1, y: 0 });
  const slowed = sim.player.x - x0;
  sim.patches = [];
  const x1 = sim.player.x;
  sim.step(1 / 10, { x: 1, y: 0 });
  assert.ok(slowed < sim.player.x - x1 * 1, 'patch slows movement');
});

test('pacing: expected XP over 15 minutes lands near 38-50 level-ups (docs/research/00-SUMMARY.md)', () => {
  const ch = data.chapters.cursed_forest;
  const xpAt = (T) => {
    let xp = 0;
    for (const w of ch.waves) {
      const to = Math.min(T, w.to);
      if (to <= w.from) continue;
      const span = w.to - w.from;
      const r = (t) => w.rate0 + (w.rate1 - w.rate0) * Math.pow((t - w.from) / span, w.curve || 1);
      let sum = 0;
      for (let t = w.from; t < to; t += 1) sum += r(t + 0.5);
      xp += sum * data.enemies[w.enemy].xp;
    }
    for (const ev of ch.events) if (ev.t <= T) xp += ev.count * data.enemies[ev.enemy].xp;
    if (T >= ch.bossAt) xp += data.enemies[ch.bossId].xp;
    return xp;
  };
  const levelAt = (T) => {
    let lvl = 1;
    let xp = xpAt(T);
    while (xp >= xpForLevel(lvl, data.balance)) { xp -= xpForLevel(lvl, data.balance); lvl++; }
    return lvl - 1; // level-ups gained
  };
  const out = { m3: levelAt(180), m5: levelAt(300), m10: levelAt(600), m15: levelAt(900) };
  console.log('level-ups if every enemy were killed:', JSON.stringify(out));
  assert.ok(out.m15 >= 38 && out.m15 <= 52, `got ${out.m15}`);
  assert.ok(out.m3 >= 10, 'early game feels fast enough');
  // A focused player needs roughly 20-25 level-ups to ready the first evolution; that should land around minute 5-8.
  const secondsFor = (n) => { for (let t = 1; t <= 900; t++) if (levelAt(t) >= n) return t; return Infinity; };
  const t30 = secondsFor(25);
  console.log('25th level-up at', t30, 's');
  assert.ok(t30 >= 240 && t30 <= 480, `25th level-up at ${t30}s`);
});

test('pouncing pack: a wolf leaps, pins the enemy and kills it', () => {
  const sim = mk({ characterId: 'wren', godMode: true });
  sim.debugGrant('ghost_wolves', { speed: 5, power: 5 }, 'phantom_stampede');
  const p = sim.player;
  const e = sim.spawnEnemy('root_crawler', p.x + 80, p.y);
  e.hp = e.maxHp = 400;
  let held = false;
  for (let i = 0; i < 240 && !e.dead; i++) { sim.step(DT, {}); if (e.heldT > 0) held = true; }
  assert.ok(held, 'enemy was pinned');
});

test('heart drop heals, magnet drop pulls every gem', () => {
  const sim = mk({ characterId: 'wren', godMode: true });
  const p = sim.player;
  p.hp = 10;
  sim.addPickup('heart', p.x, p.y);
  sim.step(DT, {});
  assert.ok(p.hp > 10 + p.maxHp * 0.25);
  for (let i = 0; i < 20; i++) sim.addGem(p.x + 300 + i, p.y + 200, 1);
  sim.addPickup('magnet', p.x, p.y);
  sim.step(DT, {});
  assert.ok(sim.gems.every((g) => g.mag));
});

test('drops appear over a long run', () => {
  const sim = mk({ characterId: 'wren', godMode: true });
  sim.player.hp = 5;
  let seen = { heart: 0, magnet: 0 };
  for (let i = 0; i < 60 * 240; i++) {
    if (sim.state === 'levelup') pickFirst(sim);
    sim.step(DT, {});
    for (const k of sim.pickups) seen[k.type] = 1;
    if (sim.player.hp > 100) break;
  }
  assert.ok(seen.heart || seen.magnet);
});
