// HUD-2: the level-up offer screen (design sheet #1, Direction A). Presentation only: all offer logic stays in the Sim.
// DOM is built with createElement + textContent only (no innerHTML, no data in markup). One render per offer; no per-frame work.
import { orderOffer, cardModel, clampText } from './cardview.js';
import { cardIcon } from './cardicons.js';

export const INPUT_LOCK_MS = 250; // ignore picks right after the screen opens (mis-tap guard, research 28)
export const TITLE_TEXT = 'The light stirs';
export const QUIET_LABEL = 'BLESSINGS · quiet gifts';
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class OfferView {
  // doc: document (or a test double). host: the overlay element. h: { pick(key), reroll(), banish(key) }
  constructor(doc, host, h) {
    this.doc = doc;
    this.host = host;
    this.h = h;
    this.cards = [];
    this.els = [];
    this.sel = 0;
    this.banishing = false;
    this.openAt = 0;
    this.sim = null;
  }

  el(tag, cls, text) {
    const n = this.doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  render(sim, data) {
    const d = this.doc;
    const { main, quiet, all } = orderOffer(sim.offer);
    this.sim = sim;
    this.cards = all;
    this.banishing = false;
    this.openAt = now();
    const maxRank = sim.balance.maxRank;
    const nm = main.length;
    const head = this.el('div', 'lu-head');
    head.append(this.el('h2', 'lu-title', TITLE_TEXT));
    this.sub = this.el('div', 'lu-sub');
    this.subText = `LEVEL ${sim.level} · CHOOSE ONE${sim.pending > 1 ? ` · +${sim.pending - 1} MORE` : ''}`;
    this.sub.textContent = this.subText;
    head.append(this.sub);

    const mainRow = this.el('div', 'lu-main cards');
    mainRow.style.setProperty('--n', String(Math.max(1, nm)));
    if (nm >= 5) mainRow.classList.add('many');
    const quietRow = this.el('div', 'lu-quiet');
    quietRow.style.setProperty('--n', String(Math.max(1, quiet.length)));
    this.els = [];
    all.forEach((c, i) => {
      const node = this.card(c, i, data, maxRank);
      this.els.push(node);
      (i < nm ? mainRow : quietRow).appendChild(node);
    });

    const foot = this.el('div', 'lu-foot');
    if (quiet.length) {
      const wrap = this.el('div', 'lu-quietwrap');
      wrap.style.setProperty('--n2', String(Math.min(3, quiet.length)));
      wrap.append(this.el('div', 'lu-qlabel', QUIET_LABEL), quietRow);
      foot.appendChild(wrap);
    }
    const actions = this.el('div', 'lu-actions');
    this.rerollBtn = null;
    this.banishBtn = null;
    if (sim.rerollsLeft > 0) {
      this.rerollBtn = this.pill('reroll', 'R', 'Reroll', sim.rerollsLeft);
      this.rerollBtn.addEventListener('click', () => this.h.reroll());
      actions.appendChild(this.rerollBtn);
    }
    if (sim.banishesLeft > 0) {
      this.banishBtn = this.pill('banish', 'B', 'Banish', sim.banishesLeft);
      this.banishBtn.setAttribute('aria-pressed', 'false');
      this.banishBtn.addEventListener('click', () => this.toggleBanish());
      actions.appendChild(this.banishBtn);
    }
    if (this.rerollBtn || this.banishBtn) foot.appendChild(actions);

    this.host.replaceChildren(head, mainRow, foot);
    this.host.classList.remove('banishing');
    this.setSel(0);
    return this.els;
  }

  pill(act, key, label, count) {
    const b = this.el('button', 'btn lu-btn');
    b.setAttribute('data-act', act);
    b.type = 'button';
    b.append(this.el('span', 'lu-kbd', key), this.el('span', 'lu-lbl', label), this.el('span', 'lu-cnt', `×${count}`));
    return b;
  }

  card(c, i, data, maxRank) {
    const m = cardModel(c, data, maxRank);
    const quiet = m.cls === 'blessing';
    const node = this.el('div', `card k-${c.kind} is-${m.cls}${m.cls === 'evolve' ? ' gold' : ''}${m.cls === 'stirs' ? ' stirs' : ''}${quiet ? ' quiet' : ''}`);
    node.setAttribute('data-key', m.key);
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.style.setProperty('--i', String(i));
    node.appendChild(this.el('span', 'c-key', String(i + 1)));
    if (m.tag) node.appendChild(this.el('span', `c-tag t-${m.cls}`, m.tag));
    const icon = this.el('div', 'c-icon');
    icon.appendChild(cardIcon(this.doc, c));
    node.appendChild(icon);
    node.appendChild(this.el('h4', 'c-title', m.title));
    if (quiet) {
      // Blessing chip: one quiet line "+3% move speed · 1/2" (rank after this pick)
      const rank = m.pips.total ? ` · ${m.pips.filled}/${m.pips.total}` : '';
      node.appendChild(this.el('div', 'c-unit', clampText(`${m.num} ${m.unit}`.trim() + rank, 34)));
    } else {
      if (m.num) node.appendChild(this.el('div', `c-num${m.num.length > 4 ? ' long' : ''}`, m.num));
      if (m.unit) node.appendChild(this.el('div', 'c-unit', m.unit));
    }
    if (m.pips.total > 0 && !quiet) {
      const p = this.el('div', 'c-pips');
      for (let k = 0; k < m.pips.total; k++) p.appendChild(this.el('i', k < m.pips.filled ? 'on' : k === m.pips.fresh ? 'fresh' : ''));
      if (m.pips.fresh >= 0 && m.pips.fresh < m.pips.filled) p.children[m.pips.fresh].className = 'on fresh';
      node.appendChild(p);
    }
    if (m.desc) node.appendChild(this.el('p', 'c-desc', m.desc));
    if (m.stirs) node.appendChild(this.el('div', 'c-stirs stirs-line', m.stirs));
    node.addEventListener('mouseenter', () => this.setSel(i));
    node.addEventListener('click', () => this.activate(i));
    return node;
  }

  // A pick or (in banish mode) a banish. Picks are ignored for a moment after the screen opens.
  activate(i) {
    const c = this.cards[i];
    if (!c) return false;
    if (this.banishing) {
      if (c.kind === 'evolution' || !this.sim || !(this.sim.banishesLeft > 0)) return false;
      this.h.banish(c.key);
      return true;
    }
    if (now() - this.openAt < INPUT_LOCK_MS) return false;
    this.h.pick(c.key);
    return true;
  }

  toggleBanish() {
    if (!this.banishBtn) return false;
    this.banishing = !this.banishing;
    this.banishBtn.classList.toggle('on', this.banishing);
    this.banishBtn.setAttribute('aria-pressed', this.banishing ? 'true' : 'false');
    this.host.classList.toggle('banishing', this.banishing);
    this.sub.textContent = this.banishing ? 'CHOOSE A CARD TO BANISH' : this.subText;
    return true;
  }

  setSel(i) {
    if (!this.els.length) return;
    this.sel = Math.max(0, Math.min(this.els.length - 1, i));
    this.els.forEach((e, k) => e.classList.toggle('sel', k === this.sel));
  }

  // Keys: 1-N pick (or banish), R reroll, B banish mode, arrows move, Enter picks. Returns true when handled.
  onKey(e) {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= this.cards.length) { e.preventDefault(); this.activate(n - 1); return true; }
    if (e.key === 'r' || e.key === 'R') { this.h.reroll(); return true; }
    if (e.key === 'b' || e.key === 'B') { this.toggleBanish(); return true; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); this.setSel(this.sel - 1); return true; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.setSel(this.sel + 1); return true; }
    if (e.key === 'Enter' && !(e.target && e.target.closest && e.target.closest('button'))) { e.preventDefault(); this.activate(this.sel); return true; }
    return false;
  }
}
