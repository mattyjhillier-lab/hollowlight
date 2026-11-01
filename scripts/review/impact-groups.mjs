// Category / hero ablation of the FULL live tree: win % (random + FOCUS) with each budget category removed, per hero.
//   node scripts/review/impact-groups.mjs [seeds=48] [seedFrom=1] [cats=all|comma list]
import { data } from '../../tests/helpers.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
import { compileTree } from '../../src/meta/tree.js';
import { effectTerms } from '../../src/meta/treebudget.js';
import { runJobs, agg } from './impact-lib.mjs';
const seeds = Number(process.argv[2] || 48), from = Number(process.argv[3] || 1), only = process.argv[4] && process.argv[4] !== 'all' ? process.argv[4].split(',') : null;
const FOC = (process.argv[5] || '0,1').split(',').map(Number);
const c = loadTree(data), def = compileTree(c.live, data), rule = c.info.core.budget;
const groups = {};
for (const id of def.list) {
  const n = def.nodes[id]; if (n.teaser) continue;
  const cats = new Set();
  for (const e of n.effects) for (const t of effectTerms(e, rule)) if (t.pool !== 'none' && t.face !== 0 && !(t.face < 0)) cats.add(t.cat.startsWith('wpn:') ? t.cat : t.cat);
  for (const e of n.effects) if (e.perk === 'gemPull' || e.perk === 'gemCall') cats.add('tools');
  if (n.cluster && n.kind === 'mastery') cats.add('mastery');
  for (const k of cats) (groups[k] ||= []).push(id);
}
const names = Object.keys(groups).filter((k) => !only || only.includes(k));
const jobs = [];
const variants = ['(full)', ...names];
for (const v of variants) for (const char of ['wren', 'elias']) for (const focus of FOC) for (let s = from; s < from + seeds; s++) jobs.push({ char, seed: s, focus, remove: v === '(full)' ? [] : groups[v], tag: v });
console.error(`${jobs.length} runs`);
const res = await runJobs(jobs, { onProgress: (d, t) => console.error(`${d}/${t}`) });
const cell = (v, char, focus) => !FOC.includes(focus) ? { win: NaN } : agg(jobs.map((j, i) => (j.tag === v && j.char === char && j.focus === focus ? res[i] : null)).filter(Boolean));
console.log(`seeds ${from}..${from + seeds - 1} (n=${seeds} per cell, noise ~ +-${Math.round(100 / Math.sqrt(seeds))} pts), GATES=all, Blessings on, full live tree minus category`);
console.log('removed'.padEnd(26) + 'nodes  wren rnd/foc   elias rnd/foc   (win %)   dmg wren / elias (vs full, rnd)');
const f = { w: cell('(full)', 'wren', 0), e: cell('(full)', 'elias', 0) };
for (const v of variants) {
  const z = { win: NaN }, a = cell(v, 'wren', 0), b = FOC.includes(1) ? cell(v, 'wren', 1) : z, d = cell(v, 'elias', 0), e = FOC.includes(1) ? cell(v, 'elias', 1) : z;
  console.log(`${v.padEnd(26)}${String(v === '(full)' ? 0 : groups[v].length).padStart(4)}   ${a.win.toFixed(0).padStart(3)}/${b.win.toFixed(0).padEnd(3)}        ${d.win.toFixed(0).padStart(3)}/${e.win.toFixed(0).padEnd(3)}        ${(a.dmg / f.w.dmg * 100 - 100).toFixed(0).padStart(4)}% ${(d.dmg / f.e.dmg * 100 - 100).toFixed(0).padStart(4)}%`);
}
