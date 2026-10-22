import test from 'node:test';
import assert from 'node:assert/strict';
import { FRAMES, FRAME_COUNT, FRAME_BY_NAME, PACK, packFrames, texelsTotal, TEXELS_PER_UNIT, PAGE_W, MAX_PAGE_H, SUM_KEY } from '../src/gfx/summon/frames.js';
import { makeSummonAtlas, drawSummonAtlas } from '../src/gfx/summon/atlas.js';
import { parseParams } from '../src/params.js';
import { zoomFor } from '../src/gfx/style.js';
import { WOLF_LEN_DU, WOLF_WPD, WOLF_JITTER, WOLF_BOX, ALPHA_K, ALPHA_BOX } from '../src/gfx/summon/wolf.js';

const count = (g) => FRAMES.filter((f) => f.group === g).length;

test('summon frames: counts match the section 5 budget', () => {
  assert.equal(FRAME_COUNT, 6 + 3 + 6 + 6 + 7 + 2 + 5 + 2 + 3 + 3 + 1 + 10 + 4 + 6 + 6 + 1 + 6); // S2: + gold-rimmed pack 6, Light Trails 6, Low evolved flat; S3: + gold raven poses 6
  assert.equal(count('ravg'), 6);
  assert.equal(FRAMES.filter((f) => f.name.startsWith('wolf_') && !f.name.startsWith('wolf_ov')).length, 6);
  assert.equal(FRAMES.filter((f) => f.name.startsWith('wolf_ov')).length, 3);
  assert.equal(count('alpha'), 6);
  assert.equal(count('echo'), 6);
  assert.equal(count('raven'), 7);
  assert.equal(FRAMES.filter((f) => f.name.startsWith('raven_flat')).length, 2);
  assert.equal(FRAMES.filter((f) => f.name.startsWith('glyph_')).length, 5);
  assert.equal(FRAMES.filter((f) => f.name.startsWith('page_')).length, 2);
  assert.equal(FRAMES.filter((f) => f.name.startsWith('flame_big')).length, 3);
  assert.equal(FRAMES.filter((f) => /^flame_\d/.test(f.name)).length, 3);
  assert.equal(count('decal'), 10);
  assert.equal(FRAMES.filter((f) => f.name.startsWith('flat_')).length, 5);
  assert.equal(count('wolfg'), 6); assert.equal(count('lfoot'), 6);
});

test('summon frames: unique names and ids, sizes and anchors in range', () => {
  assert.equal(new Set(FRAMES.map((f) => f.name)).size, FRAME_COUNT);
  FRAMES.forEach((f, i) => {
    assert.equal(f.id, i); assert.ok(Number.isInteger(f.w) && Number.isInteger(f.h) && f.w >= 16 && f.h >= 16 && f.w <= 256 && f.h <= 256, f.name);
    assert.ok(f.ax > 0 && f.ax < 1 && f.ay > 0 && f.ay < 1, f.name);
    assert.equal(FRAME_BY_NAME[f.name], f);
  });
});

test('summon frames: wolf is 36-42 px long on the 1280x720 desktop (locked) incl. the 4% jitter, Alpha frame is ~1.7x', () => {
  const z = zoomFor(1280, 720); // device px per world unit
  for (const j of [-1, 1]) { const px = WOLF_LEN_DU * WOLF_WPD * (1 + j * WOLF_JITTER) * z; assert.ok(px >= 36 && px <= 42, String(px)); }
  // the wolf frame box is the du box at 1 texel per du, so the wolf fits its frame
  for (const f of FRAMES.filter((x) => /^wolf_(\d|ov\d)$/.test(x.name))) { assert.equal(f.w, WOLF_BOX[2]); assert.equal(f.h, WOLF_BOX[3]); }
  // ~0.75x a Fell Wolf (Husk wolf: g 0.62 -> 0.155 world units per du)
  assert.ok(WOLF_WPD / 0.155 > 0.9 && WOLF_WPD / 0.155 < 1.1);
  // S2: the Alpha is baked at 1 texel per du (132 x 96 du box, room for the frost mane) and DRAWN at ALPHA_K = 1.7x the wolf
  assert.equal(ALPHA_K, 1.7); assert.deepEqual([FRAME_BY_NAME.alpha_0.w, FRAME_BY_NAME.alpha_0.h], [ALPHA_BOX[2], ALPHA_BOX[3]]);
  for (const j of [0]) { const px = WOLF_LEN_DU * WOLF_WPD * ALPHA_K * z; assert.ok(px >= 61 && px <= 71, String(px + j)); }
  // ground anchors sit low (feet), flyers centred
  assert.ok(FRAME_BY_NAME.wolf_0.ay > 0.8); assert.equal(FRAME_BY_NAME.raven_up.ay, 0.5);
});

test('summon pack: no overlaps, inside the page, height within the memory budget, deterministic', () => {
  const p = PACK.frames;
  assert.equal(p.length, FRAME_COUNT);
  for (const f of p) { assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= PAGE_W && f.y + f.h <= PACK.h, f.name); }
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
    const a = p[i], b = p[j];
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${a.name} overlaps ${b.name}`);
  }
  assert.ok(PACK.h <= MAX_PAGE_H && PACK.h % 16 === 0 && PACK.h * PAGE_W * 4 <= 2.5 * 1048576, String(PACK.h)); // <= 2.5 MB GPU
  assert.deepEqual(packFrames().frames.map((f) => [f.x, f.y]), p.map((f) => [f.x, f.y]));
  assert.ok(texelsTotal() <= PAGE_W * PACK.h, 'frames fit the page'); // memory: PAGE_W * h * 4 bytes
});

// minimal fake 2D context: counts calls, accepts everything the painter uses
function fakeCtx() {
  const calls = { fill: 0, clip: 0, clear: 0 };
  const grad = { addColorStop() {} };
  const c = new Proxy({}, {
    get: (_, k) => {
      if (k === 'calls') return calls;
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
      if (k === 'fill') return () => { calls.fill++; };
      if (k === 'clip') return () => { calls.clip++; };
      if (k === 'clearRect') return () => { calls.clear++; };
      return () => {};
    },
    set: () => true,
  });
  return c;
}
const fakeCanvas = (w, h) => { const c = fakeCtx(); return { width: w, height: h, getContext: () => c, ctx: c }; };

test('summon atlas: bakes every frame once, clipped; registers one named texture frame each', () => {
  const cv = fakeCanvas(PAGE_W, PACK.h);
  assert.equal(drawSummonAtlas(cv), FRAME_COUNT);
  assert.equal(cv.ctx.calls.clip, FRAME_COUNT); assert.ok(cv.ctx.calls.fill > FRAME_COUNT);
  const added = []; let removed = 0, key = null, made = null;
  const scene = { textures: { exists: () => true, remove: () => { removed++; }, addCanvas: (k, c) => { key = k; return { add: (n, s, x, y, w, h) => added.push({ n, x, y, w, h }) }; } } };
  let t = 0;
  const r = makeSummonAtlas(scene, (w, h) => { made = [w, h]; return fakeCanvas(w, h); }, { now: () => (t += 5) });
  assert.equal(key, SUM_KEY); assert.equal(removed, 1); assert.deepEqual(made, [PAGE_W, PACK.h]);
  assert.equal(added.length, FRAME_COUNT);
  for (const a of added) { const f = FRAME_BY_NAME[a.n]; assert.ok(f && a.w === f.w && a.h === f.h); }
  assert.equal(r.inv, 1 / TEXELS_PER_UNIT); assert.equal(r.ms, 5);
});

test('summon atlas: ?summons=0 bakes nothing and touches no texture (today\'s sprites stay)', () => {
  assert.equal(parseParams('').summons, true);
  assert.equal(parseParams('?summons=0').summons, false);
  assert.equal(parseParams('?summons=x').summons, true);
  let touched = 0;
  const scene = { textures: new Proxy({}, { get: () => () => { touched++; } }) };
  assert.equal(makeSummonAtlas(scene, () => { touched++; return fakeCanvas(1, 1); }, { enabled: false }), null);
  assert.equal(touched, 0);
});
