// WL6a: the visibility + vibrancy arc data, the Brightness setting and its validation (docs/design/visibility-arc-v1.md, gates G3 G6).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARC_A, REF_SECONDS, arcSample, makeArcOut, lumY, resolveBrightness, lanternTarget, bossLightRadius, BRIGHTNESS_STORED, BRIGHTNESS_LEVELS } from '../src/gfx/arc.js';
import { sanitize, parseSave, defaultSave, defaultSettings, BRIGHTNESS } from '../src/save/schema.js';
import { SaveStore } from '../src/save/store.js';
import { ambientAt } from '../src/gfx/palette.js';

const o = makeArcOut();
const at = (t, mode = 'normal', calm = false) => ({ ...arcSample(t, mode, calm, o) });

test('table: ascending seconds from 0 to 900, 10 columns per row, design keyframes present', () => {
  assert.equal(ARC_A[0][0], 0);
  assert.equal(ARC_A.at(-1)[0], REF_SECONDS);
  for (let i = 1; i < ARC_A.length; i++) assert.ok(ARC_A[i][0] > ARC_A[i - 1][0]);
  for (const r of ARC_A) assert.equal(r.length, 10);
  assert.equal(at(0).amb, 0x222b54);
  assert.equal(at(600).amb, 0x56609a);
  assert.equal(at(900).amb, 0xffe2c4);
  assert.equal(at(0).lan, 150);
  assert.equal(at(690).lan, 130);
});

test('design luminance table: Y at each keyframe matches the sheet (+-0.003)', () => {
  const Y = [0.027, 0.031, 0.044, 0.074, 0.127, 0.195, 0.283, 0.530, 0.796];
  ARC_A.forEach((r, i) => assert.ok(Math.abs(lumY(r[1]) - Y[i]) < 0.003, `row ${i}: ${lumY(r[1])}`));
});

test('G3 no void: ambient Y >= 0.025 at every second on every brightness; Low tint never black', () => {
  for (const mode of BRIGHTNESS_LEVELS) for (let t = 0; t <= 900; t += 1) { const a = at(t, mode); assert.ok(a.y >= 0.025, `${mode} ${t}: ${a.y}`); assert.ok(((a.low >> 16) & 255) >= 0x60); }
});

test('G6 smooth: ambient Y never falls after 3:00, rises <= 0.004/s (5 s average, 8-bit rounding) to 14:30, flood to dawn <= 0.0105/s', () => {
  const Y = []; for (let t = 0; t <= 900; t++) Y.push(at(t).y);
  for (let t = 5; t <= 900; t++) {
    const slope = (Y[t] - Y[t - 5]) / 5;
    if (t > 185) assert.ok(slope >= -1e-4, `falls at ${t}`);
    assert.ok(slope <= (t <= 870 ? 0.004 : 0.0105), `slope ${slope} at ${t}`);
  }
  assert.ok(Y[180] - Y[0] < 0.005, 'darkness holds 0:00-3:00');
  // no single-second step bigger than one 8-bit channel step of the brightest colour (0.0075 Y)
  for (let t = 1; t <= 870; t++) assert.ok(Math.abs(Y[t] - Y[t - 1]) < 0.0075, `step at ${t}`);
});

test('other columns are smooth and bounded: eye alpha >= 0.3, rim 0 after 11:30, saturation 0.8 -> 1.3, dawn 0 -> 0.3', () => {
  for (let t = 0; t <= 900; t++) {
    const a = at(t);
    assert.ok(a.eyeA >= 0.3 && a.eyeA <= 1);
    assert.ok(a.rimA >= 0 && a.rimA <= 0.85);
    assert.ok(a.sat >= 0.8 && a.sat <= 1.3 && a.dawn >= 0 && a.dawn <= 0.3);
    assert.ok(a.farV >= 0.4 && a.farV <= 0.75 && a.lan >= 130 && a.lan <= 150);
    if (t >= 690) assert.equal(a.rimA, 0);
    assert.ok(a.bodyK >= 0.72 && a.bodyK <= 1 && (t > 600 || a.bodyK === 1));
  }
  assert.equal(at(900).sat, 1.3);
  assert.equal(at(0).sat, 0.8);
});

test('clamps: negative, NaN, huge, strings and undefined fall back to the first or last row', () => {
  assert.equal(at(-50).amb, at(0).amb);
  assert.equal(at(Number.NaN).amb, at(0).amb);
  assert.equal(at(undefined).amb, at(0).amb);
  assert.equal(at('x').amb, at(0).amb);
  assert.equal(at(1e9).amb, at(900).amb);
  assert.equal(at(Infinity).amb, at(900).amb);
  assert.equal(at(10, 'bogus').mode, 'normal');
});

test('Brighter: lifts ambient (<= 1.6x, capped at the dawn colour), far body +0.15; eyes and lantern unchanged', () => {
  for (let t = 0; t <= 900; t += 30) {
    const n = at(t); const b = at(t, 'brighter');
    for (const s of [16, 8, 0]) assert.ok(((b.amb >> s) & 255) >= ((n.amb >> s) & 255));
    assert.ok(((b.amb >> 16) & 255) <= 0xff && ((b.amb >> 8) & 255) <= 0xe2 && (b.amb & 255) <= 0xc4);
    assert.ok(b.y >= n.y);
    assert.ok(b.farV >= n.farV && b.farV <= 1);
    assert.equal(b.eyeA, n.eyeA); assert.equal(b.lan, n.lan); assert.equal(b.rimA, n.rimA);
  }
  assert.ok(at(0, 'brighter').y > at(0).y * 1.5);
});

test('Clear: never darker than the previous (lifted) arc, far body >= 0.62, eyes and rim still drawn', () => {
  for (let t = 0; t <= 900; t += 15) {
    const c = at(t, 'clear');
    const old = ambientAt(t / 900);
    for (const s of [16, 8, 0]) assert.ok(((c.amb >> s) & 255) >= ((old >> s) & 255), `t=${t}`);
    assert.ok(c.farV >= 0.62);
    assert.equal(c.eyeA, at(t).eyeA);
  }
  assert.equal(at(0, 'clear').amb, ambientAt(0));
});

test('Calm motion caps the dawn wash at 0.2 and changes nothing else', () => {
  const n = at(900); const c = at(900, 'normal', true);
  assert.equal(n.dawn, 0.3); assert.equal(c.dawn, 0.2);
  assert.equal(c.amb, n.amb); assert.equal(c.sat, n.sat);
  assert.equal(at(300, 'normal', true).dawn, 0);
});

test('lantern radius: 150 -> 130; low HP never below 115 while dark, eases to 90 as the sky brightens, no step', () => {
  assert.equal(lanternTarget(150, false, 0.03), 150);
  for (let t = 0; t <= 900; t++) {
    const a = at(t);
    const lo = lanternTarget(a.lan, true, a.y);
    if (a.y < 0.08) assert.ok(lo >= 115, `dark low-HP radius at ${t}: ${lo}`);
    assert.ok(lo >= 90 && lo <= 115);
  }
  let prev = lanternTarget(145, true, at(0).y);
  for (let t = 1; t <= 900; t++) { const a = at(t); const lo = lanternTarget(a.lan, true, a.y); assert.ok(Math.abs(lo - prev) <= 2.5, `step ${lo - prev} at ${t}`); prev = lo; }
  assert.equal(bossLightRadius(0.05), 120); assert.equal(bossLightRadius(0.3), 90);
});

test('brightness default and resolution: auto -> Brighter on phones, Normal elsewhere; explicit values win', () => {
  assert.equal(defaultSettings().brightness, 'auto');
  assert.equal(resolveBrightness('auto', true), 'brighter');
  assert.equal(resolveBrightness('auto', false), 'normal');
  assert.equal(resolveBrightness('clear', true), 'clear');
  assert.equal(resolveBrightness('normal', true), 'normal');
  assert.equal(resolveBrightness('x', true), 'brighter');
  assert.deepEqual(BRIGHTNESS, BRIGHTNESS_STORED);
});

test('brightness validation: only the four known strings survive; hostile values fall back to auto, via sanitize, import and the store', () => {
  const bad = ['ultra', '', 'NORMAL', ' clear', 'clear\n', 7, null, undefined, true, [], ['clear'], { v: 'clear' }, '__proto__', 'constructor', 'x'.repeat(100000), Number.NaN, -1, { toString: () => 'clear' }];
  for (const v of bad) assert.equal(sanitize({ settings: { brightness: v } }).settings.brightness, 'auto', String(typeof v));
  for (const v of BRIGHTNESS_STORED) assert.equal(sanitize({ settings: { brightness: v } }).settings.brightness, v);
  const txt = JSON.stringify({ ...defaultSave(), settings: { ...defaultSettings(), brightness: '<img src=x onerror=alert(1)>' } });
  const r = parseSave(txt);
  assert.ok(r.ok); assert.equal(r.save.settings.brightness, 'auto');
  const r2 = parseSave('{"version":2,"settings":{"__proto__":{"brightness":"clear","polluted":true},"brightness":"clear"}}');
  assert.ok(r2.ok); assert.equal(r2.save.settings.brightness, 'clear'); assert.equal(Object.hasOwn(r2.save.settings, 'polluted'), false);
  const old = parseSave(JSON.stringify({ version: 2, settings: { quality: 'high' } }));
  assert.equal(old.save.settings.brightness, 'auto'); assert.equal(old.save.settings.quality, 'high');
  const s = new SaveStore();
  s.setSettings({ brightness: 'nope' }); assert.equal(s.data.settings.brightness, 'auto');
  s.setSettings({ brightness: 'clear' }); assert.equal(s.data.settings.brightness, 'clear');
  s.setSettings({ brightness: { a: 1 } }); assert.equal(s.data.settings.brightness, 'auto');
});

test('arcSample is allocation-free: returns the passed object and 400k calls do not grow the heap', () => {
  const out = makeArcOut();
  assert.equal(arcSample(5, 'normal', false, out), out);
  if (globalThis.gc) globalThis.gc();
  const h0 = process.memoryUsage().heapUsed;
  for (let i = 0; i < 400000; i++) arcSample(i % 900, i & 1 ? 'brighter' : 'clear', false, out);
  assert.ok(process.memoryUsage().heapUsed - h0 < 8e6, 'heap grew');
});

test('visual only: the arc module and the sim never import each other', () => {
  const arc = readFileSync(new URL('../src/gfx/arc.js', import.meta.url), 'utf8');
  assert.ok(!/^import .*(\/sim\/|phaser)/im.test(arc));
  for (const f of ['Sim.js', 'weapons.js', 'cards.js']) assert.ok(!/gfx\/(arc|nightlook)/.test(readFileSync(new URL(`../src/sim/${f}`, import.meta.url), 'utf8')));
});
