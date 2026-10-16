// AL-0 shared wind (docs/design/ambient-life-v1.md). Pure JS, visual only: nothing in src/sim touches this and it
// never uses the sim RNG. One source drives every ambient motion so the world sways as one (sway, crowns, petals, motes).
// Deterministic in (x, y, t): same inputs, same output. All outputs are bounded.
import { CAPS } from './quality.js';

const TAU = Math.PI * 2;
export const GUST_MIN = 10; // seconds between gust peaks (design: every ~10-14 s)
export const GUST_MAX = 14;
export const REDUCED_SCALE = 0.25; // reduced-motion wind scale (design section 3)

// Visual-only RNG stream (mulberry32). Seed it from anything except the sim; the sim's own stream is never shared.
export function visualRng(seed = 1) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(n) { // integer -> 0..1, stateless
  let h = (n | 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Gust envelope 0..1 at time t: one smooth bump per slot, slot length 10-14 s from the hash of the slot index.
// Slot lengths are cumulative so they are stable for any t (no state). Bump lasts ~35% of its slot.
export function gust(t, seed = 0) {
  if (!Number.isFinite(t) || t < 0) return 0;
  let start = 0;
  for (let i = 0; i < 100000; i++) {
    const len = GUST_MIN + (GUST_MAX - GUST_MIN) * hash(i * 7919 + seed);
    if (t < start + len) {
      const u = (t - start) / len; // 0..1 in slot
      const a = 0.2; const b = 0.55; // bump window inside the slot
      if (u <= a || u >= b) return 0;
      const k = (u - a) / (b - a);
      return Math.sin(k * Math.PI) ** 2;
    }
    start += len;
  }
  return 0;
}

// Wind at world (x, y), time t seconds. Returns the lean/push in -1..1 (x = along the prevailing direction,
// y = a smaller cross component). `scale` is 1 normally, REDUCED_SCALE with reduced motion, and may be raised
// briefly by AL-6 (kept <= 1.5). Slow travelling waves (period >= 6 s) plus a gust; no flicker.
export function wind(x, y, t, scale = 1, seed = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(t)) return { x: 0, y: 0 };
  const sc = scale > 1.5 ? 1.5 : scale > 0 ? scale : 0;
  const ph = (x * 0.011 + y * 0.007) ; // travelling wave front
  const w1 = Math.sin(TAU * (t / 7.5) - ph);
  const w2 = Math.sin(TAU * (t / 11.3) - ph * 0.6 + 1.7);
  const g = gust(t - (x + y) * 0.004, seed); // gust crosses the view over a fraction of a second
  let wx = 0.42 * w1 + 0.23 * w2 + 0.35 * g;
  let wy = 0.14 * w2 + 0.1 * g * w1;
  wx = wx * sc + 0; wy = wy * sc + 0;
  wx = wx > 1 ? 1 : wx < -1 ? -1 : wx;
  wy = wy > 1 ? 1 : wy < -1 ? -1 : wy;
  return { x: wx, y: wy };
}

// Scalar lean for sprites that only rotate about their base: wind().x * amplitude.
export function lean(x, y, t, amp = 1, scale = 1, seed = 0) {
  return wind(x, y, t, scale, seed).x * amp;
}

// Wind scale from settings: reduced motion quarter strength.
export function windScale(reducedMotion) { return reducedMotion ? REDUCED_SCALE : 1; }

// Per-tier ambient sprite budget (from quality.js CAPS.<tier>.ambient). Unknown tier -> low.
export function ambientCap(tier) {
  const c = (CAPS[tier] || CAPS.low).ambient;
  return c;
}
