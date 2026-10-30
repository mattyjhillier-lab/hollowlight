// FIX4f: the pre-bake crash guard must not trip falsely (two strikes, backgrounding ignored, 'off' expires, legacy values read, per-mode).
import test from 'node:test';
import assert from 'node:assert/strict';
import { guardAllowed, guardStart, guardDone, guardPause, readGuard, guardLabel, OFF_MS } from '../src/gfx/pbguard.js';

const mem = () => { const m = new Map(); return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, v), m }; };
const o = (store, extra = {}) => ({ store, now: 1000, build: 'b1', ...extra });

test('one unfinished start does not switch a mode off; two in a row do', () => {
  const s = mem();
  assert.equal(guardAllowed('ground', o(s)), true);
  guardStart('ground', o(s)); // start 1, never finished (closed tab)
  assert.equal(guardAllowed('ground', o(s)), true, 'one stuck flag is forgiven');
  guardStart('ground', o(s)); // start 2, never finished
  assert.equal(guardAllowed('ground', o(s)), false, 'second consecutive unfinished start = off');
  assert.equal(guardLabel('ground', s), 'off');
});

test('a finished bake clears the strikes', () => {
  const s = mem();
  guardStart('ground', o(s)); guardDone('ground', o(s)); guardStart('ground', o(s));
  assert.equal(guardAllowed('ground', o(s)), true);
  assert.equal(readGuard('ground', s).n, 1);
});

test('backgrounding mid-bake is not a crash', () => {
  const s = mem();
  guardStart('ground', o(s)); guardPause('ground', o(s));
  assert.equal(guardLabel('ground', s), 'ok');
  guardStart('ground', o(s)); guardStart('ground', o(s)); guardPause('ground', o(s));
  assert.equal(readGuard('ground', s).n, 1);
});

test("'off' expires after 24 h and on a new build; ?prebake=1 clears it", () => {
  const s = mem();
  guardStart('full', o(s)); guardStart('full', o(s)); assert.equal(guardAllowed('full', o(s)), false);
  assert.equal(guardAllowed('full', o(s, { now: 1000 + OFF_MS - 5 })), false, 'still off inside 24 h');
  assert.equal(guardAllowed('full', o(s, { now: 1000 + OFF_MS + 5 })), true, 'retried after 24 h');
  guardStart('full', o(s)); guardStart('full', o(s)); assert.equal(guardAllowed('full', o(s)), false);
  assert.equal(guardAllowed('full', o(s, { build: 'b2' })), true, 'a new build retries');
  guardStart('full', o(s)); guardStart('full', o(s)); guardAllowed('full', o(s));
  assert.equal(guardAllowed('full', o(s, { force: true })), true);
  assert.equal(guardLabel('full', s), 'ok');
});

test('modes are independent, legacy plain values are read, junk is ok', () => {
  const s = mem();
  guardStart('full', o(s)); guardStart('full', o(s)); guardAllowed('full', o(s));
  assert.equal(guardAllowed('ground', o(s)), true, 'a full-mode crash never disables ground-only');
  s.set('hollowlight:pb', 'off'); assert.equal(guardAllowed('full', o(s)), true, "legacy 'off' (no time) is expired");
  s.set('hollowlight:pb:ground', 'run'); assert.equal(guardAllowed('ground', o(s)), true, "legacy 'run' = one strike");
  s.set('hollowlight:pb:ground', '{bad'); assert.equal(guardAllowed('ground', o(s)), true);
  s.set('hollowlight:pb:ground', JSON.stringify({ s: 'zzz', n: 99 })); assert.equal(readGuard('ground', s).s, 'ok');
});
