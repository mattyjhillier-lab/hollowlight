import test from 'node:test';
import assert from 'node:assert/strict';
import { wolfSvg, wolfOverlaySvg, wolfSheet, WOLF_POSES, OV_OFF, wolfGeom, R } from '../src/gfx/summon/wolf.js';
import { wolfFrame, wolfLook, BITE_T, STRIDE } from '../src/gfx/summon/wolfanim.js';
import { wolfRects, WOLF_BAKE } from '../src/gfx/summon/atlas.js';
import { PACK, PAGE_W, FRAME_BY_NAME } from '../src/gfx/summon/frames.js';
import { Lstar } from '../src/gfx/husk/paint.js';

test('wolf art: 6 poses + 3 overlays + Low flat, all from our own code (no external refs, no scripts)', () => {
  assert.equal(WOLF_POSES.length, 6);
  assert.equal(WOLF_BAKE.length, 10);
  const svg = wolfSheet(wolfRects(), PAGE_W, PACK.h);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(!/<script|href=|xlink|https?:|javascript:|<foreignObject|<image/i.test(svg.replace('xmlns="http://www.w3.org/2000/svg"', '')), 'self-contained, no references');
  assert.equal((svg.match(/<svg x=/g) || []).length, 10);
  for (let i = 0; i < 6; i++) assert.ok(wolfSvg(WOLF_POSES[i]).length > 1000);
  for (let k = 0; k < 3; k++) assert.ok(wolfOverlaySvg(k).length > 50);
  // every bake rect is its atlas frame
  for (const r of wolfRects()) { const f = PACK.frames[FRAME_BY_NAME[r.name].id]; assert.deepEqual([r.x, r.y, r.w, r.h], [f.x, f.y, f.w, f.h]); }
});

test('wolf art: friendly value read (light body, never red eyes), warm ember heart', () => {
  // body is a LIGHT value (Husk wolf body is dark): L* of the base fill well above mid grey
  assert.ok(Lstar(R.c) > 80, String(Lstar(R.c)));
  const s = wolfSvg(WOLF_POSES[0]);
  assert.ok(!/#ff5a3c|#ff[0-4][0-9a-f]{3}"/i.test(s), 'no red-orange (enemy eye) colours');
  assert.ok(s.includes('#ffcf7a') && s.includes('#fff1c8'), 'ember heart + warm rim');
});

test('wolf overlays: offsets follow the pose (zero on the rest frame, head moves on the bite)', () => {
  assert.deepEqual(OV_OFF[0], [[0, 0], [0, 0], [0, 0]]);
  const g = wolfGeom(WOLF_POSES[4]), g0 = wolfGeom(WOLF_POSES[0]);
  assert.deepEqual(OV_OFF[4][1], [g.hx - g0.hx, g.hy - g0.hy]);
  assert.equal(OV_OFF[1][2][1], 4); // tail tip wag on ph 0.25
});

test('wolf pose picker: lope by distance, bite on cooldown reset, sit only idle without a target, calm holds frame 0', () => {
  const u = { x: 0, y: 0, atkCd: 0, target: { x: 50, y: 0 } };
  const s = {};
  assert.equal(wolfFrame(s, u, 1 / 60), 0);
  const seen = new Set();
  for (let i = 0; i < 40; i++) { u.x += STRIDE / 16; seen.add(wolfFrame(s, u, 1 / 60)); }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3]);
  u.atkCd = 0.6; assert.equal(wolfFrame(s, u, 1 / 60), 4); // just bit
  let t = 0; while (wolfFrame(s, u, 1 / 60) === 4) { t += 1 / 60; u.atkCd -= 1 / 60; }
  assert.ok(t >= BITE_T - 0.04 && t <= BITE_T + 0.02, String(t));
  // standing next to its prey: stands (frame 0), never sits
  for (let i = 0; i < 60; i++) assert.equal(wolfFrame(s, u, 1 / 60), 0);
  u.target = null; let f = 0; for (let i = 0; i < 30; i++) f = wolfFrame(s, u, 1 / 60);
  assert.equal(f, 5);
  const c = {}, v = { x: 0, y: 0, atkCd: 0, target: {} };
  for (let i = 0; i < 40; i++) { v.x += 2; assert.equal(wolfFrame(c, v, 1 / 60, true), 0); }
  // never writes the unit
  assert.deepEqual(Object.keys(v).sort(), ['atkCd', 'target', 'x', 'y']);
});

test('wolf look: deterministic per id, 4 looks used, jitter within 4%', () => {
  const ov = new Set();
  for (let id = 1; id < 400; id++) { const a = wolfLook(id), b = wolfLook(id); assert.deepEqual(a, b); ov.add(a.ov); assert.ok(a.k >= 0.96 && a.k <= 1.04); }
  assert.deepEqual([...ov].sort(), [-1, 0, 1, 2]);
});
