import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseParams, FLAGS_ON, FLAGS_OFF, KNOWN_KEYS } from '../src/params.js';

test('params: defaults with an empty query', () => {
  const p = parseParams('');
  assert.equal(p.auto, null); assert.equal(p.seed, null); assert.equal(p.startTime, 0); assert.equal(p.rerolls, 0); assert.equal(p.banishes, 0);
  for (const k of FLAGS_ON) assert.equal(p[k], true, k);
  for (const k of FLAGS_OFF) assert.equal(p[k], false, k);
  assert.equal(p.grant, null); assert.equal(p.bless, null); assert.equal(p.bright, null); assert.equal(p.meta, null); assert.equal(p.touch, null); assert.equal(p.flat, false);
});

test('params: every on-flag turns off only with =0; every off-flag turns on only with =1', () => {
  for (const k of FLAGS_ON) { assert.equal(parseParams(`?${k}=0`)[k], false, k); assert.equal(parseParams(`?${k}=1`)[k], true, k); }
  for (const k of FLAGS_OFF) { assert.equal(parseParams(`?${k}=1`)[k], true, k); for (const bad of ['0', 'true', 'yes', '2', '']) assert.equal(parseParams(`?${k}=${bad}`)[k], false, k + '=' + bad); }
});

test('params: numbers are clamped finite integers; junk falls back', () => {
  assert.equal(parseParams('?seed=abc').seed, null);
  assert.equal(parseParams('?seed=').seed, null);
  assert.equal(parseParams('?seed=-5').seed, 0);
  assert.equal(parseParams('?seed=99999999999999').seed, 2147483647);
  assert.equal(parseParams('?seed=Infinity').seed, null);
  assert.equal(parseParams('?seed=12.7').seed, 12);
  assert.equal(parseParams('?t=NaN').startTime, 0);
  assert.equal(parseParams('?t=-30').startTime, 0);
  assert.equal(parseParams('?t=540').startTime, 540);
  assert.equal(parseParams('?t=1e9').startTime, 1200);
  assert.equal(parseParams('?rr=1e9').rerolls, 99);
  assert.equal(parseParams('?ban=-1').banishes, 0);
  assert.equal(parseParams('?rr=3&ban=2').rerolls, 3);
});

test('params: enums and strings accept only known / well-formed values', () => {
  assert.equal(parseParams('?bright=clear').bright, 'clear');
  assert.equal(parseParams('?bright=<script>').bright, null);
  assert.equal(parseParams('?meta=full').meta, 'full');
  assert.equal(parseParams('?meta=everything').meta, null);
  assert.equal(parseParams('?touch=1').touch, '1'); assert.equal(parseParams('?touch=maybe').touch, null);
  assert.equal(parseParams('?ground=flat').flat, true); assert.equal(parseParams('?ground=shader').flat, false);
  assert.equal(parseParams('?auto=wren').auto, 'wren');
  for (const bad of ['..%2F..%2Fx', '<img>', 'a b', 'x'.repeat(40), '__proto__ ']) assert.equal(parseParams('?auto=' + bad).auto, null, bad);
  assert.equal(parseParams('?grant=ghost_wolves:speed=5,power=5:phantom_stampede').grant, 'ghost_wolves:speed=5,power=5:phantom_stampede');
  assert.equal(parseParams('?grant=' + encodeURIComponent('<b>x</b>')).grant, null);
  assert.equal(parseParams('?grant=' + 'a'.repeat(301)).grant, null);
  assert.equal(parseParams('?bless=wider_glow:2;kind_fortune:3').bless, 'wider_glow:2;kind_fortune:3');
  assert.equal(parseParams('?bless=%22%3E').bless, null);
});

test('params: KNOWN_KEYS covers every query key the source reads', () => {
  const files = ['src/app.js', 'src/entry.js', 'src/params.js', 'src/gfx/style.js', 'src/scenes/RunScene.js', 'src/main.js'];
  const found = new Set();
  for (const f of files) for (const m of fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8').matchAll(/\bq\.get\('([a-z]+)'\)|\.get\('(mem|style)'\)/g)) found.add(m[1] || m[2]);
  for (const k of found) assert.ok(KNOWN_KEYS.includes(k) || k === 't', `unlisted param ${k}`);
  for (const k of KNOWN_KEYS) { assert.ok(/^[a-z]+$/.test(k)); }
});

test('params: prototype keys cannot leak into the parsed result', () => {
  const p = parseParams('?__proto__=1&constructor=1&toString=1');
  assert.equal(Object.keys(p).includes('__proto__'), false);
  assert.equal(p.constructor, Object);
});

import { sanitize, defaultSettings } from '../src/save/schema.js';
test('settings: every setting key survives hostile values (object, string, NaN, array, null) by falling back to a valid default', () => {
  const d = defaultSettings();
  for (const bad of [{ a: 1 }, 'x'.repeat(50), NaN, [1], null, 1e99, -1e99, '__proto__']) {
    const settings = {}; for (const k of Object.keys(d)) settings[k] = bad;
    const out = sanitize({ version: 2, settings }).settings;
    assert.deepEqual(Object.keys(out).sort(), Object.keys(d).sort());
    for (const k of Object.keys(d)) {
      assert.equal(typeof out[k], typeof d[k], k);
      if (typeof d[k] === 'number') assert.ok(Number.isFinite(out[k]) && out[k] >= 0 && out[k] <= 1, k);
      if (typeof d[k] === 'string') assert.equal(out[k], d[k], k + ' must fall back to its default for ' + String(bad).slice(0, 10));
    }
  }
});

import { readFileSync } from 'node:fs';
test('Space presses outside a running sim (pause, level-up cards, end screen) are drained so they never queue an ability', () => {
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.ok(/else if \(\(this\.paused \|\| this\.introOpen \|\| sim\.state !== 'running'\) && this\.scene\.drainAbilityKey\) this\.scene\.drainAbilityKey\(\)/.test(app));
  const scene = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(/drainAbilityKey\(\) \{[^}]*JustDown\(k\.SPACE\)/.test(scene));
});
