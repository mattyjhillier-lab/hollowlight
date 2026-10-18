// EN0 enemy rig definitions + frame sheets (pure JS, no DOM): which frames each Husk type bakes, its frame box, world scale, foot offset and
// the eye anchors per frame (read by the WL6b night layer so the eye images sit in the knot-hole sockets). enemytex.js rasterises the sheets.
// Units: du (design units of the locked mock-ups); world units per du = g / 4 (docs/mockups/enemies-husks/roster.mjs, true px = du * g * 2.34 / 4).
import { resetAll, defs, setGrainBox, EYES, clearEyes } from './paint.js';
import { EXTRA_DEFS } from './kit.js';
import { wolfA } from './husks.js';

export const ATLAS_KEY = 'en_atlas';
export const TPW = 5; // atlas texels per world unit (Wren ~5.9; 2.1x the 720p desktop zoom, 1.4x at 1080p)
export const ATLAS_W = 1024;
export const RIM_K = 0.5; // rim outline frames are baked at half density (a soft additive glow)
// Night-eye image size on Husks vs the WL6b size (the locked WL6b eye was sized for the old 18-unit sprites; at full size the ember halo
// covers the whole mask and the Husk reads as 'orb head'). 0.6 puts the cream core inside the knot-hole socket like the locked mock-up
// sheets; contrast re-measured with the WL6d harness (scripts/wl6-measure.mjs contrast). Needs Matt's OK as a WL6b size change.
export const HUSK_EYE_K = { wolf: 0.6 };

// box = [x0, y0, w, h] in du (frame bounds incl. outline, blur and shadow); foot = world units from the sim position down to the feet;
// maskAt = mask centre on the walk pose (du; the death mask-pop starts there), mdx = how far it is thrown forward (du);
// hurtW = the mock-up finish() width used by the hurt squash transform (eye anchors follow it).
// frames: [name, state]. Order matters: index = frame id used at runtime (FR below).
const MASK_BOX = [-58, -46, 116, 88];
export const HUSK_TYPES = {
  wolf: {
    fn: wolfA, maskAt: [44, -48], mdx: 10, g: 0.62, box: [-80, -96, 162, 108], foot: 5, hurtW: 80, mask: MASK_BOX,
    frames: [['w0', { ph: 0 }], ['w1', { ph: 0.25 }], ['w2', { ph: 0.5 }], ['w3', { ph: 0.75 }], ['t0', { tele: 0.5 }], ['t1', { tele: 1 }], ['h', { hurt: 1, ph: 0.1 }], ['b', { ph: 0, noMask: 1 }], ['m', { maskOnly: 1 }]],
  },
};
export const HUSK_IDS = Object.keys(HUSK_TYPES);
// runtime frame ids (same for every type; -1 = the type has no such frame)
export const FR = { w0: 0, w1: 1, w2: 2, w3: 3, t0: 4, t1: 5, h: 6, b: 7, m: 8 };
export const FR_N = 9;
export const RIM_FRAMES = ['w0', 'w1', 'w2', 'w3', 't0', 't1']; // outline frames for the cool night rim (hurt/body reuse w0)

export const wpd = (type) => HUSK_TYPES[type].g / 4; // world units per du
export const texPerDu = (type) => wpd(type) * TPW;

// apply the mock-up hurt squash (kit.js finish: translate(-W*0.06,0) scale(1.06,0.92) rotate(-5 about (-W*0.3, 0))) to a point
export function hurtPoint(W, x, y) {
  const a = (-5 * Math.PI) / 180, cx = -W * 0.3;
  const dx = x - cx, rx = cx + dx * Math.cos(a) - y * Math.sin(a), ry = dx * Math.sin(a) + y * Math.cos(a);
  return [rx * 1.06 - W * 0.06, ry * 0.92];
}

// Pure layout of every type's block in the atlas: grid of frames (cols fit ATLAS_W), rim block (half density) after the frames.
// Returns { w, h, types: { [type]: { x, y, cols, fw, fh, mw, mh, rw, rh, rimY, frames: { name: { x, y, w, h, ox, oy } } } } } (pixels, origin = feet).
export function layoutAtlas() {
  let y = 0;
  const out = { w: ATLAS_W, h: 0, types: {} };
  for (const id of HUSK_IDS) {
    const T = HUSK_TYPES[id], k = texPerDu(id);
    const fw = Math.ceil(T.box[2] * k) + 2, fh = Math.ceil(T.box[3] * k) + 2;
    const mw = Math.ceil(T.mask[2] * k) + 2, mh = Math.ceil(T.mask[3] * k) + 2;
    const frames = {};
    let x = 0, row = y, rowH = 0;
    for (const [name] of T.frames) {
      const isM = name === 'm', w = isM ? mw : fw, h = isM ? mh : fh;
      if (x + w > ATLAS_W) { x = 0; row += rowH; rowH = 0; }
      const bx = isM ? T.mask : T.box;
      frames[name] = { x, y: row, w, h, ox: 1 + -bx[0] * k, oy: 1 + -bx[1] * k };
      x += w; rowH = Math.max(rowH, h);
    }
    // rim block: half density copies of the walk/tell frames
    const rw = Math.ceil(fw * RIM_K), rh = Math.ceil(fh * RIM_K);
    for (const name of RIM_FRAMES) {
      if (!frames[name]) continue;
      if (x + rw > ATLAS_W) { x = 0; row += rowH; rowH = 0; }
      frames['r' + name] = { x, y: row, w: rw, h: rh, ox: frames[name].ox * RIM_K, oy: frames[name].oy * RIM_K, rim: name };
      x += rw; rowH = Math.max(rowH, rh);
    }
    out.types[id] = { y, fw, fh, mw, mh, rw, rh, frames };
    y = row + rowH;
  }
  out.h = y;
  return out;
}

// One SVG sheet per type (frames placed at their atlas position relative to the type block's top) + eye anchors per frame (du, feet origin).
// Eye anchors are returned in du; the runtime converts with wpd(type).
export function typeSheet(id, lay) {
  const T = HUSK_TYPES[id], L = lay.types[id], k = texPerDu(id);
  resetAll();
  setGrainBox(T.box[0], T.box[1], T.box[2], T.box[3]);
  let body = '';
  let bottom = 0;
  const eyes = {};
  for (const [name, st] of T.frames) {
    const fr = L.frames[name];
    clearEyes();
    const r = T.fn(st);
    eyes[name] = EYES.map(([x, y, rr]) => (st.hurt ? [...hurtPoint(T.hurtW, x, y), rr] : [x, y, rr]));
    const bx = name === 'm' ? T.mask : T.box;
    const yy = fr.y - L.y;
    body += `<svg x="${fr.x}" y="${yy}" width="${fr.w}" height="${fr.h}" viewBox="${(bx[0] - 1 / k).toFixed(2)} ${(bx[1] - 1 / k).toFixed(2)} ${(fr.w / k).toFixed(2)} ${(fr.h / k).toFixed(2)}" overflow="hidden">${r.b}</svg>`;
    bottom = Math.max(bottom, yy + fr.h);
  }
  const w = ATLAS_W, h = bottom;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs()}<defs>${EXTRA_DEFS}</defs>${body}</svg>`;
  return { svg, w, h, eyes };
}

// Eye anchors for every type/frame in WORLD units relative to the FEET (the sprite origin; feet sit at sim y + foot), facing +x, unscaled. Pure (no DOM).
// Frames without eyes (b, m) fall back to w0. Cached.
let EYE_CACHE = null;
export function eyeAnchors() {
  if (EYE_CACHE) return EYE_CACHE;
  const lay = layoutAtlas();
  const out = {};
  for (const id of HUSK_IDS) {
    const T = HUSK_TYPES[id], u = wpd(id);
    const { eyes } = typeSheet(id, lay);
    const per = [];
    for (let f = 0; f < FR_N; f++) {
      const name = Object.keys(FR).find((n) => FR[n] === f);
      const src = eyes[name] && eyes[name].length ? eyes[name] : eyes.w0;
      const rmax = Math.max(...eyes.w0.map((e) => e[2]));
      per.push(src.map(([x, y, r]) => [x * u, y * u, HUSK_EYE_K[id] * Math.max(0.75, Math.min(1.15, r / rmax))]));
    }
    out[id] = per;
  }
  EYE_CACHE = out;
  return out;
}

// Per-instance jitter (deterministic from the enemy id; never touches the sim RNG): size, body value, walk phase offset, gait speed.
const hash = (n) => { let h = (n | 0) * 0x9e3779b1; h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
export function jitter(id, out) {
  const a = hash(id), b = hash(id + 7919), c = hash(id + 104729);
  out.s = 0.94 + 0.12 * a; // size +-6%
  out.v = 0.9 + 0.1 * b; // body value 0.90..1.00 (multiplies the tint; never above 1 so no channel overflows)
  out.ph = c; // walk phase offset
  out.sp = 0.92 + 0.16 * ((a + c) % 1); // gait speed
  return out;
}
