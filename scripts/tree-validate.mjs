// Skill tree validator (skeleton from T1; the scaffold and the full content guide arrive in T8).
//   node scripts/tree-validate.mjs [--table] [--svg out/tree-layout.svg] [--synthetic 1000|2000]
// Checks, exit 1 on any failure: fragment schema + namespaces + idx (composeTree), live compile, v2 compile (template requires,
// requiresAny gate rule, node overlap), layout/clearance, power budget (rule ceilings), id snapshot. Reads src/data/tree/ only.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compileTree } from '../src/meta/tree.js';
import { readTreeFiles, addExtra } from '../src/meta/treefs.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { budgetOf, formatBudget } from '../src/meta/treebudget.js';
import { layoutIssues, connectIssues } from '../src/meta/treelayout.js';
import { loadRealData, buildSynthetic } from './tree-synth.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

let failed = false;
const bad = (m) => { failed = true; console.log(`FAIL ${m}`); };
const ok = (m) => console.log(`ok   ${m}`);

// --extra <dir>: also load test-only fragments + <dir>-data.json (TREE-GEN1 synthetic third hero / weapon proof)
const EXTRA = val('--extra');
const { files: FILES, data } = addExtra(readTreeFiles(), loadRealData(), EXTRA);
let composed;
try { composed = composeTree(FILES, data); ok(`fragments compose (${composed.info.nodes.length} nodes in ${new Set(composed.info.nodes.map((n) => n.frag)).size} fragments)`); } catch (e) { bad(e.message); process.exit(1); }
let live, v2;
try { live = compileTree(composed.live, data); ok(`live tree compiles (${live.list.length} live nodes, ${live.pendingList.length} inert)`); } catch (e) { bad(`live: ${e.message}`); }
try { v2 = compileTree(composed.v2, data); ok(`v2 tree compiles (${v2.list.length} nodes)`); } catch (e) { bad(`v2: ${e.message}`); }
let issues = [];
if (v2) {
  issues = layoutIssues(composed.info, v2);
  issues.length ? issues.forEach((i) => bad(`layout: ${i}`)) : ok('layout and graph checks');
  const b = budgetOf(v2, composed.info.core.budget, Object.keys(composed.info.clusters).length);
  b.violations.length ? b.violations.forEach((v) => bad(`budget: ${v}`)) : ok(`budget: combat PE at cap ${b.combatAtCap.toFixed(2)} (ceiling ${composed.info.core.budget.base.combat}), sustain ${b.sustainPE.toFixed(2)} (ceiling ${composed.info.core.budget.base.sustain})`);
  if (flag('--table')) console.log(`\n${formatBudget(b)}\n`);
}
// connected-unlock rule (LOCKED 2026-10-21): hard on the live tree; on the design tree, a finding about a group that is still inert is PENDING
// (it must be fixed before that group goes live, when it becomes a live failure)
if (live) {
  const ci = connectIssues(composed.info, live);
  ci.length ? ci.forEach((i) => bad(`connected rule: ${i}`)) : ok('connected rule: every lantern links to something lit, no far links, every group has a gold-only way in');
}
if (live && v2) {
  const liveSet = new Set(connectIssues(composed.info, live));
  const inert = new Set(composed.info.nodes.filter((n) => n.inert).map((n) => n.id));
  for (const i of connectIssues(composed.info, v2)) {
    if (liveSet.has(i)) continue;
    const ids = (i.match(/\b[a-z]{2}_[a-z0-9_]+/g) || []).filter((x) => composed.info.nodes.some((n) => n.id === x));
    if (ids.length && ids.every((x) => inert.has(x))) console.log(`pend connected rule (inert group, fix before it goes live): ${i}`);
    else bad(`connected rule (design tree): ${i}`);
  }
}
try {
  const snap = JSON.parse(readFileSync(join(root, 'tests', 'fixtures', 'tree-ids.json'), 'utf8'));
  const now = Object.fromEntries(composed.info.nodes.map((n) => [n.id, [n.frag, n.idx]]));
  const retired = new Set(composed.info.core.retired.map((t) => t.id));
  let n = 0;
  for (const [id, v] of Object.entries(snap)) if (!retired.has(id) && JSON.stringify(now[id]) !== JSON.stringify(v)) { bad(`id ${id} moved or vanished`); n++; }
  for (const id of Object.keys(now)) if (!snap[id]) {
    if (EXTRA) { console.log(`extra ${id} (test-only --extra fixture, not in the snapshot)`); continue; }
    bad(`id ${id} is not in tests/fixtures/tree-ids.json (add it deliberately)`); n++; }
  if (!n) ok('ids and idx match the append-only snapshot');
} catch (e) { bad(`id snapshot: ${e.message}`); }
if (val('--synthetic')) {
  const n = Number(val('--synthetic'));
  if (!(n >= 125 && n <= 4000)) bad('--synthetic takes 125..4000');
  else { const r = buildSynthetic(data, n); ok(`synthetic ${r.def.list.length} nodes: compose ${r.msCompose.toFixed(1)} ms, compileTree ${r.msCompile.toFixed(1)} ms`); }
}
if (val('--svg') && v2) {
  const out = val('--svg');
  if (!/^[\w./\\-]+\.svg$/.test(out) || out.includes('..')) bad('--svg path must be a plain relative .svg path');
  else {
    const pts = v2.list.map((id) => v2.nodes[id]);
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs) - 60, y0 = Math.min(...ys) - 60, w = Math.max(...xs) - x0 + 60, h = Math.max(...ys) - y0 + 60;
    const col = (p) => (p.permanent ? '#e8c46a' : p.teaser ? '#777' : p.branch === 'magic' ? '#7ff0ff' : p.branch === 'summoner' ? '#b9a2ff' : p.branch === 'light' ? '#ffd27a' : '#6fd3c5');
    const lines = [];
    for (const e of v2.edges) { if (e.from === 'hub') continue; const a = v2.nodes[e.from], b = v2.nodes[e.to]; lines.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#445" stroke-width="1"${e.any ? ' stroke-dasharray="3 3"' : ''}/>`); }
    const dots = pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${p.permanent ? 7 : 5}" fill="${col(p)}"><title>${p.id}</title></circle>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" width="1200" style="background:#10141c">${lines.join('')}${dots.join('')}</svg>`;
    mkdirSync(dirname(join(root, out)), { recursive: true });
    writeFileSync(join(root, out), svg);
    ok(`layout drawn to ${out}`);
  }
}
process.exit(failed ? 1 : 0);
