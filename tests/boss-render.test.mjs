// Elder Treant rendering (B1/B3/B4 pure parts): camera zoom + clamp, root sweep, victory clock, frame choice, art layout budget, SVG safety.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fightZoomK, camClamp, victoryClock, rootRise, rootSpec, VIC, BEAT, ROOTS, FIGHT_ZOOM, PORTRAIT_VIEW_W, CAM_PAD, BARK_LINE } from '../src/gfx/boss/bossview.js';
import { layout, frameFor, framesFor, frameSvg, addSvg, TPW, BOX } from '../src/gfx/boss/bossart.js';

test('fight zoom: -8% on desktop / landscape, portrait zooms out to ~300 u wide, never zooms in', () => {
  assert.equal(fightZoomK(533, 300), FIGHT_ZOOM);
  assert.equal(fightZoomK(620, 287), FIGHT_ZOOM);
  const k = fightZoomK(250, 541);
  assert.ok(Math.abs(250 / k - PORTRAIT_VIEW_W) < 1e-9, 'portrait view becomes 300 u wide');
  assert.ok(fightZoomK(400, 900) <= FIGHT_ZOOM);
  assert.equal(fightZoomK(NaN, 0), FIGHT_ZOOM);
});

test('camera clamp: the view never shows more than 40 u past the ring', () => {
  const A = { cx: 1000, cy: 1000, r: 230 }, out = [0, 0];
  for (const [hw, hh] of [[290, 163], [310, 143], [150, 300]]) for (const [tx, ty] of [[1000, 1000], [1229, 1000], [771, 1229], [1100, 900]]) {
    camClamp(tx, ty, A, hw, hh, out);
    assert.ok(out[0] + hw <= A.cx + A.r + CAM_PAD + 1e-9 || hw > A.r + CAM_PAD, 'right edge');
    assert.ok(out[0] - hw >= A.cx - A.r - CAM_PAD - 1e-9 || hw > A.r + CAM_PAD, 'left edge');
    assert.ok(out[1] + hh <= A.cy + A.r + CAM_PAD + 1e-9 || hh > A.r + CAM_PAD);
  }
  camClamp(1050, 1020, A, 150, 100, out); assert.deepEqual(out, [1050, 1020], 'free inside');
});

test('root sweep: every root rises between 0.3 and 1.5 s (+0.25 s grow); Calm: all at once', () => {
  const s = { a: 0, h: 0, lean: 0, d: 0 };
  for (const n of Object.values(ROOTS)) for (let i = 0; i < n; i++) {
    rootSpec(i, n, s);
    assert.equal(rootRise(s.a, 1, BEAT.ring0 - 0.01, false), 0);
    assert.equal(rootRise(s.a, 1, BEAT.ring1 + 0.26, false), 1);
    assert.equal(rootRise(s.a, 1, BEAT.ring0, true), 1);
    assert.ok(s.h >= 0.7 && s.h <= 1.3);
  }
  assert.deepEqual(ROOTS, { high: 110, med: 70, low: 36 });
});

test('victory clock: holds at 14:00 until the leaf, reaches 15:00 when the flood ends; Calm = a 1 s fade', () => {
  assert.equal(victoryClock(840, 900, 0, false), 840);
  assert.equal(victoryClock(840, 900, VIC.leaf, false), 840);
  assert.equal(victoryClock(840, 900, VIC.flood, false), 900);
  assert.equal(victoryClock(840, 900, VIC.leaf + VIC.calmFlood, true), 900);
  assert.ok(VIC.line === 6 && VIC.skipAfter === 1.5 && VIC.stop === 0.12);
  for (const w of Object.values(BARK_LINE)) assert.ok(w.split(' ').length >= 3 && w.split(' ').length <= 6, 'bark 3-6 words');
});

test('frame choice: phase look + tell pose; Low falls back to the phase pose; death frames by k', () => {
  const full = new Set(framesFor('high').map((f) => f[0])), low = new Set(framesFor('low').map((f) => f[0]));
  assert.equal(frameFor(full, 0, '', -1), 'p1');
  assert.equal(frameFor(full, 0, 'slam', -1), 'p1s');
  assert.equal(frameFor(full, 0, 'sweep', -1), 'p1', 'no sweep in P1: phase pose');
  assert.equal(frameFor(full, 1, 'sweep', -1), 'p2w');
  assert.equal(frameFor(full, 2, 'nova', -1), 'p3t');
  assert.equal(frameFor(low, 2, 'nova', -1), 'p3');
  assert.equal(frameFor(full, 2, '', 0.1), 'd1');
  assert.equal(frameFor(full, 2, '', 1), 'd4');
  assert.equal(frameFor(low, 2, '', 1), 'd4');
});

test('art budget: atlas <= 2048 wide, <= 8 MB (High), Low one row; true size ~85 u tall', () => {
  for (const t of ['high', 'med', 'low']) {
    const L = layout(t);
    assert.ok(L.w <= 2048 && L.h <= 2048, t);
    assert.ok(L.w * L.h * 4 <= 8 * 1048576, `${t} ${(L.w * L.h * 4 / 1048576).toFixed(1)} MB`);
    for (const f of Object.values(L.frames)) assert.ok(f.x + f.w <= L.w && f.y + f.h <= L.h);
  }
  assert.equal(layout('low').h, Object.values(layout('low').frames)[0].h, 'Low: one row');
  assert.ok(Math.abs(-BOX[1] / 4 - 92) < 10, 'box ~ the 85 u boss + crown');
  assert.ok(TPW.high >= 3 && TPW.low >= 2);
});

test('art SVG is self-contained (no external refs, no script), every frame paints', () => {
  const L = layout('high');
  for (const [name, st] of framesFor('high')) {
    const fr = L.frames[name];
    const svg = frameSvg(st, fr.w, fr.h, L.k);
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(!/<script|javascript:|href="http|xlink:href="http|@import|url\(http/i.test(svg), name);
    assert.ok(svg.length > 5000, name);
  }
  for (const g of [0, 1]) assert.ok(!/<script|href="http/i.test(addSvg(g)));
  assert.ok(/#ffb84a/i.test(frameSvg({ ph: 1 }, 10, 10, 0.8)), 'amber boss eyes baked into the sockets');
  assert.ok(/#ff5a3c/i.test(addSvg(1)), 'the Sapling Husk has one red-orange eye');
});
