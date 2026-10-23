// BL1: High bloom 'B tuned' tuning (bright-pass only, eased in daylight)
import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOOM_DEF, bloomLevel } from '../src/gfx/bloomlevel.js';

test('B tuned: locked night values (threshold ~0.78, strength ~0.5)', () => {
  const n = bloomLevel(BLOOM_DEF, 0);
  assert.equal(n.thresh, 0.78); assert.equal(n.strength, 0.5);
});
test('daylight eases the bloom (higher threshold, lower strength), never stronger', () => {
  const d = bloomLevel(BLOOM_DEF, 1), h = bloomLevel(BLOOM_DEF, 0.5);
  assert.ok(d.thresh > 0.78 && d.thresh < 0.9 && d.strength < 0.5 && d.strength > 0.3);
  assert.ok(h.thresh > 0.78 && h.thresh < d.thresh && h.strength < 0.5 && h.strength > d.strength);
});
test('day input is clamped (bad / out-of-range values)', () => {
  for (const v of [NaN, undefined, -3, null]) assert.deepEqual(bloomLevel(BLOOM_DEF, v), bloomLevel(BLOOM_DEF, 0));
  assert.deepEqual(bloomLevel(BLOOM_DEF, 9), bloomLevel(BLOOM_DEF, 1));
});
