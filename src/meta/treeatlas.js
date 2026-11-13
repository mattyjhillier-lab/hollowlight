// S1 ATLAS: the data-driven layout of the Lantern Web (docs/design/tree-branches-v1.md 'orbit {tier, angle}' rule; algorithm ported from the
// live sandbox's graph generator, never its file). Pure JS, deterministic (no RNG: every 'random' choice is a hash of an index or id).
//   regions  : every constellation, tool group, night anchor, hero medallion and reserved slot sits at (tier radius, angle); a region without
//              an `orbit` takes the next free angle at the first tier with room (auto-slot), an explicit one is nudged along its angle if it
//              would overlap a neighbour
//   gardens  : a magic constellation = heart + one spoke per evolution (lead dots -> lead diamond -> seal) + forks out of each seal
//   roads    : bought path chains between two nodes, evenly spaced on a gently waving line
//   relax    : grid-based gap relaxation over the whole web (landmark / diamond / dot gaps; a mixed pair needs the mean)
//   links    : render-only cross-threads between neighbouring regions (never gating)
const D2R = Math.PI / 180;
const r1 = (v) => Math.round(v * 10) / 10;
export const angDiff = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
export const polarPt = (r, deg) => [r1(r * Math.cos(deg * D2R)), r1(r * Math.sin(deg * D2R))];

// Ring tiers (core.atlas.tiers): [{id, name, r}] inner to outer; tier k > last extrapolates by tierStep. Band edges are the midpoints.
export function tierRadius(atlas, k) {
  const T = atlas.tiers;
  if (k < T.length) return T[k].r;
  return T[T.length - 1].r + (k - T.length + 1) * atlas.tierStep;
}
export function ringBands(atlas) {
  const T = atlas.tiers;
  return T.map((t, i) => ({ id: t.id, name: t.name, r: t.r, inner: i === 0 ? 0 : (T[i - 1].r + t.r) / 2, outer: i === T.length - 1 ? Infinity : (t.r + T[i + 1].r) / 2 }));
}
export function ringOf(bands, p) { const d = Math.hypot(p[0], p[1]); for (let i = 0; i < bands.length; i++) if (d < bands[i].outer) return i; return bands.length - 1; }

// regions: [{ id, foot, orbit?: {tier, angle}, minTier?, near?: regionId, nearSpread? }] in a fixed order. Explicit orbits first (in order), then
// the rest. Returns { id: { centre, tier, angle, auto } }. hubR = radius of the hub rings (no region may reach inside it).
export function placeRegions(regions, atlas, hubR) {
  const placed = [];
  const out = Object.create(null);
  const gap = atlas.regionGap;
  const fits = (c, foot) => {
    if (Math.hypot(c[0], c[1]) - foot < hubR + gap) return false;
    for (const p of placed) if (Math.hypot(c[0] - p.c[0], c[1] - p.c[1]) < foot + p.foot + gap) return false;
    return true;
  };
  const put = (rg, tier, angle, auto) => { const c = polarPt(tierRadius(atlas, tier), angle); placed.push({ id: rg.id, c, foot: rg.foot, tier, angle }); out[rg.id] = { centre: c, tier, angle: ((angle % 360) + 360) % 360, auto }; };
  const explicit = regions.filter((r) => r.orbit), rest = regions.filter((r) => !r.orbit);
  for (const rg of explicit) {
    let done = false;
    for (let t = rg.orbit.tier; t < rg.orbit.tier + 4 && !done; t++) {
      for (let k = 0; k <= 24 && !done; k++) { // nudge along the angle: 0, +5, -5, +10, -10 ... +-60
        const a = rg.orbit.angle + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 5;
        if (fits(polarPt(tierRadius(atlas, t), a), rg.foot)) { put(rg, t, a, k > 0 || t !== rg.orbit.tier); done = true; }
      }
    }
    if (!done) autoSlot(rg);
  }
  function autoSlot(rg) {
    const near = rg.near && out[rg.near] ? out[rg.near] : null;
    const t0 = near ? near.tier : (rg.minTier || 1);
    for (let t = t0; t < t0 + 40; t++) {
      const R = tierRadius(atlas, t);
      const step = Math.max(3, Math.min(atlas.autoStep, (360 * (rg.foot + gap)) / (2 * Math.PI * R) / 2));
      let best = null;
      for (let a = 0; a < 360; a += step) {
        const c = polarPt(R, a);
        if (!fits(c, rg.foot)) continue;
        const same = placed.filter((p) => p.tier === t).map((p) => angDiff(p.angle, a));
        const score = near ? -angDiff(a, near.angle) : same.length ? Math.min(...same) : 360 - a / 1000;
        if (!best || score > best.score + 1e-9) best = { a, score };
      }
      if (best) { put(rg, t, best.a, true); return; }
    }
    throw new Error(`tree layout: no room for region ${rg.id}`);
  }
  for (const rg of rest) autoSlot(rg);
  return out;
}

// Garden of one magic constellation. branches: [{ id, lead: [ids], diamond, seal, forks: [[ids]] }]; avoid = directions (deg) the spokes keep away
// from (towards the hub and the road in). Returns { id: [x, y] } (heart included) and the spoke angles.
export function gardenLayout(centre, heart, branches, avoid, G) {
  const pos = Object.create(null);
  pos[heart] = [centre[0], centre[1]];
  const n = branches.length;
  const span = 360 / Math.max(1, n);
  let bestT = 0, bestM = -1;
  for (let t = 0; t < span; t += 2) {
    let m = 360;
    for (let s = 0; s < n; s++) for (const c of avoid) m = Math.min(m, angDiff(t + s * span, c));
    if (m > bestM + 1e-9) { bestM = m; bestT = t; }
  }
  const spokes = [];
  branches.forEach((b, s) => {
    const A = bestT + s * span;
    spokes.push(A);
    const dir = [Math.cos(A * D2R), Math.sin(A * D2R)], per = [-dir[1], dir[0]];
    const sgn = s % 2 ? -1 : 1;
    const P = (r) => { const off = Math.sin((r / G.seal) * Math.PI * 2) * G.wave * sgn; return [r1(centre[0] + dir[0] * r + per[0] * off), r1(centre[1] + dir[1] * r + per[1] * off)]; };
    const leadR = b.lead.map((_, k) => G.spoke[0] + ((G.lead - G.spoke[0]) * k) / Math.max(1, b.lead.length) * (b.lead.length > 1 ? 1 : 0)); // spread between spoke[0] and the diamond
    b.lead.forEach((id, k) => { pos[id] = P(b.lead.length === G.spoke.length ? G.spoke[k] : leadR[k]); });
    pos[b.diamond] = P(G.lead);
    const seal = P(G.seal);
    pos[b.seal] = seal;
    const nf = b.forks.length;
    b.forks.forEach((f, fi) => {
      const FA = A + (nf === 1 ? 0 : (fi - (nf - 1) / 2) * ((2 * G.forkSpread) / Math.max(1, nf - 1)));
      const fd = [Math.cos(FA * D2R), Math.sin(FA * D2R)], fp = [-fd[1], fd[0]];
      f.forEach((id, k) => {
        const r = f.length === G.fork.length ? G.fork[k] : G.fork[0] + ((G.fork[G.fork.length - 1] - G.fork[0]) * k) / Math.max(1, f.length - 1);
        const off = (fi % 2 ? 1 : -1) * Math.sin((r / G.fork[G.fork.length - 1]) * Math.PI) * 8;
        pos[id] = [r1(seal[0] + fd[0] * r + fp[0] * off), r1(seal[1] + fd[1] * r + fp[1] * off)];
      });
    });
  });
  return { pos, spokes };
}
// The farthest point of a garden from its heart (+ hit radius): its region footprint.
export function gardenFoot(G, forksPerSeal = 2) {
  const spread = forksPerSeal > 1 ? G.forkSpread * D2R : 0;
  const f = G.fork[G.fork.length - 1];
  return Math.hypot(G.seal + f * Math.cos(spread), f * Math.sin(spread)) + 22;
}

// Points of a road of n nodes from a to b (exclusive), on a gently waving line; side from a hash of the road key.
export function roadPoints(a, b, n, key) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const px = -dy / L, py = dx / L;
  const side = hash(key) < 0.5 ? -1 : 1, amp = Math.min(36, L * 0.05);
  const out = [];
  for (let k = 1; k <= n; k++) {
    const t = k / (n + 1), off = Math.sin(t * Math.PI * 2) * amp * side;
    out.push([r1(a[0] + dx * t + px * off), r1(a[1] + dy * t + py * off)]);
  }
  return out;
}

// Grid-based gap relaxation (deterministic): items [{ id, t: tier, p: [x, y], fixed? }]. Cheap tiers give way first (mobility 1 / 2 / 3);
// a fixed item never moves. gaps = { landmark, diamond, dot }; a mixed pair needs the mean.
const MOB = { landmark: 1, diamond: 2, dot: 3 };
export function relaxGrid(items, gaps, passes = 120) {
  const need = (a, b) => (a === b ? gaps[a] : (gaps[a] + gaps[b]) / 2);
  const C = Math.max(gaps.landmark, gaps.diamond, gaps.dot, 1);
  for (let pass = 0; pass < passes; pass++) {
    const grid = new Map();
    const key = (i, j) => i * 100003 + j;
    items.forEach((it, i) => { const k = key(Math.floor(it.p[0] / C), Math.floor(it.p[1] / C)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const ci = Math.floor(a.p[0] / C), cj = Math.floor(a.p[1] / C);
      for (let x = ci - 1; x <= ci + 1; x++) for (let y = cj - 1; y <= cj + 1; y++) for (const j of grid.get(key(x, y)) || []) {
        if (j <= i) continue;
        const b = items[j];
        if (a.fixed && b.fixed) continue;
        let dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1], d = Math.hypot(dx, dy);
        const req = need(a.t, b.t) + 0.3; // a hair over the gap, so rounding to 0.1 never leaves a pair just under it
        if (d >= req) continue;
        if (d < 1e-6) { const h = hash(`${a.id}|${b.id}`) * Math.PI * 2; dx = Math.cos(h); dy = Math.sin(h); d = 1; }
        const push = (req - d) * 1.02 + 0.05;
        const ma = a.fixed ? 0 : MOB[a.t], mb = b.fixed ? 0 : MOB[b.t];
        const sa = ma / (ma + mb), sb = mb / (ma + mb);
        a.p = [a.p[0] - (dx / d) * push * sa, a.p[1] - (dy / d) * push * sa];
        b.p = [b.p[0] + (dx / d) * push * sb, b.p[1] + (dy / d) * push * sb];
        moved = true;
      }
    }
    if (!moved) break;
  }
  for (const it of items) it.p = [r1(it.p[0]), r1(it.p[1])];
  return items;
}

// Render-only cross-links between neighbouring regions. nodes: [{ id, p, region, t, fork?, seal? }], edges: [[a, b]] (requires links).
// Rules: different regions, both diamond/landmark tier, no fork node, distance 120..maxD (700), never along an existing link, never crossing a
// drawn link, no other node within 34 of the thread, at most 2 per node and `cap` in all. Deterministic (sorted by distance, then ids).
export function crossLinks(nodes, edges, cap = 40, maxD = 700) {
  const P = Object.create(null);
  for (const n of nodes) P[n.id] = n;
  const adj = new Set(edges.map(([a, b]) => (a < b ? `${a}|${b}` : `${b}|${a}`)));
  const segX = (p1, p2, p3, p4) => { const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]); if (Math.abs(d) < 1e-9) return false; const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d, u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d; return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98; };
  const ok = nodes.filter((n) => !n.fork && n.t !== 'dot' && n.region);
  const cands = [];
  for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
    const a = ok[i], b = ok[j];
    if (a.region === b.region) continue;
    const d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1]);
    if (d < 120 || d > maxD) continue;
    if (adj.has(a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`)) continue;
    cands.push([d, a.id < b.id ? a.id : b.id, a.id < b.id ? b.id : a.id]);
  }
  cands.sort((x, y) => x[0] - y[0] || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : x[2] < y[2] ? -1 : 1));
  const deg = Object.create(null), links = [];
  const drawn = edges.filter(([a, b]) => P[a] && P[b]).map(([a, b]) => [P[a].p, P[b].p, a, b]);
  for (const [d, ia, ib] of cands) {
    if (links.length >= cap || (deg[ia] || 0) >= 2 || (deg[ib] || 0) >= 2) continue;
    const pa = P[ia].p, pb = P[ib].p;
    let bad = false;
    for (const [q1, q2, x, y] of drawn) { if (x === ia || x === ib || y === ia || y === ib) continue; if (segX(pa, pb, q1, q2)) { bad = true; break; } }
    if (bad) continue;
    for (const n of nodes) {
      if (n.id === ia || n.id === ib) continue;
      const t = Math.max(0, Math.min(1, ((n.p[0] - pa[0]) * (pb[0] - pa[0]) + (n.p[1] - pa[1]) * (pb[1] - pa[1])) / (d * d)));
      if (Math.hypot(pa[0] + (pb[0] - pa[0]) * t - n.p[0], pa[1] + (pb[1] - pa[1]) * t - n.p[1]) < 34) { bad = true; break; }
    }
    if (bad) continue;
    links.push([ia, ib]);
    drawn.push([pa, pb, ia, ib]);
    deg[ia] = (deg[ia] || 0) + 1; deg[ib] = (deg[ib] || 0) + 1;
  }
  return links;
}
