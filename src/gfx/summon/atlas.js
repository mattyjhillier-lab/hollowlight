// S0: bakes the `sum_atlas` texture at boot from code (same pipeline as critteratlas / en_atlas). S1: the Ghost Wolf A frames (wolf.js SVG sheet)
// are rasterised once through an <img> from a Blob URL (our own code, no external references, no untrusted input) into their packed rects,
// then the texture is re-uploaded; until that lands (or on any failure) RunScene keeps today's wolf sprite (SUM_ART.wolf stays false).
// ?summons=0 skips the bake entirely and the game keeps today's sprites (sprites.js wolfU / raven / bolt / orb).
import { PACK, SUM_KEY, TEXELS_PER_UNIT, PAGE_W, FRAME_BY_NAME } from './frames.js';
import { paintAll } from './paint.js';
import { wolfSheet } from './wolf.js';

export { SUM_KEY };
export const SUM_ART = { wolf: false, wolfMs: 0, wolfMainMs: 0, error: '', promise: null }; // wolfMs = wall time incl. the async SVG decode; wolfMainMs = main-thread work only
export function drawSummonAtlas(cv, packed = PACK) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  return paintAll(c, packed);
}

// wolf frames to bake: [frame name, kind, index]
export const WOLF_BAKE = [
  ...[0, 1, 2, 3, 4, 5].map((i) => ['wolf_' + i, 'base', i]),
  ...[0, 1, 2].map((i) => ['wolf_ov' + i, 'ov', i]),
  ['flat_wolf', 'flat', 0],
];
export function wolfRects(packed = PACK) {
  return WOLF_BAKE.map(([name, kind, i]) => { const f = packed.frames[FRAME_BY_NAME[name].id]; return { name, kind, i, x: f.x, y: f.y, w: f.w, h: f.h }; });
}

// Registers the atlas as a Phaser texture with one named frame per sprite. Returns { inv, ms, tex, cv } (world units per texel, bake milliseconds)
// or null when disabled. `now` is injectable for tests.
export function makeSummonAtlas(scene, mkCanvas, { enabled = true, now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) } = {}) {
  if (!enabled) return null;
  const t0 = now();
  const cv = mkCanvas(PAGE_W, PACK.h);
  drawSummonAtlas(cv);
  if (scene.textures.exists(SUM_KEY)) scene.textures.remove(SUM_KEY);
  const tex = scene.textures.addCanvas(SUM_KEY, cv);
  for (const f of PACK.frames) tex.add(f.name, 0, f.x, f.y, f.w, f.h);
  const ms = now() - t0;
  return { inv: 1 / TEXELS_PER_UNIT, ms, tex, cv };
}

// S1: async wolf art bake (browser only). Resolves true when the wolf frames are in the texture.
export function bakeWolfArt(sa) {
  if (SUM_ART.promise) return SUM_ART.promise;
  SUM_ART.promise = (async () => {
    const t0 = performance.now();
    try {
      const rects = wolfRects();
      const t1 = performance.now();
      const url = URL.createObjectURL(new Blob([wolfSheet(rects, PAGE_W, PACK.h)], { type: 'image/svg+xml' }));
      SUM_ART.wolfMainMs = performance.now() - t1;
      let img;
      try { img = new Image(); img.decoding = 'async'; img.src = url; await img.decode(); } finally { URL.revokeObjectURL(url); }
      const t2 = performance.now();
      const c = sa.cv.getContext('2d');
      for (const r of rects) c.clearRect(r.x, r.y, r.w, r.h);
      for (const r of rects) c.drawImage(img, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
      if (sa.tex && sa.tex.refresh) sa.tex.refresh();
      SUM_ART.wolf = true;
      SUM_ART.wolfMainMs += performance.now() - t2;
    } catch (e) { SUM_ART.error = String((e && e.message) || e); SUM_ART.wolf = false; }
    SUM_ART.wolfMs = performance.now() - t0;
    return SUM_ART.wolf;
  })();
  return SUM_ART.promise;
}
