import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LifeMap } from '../src/world/lifemap.js';

const sum = (m) => m.life.reduce((a, b) => a + b, 0);

test('stamp raises life at the centre and nowhere far away', () => {
  const m = new LifeMap();
  m.stamp(2000, 2000, 90, 1);
  assert.ok(m.sample(2000, 2000) > 0.9);
  assert.equal(m.sample(2500, 2000), 0);
});

test('decay reaches zero in about decay seconds', () => {
  const m = new LifeMap({ decay: 25 });
  m.stamp(1000, 1000, 60, 1);
  for (let t = 0; t < 12.5; t += 1 / 60) m.update(1 / 60);
  const mid = m.sample(1000, 1000);
  assert.ok(mid > 0.35 && mid < 0.65, `mid ${mid}`);
  for (let t = 0; t < 13.5; t += 1 / 60) m.update(1 / 60);
  assert.equal(sum(m), 0);
});

test('stamps near and past the edges are clipped, never throw, stay finite', () => {
  const m = new LifeMap();
  for (const [x, y] of [[0, 0], [4000, 4000], [-500, 100], [9999, 9999], [100, -80]]) m.stamp(x, y, 120, 1);
  m.stampLine(-100, -100, 5000, 5000, 80, 1);
  for (const v of m.life) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1);
  assert.ok(m.sample(1, 1) > 0);
  assert.equal(m.sample(-5000, 0), 0);
  assert.equal(m.sample(0, 99999), 0);
});

test('bad inputs are ignored (no NaN)', () => {
  const m = new LifeMap();
  m.stamp(NaN, 5, 50, 1); m.stamp(5, 5, NaN, 1); m.stamp(5, 5, 50, NaN); m.stamp(Infinity, 0, 50, 1);
  m.stampLine(0, 0, NaN, 10, 50, 1);
  assert.equal(m.update(NaN), false);
  assert.equal(m.update(-1), false);
  assert.equal(sum(m), 0);
  assert.equal(m.sample(NaN, 0), 0);
});

test('stamp is a max-blend (never adds above 1) and strength is clamped', () => {
  const m = new LifeMap();
  for (let i = 0; i < 20; i++) m.stamp(500, 500, 80, 5);
  assert.ok(m.life.every((v) => v <= 1));
});

test('rgba buffer: R follows life, alpha stays 255, upload only on a 0.1s step', () => {
  const m = new LifeMap();
  m.stamp(2000, 2000, 80, 1);
  assert.equal(m.update(0.05), false);
  assert.equal(m.update(0.06), true);
  const c = Math.floor(2000 / m.cell);
  const o = (c * m.n + c) * 4;
  assert.ok(m.rgba[o] > 200);
  for (let i = 3; i < m.rgba.length; i += 4) assert.equal(m.rgba[i], 255);
});

test('huge dt is clamped (no wipe from a hitch beyond 1s step)', () => {
  const m = new LifeMap({ decay: 25 });
  m.stamp(2000, 2000, 60, 1);
  m.update(1e9);
  assert.ok(m.sample(2000, 2000) > 0.8);
});

test('stampLine leaves a continuous ribbon', () => {
  const m = new LifeMap();
  m.stampLine(1000, 1000, 1600, 1000, 40, 1);
  for (let x = 1000; x <= 1600; x += 10) assert.ok(m.sample(x, 1000) > 0.7, `gap at ${x}`);
});
