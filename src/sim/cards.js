// Pure level-up card logic: pools, offers, rerolls, banishes, evolutions.
// Nothing in here touches Phaser or the DOM so it can be unit tested in Node.

export function statValue(def, key, rank) {
  const s = def.stats[key];
  return s.base + s.perRank * rank;
}

export function computeStats(def, ranks) {
  const out = {};
  for (const key of Object.keys(def.stats)) out[key] = statValue(def, key, ranks[key] || 0);
  return out;
}

export function formatValue(fmt, v) {
  if (fmt === 'sec') return `${(Math.round(v * 100) / 100).toString()}s`;
  if (fmt === 'dec') return (Math.round(v * 100) / 100).toString();
  return Math.round(v).toString();
}

export function newWeapon(id, def) {
  const ranks = {};
  for (const key of Object.keys(def.stats)) ranks[key] = 0;
  return { id, ranks, evo: null, s: computeStats(def, ranks), rt: {} };
}

export function refreshStats(w, data) {
  w.s = computeStats(data.weapons[w.id], w.ranks);
}

// Evolutions whose stat pair is fully maxed and that haven't been taken yet.
export function availableEvolutions(w, data) {
  if (w.evo) return [];
  const max = data.balance.maxRank;
  const out = [];
  for (const [evoId, evo] of Object.entries(data.evolutions)) {
    if (evo.weapon !== w.id) continue;
    if (w.ranks[evo.pair[0]] >= max && w.ranks[evo.pair[1]] >= max) out.push(evoId);
  }
  return out;
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

function statCard(w, statKey, data) {
  const def = data.weapons[w.id];
  const s = def.stats[statKey];
  const rank = w.ranks[statKey];
  const next = rank + 1;
  const evoHints = Object.values(data.evolutions)
    .filter((e) => e.weapon === w.id && e.pair.includes(statKey))
    .length;
  return {
    key: `s:${w.id}:${statKey}`,
    kind: 'stat',
    weaponId: w.id,
    stat: statKey,
    title: `${def.name}: ${s.name}`,
    desc: `${formatValue(s.fmt, statValue(def, statKey, rank))} → ${formatValue(s.fmt, statValue(def, statKey, next))}  (${s.hint})`,
    rank,
    nextRank: next,
    maxRank: data.balance.maxRank,
    evoHints,
    color: def.color,
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
  const slots = data.balance.weaponSlots;
  if (weapons.length < slots) {
    const owned = new Set(weapons.map((w) => w.id));
    for (const id of Object.keys(data.weapons)) {
      if (!owned.has(id)) pool.push({ card: weaponCard(id, data), w: data.balance.weaponCardWeight });
    }
  }
  for (const w of weapons) {
    if (w.evo) continue; // evolved weapons are final
    for (const statKey of Object.keys(data.weapons[w.id].stats)) {
      if (w.ranks[statKey] >= data.balance.maxRank) continue;
      const pairs = Object.values(data.evolutions).filter((e) => e.weapon === w.id && e.pair.includes(statKey));
      let wt = pairs.length ? 2.2 : 1;
      // Hidden nudge: if the partner stat is well along, finishing the pair is more likely.
      if (pairs.some((e) => w.ranks[e.pair.find((k) => k !== statKey)] >= 3)) wt *= 2;
      pool.push({ card: statCard(w, statKey, data), w: wt });
    }
  }
  return pool.filter((p) => !banished.has(p.card.key));
}

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
    for (const evoId of availableEvolutions(w, data)) out.push(evolutionCard(w, evoId, data));
  }
  return out.slice(0, data.balance.maxGoldCards);
}

// Draws the normal cards for an offer. `exclude` keys (cards already on screen) are skipped.
export function drawNormalCards(ctx, rng, count, exclude = new Set()) {
  const pool = buildPool(ctx).filter((p) => !exclude.has(p.card.key));
  const cards = drawWeighted(pool, count, rng);
  return fillWithFallbacks(cards, count, ctx.data, rng);
}

export function generateOffer(ctx, rng) {
  const n = ctx.data.balance.offerSize;
  return { cards: drawNormalCards(ctx, rng, n), gold: goldCards(ctx) };
}

// Re-draw only the normal cards; gold evolution cards stay put.
export function rerollOffer(ctx, rng, offer) {
  const n = ctx.data.balance.offerSize;
  return { cards: drawNormalCards(ctx, rng, n), gold: offer.gold };
}

// Banish one normal card for the rest of the run and draw a replacement.
export function banishCard(ctx, rng, offer, key) {
  ctx.banished.add(key);
  const keep = offer.cards.filter((c) => c.key !== key);
  const exclude = new Set(keep.map((c) => c.key));
  const n = ctx.data.balance.offerSize;
  const fresh = drawNormalCards(ctx, rng, n - keep.length, exclude);
  return { cards: keep.concat(fresh), gold: offer.gold };
}

// Applies weapon / stat / evolution cards. Fallback cards are handled by the Sim.
export function applyCard(ctx, card) {
  const { weapons, data } = ctx;
  if (card.kind === 'weapon') {
    const w = newWeapon(card.weaponId, data.weapons[card.weaponId]);
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
