// Results screen (U6) in Lantern Glass, Lit: a fixed one-screen layout (flexible body + a bottom action bar that never scrolls), a dimmed-but-lit brass lantern,
// time survived with a moon arc to dawn, chips, banked gold and shards that count up, the top-3 damage shares, one unlock nudge, and Again / Main menu / Tree.
// createElement + textContent only; hostile strings stay inert. View data comes from resultscopy.resultsView().
import { el, kitRoot, panel, button, icon, badge } from './kit.js';
import { mk, emblem, EMBLEM_OF, lantern } from './hudsvg.js';
import { RES, resultsSummary, countAt, group } from './resultscopy.js';

export const INPUT_LOCK_MS = 250;       // keys right after the screen appears are ignored (a mashed Space or R from the run must not restart it)
export const COUNT_MS = 900;
const DROP_ORDER = ['weapons', 'nudge', 'arcl', 'line'];   // short screens drop the lowest-priority rows first instead of scrolling
const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const nowMs = () => (globalThis.performance && globalThis.performance.now ? globalThis.performance.now() : Date.now());

function weaponEmblem(id) {
  const doc = globalThis.document;
  return mk(doc, 'svg', { viewBox: '-26 -26 52 52', class: 'u6-emb', 'aria-hidden': 'true', focusable: 'false' }, [emblem(doc, EMBLEM_OF[id] || 'sanctuary', 44)]);
}

/** A number that counts up on screen but exposes only its final value to assistive tech. */
function countNode(prefix, target, cls) {
  const wrap = el('span', `u6-val ${cls || ''}`.trim());
  const vis = el('span', 'u6-cnt', `${prefix}${group(target)}`, { 'aria-hidden': 'true' });
  const sr = el('span', 'u6-sr', `${prefix}${group(target)}`);
  add(wrap, vis, sr);
  return { wrap, vis, target, prefix };
}

/**
 * opts: { view, reduced, onAgain, onMenu, onTree, raf?, now? }.
 * Returns { root, again, menu, tree, mounted(), onKey(e), destroy(), fit(), counters }.
 */
export function buildResults({ view, reduced = false, onAgain, onMenu, onTree, raf, now = nowMs } = {}) {
  const v = view;
  const root = kitRoot({ calm: !!reduced });
  root.classList.add('u6-wrap', v.won ? 'is-won' : 'is-lost');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', RES.region);
  const live = globalThis.document;

  // ---- left: lantern, kicker, title, line, bark
  const lamp = lantern(live);
  lamp.svg.setAttribute('class', 'u6-lamp');
  // Defeat: the flame is small but lit and the pool of light is dim; victory: full flame and a wide warm pool.
  lamp.flame.setAttribute('transform', v.won ? 'translate(0,13) scale(0.8)' : 'translate(0,13) scale(0.4)');
  lamp.glow.setAttribute('opacity', v.won ? '1' : '0.45');
  const hero = el('section', 'u6-hero');
  add(hero, lamp.svg);
  const txt = el('div', 'u6-herotext');
  add(txt, el('div', 'u6-kicker ty-kicker', v.kicker), el('h2', 'u6-title', v.title), el('p', 'u6-line', v.line, { 'data-drop': 'line' }));
  if (v.bark) add(txt, el('p', 'u6-bark', `“${v.bark}” ${v.heroName}`.trim()));
  add(hero, txt);

  // ---- right: the summary panel
  const body = [];
  const put = (n) => { if (n) body.push(n); };
  const timeRow = el('div', 'u6-time');
  add(timeRow, el('span', 'u6-timeval', v.time), el('span', 'u6-timelab ty-kicker', v.timeLabel));
  const near = el('p', 'u6-near');
  for (const s of v.near) add(near, s.b ? el('b', null, s.t) : el('span', null, s.t));
  const arc = el('div', 'u6-arc', null, { role: 'img', 'aria-label': `${RES.arcLabel}: ${v.time}` });
  const arcFill = el('i', 'u6-arc__fill');
  add(arc, arcFill);
  if (v.arc.boss != null) { const m = el('em', 'u6-arc__boss', null, { 'aria-hidden': 'true' }); m.style.left = `${(v.arc.boss * 100).toFixed(1)}%`; add(arc, m); }
  const moon = el('u', 'u6-arc__moon', null, { 'aria-hidden': 'true' });
  add(arc, moon);
  const arcl = el('div', 'u6-arcl', null, { 'data-drop': 'arcl', 'aria-hidden': 'true' });
  add(arcl, el('span', null, RES.dusk), el('span', 'u6-arcl__mid', v.arc.boss != null ? v.arc.bossLabel : ''), el('span', null, v.arc.dawnLabel));
  put(add(el('div', 'u6-timeblk'), timeRow, near, arc, arcl));

  const chip = (label, valueNode, cls) => add(el('div', `u6-chip ${cls || ''}`.trim()), el('span', 'u6-chip__lab ty-kicker', label), valueNode);
  const evo = v.chips.evolved ? String(v.chips.evolved) : RES.chips.none;
  const chips = add(el('div', 'u6-chips'),
    chip(RES.chips.level, el('span', 'u6-chip__val', String(v.chips.level))),
    chip(RES.chips.slain, el('span', 'u6-chip__val', group(v.chips.slain))),
    chip(RES.chips.evolved, el('span', `u6-chip__val${v.chips.evolved ? ' is-evo' : ' is-none'}`, evo, v.chips.evolvedNames ? { title: v.chips.evolvedNames } : null)));
  put(chips);

  const counters = [];
  const b = v.bank;
  const goldN = countNode('+', b.gold, 'u6-gold');
  const shardN = countNode('+', b.shards, 'u6-shards');
  counters.push(goldN, shardN);
  const goldVal = add(el('span', 'u6-chip__val u6-bankval'), el('span', 'u6-coin', null, { 'aria-hidden': 'true' }), goldN.wrap);
  const shardVal = add(el('span', 'u6-chip__val u6-bankval'), icon('shard'), shardN.wrap);
  const goldChip = chip(RES.bank.gold, goldVal, 'u6-bank');
  const shardChip = chip(RES.bank.shards, shardVal, 'u6-bank');
  if (b.goldTotal != null) {
    add(goldChip, el('span', 'u6-chip__sub', `${RES.bank.total} ${group(b.goldTotal)}`));
    add(shardChip, el('span', 'u6-chip__sub', `${b.bossBonus ? `${RES.bank.bossBonus} · ` : ''}${RES.bank.total} ${group(b.shardsTotal)}`));
  }
  put(add(el('div', 'u6-chips u6-chips--bank'), goldChip, shardChip));
  if (b.note) put(el('p', 'u6-note', b.note));
  else if (v.debug) put(el('p', 'u6-note', RES.debug));

  if (v.weapons.length) {
    const ul = el('ul', 'u6-weps', null, { 'aria-label': RES.weaponsLabel, 'data-drop': 'weapons' });
    const fills = [];
    for (const w of v.weapons) {
      const li = el('li', `u6-wep${w.evo ? ' is-evo' : ''}`);
      const nm = el('span', 'u6-wep__name');
      add(nm, el('span', null, w.name));
      if (w.evo) add(nm, icon('star'));
      const bar = el('span', 'u6-bar', null, { 'aria-hidden': 'true' });
      const fill = el('i', null);
      fill.style.width = '0%';
      add(bar, fill);
      fills.push([fill, w.pct]);
      add(li, weaponEmblem(w.id), nm, bar, el('span', 'u6-wep__pc', `${w.pct}%`));
      add(ul, li);
    }
    put(ul);
    root._fills = fills;
  }

  if (v.nudge) {
    const n = v.nudge;
    const row = el('div', `u6-nudge is-${n.kind}`, null, { 'data-drop': 'nudge' });
    if (n.kind === 'new') {
      add(row, add(el('p', 'u6-nudge__line'), badge({ kind: 'new', text: 'NEW' }), el('span', 'u6-nudge__text', n.text), n.more > 0 ? el('span', 'u6-nudge__more', `+${n.more}`) : null));
    } else {
      const bar = el('span', 'u6-bar', null, { role: 'img', 'aria-label': `${Math.floor(n.frac * 100)}%` });
      const fill = el('i', null);
      fill.style.width = '0%';
      add(bar, fill);
      (root._fills = root._fills || []).push([fill, Math.round(n.frac * 100)]);
      add(row, add(el('p', 'u6-nudge__line'), el('span', 'u6-nudge__lab', `${RES.nudge.closest}: `), el('b', null, n.name), el('span', 'u6-nudge__text', ` · ${n.text}`)), bar);
    }
    put(row);
  }

  const sum = panel({ label: resultsSummary(v), body, variant: v.won ? 'dawn' : undefined, cap: false });
  sum.classList.add('u6-panel');

  // ---- bottom action bar (never scrolls)
  let used = false;
  let shownAt = now();
  const guarded = (fn) => (ev) => {
    if (used) return;
    // A keyboard-made click (detail 0) in the first moments is a leftover key from the run, not a decision.
    if (ev && ev.detail === 0 && now() - shownAt < INPUT_LOCK_MS) return;
    used = true;
    if (fn) fn();
  };
  const again = button({ label: RES.again.label, hint: RES.again.hint, variant: 'primary', onClick: guarded(onAgain) });
  const menu = button({ label: RES.menu.label, hint: RES.menu.hint, onClick: guarded(onMenu) });
  const tree = button({ label: RES.tree.label, hint: RES.tree.hint, onClick: guarded(onTree) });
  again.classList.add('u6-btn', 'u6-btn--again');
  menu.classList.add('u6-btn', 'u6-btn--menu');
  tree.classList.add('u6-btn', 'u6-btn--tree');
  if (v.treeDot) {
    const lab = tree.querySelector ? tree.querySelector('.lg-btn__label') : null;
    const dot = el('span', 'u6-dot', null, { 'aria-hidden': 'true' });
    const sr = el('span', 'u6-sr', `, ${RES.tree.newSr}`);
    add(lab || tree, dot, sr);
    tree.classList.add('has-new');
  }
  const acts = el('nav', 'u6-acts', null, { 'aria-label': 'Next' });
  add(acts, menu, again, tree);

  const main = el('div', 'u6-main');
  add(main, hero, sum);
  add(root, main, acts);

  // ---- behaviour
  const ids = { raf: null, ro: null, timer: null, onResize: null };
  const rafFn = raf || (globalThis.requestAnimationFrame ? (f) => globalThis.requestAnimationFrame(f) : (f) => setTimeout(() => f(now()), 16));
  const cancelFn = globalThis.cancelAnimationFrame ? (h) => globalThis.cancelAnimationFrame(h) : (h) => clearTimeout(h);
  let dead = false;

  const setArc = (k) => { const p = `${(k * 100).toFixed(1)}%`; arcFill.style.width = p; moon.style.left = p; };
  const finish = () => {
    for (const c of counters) c.vis.textContent = `${c.prefix}${group(c.target)}`;
    setArc(v.arc.frac);
    for (const [f, pct] of root._fills || []) f.style.width = `${pct}%`;
  };

  function fit() {
    if (!root.querySelectorAll) return;
    const hidden = [];
    const rows = root.querySelectorAll('[data-drop]');
    for (const r of rows) r.hidden = false;
    const over = () => main.scrollHeight > main.clientHeight + 1 || sum.scrollHeight > sum.clientHeight + 1 || hero.scrollHeight > hero.clientHeight + 1;
    for (const key of DROP_ORDER) {
      if (!over()) break;
      for (const r of rows) if (r.getAttribute('data-drop') === key) { r.hidden = true; hidden.push(key); }
    }
    root.setAttribute('data-dropped', hidden.join(' '));
    return hidden;
  }

  function mounted() {
    shownAt = now();
    if (reduced) { finish(); } else {
      const t0 = shownAt;
      const tick = (t) => {
        if (dead) return;
        const k = Math.min(1, ((typeof t === 'number' ? t : now()) - t0) / COUNT_MS);
        for (const c of counters) c.vis.textContent = `${c.prefix}${group(countAt(c.target, k))}`;
        setArc(v.arc.frac * (1 - (1 - k) ** 3));
        for (const [f, pct] of root._fills || []) f.style.width = `${(pct * (1 - (1 - k) ** 3)).toFixed(1)}%`;
        if (k < 1) ids.raf = rafFn(tick); else finish();
      };
      setArc(0);
      ids.raf = rafFn(tick);
    }
    fit();
    if (globalThis.addEventListener) { ids.onResize = () => fit(); globalThis.addEventListener('resize', ids.onResize); }
    if (globalThis.ResizeObserver) { ids.ro = new globalThis.ResizeObserver(() => fit()); ids.ro.observe(main); }
    if (again.focus) again.focus({ preventScroll: true });
  }

  /** Returns true when the key was used. Native button activation (Enter / Space on a focused button) is left alone. */
  function onKey(e) {
    if (used || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return false;
    if (now() - shownAt < INPUT_LOCK_MS) return false;
    const k = e.key;
    const a = globalThis.document && globalThis.document.activeElement;
    const onBtn = !!(a && a.closest && a.closest('.lg-btn'));
    if (k === 'r' || k === 'R') { e.preventDefault(); again.click(); return true; }
    if (k === 'Enter' && !onBtn) { e.preventDefault(); again.click(); return true; }
    if (k === 'Escape') { e.preventDefault(); menu.click(); return true; }
    if (k === 't' || k === 'T') { e.preventDefault(); tree.click(); return true; }
    return false;
  }

  function destroy() {
    dead = true;
    if (ids.raf != null) cancelFn(ids.raf);
    if (ids.ro) ids.ro.disconnect();
    if (ids.onResize && globalThis.removeEventListener) globalThis.removeEventListener('resize', ids.onResize);
  }

  return { root, again, menu, tree, main, panel: sum, hero, mounted, onKey, destroy, fit, counters, isUsed: () => used, setShownAt: (t) => { shownAt = t; } };
}
