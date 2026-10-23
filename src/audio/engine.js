// AU0 + AU1: the Web Audio engine. One AudioContext, made on the first user gesture (never at boot), buses master/music/sfx with
// duck stages, a master compressor and a code-made reverb. AU1 cues are ported from the prototype (docs/mockups/audio/index.html).
// Render/audio only: reads nothing from the sim except what app.js / RunScene hand it, and never uses the sim RNG (Math.random only).
import { VoiceBudget, duckTargets, masterGain, perceptual, soundSettings } from './budget.js';

const D3 = 146.83, hz = (n) => D3 * Math.pow(2, n / 12);
const DAWN = [0, 2, 4, 7, 9]; // D major pentatonic: the gem climb
const rnd = (a, b) => a + Math.random() * (b - a);

// pri 0 = never dropped (moments), 1 = player actions and pickups, 2 = hits (first to go). Budget table s4.
export const CUES = {
  wolf_bite: { cap: 3, gap: 0.07, pri: 2 },
  raven_peck: { cap: 3, gap: 0.07, pri: 2 },
  glyph_bolt: { cap: 3, gap: 0.08, pri: 2 },
  storm_thread: { cap: 2, gap: 0.1, pri: 1 },
  candle_flare: { cap: 3, gap: 0.08, pri: 2 },
  gem: { cap: 3, gap: 0.03, pri: 1 },
  heart: { cap: 1, gap: 0.2, pri: 1 },
  magnet: { cap: 1, gap: 0.3, pri: 1 },
  level_up: { cap: 1, gap: 0.3, pri: 0 },
  ui_tick: { cap: 2, gap: 0.04, pri: 1 },
  ui_pick: { cap: 1, gap: 0.1, pri: 1 },
};
// weapon id (the sim hit log's src tag) -> its verb cue
export const HIT_CUE = { ghost_wolves: 'wolf_bite', raven_flock: 'raven_peck', spirit_bolts: 'glyph_bolt', chain_lightning: 'storm_thread', holy_orbit: 'candle_flare' };

export class AudioEngine {
  constructor(win) {
    this.win = win;
    this.ctx = null;
    this.set = soundSettings(null);
    this.hidden = false;
    this.budget = new VoiceBudget(CUES);
    this.gemStep = 0; this.lastGem = -9;
  }

  get ready() { return !!this.ctx; }

  /** Called from a user-gesture handler: make (or resume) the context. Safe to call often. */
  unlock() {
    const AC = this.win.AudioContext || this.win.webkitAudioContext;
    if (!AC) return false;
    try {
      if (!this.ctx) this.build(new AC());
      if (this.ctx.state === 'suspended' && !this.hidden) this.ctx.resume().catch(() => {});
    } catch { return false; }
    return true;
  }

  build(ctx) {
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    this.master.connect(comp).connect(ctx.destination);
    this.musicBus = ctx.createGain(); this.musicDuck = ctx.createGain(); this.musicBus.connect(this.musicDuck).connect(this.master);
    this.sfxBus = ctx.createGain(); this.sfxDuck = ctx.createGain(); this.sfxBus.connect(this.sfxDuck).connect(this.master);
    const verb = ctx.createConvolver(); verb.buffer = this.impulse(2.6);
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = 0.35; this.verbSend.connect(verb).connect(this.master);
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    this.apply();
  }

  impulse(sec) { // procedural reverb: decaying noise, a soft forest clearing
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    return b;
  }

  /** New settings object from the save (validated here again). */
  configure(settings) { this.set = soundSettings(settings); this.apply(); }
  setHidden(h) {
    this.hidden = !!h;
    this.apply();
    const c = this.ctx;
    if (!c) return;
    try { if (this.hidden && c.state === 'running') c.suspend().catch(() => {}); else if (!this.hidden && c.state === 'suspended') c.resume().catch(() => {}); } catch { /* ignore */ }
  }
  get silent() { return this.set.muted || this.hidden; }

  apply() {
    const c = this.ctx;
    if (!c) return;
    const now = c.currentTime, s = this.set;
    this.master.gain.setTargetAtTime(masterGain(s.master, s.muted, this.hidden), now, 0.08);
    this.musicBus.gain.setTargetAtTime(perceptual(s.music), now, 0.08);
    this.sfxBus.gain.setTargetAtTime(perceptual(s.sfx), now, 0.08);
  }

  duck(kind) {
    const d = duckTargets(kind, this.set.calm);
    if (!d || !this.ctx) return;
    const now = this.ctx.currentTime;
    for (const [g, v] of [[this.musicDuck, d.music], [this.sfxDuck, d.sfx]]) {
      g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(v, now, 0.03); g.gain.setTargetAtTime(1, now + d.hold, d.release);
    }
  }

  /** Play cue `id` (n = requests folded into this one, e.g. hits this frame). Returns true if a voice started. */
  play(id, n = 1) {
    if (!this.ctx || this.silent || this.ctx.state !== 'running') return false;
    const now = this.ctx.currentTime;
    const v = this.budget.request(id, now, this.set.calm, n);
    if (!(v > 0)) return false;
    const dur = this.cue(id, now + 0.005, v);
    this.budget.commit(id, now + dur);
    return true;
  }

  /** Hits drained from the sim hit log this frame: counts per weapon id. */
  hits(counts) {
    if (!this.ctx || this.silent) return;
    for (const w in HIT_CUE) { const n = counts[w]; if (n > 0) this.play(HIT_CUE[w], n); }
  }

  // ---------- synth (ported from the prototype) ----------
  env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  noise(t, type, f, q, a, d, peak, f2, verb) {
    const ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const g = ctx.createGain(); this.env(g, t, a, peak, d);
    s.connect(fl).connect(g).connect(this.sfxBus); if (verb) g.connect(this.verbSend);
    s.start(t, Math.random() * 1.5); s.stop(t + a + d + 0.05);
  }
  tone(t, type, f, a, d, peak, f2, verb) {
    const ctx = this.ctx, o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const g = ctx.createGain(); this.env(g, t, a, peak, d);
    o.connect(g).connect(this.sfxBus); if (verb) g.connect(this.verbSend);
    o.start(t); o.stop(t + a + d + 0.05);
  }
  gemNote(now) {
    this.gemStep = now - this.lastGem < 0.5 ? Math.min(this.gemStep + 1, 10) : 0;
    this.lastGem = now;
    return 12 + DAWN[this.gemStep % 5] + 12 * Math.floor(this.gemStep / 5);
  }

  cue(id, t, v) { // returns how long the voice lasts (s)
    switch (id) {
      case 'wolf_bite': // snap: two jaw clicks + a breathy huff
        this.noise(t, 'bandpass', rnd(1600, 2100), 3, 0.002, 0.035, 0.5 * v);
        this.noise(t + 0.045, 'bandpass', rnd(1300, 1700), 3, 0.002, 0.04, 0.4 * v);
        this.noise(t, 'lowpass', 700, 1, 0.01, 0.12, 0.12 * v);
        return 0.2;
      case 'raven_peck': // flutter-peck: paper-grain bursts + a wooden tick
        for (let i = 0; i < 4; i++) this.noise(t + i * 0.022, 'bandpass', rnd(2500, 3500), 1.5, 0.002, 0.018, 0.25 * v * (1 - i * 0.18));
        this.tone(t + 0.1, 'triangle', rnd(1700, 1900), 0.005, 0.03, 0.08 * v);
        return 0.18;
      case 'glyph_bolt': // whisper-pop: rising hiss, glassy pop
        this.noise(t, 'bandpass', 1500, 2, 0.04, 0.08, 0.12 * v, 5000);
        this.tone(t + 0.12, 'sine', rnd(820, 980), 0.005, 0.09, 0.25 * v, 300, true);
        return 0.3;
      case 'storm_thread': // crack: highpass crack + crackle ticks + a tiny buzz
        this.noise(t, 'highpass', 2800, 1, 0.002, 0.05, 0.45 * v);
        for (let i = 1; i < 5; i++) this.noise(t + i * rnd(0.015, 0.035), 'highpass', 4000, 1, 0.002, 0.008, 0.25 * v);
        this.tone(t, 'square', 120, 0.005, 0.06, 0.05 * v, 60);
        return 0.25;
      case 'candle_flare': // hush-flare: soft whoosh + ember ticks + candle hum
        this.noise(t, 'lowpass', 900, 1, 0.03, 0.22, 0.22 * v, 2200);
        for (let i = 0; i < 3; i++) this.noise(t + 0.05 + i * rnd(0.03, 0.07), 'highpass', 5000, 1, 0.002, 0.006, 0.14 * v);
        this.tone(t, 'sine', 233, 0.02, 0.25, 0.05 * v);
        return 0.35;
      case 'gem': { const n = this.gemNote(t); this.tone(t, 'sine', hz(n), 0.005, 0.18, 0.12 * v, 0, true); this.tone(t, 'sine', hz(n) * 2.76, 0.005, 0.08, 0.03 * v); return 0.2; }
      case 'heart': for (let i = 0; i < 3; i++) this.tone(t + i * 0.07, 'triangle', hz([0, 7, 12][i] + 12), 0.005, 0.4, 0.12 * v, 0, true); return 0.6;
      case 'magnet': // a rising sweep (the gem climb follows as the gems arrive)
        this.noise(t, 'bandpass', 500, 1.2, 0.25, 0.35, 0.08 * v, 3200, true);
        this.tone(t, 'triangle', hz(0), 0.2, 0.4, 0.06 * v, hz(12), true);
        return 0.6;
      case 'level_up': // the lantern motif (3 rising notes) + a soft whoosh
        this.duck('levelup');
        for (let i = 0; i < 3; i++) this.tone(t + i * 0.11, 'triangle', hz([0, 7, 14][i] + 12), 0.005, 0.7, 0.16 * v, 0, true);
        this.noise(t, 'bandpass', 1200, 0.7, 0.15, 0.3, 0.05 * v, 4000);
        return 1.0;
      case 'ui_tick': this.tone(t, 'triangle', hz(24), 0.005, 0.04, 0.06 * v); return 0.06;
      case 'ui_pick': for (let i = 0; i < 2; i++) this.tone(t + i * 0.06, 'triangle', hz([0, 7][i] + 24), 0.005, 0.25, 0.09 * v, 0, true); return 0.35;
      default: return 0.05;
    }
  }
}
