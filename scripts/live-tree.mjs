// Shared helper for the probes that run on the LIVE bot (scripts/bot.mjs playRun: dodge, Blessings, Bond, map events):
// rt-matrix.mjs and the ported gates-kits / gates-softcap / gates-ablate. Pure tree helpers (soft cap, strip) have no side effects;
// liveTreeFactory() must be called inside a worker AFTER its env (TIER, GATES, BLESS, ...) is set, because bot.mjs reads the env at import.
import { readFileSync } from 'node:fs';

// ---- soft cap (applied to aggregateMods output): total = cap * (1 - exp(-sum/cap)); negatives pass through.
export const SOFT = {
  // percent caps per stat category (the asymptote of the positive total)
  mod_damage: 20, mod_area: 20, mod_cooldown: 15, mod_speed: 10, mod_pickup: 40, mod_xp: 25, mod_gold: 40, mod_abilityCd: 40,
  maxHp: 20, levelHeal: 6, heart: 100, magnet: 100, heartHeal: 60, abilityDur: 40,
  w_power: 25, w_other: 20,
};
const sc = (s, cap) => (s <= 0 ? s : cap * (1 - Math.exp(-s / cap)));
export function softCap(agg, caps = SOFT, scale = 1) {
  if (!agg) return agg;
  const o = JSON.parse(JSON.stringify(agg));
  const P = (v, cap) => 1 + sc((v - 1) * 100, cap * scale) / 100;
  for (const k of ['damage', 'area', 'speed', 'pickup', 'xp', 'gold']) o.mods[k] = P(agg.mods[k], caps[`mod_${k}`]);
  for (const k of ['cooldown', 'abilityCd']) { const red = (1 - agg.mods[k]) * 100; o.mods[k] = 1 - sc(red, caps[`mod_${k}`] * scale) / 100; }
  o.player.maxHp = P(agg.player.maxHp, caps.maxHp);
  o.player.levelHeal = sc(agg.player.levelHeal, caps.levelHeal * scale);
  for (const k of ['heart', 'magnet', 'heartHeal']) o.drops[k] = P(agg.drops[k], caps[k]);
  o.ability.dur = P(agg.ability.dur, caps.abilityDur);
  for (const w of Object.values(o.weaponBonus)) for (const [stat, b] of Object.entries(w)) b.pct = sc(b.pct, (stat === 'power' ? caps.w_power : caps.w_other) * scale);
  return o;
}
// Zero out groups of the aggregate (mutates): rerolls, revive, perks, auto, heal, flat, ability, evos (no gated evolution can appear).
export function applyStrip(agg, strip = []) {
  for (const g of strip) {
    if (g === 'rerolls') { agg.meta.rerolls = 0; agg.meta.banishes = 0; }
    if (g === 'revive') agg.player.revive = 0;
    if (g === 'perks') { agg.rush = null; agg.evoLuck = 1; }
    if (g === 'auto') agg.ability.autoHp = 0;
    if (g === 'heal') { agg.player.levelHeal = 0; agg.drops = { heart: 1, magnet: 1, heartHeal: 1 }; }
    if (g === 'flat') for (const w of Object.values(agg.weaponBonus)) for (const b of Object.values(w)) b.add = 0;
    if (g === 'ability') { agg.mods.abilityCd = 1; agg.ability.dur = 1; }
    if (g === 'evos') agg.unlocks.evolutions = [];
  }
  return agg;
}

// Worker side. Returns treeFor(name, weapon, tier, spec): the aggregate a save with that tree state would give.
//  name: none = brand-new save (starter grant of the starting weapon only); half/full = presetTree WITH the gate nodes + the starter grant.
//  spec: { extra:[weapon ids whose starter grant is also owned], open:true (every gated weapon/evolution unlocked), soft:true, scale, strip:[...] }
export async function liveTreeFactory() {
  const { compileTree, presetTree, aggregateMods } = await import('../src/meta/tree.js');
  const { loadTree } = await import('../src/meta/treefs.mjs');
  const { starterNodes } = await import('../src/meta/starter.js');
  const { tierIndex } = await import('../src/sim/tiers.js');
  const dir = new URL('../src/data/', import.meta.url);
  const load = (n) => JSON.parse(readFileSync(new URL(`${n}.json`, dir), 'utf8'));
  const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
  const composed = loadTree(data); data.tree = composed.live;
  const def = compileTree(data.tree, data);
  const treeFor = (name, weapon, tier, spec = {}) => {
    const own = Object.fromEntries([weapon, ...(spec.extra || [])].flatMap((w) => starterNodes(composed.info, w)).map((id) => [id, 1]));
    const t = name === 'none' ? own : { ...presetTree(def, name, true), ...own };
    let agg = aggregateMods(t, def, data, { tier: tierIndex(tier) });
    if (spec.soft) agg = softCap(agg, SOFT, spec.scale || 1);
    if (spec.open) {
      const ws = Object.keys(data.weapons).filter((i) => data.weapons[i].treeGate), es = Object.keys(data.evolutions).filter((i) => data.evolutions[i].treeGate);
      agg.unlocks = { ...agg.unlocks, weapons: [...new Set([...agg.unlocks.weapons, ...ws])], evolutions: [...new Set([...agg.unlocks.evolutions, ...es])] };
    }
    return applyStrip(agg, spec.strip);
  };
  return { treeFor, def, data };
}
