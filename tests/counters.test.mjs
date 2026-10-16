import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';

const DT = 1 / 60;
function play(sim, secs) {
  for (let i = 0; i < Math.round(secs / DT); i++) {
    if (sim.state === 'levelup') { const c = sim.offer.gold[0] || sim.offer.cards[0]; sim.pickCard(c.key); }
    sim.step(DT, {});
  }
}
const grant = (ids, evo = {}) => {
  const sim = new Sim({ data, characterId: 'wren', seed: 11, godMode: true });
  for (const id of ids) sim.debugGrant(id, { power: 3, speed: 3, count: 3, size: 3, duration: 3, radius: 3, area: 3 }, evo[id] || null);
  return sim;
};
const sumDmg = (r) => r.weapons.reduce((a, w) => a + w.damage, 0);

test('counters: per-weapon damage never exceeds total and sums close to it', () => {
  const sim = grant(['ghost_wolves', 'holy_orbit', 'raven_flock', 'spirit_bolts']);
  play(sim, 90);
  const r = sim.result();
  assert.ok(r.damageDealt > 0);
  assert.ok(sumDmg(r) <= r.damageDealt + 1e-6);
  assert.ok(sumDmg(r) >= r.damageDealt * 0.99, 'weapons account for ~all damage (rest is unattributed ability/zone)');
  assert.equal(r.weapons.reduce((a, w) => a + w.kills, 0) <= r.kills, true);
});

test('counters: each summon/orbit/chain/bolt weapon is attributed to its own id', () => {
  for (const id of ['ghost_wolves', 'holy_orbit', 'raven_flock', 'spirit_bolts', 'chain_lightning']) {
    const sim = grant([id]);
    play(sim, 60);
    const r = sim.result();
    const w = r.weapons.find((x) => x.id === id);
    assert.ok(w.damage > 0, `${id} dealt attributed damage`);
    assert.ok(w.damage <= r.damageDealt + 1e-6);
    assert.ok(w.kills > 0, `${id} has kills`);
  }
});

test('counters: evolved weapon keeps its id and is attributed', () => {
  const evo = Object.values(data.evolutions).find((e) => e.weapon === 'ghost_wolves');
  const eid = Object.keys(data.evolutions).find((k) => data.evolutions[k] === evo);
  const sim = grant(['ghost_wolves'], { ghost_wolves: eid });
  play(sim, 60);
  const w = sim.result().weapons.find((x) => x.id === 'ghost_wolves');
  assert.equal(w.evo, eid);
  assert.ok(w.damage > 0);
});

test('counters: zero when nothing was dealt', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 3, godMode: true });
  sim.debugGrant('ghost_wolves', {});
  const r = sim.result();
  assert.equal(r.damageDealt, 0);
  assert.ok(r.weapons.every((w) => w.damage === 0 && w.kills === 0));
});

test('counters: bleed damage is attributed to the weapon that applied it', () => {
  const sim = grant(['ghost_wolves']);
  play(sim, 45);
  const r = sim.result();
  assert.ok(Object.keys(sim.dmgBy).every((k) => data.weapons[k]));
  assert.ok(r.weapons.find((x) => x.id === 'ghost_wolves').damage > 0);
});
