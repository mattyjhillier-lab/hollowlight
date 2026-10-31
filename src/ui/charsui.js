// CHARACTER SYSTEM v2 Characters page in the Lantern Glass look: hero tiles on the left (awake: portrait + Bond badge; sleeping:
// '?' + keepsake dots), the chosen hero's page on the right. DOM via the kit only (createElement + textContent), never innerHTML.
// opts: { view (charsView), portraits, selected, onBack }. Returns { root, tiles, back, onKey(e), current(), focusSelected() }.
import { el, kitRoot, button } from './kit.js';
import { CHARS } from './charcopy.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
let sid = 0;

export function buildCharacters({ view = [], portraits = {}, selected = null, onBack } = {}) {
  const root = kitRoot();
  root.classList.add('u3-wrap', 'ch-page');
  const hid = `ch-h-${++sid}`;
  const head = el('header', 'ch-head');
  add(head, el('h1', 'ch-title ty-title', CHARS.title, { id: hid }), el('p', 'ch-whisper ty-whisper', CHARS.whisper));
  const body = el('div', 'ch-body');
  const list = el('div', 'ch-tiles', null, { role: 'radiogroup', 'aria-labelledby': hid });
  const page = el('section', 'ch-detail lg-panel', null, { 'aria-live': 'polite' });
  const tiles = [];
  let cur = Math.max(0, view.findIndex((v) => v.id === selected));
  view.forEach((v) => {
    const t = el('div', `ch-tile${v.awake ? '' : ' is-sleeping'}`, null, { role: 'radio', 'aria-label': `${v.name}${v.awake && v.bond ? `, Bond ${v.bond.lvl}` : `, ${CHARS.sleeping}`}` });
    const por = el('div', 'ch-por', null, { 'aria-hidden': 'true' });
    if (v.awake && portraits[v.id]) { const img = el('img', 'ch-por__img'); img.alt = ''; img.src = portraits[v.id]; img.draggable = false; add(por, img); } else add(por, el('span', 'ch-q', '?'));
    add(t, por, el('span', 'ch-tname ty-label', v.awake ? v.name : '???'));
    if (v.awake && v.bond) add(t, el('span', 'ch-badge ty-small', `Bond ${v.bond.lvl}`));
    else if (v.keep) {
      const dots = el('span', 'ch-dots', null, { 'aria-hidden': 'true' });
      for (let i = 0; i < v.keep.need; i++) add(dots, el('span', `ch-dot${i < v.keep.n ? ' is-on' : ''}`));
      add(t, dots, el('span', 'ch-tsub ty-small', `${v.keep.n}/${v.keep.need}`));
    }
    add(list, t);
    tiles.push({ el: t, v });
  });
  const stat = (s) => add(el('div', 'ch-stat'), el('span', 'ch-stat__l ty-kicker', s.label), el('span', 'ch-stat__v', s.value), el('span', 'ch-stat__n ty-small', s.note));
  const drawPage = () => {
    page.textContent = '';
    const v = view[cur];
    if (!v) return;
    if (v.awake) {
      const top = el('div', 'ch-top');
      const por = el('div', 'ch-bigpor', null, { 'aria-hidden': 'true' });
      if (portraits[v.id]) { const img = el('img', 'ch-por__img'); img.alt = ''; img.src = portraits[v.id]; img.draggable = false; add(por, img); }
      const info = el('div', 'ch-info');
      add(info, el('div', 'ch-kicker ty-kicker', `${v.name}${v.epithet ? `, ${v.epithet}` : ''}`), el('h2', 'ch-name', v.name));
      if (v.bond) {
        const bar = el('div', 'ch-bar', null, { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(v.bond.need || 1), 'aria-valuenow': String(v.bond.need ? v.bond.into : 1), 'aria-label': v.bond.line });
        const fill = el('span', 'ch-bar__fill'); fill.style.setProperty('--f', String(v.bond.frac)); add(bar, fill);
        add(info, add(el('div', 'ch-bondrow'), el('span', 'ch-badge ty-small', `Bond ${v.bond.lvl}`), bar), el('p', 'ch-bondline ty-small', v.bond.line));
      }
      add(top, por, info);
      const skill = add(el('div', 'ch-skill'), el('div', 'ch-skill__k ty-kicker', `${CHARS.skill} · ${v.ability.cd}s`), el('div', 'ch-skill__n', v.ability.name), el('p', 'ch-skill__d ty-small', v.ability.desc));
      const stats = el('div', 'ch-stats');
      for (const s of v.stats) add(stats, stat(s));
      const perks = el('ol', 'ch-perks', null, { 'aria-label': CHARS.perks });
      for (const p of v.perks) add(perks, add(el('li', `ch-perk${p.lit ? ' is-lit' : ''}`), el('span', 'ch-perk__l ty-small', `Bond ${p.lvl}`), el('span', 'ch-perk__n ty-label', p.name), el('span', 'ch-perk__t ty-small', p.text)));
      add(page, top, skill, stats, el('div', 'ch-perkhead ty-kicker', CHARS.perks), perks, el('p', 'ch-note ty-small', CHARS.banked));
    } else {
      const k = v.keep || { line: CHARS.sleeping, hint: '', desc: '' };
      add(page, el('div', 'ch-kicker ty-kicker', CHARS.sleeping), el('h2', 'ch-name', '???'), el('p', 'ch-keep ty-label', k.line), k.desc ? el('p', 'ch-keepdesc ty-whisper', k.desc) : null,
        k.hint ? el('p', 'ch-hint ty-small', k.hint) : null, el('p', 'ch-note ty-small', CHARS.keepWhere));
    }
  };
  const state = () => tiles.forEach((t, i) => { const s = i === cur; t.el.setAttribute('aria-checked', s ? 'true' : 'false'); t.el.setAttribute('tabindex', s ? '0' : '-1'); if (s) t.el.classList.add('is-chosen'); else t.el.classList.remove('is-chosen'); });
  const choose = (i, focus) => { if (!tiles.length) return; cur = (i + tiles.length) % tiles.length; state(); drawPage(); if (focus) tiles[cur].el.focus(); };
  tiles.forEach((t, i) => t.el.addEventListener('click', () => choose(i, false)));
  const bar = el('div', 'ch-bar2');
  const back = button({ label: CHARS.back, hint: 'Esc', variant: 'secondary', onClick: () => { if (onBack) onBack(); } });
  add(bar, back);
  add(body, list, page);
  add(root, head, body, bar);
  state(); drawPage();
  const onKey = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = globalThis.document && globalThis.document.activeElement;
    const onBtn = !!(a && a.closest && a.closest('.lg-btn'));
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); if (onBack) onBack(); return true; }
    if (/^[1-9]$/.test(k)) { const i = Number(k) - 1; if (i < tiles.length) { e.preventDefault(); choose(i, true); return true; } return false; }
    if (!onBtn && (k === 'ArrowRight' || k === 'ArrowDown')) { e.preventDefault(); choose(cur + 1, true); return true; }
    if (!onBtn && (k === 'ArrowLeft' || k === 'ArrowUp')) { e.preventDefault(); choose(cur - 1, true); return true; }
    return false;
  };
  return { root, tiles, back, page, onKey, choose, current: () => (view[cur] ? view[cur].id : null), focusSelected: () => { if (tiles[cur]) tiles[cur].el.focus(); } };
}
