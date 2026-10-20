// NODE IMPACT AUDIT of the live tree. For every purchasable live node (gates excluded):
//   * analytic marginal power: combat PE (soft-cap aware: PE(full) - PE(full without the node)), sustain PE, utility face;
//   * optional measured ablation (paired seeds, bot, GATES=all, Blessings on): win %, damage, survival time, hp lost for full minus node.
//   node scripts/review/tree-impact.mjs [simSeeds=0] [out=docs/design/tree-impact.md] [chars=wren,elias]
// Slices: ONLY=<cluster,...> measures only those clusters (rings / tools / a weapon id) and MEAS_OUT=<file.json> saves the raw measurement;
//   MEAS_IN=<a.json,b.json,...> loads saved slices into the report (no sim). Win-point deltas of a single 0.05 PE node are far below the noise: read the paired damage delta (+-SE) and the 'detectable' flag.
// simSeeds 0 = analytic only (instant). Measured columns need ~ nodes x chars x seeds bot runs (slow); noise per node is large, read them
// as a sanity check next to the analytic PE, and trust the per-category group sweeps (impact-groups.mjs) for win %.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { data } from '../../tests/helpers.mjs';
import { loadTree } from '../../src/meta/treefs.mjs';
import { compileTree, presetTree, aggregateMods } from '../../src/meta/tree.js';
import { effectTerms } from '../../src/meta/treebudget.js';
import { runJobs, agg, paired } from './impact-lib.mjs';

const simSeeds = Number(process.argv[2] || 0);
const outPath = process.argv[3] || 'docs/design/tree-impact.md';
const chars = (process.argv[4] || 'wren,elias').split(',');
const c = loadTree(data), def = compileTree(c.live, data), rule = c.info.core.budget;
const W = Object.keys(c.info.clusters).length;
const full = presetTree(def, 'full', true);
const wOf = (cat) => (cat.startsWith('wpn:') ? (rule.perWeapon.weight * rule.perWeapon.refWeapons) / W : rule.categories[cat] ? rule.categories[cat].weight : 0);
const combatPE = (tree) => { const a = aggregateMods(tree, def, data); let pe = 0; for (const [cat, r] of Object.entries(a.softcap)) pe += r.total * wOf(cat); return pe; };
const susOf = (tree) => {
  let rr = 0, bb = 0, hd = 0, hh = 0, hp = 0, rev = 0;
  for (const [id, r] of Object.entries(tree)) for (const e of def.nodes[id].effects) for (const t of effectTerms(e, rule)) if (t.pool === 'sustain') {
    if (t.cat === 'revive') rev = 1; else if (t.cat === 'reroll') rr += t.face * r; else if (t.cat === 'banish') bb += t.face * r; else if (t.cat === 'heartDrop') hd += t.face * r; else if (t.cat === 'heartHeal') hh += t.face * r; else if (t.cat === 'heartPity') hp += t.face * r;
  }
  return (rev ? rule.sustain.revive : 0) + rr * rule.sustain.perReroll + bb * rule.sustain.perBanish + hd * rule.sustain.heartDrop + hh * rule.sustain.heartHeal + hp * (rule.sustain.heartPity || 0);
};
const basePE = combatPE(full), baseSus = susOf(full);
const rows = [];
for (const id of def.list) {
  const n = def.nodes[id];
  if (n.teaser || !full[id]) continue; // exclusive-pair losers and teasers are not in the full preset
  const isGate = n.effects.some((e) => e.unlock === 'weapon' || e.unlock === 'evolution' || e.unlock === 'hero');
  const without = { ...full }; delete without[id];
  const dPE = basePE - combatPE(without), dSus = baseSus - susOf(without);
  const util = [];
  for (const e of n.effects) for (const t of effectTerms(e, rule)) { if (t.pool === 'util' && t.face) util.push(`${t.cat} ${t.face > 0 ? '+' : ''}${t.face}`); }
  rows.push({ id, name: n.name, cluster: n.cluster || (n.region === 'tools' ? 'tools' : 'rings'), kind: n.kind || '', rank: full[id], isGate, dPE, dSus, util: util.join(', '), desc: JSON.stringify(n.effects).slice(0, 90), hasPerk: n.effects.some((e) => e.perk || e.unlock || e.ability || e.visual || e.info) });
}
const UTIL_CAP = { speed: rule.utility.speed, pickup: rule.utility.pickup, xp: rule.utility.xp, gold: rule.utility.gold, abilityCd: rule.utility.abilityCdMax };
function klass(r) {
  if (r.isGate) return 'gate';
  const p = r.dPE + r.dSus;
  if (p >= 0.25) return 'strong';
  if (p >= 0.1) return 'medium';
  if (p >= 0.03) return 'weak';
  if (r.util || r.hasPerk) {
    const m = /^(\w+) ([+-][\d.]+)/.exec(r.util || '');
    if (m && !UTIL_CAP[m[1]]) return 'option'; // uncapped utility stats (magnet drops, summon/magic speed): a visible effect, judged by the sim column
    if (m && UTIL_CAP[m[1]]) { const fr = Math.abs(Number(m[2])) / UTIL_CAP[m[1]]; return fr >= 0.2 ? 'medium(util)' : fr >= 0.1 ? 'weak(util)' : 'dead?(util)'; }
    return r.hasPerk ? 'option' : 'dead';
  }
  return 'dead';
}
for (const r of rows) r.klass = klass(r);

// ---- measured ablation
let meas = null;
if (process.env.MEAS_IN) { meas = {}; for (const p of process.env.MEAS_IN.split(',')) Object.assign(meas, JSON.parse(readFileSync(p, 'utf8'))); }
if (simSeeds > 0) {
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const ids = rows.filter((r) => !r.isGate && (!only || only.includes(r.cluster))).map((r) => r.id);
  const jobs = [];
  const variants = ['(full)', ...ids];
  for (const v of variants) for (const char of chars) for (let s = 1; s <= simSeeds; s++) jobs.push({ char, seed: s, focus: 0, remove: v === '(full)' ? [] : [v], tag: v });
  console.error(`${jobs.length} sim runs`);
  const res = await runJobs(jobs, { onProgress: (d, t) => console.error(`${d}/${t}`) });
  meas = {};
  meas._full = {};
  const sel = (v, ch) => jobs.map((j, i) => (j.tag === v && j.char === ch ? res[i] : null)).filter(Boolean);
  for (const id of ids) {
    meas[id] = {};
    for (const ch of chars) {
      const A = sel('(full)', ch), B = sel(id, ch);
      meas._full[ch] = agg(A).dmg;
      meas[id][ch] = { win: agg(A).win - agg(B).win, dmg: paired(A, B, (r) => r.dmg), time: paired(A, B, (r) => r.time), hp: paired(B, A, (r) => r.hpLost) };
    }
  }
  if (process.env.MEAS_OUT) { writeFileSync(process.env.MEAS_OUT, JSON.stringify(meas)); console.log('saved ' + process.env.MEAS_OUT); process.exit(0); }
}

// ---- report
const f2 = (x) => x.toFixed(2);
const group = (key) => {
  const g = {};
  for (const r of rows) {
    const k = key(r);
    const x = g[k] || (g[k] = { n: 0, pe: 0, sus: 0, dead: 0, weak: 0, strong: 0, medium: 0 });
    x.n++; x.pe += r.dPE; x.sus += r.dSus;
    if (/dead/.test(r.klass)) x.dead++;
    if (/weak/.test(r.klass)) x.weak++;
    if (r.klass === 'strong') x.strong++;
    if (/medium/.test(r.klass)) x.medium++;
  }
  return g;
};
// sim verdict from the paired damage delta, pooled over the measured heroes: relative loss d (% of the full-tree damage) and its z = d / SE
const simVerdict = (id) => {
  const m = meas && meas[id]; if (!m) return '-';
  const ds = Object.entries(m).map(([ch, x]) => ({ d: x.dmg.mean / meas._full[ch] * 100, se: x.dmg.se / meas._full[ch] * 100 }));
  const d = ds.reduce((a, x) => a + x.d, 0) / ds.length, se = Math.sqrt(ds.reduce((a, x) => a + x.se * x.se, 0)) / ds.length, z = d / (se || 1);
  const c = z > 2 ? (d >= 3 ? 'strong' : d >= 1 ? 'medium' : 'weak') : 'below noise';
  return `${c} (${d.toFixed(1)}% +-${se.toFixed(1)})`;
};
const L = [];
L.push('# Skill tree impact audit (live tree, T3)', '');
L.push(`Generated by \`scripts/review/tree-impact.mjs\` ${simSeeds ? `(measured: full minus node, ${simSeeds} paired seeds x ${chars.join('+')}, random-pick bot, GATES=all, Blessings on)` : '(analytic only)'}.`, '');
L.push('**Method.** Marginal PE = combat PE of the full live tree minus the PE of the same tree without that node, through the real soft cap C(1-e^(-S/C)) and category weights (a node in a saturated category is worth less than its face). Sustain PE uses the sustain weights (revive 4, reroll/banish 0.1 each, hearts). Class: strong >= 0.25 PE, medium >= 0.10, weak >= 0.03, dead < 0.03 with no option/utility value. Utility nodes (pickup, xp, gold, speed, ability cooldown) are judged by face / utility cap (medium >= 20%, weak >= 10%); perks, unlocks and visuals are `option`. Gates are not scored (they add content, not stats). Measured columns (if present) are paired-seed full-minus-node deltas: win points lost, damage dealt lost (+-1 SE).', '');
L.push(`Full live tree: combat PE ${f2(basePE)} (ceiling ${rule.base.combat}; cap sum of the live categories ${f2(Object.values(rule.categories).reduce((a, c) => a + c.cap * c.weight, 0) + rule.perWeapon.cap * rule.perWeapon.weight * rule.perWeapon.refWeapons)}; the lore + choice reserve is loaned to the live caps until Card Fan / Almanac / Hearth-key / Night Gate go live), sustain PE ${f2(baseSus)} (ceiling 5.0).`, '');
L.push('## Per cluster', '', '| Cluster | nodes | combat PE | sustain PE | strong | medium | weak | dead |', '|---|---|---|---|---|---|---|---|');
for (const [k, x] of Object.entries(group((r) => r.cluster)).sort()) L.push(`| ${k} | ${x.n} | ${f2(x.pe)} | ${f2(x.sus)} | ${x.strong} | ${x.medium} | ${x.weak} | ${x.dead} |`);
const heroPE = (wid) => rows.filter((r) => r.cluster === wid).reduce((a, r) => a + r.dPE, 0);
L.push('', '## Per hero', '', `Wren's weapon cluster (ghost_wolves): ${f2(heroPE('ghost_wolves'))} PE; Elias's (holy_orbit): ${f2(heroPE('holy_orbit'))} PE. Rings, tools and the other weapon clusters are shared; they only help when that weapon is picked.`, '');
L.push('## Nodes', '', `| id | name | cluster | kind | rank | class | combat PE | sustain PE | utility |${meas ? chars.map((ch) => ` win ${ch} | dmg ${ch} |`).join('') + ' sim verdict |' : ''}`, `|---|---|---|---|---|---|---|---|---|${meas ? chars.map(() => '---|---|').join('') + '---|' : ''}`);
const order = { strong: 0, medium: 1, 'medium(util)': 2, option: 3, weak: 4, 'weak(util)': 5, 'dead?(util)': 6, dead: 7, gate: 8 };
for (const r of rows.sort((a, b) => (order[a.klass] - order[b.klass]) || (b.dPE + b.dSus - a.dPE - a.dSus))) {
  let m = '';
  if (meas && !r.isGate && !meas[r.id]) m = chars.map(() => ' - | - |').join('') + ' - |';
  else if (meas && !r.isGate) m = chars.map((ch) => { const x = meas[r.id][ch]; return ` ${x.win >= 0 ? '+' : ''}${x.win.toFixed(0)} | ${(x.dmg.mean / 1000).toFixed(1)}k +-${(x.dmg.se / 1000).toFixed(1)}k |`; }).join('') + ` ${simVerdict(r.id)} |`;
  else if (meas) m = chars.map(() => ' - | - |').join('') + ' - |';
  L.push(`| ${r.id} | ${r.name} | ${r.cluster} | ${r.kind} | ${r.rank} | ${r.klass} | ${f2(r.dPE)} | ${f2(r.dSus)} | ${r.util} |${m}`);
}
const dead = rows.filter((r) => /dead/.test(r.klass));
L.push('', `## Dead / padding candidates (${dead.length})`, '', dead.map((r) => `- \`${r.id}\` ${r.desc}`).join('\n'), '');
writeFileSync(outPath, L.join('\n'));
console.log(`wrote ${outPath}: ${rows.length} nodes, classes: ${JSON.stringify(rows.reduce((a, r) => (a[r.klass] = (a[r.klass] || 0) + 1, a), {}))}`);
