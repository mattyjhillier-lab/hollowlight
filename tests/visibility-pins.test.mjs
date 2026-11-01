// WL6d: pins the key constants of the visibility + vibrancy arc so a regression in a number that the contrast harness depends on is caught by `npm test`
// (the harness itself needs Chrome: scripts/wl6-measure.mjs, report docs/design/visibility-arc-measured.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARC_A, arcSample, makeArcOut, lumY, lanternTarget } from '../src/gfx/arc.js';
import { EYE_CAPS, RIM_CAPS, DARK_FLOOR, DARK_FLOOR_DAY, DARK_OFF, DARK_DAY_K, fillTintTable, LIT_STEPS, EYE_FLOOR_A, BLINK_ALPHA, BLINK_LEN, EYE_DEFS, EYE_CORE_TINT, LOOK_MAX, STREAK_CAPS, CLOSE_FAR, CLOSE_NEAR, NEAR_BAND } from '../src/gfx/nightlook.js';
import { VIB_MIN, VIB_LEVELS, vibTarget } from '../src/gfx/vibrancy.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('PIN arc: keyframe times, lantern radii, eye alpha, quiet rims, far-body floor, body K, saturation ramp, dawn wash', () => {
  assert.deepEqual(ARC_A.map((r) => r[0]), [0, 180, 300, 480, 600, 690, 780, 870, 900]);
  assert.deepEqual(ARC_A.map((r) => r[3]), [150, 150, 145, 140, 135, 130, 130, 130, 130]);
  assert.deepEqual(ARC_A.map((r) => r[5]), [1.0, 1.0, 1.0, 0.9, 0.75, 0.70, 0.55, 0.40, 0.30]);
  assert.deepEqual(ARC_A.map((r) => r[6]), [0.30, 0.30, 0.26, 0.21, 0.12, 0, 0, 0, 0]); // WL6b2 quiet rims
  assert.deepEqual(ARC_A.map((r) => r[4]).slice(0, 5), [0.34, 0.34, 0.37, 0.44, 0.47]); // WL6b2 far-body V (0.34 is the G3 floor)
  assert.deepEqual(ARC_A.map((r) => r[7]), [0.80, 0.82, 0.88, 0.95, 1.00, 1.08, 1.16, 1.26, 1.30]);
  assert.deepEqual(ARC_A.map((r) => r[9]), [1, 1, 1, 1, 1, 0.72, 0.72, 0.72, 0.8]);
  assert.equal(ARC_A[0][1], 0x222b54); assert.equal(ARC_A[ARC_A.length - 1][1], 0xffe2c4);
  assert.ok(Math.min(...ARC_A.map((r) => r[4])) >= 0.34, 'G3: far body never darker than the pinned floor');
  assert.ok(ARC_A.every((r) => r[5] >= 0.3), 'G1: eyes always drawn');
});

test('PIN G3/G6: ambient never below Y 0.025, never steps more than 0.004 Y/s except the locked victory flood', () => {
  const o = makeArcOut(); const Y = [];
  for (let t = 0; t <= 900; t++) { arcSample(t, 'normal', false, o); assert.ok(o.y >= 0.025 - 1e-9, `t${t} Y ${o.y}`); Y.push(o.y); }
  for (let t = 5; t <= 870; t++) assert.ok((Y[t] - Y[t - 5]) / 5 <= 0.004 + 1e-9, `5 s average slope at ${t}`); // the last 30 s victory flood is the documented exception (<= 0.0105/s)
  assert.ok(lumY(ARC_A[0][1]) < 0.03);
  assert.equal(lanternTarget(150, true, 0.03), 115); assert.equal(lanternTarget(130, false, 0.5), 130);
});

test('PIN eyes: caps 200/120/40, rim caps 120/60/0, streak caps 60/30/0, inside floor, blink shape, cream core, look clamp, closing-in range, near band', () => {
  assert.deepEqual(EYE_CAPS, { high: 200, med: 120, low: 40 });
  assert.deepEqual(RIM_CAPS, { high: 120, med: 60, low: 0 });
  assert.deepEqual(STREAK_CAPS, { high: 60, med: 30, low: 0 });
  assert.equal(EYE_FLOOR_A, 0.6); assert.equal(BLINK_ALPHA, 0.2); assert.equal(BLINK_LEN, 0.12); assert.equal(LOOK_MAX, 1.0);
  assert.equal(CLOSE_FAR, 260); assert.equal(CLOSE_NEAR, 40); assert.equal(NEAR_BAND, 1.8);
  assert.equal(EYE_CORE_TINT, 0xffe2b0, 'cream core carries luminance (colour-blind safe)');
  assert.ok(EYE_DEFS.crow.core > EYE_DEFS.wolf.core, 'crow core +20%');
});

test('PIN WL6d fixes: dark-type far-body floor (root crawler 0.44) keeps every enemy pixel >= RGB 12 on the real arc; night eye core is pushed 35% toward white', () => {
  assert.equal(DARK_FLOOR.root_crawler, 0.44); assert.equal(DARK_OFF, LIT_STEPS + 1);
  const tab = new Int32Array(2 * (LIT_STEPS + 1)); const o = makeArcOut();
  for (let t = 0; t <= 900; t += 30) {
    arcSample(t, 'normal', false, o);
    fillTintTable(o.farV, o.bodyK, tab); fillTintTable(Math.max(o.farV * DARK_DAY_K, DARK_FLOOR.root_crawler, DARK_FLOOR_DAY / o.bodyK), o.bodyK, tab, DARK_OFF);
    assert.ok((tab[DARK_OFF] & 255) >= Math.round(DARK_FLOOR.root_crawler * o.bodyK * 255) - 1, `t${t}: dark-type far tint keeps its floor`);
    assert.ok((tab[DARK_OFF] & 255) >= Math.round(DARK_FLOOR_DAY * 255) - 1, `t${t}: final V >= the day floor`);
  }
  assert.ok(read('src/gfx/sprites.js').includes('(255 - v) * 0.35'), 'eye core luminance boost (protan)');
});

test('PIN vibrancy: 17 levels 0.66 .. 1.30, formula, ramp endpoints', () => {
  assert.equal(VIB_LEVELS, 17); assert.equal(VIB_MIN, 0.66);
  assert.ok(Math.abs(vibTarget(0.8, 0) - 0.68) < 1e-9); assert.ok(Math.abs(vibTarget(1.3, 1) - 1.3) < 1e-9);
});

test('PIN harness: gate thresholds (eye 3:1, silhouette 6 L*, dark px 12), colour-blind matrices, matrix dimensions, report exists', () => {
  const h = read('scripts/wl6-measure.mjs');
  assert.ok(h.includes('x.eyeCR >= 3 || Math.abs(x.dL) >= 6'), 'G1|G2 thresholds');
  assert.ok(h.includes('d[i] < 12 && d[i + 1] < 12 && d[i + 2] < 12'), 'G3 threshold');
  for (const name of ['protan', 'deutan', 'tritan']) assert.ok(h.includes(`${name}: [`));
  // each Machado matrix keeps neutral grey neutral (row sums ~1)
  const m = /protan: \[([^\]]+)\]/.exec(h)[1].split(',').map(Number); assert.equal(m.length, 9);
  for (let r = 0; r < 3; r++) assert.ok(Math.abs(m[r * 3] + m[r * 3 + 1] + m[r * 3 + 2] - 1) < 0.02, `protan row ${r}`);
  assert.ok(h.includes("VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] }"));
  assert.ok(h.includes('[30, 40, 0], [240, 90, 220], [480, 150, 330], [690, 170, 460], [870, 160, 620]'), 'the 5 moments');
  assert.ok(h.includes("GROUNDS || 'hollow'") && h.includes('corrupt') && h.includes('restored'));
  assert.ok(h.includes('attempt < 3') && h.includes('cells.jsonl'), 'retries + resume file');
  assert.ok(read('docs/design/visibility-arc-measured.md').includes('node scripts/wl6-measure.mjs contrast'));
});
