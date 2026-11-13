// Q1a: node tiers, medallion draw sizes and the baked stone backdrop of the tree screen (render-only: ids, prices, positions untouched).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef as def } from './helpers.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { buildTreeView } from '../src/meta/treeview.js';
import { tierOf, computeTierSizes, screenDiameter, tierShown, TIER_SIZE, TIER_FLOOR, TIER_OF_KIND } from '../src/meta/treetier.js';
import { TreeBackdrop, ringProgress, LOOK } from '../src/gfx/treebg.js';

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
    assert.equal(t.tier[id], def.nodes[id].chase ? 'landmark' : tierOf(def.nodes[id])); // Q7-A: chase nodes are drawn as landmarks
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

test('backdrop: sky and screen layer are baked once per size class, never per frame', () => {
  globalThis.Path2D ??= class { moveTo() {} lineTo() {} arc() {} }; // the rune rings batch their strokes in Path2D (a browser class)
  const f = fake();
  const bg = new TreeBackdrop(f.make);
  const v = buildTreeView(composed.info, def, data);
  assert.ok(Array.isArray(v.ringTiers) && v.ringTiers.length >= 5 && v.ringTiers.every((t, i, a) => i === 0 || t.r > a[i - 1].r));
  assert.deepEqual(v.ringTiers.map((t) => t.name).slice(0, 5), ['Hearth', 'Wick', 'Dusk', 'Far Hollow', 'Deep Hollow']);
  assert.equal(bg.ensureSky(false), true);
  assert.equal(bg.ensureScreen(1280, 720, false), true);
  assert.equal(bg.bakes, 2);
  const ctx = new Proxy({}, { get: (o, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 6 }) : () => {}), set: () => true });
  const bakeCalls = f.made.map((m) => m.calls.n);
  const rings = v.ringTiers.map((t, k) => ({ r: t.r, name: t.name, frac: k / 6, bloom: k === 2 ? 0.5 : 0 }));
  for (let i = 0; i < 120; i++) { // 120 frames with identical state: no re-bake, no extra canvas
    assert.equal(bg.ensureSky(false), false);
    assert.equal(bg.ensureScreen(1280, 720, false), false);
    const cam = { x: i, y: -i, z: 0.5 };
    bg.drawSky(ctx, cam, 1280, 720);
    bg.drawScreen(ctx, 1280, 720);
    bg.drawTints(ctx, cam, 1280, 720, [{ x: 0, y: 0, r: 300, frac: 0.4, color0: 'rgba(1,2,3,.2)', color1: 'rgba(1,2,3,0)' }]);
    bg.drawRings(ctx, cam, 1280, 720, rings, 'serif');
  }
  assert.equal(bg.bakes, 2);
  assert.equal(f.made.length, 2);
  assert.deepEqual(f.made.map((m) => m.calls.n), bakeCalls, 'the baked canvases were not drawn on again');
  // a different size class bakes again (phone is a smaller bake of the same look)
  assert.equal(bg.ensureSky(true), true);
  assert.ok(f.made.at(-1).width < f.made[0].width, 'phone sky bake is smaller');
  assert.equal(bg.ensureScreen(390, 844, true), true);
});

test('backdrop: ring progress = owned real lanterns / real lanterns per ring tier (pure; teasers excluded, bad input safe)', () => {
  const v = buildTreeView(composed.info, def, data);
  const n = v.ringTiers.length;
  const none = ringProgress(def, v.ringOf, n, () => false);
  assert.equal(none.length, n);
  assert.ok(none.every((x) => x === 0));
  const all = ringProgress(def, v.ringOf, n, () => true);
  assert.ok(all.every((x) => x === 1 || x === 0), 'every ring with real lanterns is whole when all are owned');
  assert.ok(all.filter((x) => x === 1).length >= 4);
  // a teaser never counts: only owning every NON-teaser lantern in a ring completes it
  const owned = new Set(def.list.filter((id) => !def.nodes[id].teaser));
  assert.deepEqual(ringProgress(def, v.ringOf, n, (id) => owned.has(id)), all);
  // one lantern lit moves exactly its own ring
  const one = def.list.find((id) => !def.nodes[id].teaser && v.ringOf[id] === 1);
  const p1 = ringProgress(def, v.ringOf, n, (id) => id === one);
  assert.ok(p1[1] > 0 && p1[1] < 0.1 && p1.filter((x, i) => i !== 1).every((x) => x === 0));
  assert.deepEqual(ringProgress(def, v.ringOf, 0, () => true), []);
  assert.deepEqual(ringProgress(def, null, n, () => true), new Array(n).fill(0));
  assert.deepEqual(ringProgress(def, { [one]: 99, [def.list[0]]: -3 }, n, () => true), new Array(n).fill(0), 'out-of-range ring indices are ignored');
});

test('look: the locked tune values are exactly the ones Matt chose (frozen)', () => {
  assert.equal(Object.isFrozen(LOOK), true);
  assert.deepEqual({ ...LOOK }, { bright: 0.7, glow: 0.91, medSize: 0.92, thrLit: 1, thrAvail: 0.39, thrLocked: 0.29, density: 1, bgDim: 0.3, labelSize: 13, labelDensity: 0.48, ringBright: 1, ringLabels: true, ringArcs: true });
});

test('source: the screen bakes in resize() only; draw() never calls a bake; no innerHTML from tree data; no new deps', () => {
  const src = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  assert.equal((src.match(/ensureSky\(/g) || []).length, 1);
  assert.equal((src.match(/ensureScreen\(/g) || []).length, 1);
  assert.ok(src.includes('collapseFar(') && src.includes('countBadge('), 'FAR landmark pile-ups collapse into one badge');
  assert.ok(!src.includes('(this.view.nearHub - 10) * z'), 'remembers line is docked, not under the hub');
  const resize = src.slice(src.indexOf('  resize() {'), src.indexOf('  toS(x, y)'));
  assert.ok(resize.includes('ensureSky(') && resize.includes('ensureScreen('));
  const bgSrc = readFileSync(new URL('../src/gfx/treebg.js', import.meta.url), 'utf8') + readFileSync(new URL('../src/meta/treetier.js', import.meta.url), 'utf8');
  assert.ok(!/\.innerHTML\s*=|insertAdjacentHTML|eval\(|new Function/.test(src + bgSrc));
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok(Object.keys({ ...pkg.dependencies }).every((d) => ['phaser'].includes(d)), 'runtime deps unchanged');
});
