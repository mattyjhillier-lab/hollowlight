// EXTRAS v1 'Wear' drawer (character select): pick the flame, trail and hero look a run wears. Lantern Glass kit; createElement +
// textContent + setAttribute only (never innerHTML). Colours come from validated cosmetics.json (#rrggbb). Node-testable with a fake DOM.
import { el, kitRoot, button } from './kit.js';
import { WEAR, wearingLine } from './wearcopy.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, ...kids) => { const e = globalThis.document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v)); for (const c of kids) if (c) e.appendChild(c); return e; };
const HEX = /^#[0-9a-f]{6}$/i;
const col = (v, d) => (typeof v === 'string' && HEX.test(v) ? v : d);
let sid = 0;

/** Live preview: lantern, flame, light pool, the lantern trail and the hero's wisp (+ charm). Decorative (the 'Wearing' line says it in words). */
function preview(v) {
  const g = ++sid;
  const f = v.items.flame.find((x) => x.id === v.sel.flame) || v.items.flame[0];
  const t = v.items.trail.find((x) => x.id === v.sel.trail) || v.items.trail[0];
  const L = v.items.look.find((x) => x.id === v.sel.look) || null;
  const glow = col(f && f.color, '#ffcf7a'), core = col(f && f.core, '#fff1c8');
  const tc = col(t && t.color, glow);
  const kids = [
    sv('defs', {},
      sv('radialGradient', { id: `wr-f${g}` }, sv('stop', { offset: 0, 'stop-color': core }), sv('stop', { offset: 0.55, 'stop-color': glow }), sv('stop', { offset: 1, 'stop-color': glow, 'stop-opacity': 0 })),
      sv('radialGradient', { id: `wr-p${g}` }, sv('stop', { offset: 0, 'stop-color': glow, 'stop-opacity': 0.5 }), sv('stop', { offset: 1, 'stop-color': glow, 'stop-opacity': 0 }))),
    sv('ellipse', { cx: 200, cy: 262, rx: 150, ry: 46, fill: `url(#wr-p${g})` }),
  ];
  if (L) kids.push(sv('path', { d: 'M196 120 C150 112 110 150 64 132', fill: 'none', stroke: col(L.color, '#bff3e6'), 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }));
  if (!t || t.style === 'thread') kids.push(sv('path', { d: 'M196 196 C150 214 110 190 40 214', fill: 'none', stroke: tc, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.75 }));
  else for (let i = 0; i < 7; i++) {
    const x = 180 - i * 22, y = 200 + Math.sin(i * 1.3) * 10 + (t.style === 'motes' ? -i * 4 : t.style === 'petal' ? i * 3 : 0);
    kids.push(t.style === 'petal' ? sv('ellipse', { cx: x, cy: y, rx: 5, ry: 3, transform: `rotate(${i * 37} ${x} ${y})`, fill: tc, opacity: 0.85 - i * 0.09 }) : sv('circle', { cx: x, cy: y, r: t.style === 'dots' ? 4 : 3, fill: tc, opacity: 0.9 - i * 0.1 }));
  }
  kids.push(
    sv('line', { x1: 200, y1: 92, x2: 200, y2: 128, stroke: '#9c7a3c', 'stroke-width': 5 }),
    sv('path', { d: 'M174 128 H226 L218 142 H182 Z', fill: '#c79a4c', stroke: '#7a5a28', 'stroke-width': 2 }),
    sv('rect', { x: 180, y: 142, width: 40, height: 58, rx: 12, fill: '#1b2236', stroke: '#c79a4c', 'stroke-width': 4 }),
    sv('circle', { cx: 200, cy: 172, r: 22, fill: `url(#wr-f${g})` }),
    sv('path', { d: 'M174 214 H226 L218 200 H182 Z', fill: '#c79a4c', stroke: '#7a5a28', 'stroke-width': 2 }));
  if (L && L.charm) kids.push(sv('circle', { cx: 232, cy: 150, r: 5, fill: col(L.charm, '#ffb84a'), stroke: '#2a1d08', 'stroke-width': 1 }));
  return sv('svg', { viewBox: '0 0 400 320', class: 'wr-art', 'aria-hidden': 'true', focusable: 'false' }, ...kids);
}

/**
 * opts: { view (wearView), viewFor(sel) -> view, onWear(sel), onBack() }.
 * Returns { root, tabs, onKey(e), current(), focusFirst() }.
 */
export function buildWear({ view, viewFor, onWear, onBack } = {}) {
  let v = view;
  let tab = 'flame';
  const root = kitRoot();
  root.classList.add('u3-wrap', 'wr-screen');
  const tid = `wr-t${++sid}`;
  const hd = add(el('header', 'wr-hd'), el('h1', 'wr-title ty-title', WEAR.title, { id: tid }), el('p', 'wr-sub ty-whisper', v.hero.name ? `${v.hero.name} · ${WEAR.line}` : WEAR.line));
  const stage = el('section', 'wr-stage lg-frame', null, { 'aria-label': WEAR.wearing });
  const side = el('section', 'wr-side');
  const tabRow = el('div', 'wr-tabs', null, { role: 'tablist', 'aria-labelledby': tid });
  const grid = el('div', 'wr-grid', null, { role: 'radiogroup' });
  const msg = el('p', 'wr-msg', '', { role: 'status', 'aria-live': 'polite' });
  const acts = el('nav', 'wr-acts', null, { 'aria-label': WEAR.title });
  const back = button({ label: WEAR.back, hint: 'Esc', variant: 'secondary', onClick: () => { if (onBack) onBack(); } });
  const wear = button({ label: WEAR.wear, hint: 'Enter', variant: 'primary', onClick: () => { if (onWear) onWear({ ...v.sel }); msg.textContent = WEAR.saved; } });
  add(acts, el('p', 'wr-note', WEAR.note), back, wear);
  add(side, tabRow, grid, msg, acts);
  add(root, hd, stage, side);
  const tabBtns = [];

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

  function drawStage() {
    stage.textContent = '';
    add(stage, preview(v), add(el('p', 'wr-wearing'), el('span', 'wr-k ty-kicker', WEAR.wearing), el('span', null, wearingLine(v))));
  }

  function draw() { drawTabs(); drawGrid(); drawStage(); }
  draw();

  const onKey = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = globalThis.document && globalThis.document.activeElement;
    const onBtn = !!(a && a.closest && a.closest('.lg-btn'));
    if (e.key === 'Escape') { e.preventDefault(); if (onBack) onBack(); return true; }
    if (e.key === 'Enter' && !onBtn) { e.preventDefault(); wear.click(); return true; }
    if (/^[1-3]$/.test(e.key) && v.tabs[Number(e.key) - 1]) { e.preventDefault(); tab = v.tabs[Number(e.key) - 1].id; draw(); const nb = tabRow.querySelector && tabRow.querySelector(`[data-id="${tab}"]`); if (nb) nb.focus(); return true; }
    return false;
  };
  return { root, tabs: tabBtns, back, wear, grid, onKey, current: () => ({ ...v.sel }), tab: () => tab, focusFirst: () => { const n = grid.querySelector && grid.querySelector('[aria-checked="true"]'); if (n) n.focus(); } };
}
