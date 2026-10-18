// Release guard for the skill tree (docs/design/skill-tree-v2.md section 7b "Release policy").
// A tree id that has ever shipped in a RELEASED save version must not change price, effect, requires or max rank without a
// `core.version` bump + a migration step with a frozen price table. tests/fixtures/tree-released.json records what each released
// content version looked like; tests/treerelease.test.mjs fails if a shipped id changes while the version is unchanged.
//   node scripts/tree-release.mjs --snapshot    (ONLY at the v1 launch merge, then after every later release) records the live tree
// Pure helpers are exported for the test; the CLI part only runs when invoked directly.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FIELDS = ['maxRank', 'rankCost', 'cost', 'requires', 'requiresAny', 'excludes', 'unlock', 'effects', 'hidden', 'teaser', 'keystone', 'permanent'];

// def = compiled live tree. -> { id: 12-hex fingerprint of every field that affects price, effect or ownership rules }
export function fingerprints(def) {
  const out = {};
  for (const id of def.list) {
    const n = def.nodes[id];
    const o = {};
    for (const k of FIELDS) if (n[k] !== undefined) o[k] = n[k];
    out[id] = createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 12);
  }
  return out;
}

// fixture = { released: { "<treeVersion>": { id: fingerprint } } }. Returns a list of problems (empty = ok).
//  - at the SAME version as a release: every released id must still exist (or be a tombstone) and have the same fingerprint
//  - above the highest release: a registered step must exist for every version in between (a bump without a step loses refunds)
export function releaseProblems(fixture, nowPrints, version, steps, retiredIds = new Set()) {
  const problems = [];
  const rel = fixture && fixture.released && typeof fixture.released === 'object' ? fixture.released : {};
  const versions = Object.keys(rel).map(Number).sort((a, b) => a - b);
  const at = rel[String(version)];
  if (at) {
    for (const [id, fp] of Object.entries(at)) {
      if (retiredIds.has(id)) continue;
      if (!(id in nowPrints)) problems.push(`${id}: released in tree version ${version} but missing now (retire it as a tombstone, bump core.version and add a migration step)`);
      else if (nowPrints[id] !== fp) problems.push(`${id}: changed after release ${version} without a core.version bump (bump the version, add a migration step with a frozen price table, then re-snapshot)`);
    }
  }
  if (versions.length) {
    const top = versions[versions.length - 1];
    if (version < top) problems.push(`core.version ${version} is below the released version ${top}`);
    for (let v = top + 1; v <= version; v++) if (typeof steps[v] !== 'function') problems.push(`tree version ${v} has no migration step (every bump above a release needs one)`);
  }
  return problems;
}

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(here, '..', 'tests', 'fixtures', 'tree-released.json');
export const readFixture = () => JSON.parse(readFileSync(FIXTURE, 'utf8'));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv.includes('--snapshot')) {
  const { loadRealData } = await import('./tree-synth.mjs');
  const { compileTree } = await import('../src/meta/tree.js');
  const { readTreeFiles } = await import('../src/meta/treefs.mjs');
  const { composeTree } = await import('../src/meta/treedata.js');
  const c = composeTree(readTreeFiles(), loadRealData());
  const def = compileTree(c.live, loadRealData());
  const fx = readFixture();
  fx.released[String(def.treeVersion)] = fingerprints(def);
  writeFileSync(FIXTURE, JSON.stringify(fx, null, 1) + '\n');
  console.log(`recorded tree version ${def.treeVersion}: ${def.list.length} ids as RELEASED. Commit this only in the v1 launch merge.`);
}
