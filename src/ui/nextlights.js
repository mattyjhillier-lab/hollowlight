// Q5b Next lights: the ONE goal list, drawn on results / death ('what moved') and, read-only, on pause (the nearest unlocks).
// Input = the plain object from src/meta/moved.js (re-validated here with cleanMoved). createElement + textContent only; no innerHTML, no data in attributes
// except an aria-label built from clipped text. Calm motion: no pulse, no bar sweep (bars sit at their final width).
import { el } from './kit.js';
import { cleanMoved, movedCount } from '../meta/moved.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const pct = (f) => `${Math.round(Math.max(0, Math.min(1, f)) * 100)}%`;
export const NL = Object.freeze({
  title: 'Next lights', moved: 'What moved', nearest: 'Closest to waking', none: 'Nothing new yet. Every run moves a lantern closer.',
  kind: { lit: 'Lit', unlocked: 'Wakes now', afford: 'You can light it' },
});

/**
 * moved: whatMoved() output (or null); calm: reduced motion; readOnly: pause (nearest only, nothing to fly to).
 * Returns { root, ids (moved lantern ids, for the camera pulse), count, play() }. play() runs the bar sweep once (call after the screen shows).
 */
export function buildNextLights({ moved = null, calm = false, readOnly = false } = {}) {
  const m = cleanMoved(moved);
  const root = el('section', `nl${readOnly ? ' is-ro' : ''}${calm ? ' is-calm' : ''}`, null, { 'aria-label': NL.title });
  const head = el('div', 'nl__head');
  add(head, el('h3', 'nl__title ty-label', NL.title));
  if (!readOnly && m.chips.length) { const c = el('div', 'nl__chips'); for (const x of m.chips) add(c, el('span', 'nl__chip', x.t)); add(head, c); }
  add(root, head);
  const fills = [];
  if (!readOnly && m.tiles.length) {
    const row = el('ul', 'nl__tiles', null, { 'aria-label': NL.moved });
    const SHOW = 3; // a one-screen results card: three chips, the rest as '+N more' (the tree rings all of them on Continue)
    for (const t of m.tiles.slice(0, SHOW)) {
      const li = el('li', `nl__tile is-${t.kind}${calm ? '' : ' is-pulse'}`);
      add(li, el('b', null, t.name), el('span', null, NL.kind[t.kind] || ''));
      add(row, li);
    }
    if (m.tiles.length > SHOW) add(row, el('li', 'nl__more', `+${m.tiles.length - SHOW} more`));
    add(root, row);
  }
  const ROWS = 3; // a one-screen card: at most three progress rows (moved bars first, then the closest unlocks)
  const barRows = readOnly ? [] : m.bars.slice(0, 2), nearRows = m.nearest.slice(0, Math.max(0, ROWS - barRows.length));
  if (barRows.length) {
    const ul = el('ul', 'nl__bars', null, { 'aria-label': NL.moved });
    for (const b of barRows) {
      const li = el('li', 'nl__bar');
      const bar = el('span', 'nl__track', null, { role: 'img', 'aria-label': `${b.name}: ${pct(b.frac1)}` });
      const fill = el('i'); fill.style.width = pct(calm ? b.frac1 : b.frac0); add(bar, fill);
      fills.push([fill, b.frac1]);
      add(li, el('b', null, b.name), el('span', 'nl__text', b.text), bar);
      add(ul, li);
    }
    add(root, ul);
  }
  if (nearRows.length) {
    const ul = el('ul', 'nl__near', null, { 'aria-label': NL.nearest });
    for (const n of nearRows) {
      const li = el('li', `nl__row${n.gate ? ' is-gate' : ''}`);
      const bar = el('span', 'nl__track', null, { role: 'img', 'aria-label': `${n.name}: ${pct(n.frac)}` });
      add(bar, (() => { const i = el('i'); i.style.width = pct(n.frac); return i; })());
      add(li, el('b', null, n.name), el('span', 'nl__text', n.text), bar);
      add(ul, li);
    }
    add(root, ul);
  }
  if (!m.tiles.length && !m.bars.length && !m.nearest.length) add(root, el('p', 'nl__none', NL.none));
  return {
    root, ids: [...m.tiles.map((t) => t.id), ...m.bars.map((b) => b.id)], count: movedCount(m),
    play() { if (calm) return; const raf = globalThis.requestAnimationFrame || ((f) => setTimeout(f, 16)); raf(() => raf(() => { for (const [f, w] of fills) f.style.width = pct(w); })); },
  };
}
