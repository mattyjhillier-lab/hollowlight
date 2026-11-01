// Camera follow (render only, pure, no allocation). Replaces Phaser's startFollow(target, roundPixels=true, 0.18):
// that floored the camera scroll AND every sprite position to whole WORLD units (2-4 device px at our zoom), so the world
// juddered in uneven 1/2-unit steps and each rig part snapped on its own (the hero's head/body/boots jittered against each other).
// Here: frame-rate independent exponential follow on a float centre; the scroll is snapped to the DEVICE pixel grid so the
// static world keeps one sub-pixel phase (no shimmer) while sprites move sub-pixel smooth.
export const FOLLOW_LERP60 = 0.18; // fraction of the gap closed per 60 Hz frame (same feel as the old follow)
export const FOLLOW_SNAP = 200; // world units: a jump this big (new run, teleport) snaps instead of easing

// Fraction of the remaining gap to close this frame for any dt (seconds); 0.18 at 1/60 s.
export function followK(dt, lerp60 = FOLLOW_LERP60) {
  if (!(dt > 0)) return 0;
  const l = lerp60 > 0 && lerp60 < 1 ? lerp60 : FOLLOW_LERP60;
  return 1 - Math.pow(1 - l, Math.min(dt, 0.25) * 60);
}

// st = {cx, cy, ok}: float camera centre (world). Eases toward (tx, ty) and writes the snapped scroll into st.sx/st.sy
// for a camera of w x h screen px at `zoom` (Phaser scroll = centre - screen half-size; screen = o + (x - scroll - o) * zoom).
export function followStep(st, tx, ty, dt, zoom, w, h) {
  if (!(Number.isFinite(tx) && Number.isFinite(ty))) return st;
  if (!st.ok || !Number.isFinite(st.cx) || !Number.isFinite(st.cy) || Math.abs(tx - st.cx) + Math.abs(ty - st.cy) > FOLLOW_SNAP) { st.cx = tx; st.cy = ty; st.ok = true; }
  else { const k = followK(dt); st.cx += (tx - st.cx) * k; st.cy += (ty - st.cy) * k; }
  const z = zoom > 0 ? zoom : 1;
  st.sx = Math.round(st.cx * z) / z - w * 0.5;
  st.sy = Math.round(st.cy * z) / z - h * 0.5;
  return st;
}
