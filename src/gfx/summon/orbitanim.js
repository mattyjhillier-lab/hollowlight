// S4 Candle Flames: flicker frame, lean into the spin, flare on hit, the Judgement Wheel flower and per-evolution skin (render only: reads the sim
// unit, never writes it). Pure: no Phaser/DOM, unit-testable.
//   flicker   ping-pong of the 3 baked heights 0-1-2-1, one step per FLICK_STEP s, per-light phase offset (one cycle ~0.7 s: <= 3 crossings/s)
//   lean      the flame tip trails its sideways motion (rotation about the flame centre, clamped to LEAN_MAX)
//   flare     a light touching a foe (contact = the sim's hit test) flares for FLARE_T s: drawn larger and brighter
//   Calm motion (reduced motion): frame 0 held, no lean, no flare
import { HALO_K, WHEEL_K } from './orbit.js';

export const FLICK_STEP = 0.17, FLICK_SEQ = [0, 1, 2, 1];
export const LEAN_MAX = 0.22, LEAN_K = 0.0016; // radians; radians per world unit / s of sideways speed
export const FLARE_T = 0.14, FLARE_K = 0.22; // seconds; extra scale at the flare's peak
export const FLOWER_T = 0.42, REFORM_T = 0.3; // Judgement Wheel: flower life (s); the light re-forms over the last REFORM_T s of its rest
// per-tier caps (docs/design/summons-art-v1.md section 5): flowers in flight (spawn/despawn beats), stained-glass petals on the Sanctum ground
export const ORBIT_CAPS = { high: { flowers: 4, petals: 12, ring: true }, med: { flowers: 4, petals: 12, ring: true }, low: { flowers: 0, petals: 0, ring: true } };

export function flameFrame(s, u, dt, calm) {
  if (s.t === undefined) { s.t = (u.id * 0.137) % 1 * FLICK_SEQ.length * FLICK_STEP; s.x = u.x; s.y = u.y; s.vx = 0; s.lean = 0; s.flare = 0; }
  s.t += dt;
  const mx = u.x - s.x; s.x = u.x; s.y = u.y;
  if (dt > 0 && Math.abs(mx) < 40) s.vx += (mx / dt - s.vx) * Math.min(1, dt * 12); // a jump (respawn, wheel lock) never swings it
  s.lean = calm ? 0 : Math.max(-LEAN_MAX, Math.min(LEAN_MAX, -s.vx * LEAN_K));
  s.flare = Math.max(0, s.flare - dt);
  return calm ? 0 : FLICK_SEQ[Math.floor(s.t / FLICK_STEP) % FLICK_SEQ.length];
}
export const flare = (s) => { s.flare = FLARE_T; };
// 0..1 flare strength (eased down)
export const flareK = (s) => { const k = Math.max(0, s.flare || 0) / FLARE_T; return k * k; };

// skin: base flames (flame_), gold-rimmed flames on every EVOLVED light (Sanctum Halo small candles, Judgement Wheel big flames, Vesper Tide);
// Low: one flat frame (plain / gold)
export function orbitSkin(evo, low, fi) {
  const gold = evo === 'sanctum_halo' || evo === 'judgement_wheel' || evo === 'vesper_tide';
  const size = evo === 'sanctum_halo' ? HALO_K : evo === 'judgement_wheel' ? WHEEL_K : 1;
  if (low) return { fr: gold ? 'flat_flameg' : 'flat_flame', gold, size };
  return { fr: (gold ? 'flameg_' : 'flame_') + (fi || 0), gold, size };
}

// Vesper Tide: 0..1 stretch while the ring swells out (follows the swell speed, sin of the tide phase; 0 while drawing back or held by the guard)
export function streakK(out, ph) { return out ? Math.max(0, Math.min(1, Math.sin(ph || 0) * 1.15)) : 0; }
// rotation that turns the flame tip toward the hero (dx, dy = light - hero), blended k of the way from rot (shortest turn)
export function streakRot(rot, dx, dy, k) {
  const to = Math.atan2(-dy, -dx) + Math.PI / 2; // the frame's tip points to -y at rotation 0
  let d = to - rot; d = Math.atan2(Math.sin(d), Math.cos(d));
  return rot + d * k;
}
// Judgement Wheel flower of flame: 6 petals open out from the burst point and fade (Calm: full size, fade only). k = age / FLOWER_T.
// Returns { scale, alpha } for the petals (scale is relative to the big flame), or null once it has faded.
export function flowerAt(k, calm) {
  if (k < 0 || k >= 1) return null;
  const e = 1 - (1 - k) * (1 - k);
  return { scale: calm ? 1 : 0.5 + 0.6 * e, alpha: k < 0.25 ? 1 : 1 - (k - 0.25) / 0.75 };
}
// a resting Wheel light re-forms over the last REFORM_T s of its rest (0 = still an ember, 1 = whole); Calm: no growth, it reappears whole
export function reformK(disabledT, calm) {
  if (!(disabledT > 0)) return 1;
  if (calm) return 0;
  return disabledT >= REFORM_T ? 0 : 1 - disabledT / REFORM_T;
}
