// CONNECTED-UNLOCK RULE: dry-run data patch + the rule itself, for the economy/balance analysis (APPLIED to the data in T3c 2026-10-21: a re-run
// now finds 0 edits; the engine rule is tree.js isLinked, the checks are treelayout.js connectIssues) (LOCKED 2026-10-21 'Tree look +
// connected-unlock rule'). NOTHING here writes game data: it patches an in-memory copy of the composed tree so scripts/tree-timeline.mjs
// can model the rule, and prints the exact list of data edits a later build chunk would make.
//
//   node scripts/tree-connected-patch.mjs            print the dry-run edit list (design tree)
//   node scripts/tree-connected-patch.mjs --live     same for the live tree only
//   node scripts/tree-connected-patch.mjs --md docs/design/tree-connected-patch.md   also write the markdown patch file
//
// The rule (Matt): a node is buyable only if it is directly linked to ANY owned node AND its condition is met. Exceptions (locked):
//  E1 weapon hearts stay linked to the hub as challenges;  E2 an evolution seal opens once its spirit (weapon) is woken;
//  E3 starter display hearts count as lit (starter constellations are awake from run 1);  E4 far group roots get a gold-only bridge.
// Data edits (locked, data only): far next-rank lanterns move beside their parent; the 2 'needs all' joins become 'any one'.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileTree } from '../src/meta/tree.js';

export const LINK_FAR = 350; // a link longer than this is "far" (the v2 screen never draws it across the web)
const NEAR_HUB = 360; // hearth (150) + wick (300) rings + 60: hub-linked lanterns this close count as linked to the lit hub
export const BRIDGE = { gold: 250, r: 1000, effect: { perk: 'gemPull', pct: 5 } }; // proposed bridge lantern (gold only, utility, no combat/sustain PE)
const BRIDGE_NAMES = { satchel: 'Satchel Path', cardfan: 'Card Fan Path', almanac: 'Almanac Path', hearthkey: 'Hearth-key Path' };

const polar = (r, a) => [Math.round(r * Math.cos((a * Math.PI) / 180) * 10) / 10, Math.round(r * Math.sin((a * Math.PI) / 180) * 10) / 10];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Patch a composed raw tree ({nodes:[...]} from composeTree().v2 / .live). Returns { raw, edits, report }. Pure: the input is not changed.
export function connectedPatch(rawIn, info, data) {
  const raw = JSON.parse(JSON.stringify(rawIn));
  const byId = new Map(raw.nodes.map((n) => [n.id, n]));
  const live = raw.nodes.filter((n) => !n.inert);
  const pos = new Map(live.map((n) => [n.id, n.pos]));
  const edits = [];
  const rings = info.core.rings;
  const toolOfFrag = {};
  for (const [tid, t] of Object.entries(info.tools)) toolOfFrag[t.prefix] = tid;
  const spec = new Map(info.nodes.map((n) => [n.id, n]));
  const toolOf = (n) => (spec.get(n.id) && spec.get(n.id).tool) || toolOfFrag[n.frag] || null;
  const isTeaser = (n) => n.teaser === true;
  const perm = (n) => (n.effects || []).some((e) => e && ['weapon', 'evolution', 'hero', 'tier'].includes(e.unlock));
  const reqs = (n) => [...(n.requires || []), ...(n.requiresAny || [])];
  const clear = (p, skip) => { for (const [id, q] of pos) if (id !== skip && dist(p, q) < 58) return false; return true; };

  // 1. the 2 'needs all' joins become 'any one' (a node with 2+ hard prerequisites)
  for (const n of live) if ((n.requires || []).length >= 2 && !perm(n)) {
    edits.push({ kind: 'any-one', id: n.id, file: fileOf(n, info), from: `requires ${JSON.stringify(n.requires)}`, to: `requiresAny ${JSON.stringify(n.requires)}`, why: 'join opens from either side (rule: ANY owned neighbour)' });
    n.requiresAny = [...n.requires, ...(n.requiresAny || [])]; delete n.requires;
  }

  // 2. bridges: hub-linked non-gate lanterns far from the hub (tool group roots) get ONE gold-only bridge per group
  const farRoots = live.filter((n) => !reqs(n).length && !perm(n) && !n.cluster && !isTeaser(n) && Math.hypot(...n.pos) > NEAR_HUB);
  const groups = new Map();
  for (const n of farRoots) { const g = toolOf(n) || 'rings'; (groups.get(g) || groups.set(g, []).get(g)).push(n); }
  let coreIdx = Math.max(...rawIn.nodes.filter((n) => n.frag === 'core').map((n) => n.idx)) + 1;
  const ringAnchors = live.filter((n) => n.frag === 'core' && !n.tool && !perm(n) && !n.unlock && !isTeaser(n) && Math.hypot(...n.pos) <= NEAR_HUB);
  const bridgeOf = {};
  for (const [g, roots] of groups) {
    const c = info.toolCentres[g] || roots[0].pos;
    const ang = (Math.atan2(c[1], c[0]) * 180) / Math.PI;
    let p = polar(BRIDGE.r, ang);
    for (let k = 1; !clear(p) && k < 40; k++) p = polar(BRIDGE.r + 20 * Math.ceil(k / 2) * (k % 2 ? 1 : -1), ang + (k % 3) * 4);
    const near = [...ringAnchors].sort((a, b) => dist(a.pos, p) - dist(b.pos, p)).slice(0, 2).map((a) => a.id);
    const id = `br_${g}`;
    const bn = { id, idx: coreIdx++, frag: 'core', kind: 'ring', region: 'rings', name: BRIDGE_NAMES[g] || `${g} path`, desc: `Lights the path to ${info.tools[g] ? info.tools[g].name : g}. Gems fly to you 5% faster.`, branch: 'light', cost: { gold: BRIDGE.gold }, effects: [{ ...BRIDGE.effect }], requiresAny: near, pos: p, maxRank: 1, rankCost: 1 };
    raw.nodes.push(bn); live.push(bn); byId.set(id, bn); pos.set(id, p); bridgeOf[g] = id;
    const tc = info.toolCentres[g];
    edits.push({ kind: 'bridge', id, file: 'core.json (append, idx ' + bn.idx + ')', to: `NEW gold-only lantern "${bn.name}" ${BRIDGE.gold} gold, effect gemPull +5%, requiresAny ${JSON.stringify(near)} (nearest Hearth/Wick lanterns), place {tool:"${g}", at:[${tc ? (p[0] - tc[0]).toFixed(0) : 0}, ${tc ? (p[1] - tc[1]).toFixed(0) : 0}]} (r ${BRIDGE.r}, on the group's angle)`, why: `bridges ${roots.length} far root(s): ${roots.map((r) => r.id).join(', ')}` });
    for (const r of roots) {
      r.requires = [id];
      edits.push({ kind: 'root', id: r.id, file: fileOf(r, info), from: 'requires [] (hub)', to: `requires ["${id}"]`, why: `group root ${Math.round(Math.hypot(...r.pos))} units from the hub` });
    }
  }

  // 3. far next-rank lanterns move beside their parent (core lanterns only; native tool-group lanterns stay in their group and gain the
  //    group's bridge as an alternative parent instead, so the group keeps its shape)
  const order = topo(live);
  const slotAt = (p) => { for (const ring of ['hearth', 'wick', 'dusk']) { const R = rings[ring]; for (let i = 0; i < R.slots; i++) if (dist(polar(R.r, -90 + (360 * i) / R.slots), p) < 5) return { ring, i }; } return null; };
  const occupied = new Set();
  for (const n of raw.nodes) if (n.pos) { const s = slotAt(n.pos); if (s) occupied.add(`${s.ring}:${s.i}`); }
  for (const n of order) {
    if (isTeaser(n) || n.id.startsWith('br_')) continue; // bridges are the deliberate long path trail (E4)
    for (const pid of reqs(n)) {
      const P = byId.get(pid);
      if (pid.startsWith('br_')) continue; // a group root under its bridge stays in its group
      if (!P || !pos.has(pid) || dist(pos.get(pid), pos.get(n.id)) <= LINK_FAR) continue;
      if (n.frag !== 'core') { // a tool-group lantern: keep in place, add the bridge as an alternative route
        const g = toolOf(n); const b = bridgeOf[g] || ensureBridgeFor(g);
        if (!b || reqs(n).includes(b) || perm(n)) continue;
        const all = [...reqs(n).filter((x) => x !== pid), b]; delete n.requiresAny; n.requires = all;
        edits.push({ kind: 're-parent', id: n.id, file: fileOf(n, info), from: `requires ["${pid}"] (${Math.round(dist(pos.get(pid), pos.get(n.id)))} away)`, to: `requires ${JSON.stringify(all)}`, why: 'its parent moves beside the hub; it stays in its group and hangs from the group path instead (no long thread)' });
        continue;
      }
      const old = pos.get(n.id); const oldPlace = placeOf(n);
      const spot = findSpot(pos.get(pid), n.id, pid);
      if (!spot) { edits.push({ kind: 'move-FAILED', id: n.id, file: 'core.json', from: `${old}`, to: '-', why: `no free spot beside ${pid}` }); continue; }
      pos.set(n.id, spot.p); n.pos = spot.p;
      edits.push({ kind: 'move', id: n.id, file: 'core.json', from: `place ${JSON.stringify(oldPlace)} (${Math.round(dist(pos.get(pid), old))} from ${pid})`, to: `place ${JSON.stringify(spot.place)} (${Math.round(dist(pos.get(pid), spot.p))} from ${pid})`, why: 'next rank sits beside its parent' });
    }
  }
  function ensureBridgeFor(g) { return bridgeOf[g] || null; }
  function placeOf(n) { const s = slotAt(n.pos); if (s) return s; const t = toolOf(n); const c = t && info.toolCentres[t]; return c ? { tool: t, at: [Math.round(n.pos[0] - c[0]), Math.round(n.pos[1] - c[1])] } : { pos: n.pos }; }
  function findSpot(pp, self, pid) {
    // (a) a free Hearth/Wick/Dusk ring slot within reach (existing schema), nearest first
    const cands = [];
    for (const ring of ['hearth', 'wick', 'dusk']) {
      const R = rings[ring];
      for (let i = 0; i < R.slots; i++) {
        if (occupied.has(`${ring}:${i}`)) continue;
        const p = polar(R.r, -90 + (360 * i) / R.slots);
        const d = dist(p, pp);
        if (d <= LINK_FAR - 20 && d >= 60 && clear(p, self)) cands.push({ d, p, place: { ring, i } });
      }
    }
    cands.sort((a, b) => a.d - b.d);
    if (cands.length) { occupied.add(`${cands[0].place.ring}:${cands[0].place.i}`); return cands[0]; }
    // (b) beside the parent, outward first (needs the small new place type {near, at})
    const out = (Math.atan2(pp[1], pp[0]) * 180) / Math.PI;
    for (const r of [90, 120, 150, 190, 240]) for (let k = 0; k < 24; k++) {
      const a = out + (k % 2 ? 1 : -1) * 15 * Math.ceil(k / 2);
      const off = polar(r, a); const p = [Math.round((pp[0] + off[0]) * 10) / 10, Math.round((pp[1] + off[1]) * 10) / 10];
      if (clear(p, self)) return { p, place: { near: pid, at: off.map((v) => Math.round(v)) } };
    }
    return null;
  }

  // 4. report: hub-linked lanterns that are still not connected by the rule (target 0) and guard checks
  const def = compileTree(raw, data);
  const report = checkRule(def, info, data);
  return { raw, def, edits, report, bridges: Object.values(bridgeOf) };
}

function topo(nodes) {
  const by = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set(); const out = [];
  const visit = (n) => { if (seen.has(n.id)) return; seen.add(n.id); for (const r of [...(n.requires || []), ...(n.requiresAny || [])]) if (by.has(r)) visit(by.get(r)); out.push(n); };
  nodes.forEach(visit);
  return out;
}
function fileOf(n, info) {
  if (n.frag === 'core') return 'core.json';
  for (const [w, c] of Object.entries(info.clusters)) if (c.prefix === n.frag) return `clusters/${w}.json`;
  for (const [t, c] of Object.entries(info.tools)) if (c.prefix === n.frag) return `tools/${t}.json`;
  return `${n.frag} fragment`;
}

// The rule as a function the timeline calls: is `id` linked to something lit (hub counts as lit for the near rings)?
// Engine requires/requiresAny already demand an owned parent; this adds the hub-link cases + E1-E3.
export function makeConnected(def, info) {
  const clusterHeart = {};
  for (const [w, c] of Object.entries(info.clusters)) clusterHeart[w] = c.heart; // null = starter (E3: counts as lit)
  const permanentKind = (n) => n.effects.some((e) => e && ['weapon', 'hero', 'tier'].includes(e.unlock));
  return (save, id) => {
    const n = def.nodes[id];
    const owned = (x) => ((save.tree || {})[x] || 0) >= 1;
    if (n.requires.length || n.requiresAny) return true; // the engine checks those parents (and 'any one' after the patch)
    if (n.cluster) {
      const h = clusterHeart[n.cluster];
      if (id === h) return true; // E1: weapon heart = hub challenge
      if (n.kind === 'socket') return !h || owned(h); // E2: seal opens once its spirit is woken
      return !h || owned(h); // a hub-linked lantern inside a constellation starts at its heart (E3 for starters)
    }
    if (permanentKind(n)) return true; // tier gates / hero gates stay hub challenges
    return Math.hypot(n.x, n.y) <= NEAR_HUB; // hearth / wick ring lanterns touch the lit hub; anything further needs a bridge (E4)
  };
}

export function checkRule(def, info, data) {
  const ids = def.list.filter((id) => !def.nodes[id].teaser);
  const isGate = (id) => def.nodes[id].permanent;
  const conn = makeConnected(def, info);
  const allOwned = { tree: Object.fromEntries(ids.map((i) => [i, 1])) };
  const unreachable = ids.filter((id) => !conn(allOwned, id)); // even with everything else lit
  const far = [];
  for (const e of def.edges) {
    if (e.from === 'hub') continue;
    const a = def.nodes[e.from], b = def.nodes[e.to];
    if (b.teaser) continue;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d > LINK_FAR && !e.from.startsWith('br_') && !e.to.startsWith('br_')) far.push(`${e.from}->${e.to} ${Math.round(d)}`);
  }
  // guard: a node whose every exit is a challenge (condition) and that has no gold-only exit anywhere in its group
  const challengeOnly = [];
  for (const id of ids) {
    const kids = def.children[id].filter((k) => !def.nodes[k].teaser);
    if (!kids.length) continue;
    if (kids.every((k) => def.nodes[k].unlock)) challengeOnly.push(`${id} -> ${kids.join(', ')}`);
  }
  // gold lanterns that can only be reached THROUGH a non-gate challenge (gates/hearts/seals are the accepted exceptions and count as passable)
  const behind = (both) => {
    const seen = new Set(); const q = [];
    for (const id of ids) if (!def.nodes[id].requires.length && !def.nodes[id].requiresAny && conn(allOwned, id)) { seen.add(id); q.push(id); }
    const pass = (id) => isGate(id) || !def.nodes[id].unlock;
    for (let i = 0; i < q.length; i++) {
      const x = q[i]; if (!pass(x)) continue;
      const next = both ? [...def.children[x], ...def.nodes[x].requires, ...(def.nodes[x].requiresAny || [])] : def.children[x];
      for (const y of next) {
        if (seen.has(y) || def.nodes[y].teaser) continue;
        const n = def.nodes[y];
        if (!both && n.requires.some((r) => !seen.has(r) || !pass(r))) continue; // one-way 'needs all' parents
        seen.add(y); q.push(y);
      }
    }
    return ids.filter((id) => !def.nodes[id].unlock && !isGate(id) && !(seen.has(id)));
  };
  const behindOneWay = behind(false), behindBoth = behind(true);
  const bridges = ids.filter((id) => id.startsWith('br_'));
  const bridgeOnlyChallenges = bridges.filter((b) => def.children[b].every((k) => def.nodes[k].unlock));
  return { nodes: ids.length, gates: ids.filter(isGate).length, unreachable, far, challengeOnly, bridgeOnlyChallenges, behindOneWay, behindBoth };
}

// ------------------------------------------------------------------ CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { readTreeFiles } = await import('../src/meta/treefs.mjs');
  const { composeTree } = await import('../src/meta/treedata.js');
  const { loadRealData } = await import('./tree-synth.mjs');
  const { budgetOf } = await import('../src/meta/treebudget.js');
  const args = process.argv.slice(2);
  const mdAt = args.indexOf('--md');
  const md = mdAt >= 0 ? args[mdAt + 1] : null;
  if (md && (!/^[\w./\\-]+\.md$/.test(md) || md.includes('..'))) { console.error('--md must be a plain .md path'); process.exit(1); }
  const data = loadRealData();
  const composed = composeTree(readTreeFiles(), data);
  const lines = [];
  const W = Object.keys(composed.info.clusters).length;
  for (const which of args.includes('--live') ? ['live'] : ['v2', 'live']) {
    const before = compileTree(composed[which], data);
    const b0 = checkRule(before, composed.info, data);
    const p = connectedPatch(composed[which], composed.info, data);
    const bud0 = budgetOf(before, composed.info.core.budget, W), bud1 = budgetOf(p.def, composed.info.core.budget, W);
    lines.push(`## ${which === 'v2' ? 'Design tree (live + inert)' : 'Live tree'}: ${b0.nodes} -> ${p.report.nodes} buyable nodes`, '');
    lines.push(`- Before: ${b0.unreachable.length} lanterns not linked to anything lit even with the whole tree owned (${b0.unreachable.join(', ') || 'none'}); ${b0.far.length} far links (> ${LINK_FAR}).`);
    lines.push(`- After: ${p.report.unreachable.length} unlinked (${p.report.unreachable.join(', ') || 'none'}); ${p.report.far.length} far links left${p.report.far.length ? ': ' + p.report.far.join(', ') : ''}.`);
    lines.push(`- Budget after the patch: combat PE at cap ${bud1.combatAtCap.toFixed(2)} (before ${bud0.combatAtCap.toFixed(2)}, ceiling 31), sustain ${bud1.sustainPE.toFixed(2)} (before ${bud0.sustainPE.toFixed(2)}, ceiling 5); gem pull ${bud0.util['perk.gemPull'] || 0}% -> ${bud1.util['perk.gemPull'] || 0}% (uncapped utility). Violations: ${bud1.violations.join('; ') || 'none'}.`);
    lines.push(`- Gold lanterns reachable only THROUGH a challenge (a wall of 'nothing to buy'): one-way links ${p.report.behindOneWay.length} (${p.report.behindOneWay.join(', ') || 'none'}); links both ways ${p.report.behindBoth.length} (${p.report.behindBoth.join(', ') || 'none'}).`);
    lines.push(`- Guard (every challenge needs a gold-only sibling route): lanterns whose EVERY exit is a challenge: ${p.report.challengeOnly.length}${p.report.challengeOnly.length ? ' (' + p.report.challengeOnly.join('; ') + ')' : ''}. Bridges whose every exit is a challenge: ${p.report.bridgeOnlyChallenges.join(', ') || 'none'}.`, '');
    lines.push('| # | Edit | Node | File | From | To | Why |', '|---|---|---|---|---|---|---|');
    p.edits.forEach((e, i) => lines.push(`| ${i + 1} | ${e.kind} | ${e.id} | ${e.file} | ${e.from || ''} | ${e.to} | ${e.why} |`));
    lines.push('');
  }
  const head = ['# Connected-unlock rule: dry-run data patch (NOT applied)', '', 'Generated by `node scripts/tree-connected-patch.mjs --md docs/design/tree-connected-patch.md` (2026-10-21). Nothing in src/ is changed; the build chunk applies these edits to the fragment files, then re-runs `npm test`, `tree-validate` and the timeline. Positions are proposals checked against the 58-unit spacing (minGap 50 + margin); `place {near, at}` is a small new place type (a lantern placed relative to its parent) needed only where no ring slot is free within reach.', '', 'Rule (LOCKED 2026-10-21): buyable = linked to ANY owned lantern AND condition met. Exceptions: E1 weapon hearts are hub challenges; E2 evolution seals open when their weapon is woken; E3 starter hearts count as lit; E4 far group roots hang from one gold-only bridge per group.', ''];
  const out = [...head, ...lines].join('\n');
  console.log(out);
  if (md) { writeFileSync(md, out + '\n'); console.error(`wrote ${md}`); }
}
