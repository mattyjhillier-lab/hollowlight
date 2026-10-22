// Pure level-up card logic: pools, offers, rerolls, banishes, evolutions.
// Nothing in here touches Phaser or the DOM so it can be unit tested in Node.
import { blessingPool } from './blessings.js';

export function statValue(def, key, rank) {
  const s = def.stats[key];
  return s.base + s.perRank * rank;
}

// `bonus` (skill tree): { stat: { add, pct } } applied on top of the rank value.
export function computeStats(def, ranks, bonus) {
  const out = {};
  for (const key of Object.keys(def.stats)) {
    let v = statValue(def, key, ranks[key] || 0);
    const b = bonus && Object.hasOwn(bonus, key) ? bonus[key] : null;
    if (b) v = (v + (b.add || 0)) * (1 + (b.pct || 0) / 100);
    out[key] = v;
  }
  return out;
}

// Wolf bleed (Rend stat = share of a bite dealt per second, 15% -> 35%) lasts a fixed time (weapons.js uses this; card text quotes it).
export const BLEED_TIME = 4;
// Elias's Burn (Holy Orbit hits): 20% of the triggering hit per second for 2 s; one per enemy, strongest wins, time refreshes.
export const BURN_RATE = 0.2;
export const BURN_TIME = 2;

// Card hint text is a template over the real per-rank numbers so it stays true if the data changes.
// Tokens: {old} {new} (formatted stat values), {pct} (signed percent change), {upct} (unsigned), {bleedSec} (fixed bleed seconds), {rate} (attack-rate bonus per rank, stat.rate).
// rateMult: speed stats with a `rate` shorten the weapon's hit gap: gap / (1 + rate x rank).
export const rateMult = (def, key, rank) => 1 + (def?.stats?.[key]?.rate || 0) * rank;
export function hintText(def, key, rank) {
  const s = def.stats[key];
  const cur = statValue(def, key, rank);
  const nxt = statValue(def, key, rank + 1);
  const pct = Math.abs(cur) > 0 ? `${nxt >= cur ? '+' : '-'}${Math.round(Math.abs((nxt - cur) / cur) * 100)}%` : '';
  const upct = pct ? pct.slice(1) : '';
  const vals = { upct, old: formatValue(s.fmt, cur), new: formatValue(s.fmt, nxt), pct, bleedSec: String(BLEED_TIME), rate: `${Math.round((s.rate || 0) * 100)}%` };
  return String(s.hint).replace(/\{(\w+)\}/g, (m, k) => (k in vals ? vals[k] : ''));
}

export function formatValue(fmt, v) {
  if (fmt === 'sec') return `${(Math.round(v * 100) / 100).toString()}s`;
  if (fmt === 'pct') return `${Math.round(v * 100)}%`;
  if (fmt === 'dec') return (Math.round(v * 100) / 100).toString();
  return Math.round(v).toString();
}

export function newWeapon(id, def, bonus = null) {
  const ranks = {};
  for (const key of Object.keys(def.stats)) ranks[key] = 0;
  return { id, ranks, evo: null, bonus, s: computeStats(def, ranks, bonus), rt: {} };
}

export function refreshStats(w, data) {
  w.s = computeStats(data.weapons[w.id], w.ranks, w.bonus);
}

// An evolution with treeGate:true only exists for the player once a tree node unlocks it.
// Fails closed: a missing `unlocked` set means only ungated evolutions are open. Used at every
// site that could reveal a recipe (gold card, pair nudge, stat-card hints) so locked ones never leak.
export function evoOpen(evo, id, unlocked) {
  return !evo.treeGate || !!(unlocked && unlocked.has(id));
}

// Evolutions whose stat pair is fully maxed and that haven't been taken yet.
export function availableEvolutions(w, data, unlocked) {
  if (w.evo) return [];
  const max = data.balance.maxRank;
  const out = [];
  for (const [evoId, evo] of Object.entries(data.evolutions)) {
    if (evo.weapon !== w.id || !evoOpen(evo, evoId, unlocked)) continue;
    if (w.ranks[evo.pair[0]] >= max && w.ranks[evo.pair[1]] >= max) out.push(evoId);
  }
  return out;
}

// EVO-HINT (display only): true when taking this stat card would leave BOTH stats of an unlocked,
// not-yet-taken evolution pair at max rank. Never exposes which evolution or partner stat.
// loud (Card Fan 'Louder Stirring', T6): it also stirs when the PARTNER stat is at rank LOUD_STIR_RANK or more (an earlier hint; still never names it).
export const LOUD_STIR_RANK = 2;
export function stirs(w, statKey, data, unlocked, loud = false) {
  if (w.evo) return false;
  const max = data.balance.maxRank;
  const finishing = (w.ranks[statKey] || 0) + 1 >= max;
  if (!finishing && !loud) return false;
  for (const [id, e] of Object.entries(data.evolutions)) {
    if (e.weapon !== w.id || !e.pair.includes(statKey) || !evoOpen(e, id, unlocked)) continue;
    const other = e.pair[0] === statKey ? e.pair[1] : e.pair[0];
    const pr = w.ranks[other] || 0;
    if (finishing && pr >= max) return true;
    if (loud && pr >= LOUD_STIR_RANK) return true;
  }
  return false;
}

function weaponCard(id, data) {
  const def = data.weapons[id];
  return {
    key: `w:${id}`,
    kind: 'weapon',
    weaponId: id,
    title: def.name,
    desc: def.desc,
    badge: 'NEW',
    color: def.color,
  };
}

function statCard(w, statKey, data, unlocked, loud = false) {
  const def = data.weapons[w.id];
  const s = def.stats[statKey];
  const rank = w.ranks[statKey];
  const next = rank + 1;
  // Evolved weapons cannot evolve again: no recipe hints (D1).
  const evoHints = w.evo ? 0 : Object.entries(data.evolutions)
    .filter(([id, e]) => e.weapon === w.id && e.pair.includes(statKey) && evoOpen(e, id, unlocked))
    .length;
  return {
    key: `s:${w.id}:${statKey}`,
    kind: 'stat',
    weaponId: w.id,
    stat: statKey,
    title: `${def.name}: ${s.name}`,
    desc: hintText(def, statKey, rank),
    rank,
    nextRank: next,
    maxRank: data.balance.maxRank,
    evoHints,
    color: def.color,
    ...(stirs(w, statKey, data, unlocked, loud) ? { stirs: true } : {}),
  };
}

function evolutionCard(w, evoId, data) {
  const evo = data.evolutions[evoId];
  const def = data.weapons[w.id];
  return {
    key: `e:${evoId}`,
    kind: 'evolution',
    weaponId: w.id,
    evoId,
    title: evo.name,
    desc: evo.desc,
    badge: 'EVOLVE',
    from: def.name,
    color: '#ffd24a',
  };
}

export function fallbackCard(kind, data) {
  const f = data.balance.fallback[kind];
  return { key: `f:${kind}`, kind: 'fallback', fallback: kind, title: f.name, desc: f.desc, color: '#cfcfcf' };
}

// The pool of normal (non-gold) cards a player could currently be offered.
export function buildPool(ctx) {
  const { weapons, data, banished } = ctx;
  const pool = [];
  const slots = ctx.weaponSlots || data.balance.weaponSlots; // Fifth Hook (tier-bought) raises it on Deep Dusk+ only
  if (weapons.length < slots) {
    const owned = new Set(weapons.map((w) => w.id));
    for (const id of Object.keys(data.weapons)) {
      // Optional tree gate: a weapon with treeGate:true only enters the pool once a tree node unlocks it.
      if (data.weapons[id].treeGate && !(ctx.unlockedWeapons && ctx.unlockedWeapons.has(id))) continue;
      if (!owned.has(id)) pool.push({ card: weaponCard(id, data), w: data.balance.weaponCardWeight });
    }
  }
  for (const w of weapons) {
    // D1: an evolved weapon keeps offering its remaining (non-recipe) stat cards as normal; no nudge, no 'stirs' (it cannot evolve again).
    for (const statKey of Object.keys(data.weapons[w.id].stats)) {
      if (w.ranks[statKey] >= data.balance.maxRank) continue;
      const pairs = w.evo ? [] : Object.entries(data.evolutions).filter(([id, e]) => e.weapon === w.id && e.pair.includes(statKey) && evoOpen(e, id, ctx.unlockedEvolutions)).map(([, e]) => e);
      const nudge = data.balance.evoNudge || { pair: 2.2, partnerRank: 3, partnerMult: 2 };
      let wt = pairs.length ? nudge.pair * (ctx.evoLuck || 1) : 1;
      // Hidden nudge: if the partner stat is well along, finishing the pair is more likely.
      if (pairs.some((e) => w.ranks[e.pair.find((k) => k !== statKey)] >= nudge.partnerRank)) wt *= nudge.partnerMult;
      if (ctx.favour === w.id) wt *= FAVOUR_WEIGHT; // Card Fan 'Favoured Spirit' (T6): the marked weapon's stat cards come more often
      pool.push({ card: statCard(w, statKey, data, ctx.unlockedEvolutions, !!ctx.loudStir), w: wt });
    }
  }
  return pool.filter((p) => !banished.has(p.card.key));
}

export const FAVOUR_WEIGHT = 1.5;
const offerSizeOf = (ctx) => ctx.offerSize || ctx.data.balance.offerSize; // Fourth Card (tier-bought) raises it on Deep Dusk+ only

function drawWeighted(pool, n, rng) {
  const items = pool.slice();
  const out = [];
  while (out.length < n && items.length) {
    let total = 0;
    for (const it of items) total += it.w;
    let r = rng.next() * total;
    let idx = 0;
    for (; idx < items.length; idx++) {
      r -= items[idx].w;
      if (r <= 0) break;
    }
    if (idx >= items.length) idx = items.length - 1;
    out.push(items[idx].card);
    items.splice(idx, 1);
  }
  return out;
}

function fillWithFallbacks(cards, n, data, rng) {
  const kinds = rng.shuffle(Object.keys(data.balance.fallback));
  for (const kind of kinds) {
    if (cards.length >= n) break;
    cards.push(fallbackCard(kind, data));
  }
  return cards;
}

export function goldCards(ctx) {
  const { weapons, data } = ctx;
  const out = [];
  for (const w of weapons) {
    for (const evoId of availableEvolutions(w, data, ctx.unlockedEvolutions)) out.push(evolutionCard(w, evoId, data));
  }
  return out.slice(0, data.balance.maxGoldCards);
}

// Draws the normal cards for an offer. `exclude` keys (cards already on screen) are skipped.
export function drawNormalCards(ctx, rng, count, exclude = new Set()) {
  const pool = buildPool(ctx).filter((p) => !exclude.has(p.card.key));
  const cards = drawWeighted(pool, count, rng);
  // Blessings only fill slots the real pool cannot (fewer than `count` real cards left); fallbacks only if those run out too.
  if (cards.length < count && ctx.blessings) {
    const have = new Set(cards.map((c) => c.key));
    const bp = blessingPool(ctx).filter((p) => !exclude.has(p.card.key) && !have.has(p.card.key));
    cards.push(...drawWeighted(bp, count - cards.length, rng));
  }
  return fillWithFallbacks(cards, count, ctx.data, rng);
}

export function generateOffer(ctx, rng) {
  const n = offerSizeOf(ctx);
  return { cards: drawNormalCards(ctx, rng, n), gold: goldCards(ctx) };
}

// Re-draw only the normal cards; gold evolution cards stay put.
export function rerollOffer(ctx, rng, offer) {
  const n = offerSizeOf(ctx);
  return { cards: drawNormalCards(ctx, rng, n), gold: offer.gold };
}

// Banish one normal card for the rest of the run and draw a replacement.
export function banishCard(ctx, rng, offer, key) {
  ctx.banished.add(key);
  const keep = offer.cards.filter((c) => c.key !== key);
  const exclude = new Set(keep.map((c) => c.key));
  const n = offerSizeOf(ctx);
  const fresh = drawNormalCards(ctx, rng, n - keep.length, exclude);
  return { cards: keep.concat(fresh), gold: offer.gold };
}

// Card Fan 'Second Sight' (T6): the preview drawn at the last offer. Cards still in the pool are kept (fresh copies: ranks and text are current);
// a card a pick removed (a weapon taken, a stat maxed, a banish) is replaced by a fresh draw, as the lantern's text warns.
export function previewDraw(ctx, rng) {
  return drawNormalCards(ctx, rng, offerSizeOf(ctx));
}
export function offerFromPreview(ctx, rng, preview) {
  const n = offerSizeOf(ctx);
  const live = new Map(buildPool(ctx).map((p) => [p.card.key, p.card]));
  const kept = [];
  for (const c of preview || []) if (kept.length < n && c && live.has(c.key) && !kept.some((k) => k.key === c.key)) kept.push(live.get(c.key));
  const fresh = kept.length < n ? drawNormalCards(ctx, rng, n - kept.length, new Set(kept.map((c) => c.key))) : [];
  return { cards: kept.concat(fresh), gold: goldCards(ctx) };
}

// Run-start offers (Hearth-key 'Kindred Start', Card Fan 'Favoured Spirit', Hearth-key 'Lantern Blessing'; T6). Not level-ups: no reroll,
// banish, heal swap or fallback cards. kindred = 3 unlocked weapons not yet owned (a free weapon card); favour = every unlocked weapon
// (mark one); blessing = 3 Blessings (inside the caps, as any Blessing card).
export const START_KINDS = ['kindred', 'favour', 'blessing', 'chestBless', 'chestStat'];
export function startOffer(ctx, rng, kind) {
  const { data, weapons } = ctx;
  const open = Object.keys(data.weapons).filter((id) => !data.weapons[id].treeGate || (ctx.unlockedWeapons && ctx.unlockedWeapons.has(id)));
  let cards = [];
  if (kind === 'kindred') {
    if (weapons.length >= (ctx.weaponSlots || data.balance.weaponSlots)) return [];
    const owned = new Set(weapons.map((w) => w.id));
    cards = drawWeighted(open.filter((id) => !owned.has(id)).map((id) => ({ card: weaponCard(id, data), w: 1 })), 3, rng);
  } else if (kind === 'favour') {
    const first = weapons.length ? weapons[0].id : null;
    cards = open.sort((a, b) => (a === first ? -1 : b === first ? 1 : 0)).map((id) => favourCard(id, data));
  } else if (kind === 'blessing' || kind === 'chestBless') { // EN8: a Medium/Large Lantern Reliquary's Blessing choice (same pool, same caps)
    cards = drawWeighted(blessingPool(ctx), 3, rng);
  } else if (kind === 'chestStat') { // EN8: a Large Lantern Reliquary's free stat rank: 3 owned-weapon stats not yet maxed (a plain stat card: never names an evolution)
    const pool = [];
    for (const w of weapons) for (const k of Object.keys(data.weapons[w.id].stats)) if (w.ranks[k] < data.balance.maxRank) pool.push({ card: statCard(w, k, data, ctx.unlockedEvolutions, !!ctx.loudStir), w: 1 });
    cards = drawWeighted(pool, 3, rng);
  }
  return cards;
}

function favourCard(id, data) {
  const def = data.weapons[id];
  return { key: `v:${id}`, kind: 'favour', weaponId: id, title: def.name, desc: 'Favoured this run: its upgrade cards come more often.', badge: 'FAVOUR', color: def.color };
}

// Applies weapon / stat / evolution cards. Fallback cards are handled by the Sim.
export function applyCard(ctx, card) {
  const { weapons, data } = ctx;
  if (card.kind === 'weapon') {
    const w = newWeapon(card.weaponId, data.weapons[card.weaponId], ctx.weaponBonus ? ctx.weaponBonus[card.weaponId] || null : null);
    weapons.push(w);
    return w;
  }
  const w = weapons.find((x) => x.id === card.weaponId);
  if (!w) return null;
  if (card.kind === 'stat') {
    w.ranks[card.stat] = Math.min(data.balance.maxRank, w.ranks[card.stat] + 1);
    refreshStats(w, data);
  } else if (card.kind === 'evolution') {
    w.evo = card.evoId;
    w.rt = {}; // behaviour restarts cleanly in its new form
  }
  return w;
}

export function xpForLevel(level, balance) {
  const { base, linear, quad } = balance.xp;
  return Math.ceil(base + linear * level + quad * level * level);
}
