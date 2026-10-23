// AU0/AU1: audio logic (no Web Audio in Node): clamps, slider curve, mute/hidden gate, ducks, voice budget, unlock + M key wiring.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clamp01, perceptual, soundSettings, masterGain, duckTargets, VoiceBudget, GLOBAL_CAP, CALM_CAP } from '../src/audio/budget.js';
import { CUES, HIT_CUE, AudioEngine } from '../src/audio/engine.js';
import { createAudio, isMuteKey } from '../src/audio/index.js';
import { sanitize, defaultSettings } from '../src/save/schema.js';

test('settings clamps: volumes 0..1, junk falls back, muted only when true, calm follows Calm motion', () => {
  assert.equal(clamp01(2), 1); assert.equal(clamp01(-1), 0); assert.equal(clamp01('x', 0.5), 0.5); assert.equal(clamp01(NaN, 0.3), 0.3); assert.equal(clamp01(Infinity, 0.2), 0.2);
  const s = soundSettings({ masterVol: 9, musicVol: -3, sfxVol: '1', muted: 'yes', reducedMotion: true });
  assert.deepEqual(s, { master: 1, music: 0, sfx: 0.8, muted: false, calm: true });
  assert.deepEqual(soundSettings(null), { master: 0.8, music: 0.7, sfx: 0.8, muted: false, calm: false });
  assert.equal(perceptual(0.5), 0.25); assert.equal(perceptual(3), 1);
});

test('save schema: masterVol + muted validated, defaults kept', () => {
  assert.equal(defaultSettings().masterVol, 0.8); assert.equal(defaultSettings().muted, false);
  const d = sanitize({ settings: { masterVol: 5, muted: 1 } });
  assert.equal(d.settings.masterVol, 1); assert.equal(d.settings.muted, false);
  assert.equal(sanitize({ settings: { masterVol: 0.35, muted: true } }).settings.muted, true);
  assert.equal(sanitize({ settings: { masterVol: '0.3' } }).settings.masterVol, 0.8);
});

test('mute / hidden gate: master is silent when muted or hidden', () => {
  assert.equal(masterGain(0.8, false, false), perceptual(0.8));
  assert.equal(masterGain(0.8, true, false), 0);
  assert.equal(masterGain(0.8, false, true), 0);
});

test('ducking math: table values, Calm keeps the evolution duck shallow, unknown kind is null', () => {
  assert.deepEqual(duckTargets('levelup', false), { music: 0.55, sfx: 0.5, hold: 0.6, release: 0.5 });
  assert.equal(duckTargets('evolve', false).music, 0.06);
  assert.equal(duckTargets('evolve', true).music, 0.4); assert.equal(duckTargets('evolve', true).sfx, 0.4);
  assert.equal(duckTargets('levelup', true).music, 0.55);
  assert.equal(duckTargets('nope', false), null);
});

test('voice budget: gap folds into the next play (sqrt, max 1.5x), per-cue cap, global cap, tier 0 always plays', () => {
  const r1 = () => 1;
  const b = new VoiceBudget(CUES);
  assert.equal(b.request('wolf_bite', 0, false, 1, r1), 1); b.commit('wolf_bite', 1);
  assert.equal(b.request('wolf_bite', 0.01, false, 1, r1), 0, 'inside the gap: folded');
  assert.equal(b.request('wolf_bite', 0.02, false, 2, r1), 0);
  assert.equal(b.merged, 3);
  assert.equal(b.request('wolf_bite', 0.1, false, 1, r1), 1.5, 'sqrt(1+3) = 2 capped at 1.5'); b.commit('wolf_bite', 1);
  assert.ok(Math.abs(b.request('wolf_bite', 0.18, false, 2, r1) - Math.sqrt(2)) < 1e-9); b.commit('wolf_bite', 1);
  assert.equal(b.request('wolf_bite', 0.26, false, 1, r1), 0, 'per-cue cap 3 live'); assert.equal(b.dropped, 1);
  assert.equal(b.request('wolf_bite', 1.01, false, 1, r1), 1, 'voices ended: room again'); assert.equal(b.active, 0);
  assert.equal(b.request('nope', 0), 0);
  // global cap: fill with many cue ids
  const many = {}; for (let i = 0; i < 40; i++) many['c' + i] = { cap: 3, gap: 0, pri: 2 };
  many.moment = { cap: 1, gap: 0, pri: 0 };
  const g = new VoiceBudget(many);
  let ok = 0; for (let i = 0; i < 40; i++) if (g.request('c' + i, 1, false, 1, r1) > 0) { g.commit('c' + i, 5); ok++; }
  assert.equal(ok, GLOBAL_CAP); assert.equal(g.active, GLOBAL_CAP);
  assert.ok(g.request('moment', 1, false, 1, r1) > 0, 'tier 0 ignores the global cap');
  const c = new VoiceBudget(many);
  ok = 0; for (let i = 0; i < 40; i++) if (c.request('c' + i, 1, true, 1, r1) > 0) { c.commit('c' + i, 5); ok++; }
  assert.equal(ok, CALM_CAP, 'Calm caps at 12');
  assert.ok(Math.abs(c.request('c0', 6, true, 1, r1) - 0.7) < 1e-9, 'Calm hits -3 dB');
  g.prune(6); assert.equal(g.active, 0); assert.equal(g.st.c0.live, 0, 'prune releases per-cue counts');
});

test('horde: 400 hits a second for 3 s stays under the cap', () => {
  const b = new VoiceBudget(CUES), ids = Object.values(HIT_CUE).concat('gem');
  let t = 0;
  for (let k = 0; k < 300; k++, t += 0.01) for (let i = 0; i < 4; i++) { const id = ids[(k * 4 + i) % ids.length]; if (b.request(id, t) > 0) b.commit(id, t + 0.3); }
  assert.ok(b.peak <= GLOBAL_CAP); assert.ok(b.played > 50); assert.equal(b.played + b.merged + b.dropped, 1200);
});

test('every weapon maps to a cue in the table; every cue has a synth', () => {
  const w = JSON.parse(readFileSync(new URL('../src/data/weapons.json', import.meta.url), 'utf8'));
  for (const id of Object.keys(w.weapons || w)) assert.ok(CUES[HIT_CUE[id]], id);
  const src = ['engine.js', 'cues.js'].map((f) => readFileSync(new URL('../src/audio/' + f, import.meta.url), 'utf8')).join(' ');
  for (const id of Object.keys(CUES)) { const k = id.replace(/^(evo|tell)_(?=.)/, ''); assert.ok(src.includes(`case '${k}'`) || (id.startsWith('tell_') && src.includes(`'${k}'`)), id); }
});

function fakeEnv() {
  const L = {}, on = (o) => (t, f) => { (L[o + t] ||= []).push(f); };
  const fire = (o, t, e = {}) => (L[o + t] || []).forEach((f) => f({ type: t, ...e }));
  let made = 0;
  class Param { constructor() { this.value = 0; } setTargetAtTime(v) { this.value = v; } cancelScheduledValues() {} setValueAtTime() {} exponentialRampToValueAtTime() {} linearRampToValueAtTime() {} }
  const node = () => ({ gain: new Param(), threshold: new Param(), ratio: new Param(), attack: new Param(), release: new Param(), frequency: new Param(), Q: new Param(), detune: new Param(), connect(n) { return n; }, disconnect() {}, start() {}, stop() {} });
  class AC { constructor() { made++; this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; }
    createGain() { return node(); } createDynamicsCompressor() { return node(); } createConvolver() { return node(); }
    createOscillator() { return node(); } createBiquadFilter() { return node(); } createBufferSource() { return node(); }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; } resume() { this.state = 'running'; return Promise.resolve(); } suspend() { this.state = 'suspended'; return Promise.resolve(); } }
  const win = { AudioContext: AC, addEventListener: on('w'), navigator: {}, setInterval: () => 1, clearInterval() {} };
  const doc = { hidden: false, addEventListener: on('d') };
  return { win, doc, fire, made: () => made };
}

test('unlock: no context until a gesture; Esc does not count; hidden / blur go quiet and suspend', () => {
  const E = fakeEnv();
  const a = createAudio(E.win, E.doc);
  assert.equal(E.made(), 0); assert.equal(a.play('gem'), false, 'no sound before a gesture');
  E.fire('w', 'keydown', { key: 'Escape' }); assert.equal(E.made(), 0);
  E.fire('w', 'pointerdown'); assert.equal(E.made(), 1); assert.ok(a.ready);
  E.fire('w', 'keydown', { key: 'a' }); assert.equal(E.made(), 1, 'one context only');
  a.configure({ masterVol: 1 });
  assert.equal(a.master.gain.value, 1);
  E.doc.hidden = true; E.fire('d', 'visibilitychange'); assert.equal(a.master.gain.value, 0); assert.equal(a.ctx.state, 'suspended'); assert.equal(a.play('gem'), false);
  E.doc.hidden = false; E.fire('d', 'visibilitychange'); assert.equal(a.master.gain.value, 1);
  E.fire('w', 'blur'); assert.equal(a.master.gain.value, 0); E.fire('w', 'focus'); assert.equal(a.master.gain.value, 1);
  a.configure({ masterVol: 1, muted: true }); assert.equal(a.master.gain.value, 0); assert.equal(a.play('gem'), false);
});

test('M key toggles mute (not while typing, not with modifiers or repeats)', () => {
  assert.equal(isMuteKey({ code: 'KeyM', key: 'm', target: { tagName: 'BUTTON' } }), true);
  assert.equal(isMuteKey({ code: 'KeyM', key: 'm', target: { tagName: 'input' } }), false);
  assert.equal(isMuteKey({ code: 'KeyM', key: 'm', target: { isContentEditable: true } }), false);
  assert.equal(isMuteKey({ code: 'KeyM', key: 'm', ctrlKey: true }), false);
  assert.equal(isMuteKey({ code: 'KeyM', key: 'm', repeat: true }), false);
  assert.equal(isMuteKey({ code: 'KeyN', key: 'n' }), false);
  const E = fakeEnv(); const log = [];
  createAudio(E.win, E.doc, { onMute: (m) => log.push(m) });
  E.fire('w', 'keydown', { code: 'KeyM', key: 'm' });
  assert.deepEqual(log, [true]);
});

test('engine never imports the sim and never uses the sim RNG', () => {
  for (const f of ['budget.js', 'engine.js', 'index.js', 'music.js', 'cues.js']) {
    const src = readFileSync(new URL('../src/audio/' + f, import.meta.url), 'utf8');
    assert.ok(!/sim\/|rng|innerHTML/.test(src), f);
  }
  assert.equal(typeof AudioEngine, 'function');
});
