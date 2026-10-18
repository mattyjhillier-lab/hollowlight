// EN0: bakes the Husk chapter atlas at boot (browser only). Each type's frames come from src/gfx/husk/frames.js as one SVG sheet built by our
// own code (no external references, no untrusted input), rasterised once through an <img> from a Blob URL, drawn into ONE canvas atlas.
// One type per animation frame (lazy slices, like the W1b ground tiles) so the boot never stalls. The cool night-rim outlines (WL6b) are
// derived in canvas from the baked walk/tell frames at half density. On any failure the game keeps the old flat sprites (ready stays false).
import { layoutAtlas, typeSheet, HUSK_IDS, HUSK_TYPES, ATLAS_KEY, RIM_K, TPW } from './husk/frames.js';

const TAU = Math.PI * 2;
export const BLUE_FLOOR = 48;
const nextFrame = () => new Promise((r) => setTimeout(r, 0)); // yield between slices (not rAF: a hidden tab would stall the bake)
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };

async function rasterise(svg) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally { URL.revokeObjectURL(url); }
}

// rim: outline-only copy (dilate by px in 8 directions, keep the ring outside the silhouette), white, half density
function rimInto(ctx, atlas, src, dst, px) {
  const tmp = mk(dst.w, dst.h), t = tmp.getContext('2d');
  for (let a = 0; a < 8; a++) t.drawImage(atlas, src.x, src.y, src.w, src.h, Math.cos((a * TAU) / 8) * px, Math.sin((a * TAU) / 8) * px, dst.w, dst.h);
  t.globalCompositeOperation = 'source-in'; t.fillStyle = '#ffffff'; t.fillRect(0, 0, dst.w, dst.h);
  t.globalCompositeOperation = 'destination-out'; t.drawImage(atlas, src.x, src.y, src.w, src.h, 0, 0, dst.w, dst.h);
  ctx.drawImage(tmp, dst.x, dst.y);
}

export const HUSK_BAKE = { started: false, ready: false, ms: 0, error: '', stage: '', promise: null };

export function bakeHuskAtlas(scene) {
  if (HUSK_BAKE.promise) return HUSK_BAKE.promise;
  HUSK_BAKE.started = true;
  HUSK_BAKE.promise = (async () => {
    const t0 = performance.now();
    try {
      if (scene.textures.exists(ATLAS_KEY)) { HUSK_BAKE.ready = true; return true; }
      const lay = layoutAtlas();
      const cv = mk(lay.w, lay.h), ctx = cv.getContext('2d');
      for (const id of HUSK_IDS) {
        HUSK_BAKE.stage = 'svg ' + id;
        const { svg } = typeSheet(id, lay);
        const img = await rasterise(svg);
        HUSK_BAKE.stage = 'draw ' + id;
        ctx.drawImage(img, 0, lay.types[id].y);
        await nextFrame();
      }
      // WL6d gate G3 (never pure black): the authored inks (socks, tail tip, knot-hole voids, beak) are near-black; under the far-night body
      // tint (V >= ~0.33, jitter x0.9) they fell below RGB 12. Lift the BLUE channel of opaque pixels to >= 48 (cold indigo blacks, Style v1
      // cold bodies); soft shadow/edge pixels (alpha < 0.6) are left alone so shadows stay neutral.
      HUSK_BAKE.stage = 'floor';
      const im = ctx.getImageData(0, 0, lay.w, lay.h), px = im.data;
      for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 153 && px[i + 2] < BLUE_FLOOR) px[i + 2] = BLUE_FLOOR;
      ctx.putImageData(im, 0, 0);
      HUSK_BAKE.stage = 'rims';
      for (const id of HUSK_IDS) {
        const fr = lay.types[id].frames;
        for (const name in fr) if (fr[name].rim) rimInto(ctx, cv, fr[fr[name].rim], fr[name], Math.max(1.5, TPW * RIM_K * 1.0));
      }
      const tex = scene.textures.addCanvas(ATLAS_KEY, cv);
      for (const id of HUSK_IDS) {
        const fr = lay.types[id].frames;
        for (const name in fr) {
          const f = fr[name];
          const pf = tex.add(`${id}:${name}`, 0, f.x, f.y, f.w, f.h);
          pf.customPivot = true; pf.pivotX = f.ox / f.w; pf.pivotY = f.oy / f.h;
        }
      }
      HUSK_BAKE.ready = true;
      return true;
    } catch (err) {
      HUSK_BAKE.error = String((err && err.message) || err);
      console.warn('Husk atlas bake failed; keeping the flat enemy sprites', err);
      return false;
    } finally { HUSK_BAKE.ms = Math.round(performance.now() - t0); }
  })();
  return HUSK_BAKE.promise;
}

export { HUSK_TYPES };
