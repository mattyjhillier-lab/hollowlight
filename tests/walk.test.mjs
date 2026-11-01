import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/gfx/rigmath.js';
import { followK, followStep, FOLLOW_SNAP } from '../src/gfx/camfollow.js';
import { analyzeWalk, hfShare, countPeaks, steadyRuns } from '../scripts/walkstats.mjs';

// head height (du above the soles, up = +) over one leg cycle at full walk, sampled finely
const headSeries = (n = 240) => { const o = {}; const y = []; for (let i = 0; i < n; i++) { M.walkPose(o, i / n, 1); y.push(-(-66 + o.headBob) * o.sy); } return y; };

test('walk v2: one smooth bump per step (two per leg cycle), no high-frequency energy', () => {
  const y = headSeries();
  const twice = y.concat(y);
  assert.equal(countPeaks(twice.slice(1, -1)), 4); // 2 cycles = 4 steps = 4 bumps
  assert.ok(hfShare(twice, (1.5 * 4) / twice.length) < 0.01);
  const range = Math.max(...y) - Math.min(...y);
  assert.ok(range > 1.5 && range < 4.5, 'head travel ' + range);
  // the old rectified-sine bob had corners at every contact: v2 must have a small, continuous third difference
  let jmax = 0; for (let i = 3; i < y.length; i++) jmax = Math.max(jmax, Math.abs(y[i] - 3 * y[i - 1] + 3 * y[i - 2] - y[i - 3]));
  assert.ok(jmax < 1e-3, 'jerk ' + jmax);
});

test('walk v2: body lowest just after contact, highest just after passing; head lags the body', () => {
  const o = {}; let lo = 0, hi = 0, vlo = Infinity, vhi = -Infinity, hhi = 0, vh = -Infinity;
  for (let i = 0; i < 500; i++) { const ph = i / 1000; M.walkPose(o, ph, 1); if (o.bob < vlo) { /* up is negative */ } if (-o.bob > vhi) { vhi = -o.bob; hi = ph; } if (-o.bob < vlo) { vlo = -o.bob; lo = ph; } if (-o.headBob > vh) { vh = -o.headBob; hhi = ph; } }
  assert.ok(lo > 0 && lo < 0.06, 'lowest at ' + lo); // contact at 0
  assert.ok(hi > 0.25 && hi < 0.31, 'highest at ' + hi); // passing at 0.25
  assert.ok(hhi > hi && hhi - hi < 0.08, 'head peak ' + hhi);
});

test('walk v2: feet lift only on their forward swing and plant softly', () => {
  const o = {}; const p = {};
  for (let i = 1; i < 400; i++) {
    M.walkPose(o, i / 400, 1); M.walkPose(p, (i - 1) / 400, 1);
    if (o.lift > 0.02) assert.ok(o.leg > p.leg, 'near foot moves forward while lifted');
    if (o.lift2 > 0.02) assert.ok(o.leg < p.leg, 'far foot moves forward while lifted');
  }
  M.walkPose(o, 0, 1); assert.ok(o.lift < 1e-9 && o.lift2 < 1e-9); // both down at contact
  M.walkPose(o, 0.37, 0); assert.equal(o.bob, 0); assert.equal(o.headBob, 0); assert.equal(o.sy, 1); assert.equal(o.nod, 0);
});

test('walkDrive: frame-rate independent, hitch-proof phase, eases in and out', () => {
  const run = (hz, secs, speed) => { const st = { v: 0, amp: 0, phase: 0, acc: 0 }; let tot = 0; const dt = 1 / hz; for (let i = 0; i < hz * secs; i++) { const p0 = st.phase; M.walkDrive(st, speed * dt, dt, 100); let d = st.phase - p0; if (d < 0) d += 1; tot += d; } return { st, tot }; };
  const a = run(60, 3, 100), b = run(144, 3, 100);
  assert.ok(Math.abs(a.tot - b.tot) < 0.05, a.tot + ' vs ' + b.tot); // same cycles at 60 and 144 Hz
  assert.ok(a.st.amp > 0.99 && Math.abs(a.st.v - 100) < 0.5);
  // a 100 ms hitch (one big distance step) moves the phase by no more than the smoothed speed allows
  const st = a.st; const p0 = st.phase; M.walkDrive(st, 10, 0.1, 100); let d = st.phase - p0; if (d < 0) d += 1;
  assert.ok(d < 0.1 * 100 / (M.STRIDE * 0.7) + 1e-9);
  // stopping eases the amount down over a few frames (no snap)
  const s2 = { v: 100, amp: 1, phase: 0.2, acc: 0 }; M.walkDrive(s2, 0, 1 / 60, 100); assert.ok(s2.amp > 0.8 && s2.amp < 1);
  for (let i = 0; i < 120; i++) M.walkDrive(s2, 0, 1 / 60, 100); assert.ok(s2.amp < 0.01);
  const s3 = { v: NaN, amp: NaN, phase: NaN, acc: NaN }; M.walkDrive(s3, NaN, 1 / 60, 0); assert.ok([s3.v, s3.amp, s3.phase].every(Number.isFinite));
  M.walkDrive(s3, 5, 0, 100); assert.ok(Number.isFinite(s3.phase)); // dt 0 = no change
});

test('turn squash and eased lean are bounded and continuous', () => {
  assert.equal(M.turnSquash(9), 1); assert.equal(M.turnSquash(0), 1); assert.equal(M.turnSquash(NaN), 1);
  for (let t = 0; t < 0.2; t += 0.005) { const v = M.turnSquash(t); assert.ok(v >= 0.72 - 1e-9 && v <= 1); }
  let l = 5; for (let i = 0; i < 3; i++) l = M.easeTo(l, -5, 1 / 60, 0.07); assert.ok(l < 5 && l > -5);
  assert.equal(M.easeTo(NaN, 3, 1 / 60, 0.07), 3);
});

test('camera follow: 0.18 per 60 Hz frame, same feel at 144 Hz, device-pixel snapped, snaps on jumps', () => {
  assert.ok(Math.abs(followK(1 / 60) - 0.18) < 1e-12); assert.equal(followK(0), 0); assert.equal(followK(NaN), 0);
  const lagAt = (hz) => { const st = { ok: false }; let x = 0; followStep(st, x, 0, 0, 3.6, 1280, 720); for (let i = 0; i < hz * 2; i++) { x += 100 / hz; followStep(st, x, 0, 1 / hz, 3.6, 1280, 720); } return x - st.cx; };
  assert.ok(Math.abs(lagAt(60) - lagAt(144)) < 0.6, lagAt(60) + ' vs ' + lagAt(144));
  const st = { ok: false }; followStep(st, 1000.123, 500.77, 1 / 60, 3.6, 1280, 720);
  assert.ok(Math.abs((st.sx + 640) * 3.6 - Math.round((st.sx + 640) * 3.6)) < 1e-6); // scroll on the device-pixel grid
  assert.ok(Math.abs(st.sx + 640 - 1000.123) <= 0.5 / 3.6 + 1e-9);
  followStep(st, 1000 + FOLLOW_SNAP + 50, 500, 1 / 60, 3.6, 1280, 720); assert.equal(st.cx, 1000 + FOLLOW_SNAP + 50);
  followStep(st, NaN, 0, 1 / 60, 3.6, 1280, 720); assert.ok(Number.isFinite(st.cx));
});

test('walk analysis: a perfectly smooth recording scores zero jitter', () => {
  const f = []; let t = 0; for (let i = 0; i < 300; i++) { t += 16.667; const x = 1000 + i * 1.76; const o = {}; const ph = (i * 1.76 / 46) % 1; M.walkPose(o, ph, 1); f.push([t, 16.667, 16.667, x, 2000, x - 640, 2000 - 360, 3, ph, 2000 + 10.9 + (-66 + o.headBob) * o.sy * 0.211, 0, 0, 0, 640, 1]); }
  assert.equal(steadyRuns(f).length, 1);
  const a = analyzeWalk(f);
  assert.ok(a.heroJitPx < 1e-6 && a.worldJitPx < 1e-6 && a.headHF < 0.01 && Math.abs(a.headPeaksPerStep - 1) < 0.15, JSON.stringify(a));
});
