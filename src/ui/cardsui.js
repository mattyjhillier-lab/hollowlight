// HUD-2: the level-up offer screen (design sheet #1, Direction A). Presentation only: all offer logic stays in the Sim.
// U5: restyled to Lantern Glass, Lit (kit classes lg-card / lg-badge / lg-pips / lg-btn from kit.css; scoped overrides in cards.css). Behaviour is unchanged.
// DOM is built with createElement + textContent only (no innerHTML, no data in markup). One render per offer; no per-frame work.
import { actionOf, keyLabel } from '../input/keymap.js';
import { orderOffer, cardModel, clampText, cardLabel, peekLine } from './cardview.js';
import { cardIcon } from './cardicons.js';

export const INPUT_LOCK_MS = 250; // ignore picks right after the screen opens (mis-tap guard, research 28)
export const TITLE_TEXT = 'The light stirs';
export const QUIET_LABEL = 'Quiet gifts';
export const QUIET_WHISPER = 'Take one. They ask nothing.';
export const WHISPER_MAX = 48;
// T6 run-start offers (Hearth-key / Card Fan): their own title and line instead of 'The light stirs' / LEVEL n
export const START_COPY = {
  kindred: ['Kindred Start', 'Before the dusk · choose your second spirit'],
  favour: ['Favoured Spirit', 'Mark one spirit for this run'],
  blessing: ['Lantern Blessing', 'Start with one Blessing'],
  chestBless: ['Lantern Reliquary', 'The light inside · choose a Blessing'],
  siteBless: ['Hollow Places', 'The old light answers · choose a Blessing'], // map events v1 (Lantern Road 2 / far Hollow Knot) // EN8 chest choices (same screen, own title)
  chestStat: ['Lantern Reliquary', 'A free rank · choose one'],
};
export const PEEK_LABEL = 'Next';
export const DESC_MAX = 64;
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
  // teach (FM2, optional): { title, whisper, note, card: 'evolve' | 'stirs' | null } from the Whispers director: one line, in the whisper voice.
  render(sim, data, note = '', teach = null) {
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
    const start = sim.offer && Object.hasOwn(START_COPY, sim.offer.start) ? START_COPY[sim.offer.start] : null;
    if (this.host.setAttribute) { this.host.setAttribute('role', 'dialog'); this.host.setAttribute('aria-modal', 'true'); this.host.setAttribute('aria-label', start ? `${start[0]}: choose one` : 'Level up: choose one'); }
    const act = this.doc.activeElement;
    const hadFocus = !!(act && this.host.contains && act !== this.host && this.host.contains(act)); // a keyboard user keeps their place after reroll/banish
    const head = this.el('div', 'lu-head');
    head.append(this.el('h2', 'lu-title', start ? start[0] : TITLE_TEXT));
    this.sub = this.el('div', 'lu-sub');
    this.subText = start ? start[1].toUpperCase() : `LEVEL ${sim.level} · CHOOSE ONE${sim.pending > 1 ? ` · +${sim.pending - 1} MORE` : ''}`;
    this.sub.textContent = this.subText;
    head.append(this.sub);
    if (note) head.append(this.el('div', 'lu-note', clampText(note, 40)));

    const mainRow = this.el('div', 'lu-main cards lg-cardrow');
    mainRow.style.setProperty('--n', String(Math.max(1, nm)));
    if (nm >= 5) mainRow.classList.add('many');
    const quietRow = this.el('div', 'lu-quiet');
    quietRow.style.setProperty('--n', String(Math.max(1, quiet.length)));
    this.els = [];
    this.clsList = [];
    all.forEach((c, i) => {
      const node = this.card(c, i, data, maxRank);
      this.els.push(node);
      (i < nm ? mainRow : quietRow).appendChild(node);
    });
    if (teach && typeof teach === 'object') {
      // the line sits under the title (cards have fixed heights: a line inside one crowds its text); the card it is about gets a soft gold outline
      const at = teach.card ? this.clsList.indexOf(teach.card) : -1;
      if (at >= 0 && this.els[at].classList) {
        this.els[at].classList.add('is-taught');
        const lab = this.els[at].getAttribute ? this.els[at].getAttribute('aria-label') : '';
        if (this.els[at].setAttribute) this.els[at].setAttribute('aria-label', `${lab}. ${clampText(teach.whisper, 80)}`);
      }
      {
        const t = this.el('div', 'lu-teach');
        if (teach.title) t.append(this.el('span', 'lu-teach__t', clampText(teach.title, 48)));
        if (teach.whisper) t.append(this.el('span', 'lu-teach__w', clampText(teach.whisper, 80)));
        if (teach.note) t.append(this.el('span', 'lu-teach__note', clampText(teach.note, 40)));
        head.append(t);
        if (this.host.setAttribute) this.host.setAttribute('aria-description', [teach.title, teach.whisper].filter(Boolean).join('. '));
      }
    } else if (this.host.removeAttribute) this.host.removeAttribute('aria-description');

    const foot = this.el('div', 'lu-foot');
    if (quiet.length) {
      const wrap = this.el('div', 'lu-quietwrap');
      wrap.style.setProperty('--n2', String(Math.min(3, quiet.length)));
      const ql = this.el('div', 'lu-qlabel');
      ql.append(this.el('span', 'lu-qtitle', QUIET_LABEL), this.el('span', 'lu-qwhisper', QUIET_WHISPER));
      wrap.append(ql, quietRow);
      foot.appendChild(wrap);
    }
    const actions = this.el('div', 'lu-actions');
    this.rerollBtn = null;
    this.banishBtn = null;
    if (!start && sim.rerollsLeft > 0) { // a run-start offer cannot be rerolled or banished (T6)
      this.rerollBtn = this.pill('reroll', keyLabel('reroll'), 'Reroll', sim.rerollsLeft);
      this.rerollBtn.addEventListener('click', () => this.h.reroll());
      actions.appendChild(this.rerollBtn);
    }
    if (!start && sim.banishesLeft > 0) {
      this.banishBtn = this.pill('banish', keyLabel('banish'), 'Banish', sim.banishesLeft);
      this.banishBtn.setAttribute('aria-pressed', 'false');
      this.banishBtn.addEventListener('click', () => this.toggleBanish());
      actions.appendChild(this.banishBtn);
    }
    if (this.rerollBtn || this.banishBtn) foot.appendChild(actions);
    // Second Sight: the next offer, dimmed, under this one (display only; the sim keeps it unless a pick removes a card)
    const pl = !start && sim.peekNext ? peekLine(sim.peekNext, data, maxRank) : '';
    if (pl) {
      const peek = this.el('div', 'lu-peek');
      peek.append(this.el('span', 'lu-plabel', PEEK_LABEL), this.el('span', 'lu-ptext', pl));
      foot.appendChild(peek);
    }

    this.host.replaceChildren(...(nm ? [head, mainRow, foot] : [head, foot]));
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
    if (this.clsList) this.clsList.push(m.cls);
    const quiet = m.cls === 'blessing';
    const evolve = m.cls === 'evolve';
    // Blessings are quiet cream chips (no arch, no gold). Every other card is an arched lantern window; ONLY the evolution card gets the leadlight border (lg-lead).
    const frame = quiet ? '' : ` lg-card lg-frame${evolve ? ' lg-card--evolve lg-lead' : ''}`;
    const node = this.el('div', `card k-${c.kind} is-${m.cls}${evolve ? ' gold' : ''}${m.cls === 'stirs' ? ' stirs' : ''}${quiet ? ' quiet' : ''}${frame}`);
    node.setAttribute('data-key', m.key);
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', cardLabel(m));
    const pickKey = keyLabel(`pick${i + 1}`); // A3: the remapped pick key ('' when the player left it without a key)
    if (pickKey) node.setAttribute('aria-keyshortcuts', pickKey);
    node.style.setProperty('--i', String(i));
    if (!quiet) { const eye = this.el('span', 'lg-eyelet lu-eyelet'); eye.setAttribute('aria-hidden', 'true'); node.appendChild(eye); }
    const key = this.el('kbd', 'c-key lg-btn__key lg-card__key', pickKey);
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
      // effect-first line (what the Blessing DOES) + rank; the compact number line is kept for the tight landscape strip (CSS swaps them)
      const unit = this.el('div', 'c-unit');
      const ed = clampText(c.desc, DESC_MAX);
      unit.append(this.el('span', 'u-long', ed ? ed + rank : clampText(`${m.num} ${m.unit}`.trim() + rank, 34)), this.el('span', 'u-short', clampText(`${m.num} ${m.unit}`.trim() + rank, 34)));
      node.appendChild(unit);
      const bd = data && data.blessings && data.blessings.items && Object.hasOwn(data.blessings.items, c.blessId) ? data.blessings.items[c.blessId] : null;
      const wh = bd && typeof bd.whisper === 'string' ? clampText(bd.whisper, WHISPER_MAX) : '';
      if (wh) node.appendChild(this.el('div', 'c-whisper', wh));
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
    const act = actionOf(e); // A3: keys from Settings > Controls (defaults 1-6, R, B)
    const n = act && act.startsWith('pick') ? Number(act.slice(4)) : 0;
    if (n >= 1 && n <= this.cards.length) { e.preventDefault(); this.activate(n - 1); return true; }
    if (act === 'reroll') { this.h.reroll(); return true; }
    if (act === 'banish') { this.toggleBanish(); return true; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); this.setSel(this.sel - 1, true); return true; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.setSel(this.sel + 1, true); return true; }
    if (e.key === 'Enter' && !(e.target && e.target.closest && e.target.closest('button'))) { e.preventDefault(); this.activate(this.sel); return true; }
    return false;
  }
}
