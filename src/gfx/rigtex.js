// Builds the Wren v2 / pup textures (style A only): one rig atlas + flat Wren (Low tier, crowd outline source, flicker/death) + flat pups (Low tier).
// Called from makeStyleTextures(). Browser-only (Canvas2D); the pure maths and geometry live in rigmath.js / wrenart.js.
import { INV } from './style.js';
import { ROLE } from './palette.js';
import { buildRigAtlas, drawWrenFlat, drawPupFlat, FLAT, FLAT_TEXEL, PUP_FLAT, TEX, PUP_K, DU } from './wrenart.js';

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
  put(scene, 'hero_wren', fcv);
  INV.hero_wren = DU / FLAT_TEXEL;
  // crowd outline: cream ring around the silhouette (drawn above everyone when 3+ enemies close in)
  const px = 1.1 / INV.hero_wren;
  const ocv = mk(fcv.width, fcv.height);
  const o = ocv.getContext('2d');
  for (let a = 0; a < 8; a++) o.drawImage(fcv, Math.cos((a * TAU) / 8) * px, Math.sin((a * TAU) / 8) * px);
  o.globalCompositeOperation = 'source-in';
  const c = ROLE.lanternCore;
  o.fillStyle = `rgb(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255})`; o.fillRect(0, 0, ocv.width, ocv.height);
  o.globalCompositeOperation = 'destination-out'; o.drawImage(fcv, 0, 0);
  put(scene, 'hero_wren_o', ocv);
  INV.hero_wren_o = INV.hero_wren;
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
