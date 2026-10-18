// WL6b: the enemy NIGHT LOOK rules (docs/design/visibility-arc-v1.md sections 3 and 4). Pure JS, no Phaser/DOM, allocation-free in the per-frame functions.
// Eyes are the main night read; far bodies are cool-tinted; a cool rim marks far enemies on Med/High. Visual only: the sim is never read except positions/ids/types.
import { VIS } from './style.js';

export const EYE_CAPS = { high: 200, med: 120, low: 40 }; // enemies that get eyes, nearest band first
export const RIM_CAPS = { high: 120, med: 60, low: 0 };
export const SPIRIT_LIGHTS = { high: 12, med: 6, low: 0 }; // lit spirits that also light enemies near them
export const NEAR_BAND = 1.8; // x lantern radius: filled first
export const LIT_STEPS = 16;
export const EYE_FLOOR_A = 0.6; // inside the pool the eye layer never goes below this (or the arc's own alpha when that is lower)
export const SPIRIT_REVEAL = 40; // world units
export const BLINK_ALPHA = 0.2;

// Eye anchors in the sprite box (sprites.js emberEye calls), as offsets from the sprite centre in world units, already x VIS (display scale).
// halo = display size of the one-image eye texture ('eyen', core = 0.47 of it). The wolf draws one eye (the near one; a profile view), the crow one, the root crawler two. core/halo = display size in world units.
const box = (key, w, h, pts) => pts.map(([x, y]) => [(x - w / 2) * VIS[key], (y - h / 2) * VIS[key]]);
export const EYE_DEFS = {
  wolf: { key: 'wolf', rim: 'wolf_r', pts: box('wolf', 18, 12, [[15.2, 4.4]]), core: 4.2, halo: 9, rimK: 1, floorK: 1 },
  crow: { key: 'crow', rim: 'crow_r', pts: box('crow', 14, 10, [[10.9, 3.8]]), core: 5.0, halo: 10.7, rimK: 1.2, floorK: 1.6 }, // crows: darkest, fastest, erratic -> core +20%, rim x1.2
  root_crawler: { key: 'root', rim: 'root_r', pts: box('root', 20, 20, [[8, 9.2], [12.2, 9.2]]), core: 4.2, halo: 9, rimK: 1, floorK: 1 },
};
// Boss eyes (treant box 64 x 72: bossEye ember at 27,40 and 37,40): always drawn, outside the caps.
export const BOSS_EYES = box('treant', 64, 72, [[27, 40], [37, 40]]);
export const BOSS_CORE = 6;
export const BOSS_HALO = 12;
// WL6d: types whose authored body is nearly black get a higher far-body floor, so no enemy pixel falls under RGB 12 (gate G3; measured on Med at 0:30 / 4:00, root crawler 8% of pixels at V 0.34)
export const DARK_FLOOR = { root_crawler: 0.44 };
export const DARK_DAY_K = 0.85; // and from dusk on its far body is 15% darker than the others, so on bright ground (Brighter / Clear) its silhouette keeps the 6 L* gap
export const DARK_FLOOR_DAY = 0.36; // final tint V (x bodyK) floor for dark types once bodyK < 1 (Low 11:30 root crawler had 2 pixels under RGB 12 at 0.29)
export const DARK_OFF = LIT_STEPS + 1; // second tint table starts here
export const EYE_HALO_TINT = 0xff6a3a;
export const EYE_CORE_TINT = 0xffe2b0;
export const RIM_TINT = 0xa8bce0;

export const eyeCap = (tier) => EYE_CAPS[tier] ?? EYE_CAPS.low;
export const rimCap = (tier) => RIM_CAPS[tier] ?? 0;
export const spiritCap = (tier) => SPIRIT_LIGHTS[tier] ?? 0;
export const slotsOf = (type) => (EYE_DEFS[type] ? 1 : 0); // one eye set per enemy (root crawlers draw two eyes)

// 0..1: 1 inside the lantern pool (0.75R), 0 beyond 1.25R, smooth between. d = distance from the lantern ember.
export function litAmount(d, R) {
  const k = (1.25 * R - d) / (0.5 * R);
  return !(k > 0) ? 0 : k >= 1 ? 1 : k; // NaN -> 0
}

// Quantised lit level 0..16. A lit spirit within SPIRIT_REVEAL of the enemy counts as lit >= 0.5.
export function litLevel(d, R, nearSpirit) {
  let k = litAmount(d, R);
  if (nearSpirit && k < 0.5) k = 0.5;
  return Math.round(k * LIT_STEPS);
}

// Packed enemy body tint for each lit level: V = (farV + (1 - farV) * lit) * bodyK, cool-shifted when unlit (R x0.86, G x0.93, B x1.0). tab = Int32Array(17).
export function fillTintTable(farV, bodyK, tab, off = 0) {
  for (let L = 0; L <= LIT_STEPS; L++) {
    const lit = L / LIT_STEPS;
    const v = (farV + (1 - farV) * lit) * bodyK;
    const cool = 1 - lit;
    const r = Math.min(255, Math.round(v * (1 - 0.14 * cool) * 255));
    const g = Math.min(255, Math.round(v * (1 - 0.07 * cool) * 255));
    const b = Math.min(255, Math.round(v * 255));
    tab[off + L] = (r << 16) | (g << 8) | b;
  }
  return tab;
}

// WL6b2 blink: slow and irregular. Time is cut into 3 s cells; each enemy blinks in about 55% of them, at a hashed moment 0.3-2.4 s into the cell,
// so two blinks are never closer than 0.6 s (max ~1.7 flickers/s per eye, well under the 3/s photosensitivity line) and the mean is one per ~5.5 s.
// One blink = 0.12 s at alpha 0.2. Calm motion: never. Allocation-free hash of (enemy id, cell).
export const BLINK_CELL = 3;
export const BLINK_LEN = 0.12;
export function blinkMul(time, id, calm) {
  if (calm) return 1;
  const cell = Math.floor(time / BLINK_CELL);
  const h = Math.imul(Math.imul((id | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(cell, 0xc2b2ae35), 0x27d4eb2f) >>> 0;
  if ((h & 255) >= 140) return 1; // 55%
  const at = 0.3 + ((h >>> 8) % 2100) / 1000; // 0.3..2.4 s into the cell
  const ph = time - cell * BLINK_CELL - at;
  return ph >= 0 && ph < BLINK_LEN ? BLINK_ALPHA : 1;
}

// WL6b2 eye life (the eyes carry the night read; silhouettes are quiet). One call per drawn eye set, fills `out`:
//   ox, oy  look offset in world units (drifts toward the hero, clamped to LOOK_MAX)
//   sc      size multiplier (slow pulse +-5%, up to +25% as the enemy closes in)
//   am      alpha multiplier (slow glint +-10%) and ab alpha boost (+0.18 when closing in): alpha = min(1, base * am + ab)
//   sl, sa, sx, sy  streak length / alpha / unit direction behind a fast mover
// Calm motion: static (no drift, pulse or streak), the closing-in cue stays (it is a threat cue, not motion).
export const LOOK_MAX = 1.0;
export const PULSE_SIZE = 0.05;
export const PULSE_ALPHA = 0.1;
export const CLOSE_FAR = 260; // distance to the hero (world units) where the closing-in cue starts
export const CLOSE_NEAR = 40;
export const CLOSE_SIZE = 0.25;
export const CLOSE_ALPHA = 0.18;
export const STREAK_MIN_SPEED = 35;
export const STREAK_MAX_LEN = 16;
export const STREAK_CAPS = { high: 60, med: 30, low: 0 };
// Husk socket eyes: the nearest N enemies (plan order) get a separate drifting core image (look-at-hero inside the socket); the rest and all
// of Low draw ONE glow+core image per eye (static core), so the image count stays the same as the old one-image eyes (perf budget).
export const CORE_CAPS = { high: 40, med: 20, low: 0 };
export const streakCap = (tier) => STREAK_CAPS[tier] ?? 0;
export function makeEyeOut() { return { ox: 0, oy: 0, sc: 1, am: 1, ab: 0, sl: 0, sa: 0, sx: 0, sy: 0 }; }
export function eyeAnim(time, id, hdx, hdy, speed, vx, vy, calm, out) {
  const h = Math.imul((id | 0) ^ 0x7f4a7c15, 0x9e3779b1) >>> 0;
  const dist = Math.sqrt(hdx * hdx + hdy * hdy);
  const ck = dist >= CLOSE_FAR ? 0 : dist <= CLOSE_NEAR ? 1 : (CLOSE_FAR - dist) / (CLOSE_FAR - CLOSE_NEAR);
  out.ab = CLOSE_ALPHA * ck;
  out.sl = 0; out.sa = 0; out.sx = 0; out.sy = 0;
  if (calm) { out.ox = 0; out.oy = 0; out.sc = 1 + CLOSE_SIZE * ck; out.am = 1; return out; }
  const per = 2.4 + (h & 1023) / 640; // 2.4..4 s glint period (<= 0.42 Hz)
  const ph = (h >>> 10) / 4194304; // 0..1 per-enemy phase offset, so crowds shimmer instead of pulsing in sync
  const s = Math.sin(6.2831853 * (time / per + ph));
  out.sc = 1 + PULSE_SIZE * s + CLOSE_SIZE * ck;
  out.am = 1 + PULSE_ALPHA * s;
  // look: toward the hero with a slow irregular drift (two slow sines), clamped
  let lx = 0; let ly = 0;
  if (dist > 1) { lx = hdx / dist * 0.75; ly = hdy / dist * 0.75; }
  const w = time * 0.6 + ph * 6.2831853;
  lx += 0.25 * Math.sin(w * 1.3 + 1.7); ly += 0.25 * Math.sin(w * 0.9);
  const m = Math.sqrt(lx * lx + ly * ly);
  const k = m > LOOK_MAX ? LOOK_MAX / m : 1;
  out.ox = lx * k; out.oy = ly * k;
  if (speed > STREAK_MIN_SPEED) {
    const sp = Math.sqrt(vx * vx + vy * vy);
    if (sp > 1) {
      const f = Math.min(1, (speed - STREAK_MIN_SPEED) / 40);
      out.sl = 4 + (STREAK_MAX_LEN - 4) * f; out.sa = 0.4 * f; out.sx = vx / sp; out.sy = vy / sp;
    }
  }
  return out;
}

// Eye alpha for an enemy at lit level L (0..16): the arc's alpha beyond the pool, the floor inside it, blended between.
export function eyeAlpha(eyeA, L, floorK) {
  const inside = Math.min(EYE_FLOOR_A * floorK, eyeA);
  return inside + (eyeA - inside) * (1 - L / LIT_STEPS);
}

// Rim alpha for an enemy at lit level L: only outside the pool (design: rimA * (1 - lit) * 0.75).
export const rimAlpha = (rimA, L, k) => rimA * (1 - L / LIT_STEPS) * 0.75 * k; // WL6b2: the arc's rimA column is now much lower (quiet silhouettes)

// Eye plan: three passes by distance band from the lantern ember (inside R, then inside 1.8 R, then the rest; no sort), so under cap pressure the nearest
// enemies keep their eyes. The cap counts ENEMIES (one eye set each; a root crawler draws two eyes for one slot), so a full swarm still covers the near band.
// band[i] = 0 | 1 | 2 (see bandOf), kinds[i] = 1 if enemy i may draw eyes (0 = no eyes: boss, off-screen, unknown type). Fills out[] with enemy indices; returns the count.
export function planEyes(n, band, kinds, cap, out) {
  let c = 0;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < n; i++) {
      if (kinds[i] === 0 || band[i] !== pass) continue;
      if (c >= cap) return c;
      out[c++] = i;
    }
  }
  return c;
}

// Distance band for the plan: 0 inside the lantern radius, 1 inside 1.8 R, 2 beyond. d2 = squared distance to the ember.
export function bandOf(d2, R) {
  return d2 < R * R ? 0 : d2 < NEAR_BAND * NEAR_BAND * R * R ? 1 : 2;
}
