// FM4/FM5 game-feel budgets (docs/design/first-minute-v1.md section 6 A). Pure JS (no Phaser/DOM) so every cap is unit-testable.
// Display / device only: nothing here is read by the sim, and nothing here uses the sim RNG.

/** At most one go per `gap` seconds; a stronger request may cut in (shake: a boss slam is never eaten by a scratch). */
export class Gate {
  constructor(gap) { this.gap = gap; this.last = -1e9; this.lastK = 0; }
  ok(now, k = 0, cutIn = false) {
    if (!Number.isFinite(now)) return false;
    if (now - this.last >= this.gap || (cutIn && k > this.lastK)) { this.last = now; this.lastK = k; return true; }
    return false;
  }
  reset() { this.last = -1e9; this.lastK = 0; }
}

export const SHAKE_GAP = 0.4; // never more than one shake per 0.4 s (a stronger one may cut in)
export const KILL_POPS_PER_SEC = 24; // kill puffs above this merge into the ones already flying
export const VIBE_GAP = 0.5; // never more than one buzz per 0.5 s
export const VIBE = Object.freeze({ hurt: [20], level: [15, 40, 15], evolve: [40, 20, 60], boss: [80] });

/** Token window: at most `n` per rolling second. */
export class RateCap {
  constructor(n) { this.n = n; this.t0 = -1e9; this.used = 0; }
  take(now) {
    if (!Number.isFinite(now)) return false;
    if (now - this.t0 >= 1) { this.t0 = now; this.used = 0; }
    if (this.used >= this.n) return false;
    this.used++;
    return true;
  }
}

/**
 * Phone vibration (FM5): navigator.vibrate where it exists (Android browsers; iPhone Safari has none, so it does nothing). Off when the
 * Vibration setting is off, under Calm motion, or while the tab is hidden; one buzz per VIBE_GAP. Patterns are fixed constants (never data).
 */
export class Vibe {
  constructor(nav, settings, hidden) { this.nav = nav; this.settings = settings; this.hidden = hidden; this.gate = new Gate(VIBE_GAP); }
  can() {
    const n = this.nav;
    if (!n || typeof n.vibrate !== 'function') return false;
    const s = this.settings ? this.settings() : null;
    if (!s || s.vibration === false || s.reducedMotion) return false;
    try { if (this.hidden && this.hidden()) return false; } catch { return false; }
    return true;
  }
  buzz(kind, now) {
    if (!Object.hasOwn(VIBE, kind) || !this.can() || !this.gate.ok(now)) return false;
    try { return this.nav.vibrate(VIBE[kind].slice()) !== false; } catch { return false; }
  }
}

/** Gem pickup pop scale over its 0.15 s life: 1 -> 1.25 at 40%, then down to 0. */
export const GEM_POP_LIFE = 0.15;
export function gemPopScale(age) {
  const k = Math.max(0, Math.min(1, age / GEM_POP_LIFE));
  return k < 0.4 ? 1 + 0.25 * (k / 0.4) : 1.25 * (1 - (k - 0.4) / 0.6);
}

/** Damage-number pop (FM4 item 4): 1.3 -> 1.0 over the first 90 ms (big hits keep their own size from sizeMul on top). */
export const NUM_POP_S = 0.09;
export function numPop(ageSec, big) {
  if (!(ageSec < NUM_POP_S) || ageSec < 0) return 1;
  return 1 + (big ? 0.45 : 0.3) * (1 - ageSec / NUM_POP_S);
}
