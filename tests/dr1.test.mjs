// DR1: hit feedback state machine, invulnerability look, damage-taken number lane, sim hit payload (counters only), Calm behaviour, no allocation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { HitFx, HIT_RIM, HIT_LIFT, HIT_ARC, HIT_RED, LIFT_Z, iframeFlick, KINDS } from '../src/gfx/hitfx.js';
import { NumPool, KIND, LANE_R, LANE_T } from '../src/gfx/numpool.js';
import * as M from '../src/gfx/rigmath.js';

const mk = (o = {}) => new Sim({ data, seed: 7, ...o });

test('DR1 hit feedback: timeline of the three cues (rim 0.25 s, lift 0.3 s, arc 0.3 s)', () => {
  const h = new HitFx();
  assert.equal(h.rimA(), 0); assert.equal(h.liftA(), 0); assert.equal(h.active, false);
  h.trigger({ src: 'wolf', kind: 'lunge', id: 41, amt: 6, x: 30, y: 10 }, 0, 0);
  assert.equal(h.rimA(), 1); assert.equal(h.liftA(), 1); assert.equal(h.arcA(), 1);
  h.update(0.1); assert.equal(h.rimA(), 1);
  h.update(0.1); assert.ok(h.rimA() < 1 && h.rimA() > 0, 'rim fading at 0.2 s');
  h.update(0.06); assert.equal(h.rimA(), 0, 'rim over at 0.26 s');
  assert.ok(h.liftA() > 0, 'lift still on at 0.26 s');
  h.update(0.05); assert.equal(h.liftA(), 0); assert.equal(h.arcA(), 0); assert.equal(h.active, false);
  assert.equal(HIT_RIM, 0.25); assert.equal(HIT_LIFT, 0.3); assert.equal(HIT_ARC, 0.3);
});

test('DR1 lift timer is exactly 0.3 s and re-arms on a new hit', () => {
  const h = new HitFx();
  h.trigger({ kind: 'contact', id: 1, x: 1, y: 1 }, 0, 0);
  for (let i = 0; i < 29; i++) h.update(0.01);
  assert.ok(h.liftA() > 0, 'on at 0.29 s');
  h.update(0.02);
  assert.equal(h.liftA(), 0, 'off after 0.3 s');
  h.trigger({ kind: 'contact', id: 2, x: 1, y: 1 }, 0, 0);
  assert.equal(h.liftA(), 1); assert.equal(h.id, 2); assert.equal(h.count, 2);
});

test('DR1 hit feedback is real-time and calm-safe: nothing moves, all cues are plain alpha fades', () => {
  const src = readFileSync(new URL('../src/gfx/hitfx.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random|performance\.now/.test(src), 'deterministic, no wall clock');
  const h = new HitFx(); h.trigger({ kind: 'thorn', dx: 1, dy: 0, x: 5, y: 5 }, 0, 0);
  for (const f of [h.rimA(), h.liftA(), h.arcA()]) assert.ok(f >= 0 && f <= 1);
});

test('DR1 hostile / garbage event data is validated', () => {
  const h = new HitFx();
  h.trigger({ src: 'x'.repeat(500), kind: '<img onerror=1>', id: 'zz', amt: NaN, x: Infinity, y: 'a', dx: NaN, dy: null }, NaN, undefined);
  assert.equal(h.kind, 'contact'); assert.equal(h.id, -1); assert.equal(h.amt, 0); assert.ok(h.src.length <= 32);
  for (const v of [h.ax, h.ay, h.dx, h.dy, h.px, h.py]) assert.ok(Number.isFinite(v));
  h.trigger(null, 3, 4); assert.equal(h.ax, 3);
  h.update(NaN); h.update(-5); h.update(Infinity); assert.ok(Number.isFinite(h.t));
  assert.ok(Number.isFinite(h.angle()));
  for (const k of KINDS) { h.trigger({ kind: k }, 0, 0); assert.equal(h.kind, k); }
});

test('DR1 crescent faces the attacker; thorn faces back along its path', () => {
  const h = new HitFx();
  h.trigger({ kind: 'lunge', x: 20, y: 0 }, 0, 0); assert.ok(Math.abs(h.angle()) < 1e-9, 'attacker east');
  h.trigger({ kind: 'contact', x: 0, y: 20 }, 0, 0); assert.ok(Math.abs(h.angle() - Math.PI / 2) < 1e-9, 'attacker south (y down)');
  assert.ok(Math.abs(h.angle(-20, 0)) - Math.PI < 1e-9, 'live position overrides');
  h.trigger({ kind: 'thorn', x: 0, y: 0, dx: 5, dy: 0 }, 0, 0); assert.ok(Math.abs(Math.abs(h.angle()) - Math.PI) < 1e-9, 'thorn travelling east came from the west');
  h.trigger({ kind: 'contact' }, 5, 5); assert.ok(Number.isFinite(h.angle()), 'attacker exactly on the hero');
});

test('DR1 invulnerability look: none in the normal window, slow (<= 3 crossings/s) in long windows, same under Calm', () => {
  assert.equal(iframeFlick(0.4, 1.23, false), false, 'the normal 0.4 s window has no flicker (the rim carries it)');
  assert.equal(iframeFlick(0.3, 1.23, false), false);
  assert.equal(iframeFlick(0, 1.23, false), false);
  assert.equal(iframeFlick(2, 1.0, true), false, 'dead: never');
  let crossings = 0, prev = iframeFlick(2, 0, false);
  for (let i = 1; i <= 1000; i++) { const v = iframeFlick(2, i / 1000, false); if (v !== prev) crossings++; prev = v; }
  assert.ok(crossings <= 3, `revive window: ${crossings} crossings in 1 s`);
  assert.equal(iframeFlick(NaN, NaN, false), false);
});

test('DR1 rigs use the shared steady rule (no 24 Hz swap left)', () => {
  for (const f of ['herorig', 'eliasrig']) {
    const src = readFileSync(new URL(`../src/gfx/${f}.js`, import.meta.url), 'utf8');
    assert.ok(!/sim\.time \* 24/.test(src), `${f} has no 24 Hz flicker`);
    assert.ok(/iframeFlick\(/.test(src));
  }
  const rs = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(!/sim\.time \* 24/.test(rs));
});

test('DR1 no salmon body fill after the white flash; the outline carries the hit', () => {
  const o = {};
  assert.equal(M.hurtFx(o, 0.01).tint, 1); assert.equal(M.hurtFx(o, 0.1).tint, 0); assert.equal(M.hurtFx(o, 0.2).tint, 0);
  assert.equal(HIT_RED, 0xff8078, 'locked damage-taken light red');
  assert.ok(LIFT_Z < 4000, 'attacker sits below the hero outline (D_LIT + 4000)');
});

test('DR1 damage-taken number: 1.2x, a layer above, own lane (enemy numbers near it are held back 0.4 s)', () => {
  const p = new NumPool(24);
  const n = p.spawn(100, 100, 6, -1, KIND.HURT);
  assert.equal(n.mul, 1.2); assert.equal(n.sign, '-');
  const near = p.spawn(110, 108, 12, 5, KIND.DMG, 0, false);
  assert.equal(near, null, 'a weapon number inside the lane is held back');
  const far = p.spawn(100 + LANE_R + 10, 100, 12, 6, KIND.DMG, 0, false);
  assert.ok(far, 'a weapon number outside the lane still shows');
  assert.equal(p.spawn(105, 100, 3, -2, KIND.HEAL).kind, KIND.HEAL, 'heal numbers are not held back');
  p.update(LANE_T + 0.01);
  assert.ok(p.spawn(110, 108, 12, 7, KIND.DMG, 0, false), 'lane over after 0.4 s');
  const src = readFileSync(new URL('../src/gfx/dmgnums.js', import.meta.url), 'utf8');
  assert.ok(/HURT_UP = 5/.test(src) && /setDepth\(this\.depth \+ HURT_UP\)/.test(src), 'drawn above the weapon numbers');
  assert.ok(/fillRoundedRect/.test(src), 'on a dark plate');
});

test('DR1 sim: hurt event + lastHit carry the attacker (counters only), contact kinds', () => {
  const sim = mk();
  sim.time = 30;
  sim.spawnEnemy('wolf', sim.player.x + 4, sim.player.y);
  const w = sim.enemies[sim.enemies.length - 1];
  w.state = 'charge'; w.stT = 0.5; w.dx = -1; w.dy = 0;
  sim.player.iframes = 0;
  sim.events.length = 0;
  sim.damagePlayer(5, 'wolf', { kind: 'lunge', id: w.id, x: w.x, y: w.y });
  const ev = sim.events.find((e) => e.type === 'hurt');
  assert.ok(ev && ev.kind === 'lunge' && ev.id === w.id && ev.src === 'wolf' && ev.amt === 5);
  assert.deepEqual({ ...sim.lastHit }, { src: 'wolf', kind: 'lunge', id: w.id, t: sim.time, amt: 5, x: w.x, y: w.y });
  assert.equal(sim.hitsBy.wolf, 1); assert.equal(sim.lungeHits, 1); assert.equal(sim.hurtBy.wolf, 5);
  // no meta: still a valid payload
  sim.player.iframes = 0; sim.events.length = 0;
  sim.damagePlayer(2, 'crow');
  const e2 = sim.events.find((e) => e.type === 'hurt');
  assert.equal(e2.kind, 'contact'); assert.equal(e2.id, -1); assert.equal(sim.lungeHits, 1);
});

test('DR1 sim: a wolf in its lunge that touches the hero reports kind lunge; a thorn reports its shooter and direction', () => {
  const sim = mk();
  sim.time = 30; sim.player.iframes = 0;
  sim.spawnEnemy('wolf', sim.player.x + 3, sim.player.y);
  const w = sim.enemies[sim.enemies.length - 1];
  w.state = 'charge'; w.stT = 0.4; w.dx = -1; w.dy = 0; w.grace = 0;
  sim.events.length = 0;
  sim.step(1 / 60, { x: 0, y: 0 });
  const ev = sim.events.find((e) => e.type === 'hurt');
  assert.ok(ev, 'hit landed'); assert.equal(ev.kind, 'lunge'); assert.equal(ev.id, w.id);
  sim.enemies.length = 0; sim.player.iframes = 0; sim.events.length = 0;
  sim.eshots.push({ id: 900, src: 'stoat_piper', from: 77, x: sim.player.x - 2, y: sim.player.y, vx: 40, vy: 0, life: 3, age: 0.5, r: 3, dmg: 4, dead: false });
  sim.step(1 / 60, { x: 0, y: 0 });
  const t = sim.events.find((e) => e.type === 'hurt');
  assert.ok(t && t.kind === 'thorn' && t.id === 77 && t.dx === 40);
});

test('DR1 sim determinism: the payload fields never change a run (same seed, same result with and without reading them)', () => {
  const run = () => { const s = mk({ characterId: 'wren' }); for (let i = 0; i < 3600; i++) s.step(1 / 60, { x: Math.sin(i / 90), y: Math.cos(i / 70) }); return [s.player.hp, s.kills, s.enemies.length, Math.round(s.player.x * 1000), s.hitsBy.wolf | 0]; };
  assert.deepEqual(run(), run());
});

test('DR1 HUD: edge flash kept under Calm, uses the locked light red, lantern dip is opacity-only under Calm', () => {
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.ok(/ev\.type === 'hurt'\) \{ this\.scene\.shake\(\); this\.ui\.hurt\(\);/.test(app), 'ui.hurt() is no longer skipped under Calm');
  const css = readFileSync(new URL('../src/hud.css', import.meta.url), 'utf8');
  assert.ok(/\.hurtflash \{[^}]*255, 128, 120/.test(css), 'edge flash is #ff8078, not danger red');
  assert.ok(/\.reduced-motion \.h-lamp\.hurt svg \{ animation-name: hlamphurtc; \}/.test(css));
  const calm = css.match(/@keyframes hlamphurtc \{[^]*?\n/)[0];
  assert.ok(!/transform/.test(calm), 'Calm lantern cue has no motion');
});
