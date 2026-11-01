import test from 'node:test';
import assert from 'node:assert/strict';
import { fpsLimitFor, dprCapFor, qualityModeFor, setLoopLimit, FPS_LIMIT_PHONE, FPS_LIMIT_SAVER } from '../src/gfx/power.js';

test('frame limit: desktops never limited; phones get 60 (a hair above, so 60 Hz stays 60); Battery saver gets 30', () => {
  assert.equal(fpsLimitFor({ phone: false, saver: true }), 0);
  assert.equal(fpsLimitFor({ phone: true }), FPS_LIMIT_PHONE);
  assert.equal(fpsLimitFor({ phone: true, saver: true }), FPS_LIMIT_SAVER);
  assert.ok(1000 / FPS_LIMIT_PHONE < 1000 / 60, 'limit rate is shorter than a 60 Hz frame, so 60 Hz frames are never skipped');
  assert.ok(1000 / FPS_LIMIT_SAVER < 1000 / 30);
  assert.equal(fpsLimitFor(), 0);
});

test('render scale and quality: Battery saver only affects phones', () => {
  assert.equal(dprCapFor({ phone: true, saver: true }), 1.25);
  assert.equal(dprCapFor({ phone: true, saver: false }), 2);
  assert.equal(dprCapFor({ phone: false, saver: true }), 2);
  assert.equal(dprCapFor({ phone: true, saver: true, base: 1 }), 1);
  assert.equal(qualityModeFor('high', { phone: true, saver: true }), 'low');
  assert.equal(qualityModeFor('high', { phone: false, saver: true }), 'high');
  assert.equal(qualityModeFor('auto', { phone: true, saver: false }), 'auto');
});

test('setLoopLimit retunes a limited loop and refuses an unlimited one or bad input', () => {
  const loop = { hasFpsLimit: true, fpsLimit: 62, _limitRate: 1000 / 62 };
  assert.equal(setLoopLimit(loop, 32), true);
  assert.equal(loop.fpsLimit, 32);
  assert.ok(Math.abs(loop._limitRate - 31.25) < 1e-9);
  assert.equal(setLoopLimit({ hasFpsLimit: false }, 32), false);
  assert.equal(setLoopLimit(loop, 0), false);
  assert.equal(setLoopLimit(loop, NaN), false);
  assert.equal(setLoopLimit(null, 32), false);
});
