// EN6-EN9: the Branch-Mane miniboss (Grey Alpha role, HUSKS BATCH 3 A) and its Lantern Reliquary chest (enemies-v1.md 2.7 A / 2.8 A).
// Schedule (3:20 / 7:00 / 11:30), fixed hp, howl + called pack (cap), line charge (tell, locked lane, x4, phase-2 repeat), control immunity, leash,
// drops (heart + chest, no gem), chest tiers + pity + tier knobs, chest floor + Blessing/stat choices (inside the caps, never an evolution card).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/Sim.js';
import { resolveTier, validateTiers } from '../src/sim/tiers.js';
import { threatens } from '../src/gfx/telebudget.js';
import { isMustReact } from '../src/gfx/crowdread.js';
import { data } from './helpers.mjs';

const MS = data.chapters.cursed_forest.minis;
function arena(seed = 1, extra = {}) {
  const ch = { ...data.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9, ...extra };
  const d = { ...data, chapters: { ...data.chapters, cursed_forest: ch } };
  const s = new Sim({ data: d, seed, tier: extra.tier || 'normal' });
  s.weapons.length = 0; s.units.length = 0;
  s.player.hp = s.player.maxHp = 1e6;
  return s;
}
const run = (s, secs, input = {}) => { for (let i = 0; i < Math.round(secs * 60); i++) { if (s.state !== 'running') break; s.step(1 / 60, input); } };
const mane = (s) => s.enemies.find((e) => e.type === 'branch_mane');

test('data: Branch-Mane is the locked miniboss (stats, times incl. #3 at 11:30, hp 700/1600/3200, chest odds); >= 30 s from every swarm', () => {
  const d = data.enemies.branch_mane, A = d.ai;
  assert.equal(MS.id, 'branch_mane');
  assert.deepEqual(MS.at, [200, 420, 690]);
  assert.deepEqual(MS.hp, [700, 1600, 3200]);
  assert.deepEqual(MS.chest, [[55, 40, 5], [20, 60, 20], [0, 50, 50]]);
  for (const o of MS.chest) assert.equal(o[0] + o[1] + o[2], 100);
  assert.equal(d.speed, 52); assert.equal(d.r, 14); assert.equal(d.mass, 20); assert.equal(d.dmg, 8);
  assert.equal(A.kind, 'alpha'); assert.equal(A.tell, 0.7); assert.equal(A.chargeMul, 4); assert.equal(A.charge, 0.7); assert.equal(A.chargeDmg, 14); assert.equal(A.cd, 7);
  assert.equal(A.howl.every, 12); assert.equal(A.howl.first, 3); assert.equal(A.howl.pose, 0.6); assert.equal(A.howl.calls, 4); assert.equal(A.howl.callsP2, 6); assert.equal(A.howl.cap, 8);
  assert.equal(A.phaseAt, 0.5); assert.equal(A.immune, 'all'); assert.ok(d.mustReact && d.mini && !d.boss);
  assert.ok(isMustReact('branch_mane'));
  for (const t of MS.at) for (const ev of data.chapters.cursed_forest.events) assert.ok(Math.abs(ev.t - t) >= 30, `alpha ${t} vs swarm ${ev.t}`);
  for (const t of MS.at) assert.ok(t + 60 < data.chapters.cursed_forest.bossAt, 'never collides with the Treant');
});

test('schedule: one Branch-Mane at each locked time (fixed hp, no hpScale), countdown chip from 30 s before, nothing after the boss arrives', () => {
  const s = arena(3);
  s.time = 165; assert.equal(s.miniSoon, -1);
  s.time = 175; assert.ok(Math.abs(s.miniSoon - 25) < 1e-9);
  s.time = 199.9; run(s, 0.2);
  let m = mane(s);
  assert.ok(m && m.mini && s.mini === m);
  assert.equal(m.maxHp, 700);
  assert.ok(s.events.some((e) => e.type === 'mini'));
  m.hp = 0; m.dead = true; run(s, 1 / 60);
  assert.equal(s.mini, null);
  s.time = 419.9; run(s, 0.2); m = mane(s); assert.equal(m.maxHp, 1600); m.dead = true; run(s, 1 / 60);
  s.time = 689.9; run(s, 0.2); m = mane(s); assert.equal(m.maxHp, 3200);
  assert.equal(s.miniNext, 3);
  assert.equal(s.miniSoon, -1);
});

test('howl: first at 3 s, 0.6 s pose (still), calls 4 Fell Wolves at the view edge, at most 8 called alive, every 12 s; 6 after the phase change', () => {
  const s = arena(5);
  s.time = 199.99; run(s, 0.05);
  const m = mane(s);
  run(s, 3.05);
  assert.equal(m.state, 'howl');
  const x0 = m.x, y0 = m.y; run(s, 0.3);
  assert.ok(Math.hypot(m.x - x0, m.y - y0) < 1, 'stands still while howling');
  run(s, 0.4);
  let called = s.enemies.filter((e) => e.calledBy === m.id);
  assert.equal(called.length, 4);
  for (const w of called) assert.equal(w.type, 'wolf');
  for (const w of called) assert.ok(Math.hypot(w.x - s.player.x, w.y - s.player.y) > 300, 'from the view edge');
  run(s, 12.6); called = s.enemies.filter((e) => e.calledBy === m.id && !e.dead);
  assert.equal(called.length, 8, 'cap 8 called alive');
  run(s, 12); assert.equal(s.enemies.filter((e) => e.calledBy === m.id && !e.dead).length, 8);
  for (const w of s.enemies.filter((e) => e.calledBy === m.id)) { w.dead = true; } run(s, 1 / 60); s.gems.length = 0; s.xp = 0; // no level-up screen mid-test
  m.hp = m.maxHp * 0.4; m.howlCd = 0; m.state = 'run'; run(s, 0.7);
  assert.ok(m.phase2);
  assert.equal(s.enemies.filter((e) => e.calledBy === m.id && !e.dead).length, 6);
});

test('line charge: 0.7 s tell with the direction locked (lane drawn), then x4 speed for 0.7 s (~145 u), 14 x dmgScale contact; repeats once in phase 2', () => {
  const s = arena(7);
  s.time = 199.99; run(s, 0.02);
  const m = mane(s);
  m.howlCd = 99; m.grace = 0; m.aiCd = 0;
  m.x = s.player.x + 120; m.y = s.player.y;
  run(s, 1 / 60);
  assert.equal(m.state, 'tele'); assert.ok(m.tele);
  const dx = m.dx, dy = m.dy;
  s.player.x += 40; s.player.y += 40; // the hero moves: the lane does not follow
  run(s, 0.6); assert.equal(m.dx, dx); assert.equal(m.dy, dy);
  assert.ok(threatens(m, { x: m.x + m.dx * 60, y: m.y + m.dy * 60, r: 6 }), 'a hero in the lane is threatened');
  run(s, 0.12); assert.equal(m.state, 'charge');
  const x0 = m.x, y0 = m.y; run(s, 0.7);
  const L = Math.hypot(m.x - x0, m.y - y0);
  assert.ok(L > 130 && L < 160, `charge length ${L}`);
  assert.ok(Math.abs(m.cdmg - 14 * (1 + data.balance.dmgScale.linear * (200 / 60))) < 0.01);
  // phase 2: the next charge is followed by a second, re-aimed tell at once
  m.state = 'run'; m.hp = m.maxHp * 0.3; m.aiCd = 0; m.x = s.player.x + 120; m.y = s.player.y; m.phase2 = false;
  run(s, 1 / 60); assert.ok(m.phase2); assert.equal(m.state, 'tele');
  run(s, 0.72 + 0.71); assert.ok(m.rep);
  assert.equal(m.state, 'tele', 'the repeat charge tells again at once');
  run(s, 0.72 + 0.71); assert.ok(!m.rep); assert.equal(m.state, 'run'); assert.ok(m.aiCd > 6, 'then the normal 7 s cooldown');
});

test('control immune in every state (fear, pin, Rally pin), leashed (lopes back at x2 beyond 500 u, never recycled); takes bleed and burn', () => {
  const s = arena(9);
  s.time = 199.99; run(s, 0.02);
  const m = mane(s);
  m.fearT = 3; m.heldT = 3; run(s, 1 / 60);
  assert.equal(m.fearT, 0); assert.equal(m.heldT, 0);
  m.state = 'tele'; m.tele = true; m.stT = 0.5; m.fearT = 2; run(s, 1 / 60);
  assert.equal(m.state, 'tele', 'fear never cancels its tell');
  m.state = 'run'; m.tele = false; m.howlCd = 99; m.aiCd = 99;
  m.x = s.player.x + 700; m.y = s.player.y; const x0 = m.x; run(s, 0.5);
  assert.ok(x0 - m.x > 52 * 2 * 0.5 * 0.9, 'lopes back fast');
  assert.ok(Math.abs(m.y - s.player.y) < 5, 'not recycled to the spawn ring');
  const hp = m.hp; m.bleedT = 2; m.bleedDps = 10; run(s, 0.5); assert.ok(m.hp < hp);
});

test('drops: a heart + one Lantern Reliquary (no gem), kill credit; tier odds + pity never two Large; tier knob moves Large odds', () => {
  const s = arena(11);
  s.time = 199.99; run(s, 0.02);
  const m = mane(s);
  m.hp = 0; m.dead = true; m.killer = 'ghost_wolves'; s.cleanupDead();
  const types = s.pickups.map((k) => k.type).sort();
  assert.deepEqual(types, ['chest', 'heart']);
  assert.equal(s.gems.length, 0);
  assert.equal(s.killsByEnemy.branch_mane, 1);
  assert.equal(s.fallen.length, 0, 'never an echo wolf');
  const c = s.pickups.find((k) => k.type === 'chest');
  assert.equal(c.ttl, Infinity);
  // odds: 1000 rolls of each schedule row (pity reset each time)
  for (const [i, o] of MS.chest.entries()) {
    const n = [0, 0, 0];
    for (let k = 0; k < 2000; k++) { s.largeChests = 0; n[s.chestTier(o)]++; }
    for (let t = 0; t < 3; t++) assert.ok(Math.abs(n[t] / 2000 * 100 - o[t]) < 4, `row ${i} tier ${t}: ${n[t] / 20}% vs ${o[t]}`);
  }
  s.largeChests = 1; for (let k = 0; k < 200; k++) assert.notEqual(s.chestTier([0, 0, 100]), 2, 'pity: never two Large');
  const h = arena(1, { tier: 'hard' }), x = arena(1, { tier: 'expert' });
  assert.equal(h.tier.chestLarge, 10); assert.equal(x.tier.chestLarge, 20);
  let L = 0; for (let k = 0; k < 4000; k++) { x.largeChests = 0; if (x.chestTier([55, 40, 5]) === 2) L++; }
  assert.ok(Math.abs(L / 40 - 25) < 3, `Long Night #1 Large ${L / 40}%`);
});

test('chest open: walk onto it; floor always (heal 30%, XP burst, gold); Medium = 1 of 3 Blessings; Large = Blessing then 1 of 3 owned stats; pending untouched', () => {
  const s = arena(13);
  s.weapons.length = 0; s.addWeapon('ghost_wolves');
  s.player.maxHp = 100; s.player.hp = 20;
  const k = s.addPickup('chest', s.player.x + 40, s.player.y); k.tier = 2; k.ttl = Infinity;
  run(s, 0.5); assert.equal(s.chests, 0, 'not opened from 40 u (no pull)');
  assert.ok(Math.abs(k.x - (s.player.x + 40)) < 1e-6);
  const xp0 = s.xp, g0 = s.gold, need = s.xpNeeded;
  run(s, 1.2, { x: 1, y: 0 });
  assert.equal(s.chests, 1);
  assert.ok(s.player.hp >= 50 - 1e-9, 'heal 30%');
  assert.ok(s.gold - g0 >= 25);
  assert.ok(s.xp - xp0 + s.gems.reduce((a, g) => a + g.v, 0) >= Math.ceil(need * 0.5) - 1e-9 && s.gems.every((g) => g.mag), "XP burst = gems flying to her"); void xp0;
  assert.equal(s.state, 'levelup'); assert.equal(s.offer.start, 'chestBless');
  assert.equal(s.offer.cards.length, 3); for (const c of s.offer.cards) assert.equal(c.kind, 'blessing');
  const pend = s.pending;
  s.pickCard(s.offer.cards[0].key);
  assert.equal(s.offer.start, 'chestStat');
  assert.ok(s.offer.cards.length >= 1 && s.offer.cards.length <= 3);
  for (const c of s.offer.cards) { assert.equal(c.kind, 'stat'); assert.equal(c.weaponId, 'ghost_wolves'); }
  assert.equal(s.offer.gold.length, 0, 'never an evolution card');
  const c0 = s.offer.cards[0], r0 = s.weapons[0].ranks[c0.stat];
  s.pickCard(c0.key);
  assert.equal(s.weapons[0].ranks[c0.stat], r0 + 1);
  assert.equal(s.pending, pend);
  assert.equal(s.blessingsTaken, 1);
});

test('chest: Small = floor only; all Blessings capped + all stats maxed = floor only (never empty, no stuck screen)', () => {
  const s = arena(15);
  const k = s.addPickup('chest', s.player.x, s.player.y); k.tier = 0; k.ttl = Infinity;
  run(s, 1 / 30);
  assert.equal(s.chests, 1); assert.equal(s.state, 'running');
  const t = arena(16);
  t.weapons.length = 0; const w = t.addWeapon('ghost_wolves'); for (const key of Object.keys(w.ranks)) w.ranks[key] = data.balance.maxRank;
  for (const id of Object.keys(t.blessDef.items)) t.setBlessRank(id, 99);
  const k2 = t.addPickup('chest', t.player.x, t.player.y); k2.tier = 2; k2.ttl = Infinity;
  run(t, 1 / 30);
  assert.equal(t.chests, 1);
  assert.ok(t.state === 'running' || (t.offer && t.offer.cards.length > 0));
});

test('tiers: Deep Dusk +1 howl wolf; Long Night a 4th Branch-Mane at 8:20; Twilight cannot carry the knobs; forged values fall back', () => {
  assert.equal(resolveTier(data.tiers, 'cursed_forest', 'hard').miniHowl, 1);
  assert.deepEqual([...resolveTier(data.tiers, "cursed_forest", "expert").miniExtra], [500]); // 8:20 (was 8:40 in the tier sheet: 20 s from the 9:00 swarm)
  assert.deepEqual([...resolveTier(data.tiers, 'cursed_forest', 'normal').miniExtra], []);
  const bad = JSON.parse(JSON.stringify(data.tiers)); bad.template.normal.miniHowl = 1;
  assert.throws(() => validateTiers(bad));
  const bad2 = JSON.parse(JSON.stringify(data.tiers)); bad2.template.hard.miniExtra = ['x'];
  assert.throws(() => validateTiers(bad2));
  const x = arena(17, { tier: 'expert' });
  assert.deepEqual(x.miniSched.map((m) => m.t), [200, 420, 500, 690]);
  assert.equal(x.miniSched[2].hp, 1600);
  const h = arena(18, { tier: 'hard' });
  h.time = 199.99; run(h, 0.02); const m = mane(h); m.howlCd = 0; m.grace = 0; run(h, 0.7);
  assert.equal(h.enemies.filter((e) => e.calledBy === m.id).length, 5);
  assert.ok(Math.abs(m.maxHp - 700 * h.tier.enemyHp) < 1e-9);
});

test('boss arrival: a live Branch-Mane crumbles (bar clears); an unopened chest outside the Root Ring is carried inside it', () => {
  const s = arena(19, { bossAt: 840 });
  s.time = 199.99; run(s, 0.02);
  const k = s.addPickup('chest', s.player.x + 900, s.player.y); k.tier = 1; k.ttl = Infinity;
  s.time = 839.99; run(s, 0.05);
  assert.ok(s.fight);
  assert.equal(s.mini, null);
  assert.ok(!s.enemies.some((e) => e.type === 'branch_mane'));
  const c = s.pickups.find((q) => q.type === 'chest');
  assert.ok(c, 'chest kept');
  const A = s.fight.arena; assert.ok(Math.hypot(c.x - A.cx, c.y - A.cy) < A.r);
});

test('determinism: same seed, same miniboss/chest timeline', () => {
  const go = () => { const s = arena(21); s.weapons.length = 0; s.addWeapon('ghost_wolves'); s.player.hp = s.player.maxHp = 1e6; s.time = 195; run(s, 30); return JSON.stringify([s.enemies.length, s.mini && Math.round(s.mini.hp), s.nextId]); };
  assert.equal(go(), go());
});

test('render: Branch-Mane bakes amber eyes in 3 sockets, the Reliquary art is brass (never evolution gold), no external refs; lane + HUD wiring', async () => {
  const { reliquarySheet } = await import('../src/gfx/minibossview.js');
  const { HUSK_TYPES, typeSheet, layoutAtlas, socketInfo } = await import('../src/gfx/husk/frames.js');
  const S = reliquarySheet();
  assert.ok(S.svg.includes('#b98f4e'), 'brass');
  assert.ok(!/#ffd24a|#ffd700/i.test(S.svg), 'no evolution gold');
  const body = S.svg.replace('xmlns="http://www.w3.org/2000/svg"', '');
  assert.ok(!/href=|<script|<image|https?:/i.test(body), 'self-contained');
  assert.ok(S.w <= 2048 && S.h <= 256);
  assert.ok(HUSK_TYPES.branch_mane && socketInfo('branch_mane').socks.length === 3);
  const sheet = typeSheet('branch_mane', layoutAtlas()).svg;
  assert.ok(sheet.includes('#ffb84a') && !/<script|href=/i.test(sheet));
  const { readFileSync } = await import('node:fs');
  const R = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
  assert.match(R('src/gfx/enemytells.js'), /A\.kind === 'charger' \|\| A\.kind === 'alpha'/);
  assert.match(R('src/ui/hud.js'), /sim\.mini && !sim\.mini\.dead/);
  assert.match(R('src/ui/cardsui.js'), /chestBless:.*chestStat:/s);
  assert.ok(!/innerHTML/.test(R('src/gfx/minibossview.js')));
});

test('tier extra Branch-Manes also sit >= 30 s from every swarm', () => {
  for (const tid of ['hard', 'expert']) for (const t of resolveTier(data.tiers, 'cursed_forest', tid).miniExtra) for (const ev of data.chapters.cursed_forest.events) assert.ok(Math.abs(ev.t - t) >= 30, `${tid} ${t} vs ${ev.t}`);
});
