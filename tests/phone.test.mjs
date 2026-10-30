// PHONE-A: phone gate, scroll-cue maths, and the one safe-area frame (render/UI only; the sim is untouched).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { isPhoneShape, cueFor, PHONE_QUERY } from '../src/ui/phone.js';

test('isPhoneShape: phones and short wide windows yes, desktop windows no', () => {
  assert.equal(isPhoneShape({ w: 915, h: 412, coarse: false }), true);
  assert.equal(isPhoneShape({ w: 844, h: 390, coarse: false }), true);
  assert.equal(isPhoneShape({ w: 1000, h: 460, coarse: false }), true);
  assert.equal(isPhoneShape({ w: 390, h: 844, coarse: true }), true);
  assert.equal(isPhoneShape({ w: 1280, h: 720, coarse: false }), false);
  assert.equal(isPhoneShape({ w: 1920, h: 1080, coarse: false }), false);
  assert.equal(isPhoneShape({ w: 1000, h: 500, coarse: false }), true);
  assert.equal(isPhoneShape({ w: 0, h: 0, coarse: true }), false);
  assert.match(PHONE_QUERY, /pointer: coarse/);
});

test('cueFor: edge cues only while more content lies past that edge', () => {
  assert.equal(cueFor(0, 300, 300), '');
  assert.equal(cueFor(0, 300, 301), '');
  assert.equal(cueFor(0, 300, 500), 'bottom');
  assert.equal(cueFor(100, 300, 500), 'both');
  assert.equal(cueFor(200, 300, 500), 'top');
});

test('every safe-area inset is read from the shared --sa-* frame (no stray env() outside phone.css)', () => {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]);
  const files = walk(new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')).filter((f) => /\.(css|js)$/.test(f) && !/phone\.css$/.test(f));
  const stray = files.filter((f) => /env\(safe-area-inset/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(stray, []);
});

test('phone.css: stage fills the screen under html.phone; desktop rule untouched', () => {
  const css = readFileSync(new URL('../src/ui/phone.css', import.meta.url), 'utf8');
  assert.match(css, /html\.phone #stage \{ width: 100%; height: 100%; aspect-ratio: auto/);
  const base = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.match(base, /width: min\(100%, calc\(\(100vh\) \* 16 \/ 9\)\)/);
});
