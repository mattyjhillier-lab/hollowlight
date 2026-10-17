// WL6a: the visibility + vibrancy ARC (docs/design/visibility-arc-v1.md, LOCKED option A "deep dusk"). Pure JS, no Phaser/DOM, allocation-free per call.
// One table in run seconds on a 900 s reference run (other run lengths scale t). Every column is linearly interpolated between rows.
// Visual only: nothing here is read by the sim.
import { ambientAt as classicAmbient, gradeAt as classicGrade } from './palette.js';

export const REF_SECONDS = 900;

// [t, ambient (Med/High lightmap fill), Low multiply tint, lantern radius, far body V, eye alpha, rim alpha, restored saturation, dawn wash alpha,
//  body K (WL6b: multiplies every enemy body tint; 1.0 until the boss, 0.72 from 11:30 so bodies read as darker silhouettes against the brighter ground (design gate G2), easing to 0.8 at the dawn flood)]
export const ARC_A = [
  [0, 0x222b54, 0x6c76aa, 150, 0.40, 1.0, 0.85, 0.80, 0, 1.0],
  [180, 0x242e5a, 0x707cb0, 150, 0.40, 1.0, 0.85, 0.82, 0, 1.0],
  [300, 0x2c3868, 0x7c8abc, 145, 0.45, 1.0, 0.75, 0.88, 0, 1.0],
  [480, 0x3c4a80, 0x8e9cc8, 140, 0.55, 0.9, 0.60, 0.95, 0, 1.0],
  [600, 0x56609a, 0xa4acd4, 135, 0.58, 0.75, 0.35, 1.00, 0, 1.0],
  [690, 0x7a74a8, 0xbeb4d6, 130, 0.48, 0.70, 0, 1.08, 0.04, 0.72],
  [780, 0xa8889c, 0xdcc0c4, 130, 0.55, 0.55, 0, 1.16, 0.10, 0.72],
  [870, 0xe0b8a8, 0xf2dccc, 130, 0.68, 0.40, 0, 1.26, 0.20, 0.72],
  [900, 0xffe2c4, 0xfff0dc, 130, 0.75, 0.30, 0, 1.30, 0.30, 0.8],
];
export const COL = { amb: 1, low: 2, lan: 3, farV: 4, eyeA: 5, rimA: 6, sat: 7, dawn: 8, bodyK: 9 };

// Brightness setting: the stored value may be 'auto' (first run: phones get Brighter, everything else Normal).
export const BRIGHTNESS_STORED = ['auto', 'normal', 'brighter', 'clear'];
export const BRIGHTNESS_LEVELS = ['normal', 'brighter', 'clear'];
export const resolveBrightness = (stored, phone) => (stored === 'normal' || stored === 'brighter' || stored === 'clear' ? stored : (phone ? 'brighter' : 'normal'));

const BRIGHTER = { amb: 1.6, low: 1.25, farV: 0.15 };
const CLEAR_FAR_V = 0.62;
const CALM_DAWN_CAP = 0.2;
const DAWN_AMB = 0xffe2c4;
const DAWN_LOW = 0xfff0dc;
const ch = (c, s) => (c >> s) & 255;

// sRGB byte -> linear (built once) for the ambient luminance Y.
const LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) { const v = i / 255; LIN[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }
export const lumY = (c) => 0.2126 * LIN[(c >> 16) & 255] + 0.7152 * LIN[(c >> 8) & 255] + 0.0722 * LIN[c & 255];

// Interpolate in LINEAR light so luminance Y changes at a constant rate between keyframes (design gate G6); encodes back to sRGB bytes.
const enc = (v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
function lerpCol(ca, cb, t) {
  const r = enc(LIN[ch(ca, 16)] + (LIN[ch(cb, 16)] - LIN[ch(ca, 16)]) * t);
  const g = enc(LIN[ch(ca, 8)] + (LIN[ch(cb, 8)] - LIN[ch(ca, 8)]) * t);
  const b = enc(LIN[ch(ca, 0)] + (LIN[ch(cb, 0)] - LIN[ch(ca, 0)]) * t);
  return (r << 16) | (g << 8) | b;
}
// Channel-wise scale (k) capped at the channels of cap.
function scaleCap(c, k, cap) {
  const r = Math.min(ch(cap, 16), (ch(c, 16) * k) | 0);
  const g = Math.min(ch(cap, 8), (ch(c, 8) * k) | 0);
  const b = Math.min(ch(cap, 0), (ch(c, 0) * k) | 0);
  return (r << 16) | (g << 8) | b;
}
function maxCol(a, b) {
  const r = Math.max(ch(a, 16), ch(b, 16)); const g = Math.max(ch(a, 8), ch(b, 8)); const bl = Math.max(ch(a, 0), ch(b, 0));
  return (r << 16) | (g << 8) | bl;
}

export function makeArcOut() {
  return { t: 0, amb: 0, low: 0, lan: 150, farV: 0.4, eyeA: 1, rimA: 0, sat: 1, dawn: 0, bodyK: 1, y: 0, mode: 'normal' };
}

// Fill `out` for run time t (seconds on the 900 s reference run; NaN/negative -> 0, past the end -> the dawn row).
// mode: 'normal' | 'brighter' | 'clear'. calm: Calm motion (dawn wash capped at 0.2). No allocation.
export function arcSample(t, mode, calm, out) {
  if (!(t > 0)) t = 0;
  if (t > REF_SECONDS) t = REF_SECONDS;
  let i = 1;
  while (i < ARC_A.length - 1 && t > ARC_A[i][0]) i++;
  const a = ARC_A[i - 1];
  const b = ARC_A[i];
  const k = (t - a[0]) / (b[0] - a[0]);
  let amb = lerpCol(a[1], b[1], k);
  let low = lerpCol(a[2], b[2], k);
  let farV = a[4] + (b[4] - a[4]) * k;
  if (mode === 'brighter') {
    amb = scaleCap(amb, BRIGHTER.amb, DAWN_AMB);
    low = scaleCap(low, BRIGHTER.low, DAWN_LOW);
    farV = Math.min(1, farV + BRIGHTER.farV);
  } else if (mode === 'clear') {
    // The locked "lifted night": never darker than the previous build's arc at the same moment (that arc already carries the +14% lift).
    const f = t / REF_SECONDS;
    amb = maxCol(amb, classicAmbient(f));
    low = maxCol(low, classicGrade(f));
    if (farV < CLEAR_FAR_V) farV = CLEAR_FAR_V;
  } else mode = 'normal';
  let dawn = a[8] + (b[8] - a[8]) * k;
  if (calm && dawn > CALM_DAWN_CAP) dawn = CALM_DAWN_CAP;
  out.t = t;
  out.mode = mode;
  out.amb = amb;
  out.low = low;
  out.lan = a[3] + (b[3] - a[3]) * k;
  out.farV = farV;
  out.eyeA = a[5] + (b[5] - a[5]) * k;
  out.rimA = a[6] + (b[6] - a[6]) * k;
  out.sat = a[7] + (b[7] - a[7]) * k;
  out.dawn = dawn;
  out.bodyK = a[9] + (b[9] - a[9]) * k;
  out.y = lumY(amb);
  return out;
}

// Lantern radius target. lan = table radius; lowHp shrinks it (previous rule: 90) but never below 115 while the night is dark
// (ambient Y < 0.08), easing back to 90 by Y 0.11 so there is no step when the sky brightens. y = ambient luminance.
export function lanternTarget(lan, lowHp, y) {
  if (!lowHp) return lan;
  const dark = y <= 0.08 ? 1 : y >= 0.11 ? 0 : (0.11 - y) / 0.03;
  return 90 + 25 * dark;
}

// Boss light radius: 90 as before, 120 while the ambient is dark (Y < 0.1) so the boss is always seen.
export const bossLightRadius = (y) => (y < 0.1 ? 120 : 90);
