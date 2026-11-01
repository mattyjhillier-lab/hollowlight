// AU4-AU6: music layer scheduling on the night clock, scene-change cues, boss pulse density, low-HP hysteresis, event -> cue map,
// the read-only enemy watcher, the pause dip and the scheduler (fake AudioContext; no Web Audio in Node).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { musicScene, newScene, sceneCues, pulseHit, lowHpNext, LAYERS, TL, STEP, MusicPlayer } from '../src/audio/music.js';
import { EVENT_CUE, EVO_IDS, SPECIAL } from '../src/audio/cues.js';
import { CUES, AudioEngine } from '../src/audio/engine.js';
import { duckTargets } from '../src/audio/budget.js';

const V = (o) => ({ where: 'run', t: 0, fight: 0, phase: 0, end: '', calm: false, low: false, ...o });
const at = (o) => musicScene(V(o), newScene());

test('night arc: grey dusk -> lanterns -> night (pulse) -> first light bells -> hush -> boss key -> fall -> flood -> lit', () => {
  const g = at({ t: 0 });
  assert.equal(g.name, 'grey'); assert.equal(g.pulse, 0); assert.equal(g.pluck, 0); assert.ok(g.pad < 0.2); assert.equal(g.warmth, 450);
  assert.equal(at({ t: 120 }).name, 'lit_lanterns'); assert.ok(at({ t: 120 }).pluck > 0);
  const n = at({ t: 300 }); assert.equal(n.name, 'night'); assert.ok(n.pulse > 0.3 && n.pulse < 1); assert.equal(n.bell, 0);
  const f = at({ t: 500 }); assert.equal(f.name, 'first_light'); assert.equal(f.bell, 0.15);
  assert.equal(at({ t: 700 }).name, 'night'); assert.equal(at({ t: 700 }).pulse, 1);
  const h = at({ t: 820 }); assert.equal(h.name, 'hush'); assert.equal(h.heart, 1); assert.equal(h.pulse, 0); assert.equal(h.pluck, 0);
  const b = at({ t: 840, fight: 1 }); assert.equal(b.name, 'boss'); assert.equal(b.mode, 'boss'); assert.equal(b.pulse, 1);
  assert.equal(at({ t: 840, fight: 1, end: 'victory' }).name, 'fall');
  const fl = at({ t: 860, fight: 1, end: 'victory' }); assert.equal(fl.name, 'flood'); assert.equal(fl.mode, 'dawn'); assert.ok(fl.birds > 0 && fl.bell > 0.3);
  const lit = at({ t: 900, fight: 1, end: 'victory' }); assert.equal(lit.name, 'lit'); assert.equal(lit.pulse, 0);
  assert.equal(at({ t: 300, end: 'defeat' }).name, 'defeat'); assert.equal(at({ t: 300, end: 'defeat' }).pad, 0);
  assert.equal(at({ t: 850 }).name, 'last', 'a night without a boss fight keeps playing to the timed dawn');
  const m = musicScene({ where: 'menu' }, newScene()); assert.equal(m.name, 'menu'); assert.equal(m.pulse, 0); assert.ok(m.pad > 0);
  const z = musicScene(null, newScene()); assert.equal(z.name, 'menu');
});

test('colour returns: pad warmth rises monotonically through the night; every layer stays in 0..1', () => {
  let last = 0;
  for (let t = 0; t <= TL.hush; t += 15) {
    const s = at({ t }); assert.ok(s.warmth >= last, `t=${t}`); last = s.warmth;
    for (const k of LAYERS) assert.ok(s[k] >= 0 && s[k] <= 1, `${k} at ${t}`);
  }
  assert.ok(at({ t: NaN }).name === 'grey' && at({ t: -50 }).name === 'grey', 'junk clock is safe');
});

test('Calm caps the pulse, thins the birds, halves the hush heartbeat; Low tier drops the birds', () => {
  assert.equal(at({ t: 700, calm: true }).pulse, 0.4);
  assert.equal(at({ t: 820, calm: true }).heart, 0.5);
  assert.ok(Math.abs(at({ t: 880, fight: 1, end: 'victory', calm: true }).birds - 0.4 * at({ t: 880, fight: 1, end: 'victory' }).birds) < 1e-9);
  assert.equal(at({ t: 880, fight: 1, end: 'victory', low: true }).birds, 0);
});

test('scene-change cues: dawn_chorus_1..3, boss key drop, defeat sting, title motif; a fresh run plays none', () => {
  assert.deepEqual(sceneCues('night', 'first_light', 490), ['dawn_chorus_1']);
  assert.deepEqual(sceneCues('night', 'first_light', 570), [], 'started past the sparrows: no first-light chorus');
  assert.deepEqual(sceneCues('night', 'hush', 815), ['dawn_chorus_2']);
  assert.deepEqual(sceneCues('hush', 'boss', 840), ['boss_intro']);
  assert.deepEqual(sceneCues('fall', 'flood', 845), ['dawn_chorus_3']);
  assert.deepEqual(sceneCues('last', 'lit', 900), ['dawn_chorus_3'], 'timed dawn without a fight still floods');
  assert.deepEqual(sceneCues('flood', 'lit', 900), []);
  assert.deepEqual(sceneCues('boss', 'defeat', 850), ['defeat_sting']);
  assert.deepEqual(sceneCues('', 'menu', 0), ['title_motif']);
  assert.deepEqual(sceneCues('menu', 'boss', 840), [], 'a debug run that starts at the boss: no intro');
  assert.deepEqual(sceneCues('', 'boss', 840), []);
  assert.deepEqual(sceneCues('night', 'night', 300), []);
  for (const c of ['dawn_chorus_1', 'dawn_chorus_2', 'dawn_chorus_3', 'boss_intro', 'defeat_sting', 'title_motif']) assert.ok(CUES[c], c);
});

test('boss pulse gets denser by phase; the night pulse follows its layer level', () => {
  const count = (mode, pulse, phase) => { let n = 0; for (let s = 0; s < 32; s++) if (pulseHit(mode, pulse, phase, s)) n++; return n; };
  assert.equal(count('dusk', 0, 0), 0); assert.equal(count('dusk', 0.4, 0), 4); assert.equal(count('dusk', 1, 0), 8);
  const p0 = count('boss', 1, 0), p1 = count('boss', 1, 1), p2 = count('boss', 1, 2);
  assert.ok(p0 < p1 && p1 < p2, `${p0} ${p1} ${p2}`); assert.equal(p2, 32);
});

test('low-HP heartbeat: on under 30 %, off above 35 % (no flicker between)', () => {
  assert.equal(lowHpNext(false, 0.4), false); assert.equal(lowHpNext(false, 0.29), true);
  assert.equal(lowHpNext(true, 0.33), true, 'hysteresis'); assert.equal(lowHpNext(true, 0.36), false);
  assert.equal(lowHpNext(false, 0.32), false); assert.equal(lowHpNext(false, NaN), false);
});

test('every sim event cue and all 15 evo_<id> verbs exist; evo ids match evolutions.json', () => {
  for (const [ev, id] of Object.entries(EVENT_CUE)) assert.ok(CUES[id], `${ev} -> ${id}`);
  const evo = JSON.parse(readFileSync(new URL('../src/data/evolutions.json', import.meta.url), 'utf8'));
  assert.deepEqual([...EVO_IDS].sort(), Object.keys(evo).sort());
  for (const id of EVO_IDS) assert.equal(CUES['evo_' + id].pri, 0);
  const en = JSON.parse(readFileSync(new URL('../src/data/enemies.json', import.meta.url), 'utf8'));
  for (const t of SPECIAL) { assert.ok(en[t] && en[t].ai, t); assert.ok(CUES['tell_' + t], t); }
  for (const k of ['evo', 'hurt', 'swarm', 'ability', 'boss_intro', 'boss_phase', 'chest_open', 'dawn_chorus_3']) assert.equal(CUES[k].pri, 0, k);
  assert.ok(duckTargets('phase', false).music < 0.1); assert.ok(duckTargets('bossfall', false));
});

// ---------- engine with a fake context ----------
function fakeCtx() {
  let nodes = 0;
  class Param { constructor() { this.value = 0; this.v = []; } setTargetAtTime(x) { this.value = x; } cancelScheduledValues() {} setValueAtTime() {} exponentialRampToValueAtTime() {} linearRampToValueAtTime() {} }
  const node = () => { nodes++; return { gain: new Param(), threshold: new Param(), ratio: new Param(), attack: new Param(), release: new Param(), frequency: new Param(), Q: new Param(), detune: new Param(), connect(n) { return n; }, disconnect() {}, start() {}, stop() {} }; };
  const ctx = { state: 'running', currentTime: 0, sampleRate: 8000, destination: {}, createGain: node, createDynamicsCompressor: node, createConvolver: node, createOscillator: node, createBiquadFilter: node, createBufferSource: node,
    createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }), resume() { return Promise.resolve(); }, suspend() { return Promise.resolve(); } };
  let tick = null;
  const win = { setInterval: (f) => { tick = f; return 7; }, clearInterval() {} };
  return { ctx, win, nodes: () => nodes, tick: () => tick && tick() };
}
function engine() { const F = fakeCtx(); const e = new AudioEngine(F.win); e.build(F.ctx); return { e, F }; }

test('event(): each sim event plays its cue; evolve plays the beat then its own verb; unknown events are silent', () => {
  const { e } = engine(), log = [];
  e.play = (id, n, d) => { log.push([id, d || 0]); return true; };
  e.event({ type: 'evolve', id: 'dire_alpha' }); e.event({ type: 'evolve', id: '__proto__' }); e.event({ type: 'bossPhase', phase: 1 }); e.event({ type: 'nope' }); e.event({ type: 'toString' }); e.event(null);
  assert.deepEqual(log, [['evo', 0], ['evo_dire_alpha', 1.8], ['evo', 0], ['boss_phase', 0]]);
});

test('enemy watcher is read-only: new special spawns, rising tells and kills make sounds; the sim snapshot is unchanged', () => {
  const { e } = engine(), log = [];
  e.play = (id, n) => { log.push(id); return true; };
  const sim = { state: 'running', kills: 3, nextId: 10, tells: { stoat_piper: 0 }, enemies: [{ id: 2, type: 'wolf' }] };
  e.watchSim(sim, 0.1); assert.deepEqual(log, [], 'first sight of a sim: baseline only');
  sim.kills = 5; sim.tells.stoat_piper = 1; sim.enemies.push({ id: 12, type: 'bramble_hart' });
  const before = JSON.stringify(sim);
  e.watchSim(sim, 0.3);
  assert.deepEqual(log, ['husk_fade', 'tell_stoat_piper', 'spawn_special']);
  assert.equal(JSON.stringify(sim), before);
  e.watchSim(sim, 0.3); assert.equal(log.length, 3, 'no repeats while nothing changes');
  sim.state = 'levelup'; sim.kills = 9; e.watchSim(sim, 0.3); assert.equal(log.length, 3, 'quiet outside running');
});

test('music player: scheduler makes notes only while running and audible, survives a suspend, pause dips the music, low HP dips sfx', () => {
  const { e, F } = engine();
  const m = e.music, v = V({ t: 700, running: true, hp: 1, paused: false });
  m.frame(v, 0.25); assert.equal(m.sc.name, 'night');
  const n0 = F.nodes(); F.tick(); const n1 = F.nodes(); assert.ok(n1 > n0, 'look-ahead scheduled notes');
  F.ctx.currentTime = 0.05; F.tick(); assert.ok(F.nodes() - n1 < 200, 'no runaway');
  e.set = { ...e.set, muted: true }; const n2 = F.nodes(); F.ctx.currentTime = 5; F.tick(); assert.equal(F.nodes(), n2, 'muted: steps advance, no nodes');
  e.set = { ...e.set, muted: false }; F.ctx.state = 'suspended'; F.ctx.currentTime = 60; F.tick(); assert.equal(F.nodes(), n2, 'suspended: nothing');
  F.ctx.state = 'running'; F.tick(); assert.ok(m.next < F.ctx.currentTime + 0.15 + STEP && m.next > F.ctx.currentTime, 'resynced after a suspend (no burst of late notes)');
  v.paused = true; m.frame(v, 0.25); assert.equal(m.out.gain.value, 0.45); v.paused = false; m.frame(v, 0.25); assert.equal(m.out.gain.value, 1);
  v.hp = 0.2; m.frame(v, 0.01); assert.ok(m.lowOn); assert.equal(e.sfxLow.gain.value, 0.7); assert.equal(m.lowG.gain.value, 1);
  v.hp = 0.33; m.frame(v, 0.01); assert.ok(m.lowOn); v.hp = 0.5; m.frame(v, 0.01); assert.ok(!m.lowOn); assert.equal(e.sfxLow.gain.value, 1);
  v.hp = 0.1; v.end = 'defeat'; m.frame(v, 0.01); assert.ok(!m.lowOn, 'no heartbeat once the run has ended');
  const played = []; e.play = (id) => { played.push(id); return true; };
  v.end = ''; v.t = 820; m.frame(v, 0.25); v.t = 840; v.fight = 1; m.frame(v, 0.25); assert.deepEqual(played, ['dawn_chorus_2', 'boss_intro'], 'night -> hush -> boss key drop');
  assert.ok(m.drone[0].frequency.value < e.hz(-12), 'the drone sinks a tone for the boss');
  v.t = 10; v.fight = 0; m.frame(v, 0.25); assert.deepEqual(played, ['dawn_chorus_2', 'boss_intro'], 'a new run (clock jumps back): no cues');
  m.stop(); assert.equal(m.timer, 0);
});

test('Low tier: music reverb send off; sliders drive the reverb sends and the heartbeat bus', () => {
  const { e } = engine();
  e.configure({ musicVol: 1, sfxVol: 0.5 });
  assert.ok(Math.abs(e.musicVerb.gain.value - 0.35) < 1e-9); assert.ok(Math.abs(e.verbSend.gain.value - 0.35 * 0.25) < 1e-9); assert.equal(e.heartBus.gain.value, 0.25);
  e.frame({ ...V({ t: 0 }), low: true }, null, 0.016); assert.equal(e.musicVerb.gain.value, 0);
});
