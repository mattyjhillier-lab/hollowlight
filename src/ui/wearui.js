// EXTRAS v1 'Wear' drawer (character select): pick the flame, trail and hero look a run wears; WARDROBE v2 adds the ring shelf (Ring Keepsake costumes
// with progress arcs) and a live preview of the real hero rig. Lantern Glass kit; createElement + textContent + setAttribute only (never innerHTML).
// Colours come from validated cosmetics.json (#rrggbb). Node-testable with a fake DOM (the canvas stage is skipped when there is no canvas).
import { el, kitRoot, button } from './kit.js';
import { WEAR, wearingLine } from './wearcopy.js';
import { createWearStage, medallion } from '../gfx/wearstage.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, ...kids) => { const e = globalThis.document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v)); for (const c of kids) if (c) e.appendChild(c); return e; };
const HEX = /^#[0-9a-f]{6}$/i;
const col = (v, d) => (typeof v === 'string' && HEX.test(v) ? v : d);
const RUNE = /^[MLQCAZmlqcaz0-9 .-]{1,160}$/;
const calmNow = () => { try { const d = globalThis.document; return !!((d && d.documentElement && d.documentElement.classList && d.documentElement.classList.contains('reduced-motion')) || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)); } catch { return false; } };

/** A ring rune badge (stroke path from validated data). */
function rune(d, cls) {
  const s = sv('svg', { viewBox: '-10 -10 20 20', class: cls || 'wr-rune', 'aria-hidden': 'true', focusable: 'false' });
  if (typeof d === 'string' && RUNE.test(d)) s.appendChild(sv('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  return s;
}

/**
 * opts: { view (wearView), viewFor(sel) -> view, onWear(sel), onBack(), calm }.
 * Returns { root, tabs, back, wear, grid, shelf, onKey(e), current(), tab(), focusFirst(), destroy() }.
 */
export function buildWear({ view, viewFor, onWear, onBack, calm } = {}) {
  let v = view;
  let tab = 'flame';
  let peek = v.costume && (v.costume.sel || (v.costume.items[0] && v.costume.items[0].id)) || null; // the shelf's highlighted costume (try-on; locked ones are previews only)
  const reduced = calm !== undefined ? !!calm : calmNow();
  const root = kitRoot();
  root.classList.add('u3-wrap', 'wr-screen');
  const tid = `wr-t${Math.random().toString(36).slice(2, 7)}`;
  const hd = add(el('header', 'wr-hd'), el('h1', 'wr-title ty-title', WEAR.title, { id: tid }), el('p', 'wr-sub ty-whisper', v.hero.name ? `${v.hero.name} · ${WEAR.line}` : WEAR.line));
  const stage = el('section', 'wr-stage lg-frame', null, { 'aria-label': WEAR.wearing });
  const wearing = add(el('p', 'wr-wearing'));
  const side = el('section', 'wr-side');
  const scroll = el('div', 'wr-scroll');
  const costHd = add(el('h3', 'wr-h3'), el('span', null, WEAR.costume), el('small', null, WEAR.costumeSub));
  const shelf = el('div', 'wr-shelf', null, { role: 'radiogroup', 'aria-label': WEAR.costume });
  const detail = el('div', 'wr-detail');
  const costSec = add(el('div', 'wr-costume'), costHd, shelf, detail);
  const tabRow = el('div', 'wr-tabs', null, { role: 'tablist', 'aria-labelledby': tid });
  const grid = el('div', 'wr-grid', null, { role: 'radiogroup' });
  const msg = el('p', 'wr-msg', '', { role: 'status', 'aria-live': 'polite' });
  const acts = el('nav', 'wr-acts', null, { 'aria-label': WEAR.title });
  const back = button({ label: WEAR.back, hint: 'Esc', variant: 'secondary', onClick: () => { if (onBack) onBack(); } });
  const wear = button({ label: WEAR.wear, hint: 'Enter', variant: 'primary', onClick: () => { if (onWear) onWear({ ...v.sel }); msg.textContent = WEAR.saved; } });
  add(acts, el('p', 'wr-note', WEAR.note), back, wear);
  if (v.costume && v.costume.items.length) add(scroll, costSec);
  add(scroll, tabRow, grid, msg);
  add(side, scroll, acts);
  add(root, hd, stage, side);
  const tabBtns = [];
  let st = null; // the live canvas stage (browser only; created below once the helpers exist)

  const cItem = (id) => (v.costume ? v.costume.items.find((x) => x.id === id) : null);
  const flameOf = () => v.items.flame.find((x) => x.id === v.sel.flame) || v.items.flame[0];
  const trailOf = () => v.items.trail.find((x) => x.id === v.sel.trail) || v.items.trail[0];
  function shown() { return peek ? cItem(peek) : null; } // the costume on the stage: the highlighted one (earned = try-on, locked = peek); none highlighted = plain
  function stageState() {
    const c = shown(), f = flameOf(), t = trailOf();
    return {
      hero: v.hero.id, cost: c ? { ...c.pal, motifs: c.motifs, rise: c.rise } : null, flame: { glow: col(f && f.color, '#ffcf7a'), core: col(f && f.core, '#fff1c8') },
      trail: { style: t ? t.style || 'thread' : 'thread', color: t ? t.color : null }, calm: reduced, dim: !!c && !c.owned,
    };
  }
  function label() {
    const c = shown(), w = v.costume ? v.costume.sel : null;
    let line = '';
    if (c) line = c.owned ? (w === c.id ? `${WEAR.wearing} ${c.name}` : WEAR.tryOn(c.name)) : WEAR.peeking(c.name);
    wearing.textContent = '';
    add(wearing, el('span', 'wr-k ty-kicker', WEAR.wearing), el('span', null, wearingLine(v)));
    if (c && (!c.owned || w !== c.id)) add(wearing, el('em', 'wr-try', line));
  }

  function drawTabs() {
    tabRow.textContent = ''; tabBtns.length = 0;
    for (const t of v.tabs) {
      const b = el('button', `wr-tab${t.id === tab ? ' is-on' : ''}`, t.label, { type: 'button', role: 'tab', 'aria-selected': t.id === tab ? 'true' : 'false', tabindex: t.id === tab ? '0' : '-1', 'data-id': t.id });
      b.addEventListener('click', () => { tab = t.id; draw(); b.focus && tabRow.querySelector && (tabRow.querySelector(`[data-id="${t.id}"]`) || b).focus(); });
      b.addEventListener('keydown', (e) => {
        const ids = v.tabs.map((x) => x.id), i = ids.indexOf(tab);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); tab = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]; draw(); const nb = tabRow.querySelector && tabRow.querySelector(`[data-id="${tab}"]`); if (nb) nb.focus(); }
      });
      add(tabRow, b); tabBtns.push(b);
    }
  }

  function pick(id, focus) {
    const it = v.items[tab].find((x) => x.id === id);
    if (!it || !it.owned) return;
    v = viewFor ? viewFor({ ...v.sel, [tab]: id }) : { ...v, sel: { ...v.sel, [tab]: id } };
    msg.textContent = '';
    draw();
    if (focus) { const n = grid.querySelector && grid.querySelector(`[data-id="${id}"]`); if (n) n.focus(); }
  }

  function drawGrid() {
    grid.textContent = '';
    grid.setAttribute('aria-label', (v.tabs.find((t) => t.id === tab) || { label: '' }).label);
    const list = v.items[tab];
    for (const it of list) {
      const sel = it.id === v.sel[tab];
      const c = el('div', `wr-item${sel ? ' is-sel' : ''}${it.owned ? '' : ' is-locked'}${it.worn ? ' is-worn' : ''}`, null, { role: 'radio', 'data-id': it.id, 'aria-checked': sel ? 'true' : 'false', tabindex: sel ? '0' : '-1', 'aria-label': `${it.name}. ${it.line}` });
      if (!it.owned) c.setAttribute('aria-disabled', 'true');
      const sw = el('span', `wr-sw wr-sw--${it.style || tab}`, null, { 'aria-hidden': 'true' });
      sw.style.setProperty('--sw', col(it.color, '#ffcf7a'));
      sw.style.setProperty('--sw2', col(it.core || it.charm, col(it.color, '#ffcf7a')));
      const txt = add(el('span', 'wr-txt'), el('span', 'wr-name', it.name), el('span', 'wr-line', `${it.worn ? '✓ ' : ''}${it.line}`));
      if (!it.owned && Number.isFinite(it.frac) && it.frac !== null) { const bar = el('span', 'wr-bar', null, { 'aria-hidden': 'true' }); const i = el('i'); i.style.width = `${Math.round(Math.max(0, Math.min(1, it.frac)) * 100)}%`; add(txt, add(bar, i)); }
      add(c, sw, txt);
      c.addEventListener('click', () => pick(it.id, false));
      c.addEventListener('keydown', (e) => {
        const own = list.filter((x) => x.owned).map((x) => x.id), k = own.indexOf(v.sel[tab]);
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) && own.length) { e.preventDefault(); e.stopPropagation(); const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1; pick(own[(Math.max(0, k) + d + own.length) % own.length], true); }
        else if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); pick(it.id, true); }
      });
      add(grid, c);
    }
  }

  // ---- the ring shelf: six round medallions (hero portrait, progress arc, ring rune), then the detail card for the highlighted one
  function choose(id, focus) {
    if (!cItem(id)) return;
    peek = id; msg.textContent = '';
    if (st && st.bump) st.bump();
    draw();
    if (focus) { const n = shelf.querySelector && shelf.querySelector(`[data-id="${id}"]`); if (n) n.focus(); }
  }
  function commitCostume(id) { // wear / take off: one save write through onWear (everything else in the drawer stays as chosen)
    v = viewFor ? viewFor({ ...v.sel, costume: id }) : { ...v, sel: { ...v.sel, costume: id }, costume: { ...v.costume, sel: id } };
    if (onWear) onWear({ ...v.sel });
    msg.textContent = id ? WEAR.saved : '';
    if (st && st.bump) st.bump();
    draw();
  }
  function drawShelf() {
    shelf.textContent = '';
    if (!v.costume) return;
    const flame = flameOf();
    for (const it of v.costume.items) {
      const on = it.id === peek;
      const b = el('div', `wr-med${on ? ' is-sel' : ''}${it.owned ? ' is-got' : ' is-lock'}${it.worn ? ' is-worn' : ''}${it.dawn ? ' is-dawn' : ''}`, null, {
        role: 'radio', 'data-id': it.id, 'aria-checked': on ? 'true' : 'false', tabindex: on ? '0' : '-1',
        'aria-label': `${it.name}, ${it.owned ? (it.worn ? 'worn' : 'earned') : 'locked'}. ${it.need}`,
      });
      const arc = el('span', 'wr-arc', null, { 'aria-hidden': 'true' });
      arc.style.setProperty('--f', `${Math.round(Math.max(0, Math.min(1, it.frac)) * 360)}deg`);
      const disc = el('span', 'wr-disc', null, { 'aria-hidden': 'true' });
      const pc = medallion(v.hero.id, it, 70, { glow: col(flame && flame.color, '#ffcf7a'), core: col(flame && flame.core, '#fff1c8') });
      if (pc) { pc.className = 'wr-mp'; disc.appendChild(pc); }
      add(b, arc, disc, rune(it.rune, 'wr-rune wr-badge'));
      if (!it.owned) add(b, el('span', 'wr-lk', `${it.n}/${it.t}`, { 'aria-hidden': 'true' }));
      if (it.worn) add(b, el('span', 'wr-wick', null, { 'aria-hidden': 'true' }));
      add(b, el('span', 'wr-mn', it.dawn ? 'Dawn' : it.ringName, { 'aria-hidden': 'true' }));
      b.addEventListener('click', () => choose(it.id, false));
      b.addEventListener('keydown', (e) => {
        const ids = v.costume.items.map((x) => x.id), i = ids.indexOf(peek);
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1; choose(ids[(Math.max(0, i) + d + ids.length) % ids.length], true); }
        else if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); choose(it.id, true); }
      });
      add(shelf, b);
    }
    drawDetail();
  }
  function drawDetail() {
    detail.textContent = '';
    const it = peek ? cItem(peek) : null;
    if (!it) return;
    const head = add(el('div', 'wr-dh'), el('span', 'wr-dname', it.name), el('span', 'wr-dsub ty-kicker', it.kicker));
    add(detail, head, el('p', 'wr-dline', it.line));
    const sw = el('div', 'wr-dsw', null, { 'aria-hidden': 'true' });
    for (const k of ['base', 'second', 'mantle', 'accent', 'trim', 'glow']) { const i = el('i'); i.style.background = col(it.pal[k], '#888888'); sw.appendChild(i); }
    add(detail, sw);
    if (!it.owned) { const pr = el('div', 'wr-prog', null, { 'aria-hidden': 'true' }); const bar = el('i'); bar.style.width = `${Math.round(it.frac * 100)}%`; add(detail, add(pr, bar)); }
    add(detail, el('p', `wr-need${it.owned ? ' is-ok' : ''}`, it.need));
    const row = el('div', 'wr-drow');
    const heroName = v.hero.name || '';
    if (it.owned) {
      const worn = v.costume.sel === it.id;
      const b = el('button', `wr-btn${worn ? '' : ' is-primary'}`, worn ? WEAR.takeOff : WEAR.wearOn(heroName), { type: 'button', 'data-act': worn ? 'off' : 'wear' });
      b.addEventListener('click', () => commitCostume(worn ? null : it.id));
      add(row, b);
    } else {
      const b = el('button', 'wr-btn', WEAR.notYet, { type: 'button', disabled: 'true', 'aria-disabled': 'true' });
      b.disabled = true;
      add(row, b, el('span', 'wr-peek ty-kicker', WEAR.previewOnly));
    }
    add(detail, row);
  }

  function draw() {
    const keep = scroll.scrollTop;
    drawShelf(); drawTabs(); drawGrid(); label();
    if (keep) scroll.scrollTop = keep; // a redraw never jumps the drawer
    if (st) st.set(stageState());
  }
  try { st = createWearStage(stage, stageState()); } catch { st = null; } // canvas first, then the caption on top of it
  add(stage, wearing);
  draw();

  const onKey = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = globalThis.document && globalThis.document.activeElement;
    const onBtn = !!(a && a.closest && (a.closest('.lg-btn') || a.closest('.wr-btn')));
    if (e.key === 'Escape') { e.preventDefault(); if (onBack) onBack(); return true; }
    if (e.key === 'Enter' && !onBtn) { e.preventDefault(); wear.click(); return true; }
    if (/^[1-3]$/.test(e.key) && v.tabs[Number(e.key) - 1]) { e.preventDefault(); tab = v.tabs[Number(e.key) - 1].id; draw(); const nb = tabRow.querySelector && tabRow.querySelector(`[data-id="${tab}"]`); if (nb) nb.focus(); return true; }
    return false;
  };
  return {
    root, tabs: tabBtns, back, wear, grid, shelf, onKey, current: () => ({ ...v.sel }), tab: () => tab, peek: () => peek,
    focusFirst: () => { const n = grid.querySelector && grid.querySelector('[aria-checked="true"]'); if (n) n.focus({ preventScroll: true }); scroll.scrollTop = 0; },
    destroy: () => { if (st && st.destroy) st.destroy(); st = null; },
  };
}
