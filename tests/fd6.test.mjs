// FD6: controller stub (pure pad model) + back rules. Menus only; the pad never moves the hero.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PAD_KEYS, heldKeys, createPad, REPEAT_FIRST, REPEAT_NEXT } from '../src/ui/padmap.js';

const pad = (pressed = [], axes = [0, 0]) => ({ mapping: 'standard', buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i), value: 0 })), axes });

test('mapping: D-pad = arrows, A = Enter, B = Esc, Y = T, LB / RB = PageUp / PageDown', () => {
  assert.deepEqual(heldKeys(pad([12])), ['ArrowUp']);
  assert.deepEqual(heldKeys(pad([13])), ['ArrowDown']);
  assert.deepEqual(heldKeys(pad([14])), ['ArrowLeft']);
  assert.deepEqual(heldKeys(pad([15])), ['ArrowRight']);
  assert.deepEqual(heldKeys(pad([0])), ['Enter']);
  assert.deepEqual(heldKeys(pad([1])), ['Escape']);
  assert.deepEqual(heldKeys(pad([3])), ['t']);
  assert.deepEqual(heldKeys(pad([4])), ['PageUp']);
  assert.deepEqual(heldKeys(pad([5])), ['PageDown']);
  assert.deepEqual(Object.keys(PAD_KEYS).sort(), ['0', '1', '12', '13', '14', '15', '3', '4', '5'].sort());
});

test('left stick: dead zone, dominant axis only', () => {
  assert.deepEqual(heldKeys(pad([], [0.3, -0.3])), []);
  assert.deepEqual(heldKeys(pad([], [-0.9, 0.2])), ['ArrowLeft']);
  assert.deepEqual(heldKeys(pad([], [0.1, 0.9])), ['ArrowDown']);
  assert.deepEqual(heldKeys(pad([], [0.8, 0.8])), ['ArrowRight']);
});

test('hostile pad shapes yield nothing and never throw', () => {
  for (const p of [null, undefined, 5, 'x', {}, { mapping: 'standard' }, { mapping: 'standard', buttons: 'zz', axes: 'zz' }, { mapping: 'standard', buttons: [null, 7], axes: [NaN, Infinity] }, { mapping: '', buttons: [{ pressed: true }] }]) {
    assert.deepEqual(heldKeys(p), []);
  }
  assert.deepEqual(createPad().step('nope', 0.016), []);
  assert.deepEqual(createPad().step([null, 3], NaN), []);
});

test('edges: a button fires once per press; arrows repeat after a hold; release re-arms', () => {
  const p = createPad();
  assert.deepEqual(p.step([pad([0])], 0.016), ['Enter']);
  assert.deepEqual(p.step([pad([0])], 5), [], 'Enter never repeats');
  assert.deepEqual(p.step([pad()], 0.016), []);
  assert.deepEqual(p.step([pad([0])], 0.016), ['Enter']);
  const q = createPad();
  assert.deepEqual(q.step([pad([13])], 0.016), ['ArrowDown']);
  assert.deepEqual(q.step([pad([13])], REPEAT_FIRST - 0.1), []);
  assert.deepEqual(q.step([pad([13])], 0.2), ['ArrowDown']);
  assert.deepEqual(q.step([pad([13])], REPEAT_NEXT + 0.01), ['ArrowDown']);
});

test('wiring: pad is menus-only (reset while a run is playing), no innerHTML, night screen takes PageUp / PageDown', () => {
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /if \(playing\) \{ pad\.reset\(\); return; \}/);
  const pm = readFileSync(new URL('../src/ui/padmap.js', import.meta.url), 'utf8');
  assert.doesNotMatch(pm, /innerHTML|outerHTML|insertAdjacentHTML|eval\(|Function\(/);
  assert.match(readFileSync(new URL('../src/ui/nightsui.js', import.meta.url), 'utf8'), /PageUp.*PageDown/);
});
