// E3: wolf stat 'Bleed time' is now Rend: bleed potency 15% -> 35% of the bite per second (+4%/rank), fixed 4 s, one bleed per enemy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { statValue, hintText, BLEED_TIME } from '../src/sim/cards.js';

const DT = 1 / 60;
const def = data.weapons.ghost_wolves;

test('E3 Rend ranks 0..5 are 15,19,23,27,31,35% (id stays "duration": saves and tree stay valid)', () => {
  assert.equal(def.stats.duration.name, 'Rend');
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((r) => Math.round(statValue(def, 'duration', r) * 100)), [15, 19, 23, 27, 31, 35]);
  assert.equal(BLEED_TIME, 4);
  assert.ok(hintText(def, 'duration', 2).includes('23% → 27%'));
});

test('E3 a bite applies bleed at Rend x bite per second for the fixed 4 s; one instance per enemy, strongest wins, refreshes', () => {
  for (const rank of [0, 3, 5]) {
    const sim = new Sim({ data, seed: 5, characterId: 'wren', godMode: true });
    sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
    sim.spawnAcc = [];
    const w = sim.debugGrant('ghost_wolves', { duration: rank });
    const e = sim.spawnEnemy('wolf', sim.player.x + 30, sim.player.y);
    e.hp = e.maxHp = 1e9;
    let seen = 0;
    for (let i = 0; i < 300 && !seen; i++) { sim.step(DT, {}); if (e.bleedT > 0) seen = e.bleedDps; }
    assert.ok(seen > 0, 'wolves bled it');
    const bite = w.s.power * sim.dmgMult(w);
    assert.ok(Math.abs(seen - bite * statValue(def, 'duration', rank)) < 1e-6, `rank ${rank}: ${seen}`);
    assert.ok(e.bleedT <= 4 + 1e-9 && e.bleedT > 3.5);
    sim.bleed(e, seen / 2, 10); // weaker, longer: potency stays, time refreshes to the longer
    assert.equal(e.bleedDps, seen);
    assert.equal(e.bleedT, 10);
  }
});

test('E3 / T3a no tree node buys bleed seconds any more: Deep Bite and Red Thread are Bleed potency nodes (status, shared cap)', () => {
  const nodes = Object.fromEntries(data.tree.nodes.map((n) => [n.id, n]));
  for (const id of ['wf_bleed', 'wf_rend']) {
    assert.deepEqual(nodes[id].effects, [{ status: 'bleed', pct: 3 }], id);
    assert.ok(/Bleed/.test(nodes[id].desc) && !/\bs longer|0\.5s/.test(nodes[id].desc), nodes[id].desc);
  }
  for (const n of data.tree.nodes) for (const e of n.effects || []) assert.ok(!(e.stat === 'duration' && e.add >= 0.5), `${n.id} must not buy bleed seconds`);
});
