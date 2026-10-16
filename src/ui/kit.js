// Lantern Glass, Lit kit helpers (UI IDENTITY v2, U2b; v1 helpers from U2). Pure DOM construction: createElement + textContent + setAttribute only.
// Never innerHTML / insertAdjacentHTML / outerHTML, so run or save data (names, notes) passed in as text can never become markup.
// Styling lives in kit.css (imported by the screen or by kitpage.js); this file has no CSS import so it can be unit-tested in Node.

const doc = () => globalThis.document;
let uid = 0;
const nextId = (p) => `${p}-${++uid}`;

// Attribute allow-list: aria-*, role, data-*, and a few plain ones. No on* handlers, no style, no href/src.
const ATTR_OK = /^(aria-[a-z]+|data-[a-z0-9-]+|role|type|tabindex|id|title|for|name|min|max|step|value|disabled|hidden|lang)$/;
const CLS_OK = /^[A-Za-z0-9_ -]*$/;

/** Safe element factory. `text` goes through textContent. Throws on a disallowed attribute or class string. */
export function el(tag, cls, text, attrs) {
  const e = doc().createElement(tag);
  if (cls) {
    if (!CLS_OK.test(cls)) throw new Error('kit: bad class string');
    e.className = cls;
  }
  if (text != null) e.textContent = String(text);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (!ATTR_OK.test(k)) throw new Error(`kit: attribute not allowed: ${k}`);
      e.setAttribute(k, String(v));
    }
  }
  return e;
}
const add = (parent, ...kids) => { for (const k of kids) if (k) parent.appendChild(k); return parent; };
const noop = () => {};
const hasClass = (e, c) => (e.classList ? e.classList.contains(c) : String(e.className).split(/\s+/).includes(c));

/** Root wrapper for kit content: scopes base font/colour and the Calm-motion switch. */
export function kitRoot({ calm = false } = {}) {
  return el('div', calm ? 'lg-kit lg-calm' : 'lg-kit');
}

/** Panel: cool glass lit warm from a brass lantern cap, in a brass band; kicker + title + whisper + thread divider, then body nodes.
 *  variant 'dawn' = the T2 colour-returns leadlight border (Dawn / victory panel only). cap:false drops the lantern cap. */
export function panel({ kicker, title, whisper, body = [], label, variant, cap = true } = {}) {
  if (variant != null && variant !== 'dawn') throw new Error('kit: bad panel variant');
  const tid = nextId('lg-pt');
  const p = el('section', `lg-panel lg-frame${variant === 'dawn' ? ' lg-panel--dawn lg-lead' : ''}`);
  if (cap) add(p, el('span', 'lg-cap', null, { 'aria-hidden': 'true' }));
  if (title) p.setAttribute('aria-labelledby', tid);
  else if (label) p.setAttribute('aria-label', String(label));
  if (kicker) add(p, el('div', 'lg-panel__kicker ty-kicker', kicker));
  if (title) add(p, el('h2', 'lg-panel__title ty-title', title, { id: tid }));
  if (whisper) add(p, el('p', 'lg-panel__whisper ty-whisper', whisper));
  if (title || kicker) add(p, divider());
  const b = el('div', 'lg-panel__body');
  add(b, ...body);
  add(p, b);
  return p;
}

/** Button. variant: primary | secondary | quiet | danger. Optional whisper line and key hint (hidden on touch by CSS). */
export function button({ label, whisper, hint, variant = 'secondary', onClick = noop, disabled = false, inline = false } = {}) {
  if (!['primary', 'secondary', 'quiet', 'danger'].includes(variant)) throw new Error('kit: bad button variant');
  const b = el('button', `lg-btn lg-frame lg-btn--${variant}${inline ? ' lg-btn--inline' : ''}`, null, { type: 'button' });
  add(b, el('span', 'lg-btn__flame', null, { 'aria-hidden': 'true' }));
  const t = el('span', 'lg-btn__text');
  add(t, el('span', 'lg-btn__label', label));
  if (whisper) add(t, el('span', 'lg-btn__whisper', whisper));
  add(b, t);
  if (hint) {
    add(b, el('kbd', 'lg-btn__key', hint, { 'aria-hidden': 'true' }));
    b.setAttribute('aria-keyshortcuts', String(hint));
  }
  if (disabled) b.disabled = true;
  b.addEventListener('click', (ev) => { if (!b.disabled) onClick(ev); });
  return b;
}

/** Wick toggle (role=switch). The row is the target. Shows "On"/"Off" as text so state never relies on colour alone. */
export function toggle({ label, help, checked = false, onChange = noop, disabled = false } = {}) {
  const b = el('button', 'lg-switch', null, { type: 'button', role: 'switch', 'aria-checked': checked ? 'true' : 'false' });
  const t = el('span', 'lg-switch__text');
  add(t, el('span', 'lg-switch__label', label));
  let helpId = null;
  if (help) { helpId = nextId('lg-sh'); add(t, el('span', 'lg-switch__help', help, { id: helpId })); b.setAttribute('aria-describedby', helpId); }
  const ctl = el('span', 'lg-switch__ctl');
  const track = el('span', 'lg-switch__track', null, { 'aria-hidden': 'true' });
  add(track, el('span', 'lg-switch__bead'));
  const state = el('span', 'lg-switch__state', checked ? 'On' : 'Off', { 'aria-hidden': 'true' });
  add(track, state);
  add(ctl, track);
  add(b, t, ctl);
  if (disabled) b.disabled = true;
  b.addEventListener('click', () => {
    if (b.disabled) return;
    const on = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    state.textContent = on ? 'On' : 'Off';
    onChange(on);
  });
  return b;
}

/** Tab list with roving tabindex and arrow/Home/End keys. items: [{id,label}]. */
export function tabs({ label, items, selected, onSelect = noop } = {}) {
  const list = el('div', 'lg-tabs', null, { role: 'tablist' });
  if (label) list.setAttribute('aria-label', String(label));
  const btns = [];
  const pick = (id, focus) => {
    btns.forEach((b) => {
      const on = b.getAttribute('data-id') === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('tabindex', on ? '0' : '-1');
      if (on && focus && b.focus) b.focus();
    });
    onSelect(id);
  };
  const first = selected ?? (items[0] && items[0].id);
  for (const it of items) {
    const b = el('button', 'lg-tab', it.label, { type: 'button', role: 'tab', 'data-id': it.id, 'aria-selected': 'false', tabindex: '-1' });
    if (it.disabled) b.disabled = true;
    b.addEventListener('click', () => { if (!b.disabled) pick(it.id, false); });
    b.addEventListener('keydown', (ev) => {
      const live = btns.filter((x) => !x.disabled);
      const i = live.indexOf(b);
      let n = null;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') n = live[(i + 1) % live.length];
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') n = live[(i - 1 + live.length) % live.length];
      else if (ev.key === 'Home') n = live[0];
      else if (ev.key === 'End') n = live[live.length - 1];
      if (n) { if (ev.preventDefault) ev.preventDefault(); pick(n.getAttribute('data-id'), true); }
    });
    btns.push(b);
    list.appendChild(b);
  }
  pick(first, false);
  list.select = (id) => pick(id, false);
  return list;
}

/** Thread slider: native range input (keyboard, touch and screen readers for free), restyled as thread + bead. */
export function slider({ label, min = 0, max = 100, step = 1, value = 50, format = (v) => `${v}%`, onInput = noop, disabled = false } = {}) {
  const wrap = el('label', 'lg-slider');
  const head = el('span', 'lg-slider__head');
  const val = el('span', 'lg-slider__val', format(value));
  add(head, el('span', 'lg-slider__lab', label), val);
  const inp = el('input', 'lg-range', null, { type: 'range', min, max, step, value });
  const fill = () => inp.style && inp.style.setProperty && inp.style.setProperty('--lg-fill', `${((Number(inp.value) - min) / (max - min)) * 100}%`);
  if (disabled) inp.disabled = true;
  inp.addEventListener('input', () => { const v = Number(inp.value); val.textContent = format(v); fill(); onInput(v); });
  fill();
  add(wrap, head, inp);
  return wrap;
}

/** Thread divider (dashed thread + round knot) or hairline (gradient + lozenge). Optional centre text. */
export function divider({ kind = 'thread', text } = {}) {
  const d = el('div', `lg-divider${kind === 'hair' ? ' lg-divider--hair' : ''}`, null, { role: 'separator' });
  add(d, el('span', 'lg-divider__bead', null, { 'aria-hidden': 'true' }));
  if (text) add(d, el('span', 'lg-divider__text', text));
  if (text) add(d, el('span', 'lg-divider__bead', null, { 'aria-hidden': 'true' }));
  return d;
}

/** Badge. kind new = teal swallow-tail flag; evolve = gold wax seal (gold stays reserved for evolutions). */
export function badge({ kind = 'new', text } = {}) {
  if (kind !== 'new' && kind !== 'evolve') throw new Error('kit: bad badge kind');
  const b = el('span', `lg-badge lg-badge--${kind}`);
  if (kind === 'evolve') add(b, el('span', 'lg-badge__seal', null, { 'aria-hidden': 'true' }));
  add(b, el('span', 'lg-badge__text', text ?? (kind === 'new' ? 'New' : 'Evolve')));
  return b;
}

/** Knotted rank pips on a thread. Announces "Rank n of m". */
export function pips({ total = 5, filled = 0, evolve = false, label = 'Rank' } = {}) {
  const t = Math.max(0, Math.min(12, Math.floor(Number(total)) || 0));
  const f = Math.max(0, Math.min(t, Math.floor(Number(filled)) || 0));
  const p = el('span', `lg-pips${evolve ? ' lg-pips--evolve' : ''}`, null, { role: 'img', 'aria-label': `${label} ${f} of ${t}` });
  for (let i = 0; i < t; i++) add(p, el('i', i < f ? 'lg-pip on' : 'lg-pip'));
  return p;
}

/** Wick-flame state indicator. state: lit (selected/ready/on) | ember (available) | dark (locked). Shape changes too, not just colour. */
export function wick({ state = 'ember', label } = {}) {
  if (!['lit', 'ember', 'dark'].includes(state)) throw new Error('kit: bad wick state');
  const names = { lit: 'lit', ember: 'available', dark: 'locked' };
  const w = el('span', 'lg-wick', null, { role: 'img', 'data-state': state, 'aria-label': label ? `${label}: ${names[state]}` : names[state] });
  return w;
}

/** Tooltip tag content. Static strings only. */
export function tooltip({ name, verb, rank, flavour, id } = {}) {
  const t = el('div', 'lg-tip lg-frame', null, { role: 'tooltip', id: id || nextId('lg-tip') });
  if (name) add(t, el('div', 'lg-tip__name', name));
  if (verb) add(t, el('div', 'lg-tip__verb', verb));
  if (rank) add(t, el('div', 'lg-tip__rank', rank));
  if (flavour) add(t, el('div', 'lg-tip__flavour', flavour));
  return t;
}

/** Wrap `target` so its tooltip opens on hover, keyboard focus and touch long-press (never hover-only); Esc closes it.
 *  The tag sits above (or below if no room) the target and is nudged horizontally to stay on screen, so it never covers what it describes. */
export function withTooltip(target, tipOpts, { longPressMs = 450, holdMs = 2600 } = {}) {
  const wrap = el('span', 'lg-tipwrap');
  const tip = tooltip(tipOpts);
  tip.hidden = true;
  add(wrap, target, tip);
  target.setAttribute('aria-describedby', tip.getAttribute('id'));
  let press = null; let hold = null;
  const place = () => {
    const w = globalThis.window;
    if (!w || !tip.getBoundingClientRect || !target.getBoundingClientRect) return;
    tip.style.setProperty('--lg-tip-dx', '0px');
    tip.setAttribute('data-side', 'above');
    let r = tip.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    if (r.top < 4 && tr.bottom + r.height + 14 < w.innerHeight) { tip.setAttribute('data-side', 'below'); r = tip.getBoundingClientRect(); }
    const m = 8;
    let dx = 0;
    if (r.left < m) dx = m - r.left; else if (r.right > w.innerWidth - m) dx = w.innerWidth - m - r.right;
    tip.style.setProperty('--lg-tip-dx', `${Math.round(dx)}px`);
  };
  const show = () => { tip.hidden = false; place(); };
  const hide = () => { tip.hidden = true; if (hold) { clearTimeout(hold); hold = null; } };
  target.addEventListener('mouseenter', show);
  target.addEventListener('mouseleave', hide);
  target.addEventListener('focus', show);
  target.addEventListener('blur', hide);
  target.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !tip.hidden) { hide(); if (ev.stopPropagation) ev.stopPropagation(); } });
  target.addEventListener('touchstart', () => { press = setTimeout(() => { show(); hold = setTimeout(hide, holdMs); }, longPressMs); }, { passive: true });
  const cancel = () => { if (press) { clearTimeout(press); press = null; } };
  target.addEventListener('touchend', cancel);
  target.addEventListener('touchcancel', cancel);
  wrap.tip = tip;
  return wrap;
}

/** Card (level-up style): arched lantern window, button with optional hanging lantern cap (eyelet), corner badge, key hint, kicker, title, big word, line, pips. */
export function card({ kicker, title, big, line, icon: iconName, pips: pipOpts, badge: badgeOpts, hint, evolve = false, selected = false, eyelet = true, onClick = noop, disabled = false } = {}) {
  const c = el('button', `lg-card lg-frame${evolve ? ' lg-card--evolve lg-lead' : ''}`, null, { type: 'button', 'aria-pressed': selected ? 'true' : 'false' });
  if (eyelet) add(c, el('span', 'lg-eyelet', null, { 'aria-hidden': 'true' }));
  if (badgeOpts) { const b = badge(badgeOpts); b.className += ' lg-card__badge'; add(c, b); }
  if (hint) { add(c, el('kbd', 'lg-btn__key lg-card__key', hint, { 'aria-hidden': 'true' })); c.setAttribute('aria-keyshortcuts', String(hint)); }
  if (iconName) add(c, add(el('span', 'lg-card__medal', null, { 'aria-hidden': 'true' }), icon(iconName)));
  if (kicker) add(c, el('span', 'lg-card__kicker ty-kicker', kicker));
  if (title) add(c, el('span', 'lg-card__title ty-card', title));
  if (big) add(c, el('span', 'lg-card__big ty-big', big));
  if (line) add(c, el('span', 'lg-card__line ty-body', line));
  if (pipOpts) add(c, pips(pipOpts));
  if (disabled) c.disabled = true;
  c.addEventListener('click', (ev) => { if (!c.disabled) onClick(ev); });
  return c;
}


// ---------- painted icons (CSS paints them from baked inline SVG; no markup from data) ----------
const ICONS = ['flame', 'ember', 'star', 'bolt', 'shard', 'lock', 'check', 'enter'];
/** Painted icon (tinted outline, fill, rim light). Decorative unless a label is given (then role=img). */
export function icon(name, { label } = {}) {
  if (!ICONS.includes(name)) throw new Error('kit: bad icon');
  const e = el('span', `lg-ic lg-ic--${name}`);
  if (label) { e.setAttribute('role', 'img'); e.setAttribute('aria-label', String(label)); } else e.setAttribute('aria-hidden', 'true');
  return e;
}

// ---------- drawn HOLLOWLIGHT wordmark: lantern Os, candle I, brass letters with a tinted outline and rim light; hand-wobble is baked into the paths ----------
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, ...kids) => { const e = doc().createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v)); for (const c of kids) if (c) e.appendChild(c); return e; };
const SK = { // skeletons, 100-unit cap height, slightly bent so no stroke is ruler-straight
  H: { w: 70, d: 'M10 3Q9 50 11 97M60 2Q61 50 59 98M10 52Q35 49 60 52' },
  L: { w: 62, d: 'M10 2Q11 50 10 98Q34 100 58 98' },
  W: { w: 96, d: 'M4 2Q13 50 24 98Q36 66 48 34Q60 66 72 98Q82 50 92 2' },
  I: { w: 22, d: 'M11 2Q12 50 11 98' },
  G: { w: 82, d: 'M72 20C64 7 52 2 42 2C20 2 6 24 6 50C6 76 20 98 42 98C58 98 72 88 74 62Q60 61 46 62' },
  T: { w: 78, d: 'M4 4Q39 -2 74 4M39 4Q38 50 39 98' },
};
const WORD = 'HOLLOWLIGHT';
const OUT = '#3a2412';
/** The wordmark as an inline SVG. Accessible name is "Hollowlight" (role=img); everything inside is decorative. */
export function wordmark({ label = 'Hollowlight' } = {}) {
  const id = nextId('lg-wm');
  const gap = 10; let x = 0; const pos = [];
  for (const ch of WORD) { pos.push([ch, x]); x += (ch === 'O' ? 80 : SK[ch].w) + gap; }
  const W = x - gap + 24, H = 160;
  const stop = (o, c, a) => sv('stop', { offset: o, 'stop-color': c, ...(a != null ? { 'stop-opacity': a } : {}) });
  const defs = sv('defs', {},
    sv('linearGradient', { id: `${id}b`, x1: 0, y1: 0, x2: 0, y2: 1 }, stop(0, '#fff0c4'), stop(0.45, '#e2b866'), stop(1, '#9b6a2c')),
    sv('linearGradient', { id: `${id}g`, x1: 0, y1: 0, x2: 0, y2: 1 }, stop(0, '#3b4b66'), stop(1, '#1e2738')),
    sv('radialGradient', { id: `${id}f` }, stop(0, '#ffd27a', 0.95), stop(0.6, '#ff9a2e', 0.35), stop(1, '#ff9a2e', 0)),
    sv('radialGradient', { id: `${id}h` }, stop(0, '#ffab3a', 0.45), stop(1, '#ffab3a', 0)));
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lg-wordmark', role: 'img', 'aria-label': String(label) }, defs);
  const stroke = (d, w, s, extra) => sv('path', { d, fill: 'none', stroke: s, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra });
  for (const [ch, px] of pos) {
    const g = sv('g', { transform: `translate(${px + 12} 30)`, 'aria-hidden': 'true' });
    if (ch === 'O') {
      g.append(
        stroke('M28 -8Q40 -20 52 -8', 7, OUT), stroke('M28 -8Q40 -20 52 -8', 3, `url(#${id}b)`),
        sv('rect', { x: 6, y: 2, width: 68, height: 96, rx: 30, fill: OUT }), sv('rect', { x: 11, y: 7, width: 58, height: 86, rx: 25, fill: `url(#${id}g)` }),
        sv('circle', { cx: 40, cy: 58, r: 34, fill: `url(#${id}f)` }),
        sv('path', { d: 'M40 34C50 46 53 54 50 64C48 71 32 71 30 64C27 54 30 46 40 34Z', fill: '#ffab3a' }),
        sv('path', { d: 'M40 50C45 56 45 61 40 66C35 61 35 56 40 50Z', fill: '#fff6d8' }),
        stroke('M40 7V93', 3, OUT, { opacity: 0.5 }),
        sv('rect', { x: 11, y: 7, width: 58, height: 86, rx: 25, fill: 'none', stroke: `url(#${id}b)`, 'stroke-width': 6 }),
        stroke('M18 30Q17 50 19 72', 3, '#fff', { 'stroke-opacity': 0.55 }));
    } else {
      const d = SK[ch].d;
      g.append(stroke(d, 22, OUT), stroke(d, 15, `url(#${id}b)`), stroke(d, 2.5, '#fff8e0', { 'stroke-opacity': 0.7, transform: 'translate(-3 -3)' }));
      if (ch === 'I') g.append(sv('g', { transform: 'translate(11 -14)' },
        sv('circle', { r: 17, fill: `url(#${id}h)` }),
        sv('path', { d: 'M0 -14C6 -6 8 -2 6 4C4 9 -4 9 -6 4C-8 -2 -6 -6 0 -14Z', fill: '#ffab3a', stroke: '#8a3f10', 'stroke-width': 2 }),
        sv('path', { d: 'M0 -4C3 0 3 3 0 6C-3 3 -3 0 0 -4Z', fill: '#fff6d8' })));
    }
    svg.appendChild(g);
  }
  svg.append(
    sv('path', { d: `M${R1(W * 0.18)} 150Q${R1(W / 2)} 138 ${R1(W * 0.82)} 150`, fill: 'none', stroke: '#ffe0a0', 'stroke-width': 2, 'stroke-dasharray': '7 5', opacity: 0.85, 'aria-hidden': 'true' }),
    sv('circle', { cx: R1(W / 2), cy: 144, r: 4.5, fill: '#ffd36b', stroke: '#6b4512', 'stroke-width': 1.5, 'aria-hidden': 'true' }));
  return svg;
}
const R1 = (v) => Math.round(v * 10) / 10;

export const _test = { hasClass, ATTR_OK };
