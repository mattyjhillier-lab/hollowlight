import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/gfx/rigmath.js';
import { shelfPack, TEX } from '../src/gfx/wrenart.js';
import { ELIAS_FRAMES, E_EXPR, E_ANCHOR, E_FLAT } from '../src/gfx/eliasart.js';

test('A2 elias atlas: unique names, pivots inside frames, small, no overlaps', () => {
  const names = ELIAS_FRAMES.map((f) => f.name); assert.equal(new Set(names).size, names.length);
  assert.ok(ELIAS_FRAMES.length <= 14);
  const items = ELIAS_FRAMES.map((f) => ({ name: f.name, w: Math.ceil((f.bb[2] - f.bb[0]) * TEX), h: Math.ceil((f.bb[3] - f.bb[1]) * TEX) }));
  const pk = shelfPack(items, 768);
  assert.ok(pk.w <= 768 && pk.h <= 512, `atlas ${pk.w}x${pk.h}`);
  const r = Object.values(pk.rects);
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
    const a = r[i]; const b = r[j];
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'overlap');
  }
  for (const f of ELIAS_FRAMES) assert.ok(f.pv[0] >= f.bb[0] && f.pv[0] <= f.bb[2] && f.pv[1] >= f.bb[1] && f.pv[1] <= f.bb[3], `pivot inside ${f.name}`);
});

test('A2 elias: every expression has a head frame; anchors sit inside the flat box', () => {
  for (const e of Object.keys(E_EXPR)) assert.ok(ELIAS_FRAMES.some((f) => f.name === `e_head_${e}`), e);
  for (const k of ['lantern', 'crown', 'hand', 'neck']) {
    const [x, y] = E_ANCHOR[k];
    assert.ok(x > E_FLAT.x0 && x < E_FLAT.x0 + E_FLAT.w && y > E_FLAT.y0 && y < E_FLAT.y0 + E_FLAT.h, k);
  }
});

test('A2 elias expression picker priority: death > hurt > cast > low hp > blink > kind', () => {
  assert.equal(M.pickEliasExpr(true, true, true, true, true), 'death');
  assert.equal(M.pickEliasExpr(false, true, true, true, true), 'hurt');
  assert.equal(M.pickEliasExpr(false, false, true, true, true), 'brace');
  assert.equal(M.pickEliasExpr(false, false, false, true, true), 'tender');
  assert.equal(M.pickEliasExpr(false, false, false, false, true), 'blink');
  assert.equal(M.pickEliasExpr(false, false, false, false, false), 'kind');
});

test('A2 staff swing is bounded and finite for any input', () => {
  for (let i = 0; i <= 100; i++) { const t = M.staffTilt(i / 100, 1); assert.ok(t > 0 && t < 6.3); }
  assert.equal(M.staffTilt(0.3, 0), 1);
  assert.ok(Number.isFinite(M.staffTilt(NaN, NaN)) && Number.isFinite(M.staffTilt(Infinity, 9)));
});

test('A2 wheel flare 1..1.5, casting only in the first 0.7 s, safe on null/NaN', () => {
  assert.equal(M.wheelFlare(null), 1);
  assert.equal(M.wheelCasting(null), false);
  for (let age = 0; age < 7; age += 0.1) for (const ttl of [6, 0.3, 0, -1, NaN]) { const f = M.wheelFlare({ age, ttl }); assert.ok(f >= 1 && f <= 1.5); }
  assert.ok(Math.abs(M.wheelFlare({ age: 1, ttl: 3 }) - 1.5) < 1e-9);
  assert.equal(M.wheelFlare({ age: 1, ttl: 0 }), 1);
  assert.equal(M.wheelCasting({ age: 0.2, ttl: 5 }), true);
  assert.equal(M.wheelCasting({ age: 1, ttl: 5 }), false);
});
