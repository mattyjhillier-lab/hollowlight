// S6 Chain Lightning 'Storm Thread' render helpers (pure; mock Graphics records every point drawn)
import test from 'node:test';
import assert from 'node:assert/strict';
import { hj, pillarTop, decalCap, jagStep, CrackPool, CRACK_LIFE, PILLAR_MIN, PILLAR_MAX, HUD_BAND, chainCaps, drawArc, drawPillar, drawDome, drawBraid } from '../src/gfx/summon/chain.js';

function mockG() {
  const g = { ys: [], calls: [], log(n, a) { g.calls.push(n + ':' + a.map((v) => (typeof v === 'number' ? v.toFixed(3) : v)).join(',')); } };
  const pt = (x, y) => g.ys.push(y);
  for (const n of ['lineStyle', 'fillStyle', 'beginPath', 'strokePath']) g[n] = (...a) => { g.log(n, a); return g; };
  g.moveTo = (x, y) => { pt(x, y); g.log('m', [x, y]); return g; };
  g.lineTo = (x, y) => { pt(x, y); g.log('l', [x, y]); return g; };
  g.lineBetween = (x0, y0, x1, y1) => { pt(x0, y0); pt(x1, y1); g.log('lb', [x0, y0, x1, y1]); return g; };
  g.fillRect = (x, y, w, h) => { pt(x, y); pt(x, y + h); g.log('fr', [x, y, w, h]); return g; };
  g.fillCircle = (x, y, r) => { pt(x, y - r); g.log('fc', [x, y, r]); return g; };
  g.strokeCircle = (x, y, r) => { pt(x, y - r); g.log('sc', [x, y, r]); return g; };
  return g;
}

test('hj is deterministic and in [-0.5, 0.5)', () => {
  for (let i = -50; i < 500; i++) { const v = hj(i); assert.ok(v >= -0.5 && v < 0.5); assert.equal(v, hj(i)); }
});

test('Judgment pillar height 70-120 u and never inside the HUD band', () => {
  for (let s = 0; s < 400; s++) {
    const top = pillarTop(1000, 0, 360, s);
    assert.ok(1000 - top >= PILLAR_MIN - 1e-9 && 1000 - top <= PILLAR_MAX + 1e-9);
    const y1 = 20 + (s % 340), t2 = pillarTop(y1, 0, 360, s); // foes near the top edge: column clamped below the band
    assert.ok(t2 >= HUD_BAND * 360 - 1e-9);
  }
});

test('drawPillar draws no pixel above its capped top (sky-crack spreads sideways/down), 30 strikes', () => {
  const cap = chainCaps('high');
  for (let s = 0; s < 30; s++) {
    const g = mockG(), y1 = 30 + s * 11, top = pillarTop(y1, 0, 360, s);
    drawPillar(g, 100 + s * 7, y1, top, s * 977, 1, cap, 0);
    const minY = Math.min(...g.ys);
    assert.ok(minY >= top - 1e-3, `strike ${s}: ${minY} < ${top}`);
    assert.ok(minY >= HUD_BAND * 360 - 1e-3);
  }
});

test('crack-star decal pool: per-tier caps (phone x0.6), ring overwrite, 0.5 s life', () => {
  assert.deepEqual([decalCap('high'), decalCap('med'), decalCap('low')], [40, 24, 12]);
  assert.deepEqual([decalCap('high', true), decalCap('med', true), decalCap('low', true)], [24, 14, 7]);
  const p = new CrackPool(40);
  for (const tier of ['high', 'med', 'low']) {
    p.setCap(decalCap(tier));
    for (let i = 0; i < 100; i++) p.add(i, i, 1, i);
    assert.equal(p.live(1.1), decalCap(tier));
    assert.equal(p.live(1 + CRACK_LIFE + 0.01), 0);
  }
  const g = mockG(); p.setCap(12); for (let i = 0; i < 12; i++) p.add(10, 10, 0, i);
  p.draw(g, 0.2, 0, 0, 100, 100); assert.ok(g.calls.length > 12);
  const g2 = mockG(); p.draw(g2, 0.6, 0, 0, 100, 100); assert.equal(g2.calls.length, 0);
});

test('re-jag every 60 ms; Calm = one steady shape', () => {
  assert.equal(jagStep(0.05, false), 0); assert.equal(jagStep(0.07, false), 1); assert.equal(jagStep(1.0, false), 16);
  for (const t of [0, 0.3, 5, 99]) assert.equal(jagStep(t, true), 0);
  const cap = chainCaps('high');
  const a = mockG(), b = mockG(), c = mockG();
  drawArc(a, 0, 0, 120, 40, 5 * 977 + jagStep(0.01, true) * 7919, 1, cap);
  drawArc(b, 0, 0, 120, 40, 5 * 977 + jagStep(0.4, true) * 7919, 1, cap);
  drawArc(c, 0, 0, 120, 40, 5 * 977 + jagStep(0.4, false) * 7919, 1, cap);
  assert.deepEqual(a.calls, b.calls); // Calm: identical over time
  assert.notDeepEqual(a.calls, c.calls); // normal: re-jagged
});

test('3-layer arc: violet fringe on Med/High only, cyan glow + white core always', () => {
  for (const tier of ['high', 'med', 'low']) {
    const g = mockG(); drawArc(g, 0, 0, 80, 0, 1, 1, chainCaps(tier));
    const ls = g.calls.filter((s) => s.startsWith('lineStyle'));
    const violet = ls.some((s) => s.includes(',' + (0x8a5cff).toFixed(3) + ','));
    assert.equal(violet, tier !== 'low');
    assert.ok(ls.some((s) => s.includes(',' + (0xb8f2ff).toFixed(3) + ',')) && ls.some((s) => s.includes(',' + (0xffffff).toFixed(3) + ',')));
  }
});

test('Storm Tether braid is steady (no time input) with knot beads; Static dome steady under Calm', () => {
  const cap = chainCaps('high'), a = mockG(), b = mockG();
  drawBraid(a, 0, 0, 100, 0, 2, 1, cap, false); drawBraid(b, 0, 0, 100, 0, 2, 1, cap, false);
  assert.deepEqual(a.calls, b.calls);
  assert.ok(a.calls.filter((s) => s.startsWith('fc')).length >= 10); // 5 beads x 2 circles
  const d1 = mockG(), d2 = mockG();
  drawDome(d1, 0, 0, 150, 0, 0.1, true, cap); drawDome(d2, 0, 0, 150, 0, 7.3, true, cap);
  assert.deepEqual(d1.calls, d2.calls);
});
