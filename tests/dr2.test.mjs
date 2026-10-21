// DR2: the shared telegraph rule (threat test, wolf chevron budget), thorn floor, toad fill cap, slam ring colour, no allocation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { threatens, segDist2, WolfBudget, TELE_FAINT, WOLF_FULL, WOLF_FAINT } from '../src/gfx/telebudget.js';

const P = { x: 0, y: 0, r: 6 };
const wolf = (x, y, dx, dy) => ({ type: 'wolf', x, y, dx, dy, speed: 74, r: 5.1, boss: false, ai: null });

test('DR2 segDist2', () => {
  assert.equal(segDist2(0, 5, -10, 0, 10, 0), 25);
  assert.equal(segDist2(20, 0, -10, 0, 10, 0), 100);
  assert.equal(segDist2(3, 4, 0, 0, 0, 0), 25, 'zero-length segment');
});

test('DR2 wolf lunge threatens only when the locked path passes the hero', () => {
  const L = 74 * 3.2 * 0.6; // ~142 u
  assert.ok(threatens(wolf(-100, 0, 1, 0), P), 'straight at her');
  assert.ok(!threatens(wolf(-100, 40, 1, 0), P), 'passes 40 u wide');
  assert.ok(!threatens(wolf(-100, 0, -1, 0), P), 'away from her');
  assert.ok(!threatens(wolf(-(L + 40), 0, 1, 0), P), 'falls short');
  assert.ok(threatens(wolf(-100, 14, 1, 0), P), 'clips her (14 < 6 + 4.3 + 6)');
});

test('DR2 area / lane / aim tells use their real geometry', () => {
  const toad = { x: 30, y: 0, r: 7, ai: { kind: 'fuse', burstR: 36 }, boss: false };
  assert.ok(threatens(toad, P), 'inside the burst ring');
  assert.ok(!threatens({ ...toad, x: 80 }, P), 'outside the ring');
  const hart = { x: -100, y: 0, dx: 1, dy: 0, r: 11, speed: 60, ai: { kind: 'charger', chargeMul: 3, charge: 1 }, boss: false };
  assert.ok(threatens(hart, P) && !threatens({ ...hart, y: 50 }, P));
  const piper = { x: -90, y: 0, dx: 1, dy: 0, r: 7, ai: { kind: 'ranged', muzzle: 8, shotSpeed: 90, shotLife: 3, shotR: 3 }, boss: false };
  assert.ok(threatens({ ...piper, y: 6 }, P) && !threatens({ ...piper, y: 60 }, P));
  assert.ok(threatens({ boss: true, x: 60, y: 0 }, P) && !threatens({ boss: true, x: 140, y: 0 }, P), 'boss slam ring radius 74');
  assert.equal(threatens(null, P), false); assert.equal(threatens({ ai: { kind: 'fuse', burstR: NaN } }, { x: NaN }), false);
});

test('DR2 data: the real enemy tell parameters match what threatens() assumes', () => {
  const w = data.enemies.wolf;
  assert.ok(w.speed > 0);
  const src = readFileSync(new URL('../src/sim/Sim.js', import.meta.url), 'utf8');
  assert.ok(/WOLF_TELL = 0\.55;/.test(src) && /e\.stT = e\.teleT = this\.wolfTell;/.test(src) && /e\.speed \* 3\.2/.test(src) && /e\.stT = 0\.6;/.test(src), 'wolf tell 0.55 s (+0.1 s with the Almanac Tells lantern, T6), lunge 3.2x for 0.6 s');
  assert.equal(data.enemies.elder_treant.fight.moves.slam.r, 74, 'slam radius 74 (boss.js tells; the renderer tests the tell itself)');
});

test('DR2 wolf budget: 4 full-strength threatening + 6 faint, nearest first', () => {
  const b = new WolfBudget(96);
  for (let i = 0; i < 30; i++) b.add((i + 1) * 100, i % 2 === 0); // even = threatening
  b.plan();
  let full = 0, faint = 0, hidden = 0;
  for (let i = 0; i < b.n; i++) { if (b.mode[i] === 2) full++; else if (b.mode[i] === 1) faint++; else hidden++; }
  assert.equal(full, WOLF_FULL); assert.equal(faint, WOLF_FAINT); assert.equal(hidden, 30 - 10);
  for (let i = 0; i < b.n; i++) if (b.mode[i] === 2) assert.equal(b.thr[i], 1, 'only threatening wolves are full strength');
  assert.equal(b.mode[0], 2, 'the nearest threatening wolf is full'); assert.equal(b.mode[2], 2); assert.equal(b.mode[4], 2); assert.equal(b.mode[6], 2);
  assert.equal(b.mode[8], 1, 'the fifth threatening one is faint');
  assert.equal(b.mode[1], 1, 'a nearer non-threatening one is faint');
  b.reset(); assert.equal(b.n, 0);
  for (let i = 0; i < 200; i++) b.add(i, true);
  assert.equal(b.n, 96, 'hard cap');
  assert.equal(b.add(NaN, true), -1);
});

test('DR2 budget is allocation free after construction', () => {
  const b = new WolfBudget(96);
  for (let rep = 0; rep < 5; rep++) { b.reset(); for (let i = 0; i < 80; i++) b.add(Math.random() * 1e4, Math.random() < 0.5); b.plan(); }
  const before = process.memoryUsage().heapUsed;
  for (let rep = 0; rep < 20000; rep++) { b.reset(); for (let i = 0; i < 60; i++) b.add((i * 37) % 101, (i & 1) === 0); b.plan(); }
  const grew = process.memoryUsage().heapUsed - before;
  assert.ok(grew < 4e6, `heap grew ${grew}`);
});

test('DR2 render rules present: faint alpha, ground chevron, thorn floor, toad cap, slam recolour, no old wolf line', () => {
  const t = readFileSync(new URL('../src/gfx/enemytells.js', import.meta.url), 'utf8');
  assert.equal(TELE_FAINT, 0.28);
  assert.ok(/export function drawWolfChevron/.test(t) && /RIM/.test(t), 'ground chevron with a dark rim');
  assert.ok(/fillCircle\(e\.x, e\.y, R\); g\.fillStyle\(TELL_RO, 0\.12\)/.test(t), 'toad fill capped (0.06 + 0.12) while she is inside');
  assert.ok(/clearly visible|5\.4|3\.6/.test(t) && /RIM, 0\.9/.test(t), 'thorn: bigger body on a near-black rim');
  const rs = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(!/e\.dx \* 55/.test(rs) && !/0xff3b2f/.test(rs), 'the long lunge line + floating triangle are gone');
  assert.ok(/#7a4a1b/.test(rs) && /TELL_RO/.test(rs), 'slam ring recoloured');
  assert.ok(/threatens\(e, p\)/.test(rs));
});

test('DR2 thorn visibility floor: body at least 5 world units across', () => {
  const t = readFileSync(new URL('../src/gfx/enemytells.js', import.meta.url), 'utf8');
  const m = t.match(/THORN_DARK, 1\)\.fillTriangle\(x \+ ux \* (\d+), y \+ uy \* \d+, x - ux \* (\d+) \+ px \* ([\d.]+)/);
  assert.ok(m, 'thorn body triangle found');
  const len = Number(m[1]) + Number(m[2]), half = Number(m[3]);
  assert.ok(len >= 10 && half * 2 >= 5, `body ${len} x ${half * 2}`);
});
