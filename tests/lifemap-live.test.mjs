// FIX4g: a stamp reaches the 8-bit buffer at once (and is tracked for a per-frame partial upload); update() clears the pending range and stays consistent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LifeMap } from '../src/world/lifemap.js';

test('stamp writes R immediately and records the rows; update() clears them and keeps the same bytes', () => {
  const m = new LifeMap({ n: 64, world: 640, decay: 25 });
  m.update(0.1); // settle
  assert.ok(m.sy1 < m.sy0);
  m.stamp(320, 320, 40, 1);
  const k = (31 * 64 + 31) * 4;
  assert.ok(m.rgba[k] > 200, 'centre byte is lit before any update');
  assert.ok(m.sy0 <= 31 && m.sy1 >= 31 && m.sy1 - m.sy0 < 16, 'only the stamped band is pending');
  const before = m.rgba[k];
  m.update(0.1);
  assert.ok(m.sy1 < m.sy0, 'pending range cleared by update');
  assert.ok(Math.abs(m.rgba[k] - before) <= 3, 'update only applies a decay step');
});

test('floor stamps and corruption do not touch the live byte range', () => {
  const m = new LifeMap({ n: 32, world: 320 });
  m.update(0.1);
  m.stamp(160, 160, 30, 1, m.floor);
  assert.ok(m.sy1 < m.sy0);
  m.stampCorr(160, 160, 30, 0.5);
  assert.ok(m.sy1 < m.sy0);
});
