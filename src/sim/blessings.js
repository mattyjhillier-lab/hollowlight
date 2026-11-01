// Blessings: run-only, quiet rewards that fill offer slots the normal card pool cannot (BLESS-1).
// Pure logic (no Phaser/DOM). Data comes from blessings.json and is validated here; invalid data fails closed
// (an empty set = the game behaves exactly as before Blessings existed).

export const EFFECTS = ['pickup', 'maxHp', 'damage', 'gold', 'speed'];
const ID_RE = /^[a-z][a-z0-9_]{0,31}$/;
const TEXT_RE = /^[A-Za-z0-9 .,'%+-]{1,80}$/; // plain text only: safe to template into a card

const fin = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const empty = () => ({ items: Object.create(null), caps: Object.create(null), combined: null, heal: { hpBelow: 0.4, cooldown: 45 } });

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
  // COMBINED caps (docs/design/difficulty-tiers-economy-v1.md 8.6): tree multiplier x Blessing multiplier may not exceed one number per
  // shared effect (pickup 1.45, gold 1.40, speed 1.08, max HP 1.18, damage 1.09). Absent or invalid = no combined limit.
  if (raw.combined && typeof raw.combined === 'object' && EFFECTS.every((e) => Object.hasOwn(raw.combined, e) && fin(raw.combined[e], 1, 3))) {
    out.combined = {};
    for (const e of EFFECTS) out.combined[e] = raw.combined[e];
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

// The most a Blessing effect can reach this run: its own cap, and what is left under the combined (tree x Blessing) cap.
// treeMul = the tree's multiplier for that effect (1 for a tree-less run, so a starter save is never trimmed).
export function effectiveCap(def, effect, treeMul = null) {
  let c = def.caps[effect];
  if (def.combined && treeMul && Number.isFinite(treeMul[effect]) && treeMul[effect] > 0) c = Math.min(c, Math.max(1, def.combined[effect] / treeMul[effect]));
  return c;
}

// Total multiplier per effect, clamped to the cap at READ time (never trusts stored ranks). Writes into `out` (no allocation).
export function blessTotals(def, ranks, out = {}, treeMul = null) {
  for (const e of EFFECTS) out[e] = 1;
  if (!def) return out;
  for (const id of Object.keys(def.items)) {
    const d = def.items[id];
    const r = Object.hasOwn(ranks, id) && Number.isFinite(ranks[id]) ? Math.min(d.ranks, Math.max(0, Math.floor(ranks[id]))) : 0;
    out[d.effect] += d.perRank * r;
  }
  for (const e of EFFECTS) out[e] = Math.min(effectiveCap(def, e, treeMul), out[e]);
  return out;
}

export function blessingCard(id, def, rank) {
  const d = def.items[id];
  return { key: `b:${id}`, kind: 'blessing', blessId: id, effect: d.effect, title: d.name, desc: d.desc, badge: 'BLESSING', rank, nextRank: rank + 1, maxRank: d.ranks, color: '#e8d9a8' };
}

// Weighted pool of Blessings below max rank and not banished. A Blessing whose effect already sits at its (combined) cap leaves the pool,
// like a maxed stat, so a Blessing card is never a dead pick.
export function blessingPool(ctx) {
  const def = ctx.blessings;
  if (!def) return [];
  const pool = [];
  const tot = def.combined ? blessTotals(def, ctx.blessRanks || {}, {}, ctx.treeMul || null) : null;
  for (const id of Object.keys(def.items)) {
    const d = def.items[id];
    const rank = Math.min(d.ranks, Math.max(0, Math.floor(ctx.blessRanks?.[id] || 0)));
    if (rank >= d.ranks || ctx.banished.has(`b:${id}`)) continue;
    if (tot && tot[d.effect] >= effectiveCap(def, d.effect, ctx.treeMul || null) - 1e-9) continue;
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
