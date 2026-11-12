// Screen view model of the skill tree (T4 Lantern Trails screen). Pure JS: no DOM, no Phaser.
// Turns the composer's layout info (constellations, emblems, tool groups, ring radii) into the regions the screen draws.
// Everything comes from the data: the screen code never names a weapon, hero, chapter or slot (skill-tree-v2.md C.1).
const own = (o, k) => o != null && Object.hasOwn(o, k);
const HEX = /^#[0-9a-f]{6}$/i;
// Fallback tints for constellations whose weapon has no colour (synthetic / future content), and the warm tint of the rings and groups.
const SPARE = ['#ffd9b0', '#b8f0c8', '#9fe8ff', '#b9a2ff', '#e2ccff'];
export const RING_TINT = '#ffd9a0';
export const TOOL_TINT = '#f3dcae';
// Zoom levels where the screen changes detail (semantic zoom): below far = groups only, from near = every name.
export const LOD = { far: 0.2, near: 0.95 }; // R2: the 'overview' look (big medallions, names, status lines) starts at about 0.3, so MID begins lower than before
const CLUSTER_R = 170; // emblem half-size used for the region glow and tap area (emblem box 200 + lanterns)
const TOOL_R = 190;

// S1: what the hub medallion and the 'Your spirit' tag need: { hero, weapon, heart, seal } from notes.starter, or null. Only ids known to the
// data / layout pass; nothing from the save reaches the screen unchecked.
export function starterOf(info, data, notes) {
  const st = notes && typeof notes === 'object' ? notes.starter : null;
  if (!st || typeof st !== 'object') return null;
  const hero = typeof st.hero === 'string' && data && data.characters && own(data.characters, st.hero) ? st.hero : null;
  const weapon = typeof st.weapon === 'string' && data && data.weapons && own(data.weapons, st.weapon) ? st.weapon : null;
  if (!hero || !weapon) return null;
  const c = info && info.clusters && own(info.clusters, weapon) ? info.clusters[weapon] : null;
  const b = c && Array.isArray(c.branchInfo) ? c.branchInfo.find((x) => x.socket === 'a') || c.branchInfo[0] : null;
  return { hero, weapon, heart: c && typeof c.heart === 'string' ? c.heart : null, seal: b ? b.seal : c && c.sockets && c.sockets.a && c.sockets.a.gate ? c.sockets.a.gate : null };
}

// info = composeTree(...).info, def = compileTree(live or v2), data = game data (weapons, evolutions).
export function buildTreeView(info, def, data) {
  const regionOf = Object.create(null);
  const toolByPrefix = Object.create(null);
  for (const [tid, t] of Object.entries(info.tools || {})) if (t && t.prefix) toolByPrefix[t.prefix] = tid;
  for (const n of info.nodes || []) {
    if (n.cluster) regionOf[n.id] = `c:${n.cluster}`;
    else if (n.tool) regionOf[n.id] = `t:${n.tool}`;
    else if (own(toolByPrefix, n.frag)) regionOf[n.id] = `t:${toolByPrefix[n.frag]}`;
    else if (n.region === 'rings') regionOf[n.id] = 'r:rings';
    else regionOf[n.id] = `r:${n.frag}`;
  }
  const regions = [];
  let spare = 0;
  const weapons = (data && data.weapons) || {};
  const evolutions = (data && data.evolutions) || {};
  for (const [wid, cl] of Object.entries(info.clusters || {})) {
    const em = info.emblems && info.emblems[cl.emblem];
    const c = info.centres && info.centres[wid];
    if (!em || !c) continue;
    const [cx, cy] = c;
    const w = own(weapons, wid) ? weapons[wid] : null;
    const sc = Number.isFinite(info.scale) && info.scale > 0 ? info.scale : 1; // R1: the emblem points are spread by core.layout.clusterScale
    const seal = (info.sealPos && info.sealPos[wid]) || null;
    const display = [];
    for (const [k, s] of Object.entries(cl.sockets || {})) {
      if (!s || s.gate || !em.sockets || !own(em.sockets, k)) continue; // starter evolutions: a gold seal shown as already lit
      const p = seal && own(seal, k) ? seal[k] : [cx + em.sockets[k][0] * sc, cy + em.sockets[k][1] * sc];
      display.push({ x: p[0], y: p[1], name: own(evolutions, s.evo) ? evolutions[s.evo].name : String(s.evo) });
    }
    regions.push({
      key: `c:${wid}`, kind: 'cluster', name: w ? w.name : wid, x: cx, y: cy, r: CLUSTER_R * sc, scale: sc,
      color: w && HEX.test(w.color || '') ? w.color : SPARE[spare++ % SPARE.length],
      silhouette: typeof em.silhouette === 'string' ? em.silhouette : null,
      heart: cl.heart && def.nodes[cl.heart] ? cl.heart : null,
      heartAt: cl.heart && info.positions && info.positions[cl.heart] ? [info.positions[cl.heart][0], info.positions[cl.heart][1]] : em.heart ? [cx + em.heart[0] * sc, cy + em.heart[1] * sc] : null,
      display,
      title: `${w ? w.name.split(' ').pop() : 'Spirit'}-warden`,
      art: typeof cl.medallion === 'string' ? cl.medallion : typeof cl.emblem === 'string' ? cl.emblem : '', // R2: art id, allow-listed in gfx/medallions.js (unknown ids fall back to the tier emblem)
    });
  }
  for (const [tid, t] of Object.entries(info.tools || {})) {
    const c = info.toolCentres && info.toolCentres[tid];
    if (!c) continue;
    regions.push({ key: `t:${tid}`, kind: 'tool', name: t.name || tid, blurb: t.blurb || '', art: typeof t.medallion === 'string' ? t.medallion : String(tid), x: c[0], y: c[1], r: TOOL_R * (Number.isFinite(info.toolScale) && info.toolScale > 0 ? info.toolScale : 1), color: TOOL_TINT });
  }
  const R = (info.core && info.core.rings) || {};
  const rr = (k, d) => (R[k] && Number.isFinite(R[k].r) ? R[k].r : d);
  regions.push({ key: 'r:rings', kind: 'rings', name: 'Hearth and Wick', art: 'hub', x: 0, y: 0, r: rr('wick', 300) + 30, color: RING_TINT });
  // reserved far slots nobody uses yet: drawn as a faint "?" (more to find)
  const usedFar = new Set([...Object.values(info.clusters || {}), ...Object.values(info.tools || {})].map((x) => x.slot));
  const farFree = [];
  if (R.far && Number.isFinite(R.far.slots)) {
    for (let k = 1; k <= R.far.slots; k++) {
      if (usedFar.has(`far${k}`)) continue;
      const a = ((R.far.ang0 + R.far.step * (k - 1)) * Math.PI) / 180;
      farFree.push([Math.round(R.far.r * Math.cos(a)), Math.round(R.far.r * Math.sin(a))]);
    }
  }
  // region membership of the compiled nodes (teasers are fog, not members)
  for (const r of regions) {
    r.ids = def.list.filter((id) => regionOf[id] === r.key && !def.nodes[id].teaser);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of r.ids) { const n = def.nodes[id]; x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
    r.box = r.ids.length ? [x0 - 60, y0 - 80, x1 + 60, y1 + 60] : [r.x - r.r, r.y - r.r, r.x + r.r, r.y + r.r];
  }
  let reach = 0;
  for (const id of def.list) { const n = def.nodes[id]; reach = Math.max(reach, Math.hypot(n.x, n.y)); }
  const wick = rr('wick', 300);
  return {
    regions,
    threads: (info.regions || []).filter((r) => r.thread).map((r) => { // engraved backbone grooves: from the hub rim (90 out) to the region's near edge
      const [tx, ty] = r.thread.to, d = Math.hypot(tx, ty) || 1, k = 90 / d;
      return d > 140 ? [Math.round(tx * k), Math.round(ty * k), tx, ty] : [0, 0, 0, 0];
    }).filter((t) => t[2] !== 0 || t[3] !== 0),
    // gardens (a seal and its two fork chains) and roads (bought path chains): geometry-free id lists the screen needs for petals, veils and route chips
    gardens: Object.values(info.clusters || {}).flatMap((cl) => (Array.isArray(cl.branchInfo) ? cl.branchInfo : []).filter((b) => b && typeof b.seal === 'string' && Array.isArray(b.forks)).map((b) => ({ seal: b.seal, forks: b.forks.map((f) => f.filter((x) => typeof x === 'string')) }))),
    roads: Array.isArray(info.roads) ? info.roads.map((r) => ({ from: r.from, to: r.to, ids: [...r.ids] })) : [],
    regionRecords: info.regions || [], // R1: data-only region records (name, centre, accent, backbone thread to the hub)
    regionOf,
    farFree,
    nearHub: wick + 60, // lanterns this close to the hub hang from it (rays from the hub, never long threads)
    linkFar: info.core && info.core.layout && Number.isFinite(info.core.layout.linkFar) ? info.core.layout.linkFar : 350, // a link longer than this is never drawn across the web (the dotted path shows it on select)
    beyondR: R.bands && Number.isFinite(R.bands.r0) ? R.bands.r0 + (R.bands.width || 0) * 0.35 : rr('far', 1280) + 300,
    webR: Math.max(reach + 120, rr('far', 1280) + 200),
    lod: { ...LOD },
    // S1: the distance-tier rings (Hearth, Wick, Dusk, Far Hollow ... from core.atlas.tiers): name, radius and band; each node maps to one
    ringTiers: Array.isArray(info.ringTiers) ? info.ringTiers.map((t) => ({ id: t.id, name: t.name, r: t.r, inner: t.inner, outer: t.outer })) : [],
    ringOf: info.ringOf || {},
    links: Array.isArray(info.links) ? info.links.map((l) => [l[0], l[1]]) : [], // render-only cross-threads between neighbouring regions (never gating)
    // S1: the starter the hub medallion shows (hero + spirit) and the lit starter heart / first seal: from the save's notes.starter (validated ids)
    starterOf: (notes) => starterOf(info, data, notes),
    // Q1a/S1: radii of the engraved rings (the atlas ring tiers when present, else the old core rings that have a radius; display only)
    ringR: Array.isArray(info.ringTiers) && info.ringTiers.length ? info.ringTiers.map((t) => t.r) : info.core && info.core.layout && Array.isArray(info.core.layout.runeRings) && info.core.layout.runeRings.length
      ? info.core.layout.runeRings.map((k) => (R[k] && Number.isFinite(R[k].r) ? R[k].r : 0)).filter((r) => r > 0).sort((a, b) => a - b) // R1: the named rings only (hub rings, hero lane, sky, dusk)
      : Object.values(R).map((x) => (x && Number.isFinite(x.r) && !Number.isFinite(x.width) ? x.r : 0)).filter((r) => r > 0).sort((a, b) => a - b),
  };
}
