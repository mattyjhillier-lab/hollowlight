// DR3: crowd readability rules (pure JS, no Phaser/DOM, unit-testable). Visual only: reads sim state, never writes it; enemy counts are never touched.
// Threat hierarchy: common swarmers (wolf, crow, root crawler) are drawn a little quieter and UNDERNEATH; the must-react types (Stoat Piper, Puffback
// Toad, Bramble Hart, later the miniboss) keep full strength, get a cream outline and draw ON TOP; enemies overlapping the hero fade so she and her
// hits show; ambient layers (fog, fireflies, petals) and small numbers dim while the crowd is thick (density-aware effect budget, eased over ~0.5 s).
export const MUST_REACT = { stoat_piper: true, puffback_toad: true, bramble_hart: true, miniboss: true };
export const isMustReact = (type) => MUST_REACT[type] === true;

// depth bands (added to D_LIT): filler + hero y-sort in 0..4000 as before; must-react types sort above all of them (still y-sorted among themselves);
// the lifted attacker above those; the hero outline stack on top of everything in the world.
export const DEPTH_MUST = 4100;
export const DEPTH_LIFT = 8500;
export const DEPTH_HERO_OUT = 9000;

export const FADE_R = 30; // enemies closer than this to the hero fade ...
export const FADE_FILLER = 0.5; // ... to this (common swarmers)
export const FADE_MUST = 0.75; // ... and this (must-react types stay more solid: they are the threats)
export const FILLER_QUIET = 0.2; // max alpha reduction of a common swarmer in a thick crowd (value pulled toward the ground)
export const HERO_OUT_BASE = 0.55; // the hero's cream outline is always on ...
export const HERO_OUT_CROWD = 0.9; // ... and stronger when 3+ enemies crowd her
export const DENSE_NEAR = 8; // enemies within DENSE_R of the hero ...
export const DENSE_R = 120;
export const DENSE_VIEW = 120; // ... or this many in view = a thick crowd
export const MUST_OUT_CAP = { high: 23, med: 14, low: 0 }; // cream outline images per tier (Low: depth rule only)

const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// The common swarm is only quieted while bodies are still read mostly by their eyes + rims (night): once the daylight look darkens bodies against bright
// ground (arc.bodyK < 1, WL6d), body/ground contrast is already at its gate floor (|dL*| >= 6, strict from 11:30) and must not be flattened. 1 at night,
// easing to 0 by bodyK 0.97.
export const quietScale = (bodyK) => clamp01((fin(bodyK, 1) - 0.97) / 0.03);

// Alpha of one enemy this frame. d = distance to the hero (world units), k = density 0..1, must = isMustReact(type).
// Ramp: full fade inside FADE_R, back to the quiet value by FADE_R + 14 (no pop as a wolf runs past).
export function enemyAlpha(d, k, must) {
  const quiet = must ? 1 : 1 - FILLER_QUIET * clamp01(fin(k));
  const dd = fin(d, 1e9);
  if (dd >= FADE_R + 14) return quiet;
  const lo = must ? FADE_MUST : FADE_FILLER;
  if (dd <= FADE_R) return Math.min(quiet, lo);
  const u = (dd - FADE_R) / 14;
  return Math.min(quiet, lo + (1 - lo) * u);
}

export function depthOf(y, must) { return fin(y) + (must ? DEPTH_MUST : 0); }

// Anything within FADE_R of the hero draws UNDER her (just below her own y-sorted depth), however many are piled on her: fading alone cannot work
// because ten half-transparent sprites stack back to opaque. Faded + underneath, she and her hit cues always show.
export const NEAR_UNDER = 1; // depth units below the hero's own y depth
export const depthNear = (heroY) => fin(heroY) - NEAR_UNDER;

// Hero outline alpha target: always on, stronger in a crowd (the caller smooths it)
export const heroOutTarget = (crowded) => (crowded ? HERO_OUT_CROWD : HERO_OUT_BASE);

// Density (smoothed 0..1): 1 when 8+ enemies are within 120 u of the hero or 120+ are in view.
export class Density {
  constructor() { this.k = 0; this.target = 0; }
  reset() { this.k = 0; this.target = 0; }
  update(near, inView, dt) {
    this.target = fin(near) >= DENSE_NEAR || fin(inView) >= DENSE_VIEW ? 1 : 0;
    const step = Math.max(0, Math.min(0.1, fin(dt))) / 0.5; // eases over ~0.5 s
    this.k += Math.max(-step, Math.min(step, this.target - this.k));
    this.k = clamp01(this.k);
    return this.k;
  }
}

// Ambient multipliers while crowded (fog thins, fireflies/motes nearly stop, petals fade)
export const fogMul = (k) => 1 - 0.5 * clamp01(fin(k));
export const flyMul = (k) => 1 - 0.85 * clamp01(fin(k));
export const petalMul = (k) => 1 - 0.7 * clamp01(fin(k));

// Small damage numbers near the hero are not spawned while the crowd is thick (the damage-taken number keeps its own lane).
// val = the number, ref = the running typical hit (0 = unknown yet), d = distance from the hero.
export function skipSmallNumber(k, val, ref, d) {
  return clamp01(fin(k)) > 0.5 && fin(ref) > 0 && fin(val) < 0.6 * fin(ref) && fin(d, 1e9) < 80;
}
