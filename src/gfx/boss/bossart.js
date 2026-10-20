// ELDER TREANT art bake (B3). The LOCKED take A painter (src/gfx/husk/treant.js, SVG strings from our own code: no external references,
// no untrusted input) is rasterised frame by frame into ONE canvas texture, lazily (started when the run passes BAKE_AT, finished long before
// the 14:00 arrival; each frame is its own small SVG -> <img> -> drawImage, one per slice so the frame never stalls). Low tier bakes only the
// three phase poses + the last death frame (one flat sprite per phase). Until the bake is done the scene keeps the old flat 'treant' sprite.
// The pure parts (frame list, layout, budget) are unit-tested in Node; bake() needs a browser.
import { treantA, treantDeath, seedPod } from '../husk/treant.js';
import { resetAll, defs, setGrainBox } from '../husk/paint.js';
import { EXTRA_DEFS } from '../husk/kit.js';

export const BOSS_ATLAS = 'boss_atlas';
export const POD_KEY = 'boss_pod';
export const SAP_KEY = 'boss_sap';
export const DU = 4; // design units per world unit (the painter draws ~340 du = ~85 world units tall)
export const BAKE_AT = 600; // run seconds: start the lazy bake (a run that starts later bakes at once)
export const BOX = [-262, -368, 484, 394]; // du: frame bounds incl. raised arms, the sweep arm, crown, shadow
export const ATLAS_W = 2048;
// texels per world unit by quality tier (desktop 720p shows ~2.4 px/u, 1080p ~3.6; phones ~2.7): measured budget in tests (<= 2048 x 1024)
export const TPW = { high: 3.2, med: 2.8, low: 2.2 };
// [name, painter state]; ph 1..3 = phase look (crown full / thinning + veins / bare + glowing chest); tele = the tell pose
export const FRAMES_FULL = [
  ['p1', { ph: 1 }], ['p1s', { ph: 1, tele: 'slam' }], ['p1t', { ph: 1, tele: 'thorn' }],
  ['p2', { ph: 2 }], ['p2s', { ph: 2, tele: 'slam' }], ['p2w', { ph: 2, tele: 'sweep' }], ['p2t', { ph: 2, tele: 'thorn' }],
  ['p3', { ph: 3 }], ['p3s', { ph: 3, tele: 'slam' }], ['p3w', { ph: 3, tele: 'sweep' }], ['p3t', { ph: 3, tele: 'thorn' }],
  ['d1', { death: 0.3 }], ['d2', { death: 0.55 }], ['d3', { death: 0.78 }], ['d4', { death: 1 }],
];
export const FRAMES_LOW = [['p1', { ph: 1 }], ['p2', { ph: 2 }], ['p3', { ph: 3 }], ['d4', { death: 1 }]];
export const framesFor = (tier) => (tier === 'low' ? FRAMES_LOW : FRAMES_FULL);

// which frame shows: phase 0..2, the live pose ('' | move id | 'stagger'), the death beat k (0..1, -1 = alive). Low falls back to the phase pose.
const POSE = { slam: 's', sweep: 'w', fan: 't', nova: 't', seeds: 't', lanes: 's', eruption: 't' };
export function frameFor(names, phase, pose, deathK) {
  if (deathK >= 0) { const d = deathK < 0.4 ? 'd1' : deathK < 0.62 ? 'd2' : deathK < 0.85 ? 'd3' : 'd4'; return names.has(d) ? d : names.has('d4') && deathK >= 0.85 ? 'd4' : `p${Math.min(3, phase + 1)}`; }
  const base = `p${Math.min(3, Math.max(1, phase + 1))}`;
  const s = POSE[pose];
  if (s && names.has(base + s)) return base + s;
  return base;
}

// Pure layout: frames on shelves of ATLAS_W; returns { w, h, k (texels per du), frames: { name: { x, y, w, h, ox, oy } } } (origin = feet)
export function layout(tier) {
  const k = TPW[tier] / DU;
  const fw = Math.ceil(BOX[2] * k) + 2, fh = Math.ceil(BOX[3] * k) + 2;
  const frames = {};
  let x = 0, y = 0, mx = 0;
  for (const [name] of framesFor(tier)) {
    if (x + fw > ATLAS_W) { x = 0; y += fh; }
    frames[name] = { x, y, w: fw, h: fh, ox: 1 - BOX[0] * k, oy: 1 - BOX[1] * k };
    x += fw; mx = Math.max(mx, x);
  }
  return { w: mx, h: y + fh, k, frames };
}

// one frame's SVG (own <defs>; the painter's ids are reset per frame)
export function frameSvg(st, w, h, k) {
  resetAll();
  setGrainBox(BOX[0], BOX[1], BOX[2], BOX[3]);
  const r = st.death !== undefined ? treantDeath({ k: st.death }) : treantA(st);
  const body = `<svg x="0" y="0" width="${w}" height="${h}" viewBox="${(BOX[0] - 1 / k).toFixed(2)} ${(BOX[1] - 1 / k).toFixed(2)} ${(w / k).toFixed(2)} ${(h / k).toFixed(2)}" overflow="hidden">${r.b}${r.e}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs()}<defs>${EXTRA_DEFS}</defs>${body}</svg>`;
}

// the small adds: Seed Pod (g 0) and Sapling Husk (g 1), ADD_TEX square, feet at (ADD_TEX/2, ADD_FOOT); drawn at ADD_WPD world units per du
// (a pod ~16 du = 8 u wide, a sapling ~32 du = 16 u: about a Root Crawler, an ordinary foe)
export const ADD_TEX = 80, ADD_K = 2, ADD_FOOT = 64, ADD_WPD = 0.5;
export function addSvg(g) {
  resetAll();
  const r = seedPod({ g });
  const vb = [-(ADD_TEX / 2) / ADD_K, -ADD_FOOT / ADD_K, ADD_TEX / ADD_K, ADD_TEX / ADD_K].map((v) => v.toFixed(2)).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ADD_TEX}" height="${ADD_TEX}" viewBox="${vb}">${defs()}<defs>${EXTRA_DEFS}</defs>${r.b}${r.e}</svg>`;
}

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
const nextSlice = () => new Promise((r) => setTimeout(r, 0));

// Browser: bake into canvas textures. scene.textures gets BOSS_ATLAS (frames added) and the two add textures (drawn into existing canvases).
// Returns { ok, ms, bytes }. Any failure leaves ok false (the scene keeps the flat sprites).
export async function bake(scene, tier) {
  const t0 = performance.now();
  try {
    const L = layout(tier);
    const can = document.createElement('canvas');
    can.width = L.w; can.height = L.h;
    const ctx = can.getContext('2d');
    for (const [name, st] of framesFor(tier)) {
      const fr = L.frames[name];
      const img = await rasterise(frameSvg(st, fr.w, fr.h, L.k));
      ctx.drawImage(img, fr.x, fr.y);
      await nextSlice();
    }
    if (scene.textures.exists(BOSS_ATLAS)) scene.textures.remove(BOSS_ATLAS);
    const tex = scene.textures.addCanvas(BOSS_ATLAS, can);
    for (const name in L.frames) { const fr = L.frames[name]; tex.add(name, 0, fr.x, fr.y, fr.w, fr.h); }
    for (const [key, g] of [[POD_KEY, 0], [SAP_KEY, 1]]) {
      const t = scene.textures.get(key);
      if (!t || !t.getCanvas) continue;
      const img = await rasterise(addSvg(g));
      const c2 = t.getContext();
      c2.clearRect(0, 0, ADD_TEX, ADD_TEX);
      c2.drawImage(img, 0, 0);
      t.refresh();
    }
    return { ok: true, ms: performance.now() - t0, bytes: L.w * L.h * 4, layout: L };
  } catch (e) {
    return { ok: false, ms: performance.now() - t0, bytes: 0, err: String(e && e.message) };
  }
}
