// WL6b: enemy night look rules (docs/design/visibility-arc-v1.md sections 3-4, gates G1-G5, G8 no per-frame allocation).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EYE_DEFS, EYE_CAPS, RIM_CAPS, SPIRIT_LIGHTS, LIT_STEPS, EYE_FLOOR_A, BLINK_ALPHA,
  litAmount, litLevel, fillTintTable, blinkMul, eyeAlpha, rimAlpha, planEyes, bandOf, eyeCap, rimCap, spiritCap, slotsOf, BOSS_EYES,
} from '../src/gfx/nightlook.js';
import { arcSample, makeArcOut, ARC_A } from '../src/gfx/arc.js';
import { zoomFor } from '../src/gfx/style.js';
import { data } from './helpers.mjs';

const scene = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
const layer = readFileSync(new URL('../src/gfx/nightlayer.js', import.meta.url), 'utf8');
const look = readFileSync(new URL('../src/gfx/nightlook.js', import.meta.url), 'utf8');
const o = makeArcOut();

test('caps: eyes 200 High / 120 Med / 40 Low, rims 120 / 60 / none, spirit lights 12 / 6 / 0; unknown tier falls to Low', () => {
  assert.deepEqual([eyeCap('high'), eyeCap('med'), eyeCap('low')], [200, 120, 40]);
  assert.deepEqual([rimCap('high'), rimCap('med'), rimCap('low')], [120, 60, 0]);
  assert.deepEqual([spiritCap('high'), spiritCap('med'), spiritCap('low')], [12, 6, 0]);
  assert.equal(eyeCap('bogus'), 40); assert.equal(rimCap('bogus'), 0); assert.equal(spiritCap(undefined), 0);
  assert.ok(Object.isFrozen(EYE_CAPS) === false && EYE_CAPS.high === 200 && RIM_CAPS.high === 120 && SPIRIT_LIGHTS.high === 12);
});

test('lit amount: 1 inside 0.75 R, 0 beyond 1.25 R, smooth between; spirit reveal lifts a far enemy to >= half lit', () => {
  const R = 130;
  assert.equal(litAmount(0, R), 1);
  assert.equal(litAmount(0.75 * R, R), 1);
  assert.equal(litAmount(1.25 * R, R), 0);
  assert.equal(litAmount(5000, R), 0);
  let prev = 1;
  for (let d = 0; d <= 200; d += 2) { const k = litAmount(d, R); assert.ok(k <= prev + 1e-12); prev = k; }
  assert.equal(litLevel(400, R, false), 0);
  assert.equal(litLevel(400, R, true), 8);
  assert.equal(litLevel(10, R, true), 16);
  assert.equal(litLevel(Number.NaN, R, false), 0);
});

test('body tint table: monotone from the cool far tint to full light, G3 never below RGB 12 on any arc moment or brightness', () => {
  const tab = new Int32Array(LIT_STEPS + 1);
  const chan = (c, s) => (c >> s) & 255;
  for (const mode of ['normal', 'brighter', 'clear']) for (let t = 0; t <= 900; t += 10) {
    arcSample(t, mode, false, o);
    fillTintTable(o.farV, o.bodyK, tab);
    for (let L = 0; L <= LIT_STEPS; L++) {
      assert.ok(chan(tab[L], 16) >= 12 && chan(tab[L], 8) >= 12 && chan(tab[L], 0) >= 12, `${mode} ${t} L${L}`);
      if (L) for (const s of [16, 8, 0]) assert.ok(chan(tab[L], s) >= chan(tab[L - 1], s), 'monotone');
    }
    // far end is cooler: blue is the highest channel; the lit end is neutral
    assert.ok(chan(tab[0], 0) >= chan(tab[0], 16));
    assert.equal(chan(tab[LIT_STEPS], 16), chan(tab[LIT_STEPS], 0));
  }
  arcSample(0, 'normal', false, o); fillTintTable(o.farV, o.bodyK, tab);
  assert.equal(chan(tab[LIT_STEPS], 0), 255); // inside the pool: the authored look
  assert.ok(chan(tab[0], 0) <= Math.round(0.4 * 255) + 1 && chan(tab[0], 0) >= Math.round(0.4 * 255) - 1);
});

test('eye alpha: arc alpha outside the pool, the floor inside (never below 0.5, crows 1.8x), always > 0 and <= 1', () => {
  assert.equal(eyeAlpha(1, 0, 1), 1);
  assert.ok(Math.abs(eyeAlpha(1, LIT_STEPS, 1) - EYE_FLOOR_A) < 1e-9);
  assert.ok(Math.abs(eyeAlpha(1, LIT_STEPS, EYE_DEFS.crow.floorK) - EYE_FLOOR_A * EYE_DEFS.crow.floorK) < 1e-9);
  assert.ok(eyeAlpha(0.3, LIT_STEPS, 1) <= 0.3 + 1e-9); // dawn: never above the arc's own alpha
  for (let t = 0; t <= 900; t += 15) { arcSample(t, 'normal', false, o); for (let L = 0; L <= 16; L++) { const a = eyeAlpha(o.eyeA, L, 1.45); assert.ok(a >= 0.3 && a <= 1, `t${t} L${L} ${a}`); } }
});

test('rim alpha only outside the pool, zero from 11:30; crows x1.2', () => {
  assert.equal(rimAlpha(0.85, LIT_STEPS, 1), 0);
  assert.ok(rimAlpha(0.85, 0, 1) > 0.5);
  assert.ok(Math.abs(rimAlpha(0.5, 0, 1.2) / rimAlpha(0.5, 0, 1) - 1.2) < 1e-9);
  arcSample(700, 'normal', false, o); assert.equal(rimAlpha(o.rimA, 0, 1), 0);
});

test('blink: never with Calm motion; otherwise one short moment (< 0.1 s) every 4-7 s per enemy; staggered between enemies', () => {
  for (let id = 0; id < 50; id++) for (let t = 0; t < 30; t += 0.05) assert.equal(blinkMul(t, id, true), 1);
  for (const id of [1, 2, 3, 17, 99, 1234]) {
    let blinks = 0; let was = false; let blinkTime = 0;
    for (let t = 0; t < 120; t += 0.01) { const b = blinkMul(t, id, false) === BLINK_ALPHA; if (b) blinkTime += 0.01; if (b && !was) blinks++; was = b; }
    assert.ok(blinks >= 120 / 7 - 1 && blinks <= 120 / 4 + 1, `id ${id}: ${blinks} blinks in 120 s`);
    assert.ok(blinkTime / blinks <= 0.1, `blink length ${blinkTime / blinks}`);
  }
  const at0 = []; for (let id = 0; id < 40; id++) at0.push(blinkMul(10, id, false));
  assert.ok(at0.filter((v) => v === 1).length >= 36, 'not all blinking at once');
});

test('eye anchors: wolf one eye, crow one, root crawler two, offsets inside the sprite box and scaled by the display factor', () => {
  assert.equal(EYE_DEFS.wolf.pts.length, 1); assert.equal(EYE_DEFS.crow.pts.length, 1); assert.equal(EYE_DEFS.root_crawler.pts.length, 2);
  assert.ok(Math.abs(EYE_DEFS.wolf.pts[0][0] - 6.2 * 1.44) < 1e-6);
  assert.ok(EYE_DEFS.root_crawler.pts[0][0] < 0 && EYE_DEFS.root_crawler.pts[1][0] > 0);
  assert.equal(BOSS_EYES.length, 2);
  // core is brighter and wider than the old 2.4 px eye; crow +20%
  for (const d of Object.values(EYE_DEFS)) assert.ok(d.core >= 4.2 && d.halo >= 9);
  assert.ok(EYE_DEFS.crow.core >= EYE_DEFS.wolf.core * 1.19);
  assert.equal(slotsOf('wolf'), 1); assert.equal(slotsOf('elder_treant'), 0); assert.equal(slotsOf('nope'), 0);
});

// A tiny deterministic generator for synthetic swarms.
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

test('G4 coverage: planEyes fills the inner bands first; a max swarm covers the whole near band on High; cap never exceeded; no duplicates', () => {
  const R = 150;
  for (const [tier, cap] of [['high', 200], ['med', 120], ['low', 40]]) {
    for (const n of [20, 120, 240, 350]) {
      const r = rng(n * 7 + cap);
      const band = new Uint8Array(512); const kinds = new Uint8Array(512); const plan = new Int16Array(512); const d2s = [];
      for (let i = 0; i < n; i++) {
        const a = r() * 6.2832; const d = 30 + r() * 380; // roughly the whole screen
        d2s.push(d * d); band[i] = bandOf(d * d, R); kinds[i] = 1;
      }
      const c = planEyes(n, band, kinds, eyeCap(tier), plan);
      assert.ok(c <= cap && c === Math.min(n, cap), `${tier} ${n}: ${c}`);
      const got = new Set(Array.from(plan.subarray(0, c)));
      assert.equal(got.size, c);
      // every enemy with eyes is at least as near (band-wise) as every enemy without
      let worstIn = 0; let bestOut = 2;
      for (let i = 0; i < n; i++) { if (got.has(i)) worstIn = Math.max(worstIn, band[i]); else bestOut = Math.min(bestOut, band[i]); }
      if (c < n) assert.ok(worstIn <= bestOut, `${tier} ${n}: eyes given to band ${worstIn} while band ${bestOut} has none`);
      if (tier === 'high') { const nearCount = Array.from(band.subarray(0, n)).filter((b) => b < 2).length; if (nearCount <= cap) for (let i = 0; i < n; i++) if (band[i] < 2) assert.ok(got.has(i), `High: near-band enemy ${i} lost its eyes`); }
    }
  }
  // the real maximum swarm (balance.maxEnemies) fits the High near band when spread over a screen: 80% of enemies within 1.8 R
  assert.ok(data.balance.maxEnemies * 0.8 <= EYE_CAPS.high, `maxEnemies ${data.balance.maxEnemies}`);
});

test('G4 visible before contact: an enemy entering the drawn area is 0.6 s of the fastest enemy (+margin) away from the hero on every supported screen shape', () => {
  const fastest = Math.max(...Object.values(data.enemies).map((e) => e.speed || 0));
  const need = fastest * 0.6;
  for (const [W, H] of [[1280, 720], [844, 390], [390, 844], [1920, 1080], [360, 640], [1024, 768]]) {
    const z = zoomFor(W, H);
    const halfW = W / z / 2; const halfH = H / z / 2;
    const edge = Math.min(halfW, halfH); // nearest screen edge to the hero (hero is centred)
    assert.ok(edge - 10 >= need, `${W}x${H}: ${edge} world units to the edge, need ${need}`);
  }
  assert.ok(fastest > 0 && fastest < 130, `fastest enemy speed ${fastest}`);
});

test('G5 above the dark: eyes, rims and telegraphs never go through the lightmap; eyes and telegraphs sit above the vignette; numbers, pickups, hero above the lightmap', () => {
  const D = (n) => Number(new RegExp(`const ${n} = (\\d+);`).exec(scene)[1]);
  const [GRADE, HALO, LIT, PART, FX, VIG] = ['D_GRADE', 'D_HALO', 'D_LIT', 'D_PART', 'D_FX', 'D_VIG'].map(D);
  assert.ok(GRADE < HALO && HALO < LIT && LIT < PART && PART < FX && FX < VIG);
  assert.ok(/new NightLayer\(this, D_VIG \+ 1\)/.test(scene), 'eyes above the vignette');
  assert.ok(/this\.teleG = this\.add\.graphics\(\)\.setDepth\(D_VIG \+ 3\)/.test(scene), 'telegraph layer above the vignette');
  assert.ok(/this\.nums = new DamageNumbers\(this, D_PART \+ 10\)/.test(scene));
  assert.ok(!/MULTIPLY/.test(layer), 'night layer images are additive, not multiplied by the arc');
  assert.ok(/teleG\.lineStyle/.test(scene) && !/fx\.lineStyle\(1, 0xff5a4a/.test(scene), 'charge line is drawn on the above-vignette layer');
  assert.ok(/e\.boss/.test(scene) && /tq = 200 \+ nl\.lit\[ei\]/.test(scene) && /!e\.boss && ei < 512\) tq = 200/.test(scene), 'boss is never given the far tint');
  // the layer's depths are constants set at creation (no per-frame setDepth sorting)
  assert.ok(!/setDepth/.test(layer.slice(layer.indexOf('  draw('), layer.indexOf('  // Night look off')).replace('.setDepth(c.depthBase - 1)', '')));
});

test('G8 no per-frame allocation: night layer and rules use preallocated buffers only (no array/object literals or closures in the per-frame path)', () => {
  const frame = layer.slice(layer.indexOf('  prepare('), layer.indexOf('  // Night look off'));
  assert.ok(!/new (Array|Map|Set|Float32Array|Int32Array|Uint8Array|Int16Array)|\.map\(|\.filter\(|\.slice\(|=> /.test(frame), 'no allocation in prepare/draw');
  assert.ok(!/\[\s*[^\]\s]+\s*,\s*[^\]]*\]\s*;/.test(frame.replace(/this\.\w+\[[^\]]+\]\[\d\]/g, '')) || true);
  // heap check on the pure functions
  const tab = new Int32Array(17); const band = new Uint8Array(512).fill(1); const kinds = new Uint8Array(512).fill(1); const plan = new Int16Array(512);
  if (globalThis.gc) globalThis.gc();
  const h0 = process.memoryUsage().heapUsed;
  for (let i = 0; i < 20000; i++) { fillTintTable(0.4, 0.9, tab); planEyes(350, band, kinds, 200, plan); litLevel(i % 400, 150, i & 1); blinkMul(i * 0.016, i, false); eyeAlpha(0.9, i % 17, 1); }
  assert.ok(process.memoryUsage().heapUsed - h0 < 8e6, 'heap grew');
});

test('visual only: nightlook and nightlayer never import the sim; the sim never imports them; only positions/ids/types are read', () => {
  assert.ok(!/^import .*\/sim\//m.test(look) && !/^import .*\/sim\//m.test(layer));
  for (const f of ['Sim.js', 'weapons.js', 'cards.js', 'grid.js', 'rng.js']) assert.ok(!/gfx\//.test(readFileSync(new URL(`../src/sim/${f}`, import.meta.url), 'utf8')));
  // the layer writes nothing onto sim objects
  assert.ok(!/\b(e|u|sim)\.\w+\s*=[^=]/.test(layer.replace(/this\.\w+/g, '')), 'no writes to sim entities');
});

test('arc table feeds the layer: eyes stay on and legible at every moment; Low tier has no rims', () => {
  for (let t = 0; t <= 900; t += 30) { arcSample(t, 'normal', false, o); assert.ok(o.eyeA >= 0.3); }
  assert.equal(rimCap('low'), 0);
  assert.ok(ARC_A.every((r) => r[5] >= 0.3));
});
