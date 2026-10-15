import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/gfx/rigmath.js';
import { FRAMES, shelfPack, TEX, DU, FEET, HEAD_EXPR } from '../src/gfx/wrenart.js';

test('walk phase advances with distance and wraps', () => {
  let p = 0;
  p = M.advancePhase(p, M.STRIDE / 2); assert.ok(Math.abs(p - 0.5) < 1e-9);
  p = M.advancePhase(p, M.STRIDE * 3.25); assert.ok(p >= 0 && p < 1);
  assert.equal(M.advancePhase(NaN, NaN), 0);
  assert.equal(M.advancePhase(0.3, 0), 0.3);
});

test('walk pose: still = rest pose, running stays inside the squash clamps', () => {
  const o = {};
  M.walkPose(o, 0.37, 0);
  assert.equal(o.leg, 0); assert.equal(o.bob, 0); assert.equal(o.sx, 1); assert.equal(o.sy, 1); assert.equal(o.lean, 0);
  for (let i = 0; i <= 100; i++) {
    M.walkPose(o, i / 100, 1);
    assert.ok(o.sx >= M.SQ_MIN && o.sx <= M.SQ_MAX && o.sy >= M.SQ_MIN && o.sy <= M.SQ_MAX);
    assert.ok(o.lift >= 0 && o.lift2 >= 0 && Math.abs(o.leg) <= 1 && o.bob <= 0);
  }
  M.walkPose(o, NaN, 9); assert.ok(Number.isFinite(o.leg) && Number.isFinite(o.sy));
});

test('squash clamp', () => {
  assert.equal(M.clampSq(5), M.SQ_MAX); assert.equal(M.clampSq(-5), M.SQ_MIN); assert.equal(M.clampSq(NaN), 1);
  assert.ok(M.breathe(0) === 1 && Math.abs(M.breathe(0.6) - 1) <= 0.0301);
});

test('facing keeps the last side while input is ~0', () => {
  assert.equal(M.faceDir(1, -1), -1); assert.equal(M.faceDir(-1, 0), -1); assert.equal(M.faceDir(1, 0.01), 1); assert.equal(M.faceDir(-1, 0.9), 1);
  assert.equal(M.faceDir(-1, NaN), -1);
});

test('follow spring converges, never overshoots wildly, snaps on teleport, survives NaN/huge dt', () => {
  const s = { x: 0, y: 0, vx: 0, vy: 0 };
  let maxOver = 0;
  for (let i = 0; i < 600; i++) { M.springStep(s, 50, 20, 1 / 60, 256, 0.9); maxOver = Math.max(maxOver, s.x - 50); }
  assert.ok(Math.abs(s.x - 50) < 0.05 && Math.abs(s.y - 20) < 0.05);
  assert.ok(maxOver < 5);
  M.springStep(s, 1000, 1000, 1 / 60); assert.deepEqual([s.x, s.y], [1000, 1000]); // teleport snap
  M.springStep(s, NaN, 3, 1 / 60); assert.deepEqual([s.x, s.y], [1000, 1000]); // bad target ignored
  s.x = NaN; M.springStep(s, 5, 5, 1 / 60); assert.deepEqual([s.x, s.y], [5, 5]); // bad state healed
  for (const dt of [0, -1, 1e9, Infinity, NaN]) { M.springStep(s, 6, 6, dt, 900, 0.5); assert.ok(Number.isFinite(s.x) && Number.isFinite(s.vx)); }
});

test('follow spring stable for the stiff ember at the worst frame time', () => {
  const s = { x: 0, y: 0, vx: 0, vy: 0 };
  for (let i = 0; i < 2000; i++) M.springStep(s, Math.sin(i * 0.1) * 30, 0, 1 / 30, 900, 0.5, 100);
  assert.ok(Math.abs(s.x) < 100 && Number.isFinite(s.x));
});

test('heel target sits behind her; further back is not required when still', () => {
  const o = {};
  M.heelTarget(o, 100, 100, 1, 0, 0, 0); assert.ok(o.x < 100 && o.y > 100);
  M.heelTarget(o, 100, 100, -1, 0, 0, 0); assert.ok(o.x > 100);
  M.heelTarget(o, 100, 100, 1, 1, 0, 1); assert.ok(o.x < 100);
  M.heelTarget(o, NaN, 5, 1, 0, 0, NaN); assert.ok(Number.isFinite(o.x));
});

test('pup pose has hysteresis (no flicker between sit and bound)', () => {
  const st = { run: false, still: 0 };
  assert.equal(M.pupPose(st, 30, 0.016), true);
  assert.equal(M.pupPose(st, 10, 0.016), true); // between thresholds keeps running
  let r = true; for (let i = 0; i < 30; i++) r = M.pupPose(st, 1, 0.016);
  assert.equal(r, false);
});

test('hurt and death timelines', () => {
  const o = {};
  assert.equal(M.hurtFx(o, 0.01).tint, 1); assert.equal(M.hurtFx(o, 0.1).tint, 2); assert.equal(M.hurtFx(o, 0.3).tint, 0);
  assert.equal(M.hurtFx(o, 9).active, false); assert.equal(M.hurtFx(o, NaN).tint, 0);
  const d = {};
  M.deathFx(d, 0); assert.equal(d.alpha, 1);
  M.deathFx(d, 5); assert.ok(Math.abs(d.alpha - 0.4) < 1e-9 && d.rise === 16 && d.k === 1);
  for (let t = 0; t < 2; t += 0.05) { M.deathFx(d, t); assert.ok(d.sy >= 0.78 && d.sy <= 1.1401 && d.sx >= 0.89 && d.sx <= 1.1201); assert.ok(M.clampSq(d.sy) >= M.SQ_MIN); }
});

test('expression pickers', () => {
  assert.equal(M.pickExpr(true, true, true, true), 'death'); assert.equal(M.pickExpr(false, true, true, true), 'hurt');
  assert.equal(M.pickExpr(false, false, true, true), 'worried'); assert.equal(M.pickExpr(false, false, false, true), 'blink');
  assert.equal(M.pickExpr(false, false, false, false), 'neutral');
  assert.equal(M.pickPupExpr(true, true, true), 'hurt'); assert.equal(M.pickPupExpr(false, true, false), 'happy'); assert.equal(M.pickPupExpr(false, false, true), 'blink');
  for (const e of ['death', 'hurt', 'worried', 'blink', 'neutral']) assert.ok(HEAD_EXPR[e]);
});

test('blink and tilt are deterministic and bounded', () => {
  let n = 0; for (let t = 0; t < 43; t += 0.01) if (M.isBlink(t)) n++;
  assert.ok(n > 5 && n < 200);
  for (let t = 0; t < 100; t += 0.1) { const a = M.pupTilt(t); assert.ok(Math.abs(a) <= 14.01); assert.equal(a, M.pupTilt(t)); }
  assert.equal(M.pupTilt(NaN), M.pupTilt(0));
});

test('atlas frames: unique names, sane sizes, shelf pack has no overlaps and stays small', () => {
  const names = FRAMES.map((f) => f.name); assert.equal(new Set(names).size, names.length);
  assert.ok(FRAMES.length <= 24);
  const items = FRAMES.map((f) => ({ name: f.name, w: Math.ceil((f.bb[2] - f.bb[0]) * TEX), h: Math.ceil((f.bb[3] - f.bb[1]) * TEX) }));
  const pk = shelfPack(items, 768);
  assert.ok(pk.w <= 768 && pk.h <= 512);
  const r = Object.values(pk.rects);
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
    const a = r[i]; const b = r[j];
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'overlap');
  }
  for (const f of FRAMES) { assert.ok(f.pv[0] >= f.bb[0] && f.pv[0] <= f.bb[2] && f.pv[1] >= f.bb[1] && f.pv[1] <= f.bb[3], `pivot inside ${f.name}`); }
});

test('hero scale keeps the old on-screen size and ground contact', () => {
  assert.ok(Math.abs(122 * DU - 18 * 1.43) < 0.1);
  assert.ok(Math.abs(FEET - 7.6 * 1.43) < 0.1);
});

test('A1b hero halo: off on Low, steady in reduced motion, dimmer at low HP, bounded', () => {
  assert.equal(M.heroHaloAlpha('low', false, false, 1), 0);
  assert.equal(M.heroHaloAlpha('high', true, false, 0.3), M.heroHaloAlpha('high', true, false, 9.9));
  assert.ok(M.heroHaloAlpha('med', true, true, 0) < M.heroHaloAlpha('med', true, false, 0));
  for (let t = 0; t < 10; t += 0.37) { const a = M.heroHaloAlpha('high', false, false, t); assert.ok(a > 0.3 && a < 0.5); }
});
