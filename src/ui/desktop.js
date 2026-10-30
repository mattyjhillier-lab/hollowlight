// DESKTOP (docs/design/desktop-v1.md, LOCKED 2026-10-30). Render/UI only, no sim.
// A1: on ultrawide windows the HUD and menus keep inside a centred ~2.1:1 safe frame; the world still fills the whole width.
//     `--fx` (px) feeds the shared safe-area frame (--sa-l/--sa-r in phone.css), so every screen that already respects the insets follows.
// Phones (html.phone) never get it: they keep their own notch insets and layouts.
export const SAFE_RATIO = 2.1;

/** Pure: extra left/right inset (px) that centres a SAFE_RATIO:1 frame in a w x h window; 0 for anything narrower (16:9, 16:10, portrait) and for bad input. */
export function safeFrameInset(w, h, ratio = SAFE_RATIO) {
  if (!Number.isFinite(w) || !Number.isFinite(h) || !(w > 0) || !(h > 0)) return 0;
  return Math.max(0, Math.round((w - h * ratio) / 2));
}

export function initDesktop(win = window, doc = document) {
  const root = doc.documentElement;
  const apply = () => {
    const fx = root.classList.contains('phone') ? 0 : safeFrameInset(win.innerWidth, win.innerHeight);
    root.style.setProperty('--fx', fx + 'px');
  };
  apply();
  win.addEventListener('resize', apply);
  if (win.MutationObserver) new win.MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['class'] });
  return apply;
}
