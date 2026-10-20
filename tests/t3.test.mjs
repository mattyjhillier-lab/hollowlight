// T3a: the v2 rescale goes live. Soft cap (single cap per budget category), status / ability sim hooks, Blessing combined caps.
// Design: docs/design/skill-tree-v2.md sections 5, 6, 8 and Appendix C.9-C.10; docs/design/difficulty-tiers-economy-v1.md 8.6.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { aggregateMods, presetTree, softFactors, emptyEffects } from '../src/meta/tree.js';
import { effectTerms, budgetOf } from '../src/meta/treebudget.js';
import { Sim } from '../src/sim/Sim.js';
import { validateBlessings, blessTotals, effectiveCap, blessingPool } from '../src/sim/blessings.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { compileTree } from '../src/meta/tree.js';

const RULE = def.rule;
const soft = (S, C) => C * (1 - Math.exp(-S / C));
const DT = 1 / 60;
const own = (ids) => Object.fromEntries(ids.map((i) => [i, 1]));
const full = () => presetTree(def, 'full', true);

test('T3a the budget rule reaches the compiled tree and aggregateMods applies it', () => {
  assert.ok(RULE && RULE.categories.dmg.cap === 5.4 && RULE.perWeapon.cap === 17.2);
  assert.deepEqual(aggregateMods({}, def, data).softcap, {});
  const a = aggregateMods(own(['sp_edge', 'sp_mastery', 'li_dawn']), def, data);
  assert.ok(Math.abs(a.mods.damage - (1 + soft(3, 5.4) / 100)) < 1e-9, 'three +1% damage nodes pass through C(1 - e^(-S/C)), C = 5.4');
  assert.ok(Math.abs(a.softcap.dmg.total - soft(3, 5.4)) < 1e-9 && a.softcap.dmg.S === 3);
});

test('T3a one cap per category: the whole tree can never pass a category cap, however many nodes are added', () => {
  const t = full();
  const a = aggregateMods(t, def, data);
  const caps = RULE.categories;
  assert.ok(a.mods.damage - 1 <= caps.dmg.cap / 100 + 1e-9, `damage ${a.mods.damage}`);
  assert.ok(1 - a.mods.cooldown <= caps.cast.cap / 100 + 1e-9);
  assert.ok(a.mods.area - 1 <= caps.area.cap / 100 + 1e-9);
  assert.ok(a.player.maxHp - 1 <= caps.hp.cap / 100 + 1e-9);
  assert.ok(a.player.levelHeal <= caps.heal.cap + 1e-9);
  // status: bleed + burn + mark share ONE cap (mark seconds count as 4 % points per second)
  const shared = a.status.bleed + a.status.burn + a.status.mark * RULE.markFace;
  assert.ok(shared <= caps.status.cap + 1e-9, `status ${shared}`);
  // per weapon: one pool for ALL of that weapon's own stat nodes (flat Pierce / Chains count 2 points each but are never scaled)
  for (const wid of Object.keys(data.weapons)) {
    const row = a.softcap[`wpn:${wid}`];
    assert.ok(row, `${wid} has a pool row`);
    assert.equal(row.C, RULE.perWeapon.cap);
    assert.ok(row.total <= RULE.perWeapon.cap + 1e-9, `${wid} pool ${row.total}`);
    assert.ok(row.S > row.C, `${wid}: the constellation is past saturation by design (S ${row.S} vs C ${row.C})`);
  }
});

test('T3a the soft cap is the budget: every capped category of the full tree equals C(1 - e^(-S/C)) from the faces the budget counts', () => {
  const t = full();
  const f = softFactors(t, def, { tier: 0, chapter: 1 });
  for (const [cat, row] of Object.entries(f.info)) {
    assert.ok(Math.abs(row.total - soft(row.S, row.C)) < 1e-9, cat);
    assert.ok(row.total <= row.C + 1e-9 && row.factor <= 1);
  }
  // the face sums the game caps equal the ones the budget counts, for every category no keystone pair touches (the budget scores the better side of a pair, the preset takes the first)
  const b = budgetOf(def, RULE, 5);
  for (const cat of ['cast', 'area', 'status']) assert.ok(Math.abs(f.info[cat].S - b.rows[cat].S) < 1e-9, `${cat}: aggregate ${f.info[cat].S} vs budget ${b.rows[cat].S}`);
});

test('T3a negatives pass through the cap unscaled; flat adds are never scaled; the keystone trade stays a real trade', () => {
  const k = aggregateMods(own(['su_key']), def, data);
  assert.equal(k.weaponBonus.spirit_bolts.power.pct, -3);
  assert.ok(Math.abs(k.weaponBonus.ghost_wolves.power.pct - soft(3, 12.8)) < 1e-9);
  const p = aggregateMods(own(['gt_spirit_bolts', 'bo_pierce']), def, data);
  assert.equal(p.weaponBonus.spirit_bolts.pierce.add, 1, 'Pierce +1 is a whole foe, not a percentage');
  const g = aggregateMods(own(['li_glass']), def, data);
  assert.equal(g.player.maxHp, 1 - 0.04, 'the Glass keystone cost is unscaled');
});

test('T3a the new effect kinds reach aggregateMods: status potency / seconds, Firm Grip, Wide Wheel, visuals', () => {
  const a = aggregateMods(own(['wf_bleed', 'wf_rend', 'or_kindle', 'or_ember', 'rv_eye', 'wr_grip', 'el_wheel', 'wr_spark', 'el_lamp']), def, data);
  const S = 3 + 3 + 3 + 3 + 0.5 * RULE.markFace; // bleed 6, burn 6, mark 0.5 s -> 2 points
  const fac = soft(S, 16) / S;
  assert.ok(Math.abs(a.status.bleed - 6 * fac) < 1e-9 && Math.abs(a.status.burn - 6 * fac) < 1e-9 && Math.abs(a.status.mark - 0.5 * fac) < 1e-9);
  assert.equal(a.ability.rallySecs, 0.5);
  assert.equal(a.ability.wheel, 8);
  assert.deepEqual(a.visuals.sort(), ['graveLamp', 'kinSparks']);
});

test('T3a status hooks in the sim: Bleed and Burn potency, Mark seconds (the amp itself never grows), Rally and Candle Wheel', () => {
  const base = new Sim({ data, seed: 3 });
  const tree = { ...emptyEffects(), status: { bleed: 10, burn: 20, mark: 0.5, pin: 0 }, ability: { dur: 1, autoHp: 0, rallySecs: 0.5, wheel: 8 } };
  const s = new Sim({ data, seed: 3, tree });
  const mk = (sim) => sim.spawnEnemy('wolf', sim.player.x + 200, sim.player.y);
  const e0 = mk(base), e1 = mk(s);
  base.bleed(e0, 10, 4); s.bleed(e1, 10, 4);
  assert.equal(e0.bleedDps, 10); assert.ok(Math.abs(e1.bleedDps - 11) < 1e-9);
  base.burn(e0, 10); s.burn(e1, 10);
  assert.ok(Math.abs(e1.burnDps / e0.burnDps - 1.2) < 1e-9, 'Burn +20%');
  base.mark(e0); s.mark(e1);
  assert.equal(e1.markT - e0.markT, 0.5, 'Mark lasts 0.5 s longer');
  assert.equal(s.damageAmp(e1), base.damageAmp(e0), 'the amp is the same size; only the uptime changes (Rally x Mark stays under x1.75)');
  // Rally the Pack lasts +0.5 s
  base.ability.cdLeft = 0; s.ability.cdLeft = 0;
  assert.equal(base.character.ability.id, 'rally_pack');
  base.useAbility(); s.useAbility();
  assert.ok(Math.abs(s.rally.dur - base.rally.dur - 0.5) < 1e-9, `${s.rally.dur} vs ${base.rally.dur}`);
  // Candle Wheel ring 8% wider
  const eb = new Sim({ data, seed: 3, characterId: 'elias' }), es = new Sim({ data, seed: 3, characterId: 'elias', tree });
  eb.ability.cdLeft = 0; es.ability.cdLeft = 0; eb.useAbility(); es.useAbility();
  const zb = eb.zones.find((z) => z.wheel), zs = es.zones.find((z) => z.wheel);
  assert.ok(Math.abs(zs.r / zb.r - 1.08) < 1e-9);
  // absent tree = the exact old numbers (byte-identical starter runs)
  assert.deepEqual([base.tfx.bleedMul, base.tfx.burnMul, base.tfx.markAdd, base.tfx.rallyAdd, base.tfx.wheelMul], [1, 1, 0, 0, 1]);
});

test('T3a Blessings: tree x Blessing is held under the combined cap, a tree-less run is never trimmed', () => {
  const def0 = validateBlessings(data.blessings);
  assert.deepEqual(def0.combined, { damage: 1.09, maxHp: 1.18, speed: 1.08, pickup: 1.45, gold: 1.40 });
  assert.equal(effectiveCap(def0, 'pickup', { pickup: 1 }), 1.24, 'no tree: the Blessing keeps its own cap');
  assert.equal(effectiveCap(def0, 'pickup', null), 1.24);
  assert.ok(Math.abs(effectiveCap(def0, 'pickup', { pickup: 1.2 }) - 1.45 / 1.2) < 1e-12, 'tree 1.20 leaves 1.208 for Blessings');
  assert.equal(effectiveCap(def0, 'damage', { damage: 1.06 }), 1.09 / 1.06 < 1.06 ? 1.09 / 1.06 : 1.06);
  for (const e of ['pickup', 'maxHp', 'damage', 'gold', 'speed']) assert.ok(effectiveCap(def0, e, { [e]: 5 }) === 1, `${e}: a huge tree multiplier leaves nothing`);
  // maxed Blessings x the maxed tree never pass the combined number
  const a = aggregateMods(full(), def, data);
  const mul = { damage: a.mods.damage, maxHp: a.player.maxHp, speed: a.mods.speed, pickup: a.mods.pickup, gold: a.mods.gold };
  const maxed = Object.fromEntries(Object.keys(def0.items).map((id) => [id, def0.items[id].ranks]));
  const t = blessTotals(def0, maxed, {}, mul);
  for (const e of ['pickup', 'maxHp', 'damage', 'gold', 'speed']) assert.ok(mul[e] * t[e] <= def0.combined[e] + 1e-9, `${e}: ${mul[e]} x ${t[e]}`);
  // a tree-less starter run: totals identical to the old read
  assert.deepEqual(blessTotals(def0, maxed, {}, { damage: 1, maxHp: 1, speed: 1, pickup: 1, gold: 1 }), blessTotals(def0, maxed, {}));
});

test('T3a a Blessing leaves the card pool once its effect is at its (combined) cap, and comes back below it', () => {
  const def0 = validateBlessings(data.blessings);
  const ctx = (ranks, treeMul) => ({ blessings: def0, blessRanks: ranks, banished: new Set(), treeMul });
  const ids = (c) => blessingPool(c).map((p) => p.card.blessId).sort();
  const all = Object.keys(def0.items).sort();
  assert.deepEqual(ids(ctx({}, { pickup: 1, damage: 1, maxHp: 1, speed: 1, gold: 1 })), all);
  // tree pickup 1.20 + Wider Glow rank 2 (1.16) = 1.392 < 1.45: still offered; rank 3 = 1.24 capped to 1.208 -> at cap -> gone
  assert.ok(ids(ctx({ wider_glow: 1 }, { pickup: 1.2, damage: 1, maxHp: 1, speed: 1, gold: 1 })).includes('wider_glow'));
  const atCap = ids(ctx({ wider_glow: 2 }, { pickup: 1.3, damage: 1, maxHp: 1, speed: 1, gold: 1 }));
  assert.ok(!atCap.includes('wider_glow'), 'tree 1.30 leaves 1.115 for Blessings: rank 2 (1.16) is already over it -> at cap');
  assert.ok(atCap.includes('kind_fortune'), 'other effects are unaffected');
  // a plain Blessing at its own max rank is still removed the old way
  assert.ok(!ids(ctx({ dawnlit_soles: 2 }, null)).includes('dawnlit_soles'));
  // sim wiring: the sim passes its own tree multipliers into the pool
  const sim = new Sim({ data, seed: 1, tree: { ...emptyEffects(), mods: { ...emptyEffects().mods, pickup: 1.3 } } });
  assert.equal(sim.treeMul.pickup, 1.3);
  sim.setBlessRank('wider_glow', 3);
  assert.ok(Math.abs(sim.bless.pickup - 1.45 / 1.3) < 1e-9);
  assert.ok(!blessingPool(sim.cardCtx).some((p) => p.card.blessId === 'wider_glow'));
});

test('T3a validateBlessings: combined caps are optional and range-checked; bad values mean no combined limit', () => {
  const raw = JSON.parse(JSON.stringify(data.blessings));
  assert.ok(validateBlessings(raw).combined);
  raw.combined.pickup = 9; assert.equal(validateBlessings(raw).combined, null);
  raw.combined.pickup = 'x'; assert.equal(validateBlessings(raw).combined, null);
  delete raw.combined; assert.equal(validateBlessings(raw).combined, null);
  assert.equal(validateBlessings({ ...raw, combined: { __proto__: { pickup: 1.2 } } }).combined, null);
});

test('T3a effectTerms covers every effect kind the live tree uses (nothing falls into the unknown category)', () => {
  for (const id of def.list) for (const e of def.nodes[id].effects) for (const t of effectTerms(e, RULE)) assert.notEqual(t.cat, 'unknown', id);
});

test('T3a the live tree compiles from the SAME composed data as the budget view (nothing in the game differs from what is budgeted)', () => {
  const c = composeTree(readTreeFiles(), data);
  assert.deepEqual(c.live.nodes.filter((n) => !n.inert).map((n) => n.id), c.v2.nodes.filter((n) => !c.live.nodes.find((x) => x.id === n.id && x.inert)).map((n) => n.id));
  const d1 = compileTree(c.live, data);
  assert.equal(d1.rule && d1.rule.categories.choice.cap, 0, "choice cap is loaned to live categories until the Card Fan perks go live (docs/design/tree-impact.md)");
});
