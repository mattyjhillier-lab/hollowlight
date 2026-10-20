// DR3: crowd readability rules (threat hierarchy, fade near the hero, depth bands, density-aware effect budget), enemy counts untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import * as C from '../src/gfx/crowdread.js';
import { LIFT_Z } from '../src/gfx/hitfx.js';

const R = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('DR3 must-react types come from the enemy data (mustReact flag), the boss is not one', () => {
  for (const id of ['stoat_piper', 'puffback_toad', 'bramble_hart']) assert.ok(data.enemies[id].mustReact, id);
  for (const id of ['wolf', 'crow', 'root_crawler']) assert.ok(!data.enemies[id].mustReact, id);
  assert.ok(C.isMustReact('stoat_piper') && C.isMustReact('puffback_toad') && C.isMustReact('bramble_hart') && C.isMustReact('miniboss'));
  assert.ok(!C.isMustReact('wolf') && !C.isMustReact('crow') && !C.isMustReact('root_crawler') && !C.isMustReact('__proto__') && !C.isMustReact(undefined));
});

test('DR3 depth bands: filler < must-react < lifted attacker < hero outline, all inside the world layer', () => {
  assert.ok(C.DEPTH_MUST > 4000, 'must-react sorts above every y-sorted filler/hero depth');
  assert.ok(C.DEPTH_MUST + 4000 < C.DEPTH_LIFT, 'lift above the whole must-react band');
  assert.ok(C.DEPTH_LIFT < C.DEPTH_HERO_OUT);
  assert.ok(C.DEPTH_HERO_OUT + 10 < 30000, 'stays under the particle layer (D_PART = D_LIT + 30000)');
  assert.equal(LIFT_Z, C.DEPTH_LIFT, 'the hit-lift uses the same band');
  assert.equal(C.depthOf(120, false), 120); assert.equal(C.depthOf(120, true), 120 + C.DEPTH_MUST);
  assert.ok(C.depthOf(4000, false) < C.depthOf(0, true), 'a filler at the far south is still under a must-react at the far north');
  assert.ok(Number.isFinite(C.depthOf(NaN, true)));
});

test('DR3 enemies piled on the hero draw under her (fading alone stacks back to opaque)', () => {
  assert.equal(C.depthNear(1500), 1499);
  assert.ok(C.depthNear(1500) < 1500, 'below her own y-sorted depth');
  assert.ok(Number.isFinite(C.depthNear(NaN)));
  const rs = R('src/scenes/RunScene.js');
  assert.match(rs, /d2n < NEAR2 \? depthNear\(p\.y\)/);
});

test('DR3 enemy alpha: quiet in a crowd, fades near the hero, must-react stays more solid, no pop', () => {
  assert.equal(C.enemyAlpha(200, 0, false), 1, 'sparse: unchanged (the dark opening keeps its look)');
  assert.ok(Math.abs(C.enemyAlpha(200, 1, false) - 0.8) < 1e-9, 'filler 20% quieter in a thick crowd');
  assert.equal(C.enemyAlpha(200, 1, true), 1, 'must-react types are never quieted');
  assert.equal(C.enemyAlpha(10, 0, false), 0.5); assert.equal(C.enemyAlpha(10, 1, false), 0.5);
  assert.equal(C.enemyAlpha(10, 0, true), 0.75);
  assert.equal(C.enemyAlpha(0, 1, false), 0.5);
  let prev = C.enemyAlpha(0, 1, false);
  for (let d = 0; d <= 60; d += 0.5) { const a = C.enemyAlpha(d, 1, false); assert.ok(a >= prev - 1e-9, `monotonic at ${d}`); assert.ok(a - prev < 0.06, `no pop at ${d}`); prev = a; }
  assert.ok(Number.isFinite(C.enemyAlpha(NaN, NaN, false)));
});

test('DR3 the quiet look yields to the daylight contrast floor (WL6d |dL*| >= 6): full at night, none once bodies darken', () => {
  assert.equal(C.quietScale(1), 1); assert.equal(C.quietScale(0.97), 0); assert.equal(C.quietScale(0.8), 0);
  let prev = 1;
  for (let k = 1; k >= 0.9; k -= 0.002) { const q = C.quietScale(k); assert.ok(q <= prev + 1e-9 && q >= 0 && q <= 1); prev = q; }
  assert.equal(C.quietScale(NaN), 1, 'unknown = night default');
  assert.match(R('src/scenes/RunScene.js'), /this\.dens\.k \* quietScale\(this\.arc\.bodyK\)/);
});

test('DR3 density: thick crowd = 8+ within 120 u or 120+ in view, eased over ~0.5 s, never leaves 0..1', () => {
  const d = new C.Density();
  assert.equal(d.update(3, 40, 0.016), 0);
  for (let i = 0; i < 10; i++) d.update(9, 40, 0.016);
  assert.ok(d.k > 0.25 && d.k < 0.5, `eases in (${d.k})`);
  for (let i = 0; i < 40; i++) d.update(0, 130, 0.016);
  assert.equal(d.k, 1);
  for (let i = 0; i < 80; i++) d.update(0, 0, 0.016);
  assert.equal(d.k, 0, 'eases back out');
  d.update(NaN, NaN, NaN); d.update(1e9, 1e9, 99); assert.ok(d.k >= 0 && d.k <= 1);
});

test('DR3 ambient + small numbers dim only when crowded', () => {
  assert.equal(C.fogMul(0), 1); assert.equal(C.fogMul(1), 0.5); assert.ok(C.flyMul(1) < 0.2); assert.ok(C.petalMul(1) < 0.4);
  assert.equal(C.fogMul(NaN), 1);
  assert.equal(C.skipSmallNumber(0, 1, 10, 5), false, 'sparse: every number shows');
  assert.equal(C.skipSmallNumber(1, 2, 10, 30), true, 'crowded + tiny + near the hero: held back');
  assert.equal(C.skipSmallNumber(1, 9, 10, 30), false, 'a normal hit still shows');
  assert.equal(C.skipSmallNumber(1, 2, 10, 200), false, 'far from the hero it still shows');
  assert.equal(C.skipSmallNumber(1, 2, 0, 30), false, 'no reference hit yet: never hide');
});

test('DR3 hero outline always on', () => {
  assert.ok(C.heroOutTarget(false) >= 0.5 && C.heroOutTarget(true) > C.heroOutTarget(false));
  assert.ok(C.HERO_OUT_BASE > 0.02, 'visible (the old rule hid it below 3 enemies)');
});

test('DR3 outline caps per tier; Low is depth-only (simple)', () => {
  assert.equal(C.MUST_OUT_CAP.low, 0); assert.ok(C.MUST_OUT_CAP.high >= C.MUST_OUT_CAP.med);
  const live = Object.values(data.enemies).filter((e) => e.mustReact).length;
  assert.ok(live === 3);
});

test('DR3 render wiring: depth bands, fade, outline images, density budget, no new per-frame allocation in the loop', () => {
  const rs = R('src/scenes/RunScene.js');
  assert.ok(/enemyAlpha\(/.test(rs) && /depthOf\(/.test(rs) && /heroOutTarget\(/.test(rs) && /this\.dens\.update\(/.test(rs));
  assert.ok(/D_LIT \+ C\.DEPTH_HERO_OUT|DEPTH_HERO_OUT/.test(rs), 'hero outline stack uses the top band');
  assert.ok(/airSt\.dim|\.dim = /.test(rs), 'ambient layers get the crowd dim');
  const loop = rs.slice(rs.indexOf('// enemies (culled to the view; boss always drawn)'), rs.indexOf('wb.plan();') > 0 ? rs.indexOf('wb.plan();') : rs.indexOf('if (sim.eshots.length) drawThorns('));
  assert.ok(!/=> \{|\.map\(|\.filter\(|new Array|\[\.\.\./.test(loop.replace(/\/\/.*$/gm, '')), 'no closures / array builders inside the enemy loop');
});

test('DR3 is visual only: enemy counts and the sim are untouched (same seed, same crowd)', () => {
  const run = () => { const s = new Sim({ data, seed: 21, characterId: 'wren', godMode: true }); for (let i = 0; i < 5400; i++) s.step(1 / 60, { x: Math.sin(i / 80), y: Math.cos(i / 60) }); return [s.enemies.length, s.kills, Math.round(s.player.x)]; };
  assert.deepEqual(run(), run());
  assert.ok(!/crowdread/.test(R('src/sim/Sim.js')), 'the sim never imports the render rules');
});
