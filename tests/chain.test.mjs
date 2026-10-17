// W11: Chain Lightning base rework (docs/design/weapons-and-summons-v1.1.md 2.3) and its three evolutions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { hintText } from '../src/sim/cards.js';
import { data } from '../scripts/evo-same-ranks.mjs';
import { run as runRanks } from '../scripts/stat-ranks.mjs';

const DT = 1 / 60;
const dummyData = { ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } } };
const R = (o = {}) => ({ chains: 0, power: 0, cooldown: 0, area: 0, ...o });
const mk = (ranks, evo = null, seed = 3) => {
  const sim = new Sim({ data: dummyData, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0;
  sim.ability.cdLeft = 1e9;
  sim.rollDrops = () => {};
  sim.debugGrant('chain_lightning', R(ranks), evo);
  return sim;
};
const put = (sim, x, y, hp = 1e9) => { const e = sim.spawnEnemy('dummy', sim.player.x + x, sim.player.y + y); e.hp = e.maxHp = hp; return e; };
const run = (sim, secs, f) => { for (let i = 0; i < Math.round(secs / DT); i++) { sim.step(DT, {}); if (f) f(sim, i); } };
const spy = (sim) => { const log = []; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { log.push({ e, a, t: sim.time }); return o(e, a, x); }; return log; };

// ---------------------------------------------------------------- W11a base
test('W11a data: Power 12 -> 42 (+6), Arc 60 -> 110 (+10) with first strike 1.5x and decay 5% -> 0% (-1%/rank)', () => {
  const st = data.weapons.chain_lightning.stats;
  assert.equal(st.power.base, 12); assert.equal(st.power.perRank, 6);
  assert.equal(st.area.name, 'Arc'); assert.equal(st.area.base, 60); assert.equal(st.area.perRank, 10);
  assert.equal(st.area.first, 1.5);
  assert.ok(Math.abs(st.area.decay0 - 5 * st.area.decayPer) < 1e-9, 'decay reaches 0 at rank 5');
});

test('W11a first strike 1.5x, then each jump loses (5% - 1% per Arc rank) per hop, 0 loss at Arc 5', () => {
  for (const arc of [0, 3, 5]) {
    const sim = mk({ chains: 3, power: 0, area: arc });
    for (let i = 0; i < 5; i++) put(sim, 30 + i * 12, 0);
    const log = spy(sim);
    run(sim, 0.6);
    const hits = log.filter((h) => h.t === log[0].t).map((h) => h.a);
    assert.equal(hits.length, 5, 'chains 3 -> 5 foes');
    const base = hits[0] / 1.5;
    const dec = 0.05 - 0.01 * arc;
    assert.ok(Math.abs(base - 12) < 1e-6 && Math.abs(hits[0] - 18) < 1e-6, `first ${hits[0]}`);
    for (let i = 1; i < 5; i++) assert.ok(Math.abs(hits[i] - base * Math.max(0.5, 1 - dec * i)) < 1e-6, `hop ${i} at Arc ${arc}: ${hits[i]}`);
  }
});

test('W11a no dead stat: Arc moves DPS in sparse/kite when Chains are up, hint is honest, single >= 70 DPS at max', () => {
  const avg = (ranks, sc) => { let t = 0; for (let sd = 1; sd <= 4; sd++) t += runRanks('chain_lightning', ranks, null, sc, sd).dps; return t / 4; };
  const hi = { chains: 4, power: 4, cooldown: 4, area: 0 };
  assert.ok(avg({ ...hi, area: 5 }, 'sparse') >= avg(hi, 'sparse') * 1.10, 'Arc sparse');
  assert.ok(avg({ ...hi, area: 5 }, 'kite') >= avg(hi, 'kite') * 1.10, 'Arc kite');
  assert.ok(avg({ chains: 5, power: 5, cooldown: 5, area: 5 }, 'single') >= 70, 'single DPS at max');
  const h = hintText(data.weapons.chain_lightning, 'area', 0);
  assert.ok(/reaches/.test(h) && /loses less/.test(h) && !/little change/.test(h), h);
});

test('W11a Chain Lightning base is deterministic', () => {
  const a = mk({ chains: 3, power: 3, cooldown: 3, area: 3 }), b = mk({ chains: 3, power: 3, cooldown: 3, area: 3 });
  for (const s of [a, b]) for (let i = 0; i < 12; i++) put(s, 40 + (i % 4) * 20, (i - 6) * 14);
  run(a, 8); run(b, 8);
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});
