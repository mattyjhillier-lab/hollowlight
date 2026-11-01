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
export const LOD = { far: 0.32, near: 0.95 };
const CLUSTER_R = 170; // emblem half-size used for the region glow and tap area (emblem box 200 + lanterns)
const TOOL_R = 190;

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
    const display = [];
    for (const [k, s] of Object.entries(cl.sockets || {})) {
      if (!s || s.gate || !em.sockets || !own(em.sockets, k)) continue; // starter evolutions: a gold seal shown as already lit
      const p = em.sockets[k];
      display.push({ x: cx + p[0], y: cy + p[1], name: own(evolutions, s.evo) ? evolutions[s.evo].name : String(s.evo) });
    }
    regions.push({
      key: `c:${wid}`, kind: 'cluster', name: w ? w.name : wid, x: cx, y: cy, r: CLUSTER_R,
      color: w && HEX.test(w.color || '') ? w.color : SPARE[spare++ % SPARE.length],
      silhouette: typeof em.silhouette === 'string' ? em.silhouette : null,
      heart: cl.heart && def.nodes[cl.heart] ? cl.heart : null,
      heartAt: em.heart ? [cx + em.heart[0], cy + em.heart[1]] : null,
      display,
      title: `${w ? w.name.split(' ').pop() : 'Spirit'}-warden`,
    });
  }
  for (const [tid, t] of Object.entries(info.tools || {})) {
    const c = info.toolCentres && info.toolCentres[tid];
    if (!c) continue;
    regions.push({ key: `t:${tid}`, kind: 'tool', name: t.name || tid, blurb: t.blurb || '', x: c[0], y: c[1], r: TOOL_R, color: TOOL_TINT });
  }
  const R = (info.core && info.core.rings) || {};
  const rr = (k, d) => (R[k] && Number.isFinite(R[k].r) ? R[k].r : d);
  regions.push({ key: 'r:rings', kind: 'rings', name: 'Hearth and Wick', x: 0, y: 0, r: rr('wick', 300) + 30, color: RING_TINT });
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
    regionOf,
    farFree,
    nearHub: wick + 60, // lanterns this close to the hub hang from it (rays from the hub, never long threads)
    linkFar: 350, // a link longer than this is never drawn across the web (the dotted path shows it on select)
    beyondR: R.bands && Number.isFinite(R.bands.r0) ? R.bands.r0 + (R.bands.width || 0) * 0.35 : rr('far', 1280) + 300,
    webR: Math.max(reach + 120, rr('far', 1280) + 200),
    lod: { ...LOD },
  };
}
