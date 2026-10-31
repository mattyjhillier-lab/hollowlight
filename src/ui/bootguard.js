// PWA-FIX: startup guard. If the title never appears (main.js never sends 'boot-done' within BOOT_LIMIT_MS), show a plain message
// with what the browser reports, a Try again button and a Repair button (drops the app's own service worker and 'hollowlight-'
// caches, never the saves). Loaded by entry.js before main.js so a failure inside main.js still shows.
// BLANK-FIX (2026-10-31): the panel counts wall-clock time (a window the OS reports as hidden used to wait for ever); one automatic
// repair per session when a service-worker-controlled page has not reached the game scene after AUTO_REPAIR_MS of visible time;
// 'Reset settings only' (keeps saves, drops settings + small UI flags) and a separate two-tap 'Reset everything'.
// Everything is written with textContent; error text is clipped. No network calls. Storage is touched only by the reset buttons
// and the once-per-session auto-repair flag (sessionStorage); the keys are fixed strings here, never built from stored text.
export const BOOT_LIMIT_MS = 20000;
export const AUTO_REPAIR_MS = 12000;
export const AUTO_FLAG = 'hollowlight:autorepair';
const CLIP = 240;
// fixed list: the legacy single save, the three lantern saves and their backups (src/save/store.js, src/save/lanterns.js)
export const SAVE_KEYS = Object.freeze(['hollowlight:save', 'hollowlight:save:backup', ...['l1', 'l2', 'l3'].flatMap((l) => ['hollowlight:lantern:' + l + ':save', 'hollowlight:lantern:' + l + ':save:backup'])]);
// small device-only flags that are safe to forget: pre-bake crash guard, tree pins / tip
export const FLAG_KEYS = Object.freeze(['hollowlight:pb', 'hollowlight:pb:ground', 'hollowlight:tree:pins', 'hollowlight:tree:tip']);
const SAVE_MAX = 2 * 1024 * 1024;

/** Pure: a short, safe one-line message from an error event / rejection reason. */
export function errText(x) {
  let s = '';
  try {
    if (x == null) s = 'unknown error';
    else if (typeof x === 'string') s = x;
    else if (x.message) s = String(x.message) + (x.filename ? ` @${String(x.filename).split('/').pop()}:${x.lineno || 0}` : '');
    else if (x.reason !== undefined) return errText(x.reason);
    else s = String(x);
  } catch { s = 'unreadable error'; }
  s = s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
  return s.length > CLIP ? s.slice(0, CLIP - 1) + '…' : s;
}

/** Pure: lines that describe the window, for the failure panel and ?probe=1. */
export function bootLines(win, st) {
  const mm = (q) => { try { return !!(win.matchMedia && win.matchMedia(q).matches); } catch { return false; } };
  const modes = ['fullscreen', 'standalone', 'minimal-ui', 'window-controls-overlay', 'browser'].filter((m) => mm(`(display-mode: ${m})`));
  const nav = win.navigator || {};
  const doc = win.document || {};
  return [
    `boot ${st.ready ? `ready ${st.readyMs} ms` : st.failed ? 'title failed' : `not ready after ${Math.round((st.wallMs || st.visibleMs) / 1000)} s (${Math.round(st.visibleMs / 1000)} s visible)`}  scene ${st.scene ? 'yes' : 'no'}  errors ${st.errors.length}${st.autoRepaired ? '  auto-repair tried' : ''}`,
    `display-mode ${modes.join(',') || 'none'}  hidden ${!!doc.hidden}  inner ${win.innerWidth}x${win.innerHeight}  dpr ${win.devicePixelRatio}`,
    `service worker ${nav.serviceWorker ? (nav.serviceWorker.controller ? 'controlling' : 'not controlling') : 'n/a'}  version ${st.version || '?'}`,
    `ua ${errText(nav.userAgent || '')}`,
    ...st.errors.slice(0, 4).map((e) => `error: ${e}`),
  ];
}

/** Remove 'settings' from every save (defaults come back on load: sanitize fills them) and drop the small flags.
 *  Progress (tree, gold, Almanac, heroes) is kept. Returns the number of saves changed. Never throws. */
export function resetSettingsOnly(store) {
  let n = 0;
  if (!store) return 0;
  for (const k of SAVE_KEYS) {
    try {
      const t = store.getItem(k);
      if (typeof t !== 'string' || t.length > SAVE_MAX) continue;
      const raw = JSON.parse(t);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Object.hasOwn(raw, 'settings')) continue;
      delete raw.settings;
      store.setItem(k, JSON.stringify(raw)); n++;
    } catch { /* unreadable: left for the save loader (it keeps a damaged copy) */ }
  }
  for (const k of FLAG_KEYS) { try { store.removeItem(k); } catch { /* keep going */ } }
  return n;
}

/** Remove every key this game owns ('hollowlight:' and 'hollowlight.' prefixes). Returns the count. Never throws. */
export function resetEverything(store) {
  if (!store) return 0;
  const keys = [];
  try { for (let i = 0; i < store.length; i++) { const k = store.key(i); if (typeof k === 'string' && (k.startsWith('hollowlight:') || k.startsWith('hollowlight.'))) keys.push(k); } } catch { /* keep what we found */ }
  for (const k of keys) { try { store.removeItem(k); } catch { /* keep going */ } }
  return keys.length;
}

const storeOf = (win, name) => { try { return win[name] || null; } catch { return null; } };
const controlled = (win) => { try { return !!(win.navigator && win.navigator.serviceWorker && win.navigator.serviceWorker.controller); } catch { return false; } };

/** Repair: unregister this app's service workers and delete its own caches, then reload. Saves are untouched. */
export async function repair(win) {
  try {
    const sw = win.navigator && win.navigator.serviceWorker;
    if (sw && sw.getRegistrations) for (const r of await sw.getRegistrations()) await r.unregister();
  } catch { /* keep going */ }
  try {
    if (win.caches) for (const k of await win.caches.keys()) if (k.startsWith('hollowlight-')) await win.caches.delete(k);
  } catch { /* keep going */ }
  win.location.reload();
}

export function installBootGuard(win = window, doc = document, version = '') {
  const st = { ready: false, readyMs: 0, visibleMs: 0, wallMs: 0, scene: false, autoRepaired: false, errors: [], version, shown: null };
  try { st.autoRepaired = storeOf(win, 'sessionStorage').getItem(AUTO_FLAG) === '1'; } catch { st.autoRepaired = true; } // no session storage: never auto-repair (no loop guard)
  const t0 = Date.now();
  win.__boot = st;
  const onErr = (e) => { if (st.errors.length < 8) st.errors.push(errText(e && (e.error || e))); };
  win.addEventListener('error', onErr);
  win.addEventListener('unhandledrejection', (e) => onErr(e && e.reason !== undefined ? e.reason : e));
  // main.js sends 'boot-done' once the title (or auto-run) is up; with detail.error when showing it failed (then the message shows at once)
  win.addEventListener('scene-ready', () => { st.scene = true; });
  win.addEventListener('boot-done', (e) => {
    const err = e && e.detail && e.detail.error;
    if (err) { onErr(err); st.failed = true; show(); return; }
    st.ready = true; st.readyMs = Date.now() - t0;
    if (st.shown) { st.shown.remove(); st.shown = null; }
  });
  const show = () => {
    if (st.ready || st.shown || !doc.body) return;
    const box = doc.createElement('div');
    box.id = 'bootfail';
    box.setAttribute('role', 'alert');
    box.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;background:#0b101c;color:#f3e6c8;font:15px/1.45 system-ui,sans-serif';
    const card = doc.createElement('div');
    card.style.cssText = 'max-width:640px;width:100%;max-height:100%;overflow:auto';
    const h = doc.createElement('h1'); h.textContent = 'Wispwick did not start'; h.style.cssText = 'font-size:22px;margin:0 0 8px';
    const p = doc.createElement('p'); p.style.margin = '0 0 12px';
    p.textContent = 'Try again first. If it stays blank, Repair clears the stored copy of the game (your saves are kept) and loads it fresh.';
    const pre = doc.createElement('pre'); pre.style.cssText = 'white-space:pre-wrap;font:12px/1.4 ui-monospace,Consolas,monospace;background:#0006;padding:8px;border-radius:6px;margin:0 0 12px';
    const fill = () => { pre.textContent = bootLines(win, st).join('\n'); };
    fill();
    const row = doc.createElement('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    const btn = (label, fn) => { const b = doc.createElement('button'); b.type = 'button'; b.textContent = label; b.style.cssText = 'font:inherit;padding:8px 14px;border-radius:8px;border:1px solid #c9a35a;background:#2a2116;color:#f3e6c8;cursor:pointer'; b.addEventListener('click', fn); row.appendChild(b); return b; };
    btn('Try again', () => win.location.reload());
    btn('Repair and reload', () => { repair(win); });
    btn('Reset settings only (keeps saves)', () => { resetSettingsOnly(storeOf(win, 'localStorage')); repair(win); });
    let armed = 0;
    const all = btn('Reset everything', () => {
      if (Date.now() - armed > 6000) { armed = Date.now(); all.textContent = 'Tap again: erases ALL saves on this device'; return; }
      resetEverything(storeOf(win, 'localStorage')); resetEverything(storeOf(win, 'sessionStorage')); repair(win);
    });
    all.style.borderColor = '#c25a4a';
    btn('Copy details', () => { try { win.navigator.clipboard.writeText(pre.textContent); } catch { /* not allowed */ } });
    card.append(h, p, pre, row); box.appendChild(card);
    doc.body.appendChild(box);
    st.shown = box;
    win.setInterval(fill, 1000);
  };
  // The panel follows wall-clock time (BLANK-FIX: an occluded/hidden window stopped the old visible-only count, so nothing ever
  // showed; a late boot-done still removes it). The automatic repair follows visible time (a hidden window is slow, not broken).
  const step = 500;
  const iv = win.setInterval(() => {
    if (st.ready) { win.clearInterval(iv); return; }
    st.wallMs += step;
    if (!doc.hidden) st.visibleMs += step;
    if (!st.scene && !st.autoRepaired && st.visibleMs >= AUTO_REPAIR_MS && controlled(win)) {
      st.autoRepaired = true;
      try { storeOf(win, 'sessionStorage').setItem(AUTO_FLAG, '1'); repair(win); } catch { /* no flag, no auto-repair */ }
      return;
    }
    if (st.wallMs >= BOOT_LIMIT_MS) { win.clearInterval(iv); show(); }
  }, step);
  return st;
}
