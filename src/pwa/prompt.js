// Install / full-screen card state machine and dismissal storage. Pure JS, no DOM. Storage values are untrusted.
export const DISMISS_KEY = 'hollowlight.installCard.v1';
export const REPROMPT_MS = 14 * 24 * 3600 * 1000;
const MAX_RAW = 20;

// Stored value: plain epoch-ms integer as text. Anything else counts as "never dismissed".
// A time in the future (tampered or clock change) is clamped to now, so it can never hide the card for longer than 14 days.
export function parseDismissed(raw, now) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_RAW || !/^[0-9]+$/.test(raw)) return 0;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return 0;
  return Math.min(n, now);
}

export function readDismissed(storage, now) {
  try { return parseDismissed(storage.getItem(DISMISS_KEY), now); } catch { return 0; }
}

export function writeDismissed(storage, now) {
  try { storage.setItem(DISMISS_KEY, String(Math.floor(now))); return true; } catch { return false; }
}

// s: { installed (standalone/fullscreen now), appInstalled (appinstalled fired), canInstall (stashed beforeinstallprompt),
//      canFullscreen, iosSteps, dismissedAt, now }
export function canOffer(s) {
  return !!(s.canInstall || s.canFullscreen || s.iosSteps);
}

export function shouldShowCard(s) {
  if (s.installed || s.appInstalled) return false;
  if (!canOffer(s)) return false;
  if (!s.dismissedAt) return true;
  return s.now - s.dismissedAt >= REPROMPT_MS;
}

// The quiet footer link stays available (reopens the card) whenever there is something to offer.
export function showFooterLink(s) {
  return !s.installed && !s.appInstalled && canOffer(s);
}
