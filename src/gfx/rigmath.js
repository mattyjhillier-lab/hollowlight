// Pure maths for the Wren / pup code-driven rig (no Phaser, no DOM, no allocation in the hot calls; unit-tested in tests/herorig.test.mjs).
// Visual only: nothing here is ever read by the sim.
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v >= a ? (v <= b ? v : b) : a); // NaN -> a
export const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);

export const STRIDE = 46; // world units walked per full leg cycle (about 0.44 s at Wren's speed)
export const PUP_STRIDE = 26; // world units per pup bound cycle

// Walk phase advances with DISTANCE, not time, so feet never skate. Returns phase in [0,1).
export function advancePhase(phase, dist, stride = STRIDE) {
  const p = fin(phase) + fin(dist) / (stride > 0 ? stride : STRIDE);
  return p - Math.floor(p);
}

// Pose for a walk phase: leg = +-1 foot swing, pass = 0 at full stride .. 1 at the passing pose (body highest/narrowest).
// Writes into `o` (preallocated). sp = speed 0..1 (0 = standing still).
export function walkPose(o, phase, sp) {
  const s = clamp(sp, 0, 1);
  const a = fin(phase) * TAU;
  const leg = Math.cos(a);
  const pass = 1 - Math.abs(leg);
  o.leg = leg * s + 0;
  o.lift = Math.max(0, Math.sin(a)) * s; // far foot lift 0..1 (near foot = the other half)
  o.lift2 = Math.max(0, -Math.sin(a)) * s;
  o.bob = -pass * 3.5 * s + 0; // du, up is negative
  o.sy = 1 - 0.05 * s + 0.09 * pass * s;
  o.sx = 1 + 0.04 * s - 0.07 * pass * s;
  o.lean = 6 * s; // degrees, forward
  o.tailSway = Math.sin(a) * 0.16 * s; // rad
  return o;
}

// Squash and stretch are always clamped so a bad input can never break the silhouette.
export const SQ_MIN = 0.82;
export const SQ_MAX = 1.18;
export const clampSq = (v) => clamp(fin(v, 1), SQ_MIN, SQ_MAX);

// Idle: breathing (2.4 s loop) and a blink (0.12 s every ~4 s, offset so it is not metronomic).
export const breathe = (t) => 1 + 0.03 * Math.sin((fin(t) / 2.4) * TAU);
export const isBlink = (t) => { const k = fin(t) % 4.3; return k > 3.9 && k < 4.02; };

// Facing: keeps the previous side while the input is ~0 (never flickers on a stick re-centre).
export const faceDir = (prev, faceX) => (faceX > 0.05 ? 1 : faceX < -0.05 ? -1 : (prev < 0 ? -1 : 1));

// Critically-damped-ish 2D spring. s = {x,y,vx,vy}. Safe for any dt / NaN / Infinity / teleports (snaps when far).
export function springStep(s, tx, ty, dt, k = 70, damp = 0.85, snap = 160) {
  if (!(Number.isFinite(tx) && Number.isFinite(ty))) return s;
  const h = clamp(dt, 0, 1 / 30);
  if (!Number.isFinite(s.x) || !Number.isFinite(s.y) || Math.hypot(tx - s.x, ty - s.y) > snap) { s.x = tx; s.y = ty; s.vx = 0; s.vy = 0; return s; }
  const c = 2 * Math.sqrt(k) * damp;
  s.vx += ((tx - s.x) * k - s.vx * c) * h;
  s.vy += ((ty - s.y) * k - s.vy * c) * h;
  s.x += s.vx * h;
  s.y += s.vy * h;
  if (!(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.vx) && Number.isFinite(s.vy))) { s.x = tx; s.y = ty; s.vx = 0; s.vy = 0; }
  return s;
}

// Where the pup wants to be: at her heel (behind her, ground level), further back the faster she moves.
// (px,py) = her feet; ux,uy = unit move direction (0,0 when still); dir = her facing; sp = speed 0..1. Writes {x,y} into o.
export function heelTarget(o, px, py, dir, ux, uy, sp) {
  const s = clamp(sp, 0, 1);
  const back = 10 - 5 * s; // world units: sits at her heel when still; the spring lag (~0.11 s) supplies the rest (46..80 du in the sheet)
  const moving = s > 0.05;
  const bx = moving ? -ux : -dir;
  const by = moving ? -uy * 0.5 : 0;
  o.x = fin(px) + bx * back;
  o.y = fin(py) + 0.8 + by * back;
  return o;
}

// Pup pose with hysteresis: bounds when it is moving, sits again after it has been still for 0.25 s.
export function pupPose(st, speed, dt) {
  if (speed > 18) { st.run = true; st.still = 0; } else if (speed < 6) { st.still += clamp(dt, 0, 0.1); if (st.still > 0.25) st.run = false; }
  return st.run;
}

// Hurt timeline (seconds since the hit). tint: 0 none, 1 white flash (0-60 ms), 2 red (to 0.25 s).
export function hurtFx(o, t) {
  const k = fin(t, 9);
  o.tint = k < 0.06 ? 1 : k < 0.25 ? 2 : 0;
  const q = k < 0.25 ? 1 - k / 0.25 : 0;
  o.sx = 1 + 0.12 * q; o.sy = 1 - 0.12 * q; o.lean = -9 * q; // squash then spring back
  o.active = k < 0.6; // glints/ears/pup stay in the hurt pose a little longer
  return o;
}

// Death timeline (seconds): fade to light. alpha 1 -> 0.4, rise up to 16 du, stretch 14%, ember sinks and is the last light to go.
export function deathFx(o, t) {
  const k = clamp(fin(t) / 1.6, 0, 1);
  o.k = k;
  o.alpha = 1 - 0.6 * k;
  o.rise = 16 * k;
  o.sy = k < 0.15 ? 0.78 + (0.22 / 0.15) * k : 1 + 0.14 * ((k - 0.15) / 0.85);
  o.sx = k < 0.15 ? 1.12 - (0.12 / 0.15) * k : 1 - 0.1 * ((k - 0.15) / 0.85);
  o.light = k; // 0..1 cream-amber fill mix
  o.emberY = -80 + 68 * k; // ember sinks toward the ground and keeps glowing
  return o;
}

// Which head texture to use.
export function pickExpr(dead, hurtActive, lowHp, blink) {
  if (dead) return 'death';
  if (hurtActive) return 'hurt';
  if (lowHp) return 'worried';
  return blink ? 'blink' : 'neutral';
}

// Which pup head texture to use.
export function pickPupExpr(hurtActive, run, blink) {
  if (hurtActive) return 'hurt';
  if (run) return 'happy';
  return blink ? 'blink' : 'open';
}

// Cheap deterministic hash in [0,1) from an integer (curious head tilts without Math.random).
export function hash01(n) {
  let x = (Math.floor(fin(n)) ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0; x = (x ^ (x >>> 16)) >>> 0;
  return x / 4294967296;
}

// Pup curious head tilt (deg): every ~3.2 s it tilts toward the ember for a second, either way.
export function pupTilt(t) {
  const slot = Math.floor(fin(t) / 3.2); const k = (fin(t) - slot * 3.2) / 3.2;
  if (hash01(slot) < 0.35 || k > 0.4) return 0;
  const a = Math.sin((k / 0.4) * Math.PI); // 0..1..0
  return a * (hash01(slot + 77) < 0.5 ? 14 : -12);
}

// A1b: hero readability aids. Pure: returns the halo alpha (warm ground pool) for the frame. Low tier = 0 (ring only);
// reduced motion = steady; low HP dims it (the danger ring takes over).
export function heroHaloAlpha(tier, reduced, lowHp, t) {
  if (tier === 'low') return 0;
  const base = lowHp ? 0.24 : 0.42;
  return reduced ? base : base + 0.03 * Math.sin(t * 2.5);
}

// ---- A2: Elias v2 helpers (pure) ----
// Which Elias head texture to use. cast = Candle Wheel just planted (jaw set, brows up).
export function pickEliasExpr(dead, hurtActive, cast, lowHp, blink) {
  if (dead) return 'death';
  if (hurtActive) return 'hurt';
  if (cast) return 'brace';
  if (lowHp) return 'tender';
  return blink ? 'blink' : 'kind';
}

// Staff swing about the gripping hand, degrees (forward = positive). Still: a faint rest lean. Walking: leans forward and sways with the step.
export function staffTilt(phase, sp) {
  const s = clamp(sp, 0, 1);
  return 1 + 3 * s + Math.sin(fin(phase) * TAU) * 2.2 * s;
}

// Candle Wheel flare 1..1.5 for the crown glow while a wheel stands (opens fast, fades over the last 0.5 s). wheel = {age, ttl} or null.
export function wheelFlare(wheel) {
  if (!wheel) return 1;
  return 1 + 0.5 * clamp(fin(wheel.age) / 0.3, 0, 1) * clamp(fin(wheel.ttl) / 0.5, 0, 1);
}
export const wheelCasting = (wheel) => !!wheel && fin(wheel.age) < 0.7;
