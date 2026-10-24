// Crops one frame of a real enemy strip (docs/screenshots/en-atlas) into a box: data-spr="wolf:0" (frame index).
const S = {
  wolf: { src: '../../screenshots/en-atlas/strip-wolf.png', W: 3508, fw: 389.8, x: 40, y: 30, w: 345, h: 235 },
  crow: { src: '../../screenshots/en-atlas/strip-crow.png', W: 2222, fw: 317.4, x: 60, y: 10, w: 215, h: 205 },
  root_crawler: { src: '../../screenshots/en-atlas/strip-root_crawler.png', W: 2708, fw: 386.9, x: 70, y: 50, w: 300, h: 255 },
};
function paint() {
  for (const el of document.querySelectorAll('[data-spr]')) {
    const [k, f] = el.dataset.spr.split(':'); const s = S[k]; const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const sc = Math.min(r.width / s.w, r.height / s.h) * 0.95;
    let c = el.firstElementChild; if (!c || !c.classList.contains('crop')) { c = document.createElement('span'); c.className = 'crop'; el.replaceChildren(c); }
    el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center';
    Object.assign(c.style, { display: 'block', width: `${s.w * sc}px`, height: `${s.h * sc}px`, backgroundImage: `url(${s.src})`, backgroundRepeat: 'no-repeat',
      backgroundSize: `${s.W * sc}px auto`, backgroundPosition: `${-(+f * s.fw + s.x) * sc}px ${-s.y * sc}px`, borderRadius: '8px' });
  }
}
// unknown foe silhouette: a hooded husk shape with only the mask outline (no face: BIBLE rule 5)
const SIL = '<svg viewBox="0 0 100 70" width="100%" height="100%" aria-hidden="true"><ellipse cx="50" cy="64" rx="30" ry="4" fill="rgba(0,0,0,.35)"/><path d="M20 58 C14 40 22 22 40 18 C52 8 72 12 80 26 C90 34 88 52 80 58 Z" fill="#3a4152" stroke="#5d6578" stroke-width="2"/><path d="M58 24 C70 22 80 30 78 40 C72 46 60 44 56 36 Z" fill="none" stroke="#8a93a8" stroke-width="2" stroke-dasharray="3 3"/><text x="40" y="48" font-size="18" fill="#8a93a8" font-family="Georgia">?</text></svg>';
for (const el of document.querySelectorAll('[data-sil]')) el.innerHTML = SIL;
addEventListener('load', paint); addEventListener('resize', paint); setTimeout(paint, 300);
