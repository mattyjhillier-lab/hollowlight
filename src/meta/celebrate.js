// CX4 the celebration queue (docs/design/codex-celebrations-v1.md section 4, LOCKED A). Pure JS, no DOM.
// Sizes: small (ledger line + NEW dot), medium (card ~1.2 s), big (full-screen moment). Max 1 big + 3 medium per screen, order big -> medium -> small,
// the same key is never celebrated twice (codex.told), nothing interrupts a run (this runs at results / title / tree only). A defeat keeps its
// medium + small items but its big moments wait for the next title visit ("While you were away").
import { bitsToSet } from './codex.js';
import { TITLES, CEL } from '../ui/codexcopy.js';

export const CAP = Object.freeze({ big: 1, medium: 3, ledger: 2 });
const CEL_WRITTEN = 'written in the Almanac';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function sizeOf(key) {
  if (key.startsWith('c:')) return 'big';
  if (key.startsWith('e:')) return 'medium';
  return 'small';
}

// Build one item from a key and the book (copy + emblem data; all strings, shown via textContent).
export function itemFor(key, book, data) {
  const size = sizeOf(key);
  const it = { key, size, kind: '', title: '', line: '', sub: '', pills: [], weapon: null, color: '#ffd27a', cue: size === 'big' ? 'tree_whole' : size === 'medium' ? 'tree_light' : '', sr: '' };
  if (key.startsWith('e:')) {
    const id = key.slice(2);
    const ev = data.evolutions[id];
    const w = ev && data.weapons[ev.weapon];
    if (!ev || !w) return null;
    const st = (k) => (w.stats && w.stats[k] && w.stats[k].name) || k;
    Object.assign(it, { kind: 'evo', title: ev.name, line: ev.codex, sub: `Recipe: ${st(ev.pair[0])} + ${st(ev.pair[1])} · ${CEL_WRITTEN}`, weapon: ev.weapon, color: w.color || it.color, cue: ev.cue || `evo_${id}`, gold: true });
    it.sr = `${CEL.remembers}: ${ev.name}, recipe ${st(ev.pair[0])} and ${st(ev.pair[1])}`;
    return it;
  }
  if (key.startsWith('c:')) {
    const id = key.slice(2);
    const title = Object.keys(TITLES).find((t) => (TITLES[t].weapon === id) || (TITLES[t].tab === id) || (TITLES[t].book && id === 'book'));
    const w = data.weapons[id];
    const name = w ? CEL.whole(`The ${w.name}`) : CEL.tabWhole[id] || '';
    if (!name) return null;
    Object.assign(it, { kind: 'whole', title: name, line: CEL.wholeLine[id] || '', weapon: w ? id : null, color: w ? w.color || it.color : '#ffd27a' });
    if (title) it.pills = [CEL.titlePill(TITLES[title].name), CEL.ornPill(TITLES[title].ornament)];
    it.sr = `${CEL.remembers}: ${name}${title ? `. ${CEL.titlePill(TITLES[title].name)}` : ''}`;
    return it;
  }
  // small: a name for the ledger line
  let name = '';
  if (key.startsWith('f:')) { const id = key.slice(2); const f = book.foes.find((x) => x.id === id); name = id === 'marks' ? 'Hollow marks' : f && f.name ? f.name : ''; }
  else if (key.startsWith('fp:')) { const [, id, page] = key.split(':'); const f = book.foes.find((x) => x.id === id); const p = f && f.pages.find((x) => x.page === page); name = f && p ? `${f.name}: ${p.label}` : ''; }
  else if (key.startsWith('h:')) { const h = book.heroes.find((x) => x.key === key); name = h ? h.name : ''; }
  else if (key.startsWith('n:')) { const n = book.nights.find((x) => x.key === key); name = n ? `${n.chapter}, ${n.name}` : ''; }
  else if (key.startsWith('l:')) { const l = book.lore.find((x) => x.key === key); name = l && l.title ? l.title : ''; }
  if (!name) return null;
  Object.assign(it, { kind: 'page', title: name, sr: `${CEL.remembers}: ${name}` });
  return it;
}
// -> { big: [items], medium: [items], small: [items], more: n (medium overflow + small beyond the ledger), tell: [keys to mark told], waiting: n (bigs held back) }
// won: false = a defeat (bigs are held for the title); place: 'results' | 'title' (title shows only held bigs)
export function queue(book, codex, data, { won = true, place = 'results' } = {}) {
  const told = bitsToSet(isObj(codex) ? codex.told : '');
  const fresh = [...book.unlocked].filter((k) => !told.has(k));
  const items = fresh.map((k) => itemFor(k, book, data)).filter(Boolean);
  const order = (a, b) => fresh.indexOf(a.key) - fresh.indexOf(b.key);
  const bigs = items.filter((i) => i.size === 'big').sort(order);
  const meds = items.filter((i) => i.size === 'medium').sort(order);
  const smalls = items.filter((i) => i.size === 'small').sort(order);
  const out = { big: [], medium: [], small: [], more: 0, tell: [], waiting: 0, names: [...meds, ...smalls].map((i) => i.title) };
  if (place === 'title') {
    out.big = bigs.slice(0, CAP.big);
    out.waiting = bigs.length - out.big.length;
    out.tell = out.big.map((i) => i.key);
    return out;
  }
  if (won) out.big = bigs.slice(0, CAP.big);
  out.waiting = bigs.length - out.big.length; // never lost: they stay untold and wait for the title
  out.medium = meds.slice(0, CAP.medium);
  out.small = smalls;
  out.more = Math.max(0, meds.length - out.medium.length) + Math.max(0, smalls.length - CAP.ledger);
  // overflow mediums fold into "+N more" (their NEW dot waits in the Almanac): told, so they never come back as cards
  out.tell = [...out.big, ...meds, ...smalls].map((i) => i.key);
  return out;
}

// The ledger line on the results card: "The Hollow remembers: A, B" + "+N more in the Almanac".
export function ledgerLine(q) {
  const names = q.names || [...q.medium, ...q.small].map((i) => i.title);
  const shown = names.slice(0, CAP.ledger);
  const extra = names.length - shown.length;
  if (!shown.length) return null;
  return { lead: `${CEL.remembers}: `, names: shown.join(', '), more: extra > 0 ? CEL.more(extra) : '' };
}
