// Mutation test of the tree budget (src/meta/treebudget.js) on the v2 view, in memory only.
// Each mutant SHOULD be reported as a violation. Prints caught/missed per mutant.
// Usage: node scripts/review/budget-mutation.mjs
import { data } from '../../tests/helpers.mjs';
import { compileTree } from '../../src/meta/tree.js';
import { composeTree } from '../../src/meta/treedata.js';
import { readTreeFiles } from '../../src/meta/treefs.mjs';
import { budgetOf } from '../../src/meta/treebudget.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const run = (mut) => {
  const fs = clone(readTreeFiles());
  mut(fs);
  const c = composeTree(fs, data);
  const def = compileTree(c.v2, data);
  return budgetOf(def, c.info.core.budget, Object.keys(c.info.clusters).length);
};
const core = (fs) => fs.find((f) => f.path === 'core.json').json;
const node = (fs, id) => core(fs).nodes.find((n) => n.id === id);
let nextIdx = 60;
const ring = (fs, effects) => {
  const used = new Set(core(fs).nodes.filter((n) => n.place && n.place.ring === 'dusk').map((n) => n.place.i));
  let i = 0;
  while (used.has(i)) i++; // the one free dusk slot
  core(fs).nodes.push({ id: `li_mut${nextIdx}`, idx: nextIdx++, kind: 'ring', inert: true, name: 'Mutant', desc: 'mutant', cost: { gold: 100 }, place: { ring: 'dusk', i }, effects });
};

const mutants = {
  'baseline (must be clean)': () => {},
  'cap raised (dmg 3 -> 4)': (fs) => { core(fs).budget.categories.dmg.cap = 4; },
  'extra sustain ring node (heart drop +10%)': (fs) => ring(fs, [{ drop: 'heart', pct: 10 }]),
  'five health ring nodes turned into +3% damage (dmg category stuffed far past its 3% cap)': (fs) => { const hp = core(fs).nodes.filter((n) => !n.keystone && (n.effects || []).some((e) => e.player === 'maxHp')).slice(0, 5); for (const n of hp) n.v2 = { ...(n.v2 || {}), effects: [{ mod: 'damage', pct: 3 }] }; },
  'exclusive pair hides sustain: Lantern side +heart drop 10%, Glass side +3% damage': (fs) => {
    const l = node(fs, 'li_lantern'), g = node(fs, 'li_glass');
    l.v2 = { ...(l.v2 || {}), effects: [...(l.v2 && l.v2.effects ? l.v2.effects : l.effects), { drop: 'heart', pct: 10 }] };
    g.v2 = { ...(g.v2 || {}), effects: [{ mod: 'damage', pct: 3 }, { player: 'maxHp', pct: -4 }] };
  },
};
let missed = 0;
for (const [name, mut] of Object.entries(mutants)) {
  let b;
  try { b = run(mut); } catch (e) { console.log(`${name}: compile rejected (${e.message.slice(0, 80)})`); continue; }
  const v = b.violations;
  const isBase = name.startsWith('baseline');
  const ok = isBase ? v.length === 0 : v.length > 0;
  if (!ok) missed++;
  console.log(`${ok ? 'OK    ' : 'MISSED'} ${name}: combatPE ${b.combatPE.toFixed(2)}, sustain ${b.sustainPE.toFixed(2)}, violations: ${v.length ? v.join(' | ').slice(0, 140) : 'none'}`);
}
console.log(`budget-mutation: ${missed} mutants not caught`);
process.exitCode = missed ? 1 : 0;
