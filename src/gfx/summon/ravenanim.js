// S3 raven pose picker + skin (render only: reads the sim unit, never writes it). Pure: no Phaser/DOM, unit-testable.
// Scout cycle from the existing sim state (weapons.js ravenFlock): perch -> dive -> peck -> return.
//   perch            'perch' (wings folded; the sim already bobs its position)
//   dive             'up' for the first TAKEOFF_T s (take-off), then 'swoop' (folded streak) turned to its heading
//   dive, Talon Mark climb (tellK < 1): flapping 'up'/'down' above the foe; strike: 'dive' (folded dart) turned to its heading
//   peck             'peck' held PECK_HOLD s after each peck, 'perch' (head up) between pecks
//   return           flapping 'up'/'down'
//   Wall of Wings ring raven (u.wall): 'spread' with a short 'up' beat; Spearhead wedge raven (u.wedge): 'swoop' while the wedge flies, else flapping
// Calm motion (reduced motion): no flapping or peck bob (held 'up' / 'spread' / 'peck'); poses still change with the state, no flicker.
import { BAKED_ROT, GOLD_POSES, LEAD_K, LOW_POSE } from './raven.js';

export const FLAP_T = 0.09; // seconds per wing stroke (up or down)
export const TAKEOFF_T = 0.12;
export const PECK_HOLD = 0.08;
export const SPREAD_CYCLE = 0.42, SPREAD_HOLD = 0.3; // ring ravens: spread 0.3 s, one up-beat 0.12 s
export const MAX_TURN = 0.7; // radians: a heading turn is clamped so a raven never flies on its back
const DEG = Math.PI / 180;

export function ravenPose(s, u, dt, { calm = false, talon = false, wedgeOn = false } = {}) {
  if (s.x === undefined) { s.x = u.x; s.y = u.y; s.vx = 0; s.vy = 0; s.st = u.st; s.stT = 0; s.flap = 0; s.pk = u.pecks || 0; s.peckT = 0; }
  const mx = u.x - s.x, my = u.y - s.y;
  s.x = u.x; s.y = u.y;
  if (dt > 0 && Math.hypot(mx, my) < 60) { const k = Math.min(1, dt * 14); s.vx += (mx / dt - s.vx) * k; s.vy += (my / dt - s.vy) * k; } // a respawn jump never turns it
  if (u.st !== s.st) { s.st = u.st; s.stT = 0; } else s.stT += dt;
  s.flap += dt;
  const flap = calm ? 'up' : Math.floor(s.flap / FLAP_T) % 2 ? 'down' : 'up';
  const dir = Math.abs(s.vx) > 8 ? Math.sign(s.vx) : (u.faceX || 1) < 0 ? -1 : 1;
  let pose;
  if (u.wall) pose = calm || s.flap % SPREAD_CYCLE < SPREAD_HOLD ? 'spread' : 'up';
  else if (u.wedge) pose = wedgeOn ? 'swoop' : flap;
  else if (u.st === 'perch') pose = 'perch';
  else if (u.st === 'dive') pose = talon ? ((u.tellK || 0) < 1 ? flap : 'dive') : s.stT < TAKEOFF_T ? 'up' : 'swoop';
  else if (u.st === 'peck') {
    if ((u.pecks || 0) !== s.pk) { s.pk = u.pecks || 0; s.peckT = PECK_HOLD; }
    s.peckT = Math.max(0, s.peckT - dt);
    pose = calm || s.peckT > 0 ? 'peck' : 'perch';
  } else pose = flap; // return (and anything new)
  if (u.st !== 'peck') s.pk = u.pecks || 0;
  let rot = 0;
  if (pose === 'swoop' || pose === 'dive') {
    const sp = Math.hypot(s.vx, s.vy);
    const ang = sp > 20 ? Math.atan2(s.vy, Math.abs(s.vx)) : BAKED_ROT[pose] * DEG; // heading below the horizon (+ = down)
    rot = dir * Math.max(-MAX_TURN, Math.min(MAX_TURN, ang - BAKED_ROT[pose] * DEG));
  }
  return { pose, rot, flip: dir < 0 };
}

// Gold rim only on the units that carry the evolved verb (LOCKED: same creature + gold rim + one signature change; gold only on evolved units):
//   Talon Mark (dive_bombers)   every scout (they are the dive darts)
//   Wall of Wings (murder_storm) the ring ravens (the scouts are unchanged)
//   Spearhead (spearhead)        the lead wedge raven only, drawn LEAD_K x
// Low tier: one flat per creature (raven_flat0 plain, raven_flat1 gold), no turn.
export function ravenSkin(evo, u, lead, low, pose) {
  const gold = (evo === 'dive_bombers' && !u.wall && !u.wedge) || (evo === 'murder_storm' && !!u.wall) || (evo === 'spearhead' && !!u.wedge && lead);
  const size = evo === 'spearhead' && u.wedge && lead ? LEAD_K : 1;
  if (low) return { fr: gold ? 'raven_flat1' : 'raven_flat0', gold, size, low: true };
  if (gold && GOLD_POSES.includes(pose)) return { fr: 'ravg_' + pose, gold, size, low: false };
  return { fr: 'raven_' + (pose || LOW_POSE), gold: false, size, low: false };
}
