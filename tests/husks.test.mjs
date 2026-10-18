// EN0-EN2: Husk enemy art pipeline (pure parts): atlas layout + frames, SVG sheet safety, eye anchors, jitter determinism, frame pickers,
// no per-frame allocation, tier caps, RunScene/night-layer wiring, sim untouched by the art.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HUSK_TYPES, HUSK_IDS, FR, layoutAtlas, typeSheet, eyeAnchors, eyeMeta, socketInfo, jitter, ATLAS_W, TPW, EYE_TEX, hurtPoint } from '../src/gfx/husk/frames.js';
import { walkFrame, crowFrame, CORPSE_CAPS } from '../src/gfx/enemyrig.js';
import { parseParams } from '../src/params.js';
import { data } from './helpers.mjs';

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const NEW_IDS = ['stoat_piper', 'puffback_toad']; // EN3-EN5 telegraph types in the atlas (in build order)
const WANT_EYES = { wolf: 2, crow: 1, root_crawler: 2, stoat_piper: 1, puffback_toad: 3 };

test('ids unchanged and every Husk type is a real enemy (saves, kill gates and tree conditions keep working)', () => {
  assert.deepEqual(HUSK_IDS.slice(0, 3), ['wolf', 'crow', 'root_crawler']); // batch 1 order kept (atlas layout); EN3-EN5 append the new types
  assert.deepEqual(HUSK_IDS.slice(3), NEW_IDS);
  for (const id of HUSK_IDS) assert.ok(data.enemies[id], id);
  assert.equal(data.enemies.wolf.name, 'Fell Wolf');
  assert.equal(data.enemies.crow.name, 'Grave Crow');
  assert.equal(data.enemies.root_crawler.name, 'Root Crawler');
});

test('atlas layout: every frame of every type is present, inside the atlas, no overlaps, within the size budget', () => {
  const L = layoutAtlas();
  assert.equal(L.w, ATLAS_W);
  assert.ok(L.h <= 1024 + 256, 'atlas height ' + L.h);
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
  // budget: batch 1 = 1.22 MB (incl. half-density rims + socket-eye frames); each EN3-EN5 type adds ~0.3-0.45 MB at the same texel density
  // (the ~1 MB/chapter target from the design sheet is exceeded: reported, see docs/LOCKED.md EN3-EN5 rows)
  assert.ok(bytes <= 1.25e6 + 0.45e6 * NEW_IDS.length, 'frame bytes ' + bytes);
  assert.ok(L.w * L.h * 4 <= 2.1e6 + 0.9e6 * NEW_IDS.length, 'GPU bytes');
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
    assert.equal((a.svg.match(/overflow="hidden"/g) || []).length, HUSK_TYPES[id].frames.length + 5 * socketInfo(id).socks.length, 'one cell per frame + glow/core/glow+core/hot glow/hot glow+core per socket');
    assert.ok(!a.svg.includes('stroke-dasharray="7 5"') && !a.svg.includes('ff5a3c" opacity="'), id + ' no telegraph decals in the frames');
  }
});

test('eye anchors: per type count (wolf pair, crow one high, crawler wide pair), present for every frame, socket + iris INSIDE the socket bounds on every frame', () => {
  const E = eyeAnchors(), M = eyeMeta();
  const want = WANT_EYES;
  for (const id of HUSK_IDS) {
    const T = HUSK_TYPES[id], u = T.g / 4;
    assert.equal(E[id].length, Object.keys(FR).length);
    assert.equal(M[id].length, want[id], id + ' sockets');
    for (let f = 0; f < E[id].length; f++) {
      const pts = E[id][f];
      assert.equal(pts.length, want[id], id);
      for (const [x, y, ex, ey, open, flare, j] of pts) {
        assert.ok(x / u > T.box[0] && x / u < T.box[0] + T.box[2] && y / u > T.box[1] && y / u < 0, `${id} anchor in box`);
        const m = M[id][j];
        // the iris (and the core's whole drift range) stays inside the socket opening, on every frame (hurt squash included)
        assert.ok(Math.abs(ex - x) + m.hw + m.lx <= m.w / 2 + 1e-6, `${id} f${f} core x inside socket`);
        assert.ok(Math.abs(ey - y) + m.hh + m.ly <= m.h / 2 + 1e-6, `${id} f${f} core y inside socket`);
        assert.ok(open > 0 && open <= 1 && (flare === 0 || flare === 1));
      }
    }
    // eyes move rigidly with the head: socket-to-socket offset is the same on every walk frame
    if (want[id] === 2) for (const f of [FR.w1, FR.w2, FR.w3]) {
      const a0 = E[id][FR.w0], a1 = E[id][f];
      assert.ok(Math.abs((a0[1][0] - a0[0][0]) - (a1[1][0] - a1[0][0])) < 1e-6 && Math.abs((a0[1][1] - a0[0][1]) - (a1[1][1] - a1[0][1])) < 1e-6, id + ' rigid');
    }
    // sockets are small: the glow sprite never exceeds the socket + a thin spill (the old floating ball was 2.7x the socket)
    for (const m of M[id]) assert.ok(m.w < 2.5 && m.h < 2.0, `${id} socket ${m.w.toFixed(2)} x ${m.h.toFixed(2)} wu`);
  }
  assert.ok(E.wolf[FR.h][0][4] < 1, 'hurt squints');
  assert.equal(E.wolf[FR.t1][0][5], 1, 'wolf tell flares');
  assert.ok(E.crow[FR.w0][0][1] < E.wolf[FR.w0][0][1], 'crow eye held higher than the wolf eye');
  assert.ok(Math.abs(E.root_crawler[FR.w0][0][0] - E.root_crawler[FR.w0][1][0]) > Math.abs(E.wolf[FR.w0][0][0] - E.wolf[FR.w0][1][0]), 'crawler eyes wider apart');
  assert.ok(E.wolf[FR.t1][0][1] > E.wolf[FR.w0][0][1], 'wolf head drops on the tell');
  const [hx, hy] = hurtPoint(80, 0, 0); assert.ok(Number.isFinite(hx) && Number.isFinite(hy));
});

test('eyes are baked INTO the sockets (walk/tell/hurt frames), none on the freed body or the fallen mask; night glow frames are clipped to the socket outline', () => {
  const L = layoutAtlas();
  for (const id of HUSK_IDS) {
    const { svg } = typeSheet(id, L);
    const cells = svg.split('<svg x=').slice(1);
    const names = HUSK_TYPES[id].frames.map(([n]) => n);
    names.forEach((n, i) => { const has = cells[i].includes('#ff9a66'); assert.equal(has, n !== 'b' && n !== 'm', `${id}:${n} baked eye`); });
    const SI = socketInfo(id);
    for (let j = 0; j < SI.socks.length; j++) {
      for (const k of ['g', 'c', 'G', 'h', 'H']) assert.ok(L.types[id].frames['e' + k + j], `${id}:e${k}${j}`);
      const gf = L.types[id].frames['eg' + j];
      assert.ok(gf.w <= Math.ceil((SI.socks[j].w + 6) * TPW * EYE_TEX * HUSK_TYPES[id].g / 4) + 2, 'glow frame = socket + thin spill');
    }
    const glowCells = cells.slice(names.length).filter((c) => !c.includes('<circle') || c.includes('clip-path'));
    assert.ok(glowCells.some((c) => /clip-path="url\(#gk/.test(c)), id + ' glow clipped to the socket');
  }
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
  assert.ok(nl.includes('art.eyes[e.type][af]') && nl.includes('art.rimName(e.type, af)') && nl.includes('art.eyeMeta[e.type]'));
  const tex = src('../src/gfx/enemytex.js');
  assert.ok(tex.includes("type: 'image/svg+xml'") && tex.includes('revokeObjectURL') && !tex.includes('innerHTML'));
  assert.equal(parseParams('?husks=0').husks, false);
  assert.equal(parseParams('').husks, true);
  assert.equal(parseParams('?husks=<b>').husks, true, 'hostile value keeps the default');
});

test('sim untouched: no sim file imports the art', () => {
  for (const f of ['Sim.js', 'weapons.js', 'cards.js']) assert.ok(!/gfx|husk|enemyrig/.test(src('../src/sim/' + f)), f);
});

test('night socket eyes: Calm = no drift/pulse/blink, look clamp scales the core inside the socket, drifting core only for the nearest CORE_CAPS (Low none), no allocation in draw()', async () => {
  const { eyeAnim, makeEyeOut, blinkMul, LOOK_MAX } = await import('../src/gfx/nightlook.js');
  const o = makeEyeOut();
  for (let t = 0; t < 20; t += 0.37) { eyeAnim(t, 5, 100, -30, 80, 60, 0, true, o); assert.equal(o.ox, 0); assert.equal(o.oy, 0); assert.equal(o.sl, 0); assert.equal(blinkMul(t, 5, true), 1); }
  for (let t = 0; t < 20; t += 0.37) { eyeAnim(t, 5, 100, -30, 0, 0, 0, false, o); assert.ok(Math.hypot(o.ox, o.oy) <= LOOK_MAX + 1e-9); }
  const nl = src('../src/gfx/nightlayer.js');
  assert.ok(nl.includes('lx * mj.lx * ks') && nl.includes('ly * mj.ly * ks'), 'drift = look direction x the per-socket clamp');
  assert.ok(nl.includes('nm[split ? (c.bloom ? 3 : 0) : (c.bloom ? 4 : 2)]') && /if \(split\)/.test(nl) && nl.includes('const split = k < coreCap'), 'nearest CORE_CAPS get a drifting core, the rest (and Low) one glow+core image per eye');
  const { CORE_CAPS } = await import('../src/gfx/nightlook.js');
  assert.deepEqual(CORE_CAPS, { high: 40, med: 20, low: 0 });
  assert.ok(nl.includes('blink ? 0.15 : 1'), 'blink closes the lid inside the socket');
  const draw = nl.slice(nl.indexOf('  draw('), nl.indexOf('  // Night look off'));
  assert.ok(!/new (Array|Map|Set|Float32Array|Uint8Array)|\.map\(|\.filter\(|\.slice\(|=> /.test(draw), 'allocation in draw()');
});
