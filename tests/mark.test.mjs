// W8b: Mark status (+15% damage taken from all sources for 3 s, refresh only, bosses included) and the total damage-amp cap (x1.75).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim, MARK_AMP, MARK_TIME, AMP_CAP } from '../src/sim/Sim.js';
import { data } from '../scripts/evo-same-ranks.mjs';

const DT = 1 / 60;
const mk = () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 3, godMode: true });
  sim.weapons.length = 0;
  sim.rollDrops = () => {};
  const e = sim.spawnEnemy('wolf', sim.player.x + 500, sim.player.y);
  e.hp = e.maxHp = 1e9; e.speed = 0; e.dmg = 0;
  return { sim, e };
};
const hit = (sim, e, a, src = 'raven_flock') => { sim._src = src; const d = sim.hurt(e, a); sim._src = null; return d; };

test('constants match the locked ruleset', () => {
  assert.equal(MARK_AMP, 0.15);
  assert.equal(MARK_TIME, 3);
  assert.equal(AMP_CAP, 1.75);
});

test('mark: a marked foe takes +15% from every source and an unmarked foe takes exactly the hit', () => {
  const { sim, e } = mk();
  for (const src of ['ghost_wolves', 'holy_orbit', 'spirit_bolts', 'chain_lightning', null]) assert.equal(hit(sim, e, 100, src), 100);
  sim._src = 'raven_flock'; sim.mark(e); sim._src = null;
  for (const src of ['ghost_wolves', 'holy_orbit', 'spirit_bolts', 'chain_lightning', null]) assert.ok(Math.abs(hit(sim, e, 100, src) - 115) < 1e-9, String(src));
});

test('mark applies to damage over time too (a bleed tick is damage from a source)', () => {
  const a = mk(), b = mk();
  for (const { sim, e } of [a, b]) { sim._src = 'ghost_wolves'; sim.bleed(e, 10, 2); sim._src = null; }
  b.sim.mark(b.e);
  for (let i = 0; i < 60; i++) { a.sim.step(DT, {}); b.sim.step(DT, {}); }
  const da = a.e.maxHp - a.e.hp, db = b.e.maxHp - b.e.hp;
  assert.ok(Math.abs(db / da - 1.15) < 0.01, `ratio ${(db / da).toFixed(3)}`);
});

test('mark-no-stack: re-marking only refreshes the 3 s timer, never raises the amp', () => {
  const { sim, e } = mk();
  sim.mark(e);
  for (let i = 0; i < 90; i++) sim.step(DT, {}); // 1.5 s in
  assert.ok(e.markT < 1.6 && e.markT > 1.4);
  sim.mark(e); sim.mark(e); sim.mark(e);
  assert.equal(e.markT, MARK_TIME);
  assert.ok(Math.abs(hit(sim, e, 100) - 115) < 1e-9, 'amp stayed 1.15');
});

test('mark-expires: after 3 s the foe takes normal damage again', () => {
  const { sim, e } = mk();
  sim.mark(e);
  for (let i = 0; i < Math.round(2.9 / DT); i++) sim.step(DT, {});
  assert.ok(e.markT > 0);
  assert.ok(Math.abs(hit(sim, e, 100) - 115) < 1e-9);
  for (let i = 0; i < Math.round(0.3 / DT); i++) sim.step(DT, {});
  assert.equal(e.markT, 0);
  assert.equal(hit(sim, e, 100), 100);
});

test('mark-boss-ok: bosses take Mark', () => {
  const { sim } = mk();
  const boss = sim.spawnEnemy('elder_treant', sim.player.x + 70, sim.player.y);
  boss.hp = boss.maxHp = 1e9;
  sim.mark(boss);
  assert.ok(boss.markT > 0);
  assert.ok(Math.abs(hit(sim, boss, 100) - 115) < 1e-9);
});

test('mark: a dead foe cannot be marked', () => {
  const { sim, e } = mk();
  e.dead = true;
  sim.mark(e);
  assert.equal(e.markT, 0);
});

test('mark-amp-capped: the product of all temporary amps is clamped at x1.75 in the one damage path', () => {
  const { sim, e } = mk();
  sim.mark(e);
  // Rally-like +50% on wolves x Mark 1.15 = 1.725: under the cap, passes through unchanged
  sim.srcAmps.ghost_wolves = 1.5;
  assert.ok(Math.abs(hit(sim, e, 100, 'ghost_wolves') - 172.5) < 1e-9);
  // a stronger source amp would pass 1.75: clamped
  sim.srcAmps.ghost_wolves = 1.6; // 1.84
  assert.equal(hit(sim, e, 100, 'ghost_wolves'), 175);
  sim.srcAmps.ghost_wolves = 5;
  assert.equal(hit(sim, e, 100, 'ghost_wolves'), 175);
  // other sources see only Mark; the source amp does not leak to other weapons
  assert.ok(Math.abs(hit(sim, e, 100, 'spirit_bolts') - 115) < 1e-9);
  // an unmarked foe with a huge source amp is clamped too
  const f = sim.spawnEnemy('wolf', sim.player.x + 300, sim.player.y); f.hp = f.maxHp = 1e9;
  assert.equal(hit(sim, f, 100, 'ghost_wolves'), 175);
});

test('mark counters: ampBonus totals the extra damage, markBy credits the weapon that marked', () => {
  const { sim, e } = mk();
  sim._src = 'raven_flock'; sim.mark(e); sim._src = null;
  hit(sim, e, 100, 'ghost_wolves');
  hit(sim, e, 200, 'spirit_bolts');
  assert.ok(Math.abs(sim.ampBonus - 45) < 1e-9);
  assert.ok(Math.abs(sim.markBy.raven_flock - 45) < 1e-9);
});

test('mark is sim-only state: not on the player, and ordinary hurt without marks is unchanged (0, negative and dead are ignored)', () => {
  const { sim, e } = mk();
  assert.equal(sim.hurt(e, 0), 0);
  assert.equal(sim.hurt(e, -5), 0);
  assert.equal(sim.ampBonus, 0);
  assert.equal(e.markT, 0);
  assert.equal(sim.player.markT, undefined);
});

test('mark: a marked foe dies from less damage (HP is checked after the amp)', () => {
  const { sim, e } = mk();
  e.hp = e.maxHp = 110;
  sim.mark(e);
  hit(sim, e, 100);
  assert.ok(e.dead);
});
