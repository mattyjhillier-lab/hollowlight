// HUD-1 pure helpers (no DOM). Everything is NaN/Infinity safe: bad input never throws and never leaves the 0..1 range.
const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);
export const clamp01 = (v) => { v = fin(v, 0); return v < 0 ? 0 : v > 1 ? 1 : v; };
export const frac = (n, d) => (Number.isFinite(d) && d > 0 ? clamp01(n / d) : 0);

// ---- lantern flame = HP ----
export const FLAME_LOW = 0.35; // below this the flame turns to an ember
export const FROST_FROM = 0.3; // frost starts below this HP fraction
export const hpFrac = (hp, max) => frac(hp, max);
// Flame size: 0.294 (ember, 0 HP) .. 0.7 (full). Never zero, so the lantern always holds a spark.
export const flameScale = (f) => 0.7 * (0.42 + 0.58 * clamp01(f));
export const isEmber = (f) => clamp01(f) < FLAME_LOW;
// Frost amount 0..1: 0 at/above 30% HP, smoothly full at 10% HP.
export const frostAmount = (f) => clamp01((FROST_FROM - clamp01(f)) / 0.2);

// ---- XP thread ----
export const xpFrac = (xp, need) => frac(xp, need);
export const litNotches = (f, n = 10) => Math.min(n, Math.floor(clamp01(f) * n + 1e-9));

// ---- weapon strip ----
// Rank pips: an owned weapon always shows at least one lit pip; evolved weapons show all lit.
export const rankPips = (total, maxTotal, n = 5, evo = false) => {
  if (evo) return n;
  const f = frac(total, maxTotal);
  return Math.max(1, Math.min(n, Math.ceil(f * n - 1e-9)));
};
// Cooldown ring: remaining/peak, clamped. peak<=0 -> no ring.
export const ringFrac = (cd, peak) => frac(cd, peak);

// ---- moon arc ----
export const moonT = (time, runSeconds) => frac(time, runSeconds);
export function arcGeom(w, rise) {
  const R = (w * w / 4 + rise * rise) / (2 * rise);
  return { w, rise, R, ccy: -rise + R, th0: Math.asin(w / 2 / R) };
}
// Point on the arc for t in 0..1; x relative to the arc centre, y relative to the arc's top (y0).
export function moonPoint(t, g) {
  const a = -g.th0 + 2 * g.th0 * clamp01(t);
  return { x: g.R * Math.sin(a), y: g.ccy - g.R * Math.cos(a) };
}

// ---- weapon strip fade: full -> low after FADE_AFTER s idle; any wake brings it back ----
export const FADE_AFTER = 8;
export const FADE_LOW = 0.4;
export const newFade = () => ({ last: 0 });
export const fadeWake = (st, now) => { st.last = fin(now, 0); return st; };
// 'full' while within FADE_AFTER seconds of the last wake (also when the clock restarts or goes backwards).
export const fadeLevel = (st, now, after = FADE_AFTER) => {
  const idle = fin(now, 0) - fin(st.last, 0);
  return idle < after ? 'full' : 'low';
};
export const fadeOpacity = (st, now) => (fadeLevel(st, now) === 'full' ? 1 : FADE_LOW);
