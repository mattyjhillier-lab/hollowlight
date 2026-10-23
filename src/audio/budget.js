// AU0 audio logic with no Web Audio in it (Node-testable): settings clamps, slider curve, the on/off gate, ducks, the voice budget.
// docs/design/audio-v1.md s4 (budget + duck tables) and s5 (settings). Never touches the sim.

export const clamp01 = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : d);
export const perceptual = (v) => { const c = clamp01(v); return c * c; }; // slider 0..1 -> gain, even-feeling steps

/** Read the stored sound settings into a safe shape (anything odd falls back to the defaults). */
export function soundSettings(s) {
  const o = s && typeof s === 'object' ? s : {};
  return {
    master: clamp01(o.masterVol, 0.8), music: clamp01(o.musicVol, 0.7), sfx: clamp01(o.sfxVol, 0.8),
    muted: o.muted === true, calm: o.reducedMotion === true, // Calm sound follows Calm motion (LOCKED default)
  };
}

/** Master bus gain: silent when muted or when the tab is hidden / the window lost focus. */
export const masterGain = (master, muted, hidden) => (muted || hidden ? 0 : perceptual(master));

// Duck table (s4): music / sfx multiplier, hold and release in seconds. Calm keeps the evolution duck shallow.
export const DUCKS = {
  levelup: { music: 0.55, sfx: 0.5, hold: 0.6, release: 0.5 },
  evolve: { music: 0.06, sfx: 0.1, hold: 1.4, release: 0.8, calmMusic: 0.4, calmSfx: 0.4 },
  ability: { music: 0.6, sfx: 0.6, hold: 0.5, release: 0.5 },
  hurt: { music: 0.75, sfx: 0.7, hold: 0.15, release: 0.3 },
  boss: { music: 0.2, sfx: 0.6, hold: 1.2, release: 1 },
  phase: { music: 0.08, sfx: 0.45, hold: 0.9, release: 0.8 }, // boss phase change: 1 s near-silence, then the boom
  bossfall: { music: 0.1, sfx: 0.5, hold: 1.5, release: 1 },
  victory: { music: 1, sfx: 0.3, hold: 4, release: 1 },
};
export function duckTargets(kind, calm) {
  const d = DUCKS[kind];
  if (!d) return null;
  return { music: calm && d.calmMusic !== undefined ? d.calmMusic : d.music, sfx: calm && d.calmSfx !== undefined ? d.calmSfx : d.sfx, hold: d.hold, release: d.release };
}

export const GLOBAL_CAP = 24, CALM_CAP = 12, MAX_FOLD = 1.5, CALM_HIT = 0.7;
const SLOTS = 96;

/**
 * Voice budget (s4): per-cue cap, a min gap (requests inside it are folded into the next play: volume x sqrt(n), max 1.5x),
 * a global cap for tier 1/2 (tier 0 moments always play). No allocation per request: fixed slot arrays, compacted in place.
 * cues: { id: { cap, gap, pri } }.
 */
export class VoiceBudget {
  constructor(cues) {
    this.st = {};
    for (const id of Object.keys(cues)) { const c = cues[id]; this.st[id] = { cap: c.cap, gap: c.gap, pri: c.pri, last: -1e9, pending: 0, live: 0 }; }
    this.end = new Float64Array(SLOTS);
    this.who = new Array(SLOTS).fill(null);
    this.n = 0;
    this.played = 0; this.merged = 0; this.dropped = 0; this.peak = 0;
  }

  prune(now) {
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.end[i] > now) { this.end[w] = this.end[i]; this.who[w] = this.who[i]; w++; } else this.who[i].live--;
    }
    for (let i = w; i < this.n; i++) this.who[i] = null;
    this.n = w;
  }

  /** Ask to play cue `id` for `n` requests at time `now`. Returns the volume multiplier (> 0) to play with, or 0 (folded or dropped). */
  request(id, now, calm = false, n = 1, rand = Math.random) {
    const c = this.st[id];
    if (!c) return 0;
    const k = Math.max(1, n | 0);
    this.prune(now);
    if (now - c.last < c.gap) { c.pending += k; this.merged += k; return 0; }
    if (c.live >= c.cap || this.n >= SLOTS || (c.pri > 0 && this.n >= (calm ? CALM_CAP : GLOBAL_CAP))) { this.dropped += k; return 0; }
    const v = Math.min(MAX_FOLD, Math.sqrt(k + c.pending)) * (0.85 + 0.15 * rand()) * (calm && c.pri === 2 ? CALM_HIT : 1);
    this.merged += k - 1;
    c.pending = 0; c.last = now;
    return v;
  }

  /** Record a voice that will sound until `until` (call right after a request that returned > 0). */
  commit(id, until) {
    const c = this.st[id];
    if (!c || this.n >= SLOTS) return;
    this.end[this.n] = until; this.who[this.n] = c; this.n++; c.live++;
    this.played++;
    if (this.n > this.peak) this.peak = this.n;
  }

  get active() { return this.n; }
}
