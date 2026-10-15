// W3: Candle Wheel (Elias's ability). Heals only while he stands inside, locks his Holy Orbit lights into the ring, expires.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';

const DT = 1 / 60;
const step = (sim, s, input = {}) => { for (let i = 0; i < Math.round(s / DT); i++) sim.step(DT, input); };
function fresh() {
  const sim = new Sim({ data, seed: 7, characterId: 'elias', godMode: true });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 };
  sim.spawnAcc = [];
  sim.ability.cdLeft = 0;
  return sim;
}

test('elias ability is Candle Wheel with the spec numbers', () => {
  const a = data.characters.elias.ability;
  assert.equal(a.id, 'candle_wheel');
  assert.equal(a.name, 'Candle Wheel');
  assert.equal(a.cooldown, 60);
  assert.equal(a.radius, 80);
  assert.ok(a.heal > 0 && a.heal <= 2.5, 'heal stays modest');
});

test('wheel-heals-only-inside', () => {
  const sim = fresh();
  sim.weapons.length = 0;
  sim.player.hp = 20;
  sim.step(DT, { ability: true });
  const w = sim.zones.find((z) => z.wheel);
  assert.ok(w && w.r === 80);
  const x0 = sim.player.x;
  // inside: rate is the data value, 1.5 HP/s
  const h0 = sim.player.hp;
  step(sim, 2);
  assert.ok(Math.abs(sim.player.hp - h0 - 2 * data.characters.elias.ability.heal) < 0.3, 'heals at the data rate inside');
  // walk outside (speed 76 -> ~2.5s clears 80px + margin), then no heal
  step(sim, 2.5, { x: 1, y: 0 });
  assert.ok(Math.hypot(sim.player.x - w.x, sim.player.y - w.y) > w.r + 5);
  const h1 = sim.player.hp;
  step(sim, 0.5, { x: 1, y: 0 });
  assert.equal(sim.player.hp, h1, 'no heal outside the ring');
  assert.ok(sim.player.x > x0);
});

test('wheel does no direct damage; only the locked lights burn what crosses the ring', () => {
  const sim = fresh();
  sim.weapons.length = 0;
  const e = sim.spawnEnemy('root_crawler', sim.player.x + 20, sim.player.y);
  const hp0 = e.hp;
  sim.step(DT, { ability: true });
  step(sim, 3);
  assert.equal(e.hp, hp0, 'enemy standing inside, no orbs: untouched');
});

test('wheel-locks-orbs', () => {
  const sim = fresh();
  step(sim, 0.5);
  const orbs = () => sim.units.filter((u) => u.kind === 'orb' && !u.dead);
  assert.ok(orbs().length >= 2);
  sim.step(DT, { ability: true });
  const w = sim.zones.find((z) => z.wheel);
  step(sim, 1.5);
  for (const u of orbs()) assert.ok(Math.abs(Math.hypot(u.x - w.x, u.y - w.y) - w.r) < 0.5, 'orb sits on the ring');
  // a locked light still burns an enemy crossing the ring
  const sock = orbs()[0];
  const e = sim.spawnEnemy('root_crawler', sock.x, sock.y);
  const hp0 = e.hp;
  step(sim, 0.3);
  assert.ok(e.hp < hp0 || e.dead, 'ring burns what crosses it');
  // glide: right after planting the orbs are not yet on the ring
  const s2 = fresh();
  step(s2, 0.5);
  s2.step(DT, { ability: true });
  step(s2, 0.1);
  const w2 = s2.zones.find((z) => z.wheel);
  const off = s2.units.filter((u) => u.kind === 'orb').map((u) => Math.abs(Math.hypot(u.x - w2.x, u.y - w2.y) - w2.r));
  assert.ok(Math.max(...off) > 5, 'orbs glide, they do not teleport');
});

test('wheel-expires', () => {
  const sim = fresh();
  sim.step(DT, { ability: true });
  assert.equal(sim.zones.filter((z) => z.wheel).length, 1);
  step(sim, 6.2);
  assert.equal(sim.zones.filter((z) => z.wheel).length, 0, 'wheel gone after the window');
  step(sim, 1);
  const orbs = sim.units.filter((u) => u.kind === 'orb');
  for (const u of orbs) assert.ok(Math.abs(Math.hypot(u.x - sim.player.x, u.y - sim.player.y) - 38) < 2, 'orbs back in orbit');
  assert.ok(sim.ability.cdLeft > 50, 'cooldown running');
});

test('wheel is deterministic and cannot be re-planted on cooldown', () => {
  const a = fresh(); const b = fresh();
  for (const s of [a, b]) { s.step(DT, { ability: true }); step(s, 4, { x: 1, y: 0.3 }); }
  assert.deepEqual(a.zones.map((z) => [z.x, z.y, z.ttl]), b.zones.map((z) => [z.x, z.y, z.ttl]));
  assert.equal(a.zones.filter((z) => z.wheel).length, 1);
  a.step(DT, { ability: true });
  assert.equal(a.zones.filter((z) => z.wheel).length, 1);
});
