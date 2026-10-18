// H3 release guard: a shipped (released) tree id cannot change without a version bump + migration step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { treeDef } from './helpers.mjs';
import { TREE_STEPS } from '../src/meta/migrations/index.js';
import { fingerprints, releaseProblems, readFixture } from '../scripts/tree-release.mjs';

const clone = (x) => JSON.parse(JSON.stringify(x));
const real = () => new Set(treeDef.retiredIds ? Object.keys(treeDef.retiredIds) : []);

test('H3 the shipped tree matches every RELEASED version snapshot (empty until the v1 launch merge)', () => {
  const fx = readFixture();
  assert.deepEqual(releaseProblems(fx, fingerprints(treeDef), treeDef.treeVersion, TREE_STEPS, real()), []);
});

test('H3 guard logic: changing a released price / rank / requires fails; a bump with a step passes; a bump without a step fails; removing an id fails unless tombstoned', () => {
  const now = fingerprints(treeDef);
  const v = treeDef.treeVersion;
  const fx = { released: { [v]: clone(now) } };
  assert.deepEqual(releaseProblems(fx, now, v, TREE_STEPS), []);
  for (const mutate of [(d) => { d.nodes.sp_reroll1.cost = { gold: 1 }; }, (d) => { d.nodes.rv_wide.maxRank = 1; }, (d) => { d.nodes.wf_third.requires = []; }, (d) => { d.nodes.sp_cd1.effects = [{ mod: 'abilityCd', pct: -9 }]; }]) {
    const d = { list: treeDef.list, nodes: clone(treeDef.nodes) };
    mutate(d);
    const p = releaseProblems(fx, fingerprints(d), v, TREE_STEPS);
    assert.equal(p.length, 1, p.join('|'));
    assert.match(p[0], /without a core\.version bump/);
  }
  // removing an id
  const gone = { ...now }; delete gone.sp_cd4;
  assert.match(releaseProblems(fx, gone, v, TREE_STEPS)[0], /missing now/);
  assert.deepEqual(releaseProblems(fx, gone, v, TREE_STEPS, new Set(['sp_cd4'])), [], 'a tombstoned id may go (its step refunds it)');
  // bump above the release
  assert.match(releaseProblems(fx, now, v + 1, TREE_STEPS).join('|'), /no migration step/);
  assert.deepEqual(releaseProblems(fx, now, v + 1, { ...TREE_STEPS, [v + 1]: () => ({}) }), [], 'changed ids are fine once the version is bumped and a step exists');
  assert.match(releaseProblems(fx, now, v - 1, TREE_STEPS).join('|'), /below the released/);
});
