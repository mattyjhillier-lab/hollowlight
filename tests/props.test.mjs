import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cellProps, PropField, PetalField, EDGE_BAND, EDGE_KEEP, START_CLEAR, AMP, WOBBLE, CROWN_MIN, PETAL_ALPHA, PETAL_DEPTH, reach, PETAL_KINDS } from '../src/gfx/propfield.js';
import { PropLayer, SHADE_DEPTH } from '../src/gfx/proplayer.js';
import { layout, KINDS, KIND_NAMES, frameName, drawPropAtlas, ATLAS_W, kindGeo, PETAL_FRAMES } from '../src/gfx/propatlas.js';
import { CAPS } from '../src/gfx/quality.js';
import { zoneB } from '../src/world/zones.js';
import { REDUCED_SCALE } from '../src/gfx/wind.js';

const W = 4000;
const zone = (x, y) => zoneB(x, y, W);
const clear = [{ x: 2000, y: 2000, tall: START_CLEAR.tall, low: START_CLEAR.low }];
const all = { x0: 0, y0: 0, x1: W, y1: W };
const alive = { sample: () => 1, sampleClean: () => 1 };
const dead = { sample: () => 0, sampleClean: () => 0 };
const VIEW = { x0: 1000, y0: 500, x1: 1620, y1: 850 };
const mkField = (cap, o = {}) => { const f = new PropField({ seed: 7, zone, clear }); f.setBudget(cap, o.density || 1, !!o.phone, o.sway !== false); return f; };
const worldProps = (seed = 5) => { const out = []; for (let cj = 0; cj < 42; cj++) for (let ci = 0; ci < 42; ci++) out.push(...cellProps(ci, cj, seed, zone, W, clear)); return out; };

test('placement: deterministic, inside the world, unique ids, zone-aware, seed-dependent', () => {
  const a = worldProps(5); const b = worldProps(5); const c = worldProps(6);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.map((p) => p.x), c.map((p) => p.x));
  const ids = new Set();
  for (const p of a) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && p.x > 0 && p.y > 0 && p.x < W && p.y < W);
    assert.ok(!ids.has(p.id)); ids.add(p.id);
    assert.ok(KINDS[p.kind] && p.variant >= 0 && p.variant < KINDS[p.kind].variants);
    assert.ok(p.size > 0.8 && p.size < 1.2 && p.jit >= 0 && p.jit <= 0xffffff && p.d >= 0 && p.d < 1);
  }
  assert.ok(a.length > 1000, 'dense enough ' + a.length);
  const kinds = new Set(a.map((p) => p.kind));
  for (const k of KIND_NAMES) assert.ok(kinds.has(k), 'kind appears: ' + k);
  assert.ok(a.filter((p) => p.kind === 'oak').every((p) => p.zb < 0.86), 'oaks stand in Take A zones');
  assert.ok(a.filter((p) => p.kind === 'pillar' && Math.min(p.x, p.y, W - p.x, W - p.y) >= EDGE_BAND).every((p) => p.zb > 0.14), 'pillars stand in Take B zones');
  assert.ok(a.some((p) => p.kind === 'oak') && a.some((p) => p.kind === 'pillar'));
});

test('placement rules: clear start area, wall at the edge is only pillars, nothing else near the edge, tall props never touch', () => {
  const a = worldProps(3);
  for (const p of a) {
    const e = Math.min(p.x, p.y, W - p.x, W - p.y);
    if (e < EDGE_BAND) assert.equal(p.kind, 'pillar', 'edge band holds only the wall pillars');
    else if (!p.tall) assert.ok(e >= EDGE_KEEP);
    const d = Math.hypot(p.x - 2000, p.y - 2000);
    assert.ok(d >= (p.tall ? START_CLEAR.tall : START_CLEAR.low), 'start area clear');
  }
  const wall = a.filter((p) => Math.min(p.x, p.y, W - p.x, W - p.y) < EDGE_BAND);
  assert.ok(wall.length > 40 && wall.length < 400, 'wall is a sparse row: ' + wall.length);
  const tall = a.filter((p) => p.tall && Math.min(p.x, p.y, W - p.x, W - p.y) >= EDGE_BAND);
  let near = 0;
  for (let i = 0; i < tall.length; i++) for (let j = i + 1; j < tall.length; j++) if (Math.abs(tall[i].x - tall[j].x) < 40 && Math.abs(tall[i].y - tall[j].y) < 40) near++;
  assert.equal(near, 0);
});

test('per-tier caps hold with the whole world in view; Low is fewer; phone is fewer; cap 0 releases everything', () => {
  const counts = {};
  for (const tier of ['high', 'med', 'low']) {
    const pc = CAPS[tier].props;
    const f = mkField(pc.live, { density: pc.density });
    f.refresh(all, alive);
    counts[tier] = f.count;
    assert.ok(f.count <= pc.live, `${tier} ${f.count} <= ${pc.live}`);
    assert.ok(f.count > 0);
  }
  assert.equal(counts.high, 120, 'High fills its cap when the whole world is asked for');
  assert.ok(counts.low < counts.med && counts.med < counts.high);
  const n = (o) => { const f = mkField(120, o); f.refresh(VIEW, alive); return f.count; };
  assert.ok(n({}) > 5);
  assert.ok(n({ density: 0.6 }) < n({}));
  assert.ok(n({ phone: true }) < n({}));
  const f = mkField(120); f.refresh(VIEW, alive); assert.ok(f.count > 0);
  f.setBudget(0); assert.equal(f.count, 0);
  const g = mkField(30); g.refresh(all, alive); g.setBudget(10); assert.ok(g.count <= 10);
});

test('refresh: props appear only just outside what is visible (no pop) and are recycled far away', () => {
  const f = mkField(120);
  const added = [];
  f.onAdd = (s) => added.push(s);
  f.refresh(VIEW, alive);
  assert.ok(added.length > 5);
  for (const s of added) { const r = reach(s.prop); assert.ok(s.prop.x + r.hw >= VIEW.x0 - 24 && s.prop.x - r.hw <= VIEW.x1 + 24 && s.prop.y + r.top <= VIEW.y1 + 24 && s.prop.y + r.bottom >= VIEW.y0 - 24); }
  assert.ok(added.some((s) => s.prop.tall && s.prop.y > VIEW.y1), 'a tall prop whose base is below the view still shows its top');
  f.refresh({ x0: 3000, y0: 3000, x1: 3620, y1: 3350 }, alive);
  assert.ok([...f.slots.values()].every((s) => Math.abs(s.prop.x - 3300) < 800));
});

test('swap crossfade: no pop, bounded step, reaches colour and back; scroll-in props are already restored; Hollow stays grey', () => {
  const f = mkField(120);
  const life = { v: 0, sampleClean() { return this.v; } };
  f.refresh(VIEW, life);
  assert.ok(f.count > 3);
  for (const s of f.slots.values()) assert.equal(s.r, 0, 'Hollow at the start');
  life.v = 1;
  let prev = 0; let maxStep = 0; let t = 0;
  const s0 = [...f.slots.values()][0];
  for (let i = 0; i < 120; i++) { f.step(0.05, t += 0.05, life); maxStep = Math.max(maxStep, s0.r - prev); assert.ok(s0.r >= prev - 1e-9); prev = s0.r; }
  assert.ok(maxStep < 0.17, 'crossfade is gradual: ' + maxStep);
  assert.equal(s0.r, 1);
  const g = mkField(120);
  g.refresh(VIEW, alive);
  for (const s of g.slots.values()) assert.equal(s.r, 1);
  life.v = 0; let low = 1;
  for (let i = 0; i < 120; i++) { f.step(0.05, t += 0.05, life); low = Math.min(low, s0.r); }
  assert.equal(low, 0);
});

test('AL-3 crown sway: Hollow stays still, restored leans within the amplitude, Low static, reduced motion quarter, never NaN', () => {
  const run = (life, o = {}, reduced = false) => {
    const f = mkField(120, o);
    f.refresh(VIEW, life);
    let mx = 0; let n = 0;
    for (let i = 0; i < 1200; i++) {
      f.step(0.05, i * 0.05, life, reduced);
      for (const s of f.slots.values()) {
        if (!KINDS[s.prop.kind].layers.crown) { assert.equal(s.ang, 0); continue; }
        assert.ok(Number.isFinite(s.ang) && Number.isFinite(s.r) && Number.isFinite(s.crownA));
        mx = Math.max(mx, Math.abs(s.ang)); n++;
      }
    }
    return { mx, n };
  };
  const hollow = run(dead);
  assert.ok(hollow.n > 0 && hollow.mx === 0, 'Hollow crowns are still');
  const full = run(alive);
  assert.ok(full.mx > AMP * 0.45, 'readable: ' + full.mx);
  assert.ok(full.mx <= AMP + WOBBLE + 1e-9, 'bounded: ' + full.mx);
  const low = run(alive, { sway: false });
  assert.equal(low.mx, 0, 'Low is static');
  const red = run(alive, {}, true);
  assert.ok(red.mx > 0 && red.mx <= (AMP + WOBBLE) * REDUCED_SCALE + 1e-9, 'reduced motion x0.25: ' + red.mx);
});

test('crowns fade when creatures stand under them and return; the hero counts', () => {
  const f = mkField(120);
  f.refresh(VIEW, alive);
  const s = [...f.slots.values()].find((k) => KINDS[k.prop.kind].layers.crown);
  assert.ok(s, 'a crowned prop in view');
  const g = kindGeo(s.prop.kind).crown;
  const under = [{ x: s.prop.x, y: s.prop.y + ((g.y0 + g.y1) / 2) * s.prop.size }];
  for (let i = 0; i < 40; i++) f.step(0.05, i * 0.05, alive, false, under, 1);
  assert.ok(s.crownA < CROWN_MIN + 0.03 && s.crownA >= CROWN_MIN - 1e-9, 'faded to the floor: ' + s.crownA);
  for (let i = 0; i < 60; i++) f.step(0.05, 3 + i * 0.05, alive, false, [], 0);
  assert.ok(s.crownA > 0.97, 'returns');
  for (let i = 0; i < 40; i++) f.step(0.05, 6 + i * 0.05, alive, false, null, 0, under[0]);
  assert.ok(s.crownA < CROWN_MIN + 0.03, 'the hero fades it too');
});

test('no NaN: odd life values, huge/zero/NaN dt, NaN positions never break state', () => {
  const f = mkField(120);
  f.refresh(VIEW, alive);
  const wild = { sampleClean: (x) => (Math.floor(x) % 3 === 0 ? 7 : Math.floor(x) % 3 === 1 ? -2 : 0.4) };
  for (const dt of [0, 0.05, 5, -1, NaN, 1e9]) f.step(dt, 10, wild, false, [{ x: NaN, y: NaN }], 1);
  for (const s of f.slots.values()) assert.ok(Number.isFinite(s.r) && s.r >= 0 && s.r <= 1 && Number.isFinite(s.ang) && Number.isFinite(s.crownA));
  f.refresh({ x0: NaN, y0: 0, x1: 100, y1: 100 }, wild);
  f.refresh(null, wild);
});

test('petals: capped per tier (Low none, phone x0.6), only off restored blossoming crowns, alpha <= 0.6, deterministic, none when reduced', () => {
  assert.equal(CAPS.low.ambient.petals, 0);
  const field = (life = alive) => { const f = mkField(120); f.refresh(VIEW, life); return f; };
  assert.ok([...field().slots.values()].some((s) => PETAL_KINDS.includes(s.prop.kind)), 'a blossoming crown is in view');
  const run = (cap, phone, reduced = false) => {
    const ff = field(); const p = new PetalField(3); p.setBudget(cap, phone);
    let mx = 0; const snap = [];
    for (let i = 0; i < 600; i++) {
      p.step(0.05, i * 0.05, ff.slots.values(), VIEW, reduced);
      mx = Math.max(mx, p.petals.length);
      for (const q of p.petals) { assert.ok(Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.rot)); assert.ok(p.alphaOf(q) <= PETAL_ALPHA + 1e-9 && p.alphaOf(q) >= 0); }
      if (i % 100 === 0) snap.push(p.petals.map((q) => [q.x.toFixed(2), q.y.toFixed(2)]));
    }
    return { mx, snap };
  };
  assert.equal(run(0, false).mx, 0);
  const hi = run(CAPS.high.ambient.petals, false);
  assert.ok(hi.mx > 0 && hi.mx <= CAPS.high.ambient.petals);
  assert.ok(run(CAPS.high.ambient.petals, true).mx <= Math.floor(CAPS.high.ambient.petals * 0.6));
  assert.ok(run(CAPS.med.ambient.petals, false).mx <= CAPS.med.ambient.petals);
  assert.equal(run(8, false, true).mx, 0, 'reduced motion: no petals');
  assert.deepEqual(run(8, false).snap, run(8, false).snap, 'deterministic');
  const ff = field(dead);
  const p = new PetalField(3); p.setBudget(8);
  for (let i = 0; i < 200; i++) p.step(0.05, i * 0.05, ff.slots.values(), VIEW);
  assert.equal(p.petals.length, 0, 'Hollow crowns shed nothing');
  assert.ok(PETAL_DEPTH > 4000 && PETAL_DEPTH < 5000, 'above every prop (depth = y), below the lightmap');
});

test('atlas: frames fit and never overlap; Hollow and restored share one silhouette box; fits 2048; drawing is finite', () => {
  const { items, frames, W: AW, H } = layout();
  assert.equal(AW, ATLAS_W);
  assert.ok(H <= 2048, 'atlas height ' + H);
  for (const it of items) { assert.ok(it.x >= 0 && it.y >= 0 && it.x + it.w <= AW && it.y + it.h <= H, it.name); assert.ok(it.w > 2 && it.h > 2); }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const a = items[i]; const b = items[j]; assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `overlap ${a.name} ${b.name}`); }
  for (const k of KIND_NAMES) for (let v = 0; v < KINDS[k].variants; v++) for (const layer of Object.keys(KINDS[k].layers)) {
    const h = frames[frameName(k, v, layer, 'h')]; const r = frames[frameName(k, v, layer, 'r')];
    assert.ok(h && r, `${k}${v}.${layer}`);
    assert.deepEqual([h.w, h.h, h.ax, h.ay], [r.w, r.h, r.ax, r.ay], 'same silhouette box');
  }
  for (const n of PETAL_FRAMES) assert.ok(frames[n]);
  assert.ok(frames.shade);
  let bad = 0; let calls = 0;
  const chk = (a) => { calls++; for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) bad++; };
  const ctx = new Proxy({}, { get(t, k) { if (k in t) return t[k]; if (k === 'createLinearGradient' || k === 'createRadialGradient') return (...a) => { chk(a); return { addColorStop() {} }; }; return (...a) => chk(a); }, set(t, k, v) { t[k] = v; return true; } });
  drawPropAtlas({ width: AW, height: H, getContext: () => ctx });
  assert.equal(bad, 0);
  assert.ok(calls > 1000);
});

function fakeScene() {
  const made = [];
  const mk = () => {
    const o = { visible: false, depth: 0, alpha: 1 };
    const m = new Proxy(o, { get(t, k) { if (k in t) return t[k]; return (...a) => { if (k === 'setVisible') t.visible = a[0]; else if (k === 'setDepth') t.depth = a[0]; else if (k === 'setAlpha') t.alpha = a[0]; return m; }; } });
    made.push(o);
    return m;
  };
  return { made, add: { image: () => mk() } };
}
const wvOf = (x, y, w = 620, h = 350) => ({ x, y, right: x + w, bottom: y + h });

test('PropLayer: pooled images, ~1 image per layer in steady state, depth below every creature and the lightmap, Low makes fewer', () => {
  const sc = fakeScene();
  const lay = new PropLayer(sc, { seed: 3, zone, world: W });
  lay.reset(3, clear);
  const st = { phone: false, reduced: false, creatures: [], nCreat: 0 };
  for (let i = 0; i < 80; i++) lay.update(0.05, i * 0.05, wvOf(1000 + i * 4, 600), alive, CAPS.high, st);
  assert.ok(lay.count > 8 && lay.count <= 120);
  const live = sc.made.filter((o) => o.visible);
  let layers = 0; let pillars = 0;
  for (const s of lay.field.slots.values()) { layers += Object.keys(KINDS[s.prop.kind].layers).length; if (s.prop.kind === 'pillar') pillars++; }
  assert.ok(live.length <= layers + pillars + lay.petalLive.length, 'steady state: one image per layer ' + live.length + ' vs ' + layers);
  for (const o of sc.made) assert.ok(o.depth < 5000 && (o.depth <= W + 1 || o.depth === PETAL_DEPTH), 'depth below the lightmap (5000) and every creature (60000): ' + o.depth);
  assert.ok(SHADE_DEPTH < 0);
  for (let i = 0; i < 100; i++) lay.update(0.05, 10 + i * 0.05, wvOf(1300, 600), dead, CAPS.high, st);
  const made0 = sc.made.length;
  for (let i = 0; i < 200; i++) lay.update(0.05, 20 + i * 0.05, wvOf(1300 + (i % 2) * 30, 600), i % 40 < 20 ? alive : dead, CAPS.high, st);
  assert.ok(sc.made.length <= made0 + 40, 'pool is reused across crossfades');
  const low = new PropLayer(fakeScene(), { seed: 3, zone, world: W }); low.reset(3, clear);
  const hi = new PropLayer(fakeScene(), { seed: 3, zone, world: W }); hi.reset(3, clear);
  for (let i = 0; i < 6; i++) { low.update(0.3, i, wvOf(1400, 700), alive, CAPS.low, st); hi.update(0.3, i, wvOf(1400, 700), alive, CAPS.high, st); }
  assert.ok(low.count < hi.count && low.count > 0);
  assert.equal(low.petalLive.length, 0);
  low.setTint(0x8090a0);
  const off = new PropLayer(fakeScene(), { seed: 1, zone, world: W });
  off.update(0.3, 1, wvOf(1400, 700), alive, { props: { live: 0, density: 1, sway: false }, ambient: { petals: 0 } }, st);
  assert.equal(off.count, 0);
});

test('caps table: props live/density/sway per tier; Low static', () => {
  assert.deepEqual(['high', 'med', 'low'].map((t) => CAPS[t].props.live), [120, 80, 40]);
  assert.equal(CAPS.low.props.sway, false);
  assert.ok(CAPS.med.props.sway && CAPS.high.props.sway);
  assert.ok(CAPS.low.props.density < 1);
});

test('visual only: the prop modules never import the sim and never use Math.random or the sim RNG', () => {
  for (const f of ['propatlas', 'propfield', 'proplayer']) {
    const src = readFileSync(new URL(`../src/gfx/${f}.js`, import.meta.url), 'utf8');
    assert.ok(!/sim\/|rng\.js|Math\.random/.test(src.replace(/\/\/.*$/gm, '')), f + ' is visual only');
  }
  const scene = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(/props\.reset\(\(\(sim\.seed \| 0\) \^ 0x9e0b5\)/.test(scene), 'visual seed derived from the run seed by xor; sim RNG untouched');
});
