// W7c The Alpha (id dire_alpha): one great wolf (primary bite + lighter cleave + bleed) with two ghost shades; Pack size makes it bigger and stronger.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/Sim.js';

const L = (n) => JSON.parse(readFileSync(new URL(`../src/data/${n}.json`, import.meta.url), 'utf8'));
const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, L(n)]));
data.enemies.dummy = { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 };
data.chapters = { cursed_forest: { ...data.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } };
const DT = 1 / 60;
const mk = (ranks, seed = 1) => {
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('ghost_wolves', ranks, 'dire_alpha');
  return sim;
};
const run = (sim, secs) => { for (let i = 0; i < secs / DT; i++) sim.step(DT, {}); };
const alphaOf = (sim) => sim.units.find((u) => u.kind === 'wolf' && !u.shade);
const MAXR = { count: 5, power: 5, speed: 5, duration: 5 };

test('data: The Alpha card text, name and tune keys', () => {
  const e = data.evolutions.dire_alpha;
  assert.equal(e.name, 'The Alpha');
  assert.match(e.desc, /One great wolf: a crushing bite that bleeds all beside it/);
  for (const k of ['dmg', 'side', 'shades', 'shade', 'packPow', 'biteGap', 'cleave', 'cleavePer', 'sizePer']) assert.ok(Number.isFinite(e.tune[k]), k);
  assert.ok(e.tune.dmg > e.tune.side, 'primary bite stronger than the cleave');
});

test('primary bite hits the prey; others in reach take the lighter cleave and bleed (ratio = dmg / side)', () => {
  const t = data.evolutions.dire_alpha.tune;
  const shades0 = t.shades; t.shades = 0; // alpha alone: shades would also bite the neighbour
  const sim = mk(MAXR);
  const w = sim.weapons[0];
  const prey = sim.spawnEnemy('dummy', sim.player.x + 22, sim.player.y);
  const side = sim.spawnEnemy('dummy', sim.player.x + 22, sim.player.y + 14);
  const hits = new Map();
  const orig = sim.hurt.bind(sim);
  sim.hurt = (e, a, o = {}) => { if (!o.silent && (e === prey || e === side)) { const v = hits.get(e) || []; v.push(a); hits.set(e, v); } return orig(e, a, o); };
  run(sim, 3);
  t.shades = shades0;
  assert.ok(alphaOf(sim), 'alpha exists');
  const big = Math.max(...hits.get(prey) || [0]), small = Math.max(...hits.get(side) || [0]);
  assert.ok(big > 0 && small > 0, `both hit: ${big} ${small}`);
  assert.ok(Math.abs(big / small - t.dmg / t.side) < 0.6, `ratio ${(big / small).toFixed(2)} vs ${(t.dmg / t.side).toFixed(2)}`);
  assert.ok(side.bleedT > 0 || prey.bleedT > 0, 'bleed applied');
  assert.ok(w.evo === 'dire_alpha');
});

test('Pack size makes the alpha BIGGER (+1 px per rank), widens the sweep, and strengthens the bite', () => {
  const rs = [0, 5].map((c) => { const sim = mk({ ...MAXR, count: c }); run(sim, 0.5); return { r: alphaOf(sim).r, sim }; });
  assert.equal(rs[0].r, 11); assert.equal(rs[1].r, 16);
  // sweep: a foe just outside the rank-0 reach is only cleaved at rank 5 (reach 22 vs 32 + foe radius)
  const res = [0, 5].map((c) => {
    const sim = mk({ ...MAXR, count: c });
    const prey = sim.spawnEnemy('dummy', sim.player.x + 20, sim.player.y);
    const far = sim.spawnEnemy('dummy', sim.player.x + 20, sim.player.y + 8 + 22 + 6);
    prey.hp = prey.maxHp = 1e9; far.hp = far.maxHp = 1e9;
    run(sim, 3);
    return { far: far.maxHp - far.hp, prey: prey.maxHp - prey.hp };
  });
  assert.ok(res[1].far > res[0].far, `rank 5 sweep reaches farther: ${res[0].far} vs ${res[1].far}`);
  assert.ok(res[1].prey > res[0].prey * 1.5, `a bigger pack bites harder: ${res[0].prey} vs ${res[1].prey}`);
});

test('no dead stat after evolving: Pack size, Bite power, Wolf speed and Rend all change the damage', () => {
  const dmg = (ranks) => { const sim = mk(ranks); const e = sim.spawnEnemy('dummy', sim.player.x + 20, sim.player.y); run(sim, 6); return e.maxHp - e.hp; };
  const base = dmg({ count: 2, power: 2, speed: 2, duration: 2 });
  for (const k of ['count', 'power', 'speed', 'duration']) assert.ok(dmg({ count: 2, power: 2, speed: 2, duration: 2, [k]: 5 }) > base * 1.02, `${k} is live`);
});

test('two ghost shades hunt other prey than the alpha (claim set) and are small', () => {
  const sim = mk(MAXR);
  for (let i = 0; i < 6; i++) sim.spawnEnemy('dummy', sim.player.x + 40 * Math.cos(i), sim.player.y + 40 * Math.sin(i));
  run(sim, 2);
  const wolves = sim.units.filter((u) => u.kind === 'wolf');
  assert.equal(wolves.length, 3);
  assert.equal(wolves.filter((u) => u.shade).length, 2);
  for (const u of wolves.filter((x) => x.shade)) assert.equal(u.r, 4);
  const ids = wolves.filter((u) => u.target).map((u) => u.target.id);
  assert.equal(new Set(ids).size, ids.length, 'distinct targets');
});

test('cleave bleed stays small: bleed share of wolf damage <= 35% in a crowd, <= 10% on a boss', () => {
  const share = (setup, secs) => {
    const sim = mk(MAXR); setup(sim);
    let eff = 0, bl = 0;
    const orig = sim.hurt.bind(sim);
    sim.hurt = (e, a, o = {}) => { if (!e.dead && a > 0) { const v = Math.min(a, Math.max(0, e.hp)); eff += v; if (o.silent) bl += v; } return orig(e, a, o); };
    run(sim, secs);
    return bl / Math.max(1, eff);
  };
  const crowd = share((sim) => { for (let i = 0; i < 20; i++) { const e = sim.spawnEnemy('wolf', sim.player.x + 30 * Math.cos(i), sim.player.y + 30 * Math.sin(i)); e.hp = e.maxHp = 400; } }, 8);
  assert.ok(crowd <= 0.35, `crowd bleed share ${crowd}`);
  const boss = share((sim) => { sim.time = 600; sim.spawnEnemy('elder_treant', sim.player.x + 40, sim.player.y); }, 20);
  assert.ok(boss <= 0.1, `boss bleed share ${boss}`);
});

test('boss damage is never below the base pack at the same ranks, and runs are deterministic', () => {
  const bossDmg = (evo) => {
    const sim = new Sim({ data, characterId: 'wren', seed: 4, godMode: true });
    sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
    sim.debugGrant('ghost_wolves', MAXR, evo);
    sim.time = 600;
    const b = sim.spawnEnemy('elder_treant', sim.player.x + 40, sim.player.y); b.hp = b.maxHp = 1e9;
    run(sim, 20);
    return b.maxHp - b.hp;
  };
  const a = bossDmg('dire_alpha');
  assert.ok(a >= bossDmg(null) * 0.98, 'boss damage >= base');
  assert.equal(bossDmg('dire_alpha'), a);
});
