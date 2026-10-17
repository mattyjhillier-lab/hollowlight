// AL-6 dawn chorus: pure-field tests (no Phaser). Visual only: no sim import, no Math.random, caps per tier, determinism, Calm = static, Low simplest.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DawnField, phaseAt, airN, DAWN_CAPS, BIRD_MAX, PETAL_MAX, SHAFT_MAX, TM, CUES, BRIGHT_K } from '../src/gfx/dawn.js';
import { BIRD_DEPTH, PETAL_DEPTH, SHAFT_DEPTH } from '../src/gfx/dawnlayer.js';
import { CAPS } from '../src/gfx/quality.js';

const VIEW = { x0: 1000, y0: 1000, x1: 1640, y1: 1360 };
const tierBud = (tier, phone = false) => ({ birds: airN(CAPS[tier].ambient.birds, phone, 12), petals: airN(DAWN_CAPS[tier].petals, phone, 10), shafts: airN(DAWN_CAPS[tier].shafts, phone, 3) });
function run(f, tier, { from = 0, to = 900, dt = 1 / 30, calm = false, phone = false, victory = false, bright = 'normal', each = null } = {}) {
  const b = tierBud(tier, phone);
  const st = { calm, phone, victory, hx: 0, hy: 0, bright };
  for (let s = from; s <= to; s += dt) { f.setBudget(b.birds, b.petals, b.shafts); f.update(dt, s, VIEW, st); if (each) each(f, s); }
}
const sum = (a) => a.reduce((x, v) => x + v, 0);

test('caps: dawn birds 12 / 8 / 4 per tier, Low has no petals or shafts, array sizes match', () => {
  assert.deepEqual([CAPS.high.ambient.birds, CAPS.med.ambient.birds, CAPS.low.ambient.birds], [12, 8, 4]);
  assert.equal(BIRD_MAX, 12);
  assert.deepEqual(DAWN_CAPS.low, { petals: 0, shafts: 0 });
  assert.ok(DAWN_CAPS.high.petals <= PETAL_MAX && DAWN_CAPS.high.shafts <= SHAFT_MAX);
  assert.ok(DAWN_CAPS.med.petals <= DAWN_CAPS.high.petals && DAWN_CAPS.med.shafts <= DAWN_CAPS.high.shafts);
  assert.equal(airN(12, true, 12), 7); assert.equal(airN(4, true, 12), 2); assert.equal(airN(0, false, 12), 0); assert.equal(airN(NaN, false, 12), 0);
  assert.deepEqual(CUES, ['dawn_chorus_1', 'dawn_chorus_2', 'dawn_chorus_3']);
});

test('moment envelopes: first light ~8:00-9:00, hush ~10:00, flood 14:00-15:00, bounded 0..1, NaN safe', () => {
  const o = { first: 0, hush: 0, flood: 0 };
  phaseAt(0, o); assert.deepEqual(o, { first: 0, hush: 0, flood: 0 });
  phaseAt(520, o); assert.ok(o.first > 0.95 && o.hush === 0 && o.flood === 0);
  phaseAt(600, o); assert.ok(o.hush > 0.99 && o.first === 0);
  phaseAt(700, o); assert.ok(o.hush === 0 && o.first === 0 && o.flood === 0);
  phaseAt(860, o); assert.ok(o.flood > 0.8 && o.flood < 1);
  phaseAt(890, o); assert.equal(o.flood, 1);
  for (const s of [NaN, -5, Infinity, undefined]) { phaseAt(s, o); for (const k of ['first', 'hush', 'flood']) assert.ok(o[k] >= 0 && o[k] <= 1, `${s} ${k}`); }
});

test('birds never exceed the tier cap; first light brings 1-3 sparrows once; the flood is a burst of exactly the cap', () => {
  for (const tier of ['low', 'med', 'high']) for (const phone of [false, true]) {
    const f = new DawnField(7); const cap = tierBud(tier, phone).birds; let peakFirst = 0; let peakFlood = 0;
    run(f, tier, { phone, each: (ff, s) => { const n = ff.activeBirds(); assert.ok(n <= cap, `${tier} ${s}`); if (s < 700) peakFirst = Math.max(peakFirst, n); else peakFlood = Math.max(peakFlood, n); } });
    assert.ok(peakFirst >= 1 && peakFirst <= 3, `${tier} first light ${peakFirst}`);
    assert.equal(peakFlood, cap, `${tier} flood`);
  }
});

test('a run that starts late plays only what is still ahead (t=870: flood now, no first light; t=600: no sparrows)', () => {
  const a = new DawnField(3); run(a, 'high', { from: 870, to: 870.2 }); assert.equal(a.activeBirds(), 12);
  const b = new DawnField(3); let any = false; run(b, 'high', { from: 600, to: 700, each: (f) => { if (f.activeBirds()) any = true; } }); assert.equal(any, false);
});

test('determinism: same seed and steps give identical arrays; a different seed differs', () => {
  const mk = (seed) => { const f = new DawnField(seed); run(f, 'high', { from: 480, to: 900, dt: 1 / 20 }); return [f.bx, f.by, f.ba, f.px, f.py, f.pa, f.sx, f.sa].map((x) => Array.from(x).join(',')).join('|'); };
  assert.equal(mk(11), mk(11));
  assert.notEqual(mk(11), mk(12));
});

test('Calm motion is static: no birds, petals or shafts ever; only the colour flush and fade/thin multipliers remain', () => {
  const f = new DawnField(5);
  run(f, 'high', { calm: true, each: (ff) => { assert.equal(ff.activeBirds(), 0); assert.ok(ff.pa.every((v) => v === 0) && ff.sa.every((v) => v === 0)); assert.equal(ff.mod.rise, 0); assert.equal(ff.mod.slow, 0); } });
  assert.ok(f.mod.flush > 0.04 && f.mod.thin > 0.2);
});

test('Low: 4 birds, no petals, no shafts; Med/High show petals + shafts only in the flood', () => {
  const lo = new DawnField(5); let lp = 0; let ls = 0; run(lo, 'low', { each: (f) => { lp += sum(f.pa); ls += sum(f.sa); } });
  assert.equal(lp, 0); assert.equal(ls, 0);
  const hi = new DawnField(5); let early = 0; let late = 0;
  run(hi, 'high', { each: (f, s) => { const v = sum(f.pa) + sum(f.sa); if (s < 830) early += v; else late += v; } });
  assert.equal(early, 0); assert.ok(late > 1);
});

test('mods: fireflies rise + fade at first light, critters hush at ~10:00 and are released, flood lets them return eagerly', () => {
  const f = new DawnField(1); const m = f.mod; const st = { calm: false, hx: 0, hy: 0, bright: 'normal' };
  f.setBudget(12, 10, 3);
  f.update(0.05, 520, VIEW, st); assert.ok(m.rise > 0.9 && m.fade > 0.6 && m.thin > 0.3 && !m.hush);
  f.update(0.05, 600, VIEW, st); assert.ok(m.hush && m.slow > 0.5 && !m.eager);
  f.update(0.05, 700, VIEW, st); assert.ok(!m.hush && m.rise === 0 && m.fade === 0 && m.slow === 0);
  f.update(0.05, 880, VIEW, st); assert.ok(m.eager && !m.hush && m.fade > 0.7);
  for (const k of ['rise', 'fade', 'slow', 'thin', 'flush']) assert.ok(m[k] >= 0 && m[k] <= 1, k);
});

test('victory plays the final flush pulse (colour only) and a small flock if the sky is empty', () => {
  const f = new DawnField(2); const st = { calm: false, victory: true, hx: 0, hy: 0, bright: 'normal' };
  f.setBudget(12, 10, 3);
  f.update(0.05, 900, VIEW, st); // a late start fires the flood flock at once; clear it to test the victory flock itself
  f.killBirds(); f.fVic = false; f.vicT = -1;
  f.update(0.05, 900, VIEW, st); assert.ok(f.activeBirds() > 0 && f.activeBirds() <= 6);
  let peak = 0; for (let i = 0; i < 200; i++) { f.update(0.05, 900, VIEW, st); peak = Math.max(peak, f.mod.flush); }
  assert.ok(peak > 0.12 && peak <= 0.18, String(peak));
  assert.ok(f.mod.flush < peak && f.mod.flush >= 0.05 - 1e-9, 'pulse decays back to the flood level');
});

test('Brightness levels respected: Clear/Brighter quieten petals + shafts', () => {
  const peak = (bright) => { const f = new DawnField(4); let m = 0; run(f, 'high', { from: 860, to: 900, bright, each: (ff) => { m = Math.max(m, ...ff.sa, ...ff.pa); } }); return m; };
  assert.ok(peak('clear') < peak('brighter') && peak('brighter') < peak('normal'));
  assert.deepEqual(BRIGHT_K, { normal: 1, brighter: 0.8, clear: 0.65 });
});

test('no NaN / Infinity in any output, bad inputs survive', () => {
  const f = new DawnField(9); const st = { calm: false, hx: NaN, hy: Infinity, bright: 'x' };
  f.setBudget(NaN, Infinity, -4);
  for (const [dt, s] of [[NaN, NaN], [-1, -1], [5, 1e9], [0.016, 845]]) f.update(dt, s, VIEW, st);
  run(f, 'high', { from: 480, to: 900, dt: 0.1, each: (ff) => { for (const a of [ff.bx, ff.by, ff.ba, ff.bs, ff.px, ff.py, ff.pa, ff.pr, ff.pk, ff.sx, ff.sy, ff.sa]) for (const v of a) assert.ok(Number.isFinite(v)); for (const k of Object.keys(ff.mod)) if (typeof ff.mod[k] === 'number') assert.ok(Number.isFinite(ff.mod[k])); } });
  assert.ok(Number.isFinite(f.sw) && Number.isFinite(f.sh));
});

test('visual only: no sim import, no Math.random, no allocation in update(), all depths below every creature (55000+) and pickup', () => {
  for (const file of ['src/gfx/dawn.js', 'src/gfx/dawnlayer.js']) {
    const src = readFileSync(new URL('../' + file, import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
    assert.ok(!/from '\.\.\/sim|sim\/|Sim\.js/.test(src), file + ' imports the sim');
    assert.ok(!/Math\.random/.test(src), file + ' uses Math.random');
  }
  const src = readFileSync(new URL('../src/gfx/dawn.js', import.meta.url), 'utf8');
  const upd = src.slice(src.indexOf('  update(dt, s, view, st) {'));
  assert.ok(!/\bnew \w|=> |\.map\(|\.filter\(|\[\.\.\./.test(upd), 'update() allocates');
  for (const d of [BIRD_DEPTH + 0.2, PETAL_DEPTH, SHAFT_DEPTH]) assert.ok(d < 55000);
  assert.ok(TM.burstAt >= TM.floodIn0 && TM.burstAt < 870 && TM.arriveFrom >= 480 && TM.arriveUntil <= 600);
});
