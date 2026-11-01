// B6 Elder Treant tier rules (boss-treant-v1 (g) A, LOCKED 2026-10-20 + tiers row): boss HP x tier bossHp, damage x tier enemyDmg,
// Deep Dusk 'Thorned' (fan from P1, nova gaps 3), Long Night 'Old Growth' (crossing lanes, fan 7, Ironbark saplings: a fixed rule, no RNG,
// never a marked kill). Twilight keeps none of these.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { validateFight } from '../src/sim/boss.js';
import { EVENT_CUE } from '../src/audio/cues.js';
import { CUES } from '../src/audio/engine.js';

const DT = 1 / 60;
const F = data.enemies.elder_treant.fight;
const step = (sim, s) => { for (let i = 0, n = Math.round(s / DT); i < n; i++) { while (sim.state === 'levelup') sim.pickCard((sim.offer.gold[0] || sim.offer.cards[0]).key); if (sim.state !== 'running') return; sim.step(DT, {}); } };
function fight(tier) {
  const sim = new Sim({ data, characterId: 'elias', seed: 5, startTime: 839.5, godMode: true, tier });
  sim.chapter = { ...sim.chapter, waves: [], events: [] };
  sim.spawnAcc = []; sim.weapons.length = 0;
  step(sim, 0.6 + F.intro.beat + 0.05);
  assert.equal(sim.fight.stage, 'fight');
  sim.fight.gapT = 1e9;
  return sim;
}
const T = data.tiers.template;

test('boss HP and rules per tier', () => {
  for (const id of ['normal', 'hard', 'expert']) {
    const sim = fight(id), f = sim.fight;
    assert.equal(sim.boss.maxHp, data.enemies.elder_treant.hp * T[id].bossHp, `${id} hp`);
    const r = f.rules;
    if (id === 'normal') assert.deepEqual([r.fanFrom, r.novaGaps, r.fanN, r.cross, r.saplingMark], [1, F.moves.nova.gaps, F.moves.fan.n, false, null]);
    if (id === 'hard') assert.deepEqual([r.fanFrom, r.novaGaps, r.fanN, r.cross, r.saplingMark], [0, 3, F.moves.fan.n, false, null]);
    if (id === 'expert') assert.deepEqual([r.fanFrom, r.novaGaps, r.fanN, r.cross, r.saplingMark], [0, 3, 7, true, 'ironbark']);
  }
});

test('Long Night saplings carry Ironbark (no mark RNG drawn, not counted as marked kills); Twilight / Deep Dusk saplings are plain', () => {
  for (const id of ['normal', 'hard', 'expert']) {
    const sim = fight(id), f = sim.fight;
    const mr = sim.markRng && sim.markRng.state !== undefined ? sim.markRng.state : JSON.stringify(sim.markRng);
    f.startMove(sim.boss, 100, 'seeds');
    step(sim, F.moves.seeds.tell + F.moves.seeds.fly + F.moves.seeds.hatch + 0.2);
    const sap = sim.enemies.filter((e) => e.type === 'treant_sapling' && !e.dead);
    assert.ok(sap.length > 0, `${id} saplings hatched`);
    const base = data.enemies.treant_sapling.hp * T[id].enemyHp;
    for (const e of sap) {
      if (id === 'expert') { assert.equal(e.hmark, 'ironbark'); assert.ok(Math.abs(e.maxHp - base * 1.8) < 1e-6); }
      else assert.ok(!e.hmark, `${id} sapling unmarked`);
    }
    assert.equal(sim.markRng && sim.markRng.state !== undefined ? sim.markRng.state : JSON.stringify(sim.markRng), mr, 'mark stream untouched');
    for (const e of sap) { e.hp = 0; e.dead = true; }
    step(sim, 0.1);
    assert.equal(sim.killsByEnemy.treant_sapling, sap.length, 'the saplings died as kills');
    assert.equal(sim.markedKills, 0, 'boss adds never count as marked kills');
  }
});

test('validation: saplingMark must be a known mark', () => {
  const bad = JSON.parse(JSON.stringify(F)); bad.tiers.expert.saplingMark = 'gold';
  assert.throws(() => validateFight(bad, data.enemies));
});

test('B5 boss cues: every boss sim event and the 13:55 tremor have a sound', () => {
  for (const ev of ['bossTell', 'bossHit', 'bossPhase', 'bossDead', 'bossSoon']) assert.ok(CUES[EVENT_CUE[ev]], ev);
});

test('boss soul shards by night: 5 / 7 / 10 (Twilight = the chapter number)', async () => {
  const { bossShardsFor } = await import('../src/sim/tiers.js');
  const c = data.chapters.cursed_forest.bossShards;
  assert.deepEqual(['normal', 'hard', 'expert'].map((id) => bossShardsFor(c, id, T[id])), [c, T.hard.shards, T.expert.shards]);
  for (const id of ['normal', 'hard', 'expert']) {
    const sim = fight(id);
    for (let i = 0; i < 3 && sim.state === 'running'; i++) { sim.hurt(sim.boss, 1e9); step(sim, F.stagger + 0.1); }
    assert.equal(sim.state, 'victory');
    assert.equal(sim.shards, bossShardsFor(c, id, T[id]), `${id} shards`);
  }
});

test('regression (B7): after each phase change the boss keeps starting moves (stagger ends at exactly 0)', () => {
  const sim = fight('normal'), f = sim.fight, b = sim.boss;
  f.gapT = 0.5;
  for (let ph = 1; ph <= 2; ph++) {
    sim.hurt(b, 1e9); step(sim, F.stagger + 0.1);
    assert.equal(f.phase, ph);
    assert.equal(b.staggerT, 0);
    const m0 = f.moves;
    step(sim, F.phases[ph].gap + 2);
    assert.ok(f.moves > m0, `phase ${ph}: a move started after the stagger`);
  }
});
