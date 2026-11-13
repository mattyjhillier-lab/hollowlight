// Smoke test for scripts/pace-v2.mjs pure helpers (no simulation is run here).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gapList, gapFailures, pct, LANDMARKS, VEILED } from '../scripts/pace-v2.mjs';

test('pace-v2 gap helpers', () => {
  assert.deepEqual(gapList([3, 1, null], 10).map((g) => g.gap), [1, 2, 8]);
  assert.equal(gapFailures([1, 2, 3], 60).length, 0);
  assert.equal(gapFailures([1, 8], 60).length, 1); // 7 > 5 before run 30
  assert.equal(gapFailures([40, 47], 60).length, 1); // 40 > 5 from run 0 and 7 after run 30 is fine
  assert.equal(pct([5, 1, 3], 0.5), 3);
});

test('pace-v2 landmark lists are unique and disjoint from the veiled seals', () => {
  assert.equal(new Set(LANDMARKS).size, LANDMARKS.length);
  for (const v of VEILED) assert.ok(!LANDMARKS.includes(v));
});
