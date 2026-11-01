// Shared helpers for the save-v3 adversarial review scripts (docs/design/save-v3-review.md).
// No network, no writes outside os.tmpdir(). Independent of src/ where possible (the v1 rules are re-implemented here).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
export const V1 = readJson('tests/fixtures/tree-v1.json');

export const memStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};

// Seeded RNG (mulberry32), independent copy.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- independent v1 purchase model (from tests/fixtures/tree-v1.json, not from src/)
export const isGateV1 = (n) => (n.effects || []).some((e) => ['weapon', 'evolution', 'hero'].includes(e.unlock));
export function v1Price(n, rank) {
  const g = (n.cost && n.cost.gold) || 0;
  const rc = n.rankCost || 1;
  const gold = g === 0 ? 0 : Math.max(10, Math.round((g * Math.pow(rc, rank - 1)) / 10) * 10);
  return { gold, shards: (n.cost && n.cost.shards) || 0 };
}
// Buys random legal nodes (v1 rules: requires all owned, no owned rival, not teaser, below maxRank; conditions assumed met).
// Returns { tree, spent: {gold, shards}, gateSpent: {gold, shards} }.
export function v1RandomBuys(rand, steps) {
  const byId = Object.fromEntries(V1.nodes.map((n) => [n.id, n]));
  const excl = {};
  for (const n of V1.nodes) for (const x of n.excludes || []) { (excl[n.id] ||= new Set()).add(x); (excl[x] ||= new Set()).add(n.id); }
  const tree = {};
  const spent = { gold: 0, shards: 0 };
  const gateSpent = { gold: 0, shards: 0 };
  for (let s = 0; s < steps; s++) {
    const legal = V1.nodes.filter((n) => {
      const r = tree[n.id] || 0;
      if (n.teaser || r >= (n.maxRank || 1)) return false;
      if ((n.requires || []).some((q) => !tree[q])) return false;
      if (r === 0 && [...(excl[n.id] || [])].some((x) => tree[x])) return false;
      return true;
    });
    if (!legal.length) break;
    const n = legal[Math.floor(rand() * legal.length)];
    const rank = (tree[n.id] || 0) + 1;
    const c = v1Price(n, rank);
    spent.gold += c.gold; spent.shards += c.shards;
    if (isGateV1(n)) { gateSpent.gold += c.gold; gateSpent.shards += c.shards; }
    tree[n.id] = rank;
  }
  return { tree, spent, gateSpent, byId };
}

// Stats that meet every v1 unlock condition.
export const BIG_STATS = {
  runs: 999, wins: 999, kills: 1e8, bestTime: 900, totalPlayTime: 1e6, bestLevel: 200, totalGold: 1e8,
  killsByEnemy: { wolf: 1e7, crow: 1e7, root_crawler: 1e7, elder_treant: 99 },
  bossKills: { elder_treant: 99 },
  chapters: { cursed_forest: { runs: 99, clears: 99, bestTime: 900 } },
  evolved: Object.fromEntries(Object.keys(readJson('src/data/evolutions.json')).map((k) => [k, 50])),
  weaponsUsed: Object.fromEntries(Object.keys(readJson('src/data/weapons.json')).map((k) => [k, 50])),
  charsUsed: Object.fromEntries(Object.keys(readJson('src/data/characters.json')).map((k) => [k, 99])),
};
