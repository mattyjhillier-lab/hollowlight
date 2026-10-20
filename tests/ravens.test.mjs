// W8a: Raven Flock scouts (docs/design/weapons-and-summons-v1.1.md 2.2): perch -> dive -> peck -> return, claims, live stats.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { hintText } from '../src/sim/cards.js';
import { data } from '../scripts/evo-same-ranks.mjs';

const DT = 1 / 60;
const RF = data.weapons.raven_flock;
const dummyData = { ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } } };
const mk = (ranks, evo = null, d = dummyData) => {
  const sim = new Sim({ data: d, characterId: 'wren', seed: 3, godMode: true });
  sim.weapons.length = 0;
  sim.ability.cdLeft = 1e9;
  sim.rollDrops = () => {};
  sim.debugGrant('raven_flock', { count: 0, power: 0, range: 0, speed: 0, ...ranks }, evo);
  return sim;
};
const place = (sim, type, n, d0, d1) => {
  const p = sim.player;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 6.2832 + 0.3;
    const e = sim.spawnEnemy(type, p.x + Math.cos(a) * (d0 + ((d1 - d0) * (i % 3)) / 3), p.y + Math.sin(a) * (d0 + ((d1 - d0) * (i % 3)) / 3));
    e.hp = e.maxHp = 1e9;
    return e;
  });
};
const dps = (sim, secs) => {
  let tot = 0;
  const orig = sim.hurt.bind(sim);
  sim.hurt = (e, a, o) => { if (!e.dead && a > 0) tot += a; return orig(e, a, o); };
  for (let i = 0; i < secs / DT; i++) sim.step(DT, {});
  return tot / secs;
};
const ravens = (sim) => sim.units.filter((u) => u.kind === 'raven' && !u.dead);

test('ravens cycle perch -> dive -> peck -> return -> perch and are back home between swoops', () => {
  const sim = mk({});
  place(sim, 'dummy', 1, 40, 40);
  const seen = new Set();
  let backToPerch = false;
  for (let i = 0; i < 12 / DT; i++) {
    sim.step(DT, {});
    for (const u of ravens(sim)) { if (seen.has('return') && u.st === 'perch') backToPerch = true; seen.add(u.st); }
  }
  for (const s of ['perch', 'dive', 'peck', 'return']) assert.ok(seen.has(s), `never saw state ${s}`);
  assert.ok(backToPerch, 'a raven never returned to the perch');
});

test('ravens-claim-distinct: with enough foes in Watch no two ravens work the same foe', () => {
  const sim = mk({ count: 5, range: 5 });
  place(sim, 'dummy', 12, 40, 120);
  let multi = 0;
  for (let i = 0; i < 30 / DT; i++) {
    sim.step(DT, {});
    const ids = ravens(sim).filter((u) => (u.st === 'dive' || u.st === 'peck') && u.target && !u.target.dead).map((u) => u.target.id);
    if (ids.length > 1) multi++;
    assert.equal(new Set(ids).size, ids.length, `two ravens on one foe at ${(i * DT).toFixed(1)}s`);
  }
  assert.ok(multi > 20, 'never saw two ravens out at once');
});

test('ravens-claim-fallback-shares: a lone foe or the boss is worked by the whole flock', () => {
  const sim = mk({ count: 5 });
  const [t] = place(sim, 'dummy', 1, 40, 40);
  let most = 0;
  for (let i = 0; i < 15 / DT; i++) {
    sim.step(DT, {});
    most = Math.max(most, ravens(sim).filter((u) => (u.st === 'dive' || u.st === 'peck') && u.target === t).length);
  }
  assert.ok(most >= 3, `only ${most} ravens ever shared the lone foe`);
});

test('ravens-rank0: a rank-0 flock does real damage to a single foe and to the boss (>= 9 DPS)', () => {
  const s1 = mk({});
  place(s1, 'dummy', 1, 40, 40);
  assert.ok(dps(s1, 20) >= 9, 'single');
  const s2 = mk({});
  s2.time = 600;
  const boss = s2.spawnEnemy('elder_treant', s2.player.x + 70, s2.player.y);
  boss.hp = boss.maxHp = 1e9;
  assert.ok(dps(s2, 20) >= 9, 'boss');
});

test('ravens: a modest support weapon (max-rank boss DPS between 0.4x and 1.35x of max Ghost Wolves)', () => {
  const max = { count: 5, power: 5, range: 5, speed: 5 };
  const r = mk(max);
  r.time = 600;
  r.spawnEnemy('elder_treant', r.player.x + 70, r.player.y).hp = 1e9;
  const rd = dps(r, 15);
  const w = new Sim({ data: dummyData, characterId: 'wren', seed: 3, godMode: true });
  w.weapons.length = 0; w.ability.cdLeft = 1e9; w.rollDrops = () => {};
  w.debugGrant('ghost_wolves', max, null);
  w.time = 600;
  w.spawnEnemy('elder_treant', w.player.x + 70, w.player.y).hp = 1e9;
  const wd = dps(w, 15);
  assert.ok(rd > 0.4 * wd && rd < 1.35 * wd, `ravens ${rd.toFixed(0)} vs wolves ${wd.toFixed(0)}`);
});

test('ravens: no dead stats (Flock size, Peck power, Watch, Wingbeat each change the result)', () => {
  const base = { count: 2, power: 2, range: 2, speed: 2 };
  const run = (over, scen) => {
    const sim = mk({ ...base, ...over });
    if (scen === 'sparse') place(sim, 'dummy', 6, 95, 145);
    else place(sim, 'dummy', 12, 40, 120);
    return dps(sim, 15);
  };
  assert.ok(run({ count: 5 }, 'crowd') > run({ count: 0 }, 'crowd') * 1.3, 'count');
  assert.ok(run({ power: 5 }, 'crowd') > run({ power: 0 }, 'crowd') * 1.3, 'power');
  assert.ok(run({ speed: 5 }, 'crowd') > run({ speed: 0 }, 'crowd') * 1.1, 'speed');
  assert.ok(run({ range: 5 }, 'sparse') > run({ range: 0 }, 'sparse') * 1.3, 'range');
});

test('Watch: a foe outside Watch is left alone, a foe inside is attacked', () => {
  const out = mk({});
  const [far] = place(out, 'dummy', 1, 130, 130);
  dps(out, 8);
  assert.equal(far.hp, far.maxHp, 'foe at 130 px with Watch 90 was attacked');
  const inn = mk({ range: 5 });
  const [near] = place(inn, 'dummy', 1, 130, 130);
  dps(inn, 8);
  assert.ok(near.hp < near.maxHp, 'foe at 130 px with Watch 150 was not attacked');
});

test('card hints are honest: Watch, Wingbeat, Peck and Flock size', () => {
  assert.equal(RF.stats.range.name, 'Watch');
  assert.equal(RF.stats.speed.name, 'Wingbeat');
  assert.match(hintText(RF, 'range', 0), /90 → 102/);
  assert.match(hintText(RF, 'speed', 0), /15% more often/);
  assert.equal(RF.stats.power.base + 5 * RF.stats.power.perRank, 22);
  assert.equal(RF.stats.count.base + 5 * RF.stats.count.perRank, 7);
});

test('ravens are deterministic and draw no RNG', () => {
  const a = mk({ count: 3 }); place(a, 'dummy', 5, 40, 100);
  const b = mk({ count: 3 }); place(b, 'dummy', 5, 40, 100);
  const da = dps(a, 10), db = dps(b, 10);
  assert.equal(da, db);
  assert.equal(a.rng.next(), b.rng.next());
});

test('raven evolutions still run on the scout base (ids kept, never below the base flock)', () => {
  for (const evo of ['murder_storm', 'dive_bombers']) {
    const max = { count: 5, power: 5, range: 5, speed: 5 };
    const base = mk(max); place(base, 'dummy', 8, 40, 120);
    const ev = mk(max, evo); place(ev, 'dummy', 8, 40, 120);
    assert.ok(data.evolutions[evo].weapon === 'raven_flock');
    assert.ok(dps(ev, 12) >= 0.98 * dps(base, 12), evo);
  }
});
