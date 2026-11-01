import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zoneB, zoneNameAt, ZONE_SET, BLEND } from '../src/world/zones.js';
import { LifeMap } from '../src/world/lifemap.js';

const W = 4000;
test('start, road, wells and meadow are set A (weight 0)', () => {
  for (const [x, y] of [[2000, 2000], [3000, 2000], [1990, 2900], [2000, 3000], [700, 2000], [2000, 700]]) assert.equal(zoneB(x, y, W), 0, `${x},${y}`);
});

test('grove, thicket, graves and the map edge are set B (weight 1)', () => {
  for (const [x, y] of [[600, 600], [3400, 600], [600, 3400], [10, 2000], [2000, 5], [3995, 2000], [2000, 3995]]) assert.equal(zoneB(x, y, W), 1, `${x},${y}`);
});

test('weights stay in 0..1, are smooth (no hard line) and the edge band falls off inward', () => {
  let maxStep = 0;
  for (let y = 0; y <= W; y += 40) { let prev = zoneB(0, y, W); for (let x = 8; x <= W; x += 8) { const v = zoneB(x, y, W); assert.ok(v >= 0 && v <= 1); maxStep = Math.max(maxStep, Math.abs(v - prev)); prev = v; } }
  assert.ok(maxStep < 0.12, 'max step per 8 units ' + maxStep);
  assert.ok(zoneB(450, 2000, W) > 0 && zoneB(450, 2000, W) < 1); // inside the edge fade
  assert.ok(BLEND >= 200);
});

test('bad input is safe', () => {
  assert.equal(zoneB(NaN, 1, W), 0);
  assert.equal(zoneB(1, Infinity, W), 0);
  assert.equal(zoneB(5, 5, 0), 0);
  assert.equal(zoneNameAt(-100, 99999, W), 'Graves');
});

test('table matches the world sheet: A = N W centre E S SE, B = NW NE SW', () => {
  assert.deepEqual(ZONE_SET.flat().join(''), 'BABAAABAA');
});

test('life map carries the zone in G and update() never overwrites it', () => {
  const m = new LifeMap({ n: 256, world: W, zone: (x, y) => zoneB(x, y, W) });
  const g = (x, y) => m.rgba[((Math.floor(y / m.cell)) * m.n + Math.floor(x / m.cell)) * 4 + 1];
  assert.equal(g(2000, 2000), 0);
  assert.equal(g(300, 300), 255);
  m.stamp(2000, 2000, 80, 1);
  for (let i = 0; i < 20; i++) m.update(0.1);
  m.reset();
  assert.equal(g(2000, 2000), 0);
  assert.equal(g(300, 300), 255);
  assert.ok(m.rgba[((128 * 256) + 128) * 4 + 3] === 255);
  const plain = new LifeMap();
  assert.equal(plain.rgba[1], 0); // no zone fn -> G stays 0 (set A)
});
