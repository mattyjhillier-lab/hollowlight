// Q1a: node tiers, medallion draw sizes and the baked stone backdrop of the tree screen (render-only: ids, prices, positions untouched).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef as def } from './helpers.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { buildTreeView } from '../src/meta/treeview.js';
import { tierOf, computeTierSizes, screenDiameter, tierShown, TIER_SIZE, TIER_FLOOR, TIER_OF_KIND } from '../src/meta/treetier.js';
import { TreeBackdrop, ringLitFractions } from '../src/gfx/treebg.js';

const composed = composeTree(readTreeFiles(), data);

test('tier: derives from kind; unknown and hostile kinds are dots', () => {
  assert.equal(tierOf({ kind: 'heart' }), 'landmark');
  assert.equal(tierOf({ kind: 'socket' }), 'landmark');
  assert.equal(tierOf({ kind: 'gate' }), 'landmark');
  assert.equal(tierOf({ kind: 'key' }), 'landmark');
  assert.equal(tierOf({ kind: 'teaser' }), 'landmark');
  assert.equal(tierOf({ kind: 'mastery' }), 'diamond');
  assert.equal(tierOf({ kind: 'bead' }), 'diamond');
  assert.equal(tierOf({ kind: 'ring' }), 'dot');
  assert.equal(tierOf({ kind: 'knot' }), 'dot');
  for (const k of ['__proto__', 'constructor', 'toString', '', null, 7]) assert.equal(tierOf({ kind: k }), 'dot', String(k));
  assert.equal(tierOf(null), 'dot');
  // every kind in the live tree maps through the table (nothing falls to dot by accident)
  for (const id of def.list) { const k = def.nodes[id].kind; assert.ok(Object.hasOwn(TIER_OF_KIND, k) || k === 'ring' || k === 'knot', `${id} kind ${k}`); }
});

test('draw size: scaled to the nearest same-or-higher neighbour, never overlapping, floor and cap hold', () => {
  const t = computeTierSizes(def);
  for (const id of def.list) {
    assert.ok(Number.isFinite(t.d[id]) && t.d[id] >= 0 && t.d[id] <= TIER_SIZE[t.tier[id]] + 1e-9, id);
    assert.equal(t.tier[id], tierOf(def.nodes[id]));
  }
  let landmarks = 0, full = 0;
  for (const id of def.list) if (t.tier[id] === 'landmark') { landmarks++; if (t.d[id] === TIER_SIZE.landmark) full++; assert.ok(t.d[id] >= TIER_FLOOR.landmark * 0.6, `${id} landmark not collapsed`); }
  assert.ok(landmarks >= 20 && full >= 10, 'most landmarks keep the full medallion');
  // no pair of lanterns overlaps (radius sum <= distance) at zoom 1
  const ids = def.list;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = def.nodes[ids[i]], b = def.nodes[ids[j]];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    assert.ok((t.d[ids[i]] + t.d[ids[j]]) / 2 <= dist + 1e-6, `${ids[i]} / ${ids[j]} overlap`);
  }
  // deterministic and does not touch the tree
  const before = JSON.stringify(def.list.map((id) => [id, def.nodes[id].x, def.nodes[id].y]));
  assert.deepEqual(computeTierSizes(def), t);
  assert.equal(JSON.stringify(def.list.map((id) => [id, def.nodes[id].x, def.nodes[id].y])), before);
});

test('draw size: a medallion beside a close neighbour is smaller than the tier size; a synthetic pair proves the 0.9 rule', () => {
  const mk = (nodes) => ({ list: Object.keys(nodes), nodes });
  const t = computeTierSizes(mk({ a: { kind: 'heart', x: 0, y: 0 }, b: { kind: 'socket', x: 50, y: 0 }, c: { kind: 'heart', x: 900, y: 900 } }));
  assert.equal(t.d.a, 45); assert.equal(t.d.b, 45); assert.equal(t.d.c, 76);
  const m = computeTierSizes(mk({ a: { kind: 'heart', x: 0, y: 0 }, d: { kind: 'ring', x: 30, y: 0 } }));
  assert.ok((m.d.a + m.d.d) / 2 <= 30 * 0.95 + 1e-6 && m.d.d >= TIER_FLOOR.dot - 1e-6);
});

test('screen diameter: zoom scales it, the floor applies on screen, Menu size multiplies', () => {
  assert.equal(screenDiameter('landmark', 76, 1), 76);
  assert.equal(screenDiameter('landmark', 76, 0.1), TIER_FLOOR.landmark);
  assert.equal(screenDiameter('diamond', 26, 0.2), TIER_FLOOR.diamond);
  assert.equal(screenDiameter('dot', 9, 0.1), TIER_FLOOR.dot);
  assert.equal(screenDiameter('landmark', 76, 1, 1.5), 114);
});

test('zoom rules: FAR landmarks only, MID and NEAR draw every tier', () => {
  assert.equal(tierShown('landmark', 'far'), true);
  assert.equal(tierShown('diamond', 'far'), false);
  assert.equal(tierShown('dot', 'far'), false);
  for (const t of ['landmark', 'diamond', 'dot']) { assert.equal(tierShown(t, 'mid'), true); assert.equal(tierShown(t, 'near'), true); }
});

// a recording fake canvas: counts drawing calls, answers gradients
const fake = () => {
  const made = [];
  const make = (w, h) => {
    const calls = { n: 0 };
    const ctx = new Proxy({}, { get: (o, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : (...a) => { calls.n++; return undefined; }), set: () => true });
    const cv = { width: w, height: h, calls, getContext: () => ctx };
    made.push(cv);
    return cv;
  };
  return { made, make };
};

test('backdrop: baked once per size class, never per frame', () => {
  const f = fake();
  const bg = new TreeBackdrop(f.make);
  const v = buildTreeView(composed.info, def, data);
  assert.ok(Array.isArray(v.ringR) && v.ringR.length >= 5 && v.ringR.every((r, i, a) => i === 0 || r > a[i - 1]));
  assert.equal(bg.ensureWorld(v.webR, v.ringR, false), true);
  assert.equal(bg.ensureScreen(1280, 720, false), true);
  assert.equal(bg.bakes, 2);
  const ctx = new Proxy({}, { get: (o, k) => (k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
  const bakeCalls = f.made.map((m) => m.calls.n);
  for (let i = 0; i < 120; i++) { // 120 frames with identical state: no re-bake, no extra canvas
    assert.equal(bg.ensureWorld(v.webR, v.ringR, false), false);
    assert.equal(bg.ensureScreen(1280, 720, false), false);
    bg.drawWorld(ctx, { x: i, y: -i, z: 0.5 }, 1280, 720, v.ringR, v.ringR.map(() => 0.5), [{ x: 0, y: 0, r: 300, frac: 0.4, color0: 'rgba(1,2,3,.2)', color1: 'rgba(1,2,3,0)' }]);
    bg.drawScreen(ctx, 1280, 720);
  }
  assert.equal(bg.bakes, 2);
  assert.equal(f.made.length, 2);
  assert.deepEqual(f.made.map((m) => m.calls.n), bakeCalls, 'the baked canvases were not drawn on again');
  // a different size class bakes again (phone is a smaller bake of the same look)
  assert.equal(bg.ensureWorld(v.webR, v.ringR, true), true);
  assert.ok(f.made.at(-1).width < f.made[0].width, 'phone bake is smaller');
  assert.equal(bg.ensureScreen(390, 844, true), true);
});

test('backdrop: ring gold follows the lit fraction per band (pure)', () => {
  const none = ringLitFractions(def, () => false, [150, 300, 450, 600, 960, 1180, 1280]);
  assert.ok(none.every((x) => x === 0));
  const all = ringLitFractions(def, () => true, [150, 300, 450, 600, 960, 1180, 1280]);
  assert.ok(all.some((x) => x === 1) && all.every((x) => x >= 0 && x <= 1));
  assert.deepEqual(ringLitFractions(def, () => true, []), []);
});

test('source: the screen bakes in resize() only; draw() never calls a bake; no innerHTML from tree data; no new deps', () => {
  const src = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  assert.equal((src.match(/ensureWorld\(/g) || []).length, 1);
  assert.equal((src.match(/ensureScreen\(/g) || []).length, 1);
  assert.ok(src.includes('collapseFar(') && src.includes('countBadge('), 'FAR landmark pile-ups collapse into one badge');
  assert.ok(!src.includes('(this.view.nearHub - 10) * z'), 'remembers line is docked, not under the hub');
  const resize = src.slice(src.indexOf('  resize() {'), src.indexOf('  toS(x, y)'));
  assert.ok(resize.includes('ensureWorld(') && resize.includes('ensureScreen('));
  const bgSrc = readFileSync(new URL('../src/gfx/treebg.js', import.meta.url), 'utf8') + readFileSync(new URL('../src/meta/treetier.js', import.meta.url), 'utf8');
  assert.ok(!/\.innerHTML\s*=|insertAdjacentHTML|eval\(|new Function/.test(src + bgSrc));
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok(Object.keys({ ...pkg.dependencies }).every((d) => ['phaser'].includes(d)), 'runtime deps unchanged');
});
