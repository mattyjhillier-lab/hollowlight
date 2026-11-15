// PHONE HEAT (LOCKED 2026-11-01): fewer frames and fewer pixels on phones so they run cooler. Render only; the sim runs on its own clock.
// Phaser's frame limiter skips a frame when the time since the last DRAWN frame is under 1000/limit ms. IPHONE-PERF: Safari/WebKit
// rounds rAF timestamps to whole milliseconds, so a 60 Hz screen delivers 16, 17, 17, 16 ... ms; with the old limit 62 (16.13 ms) every
// 16 ms tick was skipped and an iPhone drew ~40 fps (probe "frame 25 ms" on any tier, real WebKit raw rAF p50 16 ms vs drawn 33 ms).
// The limit now sits well above the target (rate ~0.85 of the target interval) so jittered / rounded ticks still land on the right count.
export const FPS_LIMIT_PHONE = 72; // 13.9 ms: 60 Hz draws every tick, 120 Hz every 2nd (60), 90 Hz every 2nd (45)
export const FPS_LIMIT_SAVER = 36; // Battery saver: 27.8 ms: 60 Hz every 2nd tick (30), 120 Hz every 4th (30)
export const DPR_CAP_SAVER = 1.25; // Battery saver: fewer pixels (desktop and normal phones keep the existing cap of 2)

/** Pure: Phaser frame limit (0 = none). Desktops are never limited. */
export function fpsLimitFor({ phone = false, saver = false } = {}) {
  if (!phone) return 0;
  return saver ? FPS_LIMIT_SAVER : FPS_LIMIT_PHONE;
}

export const FPS_LIMIT_REST = 22; // 45.5 ms = every 3rd 60 Hz tick (20 fps) even with 1 ms rounding (16+16+17 = 49 ms) // FREEZE-1: phones while the run is held (pause, level-up / chest cards, settings, intro cards): the world behind stands still

/** Pure: frame limit for a phone whose run is held (rest = paused / cards / settings / intro). Never raises a lower limit; desktops untouched (0). */
export function restLimitFor({ phone = false, saver = false, rest = false } = {}) {
  const base = fpsLimitFor({ phone, saver });
  return rest && base > 0 ? Math.min(base, FPS_LIMIT_REST) : base;
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
