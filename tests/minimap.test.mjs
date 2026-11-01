// E6 minimap: setting whitelist (hostile values), auto rule, pure geometry, downsample, DOM-free frame logic.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, defaultSave, MINIMAP_MODES } from '../src/save/schema.js';
import { mapOn, toDisc, downsample, Minimap, MM_GRID } from '../src/ui/minimap.js';

test('miniMap setting: default auto, whitelist, hostile values fall back', () => {
  assert.equal(defaultSave().settings.miniMap, 'auto');
  for (const v of MINIMAP_MODES) assert.equal(sanitize({ settings: { miniMap: v } }).settings.miniMap, v);
  for (const v of ['ON', '<img onerror=1>', 1, null, {}, [], '__proto__', true, '']) assert.equal(sanitize({ settings: { miniMap: v } }).settings.miniMap, 'auto');
});
test('mapOn: auto = desktop only', () => {
  assert.equal(mapOn('auto', false), true); assert.equal(mapOn('auto', true), false);
  assert.equal(mapOn('on', true), true); assert.equal(mapOn('off', false), false); assert.equal(mapOn('zzz', false), true);
});
test('toDisc: centre, corners held inside the rim, bad numbers safe', () => {
  const c = toDisc(2000, 2000, 4000, 128); assert.deepEqual([c.x, c.y], [64, 64]);
  const k = toDisc(0, 0, 4000, 128); assert.ok(Math.hypot(k.x - 64, k.y - 64) <= 64 * 0.94 + 1e-9);
  const n = toDisc(NaN, Infinity, 4000, 128); assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
});
test('downsample averages 4x4 blocks and clamps', () => {
  const n = 8, a = new Float32Array(n * n); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) a[j * n + i] = 1; a[7 * n + 7] = 5; a[4 * n + 4] = -3;
  const o = downsample(a, n, 2, new Uint8Array(4));
  assert.equal(o[0], 255); assert.equal(o[1], 0); assert.equal(o[2], 0); assert.ok(o[3] > 0 && o[3] <= 255);
});
// minimal DOM + canvas double: frame() must hide when off, draw when on, never throw on hostile sim data
const ctx2d = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const doc = { createElement: (tag) => { const cl = new Set(); return { tag, width: 0, height: 0, className: '', classList: { add: (c) => cl.add(c), remove: (c) => cl.delete(c), toggle: (c, f) => (f ? cl.add(c) : cl.delete(c)), contains: (c) => cl.has(c) }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, appendChild() {}, getContext: () => { const c = ctx2d(); c.createImageData = (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }); return c; } }; } };
test('Minimap.frame: shown only when on; decorative; hostile data does not throw', () => {
  const m = new Minimap(doc, { appendChild() {} });
  assert.equal(m.root.attrs['aria-hidden'], 'true');
  const life = { n: 256, life: new Float32Array(256 * 256).fill(0.5) };
  const sim = { player: { x: 100, y: 3900 }, boss: null, mini: null, sites: { list: [{ id: 1, kind: 'lamp', state: 'awake', x: 10, y: 10 }, { id: 2, kind: 'road', state: 'done', x: 1, y: 1, lanterns: [{ x: 1, y: 1, lit: true }, { x: 50, y: 50, lit: true }] }, { id: 3, kind: 'knot', state: 'fight', x: NaN, y: 'x' }, { id: 4, kind: 'lamp', state: 'sleep', x: 0, y: 0 }] } };
  m.frame(sim, 0.016, { on: false, life, world: 4000 }); assert.equal(m.shown, false);
  m.frame(sim, 0.016, { on: true, life, world: 4000 }); assert.equal(m.shown, true); assert.ok(m.root.classList.contains('on'));
  sim.boss = { x: 2000, y: 2000, dead: false };
  m.frame(sim, 0.5, { on: true, life, low: false, calm: false, world: 4000 }); m.frame(sim, 0.5, { on: true, life, low: true, calm: true, world: 4000 });
  m.frame({ player: null }, 0.016, { on: true }); assert.equal(m.shown, false);
  assert.equal(MM_GRID, 64);
});
test('minimap.js uses no innerHTML', async () => {
  const { readFileSync } = await import('node:fs');
  assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML/.test(readFileSync(new URL('../src/ui/minimap.js', import.meta.url), 'utf8')));
});
