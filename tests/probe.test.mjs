// FIX4: the ?perf=1 probe is a no-op when off, tags long frames with the lazy work that ran, and keeps no personal data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { probe, LONG_MS } from '../src/gfx/probe.js';
import { parseParams } from '../src/params.js';

test('off by default: tag/first/frame do nothing', () => {
  probe.on = false; probe.tags.length = 0; probe.long.length = 0;
  probe.tag('x', 5); probe.first('y'); probe.frame(100); probe.frame(900);
  assert.equal(probe.tags.length, 0); assert.equal(probe.long.length, 0);
  assert.equal(probe.span('s', () => 7), 7);
});

test('on: a long frame is logged with the tags collected in it; first() fires once', () => {
  probe.on = true; probe.last = 0; probe.runStart(); probe.seen.clear();
  probe.frame(1000);
  probe.tag('bake:test', 80); probe.first('weapon:chain_lightning'); probe.first('weapon:chain_lightning');
  probe.frame(1000 + LONG_MS + 40);
  assert.equal(probe.long.length, 1);
  assert.deepEqual(probe.long[0].tags, ['bake:test 80ms', 'first:weapon:chain_lightning']);
  probe.frame(1000 + LONG_MS + 56);
  assert.equal(probe.long.length, 1, 'a normal frame is not logged');
  probe.on = false;
});

test('?perf=1 is a pure render flag, and the probe source stores and sends nothing', () => {
  assert.equal(parseParams('?perf=1').perf, true);
  assert.equal(parseParams('?perf=yes').perf, false);
  const src = readFileSync(new URL('../src/gfx/probe.js', import.meta.url), 'utf8');
  assert.equal(/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|innerHTML|cookie/.test(src), false);
});
