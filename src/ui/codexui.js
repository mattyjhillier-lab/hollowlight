// CX2 the Almanac screen (docs/design/codex-celebrations-v1.md section 2/5; mock-ups docs/mockups/codex/cx-foes, cx-spirits).
// One book, four pages (Foes, Spirits, Hollowlighters, Nights). Built with createElement + textContent only (kit el); portraits are the real
// code-drawn Husk art through <img src=blob:> (src/gfx/husk/portrait.js) and the hero-select art. The view model is almanac() (src/meta/codex.js).
// Keyboard: 1-4 / Tab on a grid item switch pages, arrows move in the grid, Enter opens an entry (portrait: full-height sheet), Esc back one step.
import { el, kitRoot } from './kit.js';
import { mk, emblem, EMBLEM_OF } from './hudsvg.js';
import { CX, MARK_LINE, TITLES } from './codexcopy.js';
import { portraitUrl } from '../gfx/husk/portrait.js';
import { MARKS } from '../sim/marks.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const fmt = (n) => Math.max(0, Math.floor(Number(n) || 0)).toLocaleString('en-GB');
const mmss = (s) => { const t = Math.max(0, Math.floor(Number(s) || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const TAB_IDS = ['foes', 'spirits', 'heroes', 'nights'];
const doc = () => globalThis.document;

function img(src, cls) {
  const i = el('img', cls);
  i.alt = '';
  i.draggable = false;
  if (src) i.src = src;
  return i;
}
// unknown foe: a hooded husk shape with only the dashed mask outline (no face: BIBLE rule 5)
function silhouette() {
  const d = doc();
  return mk(d, 'svg', { viewBox: '0 0 100 70', class: 'cx-sil', 'aria-hidden': 'true', focusable: 'false' }, [
    mk(d, 'ellipse', { cx: 50, cy: 64, rx: 30, ry: 4, fill: 'rgba(0,0,0,.35)' }),
    mk(d, 'path', { d: 'M20 58 C14 40 22 22 40 18 C52 8 72 12 80 26 C90 34 88 52 80 58 Z', fill: '#3a4152', stroke: '#5d6578', 'stroke-width': 2 }),
    mk(d, 'path', { d: 'M58 24 C70 22 80 30 78 40 C72 46 60 44 56 36 Z', fill: 'none', stroke: '#8a93a8', 'stroke-width': 2, 'stroke-dasharray': '3 3' }),
  ]);
}
function socketIcon(state, weapon, color) {
  const d = doc();
  if (state === 'found') return mk(d, 'svg', { viewBox: '-30 -30 60 60', class: 'cx-sock is-found', 'aria-hidden': 'true', focusable: 'false' }, [mk(d, 'circle', { r: 27, fill: '#1c2335', stroke: '#ffd36b', 'stroke-width': 3 }), emblem(d, EMBLEM_OF[weapon] || 'orb', 36)]);
  if (state === 'sealed') return mk(d, 'svg', { viewBox: '-30 -30 60 60', class: 'cx-sock is-sealed', 'aria-hidden': 'true', focusable: 'false' }, [mk(d, 'circle', { r: 26, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-dasharray': '6 5' }), mk(d, 'circle', { r: 8, fill: '#5d6578' })]);
  const q = mk(d, 'text', { x: 0, y: 8, 'text-anchor': 'middle', 'font-size': 22, fill: '#8a93a8' });
  q.textContent = '?';
  return mk(d, 'svg', { viewBox: '-30 -30 60 60', class: 'cx-sock is-sleep', 'aria-hidden': 'true', focusable: 'false' }, [mk(d, 'circle', { r: 26, fill: 'none', stroke: '#5d6578', 'stroke-width': 2, 'stroke-dasharray': '2 4' }), q]);
}
function bar(frac) {
  const b = el('div', 'cx-bar', null, { 'aria-hidden': 'true' });
  const i = el('i');
  i.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
  return add(b, i);
}
function kb(k) { return el('span', 'cx-kb', k); }

/** book: almanac(); from: 'title' | 'pause' | 'results' | 'tree'; heroPortraits: {id: url}; titles: {got, pick}; onPickTitle(id); onRead(keys); onBack(). */
export function buildAlmanac({ book, from = 'title', tab = null, heroPortraits = {}, calm = false, titles = null, onPickTitle, onRead, onBack } = {}) {
  const root = kitRoot({ calm });
  root.classList.add('cx');
  const read = new Set();
  const isNew = (k) => book.isNew(k) && !read.has(k);
  const markRead = (keys) => { const fresh = keys.filter((k) => isNew(k)); if (!fresh.length) return; fresh.forEach((k) => read.add(k)); if (onRead) onRead(fresh); refreshDots(); };
  const dlg = el('div', 'cx-book', null, { role: 'dialog', 'aria-label': CX.title, 'aria-modal': 'true' });
  // ---- top bar
  const top = el('div', 'cx-top');
  const back = el('button', 'cx-btn cx-back', null, { type: 'button', 'aria-label': `${CX.back} (Esc)` });
  add(back, el('span', 'cx-chev', '‹', { 'aria-hidden': 'true' }), el('span', 'cx-hide-land', CX.back), kb('Esc'));
  back.addEventListener('click', () => { if (sheetOpen) closeSheet(); else if (onBack) onBack(); });
  const h1 = el('h1', 'cx-h1', CX.title);
  const tot = el('span', 'cx-tot', from === 'pause' ? CX.readOnly : book.riddles ? CX.fullAlmanacOn : `${CX.sub} · ${CX.pages(book.pages.found, book.pages.total)}`);
  add(top, back, h1);
  let titleBtn = null;
  if (titles && titles.got && titles.got.length && from !== 'pause') {
    let cur = titles.pick || titles.got[0];
    titleBtn = el('button', 'cx-btn cx-titlebtn', null, { type: 'button' });
    const lab = () => { titleBtn.textContent = `Title: ${TITLES[cur] ? TITLES[cur].name : ''}`; titleBtn.setAttribute('aria-label', `Your title: ${TITLES[cur] ? TITLES[cur].name : ''}. Press to change.`); };
    lab();
    titleBtn.addEventListener('click', () => { const i = titles.got.indexOf(cur); cur = titles.got[(i + 1) % titles.got.length]; lab(); if (onPickTitle) onPickTitle(cur); });
    add(top, titleBtn);
  }
  add(top, tot);
  // ---- tabs
  const tabsEl = el('div', 'cx-tabs', null, { role: 'tablist', 'aria-label': CX.title });
  const tabBtns = {};
  for (const t of book.tabs) {
    const b = el('button', 'cx-tab', null, { type: 'button', role: 'tab', 'data-id': t.id, 'aria-selected': 'false', tabindex: '-1', id: `cx-tab-${t.id}` });
    add(b, el('span', null, CX.tabs[t.id]), el('b', 'cx-tabn', `${t.found} / ${t.total}`, { 'aria-hidden': 'true' }), el('i', 'cx-dot', null, { 'aria-hidden': 'true' }), el('span', 'cx-sr', `, ${t.found} of ${t.total}`), el('span', 'cx-sr cx-newsr', ', new'));
    b.addEventListener('click', () => select(t.id, false));
    b.addEventListener('keydown', (e) => {
      const i = TAB_IDS.indexOf(t.id);
      const n = e.key === 'ArrowRight' ? TAB_IDS[(i + 1) % 4] : e.key === 'ArrowLeft' ? TAB_IDS[(i + 3) % 4] : e.key === 'Home' ? TAB_IDS[0] : e.key === 'End' ? TAB_IDS[3] : null;
      if (n) { e.preventDefault(); e.stopPropagation(); select(n, true); tabBtns[n].focus(); }
    });
    tabBtns[t.id] = b;
    add(tabsEl, b);
  }
  const body = el('div', 'cx-body', null, { role: 'tabpanel' });
  const list = el('div', 'cx-list');
  const entry = el('div', 'cx-entry', null, { 'aria-live': 'polite' });
  const sheetBack = el('button', 'cx-btn cx-sheetback', null, { type: 'button' });
  add(sheetBack, el('span', 'cx-chev', '‹', { 'aria-hidden': 'true' }), el('span', null, CX.back));
  sheetBack.addEventListener('click', () => closeSheet());
  add(body, list, add(el('div', 'cx-entrywrap'), sheetBack, entry));
  add(dlg, top, tabsEl, body);
  add(root, dlg);

  let cur = null;
  let items = []; // focusable list items of the page
  let sheetOpen = false;
  const portraitMode = () => !!(globalThis.matchMedia && globalThis.matchMedia('(orientation: portrait) and (max-width: 899px)').matches);
  function openSheet() { if (!portraitMode()) return; sheetOpen = true; root.classList.add('cx-sheet'); sheetBack.focus(); }
  function closeSheet() { sheetOpen = false; root.classList.remove('cx-sheet'); const it = items.find((x) => x.classList.contains('is-sel')); if (it) it.focus(); }

  function refreshDots() {
    for (const t of book.tabs) {
      const fresh = [...book.unlocked].some((k) => isNew(k) && tabOf(k) === t.id);
      tabBtns[t.id].classList.toggle('has-new', fresh);
    }
    for (const it of items) { const ks = (it.getAttribute('data-keys') || '').split(' ').filter(Boolean); it.classList.toggle('has-new', ks.some((k) => isNew(k))); }
  }

  // ---- list item (a button; the NEW tag is text, never colour only)
  function item(cls, keys, label, kids, onPick) {
    const b = el('button', `cx-item ${cls}`.trim(), null, { type: 'button', 'aria-label': label, 'data-keys': keys.join(' ') });
    add(b, el('span', 'cx-new', CX.newTag, { 'aria-hidden': 'true' }), ...kids);
    b.addEventListener('click', () => { pick(b, onPick); openSheet(); });
    b.addEventListener('focus', () => { if (!sheetOpen && !portraitMode()) pick(b, onPick); });
    items.push(b);
    return b;
  }
  function pick(b, onPick) {
    for (const x of items) { x.classList.toggle('is-sel', x === b); x.setAttribute('aria-current', x === b ? 'true' : 'false'); }
    entry.replaceChildren();
    onPick();
    markRead((b.getAttribute('data-keys') || '').split(' ').filter(Boolean).filter((k) => book.unlocked.has(k)));
  }

  // ---- FOES
  function foeCard(f) {
    const known = f.known;
    let pic;
    if (known) { const u = portraitUrl(f.kind === 'marks' ? 'marks' : f.id); pic = add(el('span', 'cx-pic'), img(u, 'cx-img')); } else pic = add(el('span', 'cx-pic cx-pic--sil'), silhouette());
    const nm = f.kind === 'marks' ? CX.marks : known ? f.name : CX.unknown;
    const ct = f.kind === 'marks' ? (known ? `${f.seen.length} / ${f.total}` : CX.notMet) : known ? fmt(f.count) : f.boss ? f.hint : CX.notMet;
    const nextPage = f.pages.find((p) => !p.open);
    const label = f.kind === 'marks' ? `${CX.marks}, ${known ? `${f.seen.length} of ${f.total} seen` : CX.notMet}` : known ? `${f.name}, ${CX.slain(fmt(f.count))}${nextPage ? `, next page at ${fmt(nextPage.at)}` : ''}` : `Unknown foe, ${f.where || ''}`;
    return item(known ? '' : 'is-unk', [f.key, ...f.pages.map((p) => p.key)], label, [pic, el('span', 'cx-nm', nm), el('span', 'cx-ct', ct)], () => foeEntry(f));
  }
  function foeEntry(f) {
    if (f.kind === 'marks') return marksEntry(f);
    const head = el('div', 'cx-ehead');
    const pic = f.known ? add(el('span', 'cx-epic'), img(portraitUrl(f.id), 'cx-img')) : add(el('span', 'cx-epic cx-pic--sil'), silhouette());
    const txt = el('div', 'cx-etxt');
    add(txt, el('div', 'cx-sub', `${f.where}${f.known ? ` · ${f.boss ? 'Elder Husk' : f.mini ? 'Old alpha' : CX.husk}` : ''}`), el('h2', 'cx-h2', f.known ? f.name : CX.unknown), el('div', 'cx-sub', f.known ? CX.freed(fmt(f.count)) : f.hint));
    add(head, pic, txt);
    add(entry, head);
    if (!f.known) return;
    add(entry, el('p', 'cx-quote', `“${f.line}”`));
    let firstLocked = true;
    for (const p of f.pages) {
      const row = el('div', `cx-page${p.open ? '' : ' is-lock'}`);
      const v = el('div', 'cx-v');
      if (p.open) v.textContent = p.text;
      else if (firstLocked) { add(v, el('span', null, CX.nextAt(fmt(p.at), fmt(p.cur))), bar(p.cur / p.at)); firstLocked = false; }
      else add(v, el('i', 'cx-lock', null, { 'aria-hidden': 'true' }), el('span', null, CX.sealedAt(fmt(p.at))));
      add(row, el('span', 'cx-k', p.label), v);
      add(entry, row);
    }
    const nx = f.pages.find((p) => !p.open);
    const foot = el('div', 'cx-foot');
    if (nx && nx.nodeName) add(foot, el('span', null, CX.webSame(nx.nodeName)));
    add(foot, add(el('span', 'cx-keys'), kb('←'), kb('→'), el('span', null, ` ${CX.keysFoes} · `), kb('Tab'), el('span', null, ` ${CX.keysPages}`)));
    add(entry, foot);
  }
  function marksEntry(f) {
    const head = el('div', 'cx-ehead');
    add(head, add(el('span', 'cx-epic'), f.known ? img(portraitUrl('marks'), 'cx-img') : silhouette()), add(el('div', 'cx-etxt'), el('div', 'cx-sub', CX.marksWhere), el('h2', 'cx-h2', CX.marks), el('div', 'cx-sub', f.known ? CX.slain(fmt(f.count)) : CX.marksNone)));
    add(entry, head);
    for (const m of f.marks) {
      const row = el('div', `cx-page${m.seen ? '' : ' is-lock'}`);
      add(row, el('span', 'cx-k', m.seen ? MARKS[m.id].name : CX.unknown), el('div', 'cx-v', m.seen ? MARK_LINE[m.id] : CX.markUnseen));
      add(entry, row);
    }
  }

  // ---- SPIRITS
  function spiritChip(w) {
    const dot = el('i', 'cx-wdot', null, { 'aria-hidden': 'true' });
    dot.style.background = w.known && w.found ? w.color : '#5d6578';
    return item(w.known ? 'cx-wchip' : 'cx-wchip is-unk', w.evos.map((e) => e.key), `${w.known ? w.name : 'Unknown spirit'}, ${w.found} of ${w.evos.length} evolutions found`, [dot, el('span', 'cx-nm', w.known ? w.name : CX.unknown), el('span', 'cx-ct', w.known ? `${w.found}/${w.evos.length}` : CX.sleeping.toLowerCase())], () => spiritEntry(w));
  }
  function spiritEntry(w) {
    const row = el('div', 'cx-socks');
    for (const e of w.evos) {
      const c = el('section', `cx-sockcard is-${e.state}`, null, { 'aria-label': e.state === 'found' ? `${e.name}, found` : e.state === 'sealed' ? `${e.verb}, not yet found` : 'Sleeping evolution' });
      if (e.state === 'found') c.style.setProperty('--cx-col', w.color);
      const verb = el('div', 'cx-verb', e.verb);
      verb.style.color = e.state === 'sleeping' ? '' : w.color;
      add(c, socketIcon(e.state, w.id, w.color), verb);
      if (e.state === 'found') {
        add(c, el('h3', 'cx-h3', e.name), el('p', 'cx-desc', e.desc || ''), el('p', 'cx-quote cx-quote--s', `“${e.codex}”`), el('p', 'cx-sub', CX.taken(e.taken)), el('p', 'cx-recipe', CX.recipe(e.recipe[0], e.recipe[1])));
      } else if (e.state === 'sealed') {
        add(c, el('h3', 'cx-h3 is-dim', CX.notFound), el('p', 'cx-sub2', CX.awake));
        if (e.riddle) add(c, el('p', 'cx-riddle', `“${e.riddle}”`), el('p', 'cx-sub', CX.riddleNote));
      } else {
        add(c, el('h3', 'cx-h3 is-dim', CX.sleeping), el('p', 'cx-sub2', !w.known ? CX.weaponAsleep : e.cond ? CX.wake(e.cond) : CX.stirs));
        if (e.cond) add(c, bar(e.frac));
      }
      add(row, c);
    }
    add(entry, row);
  }

  // ---- HOLLOWLIGHTERS
  function heroCard(h) {
    const pic = h.walked && heroPortraits[h.id] ? add(el('span', 'cx-pic cx-pic--hero'), img(heroPortraits[h.id], 'cx-img')) : add(el('span', 'cx-pic cx-pic--sil'), silhouette());
    return item(h.walked ? '' : 'is-unk', [h.key], h.walked ? `${h.name}, ${CX.heroWalked(h.runs, h.clears)}` : `${h.name}, ${CX.heroNot}`, [pic, el('span', 'cx-nm', h.name), el('span', 'cx-ct', h.walked ? fmt(h.runs) : CX.heroNot.toLowerCase())], () => heroEntry(h));
  }
  function heroEntry(h) {
    const head = el('div', 'cx-ehead');
    const pic = heroPortraits[h.id] ? add(el('span', `cx-epic cx-epic--hero${h.walked ? '' : ' is-grey'}`), img(heroPortraits[h.id], 'cx-img')) : add(el('span', 'cx-epic'), silhouette());
    add(head, pic, add(el('div', 'cx-etxt'), el('div', 'cx-sub', h.weapon), el('h2', 'cx-h2', h.name), el('div', 'cx-sub', h.epithet)));
    add(entry, head);
    if (h.walked) {
      add(entry, el('p', 'cx-quote', h.blurb), add(el('div', 'cx-page'), el('span', 'cx-k', CX.ability), el('div', 'cx-v', `${h.ability}: ${h.abilityText}`)), el('p', 'cx-sub', CX.heroWalked(h.runs, h.clears)));
    } else add(entry, el('p', 'cx-sub2', h.open ? CX.heroPick(h.name) : CX.heroLocked));
  }

  // ---- NIGHTS
  function nightCard(n) {
    return item(`cx-nchip${n.walked ? '' : ' is-unk'}`, [n.key], `${n.name}, ${n.walked ? CX.nightRuns(n.runs, n.clears) : n.open ? CX.nightUnplayed : CX.nightClosed}`, [el('i', `cx-moon cx-moon--${n.id}`, null, { 'aria-hidden': 'true' }), el('span', 'cx-nm', n.walked || n.open ? n.name : CX.unknown), el('span', 'cx-ct', n.walked ? `${n.clears}/${n.runs}` : '')], () => nightEntry(n));
  }
  function nightEntry(n) {
    add(entry, add(el('div', 'cx-etxt'), el('div', 'cx-sub', n.chapter), el('h2', 'cx-h2', n.walked || n.open ? n.name : CX.unknown)));
    if (n.walked) {
      add(entry, add(el('div', 'cx-page'), el('span', 'cx-k', 'Walked'), el('div', 'cx-v', CX.nightRuns(n.runs, n.clears))), add(el('div', 'cx-page'), el('span', 'cx-k', 'Best'), el('div', 'cx-v', `${CX.best(mmss(n.best))} · ${CX.stars(n.stars)}${n.first ? ` · ${CX.firstDawn}` : ''}`)), el('p', 'cx-sub', CX.boss));
    } else add(entry, el('p', 'cx-sub2', n.open ? CX.nightUnplayed : CX.nightClosed));
    add(entry, el('div', 'cx-kicker', CX.lore));
    for (const l of book.lore) {
      const row = el('div', `cx-page${l.open ? '' : ' is-lock'}`);
      add(row, el('span', 'cx-k', `${l.i}`), add(el('div', 'cx-v'), l.open ? el('b', 'cx-lt', l.title) : el('span', null, CX.loreLocked), el('div', l.open ? 'cx-lx' : 'cx-lx is-dim', l.open ? l.text : l.cond)));
      add(entry, row);
    }
    markRead(book.lore.filter((l) => l.open).map((l) => l.key));
  }

  // ---- page switch
  function select(id, focusTab) {
    if (!TAB_IDS.includes(id)) id = 'foes';
    cur = id;
    for (const t of TAB_IDS) { const on = t === id; tabBtns[t].classList.toggle('is-on', on); tabBtns[t].setAttribute('aria-selected', on ? 'true' : 'false'); tabBtns[t].setAttribute('tabindex', on ? '0' : '-1'); }
    body.setAttribute('aria-labelledby', `cx-tab-${id}`);
    items = [];
    list.replaceChildren();
    entry.replaceChildren();
    list.className = `cx-list cx-list--${id}`;
    root.setAttribute('data-page', id);
    if (sheetOpen) { sheetOpen = false; root.classList.remove('cx-sheet'); }
    const make = id === 'foes' ? book.foes.map(foeCard) : id === 'spirits' ? book.spirits.map(spiritChip) : id === 'heroes' ? book.heroes.map(heroCard) : book.nights.map(nightCard);
    for (const b of make) add(list, b);
    refreshDots();
    // open on the newest entry (a NEW one first), else the first known
    const keysOf = (b) => (b.getAttribute('data-keys') || '').split(' ');
    const first = items.find((b) => keysOf(b).some((k) => isNew(k))) || items.find((b) => !b.classList.contains('is-unk')) || items[0];
    if (first && !portraitMode()) first.click();
    else if (first) first.classList.add('is-sel');
    if (focusTab === 'item' && first) first.focus();
  }
  function tabOf(k) { return k.startsWith('f') ? 'foes' : k.startsWith('e:') ? 'spirits' : k.startsWith('h:') ? 'heroes' : k.startsWith('n:') || k.startsWith('l:') ? 'nights' : ''; }

  function gridCols() {
    if (items.length < 2 || !items[0].offsetTop && !items[1].offsetTop) return cur === 'spirits' || cur === 'nights' ? 1 : 5;
    const y0 = items[0].offsetTop;
    let n = 0;
    for (const b of items) { if (b.offsetTop !== y0) break; n++; }
    return Math.max(1, n);
  }
  function onKey(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const k = e.key;
    const a = doc() && doc().activeElement;
    if (k === 'Escape') { e.preventDefault(); if (sheetOpen) closeSheet(); else if (onBack) onBack(); return true; }
    if (/^[1-4]$/.test(k)) { e.preventDefault(); select(TAB_IDS[Number(k) - 1], 'item'); return true; }
    const i = items.indexOf(a);
    if (k === 'Tab' && i >= 0 && !sheetOpen) { e.preventDefault(); const n = TAB_IDS[(TAB_IDS.indexOf(cur) + (e.shiftKey ? 3 : 1)) % 4]; select(n, 'item'); return true; }
    if (i >= 0 && !sheetOpen) {
      const c = gridCols();
      const d = k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : k === 'ArrowDown' ? c : k === 'ArrowUp' ? -c : 0;
      if (d) { e.preventDefault(); const j = Math.max(0, Math.min(items.length - 1, i + d)); items[j].focus(); return true; }
      if (k === 'Enter' || k === ' ') { e.preventDefault(); a.click(); return true; }
    }
    return false;
  }

  select(tab && TAB_IDS.includes(tab) ? tab : (book.tabs.find((t) => [...book.unlocked].some((k) => isNew(k) && tabOf(k) === t.id)) || { id: 'foes' }).id, false);
  return {
    root, back, tabs: tabBtns, list, entry, titleBtn, onKey, select,
    current: () => cur, isSheet: () => sheetOpen,
    focusFirst: () => { const s = items.find((b) => b.classList.contains('is-sel')) || items[0]; if (s) s.focus({ preventScroll: true }); else back.focus(); },
  };
}
