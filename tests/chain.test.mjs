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
test('W11a data: Power 13.2 -> 46.2 (+6.6, RT1 2026-10-25), Arc 60 -> 110 (+10) with first strike 1.5x and decay 5% -> 0% (-1%/rank)', () => {
  const st = data.weapons.chain_lightning.stats;
  assert.equal(st.power.base, 13.2); assert.equal(st.power.perRank, 6.6);
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
    assert.ok(Math.abs(base - 13.2) < 1e-6 && Math.abs(hits[0] - 19.8) < 1e-6, `first ${hits[0]}`);
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
  const z = mk({ chains: 0, power: 5 }, 'thunder_judgment'); for (let i = 0; i < 12; i++) put(z, 30 + i * 12, 0);
  const lz = spy(z); run(z, 0.6);
  assert.equal(lz.length, 4, 'Chains rank 0: the base 2 jumps + the 2 Judgment adds (flow v2: every rank counts)');
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

test('W11b Thunder Judgment keeps the normal chain, 2 jumps longer (9 at full Chains), and is deterministic', () => {
  const mkc = () => { const s = mk({ chains: 5, power: 5 }, 'thunder_judgment'); for (let i = 0; i < 12; i++) put(s, 30 + i * 12, 0); return s; };
  const a = mkc(), b = mkc();
  const la = spy(a); run(a, 0.6); run(b, 0.6);
  assert.equal(la.length, 9, 'Chains 9 = nine foes struck (same count rule as the base: Chains 2 = two foes); smite not yet');
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});

test('W11b cap at pick: Thunder Judgment <= 3.0x its base (pair 5 + others rank 1) in single, stream10 and stream40; single >= 1.1x', () => {
  const res = measureRatios({ secs: 10, seeds: [1], modes: ['pair'], only: 'thunder_judgment' });
  for (const [sc, c] of Object.entries(res.thunder_judgment.pair)) assert.ok(c.ratio <= 3.0, `${sc}: ${c.ratio.toFixed(2)}x at pick`);
  assert.ok(res.thunder_judgment.pair.single.ratio >= 1.1, `single ${res.thunder_judgment.pair.single.ratio}`);
});

// ---------------------------------------------------------------- W11c Static Storm
const ticks = (sim, secs) => { // [{t, ids}] one entry per tick (field bolts in the same frame)
  const out = []; const o = sim.addFx.bind(sim);
  sim.addFx = (f) => { if (f.field) { const e = sim.enemies.find((q) => Math.abs(q.x - f.pts[1].x) < 1e-9 && Math.abs(q.y - f.pts[1].y) < 1e-9); const l = out[out.length - 1]; if (l && l.t === sim.time) l.ids.push(e.id); else out.push({ t: sim.time, ids: [e.id] }); } return o(f); };
  run(sim, secs); return out;
};

test('W11c Static Storm data: 3 + floor(Chains/2) strikes (cap 5), recipe Cooldown + Arc, smite 0.42-0.5x, no-repeat gap 0.5 s', () => {
  const e = data.evolutions.static_storm;
  assert.equal(e.tune.strikes, 3); assert.equal(e.tune.cap, 5); assert.equal(e.tune.gap, 0.5);
  assert.ok(e.tune.dmg >= 0.42 && e.tune.dmg <= 0.5, `dmg ${e.tune.dmg}`);
  assert.deepEqual([...e.pair].sort(), ['area', 'cooldown']);
});

test('W11c Chains matter after evolving: strikes per tick = min(5, 3 + floor(Chains/2)) for Chains 0..5 (the card stat keeps working)', () => {
  const want = (c) => Math.min(5, 3 + Math.floor(c / 2)); // chains stat = 2 + rank
  for (let rk = 0; rk <= 5; rk++) {
    const sim = mk({ chains: rk, cooldown: 5, area: 5 }, 'static_storm');
    crowd(sim, 40);
    for (const e of sim.enemies) { e.x = sim.player.x + (e.x - sim.player.x) * 0.3; e.y = sim.player.y + (e.y - sim.player.y) * 0.3; } // inside the field
    const t = ticks(sim, 1);
    assert.ok(t.length > 0);
    for (const k of t) assert.equal(k.ids.length, want(2 + rk), `Chains rank ${rk}`);
  }
});

test('W11c field radius = 110 + 0.8 x Arc: nothing struck outside it; a tick never strikes the same foe twice while fresh foes are in range', () => {
  const sim = mk({ chains: 5, cooldown: 5, area: 5 }, 'static_storm');
  const all = crowd(sim, 60);
  const R2 = 110 + 0.8 * 110;
  const tk = ticks(sim, 6);
  const p = sim.player;
  const seen = new Map();
  for (const { t, ids } of tk) {
    assert.equal(new Set(ids).size, ids.length, 'duplicate in one tick');
    for (const id of ids) {
      const e = all.find((q) => q.id === id);
      assert.ok(Math.hypot(e.x - p.x, e.y - p.y) < R2 + 1e-9, 'outside the field');
      if (seen.has(id)) { const inField = all.filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < R2).length; assert.ok(inField < 8 || t - seen.get(id) >= 0.5 - 1e-9, `repeat after ${(t - seen.get(id)).toFixed(2)} s with ${inField} in range`); }
      seen.set(id, t);
    }
  }
});

test('W11c a lone foe is still struck (stale fallback) and the tick never runs faster than 0.1 s even with extreme tree cooldown mods', () => {
  const sim = mk({ chains: 5, cooldown: 5, area: 5 }, 'static_storm');
  sim.mods.cooldown = 0.05; // far past the tree soft cap
  put(sim, 60, 0);
  const tk = ticks(sim, 3);
  assert.ok(tk.length > 5, 'lone foe is struck');
  for (let i = 1; i < tk.length; i++) assert.ok(tk[i].t - tk[i - 1].t >= 0.1 - 1e-9, `tick gap ${tk[i].t - tk[i - 1].t}`);
});

test('W11c cap at pick: Static Storm <= 3.0x its base (pair 5 + others rank 1) in single, stream10, stream40; deterministic', () => {
  const res = measureRatios({ secs: 10, seeds: [1], modes: ['pair'], only: 'static_storm' });
  for (const [sc, c] of Object.entries(res.static_storm.pair)) assert.ok(c.ratio <= 3.0, `${sc}: ${c.ratio.toFixed(2)}x at pick`);
  const mkc = () => { const s = mk({ chains: 3, cooldown: 4, area: 4 }, 'static_storm'); crowd(s, 50); return s; };
  const a = mkc(), b = mkc(); run(a, 6); run(b, 6);
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});

// ---------------------------------------------------------------- W11d Storm Tether
const tw = (sim) => sim.weapons[0].rt;
test('W11d Storm Tether data: recipe Chains + Arc, up to 4 arcs, fork once, tick 0.25 s, treeGate', () => {
  const e = data.evolutions.storm_tether;
  assert.deepEqual([...e.pair].sort(), ['area', 'chains']);
  assert.equal(e.weapon, 'chain_lightning'); assert.equal(e.treeGate, true);
  assert.equal(e.tune.cap, 4); assert.equal(e.tune.tick, 0.25);
  assert.ok(e.tune.fork > 0 && e.tune.fork < 0.5 + 1e-9);
});

test('W11d arcs = min(4, ceil(Chains/2)) held on distinct nearest foes inside 120 + 0.6 x Arc; one arc per foe', () => {
  for (let rk = 0; rk <= 5; rk++) {
    const sim = mk({ chains: rk, cooldown: 3, area: 3 }, 'storm_tether');
    crowd(sim, 40);
    run(sim, 0.5);
    const T = tw(sim).tethers;
    const reach = 120 + 0.6 * (60 + 10 * 3);
    assert.equal(T.length, Math.min(4, Math.ceil((2 + rk) / 2)), `Chains rank ${rk}`);
    assert.equal(new Set(T.map((t) => t.e.id)).size, T.length, 'one arc per foe');
    for (const t of T) {
      assert.ok(Math.hypot(t.e.x - sim.player.x, t.e.y - sim.player.y) <= reach + 1e-9, 'inside reach');
      if (t.f) assert.ok(!T.some((o) => o.e === t.f) && t.f !== t.e, 'fork never on an arc holder');
    }
  }
});

test('W11d a lone foe only ever gets ONE arc (no doubling) and no fork; damage = 0.45 x power per tick', () => {
  const sim = mk({ chains: 5, cooldown: 5, area: 5 }, 'storm_tether');
  put(sim, 70, 0);
  const log = spy(sim);
  run(sim, 2);
  assert.equal(tw(sim).tethers.length, 1);
  const w = sim.weapons[0], pw = w.s.power * sim.dmgMult(w);
  assert.ok(log.length > 8);
  for (const h of log) assert.ok(Math.abs(h.a - pw * 0.45) < 1e-6, `tick damage ${h.a}`);
  const ts = [...new Set(log.map((h) => h.t))];
  for (let i = 1; i < ts.length; i++) assert.ok(ts[i] - ts[i - 1] >= 0.1 - 1e-9);
});

test('W11d the arc re-locks at once when its foe dies or leaves reach, and the tick never runs under 0.1 s with extreme tree mods', () => {
  const sim = mk({ chains: 3, cooldown: 5, area: 3 }, 'storm_tether');
  sim.mods.cooldown = 0.05;
  const a = put(sim, 60, 0), b = put(sim, 0, 90);
  run(sim, 0.4);
  const T = tw(sim).tethers;
  assert.equal(T.length, 2);
  a.dead = true; // killed
  run(sim, 0.05);
  assert.ok(!tw(sim).tethers.some((t) => t.e === a), 'dead foe dropped');
  const c = put(sim, -50, -40);
  run(sim, 0.05);
  assert.ok(tw(sim).tethers.some((t) => t.e === c), 'a fresh foe takes the free arc');
  b.x = sim.player.x + 400; // leaves reach
  run(sim, 0.05);
  assert.ok(!tw(sim).tethers.some((t) => t.e === b), 'out-of-reach foe dropped');
  const log = spy(sim); run(sim, 2);
  const ts = [...new Set(log.map((h) => h.t))];
  for (let i = 1; i < ts.length; i++) assert.ok(ts[i] - ts[i - 1] >= 0.1 - 1e-9, 'tick floor');
});

test('W11d cap at pick: Storm Tether <= 3.0x its base (pair 5 + others rank 1) in single, stream10, stream40; never below base; deterministic', () => {
  const res = measureRatios({ secs: 10, seeds: [1], modes: ['pair', 'max'], only: 'storm_tether' });
  for (const [sc, c] of Object.entries(res.storm_tether.pair)) assert.ok(c.ratio <= 3.0, `${sc}: ${c.ratio.toFixed(2)}x at pick`);
  for (const mode of ['pair', 'max']) for (const [sc, c] of Object.entries(res.storm_tether[mode])) assert.ok(c.ratio >= 0.98, `${mode} ${sc}: ${c.ratio.toFixed(2)}x below base`);
  const mkc = () => { const s = mk({ chains: 4, cooldown: 3, area: 4 }, 'storm_tether'); crowd(s, 50); return s; };
  const a = mkc(), b = mkc(); run(a, 6); run(b, 6);
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});

test('W11 no dead stat after evolving: every non-recipe stat of each Chain evolution still moves DPS (D1)', () => {
  const avg = (evo, ranks, sc) => { let t = 0; for (let sd = 1; sd <= 3; sd++) t += runRanks('chain_lightning', ranks, evo, sc, sd).dps; return t / 3; };
  const mid = { chains: 2, power: 2, cooldown: 2, area: 2 };
  const nonRecipe = { thunder_judgment: ['cooldown', 'area'], static_storm: ['chains', 'power'], storm_tether: ['power', 'cooldown'] };
  for (const [evo, stats] of Object.entries(nonRecipe)) for (const st of stats) {
    const best = Math.max(...['single', 'sparse', 'kite'].map((sc) => avg(evo, { ...mid, [st]: 5 }, sc) / avg(evo, { ...mid, [st]: 1 }, sc)));
    assert.ok(best >= 1.03, `${evo}: ${st} is dead (${best.toFixed(3)})`);
  }
});
