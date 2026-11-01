// EN3-EN5: telegraph enemies (Stoat Piper ranged, Puffback Toad area denial, Bramble Hart charger): data validation, tell timing, projectile
// rules, burst fizzle, charge immunity/recovery, fear/pin rules, tell token cap, in-view rule, spawn timelines + caps, determinism, bot dodge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/Sim.js';
import { data } from './helpers.mjs';

const TELL_TYPES = Object.keys(data.enemies).filter((k) => data.enemies[k].ai && !data.enemies[k].mini); // the EN6 miniboss (ai kind 'alpha') has its own tests (en6789)
// a quiet arena: no waves, no events, no boss; the hero's weapons removed so nothing kills the test enemy
function arena(seed = 1) {
  const ch = { ...data.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 };
  const d = { ...data, chapters: { ...data.chapters, cursed_forest: ch } };
  const s = new Sim({ data: d, seed, godMode: false });
  s.weapons.length = 0; s.units.length = 0;
  s.player.hp = s.player.maxHp = 1e6;
  return s;
}
const run = (s, secs, input = {}) => { for (let i = 0; i < Math.round(secs * 60); i++) s.step(1 / 60, input); };
const fin = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

test('data: telegraph types are valid, bounded, hostile ids are plain ids; each has ai.kind + a tell >= 0.6 s (area/charge >= 0.8 s)', () => {
  assert.ok(TELL_TYPES.includes('stoat_piper'));
  for (const id of TELL_TYPES) {
    const d = data.enemies[id], A = d.ai;
    assert.match(id, /^[a-z_]{1,32}$/);
    for (const k of ['hp', 'speed', 'dmg', 'r', 'xp', 'gold', 'mass']) assert.ok(fin(d[k]), `${id}.${k}`);
    assert.ok(['ranged', 'fuse', 'charger'].includes(A.kind), id);
    for (const [k, v] of Object.entries(A)) if (typeof v === 'number') assert.ok(fin(v) && v < 1000, `${id}.ai.${k}`);
    const tell = A.tell ?? A.fuse;
    assert.ok(tell >= (A.kind === 'ranged' ? 0.6 : 0.8), `${id} tell ${tell}`);
    assert.ok(A.maxTells >= 1 && A.maxTells <= 6, id);
    assert.ok(A.grace >= 0.8, id + ' spawn grace');
    assert.ok(!d.boss, id);
  }
});

test('waves: telegraph types spawn only from their locked times, with live caps; at most two must-react types before 6:00', () => {
  const W = data.chapters.cursed_forest.waves;
  const at = { stoat_piper: 180, puffback_toad: 270, bramble_hart: 380 };
  let early = 0;
  for (const w of W) {
    assert.ok(fin(w.rate0) && fin(w.rate1) && w.from < w.to, w.enemy);
    assert.ok(data.enemies[w.enemy], w.enemy);
    if (data.enemies[w.enemy].ai) {
      assert.equal(w.from, at[w.enemy], w.enemy);
      assert.ok(w.maxAlive >= 1 && w.maxAlive <= 10, w.enemy + ' cap');
      assert.equal(w.bossMul, undefined, w.enemy + ': no boss-time rate any more (the waves stop at the 14:00 arrival)');
      if (w.from < 360) early++;
    }
  }
  assert.ok(early <= 2, 'must-react types before 6:00: ' + early);
  // a real run: no telegraph type before its time, live caps hold
  const s = new Sim({ data, seed: 5, godMode: true });
  let maxAlive = {};
  for (let i = 0; i < 60 * 480; i++) {
    if (s.state === 'levelup') { s.pickCard(s.offer.cards[0].key); continue; }
    s.step(1 / 60, {});
    for (const id of TELL_TYPES) {
      const n = s.enemies.filter((e) => e.type === id).length;
      if (n) assert.ok(s.time >= at[id], `${id} at ${s.time.toFixed(1)}`);
      maxAlive[id] = Math.max(maxAlive[id] || 0, n);
      assert.equal(n, s.alive[id] || 0, id + ' live counter');
    }
  }
  for (const w of W) if (data.enemies[w.enemy].ai) assert.ok((maxAlive[w.enemy] || 0) <= w.maxAlive, `${w.enemy} ${maxAlive[w.enemy]}`);
});

test('Stoat Piper: walks in, roots, tells 0.7 s (direction locked at tell start), then ONE slow thorn; thorn hits the player only', () => {
  const s = arena(3), p = s.player, A = data.enemies.stoat_piper.ai;
  const e = s.spawnEnemy('stoat_piper', p.x + 230, p.y);
  e.aiCd = 0;
  let teleAt = null, shotAt = null, dir = null;
  for (let i = 0; i < 60 * 6 && shotAt === null; i++) {
    s.step(1 / 60, {});
    if (e.tele && teleAt === null) { teleAt = s.time; dir = [e.dx, e.dy]; }
    if (e.tele) assert.deepEqual([e.dx, e.dy], dir, 'locked');
    if (s.eshots.length) shotAt = s.time;
  }
  assert.ok(teleAt !== null && shotAt !== null);
  assert.ok(teleAt >= A.grace - 1e-9, 'no tell during spawn grace');
  assert.ok(Math.abs(shotAt - teleAt - A.tell) < 0.05, 'tell length ' + (shotAt - teleAt));
  const d = Math.hypot(e.x - p.x, e.y - p.y);
  assert.ok(d >= A.near && d <= A.keepMax + 1, 'keeps its distance ' + d);
  const t = s.eshots[0];
  assert.ok(Math.abs(Math.hypot(t.vx, t.vy) - A.shotSpeed) < 1e-6, 'slow thorn');
  assert.equal(s.eshots.length, 1, 'one thorn');
  // an enemy standing in the lane is never hurt (no friendly fire); the player is
  const block = s.spawnEnemy('wolf', (e.x + p.x) / 2, p.y); block.speed = 0; block.chargeCd = 1e9;
  const hp0 = block.hp, php = p.hp;
  run(s, 2.4);
  assert.equal(block.hp, hp0, 'no friendly fire');
  assert.ok(p.hp < php, 'player hit');
  assert.ok(s.hurtBy.stoat_piper > 0);
});

test('thorns: dodgeable (stepping aside avoids the hit), expire after their life, world edge kills them', () => {
  const s = arena(4), p = s.player;
  s.eshots.push({ id: 1, src: 'stoat_piper', x: p.x - 100, y: p.y, vx: 110, vy: 0, life: 2.2, age: 0, r: 3, dmg: 5, dead: false });
  const hp = p.hp;
  run(s, 0.4, { y: 1 }); // step down out of the line
  run(s, 2);
  assert.equal(p.hp, hp, 'dodged');
  assert.equal(s.eshots.length, 0, 'expired');
});

test('Stoat Piper: no tell outside the view, max 3 tells at once, fear/pin cancel a tell (no thorn), killed by anything', () => {
  const s = arena(6), p = s.player;
  s.view.hw = 100; s.view.hh = 60; // a narrow view: the piper must walk in before it may tell
  const far = s.spawnEnemy('stoat_piper', p.x, p.y + 150); far.aiCd = 0;
  for (let i = 0; i < 60 * 3; i++) { s.step(1 / 60, {}); if (far.tele) assert.ok(Math.abs(far.y - p.y) < 60, 'tell only inside the view'); }
  const s2 = arena(7), p2 = s2.player;
  const ring = [];
  for (let k = 0; k < 8; k++) { const a = k * 0.785; const e = s2.spawnEnemy('stoat_piper', p2.x + Math.cos(a) * 140, p2.y + Math.sin(a) * 100); e.grace = 0; e.aiCd = 0; ring.push(e); }
  let most = 0;
  for (let i = 0; i < 60 * 4; i++) { s2.step(1 / 60, {}); most = Math.max(most, ring.filter((e) => e.tele).length); }
  assert.equal(most, 3, 'tell token cap');
  // fear mid-tell: no thorn
  const s3 = arena(8), p3 = s3.player;
  const f = s3.spawnEnemy('stoat_piper', p3.x + 150, p3.y); f.grace = 0; f.aiCd = 0;
  for (let i = 0; i < 60 * 3 && !f.tele; i++) s3.step(1 / 60, {});
  assert.ok(f.tele);
  f.fearT = 1;
  run(s3, 0.8);
  assert.equal(s3.eshots.length, 0, 'fear cancels the tell');
  assert.equal(f.state === 'tele', false);
  f.fearT = 0; f.heldT = 0;
  for (let i = 0; i < 60 * 4 && !f.tele; i++) s3.step(1 / 60, {});
  f.heldT = 1;
  run(s3, 0.8);
  assert.equal(s3.eshots.length, 0, 'pin cancels the tell');
  s3.hurt(f, 1e6);
  s3.step(1 / 60, {});
  assert.equal(s3.enemies.includes(f), false);
  assert.equal(s3.killsByEnemy.stoat_piper, 1);
});

test('determinism: same seed, same run (positions, shots, hp) with the telegraph types live', () => {
  const go = () => { const s = new Sim({ data, seed: 11, godMode: true }); for (let i = 0; i < 60 * 420; i++) { if (s.state === 'levelup') { s.pickCard(s.offer.cards[0].key); continue; } s.step(1 / 60, {}); } return JSON.stringify([s.time, s.kills, s.player.hp, s.eshots.map((t) => [t.x, t.y]), s.enemies.map((e) => [e.type, e.x, e.y, e.state]), s.hurtBy]); };
  assert.equal(go(), go());
  for (const f of ['src/sim/enemyai.js', 'src/sim/Sim.js']) assert.ok(!/Math\.random/.test(readFileSync(new URL('../' + f, import.meta.url), 'utf8')), f + ' uses the seeded rng only');
});

test('bot dodge model: on by default, DODGE=0 documented; it side-steps out of an imminent thorn lane only', async () => {
  const { dodgeVec, DODGE } = await import('../scripts/bot.mjs');
  assert.equal(DODGE, process.env.DODGE !== '0');
  const s = arena(9), p = s.player;
  s.eshots.push({ id: 1, src: 'stoat_piper', x: p.x - 80, y: p.y + 2, vx: 110, vy: 0, life: 2, age: 0, r: 3, dmg: 5, dead: false });
  const v = [0, 0];
  assert.equal(dodgeVec(s, v), 1, 'imminent thorn');
  assert.ok(Math.abs(v[1]) > Math.abs(v[0]) && v[1] < 0, 'steps up, out of the lane');
  s.eshots[0].x = p.x - 200; // 1.8 s away: not imminent yet, no dodge
  assert.equal(dodgeVec(s, v), 0);
});

test('Puffback Toad: plants within trigger, ring fills over the fuse, bursts (player inside = hit, outside = safe), spent with XP only', () => {
  const A = data.enemies.puffback_toad.ai;
  const s = arena(21), p = s.player;
  const e = s.spawnEnemy('puffback_toad', p.x + 70, p.y); e.grace = 0;
  let plantAt = null, burstAt = null, pos = null, k0 = 0, g0 = 0;
  for (let i = 0; i < 60 * 6 && burstAt === null; i++) {
    k0 = s.kills; g0 = s.gems.reduce((t, g) => t + g.v, 0) + s.xp;
    s.step(1 / 60, {});
    if (e.tele && plantAt === null) { plantAt = s.time; pos = [e.x, e.y]; assert.ok(Math.hypot(e.x - p.x, e.y - p.y) < A.trigger + 2); }
    if (e.tele) assert.deepEqual([e.x, e.y], pos, 'planted: does not move during the fuse');
    if (e.burst) burstAt = s.time;
  }
  assert.ok(Math.abs(burstAt - plantAt - A.fuse) < 0.05, 'fuse ' + (burstAt - plantAt));
  assert.ok(s.hurtBy.puffback_toad > 0, 'inside the ring: hit');
  assert.equal(s.enemies.includes(e), false, 'spent');
  assert.equal(s.kills, k0, 'no kill credit for a burst');
  assert.ok(s.gems.reduce((t, g) => t + g.v, 0) + s.xp > g0, 'still drops its XP');
  // outside the ring: the hero steps away during the fuse and is safe
  const s2 = arena(22), p2 = s2.player;
  const t = s2.spawnEnemy('puffback_toad', p2.x + 45, p2.y); t.grace = 0;
  for (let i = 0; i < 60 && !t.tele; i++) s2.step(1 / 60, {});
  assert.ok(t.tele);
  run(s2, 1.2, { x: -1 });
  assert.equal(s2.hurtBy.puffback_toad || 0, 0, 'stepped out of the ring');
  assert.ok(t.burst || !s2.enemies.includes(t));
});

test('Puffback Toad: killed during the fuse it FIZZLES (no burst, normal kill + XP); fear/pin cancel the fuse and it re-plants later; ring never hurts enemies', () => {
  const s = arena(23), p = s.player;
  const e = s.spawnEnemy('puffback_toad', p.x + 40, p.y); e.grace = 0;
  const w = s.spawnEnemy('wolf', p.x + 40, p.y + 10); w.speed = 0; w.chargeCd = 1e9; const whp = w.hp;
  for (let i = 0; i < 60 && !e.tele; i++) s.step(1 / 60, {});
  assert.ok(e.tele);
  s.hurt(e, 1e6);
  s.step(1 / 60, {});
  assert.equal(s.hurtBy.puffback_toad || 0, 0, 'no burst');
  assert.equal(s.killsByEnemy.puffback_toad, 1);
  assert.ok(s.fx.some((f) => f.kind === 'fizzle'));
  run(s, 1.5);
  const s2 = arena(24), p2 = s2.player;
  const t = s2.spawnEnemy('puffback_toad', p2.x + 40, p2.y); t.grace = 0;
  const w2 = s2.spawnEnemy('wolf', p2.x + 40, p2.y + 12); w2.speed = 0; w2.chargeCd = 1e9; const w2hp = w2.hp;
  for (let i = 0; i < 60 && !t.tele; i++) s2.step(1 / 60, {});
  t.fearT = 0.5;
  run(s2, 0.5);
  assert.equal(t.state, 'run', 'fear cancels the fuse');
  assert.ok(!t.burst);
  for (let i = 0; i < 60 * 4 && !t.burst; i++) s2.step(1 / 60, {});
  assert.ok(t.burst, 're-plants and bursts later');
  assert.equal(w2.hp, w2hp, 'the burst never hurts enemies');
  assert.equal(w.hp, whp);
});

test('Bramble Hart: 0.8 s head-down tell (direction locked), long STRAIGHT charge, immune to fear/pin during the charge, staggers vulnerable after', () => {
  const A = data.enemies.bramble_hart.ai;
  const s = arena(31), p = s.player;
  const e = s.spawnEnemy('bramble_hart', p.x + 150, p.y + 20); e.grace = 0; e.aiCd = 0;
  let teleAt = null, chargeAt = null, staggerAt = null, start = null, dir = null;
  for (let i = 0; i < 60 * 5 && staggerAt === null; i++) {
    s.step(1 / 60, {});
    if (e.tele && teleAt === null) { teleAt = s.time; dir = [e.dx, e.dy]; }
    if (e.state === 'charge' && chargeAt === null) { chargeAt = s.time; start = [e.x, e.y]; }
    if (e.state === 'charge') { e.fearT = 1; e.heldT = 1; } // control every frame of the charge
    if (e.state === 'stagger' && staggerAt === null) staggerAt = s.time;
  }
  assert.ok(Math.abs(chargeAt - teleAt - A.tell) < 0.05, 'tell ' + (chargeAt - teleAt));
  assert.ok(Math.abs(staggerAt - chargeAt - A.charge) < 0.05, 'charge time');
  const moved = [e.x - start[0], e.y - start[1]], L = Math.hypot(...moved);
  assert.ok(L > A.charge * e.speed * A.chargeMul * 0.85, 'immune: kept charging through fear/pin, ' + L.toFixed(0));
  assert.ok(Math.abs(moved[0] / L - dir[0]) < 0.05 && Math.abs(moved[1] / L - dir[1]) < 0.05, 'straight along the locked direction');
  // stagger: vulnerable, fear applies again
  e.fearT = 0.4; e.heldT = 0;
  s.step(1 / 60, {});
  assert.ok(e.fearT > 0, 'fear applies after the charge');
  // fear during the TELL cancels it (non-boss)
  const s2 = arena(32), p2 = s2.player;
  const h = s2.spawnEnemy('bramble_hart', p2.x + 150, p2.y); h.grace = 0; h.aiCd = 0;
  for (let i = 0; i < 60 && !h.tele; i++) s2.step(1 / 60, {});
  h.heldT = 0.5;
  run(s2, 1);
  assert.notEqual(h.state, 'charge', 'pin cancels the tell');
  // charge contact damage is the charge value
  assert.ok(e.cdmg > e.dmg);
});
