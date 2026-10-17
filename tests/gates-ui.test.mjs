// G1c: player-facing gate wording (pure functions in src/meta/gatewords.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { newlyLine, newlyLines, nodeTitle, gateTag, gateOf, toastWeapons, PERMANENT_NOTE, RESPEC_ARMED, FIRST_RUN_HINT } from '../src/meta/gatewords.js';
import { describeNode, closestUnlocks } from '../src/meta/tree.js';
import { defaultSave } from '../src/save/schema.js';

const gates = def.list.filter((i) => def.nodes[i].permanent);

test('G1c gateOf/gateTag: exactly the 15 permanent nodes are gates', () => {
  assert.equal(gates.length, 15);
  for (const id of gates) assert.ok(gateOf(def, id) && gateTag(def, id) === 'GATE');
  assert.equal(gateTag(def, 'hub'), '');
  assert.equal(gateOf(def, 'nope'), null);
});

test('G1c newly lines: weapon gate says ready to unlock + cost; evolution shows Name (Weapon), never the stat pair', () => {
  assert.equal(newlyLine(def, 'gt_spirit_bolts', data), 'NEW: Spirit Bolts is ready to unlock in the Skill Tree (300 gold).');
  const l = newlyLine(def, 'gt_dire_alpha', data);
  assert.ok(l.includes('The Alpha (Ghost Wolves)'));
  const evo = data.evolutions.dire_alpha;
  for (const s of evo.stats || evo.pair || []) assert.ok(!l.toLowerCase().includes(String(data.weapons[evo.weapon].stats?.[s]?.name || s).toLowerCase()));
  // non-gate nodes keep their plain name
  const plain = def.list.find((i) => !def.nodes[i].permanent);
  assert.equal(newlyLine(def, plain, data), def.nodes[plain].name);
});

test('G1c newlyLines: gates first, capped, unknown ids dropped', () => {
  const plain = def.list.find((i) => !def.nodes[i].permanent);
  const out = newlyLines(def, [plain, 'bogus', 'gt_spirit_bolts'], data);
  assert.equal(out.length, 2);
  assert.ok(out[0].startsWith('NEW:'));
  assert.equal(newlyLines(def, gates, data, 3).length, 3);
});

test('G1c hidden evolution gate: ??? until progress, then Name (Weapon); weapon gate always named', () => {
  const s = defaultSave();
  const d0 = describeNode(def, s, 'gt_dire_alpha', data);
  assert.equal(d0.name, '???');
  assert.equal(nodeTitle(def, 'gt_dire_alpha', data, true), '???');
  assert.equal(describeNode(def, s, 'gt_spirit_bolts', data).name, 'Spirit Bolts');
  assert.ok(!closestUnlocks(def, s, data, 99).some((r) => r.id === 'gt_dire_alpha'));
  s.stats.killsByEnemy = { wolf: 500 };
  const d1 = describeNode(def, s, 'gt_dire_alpha', data);
  assert.equal(d1.name, 'The Alpha (Ghost Wolves)');
  const row = closestUnlocks(def, s, data, 99).find((r) => r.id === 'gt_dire_alpha');
  assert.ok(row && row.gate && /500\/10000/.test(row.text));
});

test('G1c closest unlocks flag gates and show cur/goal', () => {
  const s = defaultSave();
  s.stats.killsByEnemy = { crow: 900 };
  const rows = closestUnlocks(def, s, data, 99);
  const r = rows.find((x) => x.id === 'gt_raven_flock');
  assert.ok(r && r.gate === true && r.name === 'Raven Flock' && /900\/4500/.test(r.text));
});

test('G1c toast fires once per gated weapon, never for starter weapons', () => {
  const seen = new Set();
  const cards = [{ kind: 'weapon', weaponId: 'spirit_bolts' }, { kind: 'weapon', weaponId: 'holy_orbit' }, { kind: 'stat' }];
  assert.deepEqual(toastWeapons(cards, data, seen), ['spirit_bolts']);
  seen.add('spirit_bolts');
  assert.deepEqual(toastWeapons(cards, data, seen), []);
  assert.deepEqual(toastWeapons([{ kind: 'weapon', weaponId: '__proto__' }], data, seen), []);
});

test('G1c fixed strings', () => {
  assert.match(PERMANENT_NOTE, /not refunded by respec/);
  assert.match(RESPEC_ARMED, /gates stay/i);
  assert.ok(FIRST_RUN_HINT.length < 130);
});
