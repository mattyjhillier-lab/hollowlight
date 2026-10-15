// Fullscreen API wrapper. Feature-detected; enter() must be called from a user gesture (click/tap).
// doc is injected so this is testable without a browser.

const reqName = (el) => (el.requestFullscreen ? 'requestFullscreen' : el.webkitRequestFullscreen ? 'webkitRequestFullscreen' : null);

export function isSupported(doc) {
  if (!doc || !doc.documentElement) return false;
  if (doc.fullscreenEnabled === false || (doc.fullscreenEnabled === undefined && doc.webkitFullscreenEnabled === false)) return false;
  return reqName(doc.documentElement) !== null;
}

export function isFullscreen(doc) {
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
}

function lockLandscape(win) {
  try {
    const o = win && win.screen && win.screen.orientation;
    if (o && typeof o.lock === 'function') { const p = o.lock('landscape'); if (p && p.catch) p.catch(() => {}); }
  } catch { /* unsupported (iOS) or refused: ignore */ }
}
function unlock(win) {
  try { const o = win && win.screen && win.screen.orientation; if (o && typeof o.unlock === 'function') o.unlock(); } catch { /* ignore */ }
}

export async function enter(doc, win) {
  if (!isSupported(doc)) return false;
  const el = doc.documentElement;
  try {
    const r = el[reqName(el)]({ navigationUI: 'hide' });
    if (r && r.then) await r;
    lockLandscape(win);
    return true;
  } catch { return false; }
}

export async function exit(doc, win) {
  try {
    const r = doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen ? doc.webkitExitFullscreen() : null;
    if (r && r.then) await r;
  } catch { /* ignore */ }
  unlock(win);
}

export function toggle(doc, win) {
  return isFullscreen(doc) ? exit(doc, win) : enter(doc, win);
}

// cb() runs on every fullscreen change; returns an unsubscribe function.
export function onChange(doc, cb) {
  doc.addEventListener('fullscreenchange', cb);
  doc.addEventListener('webkitfullscreenchange', cb);
  return () => { doc.removeEventListener('fullscreenchange', cb); doc.removeEventListener('webkitfullscreenchange', cb); };
}
