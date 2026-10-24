// AU4-AU6 cues: moments, the 15 evolution verbs (evo_<id>), hero abilities, enemies, the Branch-Mane, the Elder Treant, chests,
// the dawn chorus, results and tree / menu sounds. Moments are ported from the prototype (docs/mockups/audio/index.html); the rest
// follow the recipes in docs/design/audio-v1.md s4 (all code-made, no files). Each cue returns how long its voice lasts (s).
// e = the AudioEngine: e.tone(t, type, f, a, d, peak, f2, verb, dest, det), e.noise(t, type, f, q, a, d, peak, f2, verb, dest).

const rnd = (a, b) => a + Math.random() * (b - a);

// pri 0 = never dropped (moments), 1 = player actions / pickups / tells, 2 = hits (first to go). Budget table s4.
export const MORE_CUES = {
  evo: { cap: 1, gap: 1, pri: 0 }, hurt: { cap: 1, gap: 0.25, pri: 0 }, swarm: { cap: 1, gap: 2, pri: 0 },
  ability: { cap: 1, gap: 1, pri: 0 }, sanctuary: { cap: 1, gap: 1, pri: 0 }, revive: { cap: 1, gap: 1, pri: 0 },
  boss_tremor: { cap: 1, gap: 4, pri: 0 }, boss_intro: { cap: 1, gap: 2, pri: 0 }, boss_phase: { cap: 1, gap: 1.5, pri: 0 }, boss_fall: { cap: 1, gap: 2, pri: 0 },
  treant_creak: { cap: 1, gap: 0.6, pri: 1 }, treant_slam: { cap: 1, gap: 0.3, pri: 1 },
  mane_call: { cap: 1, gap: 2, pri: 0 }, mane_howl: { cap: 1, gap: 1, pri: 1 }, mane_growl: { cap: 1, gap: 1, pri: 0 }, mane_fall: { cap: 1, gap: 2, pri: 0 },
  thorn_spit: { cap: 2, gap: 0.12, pri: 1 }, toad_puff: { cap: 2, gap: 0.12, pri: 1 }, hart_charge: { cap: 1, gap: 0.3, pri: 1 },
  tell_stoat_piper: { cap: 1, gap: 0.3, pri: 1 }, tell_puffback_toad: { cap: 1, gap: 0.3, pri: 1 }, tell_bramble_hart: { cap: 1, gap: 0.4, pri: 1 },
  spawn_special: { cap: 1, gap: 1.2, pri: 1 }, husk_fade: { cap: 2, gap: 0.1, pri: 2 },
  chest_drop: { cap: 1, gap: 0.5, pri: 1 }, chest_open: { cap: 1, gap: 0.5, pri: 0 },
  dawn_chorus_1: { cap: 1, gap: 5, pri: 0 }, dawn_chorus_2: { cap: 1, gap: 5, pri: 0 }, dawn_chorus_3: { cap: 1, gap: 5, pri: 0 },
  defeat_sting: { cap: 1, gap: 3, pri: 0 }, title_motif: { cap: 1, gap: 3, pri: 0 },
  results_win: { cap: 1, gap: 1, pri: 0 }, results_lose: { cap: 1, gap: 1, pri: 0 },
  tree_light: { cap: 1, gap: 0.2, pri: 0 }, bond_level: { cap: 1, gap: 1, pri: 0 }, keepsake: { cap: 1, gap: 1, pri: 0 }, tree_whole: { cap: 1, gap: 1, pri: 0 }, ui_step: { cap: 1, gap: 0.15, pri: 1 },
};
export const EVO_IDS = ['phantom_stampede', 'howling_legion', 'dire_alpha', 'murder_storm', 'dive_bombers', 'spearhead', 'spirit_tempest', 'soul_lance', 'returning_pages', 'thunder_judgment', 'static_storm', 'storm_tether', 'vesper_tide', 'sanctum_halo', 'judgement_wheel'];
for (const id of EVO_IDS) MORE_CUES['evo_' + id] = { cap: 1, gap: 1, pri: 0 };

// sim event type -> cue (app.js hands every sim event to AudioEngine.event; render/audio only)
export const EVENT_CUE = {
  levelup: 'level_up', heart: 'heart', magnet: 'magnet', hurt: 'hurt', swarm: 'swarm', rally: 'ability', wheel: 'sanctuary', dash: 'ability', sanctuary: 'sanctuary', keepsake: 'keepsake', revive: 'revive',
  bossTell: 'treant_creak', bossHit: 'treant_slam', slam: 'treant_slam', bossPhase: 'boss_phase', bossDead: 'boss_fall', bossSoon: 'boss_tremor',
  thorn: 'thorn_spit', burst: 'toad_puff', charge: 'hart_charge', mini: 'mane_call', howl: 'mane_howl', miniPhase: 'mane_growl', miniDead: 'mane_fall',
  chestDrop: 'chest_drop', chest: 'chest_open',
};
export const SPECIAL = ['stoat_piper', 'puffback_toad', 'bramble_hart']; // spawns + tells that get a sound (the tells are visual first)

const MOTIF = [0, 7, 14];
function motif(e, t, v, base, peak, dest) { for (let i = 0; i < 3; i++) e.tone(t + i * 0.11, 'triangle', e.hz(MOTIF[i] + base), 0.005, 0.7, peak * v, 0, true, dest); }
function chord(e, t, notes, gap, a, d, peak, dest, type = 'triangle') { for (let i = 0; i < notes.length; i++) e.tone(t + i * gap, type, e.hz(notes[i]), a, d, peak, 0, true, dest); }

function evoVerb(e, id, t, v) {
  switch (id) {
    case 'phantom_stampede': for (let i = 0; i < 7; i++) e.noise(t + i * (0.13 - i * 0.01), 'lowpass', 500, 1, 0.004, 0.06, 0.2 * v); e.tone(t + 0.6, 'sine', e.hz(28), 0.005, 0.5, 0.06 * v, 0, true); return 1.2; // light padding taps along the trail
    case 'howling_legion': for (const d of [-14, -5, 5, 14]) e.tone(t + rnd(0, 0.08), 'triangle', e.hz(7), 0.25, 1.1, 0.05 * v, e.hz(12), true, null, d); return 1.5; // chorus of detuned glides
    case 'dire_alpha': e.tone(t, 'sawtooth', 70, 0.08, 0.8, 0.07 * v, 52); e.noise(t, 'lowpass', 260, 1, 0.08, 0.7, 0.2 * v); e.noise(t + 0.8, 'bandpass', 900, 2, 0.002, 0.09, 0.35 * v); return 1.1; // one deep growl + crunch
    case 'murder_storm': e.noise(t, 'bandpass', 3000, 0.7, 0.3, 1.1, 0.12 * v, 0, true); e.noise(t + 0.1, 'bandpass', 1900, 0.7, 0.3, 1.0, 0.1 * v); return 1.5; // wide rustle bed
    case 'dive_bombers': e.tone(t, 'triangle', 520, 0.002, 0.08, 0.2 * v); e.noise(t, 'lowpass', 400, 1, 0.002, 0.06, 0.25 * v); e.tone(t + 0.12, 'sine', e.hz(26), 0.005, 0.4, 0.05 * v, 0, true); return 0.6; // wax-seal tock
    case 'spearhead': e.tone(t, 'sine', 900, 0.05, 0.35, 0.08 * v, 2400); e.tone(t + 0.42, 'sine', 90, 0.003, 0.3, 0.35 * v, 45); e.noise(t + 0.42, 'lowpass', 500, 1, 0.002, 0.1, 0.2 * v); return 0.8; // rising whistle then thud
    case 'spirit_tempest': for (let i = 0; i < 8; i++) e.noise(t + i * 0.06, 'bandpass', 1400 + i * 300, 2, 0.02, 0.06, 0.08 * v, 5000); return 0.7; // 8 rapid whispers
    case 'soul_lance': e.tone(t, 'sine', e.hz(31), 0.15, 0.9, 0.05 * v, e.hz(26), true); e.tone(t, 'square', 55, 0.1, 0.9, 0.03 * v); return 1.1; // drawn-out shriek-thrum (soft)
    case 'returning_pages': for (const s of [0, 0.5]) for (let i = 0; i < 4; i++) e.noise(t + s + i * 0.02, 'bandpass', 2500, 1.5, 0.002, 0.02, 0.2 * v); e.tone(t + 0.3, 'sine', 900, 0.005, 0.12, 0.12 * v, 0, true); return 0.8; // page flip there and back
    case 'thunder_judgment': e.noise(t, 'lowpass', 320, 0.8, 0.05, 1.6, 0.35 * v, 110); e.tone(t, 'sine', 50, 0.05, 1.2, 0.2 * v, 38); return 1.8; // one rolling thunder
    case 'static_storm': for (let i = 0; i < 14; i++) e.noise(t + rnd(0, 1.2), 'highpass', 4500, 1, 0.002, 0.006, 0.1 * v); return 1.3; // quiet tick bed
    case 'storm_tether': e.tone(t, 'sine', 220, 0.2, 1.1, 0.06 * v); e.tone(t, 'sine', 221.6, 0.2, 1.1, 0.06 * v); e.tone(t, 'triangle', 440, 0.3, 0.9, 0.015 * v); return 1.4; // held taut hum
    case 'vesper_tide': e.noise(t, 'lowpass', 400, 1, 0.8, 1.0, 0.12 * v, 1200, true); e.tone(t, 'sine', e.hz(12), 0.8, 1.0, 0.05 * v, 0, true); return 1.9; // slow breathing swell
    case 'sanctum_halo': for (const n of [0, 7, 12, 16]) e.tone(t, 'triangle', e.hz(n + 12), 0.5, 1.6, 0.035 * v, 0, true, null, rnd(-8, 8)); return 2.2; // soft choir-like pad
    case 'judgement_wheel': e.noise(t, 'lowpass', 600, 1, 0.25, 0.1, 0.18 * v, 3000); e.tone(t + 0.35, 'sine', 100, 0.003, 0.3, 0.35 * v, 50); for (let i = 0; i < 5; i++) e.tone(t + 0.5 + i * 0.08, 'sine', e.hz(31 - i * 2), 0.003, 0.15, 0.04 * v, 0, true); return 1.0; // whoosh-bang, sparks tinkle back
    default: return -1;
  }
}

function tell(e, type, t, v) {
  if (type === 'stoat_piper') { e.tone(t, 'triangle', e.hz(19), 0.04, 0.3, 0.05 * v, e.hz(21)); e.noise(t, 'bandpass', 1800, 4, 0.04, 0.25, 0.03 * v); return 0.4; } // a reedy pipe note
  if (type === 'puffback_toad') { e.tone(t, 'sine', 140, 0.1, 0.5, 0.12 * v, 260); return 0.6; } // a rising gulp (the fuse)
  e.noise(t, 'bandpass', 700, 2, 0.05, 0.25, 0.15 * v, 300); e.noise(t + 0.3, 'bandpass', 650, 2, 0.05, 0.2, 0.12 * v, 280); return 0.6; // bramble hart: hoof scrape
}

/** Play cue `id` at time t with volume v. Returns its length (s), or -1 if this file does not know it. */
export function moreCue(e, id, t, v) {
  if (id.startsWith('evo_')) return evoVerb(e, id.slice(4), t, v);
  if (id.startsWith('tell_')) return tell(e, id.slice(5), t, v);
  switch (id) {
    case 'evo': { // BIBLE beat: everything drops to one held note, then the gold bloom (its evo_<id> verb follows)
      e.duck('evolve');
      e.tone(t, 'triangle', e.hz(12), 0.3, 1.1, 0.12 * v, 0, true);
      const b = t + 1.2; chord(e, b, [12, 19, 23, 28, 31, 36], 0.025, 0.01, 1.8, 0.09 * v);
      e.noise(b, 'bandpass', 3000, 0.5, 0.01, 0.8, 0.07 * v, 0, true); e.tone(b, 'sine', 70, 0.005, 0.6, 0.3 * v, 50); return 3;
    }
    case 'hurt': e.duck('hurt'); e.tone(t, 'sine', 110, 0.005, 0.2, 0.35 * v, 55); e.noise(t, 'lowpass', 600, 1, 0.002, 0.12, 0.25 * v); return 0.3;
    case 'swarm': e.tone(t, 'sawtooth', e.hz(-24), 1.2, 0.9, 0.08 * v); for (let i = 0; i < 5; i++) e.noise(t + 0.6 + i * 0.18, 'bandpass', rnd(1100, 1500), 4, 0.01, 0.12, 0.08 * v, 0, true); return 2.2;
    case 'ability': // the hero's action skill (Pelt Dash / Sanctuary Ring): rising detuned chord + low thump (own per-ability cues: CH6)
      e.duck('ability');
      for (const d of [-8, 0, 8]) e.tone(t, 'sawtooth', e.hz(0), 0.25, 0.9, 0.04 * v, e.hz(7), true, null, d);
      e.noise(t, 'bandpass', 500, 1.2, 0.2, 0.6, 0.07 * v, 1400, true); e.tone(t, 'sine', 80, 0.005, 0.5, 0.3 * v, 45); return 1.4;
    case 'sanctuary': // Candle Wheel (Sanctuary): bell toll + warm pad bloom
      e.duck('ability');
      e.tone(t, 'sine', e.hz(0), 0.003, 2.4, 0.16 * v, 0, true); e.tone(t, 'sine', e.hz(0) * 2.76, 0.002, 1.0, 0.05 * v, 0, true);
      for (const n of [12, 19, 24]) e.tone(t + 0.15, 'triangle', e.hz(n), 0.5, 1.2, 0.035 * v, 0, true, null, rnd(-6, 6)); return 2.5;
    case 'revive': motif(e, t, v, 0, 0.12); motif(e, t + 0.4, v, 12, 0.1); return 1.4; // Last Light: the motif twice, rising
    case 'boss_tremor': e.noise(t, 'lowpass', 140, 1, 0.6, 1.4, 0.22 * v, 70); e.tone(t + 0.2, 'sine', 38, 0.4, 1.2, 0.18 * v, 32); return 2.0; // 13:55 soft ground tremor (boss sheet arrival warning)
    case 'boss_intro': e.duck('boss'); e.tone(t + 0.8, 'sine', 48, 0.02, 1.6, 0.5 * v, 30); e.noise(t + 0.8, 'lowpass', 250, 1, 0.05, 1.2, 0.3 * v); return 2.5;
    case 'boss_phase': e.duck('phase'); e.tone(t + 1, 'sine', 45, 0.02, 1.4, 0.5 * v, 28); e.noise(t + 1, 'lowpass', 220, 1, 0.05, 1.0, 0.3 * v); return 2.5; // 1 s near-silence + low boom
    case 'boss_fall': e.duck('bossfall'); e.tone(t, 'sine', 40, 0.005, 2, 0.5 * v, 25); e.noise(t, 'lowpass', 300, 1, 0.05, 1.8, 0.2 * v, 90); return 2.2;
    case 'treant_creak': e.tone(t, 'sawtooth', 62, 0.15, 0.6, 0.05 * v, 48); e.noise(t, 'bandpass', 420, 6, 0.15, 0.55, 0.14 * v, 300); return 0.8; // a slow wood groan
    case 'treant_slam': e.tone(t, 'sine', 85, 0.003, 0.35, 0.4 * v, 40); e.noise(t, 'lowpass', 400, 1, 0.002, 0.2, 0.25 * v); return 0.45;
    case 'mane_call': howl(e, t, v * 0.6, 1.8, true); return 2.2; // distant: the old alpha announces itself
    case 'mane_howl': howl(e, t, v, 0.8, false); return 1.0; // the charge tell
    case 'mane_growl': e.tone(t, 'sawtooth', 75, 0.06, 0.7, 0.06 * v, 58); e.noise(t, 'lowpass', 300, 1, 0.06, 0.6, 0.2 * v); return 0.9;
    case 'mane_fall': howl(e, t, v * 0.8, 1.4, true, -5); chord(e, t + 1.2, [12, 19, 24], 0.09, 0.005, 0.8, 0.07 * v); return 2.4; // fading howl + a chime
    case 'thorn_spit': e.tone(t, 'triangle', rnd(380, 440), 0.002, 0.05, 0.12 * v); e.noise(t, 'bandpass', 2200, 3, 0.002, 0.04, 0.1 * v); return 0.1; // a wooden tok
    case 'toad_puff': e.noise(t, 'lowpass', 500, 1, 0.005, 0.18, 0.3 * v, 200); e.tone(t, 'sine', 180, 0.003, 0.12, 0.15 * v, 90); return 0.25; // soft pop + air
    case 'hart_charge': for (let i = 0; i < 4; i++) e.noise(t + i * 0.07, 'lowpass', 260, 1, 0.003, 0.06, 0.22 * v); e.noise(t, 'bandpass', 700, 0.8, 0.05, 0.4, 0.08 * v, 1600); return 0.5;
    case 'spawn_special': e.noise(t, 'bandpass', rnd(900, 1300), 1.2, 0.08, 0.3, 0.05 * v); return 0.4; // a rustle in the brush
    case 'husk_fade': e.noise(t, 'lowpass', rnd(380, 520), 1, 0.005, 0.07, 0.07 * v); return 0.1; // a dry wooden puff
    case 'chest_drop': e.tone(t, 'sine', 120, 0.003, 0.2, 0.3 * v, 70); e.tone(t + 0.12, 'sine', e.hz(31), 0.005, 0.3, 0.05 * v, 0, true); return 0.45;
    case 'chest_open': // latch clack + coin shimmer + the motif
      e.noise(t, 'bandpass', 1200, 3, 0.002, 0.03, 0.3 * v); e.noise(t + 0.06, 'bandpass', 900, 3, 0.002, 0.04, 0.25 * v);
      for (let i = 0; i < 6; i++) e.tone(t + 0.15 + i * 0.05, 'sine', e.hz(24 + [0, 4, 7, 9, 12, 16][i]), 0.003, 0.3, 0.05 * v, 0, true);
      motif(e, t + 0.45, v, 12, 0.1); return 1.4;
    case 'dawn_chorus_1': for (let i = 0; i < 3; i++) e.bird(t + 0.3 + i * rnd(0.4, 0.8), null, 0.7 * v); e.tone(t, 'sine', e.hz(28), 0.003, 2.0, 0.04 * v, 0, true); return 2.6; // first light: a few sparrows, one bell
    case 'dawn_chorus_2': e.noise(t, 'bandpass', 600, 0.7, 1.2, 1.5, 0.05 * v, 300, true); e.bird(t + 1.4, null, 0.4 * v); return 3; // the hush: a breath out, one far call
    case 'dawn_chorus_3': { // the dawn flood: shimmer rising for 3 s into the first D major chord, then the victory chord + bird burst
      e.noise(t, 'bandpass', 800, 0.6, 3, 1.5, 0.05 * v, 6000, true, e.musicBus);
      chord(e, t + 2.6, [12, 16, 19, 23, 26, 31], 0.12, 0.05, 2.5, 0.06 * v, e.musicBus);
      e.duck('victory'); chord(e, t + 3.4, [0, 7, 12, 16, 19, 24, 28], 0.09, 0.08, 4, 0.07 * v, e.musicBus);
      for (let i = 0; i < 12; i++) e.bird(t + 3.6 + i * rnd(0.12, 0.3), null, v); return 8;
    }
    case 'defeat_sting': e.tone(t, 'triangle', e.hz(-12), 0.6, 3.2, 0.06 * v, 0, true, e.musicBus); for (const n of [-9, -5]) e.tone(t + 0.1, 'triangle', e.hz(n), 0.6, 3, 0.04 * v, 0, true, e.musicBus); return 4; // one low pad chord, no sad jingle
    case 'title_motif': motif(e, t, v, 12, 0.1, e.musicBus); return 1.2;
    case 'results_win': motif(e, t, v, 12, 0.09); return 1.0;
    case 'results_lose': e.tone(t, 'triangle', e.hz(19), 0.01, 0.8, 0.07 * v, 0, true); e.tone(t + 0.22, 'triangle', e.hz(12), 0.01, 1.2, 0.07 * v, 0, true); return 1.4; // a warm falling fifth
    case 'tree_light': e.noise(t, 'bandpass', 900, 0.8, 0.08, 0.25, 0.05 * v, 2600); for (let i = 0; i < 2; i++) e.tone(t + 0.08 + i * 0.07, 'triangle', e.hz([12, 19][i] + 12), 0.005, 0.5, 0.1 * v, 0, true); e.tone(t + 0.22, 'sine', e.hz(36), 0.003, 0.4, 0.03 * v); return 0.8;
    case 'tree_whole': motif(e, t, v, 12, 0.12); chord(e, t + 0.4, [24, 28, 31, 36], 0.08, 0.003, 1.6, 0.05 * v, null, 'sine'); return 2.2;
    // CHARACTER SYSTEM v2: Bond level-up at results (the level-up motif, lower and softer, with a warm fifth) and a keepsake found in a run (glass chime)
    case 'bond_level': motif(e, t, v, -5, 0.09); chord(e, t + 0.36, [7, 14, 19], 0.06, 0.004, 1.1, 0.035 * v, null, 'sine'); return 1.6;
    case 'keepsake': for (let i = 0; i < 3; i++) e.tone(t + i * 0.09, 'sine', e.hz([24, 31, 36][i]), 0.003, 0.6, 0.06 * v, 0, true); return 0.9;
    case 'ui_step': e.tone(t, 'triangle', e.hz(26), 0.005, 0.15, 0.06 * v); e.tone(t + 0.07, 'triangle', e.hz(31), 0.005, 0.25, 0.06 * v, 0, true); return 0.35;
    default: return -1;
  }
}

function howl(e, t, v, len, far, key = 0) { // a stylised wolf howl: detuned triangle glide up, hold, fall; bandpassed breath
  for (const d of [-10, 10]) e.tone(t, 'triangle', e.hz(-5 + key), 0.25, len, (far ? 0.035 : 0.05) * v, e.hz(2 + key), true, null, d);
  e.noise(t, 'bandpass', 900, 3, 0.25, len, 0.04 * v, 1300, true);
}
