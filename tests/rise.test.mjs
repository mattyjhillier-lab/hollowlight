// DM7: Lucinda's ability OPHIMBER'S RISE (docs/design/fire-weapon-lucinda-v2.md s5, LOCKED 2026-11-01) + her hidden hero entry + the rise art.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/Sim.js';
import { riseDef, startRise, updateRise, RISE_HARD } from '../src/sim/rise.js';
import { RiseLayer, riseCaps, ringLook, petPose, bakeAtlas, ATLAS_W, ATLAS_H, RING_R, RISE_VISUALS } from '../src/gfx/risefx.js';
import { ABILITY_RESERVE } from '../src/gfx/meteorfx.js';
import { starterPool } from '../src/meta/starter.js';
import { EVENT_CUE, MORE_CUES } from '../src/audio/cues.js';
import { CUES } from '../src/audio/engine.js';
import { data } from './helpers.mjs';
import { sanitize } from '../src/save/schema.js';

const DT = 1 / 60, HID = 'hearthwarden';
const HIT = data.hiddenCharacters[HID].ability.hit; // the ignition multiplier is tuned by the sweeps (data only), so the tests read it
const dd = { ...data, enemies: { ...data.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } } };
const mk = (opts = {}) => {
  const sim = new Sim({ data: dd, characterId: HID, seed: 5, godMode: true, ...opts });
  sim.chapter = { ...sim.chapter, waves: [], events: [], bossAt: 1e9 }; sim.spawnAcc = [];
  sim.weapons.length = 0; sim.rollDrops = () => {};
  return sim;
};
const put = (sim, dx, dy, r = 8, boss = false) => { const e = sim.spawnEnemy('dummy', sim.player.x + dx, sim.player.y + dy); e.hp = e.maxHp = 1e9; e.r = r; e.speed = 0; if (boss) e.boss = true; return e; };
const run = (sim, secs, input = {}) => { for (let i = 0; i < Math.round(secs / DT); i++) sim.step(DT, input); };
const cast = (sim) => { sim.ability.cdLeft = 0; sim.step(DT, { ability: true }); };
const dmg = (sim) => sim.dmgBy.ophimbers_rise || 0;

test('hero data: Lucinda is a hidden (unreleased) hero, never in data.characters, the starter pool or any player path', () => {
  const raw = JSON.parse(readFileSync(new URL('../src/data/characters.json', import.meta.url), 'utf8'));
  const h = raw[HID];
  assert.equal(h.name.split(',')[0], 'Lucinda'); assert.equal(h.pet, 'Ophimber'); assert.equal(h.unreleased, true); assert.equal(h.placeholder, true, 'Lucinda and Ophimber art are placeholders until Matt picks the looks'); assert.equal(h.kindred, 'dragonfire_meteor');
  assert.equal(h.ability.id, 'ophimbers_rise'); assert.equal(h.ability.name, "Ophimber's Rise"); assert.equal(h.ability.cooldown, 60);
  assert.ok(!Object.hasOwn(data.characters, HID) && Object.hasOwn(data.hiddenCharacters, HID), 'the loader (and the test helper) split her out');
  const idx = readFileSync(new URL('../src/data/index.js', import.meta.url), 'utf8');
  assert.ok(/unreleased === true \? hiddenCharacters : characters/.test(idx), 'src/data/index.js does the same split');
  assert.ok(!starterPool(data).heroes.includes(HID) && !starterPool({ ...data, balance: { ...data.balance, starter: { heroes: ['*'], weapons: ['*'] } } }).heroes.includes(HID));
  assert.ok(!JSON.stringify(data.tree).includes(HID), 'no tree node, hero region or starter list names her');
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8'), main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.ok(/Object\.hasOwn\(data\.characters, characterId\)/.test(app) && /Object\.hasOwn\(app\.data\.characters, app\.params\.auto\)/.test(main), 'startRun and ?auto= only accept ids in data.characters');
  for (const p of ['keen', 'quick', 'wise', 'warm', 'bright']) assert.equal(typeof h.bondPerks[p], 'string');
  assert.equal(Object.hasOwn(h, 'keepsake'), false, 'no keepsake/tree hook until DM8');
});

test('sim: only the sim resolves her (hidden) id; an unknown id still falls back to a TypeError-free path for released heroes', () => {
  const s = new Sim({ data, characterId: HID, seed: 1 });
  assert.equal(s.character.ability.id, 'ophimbers_rise'); assert.equal(s.ability.id, 'ophimbers_rise');
  assert.equal(new Sim({ data, characterId: 'wren', seed: 1 }).rise, null);
  assert.throws(() => new Sim({ data, characterId: '__proto__', seed: 1 }));
});

test('timeline: rings at 48 / 88 / 128 ignite at 0.4 / 1.1 / 1.8 s, each burns 3 s after its sweep, ring 3 ends ~5.35 s, centre fixed', () => {
  const sim = mk(); const x0 = sim.player.x, y0 = sim.player.y;
  const ev = [];
  cast(sim);
  assert.ok(sim.rise && sim.rise.x === x0 && sim.rise.y === y0);
  assert.deepEqual(sim.rise.rings.map((q) => q.r), [48, 88, 128]); assert.deepEqual(sim.rise.rings.map((q) => q.at), [0.4, 1.1, 1.8]);
  assert.ok(Math.abs(sim.rise.rings[2].end - 5.35) < 1e-9, 'ring 3 ends 1.8 + 0.55 + 3');
  assert.equal(sim.rise.D.band, 20);
  const lit = [];
  for (let i = 0; i < 6.5 / DT; i++) {
    sim.step(DT, { x: 1, y: 0 }); // she keeps moving: the rings do not follow
    for (const e of sim.events) if (e.type === 'riseRing') lit.push([e.i, +sim.rise?.t.toFixed(2)]);
    sim.events.length = 0;
    if (!sim.rise) break;
  }
  assert.equal(lit.length, 3); assert.deepEqual(lit.map((l) => l[0]), [0, 1, 2]);
  assert.ok(Math.abs(lit[0][1] - 0.4) < 0.05 && Math.abs(lit[1][1] - 1.1) < 0.05 && Math.abs(lit[2][1] - 1.8) < 0.05, JSON.stringify(lit));
  assert.ok(sim.player.x > x0 + 50, 'she moved on');
  assert.equal(sim.rise, null, 'the effect ends (rings burn out, the object is dropped)');
  assert.equal(sim.abilityUses, 1); assert.equal(sim.abilityCooldown, 60);
});

test('events: rise once, riseRing x3 with the fixed centre; a second cast replaces nothing while on cooldown', () => {
  const sim = mk(); cast(sim); const n = sim.events.filter((e) => e.type === 'rise').length;
  assert.equal(n, 1);
  assert.equal(sim.useAbility(), false, 'on cooldown (60 s)');
  run(sim, 6); assert.equal(sim.events.filter((e) => e.type === 'riseRing').length, 3);
});

test('damage: a foe in ring 2 is untouched until 1.1 s, then takes the ignition (HIT x B) first; the ring is offence only (no heal, no slow, she is never hurt)', () => {
  const sim = mk(); sim.player.hp = 50; const e = put(sim, 88, 0), near = put(sim, 0, 18), far = put(sim, 200, 0);
  cast(sim);
  const hp0 = sim.player.hp;
  run(sim, 1.05); assert.equal(e.hp, 1e9, 'ring 2 has not lit');
  run(sim, 0.3);
  const B = 14, ign = B * HIT;
  assert.ok(1e9 - e.hp >= ign - 1e-6, 'ignition hit landed: ' + (1e9 - e.hp));
  run(sim, 6);
  assert.equal(near.hp, 1e9, 'a foe between the rings and one beyond ring 3 are untouched'); assert.equal(far.hp, 1e9);
  assert.equal(sim.player.hp, hp0, 'no heal, no self-hurt'); assert.equal(e.speed, 0);
  assert.ok(sim.zones.length === 0, 'it makes no slow zone');
});

test('sweep: the ignition reaches foes clockwise from the top over the sweep time', () => {
  const sim = mk(); const top = put(sim, 0, -48), left = put(sim, -48, 0); // clockwise from up: top first, left at 3/4 of the sweep
  cast(sim); run(sim, 0.4 + 0.1);
  assert.ok(top.hp < 1e9 && left.hp === 1e9, 'top hit, left not yet');
  run(sim, 0.4); assert.ok(left.hp < 1e9);
});

test('ticks: ground burns every 0.5 s for 3 s (6 ticks at 0.5 x ignition, 1.1 B) + Burn; one tick per foe per 0.5 s across overlapping rings', () => {
  const sim = mk(); const e = put(sim, 48, 0), big = put(sim, 68, 0, 28); // `big` stands in the bands of ring 1 AND ring 2 (radius 28 widens both)
  const logs = new Map(); const o = sim.hurt.bind(sim);
  sim.hurt = (t, a, x) => { const r = o(t, a, x); if (sim._src === 'ophimbers_rise' && r > 0) (logs.get(t) || logs.set(t, []).get(t)).push({ a: r, t: sim.time, silent: !!(x && x.silent) }); return r; };
  cast(sim); run(sim, 6);
  const L = logs.get(e);
  const ign = L.filter((l) => !l.silent), ticks = L.filter((l) => l.silent && Math.abs(l.a - 14 * HIT * 0.5) < 1e-6); // (Burn damage-over-time also arrives silent, in small slices)
  assert.equal(ign.length, 1); assert.ok(Math.abs(ign[0].a - 14 * HIT) < 1e-6);
  assert.ok(ticks.length >= 5 && ticks.length <= 7, 'ticks ' + ticks.length);
  for (const t of ticks) assert.ok(Math.abs(t.a - 14 * HIT * 0.5) < 1e-6);
  const times = logs.get(big).filter((l) => !l.silent || Math.abs(l.a - 14 * HIT * 0.5) < 1e-6).map((l) => l.t);
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 0.5 - 1e-6, 'lockout: ' + (times[i] - times[i - 1]));
  assert.ok(sim.burnBy.ophimbers_rise > 0, 'Burn credited to the ability');
  assert.ok(e.burnDps === 0 || e.burnT <= 2 + 1e-9, 'one burn instance, 2 s');
});

test('boss takes 0.5 x; B scales 14 + 0.6 x hero level, capped at level 20 (14..26)', () => {
  const a = mk(), b = mk();
  const ea = put(a, 48, 0), eb = put(b, 48, 0, 8, true);
  cast(a); cast(b); run(a, 0.6); run(b, 0.6);
  assert.ok(Math.abs((1e9 - eb.hp) / (1e9 - ea.hp) - 0.5) < 1e-6, 'boss 0.5 x');
  const lv = (n) => { const s = mk({ bond: n }); cast(s); return s.rise.B; };
  assert.equal(lv(0), 14); assert.ok(Math.abs(lv(10) - 20) < 1e-9); assert.ok(Math.abs(lv(20) - 26) < 1e-9); assert.ok(Math.abs(lv(99) - 26) < 1e-9, 'capped at level 20');
});

test('caps: at most 40 ignition targets per ring; 300 foes in the band do not blow the work; deterministic (two runs identical)', () => {
  const go = () => {
    const sim = mk();
    for (let i = 0; i < 300; i++) { const a = i * 0.3; put(sim, Math.sin(a) * 48, -Math.cos(a) * 48); }
    cast(sim); run(sim, 7);
    return { d: dmg(sim), hits: sim.rise ? 0 : 1, hp: sim.enemies.map((e) => e.hp).join(',') };
  };
  const r1 = go(), r2 = go();
  assert.deepEqual(r1, r2);
  const sim = mk(); for (let i = 0; i < 300; i++) { const a = i * 0.3; put(sim, Math.sin(a) * 48, -Math.cos(a) * 48); }
  let ign = 0, tickN = 0; const o = sim.hurt.bind(sim);
  sim.hurt = (t, a, x) => { const r = o(t, a, x); if (sim._src === 'ophimbers_rise' && r > 0) { if (!(x && x.silent)) ign++; else if (Math.abs(r - 14 * HIT * 0.5) < 1e-6) tickN++; } return r; };
  cast(sim); run(sim, 0.7); // ring 1 only (ring 2 lights at 1.1 s)
  assert.ok(ign > 0 && ign <= RISE_HARD.maxHits, 'ring 1 ignites at most ' + RISE_HARD.maxHits + ': ' + ign);
  assert.ok(tickN <= RISE_HARD.maxHits * 3, 'ground ticks stay capped per tick: ' + tickN);
});

test('hostile input: forged ability data is clamped; NaN foes are skipped; no throw', () => {
  const evil = { id: 'ophimbers_rise', rise: NaN, rings: Array.from({ length: 50 }, () => ({ r: 1e9, at: -5, sweep: 0 })), band: 1e9, burnSecs: Infinity, hit: 1e9, tickK: -1, tick: 0, bossK: 9, base: -9e9, perLevel: 'x', burnTime: 1e9, burnRate: 9, previewT: 99, settle: -1 };
  const D = riseDef(evil);
  assert.equal(D.rings.length, 3);
  for (const q of D.rings) { assert.ok(q.r <= RISE_HARD.maxR && q.r >= RISE_HARD.minR && q.at >= 0 && q.sweep >= 0.1); }
  assert.ok(D.band <= RISE_HARD.bandHi && D.burnSecs <= 4 && D.tick >= 0.25 && D.bossK <= 1 && D.base >= 0 && D.burnRate <= 0.5 && D.previewT <= 1);
  for (const junk of [null, undefined, 'x', 5, [], { rings: 'no' }]) assert.equal(riseDef(junk).rings.length, 3);
  const sim = mk(); sim.character = { ...sim.character, ability: { ...sim.character.ability, ...evil } }; // (a copy: never touch the shared data)
  const e = put(sim, 48, 0); const bad = put(sim, 10, 0); bad.x = NaN;
  assert.doesNotThrow(() => { cast(sim); run(sim, 8); });
  assert.ok(Number.isFinite(e.hp) && bad.hp === 1e9);
  const s2 = mk(); s2.player.x = NaN; assert.equal(startRise(s2, s2.character.ability), null);
  const s3 = mk(); s3.bondLevel = -4; cast(s3); assert.equal(s3.rise.B, 14); const s4 = mk(); s4.bondLevel = 2.5; cast(s4); assert.equal(s4.rise.B, 14);
  assert.doesNotThrow(() => updateRise({ rise: null }, DT)); assert.doesNotThrow(() => updateRise(mk(), NaN));
});

test('tree hook: the ability-duration node lengthens how long each ring burns, inside its cap', () => {
  const a = mk(), b = mk(); b.tfx.abilityDur = 1.5; const c = mk(); c.tfx.abilityDur = 99;
  cast(a); cast(b); cast(c);
  assert.equal(a.rise.burn, 3); assert.equal(b.rise.burn, 4.5 > 4 ? 4.5 : 4.5); assert.ok(c.rise.burn <= RISE_HARD.burnHi);
});

test('existing content untouched: a Wren / Elias run never allocates a rise; the new sim files are not loaded by it', () => {
  for (const id of ['wren', 'elias']) {
    const s = new Sim({ data, characterId: id, seed: 3, godMode: true }); run(s, 20, { ability: true });
    assert.equal(s.rise, null); assert.equal(s.dmgBy.ophimbers_rise, undefined);
  }
});

// ---- art
function stub() {
  const made = [];
  const px = new Proxy(function () {}, { get: (t, k) => (k === 'then' ? undefined : px), apply: () => px });
  const tex = { frames: {}, getContext: () => px, add(n) { this.frames[n] = 1; }, refresh() {}, setFilter() {} };
  const mkI = () => { const im = { vis: true, a: 1, setFrame() { return im; }, setPosition() { return im; }, setDepth() { return im; }, setScale() { return im; }, setAlpha(a) { im.a = a; return im; }, setRotation() { return im; }, setVisible(v) { im.vis = v; return im; }, setBlendMode() { return im; }, setOrigin() { return im; }, setTint() { return im; }, clearTint() { return im; } }; made.push(im); return im; };
  return { made, scene: { textures: { exists: () => !!tex.baked, get: () => tex, createCanvas: () => { tex.baked = true; return tex; } }, add: { image: mkI } } };
}
const GL = { ADD: 1, NORMAL: 0, LINEAR: 0, depthGround: 54000, depthLit: 60000, depthFx: 100000 };
const SIMR = (t) => { const sim = { time: t, player: { x: 0, y: 0 } }; const D = riseDef(); sim.rise = { x: 0, y: 0, t, D, B: 14, n: 0, rings: D.rings.map((q) => ({ ...q, end: q.at + q.sweep + 3 })) }; return sim; };
const ctx = (sim, tier = 'high', over = {}) => { const sparks = [], lights = []; return { sparks, lights, c: { sim, tier, phone: false, calm: false, lm: { add: (...a) => lights.push(a) }, parts: { emit: (...a) => sparks.push(a) }, shake: () => {}, vx0: -400, vy0: -300, vx1: 400, vy1: 300, ...over } }; };

test('art: look timeline (dotted preview 0.25 s before ignition, sweep, burn, fade-out) and Ophimber pose', () => {
  const q = { r: 48, at: 0.4, sweep: 0.35, end: 3.75 };
  assert.equal(ringLook(q, 0.1).phase, 'idle'); assert.equal(ringLook(q, 0.16).phase, 'preview'); assert.ok(ringLook(q, 0.2).pre > 0.3 && ringLook(q, 0.39).pre > 0.9);
  assert.equal(ringLook(q, 0.5).phase, 'sweep'); assert.ok(ringLook(q, 0.5).a > 0.3 && ringLook(q, 0.5).a < 1); assert.equal(ringLook(q, 0.9).phase, 'burn'); assert.equal(ringLook(q, 0.9).a, 1);
  assert.equal(ringLook(q, 3.4).phase, 'out'); assert.ok(ringLook(q, 3.4).a < 1 && ringLook(q, 3.4).a > 0); assert.equal(ringLook(q, 3.8).a, 0);
  assert.ok(ringLook(q, 0.5, 0.25, true).a < ringLook(q, 0.5).a + 1e-9 && Math.abs(ringLook(q, 0.4 + 0.3, 0.25, true).a - 1) < 0.2, 'Calm fades in over 0.3 s');
  assert.equal(ringLook(null, 1).phase, 'idle'); assert.equal(ringLook(q, NaN).phase, 'idle');
  const D = { rise: 0.4, settle: 2.4 };
  assert.equal(petPose(0, D).lift, 0); assert.ok(Math.abs(petPose(0.4, D).lift - 26) < 1e-9); assert.ok(petPose(1, D).a === 1); assert.ok(petPose(3.3, D).a < 0.05);
  assert.equal(petPose(1, D, true).wing, 0); assert.equal(petPose(1, D, true).bob, 0);
});

test('art: quality caps (High >= Med >= Low; Low flat with no sparks or lights; Calm nothing moves alone); flame budget = 3 ring visuals', () => {
  const h = riseCaps('high'), m = riseCaps('med'), l = riseCaps('low');
  for (const k of ['sparks', 'lights']) assert.ok(h[k] >= m[k] && m[k] >= l[k], k);
  assert.ok(l.flat && !l.add && !l.flicker && !l.head && l.sparks === 0 && l.lights === 0); assert.equal(h.sparks, 2);
  for (const t of ['high', 'med', 'low']) { const c = riseCaps(t, false, true); assert.ok(c.calm && !c.flicker && !c.head && c.sparks === 0, t); }
  assert.ok(riseCaps('high', true).sparks >= 1 && riseCaps('high', true).lights < h.lights);
  assert.equal(RISE_VISUALS, 3); assert.equal(RISE_VISUALS, ABILITY_RESERVE); assert.equal(RING_R.length, 3);
});

test('art: the atlas bakes with finite numbers only and every frame fits the sheet', () => {
  const calls = []; let bad = 0;
  const px = new Proxy(function () {}, { get: (t, k) => { if (k === 'then') return undefined; return (...a) => { calls.push(k); for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) bad++; return px; }; }, set: () => true });
  bakeAtlas(px);
  assert.equal(bad, 0); assert.ok(calls.length > 200);
  assert.ok(ATLAS_W <= 2048 && ATLAS_H <= 2048);
});

test('layer: nothing baked or drawn without a rise; <= 8 sprites; dotted preview shows before ring 1; Low is flat; Calm has no sparks; hostile values do not throw', () => {
  const { scene, made } = stub(); const L = new RiseLayer(scene, GL);
  const none = ctx({ time: 1, player: { x: 0, y: 0 }, rise: null }); L.update(none.c); assert.equal(made.length, 0); assert.equal(L.active, false);
  const k = ctx(SIMR(0.2)); L.update(k.c); assert.equal(L.active, true); assert.ok(L.sprites >= 2 && L.sprites <= 8, 'preview + pet: ' + L.sprites);
  const kk = ctx(SIMR(1.0)); L.update(kk.c); assert.ok(L.sprites >= 3 && L.sprites <= 8, 'sprites ' + L.sprites);
  const kb = ctx(SIMR(2.4)); L.update(kb.c); assert.ok(L.sprites <= 8, 'all three rings burning: ' + L.sprites + ' (3 bands + pet + glows)');
  assert.ok(kb.lights.length > 0 && kb.lights.length <= 3 * 8 + 1, 'lights ' + kb.lights.length);
  const lo = new RiseLayer(stub().scene, GL), kl = ctx(SIMR(2.4), 'low', { lm: null }); lo.update(kl.c); assert.ok(lo.sprites <= 4, 'Low: 3 flat bands + pet = ' + lo.sprites); assert.equal(kl.sparks.length, 0);
  const cl = new RiseLayer(stub().scene, GL), kc = ctx(SIMR(0.55), 'high', { calm: true }); cl.update(kc.c); assert.equal(kc.sparks.length, 0);
  const hi = new RiseLayer(stub().scene, GL), kh = ctx(SIMR(0.55)); hi.update(kh.c); assert.ok(kh.sparks.length >= 2, 'High: head sparks while sweeping');
  const ev = new RiseLayer(stub().scene, GL), ke = ctx({ time: 1, player: { x: NaN, y: Infinity }, rise: { x: 1e9, y: NaN, t: NaN, D: {}, rings: [{ r: NaN, at: 0, sweep: 0, end: 9 }] } });
  assert.doesNotThrow(() => ev.update(ke.c));
  L.update(none.c); assert.equal(L.sprites, 0, 'rise over: everything hidden');
});

test('cues: rise_call + rise_ring registered and mapped; quiet, no duck', () => {
  assert.equal(EVENT_CUE.rise, 'rise_call'); assert.equal(EVENT_CUE.riseRing, 'rise_ring');
  assert.ok(CUES.rise_call && CUES.rise_ring); assert.ok(MORE_CUES.rise_ring.pri === 1 && MORE_CUES.rise_call.cap === 1);
});

test('hostile save: a forged save that names Lucinda as awake, starter or last loadout is cleaned (she can never be started from storage)', () => {
  const s = sanitize({ version: 3, chars: { [HID]: { woke: true }, wren: { woke: true } }, notes: { loadout: { hero: HID, weapon: 'ghost_wolves' }, starter: { hero: HID, weapon: 'ghost_wolves' } } });
  assert.ok(!Object.hasOwn(s.chars, HID) && Object.hasOwn(s.chars, 'wren'));
  assert.ok(!s.notes.loadout && !s.notes.starter);
});
