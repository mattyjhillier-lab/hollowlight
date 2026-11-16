// Meteor road hotfix (live bug 2026-11-16, tree version 6): a Lucinda + Dragonfire Meteor starter lost the Meteor heart + Wildfire seal on
// the first page reload (the Meteor road hung from the Chain Lightning heart, so every Meteor node had a foreign gate ancestor and
// sanitizeTree dropped them), and the spirit step then offered nothing. These tests cover the re-rooted road, the repair step and the
// save round trip that the DM8 / DM10 tests never did.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef } from './helpers.mjs';
import { compileTree, buy, nodeStatus } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { defaultSave, serializeSave, parseSave } from '../src/save/schema.js';
import { grantStarter, startableWeapons, starterPool, starterNodes } from '../src/meta/starter.js';
import { TREE_STEPS, runTreeSteps } from '../src/meta/migrations/index.js';
import { repairStarter, STARTER_REPAIR_V6 } from '../src/meta/migrations/tree-v6.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const composed = composeTree(readTreeFiles(), data);
const info = composed.info;
const full = composeTree(readTreeFiles(), data, { unreleased: true });
const fullDef = compileTree(full.live, data);
const FX = JSON.parse(readFileSync(new URL('./fixtures/meteor-hotfix/saves-v5.json', import.meta.url), 'utf8'));
const trip = (s) => { const r = parseSave(JSON.stringify(serializeSave(s))); assert.ok(r.ok, r.error); return r.save; };
const load = (disk) => { const r = parseSave(disk); assert.ok(r.ok, r.error); return r.save; };
// the starting-spirit step's offer (app.spiritChoices): released weapons, open = heart owned
const spiritOpen = (tree) => { const open = startableWeapons(data, treeDef, tree); return Object.keys(data.weapons).filter((id) => !data.weapons[id].unreleased && open.includes(id)); };
const heartOwner = (def) => Object.fromEntries(Object.entries(def.hearts || {}).map(([w, h]) => [h, w]));

test('HOTFIX v6 structure: no node has ANOTHER weapon\'s heart as a gate ancestor (players\' tree and full tree); road nodes carry no heart', () => {
  for (const def of [treeDef, fullDef]) {
    const owner = heartOwner(def);
    for (const id of def.list) {
      const n = def.nodes[id];
      for (const g of n.gateAnc || []) {
        if (!Object.hasOwn(owner, g)) continue;
        assert.ok(n.cluster === owner[g], `${id} (cluster ${n.cluster || 'none'}) has the ${owner[g]} heart ${g} as a gate ancestor: a road or node must not route through a foreign heart`);
      }
    }
  }
  for (const r of info.roads) assert.ok(!Object.hasOwn(heartOwner(treeDef), r.from), `road ${r.ids[0]}..: starts at a weapon heart ${r.from}`);
  assert.deepEqual(treeDef.nodes.dm_way1.requires, ['cl_way7'], 'the Meteor road branches off the last plain waypoint before the Chain heart');
  assert.deepEqual(treeDef.nodes.gt_dragonfire_meteor.gateAnc, []);
  assert.deepEqual(treeDef.nodes.gt_wildfire.gateAnc, ['gt_dragonfire_meteor']);
  assert.equal(treeDef.treeVersion, 6);
  assert.equal(typeof TREE_STEPS[6], 'function');
});

test('HOTFIX every hero x every starter weapon survives a save round trip; the starter weapon stays startable; no gold appears', () => {
  const pool = starterPool(data);
  assert.ok(pool.weapons.includes('dragonfire_meteor') && pool.heroes.includes('hearthwarden'));
  for (const h of Object.keys(data.characters)) for (const w of pool.weapons) {
    const s = defaultSave(1);
    assert.ok(grantStarter(s, data, info, treeDef, h, w));
    const want = starterNodes(info, w);
    assert.ok(want.length >= 1);
    let r = s;
    for (let k = 0; k < 3; k++) {
      r = trip(r);
      for (const id of want) assert.equal(r.tree[id], 1, `${h} + ${w}: ${id} kept after reload ${k + 1}`);
      assert.ok(startableWeapons(data, treeDef, r.tree).includes(w), `${h} + ${w}: startable after reload ${k + 1}`);
      assert.deepEqual([r.gold, r.shards, r.dawnglass], [0, 0, 0], `${h} + ${w}: a free starter node is never refunded`);
      assert.deepEqual(r.notes.starter, { hero: h, weapon: w });
    }
  }
});

test('HOTFIX buy nodes after the starter pick, then reload: starter nodes stay and the spirit step has an open choice (every starter pair)', () => {
  const pool = starterPool(data);
  for (const h of Object.keys(data.characters)) for (const w of pool.weapons) {
    const s = defaultSave(1);
    grantStarter(s, data, info, treeDef, h, w);
    Object.assign(s.stats, { runs: 1, kills: 400, killsByEnemy: { wolf: 300, crow: 60, root_crawler: 40 }, startWeapon: { [w]: 1 } });
    s.gold = 2000;
    const bought = [];
    for (const id of treeDef.list) { if (bought.length >= 5) break; const st = nodeStatus(treeDef, s, id, data); if (st && st.state === 'available' && buy(s, id, treeDef, data).ok) bought.push(id); }
    assert.ok(bought.length >= 3, `${h} + ${w}: bought ${bought}`);
    const before = clone(s.tree);
    const r = trip(trip(s));
    assert.deepEqual(r.tree, before, `${h} + ${w}: the whole tree survives two reloads`);
    assert.equal(r.gold, s.gold, `${h} + ${w}: no refund`);
    const open = spiritOpen(r.tree);
    assert.ok(open.length >= 1 && open.includes(w), `${h} + ${w}: the spirit step offers ${w} (open: ${open})`);
  }
});

test('HOTFIX step 6 repairs the tester\'s lantern (written by the live v5 build): heart + Wildfire back, nothing else changes, no currency', () => {
  const disk = JSON.parse(FX.testerBugged.disk);
  assert.equal(disk.tree.v, 5);
  assert.equal(disk.notes.starter.weapon, 'dragonfire_meteor');
  const s = load(FX.testerBugged.disk);
  assert.equal(s.tree.gt_dragonfire_meteor, 1); assert.equal(s.tree.gt_wildfire, 1);
  for (const id of ['sp_reroll1', 'sp_ban1', 'li_vigor', 'su_bond']) assert.equal(s.tree[id], 1, `${id} (bought before the bug) kept`);
  assert.equal(Object.keys(s.tree).length, 6);
  assert.deepEqual([s.gold, s.shards, s.dawnglass], [disk.gold, disk.shards, disk.dawnglass], 'the repair adds no gold / shards / Dawnglass');
  assert.deepEqual(spiritOpen(s.tree), ['dragonfire_meteor'], 'the stuck spirit step now offers Dragonfire Meteor');
  // nothing else in the save moves: only the tree (repaired + stamped v6)
  const out = serializeSave(s);
  const a = clone(out); const b = clone(disk); delete a.tree; delete b.tree;
  assert.deepEqual(a, b);
  assert.equal(out.tree.v, 6);
  assert.equal(out.notes.treeResetNotice, undefined, 'no notice');
  // idempotent: the repaired save reloads byte for byte
  const again = JSON.stringify(serializeSave(load(JSON.stringify(out))));
  assert.equal(again, JSON.stringify(out));
});

test('HOTFIX a Meteor lantern saved BEFORE its first reload loads whole (no drop, no refund)', () => {
  const disk = JSON.parse(FX.testerPreReload.disk);
  const s = load(FX.testerPreReload.disk);
  assert.deepEqual(s.tree, { gt_dragonfire_meteor: 1, gt_wildfire: 1, sp_reroll1: 1, sp_ban1: 1, li_vigor: 1, su_bond: 1 });
  assert.equal(s.gold, disk.gold, 'the v5 bug refunded 400 gold here; v6 refunds nothing');
});

test('HOTFIX unaffected lanterns (Wren, Elias, a Meteor owner through the tree) re-save identically apart from the tree version stamp', () => {
  for (const k of ['wren', 'elias', 'meteorOwner']) {
    const disk = JSON.parse(FX[k].disk);
    const out = serializeSave(load(FX[k].disk));
    assert.equal(disk.tree.v, 5);
    assert.equal(out.tree.v, 6, k);
    assert.deepEqual({ ...out, tree: { ...out.tree, v: 5 } }, disk, `${k}: only tree.v moves`);
  }
  const m = load(FX.meteorOwner.disk);
  for (const id of ['dm_way1', 'dm_way2', 'dm_way5', 'gt_dragonfire_meteor', 'dm_blaze', 'gt_chain_lightning', 'gt_thunder_judgment']) assert.equal(m.tree[id], 1, `meteor owner keeps ${id} (dm_way1 re-linked, ownership untouched)`);
  assert.equal(m.tree.gt_wildfire, undefined, 'a Chain Lightning starter is never handed the Meteor starter seal');
});

test('HOTFIX hostile / forged: junk starter ids repair nothing; a v6 stamp never re-runs the step; the step never pays currency', () => {
  for (const weapon of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'nope', 'DRAGONFIRE_METEOR', 123, null, {}, ['dragonfire_meteor'], true]) {
    const d = JSON.parse(FX.testerBugged.disk);
    d.notes.starter = { hero: 'hearthwarden', weapon };
    const s = load(JSON.stringify(d));
    assert.equal(s.tree.gt_dragonfire_meteor, undefined, `starter weapon ${JSON.stringify(weapon)} repairs nothing`);
    assert.equal(s.gold, d.gold);
  }
  for (const notes of [null, 'x', [], { starter: '__proto__' }, JSON.parse('{"__proto__":{"weapon":"dragonfire_meteor"}}')]) {
    const d = JSON.parse(FX.testerBugged.disk); d.notes = notes;
    const s = load(JSON.stringify(d));
    assert.equal(s.tree.gt_dragonfire_meteor, undefined, `notes ${JSON.stringify(notes)}`);
  }
  // a save already stamped v6 is never "repaired" again (v6 builds keep the nodes; a forged stamp gets nothing)
  const d6 = JSON.parse(FX.testerBugged.disk); d6.tree.v = 6;
  assert.equal(load(JSON.stringify(d6)).tree.gt_dragonfire_meteor, undefined);
  // a future stamp is refused (read-only), never migrated
  const d9 = JSON.parse(FX.testerBugged.disk); d9.tree.v = 7;
  assert.equal(parseSave(JSON.stringify(d9)).code, 'future');
  // the step directly: hostile trees, idempotent, never currency
  for (const t of [null, undefined, 7, 'x', [], [1, 2], JSON.parse('{"__proto__":{"polluted":1},"constructor":1,"gt_wildfire":"9"}')]) {
    const r = repairStarter(t, { starter: 'dragonfire_meteor', def: treeDef });
    assert.deepEqual([r.gold, r.shards], [0, 0]);
    assert.equal(Object.getPrototypeOf(r.tree), Object.prototype);
    assert.equal({}.polluted, undefined);
    assert.ok(!Object.hasOwn(r.tree, '__proto__') && !Object.hasOwn(r.tree, 'constructor'));
    assert.equal(r.tree.gt_dragonfire_meteor, 1);
  }
  const once = repairStarter({ sp_reroll1: 1 }, { starter: 'dragonfire_meteor', def: treeDef });
  assert.deepEqual(once.repaired, ['gt_dragonfire_meteor', 'gt_wildfire']);
  const twice = repairStarter(once.tree, { starter: 'dragonfire_meteor', def: treeDef });
  assert.deepEqual(twice.repaired, []); assert.deepEqual(twice.tree, once.tree);
  // only PERMANENT starter nodes are ever re-granted (Holy Orbit's Halo can be refunded by respec, so it is not handed back)
  for (const [w, ids] of Object.entries(STARTER_REPAIR_V6)) for (const id of ids) { assert.ok(treeDef.nodes[id], id); assert.equal(treeDef.nodes[id].permanent, true, `${w}: ${id} permanent`); assert.ok(starterNodes(info, w).includes(id), `${w}: ${id} is a starter node`); }
  assert.deepEqual(Object.keys(STARTER_REPAIR_V6).sort(), [...starterPool(data).weapons].sort(), 'every starter weapon has a frozen repair row');
  assert.deepEqual(repairStarter({}, { starter: 'holy_orbit', def: treeDef }).repaired, ['gt_holy_orbit']);
  // through the registry: no gold, shards, Dawnglass or notice from step 6
  const r = runTreeSteps({ sp_reroll1: 1 }, 5, 6, TREE_STEPS, { starter: 'dragonfire_meteor', def: treeDef, creep: { sp_reroll1: 2 } });
  assert.deepEqual([r.gold, r.shards, r.glass, r.notes], [0, 0, 0, {}]);
  assert.deepEqual(r.creep, { sp_reroll1: 2 }, 'rising-price steps untouched');
});
