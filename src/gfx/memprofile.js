// FIX4d conservative low-memory profile. iOS Safari (iPhone / iPad, incl. iPadOS posing as a Mac) kills the page when canvas + WebGL memory runs past a few hundred MB,
// and so can any device reporting <= 4 GB. On those the render scale is capped, bloom stays off and the start-up bake skips optional work. Desktop is untouched.
// Render-side only; reads navigator, never the sim or a save.
export function isLowMem(nav = typeof navigator !== 'undefined' ? navigator : null) {
  if (!nav) return false;
  const ua = String(nav.userAgent || '');
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  if (/Macintosh/.test(ua) && Number(nav.maxTouchPoints) > 1) return true; // iPadOS
  const m = Number(nav.deviceMemory);
  return m > 0 && m <= 4;
}
export const LOWMEM = isLowMem();
export const LOWMEM_DPR = 1.5; // render-scale cap (full-frame render targets are w*h*4 bytes each, ~8 of them)
