// Tree migration step 5: the S1 rework ('three spokes' gardens, roads to every landmark, scattered regions; LOCKED 'TREE BRANCH STRUCTURE',
// 'TREE RESTART SCOPE = REFUND EVERYTHING', Matt 2026-11-12). Released ids changed their requires (and some their effects), so the tree
// RESTARTS once: every purchase of the released v4 tree is refunded in full at the price PAID (FROZEN v4 table x the rising-price steps it
// was bought at, bounded by what was legally possible), gold + soul shards + Dawnglass, including bought weapon hearts, evolution seals and
// night gates. Nodes the starter pick GAVE for free (STARTER_V4 of the save's starter weapon) are never refunded; the new starter set
// (heart + first seal) is granted again. Everything outside the tree (keepsakes, Bond, codex, discovered evolutions, stats, Dawnglass spent
// elsewhere) is untouched. Pure, idempotent (a restarted tree owns only starter nodes, which refund nothing), untrusted input safe.
import { PRICES_V4, CREEP_V4, STARTER_V4 } from './tree-v5.prices.js';

export const MAX_BANK = 1e12;
// FROZEN: the v5 starter set per starter weapon (heart + the seal of its first branch). Never read live data here.
export const STARTER_V5 = Object.freeze({
  ghost_wolves: ['gt_ghost_wolves'],
  raven_flock: ['gt_raven_flock', 'gt_dive_bombers'],
  spirit_bolts: ['gt_spirit_bolts', 'gt_spirit_tempest'],
  chain_lightning: ['gt_chain_lightning', 'gt_thunder_judgment'],
  holy_orbit: ['gt_holy_orbit', 'or_halo'],
});

// FROZEN: every id a v4 tree could hold (buyable ids, teasers, the v4 tombstones). A tree that owns anything else was written by v5 or later:
// its version stamp was forged down, so the restart does NOT run again (no replayed refund, nothing cleared).
const V4_IDS = new Set([...Object.keys(PRICES_V4), 'tz_marsh', 'tz_witch', 'tz_crown', 'ch_wren', 'wr_grip', 'wr_spark', 'ch_elias', 'el_wheel', 'el_lamp', 'cd_radar']);

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const rankIn = (t, id, max) => (Object.hasOwn(t, id) ? Math.min(max, Math.max(0, Math.floor(fin(t[id]) ? t[id] : t[id] === true ? 1 : 0))) : 0);
const stepsOf = (creep, id) => (isObj(creep) && Object.hasOwn(creep, id) && fin(creep[id]) ? Math.max(0, Math.min(1e4, Math.floor(creep[id]))) : 0);

export function frozenCostV4(p, rank, st) {
  const m = st > 0 && p.grp ? Math.pow(1 + CREEP_V4, st) : 1;
  let gold = 0;
  for (let k = 1; k <= rank; k++) gold += p.g === 0 ? 0 : Math.max(10, Math.round((p.g * Math.pow(p.c, k - 1) * m) / 10) * 10);
  return { gold, shards: p.s * rank, glass: (p.gl || 0) * rank };
}

// rawTree: object-form { id: rank } (untrusted). ctx: { creep (untrusted), starter: the save's starter weapon id (untrusted) }.
// -> { tree, gold, shards, glass, creep: {}, refunded }
export function restartTree(rawTree, ctx = {}) {
  const out = { tree: {}, gold: 0, shards: 0, glass: 0, creep: {}, refunded: 0 };
  const isNodeId = (id) => (ctx.def && isObj(ctx.def.nodes) ? Object.hasOwn(ctx.def.nodes, id) : /^[a-z0-9]{1,4}_[a-z0-9_]{1,36}$/.test(id));
  if (isObj(rawTree) && Object.keys(rawTree).some((id) => !V4_IDS.has(id) && isNodeId(id) && rankIn(rawTree, id, 1e4) > 0)) {
    const keep = {};
    for (const id of Object.keys(rawTree)) if (isNodeId(id) || V4_IDS.has(id)) keep[id] = rawTree[id];
    return { tree: keep, gold: 0, shards: 0, glass: 0, creep: undefined, refunded: 0, replay: true };
  }
  const starter = typeof ctx.starter === 'string' && Object.hasOwn(STARTER_V5, ctx.starter) ? ctx.starter : null;
  const free = new Set(starter && Object.hasOwn(STARTER_V4, starter) ? STARTER_V4[starter] : []);
  if (starter) for (const id of STARTER_V5[starter]) out.tree[id] = 1;
  if (!isObj(rawTree)) return out;
  const owned = Object.create(null); // rising-price group -> ranks owned (the most steps any member can have been bought at)
  for (const [id, p] of Object.entries(PRICES_V4)) { const r = rankIn(rawTree, id, p.m); if (r > 0 && p.grp) owned[p.grp] = (owned[p.grp] || 0) + r; }
  for (const [id, p] of Object.entries(PRICES_V4)) {
    const rank = rankIn(rawTree, id, p.m);
    if (rank < 1 || free.has(id)) continue;
    const bound = p.grp ? owned[p.grp] - rank : 0;
    const c = frozenCostV4(p, rank, Math.min(stepsOf(ctx.creep, id), bound));
    out.gold = Math.min(MAX_BANK, out.gold + c.gold);
    out.shards = Math.min(MAX_BANK, out.shards + c.shards);
    out.glass = Math.min(MAX_BANK, out.glass + c.glass);
    out.refunded += 1;
  }
  return out;
}
