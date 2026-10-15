// Blessings: run-only, quiet rewards that fill offer slots the normal card pool cannot (BLESS-1).
// Pure logic (no Phaser/DOM). Data comes from blessings.json and is validated here; invalid data fails closed
// (an empty set = the game behaves exactly as before Blessings existed).

export const EFFECTS = ['pickup', 'maxHp', 'damage', 'gold', 'speed'];
const ID_RE = /^[a-z][a-z0-9_]{0,31}$/;
const TEXT_RE = /^[A-Za-z0-9 .,'%+-]{1,80}$/; // plain text only: safe to template into a card

const fin = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const empty = () => ({ items: Object.create(null), caps: Object.create(null), heal: { hpBelow: 0.4, cooldown: 45 } });

// Returns { items: null-prototype map id -> def, caps, heal }. Bad entries are dropped; a bad shell yields empty.
export function validateBlessings(raw) {
  const out = empty();
  if (!raw || typeof raw !== 'object' || !raw.items || typeof raw.items !== 'object') return out;
  const c = raw.caps && typeof raw.caps === 'object' ? raw.caps : {};
  for (const e of EFFECTS) {
    const v = Object.hasOwn(c, e) ? c[e] : undefined;
    if (!fin(v, 1, 2)) return out; // no valid cap = no Blessings
    out.caps[e] = v;
  }
  const h = raw.heal;
  if (h && fin(h.hpBelow, 0.05, 0.9) && fin(h.cooldown, 5, 600)) out.heal = { hpBelow: h.hpBelow, cooldown: h.cooldown };
  for (const id of Object.keys(raw.items)) {
    const d = raw.items[id];
    if (!ID_RE.test(id) || id in Object.prototype || !d || typeof d !== 'object') continue;
    if (!EFFECTS.includes(d.effect) || !fin(d.perRank, 0.001, 0.2) || !Number.isInteger(d.ranks) || d.ranks < 1 || d.ranks > 3 || !fin(d.weight, 0.01, 100)) continue;
    if (typeof d.name !== 'string' || typeof d.desc !== 'string' || !TEXT_RE.test(d.name) || !TEXT_RE.test(d.desc)) continue;
    out.items[id] = { name: d.name, desc: d.desc, effect: d.effect, perRank: d.perRank, ranks: d.ranks, weight: d.weight };
  }
  return out;
}

export function blessingCount(def) { return def ? Object.keys(def.items).length : 0; }

// Total multiplier per effect, clamped to the cap at READ time (never trusts stored ranks). Writes into `out` (no allocation).
export function blessTotals(def, ranks, out = {}) {
  for (const e of EFFECTS) out[e] = 1;
  if (!def) return out;
  for (const id of Object.keys(def.items)) {
    const d = def.items[id];
    const r = Object.hasOwn(ranks, id) && Number.isFinite(ranks[id]) ? Math.min(d.ranks, Math.max(0, Math.floor(ranks[id]))) : 0;
    out[d.effect] += d.perRank * r;
  }
  for (const e of EFFECTS) out[e] = Math.min(def.caps[e], out[e]);
  return out;
}

export function blessingCard(id, def, rank) {
  const d = def.items[id];
  return { key: `b:${id}`, kind: 'blessing', blessId: id, effect: d.effect, title: d.name, desc: d.desc, badge: 'BLESSING', rank, nextRank: rank + 1, maxRank: d.ranks, color: '#e8d9a8' };
}

// Weighted pool of Blessings below max rank and not banished.
export function blessingPool(ctx) {
  const def = ctx.blessings;
  if (!def) return [];
  const pool = [];
  for (const id of Object.keys(def.items)) {
    const d = def.items[id];
    const rank = Math.min(d.ranks, Math.max(0, Math.floor(ctx.blessRanks?.[id] || 0)));
    if (rank >= d.ranks || ctx.banished.has(`b:${id}`)) continue;
    pool.push({ card: blessingCard(id, def, rank), w: d.weight });
  }
  return pool;
}

// Heal swap (approach C): when low on HP and the swap is off cooldown, the last Blessing in the offer becomes Restoring Light.
export function healSwap(cards, ctx, hp, maxHp, time, readyAt, makeHeal) {
  const def = ctx.blessings;
  if (!def || !(hp < maxHp * def.heal.hpBelow) || time < readyAt || ctx.banished.has('f:heal')) return cards;
  if (cards.some((c) => c.key === 'f:heal')) return cards;
  for (let i = cards.length - 1; i >= 0; i--) {
    if (cards[i].kind === 'blessing') { const out = cards.slice(); out[i] = { ...makeHeal(), swapped: true }; return out; }
  }
  return cards;
}
