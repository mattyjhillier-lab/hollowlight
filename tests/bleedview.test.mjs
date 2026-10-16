// E2: readable bleed. Sim only exposes counters (bleedTot, dotBy); the number/tint rules are display-side.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { NumPool, KIND, prioOf } from '../src/gfx/numpool.js';
import { ROLE } from '../src/gfx/palette.js';

const DT = 1 / 60;
function fresh() {
  const sim = new Sim({ data, seed: 3, characterId: 'wren', godMode: true });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
  sim.spawnAcc = [];
  sim.weapons.length = 0;
  return sim;
}

test('E2 bleed counters match the HP actually lost; dotBy credits the source weapon', () => {
  const sim = fresh();
  const e = sim.spawnEnemy('wolf', sim.player.x + 900, sim.player.y);
  e.hp = e.maxHp = 1e6;
  sim._src = 'ghost_wolves';
  sim.bleed(e, 10, 1);
  sim._src = null;
  for (let i = 0; i < 90; i++) sim.step(DT, {});
  assert.ok(e.bleedT <= 0, 'bleed ended');
  assert.ok(Math.abs(e.bleedTot - 10) < 0.5, `bleedTot ${e.bleedTot}`);
  assert.ok(Math.abs((e.maxHp - e.hp) - e.bleedTot) < 1e-6, 'tracked total = HP lost');
  assert.ok(Math.abs(sim.dotBy.ghost_wolves - e.bleedTot) < 1e-6);
});

test('E2 bleed numbers: own kind, first to be dropped, never merged, player lanes still win', () => {
  assert.ok(prioOf(KIND.BLEED, 50) < prioOf(KIND.DMG, 1));
  assert.ok(prioOf(KIND.HURT, 1) > prioOf(KIND.DMG, 1e6));
  const p = new NumPool(3);
  p.spawn(0, 0, 2, 1, KIND.BLEED); p.spawn(0, 0, 2, 1, KIND.BLEED);
  assert.equal(p.alive, 2, 'two bleed ticks on one enemy do not merge into a hit');
  p.spawn(0, 0, 9, 2, KIND.DMG, 0, true);
  p.spawn(0, 0, 9, 3, KIND.DMG, 0, true); // full: a bleed number is evicted, the hit stays
  assert.equal(p.slots.filter((s) => s.on && s.kind === KIND.BLEED).length, 1);
  assert.ok(p.spawn(0, 0, 5, 4, KIND.BLEED) === null || p.alive <= 3, 'cap holds');
  const q = new NumPool(2);
  q.spawn(0, 0, 9, 1, KIND.DMG, 0, true); q.spawn(0, 0, 9, 2, KIND.DMG, 0, true);
  assert.equal(q.spawn(0, 0, 40, 3, KIND.BLEED), null, 'bleed never evicts a real hit');
  const s = new NumPool(40); s.spawn(0, 0, 3, 1, KIND.BLEED);
  assert.equal(s.slots[0].kind, KIND.BLEED);
  assert.ok(s.slots[0].mul < 1, 'smaller than a normal hit');
  s.enabled = false; s.clear();
  assert.equal(s.spawn(0, 0, 3, 1, KIND.BLEED), null, 'respects the damage-numbers setting');
});

test('E2 colour rules: bleed is pale blue (wolf light), not red; tint + number + drip share it', () => {
  const ch = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  for (const c of [ROLE.bleed, ROLE.bleedTint]) { const [r, g, b] = ch(c); assert.ok(b > g && g > r && b > 200, `blue-dominant ${c.toString(16)}`); }
  assert.equal(ROLE.bleed, parseInt(data.weapons.ghost_wolves.color.slice(1), 16), 'matches the wolf colour #9fd8ff');
  const scene = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(!/0xff9a9a/.test(scene), 'the pinkish-red bleed tint is gone');
  assert.ok(/tq === 101\) img\.setTint\(ROLE\.bleedTint\)/.test(scene));
  const nums = readFileSync(new URL('../src/gfx/dmgnums.js', import.meta.url), 'utf8');
  assert.ok(/ROLE\.bleed\]/.test(nums));
});

test('E2 perf caps: drips are capped per tier and absent on Low; a frame spawns at most 6 bleed numbers', async () => {
  const { CAPS } = await import('../src/gfx/quality.js');
  assert.equal(CAPS.low.drips, 0);
  assert.ok(CAPS.med.drips > 0 && CAPS.high.drips >= CAPS.med.drips && CAPS.high.drips <= 40);
  const scene = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(/bleedNums < 6/.test(scene) && /this\.reducedMotion\(\) \? 0 : caps\.drips/.test(scene));
});
