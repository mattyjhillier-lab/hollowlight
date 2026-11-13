// WARDROBE v2 Ring Keepsakes (docs/design/wardrobe-v2.md, LOCKED 'WARDROBE v2 PICKS'): ring completion from the tree + the append-only earned list.
// Pure JS, no DOM. A ring is complete when every real lantern of its distance tier is owned: the SAME definition as the tree's progress arc
// (ringProgress in gfx/treebg.js: teasers and inert slots excluded). Completion is written once into save.cosm.earned (costume ids) and never
// removed, so a later content update that adds lanterns to a ring cannot un-earn a costume. Zero power: nothing here is read by the sim.
import { ringProgress } from '../gfx/treebg.js';
import { cleanCosm, compactCosm, EARNED_CAP } from './cosmetics.js';

const own = (o, k) => Object.hasOwn(o, k);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const DAWN = 'dawn';

/** -> [{ id, name, frac, owned, total, done }] for each distance ring tier (info = the composed tree info: ringTiers + ringOf). Pure. */
export function ringStates(save, def, info) {
  const tiers = info && Array.isArray(info.ringTiers) ? info.ringTiers : [];
  const tree = save && isObj(save.tree) ? save.tree : {};
  const isOwned = (id) => own(tree, id) && tree[id] >= 1;
  const fr = ringProgress(def, info && info.ringOf, tiers.length, isOwned);
  const tot = new Array(tiers.length).fill(0), on = new Array(tiers.length).fill(0);
  for (const id of def.list) {
    const n = def.nodes[id]; if (!n || n.teaser || n.inert) continue;
    const k = info.ringOf && Number.isInteger(info.ringOf[id]) ? info.ringOf[id] : -1;
    if (k < 0 || k >= tiers.length) continue;
    tot[k]++; if (isOwned(id)) on[k]++;
  }
  return tiers.map((t, k) => ({ id: t.id, name: t.name, frac: fr[k] || 0, owned: on[k], total: tot[k], done: tot[k] > 0 && on[k] >= tot[k] }));
}

/** costume ids of one ring, over every hero. */
export const costumesOfRing = (data, ringId) => Object.values((data.cosmetics && data.cosmetics.costumes) || {}).flatMap((l) => l.filter((x) => x.ring === ringId).map((x) => x.id));

/**
 * Appends the costumes of every complete ring (and Dawnbearer once all five rings are earned) to save.cosm.earned. Idempotent; never removes.
 * -> { added: [costume ids], rings: [ring ids newly closed], dawn: bool newly earned }. Mutates save.cosm only when something is added.
 */
export function syncEarned(save, data, def, info) {
  const none = { added: [], rings: [], dawn: false };
  const C = data && data.cosmetics;
  if (!C || !C.costumes || !save || !def || !info) return none;
  const cur = cleanCosm(save.cosm, data);
  const have = new Set(cur.earned);
  const add = [], rings = [];
  const states = ringStates(save, def, info);
  const ringIds = states.map((s) => s.id);
  for (const s of states) {
    if (!s.done) continue;
    const ids = costumesOfRing(data, s.id);
    if (ids.length && ids.some((id) => !have.has(id))) { rings.push(s.id); for (const id of ids) if (!have.has(id)) { have.add(id); add.push(id); } }
  }
  // Dawnbearer: every ring tier earned (by the append-only list, so a later lantern cannot take it back)
  let dawn = false;
  const dawnIds = costumesOfRing(data, DAWN);
  if (ringIds.length && dawnIds.length && ringIds.every((r) => { const ids = costumesOfRing(data, r); return ids.length > 0 && ids.every((id) => have.has(id)); }) && dawnIds.some((id) => !have.has(id))) {
    dawn = true; for (const id of dawnIds) { have.add(id); add.push(id); }
  }
  if (!add.length) return none;
  const next = cleanCosm({ worn: cur.worn, earned: [...have] }, data);
  if (next.earned.length > EARNED_CAP) return none;
  save.cosm = compactCosm(next);
  return { added: add, rings, dawn };
}
