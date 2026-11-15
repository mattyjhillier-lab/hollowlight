// Ophimber's follow / perch logic (pure maths, no Phaser, no DOM, no allocation per call; unit-tested in tests/lucinda-art.test.mjs).
// RENDER ONLY: Ophimber is not a sim entity. She never collides, never blocks, can never be targeted or hit. Locked beat (docs/design/lucinda-ophimber-look-v1.md):
// she trots PET.behind world units behind Lucinda with a PET.lag second lag and a little hop, perches on Lucinda's back shoulder after PET.still seconds standing
// still, flies up in Ophimber's Rise (risefx.js draws that), and sleeps on her shoulder in Calm (no following, no bobbing).
import { clamp, fin } from './rigmath.js';

export const PET = { behind: 26, lag: 0.15, still: 0.8, perchTau: 0.09, moveEps: 3, hop: 1.1, stride: 7, stepFrames: 4 };
export const TROT_FRAMES = ['o_walk0', 'o_walk1', 'o_walk2', 'o_walk3'];

export function newPet() { return { x: 0, y: 0, still: 0, perched: false, phase: 0, lift: 0, dir: 1, speed: 0, init: false, hop: 0, blinkT: 0 }; }

// One step. hx/hy = Lucinda's feet, dir = her facing (+1 / -1), moved = world units she moved this frame, (sx, sy) = her shoulder perch point in the world,
// calm = Calm motion (sleeps on her shoulder, no follow), snap = place her on the shoulder this frame (after the Rise). Returns the same object.
export function petStep(st, hx, hy, dir, dt, moved, sx, sy, calm, snap) {
  const d = dt > 0 ? Math.min(dt, 0.1) : 0;
  st.dir = dir < 0 ? -1 : 1;
  if (!st.init || snap || !Number.isFinite(st.x) || !Number.isFinite(st.y)) { st.init = true; st.x = sx; st.y = sy; st.still = PET.still; st.perched = true; st.speed = 0; st.lift = 0; return st; }
  const speed = d > 0 ? fin(moved) / d : 0; // Lucinda's speed this frame
  if (speed > PET.moveEps * 2) st.still = 0; else st.still += d;
  const wantPerch = calm || st.still >= PET.still;
  let tx; let ty; let tau;
  if (wantPerch) { tx = sx; ty = sy; tau = calm ? 0.02 : PET.perchTau; } else { tx = hx - st.dir * PET.behind; ty = hy; tau = PET.lag; }
  const px = st.x; const py = st.y;
  const k = d > 0 ? 1 - Math.exp(-d / tau) : 0;
  st.x += (tx - st.x) * k; st.y += (ty - st.y) * k;
  const step = Math.hypot(st.x - px, st.y - py);
  st.speed = d > 0 ? step / d : 0;
  st.perched = wantPerch && Math.hypot(sx - st.x, sy - st.y) < 1.2;
  if (!wantPerch) { st.phase += step / PET.stride; st.phase -= Math.floor(st.phase); }
  // a little hop while she trots (2 per cycle); a longer arc while she crosses to or from the shoulder
  const dist = Math.hypot(tx - st.x, ty - st.y);
  st.hop = !wantPerch && st.speed > 8 ? Math.abs(Math.sin(st.phase * Math.PI * 2)) * PET.hop : 0;
  st.lift = st.perched ? 0 : clamp(dist * 0.14, 0, 5) * (wantPerch ? 1 : 0.6);
  return st;
}

// which atlas frame: perched = sit (a wing twitch every few seconds; asleep in Calm); trotting = the 4-frame cycle; arrived but not yet perched = stand
export function petFrame(st, calm, t) {
  if (calm) return 'o_sleep';
  if (st.perched) return ((t % 5.2) < 0.18) ? 'o_sit1' : 'o_sit0';
  if (st.speed > 8) return TROT_FRAMES[Math.floor(st.phase * PET.stepFrames) % PET.stepFrames];
  return 'o_stand';
}

// Lucinda's face for this frame (pure, like pickEliasExpr): kind | blink | hurt | cast | death
export function pickLucindaExpr(dead, hurtActive, casting, blink) {
  if (dead) return 'death';
  if (hurtActive) return 'hurt';
  if (casting) return 'cast';
  return blink ? 'blink' : 'kind';
}

// Ophimber's Rise cast pose of her near arm: 0 = rest, 1 = raised (a smooth in over 0.2 s, hold until `settle`, out over 0.4 s)
export function castArm(t, settle) {
  if (!(t >= 0)) return 0;
  const a = clamp(t / 0.2, 0, 1); const s = Number.isFinite(settle) ? settle : 2.4;
  const b = t < s ? 1 : clamp(1 - (t - s) / 0.4, 0, 1);
  const e = (v) => v * v * (3 - 2 * v);
  return e(a) * e(b);
}
