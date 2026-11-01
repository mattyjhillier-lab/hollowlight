// Tree migration step 4: CHARACTER SYSTEM v2 (LOCKED 2026-10-24). The six hero lanterns leave the tree (hero content moves to the Characters
// page; the tree is character-agnostic). Their ids are TOMBSTONES in core.json `retired` (id + fragment slot permanent, save-v3 H2).
// Every owned hero lantern is refunded at the price PAID: the FROZEN price below x the rising-price steps it was bought at (save.creep,
// bounded by what was legally possible). Removing them also lowers the most rising-price steps the other lanterns of the same
// constellation can hold; any stored step above the new bound is refunded too (the difference), so a later respec stays exact.
// Pure apart from reading the compiled live tree `def` (cmembers, nodes, creepCount). Untrusted input: own keys only, ranks clamped.
import { creepCount, costFor } from '../tree.js';

export const MAX_BANK = 1e12;
// FROZEN (tree content version 3): gold at rank 1, shards, max rank, rank multiplier, rising-price group. Never edit, never read live data.
export const PRICES_V4 = {
  ch_wren: { g: 600, s: 0, m: 1, c: 1, grp: 'ghost_wolves' },
  wr_grip: { g: 900, s: 0, m: 1, c: 1, grp: 'ghost_wolves' },
  wr_spark: { g: 400, s: 0, m: 1, c: 1, grp: 'ghost_wolves' },
  ch_elias: { g: 600, s: 0, m: 1, c: 1, grp: 'holy_orbit' },
  el_wheel: { g: 900, s: 0, m: 1, c: 1, grp: 'holy_orbit' },
  el_lamp: { g: 400, s: 0, m: 1, c: 1, grp: 'holy_orbit' },
};
export const CREEP_V4 = 0.08; // core.price.creep at content version 3

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const rankIn = (t, id, max) => (Object.hasOwn(t, id) ? Math.min(max, Math.max(0, Math.floor(fin(t[id]) ? t[id] : t[id] === true ? 1 : 0))) : 0);
const steps = (creep, id) => (isObj(creep) && Object.hasOwn(creep, id) && fin(creep[id]) ? Math.max(0, Math.min(1e4, Math.floor(creep[id]))) : 0);
export function frozenCost(p, rank, st) {
  const m = st > 0 ? Math.pow(1 + CREEP_V4, st) : 1;
  let gold = 0;
  for (let k = 1; k <= rank; k++) gold += p.g === 0 ? 0 : Math.max(10, Math.round((p.g * Math.pow(p.c, k - 1) * m) / 10) * 10);
  return { gold, shards: p.s * rank };
}

// rawTree: object-form { id: rank } (raw decode: retired ids included). ctx: { creep (untrusted), def (compiled live tree) }.
export function retireHeroLanterns(rawTree, ctx = {}) {
  const out = { tree: {}, gold: 0, shards: 0, creep: {}, refunded: 0 };
  if (!isObj(rawTree)) return out;
  const def = ctx.def || null;
  const members = (g) => (def && def.cmembers && Object.hasOwn(def.cmembers, g) ? def.cmembers[g] : []);
  for (const id of Object.keys(rawTree)) if (!Object.hasOwn(PRICES_V4, id)) out.tree[id] = rawTree[id];
  if (isObj(ctx.creep)) for (const id of Object.keys(ctx.creep)) if (!Object.hasOwn(PRICES_V4, id) && /^[a-z0-9_]{1,40}$/.test(id)) out.creep[id] = ctx.creep[id];
  const lostBy = Object.create(null); // owned retired lanterns per group
  for (const [id, p] of Object.entries(PRICES_V4)) if (rankIn(rawTree, id, p.m) >= 1) lostBy[p.grp] = (lostBy[p.grp] || 0) + 1;
  for (const [id, p] of Object.entries(PRICES_V4)) {
    const rank = rankIn(rawTree, id, p.m);
    if (rank < 1) continue;
    // most steps it could have been bought at: every other owned lantern of its group (live members + the other retired ones)
    let bound = lostBy[p.grp] - 1;
    for (const x of members(p.grp)) if (def.nodes[x] && rankIn(rawTree, x, def.nodes[x].maxRank) >= 1) bound += rankIn(rawTree, x, def.nodes[x].maxRank);
    const c = frozenCost(p, rank, Math.min(steps(ctx.creep, id), bound));
    out.gold = Math.min(MAX_BANK, out.gold + c.gold);
    out.shards = Math.min(MAX_BANK, out.shards + c.shards);
    out.refunded += 1;
  }
  // the live lanterns of an affected group: a stored step above the new bound is paid back (the difference) and clamped
  if (def) for (const g of Object.keys(lostBy)) {
    for (const x of members(g)) {
      const n = def.nodes[x];
      const r = n ? rankIn(out.tree, x, n.maxRank) : 0;
      if (r < 1 || !Object.hasOwn(out.creep, x)) continue;
      const nowMax = creepCount(def, out.tree, x);
      const was = Math.min(steps(out.creep, x), nowMax + lostBy[g]);
      if (was <= nowMax) continue;
      for (let k = 1; k <= r; k++) out.gold = Math.min(MAX_BANK, out.gold + costFor(n, k, was, def.creep).gold - costFor(n, k, nowMax, def.creep).gold);
      if (nowMax > 0) out.creep[x] = nowMax; else delete out.creep[x];
    }
  }
  return out;
}
