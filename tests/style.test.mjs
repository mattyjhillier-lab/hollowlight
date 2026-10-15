import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStyle, parseDpr, zoomFor } from '../src/gfx/style.js';

test('parseStyle: only "b" selects style B, everything else is A', () => {
  assert.equal(parseStyle('?style=b'), 'b');
  assert.equal(parseStyle('?style=a'), 'a');
  assert.equal(parseStyle(''), 'a');
  assert.equal(parseStyle('?style=B'), 'a');
  assert.equal(parseStyle('?style=<script>'), 'a');
  assert.equal(parseStyle('?style=b&style=a'), 'b');
  assert.equal(parseStyle(undefined), 'a');
});

test('parseDpr clamps to 1..2 and rejects junk', () => {
  assert.equal(parseDpr(1), 1);
  assert.equal(parseDpr(3), 2);
  assert.equal(parseDpr(1.5), 1.5);
  assert.equal(parseDpr(0), 1);
  assert.equal(parseDpr(NaN), 1);
  assert.equal(parseDpr('x'), 1);
  assert.equal(parseDpr(undefined), 1);
  assert.equal(parseDpr(-4), 1);
});

test('zoomFor: ~300 units on the landscape short side, 250 on portrait, long side <= 620', () => {
  assert.equal(zoomFor(1280, 720), 2.4);
  assert.ok(Math.abs(zoomFor(780, 1688) - 3.12) < 1e-9);
  assert.ok(Math.abs(zoomFor(1688, 780) - 1688 / 620) < 1e-9); // phone landscape: long-side clamp
  assert.ok(2560 / zoomFor(2560, 1080) <= 620.0001);
  assert.equal(zoomFor(0, 0), 1);
  assert.equal(zoomFor(NaN, 5), 1);
});
