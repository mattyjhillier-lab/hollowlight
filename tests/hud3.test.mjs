// HUD-3: floating numbers (format, size scaling, merge, caps, reduced motion), pickup/heal/hurt watcher, NaN/Infinity safety.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NumPool, KIND, fmtNum, fmtSigned, sizeMul, HitRef, FbWatch, MERGE_WINDOW, MAX_SLOTS } from '../src/gfx/numpool.js';
import { CAPS } from '../src/gfx/quality.js';

const GLYPHS = '0123456789k+-.M'; // must match src/gfx/dmgnums.js (checked below by reading the source; that file imports Phaser)
const BAD = [NaN, Infinity, -Infinity, undefined, null, 'x', -5];

test('HUD-3 font glyph list in dmgnums.js matches the formatter alphabet', () => {
  const src = readFileSync(new URL('../src/gfx/dmgnums.js', import.meta.url), 'utf8');
  assert.ok(src.includes(`GLYPHS = '${GLYPHS}'`));
  const spr = readFileSync(new URL('../src/gfx/sprites.js', import.meta.url), 'utf8');
  assert.ok(spr.includes(`const chars = '${GLYPHS}'`));
});

test('HUD-3 fmtNum: compact k/M from 10,000, never NaN/negative, always one short token', () => {
  assert.equal(fmtNum(38), '38');
  assert.equal(fmtNum(9999), '9999');
  assert.equal(fmtNum(10000), '10k');
  assert.equal(fmtNum(12345), '12.3k');
  assert.equal(fmtNum(123456), '123k');
  assert.equal(fmtNum(1500000), '1.5M');
  assert.equal(fmtNum(2e9), '999M');
  for (const b of BAD) assert.match(fmtNum(b), /^\d+$/);
  assert.equal(fmtSigned(30, '+'), '+30');
  assert.equal(fmtSigned(9, '-'), '-9');
  for (let v = 0; v < 3e6; v += 12347) for (const ch of fmtNum(v)) assert.ok(GLYPHS.includes(ch), `glyph ${ch} missing from the font`);
});

test('HUD-3 sizeMul: 1 below 3x typical, 1.4x at 3x, monotonic, hard cap 2x, bad input -> 1', () => {
  assert.equal(sizeMul(10, 10), 1);
  assert.equal(sizeMul(29, 10), 1);
  assert.ok(Math.abs(sizeMul(30, 10) - 1.4) < 1e-9);
  let prev = 1;
  for (let v = 1; v < 5000; v *= 1.3) { const m = sizeMul(v, 10); assert.ok(m >= prev - 1e-9 && m <= 2); prev = m; }
  assert.equal(sizeMul(1e12, 10), 2);
  for (const b of BAD) { assert.equal(sizeMul(b, 10), 1); assert.equal(sizeMul(10, b), 1); }
});

test('HUD-3 HitRef: unknown (0) until warmed up, then follows typical hits, ignores bad values', () => {
  const r = new HitRef();
  assert.equal(r.ref, 0);
  for (let i = 0; i < 7; i++) r.add(10);
  assert.equal(r.ref, 0);
  r.add(10);
  assert.equal(r.ref, 10);
  for (const b of BAD) r.add(b);
  assert.ok(Number.isFinite(r.ref) && r.ref > 0);
});

test('HUD-3 merge: rapid hits on one target within 120ms sum into one number; other targets / late hits do not', () => {
  const p = new NumPool(24);
  p.spawn(0, 0, 5, 7, KIND.DMG, 5);
  p.spawn(0, 0, 6, 7, KIND.DMG, 5);
  assert.equal(p.alive, 1);
  assert.equal(p.slots.find((s) => s.on).val, 11);
  p.spawn(0, 0, 4, 8, KIND.DMG, 5);
  assert.equal(p.alive, 2);
  p.update(MERGE_WINDOW + 0.02);
  p.spawn(0, 0, 4, 7, KIND.DMG, 5);
  assert.equal(p.alive, 3);
  const q = new NumPool(24);
  q.spawn(0, 0, 5, -1, KIND.HURT); q.spawn(0, 0, 5, -1, KIND.HURT);
  assert.equal(q.alive, 2, 'player lanes never merge');
});

test('HUD-3 merge can promote a number to a big hit (size grows with the sum)', () => {
  const p = new NumPool(24);
  p.spawn(0, 0, 10, 1, KIND.DMG, 10);
  assert.equal(p.slots[0].kind, KIND.DMG);
  p.spawn(0, 0, 25, 1, KIND.DMG, 10);
  assert.equal(p.slots[0].kind, KIND.BIG);
  assert.ok(p.slots[0].mul > 1 && p.slots[0].mul <= 2);
  p.spawn(0, 0, 2, 2, KIND.DMG, 10, true);
  assert.ok(p.slots.find((s) => s.on && s.eid === 2).mul >= 1.4);
});

test('HUD-3 pool cap: never exceeds the cap, drops the SMALLEST first, player lanes survive', () => {
  const p = new NumPool(6);
  for (let i = 0; i < 6; i++) p.spawn(i, 0, 10 + i, 100 + i, KIND.DMG, 0, true);
  assert.equal(p.alive, 6);
  assert.equal(p.spawn(0, 0, 3, 200, KIND.DMG, 0, true), null, 'smaller than everything: dropped');
  assert.equal(p.alive, 6);
  assert.ok(p.spawn(0, 0, 500, 201, KIND.DMG, 0, true), 'bigger: replaces the smallest');
  assert.equal(p.alive, 6);
  assert.ok(!p.slots.some((s) => s.on && s.val === 10), 'smallest (10) was the one dropped');
  p.spawn(0, 0, 1, -1, KIND.HURT);
  assert.ok(p.slots.some((s) => s.on && s.kind === KIND.HURT), 'damage taken always shows');
  assert.equal(p.alive, 6);
  for (let i = 0; i < 1000; i++) { p.spawn(i, 0, 1 + (i % 50), i, i % 3 ? KIND.DMG : KIND.BIG, 3, i % 5 === 0); assert.ok(p.alive <= 6); }
  p.setCap(2);
  assert.ok(p.alive <= 2);
  p.setCap(9999);
  assert.equal(p.cap, MAX_SLOTS);
  p.setCap(NaN);
  assert.ok(p.cap >= 1 && p.cap <= MAX_SLOTS);
});

test('HUD-3 caps per tier: Low is the cheapest, none above the 24 live-number budget', () => {
  assert.ok(CAPS.low.dmgNums < CAPS.med.dmgNums);
  for (const c of Object.values(CAPS)) assert.ok(c.dmgNums <= 24);
});

test('HUD-3 numbers expire, alive count stays consistent, bad dt/values are ignored', () => {
  const p = new NumPool(24);
  for (let i = 0; i < 10; i++) p.spawn(0, 0, 20, i, KIND.DMG, 0, true);
  assert.equal(p.alive, 10);
  p.update(NaN); p.update(Infinity);
  for (let i = 0; i < 40; i++) p.update(0.05);
  assert.equal(p.alive, 0);
  assert.equal(p.slots.filter((s) => s.on).length, 0);
  for (const b of BAD) assert.equal(p.spawn(0, 0, b, 1, KIND.DMG), null);
  assert.equal(p.spawn(NaN, Infinity, 5, 1, KIND.HEAL).x, 0);
  p.enabled = false;
  assert.equal(p.spawn(0, 0, 50, 1, KIND.DMG), null, 'damageNumbers setting off draws nothing');
});

test('HUD-3 pose: normal motion rises and pops; reduced motion fades in place (no rise, no pop)', () => {
  const p = new NumPool(24);
  const s = p.spawn(0, 0, 50, 1, KIND.DMG, 10, true);
  p.update(0.03);
  const a = { ...p.poseOf(s) };
  assert.ok(a.scale > s.mul, 'pop at the start');
  p.update(0.3);
  const b = { ...p.poseOf(s) };
  assert.ok(b.dy < a.dy && b.dy >= -30, 'floats up (bounded)');
  assert.ok(Math.abs(b.scale - s.mul) < 1e-9);
  const r = new NumPool(24);
  r.reduced = true;
  const t = r.spawn(0, 0, 50, 1, KIND.DMG, 10, true);
  for (let k = 0; k < 12; k++) {
    r.update(0.05);
    if (!t.on) break;
    const o = r.poseOf(t);
    assert.equal(o.dy, 0); assert.equal(o.scale, t.mul);
    assert.ok(o.alpha >= 0 && o.alpha <= 1);
  }
  const u = r.spawn(0, 0, 9, 3, KIND.DMG, 0, true);
  r.update(u.life * 0.9);
  assert.ok(r.poseOf(u).alpha < 1, 'fades in place');
});

test('HUD-3 jitter stays within the rule (+/-6px) and is deterministic per pool', () => {
  const a = new NumPool(40), b = new NumPool(40);
  for (let i = 0; i < 30; i++) {
    const x = a.spawn(100, 100, 20, i, KIND.DMG, 0, true), y = b.spawn(100, 100, 20, i, KIND.DMG, 0, true);
    assert.ok(Math.abs(x.x - 100) <= 6.01);
    assert.equal(x.x, y.x);
  }
});

const fakeSim = (o = {}) => ({ time: 10, xp: 0, level: 1, gold: 0, player: { hp: 100, maxHp: 100 }, ...o });

test('HUD-3 FbWatch: gem / gold flags rate-limited to 150ms; level flag; no flags when nothing changed', () => {
  const w = new FbWatch();
  const sim = fakeSim();
  w.reset(sim);
  let o = w.step(sim);
  assert.deepEqual([o.gem, o.gold, o.heal, o.hurt, o.level], [false, false, 0, 0, false]);
  sim.xp = 3; sim.gold = 2; sim.time = 10.016;
  o = w.step(sim);
  assert.equal(o.gem, true); assert.equal(o.gold, true);
  sim.xp = 4; sim.gold = 3; sim.time = 10.05;
  o = w.step(sim);
  assert.equal(o.gem, false, 'under 150ms since the last pulse'); assert.equal(o.gold, false);
  sim.xp = 5; sim.time = 10.3;
  assert.equal(w.step(sim).gem, true);
  sim.level = 2; sim.xp = 0; sim.time = 11;
  o = w.step(sim);
  assert.equal(o.level, true); assert.equal(o.gem, true);
});

test('HUD-3 FbWatch: damage taken, discrete heals at once, regen gathers, max-HP change is not damage', () => {
  const w = new FbWatch();
  const sim = fakeSim({ player: { hp: 80, maxHp: 100 } });
  w.reset(sim);
  sim.player.hp = 71; sim.time += 0.016;
  assert.equal(w.step(sim).hurt, 9);
  sim.player.hp = 100; sim.time += 0.016;
  assert.equal(w.step(sim).heal, 29);
  sim.player.hp = 60; sim.time += 0.016; w.step(sim);
  let healed = 0, shown = 0;
  for (let i = 0; i < 120; i++) { sim.player.hp += 0.1; sim.time += 0.05; const o = w.step(sim); if (o.heal > 0) { healed += o.heal; shown++; } }
  assert.ok(shown >= 3 && shown <= 12, `regen numbers are rare, got ${shown}`);
  assert.ok(healed > 0 && healed <= 12.5);
  sim.player.maxHp = 130; sim.player.hp = 90; sim.time += 0.016;
  const o = w.step(sim);
  assert.equal(o.hurt, 0); assert.equal(o.heal, 0);
});

test('HUD-3 FbWatch: a clock that goes backwards (new run) resets without a false hurt/heal', () => {
  const w = new FbWatch();
  w.reset(fakeSim({ time: 500, player: { hp: 10, maxHp: 100 } }));
  const o = w.step(fakeSim({ time: 0.2, player: { hp: 100, maxHp: 100 } }));
  assert.deepEqual([o.hurt, o.heal], [0, 0]);
});

test('HUD-3 FbWatch: NaN / Infinity / missing sim never throws and never reports nonsense', () => {
  const w = new FbWatch();
  assert.doesNotThrow(() => w.step(null));
  assert.doesNotThrow(() => w.step({}));
  for (const b of BAD) {
    const o = w.step(fakeSim({ time: b, xp: b, level: b, gold: b, player: { hp: b, maxHp: b } }));
    for (const k of ['heal', 'hurt']) assert.ok(Number.isFinite(o[k]) && o[k] >= 0);
  }
});

test('HUD-3 colour rules in code: no evolution gold on numbers or pickup effects; red only for damage taken', () => {
  const src = readFileSync(new URL('../src/gfx/dmgnums.js', import.meta.url), 'utf8');
  assert.ok(!/PAL\.gold|ROLE\.evo/.test(src), 'numbers never use gold');
  assert.ok(src.includes('TINT = [PAL.cream, 0xffdcae, 0x8fe3c8, 0xff8078, ROLE.bleed]'));
  const scene = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  const fx = scene.slice(scene.indexOf('  levelBurst() {'), scene.indexOf('  evolveMoment() {'));
  assert.ok(fx.length > 200 && !/PAL\.gold|ROLE\.evo|PAL\.danger/.test(fx), 'level-up / heart / magnet / gem feedback is not gold or red');
  assert.ok(/PAL\.thread/.test(fx) && /ROLE\.heart/.test(fx) && /ROLE\.magnet/.test(fx));
});

test('HUD-3 CSS: every new one-shot animation is switched off by reduced motion; no blur/filter in-run', () => {
  const css = readFileSync(new URL('../src/hud.css', import.meta.url), 'utf8');
  const tail = css.slice(css.indexOf('HUD-3:'));
  for (const sel of ['.h-thread.pulse', '.h-lamp.flare::after', '.h-coin.tick', '.h-knot.flare::after', '.h-ability.ping::after', '.h-boss.enter']) {
    assert.ok(tail.includes(`.reduced-motion ${sel}`), `${sel} has a reduced-motion override`);
  }
  assert.ok(!/backdrop-filter|filter:\s*blur/.test(tail));
});
