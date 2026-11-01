// DR1: hero hit feedback state machine (pure JS, no Phaser/DOM, unit-testable). Display only: it is fed the sim's 'hurt' event
// (attacker id, kind, position) and the render dt, and answers "how strong is each cue right now". Real-time (render dt), never sim time,
// so the cues keep running through hit-stop. No allocation per call; every incoming number is validated.
// Cues (docs/design/damage-readability-v1.md, LOCKED 2026-10-20): the hero's own outline in light red ABOVE the crowd (RIM s), the attacker
// lifted above the crowd with an outline (LIFT s), a short crescent on the hero's side facing it (ARC s). Under Calm motion nothing moves:
// the same cues run as a plain fade (none of them move anything; the squash/lean is in rigmath).
export const HIT_RIM = 0.25; // hero outline in light red, seconds
export const HIT_LIFT = 0.3; // attacker lifted + outlined
export const HIT_ARC = 0.3; // contact crescent
export const HIT_RED = 0xff8078; // damage TAKEN (LOCKED colour rule)
export const LIFT_Z = 8500; // attacker depth above the crowd AND above the must-react band (D_LIT + this); the hero outline stack sits above it (crowdread.js DEPTH_*)
export const KINDS = ['contact', 'lunge', 'charge', 'slam', 'burst', 'thorn', 'ember']; // ember = DT2 Emberwake ring (id = the ring, not a foe)

const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);

export class HitFx {
  constructor() {
    this.t = 9; // seconds since the last hit (9 = none)
    this.kind = 'contact';
    this.src = '';
    this.id = -1;
    this.ax = 0; this.ay = 0; // attacker position when it hit (thorn: where the thorn struck)
    this.dx = 0; this.dy = 0; // thorn travel direction (not unit)
    this.px = 0; this.py = 0; // hero position when it hit
    this.amt = 0;
    this.shooter = false; // thorn: the Piper that shot it is still alive (ax/ay = its position)
    this.count = 0; // hits seen (readout / tests)
  }

  reset() { this.t = 9; this.id = -1; this.count = 0; }

  // ev = the sim 'hurt' event ({ src, kind, id, amt, x, y, dx, dy }); px/py = hero position now. Unknown kinds fall back to 'contact'.
  trigger(ev, px, py) {
    const e = ev || {};
    this.t = 0;
    this.kind = KINDS.includes(e.kind) ? e.kind : 'contact';
    this.src = typeof e.src === 'string' ? e.src.slice(0, 32) : '';
    this.id = Number.isFinite(e.id) ? e.id : -1;
    this.px = fin(px); this.py = fin(py);
    this.ax = Number.isFinite(e.x) ? e.x : this.px; this.ay = Number.isFinite(e.y) ? e.y : this.py;
    this.dx = fin(e.dx); this.dy = fin(e.dy);
    this.amt = Math.max(0, fin(e.amt));
    this.shooter = false;
    this.count++;
  }

  update(dt) { if (this.t < 9) this.t = Math.min(9, this.t + Math.max(0, Math.min(0.1, fin(dt)))); }

  // 1 for most of the window, fading out over the last 40%
  static ramp(t, life) { if (!(t >= 0) || t >= life) return 0; const k = t / life; return k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4; }
  rimA() { return HitFx.ramp(this.t, HIT_RIM); }
  liftA() { return HitFx.ramp(this.t, HIT_LIFT); }
  arcA() { return HitFx.ramp(this.t, HIT_ARC); }
  get active() { return this.t < HIT_LIFT; }

  // Angle (radians, screen space, y down) from the hero toward where the hit came from. Thorn: back along its path (it struck from behind its travel direction).
  // `ax/ay` is a live attacker position when known (it keeps moving during the lift), else the position at the hit.
  angle(ax = this.ax, ay = this.ay) {
    if (this.kind === 'thorn' && (this.dx !== 0 || this.dy !== 0)) return Math.atan2(-this.dy, -this.dx);
    const dx = ax - this.px, dy = ay - this.py;
    if (dx * dx + dy * dy < 1e-6) return Math.PI / 2; // dead centre: arc below the hero
    return Math.atan2(dy, dx);
  }
}

// Invulnerability look (replaces the 24 Hz rig/flat swap): none during the normal 0.4 s window (the light-red rim carries the hit),
// and only for the long windows (revive: 2 s) a slow 1.5 Hz dim. Never more than 3 crossings per second, also under Calm motion.
export function iframeFlick(iframes, time, dead) {
  if (dead || !(iframes > 0.5)) return false;
  return Math.floor(fin(time) * 3) % 2 === 1;
}
export const FLICK_ALPHA = 0.55;
