// HUD-2: the level-up offer screen (design sheet #1, Direction A). Presentation only: all offer logic stays in the Sim.
// U5: restyled to Lantern Glass, Lit (kit classes lg-card / lg-badge / lg-pips / lg-btn from kit.css; scoped overrides in cards.css). Behaviour is unchanged.
// DOM is built with createElement + textContent only (no innerHTML, no data in markup). One render per offer; no per-frame work.
import { orderOffer, cardModel, clampText, cardLabel } from './cardview.js';
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

  // note: optional plain whisper line under the title (the 'Unlocked in the Skill Tree' hint for a NEW card; it used to be a HUD toast hidden under this screen).
  render(sim, data, note = '') {
    const d = this.doc;
    const { main, quiet, all } = orderOffer(sim.offer);
    this.sim = sim;
    this.cards = all;
    this.banishing = false;
    this.openAt = now();
    const maxRank = sim.balance.maxRank;
    const nm = main.length;
    const cl = this.host.classList;
    cl.add('lg-kit');
    if (this.host.setAttribute) { this.host.setAttribute('role', 'dialog'); this.host.setAttribute('aria-modal', 'true'); this.host.setAttribute('aria-label', 'Level up: choose one'); }
    const act = this.doc.activeElement;
    const hadFocus = !!(act && this.host.contains && act !== this.host && this.host.contains(act)); // a keyboard user keeps their place after reroll/banish
    const head = this.el('div', 'lu-head');
    head.append(this.el('h2', 'lu-title', TITLE_TEXT));
    this.sub = this.el('div', 'lu-sub');
    this.subText = `LEVEL ${sim.level} · CHOOSE ONE${sim.pending > 1 ? ` · +${sim.pending - 1} MORE` : ''}`;
    this.sub.textContent = this.subText;
    head.append(this.sub);
    if (note) head.append(this.el('div', 'lu-note', clampText(note, 40)));

    const mainRow = this.el('div', 'lu-main cards lg-cardrow');
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
    if (hadFocus && this.els[0] && this.els[0].focus) this.els[0].focus({ preventScroll: true });
    return this.els;
  }

  pill(act, key, label, count) {
    const b = this.el('button', 'lg-btn lg-frame lg-btn--secondary lu-btn');
    b.setAttribute('data-act', act);
    b.setAttribute('aria-keyshortcuts', key);
    b.setAttribute('aria-label', `${label}, ${count} left`);
    b.type = 'button';
    const flame = this.el('span', 'lg-btn__flame');
    flame.setAttribute('aria-hidden', 'true');
    const kbd = this.el('kbd', 'lg-btn__key lu-kbd', key);
    kbd.setAttribute('aria-hidden', 'true');
    const text = this.el('span', 'lg-btn__text');
    text.append(this.el('span', 'lg-btn__label lu-lbl', label));
    b.append(flame, text, this.el('span', 'lu-cnt', `×${count}`), kbd);
    return b;
  }

  card(c, i, data, maxRank) {
    const m = cardModel(c, data, maxRank);
    const quiet = m.cls === 'blessing';
    const evolve = m.cls === 'evolve';
    // Blessings are quiet cream chips (no arch, no gold). Every other card is an arched lantern window; ONLY the evolution card gets the leadlight border (lg-lead).
    const frame = quiet ? '' : ` lg-card lg-frame${evolve ? ' lg-card--evolve lg-lead' : ''}`;
    const node = this.el('div', `card k-${c.kind} is-${m.cls}${evolve ? ' gold' : ''}${m.cls === 'stirs' ? ' stirs' : ''}${quiet ? ' quiet' : ''}${frame}`);
    node.setAttribute('data-key', m.key);
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', cardLabel(m));
    node.setAttribute('aria-keyshortcuts', String(i + 1));
    node.style.setProperty('--i', String(i));
    if (!quiet) { const eye = this.el('span', 'lg-eyelet lu-eyelet'); eye.setAttribute('aria-hidden', 'true'); node.appendChild(eye); }
    const key = this.el('kbd', 'c-key lg-btn__key lg-card__key', String(i + 1));
    key.setAttribute('aria-hidden', 'true');
    node.appendChild(key);
    if (evolve) {
      // wax seal + gold label (kit badge); the text node keeps the plain word EVOLVE
      const tag = this.el('span', 'c-tag t-evolve lg-badge lg-badge--evolve lg-card__badge');
      const seal = this.el('span', 'lg-badge__seal'); seal.setAttribute('aria-hidden', 'true');
      tag.append(seal, this.el('span', 'lg-badge__text', m.tag));
      node.appendChild(tag);
    } else if (m.cls === 'new') {
      node.appendChild(this.el('span', 'c-tag t-new lg-badge lg-badge--new lg-card__badge', m.tag));
    } else if (m.tag) node.appendChild(this.el('span', `c-tag t-${m.cls}`, m.tag));
    const icon = this.el('div', 'c-icon');
    icon.setAttribute('aria-hidden', 'true');
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
      const p = this.el('div', `c-pips lg-pips${evolve ? ' lg-pips--evolve' : ''}`);
      p.setAttribute('aria-hidden', 'true'); // the rank is part of the card's accessible name
      for (let k = 0; k < m.pips.total; k++) p.appendChild(this.el('i', `lg-pip${k < m.pips.filled ? ' on' : k === m.pips.fresh ? ' fresh' : ''}`));
      if (m.pips.fresh >= 0 && m.pips.fresh < m.pips.filled) p.children[m.pips.fresh].className = 'lg-pip on fresh';
      node.appendChild(p);
    }
    if (m.desc) node.appendChild(this.el('p', 'c-desc', m.desc));
    if (m.from) node.appendChild(this.el('div', 'c-from', m.from));
    if (m.stirs) node.appendChild(this.el('div', 'c-stirs stirs-line', m.stirs));
    node.addEventListener('mouseenter', () => this.setSel(i));
    node.addEventListener('focus', () => this.setSel(i)); // Tab / arrows and Enter agree on which card is chosen
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

  // focus: also move keyboard focus to the chosen card (arrow keys), so the focus ring and Enter agree.
  setSel(i, focus = false) {
    if (!this.els.length) return;
    this.sel = Math.max(0, Math.min(this.els.length - 1, i));
    this.els.forEach((e, k) => e.classList.toggle('sel', k === this.sel));
    const t = this.els[this.sel];
    if (focus && t && t.focus) t.focus({ preventScroll: true });
  }

  // Keys: 1-N pick (or banish), R reroll, B banish mode, arrows move, Enter picks. Returns true when handled.
  onKey(e) {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= this.cards.length) { e.preventDefault(); this.activate(n - 1); return true; }
    if (e.key === 'r' || e.key === 'R') { this.h.reroll(); return true; }
    if (e.key === 'b' || e.key === 'B') { this.toggleBanish(); return true; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); this.setSel(this.sel - 1, true); return true; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.setSel(this.sel + 1, true); return true; }
    if (e.key === 'Enter' && !(e.target && e.target.closest && e.target.closest('button'))) { e.preventDefault(); this.activate(this.sel); return true; }
    return false;
  }
}
