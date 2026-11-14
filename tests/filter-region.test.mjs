// FREEZE-1 regression: SVG filter regions in the summon sheets must stay small. WebKit (iPhone Safari) runs SVG filters on the CPU over the whole
// filter region, not just the drawn pixels; a 6000 x 6000 du region made each gold-rim / Echo frame cost seconds and an evolution froze the game ~30 s.
import test from 'node:test';
import assert from 'node:assert/strict';
import { wolfRects, ravenRects, orbitRects, glyphRects } from '../src/gfx/summon/atlas.js';
import { wolfSheet, FILTER_REGION } from '../src/gfx/summon/wolf.js';
import { ravenSheet } from '../src/gfx/summon/raven.js';
import { flameSheet } from '../src/gfx/summon/orbit.js';
import { glyphSheet } from '../src/gfx/summon/glyph.js';

const SHEETS = [['wolf', wolfRects, wolfSheet], ['raven', ravenRects, ravenSheet], ['orbit', orbitRects, flameSheet], ['glyph', glyphRects, glyphSheet]];
const MAX_AREA = 60000; // du^2 (the union region is 274 x 166 = 45 484)
const BLUR_MARGIN = 9; // 3 x the widest blur (stdDeviation 3)
const num = (s, k) => { const m = s.match(new RegExp(`\\b${k}="(-?[\\d.]+)"`)); return m ? Number(m[1]) : null; };

for (const [name, rectsOf, sheet] of SHEETS) {
  test(`filter regions: ${name} sheet regions are small and cover every frame box`, () => {
    for (const r of rectsOf()) {
      const svg = sheet([{ ...r, x: 0, y: 0 }], r.w, r.h);
      const filters = svg.match(/<filter\b[^>]*>/g) || [];
      const boxes = [...svg.matchAll(/<svg x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*" viewBox="([^"]+)"/g)].map((m) => m[1].split(/\s+/).map(Number));
      assert.ok(boxes.length >= 1, `${name}/${r.kind}: nested frame svg found`);
      for (const f of filters) {
        if (!/userSpaceOnUse/.test(f)) { // objectBoundingBox regions must be percentages of the element, never huge numbers
          for (const k of ['width', 'height']) { const v = f.match(new RegExp(`\\b${k}="([^"]+)"`)); if (v) assert.match(v[1], /%$/, `${name}/${r.kind}: ${f}`); }
          continue;
        }
        const x = num(f, 'x'), y = num(f, 'y'), w = num(f, 'width'), h = num(f, 'height');
        if (/id="grain"/.test(f)) continue; // husk grain: sized by setGrainBox to the frame box
        assert.ok(w * h <= MAX_AREA, `${name}/${r.kind}: filter region ${w} x ${h} du is too large for WebKit: ${f}`);
        for (const [bx, by, bw, bh] of boxes) {
          assert.ok(x <= bx - BLUR_MARGIN && y <= by - BLUR_MARGIN && x + w >= bx + bw + BLUR_MARGIN && y + h >= by + bh + BLUR_MARGIN, `${name}/${r.kind}: region ${[x, y, w, h]} does not cover frame box ${[bx, by, bw, bh]} + ${BLUR_MARGIN}`);
        }
      }
    }
  });
}

test('filter regions: the shared region constant is the small one', () => {
  assert.ok(FILTER_REGION[2] * FILTER_REGION[3] <= MAX_AREA);
});
