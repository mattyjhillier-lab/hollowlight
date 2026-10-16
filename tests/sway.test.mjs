import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cellProps, SwayField, CELL, HERO_CLEAR, SPAWN_MARGIN, KEEP_MARGIN, AMP, WOBBLE, PHONE_DENSITY, ENTER } from '../src/gfx/swayfield.js';
import { SwayLayer, SWAY_DEPTH } from '../src/gfx/swaylayer.js';
import { drawAmbAtlas, FRAME_NAMES, FRAME_COUNT, ATLAS_COLS, ATLAS_ROWS, FRAME_PX } from '../src/gfx/ambatlas.js';
import { CAPS } from '../src/gfx/quality.js';
import { zoneB } from '../src/world/zones.js';
import { REDUCED_SCALE } from '../src/gfx/wind.js';

const alive = { sample: () => 1 };
const dead = { sample: () => 0 };
const view = (x, y, w = 560, h = 320) => ({ x0: x, y0: y, x1: x + w, y1: y + h });
const zone = (x, y) => zoneB(x, y, 4000);
const mk = (cap, o = {}) => { const f = new SwayField({ seed: 7, zone, ...o }); f.setBudget(cap); return f; };

test('cellProps: deterministic, inside the world, unique ids, zone-aware', () => {
  const ids = new Set();
  let flowersInB = 0; let fernsInA = 0; let n = 0;
  for (let cj = 0; cj < 62; cj++) for (let ci = 0; ci < 62; ci++) {
    const a = cellProps(ci, cj, 5, zone);
    assert.deepEqual(a, cellProps(ci, cj, 5, zone));
    for (const p of a) {
      n++;
      assert.ok(p.x >= 40 && p.x <= 3960 && p.y >= 40 && p.y <= 3960, 'inside world');
      assert.ok(Math.floor(p.x / CELL) === ci && Math.floor(p.y / CELL) === cj, 'inside its cell');
      assert.ok(!ids.has(p.id), 'unique id');
      ids.add(p.id);
      assert.ok(p.frame >= 0 && p.frame < FRAME_COUNT);
      const zb = zoneB(p.x, p.y, 4000);
      if (zb >= 0.5 && p.flower) flowersInB++;
      if (zb >= 0.5 && p.frame < 3) fernsInA++;
    }
  }
  assert.ok(n > 3000);
  assert.equal(flowersInB, 0);
  assert.equal(fernsInA, 0);
  assert.notDeepEqual(cellProps(10, 10, 1), cellProps(10, 10, 2)); // seed changes the layout
});

test('caps per tier: sway sprites never exceed CAPS (High 64 / Med 36 / Low 0), phone x0.6', () => {
  assert.equal(CAPS.high.ambient.sway, 64);
  assert.equal(CAPS.med.ambient.sway, 36);
  assert.equal(CAPS.low.ambient.sway, 0);
  for (const tier of ['high', 'med', 'low']) {
    const f = mk(CAPS[tier].ambient.sway);
    f.refresh(view(1000, 1000, 1000, 800), { x: 1300, y: 1300 }, alive);
    assert.ok(f.count <= CAPS[tier].ambient.sway, tier);
    if (tier === 'low') assert.equal(f.count, 0);
    else assert.equal(f.count, CAPS[tier].ambient.sway); // a big restored view fills the budget
  }
  const ph = new SwayField({ seed: 7 });
  ph.setBudget(64, PHONE_DENSITY);
  ph.refresh(view(1000, 1000, 1000, 800), null, alive);
  assert.ok(ph.count <= Math.floor(64 * PHONE_DENSITY) && ph.count > 0);
});

test('bounds: placed only in the spawn margin, never in the hero clear zone', () => {
  const f = mk(64);
  const hero = { x: 1280, y: 1160 };
  const v = view(1000, 1000);
  f.refresh(v, hero, alive);
  assert.ok(f.count > 20);
  for (const s of f.slots.values()) {
    const p = s.prop;
    assert.ok(p.x >= v.x0 - SPAWN_MARGIN && p.x <= v.x1 + SPAWN_MARGIN && p.y >= v.y0 - SPAWN_MARGIN && p.y <= v.y1 + SPAWN_MARGIN);
    assert.ok(Math.hypot(p.x - hero.x, p.y - hero.y) >= HERO_CLEAR);
  }
});

test('the Hollow stays still: no life, no sprites; sprites fade and release as colour fades', () => {
  const f = mk(64);
  f.refresh(view(1000, 1000), null, dead);
  assert.equal(f.count, 0);
  const life = { v: 1, sample() { return this.v; } };
  f.refresh(view(1000, 1000), null, life);
  assert.ok(f.count > 10);
  f.step(0.5, 1, null, life);
  f.step(0.5, 1.5, null, life);
  assert.ok([...f.slots.values()].every((s) => s.alpha > 0.5));
  life.v = 0;
  for (let i = 0; i < 80; i++) f.step(0.05, 2 + i * 0.05, null, life);
  assert.ok([...f.slots.values()].every((s) => s.alpha === 0));
  f.refresh(view(1000, 1000), null, life);
  assert.equal(f.count, 0);
});

test('recycling by camera view: moving far away releases the old sprites, count stays <= cap', () => {
  const f = mk(40);
  let live = 0;
  let peak = 0;
  f.onAdd = () => { live++; peak = Math.max(peak, live); };
  f.onRemove = () => { live--; };
  for (let i = 0; i < 40; i++) {
    const v = view(300 + i * 80, 500 + i * 30);
    f.refresh(v, { x: v.x0 + 280, y: v.y0 + 160 }, alive);
    assert.ok(f.count <= 40);
    for (const s of f.slots.values()) {
      const p = s.prop;
      assert.ok(p.x >= v.x0 - KEEP_MARGIN - 1 && p.x <= v.x1 + KEEP_MARGIN + 1 && p.y >= v.y0 - KEEP_MARGIN - 1 && p.y <= v.y1 + KEEP_MARGIN + 1, 'inside keep margin');
    }
  }
  assert.equal(live, f.count);
  assert.ok(peak <= 40);
});

test('hero clear zone fades existing sprites; lean is bounded, slow, reduced-motion quartered', () => {
  const f = mk(64);
  const hero = { x: 1280, y: 1160 };
  f.refresh(view(1000, 1000), null, alive);
  for (let i = 0; i < 40; i++) f.step(0.05, 10 + i * 0.05, hero, alive);
  let inside = 0;
  for (const s of f.slots.values()) {
    const d = Math.hypot(s.prop.x - hero.x, s.prop.y - hero.y);
    if (d < HERO_CLEAR) { inside++; assert.ok(s.alpha < 0.01, 'invisible inside the clear zone'); }
  }
  assert.ok(inside > 0, 'test has sprites inside the zone');
  const g = mk(64);
  g.refresh(view(1000, 1000), null, alive);
  const gr = mk(64);
  gr.refresh(view(1000, 1000), null, alive);
  let mx = 0;
  let mr = 0;
  let jump = 0;
  let prev = null;
  for (let i = 0; i < 2400; i++) { // 120 s at 20 Hz
    const t = i * 0.05;
    g.step(0.05, t, null, alive, false);
    gr.step(0.05, t, null, alive, true);
    const a = [...g.slots.values()][3];
    if (prev !== null) jump = Math.max(jump, Math.abs(a.ang - prev));
    prev = a.ang;
    for (const s of g.slots.values()) mx = Math.max(mx, Math.abs(s.ang));
    for (const s of gr.slots.values()) mr = Math.max(mr, Math.abs(s.ang));
  }
  assert.ok(mx <= AMP + WOBBLE + 1e-9 && mx > 0.05);
  assert.ok(mr <= (AMP + WOBBLE) * REDUCED_SCALE + 1e-9 && mr > 0);
  assert.ok(jump < 0.03, 'no flicker: max angle change per 50 ms step ' + jump);
});

test('visual only: deterministic per seed, never imports the sim or uses Math.random', () => {
  const run = (seed) => {
    const f = mk(64, { seed });
    f.refresh(view(1000, 1000), null, alive);
    f.step(0.05, 3, null, alive);
    return [...f.slots.values()].map((s) => [s.prop.id, s.ang]);
  };
  assert.deepEqual(run(3), run(3));
  assert.notDeepEqual(run(3), run(4));
  for (const file of ['swayfield', 'swaylayer', 'ambatlas']) {
    const src = readFileSync(new URL(`../src/gfx/${file}.js`, import.meta.url), 'utf8');
    assert.ok(!/Math\.random|sim\/rng|from '\.\.\/sim/.test(src.replace(/\/\/.*$/gm, '')), file);
  }
});

test('atlas: layout fits, drawer is NaN-free', () => {
  assert.equal(FRAME_COUNT, ATLAS_COLS * ATLAS_ROWS);
  assert.equal(FRAME_NAMES.length, FRAME_COUNT);
  let bad = 0;
  let calls = 0;
  const W = FRAME_PX * ATLAS_COLS;
  const H = FRAME_PX * ATLAS_ROWS;
  const chk = (a) => { calls++; for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) bad++; };
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createLinearGradient') return (...a) => { chk(a); return { addColorStop() {} }; };
      return (...a) => chk(a);
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  drawAmbAtlas({ width: W, height: H, getContext: () => ctx });
  assert.equal(bad, 0);
  assert.ok(calls > 200);
});

test('SwayLayer pool: images created <= cap, reused after recycling, Low makes none, depth below creatures', () => {
  let made = 0;
  const chain = () => {
    const st = {};
    const o = new Proxy(st, { get(t, k) { return (...a) => { if (k === 'setVisible') t.visible = a[0]; return o; }; } });
    return o;
  };
  const scene = { add: { image: () => { made++; return chain(); } } };
  const lay = new SwayLayer(scene, { seed: 1 });
  const wv = (x, y) => ({ x, y, right: x + 560, bottom: y + 320 });
  const st = { on: true, cap: 36, phone: false, reduced: false };
  for (let i = 0; i < 120; i++) lay.update(0.05, i * 0.05, wv(300 + i * 25, 500 + i * 10), { x: 300 + i * 25 + 280, y: 660 + i * 10 }, alive, st);
  assert.ok(lay.count <= 36 && lay.count > 10);
  assert.ok(made <= 36, 'pool images ' + made);
  assert.equal(lay.all.length, made);
  lay.update(0.05, 9, wv(300, 500), null, alive, { ...st, cap: 0 });
  assert.equal(lay.count, 0);
  const made0 = made;
  const lowLay = new SwayLayer(scene, { seed: 1 });
  for (let i = 0; i < 20; i++) lowLay.update(0.05, i * 0.05, wv(1000, 1000), null, alive, { ...st, cap: CAPS.low.ambient.sway });
  assert.equal(made, made0);
  assert.ok(SWAY_DEPTH < 0, 'below every creature and prop depth');
});

test('enter threshold sane', () => { assert.ok(ENTER > 0.2 && ENTER < 0.6); });
