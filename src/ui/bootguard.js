// PWA-FIX: startup guard. If the title never appears (main.js never sends 'boot-done' within BOOT_LIMIT_MS of visible time),
// show a plain message with what the browser reports, a Try again button and a Repair button (drops the app's own service worker and
// 'hollowlight-' caches, never the saves). Loaded by entry.js before main.js so a failure inside main.js still shows.
// Everything is written with textContent; error text is clipped. No network calls, nothing stored.
export const BOOT_LIMIT_MS = 20000;
const CLIP = 240;

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
    `boot ${st.ready ? `ready ${st.readyMs} ms` : st.failed ? 'title failed' : `not ready after ${Math.round(st.visibleMs / 1000)} s visible`}  errors ${st.errors.length}`,
    `display-mode ${modes.join(',') || 'none'}  hidden ${!!doc.hidden}  inner ${win.innerWidth}x${win.innerHeight}  dpr ${win.devicePixelRatio}`,
    `service worker ${nav.serviceWorker ? (nav.serviceWorker.controller ? 'controlling' : 'not controlling') : 'n/a'}  version ${st.version || '?'}`,
    `ua ${errText(nav.userAgent || '')}`,
    ...st.errors.slice(0, 4).map((e) => `error: ${e}`),
  ];
}

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
  const st = { ready: false, readyMs: 0, visibleMs: 0, errors: [], version, shown: null };
  const t0 = Date.now();
  win.__boot = st;
  const onErr = (e) => { if (st.errors.length < 8) st.errors.push(errText(e && (e.error || e))); };
  win.addEventListener('error', onErr);
  win.addEventListener('unhandledrejection', (e) => onErr(e && e.reason !== undefined ? e.reason : e));
  // main.js sends 'boot-done' once the title (or auto-run) is up; with detail.error when showing it failed (then the message shows at once)
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
    btn('Copy details', () => { try { win.navigator.clipboard.writeText(pre.textContent); } catch { /* not allowed */ } });
    card.append(h, p, pre, row); box.appendChild(card);
    doc.body.appendChild(box);
    st.shown = box;
    win.setInterval(fill, 1000);
  };
  // count only visible time: a window that starts hidden/occluded has rAF paused and is not a failure yet
  const step = 500;
  const iv = win.setInterval(() => {
    if (st.ready) { win.clearInterval(iv); return; }
    if (!doc.hidden) st.visibleMs += step;
    if (st.visibleMs >= BOOT_LIMIT_MS) { win.clearInterval(iv); show(); }
  }, step);
  return st;
}
