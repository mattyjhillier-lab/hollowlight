// Layout and graph checks for the skill tree (docs/design/skill-tree-v2.md Appendix C.6). Pure JS.
// layoutIssues(info, v2def) -> string[]; an empty list means the computed layout is sound. Used by `npm test` and tree-validate.
// (Label-collision checks per zoom level belong to the screen chunk T4; the node overlap check lives in compileTree.)

import { tierOf } from './treetier.js';

const EXTRA = 22; // a node's hit radius counts towards its cluster's footprint

// scale = core.layout.clusterScale (R1: the emblem points are spread by it)
export function clusterRadius(emblem, scale = 1) {
  let m = 0;
  const pts = [emblem.heart, ...Object.values(emblem.slots), ...Object.values(emblem.sockets)];
  for (const p of pts) m = Math.max(m, Math.hypot(p[0], p[1]));
  return m * scale + EXTRA;
}

// a constellation's footprint = its farthest lantern or starter-evolution seal from its centre (R1: the gap relaxation can push a lantern past the
// scaled emblem), never less than the scaled emblem itself
function footprint(info, id, c) {
  const ctr = info.centres[id];
  let m = clusterRadius(info.emblems[c.emblem], info.scale || 1) - EXTRA;
  for (const n of info.nodes) if (n.cluster === id && n.role !== 'hero') m = Math.max(m, Math.hypot(info.positions[n.id][0] - ctr[0], info.positions[n.id][1] - ctr[1]));
  for (const p of Object.values((info.sealPos && info.sealPos[id]) || {})) m = Math.max(m, Math.hypot(p[0] - ctr[0], p[1] - ctr[1]));
  return m + EXTRA;
}

// R1 GAPS: no two lanterns closer than the gap of their tiers (landmark 76 px medallion, diamond 26, dot 9: treetier.js). core.layout.gapLandmark /
// gapDiamond / gapDot are the same-tier centre distances; a mixed pair needs the mean of its two. Keys missing = not checked. Grid-based, O(n).
export function gapIssues(info) {
  const issues = [];
  const L = (info.core && info.core.layout) || {};
  const g = { landmark: L.gapLandmark, diamond: L.gapDiamond, dot: L.gapDot ?? L.v2MinGap };
  if (![g.landmark, g.diamond, g.dot].every((v) => Number.isFinite(v))) return issues;
  const need = (a, b) => (a === b ? g[a] : (g[a] + g[b]) / 2);
  const C = Math.max(g.landmark, 1);
  const cell = new Map();
  const items = info.nodes.map((n) => ({ id: n.id, t: tierOf(n), p: info.positions[n.id] }));
  const key = (i, j) => `${i},${j}`;
  for (const it of items) { const k = key(Math.floor(it.p[0] / C), Math.floor(it.p[1] / C)); if (!cell.has(k)) cell.set(k, []); cell.get(k).push(it); }
  for (const a of items) {
    const ci = Math.floor(a.p[0] / C), cj = Math.floor(a.p[1] / C);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) for (const b of cell.get(key(i, j)) || []) {
      if (b.id <= a.id) continue;
      const d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1]);
      if (d < need(a.t, b.t)) issues.push(`${a.id} (${a.t}) and ${b.id} (${b.t}) are ${Math.round(d)} apart, need ${Math.round(need(a.t, b.t))}`);
    }
  }
  return issues;
}

export function layoutIssues(info, def) {
  const issues = [];
  const core = info.core;
  const R = core.rings;
  const cl = Object.entries(info.clusters).map(([id, c]) => ({ id, c: info.centres[id], r: footprint(info, id, c), slot: c.slot }));
  // tool clusters (Satchel, Card Fan, Almanac, Hearth-key, Night Gate): footprint = farthest lantern placed in them (own nodes AND moved global lanterns)
  for (const [id, t] of Object.entries(info.tools || {})) {
    const c = info.toolCentres[id];
    let m = 0;
    for (const n of info.nodes) if (n.tool === id) m = Math.max(m, Math.hypot(info.positions[n.id][0] - c[0], info.positions[n.id][1] - c[1]));
    cl.push({ id, c, r: m + EXTRA, slot: t.slot });
  }
  for (let i = 0; i < cl.length; i++) {
    const a = cl[i];
    const d0 = Math.hypot(a.c[0], a.c[1]);
    if (d0 < a.r + 90) issues.push(`cluster ${a.id} overlaps the hub pool`);
    for (const k of ['hearth', 'wick', 'dusk']) if (Math.abs(d0 - R[k].r) < a.r + 30) issues.push(`cluster ${a.id} overlaps the ${k} ring`);
    if (a.slot.startsWith('far') || a.slot.startsWith('band')) {
      if (d0 - a.r < R.dusk.r + 30) issues.push(`cluster ${a.id} sits inside the Dusk ring`);
    }
    for (let j = i + 1; j < cl.length; j++) {
      const b = cl[j];
      if (Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) < a.r + b.r) issues.push(`clusters ${a.id} and ${b.id} overlap`);
    }
  }
  issues.push(...gapIssues(info));
  if (def) {
    // a node may only require nodes that are never in a LATER chapter band; a gated item has exactly one gate node
    const chap = (id) => (def.nodes[id].scope ? def.nodes[id].scope.minChapter : 1);
    const gates = { weapon: new Map(), evolution: new Map() };
    for (const id of def.list) {
      const n = def.nodes[id];
      for (const r of n.requires.concat(n.requiresAny || [])) if (chap(r) > chap(id)) issues.push(`${id} requires ${r} from a later chapter`);
      for (const e of n.effects) if (e && (e.unlock === 'weapon' || e.unlock === 'evolution')) gates[e.unlock].set(e.id, (gates[e.unlock].get(e.id) || 0) + 1);
    }
    for (const kind of ['weapon', 'evolution']) for (const [k, c] of gates[kind]) if (c !== 1) issues.push(`${kind} ${k} has ${c} unlock nodes (needs exactly 1)`);
    // reachability: every non-teaser node must be reachable from the hub through owned-able prerequisites (acyclic graph => always,
    // unless an exclusion makes it impossible to hold all parents at once)
    for (const id of def.list) {
      const n = def.nodes[id];
      for (const r of n.requires) if (def.nodes[r].excludes.includes(id)) issues.push(`${id} requires ${r} which excludes it`);
    }
    // a teaser may sit beyond the fog only
    for (const id of def.list) if (def.nodes[id].teaser && def.nodes[id].effects.length) issues.push(`${id}: teaser with effects`);
  }
  return issues;
}

// CONNECTED-UNLOCK RULE checks (LOCKED 2026-10-21 'Tree look + connected-unlock rule'; engine: tree.js isLinked). Run on the LIVE tree by
// tree-validate and npm test (a group that is still inert is reported by the caller as pending, and must pass before it goes live).
//  1. a hub-linked lantern touches the lit hub: Hearth/Wick distance, or an accepted exception (weapon hearts, tier/hero gates = permanent;
//     constellation and hero lanterns = their own heart rule E1-E3); anything further needs its group's gold-only bridge (E4)
//  2. no far link (> LINK_FAR) except a bridge's own path trail
//  3. no group whose only ways in are challenges (every challenge lantern needs a gold-only sibling route), and no bridge that leads only to
//     challenges (250 gold spent into nothing)
export const NEAR_HUB = 360; // hearth (150) + wick (300) rings + 60
export const LINK_FAR = 350; // default; core.layout.linkFar overrides (R1: 420)
const isBridge = (id) => id.startsWith('br_');
export function connectIssues(info, def) {
  const issues = [];
  const linkFar = Number.isFinite(info.core.layout.linkFar) ? info.core.layout.linkFar : LINK_FAR; // R1: a constellation spread by clusterScale has longer links
  const toolOf = Object.create(null);
  for (const n of info.nodes) if (n.tool) toolOf[n.id] = n.tool;
  const groupOf = (id) => toolOf[id] || (def.nodes[id].cluster ? `cluster:${def.nodes[id].cluster}` : 'rings');
  const challenge = (id) => !!def.nodes[id].unlock && !def.nodes[id].permanent;
  for (const id of def.list) {
    const n = def.nodes[id];
    if (n.teaser || n.requires.length || n.requiresAny) continue;
    const d = Math.hypot(n.x, n.y);
    if (!n.permanent && !n.cluster && d > NEAR_HUB) issues.push(`${id} hangs from the hub ${Math.round(d)} units away: hang its group from one gold-only bridge lantern`);
  }
  for (const e of def.edges) {
    if (e.from === 'hub' || isBridge(e.from) || isBridge(e.to) || def.nodes[e.to].teaser) continue;
    const a = def.nodes[e.from], b = def.nodes[e.to];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d > linkFar) issues.push(`${e.from} -> ${e.to} is a far link (${Math.round(d)} > ${linkFar}): move the lantern beside its parent`);
  }
  const entries = Object.create(null);
  for (const id of def.list) {
    const n = def.nodes[id];
    if (n.teaser) continue;
    const g = groupOf(id);
    const outside = !n.requires.length && !n.requiresAny ? true : [...n.requires, ...(n.requiresAny || []), ...def.children[id]].some((x) => !def.nodes[x].teaser && groupOf(x) !== g);
    if (outside) (entries[g] || (entries[g] = [])).push(id);
  }
  for (const [g, ids] of Object.entries(entries)) if (ids.every(challenge)) issues.push(`group ${g}: every way in is a challenge (${ids.join(', ')}): give it a gold-only lantern`);
  for (const id of def.list) {
    if (!isBridge(id)) continue;
    const kids = def.children[id].filter((k) => !def.nodes[k].teaser);
    if (!kids.length || kids.every(challenge)) issues.push(`bridge ${id} leads only to challenges (${kids.join(', ') || 'nothing'})`);
  }
  return issues;
}
