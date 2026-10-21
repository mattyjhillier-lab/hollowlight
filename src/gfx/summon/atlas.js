// S0: bakes the `sum_atlas` texture at boot from code (same pipeline as critteratlas / en_atlas). Nothing draws from it yet (S1+).
// ?summons=0 skips the bake entirely and the game keeps today's sprites (sprites.js wolfU / raven / bolt / orb).
import { PACK, SUM_KEY, TEXELS_PER_UNIT, PAGE_W } from './frames.js';
import { paintAll } from './paint.js';

export { SUM_KEY };
export function drawSummonAtlas(cv, packed = PACK) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  return paintAll(c, packed);
}

// Registers the atlas as a Phaser texture with one named frame per sprite. Returns { inv, ms } (world units per texel, bake milliseconds)
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
  return { inv: 1 / TEXELS_PER_UNIT, ms };
}
