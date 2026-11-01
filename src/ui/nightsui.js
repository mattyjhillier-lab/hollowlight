// FD4 (= DT7) "Choose your night": map card + three night chips + side card (docs/design/front-door-v1.md option 2A).
// Lantern Glass kit; createElement + textContent + setAttribute only (never innerHTML), so hostile names stay text. Node-testable with a fake DOM.
// The view model comes from nightcopy.mapView(); `viewFor(tierId)` rebuilds it when the player moves between chips.
import { el, kitRoot, button, badge } from './kit.js';
import { buildPurses, tierGlyph, starIcon } from './lanternsui.js';
import { NIGHT, chipSr } from './nightcopy.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, ...kids) => { const e = globalThis.document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v)); for (const c of kids) if (c) e.appendChild(c); return e; };
let sid = 0;
const nid = (p) => `fdm-${p}-${++sid}`;

/** Code-drawn map art (stand-in for painted chapter art): dusk sky, pines, a lantern pool, a low moon. Decorative. */
function forestArt() {
  const g = sid++;
  const sky = `fdm-sk${g}`, pool = `fdm-lp${g}`;
  const kids = [
    sv('defs', {},
      sv('linearGradient', { id: sky, x1: 0, y1: 0, x2: 0, y2: 1 }, sv('stop', { offset: 0, 'stop-color': '#1b2140' }), sv('stop', { offset: 1, 'stop-color': '#4b4a78' })),
      sv('radialGradient', { id: pool, cx: 0.7, cy: 0.86, r: 0.38 }, sv('stop', { offset: 0, 'stop-color': '#ffd38a', 'stop-opacity': 0.6 }), sv('stop', { offset: 1, 'stop-color': '#ffd38a', 'stop-opacity': 0 }))),
    sv('rect', { width: 640, height: 300, fill: `url(#${sky})` }),
  ];
  for (const [x, y] of [[90, 40], [250, 60], [330, 30], [520, 50], [600, 80]]) kids.push(sv('circle', { cx: x, cy: y, r: 2.5, fill: '#cfd6ff', opacity: 0.7 }));
  [40, 120, 210, 300, 380, 470, 560, 620].forEach((x, i) => kids.push(sv('path', { d: `M${x - 42} 300 L${x} ${70 + (i * 37) % 80} L${x + 42} 300z`, fill: '#11162a' })));
  kids.push(sv('rect', { width: 640, height: 300, fill: `url(#${pool})` }), sv('circle', { cx: 448, cy: 262, r: 10, fill: '#fff0c0' }));
  return sv('svg', { viewBox: '0 0 640 300', preserveAspectRatio: 'xMidYMax slice', class: 'fdm-art', 'aria-hidden': 'true', focusable: 'false' }, ...kids);
}

const LOCK = () => sv('svg', { viewBox: '0 0 24 24', class: 'fdm-lock', 'aria-hidden': 'true', focusable: 'false' },
  sv('rect', { x: 5.5, y: 11, width: 13, height: 10, rx: 2, fill: 'currentColor' }), sv('path', { d: 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4 }));
const UNLOCK = () => sv('svg', { viewBox: '0 0 24 24', class: 'fdm-lock is-open', 'aria-hidden': 'true', focusable: 'false' },
  sv('rect', { x: 5.5, y: 11, width: 13, height: 10, rx: 2, fill: 'currentColor' }), sv('path', { d: 'M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4 }));

/**
 * opts: { view (mapView), viewFor(tid) -> view, purses, onBegin(tid), onBack(), onTree(gateId|null), onPick(tid), gentle: { get() -> bool, set(bool) } }.
 * gentle (EXTRAS v1 Gentle Light): a real checkbox on the Twilight side card only (state shown by tick + On/Off word, never colour alone).
 * Returns { root, chips, begin, back, tree, onKey(e), pick(tid), current(), focusSelected() }.
 */
export function buildNightSelect({ view, viewFor, purses = null, onBegin, onBack, onTree, onPick, gentle = null } = {}) {
  let v = view;
  const root = kitRoot();
  root.classList.add('u3-wrap', 'fdm-screen');
  const hid = nid('t');

  // ---- header: title, crumb, chapter thread, purses
  const hd = el('header', 'fdm-hd');
  const crumb = el('p', 'fdm-crumb');
  const thread = el('ol', 'fdm-chs', null, { 'aria-label': NIGHT.chapters });
  add(thread, add(el('li', 'fdm-ch is-on', null, { 'aria-label': `${NIGHT.chapter(v.chapter.n)}: ${v.chapter.name}` }), el('span', null, String(v.chapter.n), { 'aria-hidden': 'true' })));
  for (const f of v.fog) add(thread, el('li', 'fdm-thr', null, { 'aria-hidden': 'true' }), add(el('li', 'fdm-ch', null, { title: f.label, 'aria-label': f.label }), el('span', null, '?', { 'aria-hidden': 'true' })));
  add(hd, el('h1', 'fdm-title', NIGHT.title, { id: hid }), crumb, thread, purses ? buildPurses(purses) : null);

  // ---- map card: art, chapter name, chips
  const map = el('section', 'fdm-map lg-frame', null, { 'aria-label': `${NIGHT.chapter(v.chapter.n)}: ${v.chapter.name}` });
  const nm = add(el('div', 'fdm-nm'), el('div', 'fdm-k ty-kicker', NIGHT.chapter(v.chapter.n)), el('h2', 'fdm-chap', v.chapter.name));
  const group = el('div', 'fdm-tiers', null, { role: 'radiogroup', 'aria-labelledby': hid });
  add(map, add(el('div', 'fdm-artbox'), forestArt(), nm), group);

  // ---- side card
  const side = el('section', 'fdm-side lg-frame', null, { 'aria-live': 'polite' });

  // ---- actions
  const acts = el('nav', 'fdm-acts', null, { 'aria-label': 'Night' });
  const back = button({ label: NIGHT.back, hint: 'Esc', variant: 'secondary', onClick: () => { if (onBack) onBack(); } });
  const tree = button({ label: NIGHT.tree, hint: 'T', variant: 'secondary', onClick: () => { if (onTree) onTree(null); } });
  const begin = button({ label: v.begin, hint: 'Enter', variant: 'primary', onClick: () => { if (v.canBegin && onBegin) onBegin(v.sel); } });
  begin.classList.add('fdm-begin');
  tree.classList.add('fdm-treebtn');
  add(acts, back, tree, el('span', 'fdm-sp', null, { 'aria-hidden': 'true' }), begin);
  add(root, hd, map, side, acts);

  const chips = [];
  const ids = v.chips.map((c) => c.id);
  for (const c of v.chips) {
    const b = el('div', `fdm-tier fdm-tier--${c.id}`, null, { role: 'radio', 'data-tier': c.id });
    const sr = el('span', 'u3-sr', '', { id: nid('d') });
    b.setAttribute('aria-describedby', sr.getAttribute('id'));
    b.addEventListener('click', () => pick(c.id, false));
    add(group, b);
    chips.push({ id: c.id, el: b, sr });
  }

  function drawChips() {
    v.chips.forEach((c, i) => {
      const ch = chips[i];
      const b = ch.el;
      const sel = c.id === v.sel;
      b.className = `fdm-tier fdm-tier--${c.id} is-${c.state}${sel ? ' is-sel' : ''}${c.isNew ? ' is-new' : ''}`;
      b.setAttribute('aria-checked', sel ? 'true' : 'false');
      b.setAttribute('tabindex', sel ? '0' : '-1');
      if (c.state === 'open') b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true');
      b.setAttribute('aria-label', c.name);
      b.textContent = '';
      const n = add(el('span', 'fdm-n', null, { 'aria-hidden': 'true' }), c.state === 'open' ? tierGlyph(c.id) : c.state === 'gate' ? UNLOCK() : LOCK(), el('span', 'fdm-n__t', c.name));
      const small = el('small', 'fdm-line', null, { 'aria-hidden': 'true' });
      if (c.state === 'open' && !c.isNew) for (let k = 0; k < 3; k++) add(small, starIcon(k < c.stars));
      add(small, el('span', null, c.state === 'locked' && c.progress ? `${c.line} · ${c.progress.cur}/${c.progress.goal}` : c.line));
      add(b, n, small);
      if (c.state === 'locked' && c.progress) {
        const bar = el('span', 'fdm-bar', null, { 'aria-hidden': 'true' });
        const fill = el('i', null);
        fill.style.width = `${Math.round((100 * c.progress.cur) / c.progress.goal)}%`;
        add(b, add(bar, fill));
      }
      if (c.isNew) { const f = badge({ kind: 'new', text: NIGHT.isNew }); f.classList.add('fdm-new'); f.setAttribute('aria-hidden', 'true'); add(b, f); }
      ch.sr.textContent = `${c.isNew ? `${NIGHT.isNew}. ` : ''}${chipSr(c)}`;
      add(b, ch.sr);
    });
  }

  function drawSide() {
    const s = v.side;
    side.className = `fdm-side lg-frame fdm-side--${s.id}`;
    side.textContent = '';
    side.setAttribute('aria-label', s.kicker);
    add(side, add(el('div', 'fdm-k fdm-kick ty-kicker'), tierGlyph(s.id), el('span', null, s.kicker)), el('h2', 'fdm-head', s.headline));
    const ul = el('ul', 'fdm-changes');
    for (const line of s.changes) add(ul, el('li', null, line));
    add(side, ul);
    if (s.state === 'open') {
      add(side, el('div', 'fdm-k ty-kicker', NIGHT.earn));
      const earn = el('div', 'fdm-earn');
      for (const p of s.earn) add(earn, add(el('span', `fd-pill fdm-pill${p.teal ? ' is-teal' : ''}`), el('i', `fd-coin fd-coin--${p.kind}`, null, { 'aria-hidden': 'true' }), el('span', null, p.text)));
      add(side, earn);
      if (s.tools) add(side, el('p', 'fdm-tools', s.tools));
      const rec = add(el('p', 'fdm-rec'), el('span', null, s.records));
      const st = el('span', 'fdm-stars', null, { role: 'img', 'aria-label': `${s.stars} of 3 stars` });
      for (let k = 0; k < 3; k++) add(st, starIcon(k < s.stars));
      add(side, add(rec, st));
      if (s.id === 'normal' && gentle) add(side, gentleBox());
    } else if (s.gate) {
      const box = el('div', 'fdm-gate');
      const go = button({ label: NIGHT.openInTree, hint: 'T', variant: 'secondary', onClick: () => { if (onTree) onTree(s.gate.id); } });
      go.classList.add('fdm-go');
      add(box, el('p', 'fdm-gate__t', s.gate.line), go);
      add(side, box);
    } else {
      add(side, add(el('p', 'fdm-gate__t fdm-locked'), LOCK(), el('span', null, `${NIGHT.lockedSide} ${s.locked}`)));
    }
    if (v.nudge) add(side, add(el('p', 'fdm-nudge'), el('b', null, `${NIGHT.next} `), el('span', null, v.nudge)));
  }

  // EXTRAS v1 Gentle Light: one checkbox, Twilight only. The setting is the same one as Settings > Controls.
  function gentleBox() {
    const on = !!gentle.get();
    const G = NIGHT.gentle;
    const lid = nid('gl'), did = nid('gd');
    const box = el('div', `fdm-gentle${on ? ' is-on' : ''}`, null, { role: 'checkbox', tabindex: '0', 'aria-checked': on ? 'true' : 'false', 'aria-labelledby': lid, 'aria-describedby': did });
    const tick = el('span', 'fdm-gentle__box', on ? '✓' : '', { 'aria-hidden': 'true' });
    const ul = el('ul', 'fdm-gentle__list');
    for (const b of G.bullets) add(ul, el('li', null, b));
    add(box, tick, add(el('div', 'fdm-gentle__txt'), add(el('p', 'fdm-gentle__name', null, { id: lid }), el('span', null, G.name), el('span', 'fdm-gentle__state', on ? G.on : G.off)), el('p', 'fdm-gentle__line', G.line, { id: did }), ul));
    const flip = () => { gentle.set(!gentle.get()); drawSide(); const n = side.querySelector ? side.querySelector('.fdm-gentle') : null; if (n) n.focus(); };
    box.addEventListener('click', flip);
    box.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); flip(); } });
    const wrap = el('div', 'fdm-gentle-wrap');
    add(wrap, box);
    if (on) add(wrap, add(el('p', 'fdm-gentle__rest'), el('span', 'fdm-moon', '☽', { 'aria-hidden': 'true' }), el('span', null, G.rest)));
    return wrap;
  }

  function drawCrumb() {
    crumb.textContent = '';
    const [h, c, n] = v.crumb;
    if (h) add(crumb, el('b', null, h), el('span', 'fdm-sep', ' › ', { 'aria-hidden': 'true' }));
    add(crumb, el('span', null, c), el('span', 'fdm-sep', ' › ', { 'aria-hidden': 'true' }), el('span', null, n));
  }

  function drawBegin() {
    const l = begin.querySelector ? begin.querySelector('.lg-btn__label') : null;
    if (l) l.textContent = v.begin;
    begin.disabled = !v.canBegin;
    if (v.canBegin) begin.removeAttribute('aria-disabled'); else begin.setAttribute('aria-disabled', 'true');
  }

  function draw() { drawChips(); drawSide(); drawCrumb(); drawBegin(); }

  function pick(tid, focus) {
    if (!ids.includes(tid)) return;
    if (tid !== v.sel && viewFor) v = viewFor(tid);
    draw();
    if (onPick) onPick(tid);
    if (focus) { const c = chips.find((x) => x.id === v.sel); if (c) c.el.focus(); }
  }
  draw();

  /** Keyboard for the whole screen (the UI forwards window keydowns here). Returns true when handled. */
  const onKey = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = globalThis.document && globalThis.document.activeElement;
    const onBtn = !!(a && a.closest && (a.closest('.lg-btn') || a.closest('.fdm-gentle')));
    const k = e.key;
    const i = ids.indexOf(v.sel);
    if (k === 'Escape') { e.preventDefault(); if (onBack) onBack(); return true; }
    if (k === 't' || k === 'T') { e.preventDefault(); if (onTree) onTree(v.side.gate ? v.side.gate.id : null); return true; }
    if (k === 'PageUp' || k === 'PageDown') { e.preventDefault(); pick(ids[(i + (k === 'PageDown' ? 1 : ids.length - 1)) % ids.length], true); return true; } // LB / RB
    if (/^[1-9]$/.test(k)) { const j = Number(k) - 1; if (j < ids.length) { e.preventDefault(); pick(ids[j], true); return true; } return false; }
    if (!onBtn && (k === 'ArrowRight' || k === 'ArrowDown' || k === 'd' || k === 'D' || k === 's' || k === 'S')) { e.preventDefault(); pick(ids[(i + 1) % ids.length], true); return true; }
    if (!onBtn && (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'a' || k === 'A' || k === 'w' || k === 'W')) { e.preventDefault(); pick(ids[(i + ids.length - 1) % ids.length], true); return true; }
    if (!onBtn && k === ' ') { e.preventDefault(); return true; }
    if (!onBtn && k === 'Enter') { e.preventDefault(); begin.click(); return true; }
    return false;
  };
  return { root, chips, begin, back, tree, side, onKey, pick, current: () => v.sel, view: () => v, focusSelected: () => { const c = chips.find((x) => x.id === v.sel); if (c) c.el.focus(); } };
}
