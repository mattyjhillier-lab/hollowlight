// CX4 / CX5 celebration cards (docs/mockups/codex/cx-ledger = medium, cx-remember = big). DOM only, createElement + textContent (kit el).
// Plays a short queue out of combat: big first (full screen, ~2.2 s reveal), then up to 3 medium cards (~1.2 s reveal). Any key / tap continues,
// Esc skips all; every card also moves on by itself (big 4.5 s, medium 3.5 s) so nothing ever waits forever. Calm: no sweep, no zoom, no
// particles, 120 ms fades, static cards. Each item is announced once through the overlay's live region. Gold rim on evolution cards only.
import { el, kitRoot } from './kit.js';
import { mk, emblem, EMBLEM_OF } from './hudsvg.js';
import { CEL } from './codexcopy.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
export const HOLD = Object.freeze({ big: 4500, medium: 3500, calm: 3500 });
export const MIN_SHOW_MS = 350; // a key held from the run cannot skip a card the instant it appears

function seal(item) {
  const d = globalThis.document;
  const kind = item.weapon ? EMBLEM_OF[item.weapon] || 'orb' : 'sanctuary';
  return mk(d, 'svg', { viewBox: '-34 -34 68 68', class: 'cel-seal', 'aria-hidden': 'true', focusable: 'false' }, [
    mk(d, 'circle', { r: 31, fill: '#25304a', stroke: item.gold || item.size === 'big' ? '#ffd36b' : '#d8b26a', 'stroke-width': 3 }),
    emblem(d, kind, 40),
  ]);
}

/** items: [{size, kind, title, line, sub, pills, weapon, gold, cue, sr}]; opts: { calm, away, sound(id), onDone(), now }. */
export function buildCelebration(items, { calm = false, away = false, sound = null, onDone = null, now = () => (globalThis.performance ? globalThis.performance.now() : Date.now()), timers = globalThis } = {}) {
  const list = items.filter(Boolean);
  const root = kitRoot({ calm });
  root.classList.add('cel');
  const live = el('p', 'cel-sr', '', { role: 'status', 'aria-live': 'polite' });
  const stage = el('div', 'cel-stage');
  const footBox = el('div', 'cel-footbox');
  add(root, stage, footBox, live);
  let i = -1;
  let shownAt = 0;
  let timer = null;
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    if (timer) timers.clearTimeout(timer);
    root.classList.add('is-out');
    if (onDone) onDone();
  }
  function render(it, n) {
    stage.replaceChildren();
    const big = it.size === 'big';
    root.classList.toggle('is-big', big);
    root.classList.toggle('is-med', !big);
    const card = el('div', `cel-card cel-card--${big ? 'big' : 'med'}${it.gold ? ' is-gold' : ''}`, null, { role: 'group', 'aria-label': it.title });
    card.style.setProperty('--cel-col', it.color || '#ffd27a');
    if (big) {
      add(card, el('div', 'cel-kick', away ? `${CEL.away} · ${CEL.remembers}` : CEL.remembers), seal(it), el('h2', 'cel-title', it.title), it.line ? el('p', 'cel-line', `“${it.line}”`) : null);
      if (it.pills && it.pills.length) { const row = el('div', 'cel-pills'); for (const p of it.pills) add(row, el('span', 'cel-pill', p)); add(card, row); }
      add(stage, el('div', 'cel-band', null, { 'aria-hidden': 'true' }), card);
    } else {
      const txt = el('div', 'cel-txt');
      add(txt, el('div', 'cel-kick', CEL.kinds[it.kind] || CEL.remembers), el('h3', 'cel-name', it.title), it.line ? el('p', 'cel-line', `“${it.line}”`) : null, it.sub ? el('p', 'cel-sub', it.sub) : null);
      add(card, seal(it), txt);
      add(stage, card);
    }
    const foot = el('div', 'cel-foot');
    const nx = list[n + 1];
    if (list.length > 1) {
      const dots = el('span', 'cel-dots', null, { 'aria-hidden': 'true' });
      for (let k = 0; k < list.length; k++) add(dots, el('i', k === n ? 'is-on' : null));
      add(foot, dots, el('span', null, nx ? CEL.next(CEL.kinds[nx.kind] || nx.title, n + 1, list.length) : CEL.last(n + 1, list.length)));
    }
    const keys = el('span', 'cel-keys');
    add(foot, keys);
    add(keys, el('span', 'cel-kb', CEL.cont), el('span', null, ` ${CEL.tap}`));
    if (list.length > 1) add(keys, el('span', null, ' · '), el('span', 'cel-kb', 'Esc'), el('span', null, ` ${CEL.skip}`));
    footBox.replaceChildren(foot);
    live.textContent = it.sr || `${CEL.remembers}: ${it.title}`;
    if (it.cue && sound) sound(it.cue);
  }
  function next() {
    if (done) return;
    if (timer) timers.clearTimeout(timer);
    i++;
    if (i >= list.length) { finish(); return; }
    shownAt = now();
    render(list[i], i);
    const hold = calm ? HOLD.calm : list[i].size === 'big' ? HOLD.big : HOLD.medium;
    timer = timers.setTimeout(next, hold);
  }
  function onKey(e) {
    if (done) return false;
    if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Tab' || e.key === 'Shift') return false;
    if (e.preventDefault) e.preventDefault();
    if (e.repeat || now() - shownAt < MIN_SHOW_MS) return true;
    if (e.key === 'Escape') finish(); else next();
    return true;
  }
  root.addEventListener('pointerup', () => { if (!done && now() - shownAt >= MIN_SHOW_MS) next(); });
  return { root, start: () => next(), onKey, finish, isDone: () => done, index: () => i, count: list.length };
}
