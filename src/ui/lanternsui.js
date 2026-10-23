// FD2/FD3 front door DOM: the title's lantern chip + purses, and the "Whose lantern?" screen (docs/design/front-door-v1.md, option 1A).
// Built with the Lantern Glass kit: createElement + textContent + setAttribute only (no HTML strings). Lantern names come from storage
// (whitelisted by cleanName, but still treated as untrusted text). Node-testable with a fake DOM.
import { el, kitRoot, button } from './kit.js';
import { LANTERN, fmt, lightLabel, holdState } from './lanterncopy.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, ...kids) => { const e = globalThis.document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v)); for (const c of kids) if (c) e.appendChild(c); return e; };
const now = () => (globalThis.performance && performance.now ? performance.now() : Date.now());
let sid = 0;
const nid = (p) => `fd-${p}-${++sid}`;

// Lantern tint per slot (the flame inside the chip / card icon); the name is what identifies a lantern, the tint only helps.
export const TINT = { l1: '#ffb867', l2: '#fff0c8', l3: '#ff9a7a' };

/** Small drawn lantern (brass frame, glass, tinted flame). Decorative. */
export function lanternIcon(tint = TINT.l1, cls = 'fd-lan') {
  return sv('svg', { viewBox: '0 0 40 52', class: cls, 'aria-hidden': 'true', focusable: 'false' },
    sv('path', { d: 'M14 8a6 6 0 0 1 12 0', fill: 'none', stroke: '#d8b26a', 'stroke-width': '2.5' }),
    sv('rect', { x: 9, y: 9, width: 22, height: 5, rx: 2, fill: '#d8b26a', stroke: '#3a2412', 'stroke-width': '1' }),
    sv('rect', { x: 10, y: 14, width: 20, height: 26, rx: 5, fill: 'rgba(20,28,44,.85)', stroke: '#d8b26a', 'stroke-width': '2.5' }),
    sv('path', { d: 'M20 20c4 5 4 9 0 13-4-4-4-8 0-13z', fill: /^#[0-9a-f]{6}$/i.test(tint) ? tint : TINT.l1 }),
    sv('rect', { x: 9, y: 40, width: 22, height: 5, rx: 2, fill: '#d8b26a', stroke: '#3a2412', 'stroke-width': '1' }));
}

// Tier glyphs: the shape carries the meaning (never colour alone). Twilight = half sun, Deep Dusk = crescent, Long Night = ring + star.
const GLYPH = {
  normal: () => [sv('path', { d: 'M5 16a7 7 0 0 1 14 0z', fill: 'currentColor' }), sv('path', { d: 'M2 16.5h20', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' })],
  hard: () => [sv('path', { d: 'M14.5 3.5a8.5 8.5 0 1 0 6 14.6A7 7 0 0 1 14.5 3.5z', fill: 'currentColor' })],
  expert: () => [sv('circle', { cx: 11, cy: 13, r: 7.5, fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2' }), sv('path', { d: 'M19.5 2.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z', fill: 'currentColor' })],
};
export function tierGlyph(tid) { return sv('svg', { viewBox: '0 0 24 24', class: `fd-gl fd-gl--${GLYPH[tid] ? tid : 'normal'}`, 'aria-hidden': 'true', focusable: 'false' }, ...(GLYPH[tid] || GLYPH.normal)()); }
const STAR = 'M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z';
export const starIcon = (on) => star(on);
const star = (on) => sv('svg', { viewBox: '0 0 24 24', class: `fd-st${on ? ' is-on' : ''}`, 'aria-hidden': 'true', focusable: 'false' }, sv('path', { d: STAR }));

/** Coin / shard / Dawnglass purse pills (top-right of the title). glass null = hidden (Deep Dusk not seen yet). */
export function buildPurses({ gold = 0, shards = 0, glass = null } = {}) {
  const box = el('div', 'fd-purses', null, { role: 'group', 'aria-label': 'Purses' });
  const pill = (kind, n, word) => add(el('span', 'fd-pill', null, { role: 'img', 'aria-label': `${fmt(n)} ${word}` }), el('i', `fd-coin fd-coin--${kind}`, null, { 'aria-hidden': 'true' }), el('span', 'fd-pill__n', fmt(n), { 'aria-hidden': 'true' }));
  add(box, pill('gold', gold, 'gold'), pill('shard', shards, 'soul shards'));
  if (glass !== null && glass !== undefined) add(box, pill('glass', glass, 'Dawnglass'));
  return box;
}

/** Lantern chip (top-left of the title): tinted lantern, current lantern name, "Switch lantern". A real button. */
export function buildChip({ id = 'l1', name = 'Lantern 1', onClick } = {}) {
  const b = el('button', 'fd-chip', null, { type: 'button', 'aria-label': `${name}. ${LANTERN.switch}` });
  const t = el('span', 'fd-chip__t', null, { 'aria-hidden': 'true' });
  add(t, el('b', 'fd-chip__name', name), el('small', 'fd-chip__sub', LANTERN.switch));
  add(b, lanternIcon(TINT[id] || TINT.l1, 'fd-lan fd-chip__lan'), t);
  b.addEventListener('click', () => { if (onClick) onClick(); });
  return b;
}

/** Name field (input + error line). maxlength/autocomplete are fixed attributes set here (not from data). */
function nameField(label, value, placeholder) {
  const wrap = el('div', 'fd-field');
  const id = nid('name');
  const err = el('p', 'fd-field__err ty-small', '', { id: nid('err'), role: 'status', 'aria-live': 'polite' });
  const input = el('input', 'fd-input', null, { id, type: 'text', 'aria-describedby': err.getAttribute('id') });
  input.setAttribute('maxlength', '16');
  input.setAttribute('aria-label', label);
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('enterkeyhint', 'done');
  if (placeholder) input.setAttribute('placeholder', String(placeholder).slice(0, 16));
  input.value = typeof value === 'string' ? value.slice(0, 16) : '';
  add(wrap, el('label', 'fd-field__l ty-small', label, { for: id }), input, err);
  return { wrap, input, err, say: (m) => { err.textContent = m || ''; } };
}

/** Hold-to-confirm danger button: hold pointer / Enter / Space for 1.5 s, or activate twice within 5 s (screen readers, switch access). */
function holdButton({ label, srLabel, onDone }) {
  const b = button({ label, variant: 'danger', inline: true });
  b.classList.add('fd-hold');
  b.setAttribute('aria-label', srLabel);
  const fill = el('span', 'fd-hold__fill', null, { 'aria-hidden': 'true' });
  b.appendChild(fill);
  const lab = b.children && b.children[1] && b.children[1].children ? b.children[1].children[0] : null;
  let h = holdState();
  let raf = 0; let keyHeld = false;
  const set = (p) => { if (fill.style && fill.style.setProperty) fill.style.setProperty('--fd-hold', String(p)); };
  const finish = () => { cancelAnimationFrame(raf); set(1); onDone(); };
  const loop = () => { const t = now(); set(h.progress(t)); if (h.tick(t)) { finish(); return; } raf = requestAnimationFrame(loop); };
  const start = () => { if (h.done) return; h.press(now()); if (lab) lab.textContent = LANTERN.holding; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
  const stop = () => { if (h.done) return; h.release(); cancelAnimationFrame(raf); set(0); if (lab) lab.textContent = h.armed ? LANTERN.holdArmed : label; };
  b.addEventListener('pointerdown', (e) => { if (e.button === 0 || e.pointerType !== 'mouse') { if (b.setPointerCapture && e.pointerId !== undefined) { try { b.setPointerCapture(e.pointerId); } catch { /* ignore */ } } start(); } });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(t, stop);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  b.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation();
    if (!e.repeat && !keyHeld) { keyHeld = true; start(); }
  });
  b.addEventListener('keyup', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); keyHeld = false; stop(); });
  b.addEventListener('blur', () => { keyHeld = false; stop(); });
  // A click with no pointer press (screen reader / switch access / spaceActivate) arms, a second one within 5 s confirms.
  b.addEventListener('click', (e) => { if (h.done) return; if (e && e.detail > 0) return; if (h.activate(now())) finish(); else if (lab) lab.textContent = LANTERN.holdArmed; });
  return { b, reset: () => { h = holdState(); stop(); } };
}

/**
 * "Whose lantern?" screen.
 * cards: [{ id, name, hero, lines, nights:[{id,name,stars,open,played}], status, canExport, active }]
 * mode: 'pick' | 'new' | 'replace'. Handlers return { ok, error } (and onDelete may return { ok, undo: true }).
 */
export function buildLanternScreen({ mode = 'pick', cards = [], canCreate = false, locked = false, note = '', status = null, portraits = {}, onLight, onCreate, onRename, onExport, onDelete, onReplace, onUndo, onBack } = {}) {
  const root = kitRoot();
  root.classList.add('u3-wrap');
  root.classList.add('fd-screen');
  const head = el('header', 'fd-head');
  const hid = nid('h');
  const T = mode === 'replace' ? [LANTERN.titleReplace, LANTERN.whisperReplace] : mode === 'new' && canCreate ? [LANTERN.titleNew, LANTERN.whisperNew] : [LANTERN.title, LANTERN.whisper];
  add(head, el('h1', 'fd-title ty-title', T[0], { id: hid }), el('p', 'fd-whisper ty-whisper', T[1]));
  if (locked || note) add(head, el('p', 'u3-note fd-note ty-small', String(note || LANTERN.locked).slice(0, 400), { role: 'status' }));
  const list = el('ul', 'fd-row', null, { 'aria-labelledby': hid });
  const views = []; // per card: { primary, close() } so Esc can back out of an open menu/form
  const primaries = [];
  let open = null; // the card view currently showing a menu / form

  const closeOpen = () => { if (open) { const o = open; open = null; o.close(); return true; } return false; };

  cards.forEach((c) => {
    const li = el('li', `fd-card lg-card lg-frame${c.active ? ' is-current' : ''}`);
    add(li, el('span', 'lg-eyelet', null, { 'aria-hidden': 'true' }));
    const face = el('div', 'fd-face');
    const por = el('div', 'fd-por', null, { 'aria-hidden': 'true' });
    if (c.hero && portraits[c.hero]) { const img = el('img', 'fd-por__img'); img.alt = ''; img.src = portraits[c.hero]; img.draggable = false; add(por, img); } else add(por, lanternIcon(TINT[c.id] || TINT.l1, 'fd-lan fd-por__lan'));
    const info = el('div', 'fd-info');
    const nameEl = el('h2', 'fd-name', c.name);
    add(info, nameEl, ...c.lines.map((l) => el('p', 'fd-meta ty-small', l)));
    add(face, por, info);
    const nights = el('div', 'fd-nights');
    for (const n of c.nights) {
      const g = add(el('span', `fd-night fd-night--${n.id}`, null, { 'aria-hidden': 'true' }), tierGlyph(n.id));
      if (n.played || n.id === 'normal') for (let i = 0; i < 3; i++) add(g, star(i < n.stars));
      else add(g, el('span', 'fd-night__open', 'open'));
      add(nights, g);
    }
    if (c.active) add(nights, el('span', 'fd-cur ty-kicker', LANTERN.current));
    const acts = el('div', 'fd-acts');
    const panelBox = el('div', 'fd-panel', null, { hidden: '' });
    const replace = mode === 'replace';
    const primary = button({ label: replace ? LANTERN.relight : LANTERN.light, hint: c.active && !replace ? 'Enter' : undefined, variant: c.active && !replace ? 'primary' : replace ? 'danger' : 'secondary', inline: true, disabled: (replace && locked) || c.status === 'newer' && replace });
    primary.classList.add('fd-light');
    primary.setAttribute('aria-label', lightLabel(c, replace ? LANTERN.relight : LANTERN.light));
    const more = el('button', 'fd-more lg-btn lg-frame lg-btn--secondary', null, { type: 'button', 'aria-label': `${LANTERN.more}: ${c.name}`, 'aria-expanded': 'false', 'aria-haspopup': 'true' });
    add(more, el('span', 'fd-more__dots', '···', { 'aria-hidden': 'true' }));
    add(acts, primary, replace ? null : more);
    add(li, face, nights, acts, panelBox);

    const showPanel = (kids, focus) => {
      closeOpen();
      panelBox.textContent = '';
      add(panelBox, ...kids);
      panelBox.hidden = false;
      acts.hidden = true;
      more.setAttribute('aria-expanded', 'true');
      li.classList.add('is-open');
      open = view;
      if (focus && focus.focus) focus.focus();
    };
    const view = {
      primary,
      close: () => { panelBox.hidden = true; panelBox.textContent = ''; acts.hidden = false; more.setAttribute('aria-expanded', 'false'); li.classList.remove('is-open'); if (open === view) open = null; (replace ? primary : more).focus(); },
    };
    const cancelBtn = () => button({ label: LANTERN.cancel, variant: 'quiet', inline: true, onClick: () => { open = null; view.close(); } });
    const exportBtn = (label) => button({ label, variant: 'secondary', inline: true, disabled: !c.canExport, onClick: () => { if (onExport) onExport(c.id); } });

    const confirmView = (kind) => {
      const text = el('p', 'fd-ask ty-body', kind === 'replace' ? LANTERN.replaceAsk(c.name) : c.status === 'ok' || c.status === 'backup' || c.status === 'empty' ? LANTERN.delAsk(c.name) : LANTERN.delAskNoUndo(c.name), { id: nid('ask') });
      const nf = kind === 'replace' ? nameField(LANTERN.nameLabel, '', LANTERN.namePlaceholder(c.id.slice(1))) : null;
      const hb = holdButton({ label: LANTERN.hold, srLabel: LANTERN.holdSr(c.name), onDone: () => {
        const r = kind === 'replace' ? (onReplace ? onReplace(c.id, nf.input.value) : null) : (onDelete ? onDelete(c.id) : null);
        if (r && !r.ok) { hb.reset(); if (nf) nf.say(r.error || ''); else text.textContent = r.error || ''; }
      } });
      hb.b.setAttribute('aria-describedby', text.getAttribute('id'));
      if (nf) nf.input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); open = null; view.close(); } });
      const row = add(el('div', 'fd-btnrow'), c.canExport ? exportBtn(LANTERN.exportFirst) : null, hb.b, cancelBtn());
      showPanel([text, nf && nf.wrap, row], c.canExport ? row.children[0] : hb.b);
    };
    const renameView = () => {
      const nf = nameField(LANTERN.renameLabel, c.name, '');
      const save = () => { const r = onRename ? onRename(c.id, nf.input.value) : { ok: false }; if (r && !r.ok) { nf.say(r.error || ''); nf.input.focus(); } };
      nf.input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); save(); } else if (e.key === 'Escape') { e.preventDefault(); open = null; view.close(); } });
      const row = add(el('div', 'fd-btnrow'), button({ label: LANTERN.save, variant: 'primary', inline: true, onClick: save }), cancelBtn());
      showPanel([nf.wrap, row], nf.input);
      if (nf.input.select) nf.input.select();
    };
    const menuView = () => {
      const m = el('div', 'fd-menu', null, { role: 'group', 'aria-label': `${c.name}: ${LANTERN.more}` });
      const r = button({ label: LANTERN.rename, variant: 'secondary', inline: true, disabled: locked || c.status === 'newer', onClick: renameView });
      const x = exportBtn(LANTERN.export);
      const d = button({ label: LANTERN.del, variant: 'danger', inline: true, disabled: locked, onClick: () => confirmView('delete') });
      add(m, r, x, d, button({ label: LANTERN.close, variant: 'quiet', inline: true, onClick: () => { open = null; view.close(); } }));
      showPanel([m], r.disabled ? x : r);
    };
    primary.addEventListener('click', () => { if (primary.disabled) return; if (replace) confirmView('replace'); else if (onLight) onLight(c.id); });
    more.addEventListener('click', menuView);
    views.push(view);
    primaries.push(primary);
    add(list, li);
  });

  // Empty slot: "New lantern" (dashed). Opens an optional name field; Light it creates the lantern.
  let newView = null;
  if (canCreate && mode !== 'replace') {
    const li = el('li', 'fd-card fd-card--new lg-frame');
    const btn = el('button', 'fd-new', null, { type: 'button' });
    add(btn, el('span', 'fd-plus', '+', { 'aria-hidden': 'true' }), add(el('span', 'fd-new__t'), el('span', 'fd-new__h', LANTERN.newCard), el('span', 'fd-new__l ty-small', LANTERN.newCardLine)));
    const form = el('div', 'fd-panel fd-newform', null, { hidden: '' });
    add(li, el('span', 'lg-eyelet', null, { 'aria-hidden': 'true' }), btn, form);
    const nf = nameField(LANTERN.nameLabel, '', LANTERN.namePlaceholder(cards.length + 1));
    const go = () => { const r = onCreate ? onCreate(nf.input.value) : { ok: false }; if (r && !r.ok) { nf.say(r.error || ''); nf.input.focus(); } };
    const view = {
      primary: btn,
      close: () => { form.hidden = true; btn.hidden = false; li.classList.remove('is-open'); if (open === view) open = null; btn.focus(); },
    };
    const lightBtn = button({ label: LANTERN.lightNew, hint: 'Enter', variant: 'primary', inline: true, onClick: go });
    lightBtn.classList.add('fd-light');
    add(form, nf.wrap, add(el('div', 'fd-btnrow'), lightBtn, button({ label: LANTERN.cancel, variant: 'quiet', inline: true, onClick: () => { open = null; view.close(); } })));
    nf.input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); go(); } else if (e.key === 'Escape') { e.preventDefault(); open = null; view.close(); } });
    const openForm = () => { closeOpen(); btn.hidden = true; form.hidden = false; li.classList.add('is-open'); open = view; nf.input.focus(); };
    btn.addEventListener('click', openForm);
    newView = { view, openForm, input: nf.input };
    primaries.push(btn);
    add(list, li);
  }

  const stat = el('div', 'fd-status', null, { role: 'status', 'aria-live': 'polite' });
  if (status && status.text) {
    add(stat, el('span', 'fd-status__t ty-small', String(status.text).slice(0, 200)));
    if (status.undo && onUndo) add(stat, button({ label: LANTERN.undo, variant: 'secondary', inline: true, onClick: () => onUndo() }));
  }
  const bar = el('footer', 'fd-bar');
  const back = button({ label: LANTERN.back, hint: 'Esc', variant: 'secondary', inline: true, onClick: () => { if (onBack) onBack(); } });
  back.classList.add('fd-back');
  add(bar, back, el('p', 'fd-foot ty-small', LANTERN.foot));
  add(root, head, list, stat, bar);

  const focusables = () => primaries.filter((p) => !p.hidden && !p.disabled);
  const focusFirst = () => {
    if (mode === 'new' && newView) { newView.openForm(); return; }
    if (status && status.undo && stat.children && stat.children[1]) { stat.children[1].focus(); return; }
    const cur = views.find((v, i) => cards[i] && cards[i].active);
    const f = (cur && !cur.primary.disabled ? cur.primary : focusables()[0]) || back;
    f.focus();
  };

  /** Keys while the screen shows (the UI forwards window keydowns). Returns true if handled. */
  const onKey = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = globalThis.document && globalThis.document.activeElement;
    if (a && a.tagName && /^(INPUT|TEXTAREA)$/i.test(a.tagName)) return false; // the field handles its own keys
    if (e.key === 'Escape') { e.preventDefault(); if (!closeOpen() && onBack) onBack(); return true; }
    const arrows = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (Object.hasOwn(arrows, e.key) && !open) {
      const f = focusables();
      if (!f.length) return false;
      const i = f.findIndex((p) => p === a || (a && a.closest && a.closest('.fd-card') === (p.closest && p.closest('.fd-card'))));
      e.preventDefault();
      f[(i < 0 ? 0 : i + arrows[e.key] + f.length) % f.length].focus();
      return true;
    }
    if (e.key === 'Enter' && !(a && a.closest && a.closest('button')) && !open) {
      e.preventDefault();
      const cur = views.find((v, i) => cards[i] && cards[i].active);
      if (cur && mode !== 'replace') cur.primary.click(); else focusFirst();
      return true;
    }
    return false;
  };
  return { root, list, back, status: stat, onKey, focusFirst, primaries, closeOpen, isOpen: () => !!open };
}
