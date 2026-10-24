// Save manager: localStorage with in-memory fallback, rolling backup, debounced writes.
import { defaultSave, parseSave, sanitize, serializeSave, treeReady, RECENT_RUNS } from './schema.js';
import { metConditions } from '../meta/tree.js';
import { recordTierRun } from './tiers.js';
import { cleanHints } from '../ui/whispers.js';

export const SAVE_KEY = 'hollowlight:save';
export const BACKUP_KEY = 'hollowlight:save:backup';
export const DAMAGED_KEY = 'hollowlight:save:damaged'; // one slot: the last damaged main save, never written by saveNow
export const NEWER_NOTE = 'This save is from a newer version of Hollowlight: it is kept safe and untouched. Update the game to continue. Nothing is saved in this session; Settings > Export save still gives you the file.';
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

  load() {
    let res = null;
    const main = this._get(this.keys.save);
    const bak = this._get(this.keys.backup);
    const rm = main !== null ? parseSave(main) : null;
    const rb = bak !== null ? parseSave(bak) : null;
    if (rm && rm.code === 'future') this._lock(main);
    else if (rm && !rm.ok) {
      this._quarantine(main);
      if (rb && rb.code === 'future') this._lock(bak);
      else if (rb && rb.ok) { res = rb; this.loadNote = 'Save was damaged; restored from backup. A copy of the damaged file was kept in this browser.'; }
      else { this.loadNote = 'Save was damaged; started fresh. A copy of the damaged file was kept in this browser: Settings > Export save gives it to you.'; this.keptRaw = main; }
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

  _quarantine(text) { if (text !== this._get(this.keys.damaged)) this._set(this.keys.damaged, text); }

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

  setSettings(patch) {
    this.data.settings = sanitize({ ...this.data, settings: { ...this.data.settings, ...patch } }).settings;
    this.saveSoon();
    return this.data.settings;
  }

  // Bank a finished run. Returns a summary for the results screen.
  bankRun(r, ctx = null) {
    const s = this.data.stats;
    const pos = (v) => Math.max(0, Math.floor(Number(v) || 0));
    const time = Math.max(0, Number(r.time) || 0);
    const prevBest = s.bestTime;
    const newBest = time > prevBest;
    const before = ctx && ctx.def ? metConditions(ctx.def, s, ctx.data) : new Set();
    this.data.gold += pos(r.gold);
    this.data.shards += pos(r.shards);
    s.runs += 1;
    const won = r.outcome === 'victory';
    if (won) s.wins += 1;
    s.kills += pos(r.kills);
    s.totalGold += pos(r.gold);
    s.totalPlayTime += time;
    s.bestLevel = Math.max(s.bestLevel, pos(r.level));
    if (newBest) s.bestTime = time;
    // Per-enemy / per-chapter / per-build records (ids come from the sim; sanitize() re-clamps everything).
    const bump = (map, id, n = 1) => { if (typeof id === 'string' && id) map[id] = (Object.hasOwn(map, id) ? map[id] : 0) + n; };
    if (r.killsByEnemy && typeof r.killsByEnemy === 'object') for (const [id, n] of Object.entries(r.killsByEnemy)) bump(s.killsByEnemy, id, pos(n));
    if (r.bossKilled && r.bossId) bump(s.bossKills, r.bossId);
    if (typeof r.character === 'string') bump(s.charsUsed, r.character);
    if (Array.isArray(r.weapons)) {
      for (const w of r.weapons) {
        if (!w || typeof w.id !== 'string') continue;
        bump(s.weaponsUsed, w.id);
        if (w.evo) bump(s.evolved, w.evo);
      }
    }
    // tool-cluster unlock counters (the sim counts them per run; sanitize() clamps)
    s.gems += pos(r.gems); s.abilityUses += pos(r.abilityUses); s.blessingsTaken += pos(r.blessings); s.markedKills = Math.min(1e9, s.markedKills + Math.min(pos(r.marked), 5000)); // DT2: a forged run count is clamped (a real run marks a few hundred at most) s.chests += pos(r.chests);
    // difficulty tier records + the one-time first-dawn bounty (a tier whose gate the save does not own is recorded as Twilight)
    const tier = ctx && ctx.data ? recordTierRun(this.data, r, { data: ctx.data, unlockedTiers: ctx.unlockedTiers }) : null;
    if (typeof r.chapter === 'string') {
      const c = Object.hasOwn(s.chapters, r.chapter) ? s.chapters[r.chapter] : (s.chapters[r.chapter] = { runs: 0, clears: 0, bestTime: 0 });
      c.runs += 1;
      if (won) c.clears += 1;
      c.bestTime = Math.max(c.bestTime, time);
    }
    // Last RECENT_RUNS runs (per-run pace for the tree's "about N more runs" hint); sanitize() re-clamps every field.
    const kills = r.killsByEnemy && typeof r.killsByEnemy === 'object' ? Object.entries(r.killsByEnemy).sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0)).slice(0, 12) : [];
    const evos = Array.isArray(r.weapons) ? r.weapons.filter((w) => w && typeof w.evo === 'string').map((w) => w.evo) : [];
    s.recentRuns = [...(Array.isArray(s.recentRuns) ? s.recentRuns : []), { t: time, k: Object.fromEntries(kills.map(([id, n]) => [id, pos(n)])), e: evos, b: !!(r.bossKilled && r.bossId), c: won }].slice(-RECENT_RUNS);
    this.data = sanitize(this.data);
    const after = ctx && ctx.def ? metConditions(ctx.def, this.data.stats, ctx.data) : new Set();
    const newlyMet = [...after].filter((id) => !before.has(id) && !this.data.tree[id]);
    this.keptRaw = this.readOnly ? this.keptRaw : null;
    this.saveNow();
    return { gold: this.data.gold, shards: this.data.shards, dawnglass: this.data.dawnglass, bestTime: this.data.stats.bestTime, newBest, prevBest, newlyMet, tier, runGold: pos(r.gold) + (tier ? tier.goldBonus : 0) };
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
