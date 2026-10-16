// HUD-2: pure view-model helpers for the level-up cards (no DOM, no Phaser; unit-testable in Node).
// Rules: display only. A card never names an evolution recipe: stat cards show their own stat and weapon only.
import { statValue, formatValue } from '../sim/cards.js';

export const CLAMP = { title: 26, unit: 24, tag: 20, desc: 96, num: 7, stirs: 24, from: 30, label: 220 };
export const COUNT_KEYS = new Set(['count', 'chains', 'pierce']); // shown as a new total, not a percentage
export const STIRS_TEXT = 'Something stirs...';
export const BLESS_UNIT = { pickup: 'pickup radius', maxHp: 'max HP', damage: 'spirit damage', gold: 'gold', speed: 'move speed' };

// Safe, bounded text: strings only, control chars dropped, long text cut with an ellipsis.
export function clampText(v, max) {
  let s = typeof v === 'string' ? v : (typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
  s = s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!(max >= 2)) return s;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

// 'evolve' | 'stirs' | 'new' | 'blessing' | 'fallback' | 'stat'. A heal swapped into a Blessing slot reads as quiet (blessing row).
export function cardClass(card) {
  if (!card || typeof card !== 'object') return 'stat';
  if (card.kind === 'evolution') return 'evolve';
  if (card.kind === 'weapon') return 'new';
  if (card.kind === 'blessing') return 'blessing';
  if (card.kind === 'fallback') return card.swapped ? 'blessing' : 'fallback';
  return card.stirs === true ? 'stirs' : 'stat';
}
export const isQuiet = (card) => cardClass(card) === 'blessing';

// Display order = key order: gold/evolution first, then the normal cards, then the quiet Blessing row (keys 5, 6...).
export function orderOffer(offer) {
  const all = [...((offer && offer.gold) || []), ...((offer && offer.cards) || [])];
  const main = all.filter((c) => !isQuiet(c));
  const quiet = all.filter(isQuiet);
  return { main, quiet, all: main.concat(quiet) };
}

const int = (v, lo, hi, d = 0) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : d);

// Rank pips that show where this pick lands: filled = rank after the pick, `fresh` = the pip this pick adds.
export function pipsOf(card, maxRank = 5) {
  const k = card && card.kind;
  const total = int(k === 'stat' || k === 'blessing' ? card.maxRank : maxRank, 0, 8, int(maxRank, 0, 8, 5));
  if (k === 'evolution') return { total, filled: total, fresh: -1 };
  if (k === 'weapon') return { total, filled: 0, fresh: total ? 0 : -1 };
  if (k === 'stat' || k === 'blessing') {
    const filled = int(card.nextRank, 0, total);
    return { total, filled, fresh: filled ? filled - 1 : -1 };
  }
  return { total: 0, filled: 0, fresh: -1 };
}

const pct = (x) => `${x >= 0 ? '+' : '-'}${Math.round(Math.abs(x))}%`;
const secs = (x) => `${x >= 0 ? '+' : '-'}${Math.round(Math.abs(x) * 100) / 100}s`;

// Big effect number + small unit label. mode: 'count' | 'percent' | 'seconds' | 'label'.
export function effectOf(card, data) {
  const k = card && card.kind;
  try {
    if (k === 'evolution') {
      const e = data.evolutions[card.evoId] || {};
      return { mode: 'label', num: clampText(e.verb || String(card.title || '').split(' ')[0].toUpperCase(), CLAMP.num), unit: clampText(e.sub || '', CLAMP.unit) };
    }
    if (k === 'stat') {
      const s = data.weapons[card.weaponId].stats[card.stat];
      const cur = statValue(data.weapons[card.weaponId], card.stat, card.rank);
      const nxt = statValue(data.weapons[card.weaponId], card.stat, card.rank + 1);
      const arrow = `${formatValue(s.fmt, cur)} → ${formatValue(s.fmt, nxt)}`;
      if (s.fmt === 'sec') return { mode: 'seconds', num: secs(nxt - cur), unit: clampText(arrow, CLAMP.unit) };
      if (COUNT_KEYS.has(card.stat) || !(Math.abs(cur) > 0)) return { mode: 'count', num: clampText(formatValue(s.fmt, nxt), CLAMP.num), unit: clampText(arrow, CLAMP.unit) };
      return { mode: 'percent', num: clampText(pct(((nxt - cur) / Math.abs(cur)) * 100), CLAMP.num), unit: clampText(arrow, CLAMP.unit) };
    }
    if (k === 'weapon') {
      const def = data.weapons[card.weaponId];
      const key = Object.keys(def.stats).find((x) => COUNT_KEYS.has(x)) || Object.keys(def.stats)[0];
      return { mode: 'count', num: clampText(formatValue(def.stats[key].fmt, statValue(def, key, 0)), CLAMP.num), unit: clampText(def.stats[key].name, CLAMP.unit) };
    }
    if (k === 'blessing') {
      const d = data.blessings && data.blessings.items && data.blessings.items[card.blessId];
      if (d && Number.isFinite(d.perRank)) return { mode: 'percent', num: clampText(pct(Math.round(d.perRank * 1000) / 10), CLAMP.num), unit: clampText(BLESS_UNIT[card.effect] || '', CLAMP.unit) };
      return { mode: 'label', num: '', unit: '' };
    }
    if (k === 'fallback') {
      const t = String(card.desc || '');
      const n = /(\d{1,4})\s*%/.exec(t);
      const g = /\+\s*(\d{1,5})/.exec(t);
      if (card.fallback === 'heal') return { mode: 'percent', num: n ? `+${n[1]}%` : 'HEAL', unit: 'max HP' };
      if (card.fallback === 'gold') return { mode: 'count', num: g ? `+${g[1]}` : 'GOLD', unit: 'gold' };
      return { mode: 'label', num: 'XP', unit: 'a chunk of XP' };
    }
  } catch { /* fall through: never throw while drawing a card */ }
  return { mode: 'label', num: '', unit: '' };
}

// Everything a card shows, as plain clamped strings. Never includes evolution names/partner stats on stat cards.
export function cardModel(card, data, maxRank = 5) {
  const cls = cardClass(card);
  const eff = effectOf(card, data);
  const weaponName = card && card.weaponId && data.weapons[card.weaponId] ? data.weapons[card.weaponId].name : '';
  let title = card && card.title;
  let desc = card && card.desc;
  if (card && card.kind === 'stat' && data.weapons[card.weaponId]) { const st = data.weapons[card.weaponId].stats[card.stat]; title = st.name; desc = st.hint; }
  const tag = cls === 'evolve' ? 'EVOLVE' : cls === 'new' ? 'NEW' : cls === 'stat' || cls === 'stirs' ? weaponName : '';
  return {
    cls,
    key: card && typeof card.key === 'string' ? card.key : '',
    tag: clampText(tag, CLAMP.tag),
    title: clampText(title, CLAMP.title),
    num: eff.num,
    unit: eff.unit,
    desc: cls === 'blessing' ? '' : clampText(desc, CLAMP.desc),
    stirs: cls === 'stirs' ? STIRS_TEXT : '',
    from: cls === 'evolve' && card && typeof card.from === 'string' && card.from ? clampText(`from ${card.from}`, CLAMP.from) : '', // whisper line: the base weapon only, never a recipe
    pips: pipsOf(card, maxRank),
    banishable: !!card && card.kind !== 'evolution',
  };
}

// Screen-reader name for a card: plain clamped text, no markup. Rank is the rank AFTER this pick, as the pips show it.
export function cardLabel(m) {
  const kindWord = m.cls === 'evolve' ? 'Evolution' : m.cls === 'new' ? 'New spirit' : m.cls === 'blessing' ? 'Blessing' : '';
  const rank = m.pips && m.pips.total ? `rank ${m.pips.filled} of ${m.pips.total}` : '';
  const effect = `${m.num || ''} ${m.unit || ''}`.trim();
  const weapon = m.tag && m.tag !== 'EVOLVE' && m.tag !== 'NEW' ? m.tag : '';
  return clampText([kindWord, weapon, m.title, effect, rank, m.desc, m.stirs].filter(Boolean).join('. '), CLAMP.label);
}
