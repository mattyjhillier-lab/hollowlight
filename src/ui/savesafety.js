// A1 SAVE SAFETY UI: the gentle backup reminder on the title screen and the 'damaged copy' download. Kit DOM only (textContent, never
// innerHTML); the copy is fixed text, nothing read from a save becomes markup.
import { el, button } from './kit.js';

export const SAFE = Object.freeze({
  nudgeTitle: 'Keep a backup',
  nudgeLong: 'Your progress lives in this browser only. Keep a backup file in case it is cleared.',
  nudgeExport: 'Export a backup',
  nudgeLater: 'Not now',
  nudgeDone: 'Backup saved. The reminder is quiet for a while.',
  nudgeFail: 'Could not export the save. Settings > Saves has the Export button.',
  reminder: { label: 'Backup reminder', help: 'Now and then the title screen offers to export a backup file' },
  damaged: { label: 'Download damaged copy', whisper: 'The file that could not be read' },
  damagedDone: 'Damaged copy downloaded. It may still be repairable; keep it safe.',
  file: 'wispwick-save.json',
  damagedFile: 'wispwick-damaged-save.txt',
});

/** Save text to a file download. Returns true on success (never throws). */
export function downloadText(text, name, type = 'application/json') {
  try {
    const d = globalThis.document;
    const url = URL.createObjectURL(new Blob([String(text)], { type }));
    const a = d.createElement('a');
    a.href = url; a.download = name;
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch { return false; }
}

/** The title-screen reminder, in the install card's look (.pwa-card / .btn, styled by title.css): a short line + Export / Not now.
 *  Both close it (the caller restarts the count). */
export function buildNudge({ onExport, onLater } = {}) {
  const box = el('div', 'pwa-card a1-nudge', null, { role: 'group', 'aria-label': 'Backup reminder' });
  const line = el('div', 'pwa-text a1-nudge__t', SAFE.nudgeLong);
  const row = el('div', 'pwa-row');
  const close = (t) => { row.replaceChildren(); line.textContent = t; line.setAttribute('role', 'status'); };
  const ex = el('button', 'btn', SAFE.nudgeExport, { type: 'button' });
  ex.addEventListener('click', () => { const ok = onExport ? onExport() : false; close(ok ? SAFE.nudgeDone : SAFE.nudgeFail); });
  const later = el('button', 'btn pwa-no', SAFE.nudgeLater, { type: 'button' });
  later.addEventListener('click', () => { if (onLater) onLater(); box.remove(); });
  row.appendChild(ex); row.appendChild(later);
  box.appendChild(line); box.appendChild(row);
  return { root: box, export: ex, later };
}
