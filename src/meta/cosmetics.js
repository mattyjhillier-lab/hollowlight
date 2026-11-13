// EXTRAS v1 cosmetics (docs/design/extras-v1.md A1: Wardrobe lantern cluster + 'Wear' drawer). Pure JS, no DOM. ZERO POWER: nothing here
// is read by the sim; the run scene and HUD only recolour light (lantern glow/halo, the lantern trail, the hero's wisp and a small charm).
// Ownership is never stored: flames/trails come from owned Wardrobe lanterns in the tree, hero looks from Bond milestones (deeds). The save
// keeps only what is WORN (save.cosm.worn), validated against the data; anything not owned falls back to the default at resolve time.
import { bondLevel } from '../save/chars.js';

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ID_RE = /^[a-z][a-z0-9_]{0,31}$/;
const HEX = /^#[0-9a-f]{6}$/i;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => Object.hasOwn(o, k);
export const TRAIL_STYLES = Object.freeze(['thread', 'petal', 'dots', 'motes']);
export const MOTIFS = Object.freeze(['stitch', 'wick', 'star', 'fringe', 'core']);
export const COSTUME_ROLES = Object.freeze(['base', 'second', 'mantle', 'accent', 'trim', 'glow']);
export const EARNED_CAP = 32;
export const COSM_KINDS = Object.freeze(['flame', 'trail']);
// Reserved colours a cosmetic may never use: evolution gold, danger reds, the summon role colours at full strength (palette.js).
export const RESERVED = ['#ffd36b', '#fff3c4', '#ff4a3a', '#d9534f', '#9fe8ff', '#8a6fe0', '#7ff0ff', '#4ab8e0'];
export const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const lum = (h) => { const [r, g, b] = rgb(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const dist = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
export const hexInt = (h) => parseInt(h.slice(1), 16);

function colour(v, where, flame = false, base = false) {
  if (typeof v !== 'string' || !HEX.test(v)) throw new Error(`cosmetics: ${where} must be #rrggbb`);
  if (!base) for (const r of RESERVED) if (dist(v.toLowerCase(), r) < 24) throw new Error(`cosmetics: ${where} is a reserved colour`);
  // flames tint the lantern pool: they must read as bright as the default lantern (never dimmer, never a different brightness class)
  if (flame && (lum(v) < 150 || lum(v) > 245)) throw new Error(`cosmetics: ${where} is outside the lantern brightness band`);
  return v.toLowerCase();
}
const name = (v, where) => { if (typeof v !== 'string' || !/^[A-Za-z' -]{1,28}$/.test(v)) throw new Error(`cosmetics: ${where}.name`); return v; };

// Validates cosmetics.json against the heroes. Throws a readable error (the game refuses to boot bad data).
export function validateCosmetics(raw, characters) {
  if (!isObj(raw) || !isObj(raw.flames) || !isObj(raw.trails) || !isObj(raw.looks)) throw new Error('cosmetics: needs flames, trails, looks');
  for (const [kind, set] of [['flames', raw.flames], ['trails', raw.trails]]) {
    const ids = Object.keys(set);
    if (ids.length < 1 || ids.length > 24) throw new Error(`cosmetics: ${kind} count`);
    let defaults = 0;
    for (const id of ids) {
      if (!ID_RE.test(id) || BAD_KEYS.has(id) || !isObj(set[id])) throw new Error(`cosmetics: bad ${kind} id ${id}`);
      const c = set[id];
      name(c.name, `${kind}.${id}`);
      if (c.default === true) defaults++;
      // the default IS today's lantern amber (beside evolution gold by design); the white-hot core is not range-checked (every core is near white)
      if (kind === 'flames') { colour(c.glow, `flames.${id}.glow`, true, c.default === true); if (typeof c.core !== 'string' || !HEX.test(c.core)) throw new Error(`cosmetics: flames.${id}.core`); }
      else {
        if (!TRAIL_STYLES.includes(c.style)) throw new Error(`cosmetics: trails.${id}.style`);
        if (c.color !== undefined) colour(c.color, `trails.${id}.color`);
        if (c.style !== 'thread' && c.color === undefined) throw new Error(`cosmetics: trails.${id} needs a colour`);
      }
    }
    if (defaults !== 1) throw new Error(`cosmetics: ${kind} need exactly one default`);
  }
  for (const [hid, list] of Object.entries(raw.looks)) {
    if (BAD_KEYS.has(hid) || !own(characters || {}, hid)) throw new Error(`cosmetics: looks for unknown hero ${hid}`);
    if (!Array.isArray(list) || list.length < 1 || list.length > 12) throw new Error(`cosmetics: looks.${hid}`);
    const seen = new Set();
    let defaults = 0;
    for (const L of list) {
      if (!isObj(L) || !ID_RE.test(L.id) || seen.has(L.id)) throw new Error(`cosmetics: looks.${hid} bad id`);
      seen.add(L.id);
      name(L.name, `looks.${hid}.${L.id}`);
      colour(L.wisp, `looks.${hid}.${L.id}.wisp`, false, L.default === true);
      if (L.charm !== undefined) colour(L.charm, `looks.${hid}.${L.id}.charm`);
      if (L.default === true) defaults++;
      else if (!(Number.isInteger(L.bond) && L.bond >= 1 && L.bond <= 25)) throw new Error(`cosmetics: looks.${hid}.${L.id} needs a Bond level 1..25`);
    }
    if (defaults !== 1) throw new Error(`cosmetics: looks.${hid} need exactly one default`);
  }
  if (raw.rings !== undefined || raw.costumes !== undefined) validateCostumes(raw, characters);
  return raw;
}

// WARDROBE v2 Ring Keepsakes: per hero one costume per ring + Dawnbearer (palette of six colours + motif ids; zero power, render only).
function validateCostumes(raw, characters) {
  if (!Array.isArray(raw.rings) || raw.rings.length < 1 || raw.rings.length > 8 || !isObj(raw.costumes)) throw new Error('cosmetics: rings + costumes');
  const rings = new Set();
  for (const r of raw.rings) {
    if (!isObj(r) || !ID_RE.test(r.id) || BAD_KEYS.has(r.id) || rings.has(r.id)) throw new Error('cosmetics: bad ring id');
    rings.add(r.id);
    name(r.name, `rings.${r.id}`);
    if (typeof r.line !== 'string' || !/^[A-Za-z0-9 ,.'-]{1,120}$/.test(r.line)) throw new Error(`cosmetics: rings.${r.id}.line`);
    if (typeof r.rune !== 'string' || !/^[MLQCAZmlqcaz0-9 .-]{1,160}$/.test(r.rune)) throw new Error(`cosmetics: rings.${r.id}.rune`);
  }
  const ids = new Set();
  for (const [hid, list] of Object.entries(raw.costumes)) {
    if (BAD_KEYS.has(hid) || !own(characters || {}, hid)) throw new Error(`cosmetics: costumes for unknown hero ${hid}`);
    if (!Array.isArray(list) || list.length < 1 || list.length > 8) throw new Error(`cosmetics: costumes.${hid}`);
    const seenRing = new Set();
    for (const C of list) {
      const w = `costumes.${hid}.${C && C.id}`;
      if (!isObj(C) || !ID_RE.test(C.id) || BAD_KEYS.has(C.id) || ids.has(C.id)) throw new Error(`cosmetics: ${w} bad id`);
      ids.add(C.id);
      name(C.name, w);
      if (!rings.has(C.ring) || seenRing.has(C.ring)) throw new Error(`cosmetics: ${w}.ring`);
      seenRing.add(C.ring);
      for (const k of COSTUME_ROLES) colour(C[k], `${w}.${k}`, k === 'glow'); // reserved colours refused; the motif light stays inside the lantern brightness band
      if (!Array.isArray(C.motifs) || C.motifs.length < 1 || C.motifs.length > MOTIFS.length || C.motifs.some((m, i) => !MOTIFS.includes(m) || C.motifs.indexOf(m) !== i)) throw new Error(`cosmetics: ${w}.motifs`);
      if (C.rise !== undefined && C.rise !== 1) throw new Error(`cosmetics: ${w}.rise`);
    }
  }
}

// Every Wardrobe lantern names a real cosmetic and does nothing else (zero power). Throws on the first bad one.
export function validateCosmTree(def, cosm) {
  for (const id of def.list) for (const e of def.nodes[id].effects) {
    if (!isObj(e) || e.cosm === undefined) continue;
    const set = e.cosm === 'flame' ? cosm.flames : cosm.trails;
    if (!own(set, e.id) || set[e.id].default === true) throw new Error(`cosmetics: ${id} gives unknown or default ${e.cosm} ${e.id}`);
    if (def.nodes[id].effects.some((x) => !isObj(x) || x.cosm === undefined)) throw new Error(`cosmetics: ${id} mixes a cosmetic with power`);
  }
  return true;
}

const defOf = (set) => Object.keys(set).find((k) => set[k].default === true);
const lookDefault = (list) => (list.find((L) => L.default === true) || list[0]).id;

// -> { flames: Set, trails: Set, looks: { heroId: Set } } owned by this save (tree lanterns + Bond deeds + the defaults).
export function cosmOwned(save, data, def) {
  const C = data.cosmetics;
  const out = { flames: new Set([defOf(C.flames)]), trails: new Set([defOf(C.trails)]), looks: {}, costumes: {} };
  const tree = save && isObj(save.tree) ? save.tree : {};
  if (def) for (const id of def.list) {
    if (!(own(tree, id) && tree[id] >= 1)) continue;
    for (const e of def.nodes[id].effects) if (isObj(e) && e.cosm === 'flame' && own(C.flames, e.id)) out.flames.add(e.id); else if (isObj(e) && e.cosm === 'trail' && own(C.trails, e.id)) out.trails.add(e.id);
  }
  for (const [hid, list] of Object.entries(C.looks)) {
    const lv = bondLevel(save, data, hid);
    out.looks[hid] = new Set(list.filter((L) => L.default === true || lv >= L.bond).map((L) => L.id));
  }
  // Ring Keepsakes: ownership = the append-only save.cosm.earned list (a ring closed once stays closed, whatever the tree grows into later)
  const earned = new Set(cleanCosm(save && save.cosm, data).earned);
  for (const [hid, list] of Object.entries(C.costumes || {})) out.costumes[hid] = new Set(list.filter((L) => earned.has(L.id)).map((L) => L.id));
  return out;
}

// Untrusted save.cosm -> clean { worn: { flame, trail, look: { heroId: lookId }, costume: { heroId: costumeId } }, earned: [costumeId] }: known ids only
// (ownership is checked when worn). earned is a deduped, whitelisted, capped list in a stable order (the costume data order).
export function cleanCosm(raw, data) {
  const out = { worn: { flame: null, trail: null, look: {}, costume: {} }, earned: [] };
  const C = data && data.cosmetics;
  if (!C || !isObj(raw)) return out;
  if (Array.isArray(raw.earned) && C.costumes) {
    const known = new Set(Object.values(C.costumes).flatMap((l) => l.map((x) => x.id)));
    const got = new Set();
    for (const v of raw.earned.slice(0, 256)) if (typeof v === 'string' && !BAD_KEYS.has(v) && known.has(v)) got.add(v);
    out.earned = [...known].filter((id) => got.has(id)).slice(0, EARNED_CAP);
  }
  if (!isObj(raw.worn)) return out;
  const w = raw.worn;
  if (isObj(w.costume) && C.costumes) for (const hid of Object.keys(w.costume)) {
    if (BAD_KEYS.has(hid) || !own(C.costumes, hid)) continue;
    const v = w.costume[hid];
    if (typeof v === 'string' && C.costumes[hid].some((L) => L.id === v)) out.worn.costume[hid] = v;
  }
  if (typeof w.flame === 'string' && own(C.flames, w.flame) && !BAD_KEYS.has(w.flame)) out.worn.flame = w.flame;
  if (typeof w.trail === 'string' && own(C.trails, w.trail) && !BAD_KEYS.has(w.trail)) out.worn.trail = w.trail;
  if (isObj(w.look)) for (const hid of Object.keys(w.look)) {
    if (BAD_KEYS.has(hid) || !own(C.looks, hid)) continue;
    const v = w.look[hid];
    if (typeof v === 'string' && C.looks[hid].some((L) => L.id === v)) out.worn.look[hid] = v;
  }
  return out;
}

// The persisted form: the additive WARDROBE v2 parts (worn.costume, earned) are written only when they hold something, so a save that never
// earned a costume stays byte-identical to the pre-WARDROBE v2 build. Readers always go through cleanCosm (full shape).
export function compactCosm(c) {
  const out = { worn: { flame: c.worn.flame, trail: c.worn.trail, look: c.worn.look } };
  if (Object.keys(c.worn.costume).length) out.worn.costume = c.worn.costume;
  if (c.earned.length) out.earned = c.earned;
  return out;
}

// What a run with `heroId` wears (render params). Anything not owned (forged save, a refunded lantern) falls back to the default.
export function resolveCosm(save, data, def, heroId) {
  const C = data.cosmetics;
  const owned = cosmOwned(save, data, def);
  const worn = cleanCosm(save && save.cosm, data).worn;
  const fid = worn.flame && owned.flames.has(worn.flame) ? worn.flame : defOf(C.flames);
  const tid = worn.trail && owned.trails.has(worn.trail) ? worn.trail : defOf(C.trails);
  const F = C.flames[fid], T = C.trails[tid];
  const list = own(C.looks, heroId) ? C.looks[heroId] : null;
  let look = null;
  if (list) {
    const lw = own(worn.look, heroId) ? worn.look[heroId] : null;
    const lid = lw && owned.looks[heroId] && owned.looks[heroId].has(lw) ? lw : lookDefault(list);
    const L = list.find((x) => x.id === lid);
    look = { id: L.id, name: L.name, wisp: hexInt(L.wisp), charm: L.charm ? hexInt(L.charm) : null, isDefault: L.default === true };
  }
  let costume = null;
  const cl = C.costumes && own(C.costumes, heroId) ? C.costumes[heroId] : null;
  if (cl) {
    const cw = own(worn.costume, heroId) ? worn.costume[heroId] : null;
    if (cw && owned.costumes[heroId] && owned.costumes[heroId].has(cw)) { const X = cl.find((x) => x.id === cw); costume = { hero: heroId, id: X.id, name: X.name, ring: X.ring, base: X.base, second: X.second, mantle: X.mantle, accent: X.accent, trim: X.trim, glow: X.glow, motifs: [...X.motifs], rise: X.rise === 1 ? 1 : 0 }; }
  }
  return {
    costume,
    flame: { id: fid, name: F.name, glow: hexInt(F.glow), core: hexInt(F.core), css: F.glow, cssCore: F.core, isDefault: F.default === true },
    trail: { id: tid, name: T.name, style: T.style, color: T.color ? hexInt(T.color) : null, isDefault: T.default === true },
    look,
  };
}

// True when nothing is changed from the defaults (the scene then takes exactly the old code paths).
export const isPlain = (v) => !v || (v.flame.isDefault && v.trail.isDefault && (!v.look || v.look.isDefault) && !v.costume);
