// Map events v1 'Hollow Places' (docs/design/map-events-v1.md; LOCKED 'MAP EVENTS PICKS'): Lamp Posts, Lantern Road, Hollow Knot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { Sim } from '../src/sim/Sim.js';
import { validateSites, siteSeed, KNOT_TYPE } from '../src/sim/sites.js';
import { createRng } from '../src/sim/rng.js';
import { sitesLine, SITE_TOAST } from '../src/ui/sitecopy.js';
import { arrowTargets, edgePoint } from '../src/gfx/siteview.js';
import { parseParams } from '../src/params.js';

const RAW = data.chapters.cursed_forest.sites;
const clone = () => JSON.parse(JSON.stringify(RAW));
const mk = (o = {}) => new Sim({ data, seed: 7, sites: true, godMode: true, ...o });
const site = (sim, kind, i = 0) => sim.sites.list.filter((s) => s.kind === kind)[i];
const at = (sim, x, y) => { sim.player.x = x; sim.player.y = y; };
const run = (sim, secs, input = {}) => { for (let t = 0; t < secs; t += 1 / 60) { if (sim.state === 'levelup') sim.pickCard(sim.offer.cards[0]?.key ?? sim.offer.gold[0].key); sim.step(1 / 60, input); } };
const jump = (sim, t) => { sim.time = t; }; // tests only: move the clock (wakes are read from sim.time)

test('shipped sites data validates; bad data fails closed (no sites)', () => {
  assert.ok(validateSites(RAW, data.enemies));
  const bad = [
    (d) => { delete d.sleepAt; }, (d) => { d.lamps.groups[0].kinds.push('blessing'); }, (d) => { d.lamps.groups[0].xp = 9; },
    (d) => { d.knots.born = 'nope'; }, (d) => { d.knots.leash = 100; }, (d) => { d.roads.list[0].band = 'moon'; }, (d) => { d.knots.list[1].reward.shard = 3; },
    (d) => { d.bands.far = [2000, 100]; }, (d) => { d.knots.cells = [[5, 5]]; }, (d) => { d.tiers.__proto__x = {}; }, (d) => { d.lamps = null; },
  ];
  for (const f of bad) { const d = clone(); f(d); assert.equal(validateSites(d, data.enemies), null, f.toString()); }
  for (const v of [null, 1, 'x', [], undefined]) assert.equal(validateSites(v, data.enemies), null);
  const d = clone(); d.sleepAt = 'x';
  const ch = { ...data.chapters.cursed_forest, sites: d };
  const sim = new Sim({ data: { ...data, chapters: { cursed_forest: ch } }, seed: 1, sites: true });
  assert.equal(sim.sites, null, 'a bad block = a run without sites');
});

test('sites off: no sites, the sites stream is never drawn, default is off', () => {
  const a = new Sim({ data, seed: 3 });
  assert.equal(a.sites, null);
  const b = new Sim({ data, seed: 3, sites: 'yes' });
  assert.equal(b.sites, null, 'only strict true turns them on');
  run(a, 5);
  assert.equal(a.siteRng.next(), createRng(siteSeed(3)).next(), 'siteRng untouched');
});

test('sites on but never touched: the main game is identical (own stream; nothing woken near the start)', () => {
  const a = new Sim({ data, seed: 11, godMode: true }), b = new Sim({ data, seed: 11, godMode: true, sites: true });
  for (let i = 0; i < 60 * 40; i++) { a.step(1 / 60, {}); b.step(1 / 60, {}); if (a.state === 'levelup') { a.pickCard(a.offer.cards[0].key); b.pickCard(b.offer.cards[0].key); } }
  assert.equal(a.rng.next(), b.rng.next());
  assert.equal(a.enemies.length, b.enemies.length);
  assert.equal(a.xp, b.xp); assert.equal(a.gold, b.gold); assert.equal(a.kills, b.kills);
});

test('placement: deterministic per seed, 12 lamps + 2 roads + 2 knots, edge / glade / root-patch / spacing rules (300 seeds)', () => {
  const D = validateSites(RAW, data.enemies), size = data.balance.worldSize, c = size / 2;
  for (let seed = 1; seed <= 300; seed++) {
    const sim = new Sim({ data, seed, sites: true });
    const L = sim.sites.list;
    assert.equal(L.filter((s) => s.kind === 'lamp').length, 12, `seed ${seed} lamps`);
    assert.equal(L.filter((s) => s.kind === 'road').length, 2, `seed ${seed} roads`);
    assert.equal(L.filter((s) => s.kind === 'knot').length, 2, `seed ${seed} knots`);
    const pts = [];
    for (const s of L) {
      if (s.kind === 'lamp') pts.push({ x: s.x, y: s.y, big: false });
      else if (s.kind === 'knot') for (const q of s.cands) pts.push({ x: q.x, y: q.y, big: true, cell: true });
      else for (const cand of s.cands) for (const q of cand) pts.push({ x: q.x, y: q.y, big: true });
    }
    for (const q of pts) {
      assert.ok(q.x >= D.edge && q.y >= D.edge && q.x <= size - D.edge && q.y <= size - D.edge, 'edge');
      assert.ok(Math.hypot(q.x - c, q.y - c) >= 300, 'never on the start glade');
      for (const pt of sim.patches) assert.ok(Math.hypot(q.x - pt.x, q.y - pt.y) >= pt.r + 40, 'never on a root patch');
      if (q.cell) { const i = Math.floor((q.x / size) * 3), j = Math.floor((q.y / size) * 3); assert.ok(D.knots.cells.some((k) => k[0] === i && k[1] === j), 'knot in a B zone'); }
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (!a.big || !b.big) assert.ok(d >= D.lampGap - 1e-6, `seed ${seed} lamp gap ${d}`);
    }
    if (seed <= 20) { const again = new Sim({ data, seed, sites: true }); assert.deepEqual(again.sites.list.map((s) => [s.kind, Math.round(s.x), Math.round(s.y)]), L.map((s) => [s.kind, Math.round(s.x), Math.round(s.y)])); }
  }
});

test('wake times avoid swarms (+-15 s) and Branch-Mane warnings; everything sleeps at 13:30, nothing is alive at the boss', () => {
  const D = validateSites(RAW, data.enemies), ch = data.chapters.cursed_forest;
  const wakes = [...D.lamps.groups.map((g) => g.t), ...D.roads.list.map((r) => r.t), ...D.knots.list.map((k) => k.t)];
  for (const t of wakes) {
    for (const ev of ch.events) assert.ok(Math.abs(t - ev.t) > 15, `wake ${t} vs swarm ${ev.t}`);
    for (const m of ch.minis.at) assert.ok(!(t > m - ch.minis.warn - 1 && t <= m), `wake ${t} inside the warning before ${m}`);
    assert.ok(t < D.sleepAt);
  }
  assert.ok(D.sleepAt < ch.bossAt);
  const sim = mk();
  jump(sim, 560); run(sim, 0.1);
  const k = site(sim, 'knot', 1); at(sim, k.x + 100, k.y); run(sim, 0.2);
  assert.equal(k.state, 'fight');
  jump(sim, D.sleepAt); run(sim, 0.1);
  assert.ok(sim.sites.list.every((s) => s.state === 'done' || s.state === 'gone' || s.state === 'failed'), 'all asleep');
  assert.ok(!sim.enemies.some((e) => e.knot && !e.dead), 'no knot alive');
  assert.ok(sim.events.some((e) => e.type === 'sitesSleep'));
});

test('lamp: shows its reward before you go; touching it pays exactly that (xp gems / gold / heal), once', () => {
  const sim = mk({ godMode: false });
  jump(sim, 40); run(sim, 0.05);
  const lamps = sim.sites.list.filter((s) => s.kind === 'lamp' && s.state === 'awake');
  assert.equal(lamps.length, 4);
  assert.deepEqual(lamps.map((s) => s.reward).sort(), ['gold', 'heart', 'xp', 'xp']);
  const gold = lamps.find((s) => s.reward === 'gold'), g0 = sim.gold;
  at(sim, gold.x, gold.y); run(sim, 0.05);
  assert.equal(gold.state, 'done'); assert.equal(sim.gold - g0, 10);
  at(sim, gold.x, gold.y); run(sim, 0.05); assert.equal(sim.gold - g0, 10, 'once');
  const heart = lamps.find((s) => s.reward === 'heart'); sim.player.hp = 40;
  at(sim, heart.x, heart.y); run(sim, 0.02);
  assert.ok(Math.abs(sim.player.hp - (40 + sim.player.maxHp * 0.2)) < 1e-6);
  const xp = lamps.find((s) => s.reward === 'xp'), n0 = sim.gems.length;
  at(sim, xp.x, xp.y); run(sim, 0.02);
  assert.equal(sim.gems.length - n0, 3);
  assert.ok(sim.events.some((e) => e.type === 'lampLit' && e.reward === 'xp'));
});

test('Long Night: lamp heal x0.75 and a faster pulse; Twilight = the base values', () => {
  const tw = mk(), ln = mk({ tier: 'expert' });
  assert.equal(tw.sites.tk.healMul, 1); assert.equal(tw.sites.tk.pulseEvery, 6);
  assert.equal(ln.sites.tk.healMul, 0.75); assert.equal(ln.sites.tk.pulseEvery, 5); assert.equal(ln.sites.tk.spawnMul, 1.25);
  assert.equal(mk({ tier: 'hard' }).sites.tk.pulseEvery, 5);
});

test('road: first touch starts the timer; each lantern pays; all three = magnet + gold + XP; no retry after a fail', () => {
  const sim = mk();
  jump(sim, 130); run(sim, 0.05);
  const r = site(sim, 'road', 0); assert.equal(r.state, 'awake');
  const g0 = sim.gold;
  at(sim, r.lanterns[0].x, r.lanterns[0].y); run(sim, 0.05);
  assert.equal(r.state, 'active'); assert.equal(r.lit, 1); assert.equal(sim.gold - g0, 5);
  assert.ok(r.left > 89 && r.left <= 90);
  at(sim, r.lanterns[2].x, r.lanterns[2].y); run(sim, 0.05);
  for (const g of sim.gems) g.mag = false;
  at(sim, r.lanterns[1].x, r.lanterns[1].y); run(sim, 0.02);
  assert.equal(r.state, 'done'); assert.equal(sim.gold - g0, 15 + 25);
  assert.ok(sim.gems.filter((g) => !g.hold).every((g) => g.mag), 'magnet pulse');
  const f = mk(); jump(f, 130); run(f, 0.05);
  const r2 = site(f, 'road', 0); at(f, r2.lanterns[0].x, r2.lanterns[0].y); run(f, 0.05);
  const gf = f.gold; at(f, 2000, 2000); run(f, 91);
  assert.equal(r2.state, 'failed'); assert.ok(f.events.some((e) => e.type === 'roadFail'));
  assert.ok(f.gold >= gf, 'lit lantern rewards kept');
  at(f, r2.lanterns[1].x, r2.lanterns[1].y); run(f, 0.05); assert.equal(r2.lit, 1, 'no retry');
});

test('road 1 set prize is a Blessing choice (Blessing cards only); floor when none can be offered; road 2 pays a bigger non-Blessing prize', () => {
  const sim = mk(); jump(sim, 130); run(sim, 0.05);
  const r = site(sim, 'road', 0); assert.equal(r.state, 'awake');
  for (const L of r.lanterns) { at(sim, L.x, L.y); sim.step(1 / 60, {}); }
  assert.equal(r.state, 'done');
  assert.equal(sim.state, 'levelup'); assert.equal(sim.offer.start, 'siteBless');
  assert.ok(sim.offer.cards.length > 0 && sim.offer.cards.every((c) => c.kind === 'blessing'));
  assert.equal(sim.sites.paid.bless, 1);
  const nb = new Sim({ data: { ...data, blessings: undefined }, seed: 7, sites: true, godMode: true });
  jump(nb, 130); run(nb, 0.05);
  const r3 = site(nb, 'road', 0), g0 = nb.gold;
  for (const L of r3.lanterns) { at(nb, L.x, L.y); nb.step(1 / 60, {}); }
  assert.equal(nb.state, 'running'); assert.equal(nb.gold - g0, 3 * 5 + 25 + 25, 'floor: +25 gold (and half a level of XP)');
  const s2 = mk(); jump(s2, 480); run(s2, 0.05);
  const r2 = site(s2, 'road', 1), g2 = s2.gold;
  for (const L of r2.lanterns) { at(s2, L.x, L.y); s2.step(1 / 60, {}); }
  assert.equal(r2.state, 'done'); assert.equal(s2.state, 'running'); assert.equal(s2.sites.paid.bless, 0);
  assert.equal(s2.gold - g2, 3 * 8 + 60); assert.equal(s2.sites.paid.magnet, 1);
});

test('knot: wakes near, a still target in sim.enemies (never recycled / shoved / counted), pulse tell then one hit, leash heals it back', () => {
  const sim = mk({ godMode: false });
  jump(sim, 330); run(sim, 0.05);
  const k = site(sim, 'knot', 0); assert.equal(k.state, 'awake');
  at(sim, k.x + 300, k.y); run(sim, 0.05); assert.equal(k.state, 'awake', 'not yet: wake radius 260');
  at(sim, k.x + 200, k.y); run(sim, 0.05);
  assert.equal(k.state, 'fight');
  const foe = sim.enemies.find((e) => e.knot === k.id);
  assert.ok(foe && foe.type === KNOT_TYPE && foe.speed === 0 && foe.dmg === 0 && foe.vanish);
  assert.equal(foe.maxHp, 900);
  run(sim, 4);
  assert.ok(Math.abs(foe.x - k.x) < 1e-9 && Math.abs(foe.y - k.y) < 1e-9, 'never moves');
  assert.ok(sim.enemies.some((e) => e.knotBorn === k.id), 'knot-born crawlers');
  // pulse: stand inside, wait for the tell, take exactly one hit
  sim.player.hp = sim.player.maxHp; at(sim, k.x + 40, k.y);
  for (const e of sim.enemies) if (!e.knot) e.dead = true;
  k.pulseT = 0.01; k.tell = 0; sim.step(1 / 60, {});
  assert.ok(k.tell > 0.7);
  const hp0 = sim.player.hp; sim.player.iframes = 0;
  for (let i = 0; i < 60 && k.tell > 0; i++) { for (const e of sim.enemies) if (!e.knot) e.dead = true; sim.step(1 / 60, {}); }
  assert.ok(sim.player.hp < hp0, 'the pulse hit');
  assert.ok(sim.hurtBy.knot > 0);
  // leash: walk away past 420; it heals to full over 10 s, then sleeps again
  foe.hp = foe.maxHp * 0.5; at(sim, k.x + 600, k.y); run(sim, 0.05);
  assert.equal(k.state, 'calm');
  run(sim, 10.2);
  assert.equal(k.state, 'awake'); assert.ok(foe.dead, 'the old target is gone'); assert.ok(!sim.enemies.some((e) => e.knot && !e.dead));
});

test('knot spawns: cap 14 alive, paused while the map is crowded', () => {
  const sim = mk(); jump(sim, 330); run(sim, 0.05);
  const k = site(sim, 'knot', 0); at(sim, k.x + 200, k.y); run(sim, 0.05);
  for (let i = 0; i < 40; i++) { k.spawnT = 0; sim.sites.stepKnot(k, sim.player, 1 / 60); }
  assert.equal(sim.enemies.filter((e) => e.knotBorn === k.id && !e.dead).length, 14);
  const born = sim.enemies.filter((e) => e.knotBorn === k.id); for (const e of born) e.dead = true; sim.cleanupDead();
  while (sim.enemies.length <= 200) sim.spawnEnemy('crow', 10, 10);
  k.spawnT = 0; sim.sites.stepKnot(k, sim.player, 1 / 60);
  assert.equal(sim.enemies.filter((e) => e.knotBorn === k.id && !e.dead).length, 0, 'paused above 200 foes');
});

test('first knot: Blessing choice + heart; far knot: bigger prize + at most one soul shard per run, no Blessing', () => {
  const sim = mk();
  jump(sim, 330); run(sim, 0.05);
  const k0 = site(sim, 'knot', 0); at(sim, k0.x + 200, k0.y); run(sim, 0.05);
  const f0 = sim.enemies.find((e) => e.knot === k0.id); f0.hp = 0; f0.dead = true; sim.step(1 / 60, {});
  assert.equal(k0.state, 'done'); assert.ok(sim.pickups.some((p) => p.type === 'heart'));
  assert.equal(sim.shards, 0);
  assert.equal(sim.state, 'levelup'); assert.equal(sim.offer.start, 'siteBless');
  sim.state = 'running'; sim.offer = null;
  jump(sim, 560); run(sim, 0.05);
  const k1 = site(sim, 'knot', 1); at(sim, k1.x + 200, k1.y); run(sim, 0.05);
  const f1 = sim.enemies.find((e) => e.knot === k1.id); f1.dead = true; sim.step(1 / 60, {});
  assert.equal(k1.state, 'done'); assert.equal(sim.shards, 1); assert.equal(sim.sites.paid.shard, 1);
  assert.equal(sim.sites.paid.bless, 1, 'only the first knot offered a Blessing');
  sim.sites.paid.shard = 1; k1.state = 'fight'; k1.foe = { dead: true }; sim.state = 'running'; sim.sites.stepKnot(k1, sim.player, 0.01);
  assert.equal(sim.shards, 1, 'never a second shard');
  const r = sim.result(); assert.equal(r.sites.knot[0], 2); assert.equal(r.shards, 1);
});

test('Gentle Light softens the root pulse like every foe hit', () => {
  const hit = (assist) => {
    const sim = mk({ godMode: false, assist }); jump(sim, 330); run(sim, 0.05);
    const k = site(sim, 'knot', 0); at(sim, k.x + 200, k.y); run(sim, 0.05); at(sim, k.x + 30, k.y);
    for (const e of sim.enemies) if (!e.knot) e.dead = true;
    k.pulseT = 0; k.tell = 0.001; sim.player.iframes = 0; const hp0 = sim.player.hp; sim.sites.stepKnot(k, sim.player, 0.01);
    return hp0 - sim.player.hp;
  };
  const base = hit(false), soft = hit(true);
  assert.ok(base > 0 && Math.abs(soft / base - data.tiers.template.normal.assist.enemyDmg) < 1e-9);
});

test('nothing wakes in Endless Dusk or during the boss fight', () => {
  const sim = mk(); jump(sim, 845); run(sim, 0.1);
  assert.ok(sim.sites.slept);
  assert.ok(sim.sites.list.every((s) => s.state === 'gone'));
});

test('results line + toasts: plain text, hostile input inert', () => {
  assert.equal(sitesLine({ lamp: [6, 12], road: [2, 2], knot: [1, 2] }), 'Hollow Places restored: 9 of 16 (lamps 6/12, roads 2/2, knots 1/2)');
  assert.equal(sitesLine(null), null);
  assert.equal(sitesLine({ lamp: ['<b>', 1e99], road: 'x' }).includes('<'), false);
  assert.equal(SITE_TOAST.lampLit({ reward: 'gold', amt: '<img>' }), 'Lamp lit: +0 gold');
  for (const f of ['src/gfx/siteview.js', 'src/ui/sitecopy.js', 'src/sim/sites.js']) assert.equal(/innerHTML|eval\(|new Function/.test(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')), false, f);
});

test('edge arrows: max 2 (active first), hidden on screen, the point stays outside the HUD bands', () => {
  const sim = mk(); jump(sim, 130); run(sim, 0.05);
  const view = { x0: 1700, y0: 1830, x1: 2300, y1: 2170 };
  const list = arrowTargets(sim.sites, sim.player, view);
  assert.ok(list.length >= 1 && list.length <= 2);
  const on = { x0: 0, y0: 0, x1: 4000, y1: 4000 };
  assert.equal(arrowTargets(sim.sites, sim.player, on).length, 0, 'all on screen: no arrows');
  for (const t of [{ x: 4000, y: 2000 }, { x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 4000 }, { x: 2000, y: 2000.001 }]) {
    const e = edgePoint({ x: 2000, y: 2000 }, t, view), h = view.y1 - view.y0;
    assert.ok(e.x >= view.x0 && e.x <= view.x1, 'inside x');
    assert.ok(e.y >= view.y0 + h * 0.16 && e.y <= view.y1 - h * 0.14 && e.y >= view.y0 + h * 0.22, 'outside the HUD bands');
  }
  const behind = edgePoint({ x: 2600, y: 2000 }, { x: 1000, y: 2000 }, view); // hero outside the box (camera lead): clamped first, no jump
  assert.ok(behind.x <= view.x1 && behind.x >= view.x0);
});

test('?sites=0 is the only off switch (a debug run); default on', () => {
  assert.equal(parseParams('').sites, true);
  assert.equal(parseParams('?sites=0').sites, false);
  assert.equal(parseParams('?sites=<x>').sites, true);
});

test('maxed-card fallback: soul-shard card replaces the XP card, max 2 per run, never past the cap', async () => {
  const { fallbackCard, drawNormalCards } = await import('../src/sim/cards.js');
  assert.equal(data.balance.fallback.xp, undefined); assert.equal(data.balance.fallback.shard.name, 'Soul Shard');
  const sim = new Sim({ data, seed: 3, godMode: true });
  const take = () => { sim.state = 'levelup'; sim.offer = { cards: [fallbackCard('shard', data)], gold: [] }; sim.pickCard(sim.offer.cards[0].key); };
  take(); take(); take();
  assert.equal(sim.shards, 2); assert.equal(sim.fallbackShards, 2);
  const ctx = { ...sim.cardCtx, weapons: [] };
  const rng = sim.rng;
  assert.ok(!drawNormalCards({ ...ctx, fallbackShards: 2 }, rng, 3).some((c) => c.fallback === 'shard'));
});
