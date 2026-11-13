// Q7-A (LOCKED 'Q7 GATING = PROMOTE HIDDEN SEALS', 2026-11-12): Murder Storm, Spirit Tempest, Static Storm seals and the Wardrobe bridge are
// promoted to named CHASE landmarks with progress chips. Display only: ids, prices, requires, unlocks and the release fingerprints are untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { describeNode, compileTree } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { computeTierSizes, tierOf } from '../src/meta/treetier.js';
import { fingerprints } from '../scripts/tree-release.mjs';
import { CHASE, LANDMARKS, VEILED } from '../scripts/pace-v2.mjs';
import { defaultSave } from '../src/save/schema.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const WANT = ['br_wardrobe', 'gt_murder_storm', 'gt_spirit_tempest', 'gt_static_storm'];
const fresh = () => ({ ...defaultSave(), tree: {} });

test('Q7-A exactly the four locked nodes carry the chase flag, and the pace script counts the seals as landmarks', () => {
  assert.deepEqual(def.list.filter((id) => def.nodes[id].chase).sort(), [...WANT, 'co_far'].sort()); // + Far Sight (its own chunk), a chase landmark from birth
  for (const id of CHASE) { assert.ok(LANDMARKS.includes(id), id); assert.ok(!VEILED.includes(id), id); }
  assert.deepEqual([...CHASE].sort(), WANT.filter((id) => id !== 'br_wardrobe'));
});

test('Q7-A the chase flag is display-only: release fingerprints ignore it and the rules are unchanged', () => {
  const now = fingerprints(def);
  const d = { list: def.list, nodes: clone(def.nodes) };
  for (const id of WANT) delete d.nodes[id].chase;
  assert.deepEqual(fingerprints(d), now);
  for (const id of WANT.slice(1)) assert.equal(def.nodes[id].hidden, true, `${id} keeps hidden:true (released field)`);
});

test('Q7-A a chase seal shows its real name and condition progress on a fresh save; other hidden seals stay veiled', () => {
  for (const id of CHASE) {
    const d = describeNode(def, fresh(), id, data);
    assert.equal(d.masked, false, id);
    assert.equal(d.name.includes('?'), false, id);
    assert.ok(d.condLines.length >= 1 && d.condLines.every((l) => Number.isFinite(l.goal) && l.goal >= 1 && l.text !== 'Conditions unknown.'), id);
  }
  assert.equal(describeNode(def, fresh(), 'gt_phantom_stampede', data).masked, true, 'a non-chase hidden seal is still veiled');
});

test('Q7-A hidden-recipe safety: the forks behind a chase seal stay veiled until it is lit', () => {
  for (const seal of ['gt_spirit_tempest', 'gt_static_storm']) {
    const forks = def.list.filter((id) => (def.nodes[id].gateAnc || []).includes(seal));
    assert.ok(forks.length > 0, seal);
    for (const f of forks) assert.equal(describeNode(def, fresh(), f, data).masked, true, `${f} behind ${seal}`);
  }
});

test('Q7-A chase nodes are drawn as landmark medallions; layout tier (positions) is unchanged', () => {
  const t = computeTierSizes(def);
  for (const id of WANT) assert.equal(t.tier[id], 'landmark', id);
  assert.equal(tierOf(def.nodes.br_wardrobe), 'dot', 'layout still sees a ring');
});

test('Q7-A hostile data: chase must be literally true', () => {
  for (const bad of [false, 'yes', 1, {}, null]) {
    const fs = clone(readTreeFiles());
    const core = fs.find((f) => f.path.endsWith('core.json')).json;
    core.nodes.find((n) => n.id === 'br_wardrobe').chase = bad;
    assert.throws(() => composeTree(fs, data), /chase must be true/, String(bad));
  }
  const C = composeTree(readTreeFiles(), data);
  assert.ok(compileTree(C.live, data).nodes.gt_murder_storm.chase === true);
});
