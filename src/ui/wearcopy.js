// EXTRAS v1 'Wear' drawer: copy + view model (no DOM; Node-tested). Everything shown is REAL: cosmetics.json, the save's tree (Wardrobe
// lanterns via nodeStatus) and Bond levels. Names come from validated data only.
import { cosmOwned, cleanCosm } from '../meta/cosmetics.js';
import { nodeStatus } from '../meta/tree.js';
import { bondLevel } from '../save/chars.js';

export const WEAR = {
  open: 'Wear',
  title: 'Lantern Wardrobe',
  line: 'Dress your lantern. The Hollow will not care, but the light will.',
  note: 'Looks only: flames never change how bright your light is.',
  tabs: { flame: 'Flame', trail: 'Trail', look: (hero) => `${hero}'s look` },
  wear: 'Wear', back: 'Back', wearing: 'Wearing',
  worn: 'Worn', owned: 'Owned', isDefault: 'Always yours',
  glass: (n) => `${n} Dawnglass in the Wardrobe`,
  gold: (n) => `${n} gold in the Wardrobe`,
  path: 'In the Wardrobe (Lantern Web)',
  bond: (lv, hero, cur) => `Bond ${lv} with ${hero} · ${Math.min(cur, lv)}/${lv}`,
  saved: 'Your lantern will wear this tonight.',
};

const group = (n) => String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const clip = (s, n) => String(s || '').slice(0, n);

// cosmetic id -> the Wardrobe lantern that gives it (first match), for the 'where to get it' line
function sourceNodes(def) {
  const out = { flame: {}, trail: {} };
  if (!def) return out;
  for (const id of def.list) for (const e of def.nodes[id].effects) if (e && (e.cosm === 'flame' || e.cosm === 'trail') && !out[e.cosm][e.id]) out[e.cosm][e.id] = id;
  return out;
}

function treeLine(def, save, data, nid) {
  if (!nid) return { line: WEAR.path, frac: null };
  const st = nodeStatus(def, save, nid, data);
  const n = def.nodes[nid];
  if (st.cond && !st.cond.done && st.cond.lines.length) { // the condition first, even while its link is still dark
    const L = st.cond.lines[0];
    return { line: L.goal > 1 ? `${clip(L.text, 48)} · ${group(L.cur)}/${group(L.goal)}` : clip(L.text, 48), frac: st.cond.frac };
  }
  if (n.cost.glass) return { line: WEAR.glass(n.cost.glass), frac: null };
  const g = st.next ? st.next.gold : n.cost.gold;
  return { line: g > 0 ? WEAR.gold(group(g)) : WEAR.path, frac: null };
}

/**
 * -> { hero: {id, name}, tabs: [{id, label}], items: { flame: [...], trail: [...], look: [...] }, sel: {flame, trail, look} }
 * item = { id, name, color, core?, style?, owned, worn, line, frac }. sel = what is chosen in the drawer (defaults to what is worn).
 */
export function wearView(save, data, def, heroId, sel = null) {
  const C = data.cosmetics;
  const owned = cosmOwned(save, data, def);
  const worn = cleanCosm(save && save.cosm, data).worn;
  const dflt = (set) => Object.keys(set).find((k) => set[k].default === true);
  const wornF = worn.flame && owned.flames.has(worn.flame) ? worn.flame : dflt(C.flames);
  const wornT = worn.trail && owned.trails.has(worn.trail) ? worn.trail : dflt(C.trails);
  const looks = Object.hasOwn(C.looks, heroId) ? C.looks[heroId] : [];
  const lw = Object.hasOwn(worn.look, heroId) ? worn.look[heroId] : null;
  const wornL = lw && owned.looks[heroId] && owned.looks[heroId].has(lw) ? lw : (looks.find((L) => L.default) || looks[0] || { id: null }).id;
  const src = sourceNodes(def);
  const hc = data.characters[heroId];
  const heroName = hc ? clip(String(hc.name).split(',')[0], 24) : '';
  const lv = bondLevel(save, data, heroId);
  const S = { flame: wornF, trail: wornT, look: wornL, ...(sel || {}) };
  const flame = Object.entries(C.flames).map(([id, f]) => {
    const own = owned.flames.has(id);
    const t = own ? null : treeLine(def, save, data, src.flame[id]);
    return { id, name: f.name, color: f.glow, core: f.core, owned: own, worn: id === wornF, line: own ? (id === wornF ? WEAR.worn : f.default ? WEAR.isDefault : WEAR.owned) : t.line, frac: t ? t.frac : null };
  });
  const trail = Object.entries(C.trails).map(([id, tr]) => {
    const own = owned.trails.has(id);
    const t = own ? null : treeLine(def, save, data, src.trail[id]);
    return { id, name: tr.name, color: tr.color || null, style: tr.style, owned: own, worn: id === wornT, line: own ? (id === wornT ? WEAR.worn : tr.default ? WEAR.isDefault : WEAR.owned) : t.line, frac: t ? t.frac : null };
  });
  const look = looks.map((L) => {
    const own = owned.looks[heroId] ? owned.looks[heroId].has(L.id) : false;
    return { id: L.id, name: L.name, color: L.wisp, charm: L.charm || null, owned: own, worn: L.id === wornL, line: own ? (L.id === wornL ? WEAR.worn : L.default ? WEAR.isDefault : WEAR.owned) : WEAR.bond(L.bond, heroName, lv), frac: own ? null : Math.min(1, lv / L.bond) };
  });
  // a choice must be owned; anything else falls back to what is worn
  const okSel = (list, id, w) => (list.some((x) => x.id === id && x.owned) ? id : w);
  return {
    hero: { id: heroId, name: heroName },
    tabs: [{ id: 'flame', label: WEAR.tabs.flame }, { id: 'trail', label: WEAR.tabs.trail }, ...(look.length ? [{ id: 'look', label: WEAR.tabs.look(heroName) }] : [])],
    items: { flame, trail, look },
    sel: { flame: okSel(flame, S.flame, wornF), trail: okSel(trail, S.trail, wornT), look: okSel(look, S.look, wornL) },
  };
}

/** The 'Wearing ...' line under the preview. */
export function wearingLine(v) {
  const nm = (list, id) => { const x = list.find((i) => i.id === id); return x ? x.name : ''; };
  return [nm(v.items.flame, v.sel.flame), nm(v.items.trail, v.sel.trail), nm(v.items.look, v.sel.look)].filter(Boolean).join(' · ');
}
