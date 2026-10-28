// Title screen and hero select in the Lantern Glass, Lit look (U3). Pure DOM construction via the kit (createElement + textContent only,
// never innerHTML), so a hostile hero name, bank value or version string can only ever be text. Node-testable with a fake DOM.
import { buildNudge } from './savesafety.js';
import { el, kitRoot, button, divider, pips, wick, icon, wordmark } from './kit.js';
import { mk, emblem, EMBLEM_OF } from './hudsvg.js';
import { TITLE, HERO, LOADOUT, primaryCopy, treeWhisper } from './titlecopy.js';
import { buildChip, buildPurses } from './lanternsui.js';
import { LANTERN } from './lanterncopy.js';
import { CX } from './codexcopy.js';
import { CHARS } from './charcopy.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const cls = (node, c) => { node.classList.add(c); return node; };
let sid = 0;
const nid = (p) => `u3-${p}-${++sid}`;

/** Title: wordmark, then Begin / Continue as the big primary, Skill Tree and Settings as secondary, version footer.
 *  FD2 (all optional, so the U3 title still builds without them): lantern {id, name} -> chip top-left (onSwitch); purses {gold, shards, glass|null}
 *  top-right; whisper = Continue whisper; treeDot = something in the tree is affordable now; newGame {free} -> quiet "New game" (onNew). */
export function buildTitle({ hasProgress = false, firstRun = false, bank = null, version = '', note = '', lantern = null, purses = null, whisper = '', treeDot = false, newGame = null, treeLine = null,
  almanac = null, bands = 0, chars = null, nudge = null, onBegin, onTree, onSettings, onSwitch, onNew, onAlmanac, onChars } = {}) {
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
  const begin = button({ label: p.label, whisper: hasProgress && whisper ? whisper : p.whisper, hint: 'Enter', variant: 'primary', onClick: () => { if (onBegin) onBegin(); } });
  const tree = button({ label: TITLE.tree.label, whisper: treeLine || treeWhisper(bank, firstRun), hint: 'T', onClick: () => { if (onTree) onTree(); } });
  if (treeDot) {
    const lab = tree.children && tree.children[1] && tree.children[1].children ? tree.children[1].children[0] : null;
    if (lab) add(lab, el('span', 'fd-dot', null, { 'aria-hidden': 'true' }), el('span', 'u3-sr', ' (something can be bought now)'));
  }
  const settings = button({ label: TITLE.settings.label, whisper: TITLE.settings.whisper, hint: 'S', onClick: () => { if (onSettings) onSettings(); } });
  // CX3: the Almanac (J), shown once there is something written in it; a NEW dot when an entry is unread (text for screen readers)
  let alm = null;
  if (almanac) {
    alm = button({ label: CX.open, whisper: almanac.line || '', hint: CX.openHint, onClick: () => { if (onAlmanac) onAlmanac(); } });
    alm.classList.add('cx-almbtn');
    if (almanac.fresh) { const lab = alm.children && alm.children[1] && alm.children[1].children ? alm.children[1].children[0] : null; if (lab) add(lab, el('span', 'fd-dot', null, { 'aria-hidden': 'true' }), el('span', 'u3-sr', ' (new pages)')); }
  }
  // CHARACTER SYSTEM v2: the Characters page (C), once a hero is awake
  let chb = null;
  if (chars) { chb = button({ label: CHARS.open, whisper: chars.line || CHARS.openWhisper, hint: 'C', onClick: () => { if (onChars) onChars(); } }); chb.classList.add('ch-btn'); }
  let ng = null;
  if (newGame) {
    ng = button({ label: LANTERN.newGame, whisper: LANTERN.newWhisper(Math.max(0, Math.floor(Number(newGame.free) || 0))), hint: 'N', variant: 'secondary', onClick: () => { if (onNew) onNew(); } });
    ng.classList.add('fd-newgame');
  }
  if (lantern) { menu.classList.add('fd-menu2'); side.classList.add('fd-side'); add(menu, begin, chb, add(el('div', alm ? 'fd-row2 fd-row3' : 'fd-row2'), tree, alm, settings), ng); } else add(menu, begin, chb, tree, alm, settings);
  add(side, menu);
  if (typeof note === 'string' && note) add(side, el('p', 'u3-note ty-small', note.slice(0, 400), { role: 'status' })); // textContent only (el)
  const nudgeView = nudge && !note ? buildNudge(nudge) : null; // A1 backup reminder (never on top of a recovery / lock message)
  if (nudgeView) add(side, nudgeView.root); // same slot and look as the install card (the title shows one card at a time)
  if (firstRun) add(side, el('p', 'u3-hint ty-small', TITLE.hint));
  add(side, el('p', 'u3-orient ty-small', TITLE.orient));
  add(col, brand, side);
  const foot = el('footer', 'u3-foot');
  const ver = el('span', 'u3-ver ty-small', version ? `v${String(version).slice(0, 24)}` : '');
  add(foot, ver);
  let chip = null;
  if (lantern) { // after the menu in DOM order (Tab reaches Continue first), drawn at the top
    const top = el('div', 'fd-top');
    chip = buildChip({ id: lantern.id, name: lantern.name, title: lantern.title || '', onClick: () => { if (onSwitch) onSwitch(); } });
    add(top, chip, purses ? buildPurses(purses) : null);
    add(root, col, top, foot);
  } else add(root, col, foot);
  const nb = Math.max(0, Math.min(9, Math.floor(Number(bands) || 0))); // CX6: colour bands return to the backdrop as the Almanac fills (visual only)
  if (nb) { root.setAttribute('data-bands', String(nb)); const bandEl = el('div', 'cx-bands', null, { 'aria-hidden': 'true' }); bandEl.style.setProperty('--cx-bands', String(nb)); root.insertBefore(bandEl, root.firstChild); }
  return { root, begin, tree, settings, almanac: alm, chars: chb, newGame: ng, chip, side, menu, foot, version: ver, nudge: nudgeView };
}

const weaponEmblem = (weaponId) => {
  const doc = globalThis.document;
  const kind = EMBLEM_OF[weaponId] || 'sanctuary';
  return mk(doc, 'svg', { viewBox: '-26 -26 52 52', class: 'u3-emb', 'aria-hidden': 'true', focusable: 'false' }, [emblem(doc, kind, 44)]);
};

/** Hero select. heroes: [{id,name,epithet,line,gift,weapon,weaponId,ability,pips:{health,speed}}] (from heroView). portraits: {id: url}. */
/** nextLabel: when set (FD4: a night choice follows), the start button reads this instead of "Walk with <hero>". */
/** CHARACTER SYSTEM v2: copy = {kicker, title, whisper} overrides the header (loadout / starter pick); a hero with `badge` (e.g. 'Bond 3') shows it beside
 *  the name; `pips: null` hides the Health / Speed rows (every hero has the same body). */
export function buildHeroSelect({ heroes = [], portraits = {}, selected, onStart, onBack, nextLabel = null, copy = null, onWear = null, wearLabel = 'Wear' } = {}) {
  const startText = (h) => (nextLabel ? String(nextLabel) : HERO.walk(h ? h.name : 'Hero'));
  const root = cls(kitRoot(), 'u3-wrap');
  root.classList.add('u3-hero-screen');
  const head = el('header', 'u3-head');
  const hid = nid('h');
  const C = { kicker: HERO.kicker, title: HERO.title, whisper: HERO.whisper, ...(copy || {}) };
  add(head, el('div', 'u3-kicker ty-kicker', String(C.kicker)), el('h1', 'u3-htitle ty-title', String(C.title), { id: hid }), el('p', 'u3-goal ty-whisper', String(C.whisper)), divider());
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
    const sr = el('span', 'u3-sr', `${h.badge ? `${h.badge}. ` : ''}${h.pips ? `${HERO.health} ${h.pips.health} of 5. ${HERO.speed} ${h.pips.speed} of 5. ` : ''}${h.weapon}. ${h.ability}. ${h.gift}`, { id: nid('d') });
    c.setAttribute('aria-describedby', sr.getAttribute('id'));
    const por = el('div', 'u3-por', null, { 'aria-hidden': 'true' });
    if (portraits[h.id]) { const img = el('img', 'u3-por__img'); img.alt = ''; img.src = portraits[h.id]; img.draggable = false; add(por, img); }
    const st = el('div', 'u3-state');
    const stat = (label, n) => add(el('div', 'u3-stat'), el('span', 'u3-stat__l ty-kicker', label), pips({ total: 5, filled: n, label }));
    const kit = el('div', 'u3-kit');
    add(kit, add(el('span', 'u3-kit__row ty-label'), weaponEmblem(h.weaponId), el('span', null, h.weapon)), add(el('span', 'u3-kit__row ty-label'), icon('flame'), el('span', null, h.ability)));
    const info = el('div', 'u3-info', null, { 'aria-hidden': 'true' });
    const name = h.badge ? add(el('span', 'u3-name u3-name--badge'), el('span', null, h.name), el('span', 'u3-badge ty-label', String(h.badge))) : el('span', 'u3-name', h.name);
    add(info, st, name, h.epithet && el('span', 'u3-epithet', h.epithet), h.line && el('p', 'u3-line ty-body', h.line),
      h.pips && stat(HERO.health, h.pips.health), h.pips && stat(HERO.speed, h.pips.speed), kit, h.gift && el('p', 'u3-gift ty-whisper', h.gift));
    add(c, el('span', 'lg-eyelet', null, { 'aria-hidden': 'true' }), por, info, sr);
    add(group, c);
    cards.push({ el: c, state: st, hero: h });
  });
  const bar = el('div', 'u3-bar');
  const back = button({ label: HERO.back, hint: 'Esc', variant: 'secondary', onClick: () => { if (onBack) onBack(); } });
  const start = button({ label: startText(heroes[cur]), hint: 'Enter', variant: 'primary', onClick: () => { if (heroes[cur] && onStart) onStart(heroes[cur].id); } });
  // EXTRAS v1: 'Wear' opens the Lantern Wardrobe drawer for the chosen hero (looks only)
  const wearBtn = onWear ? button({ label: String(wearLabel), variant: 'secondary', onClick: () => { if (heroes[cur]) onWear(heroes[cur].id); } }) : null;
  if (wearBtn) wearBtn.classList.add('u3-wear');
  add(bar, back, wearBtn, start);
  const help = el('p', 'u3-help ty-small');
  const keys = el('span', 'u3-keys');
  for (const k of ['W', 'A', 'S', 'D']) add(keys, el('kbd', 'u3-kbd', k));
  add(keys, el('span', null, ` or arrows ${HERO.keys}`));
  add(help, keys, el('span', 'u3-touchkeys', HERO.touch));
  add(root, head, group, bar, help);

  const startLabel = () => (start.querySelector ? start.querySelector('.lg-btn__label') : null);
  const retitle = () => { const l = startLabel(); if (l && heroes[cur]) l.textContent = startText(heroes[cur]); };
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
  return { root, group, cards, back, start, wear: wearBtn, onKey, choose, current: () => (heroes[cur] ? heroes[cur].id : null), focusSelected: () => { if (cards[cur]) cards[cur].el.focus(); } };
}

/** CHARACTER SYSTEM v2 loadout step 3 (and the starter pick's second step): the starting spirit. spirits: [{id, name, line, open, kindred, note}]
 *  (open = awake in the Lantern Web; a sleeping one is shown dim with its note and can never be chosen). heroName: for the start label.
 *  copy: {kicker, title, whisper, walk(hero, spirit)}. Same radio semantics, keys and Lantern Glass cards as the hero step. Text only via textContent. */
export function buildSpiritSelect({ spirits = [], heroName = '', selected, onStart, onBack, copy = null } = {}) {
  const C = { kicker: LOADOUT.spiritKicker, title: LOADOUT.spiritTitle, whisper: LOADOUT.spiritWhisper, walk: LOADOUT.walk, ...(copy || {}) };
  const root = cls(kitRoot(), 'u3-wrap');
  root.classList.add('u3-hero-screen', 'ld-spirit-screen');
  const head = el('header', 'u3-head');
  const hid = nid('s');
  add(head, el('div', 'u3-kicker ty-kicker', String(C.kicker)), el('h1', 'u3-htitle ty-title', String(C.title), { id: hid }), el('p', 'u3-goal ty-whisper', String(C.whisper)), divider());
  const group = el('div', 'ld-spirits', null, { role: 'radiogroup', 'aria-labelledby': hid });
  const cards = [];
  const openIdx = spirits.map((s, i) => (s.open ? i : -1)).filter((i) => i >= 0);
  let cur = spirits.findIndex((s) => s.id === selected && s.open);
  if (cur < 0) cur = openIdx.length ? openIdx[0] : -1;
  const label = () => (spirits[cur] ? C.walk(String(heroName), spirits[cur].name) : String(C.title));
  spirits.forEach((s) => {
    const c = el('div', `ld-spirit${s.open ? '' : ' is-sleeping'}`, null, { role: 'radio', 'aria-label': s.open ? s.name : `${s.name}: ${s.note || LOADOUT.locked}` });
    if (!s.open) c.setAttribute('aria-disabled', 'true');
    const emb = el('span', 'ld-spirit__emb', null, { 'aria-hidden': 'true' });
    add(emb, weaponEmblem(s.id));
    const txt = el('span', 'ld-spirit__txt');
    add(txt, el('span', 'ld-spirit__name ty-label', s.name), el('span', 'ld-spirit__line ty-small', s.open ? (s.line || '') : (s.note || LOADOUT.locked)));
    add(c, emb, txt, s.kindred ? el('span', 'ld-spirit__kin ty-kicker', LOADOUT.kindred) : null);
    add(group, c);
    cards.push({ el: c, spirit: s });
  });
  const bar = el('div', 'u3-bar');
  const back = button({ label: HERO.back, hint: 'Esc', variant: 'secondary', onClick: () => { if (onBack) onBack(); } });
  const start = button({ label: label(), hint: 'Enter', variant: 'primary', onClick: () => { if (spirits[cur] && spirits[cur].open && onStart) onStart(spirits[cur].id); } });
  if (cur < 0) { start.disabled = true; start.setAttribute('aria-disabled', 'true'); }
  add(bar, back, start);
  add(root, head, group, bar);
  const state = () => cards.forEach((c, i) => {
    const sel = i === cur;
    c.el.setAttribute('aria-checked', sel ? 'true' : 'false');
    c.el.setAttribute('tabindex', sel ? '0' : '-1');
    if (sel) c.el.classList.add('is-chosen'); else c.el.classList.remove('is-chosen');
  });
  const retitle = () => { const l = start.querySelector ? start.querySelector('.lg-btn__label') : null; if (l) l.textContent = label(); };
  state();
  const choose = (i, focus) => {
    if (!spirits[i] || !spirits[i].open) return;
    cur = i; state(); retitle();
    if (focus) cards[cur].el.focus();
  };
  const step = (d) => { if (!openIdx.length) return; const k = openIdx.indexOf(cur); choose(openIdx[((k < 0 ? 0 : k) + d + openIdx.length) % openIdx.length], true); };
  cards.forEach((c, i) => c.el.addEventListener('click', () => { if (!spirits[i].open) return; if (i === cur) { if (onStart) onStart(spirits[i].id); } else choose(i, false); }));
  const onKey = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = globalThis.document && globalThis.document.activeElement;
    const onBtn = !!(a && (a === back || a === start || (a.closest && a.closest('.lg-btn'))));
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); if (onBack) onBack(); return true; }
    if (/^[1-9]$/.test(k)) { const i = Number(k) - 1; if (spirits[i] && spirits[i].open) { e.preventDefault(); choose(i, true); return true; } return false; }
    if (!onBtn && (k === 'ArrowRight' || k === 'ArrowDown')) { e.preventDefault(); step(1); return true; }
    if (!onBtn && (k === 'ArrowLeft' || k === 'ArrowUp')) { e.preventDefault(); step(-1); return true; }
    if (!onBtn && k === ' ') { e.preventDefault(); return true; }
    if (!onBtn && k === 'Enter') { e.preventDefault(); if (spirits[cur] && spirits[cur].open && onStart) onStart(spirits[cur].id); return true; }
    return false;
  };
  return { root, group, cards, back, start, onKey, choose, current: () => (spirits[cur] ? spirits[cur].id : null), focusSelected: () => { if (cards[cur]) cards[cur].el.focus(); else start.focus(); } };
}
