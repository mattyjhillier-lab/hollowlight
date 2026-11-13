// Title cover: pure logic (no DOM, no canvas) so it is Node-testable. The locked sandbox values live in TUNE (docs/design/title-tune-v1.json is the source;
// tests/titlecover.test.mjs checks they stay equal). Everything here is render-side only: it never reads or writes the sim, the RNG or the save.

/** Matt's locked Tune (LOCKED 2026-11-13 TITLE SANDBOX TUNE). grain 0 = no grain; calm is a player setting, never part of this. */
export const TUNE = Object.freeze({
  parallax: 1.05, maxShift: 26, drift: 0.5, glowR: 1.15, glowA: 0.65, flick: 0.6, flickS: 1, spread: 0.6, soft: 0.24, breath: 0.08, night: 1, fog: 0.65, moon: 0.85,
  grain: 0, vig: 0.52, calmZone: 0.7, motes: 60, moteSz: 1.6, bloomT: 1.45,
  hsD: 0.5, hxD: 0.68, hyD: 0.84, hsP: 0.36, hxP: 0.5, hyP: 0.62, hsL: 0.6, hxL: 0.76, hyL: 0.88,
});
/** Per-layer parallax depth, back to front: sky and moon, far trees, mid trees, ground, hero + companion + lantern, light and motes, foreground frame. */
export const LAYER_DEPTH = Object.freeze([0.4, 2.5, 0.5, 1.25, 2.5, 1, 1.7]);
export const LAYER_NAMES = Object.freeze(['Sky and moon', 'Far trees (grey)', 'Mid trees (colour blooms)', 'Ground', 'Hero, companion, lantern', 'Light and motes', 'Foreground frame']);

/** Heroes that have a cover rig. Any other id (a future hero without one, or junk) falls back to Wren. */
export const COVER_HEROES = Object.freeze(['wren', 'elias']);
/** The hero on the cover: the last-played id when it is a known, awake hero with a cover rig; Wren otherwise (first launch, hostile or stale loadout).
 *  known = data.characters (own-property check only); awake(id) = the save's own check. Never throws. */
export function coverHeroId(raw, known, awake) {
  try {
    if (typeof raw !== 'string' || !COVER_HEROES.includes(raw)) return 'wren';
    if (!known || !Object.hasOwn(known, raw)) return 'wren';
    if (typeof awake === 'function' && !awake(raw)) return 'wren';
    return raw;
  } catch { return 'wren'; }
}

/** Flame colours worn (resolveCosm flame css strings). Only #rrggbb is accepted, anything else is the default Hearth flame. */
export const HEARTH = Object.freeze({ glow: '#ffcf7a', core: '#fff1c8' });
const HEX = /^#[0-9a-fA-F]{6}$/;
export function coverFlame(glow, core) {
  return typeof glow === 'string' && typeof core === 'string' && HEX.test(glow) && HEX.test(core) ? { glow, core } : { ...HEARTH };
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
/** Layout of the cover for a box: portrait phone, landscape phone, or desktop (same rule as the sandbox). */
export function coverMode(w, h) {
  if (w <= 520 && h > w) return 'portrait';
  if (h <= 520 && w > h) return 'landscape';
  return 'desktop';
}
/** Hero scale (fraction of height), x and feet-y (fractions of the box) for a mode. */
export function heroPos(mode, T = TUNE) {
  return mode === 'portrait' ? { s: T.hsP, x: T.hxP, y: T.hyP } : mode === 'landscape' ? { s: T.hsL, x: T.hxL, y: T.hyL } : { s: T.hsD, x: T.hxD, y: T.hyD };
}
export const horizonFrac = (mode) => (mode === 'portrait' ? 0.42 : mode === 'landscape' ? 0.5 : 0.46);
/** Bake margin (px) around the box so the deepest layer can shift without showing an edge. */
export const bakeMargin = (w) => Math.max(40, Math.round(Math.min(w, 1100) * 0.06));

/** Entry bloom progress 0..1. Normal: eased 1.45 s. Calm: a quick linear fade (0.25 s). skipped = any key or tap = done at once. started = false until the layers are baked. */
export function bloomProgress(elapsedMs, { calm = false, skipped = false, started = true, T = TUNE } = {}) {
  if (skipped) return 1;
  if (!started) return 0;
  const d = (calm ? 0.25 : T.bloomT) * 1000;
  const p = clamp(elapsedMs / d, 0, 1);
  return calm ? p : 1 - Math.pow(1 - p, 3);
}

/** Layer shift (px) for layer i at a smoothed pointer (mx, my in -1..1), clamped so it never passes the bake margin. Calm = no shift at all. */
export function layerShift(i, mx, my, { calm = false, margin = 60, T = TUNE, depth = LAYER_DEPTH } = {}) {
  if (calm) return [0, 0];
  const k = T.parallax * (depth[i] ?? 1) * T.maxShift;
  const lim = Math.max(0, margin - 1);
  return [clamp(-mx * k, -lim, lim), clamp(-my * k * 0.5, -lim, lim)];
}
/** Slow auto-drift target (idle pointer or touch): a small Lissajous, scaled by T.drift. Calm = none. */
export function driftTarget(t, { calm = false, T = TUNE } = {}) {
  if (calm || !(T.drift > 0)) return [0, 0];
  return [Math.sin(t * 0.22) * T.drift, Math.sin(t * 0.17 + 1) * T.drift * 0.4];
}

/** Number of motes drawn. Calm none; Low quality tier / Battery saver a smaller share (phones stay cool). */
export function moteCount({ calm = false, low = false, saver = false, T = TUNE } = {}) {
  if (calm) return 0;
  const n = Math.max(0, Math.floor(T.motes));
  return saver ? Math.round(n * 0.3) : low ? Math.round(n * 0.45) : n;
}
/** Lantern flicker multiplier (1 +- 10% x amount). Calm = steady. */
export function flicker(t, { calm = false, T = TUNE } = {}) {
  return 1 + (calm ? 0 : (Math.sin(t * 8.3 * T.flickS) * 0.5 + Math.sin(t * 4.7 * T.flickS) * 0.5) * 0.1 * T.flick);
}

/** Frame pacing: Battery saver draws 30 fps; while the run assets are still baking (title up, prebake not done) the cover draws at most 30 fps so it never competes. */
export function frameGapMs({ saver = false, baking = false } = {}) { return saver || baking ? 33 : 0; }

// ---- colour + contrast (the sandbox's text-contrast probe, reused by tests and the shot script) ----
export const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const toHex = (a) => '#' + a.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
export const mixc = (a, b, t) => { const x = hex2(a), y = hex2(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
export const rgba = (h, a) => { const c = hex2(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const relL = (h) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = hex2(h); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
export const contrast = (a, b) => { const x = relL(a), y = relL(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/** Contrast of cream text against the lightest 5% of a pixel run (RGBA bytes), the sandbox's rule (needs 4.5). */
export function lightestContrast(rgbaBytes, text = '#fff3dc') {
  const ls = [];
  for (let i = 0; i + 2 < rgbaBytes.length; i += 16) ls.push(0.2126 * rgbaBytes[i] + 0.7152 * rgbaBytes[i + 1] + 0.0722 * rgbaBytes[i + 2]);
  if (!ls.length) return { lightest5: 0, contrast: 21 };
  ls.sort((a, b) => a - b);
  const hi = ls.slice(Math.floor(ls.length * 0.95));
  const m = hi.reduce((a, b) => a + b, 0) / Math.max(1, hi.length);
  return { lightest5: Math.round(m), contrast: +contrast(text, toHex([m, m, m])).toFixed(2) };
}
export const rng = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
