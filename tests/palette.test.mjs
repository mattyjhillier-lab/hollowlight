import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CSS_VARS, hexStr, gradeAt, ambientAt, fogAt, ARC, PAL } from '../src/gfx/palette.js';

test('style.css :root variables match palette.js', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  for (const [name, val] of Object.entries(CSS_VARS)) {
    const m = root.match(new RegExp(`${name}: *(#[0-9a-fA-F]{6})`));
    assert.ok(m, `${name} missing in style.css`);
    assert.equal(m[1].toLowerCase(), hexStr(val), name);
  }
});

test('palette uses the exact 06 colours', () => {
  assert.equal(hexStr(PAL.teal), '#6fd3c5');
  assert.equal(hexStr(PAL.violet), '#8a5cff');
  assert.equal(hexStr(PAL.gold), '#ffd27a');
});

test('gradeAt clamps and is monotone in warmth at the end', () => {
  assert.equal(gradeAt(-5), gradeAt(0));
  assert.equal(gradeAt(9), gradeAt(1));
  assert.ok(gradeAt(Number.NaN) === gradeAt(0));
  assert.ok((gradeAt(1) >> 16) > (gradeAt(0.6) >> 16));
});

test('ARC: ambient/fog clamp, hit keyframes exactly, night is the darkest ambient', () => {
  assert.equal(ambientAt(-1), 0x6a5a9a);
  assert.equal(ambientAt(0.55), 0x33406c);
  assert.equal(ambientAt(2), 0xffe2c4);
  assert.equal(fogAt(0.95), 0xc88a9a);
  assert.equal(gradeAt(Number.NaN), ARC[0][2]);
  const lum = (c) => (c >> 16 & 255) + (c >> 8 & 255) + (c & 255);
  for (const f of [0, 0.25, 0.8, 0.95, 1]) assert.ok(lum(ambientAt(f)) > lum(ambientAt(0.55)), `f=${f}`);
});
