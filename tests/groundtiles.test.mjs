import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_PX, TILE_UNITS, DETAIL_MAX, TILE_DRAW, detailContrast } from '../src/gfx/groundtiles.js';

// Minimal fake 2D context: records numeric args (must be finite) and serves a blank image for getImageData.
function fakeCanvas(n) {
  let calls = 0; let bad = 0;
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
      if (k === 'putImageData') return () => {};
      if (k === 'createRadialGradient') return (...a) => { for (const v of a) if (!Number.isFinite(v)) bad++; return { addColorStop() {} }; };
      if (k in t) return t[k];
      return (...a) => { calls++; for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) bad++; };
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  return { width: n, height: n, getContext: () => ctx, stats: () => ({ calls, bad }) };
}

test('tile constants: <=1024 px, 2 texels per world unit, detail cap 18%', () => {
  assert.ok(TILE_PX <= 1024);
  assert.equal(TILE_PX / TILE_UNITS, 2);
  assert.equal(DETAIL_MAX, 0.18);
  assert.deepEqual(Object.keys(TILE_DRAW).sort(), ['hollowA', 'hollowB', 'restoredA', 'restoredB']);
});

test('every tile drawer runs, draws a lot, and never emits NaN/Infinity', () => {
  for (const [name, draw] of Object.entries(TILE_DRAW)) {
    const cv = fakeCanvas(TILE_PX);
    assert.equal(draw(cv), cv);
    const s = cv.stats();
    assert.ok(s.calls > 3000, name + ' calls ' + s.calls);
    assert.equal(s.bad, 0, name);
  }
});

test('detailContrast: flat = 0, a +50% speck is seen, a +10% speck stays under the cap', () => {
  const n = 64; const mk = (v, speck) => { const d = new Uint8ClampedArray(n * n * 4); for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } if (speck) for (let y = 30; y < 36; y++) for (let x = 30; x < 36; x++) { const j = (y * n + x) * 4; d[j] = d[j + 1] = d[j + 2] = speck; } return d; };
  assert.equal(detailContrast(mk(100), n, 12, 0.999), 0);
  assert.ok(detailContrast(mk(100, 160), n, 12, 0.999) > 0.3);
  assert.ok(detailContrast(mk(100, 110), n, 12, 0.999) < DETAIL_MAX);
});
