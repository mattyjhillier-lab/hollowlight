// CHARACTER SYSTEM v2 save block (LOCKED 2026-10-24; docs/design/characters-v2.md section 7). Pure, no DOM. All input is untrusted.
// save.chars = { heroId: { xp, keep, woke } }   xp = Bond XP (level derived, never stored), keep = keepsakes found (0..need), woke = playable.
// save.notes.starter = { hero, weapon } (the new-profile starter pick; absent = not picked yet), notes.loadout = last { hero, weapon } pick.
import { bondDef, levelOf, maxXp, xpToLevel, runBondXp, keepsakeDef } from '../meta/bond.js';
import { conditionProgress, validCondition } from '../meta/tree.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const ID = /^[a-z0-9_]{1,40}$/;
const BAD = new Set(['__proto__', 'constructor', 'prototype']);
const okId = (v) => typeof v === 'string' && ID.test(v) && !BAD.has(v);
export const LEGACY_POOL = ['ghost_wolves', 'holy_orbit']; // the old run-1 pool every pre-v2 profile had
export const CHARS_MAX = 32;

// Untrusted chars block -> clean. Known character ids only (unknown dropped); without game data, valid-shaped ids are kept (bounded).
export function cleanChars(raw, data) {
  const out = {};
  if (!isObj(raw)) return out;
  const D = data ? bondDef(data.balance) : null;
  const K = data ? keepsakeDef(data.balance) : null;
  const xpMax = D ? maxXp(D) : 1e7;
  const keepMax = K ? K.need : 20;
  let n = 0;
  for (const id of Object.keys(raw)) {
    if (!okId(id) || (data && !Object.hasOwn(data.characters, id))) continue;
    if (n >= CHARS_MAX) break;
    const c = raw[id];
    if (!isObj(c)) continue;
    const woke = c.woke === true;
    out[id] = { xp: fin(c.xp) ? Math.floor(Math.min(xpMax, Math.max(0, c.xp))) : 0, keep: woke ? 0 : fin(c.keep) ? Math.floor(Math.min(keepMax, Math.max(0, c.keep))) : 0, woke };
    n++;
  }
  return out;
}

// { hero, weapon } with known ids only, else null.
export function cleanPick(v, data) {
  if (!isObj(v) || !data) return null;
  const hero = okId(v.hero) && Object.hasOwn(data.characters, v.hero) ? v.hero : null;
  const weapon = okId(v.weapon) && Object.hasOwn(data.weapons, v.weapon) ? v.weapon : null;
  return hero && weapon ? { hero, weapon } : null;
}

// A save written before CHARACTER SYSTEM v2 (no chars block) that has been played: both launch heroes awake, Bond seeded from history
// (seedPerRun XP per run, capped at seedCap levels), the old run-1 pool's hearts owned (returned for the tree), starter marked as picked.
export function legacySeed(stats, data) {
  const D = bondDef(data.balance);
  const used = isObj(stats && stats.charsUsed) ? stats.charsUsed : {};
  const chars = {};
  for (const id of ['wren', 'elias']) {
    if (!Object.hasOwn(data.characters, id)) continue;
    const runs = fin(used[id]) ? Math.max(0, Math.floor(used[id])) : 0;
    chars[id] = { xp: D ? Math.min(xpToLevel(D, D.seedCap), runs * D.seedPerRun) : 0, keep: 0, woke: true };
  }
  const hero = Object.keys(chars).sort((a, b) => (used[b] || 0) - (used[a] || 0))[0] || null;
  const starter = hero ? { hero, weapon: data.characters[hero].kindred } : null;
  return { chars, starter, weapons: LEGACY_POOL.filter((w) => Object.hasOwn(data.weapons, w)) };
}

export const isAwake = (save, id) => !!(save && isObj(save.chars) && Object.hasOwn(save.chars, id) && save.chars[id].woke === true);
export const bondLevel = (save, data, id) => levelOf(bondDef(data.balance), save && isObj(save.chars) && Object.hasOwn(save.chars, id) ? save.chars[id].xp : 0);

// Sleeping characters whose keepsake hint is met (the Sim may drop their keepsake this run). Invalid hints never qualify.
export function keepsakeEligible(save, data, def) {
  if (!keepsakeDef(data.balance)) return [];
  const out = [];
  for (const [id, c] of Object.entries(data.characters)) {
    if (isAwake(save, id) || !isObj(c.keepsake) || !validCondition(c.keepsake.hint, data)) continue;
    if (conditionProgress(c.keepsake.hint, save.stats, def, data).done) out.push(id);
  }
  return out;
}

// Banks one run's Bond XP and keepsake (mutates save.chars; sanitize() re-clamps). Returns the results-screen beat.
export function bankChars(save, r, data) {
  const D = bondDef(data.balance);
  const K = keepsakeDef(data.balance);
  if (!isObj(save.chars)) save.chars = {};
  const beat = { hero: null, gain: 0, from: 0, to: 0, xp: 0, keepsake: null };
  const hid = okId(r && r.character) && Object.hasOwn(data.characters, r.character) ? r.character : null;
  if (hid && D) {
    const c = Object.hasOwn(save.chars, hid) ? save.chars[hid] : (save.chars[hid] = { xp: 0, keep: 0, woke: false }); // banking never wakes a hero
    const gain = runBondXp(D, r);
    const from = levelOf(D, c.xp);
    c.xp = Math.min(maxXp(D), (fin(c.xp) ? c.xp : 0) + gain);
    Object.assign(beat, { hero: hid, gain, from, to: levelOf(D, c.xp), xp: c.xp });
  }
  const kid = r && okId(r.keepsake) && Object.hasOwn(data.characters, r.keepsake) && r.keepsake !== hid ? r.keepsake : null;
  if (kid && K && !isAwake(save, kid)) {
    const c = Object.hasOwn(save.chars, kid) ? save.chars[kid] : (save.chars[kid] = { xp: 0, keep: 0, woke: false });
    c.keep = Math.min(K.need, (fin(c.keep) ? c.keep : 0) + 1);
    const woke = c.keep >= K.need;
    if (woke) { c.woke = true; c.keep = 0; }
    beat.keepsake = { id: kid, count: woke ? K.need : c.keep, need: K.need, woke };
  }
  return beat;
}
