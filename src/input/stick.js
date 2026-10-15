// Pure floating-joystick maths + state. No DOM, no Phaser. All numbers are treated as untrusted:
// non-finite values are ignored, outputs are clamped to the unit disc. Output objects are reused (no per-call allocation).

export const STICK_SIZES = { small: 44, medium: 56, large: 72 }; // base radius in CSS px
export const STICK_DEADZONE = 0.12; // fraction of the radius

export const stickRadius = (name) => (typeof name === 'string' && Object.hasOwn(STICK_SIZES, name) ? STICK_SIZES[name] : STICK_SIZES.medium);
const fin = (v) => typeof v === 'number' && Number.isFinite(v);

// (dx, dy) = finger offset from the stick base in px. Writes {x, y} (|v| <= 1, deadzone removed and rescaled) into out.
export function stickVector(dx, dy, radius, deadzone, out) {
  out.x = 0;
  out.y = 0;
  if (!fin(dx) || !fin(dy) || !fin(radius) || radius < 1) return out;
  const dz = fin(deadzone) ? Math.min(0.9, Math.max(0, deadzone)) : STICK_DEADZONE;
  const dist = Math.hypot(dx, dy);
  if (!fin(dist) || dist <= 0) return out;
  const mag = Math.min(1, dist / radius);
  if (mag <= dz) return out;
  const k = (mag - dz) / (1 - dz) / dist; // unit direction * rescaled magnitude
  out.x = dx * k;
  out.y = dy * k;
  return out;
}

// One finger at a time, tracked by pointer id. Any other id is ignored until release/cancel.
export class Stick {
  constructor(radius = STICK_SIZES.medium, deadzone = STICK_DEADZONE) {
    this.radius = radius;
    this.deadzone = deadzone;
    this.id = null;
    this.ox = 0; this.oy = 0; // base (touch-down point)
    this.px = 0; this.py = 0; // clamped finger position (for drawing)
    this.x = 0; this.y = 0; // output
  }

  setRadius(r) { if (fin(r)) this.radius = Math.min(200, Math.max(16, r)); }
  get active() { return this.id !== null; }

  down(id, x, y) {
    if (this.id !== null || !fin(x) || !fin(y)) return false;
    this.id = id;
    this.ox = x; this.oy = y; this.px = x; this.py = y;
    this.x = 0; this.y = 0;
    return true;
  }

  move(id, x, y) {
    if (this.id === null || id !== this.id || !fin(x) || !fin(y)) return false;
    const dx = x - this.ox;
    const dy = y - this.oy;
    stickVector(dx, dy, this.radius, this.deadzone, this);
    const d = Math.hypot(dx, dy);
    const s = d > this.radius ? this.radius / d : 1;
    this.px = this.ox + dx * s;
    this.py = this.oy + dy * s;
    return true;
  }

  up(id) { if (this.id === null || id !== this.id) return false; this.cancel(); return true; }

  // Release everything (pointercancel, blur, hidden tab, orientation change, state change).
  cancel() {
    this.id = null;
    this.x = 0; this.y = 0;
    this.px = this.ox; this.py = this.oy;
  }
}

// Decide whether touch controls show. mode: 'auto'|'on'|'off' (setting); param: '1'|'0'|null (URL, session only).
export function touchEnabled(mode, param, coarse, hasTouch) {
  if (param === '1') return true;
  if (param === '0') return false;
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  return !!(coarse || hasTouch);
}

export const parseTouchParam = (v) => (v === '1' || v === '0' ? v : null);
