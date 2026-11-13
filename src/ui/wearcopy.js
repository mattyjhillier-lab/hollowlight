// EXTRAS v1 'Wear' drawer: copy + view model (no DOM; Node-tested). Everything shown is REAL: cosmetics.json, the save's tree (Wardrobe
// lanterns via nodeStatus) and Bond levels. Names come from validated data only.
import { cosmOwned, cleanCosm } from '../meta/cosmetics.js';
import { nodeStatus } from '../meta/tree.js';
import { bondLevel } from '../save/chars.js';
import { ringStates } from '../meta/costumes.js';

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
  // WARDROBE v2 ring shelf
  costume: 'Costume', costumeSub: 'from the five rings',
  everyday: 'Everyday look',
  wearOn: (hero) => `Wear on ${hero}`, takeOff: 'Take off', notYet: 'Not yet yours', previewOnly: 'Preview only',
  kicker: (ring) => `${ring} ring keepsake`, dawnKicker: 'The five rings, together',
  lock: (ring, n, t) => `Finish the ${ring}: ${n} of ${t} lanterns`, dawnLock: (n, t) => `Close all five rings: ${n} of ${t}`,
  earned: (ring) => `Earned: the ${ring} ring is closed.`, dawnEarned: 'Earned: all five rings are lit.',
  peeking: (name) => `Peeking at ${name} (not yours yet)`, tryOn: (name) => `Try on: ${name}`,
  closedToast: (rings, dawn) => `${rings.join(' and ')} ring closed${dawn ? '. All five are lit: Dawnbearer is ready.' : ': a new costume is ready.'}`,
  wearIt: 'Wear it',
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
export function wearView(save, data, def, heroId, sel = null, info = null) {
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
  // WARDROBE v2 ring shelf: one costume per ring (+ Dawnbearer) for this hero; progress arcs = the tree's own ring progress (same definition)
  const costumes = costumeShelf(save, data, def, heroId, heroName, owned, worn, info, sel);
  return {
    hero: { id: heroId, name: heroName },
    costume: costumes,
    tabs: [{ id: 'flame', label: WEAR.tabs.flame }, { id: 'trail', label: WEAR.tabs.trail }, ...(look.length ? [{ id: 'look', label: WEAR.tabs.look(heroName) }] : [])],
    items: { flame, trail, look },
    sel: { flame: okSel(flame, S.flame, wornF), trail: okSel(trail, S.trail, wornT), look: okSel(look, S.look, wornL), costume: costumes.sel },
  };
}

function costumeShelf(save, data, def, heroId, heroName, owned, worn, info, sel) {
  const C = data.cosmetics;
  const list = C.costumes && Object.hasOwn(C.costumes, heroId) ? C.costumes[heroId] : [];
  const have = owned.costumes[heroId] || new Set();
  let states = [];
  try { states = info ? ringStates(save, def, info) : []; } catch { states = []; }
  const ringsAll = states.map((s) => s.id);
  const ringDone = (rid) => { const x = list.find((c) => c.ring === rid); return !!x && have.has(x.id); };
  const doneN = ringsAll.filter(ringDone).length;
  const wornC = Object.hasOwn(worn.costume, heroId) && have.has(worn.costume[heroId]) ? worn.costume[heroId] : null;
  let selC = wornC;
  if (sel && Object.hasOwn(sel, 'costume')) selC = sel.costume === null ? null : (typeof sel.costume === 'string' && have.has(sel.costume) ? sel.costume : wornC);
  const items = list.map((c) => {
    const ring = (C.rings || []).find((r) => r.id === c.ring) || { name: c.ring, line: '', rune: '' };
    const dawn = c.ring === 'dawn';
    const st = states.find((s) => s.id === c.ring) || null;
    const got = have.has(c.id);
    const frac = got ? 1 : dawn ? (ringsAll.length ? doneN / ringsAll.length : 0) : (st ? st.frac : 0);
    const counts = dawn ? { n: doneN, t: ringsAll.length || 5 } : { n: st ? st.owned : 0, t: st ? st.total : 0 };
    return {
      id: c.id, name: c.name, ring: c.ring, ringName: clip(ring.name, 24), rune: ring.rune, dawn,
      kicker: dawn ? WEAR.dawnKicker : WEAR.kicker(clip(ring.name, 24)), line: clip(ring.line, 120),
      owned: got, worn: c.id === wornC, frac: Math.max(0, Math.min(1, frac)), n: counts.n, t: counts.t,
      need: got ? (dawn ? WEAR.dawnEarned : WEAR.earned(clip(ring.name, 24))) : (dawn ? WEAR.dawnLock(counts.n, counts.t) : WEAR.lock(clip(ring.name, 24), counts.n, counts.t)),
      pal: { base: c.base, second: c.second, mantle: c.mantle, accent: c.accent, trim: c.trim, glow: c.glow },
      motifs: [...c.motifs], rise: c.rise === 1 ? 1 : 0,
    };
  });
  return { items, sel: selC, worn: wornC, hero: heroName };
}

/** The 'Wearing ...' line under the preview. */
export function wearingLine(v) {
  const nm = (list, id) => { const x = list.find((i) => i.id === id); return x ? x.name : ''; };
  return [v.costume ? nm(v.costume.items, v.costume.sel) : '', nm(v.items.flame, v.sel.flame), nm(v.items.trail, v.sel.trail), nm(v.items.look, v.sel.look)].filter(Boolean).join(' · ');
}
