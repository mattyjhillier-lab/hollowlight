// S1 wolf pose picker (render only, reads the sim unit, never writes it). Pure: no Phaser/DOM, unit-testable.
// Frames (wolf.js WOLF_POSES): 0-3 lope (advanced by distance travelled), 4 bite (the sim's bite cooldown just reset), 5 sit (idle, no target).
// Calm motion (reduced motion): no lope cycling (frame 0 while moving), bite and sit still show (single held poses, no bob/flicker).
export const BITE_T = 0.16; // seconds the bite frame holds after the sim bites
export const STRIDE = 26; // world units per full 4-frame lope cycle
export const STILL_V = 6; // world units / s below which a wolf counts as standing
export const SIT_AFTER = 0.35; // seconds standing with no target before it sits

export function wolfFrame(s, u, dt, calm = false) {
  if (s.x === undefined) { s.x = u.x; s.y = u.y; s.dist = 0; s.bite = 0; s.still = 0; s.cd = u.atkCd || 0; }
  const m = Math.min(40, Math.hypot(u.x - s.x, u.y - s.y)); // a respawn jump never spins the cycle
  s.x = u.x; s.y = u.y;
  const cd = u.atkCd || 0;
  if (cd > s.cd + 0.05) s.bite = BITE_T; // the sim reset atkCd = it just bit
  s.cd = cd;
  s.bite = Math.max(0, s.bite - dt);
  const v = dt > 0 ? m / dt : 0;
  s.still = v < STILL_V ? s.still + dt : 0;
  if (s.bite > 0) return 4;
  if (s.still > SIT_AFTER && !u.target) return 5;
  if (s.still > 0) return 0;
  s.dist = (s.dist + m) % STRIDE;
  return calm ? 0 : Math.floor((s.dist / STRIDE) * 4) % 4;
}

// per-wolf look: overlay variant (-1 plain, 0 notched ear, 1 chest tuft, 2 curl tail) and the 4% scale jitter, from the unit id only
export function wolfLook(id, jitter = 0.04) {
  let h = (id * 2654435761) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0; h = Math.imul(h, 2246822519) >>> 0; h = (h ^ (h >>> 13)) >>> 0;
  return { ov: (h % 4) - 1, k: 1 + jitter * ((((h >>> 8) % 1001) / 1000) * 2 - 1) };
}
