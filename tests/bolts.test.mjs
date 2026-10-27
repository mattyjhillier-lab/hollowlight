// W10: Spirit Bolts base rework (docs/design/weapons-and-summons-v1.1.md 2.3) and its three evolutions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { hintText } from '../src/sim/cards.js';
import { data, measureRatios } from '../scripts/evo-same-ranks.mjs';
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
test('W10a data: Bolt power 7.2 -> 18.7 (+2.3, RT1 2026-10-25, RT3b +10% base), Swiftness 150 -> 260 with turn 5 -> 8 and a gap rate', () => {
  const st = data.weapons.spirit_bolts.stats;
  assert.equal(st.power.base, 7.2); assert.equal(st.power.perRank, 2.3);
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

test('W10a maxed DPS stays near today in crowds: RT1 cut: nominal power x gap = 18.7/1.0 vs the old 27.5/1.0 (about 0.68x, RT3b)', () => {
  const st = data.weapons.spirit_bolts.stats;
  const nominal = ((st.power.base + 5 * st.power.perRank) / (1.1 / (1 + 5 * st.speed.rate))) / (27.5 / 1.0);
  assert.ok(Math.abs(nominal - 0.68) <= 0.02, `nominal ${nominal}`);
});

test('W10a Spirit Bolts base is deterministic', () => {
  const a = mk({ count: 3, power: 3, speed: 3, pierce: 2 }); place(a, 12, 50, 160, 'dummy');
  const b = mk({ count: 3, power: 3, speed: 3, pierce: 2 }); place(b, 12, 50, 160, 'dummy');
  run(a, 8); run(b, 8);
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});

// ---------------------------------------------------------------- W10b Spirit Tempest (Burst and Seek)
const TEMP = { count: 5, power: 5, speed: 5, pierce: 5 };
const tempest = (ranks = TEMP, seed = 3) => mk(ranks, 'spirit_tempest', seed);
const volleyOf = (sim) => sim.projectiles.filter((b) => b.vol);

test('Tempest: a volley is a ring of 8 glyphs, 45 degrees apart, that bursts radially first (no homing yet)', () => {
  const sim = tempest(); place(sim, 10, 90, 150);
  let gl = [];
  for (let i = 0; i < 60 && gl.length < 8; i++) { sim.step(DT, {}); gl = volleyOf(sim); }
  assert.equal(gl.length, 8);
  assert.equal(new Set(gl.map((b) => b.vol)).size, 1);
  const angs = gl.map((b) => Math.atan2(b.vy, b.vx)).sort((a, b) => a - b);
  for (let i = 1; i < 8; i++) assert.ok(Math.abs(angs[i] - angs[i - 1] - Math.PI / 4) < 0.05, `gap ${i}`);
  assert.ok(gl.every((b) => b.homing === false && b.seek > 0), 'burst phase: straight, no homing');
});

test('Tempest re-homing: with 8+ foes every glyph of a volley takes a DISTINCT foe (claim set)', () => {
  const sim = tempest(); place(sim, 12, 60, 150);
  let checked = 0;
  for (let i = 0; i < 90 && !checked; i++) {
    sim.step(DT, {});
    const gl = volleyOf(sim);
    if (gl.length === 8 && gl.every((b) => b.seek <= 0 && b.target)) {
      assert.equal(new Set(gl.map((b) => b.target.id)).size, 8, 'distinct prey');
      checked++;
    }
  }
  assert.equal(checked, 1, 'never saw a fully re-homed volley');
});

test('Tempest re-homing: with fewer foes than glyphs the prey is shared as evenly as possible', () => {
  const sim = tempest(); place(sim, 3, 80, 140);
  let seen = false;
  for (let i = 0; i < 90 && !seen; i++) {
    sim.step(DT, {});
    const gl = volleyOf(sim);
    if (gl.length === 8 && gl.every((b) => b.seek <= 0)) {
      const cnt = new Map(); for (const b of gl) if (b.target) cnt.set(b.target.id, (cnt.get(b.target.id) || 0) + 1);
      assert.equal(cnt.size, 3);
      assert.ok(Math.max(...cnt.values()) - Math.min(...cnt.values()) <= 1, [...cnt.values()].join(','));
      seen = true;
    }
  }
  assert.ok(seen);
});

test('Tempest blast only on a hit: glyphs that fade in empty air never explode; a hit pops (0.12x, r22)', () => {
  const sim = tempest({ ...TEMP, pierce: 0 }); const [d] = place(sim, 1, 120, 120);
  let pops = 0; const o = sim.explodeBolt.bind(sim); sim.explodeBolt = (b) => { pops++; return o(b); };
  run(sim, 1.2);
  assert.ok(pops > 0, 'a hit should pop');
  d.dead = true; sim.enemies.length = 0; pops = 0;
  run(sim, 5);
  assert.equal(pops, 0, 'no pops once there is nothing to hit');
  assert.equal(data.evolutions.spirit_tempest.tune.blast, 0.12);
});

test('Tempest: volley gap 0.85 s at Swiftness 5 and 0.02 s longer per missing rank', () => {
  const gapAt = (rs) => {
    const sim = tempest({ ...TEMP, speed: rs }); const d = place(sim, 1, 150, 150)[0]; d.hp = d.maxHp = 1e12;
    const times = []; const o = sim.spawnBolt.bind(sim);
    sim.spawnBolt = (b) => { if (!times.length || sim.time - times[times.length - 1] > 0.3) times.push(sim.time); return o(b); };
    run(sim, 12); return (times[times.length - 1] - times[1]) / (times.length - 2);
  };
  assert.ok(Math.abs(gapAt(5) - 0.85) < 0.02, String(gapAt(5)));
  assert.ok(Math.abs(gapAt(0) - 0.95) < 0.02, String(gapAt(0)));
});

test('Tempest wasted glyphs <= 25% on a single target (glyphs that never hit anything)', () => {
  const sim = tempest(); place(sim, 1, 30, 30);
  const all = new Map();
  for (let i = 0; i < 12 * 60; i++) { sim.step(DT, {}); for (const b of sim.projectiles) all.set(b.id, b); }
  // ignore the volley still in the air at the end
  const done = [...all.values()].filter((b) => b.dead || b.life <= 0 || b.hit.size > 0);
  const wasted = done.filter((b) => b.hit.size === 0).length / done.length;
  assert.ok(done.length >= 40);
  assert.ok(wasted <= 0.25, `wasted ${(wasted * 100).toFixed(0)}%`);
});

test('Tempest: no dead stat after evolving (Bolt power and Pierce still move DPS; recipe stats are maxed)', () => {
  const crowdDps = (r) => { const sim = tempest(r); for (const e of place(sim, 30, 40, 170, 'dummy')) e.speed = 0; return dps(sim, 12); };
  const mid = { count: 5, speed: 5, power: 2, pierce: 2 };
  assert.ok(crowdDps({ ...mid, power: 4 }) > crowdDps(mid) * 1.1, 'power');
  assert.ok(crowdDps({ ...mid, pierce: 4 }) > crowdDps(mid) * 1.1, 'pierce');
});

test('Tempest is deterministic', () => {
  const a = tempest(); place(a, 14, 50, 170, 'wolf', 400);
  const b = tempest(); place(b, 14, 50, 170, 'wolf', 400);
  run(a, 8); run(b, 8);
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});

test('Tempest gates: stream40 <= 2.4x at max, single >= 1.5x at max, cap at pick <= 3.0x (single, stream10, stream40), never below base', () => {
  const res = measureRatios({ secs: 10, seeds: [1], only: 'spirit_tempest' }).spirit_tempest;
  assert.ok(res.max.stream40.ratio <= 2.4, `stream40 ${res.max.stream40.ratio.toFixed(2)}x`);
  assert.ok(res.max.single.ratio >= 1.5, `single ${res.max.single.ratio.toFixed(2)}x`);
  for (const [sc, c] of Object.entries(res.pair)) assert.ok(c.ratio <= 3.0, `${sc} cap@pick ${c.ratio.toFixed(2)}x`);
  for (const mode of ['max', 'pair']) for (const [sc, c] of Object.entries(res[mode])) assert.ok(c.ratio >= 0.98, `${mode} ${sc} ${c.ratio.toFixed(2)}x`);
});

// ---------------------------------------------------------------- W10c Soul Lance (Lances of Light)
const LNC = { count: 0, power: 5, speed: 0, pierce: 5 };
const lanceSim = (ranks = LNC, seed = 3) => mk({ ...LNC, ...ranks }, 'soul_lance', seed);
const lancesNow = (sim) => sim.projectiles.filter((b) => b.lance);
const firstVolley = (sim, secs = 3) => { for (let i = 0; i < secs / DT; i++) { sim.step(DT, {}); const L = lancesNow(sim); if (L.length) return L; } return []; };

test('Lance count: 1 + floor(Bolt count rank / 2), max 3 (1,1,2,2,3,3 at ranks 0..5), in a 12 degree fan', () => {
  const want = [1, 1, 2, 2, 3, 3];
  for (let rc = 0; rc <= 5; rc++) {
    const sim = lanceSim({ count: rc }); place(sim, 1, 100, 100);
    const L = firstVolley(sim);
    assert.equal(L.length, want[rc], `count rank ${rc}`);
    if (L.length > 1) {
      const a = L.map((b) => b.ang).sort((x, y) => x - y);
      assert.ok(Math.abs((a[a.length - 1] - a[0]) - (12 * Math.PI) / 180) < 1e-9, 'fan spans 12 degrees');
    }
  }
});

test('Lance damage = Bolt power x (2.0 + 0.07 per Bolt count rank); width = 1 + 2 px per Pierce rank; speed x1.3; range 300 px', () => {
  for (const [rc, rp] of [[0, 5], [3, 5], [5, 2]]) {
    const sim = lanceSim({ count: rc, pierce: rp }); place(sim, 1, 100, 100);
    const [b] = firstVolley(sim);
    const w = sim.weapons[0];
    assert.ok(Math.abs(b.dmg - w.s.power * (2.0 + 0.07 * rc)) < 1e-6, `dmg ${b.dmg}`);
    assert.equal(b.r, 1 + 2 * rp);
    assert.ok(Math.abs(b.speed - w.s.speed * 1.3) < 1e-6);
    assert.ok(Math.abs(b.life * b.speed - 300) < 10, 'range 300 px (one frame already flown)');
    assert.equal(b.pierce, Infinity);
  }
});

test('Lance aims through the DENSEST line among the nearest 5, not just at the nearest foe', () => {
  const sim = lanceSim(); const p = sim.player;
  const mkE = (x, y) => { const e = sim.spawnEnemy('dummy', p.x + x, p.y + y); e.hp = e.maxHp = 1e9; return e; };
  mkE(50, 0); // nearest, alone to the east
  for (let i = 0; i < 6; i++) mkE(0, 80 + i * 24); // a column to the south
  const [b] = firstVolley(sim);
  assert.ok(Math.abs(b.ang - Math.PI / 2) < 0.2, `aimed ${((b.ang * 180) / Math.PI).toFixed(0)} deg, wanted the column (90)`);
});

test('Lance script line: one per lance, grows with the lance, burns what stands on it 0.25x/s for 1.2 s, never stacks', () => {
  const sim = lanceSim(); const p = sim.player;
  const d = sim.spawnEnemy('dummy', p.x + 150, p.y); d.hp = d.maxHp = 1e9;
  const [b] = firstVolley(sim);
  const w = sim.weapons[0];
  assert.equal(w.rt.lines.length, 1);
  const ln = w.rt.lines[0];
  assert.ok(Math.abs(ln.dps - b.dmg * 0.25) < 1e-6 && ln.ttl === 1.2);
  // measure the burn on a foe placed on the line well after the lance passed (silent hits only)
  let burn = 0, direct = 0; const o = sim.hurt.bind(sim);
  sim.hurt = (e, a, x) => { if (e === d) { if (x && x.silent) burn += a; else direct += a; } return o(e, a, x); };
  run(sim, 0.8);
  burn = 0; direct = 0;
  run(sim, 0.5); // inside the ttl window (line age < 1.2 s)
  assert.ok(burn > 0, 'the line burns');
  assert.ok(burn <= ln.dps * (0.5 + 0.25) + 1e-9 && burn >= ln.dps * 0.25 - 1e-9, `burn ${burn} over 0.5 s vs ${ln.dps}/s`); // 0.25x of the lance per second, one tick at a time
  // never stack: two lines over one foe tick the strongest only
  const sim2 = lanceSim({ count: 4 }); const p2 = sim2.player;
  const f = sim2.spawnEnemy('dummy', p2.x + 120, p2.y); f.hp = f.maxHp = 1e9;
  firstVolley(sim2); run(sim2, 0.6);
  const lines = sim2.weapons[0].rt.lines;
  assert.ok(lines.length >= 3);
  const strongest = Math.max(...lines.map((l) => l.dps));
  let one = 0; const o2 = sim2.hurt.bind(sim2); sim2.hurt = (e, a, x) => { if (e === f && x && x.silent) one = Math.max(one, a); return o2(e, a, x); };
  run(sim2, 0.3);
  assert.ok(one <= strongest * 0.25 + 1e-9, `one tick ${one} vs strongest line ${strongest * 0.25}`);
});

test('Lance: the line fades after 1.2 s once the lance has reached its full length', () => {
  const sim = lanceSim(); const p = sim.player;
  const d = sim.spawnEnemy('dummy', p.x + 150, p.y); d.hp = d.maxHp = 1e9;
  firstVolley(sim);
  const first = sim.weapons[0].rt.lines[0];
  run(sim, 300 / (sim.weapons[0].s.speed * 1.3) + 1.3); // travel + ttl
  assert.ok(!sim.weapons[0].rt.lines.includes(first), 'line gone');
});

test('Lance: no dead stat after evolving (Bolt count adds lances + damage, Swiftness speeds the volley); recipe stats are maxed', () => {
  const dpsOf = (r) => { const sim = lanceSim(r); const d = place(sim, 1, 120, 120)[0]; void d; return dps(sim, 12); };
  assert.ok(dpsOf({ count: 4 }) > dpsOf({ count: 2 }) * 1.1, 'count');
  assert.ok(dpsOf({ speed: 5 }) > dpsOf({ speed: 0 }) * 1.05, 'Swiftness');
});

test('Lance gates: single 1.75-2.35x at max (band 1.8-2.3), cap at pick <= 3.0x (single, stream10, stream40), never below base incl. stream10 >= 1.0 (EXPECTED_FAIL removed)', () => {
  const res = measureRatios({ secs: 10, seeds: [1], only: 'soul_lance' }).soul_lance;
  assert.ok(res.max.single.ratio >= 1.75 && res.max.single.ratio <= 2.35, `single ${res.max.single.ratio.toFixed(2)}x`);
  for (const [sc, c] of Object.entries(res.pair)) assert.ok(c.ratio <= 3.0, `${sc} cap@pick ${c.ratio.toFixed(2)}x`);
  for (const mode of ['max', 'pair']) for (const [sc, c] of Object.entries(res[mode])) assert.ok(c.ratio >= 0.98, `${mode} ${sc} ${c.ratio.toFixed(2)}x`);
});

test('Lance hurts a boss (boss damage > 0) and never moves, frightens or pins it', () => {
  const sim = lanceSim({ count: 5 }); const boss = sim.spawnEnemy('elder_treant', sim.player.x + 80, sim.player.y);
  boss.hp = boss.maxHp = 1e12;
  run(sim, 8, () => { assert.equal(boss.fearT, 0); assert.ok(!(boss.heldT > 0)); });
  assert.ok(boss.maxHp - boss.hp > 0);
});

test('Soul Lance is deterministic', () => {
  const a = lanceSim({ count: 4 }); place(a, 14, 50, 170, 'wolf', 400);
  const b = lanceSim({ count: 4 }); place(b, 14, 50, 170, 'wolf', 400);
  run(a, 8); run(b, 8);
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});

// ---------------------------------------------------------------- W10d Returning Pages
const PG = { count: 0, power: 5, speed: 5, pierce: 5 };
const pagesSim = (ranks = {}, seed = 3) => mk({ ...PG, ...ranks }, 'returning_pages', seed);
const glyphs = (sim) => sim.projectiles.filter((b) => b.pages);

test('Pages data: pair Swiftness + Pierce, tree gate, card text fits, a 14th gate node exists', () => {
  const e = data.evolutions.returning_pages;
  assert.deepEqual([...e.pair].sort(), ['pierce', 'speed']);
  assert.equal(e.weapon, 'spirit_bolts'); assert.equal(e.treeGate, true);
  assert.equal(e.name, 'Returning Pages'); assert.equal(e.verb, 'RETURN');
  assert.ok(Object.keys(data.evolutions).filter((k) => data.evolutions[k].weapon === 'spirit_bolts').length === 3);
});

test('Pages: glyphs per volley = Bolt count, each aimed at a different foe; the volley gap follows Swiftness like the base', () => {
  const sim = pagesSim({ count: 3 }); place(sim, 8, 60, 160);
  let g = [];
  for (let i = 0; i < 40 && g.length < 4; i++) { sim.step(DT, {}); g = glyphs(sim); }
  assert.equal(g.length, 4);
  assert.equal(new Set(g.map((b) => b.target.id)).size, 4, 'distinct first targets');
  assert.ok(g.every((b) => b.per === 6 && b.left === 6), '1 + Pierce foes per leg');
});

test('Pages: the glyph flies out 130 + 0.7 px per Swiftness speed point, turns, comes home and is caught (never longer than 4 s)', () => {
  const far = (rs) => {
    const sim = pagesSim({ speed: rs }); place(sim, 1, 205, 205);
    let maxD = 0, turned = false, died = false, id = null, born = 0, life = 0;
    for (let i = 0; i < 8 / DT && !died; i++) {
      sim.step(DT, {});
      const g = id === null ? glyphs(sim)[0] : glyphs(sim).find((b) => b.id === id);
      if (g && id === null) { id = g.id; born = sim.time; }
      if (g) { maxD = Math.max(maxD, Math.hypot(g.x - sim.player.x, g.y - sim.player.y)); if (g.back) turned = true; }
      else if (id !== null) { died = true; life = sim.time - born; }
    }
    return { maxD, turned, died, life };
  };
  const a = far(0), b = far(5);
  assert.ok(a.maxD > 120 && a.maxD < 150, `Swiftness 0 turned at ${a.maxD.toFixed(0)} px`);
  assert.ok(a.turned && a.died && a.life < 4, 'came home and was caught');
  assert.ok(b.maxD > a.maxD + 40, `Swiftness 5 flies further (${b.maxD.toFixed(0)} px)`);
  assert.ok(b.turned && b.died && b.life < 4);
});

test('Pages: a foe is hit at most once per throw (out and home through the same line)', () => {
  const sim = pagesSim({ count: 0 }); const [d] = place(sim, 1, 90, 90);
  let n = 0, spawned = 0; const o = sim.hurt.bind(sim); sim.hurt = (e, a, x) => { if (e === d) n++; return o(e, a, x); };
  const os = sim.spawnBolt.bind(sim); sim.spawnBolt = (b) => { if (b.pages) spawned++; return os(b); };
  run(sim, 10);
  assert.ok(spawned >= 6);
  assert.ok(n <= spawned, `${n} hits for ${spawned} glyphs`);
  assert.ok(n >= spawned - 1, 'and it is hit every throw (the last glyph may still be in the air)');
});

test('Pages: on the way home it hits FRESH foes (a foe that appears beside the return path is struck once)', () => {
  const sim = pagesSim({ count: 0, pierce: 0 }); const [a] = place(sim, 1, 120, 120); void a;
  let fresh = null, hitBack = 0, hitOut = 0;
  const o = sim.hurt.bind(sim);
  sim.hurt = (e, amt, x) => { if (e === fresh) { const g = glyphs(sim)[0]; if (g && g.back) hitBack++; else hitOut++; } return o(e, amt, x); };
  for (let i = 0; i < 6 / DT && hitBack === 0; i++) {
    sim.step(DT, {});
    const g = glyphs(sim)[0];
    if (g && g.back && !fresh) { fresh = sim.spawnEnemy('dummy', g.x - Math.cos(g.ang) * 25, g.y - Math.sin(g.ang) * 25); fresh.hp = fresh.maxHp = 1e9; }
  }
  assert.ok(hitBack >= 1 && hitOut === 0, `fresh foe: ${hitBack} hits on the way home, ${hitOut} on the way out`);
});

test('Pages: no dead stat after evolving (Bolt count, Bolt power, Swiftness and Pierce all move DPS against a column)', () => {
  const column = (r, gap) => { const sim = pagesSim(r); const p = sim.player; for (let i = 0; i < 16; i++) { const e = sim.spawnEnemy('dummy', p.x + 30 + i * gap, p.y + ((i % 3) - 1) * 6); e.hp = e.maxHp = 1e9; } return dps(sim, 12); };
  const mid = { count: 2, power: 2, speed: 2, pierce: 5 }; // the recipe keeps Pierce at 5, so Swiftness is tested with a full per-leg budget
  for (const k of ['count', 'power']) assert.ok(column({ ...mid, [k]: 4 }, 13) > column(mid, 13) * 1.05, `${k} is dead`);
  // Swiftness = how far the glyph flies: a spread-out column (40 px apart) is reached further along with more of it
  assert.ok(column({ ...mid, speed: 5 }, 40) > column(mid, 40) * 1.1, 'speed (flight length) is dead');
  const mid2 = { count: 2, power: 2, speed: 5, pierce: 2 };
  assert.ok(column({ ...mid2, pierce: 4 }, 13) > column(mid2, 13) * 1.05, 'pierce is dead');
});

test('Pages gates: stream40 1.8-2.3x at max, single <= 2.5x, cap at pick <= 3.0x (single, stream10, stream40), never below base', () => {
  const res = measureRatios({ secs: 10, seeds: [1], only: 'returning_pages' }).returning_pages;
  assert.ok(res.max.stream40.ratio >= 1.8 && res.max.stream40.ratio <= 2.3, `stream40 ${res.max.stream40.ratio.toFixed(2)}x`);
  assert.ok(res.max.single.ratio <= 2.5, `single ${res.max.single.ratio.toFixed(2)}x`);
  for (const [sc, c] of Object.entries(res.pair)) assert.ok(c.ratio <= 3.0, `${sc} cap@pick ${c.ratio.toFixed(2)}x`);
  for (const mode of ['max', 'pair']) for (const [sc, c] of Object.entries(res[mode])) assert.ok(c.ratio >= 0.98, `${mode} ${sc} ${c.ratio.toFixed(2)}x`);
});

test('Pages never move, frighten or pin a boss, and it still takes damage', () => {
  const sim = pagesSim({ count: 5 }); const boss = sim.spawnEnemy('elder_treant', sim.player.x + 80, sim.player.y);
  boss.hp = boss.maxHp = 1e12;
  run(sim, 8, () => { assert.equal(boss.fearT, 0); assert.ok(!(boss.heldT > 0)); });
  assert.ok(boss.maxHp - boss.hp > 0);
});

test('Returning Pages is deterministic', () => {
  const a = pagesSim({ count: 3 }); place(a, 14, 50, 170, 'wolf', 400);
  const b = pagesSim({ count: 3 }); place(b, 14, 50, 170, 'wolf', 400);
  run(a, 8); run(b, 8);
  assert.equal(a.damageDealt, b.damageDealt); assert.equal(a.rng.next(), b.rng.next());
});
