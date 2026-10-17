import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FogField, AirField, EdgeField, TINTS, COLD, WARM, airCount, FOG_ALPHA, FOG_EDGE_GAIN, FOG_DENS_ALIVE, FLY_ALPHA, MOTE_ALPHA, FLY_SIZE, MOTE_SIZE, FLY_MAX, MOTE_MAX, FOG_MAX, EDGE_T, AIR_M, FOG_M } from '../src/gfx/airfield.js';
import { AirLayer, FOG_DEPTH, AIR_DEPTH, EDGE_DEPTH, makeEdgeTextures } from '../src/gfx/airlayer.js';
import { CritterField, candidate, quotas, critterCap, frameOf, hopLift, ORDER, SPARROW, HARE, MOTH, TRIGGER, HUSH_R, HUSH_CRIT_R, HUSH_N, CALM_S, LIFE_MIN, MIN_HERO_DIST, MIN_ENEMY_DIST, CELL, S_FLEE, S_HUSH, S_IDLE, FLEE_SPEED, SWARM_R } from '../src/gfx/critters.js';
import { CritterLayer, GROUND_DEPTH, AIR_DEPTH as CRIT_AIR_DEPTH } from '../src/gfx/critterlayer.js';
import { drawCritterAtlas, FRAME_NAMES, FRAME_COUNT, COLS, ROWS, FRAME_PX, COLORS } from '../src/gfx/critteratlas.js';
import { CAPS } from '../src/gfx/quality.js';
import { PAL, ROLE } from '../src/gfx/palette.js';

const alive = { sampleClean: () => 1, sampleCorr: () => 0, sample: () => 1 };
const dead = { sampleClean: () => 0, sampleCorr: () => 0, sample: () => 0 };
const view = (x, y, w = 640, h = 360) => ({ x0: x, y0: y, x1: x + w, y1: y + h });
const sat = (c) => { const r = c >> 16 & 255; const g = c >> 8 & 255; const b = c & 255; const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
const hue = (c) => { const r = (c >> 16 & 255) / 255; const g = (c >> 8 & 255) / 255; const b = (c & 255) / 255; const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const d = mx - mn; if (d === 0) return 0; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; return h < 0 ? h + 360 : h; };
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const PICKUPS = [ROLE.pickup, ROLE.heart, ROLE.magnet, PAL.gold, ROLE.evo].filter((c) => typeof c === 'number');

test('caps: atmos fog High 6 / Med 4 / Low 0, edge on every tier; critters 5 / 3 / 2; motes + fireflies keep their caps', () => {
  assert.equal(CAPS.high.atmos.fog, 6); assert.equal(CAPS.med.atmos.fog, 4); assert.equal(CAPS.low.atmos.fog, 0);
  for (const t of ['low', 'med', 'high']) assert.equal(CAPS[t].atmos.edge, 4);
  assert.deepEqual([CAPS.high.ambient.critters, CAPS.med.ambient.critters, CAPS.low.ambient.critters], [5, 3, 2]);
  assert.deepEqual([CAPS.high.ambient.motes, CAPS.med.ambient.motes, CAPS.low.ambient.motes], [28, 14, 0]);
  assert.deepEqual([CAPS.high.ambient.fireflies, CAPS.med.ambient.fireflies, CAPS.low.ambient.fireflies], [24, 10, 0]);
  assert.ok(FOG_MAX >= 6 && FLY_MAX >= 24 && MOTE_MAX >= 28);
  assert.equal(airCount(6, { phone: false }), 6); assert.equal(airCount(6, { phone: true }), 3); assert.equal(airCount(0), 0); assert.equal(airCount(NaN), 0); assert.equal(airCount(1, { phone: true }), 1);
  assert.equal(airCount(99, { max: 6 }), 6);
  assert.equal(critterCap(5, {}), 5); assert.equal(critterCap(5, { phone: true }), 3); assert.equal(critterCap(0), 0); assert.equal(critterCap(2, { phone: true }), 1);
});

test('fog: deterministic, low contrast, thick over the Hollow, thin over restored ground, thicker at the map edge, bounded, no NaN', () => {
  const run = (life, seed = 5, steps = 60, px = 2000, py = 2000) => {
    const f = new FogField(seed); f.setBudget(6);
    for (let i = 0; i < steps; i++) f.update(0.05, i * 0.05, view(px, py), life, 0.3, 0, false, 4000);
    return f;
  };
  const a = run(dead); const b = run(dead);
  assert.deepEqual(Array.from(a.a), Array.from(b.a)); assert.deepEqual(Array.from(a.x), Array.from(b.x));
  assert.notDeepEqual(Array.from(run(dead, 6).x), Array.from(a.x), 'seed changes the layout');
  const h = run(dead, 5, 120); const r = run(alive, 5, 120);
  const mean = (f) => { let s = 0; for (let i = 0; i < 6; i++) s += f.dens[i]; return s / 6; };
  assert.ok(mean(r) < mean(h) * 0.5, 'restored ground thins the fog: ' + mean(r) + ' vs ' + mean(h));
  assert.ok(Math.abs(mean(r) - FOG_DENS_ALIVE) < 0.02, 'settles at the alive density');
  const edge = run(dead, 5, 120, 100, 100);
  const midMax = Math.max(...Array.from(h.a)); const edgeMax = Math.max(...Array.from(edge.a));
  assert.ok(edgeMax >= midMax * 0.9);
  for (const f of [h, r, edge]) for (let i = 0; i < 6; i++) {
    assert.ok(f.a[i] >= 0 && f.a[i] <= FOG_ALPHA * (1 + FOG_EDGE_GAIN) * 1.3 + 1e-6, 'alpha bound ' + f.a[i]);
    assert.ok(Number.isFinite(f.x[i]) && Number.isFinite(f.y[i]));
  }
  assert.ok(FOG_ALPHA <= 0.2, 'low-contrast peak');
  // corruption thickens it
  const cor = { sampleClean: () => 0, sampleCorr: () => 1 };
  assert.ok(mean(run(cor, 5, 120)) > mean(h));
  // bad inputs: NaN wind / life / dt never poison the state
  const f = new FogField(1); f.setBudget(6);
  f.update(NaN, NaN, view(0, 0), { sampleClean: () => NaN, sampleCorr: () => NaN }, NaN, NaN, false, 4000);
  f.update(0.05, 1, view(0, 0), alive, NaN, NaN, false, 4000);
  for (let i = 0; i < 6; i++) assert.ok(Number.isFinite(f.a[i]) && Number.isFinite(f.x[i]) && Number.isFinite(f.dens[i]));
  // stays inside the view + margin (wrap)
  const v = view(1000, 800);
  const g = run(dead, 9, 400, 1000, 800);
  for (let i = 0; i < 6; i++) assert.ok(g.x[i] >= v.x0 - FOG_M - 1 && g.x[i] <= v.x1 + FOG_M + 1 && g.y[i] >= v.y0 - FOG_M - 1 && g.y[i] <= v.y1 + FOG_M + 1);
  // budget 0 = nothing written
  const z = new FogField(1); z.setBudget(0); z.update(0.05, 1, view(0, 0), alive, 0, 0, false); assert.equal(z.a[0], 0);
  // reduced motion: banks barely move
  const rm = new FogField(2); rm.setBudget(3); const nm = new FogField(2); nm.setBudget(3);
  for (let i = 0; i < 100; i++) { rm.update(0.05, i * 0.05, view(0, 0), dead, 1, 0, true); nm.update(0.05, i * 0.05, view(0, 0), dead, 1, 0, false); }
  assert.ok(Math.abs(rm.ax[0]) < Math.abs(nm.ax[0]) * 0.4);
});

test('fireflies + motes: counts follow the caps, warm cream over restored ground, cold pale over the Hollow, never a pickup colour, bounded alpha, size', () => {
  const mk = (cap, life, steps = 80) => {
    const f = new AirField(3); f.setBudget(cap.f, cap.m);
    for (let i = 0; i < steps; i++) f.update(0.05, i * 0.05, view(1000, 1000), life, 0.2, 0.05, false);
    return f;
  };
  const hi = mk({ f: CAPS.high.ambient.fireflies, m: CAPS.high.ambient.motes }, alive);
  assert.equal(hi.count, 52); assert.equal(hi.nFly, 24); assert.equal(hi.nMote, 28);
  const lo = mk({ f: CAPS.low.ambient.fireflies, m: CAPS.low.ambient.motes }, alive);
  assert.equal(lo.count, 0);
  const warm = mk({ f: 24, m: 28 }, alive, 160); const cold = mk({ f: 24, m: 28 }, dead, 160);
  for (let j = 0; j < 52; j++) {
    const i = warm.indexOf(j);
    assert.equal(warm.tint[i], 8, 'warm cream over restored ground'); assert.equal(cold.tint[i], 0, 'cold pale in the Hollow');
    assert.ok(warm.a[i] <= FLY_ALPHA + 1e-6 && cold.a[i] <= FLY_ALPHA * 0.56 + 1e-6, 'R2 alpha, Hollow ones dimmer');
    assert.ok(Number.isFinite(warm.x[i]) && Number.isFinite(warm.y[i]) && Number.isFinite(warm.a[i]));
  }
  assert.ok(FLY_ALPHA <= 0.6 && MOTE_ALPHA <= 0.6 && FLY_SIZE <= 6 && MOTE_SIZE <= FLY_SIZE);
  // palette: every tint is a pale desaturated cream / cold grey, far from every pickup colour
  assert.equal(TINTS[0], COLD); assert.equal(TINTS[8], WARM);
  for (const c of TINTS) {
    assert.ok(sat(c) < 0.36, 'pale: ' + c.toString(16));
    for (const p of PICKUPS) assert.ok(sat(p) - sat(c) > 0.12 || hueDist(hue(p), hue(c)) > 28, `tint ${c.toString(16)} vs pickup ${p.toString(16)}`);
    assert.ok((c >> 16 & 255) > 150 && (c >> 8 & 255) > 150 && (c & 255) > 150, 'bright pale');
  }
  // determinism + wrap
  const a = mk({ f: 24, m: 28 }, alive, 40); const b = mk({ f: 24, m: 28 }, alive, 40);
  assert.deepEqual(Array.from(a.x), Array.from(b.x)); assert.deepEqual(Array.from(a.a), Array.from(b.a));
  const v = view(1000, 1000);
  for (let j = 0; j < 52; j++) { const i = a.indexOf(j); assert.ok(a.x[i] >= v.x0 - AIR_M - 8 && a.x[i] <= v.x1 + AIR_M + 8 && a.y[i] >= v.y0 - AIR_M - 6 && a.y[i] <= v.y1 + AIR_M + 6); }
  // NaN safety
  const n = new AirField(1); n.setBudget(24, 28);
  n.update(NaN, NaN, view(0, 0), { sampleClean: () => NaN }, NaN, NaN, false); n.update(0.05, 1, view(0, 0), alive, NaN, NaN, false);
  for (let j = 0; j < 52; j++) { const i = n.indexOf(j); assert.ok(Number.isFinite(n.x[i]) && Number.isFinite(n.a[i])); }
});

test('reduced motion: no fireflies and motes hold still (static positions, steady alpha)', () => {
  const f = new AirField(3); f.setBudget(0, 14);
  for (let i = 0; i < 60; i++) f.update(0.05, i * 0.05, view(1000, 1000), alive, 0.5, 0, true); // let the life smoothing settle
  const x0 = Array.from(f.x); const a0 = Array.from(f.a);
  for (let i = 60; i < 120; i++) f.update(0.05, i * 0.05, view(1000, 1000), alive, 1, 0.3, true);
  assert.deepEqual(Array.from(f.x), x0, 'static'); assert.deepEqual(Array.from(f.a), a0, 'no blink');
  // the layer drops fireflies and halves motes in reduced motion (source check + behaviour below)
  const src = readFileSync(new URL('../src/gfx/airlayer.js', import.meta.url), 'utf8');
  assert.ok(/if \(reduced\) \{ nFly = 0; nMote >>= 1; \}/.test(src));
});

test('edge wall: strips only appear within EDGE_T of the boundary, inside the world, 4 images max', () => {
  const e = new EdgeField();
  e.update(view(1500, 1500), 4000); assert.equal(e.n, 0);
  e.update(view(0, 1500), 4000); assert.equal(e.n, 1); assert.equal(e.side[0], 0); assert.equal(e.x[0], 0); assert.equal(e.w[0], EDGE_T);
  e.update(view(3360, 3640), 4000); assert.equal(e.n, 2); assert.deepEqual([e.side[0], e.side[1]], [1, 3]);
  assert.equal(e.x[0], 4000 - EDGE_T); assert.equal(e.y[1], 4000 - EDGE_T);
  e.update(view(0, 0, 4000, 4000), 4000); assert.equal(e.n, 4);
  e.update(view(0, 0, 200, 120), 4000); assert.equal(e.n, 2); // top-left corner: left + top
  assert.ok(EDGE_T > 60 && EDGE_T < 260);
});

// ------------------------------------------------------------------------------------------------ critters
const NONE = [];
function mkField(cap, seed = 11, reduced = false) { const f = new CritterField(seed); f.setBudget(cap, reduced); return f; }
function settle(f, secs, hero, enemies = NONE, life = alive, v = view(1700, 1700), t0 = 0, dt = 0.05) {
  let t = t0;
  for (let i = 0; i < secs / dt; i++) { t += dt; f.update(dt, t, v, hero, life, enemies, enemies.length, f.reduced); }
  return t;
}
const HERO = { x: 2000, y: 1880 };

test('candidate: deterministic pure placement, inside its cell and the world, unique keys, seed changes the layout, kinds all appear', () => {
  const o = { kind: 0, x: 0, y: 0, key: 0, h: 0 }; const o2 = { kind: 0, x: 0, y: 0, key: 0, h: 0 };
  const keys = new Set(); const kinds = [0, 0, 0]; let n = 0;
  for (let cy = 0; cy < 16; cy++) for (let cx = 0; cx < 16; cx++) {
    const a = candidate(5, cx, cy, o); const b = candidate(5, cx, cy, o2);
    assert.equal(a, b);
    if (!a) continue;
    assert.deepEqual(o, o2); n++; kinds[o.kind]++;
    assert.ok(o.x >= 200 && o.y >= 200 && o.x <= 3800 && o.y <= 3800);
    assert.equal(Math.floor(o.x / CELL), cx); assert.equal(Math.floor(o.y / CELL), cy);
    assert.ok(!keys.has(o.key)); keys.add(o.key);
  }
  assert.ok(n > 60 && kinds.every((k) => k > 8), 'all kinds: ' + kinds);
  const s1 = []; const s2 = [];
  for (let cx = 6; cx < 14; cx++) { s1.push(candidate(1, cx, 7, o) ? o.x : -1); s2.push(candidate(2, cx, 7, o) ? o.x : -1); }
  assert.notDeepEqual(s1, s2);
});

test('quotas: order, caps, no moths with reduced motion', () => {
  assert.deepEqual(quotas(5), [2, 1, 2]); assert.deepEqual(quotas(3), [1, 1, 1]); assert.deepEqual(quotas(2), [1, 1, 0]); assert.deepEqual(quotas(0), [0, 0, 0]);
  assert.deepEqual(quotas(5, true), [2, 1, 0]);
  assert.equal(ORDER.length, 5);
});

test('spawn rules: only on restored ground, only when calm, far from the hero and enemies, never above the cap, per-kind quotas, deterministic', () => {
  // Hollow: nothing ever spawns
  const h = mkField(5); settle(h, 30, HERO, NONE, dead); assert.equal(h.live, 0);
  // restored + calm: fills up to the cap but not before the calm spell
  const f = mkField(5);
  settle(f, CALM_S - 1, HERO); assert.equal(f.live, 0, 'not before the calm spell');
  settle(f, 30, HERO, NONE, alive, view(1700, 1700), CALM_S - 1);
  assert.ok(f.live >= 3 && f.live <= 5, 'live ' + f.live);
  const cnt = [0, 0, 0];
  for (const s of f.slots) if (s.on) {
    cnt[s.kind]++;
    assert.ok(Math.hypot(s.x - HERO.x, s.y - HERO.y) >= MIN_HERO_DIST - 1e-6 || s.state !== 0, 'not next to the hero');
  }
  const q = quotas(5);
  for (let k = 0; k < 3; k++) assert.ok(cnt[k] <= q[k], 'quota ' + k);
  // determinism: same inputs -> identical field
  const g = mkField(5); settle(g, CALM_S - 1, HERO); settle(g, 30, HERO, NONE, alive, view(1700, 1700), CALM_S - 1);
  assert.deepEqual(f.slots.map((s) => [s.on, s.kind, s.x, s.y, s.state]), g.slots.map((s) => [s.on, s.kind, s.x, s.y, s.state]));
  // Low cap 2 never exceeds 2; cap 0 never spawns; phone cap 1
  const l = mkField(2); settle(l, 60, HERO); assert.ok(l.live <= 2 && l.live >= 1);
  const z = mkField(0); settle(z, 60, HERO); assert.equal(z.live, 0);
  // enemies near a candidate block it
  const crowd = []; for (let i = 0; i < 40; i++) crowd.push({ x: 1500 + (i % 8) * 70, y: 1500 + Math.floor(i / 8) * 70 });
  const e = mkField(5); settle(e, 30, { x: 3000, y: 3000 }, crowd);
  for (const s of e.slots) if (s.on) for (const c of crowd) assert.ok(Math.hypot(s.x - c.x, s.y - c.y) >= HUSH_CRIT_R - 1e-6 || s.state === S_HUSH);
});

test('flee rule: a critter runs AWAY from the hero when it comes within its trigger radius, then fades out and leaves; a far hero scares nothing', () => {
  const f = mkField(5); let t = settle(f, 30, HERO);
  const s = f.slots.find((x) => x.on && x.kind === HARE) || f.slots.find((x) => x.on && x.kind === SPARROW);
  assert.ok(s, 'a ground critter exists');
  for (const x of f.slots) assert.ok(!x.on || x.state === S_IDLE || x.state === 0, 'idle while the hero is far');
  const kind = s.kind; const x0 = s.x; const y0 = s.y;
  const hero = { x: s.x - (TRIGGER[kind] - 10), y: s.y }; // hero just inside the trigger, to the left
  f.update(0.05, (t += 0.05), view(1700, 1700), hero, alive, NONE, 0);
  assert.equal(s.state, S_FLEE, 'flees');
  const d0 = Math.hypot(s.x - hero.x, s.y - hero.y);
  for (let i = 0; i < 12; i++) f.update(0.05, (t += 0.05), view(1700, 1700), hero, alive, NONE, 0);
  assert.ok(Math.hypot(s.x - hero.x, s.y - hero.y) > d0 + 10, 'moved away from the hero');
  assert.ok(Math.sign(s.x - x0) >= 0 || Math.abs(s.x - x0) < 40, 'to the far side');
  assert.ok(Math.hypot(s.vx, s.vy) <= FLEE_SPEED[kind] + 1e-6);
  settle(f, 2, hero, NONE, alive, view(1700, 1700), t);
  assert.ok(!s.on || s.a === 0 || s.key !== -1 && s.state !== S_FLEE, 'gone after the run');
  assert.ok(Math.hypot(s.x - x0, s.y - y0) > 5 || !s.on);
  // trigger radii are ordered: moths let you closer than hares
  assert.ok(TRIGGER[MOTH] < TRIGGER[SPARROW] && TRIGGER[SPARROW] < TRIGGER[HARE]);
});

test('hush rule: an enemy near the hero or a critter, or a swarm, hushes everything; they stay away until the calm spell has passed', () => {
  const mkSet = () => { const f = mkField(5); const t = settle(f, 30, HERO); assert.ok(f.live >= 3); return [f, t]; };
  // enemy close to the hero
  let [f, t] = mkSet();
  const en = [{ x: HERO.x + HUSH_R - 20, y: HERO.y }];
  t = settle(f, 1.2, HERO, en, alive, view(1700, 1700), t);
  assert.equal(f.live, 0, 'all hushed within ~1 s');
  assert.ok(f.hush);
  // while the enemy stays, nothing returns; after it leaves they come back only after CALM_S
  t = settle(f, 20, HERO, en, alive, view(1700, 1700), t); assert.equal(f.live, 0);
  t = settle(f, CALM_S - 2, HERO, NONE, alive, view(1700, 1700), t); assert.equal(f.live, 0, 'still quiet');
  t = settle(f, 40, HERO, NONE, alive, view(1700, 1700), t); assert.ok(f.live >= 1, 'they return');
  // swarm far from the hero but numerous in range
  [f, t] = mkSet();
  const swarm = []; for (let i = 0; i < HUSH_N; i++) swarm.push({ x: HERO.x + 200 + i, y: HERO.y + 250 });
  assert.ok(Math.hypot(200, 250) > HUSH_R && Math.hypot(200 + HUSH_N, 250) < SWARM_R);
  t = settle(f, 1.2, HERO, swarm, alive, view(1700, 1700), t); assert.equal(f.live, 0);
  // 11 enemies is not a swarm
  [f, t] = mkSet();
  t = settle(f, 2, HERO, swarm.slice(0, HUSH_N - 1), alive, view(1700, 1700), t); assert.ok(f.live >= 1);
  // an enemy near one critter hushes that critter only
  [f, t] = mkSet();
  const victim = f.slots.find((x) => x.on && x.state === S_IDLE);
  const near = [{ x: victim.x + HUSH_CRIT_R - 15, y: victim.y }];
  if (Math.hypot(near[0].x - HERO.x, near[0].y - HERO.y) > HUSH_R) { t = settle(f, 0.3, HERO, near, alive, view(1700, 1700), t); assert.ok(victim.state === S_HUSH || !victim.on); }
  // ground going back to grey sends them away too
  [f, t] = mkSet();
  t = settle(f, 2, HERO, NONE, dead, view(1700, 1700), t); assert.equal(f.live, 0);
});

test('reduced motion: critters stay put (no hop, no moths); an approaching hero just makes them settle away', () => {
  const f = mkField(5, 11, true); let t = settle(f, 40, HERO);
  assert.ok(f.live >= 1);
  for (const s of f.slots) if (s.on) { assert.notEqual(s.kind, MOTH); }
  const snap = f.slots.filter((s) => s.on).map((s) => [s.x, s.y]);
  t = settle(f, 20, HERO, NONE, alive, view(1700, 1700), t);
  const now = f.slots.filter((s) => s.on).map((s) => [s.x, s.y]);
  assert.deepEqual(now.slice(0, snap.length), snap.slice(0, now.length), 'perched still');
  const s = f.slots.find((x) => x.on);
  f.update(0.05, t + 0.05, view(1700, 1700), { x: s.x - 20, y: s.y }, alive, NONE, 0, true);
  assert.equal(s.state, S_HUSH); assert.equal(s.vx, 0);
  assert.equal(frameOf({ kind: SPARROW, state: S_IDLE, z: 0, ph: 0, hop: 0 }, 0.1, true), 0, 'no pecking');
});

test('no NaN / bad input: nothing breaks on NaN hero, NaN enemies, empty view, huge dt, and slots stay consistent', () => {
  const f = mkField(5);
  const bad = [{ x: NaN, y: NaN }, { x: Infinity, y: 0 }];
  f.update(NaN, NaN, view(0, 0), { x: NaN, y: NaN }, alive, bad, 2, false);
  settle(f, 20, HERO, bad); settle(f, 20, { x: NaN, y: 5 });
  f.update(1e9, 5, view(1700, 1700), HERO, { sampleClean: () => NaN }, NONE, 0, false);
  for (const s of f.slots) { assert.ok(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.a) && Number.isFinite(s.z)); assert.ok(s.a >= 0 && s.a <= 1.0001); }
  let live = 0; for (const s of f.slots) if (s.on) live++;
  assert.equal(live, f.live); assert.ok(live <= 5);
  for (const s of f.slots) if (s.on) { const fr = frameOf(s, 3.3); assert.ok(Number.isInteger(fr) && fr >= 0 && fr < FRAME_COUNT); assert.ok(Number.isFinite(hopLift(s, 3.3))); }
  f.setBudget(0); assert.equal(f.live, 0);
});

test('critters never touch the sim: no sim import in any new module, no sim RNG, no Math.random', () => {
  for (const file of ['airfield.js', 'airlayer.js', 'critters.js', 'critterlayer.js', 'critteratlas.js']) {
    const src = readFileSync(new URL('../src/gfx/' + file, import.meta.url), 'utf8');
    assert.ok(!/from '\.\.\/sim|import.*src\/sim|rng\.js|createRng/.test(src), file + ' imports no sim');
    assert.ok(!/Math\.random/.test(src), file + ' uses no Math.random');
  }
  const sc = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(/sim\.enemies, sim\.enemies\.length, cs/.test(sc), 'enemies are only passed as read-only data');
  assert.ok(/this\.air\.update\(dt, sim\.time, view, this\.life, this\.airSt\)/.test(sc));
  assert.ok(/cs\.on = !!\(P\.critters && this\.gbOn/.test(sc), 'critters need the restored-ground look (Med/High)');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  for (const k of ['fog', 'motes', 'critters', 'edge']) assert.ok(new RegExp(`${k}: q\\.get\\('${k}'\\) !== '0'`).test(app), 'flag ?' + k + '=0');
});

test('critter atlas: 8 named frames, draws with a fake 2D context, colours are warm tan/cream (not pickup hues, no glow colours)', () => {
  assert.equal(FRAME_COUNT, 8); assert.equal(FRAME_NAMES.length, COLS * ROWS);
  const calls = { n: 0 };
  const ctx = new Proxy({}, { get(t, k) { if (k === 'createLinearGradient') return () => ({ addColorStop() {} }); if (k in t) return t[k]; return (...a) => { calls.n++; for (const x of a) if (typeof x === 'number' && !Number.isFinite(x)) throw new Error('NaN in ' + String(k)); }; }, set(t, k, v) { t[k] = v; return true; } });
  drawCritterAtlas({ width: FRAME_PX * COLS, height: FRAME_PX * ROWS, getContext: () => ctx });
  assert.ok(calls.n > 200);
  for (const list of Object.values(COLORS)) for (const c of list) {
    const hex = (c[0] << 16) | (c[1] << 8) | c[2];
    assert.ok(c[0] >= c[2], 'warm (r >= b)'); assert.ok(sat(hex) < 0.55);
    for (const p of PICKUPS) assert.ok(sat(p) - sat(hex) > 0.1 || hueDist(hue(p), hue(hex)) > 20 || (Math.max(p >> 16 & 255, p >> 8 & 255, p & 255) - Math.max(c[0], c[1], c[2])) / 255 > 0.15, 'not a pickup hue (or clearly darker): ' + hex.toString(16) + ' vs ' + p.toString(16));
  }
});

// a recording fake Phaser scene: images keep their last setters so depth/visibility can be checked
function fakeScene() {
  const made = [];
  const mkImg = () => {
    const st = { x: 0, y: 0, a: 1, depth: 0, vis: true, frame: null };
    const o = new Proxy(st, { get(t, k) {
      if (k in t) return t[k];
      return (...a) => {
        for (const x of a) if (typeof x === 'number' && !Number.isFinite(x)) throw new Error('NaN in ' + String(k));
        if (k === 'setPosition') { t.x = a[0]; t.y = a[1]; } else if (k === 'setAlpha') t.a = a[0]; else if (k === 'setDepth') t.depth = a[0]; else if (k === 'setVisible') t.vis = a[0]; else if (k === 'setFrame') t.frame = a[0];
        return o;
      };
    } });
    made.push(o);
    return o;
  };
  return { made, scene: { add: { image: mkImg }, textures: { exists: () => false, remove() {}, addCanvas() {} } } };
}

test('AirLayer: depths keep fog + edge under the lightmap and the motes under every creature; pooled; caps respected; flags and Low respected', () => {
  assert.ok(FOG_DEPTH < 5000 && FOG_DEPTH > 4000, 'fog above props (y <= 4000), under the lightmap (5000)');
  assert.ok(EDGE_DEPTH < 5000 && EDGE_DEPTH > FOG_DEPTH - 1);
  assert.ok(AIR_DEPTH < 55000 && AIR_DEPTH > 5000, 'motes below D_HALO (55000) and every creature (60000+)');
  assert.ok(GROUND_DEPTH < 0 && CRIT_AIR_DEPTH < 5000, 'critters under props/lightmap/creatures');
  const { scene, made } = fakeScene();
  const L = new AirLayer(scene, { world: 4000, blendAdd: 1 });
  const st = (tier, o = {}) => ({ caps: CAPS[tier], phone: false, reduced: false, fog: true, motes: true, edge: true, ...o });
  const vw = view(1000, 1000);
  for (let i = 0; i < 80; i++) L.update(0.05, i * 0.05, vw, alive, st('high'));
  const vis = (pred) => made.filter((m) => m.vis && pred(m));
  assert.equal(vis((m) => m.depth === FOG_DEPTH).length <= 6, true);
  assert.ok(vis((m) => m.depth >= AIR_DEPTH && m.depth < AIR_DEPTH + 1).length <= 52 && vis((m) => m.depth >= AIR_DEPTH).length > 30);
  const n1 = made.length;
  for (let i = 80; i < 400; i++) L.update(0.05, i * 0.05, vw, i % 2 ? alive : dead, st('high'));
  assert.equal(made.length, n1, 'pooled: no new images over time');
  // Low: no fog, no motes
  const lo = fakeScene(); const LL = new AirLayer(lo.scene, { world: 4000 });
  for (let i = 0; i < 40; i++) LL.update(0.05, i * 0.05, vw, alive, st('low'));
  assert.equal(lo.made.filter((m) => m.vis).length, 0, 'Low shows nothing mid-map');
  assert.equal(LL.count, 0);
  // Low near the edge: edge strips still read
  for (let i = 0; i < 4; i++) LL.update(0.05, 3 + i * 0.05, view(0, 0), alive, st('low'));
  assert.equal(LL.nEdge, 2);
  // flags
  const fl = fakeScene(); const FL = new AirLayer(fl.scene, { world: 4000, blendAdd: 1 });
  for (let i = 0; i < 20; i++) FL.update(0.05, i * 0.05, view(0, 0), alive, st('high', { fog: false, motes: false, edge: false }));
  assert.equal(FL.count, 0); assert.equal(fl.made.filter((m) => m.vis).length, 0);
  // reduced motion: no fireflies, half the motes
  const rm = fakeScene(); const RL = new AirLayer(rm.scene, { world: 4000, blendAdd: 1 });
  for (let i = 0; i < 20; i++) RL.update(0.05, i * 0.05, vw, alive, st('high', { reduced: true }));
  assert.equal(RL.air.nFly, 0); assert.equal(RL.air.nMote, 14);
  // phone: x0.6
  const ph = fakeScene(); const PL = new AirLayer(ph.scene, { world: 4000, blendAdd: 1 });
  for (let i = 0; i < 20; i++) PL.update(0.05, i * 0.05, vw, alive, st('high', { phone: true }));
  assert.equal(PL.nFog, 3); assert.equal(PL.air.nFly, 14); assert.equal(PL.air.nMote, 16);
  // edge textures register both ramps
  const added = []; const sc2 = { textures: { exists: () => false, remove() {}, addCanvas: (k) => added.push(k) } };
  const grad = { addColorStop() {} };
  makeEdgeTextures(sc2, (w, h) => ({ width: w, height: h, getContext: () => ({ createLinearGradient: () => grad, fillRect() {}, set fillStyle(v) {} }) }));
  assert.deepEqual(added, ['edgeH', 'edgeV']);
});

test('CritterLayer: <= cap images, always under creatures, disappears when switched off, hides with hush', () => {
  const { scene, made } = fakeScene();
  const L = new CritterLayer(scene, { world: 4000 });
  const on = { on: true, cap: 5, phone: false, reduced: false };
  const vw = view(1700, 1700);
  let t = 0;
  for (let i = 0; i < 700; i++) { t += 0.05; L.update(0.05, t, vw, HERO, alive, NONE, 0, on); }
  assert.ok(L.count >= 3 && L.count <= 5);
  const shown = made.filter((m) => m.vis && m.frame);
  assert.ok(shown.length >= 3 && shown.length <= 5);
  for (const m of made) assert.ok(m.depth < 5000, 'under the lightmap and every creature');
  const swarm = Array.from({ length: 14 }, (_, i) => ({ x: HERO.x + 100 + i, y: HERO.y + 100 }));
  for (let i = 0; i < 30; i++) { t += 0.05; L.update(0.05, t, vw, HERO, alive, swarm, swarm.length, on); }
  assert.equal(made.filter((m) => m.vis && m.frame).length, 0, 'hushed during a swarm');
  L.update(0.05, t + 1, vw, HERO, alive, NONE, 0, { ...on, on: false });
  assert.equal(L.count, 0);
});
