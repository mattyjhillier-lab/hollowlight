// Pre-bake crash guard, per mode ('full' / 'ground'). Pure + injectable (store, clock, build) so it is Node-testable. Render-side only; one small localStorage key per mode.
// Record: { s: 'ok' | 'run' | 'off', n: consecutive unfinished starts, t: ms of the last change, v: build version }.
//  - a bake START sets 'run' (n+1); a bake that FINISHES sets 'ok' (n 0).
//  - found 'run' at boot with n >= 2 (two unfinished starts in a row) -> 'off'. One unfinished start alone never switches a mode off (a closed tab, an iOS suspend, a reload).
//  - backgrounding (pagehide / hidden) while baking clears 'run' (a tab that is only being put away is not a crash); only a hard kill in the foreground leaves it.
//  - 'off' expires after 24 h or when the build version changes, then the mode is tried again.
//  - the legacy plain-string values ('ok' / 'run' / 'off') are read as records ('off' with no time = expired).
export const OFF_MS = 24 * 3600 * 1000;
const keyOf = (mode) => (mode === 'ground' ? 'hollowlight:pb:ground' : 'hollowlight:pb');

export const browserStore = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: ignore */ } },
};
const BUILD = typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__).slice(0, 24) : 'dev';

export function readGuard(mode, store = browserStore) {
  const raw = store.get(keyOf(mode));
  if (!raw) return { s: 'ok', n: 0, t: 0, v: '' };
  if (raw === 'ok' || raw === 'run' || raw === 'off') return { s: raw, n: raw === 'run' ? 1 : 0, t: 0, v: '' };
  try {
    const o = JSON.parse(raw);
    const s = o && (o.s === 'run' || o.s === 'off') ? o.s : 'ok';
    return { s, n: Math.max(0, Math.min(9, Number(o && o.n) | 0)), t: Number(o && o.t) || 0, v: typeof (o && o.v) === 'string' ? o.v.slice(0, 24) : '' };
  } catch (e) { return { s: 'ok', n: 0, t: 0, v: '' }; }
}
const write = (mode, rec, store) => store.set(keyOf(mode), JSON.stringify(rec));

/** May this mode run? (applies the 2-strikes rule and the 'off' expiry) */
export function guardAllowed(mode, { force = false, store = browserStore, now = Date.now(), build = BUILD } = {}) {
  if (force) { write(mode, { s: 'ok', n: 0, t: now, v: build }, store); return true; }
  const r = readGuard(mode, store);
  if (r.s === 'off') {
    if (now - r.t < OFF_MS && r.v === build) return false;
    write(mode, { s: 'ok', n: 0, t: now, v: build }, store); return true; // expired, or a new build: try again
  }
  if (r.s === 'run' && r.n >= 2) { write(mode, { s: 'off', n: r.n, t: now, v: build }, store); return false; }
  return true;
}
export function guardStart(mode, { store = browserStore, now = Date.now(), build = BUILD } = {}) {
  const r = readGuard(mode, store);
  write(mode, { s: 'run', n: r.s === 'run' ? r.n + 1 : 1, t: now, v: build }, store);
}
export function guardDone(mode, { store = browserStore, now = Date.now(), build = BUILD } = {}) { write(mode, { s: 'ok', n: 0, t: now, v: build }, store); }
/** The page is only being backgrounded / put away: undo this start so it is not counted as a crash. */
export function guardPause(mode, { store = browserStore, now = Date.now(), build = BUILD } = {}) {
  const r = readGuard(mode, store);
  if (r.s === 'run') write(mode, { s: r.n > 1 ? 'run' : 'ok', n: Math.max(0, r.n - 1), t: now, v: build }, store);
}
export const guardLabel = (mode, store = browserStore) => readGuard(mode, store).s;
