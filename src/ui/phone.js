// PHONE-A (docs/design/phone-layout-v1.md, Option A). Render/UI only, no sim.
// 1) `html.phone` marks a phone-shaped screen: a touch-first device, or a short, wide window. CSS (phone.css) keys the full-bleed stage,
//    the safe-area frame and the phone menu layouts off it. Desktop windows never get it, so desktop stays exactly as it was.
// 2) Scroll cues: any scrollable panel inside a menu overlay gets data-sc="top|bottom|both" while more content lies beyond its edge (edge fade in phone.css).
export const PHONE_QUERY = '(pointer: coarse), (max-height: 520px) and (min-aspect-ratio: 19/10)';

/** Pure: is this a phone-shaped screen? (used by tests and the fit audit; the browser path uses matchMedia with PHONE_QUERY) */
export function isPhoneShape({ w, h, coarse }) {
  if (!(w > 0) || !(h > 0)) return false;
  return !!coarse || (h <= 520 && w / h >= 1.9);
}

/** C0 pure: stage height in px for the installed app, or 0 to leave it to CSS. The screen's own short side is the true landscape height, so take the largest honest figure. */
export function standaloneHeight({ standalone, innerH, vvH, screenW, screenH, landscape }) {
  if (!standalone) return 0;
  const sh = landscape ? Math.min(screenW || 0, screenH || 0) : Math.max(screenW || 0, screenH || 0);
  const h = Math.max(innerH || 0, vvH || 0, sh);
  return h > 0 && h < 4000 ? Math.round(h) : 0;
}

/** Pure: which edge cues does a scroller need? scrollTop/clientHeight/scrollHeight in px. */
export function cueFor(scrollTop, clientHeight, scrollHeight, tol = 2) {
  if (!(scrollHeight > clientHeight + tol)) return '';
  const top = scrollTop > tol, bottom = scrollTop + clientHeight < scrollHeight - tol;
  return top && bottom ? 'both' : top ? 'top' : bottom ? 'bottom' : '';
}

export function initPhone(win = window, doc = document) {
  if (!win.matchMedia) return;
  const root = doc.documentElement;
  const mq = win.matchMedia(PHONE_QUERY);
  // C0: Home Screen (standalone) app. iOS can report a layout viewport shorter than the screen (home-indicator strip), which left a dead band under the Home screen.
  const vv = win.visualViewport, nav = win.navigator || {};
  const isStandalone = () => !!(nav.standalone || win.matchMedia('(display-mode: standalone)').matches || win.matchMedia('(display-mode: fullscreen)').matches);
  const size = () => {
    const sa = isStandalone();
    root.classList.toggle('standalone', sa);
    const sc = win.screen || {};
    const h = standaloneHeight({ standalone: sa && win.matchMedia('(pointer: coarse)').matches, innerH: win.innerHeight, vvH: vv ? vv.height : 0, screenW: sc.width, screenH: sc.height, landscape: win.innerWidth > win.innerHeight });
    if (h) root.style.setProperty('--app-h', h + 'px'); else root.style.removeProperty('--app-h');
  };
  const apply = () => { root.classList.toggle('phone', mq.matches); size(); };
  apply();
  win.addEventListener('resize', size); win.addEventListener('orientationchange', () => win.setTimeout(size, 250));
  if (vv && vv.addEventListener) vv.addEventListener('resize', size);
  if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);

  const ui = doc.getElementById('ui');
  if (!ui) return;
  const scan = () => {
    if (!root.classList.contains('phone')) return;
    for (const el of ui.querySelectorAll('.overlay, .overlay *')) {
      const oy = win.getComputedStyle(el).overflowY;
      if (oy !== 'auto' && oy !== 'scroll') { if (el.dataset.sc !== undefined) delete el.dataset.sc; continue; }
      const c = cueFor(el.scrollTop, el.clientHeight, el.scrollHeight);
      if (c) { if (el.dataset.sc !== c) el.dataset.sc = c; } else if (el.dataset.sc !== undefined) delete el.dataset.sc;
    }
  };
  let t = 0;
  const later = () => { if (!root.classList.contains('phone') || t) return; t = win.setTimeout(() => { t = 0; scan(); }, 120); };
  if (win.MutationObserver) new win.MutationObserver(later).observe(ui, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
  ui.addEventListener('scroll', (e) => {
    if (!root.classList.contains('phone') || !e.target || !e.target.dataset) return;
    const el = e.target, c = cueFor(el.scrollTop, el.clientHeight, el.scrollHeight);
    if (c) el.dataset.sc = c; else delete el.dataset.sc;
  }, { capture: true, passive: true });
  win.addEventListener('resize', later);
  later();
}
