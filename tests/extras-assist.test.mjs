// EXTRAS v1 (1) Gentle Light: Twilight-only assist bundle (foe damage x0.70, foe speed x0.90, hearts 1.5x sooner); stars and best times rest,
// gold / shards / Bond / clears count; assist off (and on any harder night) is byte-identical; hostile saves, params and data are refused.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { resolveAssist, validateTiers } from '../src/sim/tiers.js';
import { defaultSave, sanitize } from '../src/save/schema.js';
import { SaveStore } from '../src/save/store.js';
import { parseParams } from '../src/params.js';
import { nightBlock } from '../src/ui/resultscopy.js';

const CID = 'cursed_forest';
const run = (o = {}, secs = 240) => { const s = new Sim({ data, seed: 7, ...o }); for (let i = 0; i < secs * 30 && s.state !== 'defeat'; i++) { if (s.state === 'levelup') s.pickCard(s.offer.cards[0].key); else s.step(1 / 30, { x: Math.sin(i / 50), y: Math.cos(i / 70) }); } return s; };
const fp = (s) => JSON.stringify([s.time, s.player, s.kills, s.gold, s.level, s.enemies.length, s.enemies.slice(0, 20).map((e) => [e.x, e.y, e.hp])]);
const memStore = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

test('Gentle Light data: Twilight bundle is the locked one; only Twilight may carry an assist; bad knobs are refused', () => {
  assert.deepEqual(resolveAssist(data.tiers, 'normal', true), { enemyDmg: 0.7, enemySpeed: 0.9, heartSooner: 1.5 });
  for (const bad of [false, 1, 'true', null, undefined, {}]) assert.equal(resolveAssist(data.tiers, 'normal', bad), null, String(bad));
  for (const t of ['hard', 'expert', '__proto__', 'x']) assert.equal(resolveAssist(data.tiers, t, true), null, t);
  const clone = () => JSON.parse(JSON.stringify(data.tiers));
  let t = clone(); t.template.normal.assist.enemyDmg = 1.5; assert.throws(() => validateTiers(t), /assist/); // an 'assist' that makes it harder
  t = clone(); t.template.normal.assist.enemySpeed = 0.1; assert.throws(() => validateTiers(t), /assist/);
  t = clone(); t.template.normal.assist.evil = 1; assert.throws(() => validateTiers(t), /assist/);
  t = clone(); t.template.hard.assist = { enemyDmg: 0.7, enemySpeed: 0.9, heartSooner: 1.5 }; assert.throws(() => validateTiers(t), /Twilight only/);
  t = clone(); t.chapters[CID] = { normal: { assist: { enemyDmg: 0.5, enemySpeed: 0.5, heartSooner: 3 } } }; assert.throws(() => validateTiers(t), /assist/);
  assert.doesNotThrow(() => validateTiers(clone()));
});

test('Gentle Light off is byte-identical; on a harder night the flag does nothing', () => {
  assert.equal(fp(run({})), fp(run({ assist: false })));
  assert.equal(fp(run({ assist: 'yes' })), fp(run({})), 'only a strict true turns it on');
  assert.equal(fp(run({ tier: 'hard', assist: true })), fp(run({ tier: 'hard' })), 'Deep Dusk has no assist');
  assert.equal(new Sim({ data, seed: 1, tier: 'expert', assist: true }).assist, null);
});

test('Gentle Light: foes hit 30% softer, move 10% slower, hearts come sooner', () => {
  const a = new Sim({ data, seed: 3, assist: true }), b = new Sim({ data, seed: 3 });
  for (const s of [a, b]) { s.player.iframes = 0; s.damagePlayer(10, 'wolf'); }
  assert.equal(b.player.maxHp - b.player.hp, 10);
  assert.ok(Math.abs((a.player.maxHp - a.player.hp) - 7) < 1e-9);
  for (const s of [a, b]) { const e = s.spawnEnemy('wolf', s.player.x + 300, s.player.y); s.player.iframes = 99; s.updateEnemies(0.05); s.e0 = e; }
  const da = 300 - (a.e0.x - a.player.x), db = 300 - (b.e0.x - b.player.x);
  assert.ok(db > 0 && Math.abs(da / db - 0.9) < 0.02, `speed ratio ${da / db}`);
  // hearts: same pity state, the assisted run's chance is higher
  const heartP = (s) => { s.player.hp = s.player.maxHp * 0.6; s.sinceHeart = 20; let n = 0; s.rng = { chance: (p) => { n = p; return false; }, next: () => 0.5, range: (lo) => lo }; s.rollDrops({ x: 0, y: 0 }); return n; };
  assert.ok(heartP(new Sim({ data, seed: 3, assist: true })) > heartP(new Sim({ data, seed: 3 })));
  assert.equal(run({ assist: true }).result().assist, true);
  assert.equal(run({}).result().assist, false);
});

test('Gentle Light banking: gold, shards and the clear count; stars, best times and records rest; the run record is marked', () => {
  const st = new SaveStore(memStore());
  st.load();
  const r = { outcome: 'victory', time: 900, level: 30, kills: 1500, gold: 400, shards: 5, bossKilled: true, bossId: 'elder_treant', chapter: CID, character: 'wren', tier: 'normal', assist: true, killsByEnemy: { wolf: 10 }, weapons: [] };
  const b = st.bankRun(r, { def, data, unlockedTiers: [] });
  const s = st.data;
  assert.equal(s.gold, 400); assert.equal(s.shards, 5); assert.equal(s.stats.wins, 1);
  assert.equal(s.stats.chapters[CID].clears, 1, 'the clear opens the Night Gate condition');
  assert.equal(s.stats.bestTime, 0); assert.equal(s.stats.chapters[CID].bestTime, 0); assert.equal(b.newBest, false);
  assert.equal(s.stats.tiers[CID].normal.stars, 0); assert.equal(s.stats.tiers[CID].normal.best.t, 0); assert.equal(s.stats.tiers[CID].normal.clears, 1);
  assert.equal(s.stats.recentRuns.at(-1).a, true);
  assert.equal(b.tier.assist, true);
  assert.equal(nightBlock(r, { ...b, night: { id: 'normal', name: 'Twilight' } }, 'Wren', true).gentle, 'Gentle Light: stars rest tonight.');
  // the same run without assist sets the records
  st.bankRun({ ...r, assist: false }, { def, data, unlockedTiers: [] });
  assert.equal(st.data.stats.tiers[CID].normal.stars & 1, 1); assert.equal(st.data.stats.bestTime, 900);
  assert.equal(st.data.stats.recentRuns.at(-1).a, undefined);
  // a forged assist on a harder tier changes nothing about that tier's stars rule
  const st2 = new SaveStore(memStore()); st2.load();
  const b2 = st2.bankRun({ ...r, tier: 'hard', assist: true }, { def, data, unlockedTiers: [`${CID}:hard`] });
  assert.equal(b2.tier.assist, false); assert.equal(st2.data.stats.tiers[CID].hard.stars & 1, 1);
});

test('Gentle Light hostile saves and params: the setting is a strict boolean; the param is debug-only', () => {
  for (const v of ['yes', 1, null, {}, [true]]) assert.equal(sanitize({ ...defaultSave(), settings: { gentleLight: v } }).settings.gentleLight, false, JSON.stringify(v));
  assert.equal(sanitize({ ...defaultSave(), settings: { gentleLight: true } }).settings.gentleLight, true);
  assert.equal(defaultSave().settings.gentleLight, false);
  const rr = sanitize({ ...defaultSave(), stats: { recentRuns: [{ t: 1, a: 'x' }, { t: 2, a: true }] } }).stats.recentRuns;
  assert.equal(rr[0].a, undefined); assert.equal(rr[1].a, true);
  assert.equal(parseParams('?assist=1').assist, true);
  for (const q of ['?assist=true', '?assist=2', '?assist=', '']) assert.equal(parseParams(q).assist, false, q);
});
