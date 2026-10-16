// Lantern Glass frame kit helpers (UI IDENTITY v1, U2). Pure DOM construction: createElement + textContent + setAttribute only.
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

/** Panel: one calm glass surface, brass corner brackets, kicker + title + whisper + thread divider, then body nodes. */
export function panel({ kicker, title, whisper, body = [], label } = {}) {
  const tid = nextId('lg-pt');
  const p = el('section', 'lg-panel lg-frame');
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
  const b = el('button', `lg-btn lg-frame lg-frame--2 lg-btn--${variant}${inline ? ' lg-btn--inline' : ''}`, null, { type: 'button' });
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
  add(ctl, track, state);
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

/** Card (level-up style): button with optional hanging eyelet, corner badge, key hint, kicker, title, big word, line, pips. */
export function card({ kicker, title, big, line, pips: pipOpts, badge: badgeOpts, hint, evolve = false, selected = false, eyelet = true, onClick = noop, disabled = false } = {}) {
  const c = el('button', `lg-card lg-frame${evolve ? ' lg-card--evolve' : ''}`, null, { type: 'button', 'aria-pressed': selected ? 'true' : 'false' });
  if (eyelet) add(c, el('span', 'lg-eyelet', null, { 'aria-hidden': 'true' }));
  if (badgeOpts) { const b = badge(badgeOpts); b.className += ' lg-card__badge'; add(c, b); }
  if (hint) { add(c, el('kbd', 'lg-btn__key lg-card__key', hint, { 'aria-hidden': 'true' })); c.setAttribute('aria-keyshortcuts', String(hint)); }
  if (kicker) add(c, el('span', 'lg-card__kicker ty-kicker', kicker));
  if (title) add(c, el('span', 'lg-card__title ty-card', title));
  if (big) add(c, el('span', 'lg-card__big ty-big', big));
  if (line) add(c, el('span', 'lg-card__line ty-body', line));
  if (pipOpts) add(c, pips(pipOpts));
  if (disabled) c.disabled = true;
  c.addEventListener('click', (ev) => { if (!c.disabled) onClick(ev); });
  return c;
}

export const _test = { hasClass, ATTR_OK };
