// ELDER TREANT fight (B0 + moves): src/sim/boss.js + the Sim hooks. docs/design/boss-treant-v1.md, LOCKED 2026-10-20.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { validateFight, tellHits, BOSS_MOVES, MOVE_KIND } from '../src/sim/boss.js';

const DT = 1 / 60;
const F = data.enemies.elder_treant.fight;
const REACT = 0.35;
const step = (sim, s, input = {}) => { for (let i = 0, n = Math.round(s / DT); i < n; i++) { while (sim.state === 'levelup') sim.pickCard((sim.offer.gold[0] || sim.offer.cards[0]).key); if (sim.state !== 'running') return; sim.step(DT, typeof input === 'function' ? input(sim) : input); } };

// a quiet fight: no waves before, arrival at 840, the beat played out, the boss idle (no move until we force one)
function fight({ hero = 'elias', seed = 3, god = false, tier = 'normal', quiet = true } = {}) {
  const sim = new Sim({ data, characterId: hero, seed, startTime: 839.5, godMode: god, tier });
  sim.chapter = { ...sim.chapter, waves: [], events: [] };
  sim.spawnAcc = [];
  sim.weapons.length = 0; // no damage dealt unless a test deals it
  step(sim, 0.6);
  assert.ok(sim.fight, 'the fight began at 840');
  step(sim, F.intro.beat + 0.05);
  assert.equal(sim.fight.stage, 'fight');
  if (quiet) sim.fight.gapT = 1e9;
  return sim;
}
const placeHero = (sim, x, y) => { sim.player.x = x; sim.player.y = y; };

test('shipped fight data validates; bad data throws', () => {
  assert.doesNotThrow(() => validateFight(F, data.enemies));
  const clone = () => JSON.parse(JSON.stringify(F));
  const bad = [
    (f) => { f.moves.slam.tell = 0.4; }, // every tell >= 0.6 s
    (f) => { f.phases[1].moves.zap = 1; },
    (f) => { f.phases[1].call = [['nobody', 3]]; },
    (f) => { f.phases[1].call = [['elder_treant', 1]]; },
    (f) => { f.phases[2].hpAt = 0.9; },
    (f) => { f.arena.r = 'big'; },
    (f) => { f.tiers.expert.fanN = 99; },
    (f) => { f.tiers.hard.zap = 1; },
    (f) => { f.lanes = null; f.moves.lanes.gap = 10; }, // lanes must leave >= 40 u between them
  ];
  for (const b of bad) { const f = clone(); b(f); assert.throws(() => validateFight(f, data.enemies)); }
  for (const id of BOSS_MOVES) assert.ok(F.moves[id].tell >= 0.7 || id === 'seeds', `${id} tell`);
  assert.equal(F.moves.slam.tell, 1.2); assert.equal(F.moves.sweep.tell, 1.2);
  assert.equal(data.enemies.elder_treant.hp, 36000);
  assert.deepEqual([F.dmg.light, F.dmg.mid, F.dmg.heavy], [6, 10, 15]);
});

test('arrival at 14:00: waves stop, foes crumble to gems (no kills/gold), every gem flies in, the clock holds', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 5, startTime: 830, godMode: true });
  step(sim, 9.5);
  for (let i = 0; i < 30; i++) sim.spawnEnemy('wolf', sim.player.x + 150 + i, sim.player.y + 100);
  sim.addGem(sim.player.x + 600, sim.player.y, 3);
  const kills = sim.kills, gold = sim.gold, gems0 = sim.gems.length, alive = sim.enemies.length;
  assert.ok(alive >= 30);
  step(sim, 0.6);
  assert.ok(sim.fight && sim.spawnHalt);
  assert.equal(sim.enemies.length, 0, 'every foe crumbled');
  assert.equal(sim.kills, kills); assert.equal(sim.gold, gold);
  assert.ok(sim.gems.length >= Math.min(sim.balance.gemCap, gems0) - 5 && sim.gems.every((g) => g.mag), 'gems on the map all fly to the hero');
  assert.ok(sim.fight.ash.length > 0);
  for (const k in sim.alive) assert.ok(sim.alive[k] >= 0 && sim.alive[k] <= sim.enemies.filter((e) => e.type === k).length, `alive ${k}`);
  step(sim, 120);
  assert.notEqual(sim.state, 'victory', 'survival past 15:00 no longer wins');
  assert.ok(sim.time > 900);
  assert.equal(sim.clock, data.chapters.cursed_forest.bossAt, 'the display clock holds at 14:00');
  assert.ok(!sim.enemies.some((e) => ['crow', 'root_crawler', 'stoat_piper', 'bramble_hart'].includes(e.type)), 'no wave foe spawns after the arrival');
});

test('the arrival beat: the sim freezes for 1.2 s, the boss rises at +1.0 s (immune), the fight starts at +3.0 s', () => {
  const sim = new Sim({ data, characterId: 'elias', seed: 2, startTime: 839.9, godMode: true });
  sim.chapter = { ...sim.chapter, waves: [], events: [] }; sim.spawnAcc = [];
  step(sim, 0.2);
  const f = sim.fight, t0 = f.t0;
  assert.ok(!sim.boss);
  step(sim, F.intro.freezeAt - (sim.time - t0) + 0.1);
  assert.ok(sim.boss && sim.boss.immuneT > 0 && f.frozen);
  const x = sim.player.x;
  step(sim, 0.5, { x: 1, y: 0 });
  assert.equal(sim.player.x, x, 'input is locked while frozen');
  assert.equal(sim.hurt(sim.boss, 500), 0, 'the rising boss takes no damage');
  step(sim, F.intro.beat - (sim.time - t0) + 0.02);
  assert.equal(f.stage, 'fight');
  assert.ok(f.gapT > F.intro.grace - 0.1, 'a 2 s grace before the first move');
  const R = f.arena;
  assert.ok(Math.abs(Math.hypot(sim.boss.x - R.cx, sim.boss.y - R.cy) - (F.arena.rise - F.arena.ahead)) < 1);
});

test('the Root Ring: hero and foes stay inside, no damage from the wall; the hero is pushed out of the trunk', () => {
  const sim = fight({ god: true });
  const R = sim.fight.arena;
  step(sim, 8, { x: 1, y: 0.3 });
  assert.ok(Math.hypot(sim.player.x - R.cx, sim.player.y - R.cy) <= R.r - sim.player.r + 1e-6);
  assert.equal(sim.player.hp, sim.player.maxHp);
  const e = sim.spawnEnemy('wolf', R.cx + R.r + 80, R.cy);
  step(sim, DT);
  assert.ok(Math.hypot(e.x - R.cx, e.y - R.cy) <= R.r - e.r + 1e-6, 'foes are clamped inside after separation');
  placeHero(sim, sim.boss.x + 1, sim.boss.y);
  step(sim, DT);
  assert.ok(Math.hypot(sim.player.x - sim.boss.x, sim.player.y - sim.boss.y) >= F.pushOut - 1e-6);
});

test('world-edge arrival: the ring is shifted inside the world and the hero is walked in during the beat (all four edges)', () => {
  for (const [x, y] of [[20, 2000], [3980, 2000], [2000, 20], [2000, 3980]]) {
    const sim = new Sim({ data, characterId: 'elias', seed: 9, startTime: 839.9, godMode: true });
    sim.chapter = { ...sim.chapter, waves: [], events: [] }; sim.spawnAcc = [];
    placeHero(sim, x, y);
    step(sim, 0.2);
    const R = sim.fight.arena, size = data.balance.worldSize;
    assert.ok(R.cx >= F.arena.edge && R.cx <= size - F.arena.edge && R.cy >= F.arena.edge && R.cy <= size - F.arena.edge);
    step(sim, F.intro.beat + 0.5);
    assert.ok(Math.hypot(sim.player.x - R.cx, sim.player.y - R.cy) <= R.r, `hero inside at edge ${x},${y}`);
  }
});

test('phases: a huge hit stops at the 66% line, the stagger is immune, one heart drops, the Husk Call runs in; victory on the kill', () => {
  const sim = fight({ god: true });
  const b = sim.boss;
  const hearts0 = sim.pickups.filter((k) => k.type === 'heart').length;
  sim.hurt(b, 1e9);
  assert.ok(Math.abs(b.hp - b.maxHp * 0.66) < 1e-6, 'floored at the phase line');
  step(sim, DT * 2);
  assert.equal(sim.fight.phase, 1);
  assert.equal(sim.hurt(b, 100), 0, 'immune while staggering');
  assert.equal(sim.pickups.filter((k) => k.type === 'heart').length, hearts0 + 1);
  assert.equal(sim.enemies.filter((e) => e.type === 'wolf' && e.bossAdd).length, 6);
  const R = sim.fight.arena;
  for (const e of sim.enemies) if (e.bossAdd) assert.ok(Math.hypot(e.x - R.cx, e.y - R.cy) > R.r - 40, 'called foes come from the root wall');
  step(sim, F.stagger + 0.1);
  sim.hurt(b, 1e9);
  step(sim, DT * 2);
  assert.equal(sim.fight.phase, 2);
  assert.equal(sim.enemies.filter((e) => e.type === 'puffback_toad').length, 2);
  step(sim, F.stagger + 0.1);
  sim.hurt(b, 1e9);
  step(sim, DT);
  assert.equal(sim.state, 'victory');
  assert.ok(sim.bossKilled);
  assert.equal(sim.enemies.filter((e) => !e.dead).length, 0, 'the adds crumble at the killing blow');
  for (const k in sim.alive) assert.equal(sim.alive[k], 0, `alive ${k}`);
  const r = sim.result();
  assert.equal(r.outcome, 'victory');
  assert.ok(r.fight && r.fight.hpFrac === 0 && r.fight.phase === 2 && r.fight.time > 0);
  assert.equal(r.clock, 840);
});

test('boss adds: frozen 14-minute scaling, gems only (no hearts / magnets), at most 40 gems per fight', () => {
  const sim = fight({ god: true });
  sim.time = 2000; // far later: a moving minute would make the adds much tougher
  const w = sim.fight.addFoe('wolf', sim.player.x + 50, sim.player.y);
  const m = F.scaleMin, hs = data.balance.hpScale;
  assert.ok(Math.abs(w.maxHp - data.enemies.wolf.hp * (1 + hs.linear * m + hs.quad * m * m)) < 1e-6);
  const sap = sim.fight.addFoe('treant_sapling', sim.player.x + 50, sim.player.y);
  assert.equal(sap.maxHp, 30); assert.equal(sap.dmg, 6);
  sim.player.hp = 1; // low HP would normally raise the heart chance
  for (let i = 0; i < 80; i++) { const e = sim.fight.addFoe('wolf', sim.player.x + 60, sim.player.y + i); e.hp = 0; e.dead = true; }
  w.dead = true; sap.dead = true;
  const g0 = sim.gems.length;
  sim.cleanupDead();
  assert.equal(sim.pickups.filter((k) => k.type !== 'heart' || k.y > 0).filter((k) => k.type === 'magnet').length, 0);
  assert.equal(sim.fight.addGems, F.addGems);
  assert.ok(sim.gems.length - g0 <= F.addGems);
});

test('determinism: the same seed gives the same move sequence', () => {
  const run = () => { const sim = fight({ seed: 11, god: true, quiet: false }); const seq = []; sim.pushEvent = (t, x) => { if (t === 'bossTell') seq.push(x.move); }; step(sim, 60, (s) => ({ x: Math.sin(s.time), y: Math.cos(s.time * 0.7) })); return seq.join(','); };
  const a = run();
  assert.ok(a.split(',').length >= 12, a);
  assert.equal(a, run());
});

test('move picker: range gates, no repeats (except eruption), phase sets', () => {
  const sim = fight({ god: true, quiet: false });
  const seen = new Set(); let last = '';
  sim.pushEvent = (t, x) => { if (t !== 'bossTell') return; if (x.move !== 'eruption') assert.notEqual(x.move, last); last = x.move; seen.add(x.move); };
  step(sim, 90, (s) => { const b = s.boss, dx = s.player.x - b.x, dy = s.player.y - b.y, d = Math.hypot(dx, dy) || 1; return d < 60 ? { x: dx / d, y: dy / d } : { x: 0, y: 0 }; });
  for (const m of seen) assert.ok(['slam', 'eruption', 'seeds'].includes(m), `P1 only: ${m}`);
  const f = sim.fight;
  placeHero(sim, sim.boss.x + 200, sim.boss.y); f.clampIn(sim.player, 6);
  for (let i = 0; i < 40; i++) { const d = Math.hypot(sim.player.x - sim.boss.x, sim.player.y - sim.boss.y); const m = f.pickMove(sim.boss, d); if (d > 110) assert.notEqual(m, 'slam'); }
});

test('pressure: every 30 s the gap shrinks 6% to a 70% floor; the sapling cap rises to 14; tells never get shorter', () => {
  const sim = fight({ god: true });
  const f = sim.fight;
  f.fightT = 0; assert.equal(f.gapMul, 1); assert.equal(f.saplingCap, 8);
  f.fightT = 31; assert.ok(Math.abs(f.gapMul - 0.94) < 1e-9); assert.equal(f.saplingCap, 10);
  f.fightT = 600; assert.equal(f.gapMul, 0.7); assert.equal(f.saplingCap, 14); assert.equal(f.linger(3), 6); assert.equal(f.linger(4), 6); f.fightT = 31; assert.equal(f.linger(3), 4);
  sim.fight.startMove(sim.boss, 50, 'slam');
  assert.ok(Math.abs(f.tells[0].t1 - f.tells[0].t0 - F.moves.slam.tell) < 1e-9);
});

test('seed pods hatch into Sapling Husks after 3 s (cap respected); a killed pod never hatches', () => {
  const sim = fight({ god: true });
  const f = sim.fight;
  f.startMove(sim.boss, 100, 'seeds');
  const n = f.tells.filter((t) => t.shape === 'pod').length;
  assert.equal(n, F.moves.seeds.pods[0]);
  step(sim, F.moves.seeds.tell + F.moves.seeds.fly + 0.05);
  const pods = sim.enemies.filter((e) => e.type === 'treant_pod');
  assert.equal(pods.length, n);
  pods[0].hp = 0; pods[0].dead = true;
  step(sim, F.moves.seeds.hatch + 0.1);
  assert.equal(sim.enemies.filter((e) => e.type === 'treant_pod').length, 0);
  assert.equal(sim.enemies.filter((e) => e.type === 'treant_sapling').length, n - 1);
  assert.equal(sim.alive.treant_pod, 0);
});

test('every boss hit is fixed damage x tier, and >= 0.6 s apart; recap kinds are named', () => {
  for (const [tier, k] of [['normal', 1], ['expert', data.tiers.template.expert.enemyDmg]]) {
    const sim = fight({ tier });
    const b = sim.boss;
    placeHero(sim, b.x + 40, b.y);
    sim.fight.startMove(b, 40, 'slam');
    const hp = sim.player.hp;
    step(sim, F.moves.slam.tell + 0.02);
    assert.ok(Math.abs(hp - sim.player.hp - F.dmg.heavy * k) < 1e-6, `${tier} slam = heavy x tier`);
    assert.equal(sim.lastHit.kind, 'slam');
    assert.ok(!sim.fight.hitHero(5, 'contact', 0, 0), 'a second boss hit inside 0.6 s is dropped');
  }
  for (const id of BOSS_MOVES) assert.ok(typeof MOVE_KIND[id] === 'string');
});

test('level-up offers wait while a boss tell is live (max 3 s)', () => {
  const sim = fight({ god: true });
  sim.fight.startMove(sim.boss, 50, 'eruption');
  sim.xp = sim.xpNeeded + 1;
  let at = -1;
  for (let i = 0; i < 120 && sim.state === 'running'; i++) { sim.step(DT, {}); if (sim.state === 'levelup') at = sim.time; }
  assert.ok(at > 0, 'the offer comes');
  assert.ok(!sim.fight.move, 'only once the tell is over');
});

// ---------------------------------------------------------------- escapability: every warning can be escaped by Elias (76 u/s) after 0.35 s
// Strategy (what a player does): stand still until REACT s into the tell, then run in the best of 48 straight directions (the first whose end
// point after the remaining tell time is outside every harmful zone and inside the ring). Asserts no hit from that move.
function escapeDir(sim) { // -> the nearest safe point the hero can reach before the release (48 directions x growing distance)
  const f = sim.fight, p = sim.player, left = Math.max(0, f.tells[0].t1 - sim.time), reach = 76 * left - 1, R = f.arena; // Elias at full speed (1 u slack for the frame step)
  for (let d = 4; d <= reach; d += 1) for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    if (Math.hypot(x - R.cx, y - R.cy) > R.r - p.r) continue;
    if (Math.hypot(x - sim.boss.x, y - sim.boss.y) < F.pushOut + 1) continue;
    let safe = true;
    for (const t of f.tells) if (t.harm && tellHits(t, x, y, p.r + 1.5)) { safe = false; break; }
    if (safe) return [x, y];
  }
  return null;
}
function escapeCase(id, setup, seed = 3) {
  const sim = fight({ seed });
  const b = sim.boss;
  // centre the boss so the hero has room on every side (the worst positions are about the boss, not the wall)
  b.x = sim.fight.arena.cx; b.y = sim.fight.arena.cy;
  setup(sim, b);
  sim.fight.startMove(b, Math.hypot(sim.player.x - b.x, sim.player.y - b.y), id);
  step(sim, REACT);
  const dir = escapeDir(sim);
  assert.ok(dir, `${id}: some escape direction exists`);
  step(sim, F.moves[id].tell, (q) => { const dx = dir[0] - q.player.x, dy = dir[1] - q.player.y, d = Math.hypot(dx, dy); const k = Math.min(1, d / (76 * DT)) / (d || 1); return { x: dx * k, y: dy * k }; });
  return sim.fight.byMove[MOVE_KIND[id]] || 0; // hits from THIS move (contact at the trunk is its own thing)
}
test('escape check: slam (hero right at the trunk), 1.2 s tell', () => {
  for (const a of [0, 1.3, 2.6, 4]) assert.equal(escapeCase('slam', (s, b) => placeHero(s, b.x + Math.cos(a) * F.pushOut, b.y + Math.sin(a) * F.pushOut)), 0);
});
test('escape check: vine sweep (hero on the aim line, near and at the worst distance), 1.2 s tell', () => {
  for (const d of [32, 76, 120]) assert.equal(escapeCase('sweep', (s, b) => placeHero(s, b.x + d, b.y + 1)), 0, `d ${d}`);
});
test('escape check: root eruption (one circle on the hero, the rest around), 20 seeds', () => {
  for (let sd = 1; sd <= 20; sd++) assert.equal(escapeCase('eruption', (s, b) => placeHero(s, b.x + 90, b.y + 20), sd), 0, `seed ${sd}`);
});
test('escape check: root lanes (hero on the lane centre), incl. Long Night crossing lanes', () => {
  for (let sd = 1; sd <= 10; sd++) assert.equal(escapeCase('lanes', (s, b) => { placeHero(s, b.x + 80, b.y - 30); s.fight.lanesCast = 1; }, sd), 0, `seed ${sd}`);
  const sim = fight({ seed: 4, tier: 'expert' });
  sim.boss.x = sim.fight.arena.cx; sim.boss.y = sim.fight.arena.cy;
  placeHero(sim, sim.boss.x + 60, sim.boss.y + 20); sim.fight.lanesCast = 1;
  sim.fight.startMove(sim.boss, 60, 'lanes');
  const L = sim.fight.tells;
  assert.equal(L.length, 3);
  const c = L[2]; // the crossing lane keeps >= 40 u clear of the hero's spot
  assert.ok(!tellHits(c, sim.player.x, sim.player.y, 40 - c.w / 2), 'crossing lane >= 40 u from the hero');
});
// thorns: the hero steps sideways out of the fan (perpendicular to the aim) / slides round to the nearest nova gap
function thornCase(id, d, ang, tier = 'normal') {
  const sim = fight({ seed: 6, tier });
  const b = sim.boss; b.x = sim.fight.arena.cx; b.y = sim.fight.arena.cy;
  placeHero(sim, b.x + Math.cos(ang) * d, b.y + Math.sin(ang) * d);
  sim.fight.startMove(b, d, id);
  const t = sim.fight.tells[0];
  step(sim, REACT);
  const p = sim.player, dx = p.x - b.x, dy = p.y - b.y, dd = Math.hypot(dx, dy);
  let dir;
  if (id === 'fan') dir = [-dy / dd, dx / dd];
  else {
    const slots = t.n + 2 * t.gaps, stp = (2 * Math.PI) / slots, per = slots / t.gaps, a0 = Math.atan2(dy, dx);
    let best = 0, bd = Infinity;
    for (let g = 0; g < t.gaps; g++) { const ga = t.rot + (Math.ceil(g * per - 1e-9) + 0.5) * stp; let da = ga - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; if (Math.abs(da) < Math.abs(bd)) { bd = da; best = ga; } }
    dir = null;
    const target = best;
    step(sim, 4, (s) => { const qx = s.player.x - b.x, qy = s.player.y - b.y, q = Math.hypot(qx, qy); let da = target - Math.atan2(qy, qx); while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; if (Math.abs(da) * q < 2) return { x: 0, y: 0 }; const sg = da > 0 ? 1 : -1; return { x: -qy / q * sg, y: qx / q * sg }; });
    return sim.fight.byMove[MOVE_KIND[id]] || 0;
  }
  step(sim, 4, { x: dir[0], y: dir[1] });
  return sim.fight.byMove[MOVE_KIND[id]] || 0;
}
test('escape check: thorn fan (5; 7 on Long Night) at 32 / 80 / 200 u', () => {
  for (const d of [32, 80, 200]) for (const a of [0, 2]) assert.equal(thornCase('fan', d, a), 0, `fan d ${d}`);
  for (const d of [36, 80, 200]) assert.equal(thornCase('fan', d, 1, 'expert'), 0, `fan7 d ${d}`);
});
test('escape check: ring of thorns (nova) at 40 / 80 / 140 u, every start angle', () => {
  for (const d of [40, 80, 140]) for (let i = 0; i < 8; i++) assert.equal(thornCase('nova', d, (i / 8) * Math.PI * 2), 0, `nova d ${d} a ${i}`);
});

test('the clock: HUD/results read a held 14:00 during the fight; before it, the run time', () => {
  const sim = new Sim({ data, seed: 1, startTime: 300 });
  assert.equal(sim.clock, 300);
  const f = fight({ god: true });
  step(f, 30);
  assert.equal(f.clock, 840);
  assert.ok(f.result().clock === 840 && f.result().fight.time > 29);
});

test('pooled tells are reset: a lane after a slam never follows the boss (regression)', () => {
  const sim = fight({ god: true });
  const b = sim.boss, f = sim.fight;
  placeHero(sim, b.x + 60, b.y);
  f.startMove(b, 60, 'slam');
  step(sim, F.moves.slam.tell + 0.1);
  placeHero(sim, b.x + 90, b.y + 20);
  f.startMove(b, 90, 'lanes');
  step(sim, 0.2);
  for (const t of f.tells) {
    assert.ok(!t.follow);
    const R = f.arena;
    assert.ok(Math.abs(Math.hypot(t.x - R.cx, t.y - R.cy) - R.r) < 1e-6, 'a lane starts on the wall');
    assert.ok(Math.abs(Math.hypot(t.x + t.ax * t.len - R.cx, t.y + t.ay * t.len - R.cy) - R.r) < 1e-6, 'and ends on the wall');
  }
});
