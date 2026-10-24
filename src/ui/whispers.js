// FM1-FM3 Lantern whispers (docs/design/first-minute-v1.md, LOCKED 2026-10-24 'FIRST MINUTE'). Pure JS, no DOM, no Phaser:
// the ladder state, triggers, queue, per-lantern bits and the copy. Reads a plain view built from sim state; never touches the sim or its RNG.
// Bits live in the lantern's save (save.hints, a small integer; unknown bits are dropped by cleanHints).

export const HINT = { started: 0, move: 1, gems: 2, ability: 3, heart: 4, magnet: 5, chest: 6, lowhp: 7, reroll: 8, offer: 9, stirs: 10, evolve: 11, full: 12 };
export const HINT_COUNT = 13;
export const HINT_MASK = (1 << HINT_COUNT) - 1;
/** Validated hint bits from untrusted save data: a non-negative safe integer, masked to the known bits; anything else is 0. */
export function cleanHints(v) { return Number.isSafeInteger(v) && v >= 0 ? (v & HINT_MASK) : 0; }
export const hasBit = (bits, id) => Object.hasOwn(HINT, id) && ((cleanHints(bits) >>> HINT[id]) & 1) === 1;
export const withBit = (bits, id) => (Object.hasOwn(HINT, id) ? (cleanHints(bits) | (1 << HINT[id])) & HINT_MASK : cleanHints(bits));
/** 'Show tips again': every step forgotten, the ladder switched on again. */
export const TIPS_AGAIN = 1 << HINT.started;
/** The ladder runs only for a lantern that began fresh after whispers existed (or after Show tips again): veterans are never taught. */
export const ladderOn = (bits) => hasBit(bits, 'started');
/** Called at run start: a lantern's very first run switches its ladder on. */
export function startBits(bits, runs) { const b = cleanHints(bits); return (runs | 0) === 0 && b === 0 ? TIPS_AGAIN : b; }

// ---------------------------------------------------------------- copy (plain text; the plate draws it with textContent)
// parts: [{key:'W'} | {text:'...'}]; sr: the line the screen reader hears once.
const HERO_TAP = { wren: 'the wolf', elias: 'the candle' };
const HERO_WHISPER = { wren: 'Your wolves rush in together. It recharges.', elias: 'Stand in the ring of light to heal. It recharges.' };
export const COPY = {
  move: {
    kb: [{ key: 'W' }, { key: 'A' }, { key: 'S' }, { key: 'D' }, { text: ' or arrows to walk' }],
    touch: [{ text: 'Drag on the left side to walk' }], // the stick starts only in the left 55% (src/input/touch.js ZONE_FRAC); the sheet's 'anywhere' was not true
    w: 'Your spirits fight for you. Keep moving.',
  },
  gems: { kb: [{ text: 'Walk over spirit-light to grow' }], w: 'Each mote fills the thread.' },
  lowhp: { kb: [{ text: 'Your flame is low' }], w: 'Back away from the pack; hearts fall from the Husks.' },
  pickup: { heart: 'Hearts mend the flame.', magnet: 'The magnet calls every mote home.', chest: 'Strong foes guard the best gifts.' },
  offer: { t: 'Your light grows', w: 'Pick one. Each card makes a spirit stronger.', note: 'Dots = rank, 5 is the most' },
  stirs: { w: 'Something stirs: max this and its partner to wake an evolution.' },
  evolve: { t: 'Evolution', w: 'Your spirit changes its nature. One per weapon.' },
  full: { w: 'Your hands are full: now your spirits grow.' },
  reroll: { w: 'Spend them; they come back each night.' },
  skipKb: 'Tab: hide tips',
  skipTouch: 'Tap to hide',
};

const clip = (s, n) => { s = String(s == null ? '' : s); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
export const partsText = (parts) => parts.map((p, i) => (p.key ? `${i > 0 && parts[i - 1].key ? ' ' : ''}${p.key}` : p.text)).join('').trim();
const srOf = (parts, w) => `${partsText(parts)}. ${w}`;

/** One plate's content for a ladder step. hero: {id, ability} (ability = the sim's ability name); input 'kb' | 'touch'. */
export function plateFor(id, input, hero = {}) {
  const touch = input === 'touch';
  const name = clip(hero.ability || 'your ability', 28);
  let parts, w;
  if (id === 'move') { parts = touch ? COPY.move.touch : COPY.move.kb; w = COPY.move.w; } else if (id === 'gems') { parts = COPY.gems.kb; w = COPY.gems.w; } else if (id === 'lowhp') { parts = COPY.lowhp.kb; w = COPY.lowhp.w; } else if (id === 'ability') {
    parts = touch ? [{ text: `Tap ${HERO_TAP[hero.id] || 'the glowing button'}: ${name}` }] : [{ text: 'Press ' }, { key: 'SPACE' }, { text: `: ${name}` }];
    w = HERO_WHISPER[hero.id] || 'It recharges after each use.';
  } else return null;
  return { id, parts, w, sr: srOf(parts, w), skip: touch ? COPY.skipTouch : COPY.skipKb, ring: id === 'ability', ghost: id === 'move' && touch };
}

// ---------------------------------------------------------------- the ladder director
const ORDER = ['move', 'gems', 'ability', 'lowhp'];
export const DUR = { move: 8, gems: 6, ability: 8, lowhp: 5 };
export const MOVE_NEED = 1.5; // seconds of walking that end the move plate
export const MOVE_AT = 0.8; // run seconds before the first plate
export const GAP = 0.6; // quiet seconds between two plates
export const ABILITY_REPEAT = 15; // an unused ability plate comes back once, this long after it timed out (still ready, still unused)

/**
 * update(dt, v) each rendered frame. v (built by the app from sim state, read-only):
 *   { live: run running and nothing over it, t: sim seconds, moving: bool, gemNear: bool, gems: gems taken, ready: ability ready, uses: ability uses, hp: 0..1, busy: a toast / banner is up }
 * Returns the plate to show (same object while it stays) or null. `bits` changes when a plate is shown (persist when `dirty`).
 */
export class Whispers {
  constructor({ bits = 0, tips = true, input = 'kb', hero = {} } = {}) {
    this.bits = cleanHints(bits);
    this.tips = !!tips;
    this.input = input === 'touch' ? 'touch' : 'kb';
    this.hero = { id: typeof hero.id === 'string' ? hero.id : '', ability: typeof hero.ability === 'string' ? hero.ability : '' };
    this.cur = null; // { id, age, start: {gems, uses}, plate }
    this.pending = new Set();
    this.gap = 0;
    this.moveAcc = 0;
    this.abilityRepeat = -1; // seconds until the repeat (once), -1 = none
    this.repeated = false;
    this.repeatUses = 0;
    this.dirty = false;
  }

  on() { return this.tips && ladderOn(this.bits); }
  want(id) { return this.on() && !hasBit(this.bits, id) && !this.pending.has(id) && !(this.cur && this.cur.id === id); }

  setInput(input) {
    const i = input === 'touch' ? 'touch' : 'kb';
    if (i === this.input) return false;
    this.input = i;
    if (this.cur) this.cur.plate = plateFor(this.cur.id, i, this.hero);
    return !!this.cur;
  }

  /** Tab / a tap on the plate: hide the current one (it counts as seen). */
  hide() { if (!this.cur) return false; this.cur = null; this.gap = GAP; this.abilityRepeat = -1; return true; }

  update(dt, v) {
    dt = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.25)) : 0;
    if (!this.tips) { this.cur = null; return null; }
    if (!v || !v.live) return this.cur ? this.cur.plate : null; // paused / an offer is open: the plate's thread does not burn
    if (v.moving) this.moveAcc += dt;
    // triggers (each at most once per lantern)
    if (v.t >= MOVE_AT && this.want('move')) this.pending.add('move');
    if (v.gemNear && this.want('gems')) this.pending.add('gems');
    if (v.ready && this.want('ability')) this.pending.add('ability');
    if (v.hp > 0 && v.hp < 0.3 && this.want('lowhp')) this.pending.add('lowhp');
    if (this.abilityRepeat > 0) {
      this.abilityRepeat -= dt;
      if (this.abilityRepeat <= 0) { this.abilityRepeat = -1; if (v.ready && (v.uses | 0) === this.repeatUses && !this.cur) { this.repeated = true; this.open('ability', v, true); } }
    }
    // the current plate
    const c = this.cur;
    if (c) {
      c.age += dt;
      const done = (c.id === 'move' && this.moveAcc >= MOVE_NEED) || (c.id === 'gems' && (v.gems | 0) > c.start.gems)
        || (c.id === 'ability' && (v.uses | 0) > c.start.uses) || (c.id === 'lowhp' && v.hp >= 0.3);
      if (done || c.age >= DUR[c.id]) {
        if (c.id === 'ability' && !done && !this.repeated) { this.abilityRepeat = ABILITY_REPEAT; this.repeatUses = v.uses | 0; }
        this.cur = null; this.gap = GAP;
      }
      if (this.cur) return this.cur.plate;
    }
    if (this.gap > 0) { this.gap -= dt; return null; }
    if (v.busy) return null; // a toast or banner is up: the next plate waits
    for (const id of ORDER) {
      if (!this.pending.has(id)) continue;
      this.pending.delete(id);
      // a trigger that is already satisfied is skipped (walked enough already, ability already used, HP back up)
      if (id === 'move' && this.moveAcc >= MOVE_NEED) { this.mark(id); continue; }
      if (id === 'lowhp' && !(v.hp > 0 && v.hp < 0.3)) continue;
      if (id === 'ability' && !v.ready) { this.pending.add(id); continue; }
      return this.open(id, v, false);
    }
    return null;
  }

  open(id, v, repeat) {
    this.mark(id);
    this.cur = { id, age: 0, start: { gems: v.gems | 0, uses: v.uses | 0 }, plate: plateFor(id, this.input, this.hero), repeat };
    return this.cur.plate;
  }

  mark(id) { const b = withBit(this.bits, id); if (b !== this.bits) { this.bits = b; this.dirty = true; } }

  /** HUD toast whisper line for a pickup (heart / magnet / chest), once per lantern. Returns the line or ''. */
  pickup(kind) {
    if (!['heart', 'magnet', 'chest'].includes(kind) || !this.on() || hasBit(this.bits, kind)) return '';
    this.mark(kind);
    return COPY.pickup[kind];
  }

  /**
   * The one teaching line for a level-up offer (or null). o: { start: run-start offer, classes: card classes ('evolve'|'stirs'|'new'|...),
   * weaponCard: any new-weapon card, full: all weapon slots taken, rerolls, banishes }. Evolution > stirs > reroll > first offer > slots full.
   */
  offer(o) {
    if (!this.tips || !o || o.start) return null;
    const cls = Array.isArray(o.classes) ? o.classes : [];
    const lad = this.on();
    const pick = (id, t) => { this.mark(id); return { id, ...t }; };
    if (lad && cls.includes('evolve') && !hasBit(this.bits, 'evolve')) return pick('evolve', { title: COPY.evolve.t, whisper: COPY.evolve.w, card: 'evolve' });
    if (lad && cls.includes('stirs') && !hasBit(this.bits, 'stirs')) return pick('stirs', { title: '', whisper: COPY.stirs.w, card: 'stirs' });
    if (((o.rerolls | 0) > 0 || (o.banishes | 0) > 0) && !hasBit(this.bits, 'reroll')) return pick('reroll', { title: rerollTitle(o, this.input), whisper: COPY.reroll.w, card: null });
    if (lad && !hasBit(this.bits, 'offer')) return pick('offer', { title: COPY.offer.t, whisper: COPY.offer.w, note: this.input === 'kb' ? COPY.offer.note : '', card: null });
    if (lad && o.full && !o.weaponCard && !hasBit(this.bits, 'full')) return pick('full', { title: '', whisper: COPY.full.w, card: null });
    return null;
  }
}

export function rerollTitle(o, input) {
  const r = (o.rerolls | 0) > 0, b = (o.banishes | 0) > 0;
  if (input === 'touch') return r ? 'Tap Reroll for new cards' : 'Tap Banish, then a card';
  return [r ? 'R: new cards' : '', b ? 'B then a number: banish' : ''].filter(Boolean).join('  ·  ');
}

// ---------------------------------------------------------------- FM3 results teaching (first death / second death / first win)
export const RESULT_COPY = {
  firstDeath: { t: 'Your gold is safe', w: 'Spend it in the Lantern Web: every lantern you light makes the next night easier.' },
  secondDeath: (gold, name) => ({ t: 'Ready to light', w: `You have ${gold} gold: enough for ${name}.` }),
  firstWin: { t: 'Dawn', w: 'The Hollow remembers. Harder nights wait in the Lantern Web.' },
};

/**
 * What the results card teaches after banking (stats are the banked, sanitised stats). cheapest: {name, gold} of the cheapest lantern the
 * player can light now, or null. Returns {kind, title, whisper, primaryTree} or null.
 */
export function resultTeach({ won, stats, treeOwned, cheapest, gold }) {
  const runs = stats && Number.isFinite(stats.runs) ? stats.runs : 0, wins = stats && Number.isFinite(stats.wins) ? stats.wins : 0;
  const deaths = Math.max(0, runs - wins);
  if (won) return wins === 1 ? { kind: 'firstWin', title: RESULT_COPY.firstWin.t, whisper: RESULT_COPY.firstWin.w, primaryTree: false } : null;
  if (deaths === 1) return { kind: 'firstDeath', title: RESULT_COPY.firstDeath.t, whisper: RESULT_COPY.firstDeath.w, primaryTree: true };
  if (deaths === 2 && !treeOwned && cheapest && typeof cheapest.name === 'string' && cheapest.name) {
    const c = RESULT_COPY.secondDeath(Math.max(0, Math.floor(Number(gold) || 0)), clip(cheapest.name, 40));
    return { kind: 'secondDeath', title: c.t, whisper: c.w, primaryTree: false };
  }
  return null;
}
