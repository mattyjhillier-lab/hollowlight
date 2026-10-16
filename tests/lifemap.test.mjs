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

test('AL-1b starter glade floor: never decays below the floor, survives reset, clearFloor restores old behaviour', () => {
  const m = new LifeMap({ decay: 25 });
  m.stampFloor(1000, 1000, 100, 0.8);
  const v0 = m.sample(1000, 1000);
  assert.ok(v0 > 0.7);
  for (let t = 0; t < 60; t += 1 / 60) m.update(1 / 60);
  assert.ok(Math.abs(m.sample(1000, 1000) - v0) < 1e-6, 'floor holds');
  m.stamp(1000, 1000, 100, 1); // the hero can still push above the floor, then it decays back to it
  for (let t = 0; t < 60; t += 1 / 60) m.update(1 / 60);
  assert.ok(Math.abs(m.sample(1000, 1000) - v0) < 1e-3);
  m.reset();
  assert.ok(Math.abs(m.sample(1000, 1000) - v0) < 1e-6, 'reset keeps the glade');
  assert.equal(m.sample(1500, 1000), 0, 'small: nothing far away');
  m.clearFloor(); m.reset();
  assert.equal(m.sample(1000, 1000), 0);
});

// ---- W3 corruption ----
test('W3 corruption: blooms slowly, caps at 1, fades on its own', () => {
  const m = new LifeMap();
  m.stampCorr(2000, 2000, 42, 0.011);
  const first = m.sampleCorr(2000, 2000);
  assert.ok(first > 0 && first < 0.05, 'one enemy-tick is a small stain');
  for (let i = 0; i < 400; i++) m.stampCorr(2000, 2000, 42, 0.011);
  assert.equal(Math.max(...m.corr), 1, 'clamped at 1');
  for (const v of m.corr) assert.ok(v >= 0 && v <= 1);
  for (let t = 0; t < 30; t += 1 / 60) m.update(1 / 60);
  const mid = m.sampleCorr(2000, 2000);
  assert.ok(mid > 0.3 && mid < 0.7, `mid ${mid}`);
  for (let t = 0; t < 40; t += 1 / 60) m.update(1 / 60);
  assert.equal(m.corr.reduce((a, b) => a + b, 0), 0, 'gone after ~60 s');
  assert.equal(Math.max(...m.rgba.filter((_, i) => i % 4 === 2)), 0);
});

test('W3 corruption: restored ground resists and pushes it back; trails heal it', () => {
  const a = new LifeMap(); const b = new LifeMap();
  b.stamp(2000, 2000, 120, 1);
  for (let i = 0; i < 30; i++) { a.stampCorr(2000, 2000, 60, 0.05); b.stampCorr(2000, 2000, 60, 0.05); }
  assert.ok(a.sampleCorr(2000, 2000) > 0.9);
  assert.ok(b.sampleCorr(2000, 2000) < 0.1, 'life blocks new corruption');
  // heal: corrupt, then the hero walks through
  a.stampLine(1800, 2000, 2200, 2000, 70, 1);
  for (let t = 0; t < 3; t += 1 / 60) a.update(1 / 60);
  assert.ok(a.sampleCorr(2000, 2000) < 0.05, 'trail healed it');
  assert.ok(a.sampleCorr(2000, 2200) < 0.5);
});

test('W3 corruption: bounds, NaN and edges are safe; channel B in the texture buffer', () => {
  const m = new LifeMap();
  for (const [x, y, r, s] of [[NaN, 5, 40, 0.1], [5, Infinity, 40, 0.1], [0, 0, 60, 0.5], [4000, 4000, 60, 0.5], [-300, 50, 80, 1], [9999, 9999, 80, 1], [100, 100, NaN, 1], [100, 100, 40, NaN], [100, 100, 40, -1], [100, 100, -4, 1]]) m.stampCorr(x, y, r, s);
  m.corr[777] = NaN;
  m.update(0.2);
  for (const v of m.corr) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1);
  assert.ok(m.sampleCorr(1, 1) > 0);
  assert.equal(m.sampleCorr(-5000, 0), 0);
  assert.equal(m.sampleCorr(NaN, 0), 0);
  m.stampCorr(2000, 2000, 60, 1); m.update(0.2);
  const j = (Math.floor(2000 / m.cell) * 256 + Math.floor(2000 / m.cell)) * 4;
  assert.ok(m.rgba[j + 2] > 200 && m.rgba[j + 3] === 255);
  m.reset();
  assert.equal(m.corr.reduce((a, b) => a + b, 0), 0);
});

test('W3 corruption: sampleClean (what sway uses) is 0 under heavy corruption, unchanged on clean ground', () => {
  const m = new LifeMap();
  m.stamp(1000, 1000, 100, 1); m.stamp(2000, 2000, 100, 1);
  assert.ok(Math.abs(m.sampleClean(1000, 1000) - m.sample(1000, 1000)) < 1e-9);
  m.corr.fill(1);
  assert.equal(m.sampleClean(2000, 2000), 0);
  m.corr.fill(0.05);
  assert.ok(m.sampleClean(1000, 1000) > 0.95);
});
