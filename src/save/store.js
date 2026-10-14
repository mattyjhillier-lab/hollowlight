// Save manager: localStorage with in-memory fallback, rolling backup, debounced writes.
import { defaultSave, parseSave, sanitize } from './schema.js';

export const SAVE_KEY = 'hollowlight:save';
export const BACKUP_KEY = 'hollowlight:save:backup';
const DEBOUNCE_MS = 400;

function defaultStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export class SaveStore {
  constructor(storage) {
    this.storage = storage === undefined ? defaultStorage() : storage;
    this.persistent = true; // false once a read/write failed (progress lives in memory only)
    this.timer = null;
    this.persistAsked = false;
    this.data = defaultSave();
    this.loadNote = null; // friendly message if recovery happened
  }

  _get(key) { try { return this.storage ? this.storage.getItem(key) : null; } catch { this.persistent = false; return null; } }
  _set(key, val) { try { if (!this.storage) throw new Error('none'); this.storage.setItem(key, val); return true; } catch { this.persistent = false; return false; } }

  load() {
    let res = null;
    const main = this._get(SAVE_KEY);
    const bak = this._get(BACKUP_KEY);
    if (main !== null) {
      res = parseSave(main);
      if (!res.ok) {
        const r2 = bak !== null ? parseSave(bak) : null;
        if (r2 && r2.ok) { res = r2; this.loadNote = 'Save was damaged; restored from backup.'; }
        else { res = null; this.loadNote = 'Save was damaged; started fresh.'; }
      }
    } else if (bak !== null) {
      const r2 = parseSave(bak);
      if (r2.ok) res = r2;
    }
    this.data = res ? res.save : defaultSave();
    return this.data;
  }

  // Immediate write; keeps the previous good copy as the backup.
  saveNow() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.data.updatedAt = Date.now();
    const text = JSON.stringify(this.data);
    const prev = this._get(SAVE_KEY);
    if (prev !== null && parseSave(prev).ok) this._set(BACKUP_KEY, prev);
    const ok = this._set(SAVE_KEY, text);
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

  setSettings(patch) {
    this.data.settings = sanitize({ ...this.data, settings: { ...this.data.settings, ...patch } }).settings;
    this.saveSoon();
    return this.data.settings;
  }

  // Bank a finished run. Returns a summary for the results screen.
  bankRun(r) {
    const s = this.data.stats;
    const pos = (v) => Math.max(0, Math.floor(Number(v) || 0));
    const time = Math.max(0, Number(r.time) || 0);
    const prevBest = s.bestTime;
    const newBest = time > prevBest;
    this.data.gold += pos(r.gold);
    this.data.shards += pos(r.shards);
    s.runs += 1;
    if (r.outcome === 'victory') s.wins += 1;
    s.kills += pos(r.kills);
    s.totalPlayTime += time;
    if (newBest) s.bestTime = time;
    this.data = sanitize(this.data);
    this.saveNow();
    return { gold: this.data.gold, shards: this.data.shards, bestTime: this.data.stats.bestTime, newBest, prevBest };
  }

  exportText() { return JSON.stringify(this.data, null, 2); }

  // Validate imported text without applying it.
  checkImport(text) { return parseSave(text); }

  applyImport(save) {
    this.data = sanitize(save);
    this.saveNow();
  }

  reset() {
    this.data = defaultSave();
    this.saveNow();
  }
}
