// DESKTOP A1 (docs/design/desktop-v1.md): full-bleed stage on every window + ultrawide safe frame. Pure function and CSS contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { safeFrameInset, SAFE_RATIO } from '../src/ui/desktop.js';

const css = (f) => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8');

test('safe frame: 16:9, 16:10 and portrait get no extra inset; 21:9 is centred 2.1:1', () => {
  assert.equal(safeFrameInset(1920, 1080), 0);
  assert.equal(safeFrameInset(1920, 1001), 0);
  assert.equal(safeFrameInset(1440, 900), 0);
  assert.equal(safeFrameInset(390, 844), 0);
  assert.equal(safeFrameInset(2560, 1440), 0);
  assert.equal(safeFrameInset(2560, 1080), Math.round((2560 - 1080 * SAFE_RATIO) / 2));
  assert.ok(safeFrameInset(2560, 1080) > 140 && safeFrameInset(2560, 1080) < 160);
  assert.equal(safeFrameInset(3440, 1440), Math.round((3440 - 1440 * 2.1) / 2));
});

test('safe frame: bad input never throws and gives 0', () => {
  for (const [w, h] of [[NaN, 1], [1, NaN], [0, 0], [-5, 100], [Infinity, 100], [100, Infinity], [undefined, undefined], ['a', 'b']]) assert.equal(safeFrameInset(w, h), 0);
});

test('stage rule is full-bleed for every window (no html.phone needed), no card frame', () => {
  const s = css('style.css');
  const stage = /#stage\s*\{([^}]*)\}/.exec(s)[1];
  assert.match(stage, /width:\s*100%/); assert.match(stage, /height:\s*100%/);
  assert.doesNotMatch(stage, /aspect-ratio|border-radius|box-shadow/);
  assert.doesNotMatch(/#app\s*\{[^}]*\}/.exec(s)[0], /padding:\s*0 16px/);
});

test('--fx feeds both side insets of the shared safe frame', () => {
  const p = css('ui/phone.css');
  const rule = p.slice(p.indexOf('html:not(.phone) {'));
  assert.ok(rule.includes('--sa-l: max(env(safe-area-inset-left, 0px), var(--fx))'));
  assert.ok(rule.includes('--sa-r: max(env(safe-area-inset-right, 0px), var(--fx))'));
});
