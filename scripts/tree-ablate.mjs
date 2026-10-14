// Dev probe: leave-one-group-out win rates for the FULL tree. Usage: node scripts/tree-ablate.mjs GROUP [N] [char]  (GROUP=all for the full tree)
import { readFileSync } from 'node:fs';
import { playRun } from './bot.mjs';
import { compileTree, presetTree, aggregateMods } from '../src/meta/tree.js';
const L = (n) => JSON.parse(readFileSync(new URL(`../src/data/${n}.json`, import.meta.url), 'utf8'));
const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters', 'tree'].map((n) => [n, L(n)]));
const G = {
  counts: (e) => e.weapon && ['count', 'chains', 'pierce'].includes(e.stat),
  revive: (e) => e.player === 'revive',
  levelHeal: (e) => e.player === 'levelHeal',
  hearts: (e) => e.drop,
  ability: (e) => e.mod === 'abilityCd' || e.ability || e.unlock === 'autoAbility',
  rerolls: (e) => e.unlock === 'rerolls' || e.unlock === 'banishes',
  perks: (e) => e.perk,
  hp: (e) => e.player === 'maxHp',
  power: (e) => e.weapon && e.stat === 'power',
  damage: (e) => e.mod === 'damage',
  castarea: (e) => e.mod === 'cooldown' || e.mod === 'area',
  econ: (e) => ['xp', 'pickup', 'speed', 'gold'].includes(e.mod),
  otherweapon: (e) => e.weapon && !['count', 'chains', 'pierce', 'power'].includes(e.stat),
};
const [group, N = '24', char = 'wren'] = process.argv.slice(2);
const pred = G[group] || (() => false);
for (const n of data.tree.nodes) {
  n.effects = n.effects.filter((e) => !pred(e));
  if (!n.effects.length && !n.teaser) n.effects = [{ mod: 'damage', pct: 0 }];
}
const def = compileTree(data.tree, data);
const tree = aggregateMods(presetTree(def, process.env.PRESET || 'full'), def, data);
let w = 0, t = 0, lv = 0;
for (let s = 1; s <= +N; s++) { const r = playRun(char, s, { tree }); if (r.outcome === 'victory') w++; t += r.time; lv += r.level; }
console.log(`minus ${group.padEnd(12)} ${char} win ${Math.round((w / N) * 100)}% avg ${Math.round(t / N)}s lvl ${(lv / N).toFixed(1)}`);
