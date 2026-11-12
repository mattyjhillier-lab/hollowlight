// Q1a: node TIERS and medallion DRAW sizes of the tree screen. Pure JS (no DOM): display only, never read by costs, saves or the budget.
// Tier derives from `kind` (docs/design/skill-tree-rework-v2.md 8, v1 2.1; positions, ids, prices and requires are untouched):
//   landmark = heart, socket, gate, key, teaser (+ future hero, kin)   -> 76 px medallion at NEAR (zoom 1)
//   diamond  = mastery, bead (+ future verb, status)                    -> 26 px
//   dot      = ring, knot and every unknown kind                        -> 9 px
// Positions stay as they are until the re-layout (Q4), so a medallion is SCALED DOWN to fit its neighbours:
//   draw diameter (px at zoom 1) = min(tier size, 0.9 x distance to the nearest same-or-higher-tier neighbour).
// A second pass shrinks the LOWER tier of any pair that would still overlap. On screen the diameter is multiplied by the zoom
// and never drawn smaller than the tier floor (22 / 10 / 4 px); the floor can overlap only at FAR zoom, where just landmarks and
// lantern-lit dots are drawn.
export const TIER_OF_KIND = { heart: 'landmark', socket: 'landmark', gate: 'landmark', key: 'landmark', teaser: 'landmark', hero: 'landmark', kin: 'landmark', mastery: 'diamond', bead: 'diamond', verb: 'diamond', status: 'diamond' };
export const TIER_SIZE = { landmark: 76, diamond: 26, dot: 9 };
export const TIER_FLOOR = { landmark: 22, diamond: 10, dot: 4 };
export const TIER_RANK = { dot: 0, diamond: 1, landmark: 2 };
const own = (o, k) => Object.hasOwn(o, k);

// Q7-A: a node flagged chase (display-only) is DRAWN as a landmark medallion by computeTierSizes; layout keeps tierOf (positions unchanged).
export const tierOf = (n) => (n && typeof n.kind === 'string' && own(TIER_OF_KIND, n.kind) ? TIER_OF_KIND[n.kind] : 'dot');

/** Draw diameters for every node of a compiled tree: { tier: {id: 'landmark'|..}, d: {id: px at zoom 1} }. Pure and deterministic. */
export function computeTierSizes(def, opts = {}) {
  const size = { ...TIER_SIZE, ...(opts.size || {}) };
  const ids = def.list.filter((id) => def.nodes[id] && Number.isFinite(def.nodes[id].x) && Number.isFinite(def.nodes[id].y));
  const tier = Object.create(null), d = Object.create(null);
  const C = 160, grid = new Map();
  const key = (i, j) => `${i},${j}`;
  for (const id of ids) { const n = def.nodes[id]; tier[id] = n.chase === true ? 'landmark' : tierOf(n); const k = key(Math.floor(n.x / C), Math.floor(n.y / C)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(id); }
  const near = (id, pred) => { // nearest neighbour passing pred, searched in growing rings of cells
    const n = def.nodes[id]; const ci = Math.floor(n.x / C), cj = Math.floor(n.y / C);
    let best = Infinity;
    for (let r = 0; r < 40; r++) {
      if (best < (r - 1) * C) break;
      for (let i = ci - r; i <= ci + r; i++) for (let j = cj - r; j <= cj + r; j++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r) continue;
        for (const o of grid.get(key(i, j)) || []) if (o !== id && pred(o)) best = Math.min(best, Math.hypot(def.nodes[o].x - n.x, def.nodes[o].y - n.y));
      }
    }
    return best;
  };
  for (const id of ids) {
    const rk = TIER_RANK[tier[id]];
    const nd = near(id, (o) => TIER_RANK[tier[o]] >= rk);
    d[id] = Math.min(size[tier[id]], 0.9 * nd);
  }
  for (const id of ids) { // second pass: a smaller neighbour must not sit under a bigger medallion
    const n = def.nodes[id]; const ci = Math.floor(n.x / C), cj = Math.floor(n.y / C);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) for (const o of grid.get(key(i, j)) || []) {
      if (o === id || TIER_RANK[tier[o]] >= TIER_RANK[tier[id]]) continue;
      const dist = Math.hypot(def.nodes[o].x - n.x, def.nodes[o].y - n.y);
      // radius sum may use at most 95% of the distance: the bigger medallion gives way first, down to what leaves the smaller one its floor
      d[id] = Math.min(d[id], Math.max(TIER_FLOOR[tier[id]] * 0.6, 2 * 0.95 * dist - TIER_FLOOR[tier[o]]));
      const room = 2 * 0.95 * dist - d[id];
      if (d[o] > room) d[o] = Math.max(0, room);
    }
  }
  for (const id of ids) d[id] = Math.round(d[id] * 100) / 100;
  return { tier, d };
}

/** On-screen diameter in px for a node at camera zoom z (the floor applies on screen, the multiplier is the Menu-size factor). */
export const screenDiameter = (tier, dWorld, z, uk = 1) => Math.max(TIER_FLOOR[tier] || 4, dWorld * z) * uk;

/** Which tiers are drawn at a zoom level: FAR landmarks only, MID + diamonds (dots stay as 4 px specks so trails never dangle), NEAR everything. */
export function tierShown(tier, lod) {
  if (lod === 'far') return tier === 'landmark';
  return true;
}
