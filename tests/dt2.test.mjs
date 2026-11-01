// DT2 Hollow marks: which foes, which nights, what each mark does, the Emberwake ring, the Hollowheart aura, counters for Dawnglass and
// Hunter's Eye, Twilight untouched (separate stream), forged values clamped, and Hunter's Eye live with its locked condition.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { MARKS, EMBER, HEART, rollMark, applyMark, heartAura, markSeed, updateEmbers } from '../src/sim/marks.js';
import { resolveTier, validateTiers } from '../src/sim/tiers.js';
import { createRng } from '../src/sim/rng.js';
import { nodeStatus, aggregateMods } from '../src/meta/tree.js';
import { defaultSave } from '../src/save/schema.js';
import { recordTierRun } from '../src/save/tiers.js';
import { hurtRecap } from '../src/ui/resultscopy.js';
import { markLook, threadPairs, emberDraw, barOf } from '../src/gfx/hollowmarks.js';

const CID = 'cursed_forest';
const T = (id) => resolveTier(data.tiers, CID, id);
const wolf = data.enemies.wolf;

test('DT2 locked mark numbers + the tier table (none on Twilight, 5% from 4:00 on Deep Dusk, 10% from 2:30 + Hollowheart on Long Night)', () => {
  assert.deepEqual([MARKS.ironbark.hp, MARKS.ironbark.speed, MARKS.swiftshade.hp, MARKS.swiftshade.speed], [1.8, 0.85, 0.8, 1.3]);
  assert.deepEqual([EMBER.r, EMBER.tell, EMBER.live, HEART.r, HEART.speed], [28, 0.6, 1.2, 60, 1.15]);
  assert.equal(T('normal').marks.share, 0);
  assert.deepEqual([T('hard').marks.share, T('hard').marks.from, T('hard').marks.kinds.slice().sort()], [0.05, 240, ['emberwake', 'ironbark', 'swiftshade']]);
  assert.deepEqual([T('expert').marks.share, T('expert').marks.from, T('expert').marks.kinds.includes('hollowheart'), T('expert').marks.mini], [0.1, 150, true, ['ironbark']]);
  assert.deepEqual(T('hard').marks.mini, [], 'the miniboss is marked only on Long Night');
  assert.throws(() => validateTiers({ ...data.tiers, template: { ...data.tiers.template, normal: { ...data.tiers.template.normal, marks: { kinds: ['ironbark'] } } } }), /Twilight has no marks/);
  assert.throws(() => validateTiers({ ...data.tiers, template: { ...data.tiers.template, expert: { ...data.tiers.template.expert, marks: { mini: ['bogus'] } } } }), /registered mark ids/);
});

test('DT2 roll rules: never before the start time, never on the boss or its fixed adds, no Emberwake on a no-damage foe, miniboss only its kinds', () => {
  const rng = { next: () => 0 }; // always passes the share roll, picks kinds[0]
  assert.equal(rollMark(T('normal'), rng, wolf, 900, false), null);
  assert.equal(rollMark(T('hard'), rng, wolf, 239, false), null);
  assert.equal(rollMark(T('hard'), rng, wolf, 240, false), 'ironbark');
  assert.equal(rollMark(T('hard'), rng, data.enemies.elder_treant, 600, false), null);
  assert.equal(rollMark(T('hard'), rng, data.enemies.treant_sapling, 600, false), null);
  assert.equal(rollMark(T('hard'), rng, data.enemies.branch_mane, 600, true), null);
  assert.equal(rollMark(T('expert'), rng, data.enemies.branch_mane, 600, true), 'ironbark');
  const toad = data.enemies.puffback_toad, seen = new Set(), r = createRng(5);
  for (let i = 0; i < 4000; i++) { const k = rollMark(T('expert'), r, toad, 600, false); if (k) seen.add(k); }
  assert.ok(!seen.has('emberwake') && seen.size === 3, [...seen].join());
  // share: ~10% on Long Night
  const r2 = createRng(9); let n = 0; for (let i = 0; i < 20000; i++) if (rollMark(T('expert'), r2, wolf, 600, false)) n++;
  assert.ok(n > 1800 && n < 2200, String(n));
});

test('DT2 apply: one mark per foe, hp fraction kept, speed and x5 gold', () => {
  const e = { hp: 10, maxHp: 20, speed: 40, gold: 1 };
  assert.ok(applyMark(e, 'ironbark'));
  assert.deepEqual([e.hp, e.maxHp, e.speed, e.gold, e.hmark], [18, 36, 34, 5, 'ironbark']);
  assert.equal(applyMark(e, 'swiftshade'), false, 'max one mark');
  assert.equal(applyMark({ hp: 1, maxHp: 1, speed: 1, gold: 1 }, '__proto__'), false);
});

test('DT2 Twilight never draws the mark stream and marks nothing; Deep Dusk marks only from 4:00 and never the boss', () => {
  const s = new Sim({ data, seed: 3, tier: 'normal', startTime: 400 });
  const before = s.markRng.next; let used = 0; s.markRng.next = () => { used++; return before(); };
  for (let i = 0; i < 300; i++) s.spawnEnemy('wolf', 2000, 2100);
  assert.equal(used, 0); assert.equal(s.enemies.filter((e) => e.hmark).length, 0);
  const h = new Sim({ data, seed: 3, tier: 'hard' });
  h.time = 100; for (let i = 0; i < 400; i++) h.spawnEnemy('wolf', 2000, 2100);
  assert.equal(h.enemies.filter((e) => e.hmark).length, 0, 'not before 4:00');
  h.time = 300; for (let i = 0; i < 2000; i++) h.spawnEnemy('crow', 2000, 2100);
  const m = h.enemies.filter((e) => e.hmark).length;
  assert.ok(m > 60 && m < 140, String(m));
  assert.equal(markSeed(1) === 1, false);
});

test('DT2 Emberwake ring: 0.6 s tell does nothing, then hits for contact damage at most once a second; burst / vanish leave no ring', () => {
  const s = new Sim({ data, seed: 2, tier: 'hard', godMode: false });
  s.time = 300; s.enemies.length = 0;
  const p = s.player; p.iframes = 0;
  const e = s.spawnEnemy('wolf', p.x + 200, p.y); e.hmark = null; applyMark(e, 'emberwake');
  e.x = p.x; e.y = p.y; e.dead = true; e.killer = 'ghost_wolves';
  s.cleanupDead();
  assert.equal(s.embers.length, 1); assert.equal(s.markedKills, 1);
  const hp0 = p.hp;
  const step = (dt) => { p.iframes = 0; s.time += dt; updateEmbers(s, dt); };
  for (let i = 0; i < 11; i++) step(0.05);
  assert.equal(p.hp, hp0, 'no damage during the tell');
  step(0.06);
  assert.ok(p.hp < hp0, 'live ring hurts');
  const hp1 = p.hp;
  for (let i = 0; i < 8; i++) step(0.05); // 0.4 s later: still inside the 1 s gap
  assert.equal(p.hp, hp1);
  for (let i = 0; i < 30; i++) step(0.05);
  assert.equal(s.embers.length, 0, 'gone after 1.8 s');
  assert.equal(s.lastHit.kind, 'ember');
  const t2 = new Sim({ data, seed: 2, tier: 'hard' }); t2.time = 300;
  const b = t2.spawnEnemy('wolf', 0, 0); b.hmark = null; applyMark(b, 'emberwake'); b.dead = true; b.burst = true; t2.cleanupDead();
  const v = t2.spawnEnemy('wolf', 0, 0); v.hmark = null; applyMark(v, 'emberwake'); v.dead = true; v.vanish = true; t2.cleanupDead();
  assert.equal(t2.embers.length, 0);
});

test('DT2 Hollowheart: neighbours within 60 run +15% once (two hearts do not stack), back to normal when it dies', () => {
  const h = { x: 0, y: 0, speed: 30, hmark: 'hollowheart' }, h2 = { x: 10, y: 0, speed: 30, hmark: 'hollowheart' };
  const a = { x: 30, y: 0, speed: 40 }, far = { x: 200, y: 0, speed: 40 };
  const list = [h, h2, a, far];
  heartAura(list, [h, h2]);
  assert.equal(a.speed, 46); assert.equal(far.speed, 40);
  heartAura(list, [h, h2]); assert.equal(a.speed, 46, 'no compounding per frame');
  h.dead = true; h2.dead = true; heartAura(list, []);
  assert.equal(a.speed, 40);
});

test('DT2 result + bank: marked count feeds Dawnglass capped 2 / 3, Hunter Eye counter clamped; recap names the ring', () => {
  const s = new Sim({ data, seed: 1, tier: 'hard' }); s.markedKills = 7;
  const r = s.result(); assert.equal(r.marked, 7);
  const sv = defaultSave();
  const out = recordTierRun(sv, { ...r, chapter: CID, character: 'wren', outcome: 'defeat', bossKilled: false, tier: 'hard', marked: 1e12 }, { data, unlockedTiers: [CID + ':hard'] });
  assert.equal(out.glassRun, 2, 'forged marked count capped at markedCap');
  const rc = hurtRecap({ chapter: CID, hurt: { by: { wolf: 5 }, hits: { wolf: 1 }, last: { src: 'wolf', kind: 'ember', t: 300 } } }, data, false);
  assert.match(rc.struck.tail, /Emberwake ring/);
});

test('DT2 Hunter\'s Eye is live: 20 marked foes OR 3 Branch-Manes (the Grey Alpha), 500 gold, info bars aggregate', () => {
  const n = def.nodes.cd_bars;
  assert.ok(n && !n.inert);
  assert.deepEqual(n.unlock, { t: 'any', of: [{ t: 'killMarked', n: 20 }, { t: 'killEnemy', id: 'branch_mane', n: 3 }] });
  assert.equal(n.cost.gold, 500);
  const st = (stats) => { const sv = defaultSave(); Object.assign(sv.stats, stats); return nodeStatus(def, sv, 'cd_bars', data).cond.done; };
  assert.equal(st({ markedKills: 19 }), false);
  assert.equal(st({ markedKills: 20 }), true);
  assert.equal(st({ killsByEnemy: { branch_mane: 3 } }), true);
  const mods = aggregateMods({ cd_bars: 1 }, def, data);
  assert.ok(mods.info.includes('bars'));
  assert.equal(new Sim({ data, seed: 1, tree: mods }).tfx.bars, true);
});

test('DT2 look rules (render, pure): shape per mark, threads capped at 6, ring phases, bars only with Hunter\'s Eye', () => {
  for (const k of Object.keys(MARKS)) assert.ok(markLook(k).frame, k);
  assert.equal(markLook('bogus'), null);
  const hs = [{ x: 0, y: 0 }], es = Array.from({ length: 20 }, (_, i) => ({ x: 5 + i, y: 0 }));
  assert.ok(threadPairs(hs, es, 6).length <= 6);
  assert.equal(threadPairs(hs, [{ x: 500, y: 0 }], 6).length, 0);
  assert.equal(emberDraw({ t: 0.3 }).phase, 'tell'); assert.equal(emberDraw({ t: 1 }).phase, 'live'); assert.equal(emberDraw({ t: 2 }), null);
  assert.equal(barOf({ hmark: 'ironbark', hp: 5, maxHp: 10 }, false), null);
  assert.deepEqual(barOf({ hmark: 'ironbark', hp: 5, maxHp: 10 }, true), { frac: 0.5, name: 'Ironbark' });
  assert.equal(barOf({ hp: 5, maxHp: 10 }, true), null);
  assert.equal(barOf({ hmark: 'ironbark', hp: 5, maxHp: 10, boss: true }, true), null);
});

test('DT2 bank: a forged per-run marked count is clamped (5000 per run, 1e9 lifetime)', async () => {
  const { SaveStore } = await import('../src/save/store.js');
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const st = new SaveStore(mem());
  st.bankRun({ outcome: 'defeat', time: 60, kills: 1, gold: 0, shards: 0, chapter: CID, character: 'wren', marked: 1e15 });
  assert.equal(st.data.stats.markedKills, 5000);
  st.bankRun({ outcome: 'defeat', time: 60, kills: 1, gold: 0, shards: 0, chapter: CID, character: 'wren', marked: -4 });
  assert.equal(st.data.stats.markedKills, 5000);
});
