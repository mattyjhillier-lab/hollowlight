// Save manager: localStorage with in-memory fallback, rolling backup, debounced writes.
import { defaultSave, parseSave, sanitize, serializeSave, RECENT_RUNS } from './schema.js';
import { metConditions } from '../meta/tree.js';

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
    const text = JSON.stringify(serializeSave(this.data));
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

  markSeen(id) {
    if (this.data.seen[id]) return;
    this.data.seen = sanitize({ ...this.data, seen: { ...this.data.seen, [id]: true } }).seen;
    this.saveSoon();
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
    this.saveNow();
    return { gold: this.data.gold, shards: this.data.shards, bestTime: this.data.stats.bestTime, newBest, prevBest, newlyMet };
  }

  exportText() { return JSON.stringify(serializeSave(this.data), null, 2); }

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
