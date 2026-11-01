// A1 SAVE SAFETY: the gentle 'export a backup' reminder. Pure JS, no DOM. Saves live in one browser only, so once in a while
// (never early, never twice in a session, never while the save is read-only) the title screen offers a one-tap export.
// Count: NUDGE.runs finished runs since the last export / 'Not now', AND at least NUDGE.days days since then. Off in Settings > Saves.
export const NUDGE = Object.freeze({ runs: 8, days: 7, minRuns: 5 });
const DAY = 86400000;

export function shouldNudge(save, { now = Date.now(), readOnly = false, shown = false } = {}) {
  if (readOnly || shown || !save || typeof save !== 'object') return false;
  const st = save.settings && typeof save.settings === 'object' ? save.settings : {};
  if (st.backupNudge === false) return false;
  const runs = save.stats && Number.isFinite(save.stats.runs) ? save.stats.runs : 0;
  if (runs < NUDGE.minRuns) return false;
  const b = save.notes && save.notes.backup && typeof save.notes.backup === 'object' ? save.notes.backup : { r: 0, t: 0 };
  const r = Number.isFinite(b.r) ? b.r : 0;
  const t = Number.isFinite(b.t) && b.t <= now ? b.t : 0; // a clock that went backwards never blocks the reminder forever
  return runs - r >= NUDGE.runs && now - t >= NUDGE.days * DAY;
}
