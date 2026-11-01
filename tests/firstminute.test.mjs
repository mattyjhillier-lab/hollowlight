// FM1-FM5 first minute: whisper ladder, offer lines, results teaching, save field, feel budgets. Pure modules only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Whispers, HINT, HINT_MASK, cleanHints, hasBit, withBit, startBits, TIPS_AGAIN, plateFor, partsText, resultTeach, DUR, MOVE_AT, ABILITY_REPEAT, rerollTitle } from '../src/ui/whispers.js';
import { Gate, RateCap, Vibe, VIBE, VIBE_GAP, SHAKE_GAP, gemPopScale, GEM_POP_LIFE, numPop, NUM_POP_S } from '../src/gfx/feel.js';
import { defaultSave, sanitize, parseSave, serializeSave, setTreeDef } from '../src/save/schema.js';
import { SaveStore } from '../src/save/store.js';

const view = (o = {}) => ({ live: true, t: 1, moving: false, gemNear: false, gems: 0, ready: false, uses: 0, hp: 1, busy: false, ...o });
const run = (w, secs, v, dt = 0.1) => { let last = null; for (let t = 0; t < secs; t += dt) last = w.update(dt, typeof v === 'function' ? v(t) : v); return last; };

test('FM1 bits: validated, masked, unknown bits dropped, bad types -> 0', () => {
  assert.equal(cleanHints(5), 5);
  assert.equal(cleanHints(1 << 20 | 3), 3);
  for (const bad of [-1, 1.5, '3', null, undefined, NaN, Infinity, {}, [], 2 ** 60]) assert.equal(cleanHints(bad), 0, String(bad));
  assert.equal(HINT_MASK, (1 << Object.keys(HINT).length) - 1);
  assert.ok(hasBit(withBit(0, 'move'), 'move'));
  assert.equal(withBit(0, '__proto__'), 0);
  assert.equal(hasBit(-1, 'move'), false);
});

test('FM1 ladder is on only for a fresh lantern (or after Show tips again); veterans are never taught', () => {
  assert.equal(startBits(0, 0), TIPS_AGAIN);
  assert.equal(startBits(0, 7), 0, 'an existing lantern with runs stays quiet');
  assert.equal(startBits(TIPS_AGAIN | 2, 3), TIPS_AGAIN | 2);
  const vet = new Whispers({ bits: 0 });
  assert.equal(run(vet, 12, view({ moving: false })), null);
});

test('FM1 move plate: shows after 0.8 s, ends after 1.5 s of walking, marks its bit once', () => {
  const w = new Whispers({ bits: TIPS_AGAIN, input: 'kb', hero: { id: 'wren', ability: 'Rally the Pack' } });
  assert.equal(w.update(0.1, view({ t: 0.5 })), null);
  const p = w.update(0.1, view({ t: MOVE_AT }));
  assert.equal(p && p.id, 'move');
  assert.equal(partsText(p.parts), 'W A S D or arrows to walk');
  assert.ok(hasBit(w.bits, 'move') && w.dirty);
  run(w, 1.6, view({ t: 2, moving: true }));
  assert.equal(w.cur, null, 'walking ended it');
  const w2 = new Whispers({ bits: w.bits });
  assert.equal(run(w2, 10, view({ t: 3 })), null, 'never twice per lantern');
});

test('FM1 one plate at a time, queued in order; waits while a toast is up; times out', () => {
  const w = new Whispers({ bits: TIPS_AGAIN, hero: { id: 'elias', ability: 'Candle Wheel' } });
  let p = w.update(0.1, view({ t: 1, gemNear: true, ready: true }));
  assert.equal(p.id, 'move');
  p = run(w, DUR.move + 0.05, view({ t: 2, gemNear: true, ready: true }));
  assert.equal(p, null, 'gap after a plate');
  p = run(w, 0.8, view({ t: 12, gemNear: true, ready: true, busy: true }));
  assert.equal(p, null, 'busy: next plate waits');
  p = w.update(0.1, view({ t: 13, gemNear: true, ready: true }));
  assert.equal(p.id, 'gems');
  p = w.update(0.1, view({ t: 13.1, gems: 1, ready: true }));
  assert.equal(p, null, 'collecting a gem ended it');
  p = run(w, 0.8, view({ t: 14, ready: true }));
  assert.equal(p.id, 'ability');
  assert.equal(partsText(p.parts), 'Press SPACE: Candle Wheel');
  assert.ok(p.ring);
  p = w.update(0.1, view({ t: 15, ready: false, uses: 1 }));
  assert.equal(p, null, 'using the ability ended it');
});

test('FM1 an unused ability plate repeats once, later, while still ready and unused', () => {
  const w = new Whispers({ bits: TIPS_AGAIN | (1 << HINT.move) | (1 << HINT.gems) });
  assert.equal(w.update(0.1, view({ ready: true })).id, 'ability');
  run(w, DUR.ability + 0.1, view({ ready: true }));
  assert.equal(w.cur, null);
  const p = run(w, ABILITY_REPEAT + 0.5, view({ ready: true }));
  assert.equal(p && p.id, 'ability', 'repeated');
  run(w, DUR.ability + 0.1, view({ ready: true }));
  assert.equal(run(w, ABILITY_REPEAT + 2, view({ ready: true })), null, 'only once');
});

test('FM1 low HP plate; paused / offer open freezes the thread; Tab hides; tips off hides all', () => {
  const w = new Whispers({ bits: TIPS_AGAIN | 0b1110 });
  const p = w.update(0.1, view({ hp: 0.2 }));
  assert.equal(p.id, 'lowhp');
  const age = w.cur.age;
  w.update(1, view({ live: false, hp: 0.2 }));
  assert.equal(w.cur.age, age, 'no burn while not live');
  assert.ok(w.hide());
  assert.equal(w.cur, null);
  const off = new Whispers({ bits: TIPS_AGAIN, tips: false });
  assert.equal(run(off, 5, view({ t: 2 })), null);
});

test('FM1 touch copy follows the current input; switching mid-plate redraws it', () => {
  const w = new Whispers({ bits: TIPS_AGAIN, input: 'touch', hero: { id: 'wren', ability: 'Rally the Pack' } });
  let p = w.update(0.1, view());
  assert.equal(partsText(p.parts), 'Drag on the left side to walk');
  assert.ok(p.ghost);
  assert.ok(w.setInput('kb'));
  p = w.update(0.1, view());
  assert.match(partsText(p.parts), /^W A S D/);
  assert.equal(partsText(plateFor('ability', 'touch', { id: 'wren', ability: 'Rally the Pack' }).parts), 'Tap the wolf: Rally the Pack');
  assert.match(plateFor('move', 'kb').sr, /^W A S D or arrows to walk\. Your spirits/);
});

test('FM1 pickup whisper lines: once each per lantern, ladder only', () => {
  const w = new Whispers({ bits: TIPS_AGAIN });
  assert.equal(w.pickup('heart'), 'Hearts mend the flame.');
  assert.equal(w.pickup('heart'), '');
  assert.equal(w.pickup('magnet'), 'The magnet calls every mote home.');
  assert.equal(w.pickup('__proto__'), '');
  assert.equal(new Whispers({ bits: 0 }).pickup('heart'), '');
});

test('FM2 offer lines: first offer, evolution, slots full, reroll (per unlock, even for veterans); one per screen', () => {
  const w = new Whispers({ bits: TIPS_AGAIN, input: 'kb' });
  assert.equal(w.offer({ start: true, classes: ['evolve'] }), null, 'run-start offers stay clean');
  const a = w.offer({ classes: ['new', 'stat'] });
  assert.equal(a.id, 'offer'); assert.equal(a.title, 'Your light grows'); assert.ok(a.note);
  assert.equal(w.offer({ classes: ['new'] }), null);
  assert.equal(w.offer({ classes: ['stirs', 'stat'] }), null, 'the stirs hint is retired (flow v2)');
  const e = w.offer({ classes: ['stat', 'evolve'] });
  assert.equal(e.id, 'evolve'); assert.equal(e.title, 'Evolution');
  assert.equal(w.offer({ classes: ['stat'], full: true, weaponCard: true }), null, 'a weapon card on offer: not full yet');
  assert.equal(w.offer({ classes: ['stat'], full: true }).id, 'full');
  const vet = new Whispers({ bits: 0, input: 'kb' });
  assert.equal(vet.offer({ classes: ['evolve'] }), null);
  const r = vet.offer({ classes: ['stat'], rerolls: 2, banishes: 1 });
  assert.equal(r.id, 'reroll'); assert.equal(r.title, 'R: new cards  ·  B then a number: banish');
  assert.equal(rerollTitle({ rerolls: 1 }, 'touch'), 'Tap Reroll for new cards');
  assert.equal(new Whispers({ bits: TIPS_AGAIN, tips: false }).offer({ classes: ['evolve'] }), null);
});

test('FM3 results teaching: first death, second death with a lantern ready, first win; none afterwards', () => {
  const st = (runs, wins) => ({ runs, wins });
  const d1 = resultTeach({ won: false, stats: st(1, 0), treeOwned: false, cheapest: null, gold: 40 });
  assert.equal(d1.kind, 'firstDeath'); assert.equal(d1.primaryTree, true); assert.equal(d1.title, 'Your gold is safe');
  const d2 = resultTeach({ won: false, stats: st(2, 0), treeOwned: false, cheapest: { name: 'Warm Hands', gold: 30 }, gold: 75 });
  assert.equal(d2.kind, 'secondDeath'); assert.equal(d2.whisper, 'You have 75 gold: enough for Warm Hands.');
  assert.equal(resultTeach({ won: false, stats: st(2, 0), treeOwned: true, cheapest: { name: 'X', gold: 1 }, gold: 5 }), null, 'a lantern is lit already');
  assert.equal(resultTeach({ won: false, stats: st(2, 0), treeOwned: false, cheapest: null, gold: 5 }), null, 'nothing affordable');
  assert.equal(resultTeach({ won: true, stats: st(3, 1) }).kind, 'firstWin');
  assert.equal(resultTeach({ won: true, stats: st(4, 2) }), null);
  assert.equal(resultTeach({ won: false, stats: st(5, 1) }), null);
  assert.equal(resultTeach({ won: false, stats: null }), null);
});

test('FM1 save: hints field round-trips, forged values are sanitised, settings tips/vibration default on and validate', () => {
  setTreeDef(null, null);
  const d = defaultSave(1);
  assert.equal(d.hints, 0); assert.equal(d.settings.tips, true); assert.equal(d.settings.vibration, true);
  assert.equal(sanitize({ ...d, hints: TIPS_AGAIN | 6 }).hints, TIPS_AGAIN | 6);
  for (const bad of ['7', -3, 1e300, { a: 1 }, [1]]) assert.equal(sanitize({ ...d, hints: bad }).hints, 0);
  assert.equal(sanitize({ ...d, hints: 2 ** 30 + 1 }).hints, 1);
  const s2 = sanitize({ ...d, settings: { ...d.settings, tips: 'no', vibration: 0 } });
  assert.equal(s2.settings.tips, true); assert.equal(s2.settings.vibration, true);
  const s3 = sanitize({ ...d, settings: { ...d.settings, tips: false, vibration: false } });
  assert.equal(s3.settings.tips, false); assert.equal(s3.settings.vibration, false);
  const r = parseSave(JSON.stringify({ ...serializeSave(d), hints: 77, __proto__x: 1 }));
  assert.ok(r.ok); assert.equal(r.save.hints, 77 & HINT_MASK);
});

test('FM1 store.setHints validates and only writes on change', () => {
  const mem = new Map();
  const storage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  const s = new SaveStore(storage);
  s.load();
  let n = 0; s.saveSoon = () => { n++; };
  assert.equal(s.setHints(TIPS_AGAIN), TIPS_AGAIN); assert.equal(n, 1);
  assert.equal(s.setHints(TIPS_AGAIN), TIPS_AGAIN); assert.equal(n, 1);
  assert.equal(s.setHints('x'), 0); assert.equal(s.data.hints, 0);
});

test('FM5 shake gate: one per 0.4 s, a stronger shake may cut in', () => {
  const g = new Gate(SHAKE_GAP);
  assert.ok(g.ok(1, 0.004, true));
  assert.equal(g.ok(1.2, 0.004, true), false);
  assert.ok(g.ok(1.25, 0.008, true), 'stronger cuts in');
  assert.equal(g.ok(1.3, 0.002, true), false);
  assert.ok(g.ok(1.7, 0.002, true));
  assert.equal(g.ok(NaN), false);
});

test('FM4 kill pops capped at 24 per second', () => {
  const c = new RateCap(24);
  let n = 0; for (let i = 0; i < 100; i++) if (c.take(5 + i * 0.001)) n++;
  assert.equal(n, 24);
  assert.ok(c.take(6.01));
});

test('FM5 vibration: guarded, setting, Calm off, hidden off, one buzz per 0.5 s, fixed patterns', () => {
  const calls = [];
  const nav = { vibrate: (p) => { calls.push(p); return true; } };
  let s = { vibration: true, reducedMotion: false }, hidden = false;
  const v = new Vibe(nav, () => s, () => hidden);
  assert.ok(v.buzz('hurt', 1)); assert.deepEqual(calls[0], VIBE.hurt);
  assert.equal(v.buzz('level', 1 + VIBE_GAP / 2), false, 'rate limited');
  assert.ok(v.buzz('evolve', 2)); assert.deepEqual(calls[1], [40, 20, 60]);
  assert.equal(v.buzz('nope', 5), false);
  s = { vibration: false }; assert.equal(v.buzz('hurt', 9), false);
  s = { vibration: true, reducedMotion: true }; assert.equal(v.buzz('hurt', 10), false, 'off under Calm');
  s = { vibration: true }; hidden = true; assert.equal(v.buzz('hurt', 11), false, 'hidden tab');
  assert.equal(new Vibe({}, () => s, () => false).buzz('hurt', 1), false, 'no API (iPhone): silent');
  assert.equal(new Vibe(null, () => s, () => false).buzz('hurt', 1), false);
  assert.equal(new Vibe({ vibrate: () => { throw new Error('x'); } }, () => ({ vibration: true }), () => false).buzz('hurt', 1), false);
  assert.equal(calls.length, 2);
});

test('FM4 pops: gem 1 -> 1.25 -> 0 over 0.15 s; numbers 1.3 -> 1 over 90 ms', () => {
  assert.equal(gemPopScale(0), 1);
  assert.ok(Math.abs(gemPopScale(GEM_POP_LIFE * 0.4) - 1.25) < 1e-9);
  assert.ok(gemPopScale(GEM_POP_LIFE) < 1e-9);
  assert.ok(Math.abs(numPop(0, false) - 1.3) < 1e-9);
  assert.ok(Math.abs(numPop(0, true) - 1.45) < 1e-9);
  assert.equal(numPop(NUM_POP_S, false), 1);
  assert.equal(numPop(-1, false), 1);
});

test('FM security: whisper / plate / results code never uses innerHTML; vibration never reads URL params', () => {
  for (const f of ['src/ui/whispers.js', 'src/ui/whisperplate.js', 'src/gfx/feel.js', 'src/ui/results.js', 'src/ui/cardsui.js']) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML\(|document\.write\(/, f);
  }
  assert.doesNotMatch(readFileSync(new URL('../src/gfx/feel.js', import.meta.url), 'utf8'), /location|URLSearchParams/);
});
