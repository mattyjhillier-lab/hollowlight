// DESKTOP D1 (docs/design/desktop-v1.md B1): the desktop UI scale. Render/UI only, no sim.
// The whole #ui layer is zoomed by --uik (desktop.css), so menus, cards and the HUD grow with the window and read at a desktop distance.
// Settings > Picture > "Menu size": Auto follows the window height (900 px tall = 1x, up to 1.5x), or a fixed 1x / 1.25x / 1.5x.
// Safe by construction: phones and touch-first screens always get 1; the virtual window the layouts see never drops below 960x600 CSS px
// (the size they are built and audited for), so a big scale on a small window quietly gives a smaller scale instead of clipped menus.
export const UI_SCALES = Object.freeze(['auto', '1', '1.25', '1.5']);
export const UI_SCALE_DEFAULT = 'auto';
export const UI_SCALE_MAX = 1.5;
export const MIN_VIRTUAL_W = 960;
export const MIN_VIRTUAL_H = 600;
export const AUTO_REF_H = 900;

/** Whitelist an untrusted stored value. */
export function cleanUiScale(v) { return typeof v === 'string' && UI_SCALES.includes(v) ? v : UI_SCALE_DEFAULT; }

/** Pure: the zoom factor (1 .. 1.5) for a w x h window. phone: touch-first / short wide screens keep 1. Bad input gives 1. */
export function uiScaleFor({ w, h, pref = UI_SCALE_DEFAULT, phone = false } = {}) {
  if (phone || !Number.isFinite(w) || !Number.isFinite(h) || !(w > 0) || !(h > 0)) return 1;
  const p = cleanUiScale(pref);
  const want = p === 'auto' ? h / AUTO_REF_H : Number(p);
  const k = Math.min(want, UI_SCALE_MAX, h / MIN_VIRTUAL_H, w / MIN_VIRTUAL_W);
  return k > 1.001 ? Math.floor(k * 1000) / 1000 : 1;
}

export const UI_SCALE_COPY = Object.freeze({
  label: 'Menu size',
  help: 'Desktop only. Auto grows menus and the HUD on big windows',
  opts: [['auto', 'Auto'], ['1', 'Normal'], ['1.25', 'Large'], ['1.5', 'Largest']],
});
