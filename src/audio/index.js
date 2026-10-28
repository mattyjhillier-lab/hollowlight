// AU0 wiring: unlock on the first user gesture (and resume after any later suspend), quiet when the tab is hidden or the
// window loses focus, M toggles mute (not while typing a lantern name). win/doc are injected so this is Node-testable.
import { AudioEngine } from './engine.js';
import { actionOf } from '../input/keymap.js';

const GESTURES = ['pointerdown', 'keydown', 'touchend'];

/** M (no modifiers, not repeating, not typing in a text field) = toggle mute. */
export function isMuteKey(e) {
  if (!e || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return false;
  if (actionOf(e) !== 'mute') return false; // A3: the Mute key from Settings > Controls (default M)
  const t = e.target, tag = t && typeof t.tagName === 'string' ? t.tagName.toUpperCase() : '';
  return !(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable));
}

/** opts: { onMute(next: boolean) } - persists the new mute state (app.js -> save settings). */
export function createAudio(win, doc, opts = {}) {
  const eng = new AudioEngine(win);
  const onGesture = (e) => {
    if (e && e.type === 'keydown' && e.key === 'Escape') return; // Esc is not a user activation in Chrome
    if (!eng.ctx || eng.ctx.state !== 'running') eng.unlock();
  };
  for (const g of GESTURES) win.addEventListener(g, onGesture, { capture: true, passive: true });
  let focused = true;
  const vis = () => eng.setHidden(!!doc.hidden || !focused);
  doc.addEventListener('visibilitychange', vis);
  win.addEventListener('blur', () => { focused = false; vis(); });
  win.addEventListener('focus', () => { focused = true; vis(); });
  win.addEventListener('keydown', (e) => {
    if (!isMuteKey(e)) return;
    const next = !eng.set.muted;
    if (opts.onMute) opts.onMute(next); else { eng.set = { ...eng.set, muted: next }; eng.apply(); }
  });
  try { const s = win.navigator && win.navigator.audioSession; if (s && 'type' in s) s.type = 'playback'; } catch { /* iOS only */ }
  return eng;
}
