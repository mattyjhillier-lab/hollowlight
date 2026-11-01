// FIX3 the full-screen new-feature card (docs/LOCKED.md 'PLAYTEST PICKS'). createElement + textContent only (kit el). One card at a time;
// Enter / Space / Esc / a tap on the card or the big button continues. A short input lock stops a held key or the tap that caused the pause from skipping it.
import { el, kitRoot, panel, button } from './kit.js';
import { mk } from './hudsvg.js';
import { INTRO } from './introcopy.js';

export const LOCK_MS = 400;
const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const GOLD = '#ffc766', LINE = '#7a4a12', INK = '#27324a';
const path = (d, a) => mk(globalThis.document, 'path', { d, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...a });

// small painted glyphs on a 64x64 board (warm gold on a dark disc; no text inside)
function glyph(id) {
  const d = globalThis.document;
  const K = [mk(d, 'circle', { cx: 32, cy: 32, r: 29, fill: '#1c2335', stroke: GOLD, 'stroke-width': 2.5 })];
  const flame = (x, y, s) => path(`M${x} ${y - 10 * s} C${x - 5 * s} ${y - 3 * s} ${x - 6 * s} ${y + 2 * s} ${x} ${y + 5 * s} C${x + 6 * s} ${y + 2 * s} ${x + 5 * s} ${y - 3 * s} ${x} ${y - 10 * s}Z`, { fill: GOLD, stroke: LINE, 'stroke-width': 1.5 });
  if (id === 'lamp') K.push(path('M32 52 V28 M25 52 H39', { fill: 'none', stroke: '#c9b79a', 'stroke-width': 3 }), path('M24 28 H40 L38 20 H26Z', { fill: '#3b4660', stroke: '#c9b79a', 'stroke-width': 2 }), flame(32, 25, 0.8));
  else if (id === 'road') K.push(path('M16 50 Q32 34 48 16', { fill: 'none', stroke: '#5d6578', 'stroke-width': 3, 'stroke-dasharray': '2 6' }), flame(18, 46, 0.7), flame(32, 34, 0.7), flame(46, 22, 0.7));
  else if (id === 'knot') K.push(path('M16 46 C22 28 30 44 34 30 C38 16 46 30 48 20 M20 50 C28 40 36 48 46 36', { fill: 'none', stroke: '#8a5a8e', 'stroke-width': 4 }), mk(d, 'circle', { cx: 32, cy: 33, r: 5, fill: '#2a1633', stroke: '#c58acb', 'stroke-width': 2 }));
  else if (id === 'blessing') K.push(path('M32 12 L37 26 L52 27 L40 36 L44 51 L32 42 L20 51 L24 36 L12 27 L27 26Z', { fill: GOLD, stroke: LINE, 'stroke-width': 2 }));
  else if (id === 'evolution') K.push(path('M32 14 L44 30 H36 V44 H28 V30 H20Z', { fill: GOLD, stroke: LINE, 'stroke-width': 2 }), path('M22 52 H42', { stroke: GOLD, 'stroke-width': 3 }));
  else if (id === 'shard') K.push(path('M32 12 L46 28 L32 52 L18 28Z', { fill: '#9fd8ff', stroke: INK, 'stroke-width': 2 }), path('M18 28 H46 M32 12 V52', { fill: 'none', stroke: INK, 'stroke-width': 1.4 }));
  else K.push(mk(d, 'circle', { cx: 32, cy: 32, r: 15, fill: 'none', stroke: GOLD, 'stroke-width': 3, 'stroke-dasharray': '4 5' }), flame(32, 36, 1.1));
  return mk(d, 'svg', { viewBox: '0 0 64 64', class: 'fx3-glyph', 'aria-hidden': 'true', focusable: 'false' }, K);
}

/** card: cardFor(). pos: { n, total } for the Almanac replay (null in a run). onDone(): called once. calm: Calm look (no motion). */
export function buildIntro({ card, pos = null, calm = false, onDone } = {}) {
  const root = kitRoot({ calm });
  root.classList.add('fx3');
  root.setAttribute('role', 'alertdialog');
  root.setAttribute('aria-modal', 'true');
  let done = false;
  const born = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const shownAt = born();
  const finish = () => { if (done) return; done = true; if (onDone) onDone(); };
  const go = () => { if (born() - shownAt >= LOCK_MS) finish(); };
  const lines = el('div', 'fx3-lines');
  for (const t of card.lines) add(lines, el('p', 'fx3-line', t));
  const btn = button({ label: INTRO.gotIt, hint: INTRO.hint, variant: 'primary', onClick: go });
  btn.classList.add('fx3-btn');
  const body = add(el('div', 'fx3-body'), glyph(card.glyph), lines, btn);
  const p = panel({ kicker: pos ? INTRO.replay(pos.n, pos.total) : null, title: card.title, body: [body], label: card.title });
  p.classList.add('fx3-panel');
  root.setAttribute('aria-label', card.title);
  add(root, p);
  root.addEventListener('pointerup', (e) => { if (e.target === btn || btn.contains(e.target)) return; go(); });
  // capture-phase key trap: nothing underneath (level-up picks, pause, abilities) sees a key while the card is up
  const onKey = (e) => {
    if (done) return;
    if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Tab' || e.key === 'Shift') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar' || e.key === 'Escape') go();
  };
  globalThis.addEventListener('keydown', onKey, true);
  globalThis.addEventListener('keyup', onKey, true);
  return { root, btn, finish, isDone: () => done, destroy: () => { globalThis.removeEventListener('keydown', onKey, true); globalThis.removeEventListener('keyup', onKey, true); }, focus: () => btn.focus({ preventScroll: true }) };
}
