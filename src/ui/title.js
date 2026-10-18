// Title screen and hero select in the Lantern Glass, Lit look (U3). Pure DOM construction via the kit (createElement + textContent only,
// never innerHTML), so a hostile hero name, bank value or version string can only ever be text. Node-testable with a fake DOM.
import { el, kitRoot, button, divider, pips, wick, icon, wordmark } from './kit.js';
import { mk, emblem, EMBLEM_OF } from './hudsvg.js';
import { TITLE, HERO, primaryCopy, treeWhisper } from './titlecopy.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const cls = (node, c) => { node.classList.add(c); return node; };
let sid = 0;
const nid = (p) => `u3-${p}-${++sid}`;

/** Title: wordmark, then Begin / Continue as the big primary, Skill Tree and Settings as secondary, version footer. */
export function buildTitle({ hasProgress = false, firstRun = false, bank = null, version = '', note = '', onBegin, onTree, onSettings } = {}) {
  const root = cls(kitRoot(), 'u3-wrap');
  root.classList.add('u3-title');
  const col = el('main', 'u3-col');
  const brand = el('header', 'u3-brand');
  const h1 = el('h1', 'u3-h1');
  h1.appendChild(wordmark());
  add(brand, el('div', 'u3-kicker ty-kicker', TITLE.kicker), h1, el('p', 'u3-tagline', TITLE.tagline));
  const side = el('div', 'u3-side');
  const menu = el('nav', 'u3-menu', null, { 'aria-label': 'Main menu' });
  const p = primaryCopy(hasProgress);
  const begin = button({ label: p.label, whisper: p.whisper, hint: 'Enter', variant: 'primary', onClick: () => { if (onBegin) onBegin(); } });
  const tree = button({ label: TITLE.tree.label, whisper: treeWhisper(bank, firstRun), hint: 'T', onClick: () => { if (onTree) onTree(); } });
  const settings = button({ label: TITLE.settings.label, whisper: TITLE.settings.whisper, hint: 'S', onClick: () => { if (onSettings) onSettings(); } });
  add(menu, begin, tree, settings);
  add(side, menu);
  if (typeof note === 'string' && note) add(side, el('p', 'u3-note ty-small', note.slice(0, 400), { role: 'status' })); // textContent only (el)
  if (firstRun) add(side, el('p', 'u3-hint ty-small', TITLE.hint));
  add(side, el('p', 'u3-orient ty-small', TITLE.orient));
  add(col, brand, side);
  const foot = el('footer', 'u3-foot');
  const ver = el('span', 'u3-ver ty-small', version ? `v${String(version).slice(0, 24)}` : '');
  add(foot, ver);
  add(root, col, foot);
  return { root, begin, tree, settings, side, menu, foot, version: ver };
}

const weaponEmblem = (weaponId) => {
  const doc = globalThis.document;
  const kind = EMBLEM_OF[weaponId] || 'sanctuary';
  return mk(doc, 'svg', { viewBox: '-26 -26 52 52', class: 'u3-emb', 'aria-hidden': 'true', focusable: 'false' }, [emblem(doc, kind, 44)]);
};

/** Hero select. heroes: [{id,name,epithet,line,gift,weapon,weaponId,ability,pips:{health,speed}}] (from heroView). portraits: {id: url}. */
export function buildHeroSelect({ heroes = [], portraits = {}, selected, onStart, onBack } = {}) {
  const root = cls(kitRoot(), 'u3-wrap');
  root.classList.add('u3-hero-screen');
  const head = el('header', 'u3-head');
  const hid = nid('h');
  add(head, el('div', 'u3-kicker ty-kicker', HERO.kicker), el('h1', 'u3-htitle ty-title', HERO.title, { id: hid }), el('p', 'u3-goal ty-whisper', HERO.whisper), divider());
  const group = el('div', 'u3-heroes', null, { role: 'radiogroup', 'aria-labelledby': hid });
  const cards = [];
  let cur = Math.max(0, heroes.findIndex((h) => h.id === selected));
  const state = (i) => {
    const c = cards[i];
    const sel = i === cur;
    c.el.setAttribute('aria-checked', sel ? 'true' : 'false');
    c.el.setAttribute('tabindex', sel ? '0' : '-1');
    if (sel) c.el.classList.add('is-chosen'); else c.el.classList.remove('is-chosen');
    c.state.textContent = '';
    add(c.state, wick({ state: sel ? 'lit' : 'ember' }), el('span', 'u3-state__t ty-kicker', sel ? HERO.chosen : HERO.ready));
  };
  heroes.forEach((h) => {
    const c = el('div', 'u3-hero lg-card lg-frame', null, { role: 'radio', 'aria-label': `${h.name}${h.epithet ? `, ${h.epithet}` : ''}` });
    const sr = el('span', 'u3-sr', `${HERO.health} ${h.pips.health} of 5. ${HERO.speed} ${h.pips.speed} of 5. ${h.weapon}. ${h.ability}. ${h.gift}`, { id: nid('d') });
    c.setAttribute('aria-describedby', sr.getAttribute('id'));
    const por = el('div', 'u3-por', null, { 'aria-hidden': 'true' });
    if (portraits[h.id]) { const img = el('img', 'u3-por__img'); img.alt = ''; img.src = portraits[h.id]; img.draggable = false; add(por, img); }
    const st = el('div', 'u3-state');
    const stat = (label, n) => add(el('div', 'u3-stat'), el('span', 'u3-stat__l ty-kicker', label), pips({ total: 5, filled: n, label }));
    const kit = el('div', 'u3-kit');
    add(kit, add(el('span', 'u3-kit__row ty-label'), weaponEmblem(h.weaponId), el('span', null, h.weapon)), add(el('span', 'u3-kit__row ty-label'), icon('flame'), el('span', null, h.ability)));
    const info = el('div', 'u3-info', null, { 'aria-hidden': 'true' });
    add(info, st, el('span', 'u3-name', h.name), h.epithet && el('span', 'u3-epithet', h.epithet), h.line && el('p', 'u3-line ty-body', h.line),
      stat(HERO.health, h.pips.health), stat(HERO.speed, h.pips.speed), kit, h.gift && el('p', 'u3-gift ty-whisper', h.gift));
    add(c, el('span', 'lg-eyelet', null, { 'aria-hidden': 'true' }), por, info, sr);
    add(group, c);
    cards.push({ el: c, state: st, hero: h });
  });
  const bar = el('div', 'u3-bar');
  const back = button({ label: HERO.back, hint: 'Esc', variant: 'secondary', onClick: () => { if (onBack) onBack(); } });
  const start = button({ label: HERO.walk(heroes[cur] ? heroes[cur].name : 'Hero'), hint: 'Enter', variant: 'primary', onClick: () => { if (heroes[cur] && onStart) onStart(heroes[cur].id); } });
  add(bar, back, start);
  const help = el('p', 'u3-help ty-small');
  const keys = el('span', 'u3-keys');
  for (const k of ['W', 'A', 'S', 'D']) add(keys, el('kbd', 'u3-kbd', k));
  add(keys, el('span', null, ` or arrows ${HERO.keys}`));
  add(help, keys, el('span', 'u3-touchkeys', HERO.touch));
  add(root, head, group, bar, help);

  const startLabel = () => (start.querySelector ? start.querySelector('.lg-btn__label') : null);
  const retitle = () => { const l = startLabel(); if (l && heroes[cur]) l.textContent = HERO.walk(heroes[cur].name); };
  cards.forEach((_, i) => state(i));
  const choose = (i, focus) => {
    if (!cards.length) return;
    cur = (i + cards.length) % cards.length;
    cards.forEach((_, k) => state(k));
    retitle();
    if (focus) cards[cur].el.focus();
  };
  cards.forEach((c, i) => c.el.addEventListener('click', () => { if (i === cur) { if (onStart) onStart(heroes[i].id); } else choose(i, false); }));

  /** Keyboard for the whole screen (the UI forwards window keydowns here while it is showing). Returns true if handled. */
  const onKey = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = globalThis.document && globalThis.document.activeElement;
    const onBtn = !!(a && (a === back || a === start || (a.closest && a.closest('.lg-btn'))));
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); if (onBack) onBack(); return true; }
    if (/^[1-9]$/.test(k)) { const i = Number(k) - 1; if (i < cards.length) { e.preventDefault(); choose(i, true); return true; } return false; }
    if (!onBtn && (k === 'ArrowRight' || k === 'ArrowDown')) { e.preventDefault(); choose(cur + 1, true); return true; }
    if (!onBtn && (k === 'ArrowLeft' || k === 'ArrowUp')) { e.preventDefault(); choose(cur - 1, true); return true; }
    if (!onBtn && k === 'Home') { e.preventDefault(); choose(0, true); return true; }
    if (!onBtn && k === 'End') { e.preventDefault(); choose(cards.length - 1, true); return true; }
    if (!onBtn && k === ' ') { e.preventDefault(); return true; }
    if (!onBtn && k === 'Enter') { e.preventDefault(); if (heroes[cur] && onStart) onStart(heroes[cur].id); return true; }
    return false;
  };
  return { root, group, cards, back, start, onKey, choose, current: () => (heroes[cur] ? heroes[cur].id : null), focusSelected: () => { if (cards[cur]) cards[cur].el.focus(); } };
}
