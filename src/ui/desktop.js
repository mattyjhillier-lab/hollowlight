// DESKTOP (docs/design/desktop-v1.md, LOCKED 2026-10-30). Render/UI only, no sim.
// A1: on ultrawide windows the HUD and menus keep inside a centred ~2.1:1 safe frame; the world still fills the whole width.
//     `--fx` (px) feeds the shared safe-area frame (--sa-l/--sa-r in phone.css), so every screen that already respects the insets follows.
// Phones (html.phone) never get it: they keep their own notch insets and layouts.
import { uiScaleFor, cleanUiScale, UI_SCALE_DEFAULT } from './uiscale.js';
export const SAFE_RATIO = 2.1;

/** Pure: extra left/right inset (px) that centres a SAFE_RATIO:1 frame in a w x h window; 0 for anything narrower (16:9, 16:10, portrait) and for bad input. */
export function safeFrameInset(w, h, ratio = SAFE_RATIO) {
  if (!Number.isFinite(w) || !Number.isFinite(h) || !(w > 0) || !(h > 0)) return 0;
  return Math.max(0, Math.round((w - h * ratio) / 2));
}

/** Sets --uik (the desktop UI scale, src/ui/uiscale.js) and --fx (ultrawide safe frame) on <html>. The safe frame is measured in the zoomed window
 *  (w/k x h/k), because the HUD and menus that read --sa-l/--sa-r live inside the zoomed #ui. Returns { apply, setPref }. */
export function initDesktop(win = window, doc = document) {
  const root = doc.documentElement;
  let pref = UI_SCALE_DEFAULT;
  const apply = () => {
    const phone = root.classList.contains('phone');
    const w = win.innerWidth, h = win.innerHeight;
    const k = uiScaleFor({ w, h, pref, phone });
    root.style.setProperty('--uik', String(k));
    root.style.setProperty('--fx', (phone ? 0 : safeFrameInset(w / k, h / k)) + 'px');
  };
  apply();
  win.addEventListener('resize', apply);
  if (win.MutationObserver) new win.MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['class'] });
  return { apply, setPref(v) { pref = cleanUiScale(v); apply(); } };
}
