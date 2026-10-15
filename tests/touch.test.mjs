import test from 'node:test';
import assert from 'node:assert/strict';
import { stickVector, Stick, stickRadius, touchEnabled, parseTouchParam, STICK_SIZES } from '../src/input/stick.js';
import { sanitize, defaultSettings } from '../src/save/schema.js';
import './helpers.mjs';

const out = () => ({ x: 9, y: 9 });
const len = (v) => Math.hypot(v.x, v.y);

test('deadzone zeroes small offsets', () => {
  const v = stickVector(3, 0, 56, 0.12, out());
  assert.deepEqual([v.x, v.y], [0, 0]);
});

test('full tilt reaches magnitude 1 and clamps beyond radius', () => {
  assert.ok(Math.abs(len(stickVector(56, 0, 56, 0.12, out())) - 1) < 1e-9);
  const v = stickVector(500, 500, 56, 0.12, out());
  assert.ok(len(v) <= 1 + 1e-9 && len(v) > 0.99);
  assert.ok(Math.abs(v.x - v.y) < 1e-9);
});

test('analogue: half tilt is between 0 and 1, direction preserved', () => {
  const v = stickVector(0, -30, 56, 0.12, out());
  assert.ok(v.y < 0 && v.y > -1 && v.x === 0);
});

test('NaN / Infinity / bad radius give zero', () => {
  for (const [dx, dy, r] of [[NaN, 5, 56], [5, Infinity, 56], [5, 5, NaN], [5, 5, 0], [-Infinity, 0, 56], ['5', 5, 56]]) {
    const v = stickVector(dx, dy, r, 0.12, out());
    assert.deepEqual([v.x, v.y], [0, 0]);
  }
});

test('Stick tracks one pointer id; others are ignored', () => {
  const s = new Stick(56);
  assert.ok(s.down(7, 100, 100));
  assert.ok(!s.down(8, 300, 300));
  assert.ok(!s.move(8, 500, 500));
  assert.ok(s.move(7, 156, 100));
  assert.ok(s.x > 0.99 && s.y === 0);
  assert.ok(!s.up(8));
  assert.ok(s.active);
  assert.ok(s.up(7));
  assert.ok(!s.active && s.x === 0 && s.y === 0);
});

test('cancel releases the stick and a new touch can start', () => {
  const s = new Stick(56);
  s.down(1, 10, 10); s.move(1, 60, 10);
  assert.ok(s.x > 0);
  s.cancel();
  assert.ok(!s.active && s.x === 0 && s.y === 0);
  assert.ok(s.down(2, 20, 20));
});

test('Stick rejects non-finite coordinates and never outputs NaN', () => {
  const s = new Stick(56);
  assert.ok(!s.down(1, NaN, 5));
  assert.ok(s.down(1, 5, 5));
  assert.ok(!s.move(1, Infinity, 5));
  assert.ok(Number.isFinite(s.x) && Number.isFinite(s.y));
  s.setRadius(NaN);
  assert.equal(s.radius, 56);
  s.setRadius(1e9);
  assert.equal(s.radius, 200);
});

test('visual finger position is clamped to the radius', () => {
  const s = new Stick(50);
  s.down(1, 0, 0); s.move(1, 400, 0);
  assert.ok(Math.abs(s.px - 50) < 1e-9);
});

test('stick sizes and unknown names', () => {
  assert.equal(stickRadius('large'), STICK_SIZES.large);
  assert.equal(stickRadius('__proto__'), STICK_SIZES.medium);
  assert.equal(stickRadius(undefined), STICK_SIZES.medium);
});

test('touchEnabled: url param beats setting; auto uses detection', () => {
  assert.ok(touchEnabled('off', '1', false, false));
  assert.ok(!touchEnabled('on', '0', true, true));
  assert.ok(touchEnabled('on', null, false, false));
  assert.ok(!touchEnabled('off', null, true, true));
  assert.ok(touchEnabled('auto', null, true, false));
  assert.ok(!touchEnabled('auto', null, false, false));
  assert.equal(parseTouchParam('1'), '1');
  assert.equal(parseTouchParam('<script>'), null);
});

test('settings: touchMode / stickSize validated with defaults', () => {
  const d = defaultSettings();
  assert.equal(d.touchMode, 'auto');
  assert.equal(d.stickSize, 'medium');
  const s = sanitize({ version: 2, settings: { touchMode: 'always', stickSize: 'huge' } }).settings;
  assert.equal(s.touchMode, 'auto');
  assert.equal(s.stickSize, 'medium');
  const t = sanitize({ version: 2, settings: { touchMode: 'on', stickSize: 'large' } }).settings;
  assert.equal(t.touchMode, 'on');
  assert.equal(t.stickSize, 'large');
  const u = sanitize({ version: 2, settings: { touchMode: { a: 1 }, stickSize: 5 } }).settings;
  assert.equal(u.touchMode, 'auto');
  assert.equal(u.stickSize, 'medium');
});
