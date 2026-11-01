import test from 'node:test';
import assert from 'node:assert/strict';
import { flameSvg, goldFlameSvg, flameSheet, KIND, R, FLAME_BOX, FLAME_LEN_DU, FLAME_WPD, WHEEL_K, HALO_K, FLICKER } from '../src/gfx/summon/orbit.js';
import { flameFrame, flare, flareK, orbitSkin, flowerAt, reformK, streakK, streakRot, FLICK_STEP, FLICK_SEQ, LEAN_MAX, FLARE_T, ORBIT_CAPS } from '../src/gfx/summon/orbitanim.js';
import { ORBIT_BAKE, ORBIT_KINDS, BOOT_KINDS, kindOf, orbitRects } from '../src/gfx/summon/atlas.js';
import { FRAME_BY_NAME, PACK, FLAME_AY, PETAL_AY } from '../src/gfx/summon/frames.js';
import { NAMED, PAINTERS } from '../src/gfx/summon/paint.js';
import { zoomFor } from '../src/gfx/style.js';
import { Lstar } from '../src/gfx/husk/paint.js';

test('flame art: 3 flicker + 3 gold + petal + 2 Low flats, own code only (no external refs, no scripts), nothing painted at boot', () => {
  for (const n of ['flame_0', 'flame_1', 'flame_2', 'flameg_0', 'flameg_1', 'flameg_2', 'flame_petal', 'flat_flame', 'flat_flameg']) {
    const f = FRAME_BY_NAME[n]; assert.ok(f, n); assert.deepEqual([f.w, f.h], [32, 48], n);
    assert.equal(f.ay, n === 'flame_petal' ? PETAL_AY : FLAME_AY, n);
  }
  assert.equal(ORBIT_BAKE.length, 9);
  const sheet = flameSheet(orbitRects().map((r) => ({ ...r })), 1024, PACK.h);
  assert.ok(sheet.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(!/http|<script|javascript:|<image|<foreignObject|on\w+=/i.test(sheet.slice(sheet.indexOf('>') + 1)));
  assert.equal(NAMED.flat_flame(), undefined); assert.equal(PAINTERS.flame, PAINTERS.flameg);
  for (const k of [...ORBIT_KINDS.base, ...ORBIT_KINDS.gold]) assert.ok(!BOOT_KINDS.includes(k), 'nothing orbit at boot');
  assert.equal(Object.keys(KIND).sort().join(), 'fbase,fflat,fflatg,fgold,fpetal');
});

test('flame look: the locked Elias v2 lilac flame (light body, ink tinted outline), cream core, warm heart, wick + wax bead; gold only on evolved frames', () => {
  assert.ok(Lstar(R.c) > 85, 'light lilac-white body'); assert.ok(Lstar(R.ink) < 40, 'dark tinted outline'); assert.equal(R.c, '#e8e0ff');
  for (let i = 0; i < 3; i++) {
    const s = flameSvg({ i });
    assert.ok(s.includes('#fff1c8') && s.includes('#ffcf7a'), 'cream core + warm heart'); assert.ok(s.includes('#4a3a5e') && s.includes('M-4.2 8.2'), 'wick + wax bead');
    assert.ok(!s.includes('grim') && !/#ffd36b/i.test(s), 'no gold on the plain flame'); assert.ok(!/#ff5a3c|#f00\b|#ff0000/i.test(s), 'never red');
    assert.ok(goldFlameSvg({ i }).startsWith('<g filter="url(#grim)">'));
  }
  assert.ok(!KIND.fpetal().includes('M-4.2 8.2') && !KIND.fpetal().includes('#4a3a5e'), 'the petal has no wick or bead');
  assert.equal(FLICKER.length, 3); assert.ok(new Set(FLICKER.map((k) => k.h)).size === 3, 'three different flicker heights');
});

test('flame size: 1.6x today\'s flame drawn next to Elias (9.1 u -> 14.6 u, ~35 px on the 1280x720 desktop); Wheel 1.45x, Halo candles 0.8x', () => {
  const u = FLAME_LEN_DU * FLAME_WPD;
  assert.ok(Math.abs(u / (11.4 * 0.8) - 1.6) < 1e-9, String(u));
  const px = u * zoomFor(1280, 720); assert.ok(px >= 32 && px <= 38, String(px));
  assert.equal(WHEEL_K, 1.45); assert.equal(HALO_K, 0.8);
  assert.equal(FLAME_BOX[2] / FLAME_BOX[3], 32 / 48);
});

test('flame anim: flicker ping-pong <= 3 cycles/s, lean trails the sideways motion (clamped), flare decays; Calm holds frame 0, no lean; never writes the unit', () => {
  const s = {}, seen = [];
  let x = 0;
  for (let i = 0; i < 120; i++) { x += 2; seen.push(flameFrame(s, Object.freeze({ id: 3, x, y: 0 }), 1 / 60, false)); }
  assert.deepEqual([...new Set(seen)].sort(), [0, 1, 2]);
  assert.ok(1 / (FLICK_STEP * FLICK_SEQ.length) <= 1.5, 'one flicker cycle per >= 0.67 s');
  assert.ok(s.lean < 0 && s.lean >= -LEAN_MAX, 'moving right: tip trails left');
  for (let i = 0; i < 60; i++) { x += 30; flameFrame(s, { id: 3, x, y: 0 }, 1 / 60, false); }
  assert.ok(Math.abs(s.lean) <= LEAN_MAX + 1e-12);
  flare(s); assert.equal(flareK(s), 1); flameFrame(s, { id: 3, x, y: 0 }, FLARE_T / 2, false); assert.ok(flareK(s) > 0 && flareK(s) < 1); flameFrame(s, { id: 3, x, y: 0 }, FLARE_T, false); assert.equal(flareK(s), 0);
  const c = {}, cf = new Set(); let cx = 0;
  for (let i = 0; i < 240; i++) { cx += 3; cf.add(flameFrame(c, { id: 5, x: cx, y: 0 }, 1 / 60, true)); assert.ok(c.lean === 0); }
  assert.deepEqual([...cf], [0], 'Calm: one held frame (0 crossings/s)');
  // a jump (respawn / Candle Wheel lock) never swings the flame
  const j = {}; flameFrame(j, { id: 1, x: 0, y: 0 }, 1 / 60, false); flameFrame(j, { id: 1, x: 500, y: 0 }, 1 / 60, false); assert.ok(j.lean === 0);
});

test('orbit skins: gold-rimmed flames on every evolved light (Halo 0.8x, Wheel 1.45x, Tide 1x), plain flames otherwise, Low flats; every frame baked by its kind', () => {
  assert.deepEqual(orbitSkin(null, false, 2), { fr: 'flame_2', gold: false, size: 1 });
  assert.deepEqual(orbitSkin('sanctum_halo', false, 1), { fr: 'flameg_1', gold: true, size: HALO_K });
  assert.deepEqual(orbitSkin('judgement_wheel', false, 0), { fr: 'flameg_0', gold: true, size: WHEEL_K });
  assert.deepEqual(orbitSkin('vesper_tide', false, 0), { fr: 'flameg_0', gold: true, size: 1 });
  assert.equal(orbitSkin(null, true, 2).fr, 'flat_flame'); assert.equal(orbitSkin('vesper_tide', true, 2).fr, 'flat_flameg');
  const names = new Set(ORBIT_BAKE.map((b) => b[0]));
  for (const evo of [null, 'sanctum_halo', 'judgement_wheel', 'vesper_tide']) for (const low of [false, true]) for (const fi of [0, 1, 2]) {
    const sk = orbitSkin(evo, low, fi); assert.ok(names.has(sk.fr), sk.fr);
    assert.ok((sk.gold ? ORBIT_KINDS.gold : ORBIT_KINDS.base).includes(kindOf(sk.fr)), sk.fr);
  }
  assert.equal(kindOf('flame_petal'), 'fpetal'); assert.equal(kindOf('flat_flameg'), 'fflatg'); assert.equal(kindOf('flat_wolf'), 'flat'); assert.equal(kindOf('raven_up'), 'rbase');
});

test('Judgement Wheel flower and re-form, Vesper Tide streak; per-tier caps (Low: no flower, no petals)', () => {
  assert.equal(flowerAt(-0.1, false), null); assert.equal(flowerAt(1, false), null);
  const a = flowerAt(0.1, false), b = flowerAt(0.6, false);
  assert.ok(a.scale < b.scale && a.alpha >= b.alpha && b.alpha > 0, 'opens out and fades');
  assert.equal(flowerAt(0.1, true).scale, 1); assert.equal(flowerAt(0.6, true).scale, 1); // Calm: full size, fade only
  assert.equal(reformK(1.0, false), 0); assert.ok(reformK(0.15, false) > 0.4 && reformK(0.15, false) < 0.6); assert.equal(reformK(0, false), 1); assert.equal(reformK(0.1, true), 0);
  assert.equal(streakK(false, 1.5), 0); assert.ok(streakK(true, Math.PI / 2) === 1 && streakK(true, -0.5) === 0);
  // light to the right of the hero: the tip turns to point left (back toward the hero)
  const r = streakRot(0, 50, 0, 1); assert.ok(Math.abs(Math.sin(r) + 1) < 1e-9 || Math.abs(r + Math.PI / 2) < 1e-9, String(r));
  assert.equal(streakRot(0.2, 50, 0, 0), 0.2);
  assert.equal(ORBIT_CAPS.low.flowers, 0); assert.equal(ORBIT_CAPS.low.petals, 0);
  assert.ok(ORBIT_CAPS.high.flowers <= 12 && ORBIT_CAPS.med.flowers <= 8, 'spawn/despawn beats in flight within the section 5 caps');
});
