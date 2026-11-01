import test from 'node:test';
import assert from 'node:assert/strict';
import { orbSvg, rimSvg, tailSvg, pageSvg, lanceSvg, tornSvg, glyphSheet, glyphLook, KIND, GLYPHS, R, GLYPH_WPD, GLYPH_K, ORB_R, GLYPH_CAPS, CURL_ON } from '../src/gfx/summon/glyph.js';
import { GLYPH_BAKE, GLYPH_KINDS, glyphRects, kindOf, BOOT_KINDS } from '../src/gfx/summon/atlas.js';
import { FRAME_BY_NAME, PACK } from '../src/gfx/summon/frames.js';
import { drawGlyph, drawTornPages } from '../src/gfx/summon/glyphdraw.js';
import { zoomFor } from '../src/gfx/style.js';
import { Lstar } from '../src/gfx/husk/paint.js';

test('glyph art: every bake frame exists, own code only (no external refs, no scripts), kinds lazy (never at boot)', () => {
  for (const [n, k] of GLYPH_BAKE) { assert.ok(FRAME_BY_NAME[n], n); assert.equal(kindOf(n), k, n); assert.ok(!BOOT_KINDS.includes(k)); }
  assert.equal(GLYPH_BAKE.length, 5 + 2 + 1 + 1 + 1 + 2 + 1);
  assert.deepEqual(GLYPH_KINDS.base, ['gbase', 'gflat']);
  for (const e of ['spirit_tempest', 'soul_lance', 'returning_pages']) assert.ok(GLYPH_KINDS[e].length);
  const sheet = glyphSheet(glyphRects().map((r) => ({ ...r })), 1024, PACK.h);
  assert.ok(sheet.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(!/http|<script|javascript:|<image|<foreignObject|on\w+=/i.test(sheet.slice(sheet.indexOf('>') + 1)));
  assert.equal(Object.keys(KIND).sort().join(), 'gbase,gflat,glance,gpage,grim,gtorn');
});

test('glyph look: cyan orb, dark ink rim + tail (the gem separator), cream glyph, gold only on evolved pieces', () => {
  assert.equal(R.c, '#7ff0ff'); assert.ok(Lstar(R.ink) < 40, 'dark ink');
  assert.equal(GLYPHS.length, 5);
  for (let i = 0; i < 5; i++) { const s = orbSvg(i); assert.ok(s.includes('#fff1c8') && s.includes(R.ink)); assert.ok(!s.includes('#ffd36b')); }
  assert.ok(tailSvg(0).includes(R.ink) && tailSvg(9).includes(R.ink));
  for (const s of [rimSvg(), pageSvg(false), pageSvg(true), lanceSvg(), tornSvg()]) assert.ok(s.includes('#ffd36b'), 'gold on evolved pieces');
  assert.ok(!/#ff5a3c|#f00\b|#ff0000/i.test(orbSvg(0) + tailSvg(9) + lanceSvg()), 'no enemy red');
});

test('glyph size: 1.3x orb ~16 px on the 1280x720 desktop (S5 pick), frames >= 1.5 texels per device px', () => {
  const px = 2 * ORB_R * GLYPH_WPD * GLYPH_K * zoomFor(1280, 720);
  assert.equal(GLYPH_K, 1.3); assert.ok(px >= 14.5 && px <= 17, String(px));
  assert.ok(48 / (32 * GLYPH_WPD * GLYPH_K * zoomFor(1280, 720)) >= 1.5);
});

test('glyph tail: curls toward the turn with hysteresis, straight under Calm, never writes the bolt', () => {
  const s = {}; let r;
  const b = { id: 3, vx: 100, vy: 0 };
  r = glyphLook(s, Object.freeze({ ...b }), 0.016); assert.equal(r.tail, 'gtail_0'); assert.equal(r.fr, 'glyph_3');
  let ang = 0;
  for (let i = 0; i < 20; i++) { ang += 0.05; r = glyphLook(s, Object.freeze({ id: 3, vx: Math.cos(ang) * 100, vy: Math.sin(ang) * 100 }), 0.016); }
  assert.equal(r.tail, 'gtail_1'); assert.equal(r.flipY, false); // turning toward +y: curl toward +y (unflipped frame)
  r = glyphLook(s, Object.freeze({ id: 3, vx: Math.cos(ang) * 100, vy: Math.sin(ang) * 100 }), 0.016); assert.equal(r.tail, 'gtail_1', 'hysteresis keeps the curl');
  for (let i = 0; i < 40; i++) r = glyphLook(s, Object.freeze({ id: 3, vx: Math.cos(ang) * 100, vy: Math.sin(ang) * 100 }), 0.016);
  assert.equal(r.tail, 'gtail_0', 'straightens when the turn stops');
  const c = {}; ang = 0;
  for (let i = 0; i < 20; i++) { ang -= 0.05; r = glyphLook(c, { id: 1, vx: Math.cos(ang) * 100, vy: Math.sin(ang) * 100 }, 0.016, true); }
  assert.equal(r.tail, 'gtail_0', 'Calm: straight'); assert.ok(CURL_ON > 0);
});

// fake pool / image for drawGlyph
const img = () => { const o = { calls: {} }; for (const m of ['setFrame', 'setOrigin', 'setPosition', 'setRotation', 'setFlip', 'setScale', 'setDepth', 'setAlpha']) o[m] = (...a) => { o.calls[m] = a; return o; }; return o; };
const pool = () => { const map = new Map(); return { map, get: (id) => { if (!map.has(id)) map.set(id, img()); return map.get(id); } }; };
test('glyph draw: per-tier caps on tails (none on Low) and gold rims (Tempest only)', async () => {
  const { SUM_ART } = await import('../src/gfx/summon/atlas.js');
  for (const k of ['gbase', 'gflat', 'grim', 'gtorn', 'gpage', 'glance']) SUM_ART.kinds.add(k);
  const run = (tier, evo, n) => {
    const P = { glyph: pool(), tail: pool(), rim: pool() }, o = { pools: P, low: tier === 'low', tier, phone: false, calm: false, dt: 0.016, depth: 1, counts: { tails: 0, rims: 0 }, st: new Map(), tick: 1 };
    for (let i = 0; i < n; i++) drawGlyph({ id: i, x: 0, y: 0, vx: 100, vy: 0, evo }, o);
    return { tails: P.tail.map.size, rims: P.rim.map.size, glyphs: P.glyph.map.size, fr: P.glyph.map.get(0).calls.setFrame[0] };
  };
  assert.deepEqual(run('high', null, 60), { tails: GLYPH_CAPS.high.tails, rims: 0, glyphs: 60, fr: 'glyph_0' });
  assert.equal(run('med', 'spirit_tempest', 60).rims, GLYPH_CAPS.med.rims);
  const lo = run('low', 'spirit_tempest', 60); assert.equal(lo.tails, 0); assert.equal(lo.rims, GLYPH_CAPS.low.rims); assert.equal(lo.fr, 'flat_glyph');
  // lance capsule and pages
  const P = { glyph: pool(), tail: pool(), rim: pool() }, o = { pools: P, low: false, tier: 'high', calm: false, dt: 0.016, depth: 1, counts: { tails: 0, rims: 0 }, st: new Map(), tick: 1 };
  assert.equal(drawGlyph({ id: 1, x: 0, y: 0, vx: 1, vy: 0, r: 11, lance: true }, o), 'lance'); assert.equal(P.glyph.get(1).calls.setFrame[0], 'lance_0');
  assert.equal(drawGlyph({ id: 2, x: 0, y: 0, vx: 1, vy: 0, pages: true, back: true }, o), 'page'); assert.equal(P.glyph.get(2).calls.setFrame[0], 'page_1'); assert.ok(!P.tail.map.has(2), 'home leg: no ink tail');
  // torn page only on the Tempest burst ring (r 46), not on the blast rings (r 22)
  const tp = pool();
  assert.equal(drawTornPages([{ kind: 'ring', color: '#7ff0ff', r: 46, ttl: 0.2, x: 0, y: 0 }, { kind: 'ring', color: '#7ff0ff', r: 22, ttl: 0.1, x: 0, y: 0 }], tp, 1), 1);
});
