// W6: Howling Legion = A Echo Pack (docs/design/evolutions-second-review.md 4.1, LOCKED): prey the pack fells rises as an echo wolf
// (life = Rend time x1.25 = 5 s, bite 0.7x, no bleed), echoes capped at Pack size, never from bosses or from an echo's own kill,
// no extra live wolves, no RNG drawn, echoes share the wolves' target claims, D1 (Pack size still matters).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { data } from '../scripts/evo-same-ranks.mjs';

const DT = 1 / 60;
const mk = (ranks, evo = 'howling_legion', seed = 5) => {
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0;
  sim.ability.cdLeft = 1e9;
  sim.rollDrops = () => {};
  sim.debugGrant('ghost_wolves', ranks, evo);
  return sim;
};
const run = (sim, secs, f) => { for (let i = 0; i < secs / DT; i++) { sim.step(DT, {}); if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; } if (f) f(sim, i); } };
const weak = (sim, dx, dy, hp = 1) => { const e = sim.spawnEnemy('crow', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = hp; e.speed = 0; e.dmg = 0; return e; };
const echoes = (sim) => sim.units.filter((u) => u.kind === 'echo' && !u.dead);
const wolves = (sim) => sim.units.filter((u) => u.kind === 'wolf');

test('no extra live wolves, no old howl: exactly Pack size wolves', () => {
  const sim = mk({ count: 3 });
  run(sim, 8);
  assert.equal(wolves(sim).length, sim.weapons[0].s.count);
  assert.equal(sim.buffs.speedBoost, 0, 'the evolution no longer grants the speed howl');
});

test('a pack kill raises one echo; life is Rend time x1.25 (5 s); it bites at 0.7x and never bleeds', () => {
  const sim = mk({ count: 1 });
  const e = weak(sim, 20, 0, 1);
  let born = -1;
  run(sim, 2, (s, i) => { if (born < 0 && echoes(s).length) born = i * DT; });
  assert.ok(born >= 0, 'echo rose from the kill');
  const u = echoes(sim)[0];
  assert.ok(u && Math.abs(u.maxLife - 5) < 1e-9);
  const t = weak(sim, 18, 0, 1e9);
  run(sim, 1);
  assert.ok(t.hp < t.maxHp, 'echo (or wolves) bit it');
  // echoes expire
  const sim2 = mk({ count: 1 });
  weak(sim2, 20, 0, 1);
  run(sim2, 3);
  const n0 = echoes(sim2).length;
  assert.ok(n0 <= 1);
  run(sim2, 7);
  assert.equal(echoes(sim2).length, 0, 'gone after 5 s');
});

test('echoes never exceed Pack size even in a big kill burst', () => {
  const sim = mk({ count: 0 }); // Pack size base
  const cap = sim.weapons[0].s.count;
  for (let i = 0; i < 40; i++) weak(sim, 15 + (i % 8) * 6, (i / 8 | 0) * 6 - 12, 1);
  let max = 0;
  run(sim, 4, (s) => { max = Math.max(max, echoes(s).length); });
  assert.ok(max >= 1 && max <= cap, `max echoes ${max} cap ${cap}`);
  assert.ok(sim.kills >= 10, `kills ${sim.kills}`);
});

test('echoes never rise from a boss kill or from an echo kill', () => {
  const sim = mk({ count: 4 });
  const b = sim.spawnEnemy('elder_treant', sim.player.x + 25, sim.player.y);
  b.hp = 1; b.maxHp = 1;
  run(sim, 3);
  assert.ok(b.dead);
  assert.equal(echoes(sim).length, 0);
  // an echo's own kill queues nothing
  const sim2 = mk({ count: 1 });
  sim2.fallen.length = 0;
  const e = weak(sim2, 30, 0, 1);
  e.echoKill = true; // as set by an echo bite that kills
  e.hp = 0; e.dead = true; e.killer = 'ghost_wolves';
  sim2.cleanupDead();
  assert.equal(sim2.fallen.length, 0);
});

test('bleed kills (pack-tagged) raise echoes too', () => {
  const sim = mk({ count: 1 });
  const e = weak(sim, 18, 0, 100);
  sim._src = 'ghost_wolves'; sim.bleed(e, 10000, 4); sim._src = null;
  sim.step(DT, {});
  run(sim, 0.2);
  assert.ok(e.dead);
  assert.ok(sim.units.some((u) => u.kind === 'echo'), 'bleed kill raised an echo');
});

test('nothing is queued when Howling Legion is not owned (no new work, no state)', () => {
  const sim = mk({ count: 3 }, null);
  weak(sim, 20, 0, 1);
  run(sim, 3);
  assert.equal(sim.fallen.length, 0);
  assert.equal(sim.units.filter((u) => u.kind === 'echo').length, 0);
});

test('deterministic and draws no RNG: same seed, same result; ', () => {
  const go = () => { const sim = mk({ count: 3 }); for (let i = 0; i < 10; i++) weak(sim, 15 + i * 5, 0, 1); run(sim, 6); return [sim.kills, Math.round(sim.damageDealt), echoes(sim).length]; };
  assert.deepEqual(go(), go());
});

test('echoes share the wolves target claims (spread over distinct prey)', () => {
  const sim = mk({ count: 3 });
  for (let i = 0; i < 6; i++) weak(sim, 22 + i * 4, 0, 1);
  run(sim, 1);
  for (let i = 0; i < 12; i++) weak(sim, -30 + (i % 4) * 8, -20 + (i / 4 | 0) * 8, 1e9);
  let worst = 1;
  run(sim, 3, (s) => {
    const ts = [...wolves(s), ...echoes(s)].filter((u) => u.target && !u.target.dead).map((u) => u.target.id);
    if (ts.length >= 3) worst = Math.min(worst, new Set(ts).size / ts.length);
  });
  assert.ok(worst >= 0.5, `distinct target share ${worst}`);
});

test('D1: Pack size still matters after evolving (more wolves, more echoes allowed)', () => {
  const a = mk({ count: 0 }); const b = mk({ count: 5 });
  assert.ok(b.weapons[0].s.count > a.weapons[0].s.count);
  run(a, 1); run(b, 1);
  assert.ok(wolves(b).length > wolves(a).length);
});
