// WL6b: the enemy NIGHT LOOK rules (docs/design/visibility-arc-v1.md sections 3 and 4). Pure JS, no Phaser/DOM, allocation-free in the per-frame functions.
// Eyes are the main night read; far bodies are cool-tinted; a cool rim marks far enemies on Med/High. Visual only: the sim is never read except positions/ids/types.
import { VIS } from './style.js';

export const EYE_CAPS = { high: 200, med: 120, low: 40 }; // enemies that get eyes, nearest band first
export const RIM_CAPS = { high: 120, med: 60, low: 0 };
export const SPIRIT_LIGHTS = { high: 12, med: 6, low: 0 }; // lit spirits that also light enemies near them
export const NEAR_BAND = 1.8; // x lantern radius: filled first
export const LIT_STEPS = 16;
export const EYE_FLOOR_A = 0.5; // inside the pool the eye layer never goes below this (or the arc's own alpha when that is lower)
export const SPIRIT_REVEAL = 40; // world units
export const BLINK_ALPHA = 0.2;

// Eye anchors in the sprite box (sprites.js emberEye calls), as offsets from the sprite centre in world units, already x VIS (display scale).
// halo = display size of the one-image eye texture ('eyen', core = 0.47 of it). The wolf draws one eye (the near one; a profile view), the crow one, the root crawler two. core/halo = display size in world units.
const box = (key, w, h, pts) => pts.map(([x, y]) => [(x - w / 2) * VIS[key], (y - h / 2) * VIS[key]]);
export const EYE_DEFS = {
  wolf: { key: 'wolf', rim: 'wolf_r', pts: box('wolf', 18, 12, [[15.2, 4.4]]), core: 4.2, halo: 9, rimK: 1, floorK: 1 },
  crow: { key: 'crow', rim: 'crow_r', pts: box('crow', 14, 10, [[10.9, 3.8]]), core: 5.0, halo: 10.7, rimK: 1.2, floorK: 1.8 }, // crows: darkest, fastest, erratic -> core +20%, rim x1.2
  root_crawler: { key: 'root', rim: 'root_r', pts: box('root', 20, 20, [[8, 9.2], [12.2, 9.2]]), core: 4.2, halo: 9, rimK: 1, floorK: 1 },
};
// Boss eyes (treant box 64 x 72: bossEye ember at 27,40 and 37,40): always drawn, outside the caps.
export const BOSS_EYES = box('treant', 64, 72, [[27, 40], [37, 40]]);
export const BOSS_CORE = 6;
export const BOSS_HALO = 12;
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
export function fillTintTable(farV, bodyK, tab) {
  for (let L = 0; L <= LIT_STEPS; L++) {
    const lit = L / LIT_STEPS;
    const v = (farV + (1 - farV) * lit) * bodyK;
    const cool = 1 - lit;
    const r = Math.min(255, Math.round(v * (1 - 0.14 * cool) * 255));
    const g = Math.min(255, Math.round(v * (1 - 0.07 * cool) * 255));
    const b = Math.min(255, Math.round(v * 255));
    tab[L] = (r << 16) | (g << 8) | b;
  }
  return tab;
}

// Blink: once per 4-7 s per enemy, one short moment (0.08 s) at alpha 0.2. Calm motion: never. Allocation-free hash of the enemy id.
export function blinkMul(time, id, calm) {
  if (calm) return 1;
  const h = Math.imul((id | 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  const period = 4 + (h % 3000) / 1000; // 4..7 s
  const ph = (time + (h >>> 12) % 1000 / 100) % period;
  return ph < 0.08 ? BLINK_ALPHA : 1;
}

// Eye alpha for an enemy at lit level L (0..16): the arc's alpha beyond the pool, the floor inside it, blended between.
export function eyeAlpha(eyeA, L, floorK) {
  const inside = Math.min(EYE_FLOOR_A * floorK, eyeA);
  return inside + (eyeA - inside) * (1 - L / LIT_STEPS);
}

// Rim alpha for an enemy at lit level L: only outside the pool (design: rimA * (1 - lit) * 0.75).
export const rimAlpha = (rimA, L, k) => rimA * (1 - L / LIT_STEPS) * 0.75 * k;

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
