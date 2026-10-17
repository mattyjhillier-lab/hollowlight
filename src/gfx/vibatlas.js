// WL6c: builds the per-frame vibrancy tints for one canvas atlas texture (one readback of the atlas, once, lazily). No Phaser import: takes the scene.
import { VibTints } from './vibrancy.js';

export function vibTintsFor(scene, key) {
  try {
    const tex = scene.textures.get(key);
    const src = tex && tex.source && tex.source[0] && tex.source[0].image;
    if (!src || !src.width || !src.height) return null;
    let cv = src;
    if (typeof src.getContext !== 'function') { cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); }
    const g = cv.getContext('2d', { willReadFrequently: true });
    const data = g.getImageData(0, 0, cv.width, cv.height).data;
    const frames = [];
    for (const name of tex.getFrameNames()) { const f = tex.get(name); frames.push({ name, x: f.cutX, y: f.cutY, w: f.cutWidth, h: f.cutHeight }); }
    return new VibTints(data, cv.width, frames);
  } catch (err) {
    console.warn('[vibrancy] atlas readback failed, tint-only vibrancy off for', key, err && err.message);
    return null;
  }
}
