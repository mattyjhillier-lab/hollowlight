// FD1 lantern (profile) store: an index key + one save v3 per lantern, max 3, device-only (docs/design/front-door-v1.md).
// Everything read from storage or an import is untrusted: size-capped, JSON-parsed in try/catch, rebuilt from whitelisted
// fields only (ids are one of three fixed slot ids, so storage keys are never built from stored text).
import { SaveStore, SAVE_KEY, BACKUP_KEY } from './store.js';
import { parseSave } from './schema.js';

export const INDEX_KEY = 'hollowlight:lanterns';
export const INDEX_VERSION = 1;
export const MAX_LANTERNS = 3;
export const LANTERN_IDS = Object.freeze(['l1', 'l2', 'l3']);
export const NAME_MAX = 16;
const MAX_INDEX_BYTES = 4096;
const ID_RE = /^l[1-3]$/;
const NAME_RE = /^[\p{L}\p{N}' -]+$/u;

export function lanternKeys(id) {
  if (!ID_RE.test(id)) throw new Error('bad lantern id');
  const base = `hollowlight:lantern:${id}`;
  return { save: `${base}:save`, backup: `${base}:save:backup`, damaged: `${base}:save:damaged` };
}

// Names: 1-16 characters of letters, digits, space, apostrophe, hyphen (shown via textContent only).
export function cleanName(input) {
  if (typeof input !== 'string') return { ok: false, error: 'Name must be text.' };
  if (input.length > 64) return { ok: false, error: `Names are at most ${NAME_MAX} characters.` };
  const s = input.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!s) return { ok: false, error: 'Name is empty.' };
  if ([...s].length > NAME_MAX) return { ok: false, error: `Names are at most ${NAME_MAX} characters.` };
  if (!NAME_RE.test(s)) return { ok: false, error: "Use letters, numbers, spaces, ' and - only." };
  return { ok: true, name: s };
}

const defaultName = (id) => `Lantern ${id.slice(1)}`;

// Parse + sanitise index text. Returns { ok, future, index } ; index = { active, list: [{id, name}] } (fresh objects).
export function parseIndex(text) {
  if (typeof text !== 'string' || text.length > MAX_INDEX_BYTES) return { ok: false };
  let raw;
  try { raw = JSON.parse(text); } catch { return { ok: false }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false };
  const v = Object.hasOwn(raw, 'v') ? raw.v : undefined;
  if (!Number.isInteger(v) || v < 1) return { ok: false };
  const listIn = Object.hasOwn(raw, 'list') && Array.isArray(raw.list) ? raw.list.slice(0, 8) : [];
  const list = [];
  for (const e of listIn) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) continue;
    const id = Object.hasOwn(e, 'id') ? e.id : null;
    if (typeof id !== 'string' || !ID_RE.test(id) || list.some((x) => x.id === id)) continue; // duplicates: first wins
    const n = cleanName(Object.hasOwn(e, 'name') ? e.name : null);
    list.push({ id, name: n.ok ? n.name : defaultName(id) });
    if (list.length >= MAX_LANTERNS) break;
  }
  if (!list.length) return { ok: false, future: v > INDEX_VERSION };
  const a = Object.hasOwn(raw, 'active') ? raw.active : null;
  const active = list.some((x) => x.id === a) ? a : list[0].id;
  return { ok: true, future: v > INDEX_VERSION, index: { active, list } };
}

export class Lanterns {
  constructor(storage) {
    if (storage === undefined) { try { storage = globalThis.localStorage || null; } catch { storage = null; } }
    this.storage = storage;
    this.index = { active: 'l1', list: [{ id: 'l1', name: defaultName('l1') }] };
    this.locked = false; // index from a newer build: never written, every lantern opens read-only
    this.legacyMode = false; // the legacy save could not be copied (storage full/blocked): run on the legacy keys this session
    this.persistent = true;
    this.note = null;
  }

  _get(k) { try { return this.storage ? this.storage.getItem(k) : null; } catch { this.persistent = false; return null; } }
  _set(k, v) { try { if (!this.storage) throw new Error('none'); this.storage.setItem(k, v); return true; } catch { this.persistent = false; return false; } }
  _del(k) { try { if (this.storage && this.storage.removeItem) this.storage.removeItem(k); } catch { /* best effort */ } }

  _writeIndex(idx = this.index) {
    if (this.locked) return false;
    return this._set(INDEX_KEY, JSON.stringify({ v: INDEX_VERSION, active: idx.active, list: idx.list.map((x) => ({ id: x.id, name: x.name })) }));
  }

  // Boot: read the index; first boot copies (never moves) the legacy single save into lantern 1.
  init() {
    const text = this._get(INDEX_KEY);
    if (text !== null) {
      const r = parseIndex(text);
      if (r.future) {
        this.locked = true;
        this.note = 'Your lanterns are from a newer version of Wispwick: they are kept safe and untouched. Update the game to continue.';
        if (r.ok) this.index = r.index;
        return this;
      }
      if (r.ok) { this.index = r.index; return this; }
      // Damaged index: rebuild it from the lantern saves that exist (no legacy re-copy; that happens only on first boot).
      const list = LANTERN_IDS.filter((id) => { const k = lanternKeys(id); return this._get(k.save) !== null || this._get(k.backup) !== null; }).map((id) => ({ id, name: defaultName(id) }));
      if (list.length) this.index = { active: list[0].id, list };
      this.note = 'The lantern list was damaged and has been rebuilt; names were reset.';
      this._writeIndex();
      return this;
    }
    const k = lanternKeys('l1');
    const main = this._get(SAVE_KEY);
    const bak = this._get(BACKUP_KEY);
    if ((main !== null || bak !== null) && this._get(k.save) === null && this._get(k.backup) === null) {
      const ok = (main === null || this._set(k.save, main)) && (bak === null || this._set(k.backup, bak));
      if (!ok) { // storage full: undo the half copy, keep playing on the legacy save, retry next boot
        this._del(k.save); this._del(k.backup);
        this.legacyMode = true;
        this.note = 'Browser storage is full: your lantern could not be set up yet, so this session uses your existing save.';
        return this;
      }
    }
    if (!this._writeIndex()) {
      if (main !== null || bak !== null) { this.legacyMode = true; this._del(k.save); this._del(k.backup); }
    }
    return this;
  }

  // Another tab may have changed the index since boot: adopt the stored copy before any change so a stale tab never
  // reuses (and wipes) a slot that tab lit, or writes an older list over a newer one.
  _refresh() {
    if (this.locked || this.legacyMode) return;
    const t = this._get(INDEX_KEY);
    if (t === null) return;
    const r = parseIndex(t);
    if (r.future) { this.locked = true; this.note = 'Your lanterns were updated by a newer version of Wispwick in another tab.'; return; }
    if (r.ok) this.index = r.index;
  }

  list() { return this.index.list.map((x) => ({ ...x })); }
  get active() { return this.index.active; }
  has(id) { return this.index.list.some((x) => x.id === id); }
  canCreate() { return !this.locked && !this.legacyMode && this.index.list.length < MAX_LANTERNS; }

  // Store for a lantern (not loaded). Legacy mode only ever opens the legacy keys.
  open(id = this.index.active) {
    if (this.legacyMode) return new SaveStore(this.storage);
    if (!this.has(id)) throw new Error('unknown lantern');
    return new SaveStore(this.storage, lanternKeys(id), { forceReadOnly: this.locked });
  }

  openActive() { return this.open(this.index.active); }

  // FD3: read-only look at a lantern's save for the "Whose lantern?" cards and per-lantern export. Never writes (no quarantine,
  // no migration write-back). -> { status: 'ok' | 'backup' | 'empty' | 'newer' | 'damaged', save, text } ; save is sanitised or null.
  peek(id) {
    if (!this.legacyMode && !this.has(id)) return null;
    const k = this.legacyMode ? { save: SAVE_KEY, backup: BACKUP_KEY } : lanternKeys(id);
    const main = this._get(k.save);
    const bak = this._get(k.backup);
    for (const t of [main, bak]) {
      if (t === null) continue;
      const r = parseSave(t);
      if (r.ok) return { status: t === main ? 'ok' : 'backup', save: r.save, text: t };
      if (r.code === 'future') return { status: 'newer', save: null, text: t };
    }
    if (main === null && bak === null) return { status: 'empty', save: null, text: null };
    return { status: 'damaged', save: null, text: main !== null ? main : bak };
  }

  setActive(id) {
    this._refresh();
    if (this.locked || this.legacyMode) return { ok: false, code: 'locked', error: 'Lanterns cannot be changed right now.' };
    if (!this.has(id)) return { ok: false, code: 'unknown', error: 'No such lantern.' };
    this.index.active = id;
    this._writeIndex();
    return { ok: true };
  }

  // New empty lantern (name optional). The save itself is written on its first saveNow.
  create(name = '') {
    this._refresh();
    if (this.locked || this.legacyMode) return { ok: false, code: 'locked', error: 'Lanterns cannot be changed right now.' };
    if (this.index.list.length >= MAX_LANTERNS) return { ok: false, code: 'full', error: `All ${MAX_LANTERNS} lanterns are lit.` };
    const id = LANTERN_IDS.find((x) => !this.has(x));
    let nm = defaultName(id);
    if (name !== '' && name !== undefined && name !== null) { const n = cleanName(name); if (!n.ok) return { ok: false, code: 'name', error: n.error }; nm = n.name; }
    const k = lanternKeys(id);
    this._del(k.save); this._del(k.backup); this._del(k.damaged); // a slot id is reused: never inherit an orphan
    const next = { active: this.index.active, list: [...this.index.list, { id, name: nm }] };
    if (!this._writeIndex(next)) return { ok: false, code: 'storage', error: 'Browser storage is full or blocked: the lantern was not lit.' };
    this.index = next;
    return { ok: true, id };
  }

  rename(id, name) {
    this._refresh();
    if (this.locked || this.legacyMode) return { ok: false, code: 'locked', error: 'Lanterns cannot be changed right now.' };
    const e = this.index.list.find((x) => x.id === id);
    if (!e) return { ok: false, code: 'unknown', error: 'No such lantern.' };
    const n = cleanName(name);
    if (!n.ok) return { ok: false, code: 'name', error: n.error };
    const next = { active: this.index.active, list: this.index.list.map((x) => (x.id === id ? { id, name: n.name } : x)) };
    if (!this._writeIndex(next)) return { ok: false, code: 'storage', error: 'Browser storage is full or blocked: the name was not saved.' };
    this.index = next;
    return { ok: true, name: n.name };
  }

  // Delete a lantern and its saves (the legacy pre-lanterns copy is never touched). The last lantern is replaced by a fresh one.
  remove(id) {
    this._refresh();
    if (this.locked || this.legacyMode) return { ok: false, code: 'locked', error: 'Lanterns cannot be changed right now.' };
    if (!this.has(id)) return { ok: false, code: 'unknown', error: 'No such lantern.' };
    let list = this.index.list.filter((x) => x.id !== id);
    if (!list.length) list = [{ id: 'l1', name: defaultName('l1') }];
    const next = { active: list.some((x) => x.id === this.index.active) ? this.index.active : list[0].id, list };
    if (!this._writeIndex(next)) return { ok: false, code: 'storage', error: 'Browser storage is blocked: nothing was deleted.' };
    const k = lanternKeys(id);
    this._del(k.save); this._del(k.backup); this._del(k.damaged);
    this.index = next;
    return { ok: true };
  }

  // Import a save file as a NEW lantern. Rolled back completely if it cannot be stored.
  importNew(text, name = '') {
    const p = parseSave(text);
    if (!p.ok) return p;
    const c = this.create(name);
    if (!c.ok) return c;
    const st = this.open(c.id);
    st.load();
    if (!st.applyImport(p.save)) {
      this.remove(c.id);
      return { ok: false, code: 'storage', error: 'Browser storage is full: the save was not imported.' };
    }
    return { ok: true, id: c.id };
  }

  // Replace a chosen lantern's save with an imported file (UI confirms first). The old save becomes its backup.
  importReplace(id, text) {
    this._refresh();
    if (this.locked) return { ok: false, code: 'locked', error: 'Lanterns cannot be changed right now.' };
    if (!this.legacyMode && !this.has(id)) return { ok: false, code: 'unknown', error: 'No such lantern.' };
    const p = parseSave(text);
    if (!p.ok) return p;
    const st = this.open(id);
    st.load();
    if (st.readOnly) return { ok: false, code: 'locked', error: 'This lantern is from a newer version; it is kept untouched.' };
    if (!st.applyImport(p.save)) return { ok: false, code: 'storage', error: 'Browser storage is full: the save was not imported.' };
    return { ok: true, id };
  }
}
