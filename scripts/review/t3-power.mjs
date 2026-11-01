// Power readout of a bought tree: per budget category the face sum S, the soft total, the PE (total x weight), live tree only.
//   node scripts/review/t3-power.mjs [full|half]    (the preset ignores unlock conditions; first keystone side wins)
import { data } from '../../tests/helpers.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
import { compileTree, presetTree, aggregateMods } from '../../src/meta/tree.js';
const c = loadTree(data);
const live = compileTree(c.live, data);
const rule = c.info.core.budget;
const a = aggregateMods(presetTree(live, process.argv[2] || 'full', true), live, data);
let pe = 0, cap = 0;
console.log('category          S     C  soft   w    PE   PE@cap');
const W = Object.keys(c.info.clusters).length;
for (const [cat, r] of Object.entries(a.softcap).sort()) {
  const w = cat.startsWith('wpn:') ? (rule.perWeapon.weight * rule.perWeapon.refWeapons) / W : rule.categories[cat].weight;
  pe += r.total * w; cap += r.C * w;
  console.log(`${cat.padEnd(18)}${r.S.toFixed(1).padStart(5)} ${String(r.C).padStart(5)} ${r.total.toFixed(2).padStart(5)} ${w.toFixed(3)} ${(r.total * w).toFixed(2).padStart(5)} ${(r.C * w).toFixed(2).padStart(6)}`);
}
console.log(`combat PE at the soft totals (live tree, ${process.argv[2] || 'full'}): ${pe.toFixed(2)}  (sum of per-category caps listed: ${cap.toFixed(2)}; locked ceiling 15.18 / 15.5 incl. lore + choice)`);
console.log('mods', JSON.stringify({ damage: a.mods.damage, cooldown: a.mods.cooldown, area: a.mods.area, pickup: a.mods.pickup, xp: a.mods.xp, gold: a.mods.gold, speed: a.mods.speed }), 'maxHp', a.player.maxHp, 'status', JSON.stringify(a.status));
