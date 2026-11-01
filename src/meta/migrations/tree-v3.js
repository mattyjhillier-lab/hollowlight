// Tree migration step 3: "Regrowth" (docs/design/skill-tree-v2.md section 7, Appendix C.8).
// The v2 Lantern Web changes the effect and price of most kept ids, so every NON-permanent owned node is refunded at its OLD price
// (from the FROZEN table, never from save data or live data) and cleared; permanent gate nodes (weapon/evolution unlocks) and
// their ids stay owned untouched. Pure, idempotent (a regrown tree owns only gates, which refund nothing), O(owned nodes).
// Input is untrusted: only own keys of the frozen table are read, ranks are clamped, results are clamped to MAX.
import { PRICES_V3 } from './tree-v3.prices.js';

export const MAX_BANK = 1e12;
const fin = (v) => typeof v === 'number' && Number.isFinite(v);

// Gold + shards the OLD price table charges for ranks 1..rank of one node.
export function oldCost(price, rank) {
  let gold = 0;
  for (let k = 1; k <= rank; k++) gold += price.g === 0 ? 0 : Math.max(10, Math.round((price.g * Math.pow(price.c, k - 1)) / 10) * 10);
  return { gold, shards: price.s * rank };
}

// rawTree: the old object-form tree { id: rank }. -> { tree, refund: { gold, shards }, refunded: number of nodes refunded }
export function regrow(rawTree) {
  const tree = {};
  const refund = { gold: 0, shards: 0 };
  let refunded = 0;
  if (rawTree === null || typeof rawTree !== 'object' || Array.isArray(rawTree)) return { tree, refund, refunded };
  for (const id of Object.keys(PRICES_V3)) {
    if (!Object.hasOwn(rawTree, id)) continue;
    const p = PRICES_V3[id];
    const v = rawTree[id];
    const rank = Math.min(p.m, Math.max(0, Math.floor(fin(v) ? v : v === true ? 1 : 0)));
    if (rank < 1 || p.t) continue;
    if (p.p) { tree[id] = 1; continue; } // permanent gate: stays owned, nothing refunded
    const c = oldCost(p, rank);
    refund.gold = Math.min(MAX_BANK, refund.gold + c.gold);
    refund.shards = Math.min(MAX_BANK, refund.shards + c.shards);
    refunded += 1;
  }
  return { tree, refund, refunded };
}
