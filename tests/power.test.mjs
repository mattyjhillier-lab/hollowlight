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
  assert.equal(dprCapFor({ phone: true, saver: false }), 1.25); // HEAT: phones render at most 1.25
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

test('FREEZE-1: a held run (pause / cards) draws 20 fps on phones; play, desktops and Battery saver limits are unchanged otherwise', async () => {
  const { restLimitFor, fpsLimitFor, FPS_LIMIT_REST } = await import('../src/gfx/power.js');
  assert.equal(FPS_LIMIT_REST, 22); // 20 fps after 1 ms rounding (see the IPHONE-PERF test)
  assert.equal(restLimitFor({ phone: true, rest: true }), 22);
  assert.equal(restLimitFor({ phone: true, saver: true, rest: true }), 22);
  assert.equal(restLimitFor({ phone: true, rest: false }), fpsLimitFor({ phone: true }));
  assert.equal(restLimitFor({ phone: true, saver: true, rest: false }), fpsLimitFor({ phone: true, saver: true }));
  assert.equal(restLimitFor({ phone: false, rest: true }), 0); // desktops are never limited
});

// Phaser 3 TimeStep.stepLimitFPS: delta since the last tick is added up; a frame is drawn (and the sum reset) once it reaches 1000/limit.
function drawnFps(limit, hz, { round = true, jitter = 0, seconds = 10 } = {}) {
  const rate = 1000 / limit; let t = 0, last = 0, acc = 0, drawn = 0, seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  for (let i = 1; t < seconds * 1000; i++) {
    t = i * (1000 / hz) + jitter * rnd();
    const ts = round ? Math.round(t) : t; // Safari / WebKit: whole-millisecond rAF timestamps
    acc += Math.max(0, ts - last); last = ts;
    if (acc >= rate) { drawn++; acc = 0; }
  }
  return drawn / seconds;
}

test('IPHONE-PERF: with whole-ms (Safari) rAF timestamps the phone limits still give 60 / 30 / 20 fps at 60 and 120 Hz', async () => {
  const { FPS_LIMIT_REST } = await import('../src/gfx/power.js');
  assert.ok(drawnFps(62, 60) < 45, 'the old limit 62 dropped a 60 Hz iPhone to ~40 fps (the bug)');
  for (const hz of [60, 120]) {
    for (const [limit, want] of [[FPS_LIMIT_PHONE, 60], [FPS_LIMIT_SAVER, 30], [FPS_LIMIT_REST, 20]]) {
      for (const o of [{ round: true }, { round: false }, { round: true, jitter: 1.5 }]) {
        const got = drawnFps(limit, hz, o);
        assert.ok(Math.abs(got - want) <= want * 0.04, `limit ${limit} at ${hz} Hz ${JSON.stringify(o)}: ${got.toFixed(1)} fps, want ${want}`);
      }
    }
  }
  assert.ok(Math.abs(drawnFps(FPS_LIMIT_PHONE, 90) - 45) < 2, '90 Hz phone draws 45 (unchanged)');
});