// DM5: Cinder Wyrm (LOOP), the second Dragonfire Meteor evolution. Hidden with the weapon (unreleased).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { WYRM_HARD } from '../src/sim/weapons.js';
import { generateOffer } from '../src/sim/cards.js';
import { data } from './helpers.mjs';

const DT = 1 / 60;
const ID = 'dragonfire_meteor', EVO = 'cinder_wyrm';
const dd = (tune) => ({ ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  evolutions: tune ? { ...data.evolutions, [EVO]: { ...data.evolutions[EVO], tune: { ...data.evolutions[EVO].tune, ...tune } } } : data.evolutions });
const mk = (ranks = {}, { evo = EVO, seed = 3, tune = null } = {}) => {
  const sim = new Sim({ data: dd(tune), characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  const w = sim.debugGrant(ID, ranks, evo);
  return { sim, w };
};
const put = (sim, dx, dy, r = 8) => { const e = sim.spawnEnemy('dummy', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = 1e9; e.r = r; return e; };
const crowd = (sim, n, cx = 110, cy = 0, sp = 14, cols = 5) => { for (let i = 0; i < n; i++) put(sim, cx + ((i % cols) - (cols - 1) / 2) * sp, cy + (Math.floor(i / cols) - Math.floor(n / cols / 2)) * sp); };
const run = (sim, secs, each) => { for (let i = 0; i < Math.round(secs / DT); i++) { sim.step(DT, {}); if (each) each(sim); } };
const R = { count: 4, area: 3, duration: 3, power: 5 };

test('data: cinder_wyrm entry (pair count + power, verb LOOP, hidden, tune numbers)', () => {
  const e = data.evolutions[EVO];
  assert.equal(e.weapon, ID); assert.deepEqual(e.pair, ['count', 'power']); assert.equal(e.verb, 'LOOP'); assert.equal(e.name, 'Cinder Wyrm');
  assert.equal(e.treeGate, true); assert.equal(e.unreleased, true); assert.equal(e.cue, 'evo_cinder_wyrm');
  assert.equal(e.codex, 'It was a hearth once. It remembers being a roof.');
  const t = e.tune;
  assert.deepEqual([t.loopR, t.speed, t.up, t.down, t.segs, t.lock, t.volley], [95, 150, 7, 2, 7, 0.4, 0.7]);
  assert.equal(WYRM_HARD.maxHits, 40); assert.equal(WYRM_HARD.segs, 7);
  assert.notDeepEqual(e.pair, data.evolutions.wildfire.pair);
});

test('hidden: never offered while the weapon is unreleased', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 5 });
  for (let i = 0; i < 40; i++) { const o = generateOffer(sim.cardCtx, sim.rng); assert.ok(!o.cards.some((c) => c.weaponId === ID || c.evoId === EVO)); }
});

test('life cycle: waits with nothing to hunt, forms on the densest cluster, 7 s up, 2 s down, re-forms', () => {
  const { sim, w } = mk(R);
  run(sim, 3); assert.ok(!w.rt.wyrm || !w.rt.wyrm.on, 'no foes: no serpent');
  crowd(sim, 14, 120, 0, 12);
  let formed = -1, gone = -1, again = -1, last = false;
  run(sim, 14, () => { const y = w.rt.wyrm; if (!y) return; if (y.on && formed < 0) formed = sim.time; if (formed > 0 && !y.on && gone < 0) gone = sim.time; if (gone > 0 && y.on && again < 0) again = sim.time; last = y.on; });
  assert.ok(formed > 0 && gone > 0 && again > 0);
  assert.ok(Math.abs(gone - formed - 7) < 0.1, `up ${gone - formed}`);
  assert.ok(Math.abs(again - gone - 2) < 0.1, `down ${again - gone}`);
  assert.ok(w.rt.wyrm.loops >= 2);
});

test('aim: the oval centres on the densest cluster, not the lone foe', () => {
  const { sim, w } = mk(R);
  put(sim, -150, 90); crowd(sim, 14, 130, 20, 10);
  run(sim, 1.5);
  const y = w.rt.wyrm; assert.ok(y && y.on);
  assert.ok(Math.hypot(y.cx - (sim.player.x + 130), y.cy - (sim.player.y + 20)) < 40, 'centre on the crowd');
});

test('body: 7 segments trail the head along the path, finite positions', () => {
  const { sim, w } = mk(R); crowd(sim, 10, 120);
  run(sim, 2); const y = w.rt.wyrm;
  assert.equal(y.nseg, 7);
  for (let i = 0; i < 14; i++) assert.ok(Number.isFinite(y.seg[i]));
  const gap = (i) => Math.hypot(y.seg[i * 2] - y.seg[i * 2 + 2], y.seg[i * 2 + 1] - y.seg[i * 2 + 3]);
  for (let i = 0; i < 6; i++) assert.ok(gap(i) > 3 && gap(i) < 40, `segment gap ${gap(i)}`);
  assert.equal(y.hx, y.seg[0]);
});

test('hits: a foe on the path is hit and burned, at most once per 0.4 s, no pools from the serpent', () => {
  const { sim, w } = mk({ count: 0, power: 3 });
  crowd(sim, 12, 120, 0, 12);
  const times = new Map(); const o = sim.hurt.bind(sim);
  let pooled = 0;
  sim.hurt = (e, a, x) => { const r = o(e, a, x); if (sim._src === ID && r > 0 && e.burnT !== undefined) { const l = times.get(e) || []; l.push([sim.time, a]); times.set(e, l); } return r; };
  run(sim, 9, () => { pooled = Math.max(pooled, w.rt.pools.length); });
  const wyrmHit = (a) => a > 0;
  let n = 0;
  for (const l of times.values()) { const ts = l.map((x) => x[0]); for (let i = 1; i < ts.length; i++) if (Math.abs(l[i][1] - l[0][1]) < 1e-9) { n++; assert.ok(ts[i] - ts[i - 1] >= 0.4 - 2 * DT || l[i][1] !== l[i - 1][1], 'lockout'); } }
  assert.ok(sim.dmgBy[ID] > 0 && wyrmHit(1));
  assert.ok(sim.enemies.some((e) => e.burnT > 0 || e.burnSrc === ID), 'burned');
  assert.ok(pooled <= 5, 'pools only from the volley (cap 5)');
});

test('lockout: no foe takes two serpent hits within 0.4 s', () => {
  const { sim, w } = mk({ count: 0, power: 5 }, { tune: { hitK: 6 } });
  const mark = 'wyrmhit';
  crowd(sim, 20, 120, 0, 10);
  const o = sim.hurt.bind(sim); const per = new Map();
  sim.hurt = (e, a, x) => { const r = o(e, a, x); if (r > 0 && w.rt.wyrm && w.rt.wyrm.on && Math.abs(a - sim.dmgMult(w) * w.s.power * 6) < 1e-6 * a + 1e-6) { const l = per.get(e) || []; l.push(sim.time); per.set(e, l); } return r; };
  run(sim, 8);
  let checked = 0;
  for (const l of per.values()) for (let i = 1; i < l.length; i++) { checked++; assert.ok(l[i] - l[i - 1] >= 0.4 - 2 * DT, mark + ' gap ' + (l[i] - l[i - 1])); }
  assert.ok(checked > 3, 'enough serpent hits seen (' + checked + ')');
});

test('cap: at most 40 serpent hits per second however many foes it touches', () => {
  const { sim, w } = mk({ count: 0, power: 5 }, { tune: { lock: 0.1, hitK: 5 } });
  crowd(sim, 90, 120, 0, 7, 10);
  const stamp = []; const o = sim.hurt.bind(sim); let tick = 0;
  const base = sim.dmgMult(w) * w.s.power;
  sim.hurt = (e, a, x) => { const r = o(e, a, x); if (r > 0 && Math.abs(a - base * 5) < 1e-6 * a + 1e-6) stamp.push(sim.time); return r; };
  run(sim, 7, () => { tick++; });
  assert.ok(stamp.length > 100, 'plenty of hits ' + stamp.length);
  let worst = 0; for (let i = 0; i < stamp.length; i++) { let j = i; while (j < stamp.length && stamp[j] - stamp[i] < 1 - 1e-9) j++; worst = Math.max(worst, j - i); }
  assert.ok(worst <= WYRM_HARD.maxHits, 'hits in any 1 s window ' + worst);
});

test('volley keeps going at 70% rate (cd 2.6 -> 3.71 s); the serpent adds, never removes', () => {
  const a = mk(R), b = mk(R, { evo: null });
  for (const x of [a, b]) crowd(x.sim, 12, 110);
  const count = (x, secs) => { let n = 0, last = x.w.rt.cd; run(x.sim, secs, () => { if (x.w.rt.cd > last + 0.5) n++; last = x.w.rt.cd; }); return n; };
  const na = count(a, 30), nb = count(b, 30);
  assert.ok(nb >= 10 && na >= 6, `volleys base ${nb} wyrm ${na}`);
  assert.ok(Math.abs(na / nb - 0.7) < 0.12, `ratio ${na / nb}`);
});

test('hostile tune values cannot lift a cap or make NaN', () => {
  const { sim, w } = mk(R, { tune: { segs: 99, loopR: 1e9, speed: NaN, up: -5, down: 'x', hitK: 1e9, lock: 0, track: Infinity, reach: 1e9, aimR: -1, gap: 0, segR: 1e6, volley: 0 } });
  crowd(sim, 60, 120, 0, 9, 10);
  run(sim, 15, () => { const y = w.rt.wyrm; if (!y) return; assert.ok(y.nseg <= 7); for (let i = 0; i < 14; i++) assert.ok(Number.isFinite(y.seg[i]), 'finite'); assert.ok(y.hits.length <= 40); });
});

test('hostile foes (NaN / Infinity position, dead) never break the serpent', () => {
  const { sim, w } = mk(R); crowd(sim, 20);
  const bad = put(sim, 100, 0); bad.x = NaN; const bad2 = put(sim, 100, 0); bad2.y = Infinity; const dead = put(sim, 100, 0); dead.dead = true;
  assert.doesNotThrow(() => run(sim, 10));
  const y = w.rt.wyrm; for (let i = 0; i < 14; i++) assert.ok(Number.isFinite(y.seg[i]));
});

test('boss: a boss takes the reduced serpent hit (bossK) on top of the weapon boss rule, and is a cluster magnet', () => {
  const { sim, w } = mk(R);
  put(sim, -120, 40); put(sim, -110, 50);
  const b = put(sim, 130, 0, 24); b.boss = true;
  run(sim, 2);
  assert.ok(w.rt.wyrm.on && Math.hypot(w.rt.wyrm.cx - (sim.player.x + 130), w.rt.wyrm.cy - sim.player.y) < 45, 'it hunts the boss over two small foes');
});

test('base weapon is untouched: no serpent without the evolution, volley rate unchanged', () => {
  const { sim, w } = mk(R, { evo: null }); crowd(sim, 14);
  run(sim, 10); assert.equal(w.rt.wyrm, undefined);
});

test('determinism: same seed, same serpent every second; no RNG drawn (stream matches the base twin)', () => {
  const trace = () => { const { sim, w } = mk(R, { seed: 11 }); crowd(sim, 30, 120, 0, 11); const out = []; let k = 0; run(sim, 15, () => { if (++k % 60 === 0 && w.rt.wyrm) out.push([w.rt.wyrm.on, +w.rt.wyrm.cx.toFixed(3), +w.rt.wyrm.hx.toFixed(3), +w.rt.wyrm.hy.toFixed(3)]); }); return JSON.stringify(out) + sim.rng.next(); };
  assert.equal(trace(), trace());
  const a = mk(R, { seed: 4 }), b = mk(R, { seed: 4, evo: null });
  for (const x of [a, b]) crowd(x.sim, 20);
  run(a.sim, 8); run(b.sim, 8);
  assert.equal(a.sim.rng.next(), b.sim.rng.next());
});

test('never below base: same ranks, the evolution deals at least the base damage (sparse, crowd, boss)', () => {
  const dmg = (evo, setup) => { const { sim } = mk({ count: 2, area: 3, duration: 3, power: 3 }, { evo }); setup(sim); run(sim, 14); return sim.dmgBy[ID] || 0; };
  const setups = { sparse: (s) => { put(s, 100, 0); put(s, -90, 60); }, crowd: (s) => crowd(s, 30, 110, 0, 12), boss: (s) => { const e = put(s, 110, 0, 22); e.boss = true; } };
  for (const [k, f] of Object.entries(setups)) assert.ok(dmg(EVO, f) >= dmg(null, f) - 1e-9, k);
});
