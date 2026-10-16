import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { easeOutBack, BLOOM_ON, BLOOM_OFF, BLOOM_T, BLOOM_RATE, BUD_FLOWER, BUD_TUFT, TUFT_T, HERO_SEE, cellProps, SwayField, ALPHA_LO, ALPHA_HI, EXIT, CELL, HERO_CLEAR, SPAWN_MARGIN, KEEP_MARGIN, AMP, WOBBLE, PHONE_DENSITY, ENTER } from '../src/gfx/swayfield.js';
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

test('AL-1b: lean is capped ~18 deg, readable (typical > old), alpha ramp is narrow (no ghostly half-alpha band), enter above the ramp start', () => {
  assert.ok(AMP + WOBBLE <= 0.32, 'cap ~18 deg');
  assert.ok(ALPHA_HI - ALPHA_LO <= 0.2);
  assert.ok(ENTER >= ALPHA_LO && ENTER < ALPHA_HI && EXIT < ENTER && EXIT <= ALPHA_LO);
  const f = mk(64); f.refresh(view(1000, 1000), null, alive);
  const angs = [];
  for (let i = 0; i < 2400; i++) { f.step(0.05, i * 0.05, null, alive, false); if (i % 20 === 0) for (const s of f.slots.values()) angs.push(Math.abs(s.ang)); }
  angs.sort((a, b) => a - b);
  const med = angs[angs.length >> 1];
  assert.ok(med * 57.3 > 5, 'median lean deg ' + med * 57.3);
  assert.ok(angs[angs.length - 1] * 57.3 <= 18.5);
});

// ---- AL-2 restore-bloom ----
const lifeAt = (v) => ({ v, sample() { return this.v; } });
const run = (f, secs, life, hero = null, t0 = 0, reduced = false) => { for (let i = 0; i < secs * 20; i++) f.step(0.05, t0 + i * 0.05, hero, life, reduced); };

test('AL-2: easeOutBack is bounded, slight overshoot, ends at exactly 1', () => {
  assert.equal(easeOutBack(0), 0);
  assert.equal(easeOutBack(1), 1);
  let mx = 0;
  for (let u = 0; u <= 1.0001; u += 0.01) { const v = easeOutBack(u); assert.ok(Number.isFinite(v) && v >= 0 && v <= 1.15); mx = Math.max(mx, v); }
  assert.ok(mx > 1.02 && mx < 1.12, 'slight overshoot ' + mx);
  assert.equal(Number.isNaN(easeOutBack(NaN)), false);
});

test('AL-2: ground that becomes restored makes buds that pop open, driven by the life rise (not by time)', () => {
  const f = mk(64); const v = view(1000, 1000);
  f.refresh(v, null, lifeAt(0)); // sees the unrestored ground
  assert.equal(f.count, 0);
  const life = lifeAt(0.4); // alive enough to place, not enough to bloom
  f.refresh(v, null, life);
  assert.ok(f.count > 10);
  for (const s of f.slots.values()) { assert.equal(s.bloomed, false); assert.equal(s.sc, s.prop.flower ? BUD_FLOWER : BUD_TUFT); }
  run(f, 5, life);
  for (const s of f.slots.values()) assert.equal(s.bloomed, false, 'time alone does not bloom');
  life.v = 1; // the ground comes alive
  run(f, 0.05, life);
  assert.ok([...f.slots.values()].filter((s) => s.bloomed).length > 0);
  run(f, 4, life);
  for (const s of f.slots.values()) { assert.equal(s.bloomed, true); assert.equal(s.sc, 1); assert.equal(s.rot, 0); }
});

test('AL-2: scrolled-in ground (already restored) is simply open: no pop', () => {
  const f = mk(64); let pops = 0; f.onPop = () => pops++;
  f.refresh(view(1000, 1000), null, lifeAt(1));
  run(f, 2, lifeAt(1));
  for (const s of f.slots.values()) { assert.equal(s.bloomed, true); assert.equal(s.sc, 1); }
  assert.equal(pops, 0);
});

test('AL-2: pop curve bud -> overshoot -> exactly 1; flowers rate-limited', () => {
  const f = mk(64); const v = view(1000, 1000);
  f.refresh(v, null, lifeAt(0)); f.refresh(v, null, lifeAt(0.4));
  const life = lifeAt(1); let pops = 0; f.onPop = () => pops++;
  const flowers = [...f.slots.values()].filter((s) => s.prop.flower);
  assert.ok(flowers.length > 3);
  f.tokens = 0;
  const scs = [];
  for (let i = 0; i < 40; i++) {
    f.step(0.05, i * 0.05, null, life);
    const n = flowers.filter((s) => s.bloomed).length;
    assert.ok(n <= Math.ceil((i + 1) * 0.05 * BLOOM_RATE) + 1, 'rate limit ' + n + ' at ' + i);
    const first = flowers.find((s) => s.bloomed);
    if (first && first.pop >= 0) scs.push(first.sc);
  }
  assert.equal(pops, flowers.filter((s) => s.bloomed).length);
  assert.ok(scs.length > 2 && scs[0] < 0.8);
  assert.ok(Math.max(...scs) > 1.0 && Math.max(...scs) < 1.1);
  run(f, 4, life, null, 3);
  for (const s of f.slots.values()) if (s.prop.flower) assert.equal(s.sc, 1);
  assert.ok(BLOOM_T > 0.3 && BLOOM_T <= 0.6 && TUFT_T <= BLOOM_T);
});

test('AL-2: no popping on life decay; hysteresis re-arms only when invisible', () => {
  const f = mk(64); const v = view(1000, 1000);
  f.refresh(v, null, lifeAt(0)); f.refresh(v, null, lifeAt(0.4));
  const life = lifeAt(1); run(f, 4, life);
  let pops = 0; f.onPop = () => pops++;
  for (let i = 0; i < 25 * 20; i++) { // linear fade 1 -> 0 over 25 s
    life.v = Math.max(0, 1 - i / (25 * 20));
    f.step(0.05, i * 0.05, null, life);
    for (const s of f.slots.values()) if (s.alpha > 0.06) assert.ok(s.sc === 1 && s.bloomed && s.pop === -1, 'steady while visible');
  }
  assert.equal(pops, 0);
  const f2 = mk(64); f2.refresh(v, null, lifeAt(1)); let p2 = 0; f2.onPop = () => p2++;
  for (let i = 0; i < 400; i++) { life.v = 0.5 + 0.05 * Math.sin(i); f2.step(0.05, i * 0.05, null, life); }
  assert.equal(p2, 0, 'threshold jitter never re-pops');
  const f3 = mk(64); f3.refresh(v, null, lifeAt(0)); f3.refresh(v, null, lifeAt(0.4));
  life.v = 1; run(f3, 4, life); life.v = 0.1; run(f3, 3, life);
  for (const s of f3.slots.values()) if (s.alpha < 0.06) assert.equal(s.bloomed, false);
  assert.ok(BLOOM_ON > BLOOM_OFF);
});

test('AL-2: no pop starts under the hero clear zone; reduced motion instant; Hollow stays still', () => {
  const f = mk(64); const v = view(1000, 1000);
  f.refresh(v, null, lifeAt(0)); f.refresh(v, null, lifeAt(0.4));
  const hero = { x: 1280, y: 1160 };
  run(f, 0.5, lifeAt(1), hero);
  for (const s of f.slots.values()) if (Math.hypot(s.prop.x - hero.x, s.prop.y - hero.y) < 90) assert.equal(s.bloomed, false, 'hidden near the hero');
  assert.ok(HERO_SEE > 0 && HERO_SEE < 1);
  const g = mk(64); g.refresh(v, null, lifeAt(0)); g.refresh(v, null, lifeAt(0.4)); let p = 0; g.onPop = () => p++;
  run(g, 0.1, lifeAt(1), null, 0, true);
  for (const s of g.slots.values()) assert.ok(s.bloomed && s.sc === 1 && s.pop === -1);
  assert.equal(p, 0);
  const h = mk(64); h.refresh(v, null, lifeAt(0)); run(h, 2, lifeAt(0)); assert.equal(h.count, 0);
});

test('AL-2: caps hold (sparkles Low 0 / Med 16 / High 32), no NaN, reduced motion has no sparkles', () => {
  assert.equal(CAPS.high.ambient.bloom, 32); assert.equal(CAPS.med.ambient.bloom, 16); assert.equal(CAPS.low.ambient.bloom, 0);
  let made = 0;
  const chain = () => { const o = new Proxy({}, { get(t, k) { return (...a) => { for (const x of a) if (typeof x === 'number' && !Number.isFinite(x)) throw new Error('NaN in ' + String(k)); return o; }; } }); return o; };
  const scene = { add: { image: () => { made++; return chain(); } } };
  const wv = (x, y) => ({ x, y, right: x + 560, bottom: y + 320 });
  for (const [tier, bcap, scap] of [['high', 32, 64], ['med', 16, 36], ['low', 0, 0]]) {
    made = 0;
    const lay = new SwayLayer(scene, { seed: 1, glow: { key: 'glow', inv: 0.25, blend: 1 } });
    const L = lifeAt(0);
    let maxSparks = 0;
    for (let i = 0; i < 400; i++) {
      L.v = i < 20 ? 0 : i < 40 ? 0.4 : (i % 120 < 60 ? 1 : 0.1);
      lay.update(0.05, i * 0.05, wv(1000, 1000), { x: 1700, y: 1700 }, L, { on: scap > 0, cap: scap, bloom: bcap, phone: false, reduced: false });
      maxSparks = Math.max(maxSparks, lay.sparks.length);
    }
    assert.ok(maxSparks <= bcap, tier + ' sparks ' + maxSparks);
    assert.ok(made <= scap + bcap, tier + ' images ' + made);
    if (tier === 'low') assert.equal(made, 0); else assert.ok(maxSparks > 0, tier + ' sparkles appear');
  }
  const lay = new SwayLayer(scene, { seed: 1, glow: { key: 'glow', inv: 0.25 } });
  lay.update(0.05, 0, wv(0, 0), null, lifeAt(0), { on: true, cap: 36, bloom: 16, phone: false, reduced: true });
  assert.equal(lay.sparks.length, 0);
});
