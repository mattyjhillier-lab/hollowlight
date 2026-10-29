// Save manager: localStorage with in-memory fallback, rolling backup, debounced writes.
import { defaultSave, parseSave, sanitize, serializeSave, treeReady, RECENT_RUNS, MAX_SAVE_BYTES } from './schema.js';
import { metConditions } from '../meta/tree.js';
import { recordTierRun } from './tiers.js';
import { bankChars } from './chars.js';
import { cleanHints } from '../ui/whispers.js';
import { cleanIntros } from '../ui/introcopy.js';
import { cleanCodex, cleanTitles } from '../meta/codex.js';

export const SAVE_KEY = 'hollowlight:save';
export const BACKUP_KEY = 'hollowlight:save:backup';
export const DAMAGED_KEY = 'hollowlight:save:damaged'; // one slot: the last damaged main save, never written by saveNow
export const NEWER_NOTE = 'This save is from a newer version of Wispwick: it is kept safe and untouched. Update the game to continue. Nothing is saved in this session; Settings > Export save still gives you the file.';
export const DAMAGED_MAX = MAX_SAVE_BYTES + 8 * 1024; // A1: the kept damaged copy is bounded (an oversized blob keeps its first part only)
export const DAMAGED_NOTE = 'Your save could not be read, so a fresh one was started. Nothing was thrown away: a copy of the damaged file was kept in this browser. Settings > Saves can download it, and Import brings back a backup file.';
export const RESTORED_NOTE = 'Your save could not be read, so the last good copy was loaded instead. A copy of the damaged file was kept in this browser: Settings > Saves can download it.';
const DEBOUNCE_MS = 400;

function defaultStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export class SaveStore {
  // keys: per-lantern storage keys {save, backup, damaged} (FD1); default = the legacy single-save keys.
  // opts.forceReadOnly: the lantern index is from a newer build, so this lantern is never written (downgrade guard, 24b).
  constructor(storage, keys = null, opts = {}) {
    this.storage = storage === undefined ? defaultStorage() : storage;
    this.keys = keys || { save: SAVE_KEY, backup: BACKUP_KEY, damaged: DAMAGED_KEY };
    this.forceReadOnly = !!(opts && opts.forceReadOnly);
    this.persistent = true; // false once a read/write failed (progress lives in memory only)
    this.timer = null;
    this.persistAsked = false;
    this.data = defaultSave();
    this.loadNote = null; // friendly message if recovery happened (shown once on the title screen)
    this.readOnly = false; // true when the stored save is from a NEWER version: it is never written over
    this.keptRaw = null; // raw text export returns instead of the in-memory save (newer-version save, or a quarantined damaged one)
    this.stamp = 0; // updatedAt of the last copy this tab read or wrote: a newer stored copy means another tab saved
  }

  _get(key) { try { return this.storage ? this.storage.getItem(key) : null; } catch { this.persistent = false; return null; } }
  _set(key, val) { try { if (!this.storage) throw new Error('none'); this.storage.setItem(key, val); return true; } catch { this.persistent = false; return false; } }

  // A1: never throws. Anything unexpected (a storage that misbehaves, a hostile shape) falls back to a fresh in-memory state.
  load() {
    try { return this._load(); } catch {
      this.data = defaultSave(); this.stamp = this.data.updatedAt;
      this.loadNote = DAMAGED_NOTE;
      return this.data;
    }
  }

  _load() {
    let res = null;
    const main = this._get(this.keys.save);
    const bak = this._get(this.keys.backup);
    const rm = main !== null ? parseSave(main) : null;
    const rb = bak !== null ? parseSave(bak) : null;
    if (rm && rm.code === 'future') this._lock(main);
    else if (rm && !rm.ok) {
      this._quarantine(main);
      if (rb && rb.code === 'future') this._lock(bak);
      else if (rb && rb.ok) { res = rb; this.loadNote = RESTORED_NOTE; }
      else { this.loadNote = DAMAGED_NOTE; this.keptRaw = main.length > DAMAGED_MAX ? main.slice(0, DAMAGED_MAX) : main; }
    } else if (rm) res = rm;
    else if (rb && rb.code === 'future') this._lock(bak);
    else if (rb && rb.ok) res = rb;
    this.data = res ? res.save : defaultSave();
    this.stamp = this.data.updatedAt;
    if (this.forceReadOnly && !this.readOnly) this._lock(main !== null ? main : bak);
    return this.data;
  }

  // A save from a newer build is read-only for the whole session: kept byte for byte, never overwritten.
  _lock(raw) {
    this.readOnly = true;
    this.keptRaw = raw;
    this.loadNote = NEWER_NOTE;
  }

  _quarantine(text) {
    const t = typeof text === 'string' ? (text.length > DAMAGED_MAX ? text.slice(0, DAMAGED_MAX) : text) : '';
    if (t !== this._get(this.keys.damaged)) { const p = this.persistent; this._set(this.keys.damaged, t); this.persistent = p; } // a full storage must not mark the whole session unsaved
  }

  // A1: the kept copy of the last unreadable save (bounded), or null. Offered as a download in Settings > Saves.
  damagedText() { const t = this._get(this.keys.damaged); return typeof t === 'string' && t.length && t.length <= DAMAGED_MAX ? t : null; }

  // A1 backup reminder: an export (or 'Not now') restarts the count (stats.runs + time; src/save/nudge.js).
  markBackup(now = Date.now()) {
    if (this.readOnly) return;
    this.data.notes = sanitize({ ...this.data, notes: { ...this.data.notes, backup: { r: this.data.stats.runs, t: now } } }).notes;
    this.saveSoon();
  }

  // Immediate write; keeps the previous good copy as the backup.
  // Refuses (returns false, writes nothing) when the stored save is from a newer version, when another tab saved newer
  // progress meanwhile (this tab adopts it instead of overwriting), or when the tree data is not registered yet.
  saveNow(force = false) {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.readOnly || !treeReady()) return false;
    const prev = this._get(this.keys.save);
    const pr = prev !== null ? parseSave(prev) : null;
    if (pr && pr.code === 'future') { this._lock(prev); return false; }
    if (!force && pr && pr.ok && pr.save.updatedAt > this.stamp) {
      this.data = pr.save; this.stamp = pr.save.updatedAt;
      this.loadNote = 'Another tab saved newer progress; this tab loaded it instead of overwriting it.';
      return false;
    }
    this.data.updatedAt = Math.max(Date.now(), this.stamp + 1);
    const text = JSON.stringify(serializeSave(this.data));
    if (pr && pr.ok) this._set(this.keys.backup, prev);
    const ok = this._set(this.keys.save, text);
    if (ok) this.stamp = this.data.updatedAt;
    if (ok && !this.persistAsked) {
      this.persistAsked = true;
      try {
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      } catch { /* best effort */ }
    }
    return ok;
  }

  // Debounced write for settings changes.
  saveSoon() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; this.saveNow(); }, DEBOUNCE_MS);
  }

  flush() { if (this.timer) this.saveNow(); }

  markSeen(id) {
    if (this.data.seen[id]) return;
    this.data.seen = sanitize({ ...this.data, seen: { ...this.data.seen, [id]: true } }).seen;
    this.saveSoon();
  }

  // FM1: this lantern's whisper bits (validated; a debounced write so a plate never costs a frame).
  setHints(bits) {
    const b = cleanHints(bits);
    if (b === this.data.hints) return b;
    this.data.hints = b;
    this.saveSoon();
    return b;
  }

  // FIX3: the new-feature cards already shown (validated; debounced).
  setIntros(bits) {
    const b = cleanIntros(bits);
    if (b === this.data.intros) return b;
    this.data.intros = b;
    this.saveSoon();
    return b;
  }

  // CX1: the Almanac bitsets / CX6 titles (validated; debounced like the whisper bits).
  setCodex(codex) {
    const c = cleanCodex(codex);
    if (c.v === this.data.codex.v && c.read === this.data.codex.read && c.told === this.data.codex.told) return c;
    this.data.codex = c;
    this.saveSoon();
    return c;
  }

  setTitles(titles) {
    const t = cleanTitles(titles);
    if (JSON.stringify(t) === JSON.stringify(this.data.titles)) return t;
    this.data.titles = t;
    this.saveSoon();
    return t;
  }

  setSettings(patch) {
    this.data.settings = sanitize({ ...this.data, settings: { ...this.data.settings, ...patch } }).settings;
    this.saveSoon();
    return this.data.settings;
  }

  // Bank a finished run. Returns a summary for the results screen.
  bankRun(r, ctx = null) {
    const s = this.data.stats;
    const pos = (v) => Math.max(0, Math.floor(Number(v) || 0));
    // EXTRAS v1 Endless Dusk: records use the DAWN time; the dark adds play time only. Endless gold is capped here too (a forged result
    // can never bank more than the dawn gold + the locked share), whatever the sim said.
    const E = r.endless && typeof r.endless === 'object' && Number.isFinite(r.endless.dawn) && r.endless.dawn > 0 ? r.endless : null;
    if (E) {
      const capK = ctx && ctx.data && ctx.data.balance && ctx.data.balance.endless && Number.isFinite(ctx.data.balance.endless.goldCap) ? Math.min(2, Math.max(0, ctx.data.balance.endless.goldCap)) : 0.5;
      r = { ...r, gold: Math.min(pos(r.gold), Math.floor(pos(E.gold0) * (1 + capK))), outcome: 'victory' };
    }
    const full = Math.max(0, Number(r.time) || 0);
    const time = E ? Math.min(full, Math.max(0, Number(E.dawn) || 0)) : full;
    const prevBest = s.bestTime;
    // EXTRAS v1 Gentle Light: Twilight only; stars and best times rest (gold, shards, Bond, clears and the Night Gate count as normal)
    const assisted = r.assist === true && (r.tier === undefined || r.tier === 'normal');
    const newBest = !assisted && time > prevBest;
    const before = ctx && ctx.def ? metConditions(ctx.def, s, ctx.data) : new Set();
    this.data.gold += pos(r.gold);
    this.data.shards += pos(r.shards);
    s.runs += 1;
    const won = r.outcome === 'victory';
    if (won) s.wins += 1;
    s.kills += pos(r.kills);
    s.totalGold += pos(r.gold);
    s.totalPlayTime += full;
    s.bestLevel = Math.max(s.bestLevel, pos(r.level));
    if (newBest) s.bestTime = time;
    // Per-enemy / per-chapter / per-build records (ids come from the sim; sanitize() re-clamps everything).
    const bump = (map, id, n = 1) => { if (typeof id === 'string' && id) map[id] = (Object.hasOwn(map, id) ? map[id] : 0) + n; };
    if (r.killsByEnemy && typeof r.killsByEnemy === 'object') for (const [id, n] of Object.entries(r.killsByEnemy)) bump(s.killsByEnemy, id, pos(n));
    if (r.bossKilled && r.bossId) bump(s.bossKills, r.bossId);
    if (typeof r.character === 'string') bump(s.charsUsed, r.character);
    if (typeof r.startWeapon === 'string') bump(s.startWeapon, r.startWeapon);
    if (Array.isArray(r.weapons)) {
      for (const w of r.weapons) {
        if (!w || typeof w.id !== 'string') continue;
        bump(s.weaponsUsed, w.id);
        if (w.evo) bump(s.evolved, w.evo);
      }
    }
    // tool-cluster unlock counters (the sim counts them per run; sanitize() clamps)
    s.gems += pos(r.gems); s.abilityUses += pos(r.abilityUses); s.blessingsTaken += pos(r.blessings); s.markedKills = Math.min(1e9, s.markedKills + Math.min(pos(r.marked), 5000)); // DT2: a forged run count is clamped (a real run marks a few hundred at most)
    s.chests += Math.min(pos(r.chests), 50); // (was inside the comment above, so chests were never banked: fixed with CHARACTER SYSTEM v2)
    // CHARACTER SYSTEM v2: Bond XP + keepsake, banked here only (one write per run, with the gold)
    const bond = ctx && ctx.data ? bankChars(this.data, r, ctx.data) : null;
    // difficulty tier records + the one-time first-dawn bounty (a tier whose gate the save does not own is recorded as Twilight)
    const tier = ctx && ctx.data ? recordTierRun(this.data, r, { data: ctx.data, unlockedTiers: ctx.unlockedTiers }) : null;
    if (typeof r.chapter === 'string') {
      const c = Object.hasOwn(s.chapters, r.chapter) ? s.chapters[r.chapter] : (s.chapters[r.chapter] = { runs: 0, clears: 0, bestTime: 0 });
      c.runs += 1;
      if (won) c.clears += 1;
      if (!assisted) c.bestTime = Math.max(c.bestTime, time);
    }
    // Last RECENT_RUNS runs (per-run pace for the tree's "about N more runs" hint); sanitize() re-clamps every field.
    const kills = r.killsByEnemy && typeof r.killsByEnemy === 'object' ? Object.entries(r.killsByEnemy).sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0)).slice(0, 12) : [];
    const evos = Array.isArray(r.weapons) ? r.weapons.filter((w) => w && typeof w.evo === 'string').map((w) => w.evo) : [];
    s.recentRuns = [...(Array.isArray(s.recentRuns) ? s.recentRuns : []), { t: time, k: Object.fromEntries(kills.map(([id, n]) => [id, pos(n)])), e: evos, b: !!(r.bossKilled && r.bossId), c: won, ...(assisted ? { a: true } : {}) }].slice(-RECENT_RUNS);
    this.data = sanitize(this.data);
    const after = ctx && ctx.def ? metConditions(ctx.def, this.data.stats, ctx.data) : new Set();
    const newlyMet = [...after].filter((id) => !before.has(id) && !this.data.tree[id]);
    this.keptRaw = this.readOnly ? this.keptRaw : null;
    this.saveNow();
    return { gold: this.data.gold, shards: this.data.shards, dawnglass: this.data.dawnglass, bestTime: this.data.stats.bestTime, newBest, prevBest, newlyMet, tier, runGold: pos(r.gold) + (tier ? tier.goldBonus : 0), bond };
  }

  exportText() { if (this.keptRaw !== null) return this.keptRaw; return JSON.stringify(serializeSave(this.data), null, 2); }

  // Validate imported text without applying it.
  checkImport(text) { return this.readOnly ? { ok: false, code: 'locked', error: 'Saving is switched off because your save is from a newer version. Update the game first.' } : parseSave(text); }

  applyImport(save) {
    if (this.readOnly) return false;
    this.data = sanitize(save);
    this.keptRaw = null;
    return this.saveNow(true);
  }

  reset() {
    if (this.readOnly) return false;
    this.data = defaultSave();
    this.keptRaw = null;
    return this.saveNow(true);
  }
}
