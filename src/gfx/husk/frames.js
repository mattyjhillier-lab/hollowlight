// EN0 enemy rig definitions + frame sheets (pure JS, no DOM): which frames each Husk type bakes, its frame box, world scale, foot offset and
// the eye anchors per frame (read by the WL6b night layer so the eye images sit in the knot-hole sockets). enemytex.js rasterises the sheets.
// Units: du (design units of the locked mock-ups); world units per du = g / 4 (docs/mockups/enemies-husks/roster.mjs, true px = du * g * 2.34 / 4).
import { resetAll, defs, setGrainBox, EYES, SOCKS, clearEyes, setEyeSpecies, glowSvg, coreShape } from './paint.js';
import { EXTRA_DEFS } from './kit.js';
import { wolfA, crowA, crawlerA } from './husks.js';
import { stoatA, toadA, hartA } from './husks2.js';
import { maneA } from './husks3.js';

export const ATLAS_KEY = 'en_atlas';
export const TPW = 5; // atlas texels per world unit (Wren ~5.9; 2.1x the 720p desktop zoom, 1.4x at 1080p)
export const ATLAS_W = 1024;
export const RIM_K = 0.5; // rim outline frames are baked at half density (a soft additive glow)
// EYES IN SOCKETS (2026-10-18; supersedes the EN0 0.6-0.9x night-eye size): the eyes are baked INTO each frame's knot-hole sockets, and the
// night glow is a socket-shaped additive sprite per socket ('eg' glow, 'ec' core, 'eG' glow+core in one image, 'eh'/'eH' the same under the High bloom), baked at EYE_TEX x the frame density.
export const EYE_TEX = 2;
const EYE_PAD = 3; // du of faint spill around the socket in the glow frames
// box = [x0, y0, w, h] in du (frame bounds incl. outline, blur and shadow); foot = world units from the sim position down to the feet;
// maskAt = mask centre on the walk pose (du; the death mask-pop starts there), mdx = how far it is thrown forward (du);
// dayK = body value multiplier once the arc darkens bodies for daylight (bodyK < 1; WL6d G2: the mid-grey crow needs |dL*| >= 6 on bright ground);
// hurtW = the mock-up finish() width used by the hurt squash transform (eye anchors follow it).
// tellT = seconds into the tell when the frame switches t0 -> t1 (types with tell frames only); stride = world units moved per walk cycle.
// frames: [name, state]. Order matters: index = frame id used at runtime (FR below).
const MASK_BOX = [-58, -46, 116, 88];
// dayRim = alpha of the dark daylight outline (bodyK < 1) for the dawn |dL*| >= 6 gate (EN2 misses: crow 70/140 desk, crawler 220 landscape; wolf 140 corrupt landscape after the socket eyes)
export const HUSK_TYPES = {
  wolf: {
    fn: wolfA, tellT: 0.16, maskAt: [44, -48], mdx: 10, g: 0.62, box: [-80, -96, 162, 108], foot: 5, dayK: 1, hurtW: 80, mask: MASK_BOX, dayRim: 0.35,
    frames: [['w0', { ph: 0 }], ['w1', { ph: 0.25 }], ['w2', { ph: 0.5 }], ['w3', { ph: 0.75 }], ['t0', { tele: 0.5 }], ['t1', { tele: 1 }], ['h', { hurt: 1, ph: 0.1 }], ['b', { ph: 0, noMask: 1 }], ['m', { maskOnly: 1 }]],
  },
  crow: {
    fn: crowA, maskAt: [14, -56], mdx: 6, g: 0.66, box: [-60, -94, 118, 104], foot: 6, dayK: 0.85, hurtW: 40, mask: MASK_BOX, dayRim: 0.6, poolRim: 0.5,
    frames: [['w0', { ph: 0 }], ['w1', { ph: 0.25 }], ['w2', { ph: 0.5 }], ['w3', { ph: 0.75 }], ['h', { hurt: 1, ph: 0.1 }], ['b', { ph: 0.25, noMask: 1 }], ['m', { maskOnly: 1 }]],
  },
  root_crawler: {
    fn: crawlerA, maskAt: [34, -22], mdx: 10, g: 0.74, box: [-62, -94, 132, 104], foot: 7, dayK: 1, hurtW: 84, mask: MASK_BOX, dayRim: 0.5,
    frames: [['w0', { ph: 0 }], ['w1', { ph: 0.25 }], ['w2', { ph: 0.5 }], ['w3', { ph: 0.75 }], ['h', { hurt: 1, ph: 0.1 }], ['b', { ph: 0, noMask: 1 }], ['m', { maskOnly: 1 }]],
  },
  // EN3 Stoat Piper (ranged; HUSKS BATCH 2 A): upright sentry, ONE very high socket; tell = rears + pipe drops onto you + ember in the tip
  stoat_piper: {
    fn: stoatA, tpw: 4, tellT: 0.3, stride: 9, maskAt: [16, -64], mdx: 6, g: 0.7, box: [-44, -96, 100, 104], foot: 5, dayK: 0.88, hurtW: 40, mask: MASK_BOX, dayRim: 0.55,
    frames: [['w0', { ph: 0 }], ['w1', { ph: 0.25 }], ['w2', { ph: 0.5 }], ['w3', { ph: 0.75 }], ['t0', { tele: 0.5 }], ['t1', { tele: 1 }], ['h', { hurt: 1, ph: 0.1 }], ['b', { ph: 0, noMask: 1 }], ['m', { maskOnly: 1 }]],
  },
  // EN4 Puffback Toad (area denial; HUSKS BATCH 2 A): squat toad + spore blister, three tiny sockets in a triangle; tell = squats, blister swells, cracks glow
  puffback_toad: {
    fn: toadA, tpw: 4, tellT: 0.5, stride: 10, maskAt: [26, -24], mdx: 8, g: 0.8, box: [-40, -64, 84, 72], foot: 6, dayK: 1, hurtW: 50, mask: MASK_BOX, dayRim: 0.4,
    frames: [['w0', { ph: 0 }], ['w1', { ph: 0.25 }], ['w2', { ph: 0.5 }], ['w3', { ph: 0.75 }], ['t0', { tele: 0.5 }], ['t1', { tele: 1 }], ['h', { hurt: 1, ph: 0.1 }], ['b', { ph: 0, noMask: 1 }], ['m', { maskOnly: 1 }]],
  },
  // EN5 Bramble Hart (charger; HUSKS BATCH 2 A): thorn-antler lyre twice the head, long deer-skull husk, two HIGH sockets that swing LOW on the tell
  bramble_hart: {
    fn: hartA, tpw: 4, tellT: 0.3, stride: 20, maskAt: [36, -66], mdx: 8, g: 0.62, box: [-48, -146, 152, 150], foot: 8, dayK: 1, hurtW: 70, mask: MASK_BOX, dayRim: 0.4,
    frames: [['w0', { ph: 0 }], ['w1', { ph: 0.25 }], ['w2', { ph: 0.5 }], ['w3', { ph: 0.75 }], ['t0', { tele: 0.5 }], ['t1', { tele: 1 }], ['h', { hurt: 1, ph: 0.1 }], ['b', { ph: 0, noMask: 1 }], ['m', { maskOnly: 1 }]],
  },
  // EN6 Branch-Mane (miniboss, HUSKS BATCH 3 A): the Splitsnout wolf x1.7 (g 1.05 vs 0.62), mane of pale dead branches, THREE amber sockets;
  // tell / howl = the mane rattles up and spreads (t0 half, t1 full). Always fully lit (scene). Bakes at 3.2 texels/world unit (atlas size: ~0.7 MB).
  branch_mane: {
    fn: maneA, tpw: 3.2, tellT: 0.25, stride: 24, maskAt: [46, -52], mdx: 12, g: 1.05, box: [-88, -112, 176, 124], foot: 8, dayK: 1, hurtW: 80, mask: MASK_BOX, dayRim: 0.4,
    frames: [['w0', { ph: 0 }], ['w1', { ph: 0.25 }], ['w2', { ph: 0.5 }], ['w3', { ph: 0.75 }], ['t0', { tele: 0.5 }], ['t1', { tele: 1 }], ['h', { hurt: 1, ph: 0.1 }], ['b', { ph: 0, noMask: 1 }], ['m', { maskOnly: 1 }]],
  },
};
export const HUSK_IDS = Object.keys(HUSK_TYPES);
// runtime frame ids (same for every type; -1 = the type has no such frame)
export const FR = { w0: 0, w1: 1, w2: 2, w3: 3, t0: 4, t1: 5, h: 6, b: 7, m: 8 };
export const FR_N = 9;
export const RIM_FRAMES = ['w0', 'w1', 'w2', 'w3', 't0', 't1']; // outline frames for the cool night rim (hurt/body reuse w0)

export const wpd = (type) => HUSK_TYPES[type].g / 4; // world units per du
export const tpwOf = (type) => HUSK_TYPES[type].tpw ?? TPW; // atlas texels per world unit of this type (EN3-EN5 species bake at 4: atlas size)
export const texPerDu = (type) => wpd(type) * tpwOf(type);

// apply the mock-up hurt squash (kit.js finish: translate(-W*0.06,0) scale(1.06,0.92) rotate(-5 about (-W*0.3, 0))) to a point
export function hurtPoint(W, x, y) {
  const a = (-5 * Math.PI) / 180, cx = -W * 0.3;
  const dx = x - cx, rx = cx + dx * Math.cos(a) - y * Math.sin(a), ry = dx * Math.sin(a) + y * Math.cos(a);
  return [rx * 1.06 - W * 0.06, ry * 0.92];
}

// Sockets of a type on its rest pose (w0): outline, box, iris centre (du) + the species core half-extents. Pure, cached.
const SOCK_CACHE = {};
export function socketInfo(id) {
  if (SOCK_CACHE[id]) return SOCK_CACHE[id];
  resetAll(); setEyeSpecies(id); clearEyes();
  HUSK_TYPES[id].fn({ ph: 0 });
  const socks = SOCKS.map((S) => ({ ...S }));
  const irises = socks.map((S, j) => { const e = EYES.find((q) => q[3] === j); return e ? [e[4], e[5]] : [S.cx, S.cy + S.h * 0.08]; });
  const cores = socks.map((S) => { const c = coreShape(id, S); return [c.hw, c.hh]; });
  clearEyes();
  return (SOCK_CACHE[id] = { socks, irises, cores });
}
const HOT_PAD = 7; // the hot (bloom) frame carries a soft lip glow a little wider than the socket
const eyeBox = (S, kind, core) => { if (kind === 'c') return [-core[0] - 1.5, -core[1] - 1.5, 2 * core[0] + 3, 2 * core[1] + 3]; const p = kind === 'h' || kind === 'H' ? HOT_PAD : EYE_PAD; return [S.x0 - p, S.y0 - p, S.w + 2 * p, S.h + 2 * p]; };
export const EYE_KINDS = ['g', 'c', 'G', 'h', 'H']; // glow, core, glow+core (one image), hot glow, hot glow+core (High with bloom)

// Pure layout of every type's block in the atlas: grid of frames (cols fit ATLAS_W), rim block (half density) after the frames.
// Returns { w, h, types: { [type]: { x, y, cols, fw, fh, mw, mh, rw, rh, rimY, frames: { name: { x, y, w, h, ox, oy } } } } } (pixels, origin = feet).
export function layoutAtlas() {
  // One shared shelf: the next type's frames continue in the row the previous type left (the atlas has no per-type block edge; a type's sheet
  // image is drawn from its first row down and only paints its own frames, the rest stays transparent), so the last partial rows are not wasted.
  let x = 0, row = 0, rowH = 0;
  const out = { w: ATLAS_W, h: 0, types: {} };
  for (const id of HUSK_IDS) {
    const T = HUSK_TYPES[id], k = texPerDu(id);
    const fw = Math.ceil(T.box[2] * k) + 2, fh = Math.ceil(T.box[3] * k) + 2;
    const mw = Math.ceil(T.mask[2] * k) + 2, mh = Math.ceil(T.mask[3] * k) + 2;
    const frames = {};
    let y = null; // top of the first row this type uses (set at its first placement)
    for (const [name] of T.frames) {
      const isM = name === 'm', w = isM ? mw : fw, h = isM ? mh : fh;
      if (x + w > ATLAS_W) { x = 0; row += rowH; rowH = 0; }
      if (y === null) y = row;
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
    // eye frames: per socket a glow, a core and a glow+core sprite at EYE_TEX x density; pivot = socket centre (glow) / core centre
    const SI = socketInfo(id), k2 = k * EYE_TEX;
    SI.socks.forEach((S, j) => {
      for (const kind of EYE_KINDS) {
        const bx = eyeBox(S, kind, SI.cores[j]), w = Math.ceil(bx[2] * k2) + 2, h = Math.ceil(bx[3] * k2) + 2;
        if (x + w > ATLAS_W) { x = 0; row += rowH; rowH = 0; }
        const px = kind === 'c' ? 0 : S.cx, py = kind === 'c' ? 0 : S.cy;
        frames['e' + kind + j] = { x, y: row, w, h, ox: 1 + (px - bx[0]) * k2, oy: 1 + (py - bx[1]) * k2, eye: { j, kind, bx } };
        x += w; rowH = Math.max(rowH, h);
      }
    });
    out.types[id] = { y, fw, fh, mw, mh, rw, rh, frames };
  }
  out.h = row + rowH;
  return out;
}

// One SVG sheet per type (frames placed at their atlas position relative to the type block's top) + eye anchors per frame (du, feet origin).
// Eye anchors are returned in du; the runtime converts with wpd(type).
export function typeSheet(id, lay) {
  const T = HUSK_TYPES[id], L = lay.types[id], k = texPerDu(id);
  const SI = socketInfo(id);
  resetAll();
  setEyeSpecies(id);
  setGrainBox(T.box[0], T.box[1], T.box[2], T.box[3]);
  let body = '';
  let bottom = 0;
  const eyes = {};
  for (const [name, st] of T.frames) {
    const fr = L.frames[name];
    clearEyes();
    const r = T.fn(st);
    // [socket x, y, iris x, y, open, flare, socket index] (du); the hurt squash moves both points with the frame
    eyes[name] = EYES.map(([x, y, , j, ex, ey, open, flare]) => (st.hurt ? [...hurtPoint(T.hurtW, x, y), ...hurtPoint(T.hurtW, ex, ey), open, flare, j] : [x, y, ex, ey, open, flare, j]));
    const bx = name === 'm' ? T.mask : T.box;
    const yy = fr.y - L.y;
    const baked = name === 'b' || name === 'm' ? r.b : r.b + r.e; // eyes are baked INTO the sockets (the freed body and the fallen mask have none)
    body += `<svg x="${fr.x}" y="${yy}" width="${fr.w}" height="${fr.h}" viewBox="${(bx[0] - 1 / k).toFixed(2)} ${(bx[1] - 1 / k).toFixed(2)} ${(fr.w / k).toFixed(2)} ${(fr.h / k).toFixed(2)}" overflow="hidden">${baked}</svg>`;
    bottom = Math.max(bottom, yy + fr.h);
  }
  const k2 = k * EYE_TEX;
  for (const name in L.frames) {
    const fr = L.frames[name];
    if (!fr.eye) continue;
    const { j, kind, bx } = fr.eye, S = SI.socks[j], [ex, ey] = SI.irises[j];
    const inner = kind === 'c' ? coreShape(id, S).svg : glowSvg(S, ex, ey, kind === 'G' || kind === 'H', kind === 'h' || kind === 'H');
    const yy = fr.y - L.y;
    body += `<svg x="${fr.x}" y="${yy}" width="${fr.w}" height="${fr.h}" viewBox="${(bx[0] - 1 / k2).toFixed(2)} ${(bx[1] - 1 / k2).toFixed(2)} ${(fr.w / k2).toFixed(2)} ${(fr.h / k2).toFixed(2)}" overflow="hidden">${inner}</svg>`;
    bottom = Math.max(bottom, yy + fr.h);
  }
  const w = ATLAS_W, h = bottom;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs()}<defs>${EXTRA_DEFS}</defs>${body}</svg>`;
  return { svg, w, h, eyes };
}

// Eye anchors for every type/frame in WORLD units relative to the FEET (the sprite origin; feet sit at sim y + foot), facing +x, unscaled. Pure (no DOM).
// Per frame, per eye: [socket x, socket y, iris x, iris y, open (1 | 0.55 hurt squint), flare (1 on the tell), socket index]. Frames without eyes
// (b, m) fall back to w0. Cached.
let EYE_CACHE = null;
export function eyeAnchors() {
  if (EYE_CACHE) return EYE_CACHE;
  const lay = layoutAtlas();
  const out = {};
  for (const id of HUSK_IDS) {
    const u = wpd(id);
    const { eyes } = typeSheet(id, lay);
    const per = [];
    for (let f = 0; f < FR_N; f++) {
      const name = Object.keys(FR).find((n) => FR[n] === f);
      const src = name !== 'b' && name !== 'm' && eyes[name] && eyes[name].length ? eyes[name] : eyes.w0;
      per.push(src.map(([x, y, ex, ey, open, flare, j]) => [x * u, y * u, ex * u, ey * u, open, flare, j]));
    }
    out[id] = per;
  }
  EYE_CACHE = out;
  return out;
}
// Per type, per socket (world units, relative to the socket centre): socket box, iris offset, core half extents and the look clamp
// (how far the core may drift from the iris centre and stay inside the socket opening: 80% of the free room), so the WL6b2 look drift never leaves it.
export function eyeMeta() {
  const out = {};
  for (const id of HUSK_IDS) {
    const u = wpd(id), SI = socketInfo(id);
    out[id] = SI.socks.map((S, j) => {
      const [ex, ey] = SI.irises[j], [hw, hh] = SI.cores[j];
      const lx = Math.max(0, S.w / 2 * 0.85 - Math.abs(ex - S.cx) - hw) * 0.8, ly = Math.max(0, S.h / 2 * 0.85 - Math.abs(ey - S.cy) - hh) * 0.8;
      return { w: S.w * u, h: S.h * u, lx: lx * u, ly: ly * u, x0: (S.x0 - S.cx) * u, y0: (S.y0 - S.cy) * u, ex: (ex - S.cx) * u, ey: (ey - S.cy) * u, hw: hw * u, hh: hh * u };
    });
  }
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
