// AU4 music M1: the night as live layers on the run clock (ported from docs/mockups/audio/index.html, retimed to the real night:
// first light 7:45-9:45, the hush 13:35, the Elder Treant at 14:00 (the display clock parks there), the dawn flood in the victory beat).
// The pure part (musicScene, sceneCues, pulseHit, lowHpNext) has no Web Audio and is unit-tested; MusicPlayer schedules notes on a
// 25 ms timer with 150 ms look-ahead. Reads only the view object app.js fills from the sim snapshot; never touches the sim or its RNG.

export const BPM = 72, STEP = 60 / BPM / 2; // eighth notes
export const LAYERS = ['drone', 'pad', 'pluck', 'pulse', 'heart', 'bell', 'birds'];
// run seconds on the 900 s night (dawn.js TM / chapters bossAt 840)
export const TL = { pad: 60, pluck0: 90, night: 240, pluck1: 480, pulse1: 540, first0: 465, chorus1: 490, chorus1End: 560, first1: 585, warm: 780, hush: 815, boss: 840, flood: 842, end: 900 };
export const LOW_ON = 0.3, LOW_OFF = 0.35; // low-HP heartbeat: starts under 30 %, stops above 35 % (hysteresis)
const PROG = {
  dusk: [[0, 3, 7, 10, 14], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 5, 10, 14]], // Dm9, Bbmaj7, Fmaj7, Cadd9 (D dorian)
  boss: [[-2, 1, 5, 10], [-6, -2, 1, 5], [3, 6, 10, 15], [5, 9, 12, 17]], // a tone down: the music sinks
  dawn: [[0, 4, 7, 11, 16], [5, 9, 12, 16], [-3, 0, 4, 7], [7, 11, 14, 21]], // the key opens to D major
};
export const SCALE = { dusk: [0, 3, 5, 7, 10], boss: [-2, 1, 3, 5, 8], dawn: [0, 2, 4, 7, 9] };
const ramp = (t, a, b, v0, v1) => (t <= a ? v0 : t >= b ? v1 : v0 + ((v1 - v0) * (t - a)) / (b - a));
const fin = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function newScene() { return { name: 'menu', mode: 'dusk', drone: 0, pad: 0, pluck: 0, pulse: 0, heart: 0, bell: 0, birds: 0, warmth: 450 }; }

/**
 * Layer targets for the current moment. v = { where: 'menu'|'run', t (display clock s), fight (1 = Elder Treant fight on, boss alive),
 * end: ''|'victory'|'defeat', calm, low (Low quality tier) }. Allocation-free: writes into out.
 */
export function musicScene(v, out) {
  const t = Math.max(0, fin(v && v.t)), end = v ? v.end : '';
  for (const k of LAYERS) out[k] = 0;
  out.mode = 'dusk'; out.drone = 0.5; out.warmth = ramp(t, 0, TL.warm, 450, 1300); // colour returns to the Hollow -> the pad opens
  if (!v || v.where !== 'run') { out.name = 'menu'; out.pad = 0.55; out.warmth = 700; }
  else if (end === 'defeat') { out.name = 'defeat'; out.drone = 0.45; out.warmth = 450; } // falls to the drone (+ one low chord, sceneCues)
  else if (end === 'victory') {
    if (v.fight && t < TL.flood) { out.name = 'fall'; out.mode = 'boss'; out.pad = 0.3; out.drone = 0.6; out.warmth = 650; } // the Treant kneels: near-quiet
    else if (t < TL.end) { out.name = 'flood'; out.mode = 'dawn'; out.pad = 0.9; out.pluck = 0.5; out.pulse = 0.25; out.drone = 0.15; out.bell = ramp(t, TL.flood, 880, 0.3, 1); out.birds = ramp(t, TL.flood, 870, 0.2, 1); out.warmth = ramp(t, TL.flood, 880, 1400, 3200); }
    else { out.name = 'lit'; out.mode = 'dawn'; out.pad = 0.85; out.pluck = 0.3; out.drone = 0.1; out.bell = 0.6; out.birds = 0.3; out.warmth = 3200; } // settles for the results
  } else if (v.fight) { out.name = 'boss'; out.mode = 'boss'; out.pad = 0.7; out.pluck = 0.25; out.pulse = 1; out.drone = 1; out.warmth = 650; }
  else if (t < TL.night) { out.name = t < TL.pad ? 'grey' : 'lit_lanterns'; out.pad = ramp(t, 0, TL.pad, 0.15, 0.8); out.pluck = ramp(t, TL.pluck0, TL.night, 0, 0.35); }
  else if (t < TL.hush) {
    out.name = t >= TL.first0 && t < TL.first1 ? 'first_light' : 'night';
    out.pad = 0.8; out.pluck = ramp(t, TL.night, TL.pluck1, 0.35, 0.6); out.pulse = ramp(t, TL.night, TL.pulse1, 0.3, 1);
    out.bell = out.name === 'first_light' ? 0.15 : 0;
  } else if (t < TL.boss) { out.name = 'hush'; out.pad = 0.2; out.heart = 1; out.drone = 0.8; }
  else { out.name = 'last'; out.pad = 0.8; out.pluck = 0.6; out.pulse = 0.6; out.warmth = 1400; } // a night without a boss fight: the last minute
  if (v && v.calm) { out.pulse = Math.min(out.pulse, 0.4); out.birds *= 0.4; out.heart *= 0.5; }
  if (v && v.low) out.birds = 0; // Low tier: birds off
  return out;
}

const DAWNISH = { flood: 1, lit: 1 };
/** One-shot cues on a scene change (prev -> next), at display clock t. Returns a cue id list (shared constant arrays, no allocation). */
const NONE = [], C_BOSS = ['boss_intro'], C_HUSH = ['dawn_chorus_2'], C_FIRST = ['dawn_chorus_1'], C_FLOOD = ['dawn_chorus_3'], C_DEFEAT = ['defeat_sting'], C_TITLE = ['title_motif'];
export function sceneCues(prev, next, t) {
  if (prev === next) return NONE;
  if (next === 'boss' && prev && prev !== 'menu') return C_BOSS;
  if (next === 'hush' && prev === 'night') return C_HUSH;
  if (next === 'first_light' && prev === 'night' && t >= TL.first0 && t < TL.chorus1End) return C_FIRST; // a run started later never hears it (as the sparrows)
  if (DAWNISH[next] && !DAWNISH[prev] && prev && prev !== 'menu') return C_FLOOD;
  if (next === 'defeat') return C_DEFEAT;
  if (next === 'menu' && prev === '') return C_TITLE; // the motif once when the lantern first lights (title)
  return NONE;
}

/** Does the soft drum hit on step s? Boss phases get denser (phase 0: quarters, 1: quarters + a pickup, 2: every eighth). */
export function pulseHit(mode, pulse, phase, s) {
  if (!(pulse > 0)) return false;
  if (mode === 'boss') return phase >= 2 ? true : s % 2 === 0 || (phase === 1 && s % 8 === 7);
  return s % (pulse > 0.6 ? 4 : 8) === 0;
}

/** Low-HP heartbeat on/off with hysteresis. */
export function lowHpNext(on, frac) { const f = fin(frac, 1); return on ? f <= LOW_OFF : f < LOW_ON; }

export class MusicPlayer {
  constructor(eng) {
    this.e = eng; this.sc = newScene(); this.v = null; this.prev = ''; this.step = 0; this.next = 0; this.timer = 0;
    this.lowOn = false; this.lastT = 0; this.layerAcc = 1;
  }

  build() {
    const e = this.e, ctx = e.ctx;
    this.out = ctx.createGain(); this.out.connect(e.musicBus); // pause dip lives here
    this.L = {};
    for (const k of LAYERS) { const g = ctx.createGain(); g.gain.value = 0; g.connect(this.out); this.L[k] = g; }
    for (const k of ['pad', 'pluck', 'bell', 'birds']) this.L[k].connect(e.musicVerb);
    this.padF = ctx.createBiquadFilter(); this.padF.type = 'lowpass'; this.padF.frequency.value = 450; this.padF.Q.value = 0.5; this.padF.connect(this.L.pad);
    const dg = ctx.createGain(); dg.gain.value = 0.18; dg.connect(this.L.drone); this.drone = [];
    for (const n of [-12, -5]) { const o = ctx.createOscillator(); o.frequency.value = e.hz(n); o.connect(dg); o.start(); this.drone.push(o); }
    const w = ctx.createBufferSource(); w.buffer = e.noiseBuf; w.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 380; wf.Q.value = 0.8;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 180; lfo.connect(lg).connect(wf.frequency); lfo.start();
    const wg = ctx.createGain(); wg.gain.value = 0.12; w.connect(wf).connect(wg).connect(this.L.drone); w.start();
    this.lowG = ctx.createGain(); this.lowG.gain.value = 0; this.lowG.connect(e.heartBus); // the low-HP heartbeat (sfx slider, Calm halves it)
    this.next = ctx.currentTime + 0.1;
    this.timer = e.win.setInterval(() => this.tick(), 25);
  }

  /** View from app.js (every frame, the same object). dt in seconds. */
  frame(v, dt) {
    this.v = v;
    if (!this.L) return;
    const run = v.where === 'run' && v.end === '';
    const low = run && v.running && lowHpNext(this.lowOn, v.hp);
    if (low !== this.lowOn) { this.lowOn = low; this.lowG.gain.setTargetAtTime(low ? (v.calm ? 0.5 : 1) : 0, this.e.ctx.currentTime, low ? 0.3 : 0.6); this.e.lowHp(low); }
    if (v.where === 'run' && fin(v.t) + 5 < this.lastT) this.prev = 'reset'; // a new run: no cues for the jump back to dusk
    this.lastT = fin(v.t);
    this.layerAcc += dt;
    if (this.layerAcc < 0.2) return;
    this.layerAcc = 0;
    this.update();
  }

  update() {
    const e = this.e, ctx = e.ctx, now = ctx.currentTime, v = this.v, sc = musicScene(v, this.sc);
    for (const k of LAYERS) this.L[k].gain.setTargetAtTime(sc[k], now, k === 'heart' ? 0.3 : 1.2);
    this.padF.frequency.setTargetAtTime(sc.warmth, now, 2);
    const drop = sc.mode === 'boss' ? -2 : 0; // the BIBLE beat: the music shifts down a key for the boss
    this.drone[0].frequency.setTargetAtTime(e.hz(-12 + drop), now, 1.5); this.drone[1].frequency.setTargetAtTime(e.hz(-5 + drop), now, 1.5);
    this.out.gain.setTargetAtTime(v.paused ? 0.45 : 1, now, 0.25);
    if (sc.name !== this.prev) {
      const prev = this.prev === 'reset' ? 'menu' : this.prev;
      for (const id of sceneCues(prev, sc.name, fin(v.t))) e.play(id);
      this.prev = sc.name;
    }
  }

  tick() {
    const e = this.e, ctx = e.ctx;
    if (!ctx || ctx.state !== 'running' || !this.v) return;
    if (this.next < ctx.currentTime) this.next = ctx.currentTime + 0.05; // after a suspend: no burst of late notes
    while (this.next < ctx.currentTime + 0.15) { if (!e.silent) this.onStep(this.step, this.next); this.next += STEP; this.step++; }
  }

  onStep(s, t) {
    const e = this.e, sc = this.sc, prog = PROG[sc.mode], scale = SCALE[sc.mode], r = Math.random, phase = this.v.phase | 0;
    if (s % 16 === 0 && sc.pad > 0) this.padChord(prog[((s / 16) | 0) % 4], t);
    if (sc.pluck > 0 && r() < sc.pluck * 0.45) this.pluck(t, scale[(r() * scale.length) | 0] + (r() < 0.6 ? 12 : 24));
    if (pulseHit(sc.mode, sc.pulse, phase, s)) { e.tone(t, 'sine', 95, 0.003, 0.38, 0.35, 42, false, this.L.pulse); e.noise(t, 'lowpass', 300, 1, 0.002, 0.06, 0.09, 0, false, this.L.pulse); }
    if (sc.heart > 0.5) { if (s % 8 === 0) this.heartbeat(t, this.L.heart); } else if (this.lowOn && s % 2 === 0) this.heartbeat(t, this.lowG); // hush beat / low-HP beat (one at a time)
    if (sc.bell > 0 && r() < sc.bell * 0.3) this.bell(t, scale[(r() * scale.length) | 0] + 24);
    if (sc.birds > 0 && r() < sc.birds * 0.12) e.bird(t + r() * STEP, this.L.birds);
  }

  heartbeat(t, dest) { const e = this.e; e.tone(t, 'sine', 60, 0.005, 0.25, 0.4, 40, false, dest); e.tone(t + 0.28, 'sine', 55, 0.005, 0.25, 0.28, 38, false, dest); }

  padChord(notes, t) {
    const ctx = this.e.ctx, dur = STEP * 16 + 1.6;
    for (const n of notes) for (const det of [-6, 6]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = this.e.hz(n); o.detune.value = det;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 1.6);
      g.gain.setValueAtTime(0.035, t + dur - 1.8); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g).connect(this.padF); o.start(t); o.stop(t + dur + 0.05);
    }
  }

  pluck(t, n, peak = 0.12) { // the lantern music box: a soft struck tine with a little echo
    const e = this.e, d = this.L.pluck;
    e.tone(t, 'triangle', e.hz(n), 0.004, 0.9, peak, 0, false, d);
    e.tone(t, 'sine', e.hz(n + 12), 0.002, 0.35, peak * 0.35, 0, false, d);
    e.tone(t + STEP * 1.5, 'triangle', e.hz(n), 0.004, 0.6, peak * 0.3, 0, false, d);
  }

  bell(t, n) { const e = this.e; e.tone(t, 'sine', e.hz(n), 0.003, 2.2, 0.07, 0, false, this.L.bell); e.tone(t, 'sine', e.hz(n) * 2.76, 0.002, 0.9, 0.025, 0, false, this.L.bell); }

  stop() { if (this.timer) this.e.win.clearInterval(this.timer); this.timer = 0; }
}
