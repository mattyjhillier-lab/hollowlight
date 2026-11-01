// FIX4d: low-memory detection and the per-mode pre-bake choice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isLowMem, LOWMEM_DPR } from '../src/gfx/memprofile.js';
import { pickPrebakeMode } from '../src/gfx/prebake.js';

test('iPhone, iPad, iPadOS-as-Mac and <=4 GB devices are low memory; desktops are not', () => {
  assert.equal(isLowMem({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }), true);
  assert.equal(isLowMem({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }), true);
  assert.equal(isLowMem({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 }), true);
  assert.equal(isLowMem({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 }), false);
  assert.equal(isLowMem({ userAgent: 'Mozilla/5.0 (Linux; Android 13)', deviceMemory: 4 }), true);
  assert.equal(isLowMem({ userAgent: 'Mozilla/5.0 (Windows NT 10.0)', deviceMemory: 8 }), false);
  assert.equal(isLowMem(null), false);
  assert.ok(LOWMEM_DPR >= 1 && LOWMEM_DPR < 2);
});

test('mode choice: low-memory = ground-only, otherwise full; ?prebake=1 forces full (no storage in node: everything allowed)', () => {
  assert.equal(pickPrebakeMode(true, false), 'ground');
  assert.equal(pickPrebakeMode(false, false), 'full');
  assert.equal(pickPrebakeMode(true, true), 'full');
});

test('iOS (incl. iPadOS as Mac) is detected; others are not', async () => {
  const { isIOS } = await import('../src/gfx/memprofile.js');
  assert.equal(isIOS({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }), true);
  assert.equal(isIOS({ userAgent: 'Mozilla/5.0 (Macintosh)', maxTouchPoints: 5 }), true);
  assert.equal(isIOS({ userAgent: 'Mozilla/5.0 (Linux; Android 13)', deviceMemory: 4 }), false);
});
