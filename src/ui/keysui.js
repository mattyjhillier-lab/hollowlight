// A3 KEY REMAP UI (Settings > Controls > Keyboard). Kit DOM only (createElement + textContent; key names come from a fixed table in
// src/input/keymap.js, never from the event or the save). Click a key button, press the new key: Esc cancels, Backspace clears the
// second key. A key already in use is swapped and the line says so. 'Reset keys' restores WASD / arrows, Space, Esc, 1-6, R, B, M.
import { el, button } from './kit.js';
import { ACTIONS, ACTION_LABEL, FIXED, SLOTS, assignKey, clearKey, cleanKeymap, defaultKeymap, isDefault, keyName, codeOf } from '../input/keymap.js';

export const KEYS_COPY = Object.freeze({
  title: 'Keyboard',
  help: 'Choose a key, then press the new one. Esc cancels; Backspace clears a second key. A key already in use swaps places.',
  waiting: 'Press a key…',
  none: '—',
  reset: 'Reset keys',
  resetDone: 'Keys reset to WASD / arrows, Space, Esc, 1 to 6, R, B and M.',
  set: (a, k) => `${ACTION_LABEL[a]}: ${k}.`,
  swapped: (a, k, o, ok) => `${ACTION_LABEL[a]}: ${k}. ${ACTION_LABEL[o]} now uses ${ok || 'no key'}.`,
  emptied: (o) => ` ${ACTION_LABEL[o]} has no key now: give it one.`,
  cleared: (a) => `${ACTION_LABEL[a]}: second key cleared.`,
  cancelled: 'No change.',
  escFixed: 'Esc always pauses',
});

/** keys: the current (untrusted) map; onChange(cleanMap) persists it. win: event target for the one-shot capture (default window). */
export function buildKeyRemap({ keys, onChange, win = globalThis.window } = {}) {
  let map = cleanKeymap(keys);
  const root = el('div', 'a3-keys', null, { role: 'group', 'aria-label': KEYS_COPY.title });
  const msg = el('p', 'a3-keys__msg u4-row__help', '', { role: 'status', 'aria-live': 'polite' });
  const list = el('div', 'a3-keys__list');
  const btns = {};
  let waiting = null; // { action, slot, btn, off }
  const say = (t) => { msg.textContent = t; };
  const label = (a, i) => keyName(map[a][i]) || KEYS_COPY.none;
  const paint = () => {
    for (const a of ACTIONS) for (let i = 0; i < SLOTS; i++) {
      const b = btns[a][i];
      const fixed = a in FIXED && i === 0;
      b.textContent = label(a, i);
      b.setAttribute('aria-label', `${ACTION_LABEL[a]}, key ${i + 1}: ${keyName(map[a][i]) || 'none'}${fixed ? `. ${KEYS_COPY.escFixed}` : '. Press to change'}`);
    }
    if (reset) reset.disabled = isDefault(map);
  };
  const stop = (restore = true) => {
    if (!waiting) return;
    const w = waiting; waiting = null;
    w.off();
    w.btn.classList.remove('is-waiting');
    w.btn.setAttribute('aria-pressed', 'false');
    if (restore) paint();
  };
  const commit = (next, line) => { map = cleanKeymap(next); paint(); say(line); if (onChange) onChange(cleanKeymap(map)); };
  const listen = (action, slot, btn) => {
    stop();
    btn.textContent = KEYS_COPY.waiting;
    btn.classList.add('is-waiting');
    btn.setAttribute('aria-pressed', 'true');
    say(`${ACTION_LABEL[action]}: ${KEYS_COPY.waiting} ${KEYS_COPY.help.split('. ')[1]}`);
    const onKey = (e) => {
      if (e.repeat) return;
      if (!['ShiftLeft', 'ShiftRight'].includes(e.code) && (e.ctrlKey || e.altKey || e.metaKey)) return; // Ctrl / Alt / Meta (alone or a browser shortcut): keep waiting, untouched
      if (e.preventDefault) e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation(); else if (e.stopPropagation) e.stopPropagation();
      const code = codeOf(e);
      if (code === 'Escape' || code === 'Tab') { stop(); say(KEYS_COPY.cancelled); if (btn.focus) btn.focus(); return; }
      if (code === 'Backspace' || code === 'Delete') {
        stop(false);
        const r = clearKey(map, action, slot);
        if (r.ok) commit(r.map, KEYS_COPY.cleared(action)); else { paint(); say(r.error || KEYS_COPY.cancelled); }
        if (btn.focus) btn.focus();
        return;
      }
      stop(false);
      const r = assignKey(map, action, slot, code);
      if (!r.ok) { paint(); say(r.error); } else {
        const k = keyName(code);
        let line = r.swapped ? KEYS_COPY.swapped(action, k, r.swapped.action, keyName(r.swapped.code)) : KEYS_COPY.set(action, k);
        if (r.emptied) line += KEYS_COPY.emptied(r.emptied);
        commit(r.map, line);
      }
      if (btn.focus) btn.focus();
    };
    const blur = () => { stop(); };
    win.addEventListener('keydown', onKey, true);
    win.addEventListener('blur', blur);
    waiting = { action, slot, btn, off: () => { win.removeEventListener('keydown', onKey, true); win.removeEventListener('blur', blur); } };
  };
  for (const a of ACTIONS) {
    const row = el('div', 'a3-keys__row');
    const name = el('span', 'a3-keys__name', ACTION_LABEL[a]);
    btns[a] = [];
    row.appendChild(name);
    for (let i = 0; i < SLOTS; i++) {
      const b = el('button', 'a3-key', '', { type: 'button', 'aria-pressed': 'false' });
      if (a in FIXED && i === 0) { b.disabled = true; b.setAttribute('title', KEYS_COPY.escFixed); }
      else b.addEventListener('click', () => { if (waiting && waiting.btn === b) { stop(); say(KEYS_COPY.cancelled); } else listen(a, i, b); });
      btns[a].push(b);
      row.appendChild(b);
    }
    list.appendChild(row);
  }
  const reset = button({ label: KEYS_COPY.reset, variant: 'secondary', inline: true, onClick: () => { stop(false); commit(defaultKeymap(), KEYS_COPY.resetDone); } });
  root.appendChild(el('span', 'u4-row__label', KEYS_COPY.title));
  root.appendChild(el('span', 'u4-row__help', KEYS_COPY.help));
  root.appendChild(list);
  root.appendChild(reset);
  root.appendChild(msg);
  paint();
  return { root, buttons: btns, reset, msg, stop, map: () => cleanKeymap(map) };
}
