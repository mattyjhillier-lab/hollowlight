// Save schema, migrations and strict validation. Pure JS, no DOM. All input is untrusted.
import { sanitizeTree, sanitizeSeen, sanitizeCreep } from '../meta/tree.js';
import { encodeTree, decodeTree, decodeTreeRaw, encodeSeen, decodeSeen, isCompact } from '../meta/treecodec.js';
import { OLD_TREE_VERSION, runTreeSteps } from '../meta/migrations/index.js';
import { BRIGHTNESS_STORED } from '../gfx/arc.js';
import { tierRecords, MAX_GLASS } from './tiers.js';

export const SAVE_VERSION = 3;
export const MAX_SAVE_BYTES = 200 * 1024;
export const QUALITIES = ['auto', 'low', 'med', 'high'];
export const BRIGHTNESS = BRIGHTNESS_STORED; // 'auto' = Brighter on phone-sized/touch devices, Normal elsewhere (resolved at draw time)
export const TOUCH_MODES = ['auto', 'on', 'off'];
export const STICK_NAMES = ['small', 'medium', 'large'];
export const RECENT_RUNS = 10;

const MAX_NUM = 1e12;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// The compiled skill tree (src/meta/tree.js). Registered once at boot; until then tree data fails closed to {}.
let TREE = null;
let TREE_DATA = null;
export function setTreeDef(def, data) { TREE = def; TREE_DATA = data; }
export const treeReady = () => TREE !== null;

export function defaultSettings() {
  return { musicVol: 0.7, sfxVol: 0.8, screenShake: true, reducedMotion: false, damageNumbers: true, quality: 'auto', brightness: 'auto', touchMode: 'auto', stickSize: 'medium' };
}

export function defaultSave(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    gold: 0,
    shards: 0,
    dawnglass: 0, // the night currency (harder tiers only); bounded 0..1e9, never negative
    stats: defaultStats(),
    unlocks: {},
    tree: {},
    creep: {}, // rising-price steps per owned lantern ({id: steps}; src/meta/tree.js creepSteps): refunds pay back exactly what was paid
    seen: {},
    notes: {},
    settings: defaultSettings(),
  };
}

export function defaultStats() {
  return {
    runs: 0, wins: 0, kills: 0, bestTime: 0, totalPlayTime: 0,
    bestLevel: 0, totalGold: 0,
    killsByEnemy: {}, bossKills: {}, chapters: {}, evolved: {}, weaponsUsed: {}, charsUsed: {},
    recentRuns: [],
    // tool-cluster counters + difficulty-tier records (DT0; docs/design/difficulty-tiers-economy-v1.md section 10)
    markedKills: 0, chests: 0, gems: 0, abilityUses: 0, blessingsTaken: 0,
    tiers: {},
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v, def, min = 0, max = MAX_NUM) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
const int = (v, def, min = 0, max = MAX_NUM) => Math.floor(num(v, def, min, max));

// Migration table: MIGRATIONS[n] upgrades a version-n object to n+1. Append later.
// v1 -> v2: skill tree arrives. The v1 tree was an empty placeholder, so it is reset; new stat maps start empty
// (sanitize fills them). Gold, shards, stats totals and settings carry over.
// v2 -> v3: the Lantern Web. "Regrowth": every non-permanent owned node is refunded at its old price from a FROZEN table
// (src/meta/migrations/tree-v3.js), permanent gate nodes stay owned. Runs once (version >= 3 never re-enters), before sanitising.
export const MIGRATIONS = {
  1: (o) => ({ ...o, version: 2, tree: {}, seen: {} }),
  2: (o) => {
    const to = TREE ? TREE.treeVersion : 3;
    const r = runTreeSteps(isObj(o.tree) && !isCompact(o.tree) ? o.tree : {}, OLD_TREE_VERSION, to);
    return {
      ...o,
      version: 3,
      tree: r.tree,
      gold: Math.min(MAX_NUM, int(o.gold, 0) + r.gold),
      shards: Math.min(MAX_NUM, int(o.shards, 0) + r.shards),
      notes: { ...(isObj(o.notes) ? o.notes : {}), ...r.notes },
    };
  },
};

const ID_KEY = /^[a-z0-9_]{1,40}$/;
// id -> bounded count (stat maps keyed by enemy / chapter / weapon / character ids).
// Bounds (documented): killsByEnemy 128 keys (8 chapters x ~12 enemy types + margin), bossKills/weaponsUsed/charsUsed 32, chapters 32,
// recentRuns.k 12. A VALID key that does not fit is dropped and counted in SANITIZE_WARNINGS.capped (visible to tests/diagnostics) so the
// cap is never hit silently: raise the cap when the roster grows (tests/savev3.test.mjs checks the roster fits).
export const SANITIZE_WARNINGS = { capped: 0, unknown: 0 };
export const STAT_KEY_CAPS = { killsByEnemy: 128, bossKills: 32, weaponsUsed: 32, charsUsed: 32, chapters: 32 };
function countMap(o, maxKeys = 64, max = 1e9) {
  const out = {};
  if (!isObj(o)) return out;
  let n = 0;
  for (const k of Object.keys(o)) {
    if (BAD_KEYS.has(k) || !ID_KEY.test(k)) continue;
    if (typeof o[k] !== 'number' || !Number.isFinite(o[k])) continue;
    if (n >= maxKeys) { SANITIZE_WARNINGS.capped++; continue; }
    out[k] = Math.floor(Math.min(max, Math.max(0, o[k])));
    n++;
  }
  return out;
}
function chapterMap(o) {
  const out = {};
  if (!isObj(o)) return out;
  let n = 0;
  for (const k of Object.keys(o)) {
    if (BAD_KEYS.has(k) || !ID_KEY.test(k) || !isObj(o[k])) continue;
    if (n >= STAT_KEY_CAPS.chapters) { SANITIZE_WARNINGS.capped++; continue; }
    out[k] = { runs: int(o[k].runs, 0, 0, 1e9), clears: int(o[k].clears, 0, 0, 1e9), bestTime: num(o[k].bestTime, 0, 0, 1e7) };
    n++;
  }
  return out;
}

const bool = (v, def) => (typeof v === 'boolean' ? v : def);

// Last RECENT_RUNS runs, for the "about N more runs at your pace" hint: { t time, k kills by enemy, e evolutions, b boss, c clear }.
function idList(a, max) {
  const out = [];
  if (!Array.isArray(a)) return out;
  for (const v of a.slice(0, 64)) {
    if (out.length >= max) break;
    if (typeof v === 'string' && ID_KEY.test(v) && !BAD_KEYS.has(v) && !out.includes(v)) out.push(v);
  }
  return out;
}
function recentRuns(a) {
  const out = [];
  if (!Array.isArray(a)) return out;
  for (const r of a.slice(-RECENT_RUNS)) {
    if (!isObj(r)) continue;
    out.push({ t: num(r.t, 0, 0, 1e7), k: countMap(r.k, 12, 1e6), e: idList(r.e, 8), b: r.b === true, c: r.c === true });
  }
  return out;
}

// One-time migration notices (the tree screen shows "The web has regrown" once): known keys only, clamped.
function notesOf(o) {
  const out = {};
  if (isObj(o) && isObj(o.regrowth)) out.regrowth = { gold: int(o.regrowth.gold, 0), shards: int(o.regrowth.shards, 0), nodes: int(o.regrowth.nodes, 0, 0, 1e4) };
  return out;
}

// Free-form id->value map (unlocks): short safe ids, bounded numbers/bools only.
function cleanMap(o) {
  const out = {};
  if (!isObj(o)) return out;
  let n = 0;
  for (const k of Object.keys(o)) {
    if (n >= 2000) break;
    if (BAD_KEYS.has(k) || !/^[a-z0-9_.-]{1,48}$/i.test(k)) continue;
    const v = o[k];
    if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.min(MAX_NUM, Math.max(0, Math.floor(v)));
    else continue;
    n++;
  }
  return out;
}

// Build a fresh clean object from whitelisted keys only. Never copies unknown keys.
// Accepts the tree/seen maps in either form: object form (in memory) or compact form (on disk, decoded here).
export function sanitize(raw, now = Date.now()) {
  const d = defaultSave(now);
  if (!isObj(raw)) return d;
  const s = isObj(raw.stats) ? raw.stats : {};
  const st = isObj(raw.settings) ? raw.settings : {};
  const ds = d.settings;
  const created = int(raw.createdAt, now, 0, 1e14);
  const stats = {
    runs: int(s.runs, 0),
    wins: int(s.wins, 0),
    kills: int(s.kills, 0),
    bestTime: num(s.bestTime, 0, 0, 1e7),
    totalPlayTime: num(s.totalPlayTime, 0, 0, 1e9),
    bestLevel: int(s.bestLevel, 0, 0, 1e6),
    totalGold: int(s.totalGold, 0),
    killsByEnemy: countMap(s.killsByEnemy, STAT_KEY_CAPS.killsByEnemy),
    bossKills: countMap(s.bossKills, 32),
    chapters: chapterMap(s.chapters),
    evolved: countMap(s.evolved),
    weaponsUsed: countMap(s.weaponsUsed, 32),
    charsUsed: countMap(s.charsUsed, 32),
    recentRuns: recentRuns(s.recentRuns),
    markedKills: int(s.markedKills, 0, 0, 1e9), chests: int(s.chests, 0, 0, 1e9), gems: int(s.gems, 0, 0, 1e9), abilityUses: int(s.abilityUses, 0, 0, 1e9), blessingsTaken: int(s.blessingsTaken, 0, 0, 1e9),
    tiers: TREE_DATA ? tierRecords(s.tiers, TREE_DATA, SANITIZE_WARNINGS) : {}, // unknown chapter / tier / hero ids are dropped (and counted)
  };
  // Owned stat nodes whose weapon gate is not owned (pre-G1e saves) are dropped WITH a full refund.
  const refund = { gold: 0, shards: 0 };
  const treeIn = isCompact(raw.tree) ? decodeTree(raw.tree, TREE).tree : raw.tree;
  const seenIn = isCompact(raw.seen) ? decodeSeen(raw.seen, TREE) : raw.seen;
  const tree = TREE ? sanitizeTree(treeIn, stats, TREE, TREE_DATA, refund, raw.creep) : {};
  return {
    version: SAVE_VERSION,
    createdAt: created,
    updatedAt: int(raw.updatedAt, created, 0, 1e14),
    gold: Math.min(MAX_NUM, int(raw.gold, 0) + refund.gold),
    shards: Math.min(MAX_NUM, int(raw.shards, 0) + refund.shards),
    dawnglass: Math.min(MAX_GLASS, int(raw.dawnglass, 0, 0, MAX_GLASS) + int(refund.glass, 0, 0, MAX_GLASS)),
    stats,
    unlocks: cleanMap(raw.unlocks),
    tree,
    creep: TREE ? sanitizeCreep(raw.creep, tree, TREE) : {},
    seen: TREE ? sanitizeSeen(seenIn, TREE) : {},
    notes: notesOf(raw.notes),
    settings: {
      musicVol: num(st.musicVol, ds.musicVol, 0, 1),
      sfxVol: num(st.sfxVol, ds.sfxVol, 0, 1),
      screenShake: bool(st.screenShake, ds.screenShake),
      reducedMotion: bool(st.reducedMotion, ds.reducedMotion),
      damageNumbers: bool(st.damageNumbers, ds.damageNumbers),
      quality: QUALITIES.includes(st.quality) ? st.quality : ds.quality,
      brightness: BRIGHTNESS.includes(st.brightness) ? st.brightness : ds.brightness,
      touchMode: TOUCH_MODES.includes(st.touchMode) ? st.touchMode : ds.touchMode,
      stickSize: STICK_NAMES.includes(st.stickSize) ? st.stickSize : ds.stickSize,
    },
  };
}

// The on-disk / export form: identical to the in-memory save except tree and seen are written compact.
export function serializeSave(save) {
  const out = { ...save };
  if (TREE) {
    out.tree = encodeTree(save.tree, TREE, TREE.treeVersion);
    out.seen = encodeSeen(save.seen, TREE);
  } else { out.tree = {}; out.seen = {}; }
  return out;
}

// Parse + migrate + sanitise untrusted text. Returns {ok, save} or {ok:false, error, code}.
export function parseSave(text) {
  if (typeof text !== 'string') return { ok: false, code: 'type', error: 'Not a save file.' };
  if (text.length > MAX_SAVE_BYTES) return { ok: false, code: 'size', error: 'Save file is too large.' };
  let raw;
  try { raw = JSON.parse(text); } catch { return { ok: false, code: 'json', error: 'Save file is not valid JSON.' }; }
  if (!isObj(raw)) return { ok: false, code: 'shape', error: 'Save file has the wrong format.' };
  const v = raw.version;
  if (!Number.isInteger(v) || v < 1) return { ok: false, code: 'version', error: 'Save file has no valid version.' };
  if (v > SAVE_VERSION) return { ok: false, code: 'future', error: 'This save is from a newer version of the game. Update the game to use it.' };
  let cur = raw;
  try {
    for (let n = v; n < SAVE_VERSION; n++) {
      const fn = MIGRATIONS[n];
      if (typeof fn !== 'function') return { ok: false, code: 'migrate', error: 'Save is too old to upgrade.' };
      cur = fn(cur);
    }
    // v3+ saves carry the tree version they were written with; older content versions run their steps now (before sanitising).
    if (v >= 3 && TREE && isCompact(cur.tree)) {
      const dec = decodeTreeRaw(cur.tree, TREE); // raw: retired ids and full ranks reach the steps so refunds are exact
      if (dec.v !== null && dec.v > TREE.treeVersion) return { ok: false, code: 'future', error: 'This save is from a newer version of the game. Update the game to use it.' };
      const from = dec.v === null ? TREE.treeVersion : Math.max(3, dec.v); // a forged low version can never replay the Regrowth refund
      if (from < TREE.treeVersion) {
        const r = runTreeSteps(dec.tree, from, TREE.treeVersion);
        cur = { ...cur, tree: r.tree, gold: Math.min(MAX_NUM, int(cur.gold, 0) + r.gold), shards: Math.min(MAX_NUM, int(cur.shards, 0) + r.shards), notes: { ...(isObj(cur.notes) ? cur.notes : {}), ...r.notes } };
      }
    }
  } catch { return { ok: false, code: 'migrate', error: 'Save could not be upgraded.' }; }
  return { ok: true, save: sanitize(cur) };
}
