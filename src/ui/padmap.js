// FD6 controller stub (front-door-v1.md section 9): menus only, no run movement. D-pad / left stick = arrows, A = Enter, B = Esc,
// Y = Tree (T), LB / RB = previous / next night (PageUp / PageDown). Pure: reads a pad snapshot, returns key names. The app turns them
// into clicks / key events while no run is being played. Standard-mapping buttons only; anything else is ignored.
export const PAD_KEYS = Object.freeze({ 0: 'Enter', 1: 'Escape', 3: 't', 4: 'PageUp', 5: 'PageDown', 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight' });
export const STICK_DEAD = 0.55;
export const REPEAT_FIRST = 0.4, REPEAT_NEXT = 0.12; // seconds; arrows repeat while held, other buttons fire once per press
const REPEATS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** Which keys a pad snapshot holds right now: [{key}] (buttons array of {pressed}|number, axes array). Hostile shapes yield []. */
export function heldKeys(pad) {
  const out = new Set();
  if (!pad || typeof pad !== 'object' || pad.mapping !== 'standard') return [];
  const b = Array.isArray(pad.buttons) ? pad.buttons : [];
  for (const i of Object.keys(PAD_KEYS)) {
    const x = b[i];
    if (x && (x === true || x.pressed === true || (typeof x.value === 'number' && x.value > 0.7))) out.add(PAD_KEYS[i]);
  }
  const ax = Array.isArray(pad.axes) ? pad.axes : [];
  const x = Number(ax[0]), y = Number(ax[1]);
  if (Number.isFinite(x) && Math.abs(x) > STICK_DEAD && Math.abs(x) >= Math.abs(Number.isFinite(y) ? y : 0)) out.add(x < 0 ? 'ArrowLeft' : 'ArrowRight');
  else if (Number.isFinite(y) && Math.abs(y) > STICK_DEAD) out.add(y < 0 ? 'ArrowUp' : 'ArrowDown');
  return [...out];
}

/** Edge detector with arrow repeat. step(pads, dt) -> keys to fire this frame. */
export function createPad() {
  const held = new Map(); // key -> seconds until the next repeat (or Infinity for once-only keys)
  return {
    step(pads, dt) {
      const now = new Set();
      for (const p of Array.isArray(pads) ? pads : []) for (const k of heldKeys(p)) now.add(k);
      const fire = [];
      for (const k of now) {
        if (!held.has(k)) { fire.push(k); held.set(k, REPEATS.has(k) ? REPEAT_FIRST : Infinity); continue; }
        const left = held.get(k) - (Number.isFinite(dt) ? dt : 0);
        if (left <= 0) { fire.push(k); held.set(k, REPEAT_NEXT); } else held.set(k, left);
      }
      for (const k of [...held.keys()]) if (!now.has(k)) held.delete(k);
      return fire;
    },
    reset() { held.clear(); },
  };
}
