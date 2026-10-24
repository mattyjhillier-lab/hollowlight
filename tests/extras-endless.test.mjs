// EXTRAS v1 (3) Endless Dusk (C1-A 'Stay in the dark'): only after a dawn won at the boss, once; deterministic; waves return and climb;
// gold x0.25 capped at +50% of the dawn gold (sim AND bank); records use the dawn time + a 'longest night'; a fall in the dark keeps the dawn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { Sim, endlessDef } from '../src/sim/Sim.js';
import { SaveStore } from '../src/save/store.js';
import { defaultSave, sanitize } from '../src/save/schema.js';
import { resultsView } from '../src/ui/resultscopy.js';

const CID = 'cursed_forest';
const memStore = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
// a won run without playing 15 minutes: jump to the dawn by killing the boss through the sim's own path
function wonSim(seed = 5) {
  const s = new Sim({ data, seed, godMode: true, startTime: data.chapters[CID].bossAt - 1 });
  for (let i = 0; i < 4000 && s.state !== 'victory'; i++) {
    if (s.state === 'levelup') { s.pickCard((s.offer.cards[0] || s.offer.gold[0]).key); continue; }
    s.step(1 / 30, {});
    if (s.boss && !s.boss.dead && s.fight && s.fight.stage === 'fight') { s.hurt(s.boss, s.boss.hp + 1); s.cleanupDead(); }
  }
  return s;
}
const play = (s, secs) => { for (let i = 0; i < secs * 30 && (s.state === 'running' || s.state === 'levelup'); i++) { if (s.state === 'levelup') s.pickCard((s.offer.cards[0] || s.offer.gold[0]).key); else s.step(1 / 30, { x: Math.sin(i / 40), y: Math.cos(i / 55) }); } return s; };

test('Endless data: bounded knobs; bad data turns the option off', () => {
  assert.deepEqual({ ...endlessDef(data.balance) }, { density: 0.06, goldMul: 0.25, goldCap: 0.5, swarmEvery: 90, swarmBase: 24, swarmGrow: 4 });
  for (const bad of [{}, { endless: { ...data.balance.endless, goldMul: 3 } }, { endless: { ...data.balance.endless, density: -1 } }, { endless: { ...data.balance.endless, swarmEvery: 'x' } }]) assert.equal(endlessDef(bad), null);
});

test('Stay in the dark: refused unless the dawn was won at the boss; once only', () => {
  const s = new Sim({ data, seed: 2 });
  assert.equal(s.stayInDark(), false, 'a running night');
  s.state = 'defeat';
  assert.equal(s.stayInDark(), false, 'a fall');
  s.state = 'victory'; // forged victory without the boss kill
  assert.equal(s.stayInDark(), false);
  const w = wonSim();
  assert.equal(w.state, 'victory'); assert.equal(w.bossKilled, true);
  assert.equal(w.stayInDark(), true);
  assert.equal(w.state, 'running'); assert.equal(w.fight, null);
  assert.equal(w.stayInDark(), false, 'once per run');
});

test('in the dark: waves return and climb, foe HP keeps the run curve, gold is a quarter and capped; a fall keeps the dawn', () => {
  const w = wonSim(7);
  const g0 = w.gold, k0 = w.kills;
  w.stayInDark();
  play(w, 150);
  assert.ok(w.enemies.length > 20 || w.kills > k0 + 50, 'the horde comes back');
  assert.ok(w.events.some((e) => e.type === 'swarm') || w.endless.swarmN >= 1, 'a swarm at 90 s');
  assert.ok(w.gold <= g0 * 1.5 + 1e-6, 'gold cap +50%');
  const e = w.spawnEnemy('wolf', w.player.x + 300, w.player.y);
  const early = new Sim({ data, seed: 7 }).spawnEnemy('wolf', 0, 0);
  assert.ok(e.maxHp > early.maxHp * 5, 'HP follows the run minute (no reset)');
  w.player.hp = 0.1; w.godMode = false; w.player.iframes = 0; w.damagePlayer(9999, 'wolf');
  assert.equal(w.state, 'defeat');
  const r = w.result();
  assert.equal(r.outcome, 'victory', 'a fall in the dark is never a defeat');
  assert.ok(r.endless.dark > 100 && r.endless.dawn > 800 && r.endless.gold0 === Math.floor(g0));
});

test('determinism: the same seed and the same choice give the same dark', () => {
  const a = play((() => { const s = wonSim(9); s.stayInDark(); return s; })(), 60), b = play((() => { const s = wonSim(9); s.stayInDark(); return s; })(), 60);
  assert.equal(JSON.stringify([a.time, a.kills, a.gold, a.player.x, a.enemies.length]), JSON.stringify([b.time, b.kills, b.gold, b.player.x, b.enemies.length]));
});

test('banking: dawn time is the record, the dark is its own record, forged endless gold is capped, play time counts in full', () => {
  const st = new SaveStore(memStore()); st.load();
  const r = { outcome: 'defeat', time: 1300, level: 40, kills: 3000, gold: 99999, shards: 5, bossKilled: true, bossId: 'elder_treant', chapter: CID, character: 'wren', tier: 'normal', killsByEnemy: {}, weapons: [], endless: { dark: 380, dawn: 920, gold0: 1000 } };
  const b = st.bankRun(r, { def, data, unlockedTiers: [] });
  const s = st.data;
  assert.equal(s.gold, 1500, 'capped at +50% of the dawn gold');
  assert.equal(s.stats.wins, 1, 'counted as the dawn it was');
  assert.equal(s.stats.bestTime, 920); assert.equal(s.stats.chapters[CID].bestTime, 920); assert.equal(s.stats.tiers[CID].normal.best.t, 920);
  assert.equal(s.stats.totalPlayTime, 1300);
  assert.equal(s.stats.tiers[CID].normal.dark, 380); assert.equal(b.tier.darkBest, true);
  const v = resultsView({ ...r, outcome: 'victory', gold: 1500 }, b, data);
  assert.equal(v.time, '15:20');
  assert.equal(v.dark, 'You held the dark 6:20 past dawn. A new longest night.');
  // a shorter dark later does not lower the record; Gentle Light rests it
  st.bankRun({ ...r, endless: { dark: 100, dawn: 930, gold0: 10 } }, { def, data, unlockedTiers: [] });
  assert.equal(st.data.stats.tiers[CID].normal.dark, 380);
  st.bankRun({ ...r, assist: true, endless: { dark: 999, dawn: 930, gold0: 10 } }, { def, data, unlockedTiers: [] });
  assert.equal(st.data.stats.tiers[CID].normal.dark, 380);
  // hostile save: the record is clamped / typed
  assert.equal(sanitize({ ...defaultSave(), stats: { tiers: { [CID]: { normal: { runs: 1, dark: 'x' } } } } }).stats.tiers[CID].normal.dark, undefined);
  assert.equal(sanitize({ ...defaultSave(), stats: { tiers: { [CID]: { normal: { runs: 1, dark: 1e12 } } } } }).stats.tiers[CID].normal.dark, 1e6);
});
