// WL6c: VIBRANCY of the restored world (docs/design/visibility-arc-v1.md section 2.2). Pure JS, no Phaser/DOM, allocation-free per call.
// The restored ground, flowers, bushes, props, critters and fireflies get a saturation ramp 0.80 -> 1.30 over the run (the arc's `sat` column),
// scaled by how much of the view is restored: vib = satClock x (0.85 + 0.15 x R). Visual only. NEVER applied to enemies, heroes, UI, pickups,
// damage numbers or telegraphs (those layers never call into this module; tests/vibrancy.test.mjs pins it).
export const VIB_MIN = 0.66; // lowest quantised level (satClock 0.80 x 0.85 = 0.68 at the start with nothing restored)
export const VIB_STEP = 0.04;
export const VIB_LEVELS = 17; // 0.66 .. 1.30
export const VIB_BASE = 0.85; // share of the clock value a player always gets
export const VIB_R = 0.15; // share driven by the restored fraction of the view
export const R_COLS = 8; // restored-share sample grid over the view (8 x 5 = 40 samples at 2 Hz)
export const R_ROWS = 5;
export const R_SMOOTH = 1.2; // seconds: how fast the displayed restored share follows the samples (no steps)

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Saturation target from the arc column and the restored share R (0..1). NaN-safe.
export function vibTarget(satClock, R) {
  const s = satClock > 0 ? satClock : 1;
  const r = R > 0 ? (R > 1 ? 1 : R) : 0;
  return s * (VIB_BASE + VIB_R * r);
}
export const vibLevel = (sat) => (sat > 0 ? clamp(Math.round((sat - VIB_MIN) / VIB_STEP), 0, VIB_LEVELS - 1) : 0);
export const levelSat = (L) => VIB_MIN + clamp(L | 0, 0, VIB_LEVELS - 1) * VIB_STEP;

// Sprites can only be darkened by a multiply tint, so desaturating them (night, s < 1) also dips their luminance (up to ~20% at 0.66 on saturated greens).
// To keep plants in the same luminance family as the ground (readability rule R1) the sprite desaturation is compressed to 60% of the ground's; boosts are not.
export const spriteSat = (s) => (s < 1 ? 1 - 0.6 * (1 - s) : s);

// Packed multiply tint that moves a sprite whose mean colour is (r,g,b) to saturation s about its own luma (c' = Y + s (c - Y)).
// Phaser tints can only darken, so channels that would exceed 1 are normalised by the largest one (a small luminance dip, measured in the tests/report).
export function satTint(r, g, b, s) {
  if (!(s > 0) || r + g + b < 24) return 0xffffff;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let tr = (y + s * (r - y)) / Math.max(r, 1);
  let tg = (y + s * (g - y)) / Math.max(g, 1);
  let tb = (y + s * (b - y)) / Math.max(b, 1);
  if (tr < 0.05) tr = 0.05; if (tg < 0.05) tg = 0.05; if (tb < 0.05) tb = 0.05;
  const m = Math.max(tr, tg, tb);
  if (m > 1) { tr /= m; tg /= m; tb /= m; }
  return (Math.round(tr * 255) << 16) | (Math.round(tg * 255) << 8) | Math.round(tb * 255);
}

export const mulTint = (a, b) => {
  const r = ((a >> 16 & 255) * (b >> 16 & 255) / 255) | 0; const g = ((a >> 8 & 255) * (b >> 8 & 255) / 255) | 0; const bl = ((a & 255) * (b & 255) / 255) | 0;
  return (r << 16) | (g << 8) | bl;
};

// Glow colour (fireflies/motes are additive, so the colour itself is saturated, not multiplied): c' = Y + s (c - Y), clamped.
export function satColor(c, s) {
  const r = (c >> 16) & 255; const g = (c >> 8) & 255; const b = c & 255;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const f = (v) => clamp(Math.round(y + s * (v - y)), 0, 255);
  return (f(r) << 16) | (f(g) << 8) | f(b);
}

// Mean colour (alpha-weighted, pixels with alpha > 40) of a rect of RGBA data. out = [r, g, b] (Float arrays welcome). Returns false when the frame is empty.
export function meanColor(rgba, imgW, x, y, w, h, out) {
  let sr = 0; let sg = 0; let sb = 0; let sw = 0;
  for (let j = y; j < y + h; j++) {
    let i = (j * imgW + x) * 4;
    for (let k = 0; k < w; k++, i += 4) {
      const a = rgba[i + 3];
      if (a <= 40) continue;
      sr += rgba[i] * a; sg += rgba[i + 1] * a; sb += rgba[i + 2] * a; sw += a;
    }
  }
  if (sw <= 0) return false;
  out[0] = sr / sw; out[1] = sg / sw; out[2] = sb / sw;
  return true;
}

// Per-frame vibrancy tints for one atlas: mean colours measured once, tint per (frame, level) computed on first use and cached (no allocation after build).
export class VibTints {
  // frames: array of { name, x, y, w, h }; rgba/imgW: the atlas pixels.
  constructor(rgba, imgW, frames) {
    const n = frames.length;
    this.idx = new Map();
    this.mean = new Float32Array(n * 3).fill(128);
    this.ok = new Uint8Array(n);
    this.tab = new Int32Array(n * VIB_LEVELS).fill(-1);
    const tmp = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const f = frames[i];
      this.idx.set(f.name, i);
      if (f.w > 0 && f.h > 0 && meanColor(rgba, imgW, f.x, f.y, f.w, f.h, tmp)) { this.mean[i * 3] = tmp[0]; this.mean[i * 3 + 1] = tmp[1]; this.mean[i * 3 + 2] = tmp[2]; this.ok[i] = 1; }
    }
  }

  // Packed tint for a frame at a level (0xffffff for unknown / empty frames).
  get(name, level) {
    const i = this.idx.get(name);
    if (i === undefined || !this.ok[i]) return 0xffffff;
    const L = level < 0 ? 0 : level >= VIB_LEVELS ? VIB_LEVELS - 1 : level | 0;
    const k = i * VIB_LEVELS + L;
    let t = this.tab[k];
    if (t < 0) t = this.tab[k] = satTint(this.mean[i * 3], this.mean[i * 3 + 1], this.mean[i * 3 + 2], spriteSat(levelSat(L)));
    return t;
  }
}

// Restored share of the view: mean of life samples on a fixed grid. life.sampleClean(x, y) -> 0..1. No allocation.
export function restoredShare(life, x0, y0, x1, y1) {
  let sum = 0;
  for (let j = 0; j < R_ROWS; j++) {
    const y = y0 + (y1 - y0) * (j + 0.5) / R_ROWS;
    for (let i = 0; i < R_COLS; i++) {
      const v = life.sampleClean(x0 + (x1 - x0) * (i + 0.5) / R_COLS, y);
      sum += v > 1 ? 1 : v > 0 ? v : 0;
    }
  }
  return sum / (R_COLS * R_ROWS);
}

// Glow tints for fireflies: tints[level][ti] = saturated TINTS[ti] weighted by how restored the firefly is (ti / maxTi): Hollow (cold) ones stay as they were.
export function buildGlowTable(tints) {
  const n = tints.length;
  const tab = new Int32Array(VIB_LEVELS * n);
  for (let L = 0; L < VIB_LEVELS; L++) for (let i = 0; i < n; i++) tab[L * n + i] = satColor(tints[i], 1 + (levelSat(L) - 1) * (i / (n - 1)));
  return tab;
}
