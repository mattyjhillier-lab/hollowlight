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

// Pose for a walk phase (WALK v2, 2026-10-18). One leg cycle = two steps. Contacts at phase 0 and 0.5 (feet furthest apart),
// passing poses at 0.25 / 0.75. Everything is a smooth sine of the STEP angle (no |cos| cusps), so the body makes ONE soft bump
// per step: lowest just after contact (weight lands), highest just after passing. The head rides the neck with a small lag
// (follow-through) and never squashes; feet lift on their FORWARD swing (sin^2: zero slope at lift-off and plant).
// Writes into `o` (preallocated). sp = walk amount 0..1 (0 = standing: the rest pose exactly).
export const WALK = { bob: 2.2, headLag: 0.55, land: 0.35, squash: 0.014, lean: 5, nod: 1.6, rock: 1.1 };
export function walkPose(o, phase, sp) {
  const s = clamp(fin(sp), 0, 1);
  const a = fin(phase) * TAU;
  const b = 2 * a; // step angle
  const leg = Math.cos(a); // +1: near foot forward
  const sn = Math.sin(a);
  const h = 0.5 - 0.5 * Math.cos(b - WALK.land); // body height 0 (just after contact) .. 1 (just after passing)
  const hh = 0.5 - 0.5 * Math.cos(b - WALK.land - WALK.headLag); // the head, a beat later
  o.leg = leg * s + 0;
  o.lift = sn < 0 ? sn * sn * s : 0; // near foot swings forward while leg rises (sin < 0)
  o.lift2 = sn > 0 ? sn * sn * s : 0;
  o.h = h * s;
  o.bob = -h * WALK.bob * s + 0; // du, up is negative
  o.headBob = -hh * WALK.bob * s + 0; // head anchor uses this instead of bob (lags the body a little)
  o.sy = 1 + WALK.squash * s * (2 * h - 1); // a touch shorter on landing, a touch taller at the top
  o.sx = 1 - 0.6 * WALK.squash * s * (2 * h - 1);
  o.lean = WALK.lean * s; // degrees, forward
  o.nod = (WALK.nod * Math.sin(b - WALK.land - WALK.headLag - 1.2) - WALK.rock * leg) * s; // degrees: small nod per step + side rock per cycle
  o.tailSway = (0.13 * Math.sin(a - 0.9) + 0.05 * Math.sin(b - 1.6)) * s; // rad, trails the hips
  return o;
}

// Walk driver (WALK v2): smooth speed, walk amount and phase from the raw per-frame distance, frame-rate independent.
// st = {v, amp, phase, acc}; dist = world units moved this frame; dt seconds; top = full walk speed (u/s); stride = u per leg cycle.
// Phase advances by the SMOOTHED speed (a frame hitch can never kick the legs); stride shortens at low speed (slow = small steps).
export function walkDrive(st, dist, dt, top, stride = STRIDE) {
  if (!(dt > 0)) return st;
  const h = Math.min(dt, 0.1);
  const T = top > 1 ? top : 100;
  const vRaw = clamp(fin(dist) / h, 0, T * 1.6);
  const v0 = fin(st.v);
  st.v = v0 + (vRaw - v0) * (1 - Math.exp(-h / 0.06));
  const acc = (st.v - v0) / h;
  st.acc = fin(st.acc) + (acc - fin(st.acc)) * (1 - Math.exp(-h / 0.08));
  const tgt = clamp(st.v / T, 0, 1);
  const amp = fin(st.amp);
  st.amp = amp + (tgt - amp) * (1 - Math.exp(-h * (tgt > amp ? 12 : 8))); // eases in a little faster than out
  const len = (stride > 0 ? stride : STRIDE) * (0.7 + 0.3 * tgt);
  st.phase = advancePhase(st.phase, st.v * h, len);
  return st;
}

// Turn: a quick soft squeeze of the width when the facing flips (t = seconds since the flip). 1 = none.
export const TURN_T = 0.14;
export const turnSquash = (t) => { const k = fin(t, 9) / TURN_T; return k >= 0 && k < 1 ? 1 - 0.28 * Math.sin(k * Math.PI) : 1; };

// Signed lean that eases through zero on a turn instead of snapping (deg); st = {v}. Returns the new value.
export function easeTo(cur, target, dt, tau) { const c = fin(cur, target); return c + (fin(target) - c) * (1 - Math.exp(-clamp(dt, 0, 0.1) / (tau > 0 ? tau : 0.05))); }

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
