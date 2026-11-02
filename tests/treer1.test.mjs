// R1: the Lantern Web re-laid out into spaced constellations (docs/design/skill-tree-rework-v2.md, mockups docs/mockups/tree-v3). POSITIONS ONLY:
// ids, prices, effects, requires and conditions are untouched, and positions are not part of the released fingerprints.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { composeTree, relaxGaps } from '../src/meta/treedata.js';
import { compileTree } from '../src/meta/tree.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { buildTreeView } from '../src/meta/treeview.js';
import { computeTierSizes, TIER_SIZE } from '../src/meta/treetier.js';
import { layoutIssues, connectIssues, gapIssues } from '../src/meta/treelayout.js';
import { fingerprints, readFixture } from '../scripts/tree-release.mjs';

const clone = (x) => JSON.parse(JSON.stringify(x));
const files = () => clone(readTreeFiles());
const composed = composeTree(readTreeFiles(), data);
const L = composed.info.core.layout;

test('R1 gaps: no two lanterns closer than their tiers allow (landmark >= 120, diamond >= 30, dot >= 18, mixed = mean); layout and connected rules clean', () => {
  assert.equal(L.gapLandmark, 120); assert.equal(L.gapDiamond, 30); assert.equal(L.gapDot, 18);
  assert.deepEqual(gapIssues(composed.info), []);
  assert.deepEqual(layoutIssues(composed.info, def), []);
  assert.deepEqual(connectIssues(composed.info, def), []);
  // the tier sizes of the screen no longer have to shrink a medallion to fit: landmarks draw the full 76 px at NEAR, 120 apart = 1.58 diameters
  const { tier, d } = computeTierSizes(def);
  for (const id of def.list) if (tier[id] === 'landmark') assert.equal(d[id], TIER_SIZE.landmark, `${id} draws at full landmark size`);
  const dia = def.list.filter((id) => tier[id] === 'diamond');
  assert.ok(dia.length > 0 && dia.every((id) => d[id] === TIER_SIZE.diamond), 'diamonds at full size');
});

test('R1 gapIssues catches a violation; relaxGaps spreads, is deterministic and leaves a clean set alone', () => {
  const info = clone({ core: { layout: L }, nodes: [{ id: 'a', kind: 'heart' }, { id: 'b', kind: 'socket' }, { id: 'c', kind: 'ring' }], positions: { a: [0, 0], b: [50, 0], c: [0, 20] } });
  assert.equal(gapIssues(info).length, 3);
  const mk = () => [{ id: 'a', t: 'landmark', p: [0, 0] }, { id: 'b', t: 'landmark', p: [50, 0] }, { id: 'c', t: 'dot', p: [0, 20] }];
  const g = { landmark: 120, diamond: 30, dot: 18 };
  const r1 = relaxGaps(mk(), g), r2 = relaxGaps(mk(), g);
  assert.deepEqual(r1, r2);
  assert.ok(Math.hypot(r1[0].p[0] - r1[1].p[0], r1[0].p[1] - r1[1].p[1]) >= 119.9);
  const ok = [{ id: 'a', t: 'landmark', p: [0, 0] }, { id: 'b', t: 'landmark', p: [200, 0] }];
  assert.deepEqual(relaxGaps(clone(ok), g), ok);
});

test('R1 determinism: the same layout on every load', () => {
  const again = composeTree(readTreeFiles(), data);
  assert.deepEqual(again.info.positions, composed.info.positions);
  assert.deepEqual(again.info.regions, composed.info.regions);
});

test('R1 positions are NOT part of the released fingerprints: spreading the web differently changes no fingerprint', () => {
  const fs = files(); const core = fs.find((f) => f.path === 'core.json').json;
  core.layout.clusterScale = 2.6; core.rings.sky.r = 1100; core.rings.dusk.r = 1600; core.rings.fog.r = 1800; core.rings.far.r = 2060;
  const moved = composeTree(fs, data);
  assert.notDeepEqual(moved.info.positions.gt_ghost_wolves, composed.info.positions.gt_ghost_wolves, 'the nodes really moved');
  const a = fingerprints(def), b = fingerprints(compileTree(moved.live, data));
  assert.deepEqual(b, a);
  // and they match the released fixture where it has a snapshot of this tree version
  const fx = readFixture(); const rel = fx.released && fx.released[String(def.treeVersion)];
  if (rel) for (const id of Object.keys(rel)) assert.equal(a[id], rel[id], id);
});

test('R1 geometry: five weapon constellations spaced around the hub, tools beyond, web radius in range, rings strictly outward', () => {
  const R = composed.info.core.rings;
  assert.ok(R.hearth.r < R.wick.r && R.wick.r < R.heroes.r && R.heroes.r < R.sky.r && R.sky.r < R.dusk.r && R.dusk.r < R.fog.r && R.fog.r < R.far.r);
  const cs = Object.values(composed.info.centres);
  assert.equal(cs.length, 5);
  for (const c of cs) assert.ok(Math.abs(Math.hypot(c[0], c[1]) - R.sky.r) < 1, 'each weapon sits on the sky ring');
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) assert.ok(Math.hypot(cs[i][0] - cs[j][0], cs[i][1] - cs[j][1]) > 900, 'constellations are far apart');
  // the hub web (global ring lanterns) ends well inside the first constellation edge
  let hubMax = 0;
  for (const n of composed.info.nodes) if (n.region === 'rings' && !n.tool && !/^(br|bs|co|cd|rs|wd|df)_/.test(n.id) && n.kind !== 'teaser') hubMax = Math.max(hubMax, Math.hypot(...composed.info.positions[n.id]));
  assert.ok(hubMax < 520, `hub web radius ${hubMax}`);
  const v = buildTreeView(composed.info, def, data);
  assert.ok(v.webR >= 1900 && v.webR <= 2400, `webR ${v.webR}`);
  for (const id of def.list) assert.ok(Math.hypot(def.nodes[id].x, def.nodes[id].y) <= v.webR, `${id} inside the web`);
});

test('R1 region records: hub, every constellation, every tool cluster, fog; name, centre, accent colour key, backbone thread to the hub', () => {
  const rg = composed.info.regions;
  const kinds = rg.reduce((a, r) => ((a[r.kind] = (a[r.kind] || 0) + 1), a), {});
  assert.deepEqual(kinds, { hub: 1, weapon: 5, tool: 6, fog: 1 });
  for (const r of rg) {
    assert.ok(typeof r.name === 'string' && r.name.length > 0, r.id);
    assert.ok(Array.isArray(r.centre) && r.centre.every(Number.isFinite), r.id);
    assert.ok(Object.hasOwn(composed.info.core.branches, r.accent), `${r.id} accent key`);
    if (r.kind === 'weapon' || r.kind === 'tool') {
      assert.deepEqual(r.thread.from, [0, 0]);
      const [tx, ty] = r.thread.to, d = Math.hypot(r.centre[0], r.centre[1]);
      assert.ok(Math.abs(Math.hypot(tx, ty) - (d - r.r)) < 1.5, `${r.id} thread ends at the region edge`);
    }
  }
  assert.equal(rg.find((r) => r.id === 'c:ghost_wolves').name, 'Ghost Wolves');
  const v = buildTreeView(composed.info, def, data);
  assert.equal(v.threads.length, 11);
  assert.deepEqual(v.ringR, ['hearth', 'wick', 'heroes', 'sky', 'dusk'].map((k) => composed.info.core.rings[k].r));
});
