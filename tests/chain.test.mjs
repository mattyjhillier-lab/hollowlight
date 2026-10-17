// W11: Chain Lightning base rework (docs/design/weapons-and-summons-v1.1.md 2.3) and its three evolutions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { hintText } from '../src/sim/cards.js';
import { data, measureRatios } from '../scripts/evo-same-ranks.mjs';
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

// ---------------------------------------------------------------- W11b Thunder Judgment
const smites = (sim, secs) => { // returns [{t, ids:[]}] of each sky volley, using the pillar fx (one per struck foe)
  const out = []; const o = sim.addFx.bind(sim);
  sim.addFx = (f) => { if (f.pillar) { const e = sim.enemies.find((q) => q.x === f.pts[1].x && q.y === f.pts[1].y); const last = out[out.length - 1]; if (last && last.t === sim.time) last.ids.push(e.id); else out.push({ t: sim.time, ids: [e.id] }); } return o(f); };
  run(sim, secs); return out;
};
const crowd = (sim, n) => { const out = []; for (let i = 0; i < n; i++) { const a = i * 2.399963, d = 25 + (i * 151) % 330; out.push(put(sim, Math.cos(a) * d, Math.sin(a) * d)); } return out; };

test('W11b Thunder Judgment data: every 3 s, cap 30, 9 jumps, smite in the 0.65-0.8x band, recipe Chains + Power', () => {
  const e = data.evolutions.thunder_judgment;
  assert.equal(e.tune.cd, 3); assert.equal(e.tune.cap, 30); assert.equal(e.tune.chains, 9);
  assert.ok(e.tune.dmg >= 0.65 && e.tune.dmg <= 0.8, `dmg ${e.tune.dmg}`);
  assert.deepEqual([...e.pair].sort(), ['chains', 'power']);
});

test('W11b smite: nearest enemies are always struck, never beyond 180 px, never outside the 640x360 view, max 30', () => {
  const sim = mk({ chains: 5, power: 5 }, 'thunder_judgment');
  const all = crowd(sim, 90);
  const v = smites(sim, 7);
  assert.ok(v.length >= 2, 'volleys');
  const p = sim.player;
  for (const { ids } of v) {
    assert.ok(ids.length <= 30);
    const struck = new Set(ids);
    for (const id of ids) {
      const e = all.find((q) => q.id === id);
      assert.ok(Math.hypot(e.x - p.x, e.y - p.y) <= 180 + 1e-9, 'inside radius 180');
      assert.ok(Math.abs(e.x - p.x) <= 320 && Math.abs(e.y - p.y) <= 180, 'inside the view rectangle');
    }
    const inR = all.filter((q) => Math.hypot(q.x - p.x, q.y - p.y) <= 180).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    assert.equal(ids.length, Math.min(30, inR.length));
    for (const q of inR.slice(0, ids.length)) assert.ok(struck.has(q.id), 'a nearer foe was skipped');
  }
});

test('W11b smite damage is dmg x power x 0.72 per foe, volley every 3 s, and a 0.3 s tell comes first', () => {
  const sim = mk({ chains: 5, power: 5 }, 'thunder_judgment');
  const e = put(sim, 100, 0); // the only foe
  const tells = []; const o = sim.addFx.bind(sim);
  sim.addFx = (f) => { if (f.kind === 'judgetell') tells.push(sim.time); return o(f); };
  const vol = smites(sim, 8);
  assert.ok(vol.length >= 2);
  assert.ok(Math.abs(vol[1].t - vol[0].t - 3) < 0.05, 'every 3 s');
  assert.ok(tells.length >= 2 && Math.abs(vol[0].t - tells[0] - 0.3) < 0.04, `tell ${tells[0]} -> ${vol[0].t}`);
  const sim2 = mk({ chains: 5, power: 5 }, 'thunder_judgment'); const e2 = put(sim2, 100, 0);
  const log = spy(sim2); run(sim2, 1.6);
  // volley at t=1.5: smite + the chain's first strike (1.5x) may land the same frame; the smite is the one equal to power x 0.72
  const w = sim2.weapons[0]; const pw = w.s.power * sim2.dmgMult(w);
  assert.ok(log.some((h) => Math.abs(h.a - pw * 0.72) < 1e-6), 'smite damage');
  assert.ok(e && e2);
});

test('W11b Thunder Judgment keeps the normal chain with 9 jumps and is deterministic', () => {
  const mkc = () => { const s = mk({ chains: 0, power: 5 }, 'thunder_judgment'); for (let i = 0; i < 12; i++) put(s, 30 + i * 12, 0); return s; };
  const a = mkc(), b = mkc();
  const la = spy(a); run(a, 0.6); run(b, 0.6);
  assert.equal(la.length, 9, 'Chains 9 = nine foes struck (same count rule as the base: Chains 2 = two foes); smite not yet');
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});

test('W11b cap at pick: Thunder Judgment <= 3.0x its base (pair 5 + others rank 1) in single, stream10 and stream40; single >= 1.2x', () => {
  const res = measureRatios({ secs: 10, seeds: [1], modes: ['pair'], only: 'thunder_judgment' });
  for (const [sc, c] of Object.entries(res.thunder_judgment.pair)) assert.ok(c.ratio <= 3.0, `${sc}: ${c.ratio.toFixed(2)}x at pick`);
  assert.ok(res.thunder_judgment.pair.single.ratio >= 1.2, `single ${res.thunder_judgment.pair.single.ratio}`);
});
