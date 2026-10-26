// SUPERSEDED (T3, 2026-10-18): this is the v1 per-node PE printout and does not know the v2 effect kinds (its combat total reads NaN).
// The authoritative budget is the soft-cap table: `node scripts/tree-validate.mjs --table` (and tests/treedata.test.mjs, tests/t3b.test.mjs).
// Power budget for the skill tree fragments (src/data/tree/): prints each node's power-equivalent (PE) and the totals.
// Usage: node scripts/tree-budget.mjs [--table]   (weights are documented in docs/design/skill-tree-v1.md)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compileTree, totalCost, costFor, conditionProgress } from '../src/meta/tree.js';
import { loadTree } from '../src/meta/treefs.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
data.tree = loadTree(data).live;
const def = compileTree(data.tree, data);

// PE per unit: damage is worth its face value; everything else is diluted by how often a typical build uses it.
const W = {
  damage: 1, cooldownDps: 0.3, area: 0.12, speed: 0.25, pickup: 0.04, xp: 0.2, gold: 0.06, abilityCd: 0.08,
  tagPower: 0.35, weaponPower: 0.08, summonCount: 2.5, weaponCount: 1, pierceChain: 1, otherPct: 0.08, otherAdd: 0.6,
  maxHp: 0.2, regen: 2, revive: 4, heart: 0.04, heartHeal: 0.04, magnet: 0.025, dur: 0.03, evoLuck: 0.03, rush: 0.06, verb: 0.4, auto: 0.8,
};
export function effectPE(e) {
  if (e.mod === 'cooldown') return -e.pct * 1.07 * W.cooldownDps;
  if (e.mod === 'abilityCd') return -e.pct * W.abilityCd;
  if (e.mod) return e.pct * W[e.mod];
  if (e.player === 'maxHp') return e.pct * W.maxHp;
  if (e.player === 'regen') return e.add * W.regen;
  if (e.player === 'levelHeal') return e.pct * 0.4;
  if (e.player === 'revive') return W.revive;
  if (e.drop) return (e.pct ?? 0) * (W[e.drop] ?? 0); // pity timers (heartPity/magnetPity: secs, no weight) count 0, not NaN
  if (e.ability) return e.pct * W.dur;
  if (e.perk === 'evoLuck') return e.pct * W.evoLuck;
  if (e.perk === 'rush') return e.pct * (e.secs / 6) * W.rush;
  if (e.unlock === 'autoAbility') return W.auto;
  if (e.unlock) return W.verb;
  if (e.weapon) {
    const tag = e.weapon.startsWith('@');
    if (e.stat === 'power') return e.pct * (tag ? W.tagPower : W.weaponPower);
    if (e.stat === 'count') return e.add * (tag ? W.summonCount : W.weaponCount);
    if (e.stat === 'pierce' || e.stat === 'chains') return e.add * W.pierceChain;
    if (e.pct !== undefined) return e.pct * (tag ? W.otherPct : W.otherPct / 2);
    const base = Math.max(1, data.weapons[e.weapon].stats[e.stat].base);
    return (e.add / base) * 100 * W.otherPct / 2;
  }
  return 0;
}
// Utility effects (economy, convenience, verbs) are reported separately; the +40% cap is on combat power.
const isUtil = (e) => ['xp', 'gold', 'pickup', 'speed', 'abilityCd'].includes(e.mod) || e.ability || e.perk === 'evoLuck' || (e.unlock && e.unlock !== 'autoAbility') || e.unlock === 'autoAbility' || (e.drop === 'magnet');
const nodeUtil = (n) => n.effects.filter(isUtil).reduce((a, e) => a + effectPE(e), 0) * n.maxRank;
const nodeAll = (n) => n.effects.reduce((a, e) => a + effectPE(e), 0) * n.maxRank;
const nodePE = (n) => nodeAll(n) - nodeUtil(n);

// Rival groups: count only the better side (a player can own one).
const skip = new Set();
for (const id of def.list) {
  for (const r of def.nodes[id].excludes) {
    if (skip.has(id) || skip.has(r)) continue;
    skip.add(nodePE(def.nodes[id]) >= nodePE(def.nodes[r]) ? r : id);
  }
}
const rows = def.list.filter((id) => !def.nodes[id].teaser).map((id) => ({ id, n: def.nodes[id], pe: nodePE(def.nodes[id]), skipped: skip.has(id) }));
const byBranch = {};
let total = 0;
let util = 0;
for (const r of rows) {
  if (r.skipped) continue;
  byBranch[r.n.branch] = (byBranch[r.n.branch] || 0) + r.pe;
  total += r.pe;
  util += nodeUtil(r.n);
}
if (process.argv.includes('--table')) {
  console.log('| id | name | branch | tier | ranks | gold | shards | requires | unlock condition | effect (numbers are per node) | combat PE (utility not counted) |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  const cond = (n) => (n.unlock ? conditionProgress(n.unlock, {}, def, data).lines.map((l) => l.text).join(n.unlock.t === 'any' ? ' OR ' : ' AND ') : '');
  for (const id of def.list) {
    const n = def.nodes[id];
    let g = 0, sh = 0;
    for (let k = 1; k <= n.maxRank; k++) { const c = costFor(n, k); g += c.gold; sh += c.shards; }
    const r = rows.find((x) => x.id === id);
    const pe = n.teaser ? '-' : `${r.pe.toFixed(1)}${r.skipped ? ' (rival)' : ''}`;
    const tag = n.teaser ? ' (teaser)' : n.hidden ? ' (hidden)' : n.keystone ? ' (keystone)' : '';
    const text = n.teaser || n.hidden ? '???' : cond(n);
    console.log(`| ${id} | ${n.name}${tag} | ${n.branch} | ${n.ring} | ${n.maxRank} | ${g} | ${sh} | ${n.requires.join(', ') || 'hub'} | ${n.teaser ? 'unknown (future chapter)' : n.hidden ? '??? (hidden: ' + cond(n) + ')' : text} | ${n.desc.split('|').join('/')} | ${pe} |`);
  }
}
const tc = totalCost(def);
console.log(`nodes ${def.list.length} (teasers ${def.list.filter((i) => def.nodes[i].teaser).length}); locked-by-condition ${def.list.filter((i) => def.nodes[i].unlock && !def.nodes[i].teaser).length}`);
console.log('PE per branch:', Object.entries(byBranch).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(' | '), `| COMBAT TOTAL ${total.toFixed(1)} (cap 40) | utility ${util.toFixed(1)} (not capped)`);
console.log(`total cost: ${tc.gold} gold, ${tc.shards} shards`);
const biggest = rows.filter((r) => !r.skipped).sort((a, b) => b.pe - a.pe).slice(0, 5).map((r) => `${r.id} ${r.pe.toFixed(1)}`);
console.log('largest single nodes:', biggest.join(', '));
