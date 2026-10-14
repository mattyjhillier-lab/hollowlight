import test from 'node:test';
import assert from 'node:assert/strict';
import { Quality, CAPS } from '../src/gfx/quality.js';

const run = (q, ms, work, seconds) => {
  let changes = 0;
  for (let t = 0; t < seconds * 1000; t += ms) if (q.sample(ms, work)) changes++;
  return changes;
};

test('auto steps down on slow frames, then stays', () => {
  const q = new Quality('high');
  run(q, 30, 18, 1.2);
  assert.equal(q.tier, 'med');
  run(q, 30, 18, 4);
  assert.equal(q.tier, 'low');
  run(q, 30, 18, 10);
  assert.equal(q.tier, 'low');
});

test('auto steps up only after sustained headroom, with hold-off', () => {
  const q = new Quality('low');
  run(q, 16.6, 3, 10);
  assert.equal(q.tier, 'low');
  run(q, 16.6, 3, 12);
  assert.equal(q.tier, 'med');
});

test('backoff after a drop delays recovery', () => {
  const q = new Quality('med');
  run(q, 30, 18, 4);
  assert.equal(q.tier, 'low');
  run(q, 16.6, 3, 25);
  assert.equal(q.tier, 'low'); // lock doubled to 30 s
  run(q, 16.6, 3, 10);
  assert.equal(q.tier, 'med');
});

test('manual choice is honoured and never auto-changes', () => {
  const q = new Quality('med');
  q.setMode('high');
  run(q, 40, 25, 20);
  assert.equal(q.tier, 'high');
  q.setMode('low');
  assert.equal(q.tier, 'low');
  q.setMode('auto');
  assert.equal(q.mode, 'auto');
  q.setMode('bogus');
  assert.equal(q.mode, 'auto');
});

test('hitches and bad input are ignored; caps respect budget', () => {
  const q = new Quality('med');
  assert.equal(q.sample(5000, 1), false);
  assert.equal(q.sample(-1, 1), false);
  assert.equal(q.sample(NaN, 1), false);
  for (const c of Object.values(CAPS)) assert.ok(c.particles <= 300);
  assert.equal(CAPS.low.bloom || CAPS.med.bloom, false);
});
