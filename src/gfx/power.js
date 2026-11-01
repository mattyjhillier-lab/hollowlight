// PHONE HEAT (LOCKED 2026-11-01): fewer frames and fewer pixels on phones so they run cooler. Render only; the sim runs on its own clock.
// Phaser's frame limiter skips a frame when the elapsed time is under 1000/limit ms, and a 60 Hz screen delivers frames a hair under
// 16.67 ms, so the limit sits just above the target (62 for "60", 32 for "30") to never drop a 60 Hz phone to 30 fps.
export const FPS_LIMIT_PHONE = 62; // a 90/120 Hz phone draws 60 (or 45 at 90 Hz) instead of 90-120
export const FPS_LIMIT_SAVER = 32; // Battery saver: 30
export const DPR_CAP_SAVER = 1.25; // Battery saver: fewer pixels (desktop and normal phones keep the existing cap of 2)

/** Pure: Phaser frame limit (0 = none). Desktops are never limited. */
export function fpsLimitFor({ phone = false, saver = false } = {}) {
  if (!phone) return 0;
  return saver ? FPS_LIMIT_SAVER : FPS_LIMIT_PHONE;
}

/** Pure: render-scale cap (device pixels per CSS pixel). saver only counts on phones. */
export function dprCapFor({ phone = false, saver = false, base = 2 } = {}) {
  return phone && saver ? Math.min(base, DPR_CAP_SAVER) : base;
}

/** Pure: the Picture quality mode the game should use. Battery saver forces Low on phones. */
export function qualityModeFor(chosen, { phone = false, saver = false } = {}) {
  return phone && saver ? 'low' : chosen;
}

/** Change a running Phaser game's frame limit. Needs the limited loop that fpsLimitFor made at boot (phones always have one),
 *  so it only retunes the rate; it never switches the loop type. Returns true if applied. */
export function setLoopLimit(loop, limit) {
  if (!loop || !loop.hasFpsLimit || !(limit > 0)) return false;
  loop.fpsLimit = limit;
  loop._limitRate = 1000 / limit;
  return true;
}
