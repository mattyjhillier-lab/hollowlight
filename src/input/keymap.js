// A3 KEY REMAP: keyboard controls as data (pure JS, no DOM). Physical keys (KeyboardEvent.code), so WASD stays WASD on any layout.
// Stored per device in settings.keys (src/save/schema.js runs cleanKeymap on every load / import: untrusted input). Two keys per action;
// Esc always pauses (every menu uses Esc for Back, so it cannot be taken away); a second pause key can be added.
export const ACTIONS = Object.freeze(['up', 'down', 'left', 'right', 'ability', 'pause', 'pick1', 'pick2', 'pick3', 'pick4', 'pick5', 'pick6', 'reroll', 'banish', 'mute', 'fullscreen']);
export const SLOTS = 2;
export const ACTION_LABEL = Object.freeze({
  up: 'Move up', down: 'Move down', left: 'Move left', right: 'Move right', ability: 'Ability', pause: 'Pause',
  pick1: 'Pick card 1', pick2: 'Pick card 2', pick3: 'Pick card 3', pick4: 'Pick card 4', pick5: 'Pick card 5', pick6: 'Pick card 6',
  reroll: 'Reroll', banish: 'Banish', mute: 'Mute', fullscreen: 'Full screen (menus)',
});
export const DEFAULT_KEYS = Object.freeze({
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  ability: ['Space', null], pause: ['Escape', null],
  pick1: ['Digit1', 'Numpad1'], pick2: ['Digit2', 'Numpad2'], pick3: ['Digit3', 'Numpad3'], pick4: ['Digit4', 'Numpad4'], pick5: ['Digit5', 'Numpad5'], pick6: ['Digit6', 'Numpad6'],
  reroll: ['KeyR', null], banish: ['KeyB', null], mute: ['KeyM', null], fullscreen: ['KeyF', null],
});
export const FIXED = Object.freeze({ pause: 'Escape' }); // slot 0, never remapped
export const MOVES = Object.freeze({ up: 'u', down: 'd', left: 'l', right: 'r' });

// Keys a player may bind. Not allowed: Escape (fixed to pause), Tab / Enter (menus), modifiers that browsers or the OS use (Ctrl, Alt,
// Meta, OS), function keys (F5 reload, F11 full screen), and anything not on this list.
const ALLOWED = /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Numpad(Add|Subtract|Multiply|Divide|Decimal)|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Backspace|Delete|Insert|Home|End|PageUp|PageDown|IntlBackslash)$/;
export const allowedCode = (c) => typeof c === 'string' && c.length <= 20 && ALLOWED.test(c);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function defaultKeymap() { const o = {}; for (const a of ACTIONS) o[a] = [...DEFAULT_KEYS[a]]; return o; }

/** Validate an untrusted keymap: known actions only, allowed codes only, 2 slots, no key on two actions, Esc fixed on pause.
 *  A missing / bad action falls back to its defaults where those keys are still free. Always returns a complete fresh map. */
export function cleanKeymap(raw) {
  const out = {};
  const used = new Set(['Escape']);
  const src = isObj(raw) ? raw : {};
  const take = (c) => { if (!allowedCode(c) || used.has(c)) return null; used.add(c); return c; };
  const given = (a) => Object.hasOwn(src, a) && Array.isArray(src[a]) && src[a].length <= 8;
  for (const a of ACTIONS) { // first pass: the player's own keys
    const slots = [null, null];
    if (given(a)) for (let i = 0; i < SLOTS; i++) { if (a in FIXED && i === 0) continue; slots[i] = take(src[a][i]); }
    out[a] = slots;
  }
  for (const a of ACTIONS) { // second pass: an action the save did not describe gets its defaults (if still free)
    if (a in FIXED) out[a][0] = FIXED[a];
    if (given(a) && (a in FIXED || out[a][0] || out[a][1])) continue; // an action given with no usable key gets its defaults
    for (let i = 0; i < SLOTS; i++) if (!(a in FIXED && i === 0) && out[a][i] === null) out[a][i] = take(DEFAULT_KEYS[a][i]);
  }
  return out;
}

export const isDefault = (map) => ACTIONS.every((a) => map[a][0] === DEFAULT_KEYS[a][0] && map[a][1] === DEFAULT_KEYS[a][1]);

/** Bind `code` to action slot. A key already used elsewhere is SWAPPED: the other action gets this slot's old key (or nothing).
 *  -> { ok, map, swapped: {action, code}|null, emptied: action|null, error } ; never mutates the input. */
export function assignKey(map, action, slot, code) {
  const m = cleanKeymap(map);
  if (!ACTIONS.includes(action) || !(slot === 0 || slot === 1)) return { ok: false, map: m, error: 'Unknown control.' };
  if (action in FIXED && slot === 0) return { ok: false, map: m, error: 'Esc always pauses; add a second key instead.' };
  if (code === 'Escape') return { ok: false, map: m, error: 'Esc is kept for Pause and Back.' };
  if (!allowedCode(code)) return { ok: false, map: m, error: 'That key cannot be used. Try a letter, number, arrow or Space.' };
  const old = m[action][slot];
  if (old === code) return { ok: true, map: m, swapped: null, emptied: null };
  let swapped = null; let emptied = null;
  for (const a of ACTIONS) for (let i = 0; i < SLOTS; i++) {
    if (m[a][i] !== code || (a === action && i === slot)) continue;
    m[a][i] = old; // swap (within the same action the two slots trade places)
    if (a !== action) { swapped = { action: a, code: old }; if (!m[a][0] && !m[a][1]) emptied = a; }
  }
  m[action][slot] = code;
  return { ok: true, map: cleanKeymap(m), swapped, emptied };
}

/** Clear a slot (the second slot, or the first when the second still holds a key). Esc on pause cannot be cleared. */
export function clearKey(map, action, slot) {
  const m = cleanKeymap(map);
  if (!ACTIONS.includes(action) || !(slot === 0 || slot === 1) || (action in FIXED && slot === 0)) return { ok: false, map: m };
  if (slot === 0 && !m[action][1]) return { ok: false, map: m, error: 'Every control keeps at least one key.' };
  m[action][slot] = null;
  if (slot === 0) { m[action][0] = m[action][1]; m[action][1] = null; }
  return { ok: true, map: cleanKeymap(m) };
}

// e.code, or (old browsers / synthetic events with no code) a code derived from e.key for the plain keys.
export function codeOf(e) {
  if (!e) return '';
  if (typeof e.code === 'string' && e.code) return e.code;
  const k = typeof e.key === 'string' ? e.key : '';
  if (/^[a-z]$/i.test(k)) return `Key${k.toUpperCase()}`;
  if (/^[0-9]$/.test(k)) return `Digit${k}`;
  if (k === ' ' || k === 'Spacebar') return 'Space';
  if (k === 'Esc' || k === 'Escape') return 'Escape';
  const arrows = { ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown', Left: 'ArrowLeft', Right: 'ArrowRight' };
  return Object.hasOwn(arrows, k) ? arrows[k] : '';
}

/** code -> action index for a (clean) map. */
export function indexOf(map) { const ix = new Map(); for (const a of ACTIONS) for (const c of map[a]) if (c) ix.set(c, a); return ix; }

/** Movement codes -> 'u' | 'd' | 'l' | 'r' (for src/input/keys.js HeldKeys). */
export function dirMap(map) { const o = {}; for (const [a, d] of Object.entries(MOVES)) for (const c of map[a]) if (c) o[c] = d; return o; }

const NAMED = { Space: 'Space', Escape: 'Esc', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', ShiftLeft: 'Shift', ShiftRight: 'Right Shift',
  Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
  Backspace: 'Backspace', Delete: 'Delete', Insert: 'Insert', Home: 'Home', End: 'End', PageUp: 'Page Up', PageDown: 'Page Down', IntlBackslash: '\\',
  NumpadAdd: 'Num +', NumpadSubtract: 'Num -', NumpadMultiply: 'Num *', NumpadDivide: 'Num /', NumpadDecimal: 'Num .' };
/** Short readable name of a code (shown in hints and Settings). */
export function keyName(code) {
  if (!code || typeof code !== 'string') return '';
  if (Object.hasOwn(NAMED, code)) return NAMED[code];
  let m = code.match(/^Key([A-Z])$/); if (m) return m[1];
  m = code.match(/^Digit([0-9])$/); if (m) return m[1];
  m = code.match(/^Numpad([0-9])$/); if (m) return `Num ${m[1]}`;
  return '';
}

// ---- the keymap in use on this device (set by app.applySettings), so hints anywhere read the live keys without plumbing
let ACTIVE = defaultKeymap();
let IX = indexOf(ACTIVE);
export function setActiveKeymap(map) { ACTIVE = cleanKeymap(map); IX = indexOf(ACTIVE); return ACTIVE; }
export const activeKeymap = () => ACTIVE;
/** The action a key event triggers with the live keymap, or null. Ctrl / Alt / Meta combos never trigger a game action. */
export function actionOf(e) { if (!e || e.ctrlKey || e.altKey || e.metaKey) return null; return IX.get(codeOf(e)) || null; }
/** First key name of an action (for hints), e.g. 'Space', 'R', '1'; '' when the action has no key. */
export function keyLabel(action, map = ACTIVE) { const s = map[action]; if (!s) return ''; return keyName(s[0] || s[1]); }
