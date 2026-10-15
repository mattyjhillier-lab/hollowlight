// Save schema, migrations and strict validation. Pure JS, no DOM. All input is untrusted.
import { sanitizeTree, sanitizeSeen } from '../meta/tree.js';

export const SAVE_VERSION = 2;
export const MAX_SAVE_BYTES = 200 * 1024;
export const QUALITIES = ['auto', 'low', 'med', 'high'];
export const TOUCH_MODES = ['auto', 'on', 'off'];
export const STICK_NAMES = ['small', 'medium', 'large'];

const MAX_NUM = 1e12;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// The compiled skill tree (src/meta/tree.js). Registered once at boot; until then tree data fails closed to {}.
let TREE = null;
let TREE_DATA = null;
export function setTreeDef(def, data) { TREE = def; TREE_DATA = data; }

export function defaultSettings() {
  return { musicVol: 0.7, sfxVol: 0.8, screenShake: true, reducedMotion: false, damageNumbers: true, quality: 'auto', touchMode: 'auto', stickSize: 'medium' };
}

export function defaultSave(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    gold: 0,
    shards: 0,
    stats: defaultStats(),
    unlocks: {},
    tree: {},
    seen: {},
    settings: defaultSettings(),
  };
}

export function defaultStats() {
  return {
    runs: 0, wins: 0, kills: 0, bestTime: 0, totalPlayTime: 0,
    bestLevel: 0, totalGold: 0,
    killsByEnemy: {}, bossKills: {}, chapters: {}, evolved: {}, weaponsUsed: {}, charsUsed: {},
  };
}

// Migration table: MIGRATIONS[n] upgrades a version-n object to n+1. Append later.
// v1 -> v2: skill tree arrives. The v1 tree was an empty placeholder, so it is reset; new stat maps start empty
// (sanitize fills them). Gold, shards, stats totals and settings carry over.
export const MIGRATIONS = {
  1: (o) => ({ ...o, version: 2, tree: {}, seen: {} }),
};

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v, def, min = 0, max = MAX_NUM) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
const int = (v, def, min = 0, max = MAX_NUM) => Math.floor(num(v, def, min, max));
const ID_KEY = /^[a-z0-9_]{1,40}$/;
// id -> bounded count (stat maps keyed by enemy / chapter / weapon / character ids).
function countMap(o, maxKeys = 64, max = 1e9) {
  const out = {};
  if (!isObj(o)) return out;
  let n = 0;
  for (const k of Object.keys(o)) {
    if (n >= maxKeys) break;
    if (BAD_KEYS.has(k) || !ID_KEY.test(k)) continue;
    if (typeof o[k] !== 'number' || !Number.isFinite(o[k])) continue;
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
    if (n >= 32) break;
    if (BAD_KEYS.has(k) || !ID_KEY.test(k) || !isObj(o[k])) continue;
    out[k] = { runs: int(o[k].runs, 0, 0, 1e9), clears: int(o[k].clears, 0, 0, 1e9), bestTime: num(o[k].bestTime, 0, 0, 1e7) };
    n++;
  }
  return out;
}

const bool = (v, def) => (typeof v === 'boolean' ? v : def);

// Free-form id->value map (unlocks/tree): short safe ids, bounded numbers/bools only.
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
    killsByEnemy: countMap(s.killsByEnemy),
    bossKills: countMap(s.bossKills, 32),
    chapters: chapterMap(s.chapters),
    evolved: countMap(s.evolved),
    weaponsUsed: countMap(s.weaponsUsed, 32),
    charsUsed: countMap(s.charsUsed, 32),
  };
  // Owned stat nodes whose weapon gate is not owned (pre-G1e saves) are dropped WITH a full refund.
  const refund = { gold: 0, shards: 0 };
  const tree = TREE ? sanitizeTree(raw.tree, stats, TREE, TREE_DATA, refund) : {};
  return {
    version: SAVE_VERSION,
    createdAt: created,
    updatedAt: int(raw.updatedAt, created, 0, 1e14),
    gold: Math.min(MAX_NUM, int(raw.gold, 0) + refund.gold),
    shards: Math.min(MAX_NUM, int(raw.shards, 0) + refund.shards),
    stats,
    unlocks: cleanMap(raw.unlocks),
    tree,
    seen: TREE ? sanitizeSeen(raw.seen, TREE) : {},
    settings: {
      musicVol: num(st.musicVol, ds.musicVol, 0, 1),
      sfxVol: num(st.sfxVol, ds.sfxVol, 0, 1),
      screenShake: bool(st.screenShake, ds.screenShake),
      reducedMotion: bool(st.reducedMotion, ds.reducedMotion),
      damageNumbers: bool(st.damageNumbers, ds.damageNumbers),
      quality: QUALITIES.includes(st.quality) ? st.quality : ds.quality,
      touchMode: TOUCH_MODES.includes(st.touchMode) ? st.touchMode : ds.touchMode,
      stickSize: STICK_NAMES.includes(st.stickSize) ? st.stickSize : ds.stickSize,
    },
  };
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
  } catch { return { ok: false, code: 'migrate', error: 'Save could not be upgraded.' }; }
  return { ok: true, save: sanitize(cur) };
}
