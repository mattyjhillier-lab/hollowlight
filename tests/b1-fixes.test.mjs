// B1: gated bug fixes from docs/design/evolutions-second-review.md section 3 (B3, B4, B5, B7, B8).
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { WEAPON_BEHAVIOURS } from '../src/sim/weapons.js';

const DT = 1 / 60;
function fresh(d = data) {
  const sim = new Sim({ data: d, seed: 3, characterId: 'wren', godMode: true });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
  sim.spawnAcc = [];
  sim.weapons.length = 0;
  return sim;
}
const tough = (sim, x, y) => { const e = sim.spawnEnemy('wolf', x, y); e.hp = e.maxHp = 1e9; return e; };

test('B4 Thunder Judgment smites the nearest enemies first, only on screen (<=180 px)', () => {
  const sim = fresh();
  const w = sim.debugGrant('chain_lightning', { chains: 5 }, 'thunder_judgment'); // full Chains rank = the full smite reach (30)
  const p = sim.player;
  const far = tough(sim, p.x + 250, p.y); // spawned FIRST (oldest): the old code struck it
  const edge = tough(sim, p.x + 200, p.y);
  const near = [];
  for (let i = 0; i < 34; i++) near.push(tough(sim, p.x + 40 + i * 4, p.y)); // 40..172 px
  w.rt.jCd = 0; w.rt.cd = 99;
  WEAPON_BEHAVIOURS.chain_lightning.update(sim, w, DT);
  const hit = (e) => e.hp < e.maxHp;
  assert.ok(!hit(far) && !hit(edge), 'nothing beyond 180 px is struck');
  const cap = data.evolutions.thunder_judgment.tune.cap;
  assert.equal(near.filter(hit).length, cap);
  for (let i = 0; i < cap; i++) assert.ok(hit(near[i]), `near enemy ${i} struck`);
  for (let i = cap; i < near.length; i++) assert.ok(!hit(near[i]), `farther enemy ${i} skipped, not a near one`);
});

test('B5 Static Storm tick floor is applied after the tree cooldown mod', () => {
  const sim = fresh();
  const w = sim.debugGrant('chain_lightning', { cooldown: 5 }, 'static_storm');
  sim.mods.cooldown = 0.2;
  w.rt.cd = 0;
  WEAPON_BEHAVIOURS.chain_lightning.update(sim, w, DT);
  assert.ok(w.rt.cd >= 0.1 - 1e-9, `tick ${w.rt.cd}`);
});

test('B7 Judgement Wheel: two lights touching one enemy in the same frame blast it once', () => {
  const sim = fresh();
  const w = sim.debugGrant('holy_orbit', { count: 2 }, 'judgement_wheel');
  const e = tough(sim, sim.player.x, sim.player.y);
  e.r = 90; // wide enough that every light touches it
  WEAPON_BEHAVIOURS.holy_orbit.update(sim, w, DT);
  const lost = e.maxHp - e.hp;
  const one = w.s.power * sim.dmgMult(w) * data.evolutions.judgement_wheel.tune.dmg;
  assert.ok(Math.abs(lost - one) < 1e-6, `lost ${lost} vs one blast ${one}`);
  sim.time += 0.2; w.rt.units.forEach((u) => { u.disabledT = 0; });
  WEAPON_BEHAVIOURS.holy_orbit.update(sim, w, DT);
  assert.ok(e.maxHp - e.hp > lost + one * 0.9, 'a later blast still lands');
});

test('B3 bleed potency ends with the bleed (a later weak bleed does not inherit a strong one)', () => {
  const sim = fresh();
  const e = tough(sim, sim.player.x + 900, sim.player.y);
  sim.bleed(e, 40, 0.5);
  for (let i = 0; i < 40; i++) sim.step(DT, {});
  assert.ok(e.bleedT <= 0);
  assert.equal(e.bleedDps, 0);
  sim.bleed(e, 2, 1);
  assert.equal(e.bleedDps, 2);
});

test('B8 code fallbacks for tune() equal the data: deleting every tune block changes nothing', () => {
  const run = (d, evoId) => {
    const sim = fresh(d);
    const evo = d.evolutions[evoId];
    sim.debugGrant(evo.weapon, { count: 3, power: 3, speed: 3, duration: 3, radius: 3, area: 3, cooldown: 2, size: 3 }, evoId);
    for (let i = 0; i < 24; i++) tough(sim, sim.player.x + 60 + (i % 8) * 18, sim.player.y + (Math.floor(i / 8) - 1) * 40);
    for (let i = 0; i < 600; i++) sim.step(DT, {});
    return Math.round(sim.damageDealt * 1000);
  };
  for (const id of Object.keys(data.evolutions)) {
    if (!data.evolutions[id].tune) continue;
    const bare = structuredClone(data);
    delete bare.evolutions[id].tune;
    assert.equal(run(bare, id), run(data, id), `${id} fallbacks match data`);
  }
});
