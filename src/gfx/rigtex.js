// Builds the Wren v2 / pup textures (style A only): one rig atlas + flat Wren (Low tier, crowd outline source, flicker/death) + flat pups (Low tier).
// Called from makeStyleTextures(). Browser-only (Canvas2D); the pure maths and geometry live in rigmath.js / wrenart.js.
import { INV } from './style.js';
import { ROLE } from './palette.js';
import { buildRigAtlas, drawWrenFlat, drawWrenBody, drawPupFlat, FLAT, FLAT_TEXEL, FRAMES, PUP_FLAT, TEX, PUP_K, DU } from './wrenart.js';
import { ELIAS_FRAMES, drawEliasFlat, drawEliasBody, E_FLAT, E_FLAT_TEXEL } from './eliasart.js';
import { withCostume, costumeOverlay, pupCollar, okCost } from './costume.js';

const TAU = Math.PI * 2;
const mk = (w, h) => {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h));
  return cv;
};
const put = (scene, key, cv) => {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return scene.textures.addCanvas(key, cv);
};

// OL1: the flat sprite's pivot = the soles centre, marked as a custom pivot so Phaser mirrors a flipped sprite about the soles
// (without it Phaser mirrors about the texture centre: the Low-tier / iframe / death sprite jumped sideways when facing left).
function flatPivot(tex, box) {
  const f = tex && tex.get();
  if (!f) return;
  f.customPivot = true; f.pivotX = -box.x0 / box.w; f.pivotY = -box.y0 / box.h;
}

// crowd outline: cream ring around the silhouette (drawn above everyone when 3+ enemies close in)
function crowdOutline(scene, fcv, key) {
  const px = 1.1 / INV[key];
  const ocv = mk(fcv.width, fcv.height);
  const o = ocv.getContext('2d');
  for (let a = 0; a < 8; a++) o.drawImage(fcv, Math.cos((a * TAU) / 8) * px, Math.sin((a * TAU) / 8) * px);
  o.globalCompositeOperation = 'source-in';
  const c = ROLE.lanternCore;
  o.fillStyle = `rgb(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255})`; o.fillRect(0, 0, ocv.width, ocv.height);
  o.globalCompositeOperation = 'destination-out'; o.drawImage(fcv, 0, 0);
  put(scene, `${key}_o`, ocv);
  INV[`${key}_o`] = INV[key];
}

// Elias v2: rig atlas + flat sprite (Low tier, crowd outline source, flicker/death)
function makeEliasTextures(scene) {
  const { cv, frames } = buildRigAtlas(mk, ELIAS_FRAMES, 768);
  const tex = put(scene, 'elias_rig', cv);
  for (const [name, f] of Object.entries(frames)) {
    const fr = tex.add(name, 0, f.x, f.y, f.w, f.h);
    fr.customPivot = true; fr.pivotX = f.ox; fr.pivotY = f.oy;
  }
  const fcv = mk(E_FLAT.w * E_FLAT_TEXEL, E_FLAT.h * E_FLAT_TEXEL);
  const fc = fcv.getContext('2d');
  fc.scale(E_FLAT_TEXEL, E_FLAT_TEXEL); fc.translate(-E_FLAT.x0, -E_FLAT.y0);
  drawEliasFlat(fc);
  flatPivot(put(scene, 'hero_elias', fcv), E_FLAT);
  INV.hero_elias = DU / E_FLAT_TEXEL;
  crowdOutline(scene, fcv, 'hero_elias');
}

export function makeRigTextures(scene) {
  const { cv, frames } = buildRigAtlas(mk);
  const tex = put(scene, 'wren_rig', cv);
  for (const [name, f] of Object.entries(frames)) {
    const fr = tex.add(name, 0, f.x, f.y, f.w, f.h);
    fr.customPivot = true; fr.pivotX = f.ox; fr.pivotY = f.oy; // setFrame() then applies the origin
  }
  // flat Wren (same pose as the rig at rest): replaces the old hero_wren; origin = soles centre
  const fcv = mk(FLAT.w * FLAT_TEXEL, FLAT.h * FLAT_TEXEL);
  const fc = fcv.getContext('2d');
  fc.scale(FLAT_TEXEL, FLAT_TEXEL); fc.translate(-FLAT.x0, -FLAT.y0);
  drawWrenFlat(fc);
  flatPivot(put(scene, 'hero_wren', fcv), FLAT);
  INV.hero_wren = DU / FLAT_TEXEL;
  crowdOutline(scene, fcv, 'hero_wren');
  makeEliasTextures(scene);
  // flat pups (Low tier): glow baked in
  for (const pose of ['sit', 'run']) {
    const pcv = mk(PUP_FLAT.w * TEX * PUP_K, PUP_FLAT.h * TEX * PUP_K);
    const pc = pcv.getContext('2d');
    pc.scale(TEX * PUP_K, TEX * PUP_K); pc.translate(-PUP_FLAT.x0, -PUP_FLAT.y0);
    drawPupFlat(pc, pose);
    put(scene, `pup_${pose}`, pcv);
    INV[`pup_${pose}`] = DU / TEX;
  }
}

// ---- WARDROBE v2 Ring Keepsake costume: repaint the EXISTING rig textures in place (same canvas, same frames, same pivots), once per run start.
// Body frame + flat sprite get the palette and the ring motif; the pup's head frames get the trim collar. Nothing here runs per frame. cost = null restores the plain look.
function repaint(scene, key, cv) {
  if (!scene.textures.exists(key)) return false;
  const tex = scene.textures.get(key);
  const src = tex && tex.getSourceImage && tex.getSourceImage();
  if (!src || !src.getContext || src.width !== cv.width || src.height !== cv.height) return false; // layout is deterministic: a mismatch means leave the texture alone
  const ctx = src.getContext('2d');
  ctx.clearRect(0, 0, src.width, src.height); ctx.drawImage(cv, 0, 0);
  if (tex.refresh) tex.refresh();
  return true;
}
const atlasKey = (hero) => (hero === 'wren' ? 'wren_rig' : 'elias_rig');
/** The costume id baked into this hero's rig texture right now (null = plain). The marker lives on the texture, so a rebuilt texture reads as plain. */
export function costumeBaked(scene, hero) {
  const tex = scene.textures.exists(atlasKey(hero)) ? scene.textures.get(atlasKey(hero)) : null;
  return tex && typeof tex.costumeId === 'string' ? tex.costumeId : null;
}
export function paintCostume(scene, hero, cost) {
  const c0 = okCost(cost) ? cost : null;
  const done = () => { if (scene.textures.exists(atlasKey(hero))) scene.textures.get(atlasKey(hero)).costumeId = c0 && typeof c0.id === 'string' ? c0.id : null; };
  withCostume(hero, c0, () => {
    if (hero === 'wren') {
      const frames = FRAMES.map((f) => {
        if (f.name === 'w_body') return { ...f, draw: (c) => { drawWrenBody(c); costumeOverlay(c, 'wren', c0); } };
        if (c0 && f.name.startsWith('p_head_')) return { ...f, draw: (c) => { f.draw(c); pupCollar(c, c0); } };
        return f;
      });
      repaint(scene, 'wren_rig', buildRigAtlas(mk, frames).cv);
      const fcv = mk(FLAT.w * FLAT_TEXEL, FLAT.h * FLAT_TEXEL), fc = fcv.getContext('2d');
      fc.scale(FLAT_TEXEL, FLAT_TEXEL); fc.translate(-FLAT.x0, -FLAT.y0);
      drawWrenFlat(fc, c0 ? (c) => costumeOverlay(c, 'wren', c0) : null);
      repaint(scene, 'hero_wren', fcv);
      for (const pose of ['sit', 'run']) {
        const pcv = mk(PUP_FLAT.w * TEX * PUP_K, PUP_FLAT.h * TEX * PUP_K), pc = pcv.getContext('2d');
        pc.scale(TEX * PUP_K, TEX * PUP_K); pc.translate(-PUP_FLAT.x0, -PUP_FLAT.y0);
        drawPupFlat(pc, pose, c0 ? (c) => pupCollar(c, c0) : null);
        repaint(scene, `pup_${pose}`, pcv);
      }
    } else {
      const frames = ELIAS_FRAMES.map((f) => (f.name === 'e_body' ? { ...f, draw: (c) => { drawEliasBody(c); costumeOverlay(c, 'elias', c0); } } : f));
      repaint(scene, 'elias_rig', buildRigAtlas(mk, frames, 768).cv);
      const fcv = mk(E_FLAT.w * E_FLAT_TEXEL, E_FLAT.h * E_FLAT_TEXEL), fc = fcv.getContext('2d');
      fc.scale(E_FLAT_TEXEL, E_FLAT_TEXEL); fc.translate(-E_FLAT.x0, -E_FLAT.y0);
      drawEliasFlat(fc, c0 ? (c) => costumeOverlay(c, 'elias', c0) : null);
      repaint(scene, 'hero_elias', fcv);
    }
  });
  done();
}
