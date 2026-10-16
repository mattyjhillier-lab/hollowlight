import test from 'node:test';
import assert from 'node:assert/strict';
import { Ribbon, RibbonSet, RibbonLayer, ribbonCaps, RIBBON_DEPTH } from '../src/gfx/ribbons.js';
import { CAPS } from '../src/gfx/quality.js';

const finite = (set) => { for (let i = 0; i < set.count; i++) for (const a of [set.sx, set.sy, set.sl, set.sr, set.sw, set.sa]) assert.ok(Number.isFinite(a[i]), 'finite'); };
const sim = (caps, secs, opts = {}) => {
  const set = new RibbonSet(600, 12, 64);
  const units = Array.from({ length: opts.units ?? 30 }, (_, i) => ({ id: i + 1, x: 0, y: 0, col: 0x9fe8ff, life: caps.spirits.life, fast: i % 3 === 0 }));
  let maxCount = 0; let maxSlots = 0;
  for (let t = 0; t < secs; t += 1 / 60) {
    const hx = t * 100;
    for (const [i, u] of units.entries()) { u.x = hx + 40 * Math.cos(t * 3 + i); u.y = 40 * Math.sin(t * 3 + i); }
    set.update(t, caps, { lx: hx, ly: -30 + Math.sin(t * 5) * 3, sx: hx - 5, sy: -13 }, units, units.length);
    const n = set.emit(t, caps, 0xffcf7a, 0xbff3e6);
    maxCount = Math.max(maxCount, n); maxSlots = Math.max(maxSlots, set.activeSlots());
    finite(set);
    assert.ok(n <= caps.segs, 'segment cap');
  }
  return { set, maxCount, maxSlots };
};

test('tier caps: low is the cheapest, med/high within budget, low has no spirit/scarf ribbons', () => {
  const R = (t) => ribbonCaps(CAPS[t].ribbon);
  assert.equal(R('low').spirits.n, 0); assert.equal(R('low').scarf.life, 0);
  assert.ok(R('low').segs <= 24 && R('low').lantern.life >= 1.4 && R('low').lantern.life <= 1.6);
  assert.ok(R('med').segs <= 260 && R('high').segs <= 600);
  assert.ok(R('low').segs < R('med').segs && R('med').segs < R('high').segs);
  assert.ok(R('high').spirits.n <= 12 && R('med').spirits.n <= 6);
  for (const t of ['low', 'med', 'high']) assert.ok(R(t).lantern.pts <= 48 && R(t).spirits.pts <= 48 && R(t).scarf.pts <= 48, 'fits the ring buffers');
  assert.ok(R('high').lantern.life >= 3.8 && R('high').lantern.life <= 4.2 && R('med').lantern.life >= 2.8 && R('med').lantern.life <= 3.2, 'W2b lantern lengths');
  assert.ok(RIBBON_DEPTH < 55000, 'under halos and every creature');
});

test('phone and reduced motion scale down', () => {
  const b = CAPS.high.ribbon;
  const p = ribbonCaps(b, { phone: true });
  assert.ok(p.segs < ribbonCaps(b).segs && p.spirits.n < ribbonCaps(b).spirits.n);
  const r = ribbonCaps(b, { reduced: true });
  assert.equal(r.spirits.n, 0); assert.equal(r.scarf.life, 0); assert.equal(r.lantern.core, false); assert.ok(r.lantern.life < ribbonCaps(b).lantern.life);
});

test('long swarm run per tier: segments and slots never exceed caps, no NaN', () => {
  for (const t of ['low', 'med', 'high']) for (const o of [{}, { phone: true }]) {
    const caps = ribbonCaps(CAPS[t].ribbon, o);
    const r = sim(caps, 20);
    assert.ok(r.maxCount <= caps.segs, `${t} segs`);
    assert.ok(r.maxSlots <= caps.spirits.n, `${t} slots ${r.maxSlots} <= ${caps.spirits.n}`);
  }
});

test('trails fade out: after the source stops, everything is gone within one life', () => {
  const caps = ribbonCaps(CAPS.high.ribbon);
  const { set } = sim(caps, 5);
  const now = 5 + caps.lantern.life + 0.2;
  set.update(now, caps, null, [], 0);
  assert.equal(set.emit(now, caps, 1, 2), 0);
  assert.equal(set.activeSlots(), 0, 'slots released');
});

test('bad input is ignored: NaN/Infinity points never enter, and a huge jump breaks the ribbon', () => {
  const r = new Ribbon(8);
  assert.equal(r.push(NaN, 0, 0, 0.05), false); assert.equal(r.push(0, Infinity, 0, 0.05), false); assert.equal(r.push(0, 0, NaN, 0.05), false);
  assert.equal(r.n, 0);
  r.push(0, 0, 0, 0.05); r.push(10, 0, 0.1, 0.05); r.push(5000, 0, 0.2, 0.05); r.push(5010, 0, 0.3, 0.05);
  const set = new RibbonSet(20, 2, 8); set.hero = r;
  const caps = ribbonCaps(CAPS.high.ribbon);
  const n = set.emit(0.3, caps, 1, 2);
  finite(set);
  for (let i = 0; i < n; i++) assert.ok(set.sl[i] < 100, 'no streak across the jump');
});

test('ring buffer wraps without growth', () => {
  const r = new Ribbon(6);
  for (let i = 0; i < 100; i++) r.push(i * 5, 0, i * 0.1, 0.05);
  assert.equal(r.n, 6); assert.equal(r.x.length, 6);
  assert.equal(r.x[r.idx(0)], 99 * 5);
});

test('stationary source adds no points; spirits beyond the slot cap get none (stable, no flicker)', () => {
  const caps = ribbonCaps(CAPS.med.ribbon);
  const set = new RibbonSet(600, 12, 64);
  const units = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, x: i, y: 0, col: 1, life: 0.7 }));
  for (let t = 0; t < 2; t += 0.05) set.update(t, caps, { lx: 5, ly: 5, sx: 5, sy: 5 }, units, units.length);
  assert.equal(set.hero.n, 1); assert.equal(set.activeSlots(), caps.spirits.n);
});

test('layer pools images: created never exceeds the cap and is reused', () => {
  const made = [];
  const mk = () => { const o = { vis: false }; const chain = new Proxy(o, { get: (t, k) => (k === 'vis' ? t.vis : (...a) => { if (k === 'setVisible') t.vis = a[0]; return chain; }) }); made.push(chain); return chain; };
  const scene = { add: { image: mk } };
  const layer = new RibbonLayer(scene, 'glow', 1, 1, 50);
  const caps = ribbonCaps(CAPS.high.ribbon);
  const { set } = sim(caps, 6);
  for (let i = 0; i < 5; i++) { layer.render(set, set.count); }
  layer.render(set, 9999);
  assert.ok(layer.created <= 50);
  const before = layer.created;
  layer.render(set, 5); layer.render(set, set.count);
  assert.equal(layer.created, before, 'reused');
  layer.clear(); assert.equal(layer.shown, 0);
});

test('W2b: fast spirits are sampled at a higher rate and drawn wider; spirits get a lighter core layer', () => {
  const caps = ribbonCaps(CAPS.high.ribbon);
  const mk = (fast) => { const set = new RibbonSet(600, 12, 64); let t = 0; for (; t < 1; t += 1 / 60) set.update(t, caps, null, [{ id: 1, x: t * 260, y: 0, col: 0x9fe8ff, life: 1.4, fast }], 1); return { set, t }; };
  const a = mk(true); const b = mk(false);
  assert.ok(a.set.slots[0].rib.n > b.set.slots[0].rib.n * 1.5, 'more points per second for fast sources');
  assert.ok(a.set.slots[0].wm > b.set.slots[0].wm);
  const n = a.set.emit(a.t, caps, 1, 2);
  assert.ok(n > 0 && n <= caps.segs);
  const cols = new Set(); for (let i = 0; i < n; i++) cols.add(a.set.sc[i]);
  assert.ok(cols.size >= 2, 'body + lighter core');
});

test('W2b: rigs expose a scarf/hem trail anchor (draws nothing)', async () => {
  const w = await import('../src/gfx/wrenart.js'); const e = await import('../src/gfx/eliasart.js');
  assert.ok(Array.isArray(w.ANCHOR.scarf) && w.ANCHOR.scarf.every(Number.isFinite) && w.ANCHOR.scarf[0] < 0, 'behind the shoulders');
  assert.ok(Array.isArray(e.E_ANCHOR.hem) && e.E_ANCHOR.hem.every(Number.isFinite) && e.E_ANCHOR.hem[0] < 0);
});
