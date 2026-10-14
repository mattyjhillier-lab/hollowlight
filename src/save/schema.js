// Save schema, migrations and strict validation. Pure JS, no DOM. All input is untrusted.
export const SAVE_VERSION = 1;
export const MAX_SAVE_BYTES = 200 * 1024;
export const QUALITIES = ['auto', 'low', 'med', 'high'];

const MAX_NUM = 1e12;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function defaultSettings() {
  return { musicVol: 0.7, sfxVol: 0.8, screenShake: true, reducedMotion: false, damageNumbers: true, quality: 'auto' };
}

export function defaultSave(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    gold: 0,
    shards: 0,
    stats: { runs: 0, wins: 0, kills: 0, bestTime: 0, totalPlayTime: 0 },
    unlocks: {},
    tree: {},
    settings: defaultSettings(),
  };
}

// Migration table: MIGRATIONS[n] upgrades a version-n object to n+1. Append later.
export const MIGRATIONS = {};

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v, def, min = 0, max = MAX_NUM) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
const int = (v, def, min = 0, max = MAX_NUM) => Math.floor(num(v, def, min, max));
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
  return {
    version: SAVE_VERSION,
    createdAt: created,
    updatedAt: int(raw.updatedAt, created, 0, 1e14),
    gold: int(raw.gold, 0),
    shards: int(raw.shards, 0),
    stats: {
      runs: int(s.runs, 0),
      wins: int(s.wins, 0),
      kills: int(s.kills, 0),
      bestTime: num(s.bestTime, 0, 0, 1e7),
      totalPlayTime: num(s.totalPlayTime, 0, 0, 1e9),
    },
    unlocks: cleanMap(raw.unlocks),
    tree: cleanMap(raw.tree),
    settings: {
      musicVol: num(st.musicVol, ds.musicVol, 0, 1),
      sfxVol: num(st.sfxVol, ds.sfxVol, 0, 1),
      screenShake: bool(st.screenShake, ds.screenShake),
      reducedMotion: bool(st.reducedMotion, ds.reducedMotion),
      damageNumbers: bool(st.damageNumbers, ds.damageNumbers),
      quality: QUALITIES.includes(st.quality) ? st.quality : ds.quality,
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
