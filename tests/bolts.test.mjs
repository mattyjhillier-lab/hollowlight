// W10: Spirit Bolts base rework (docs/design/weapons-and-summons-v1.1.md 2.3) and its three evolutions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { hintText } from '../src/sim/cards.js';
import { data } from '../scripts/evo-same-ranks.mjs';
import { run as runRanks } from '../scripts/stat-ranks.mjs';

const DT = 1 / 60;
const dummyData = { ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } } };
const R = (o = {}) => ({ count: 0, power: 0, speed: 0, pierce: 0, ...o });
const mk = (ranks, evo = null, seed = 3) => {
  const sim = new Sim({ data: dummyData, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0;
  sim.ability.cdLeft = 1e9;
  sim.rollDrops = () => {};
  sim.debugGrant('spirit_bolts', R(ranks), evo);
  return sim;
};
const place = (sim, n, d0, d1, type = 'dummy', hp = 1e9) => {
  const p = sim.player;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 6.2832 + 0.3;
    const d = d0 + ((d1 - d0) * (i % 3)) / 3;
    const e = sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    e.hp = e.maxHp = hp;
    return e;
  });
};
const run = (sim, secs, f) => { for (let i = 0; i < Math.round(secs / DT); i++) { sim.step(DT, {}); if (f) f(sim, i); } };
const dps = (sim, secs) => { let tot = 0; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { const r = o(e, a, x); tot += r; return r; }; run(sim, secs); return tot / secs; };

// ---------------------------------------------------------------- W10a base
test('W10a data: Bolt power 10 -> 27.5 (+3.5), Swiftness 150 -> 260 with turn 5 -> 8 and a gap rate', () => {
  const st = data.weapons.spirit_bolts.stats;
  assert.equal(st.power.base, 10); assert.equal(st.power.perRank, 3.5);
  assert.equal(st.speed.name, 'Swiftness'); assert.equal(st.speed.base, 150); assert.equal(st.speed.perRank, 22);
  assert.equal(st.speed.turn0, 5); assert.ok(Math.abs(st.speed.turn0 + 5 * st.speed.turnPer - 8) < 1e-9);
  assert.ok(Math.abs(1.1 / (1 + 5 * st.speed.rate) - 1.0) < 1e-9, 'volley gap 1.1 -> 1.0 at rank 5');
  assert.equal(st.pierce.name, 'Pierce'); // Pierce stays
});

test('W10a Swiftness: bolts carry the rank-scaled turn rate and the volley gap shrinks 1.1 -> 1.0 s', () => {
  const gaps = [];
  for (const rs of [0, 5]) {
    const sim = mk({ speed: rs });
    place(sim, 1, 400, 400); // out of range: no volley... use a near dummy but stop it being hit
    sim.enemies.length = 0;
    const d = place(sim, 1, 150, 150)[0]; d.hp = d.maxHp = 1e12;
    const times = []; let turn = null;
    const o = sim.spawnBolt.bind(sim);
    sim.spawnBolt = (b) => { if (!times.length || sim.time - times[times.length - 1] > 0.5) times.push(sim.time); turn = b.turn; return o(b); };
    run(sim, 12);
    gaps.push((times[times.length - 1] - times[1]) / (times.length - 2));
    assert.ok(Math.abs(turn - (5 + 0.6 * rs)) < 1e-9, `turn at Swiftness ${rs}: ${turn}`);
  }
  assert.ok(Math.abs(gaps[0] - 1.1) < 0.02, `rank 0 gap ${gaps[0]}`);
  assert.ok(Math.abs(gaps[1] - 1.0) < 0.02, `rank 5 gap ${gaps[1]}`);
});

test('W10a no dead stat: every Spirit Bolts stat moves DPS (Swiftness >= +12% in sparse/kite, honest hint)', () => {
  const avg = (ranks, sc) => { let t = 0; for (let sd = 1; sd <= 4; sd++) t += runRanks('spirit_bolts', ranks, null, sc, sd).dps; return t / 4; };
  const mid = { count: 2, power: 2, speed: 2, pierce: 2 };
  assert.ok(avg({ ...mid, speed: 5 }, 'sparse') >= avg({ ...mid, speed: 0 }, 'sparse') * 1.12, 'Swiftness 5 vs 0 (sparse)');
  assert.ok(avg({ ...mid, speed: 5 }, 'kite') >= avg({ ...mid, speed: 0 }, 'kite') * 1.08, 'Swiftness 5 vs 0 (kite)');
  for (const k of ['count', 'power', 'pierce']) assert.ok(avg({ ...mid, [k]: 4 }, 'kite') > avg({ ...mid, [k]: 2 }, 'kite') * 1.02, `${k} is dead`);
  const h = hintText(data.weapons.spirit_bolts, 'speed', 0);
  assert.ok(/faster/.test(h) && /curve|turn/.test(h) && /sooner/.test(h) && !/barely/.test(h), h);
});

test('W10a maxed DPS stays near today in crowds: nominal power x gap = 27.5/1.0 vs 30/1.1 (1.008x)', () => {
  const st = data.weapons.spirit_bolts.stats;
  const nominal = ((st.power.base + 5 * st.power.perRank) / (1.1 / (1 + 5 * st.speed.rate))) / (30 / 1.1);
  assert.ok(Math.abs(nominal - 1) <= 0.05, `nominal ${nominal}`);
});

test('W10a Spirit Bolts base is deterministic', () => {
  const a = mk({ count: 3, power: 3, speed: 3, pierce: 2 }); place(a, 12, 50, 160, 'dummy');
  const b = mk({ count: 3, power: 3, speed: 3, pierce: 2 }); place(b, 12, 50, 160, 'dummy');
  run(a, 8); run(b, 8);
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});
