// T3b / DT0: difficulty-tier data + plumbing, Dawnglass, per-map-per-tier records, the five tool clusters (Satchel, Card Fan, Almanac, Hearth-key,
// Night Gate). Design: docs/design/difficulty-tiers-economy-v1.md. Everything user-supplied (save, URL) is hostile input.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { aggregateMods, compileTree, canBuy, buy, respec, nodeStatus, conditionProgress, sanitizeTree, emptyEffects, presetTree } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { budgetOf } from '../src/meta/treebudget.js';
import { layoutIssues } from '../src/meta/treelayout.js';
import { Sim } from '../src/sim/Sim.js';
import { TIER_IDS, MARK_IDS, validateTiers, resolveTier, IDENTITY, tierIndex } from '../src/sim/tiers.js';
import { parseParams } from '../src/params.js';
import { defaultSave, parseSave, sanitize, serializeSave, SANITIZE_WARNINGS } from '../src/save/schema.js';
import { recordTierRun, tierRecords, MAX_GLASS } from '../src/save/tiers.js';
import { SaveStore } from '../src/save/store.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const composed = composeTree(readTreeFiles(), data);
const v2 = compileTree(composed.v2, data); // every node live (the budget view)
const own = (ids) => Object.fromEntries(ids.map((i) => [i, 1]));

// ------------------------------------------------------------------ tier data
test('DT0 tiers.json validates: three registered tiers, Twilight exactly 1, harder tiers never easier, marks are registered names', () => {
  assert.doesNotThrow(() => validateTiers(data.tiers));
  assert.deepEqual(data.tiers.order, TIER_IDS);
  assert.deepEqual(Object.keys(data.tiers.template), TIER_IDS);
  const t = data.tiers.template;
  for (const k of ['enemyHp', 'enemyDmg', 'density', 'bossHp', 'heartPity']) assert.ok(t.normal[k] === 1 && t.hard[k] >= 1 && t.expert[k] >= t.hard[k], k);
  assert.deepEqual([t.hard.enemyHp, t.hard.enemyDmg, t.hard.bossHp, t.expert.enemyHp, t.expert.enemyDmg, t.expert.bossHp, t.expert.heartPity], [1.1, 1.15, 1.5, 2, 1.3, 2, 1.3], 'locked multipliers (docs/LOCKED.md DIFFICULTY TIERS; Deep Dusk enemy HP 1.45 -> 1.1 reopened 2026-10-21 Tree economy + Deep Dusk)');
  for (const id of TIER_IDS) for (const m of t[id].marks.kinds) assert.ok(MARK_IDS.includes(m));
  assert.equal(t.normal.glass.first, 0, 'Twilight pays no Dawnglass');
});

test('DT0 tier validator rejects hostile / mistaken data', () => {
  const bad = (mut, re) => { const d = clone(data.tiers); mut(d); assert.throws(() => validateTiers(d), re); };
  bad((d) => { d.template.normal.enemyHp = 1.1; }, /Twilight .* exactly 1/);
  bad((d) => { d.template.hard.enemyHp = 5; }, /1\.\.4/);
  bad((d) => { d.template.hard.enemyHp = 0.9; }, /1\.\.4/);
  bad((d) => { d.template.expert.enemyHp = 1.05; }, /below the tier under it/);
  bad((d) => { d.template.hard.marks.kinds = ['laser']; }, /registered mark ids/);
  bad((d) => { d.template.hard.marks.share = 0.9; }, /0\.\.0\.3/);
  bad((d) => { d.template.hard.marks.from = 99999; }, /0\.\.1200/);
  bad((d) => { d.template.normal.glass.first = 3; }, /Dawnglass/);
  bad((d) => { d.template.hard.glass = { boss: -1 }; }, /glass/);
  bad((d) => { d.template.hard.glass = { surprise: 1 }; }, /glass/);
  bad((d) => { d.template.hard.name = '<b>x</b>'; }, /name/);
  bad((d) => { d.template.extra = d.template.hard; }, /exactly/);
  bad((d) => { d.order = ['normal', 'expert', 'hard']; }, /order/);
  bad((d) => { d.chapters.__proto__x = {}; d.chapters['bad key!'] = {}; }, /bad chapter key/);
  bad((d) => { d.chapters.cursed_forest = { surprise: {} }; }, /unknown tier/);
  bad((d) => { d.chapters.cursed_forest = { normal: { enemyHp: 2 } }; }, /Twilight .* must be 1/);
  bad((d) => { d.template.hard.bossHp = Infinity; }, /1\.\.4/);
  assert.throws(() => validateTiers(null), /template/);
});

test('DT0 resolveTier: an unknown or forged tier always resolves to Twilight; chapter overrides apply; the result is frozen', () => {
  for (const bad of [undefined, null, '', 'Hard', 'hard ', '__proto__', 'constructor', 'toString', 5, {}, [], 'x'.repeat(500)]) assert.equal(resolveTier(data.tiers, 'cursed_forest', bad), IDENTITY, String(bad));
  assert.equal(resolveTier(null, 'cursed_forest', 'hard'), IDENTITY);
  assert.equal(resolveTier({ template: null }, 'cursed_forest', 'hard'), IDENTITY);
  const h = resolveTier(data.tiers, 'cursed_forest', 'hard');
  assert.equal(h.id, 'hard'); assert.equal(h.idx, 1); assert.equal(h.enemyHp, 1.1); assert.ok(Object.isFrozen(h));
  const t2 = clone(data.tiers); t2.chapters.cursed_forest = { hard: { enemyHp: 1.6, glass: { boss: 3 } } };
  const o = resolveTier(t2, 'cursed_forest', 'hard');
  assert.equal(o.enemyHp, 1.6); assert.equal(o.glass.boss, 3); assert.equal(o.glass.dawn, 2, 'other fields inherit the template');
  assert.equal(resolveTier(t2, 'other_chapter', 'hard').enemyHp, 1.1, 'another chapter keeps the template');
  assert.equal(resolveTier(t2, '__proto__', 'hard').enemyHp, 1.1);
  assert.deepEqual(TIER_IDS.map(tierIndex), [0, 1, 2]); assert.equal(tierIndex('nope'), 0); assert.equal(tierIndex(undefined), 0);
});

test('DT0 ?tier= is a strict whitelist; junk falls back to no tier', () => {
  assert.equal(parseParams('').tier, null);
  for (const t of TIER_IDS) assert.equal(parseParams(`?tier=${t}`).tier, t);
  for (const bad of ['HARD', 'hard%20', '__proto__', 'constructor', '<script>', '1', 'all', '', 'hard;expert', 'x'.repeat(300)]) assert.equal(parseParams(`?tier=${encodeURIComponent(bad)}`).tier, null, bad);
});

// ------------------------------------------------------------------ the sim reads the tier
function spawnStats(tier, id = 'wolf') {
  const sim = new Sim({ data, seed: 5, tier });
  sim.time = 300;
  const e = sim.spawnEnemy(id, sim.player.x + 300, sim.player.y);
  return { hp: e.hp, dmg: e.dmg };
}

test('DT0 tier multipliers: enemy HP x1.1 / x2.0, damage x1.15 / x1.3, boss HP x1.5 / x2.0; Twilight and a forged tier are identical to no tier at all', () => {
  const base = spawnStats(undefined), tw = spawnStats('normal');
  assert.deepEqual(tw, base, 'Twilight = the old numbers, bit for bit');
  for (const bad of ['hard ', '__proto__', 5, null, {}]) assert.deepEqual(spawnStats(bad), base, String(bad));
  const hard = spawnStats('hard'), exp = spawnStats('expert');
  assert.ok(Math.abs(hard.hp / base.hp - 1.1) < 1e-12 && Math.abs(hard.dmg / base.dmg - 1.15) < 1e-12);
  assert.ok(Math.abs(exp.hp / base.hp - 2) < 1e-12 && Math.abs(exp.dmg / base.dmg - 1.3) < 1e-12);
  const boss = (t) => spawnStats(t, 'elder_treant').hp;
  assert.ok(Math.abs(boss('hard') / boss('normal') - 1.5) < 1e-12 && Math.abs(boss('expert') / boss('normal') - 2) < 1e-12);
  const sim = new Sim({ data, seed: 1, tier: 'expert' });
  assert.equal(sim.result().tier, 'expert');
  assert.equal(new Sim({ data, seed: 1, tier: 'zzz' }).result().tier, 'normal');
});

test('DT0 Long Night stretches the heart pity timer; Twilight does not; Kinder Hearts shortens it', () => {
  const p = (tier, tree) => { const s = new Sim({ data, seed: 3, tier, tree }); s.sinceHeart = 30; s.player.hp = 1; let n = 0; const orig = s.rng.chance.bind(s.rng); s.rng.chance = (pr) => { n = pr; return false; }; s.rollDrops({ boss: false, x: 0, y: 0 }); s.rng.chance = orig; return n; };
  const tw = p('normal'), ex = p('expert');
  assert.ok(ex < tw, `${ex} < ${tw}`);
  const kinder = p('normal', aggregateMods(own(['li_hearts']), def, data));
  assert.ok(kinder > tw, 'a shorter pity timer raises the chance after 30 s');
});

// ------------------------------------------------------------------ Dawnglass + hostile saves
test('DT0 Dawnglass is a bounded save field: default 0, clamped 0..1e9, junk becomes 0, survives export / import', () => {
  assert.equal(defaultSave().dawnglass, 0);
  for (const [v, want] of [[5, 5], [5.9, 5], [-3, 0], [1e12, MAX_GLASS], [NaN, 0], [Infinity, 0], ['9', 0], [null, 0], [[], 0], [{}, 0], [undefined, 0]]) assert.equal(sanitize({ version: 3, dawnglass: v }).dawnglass, want, String(v));
  const s = sanitize({ version: 3, dawnglass: 77 });
  const back = parseSave(JSON.stringify(serializeSave(s)));
  assert.ok(back.ok); assert.equal(back.save.dawnglass, 77);
  assert.equal(parseSave('{"version":3}').save.dawnglass, 0, 'an older v3 save without the field loads with 0');
});

test('DT0 stats.tiers: hostile input is dropped, clamped and counted', () => {
  const w0 = SANITIZE_WARNINGS.unknown;
  const raw = JSON.parse('{"cursed_forest":{"hard":{"runs":5,"clears":9,"best":{"t":-1,"kills":1e99,"level":"x"},"stars":99,"heroes":{"wren":{"clears":1e99,"first":"yes"},"elias":{"clears":2,"first":true},"ghost":{"clears":1,"first":true},"__proto__":{"clears":9}}},"expert":{"runs":-4,"clears":3},"nope":{"runs":1},"__proto__":{"runs":9}},"unknown_chapter":{"hard":{"runs":1}},"__proto__":{"hard":{"runs":1}},"constructor":{"hard":{}}}');
  const t = tierRecords(raw, data, SANITIZE_WARNINGS);
  assert.deepEqual(Object.keys(t), ['cursed_forest']);
  const h = t.cursed_forest.hard;
  assert.equal(h.runs, 5); assert.equal(h.clears, 5, 'you cannot clear more often than you played');
  assert.deepEqual(h.best, { t: 0, kills: 1e9, level: 0 });
  assert.equal(h.stars, 7);
  assert.deepEqual(Object.keys(h.heroes).sort(), ['elias', 'wren']);
  assert.deepEqual(h.heroes.wren, { clears: 5, first: false }, 'first is a strict boolean');
  assert.deepEqual(h.heroes.elias, { clears: 2, first: true });
  assert.equal(t.cursed_forest.expert.runs, 0); assert.equal(t.cursed_forest.expert.clears, 0);
  assert.equal(t.cursed_forest.nope, undefined);
  assert.ok(SANITIZE_WARNINGS.unknown > w0, 'dropped keys are counted, never silent');
  assert.equal({}.runs, undefined);
  for (const junk of [null, 7, 'x', [], [1], true]) assert.deepEqual(tierRecords(junk, data), {});
  assert.deepEqual(tierRecords(raw, null), {}, 'no game data registered = fail closed');
  // through the full save sanitiser
  const s = sanitize({ version: 3, stats: { tiers: raw } });
  assert.equal(s.stats.tiers.cursed_forest.hard.runs, 5);
  // too many chapters: capped, counted
  const many = {}; for (let i = 0; i < 100; i++) many[`c${i}`] = { hard: { runs: 1 } };
  assert.deepEqual(tierRecords(many, { chapters: Object.fromEntries(Object.keys(many).map((k) => [k, {}])), characters: data.characters }), Object.fromEntries(Object.keys(many).slice(0, 32).map((k) => [k, { hard: { runs: 1, clears: 0, best: { t: 0, kills: 0, level: 0 }, stars: 0, heroes: {} } }])));
});

test('DT0 stats counters (gems, abilityUses, blessings, marked, chests) are bounded integers', () => {
  const s = sanitize({ version: 3, stats: { gems: 1e99, abilityUses: -5, blessingsTaken: '3', markedKills: 2.7, chests: NaN } });
  assert.deepEqual([s.stats.gems, s.stats.abilityUses, s.stats.blessingsTaken, s.stats.markedKills, s.stats.chests], [1e9, 0, 0, 2, 0]);
});

// ------------------------------------------------------------------ records + first-dawn bounty
const WON = (extra = {}) => ({ outcome: 'victory', time: 900, level: 40, kills: 3000, chapter: 'cursed_forest', character: 'wren', tier: 'hard', ...extra });
const OPEN = ['cursed_forest:hard', 'cursed_forest:expert'];

test('DT0 the first-dawn bounty is paid once per (map, tier, hero): replays, a second bank of the same run and a re-import never pay again', () => {
  const save = sanitize({ version: 3 });
  const a = recordTierRun(save, WON(), { data, unlockedTiers: OPEN });
  // per-run glass (dawn 2 on Deep Dusk) rides on top of the bounty; this test counts the bounty only
  assert.deepEqual([a.tier, a.glassFirst, a.glassRun, a.glass, a.shards, a.firstDawn], ['hard', 6, 2, 8, 1, true]);
  assert.equal(save.dawnglass, 8); assert.equal(save.shards, 1);
  const b = recordTierRun(save, WON(), { data, unlockedTiers: OPEN });
  assert.deepEqual([b.glassFirst, b.shards, b.firstDawn], [0, 0, false]);
  assert.equal(save.dawnglass, 10);
  // another hero on the same tier is a separate bounty; Long Night pays 10
  const c = recordTierRun(save, WON({ character: 'elias' }), { data, unlockedTiers: OPEN });
  assert.equal(c.glassFirst, 6); assert.ok(c.stars & 2, 'both heroes cleared = star 2');
  const d = recordTierRun(save, WON({ tier: 'expert' }), { data, unlockedTiers: OPEN });
  assert.deepEqual([d.glassFirst, d.glassRun], [10, 4]);
  assert.equal(save.dawnglass, 10 + 8 + 14);
  // the claim flags live in the save: an export / import round trip keeps them
  const again = sanitize(JSON.parse(JSON.stringify(save)));
  assert.equal(again.stats.tiers.cursed_forest.hard.heroes.wren.first, true);
  const e = recordTierRun(again, WON(), { data, unlockedTiers: OPEN });
  assert.deepEqual([e.glassFirst, e.glassRun], [0, 2]); assert.equal(again.dawnglass, 34);
  // a loss pays and claims nothing
  const l = recordTierRun(sanitize({ version: 3 }), WON({ outcome: 'defeat' }), { data, unlockedTiers: OPEN });
  assert.deepEqual([l.glass, l.firstDawn], [0, false]); // no boss, no dawn: nothing
});

test('DT3 per-run Dawnglass: boss 2 / 3 + dawn 2 / 4 + marked (capped) inside runCap 6 / 10; a loss after the boss keeps the boss glass; forged counts clamp', () => {
  const s1 = sanitize({ version: 3 });
  const lossBoss = recordTierRun(s1, WON({ outcome: 'defeat', bossKilled: true }), { data, unlockedTiers: OPEN });
  assert.deepEqual([lossBoss.glassRun, lossBoss.glassFirst, s1.dawnglass], [2, 0, 2]);
  const s2 = sanitize({ version: 3 });
  const full = recordTierRun(s2, WON({ bossKilled: true, marked: 1e12 }), { data, unlockedTiers: OPEN }); // 2 + 2 + min(cap 2) = 6 = runCap
  assert.deepEqual([full.glassRun, full.glassFirst, full.glass], [6, 6, 12]);
  const s3 = sanitize({ version: 3 });
  const ln = recordTierRun(s3, WON({ tier: 'expert', bossKilled: true, marked: 50, character: 'elias' }), { data, unlockedTiers: OPEN }); // 3 + 4 + 3 = 10
  assert.deepEqual([ln.glassRun, ln.glassFirst], [10, 10]);
  for (const bad of [-5, NaN, '9', Infinity, null, {}]) {
    const s = sanitize({ version: 3 });
    assert.equal(recordTierRun(s, WON({ outcome: 'defeat', marked: bad, bossKilled: 'yes' }), { data, unlockedTiers: OPEN }).glass, 0, String(bad)); // forged marked count + non-boolean bossKilled pay nothing
  }
  const tw = sanitize({ version: 3 });
  assert.equal(recordTierRun(tw, WON({ tier: 'normal', bossKilled: true, marked: 3 }), { data, unlockedTiers: OPEN }).glass, 0, 'Twilight pays no Dawnglass');
  const unopened = sanitize({ version: 3 });
  assert.equal(recordTierRun(unopened, WON({ bossKilled: true }), { data, unlockedTiers: [] }).glass, 0, 'an unopened night pays nothing');
});

test('DT0 a tier the save has not opened is recorded as Twilight: a forged or debug tier id can never mint Dawnglass', () => {
  const save = sanitize({ version: 3 });
  const r = recordTierRun(save, WON({ tier: 'expert' }), { data, unlockedTiers: [] });
  assert.equal(r.tier, 'normal'); assert.equal(save.dawnglass, 0);
  assert.equal(save.stats.tiers.cursed_forest.expert, undefined);
  assert.equal(save.stats.tiers.cursed_forest.normal.clears, 1);
  for (const bad of ['__proto__', 'EXPERT', 7, null, {}, 'hard;']) assert.equal(recordTierRun(sanitize({ version: 3 }), WON({ tier: bad }), { data, unlockedTiers: OPEN }).tier, 'normal', String(bad));
  assert.equal(recordTierRun(sanitize({ version: 3 }), WON({ chapter: 'nowhere' }), { data, unlockedTiers: OPEN }).glass, 0);
  assert.equal(recordTierRun(sanitize({ version: 3 }), WON({ character: 'ghost' }), { data, unlockedTiers: OPEN }).firstDawn, false);
  assert.equal(recordTierRun(null, WON(), { data }).glass, 0);
  assert.equal(recordTierRun(sanitize({ version: 3 }), null, { data }).glass, 0);
  assert.equal(recordTierRun(sanitize({ version: 3 }), WON(), { data: null }).glass, 0);
  // the purse is bounded
  const full = sanitize({ version: 3, dawnglass: MAX_GLASS });
  assert.equal(recordTierRun(full, WON(), { data, unlockedTiers: OPEN }).glass, 0);
  assert.equal(full.dawnglass, MAX_GLASS);
});

test('DT0 bankRun records the tier (only when the gate is owned), counts the run counters, and shows the result', () => {
  const st = new SaveStore(mem());
  st.load();
  const base = { outcome: 'victory', time: 900, level: 30, kills: 100, gold: 10, shards: 5, chapter: 'cursed_forest', character: 'wren', killsByEnemy: { wolf: 1 }, weapons: [], gems: 400, abilityUses: 7, blessings: 3 };
  const b1 = st.bankRun({ ...base, tier: 'hard' }, { def, data, unlockedTiers: [] });
  assert.equal(b1.tier.tier, 'normal'); assert.equal(st.data.dawnglass, 0);
  const b2 = st.bankRun({ ...base, tier: 'hard' }, { def, data, unlockedTiers: ['cursed_forest:hard'] });
  assert.equal(b2.tier.glass, 8); assert.equal(b2.dawnglass, 8); assert.equal(st.data.stats.tiers.cursed_forest.hard.clears, 1); // dawn 2 + first 6
  assert.deepEqual([st.data.stats.gems, st.data.stats.abilityUses, st.data.stats.blessingsTaken], [800, 14, 6]);
  const b3 = st.bankRun({ ...base, tier: 'hard' }, { def, data, unlockedTiers: ['cursed_forest:hard'] });
  assert.equal(b3.tier.glass, 2); assert.equal(st.data.dawnglass, 10);
  assert.equal(st.data.stats.tiers.cursed_forest.hard.runs, 2);
  // the existing call shape (no tier context) still works
  assert.doesNotThrow(() => st.bankRun(base, { def, data }));
  assert.doesNotThrow(() => st.bankRun(base));
});

// ------------------------------------------------------------------ conditions
test('DT0 new condition leaves: clearTier (with hero), stars, killMarked, openChest, gems, abilityUses, blessings; validated and worded', () => {
  const stats = { tiers: { cursed_forest: { hard: { runs: 3, clears: 2, stars: 3, heroes: { wren: { clears: 2, first: true } } }, expert: { runs: 1, clears: 0, stars: 4, heroes: {} } } }, markedKills: 21, chests: 4, gems: 61000, abilityUses: 90, blessingsTaken: 15 };
  const P = (c) => conditionProgress(c, stats, def, data);
  assert.equal(P({ t: 'clearTier', chapter: 'cursed_forest', tier: 'hard' }).done, true);
  assert.equal(P({ t: 'clearTier', chapter: 'cursed_forest', tier: 'hard', hero: 'wren' }).done, true);
  assert.equal(P({ t: 'clearTier', chapter: 'cursed_forest', tier: 'hard', hero: 'elias' }).done, false);
  assert.equal(P({ t: 'clearTier', chapter: 'cursed_forest', tier: 'expert' }).done, false);
  assert.equal(P({ t: 'clearTier', chapter: 'cursed_forest', tier: 'hard', hero: 'wren' }).lines[0].text, 'Clear Cursed Forest on Deep Dusk as Wren');
  assert.equal(P({ t: 'stars', chapter: 'cursed_forest', n: 9 }).lines[0].cur, 3, 'stars are bits summed over the tiers of the chapter: Deep Dusk 0b011 + Long Night 0b100');
  assert.equal(P({ t: 'stars', chapter: 'cursed_forest', n: 9 }).lines[0].text, 'Earn 9 stars in Cursed Forest');
  assert.equal(P({ t: 'killMarked', n: 20 }).done, true); assert.equal(P({ t: 'openChest', n: 5 }).done, false);
  assert.equal(P({ t: 'gems', n: 60000 }).done, true); assert.equal(P({ t: 'abilityUses', n: 100 }).done, false); assert.equal(P({ t: 'blessings', n: 15 }).done, true);
  for (const junk of [null, undefined, 5, 'x', [], { tiers: 'x' }, { tiers: { cursed_forest: 7 } }, { tiers: { cursed_forest: { hard: 'x' } } }]) assert.doesNotThrow(() => conditionProgress({ t: 'clearTier', chapter: 'cursed_forest', tier: 'hard' }, junk, def, data));
  const raw = (unlock) => ({ version: 1, branches: { spirit: { name: 'S', angle: 0 } }, nodes: [{ id: 'a', name: 'a', desc: 'a', branch: 'spirit', ring: 1, ang: 0, cost: { gold: 1 }, effects: [{ mod: 'xp', pct: 1 }], unlock }] });
  assert.throws(() => compileTree(raw({ t: 'clearTier', chapter: 'cursed_forest', tier: 'nope' }), data), /unknown tier/);
  assert.throws(() => compileTree(raw({ t: 'clearTier', chapter: 'cursed_forest', tier: 'hard', hero: 'ghost' }), data), /bad hero/);
  assert.throws(() => compileTree(raw({ t: 'clearTier', chapter: 'nowhere', tier: 'hard' }), data), /unknown chapters/);
  assert.throws(() => compileTree(raw({ t: 'gems', n: -5 }), data), /positive/);
  assert.throws(() => compileTree(raw({ t: 'killEnemy', id: 'wolf', n: 5, hero: 'wren' }), data), /bad hero/);
});

// ------------------------------------------------------------------ tool clusters: data
const TOOL = { satchel: ['li_reach', 'co_pull', 'li_scav', 'co_call', 'li_hearts', 'li_heal', 'li_magnet', 'co_glean'], cardfan: ['sp_reroll2', 'sp_reroll3', 'sp_ban2', 'sp_ban3', 'cd_stir', 'cd_peek', 'cd_bars', 'cd_radar', 'cd_favour', 'cd_fourth'], hearthkey: ['sp_auto', 'rs_autoset', 'rs_start', 'rs_bless', 'li_last', 'rs_slot5'], nightgate: ['gt_cursed_forest_hard', 'gt_cursed_forest_expert', 'df_ward', 'df_vigil', 'df_star'] };
// T6: still inert = needs a feature that is not built (Hollow marks, chests / minibosses, a codex, an enemy tell for crows / crawlers, the tier select + Dawnglass)
const INERT = ['cd_bars', 'cd_radar', 'bs_crow3', 'bs_crawl3', 'bs_page', 'df_ward', 'df_vigil', 'df_star'];

test('DT4 the tool clusters exist as data: eleven moved ids keep their ids and idx, every new node has a permanent (fragment, idx), layout and budget pass', () => {
  assert.deepEqual(Object.keys(composed.info.tools).sort(), ['almanac', 'cardfan', 'hearthkey', 'nightgate', 'satchel']);
  assert.deepEqual(Object.values(composed.info.tools).map((t) => t.slot).sort(), ['far10', 'far2', 'far4', 'far6', 'far8'], 'the five far slots of layout L-A');
  for (const [t, ids] of Object.entries(TOOL)) for (const id of ids) assert.ok(v2.nodes[id], `${t}/${id}`);
  const moved = ['li_reach', 'li_scav', 'li_hearts', 'li_heal', 'li_magnet', 'sp_reroll2', 'sp_reroll3', 'sp_ban2', 'sp_ban3', 'sp_auto', 'li_last'];
  const besideParent = ['li_hearts', 'li_heal', 'li_magnet', 'sp_reroll2', 'sp_reroll3', 'sp_ban2', 'sp_ban3', 'sp_auto', 'li_last']; // T3c: next ranks moved back beside their parent
  for (const id of moved) { const n = composed.info.nodes.find((x) => x.id === id); assert.equal(n.frag, 'core', `${id} keeps its core idx slot`); assert.equal(!!n.tool, !besideParent.includes(id), `${id} placement`); }
  assert.deepEqual(layoutIssues(composed.info, v2), []);
  const b = budgetOf(v2, composed.info.core.budget, 5);
  assert.deepEqual(b.violations, []);
  assert.ok(Math.abs(b.combatAtCap - 30.99) < 1e-9 && Math.abs(b.sustainPE - 5) < 1e-9, `${b.combatAtCap} / ${b.sustainPE}`); // T6: lore 1.6 + choice 0.8 reclaimed, cast 7.2 -> 5.6, magic tag 12.8 -> 11.4
  assert.deepEqual(b.tiers, { 1: { combat: 5, allowance: 5 }, 2: { combat: 1.2, allowance: 1.2 } }, 'Deep Dusk +5.0 (Fourth Card 2.0 + Fifth Hook 3.0), Long Night +1.2 (the larger keystone side); the x2 ceiling rule scales tier allowances');
});

test('DT4 inert (pending) nodes are exactly the ones whose sim / UI hook is not built yet; they cannot be bought, aggregated or forged into a save', () => {
  assert.deepEqual(def.pendingList.slice().sort(), INERT.slice().sort(), 'tool pending set (T6: the bridges and the built Card Fan / Almanac / Hearth-key lanterns are live)');
  assert.equal(def.pendingList.filter((i) => i.startsWith('bs_')).length, 3, 'the Almanac lanterns that wait: crow / crawler Tells (no attack tell exists) and Full Almanac (codex + chests)');
  for (const id of def.pendingList) { assert.equal(def.nodes[id], undefined, id); assert.ok(!def.list.includes(id)); }
  const forged = { ...own(def.pendingList), ...own(['li_reach']) };
  assert.deepEqual(sanitizeTree(forged, { killsByEnemy: { wolf: 1e9 } }, def, data), { li_reach: 1 });
  assert.deepEqual(aggregateMods(own(def.pendingList), def, data), aggregateMods({}, def, data));
  const s = { ...defaultSave(), gold: 1e7, shards: 99, dawnglass: 99 };
  assert.equal(buy(s, 'cd_fourth', def, data).ok, false);
  // live tool lanterns: the Satchel hooks that are built now
  for (const id of ['li_reach', 'co_pull', 'li_scav', 'co_call', 'li_hearts', 'li_heal', 'li_magnet', 'co_glean', 'sp_reroll2', 'sp_ban3', 'sp_auto', 'li_last']) assert.ok(def.nodes[id], `${id} is live`);
});

test('DT4 the moved ids keep their ids and the Satchel numbers match the sheet (range 4 x +4%, +4%; pull 3 x +15%; hearts +3% and 5 s sooner; magnet 2 x +12.5% and 3 s sooner)', () => {
  const a = aggregateMods({ li_reach: 4, li_scav: 1, co_pull: 3, li_hearts: 1, li_magnet: 2 }, def, data);
  assert.ok(Math.abs(a.mods.pickup - 1.2) < 1e-9, `pickup ${a.mods.pickup}`);
  assert.equal(a.perks.gemPull, 45);
  assert.ok(Math.abs(a.drops.heart - 1.03) < 1e-9);
  assert.equal(a.drops.heartPity, -5);
  assert.ok(Math.abs(a.drops.magnet - 1.25) < 1e-9); assert.equal(a.drops.magnetPity, -6);
  assert.equal(def.nodes.li_reach.maxRank, 4); assert.equal(def.nodes.li_magnet.maxRank, 2); assert.equal(def.nodes.co_pull.maxRank, 3);
  // ranks cost what the sheet says (4 ranks 1,630 gold; 3 ranks 1,350; 2 ranks 1,800)
  const total = (id) => { let g = 0; for (let k = 1; k <= def.nodes[id].maxRank; k++) { const n = def.nodes[id]; g += Math.max(10, Math.round((n.cost.gold * Math.pow(n.rankCost, k - 1)) / 10) * 10); } return g; };
  assert.deepEqual([total('li_reach'), total('co_pull'), total('li_magnet')], [1630, 1350, 1800]);
});

// ------------------------------------------------------------------ sim hooks (Satchel)
test('DT5a gem pull: Eager Gems makes gems fly faster; Lantern Call pulls gems within twice the pickup range on level-up; both absent = old numbers', () => {
  const fly = (tree) => {
    const s = new Sim({ data, seed: 2, tree: tree ? aggregateMods(tree, def, data) : null });
    s.addGem(s.player.x + 150, s.player.y, 1); s.gems[0].mag = true;
    s.updateGems(0.1);
    return s.gems[0].x - s.player.x;
  };
  const base = fly(null), fast = fly(own(['co_pull']));
  assert.ok(Math.abs(base - (150 - 26)) < 1e-9, `base pull ${base}`);
  assert.ok(Math.abs(fast - (150 - 26 * 1.15)) < 1e-9, `fast pull ${fast}`);
  const call = (tree) => {
    const s = new Sim({ data, seed: 2, tree: tree ? aggregateMods(tree, def, data) : null });
    const reach = 38 * 2;
    s.addGem(s.player.x + reach - 5, s.player.y, 1); s.addGem(s.player.x + reach + 30, s.player.y, 1);
    s.xp = s.xpNeeded + 1; s.checkLevelUp();
    return s.gems.map((g) => g.mag);
  };
  assert.deepEqual(call(null), [false, false]);
  assert.deepEqual(call(own(['co_pull', 'co_call'])), [true, false]);
  const wide = new Sim({ data, seed: 2, tree: aggregateMods({ li_reach: 4 }, def, data) });
  wide.addGem(wide.player.x + 38 * 1.16 * 2 - 3, wide.player.y, 1); wide.xp = wide.xpNeeded + 1; wide.tfx.gemCall = true; wide.checkLevelUp();
  assert.equal(wide.gems[0].mag, true, 'the call follows the widened pickup range');
});

test('DT5a counters: the run result carries gems, ability uses and Blessings taken (counter only)', () => {
  const s = new Sim({ data, seed: 4, godMode: true });
  s.addGem(s.player.x + 2, s.player.y, 1); s.updateGems(0.016);
  assert.equal(s.result().gems, 1);
  s.ability.cdLeft = 0; s.useAbility();
  assert.equal(s.result().abilityUses, 1);
  assert.equal(s.result().blessings, 0);
});

// ------------------------------------------------------------------ tier-bought power works only where it is earned
test('DT0 tier-scoped power: Fourth Card / Fifth Hook only on Deep Dusk and harder, the Long Night keystone only on Long Night, tier gates open the tiers', () => {
  const owned = own(['cd_fourth', 'rs_slot5', 'df_ward', 'gt_cursed_forest_hard', 'gt_cursed_forest_expert', 'cd_peek', 'cd_favour', 'li_reach']);
  const at = (tier) => aggregateMods(owned, v2, data, { tier });
  const t0 = at(0), t1 = at(1), t2 = at(2);
  assert.deepEqual([t0.perks.offerSize, t0.perks.weaponSlot], [0, 0], 'Twilight: nothing');
  assert.deepEqual([t1.perks.offerSize, t1.perks.weaponSlot], [1, 1]);
  assert.deepEqual([t2.perks.offerSize, t2.perks.weaponSlot], [1, 1]);
  assert.equal(t0.drops.heartHeal, 1); assert.equal(t1.drops.heartHeal, 1, 'the Long Night keystone does nothing on Deep Dusk');
  assert.ok(Math.abs(t2.drops.heartHeal - 1.1) < 1e-9); assert.ok(Math.abs(t2.mods.damage - 0.99) < 1e-9, 'its cost is unscaled');
  assert.equal(t0.perks.favour, true, 'QoL / choice perks work everywhere'); assert.ok(t0.info.includes('peek'));
  assert.ok(Math.abs(t0.mods.pickup - 1.04) < 1e-9);
  assert.deepEqual(t0.unlocks.tiers.sort(), ['cursed_forest:expert', 'cursed_forest:hard'].sort(), 'owning the gates opens the tiers');
  // a hostile tier value cannot raise the scope: clamped to 0..9
  assert.deepEqual([aggregateMods(owned, v2, data, { tier: -5 }).perks.offerSize, aggregateMods(owned, v2, data, { tier: NaN }).perks.offerSize, aggregateMods(owned, v2, data, { tier: 'x' }).perks.offerSize], [0, 0, 0]);
  assert.equal(aggregateMods(owned, v2, data, { tier: 99 }).perks.offerSize, 1);
  // tier power sits ON TOP of the Twilight caps (it is not squeezed into a saturated category)
  assert.deepEqual(Object.keys(at(2).softcap).filter((k) => k === 'tierpe'), []);
});

test('DT0 the tier budget: each tier has its own allowance, an over-allowance or an un-estimated tier effect fails', () => {
  const mk = (mut) => { const fs = clone(readTreeFiles()); mut(fs); const c = composeTree(fs, data); return budgetOf(compileTree(c.v2, data), c.info.core.budget, 5); };
  const get = (fs, p) => fs.find((f) => f.path === p).json;
  assert.deepEqual(mk(() => {}).violations, []);
  assert.match(mk((fs) => { get(fs, 'tools/cardfan.json').nodes.find((n) => n.id === 'cd_fourth').effects[0].pe = 4; }).violations.join('|'), /tier 1 combat 7\.00 is above the per-tier allowance 5/);
  assert.match(mk((fs) => { delete get(fs, 'tools/cardfan.json').nodes.find((n) => n.id === 'cd_fourth').effects[0].pe; get(fs, 'tools/cardfan.json').nodes.find((n) => n.id === 'cd_fourth').effects.push({ mod: 'damage', pct: 2 }); }).violations.join('|'), /cd_fourth: a tier-scoped effect needs a pe estimate/);
  assert.match(mk((fs) => { delete get(fs, 'core.json').budget.perTier; }).violations.join('|'), /tier 1 combat .* allowance 0/);
  assert.match(mk((fs) => { get(fs, 'tools/nightgate.json').nodes.find((n) => n.id === 'df_vigil').effects[0].pe = 2.5; }).violations.join('|'), /tier 2 combat 2\.50 is above/);
  // a Twilight-scoped choice perk that is too big pushes the choice category past its saturation / the ceiling
  assert.match(mk((fs) => { get(fs, 'core.json').budget.categories.choice.cap = 20; }).violations.join('|'), /combat PE-at-cap 4\d\.\d+ is above the ceiling 31/);
});

// ------------------------------------------------------------------ Dawnglass in the tree
test('DT0 costs can include Dawnglass: buy() checks and spends it, respec refunds it for ordinary nodes and keeps the permanent tier gates', () => {
  const s = { ...defaultSave(), gold: 1e6, shards: 50, dawnglass: 0, stats: { ...defaultSave().stats } };
  const node = v2.nodes.cd_fourth;
  assert.equal(node.cost.glass, 8);
  // on the all-live view: owned prerequisites, enough gold, no glass -> refused with the right reason
  const own2 = { cd_peek: 1, sp_reroll2: 1, sp_reroll1: 1 };
  const save = { ...s, tree: { ...own2 }, stats: { ...s.stats, tiers: { cursed_forest: { hard: { runs: 1, clears: 1, best: { t: 1, kills: 1, level: 1 }, stars: 1, heroes: {} } } } } };
  const c = canBuy(save, 'cd_fourth', v2, data);
  assert.equal(c.ok, false); assert.match(c.reason, /Dawnglass/);
  save.dawnglass = 20;
  const r = buy(save, 'cd_fourth', v2, data);
  assert.ok(r.ok, r.reason); assert.equal(save.dawnglass, 12); assert.equal(r.cost.glass, 8);
  const gate = { ...save, gold: 1e6, shards: 20, dawnglass: 20, tree: {}, stats: { ...save.stats, chapters: { cursed_forest: { runs: 1, clears: 1, bestTime: 900 } } } };
  assert.ok(buy(gate, 'gt_cursed_forest_hard', v2, data).ok);
  assert.ok(buy(gate, 'gt_cursed_forest_expert', v2, data).ok, 'the Long Night gate costs 10 glass');
  assert.equal(gate.dawnglass, 10);
  const out = respec(save, v2);
  assert.equal(out.glass, 8); assert.equal(save.dawnglass, 20);
  const g2 = respec(gate, v2);
  assert.equal(g2.glass, 0, 'the permanent tier gates are never refunded');
  assert.deepEqual(Object.keys(gate.tree).sort(), ['gt_cursed_forest_expert', 'gt_cursed_forest_hard']);
  assert.equal(nodeStatus(v2, { ...gate, tree: { gt_cursed_forest_hard: 1 } }, 'df_ward', data).state, 'locked');
  assert.equal(gate.dawnglass, 10);
});

test('DT0 tier gates are permanent, chained (Long Night needs Deep Dusk), name no recipe, and survive an import without their prerequisite gate being forged', () => {
  const hard = v2.nodes.gt_cursed_forest_hard, exp = v2.nodes.gt_cursed_forest_expert;
  assert.ok(hard.permanent && exp.permanent);
  assert.deepEqual(exp.requires, ['gt_cursed_forest_hard']);
  assert.deepEqual(hard.requires, []);
  assert.equal(v2.nodes.df_ward.excludes[0], 'df_vigil');
  const forged = sanitizeTree({ gt_cursed_forest_expert: 1, df_ward: 1, df_vigil: 1 }, defaultSave().stats, v2, data);
  assert.deepEqual(forged, {}, 'a forged Long Night gate without Deep Dusk is dropped');
  const ok = sanitizeTree({ gt_cursed_forest_hard: 1, gt_cursed_forest_expert: 1, df_ward: 1, df_vigil: 1 }, defaultSave().stats, v2, data);
  assert.equal(ok.df_ward, 1); assert.equal(ok.df_vigil, undefined, 'rival keystones cannot both be held');
});

test('DT4 Dawnglass costs are bounded in the tree data: a node cannot cost more than 1e5 glass or a fractional / negative amount', () => {
  for (const bad of [-1, 1.5, 1e6, 'x']) {
    const fs = clone(readTreeFiles());
    fs.find((f) => f.path === 'tools/cardfan.json').json.nodes[5].cost.glass = bad;
    const c = composeTree(fs, data);
    assert.throws(() => compileTree(c.v2, data), /bad cost/, String(bad));
  }
});

test('DT4 the Almanac data only names enemies that exist (lore / tells), and every Habits / Weakness / Tells lantern keeps its slay count order', () => {
  for (const id of v2.list.filter((i) => i.startsWith('bs_') && i !== 'bs_page')) {
    const e = v2.nodes[id].effects[0];
    const enemy = e.lore || e.enemy;
    assert.ok(Object.hasOwn(data.enemies, enemy), `${id} -> ${enemy}`);
  }
  for (const pre of ['wolf', 'crow', 'crawl', 'treant']) {
    const n = (k) => { const u = v2.nodes[`bs_${pre}${k}`].unlock; return u ? u.n : 0; }; // T6: bs_wolf1 is the Almanac's gold-only way in (no slay count)
    assert.ok(n(1) < n(2) && n(2) < n(3), pre);
  }
  assert.equal(v2.nodes.bs_page.effects.find((e) => e.info === 'codex').pe, 0.05);
});
