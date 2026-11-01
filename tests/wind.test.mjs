import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wind, lean, gust, visualRng, windScale, ambientCap, REDUCED_SCALE, GUST_MIN, GUST_MAX } from '../src/gfx/wind.js';
import { CAPS } from '../src/gfx/quality.js';

test('wind is deterministic and bounded', () => {
  for (let t = 0; t < 300; t += 0.37) for (const [x, y] of [[0, 0], [1234, 56], [3999, 3999], [-50, 2000]]) {
    const a = wind(x, y, t); const b = wind(x, y, t);
    assert.deepEqual(a, b);
    assert.ok(Math.abs(a.x) <= 1 && Math.abs(a.y) <= 1);
  }
});

test('wind survives bad input and extreme scale', () => {
  assert.deepEqual(wind(NaN, 0, 0), { x: 0, y: 0 });
  assert.deepEqual(wind(0, 0, Infinity), { x: 0, y: 0 });
  assert.equal(gust(-5), 0);
  assert.equal(gust(NaN), 0);
  const w = wind(10, 10, 20, 99);
  assert.ok(Math.abs(w.x) <= 1);
  assert.deepEqual(wind(10, 10, 20, -3), { x: 0, y: 0 });
});

test('reduced motion scale is a quarter', () => {
  assert.equal(windScale(true), REDUCED_SCALE);
  assert.equal(windScale(false), 1);
  let mx = 0; let mr = 0;
  for (let t = 0; t < 120; t += 0.5) { mx = Math.max(mx, Math.abs(wind(500, 500, t).x)); mr = Math.max(mr, Math.abs(wind(500, 500, t, windScale(true)).x)); }
  assert.ok(mr <= mx * 0.26 && mr > 0);
});

test('no flicker: wind changes slowly (period >= 6 s)', () => {
  let maxStep = 0; let prev = wind(800, 800, 0).x;
  for (let t = 0.05; t < 200; t += 0.05) { const v = wind(800, 800, t).x; maxStep = Math.max(maxStep, Math.abs(v - prev)); prev = v; }
  assert.ok(maxStep < 0.08, 'max 50 ms step ' + maxStep);
});

test('wind varies across space (travelling wave) and lean scales amplitude', () => {
  assert.notEqual(wind(0, 0, 5).x, wind(900, 0, 5).x);
  assert.equal(lean(100, 100, 5, 3), wind(100, 100, 5).x * 3);
});

test('gusts: one bump per 10-14 s slot, none at slot start', () => {
  let peaks = 0; let was = 0; let last = -99; const gaps = [];
  for (let t = 0; t < 400; t += 0.1) {
    const g = gust(t);
    assert.ok(g >= 0 && g <= 1);
    if (g > 0.9 && was <= 0.9) { peaks++; if (last > 0) gaps.push(t - last); last = t; }
    was = g;
  }
  assert.ok(peaks >= 400 / GUST_MAX - 2 && peaks <= 400 / GUST_MIN + 1, 'peaks ' + peaks);
  for (const g of gaps) assert.ok(g >= GUST_MIN - 4 && g <= GUST_MAX + 4, 'gap ' + g);
  assert.equal(gust(0), 0);
});

test('visual RNG: own stream, deterministic, never touches Math.random or the sim', () => {
  const a = visualRng(5); const b = visualRng(5); const c = visualRng(6);
  const xs = Array.from({ length: 50 }, a); const ys = Array.from({ length: 50 }, b); const zs = Array.from({ length: 50 }, c);
  assert.deepEqual(xs, ys);
  assert.notDeepEqual(xs, zs);
  assert.ok(xs.every((v) => v >= 0 && v < 1));
  const src = readFileSync(new URL('../src/gfx/wind.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random/.test(src));
  assert.ok(!/sim\//.test(src.replace(/\/\/.*$/gm, '')), 'wind.js must not import from src/sim');
});

test('sim does not import wind (sim stays byte-identical)', () => {
  for (const f of ['Sim.js', 'weapons.js', 'cards.js', 'rng.js', 'grid.js']) {
    const src = readFileSync(new URL('../src/sim/' + f, import.meta.url), 'utf8');
    assert.ok(!/^import .*(wind|gfx[/])/m.test(src), f);
  }
});

test('ambient caps per tier: High 165 / Med 85 / Low ~2, parts fit the total, strictly ordered', () => {
  assert.equal(CAPS.high.ambient.total, 165);
  assert.equal(CAPS.med.ambient.total, 85);
  assert.equal(CAPS.low.ambient.total, 2);
  for (const t of ['low', 'med', 'high']) {
    const a = ambientCap(t);
    const parts = a.sway + a.motes + a.fireflies + a.critters + a.petals + a.bloom;
    assert.ok(parts <= a.total, t + ' parts ' + parts);
    for (const v of Object.values(a)) assert.ok(Number.isInteger(v) && v >= 0);
  }
  assert.ok(CAPS.high.ambient.total > CAPS.med.ambient.total && CAPS.med.ambient.total > CAPS.low.ambient.total);
  assert.equal(CAPS.low.ambient.sway, 0); // Low: still tufts baked into the tile
  assert.equal(ambientCap('nonsense').total, 2); // unknown tier -> Low
  assert.ok(CAPS.high.ambient.total <= 0.28 * 600 + 1); // <= 28% of the 600 sprite budget
});
