// EN0-EN2: Husk enemy art pipeline (pure parts): atlas layout + frames, SVG sheet safety, eye anchors, jitter determinism, frame pickers,
// no per-frame allocation, tier caps, RunScene/night-layer wiring, sim untouched by the art.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HUSK_TYPES, HUSK_IDS, FR, layoutAtlas, typeSheet, eyeAnchors, jitter, ATLAS_W, TPW, HUSK_EYE_K, hurtPoint } from '../src/gfx/husk/frames.js';
import { walkFrame, crowFrame, CORPSE_CAPS } from '../src/gfx/enemyrig.js';
import { parseParams } from '../src/params.js';
import { data } from './helpers.mjs';

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('ids unchanged and every Husk type is a real enemy (saves, kill gates and tree conditions keep working)', () => {
  assert.deepEqual(HUSK_IDS, ['wolf', 'crow', 'root_crawler']);
  for (const id of HUSK_IDS) assert.ok(data.enemies[id], id);
  assert.equal(data.enemies.wolf.name, 'Fell Wolf');
  assert.equal(data.enemies.crow.name, 'Grave Crow');
  assert.equal(data.enemies.root_crawler.name, 'Root Crawler');
});

test('atlas layout: every frame of every type is present, inside the atlas, no overlaps, within the size budget', () => {
  const L = layoutAtlas();
  assert.equal(L.w, ATLAS_W);
  assert.ok(L.h <= 512, 'atlas height ' + L.h);
  const rects = [];
  let bytes = 0;
  for (const id of HUSK_IDS) {
    const fr = L.types[id].frames;
    for (const [name] of HUSK_TYPES[id].frames) assert.ok(fr[name], `${id}:${name}`);
    for (const n of ['w0', 'w1', 'w2', 'w3', 'h', 'b', 'm']) assert.ok(fr[n], `${id}:${n}`);
    assert.ok(fr.rw0 && fr.rw1 && fr.rw2 && fr.rw3, id + ' rim frames');
    for (const n in fr) { const f = fr[n]; assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= L.w && f.y + f.h <= L.h, `${id}:${n} inside`); rects.push(f); bytes += f.w * f.h * 4; }
  }
  assert.ok(HUSK_TYPES.wolf.frames.some(([n]) => n === 't0') && HUSK_TYPES.wolf.frames.some(([n]) => n === 't1'), 'wolf tell frames (crouch, hackles up)');
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'overlap');
  }
  assert.ok(bytes <= 1.15e6, 'frame bytes ' + bytes); // budget ~1 MB (measured 1.10 MB incl. half-density rims)
  assert.ok(L.w * L.h * 4 <= 2.1e6, 'GPU bytes');
});

test('true size: wolf ~hero-sized (~50 px long on a 720p desktop), crow smaller, crawler wolf-sized', () => {
  const px = (id) => HUSK_TYPES[id].box[2] * HUSK_TYPES[id].g / 4 * 2.4; // frame width incl. margins at 2.4 px per world unit
  assert.ok(px('wolf') > 50 && px('wolf') < 62, 'wolf ' + px('wolf'));
  assert.ok(px('crow') < px('wolf'));
  assert.ok(px('root_crawler') > 48);
  assert.equal(TPW, 5);
});

test('SVG sheets are self-contained (no external refs/scripts), deterministic, one frame cell per frame', () => {
  const L = layoutAtlas();
  for (const id of HUSK_IDS) {
    const a = typeSheet(id, L), b = typeSheet(id, L);
    assert.equal(a.svg, b.svg, id + ' deterministic');
    assert.ok(!/<script|javascript:|href=|https?:|<image|<foreignObject|@import/i.test(a.svg.replace('xmlns="http://www.w3.org/2000/svg"', '')), id + ' no external content');
    assert.equal((a.svg.match(/overflow="hidden"/g) || []).length, HUSK_TYPES[id].frames.length);
    assert.ok(!a.svg.includes('stroke-dasharray="7 5"') && !a.svg.includes('ff5a3c" opacity="'), id + ' no telegraph decals in the frames');
  }
});

test('eye anchors: per type count (wolf pair, crow one high, crawler wide pair), present for every frame, inside the frame box, sized down to the socket', () => {
  const E = eyeAnchors();
  const want = { wolf: 2, crow: 1, root_crawler: 2 };
  for (const id of HUSK_IDS) {
    const T = HUSK_TYPES[id], u = T.g / 4;
    assert.equal(E[id].length, Object.keys(FR).length);
    for (const pts of E[id]) {
      assert.equal(pts.length, want[id], id);
      for (const [x, y, k] of pts) {
        assert.ok(x / u > T.box[0] && x / u < T.box[0] + T.box[2] && y / u > T.box[1] && y / u < 0, `${id} anchor in box`);
        assert.ok(k > 0 && k <= HUSK_EYE_K[id] * 1.15 + 1e-9);
      }
    }
  }
  assert.ok(E.crow[FR.w0][0][1] < E.wolf[FR.w0][0][1], 'crow eye held higher than the wolf eye');
  assert.ok(Math.abs(E.root_crawler[FR.w0][0][0] - E.root_crawler[FR.w0][1][0]) > Math.abs(E.wolf[FR.w0][0][0] - E.wolf[FR.w0][1][0]), 'crawler eyes wider apart');
  assert.ok(E.wolf[FR.t1][0][1] > E.wolf[FR.w0][0][1], 'wolf head drops on the tell');
  const [hx, hy] = hurtPoint(80, 0, 0); assert.ok(Number.isFinite(hx) && Number.isFinite(hy));
});

test('per-instance jitter is deterministic from the id, bounded, and never brightens past the tint', () => {
  const a = {}, b = {};
  for (let id = 0; id < 2000; id++) {
    jitter(id, a); jitter(id, b);
    assert.deepEqual(a, b);
    assert.ok(a.s >= 0.94 && a.s <= 1.06 && a.v >= 0.9 && a.v <= 1 && a.ph >= 0 && a.ph < 1 && a.sp >= 0.92 && a.sp <= 1.08);
  }
  const s = new Set(); for (let id = 0; id < 50; id++) s.add(jitter(id, {}).s.toFixed(3));
  assert.ok(s.size > 30, 'a pack is not clones');
});

test('frame pickers: walk cycles through 4 frames (Low: 2), crawler plants longer than it pulls, crow two quick beats then a glide', () => {
  const seen = new Set(); for (let p = 0; p < 1; p += 0.01) seen.add(walkFrame('wolf', p, false));
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3]);
  const low = new Set(); for (let p = 0; p < 1; p += 0.01) low.add(walkFrame('wolf', p, true));
  assert.deepEqual([...low].sort(), [0, 2]);
  let plant = 0, pull = 0; for (let p = 0; p < 1; p += 0.001) { const f = walkFrame('root_crawler', p, false); if (f === 0 || f === 2) plant++; else pull++; }
  assert.ok(plant > pull * 1.4, `plant ${plant} pull ${pull}`);
  const seq = []; for (let t = 0; t < 0.56; t += 0.01) { const f = crowFrame(t); if (seq[seq.length - 1] !== f) seq.push(f); }
  assert.deepEqual(seq, [0, 2, 0, 2, 1]);
});

test('tier caps for the death beat (High 40 / Med 20 / Low 8), Low has no mask-pop', () => {
  assert.deepEqual(CORPSE_CAPS, { high: 40, med: 20, low: 8 });
  const rig = src('../src/gfx/enemyrig.js');
  assert.ok(/c\.mask[^\n]*setVisible\(!c\.low\)/.test(rig));
  assert.ok(/phone \? 0\.6/.test(rig), 'phone x0.6');
});

test('no per-frame allocation in the animator/death update (preallocated, state on the pooled image)', () => {
  const rig = src('../src/gfx/enemyrig.js');
  const frame = rig.slice(rig.indexOf('  apply('), rig.indexOf('  // ---- death beat')) + rig.slice(rig.indexOf('  update(dt)'), rig.indexOf('  clear()'));
  assert.ok(!/new (Array|Map|Set|Float32Array|Uint8Array)|\.map\(|\.filter\(|\.slice\(|=> |\{ [a-z]+: /.test(frame), 'allocation in apply/update');
  // heap check: pickers
  if (globalThis.gc) globalThis.gc();
  const h0 = process.memoryUsage().heapUsed;
  let x = 0; for (let i = 0; i < 200000; i++) x += walkFrame('root_crawler', i * 0.013, false) + crowFrame(i * 0.016);
  assert.ok(x > 0 && process.memoryUsage().heapUsed - h0 < 8e6);
});

test('wiring: RunScene bakes at boot, falls back to flat sprites, feeds the night layer; night layer reads per-frame anchors and atlas rims', () => {
  const sc = src('../src/scenes/RunScene.js');
  assert.ok(sc.includes('bakeHuskAtlas(this)') && sc.includes('art.apply(img, e, ei') && sc.includes('nc.art = art.on ? art : null') && sc.includes('art.kill('));
  const nl = src('../src/gfx/nightlayer.js');
  assert.ok(nl.includes('art.eyes[e.type][af]') && nl.includes('art.rimName(e.type, af)'));
  const tex = src('../src/gfx/enemytex.js');
  assert.ok(tex.includes("type: 'image/svg+xml'") && tex.includes('revokeObjectURL') && !tex.includes('innerHTML'));
  assert.equal(parseParams('?husks=0').husks, false);
  assert.equal(parseParams('').husks, true);
  assert.equal(parseParams('?husks=<b>').husks, true, 'hostile value keeps the default');
});

test('sim untouched: no sim file imports the art', () => {
  for (const f of ['Sim.js', 'weapons.js', 'cards.js']) assert.ok(!/gfx|husk|enemyrig/.test(src('../src/sim/' + f)), f);
});
