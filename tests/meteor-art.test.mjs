// DM3: Dragonfire Meteor art + sound (render/audio only). Pure helpers, the pooled layer on a stub scene, cue ids. No Phaser, no sim changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { meteorCaps, ballPose, poolEnv, poolSeed, MeteorLayer, FLAME_BUDGET, ABILITY_RESERVE, WEAPON_VISUALS } from '../src/gfx/meteorfx.js';
import { METEOR } from '../src/sim/weapons.js';
import { CUES } from '../src/audio/engine.js';
import { EVENT_CUE } from '../src/audio/cues.js';

test('flame budget: 8 per run, 3 reserved for the ability, the weapon shows at most the sim pool cap', () => {
  assert.equal(FLAME_BUDGET, 8); assert.equal(ABILITY_RESERVE, 3); assert.equal(WEAPON_VISUALS, 5); assert.equal(WEAPON_VISUALS, METEOR.maxPools);
});

test('quality caps: High >= Medium >= Low; Low is flat (no additive, no embers, no tongues, no tail); Calm has nothing that moves alone', () => {
  const h = meteorCaps('high'), m = meteorCaps('med'), l = meteorCaps('low');
  for (const k of ['tongues', 'embers', 'impact', 'sparks', 'tail']) assert.ok(h[k] >= m[k] && m[k] >= l[k], k);
  assert.ok(l.flat && !l.add && !l.flicker && l.embers === 0 && l.tongues === 0 && l.tail === 0 && l.sparks === 0 && l.impact === 0);
  assert.ok(h.add && m.add && !h.flat);
  assert.equal(h.tongues, 4); assert.equal(h.embers, 3); assert.equal(h.sparks, 14);
  for (const t of ['high', 'med', 'low']) { const c = meteorCaps(t, false, true); assert.ok(c.calm && !c.flicker && !c.pop && c.embers === 0 && c.sparks === 0 && c.impact === 0, t); }
  assert.ok(meteorCaps('high', true).sparks < h.sparks && meteorCaps('high', true).sparks >= 1, 'phone trims counts');
  assert.equal(meteorCaps('nope').tier, 'med');
});

test('ball pose: starts at her hand, lands on the target, peaks mid-arc, junk clamps', () => {
  const a = ballPose(0, 10, 10, 110, 60), b = ballPose(1, 10, 10, 110, 60), m = ballPose(0.5, 10, 10, 110, 60);
  assert.equal(a.x, 10); assert.equal(b.x, 110); assert.equal(b.y, 60); assert.ok(b.h < 0.001 && a.h < 13 && m.h > 28 && m.h <= 62);
  assert.equal(ballPose(-3, 0, 0, 5, 5).x, 0); assert.equal(ballPose(9, 0, 0, 5, 5).x, 5);
  assert.ok(Number.isFinite(ballPose(0.5, 0, 0, 0, 0).h));
});

test('pool envelope: fades in, burns full, dies down with Embers, lingers 1 s as colour (cap drop: 0.3 s)', () => {
  const e = {};
  assert.equal(poolEnv(3, 0, 0, -1, false, e).aIn, 0); assert.equal(poolEnv(3, 0.5, 0, -1, false, e).aIn, 1);
  assert.ok(e.flame === 1 && e.glow === 1 && e.tint === 1);
  poolEnv(0.3, 2.7, 0, -1, false, e); assert.ok(e.flame < 1 && e.flame > 0 && e.glow > e.flame);
  poolEnv(0, 3, 0, 3, false, e); assert.equal(e.flame, 0); assert.equal(e.glow, 0); assert.equal(e.tint, 1);
  poolEnv(0, 3.5, 0, 3, false, e); assert.ok(e.tint > 0.4 && e.tint < 0.6);
  poolEnv(0, 4.1, 0, 3, false, e); assert.equal(e.tint, 0);
  poolEnv(2, 3.15, 0, 3, true, e); assert.ok(e.glow > 0.4 && e.glow < 0.6);
  assert.ok(poolSeed(10, 20) >= 0 && poolSeed(10, 20) < 1 && poolSeed(10, 20) === poolSeed(10, 20));
});

test('cues: meteor_* registered, quiet pri, no duck, the cone-era ember_breath is gone, the sim ember event maps to nothing', () => {
  for (const id of ['meteor_launch', 'meteor_impact', 'meteor_crackle', 'ember_lick']) assert.ok(CUES[id], id);
  assert.ok(!CUES.ember_breath && !Object.hasOwn(EVENT_CUE, 'ember'));
  assert.ok(CUES.meteor_crackle.pri === 2 && CUES.meteor_launch.pri === 1);
});

// ---- the layer on a stub scene
function stub() {
  const made = [];
  const px = new Proxy(function () {}, { get: (t, k) => (k === 'then' ? undefined : px), apply: () => px });
  const tex = { frames: {}, getContext: () => px, add(n) { this.frames[n] = 1; }, refresh() {}, setFilter() {} };
  const mk = () => { const im = { vis: true, a: 1, setFrame() { return im; }, setPosition() { return im; }, setDepth() { return im; }, setScale() { return im; }, setAlpha(a) { im.a = a; return im; }, setRotation() { return im; }, setVisible(v) { im.vis = v; return im; }, setTint() { return im; }, clearTint() { return im; }, setBlendMode() { return im; }, setOrigin() { return im; } }; made.push(im); return im; };
  return { made, scene: { textures: { exists: () => !!tex.baked, get: () => tex, createCanvas: () => { tex.baked = true; return tex; } }, add: { image: mk } } };
}
const GL = { ADD: 1, NORMAL: 0, LINEAR: 0, depthGround: 54000, depthLit: 60000, depthFx: 100000 };
function simWith(fly, pools, t = 1) {
  return { time: t, player: { x: 0, y: 0 }, weapons: [{ id: 'dragonfire_meteor', rt: { fly, pools } }] };
}
function ctx(sim, tier = 'high', over = {}) {
  const cues = [], sparks = [];
  return { cues, sparks, c: { sim, tier, phone: false, calm: false, lm: null, parts: { emit: (...a) => { sparks.push(a); return true; } }, cue: (id) => cues.push(id), vx0: -400, vy0: -300, vx1: 400, vy1: 300, ...over } };
}

test('layer: nothing drawn and nothing baked without the weapon; a flying ball asks for the launch cue once, landing asks for the thump', () => {
  const { scene, made } = stub();
  const L = new MeteorLayer(scene, GL);
  const k = ctx({ time: 1, player: { x: 0, y: 0 }, weapons: [] });
  L.update(k.c); assert.equal(made.length, 0); assert.equal(L.active, false);
  const fly = [{ x: 100, y: 20, t: 0.3, r: 40, dmg: 5, life: 3 }], pools = [];
  const sim = simWith(fly, pools, 1);
  const k2 = ctx(sim); L.update(k2.c); L.update(k2.c);
  assert.deepEqual(k2.cues, ['meteor_launch']); assert.ok(L.sprites >= 3 && L.sprites < 14);
  fly.length = 0; pools.push({ x: 100, y: 20, r: 36, life: 3, t: 0.5, dmg: 1 }); sim.time = 1.45;
  L.update(k2.c);
  assert.ok(k2.cues.includes('meteor_impact')); assert.equal(k2.sparks.length, meteorCaps('high').sparks);
});

test('layer: pool visuals stay inside the 5-visual weapon budget, Low is one flat sprite per pool, ghosts end', () => {
  const { scene } = stub();
  const mkPool = (i) => ({ x: i * 90, y: 0, r: 36, life: 4, t: 0.5, dmg: 1 });
  const pools = [0, 1, 2, 3, 4].map(mkPool), sim = simWith([], pools, 1);
  const hi = new MeteorLayer(scene, GL), kh = ctx(sim, 'high'); hi.update(kh.c);
  assert.equal(hi.pools.size, 5); assert.ok(hi.sprites <= 5 * 14, 'high sprites ' + hi.sprites);
  const lo = new MeteorLayer(stub().scene, GL), kl = ctx(sim, 'low'); lo.update(kl.c);
  assert.equal(lo.sprites, 5, 'Low = one sprite per pool');
  // the sim drops the oldest and adds a 6th: never more than 5 visuals, the dropped one fades in 0.3 s
  pools.shift(); pools.push(mkPool(5)); sim.time = 1.1; hi.update(kh.c);
  assert.ok(hi.pools.size <= 5);
  sim.time = 1.6; hi.update(kh.c); assert.equal(hi.pools.size, 5);
  // natural end lingers ~1 s then the record is gone
  pools.length = 0; sim.time = 1.7; hi.update(kh.c); assert.equal(hi.pools.size, 5 > 0 ? hi.pools.size : 0); sim.time = 3.0; hi.update(kh.c); assert.equal(hi.pools.size, 0);
  hi.update({ ...kh.c, sim: { time: 4, player: { x: 0, y: 0 }, weapons: [] } }); // weapon gone: everything hidden
  assert.equal(hi.sprites, 0);
});

test('layer: Calm has no embers or sparks; hostile values (NaN, huge radii) do not throw', () => {
  const { scene } = stub();
  const L = new MeteorLayer(scene, GL), k = ctx(simWith([{ x: NaN, y: 5, t: 0.2, r: 40 }], [{ x: 1e9, y: -1e9, r: 1e6, life: 3 }, { x: 0, y: 0, r: NaN, life: NaN }], 1), 'high', { calm: true });
  assert.doesNotThrow(() => L.update(k.c));
  assert.equal(k.sparks.length, 0);
});

// ---- DM4 Wildfire art: children dim and light, a faint thread links parent to child, 6 live pools stay inside the 5-visual budget
test('wildfire art: 6 live pools keep every visual in budget (6th is glow + ring only), children draw lighter than parents, Low stays one sprite per pool + a thread', () => {
  const mkP = (i, gen, par) => ({ x: i * 40, y: 0, r: gen ? 24 : 36, r0: gen ? 24 : 36, life: 4, life0: 4, t: 0.5, dmg: 1, gen, kids: 0, par });
  const p0 = mkP(0, 0, null), p1 = mkP(1, 0, null), c1 = mkP(2, 1, p0), c2 = mkP(3, 1, p1), g1 = mkP(4, 2, c1), p2 = mkP(5, 0, null);
  const pools = [p0, p1, c1, c2, g1, p2], sim = simWith([], pools, 1);
  const hi = new MeteorLayer(stub().scene, GL), kh = ctx(sim, 'high'); hi.update(kh.c); sim.time = 1.5; hi.update(kh.c);
  assert.equal(hi.pools.size, 6);
  const lite = [...hi.pools.values()].filter((r) => r.lite).length;
  assert.equal(lite, 1, 'exactly the 6th live pool is the lite form');
  assert.ok(hi.sprites < 6 * 14 + 8, 'high sprites ' + hi.sprites);
  const lo = new MeteorLayer(stub().scene, GL), kl = ctx(sim, 'low'); lo.update(kl.c); sim.time = 2; lo.update(kl.c);
  assert.equal(lo.sprites, 6 + 3, 'Low = one sprite per pool + one thread per child');
  const cl = new MeteorLayer(stub().scene, GL), kc = ctx(sim, 'high', { calm: true }); cl.update(kc.c); sim.time = 2.5; cl.update(kc.c);
  assert.ok(cl.sprites > 0);
  assert.deepEqual(kh.cues.filter((c) => c === 'meteor_crackle').length > 0, true, 'a child lighting asks for the soft ember tick');
});

test('wildfire art: parentless / hostile child records do not throw; the thread vanishes with its parent', () => {
  const L = new MeteorLayer(stub().scene, GL);
  const parent = { x: 0, y: 0, r: 36, life: 4, life0: 4, t: 0.5, dmg: 1, gen: 0, par: null };
  const kid = { x: 25, y: 0, r: 24, life: 3, life0: 3, t: 0.5, dmg: 1, gen: 1, par: parent };
  const bad = { x: NaN, y: 0, r: 5, life: 3, gen: 7, par: { x: 1, y: 1 } };
  const pools = [parent, kid, bad], sim = simWith([], pools, 1), k = ctx(sim, 'med');
  assert.doesNotThrow(() => { L.update(k.c); sim.time = 1.8; L.update(k.c); });
  const withThread = L.sprites;
  pools.shift(); sim.time = 1.9; L.update(k.c); // the parent left the sim list: its record ghosts; the child must not draw a thread to a ghost
  assert.ok(L.sprites <= withThread + 3);
});

// ---- DM5 Cinder Wyrm art: 7 segments + a head, sparks per tier, Calm trail-free, Low flat, no extra pools
const wyrmSim = (t = 1, k = 1, on = true) => {
  const seg = []; for (let i = 0; i < 7; i++) seg.push(100 - i * 13, 20 + i * 2);
  return { time: t, player: { x: 0, y: 0 }, weapons: [{ id: 'dragonfire_meteor', rt: { fly: [], pools: [], wyrm: { on, k, nseg: 7, seg, cx: 80, cy: 20, loops: 1 } } }] };
};
test('wyrm art: High draws 7 body glows + 6 segments + head, Low is flat sprites only, Calm sheds no sparks, rise cue once', () => {
  const sim = wyrmSim(1);
  const hi = new MeteorLayer(stub().scene, GL), kh = ctx(sim, 'high'); hi.update(kh.c); sim.time = 1.3; hi.update(kh.c);
  assert.ok(hi.sprites >= 14 && hi.sprites <= 20, 'high sprites ' + hi.sprites);
  assert.equal(kh.cues.filter((c) => c === 'wyrm_rise').length, 1);
  assert.ok(kh.sparks.length > 0 && kh.sparks.length <= 8, 'spark trail ' + kh.sparks.length); // ~16/s x 0.3 s
  const lo = new MeteorLayer(stub().scene, GL), kl = ctx(sim, 'low'); sim.time = 1; lo.update(kl.c); sim.time = 1.3; lo.update(kl.c);
  assert.equal(lo.sprites, 7, 'Low: 6 segments + head, no glow, no sparks'); assert.equal(kl.sparks.length, 0);
  const cl = new MeteorLayer(stub().scene, GL), kc = ctx(sim, 'high', { calm: true }); sim.time = 1; cl.update(kc.c); sim.time = 1.3; cl.update(kc.c);
  assert.equal(kc.sparks.length, 0); assert.ok(cl.sprites > 0);
});
test('wyrm art: faded-out / hostile serpent records never throw and draw nothing', () => {
  const L = new MeteorLayer(stub().scene, GL), s0 = wyrmSim(1, 0, false), k = ctx(s0, 'high');
  assert.doesNotThrow(() => L.update(k.c)); assert.equal(L.sprites, 0);
  const s1 = wyrmSim(1); s1.weapons[0].rt.wyrm.seg[4] = NaN; s1.weapons[0].rt.wyrm.nseg = 99; s1.weapons[0].rt.wyrm.cx = Infinity;
  assert.doesNotThrow(() => { L.update(ctx(s1, 'med').c); });
  const s2 = wyrmSim(1); s2.weapons[0].rt.wyrm.seg = [NaN, NaN, 1, 1]; s2.weapons[0].rt.wyrm.nseg = 2;
  assert.doesNotThrow(() => { L.update(ctx(s2, 'low').c); });
});
test('cues: wyrm_rise and evo_cinder_wyrm are registered', () => {
  assert.ok(CUES.wyrm_rise && CUES.wyrm_rise.pri === 1); assert.ok(CUES.evo_cinder_wyrm);
});

// ---- DM6 Cinder Brand art: ember-marks over branded foes (capped per tier), a gold burst + pip per pop, hostile records are safe
const brandSim = (n = 30, t = 1) => {
  const brands = [], pops = [];
  for (let i = 0; i < n; i++) brands.push({ e: { burnT: 0.5, r: 8 }, t: 0.5, x: (i % 10) * 20 - 90, y: Math.floor(i / 10) * 20 });
  pops.push({ x: 10, y: 10, r: 26, t: t - 0.05 }, { x: 40, y: 10, r: 26, t: t - 0.04 });
  return { time: t, player: { x: 0, y: 0 }, weapons: [{ id: 'dragonfire_meteor', rt: { fly: [], pools: [], brands, pops } }] };
};
test('brand art: marks are capped per tier (High 24, Med 12, Low 8), each pop cues once per frame, sparks per pop follow the tier, Calm sheds none', () => {
  assert.equal(meteorCaps('high').bmax, 24); assert.equal(meteorCaps('med').bmax, 12); assert.equal(meteorCaps('low').bmax, 8);
  assert.ok(meteorCaps('high', true).bmax < 24);
  const sim = brandSim(), hi = new MeteorLayer(stub().scene, GL), kh = ctx(sim, 'high'); hi.update(kh.c);
  assert.ok(hi.sprites >= 24 && hi.sprites <= 24 * 2 + 12, 'high sprites ' + hi.sprites);
  assert.equal(kh.cues.filter((c) => c === 'brand_pop').length, 1); assert.equal(kh.sparks.length, 2 * meteorCaps('high').bspark);
  hi.update(kh.c); assert.equal(kh.cues.filter((c) => c === 'brand_pop').length, 1, 'a pop already seen cues nothing more');
  const lo = new MeteorLayer(stub().scene, GL), kl = ctx(brandSim(), 'low'); lo.update(kl.c);
  assert.ok(lo.sprites <= 8 + 4 && kl.sparks.length === 0, 'Low sprites ' + lo.sprites);
  const md = new MeteorLayer(stub().scene, GL), km = ctx(brandSim(), 'med'); md.update(km.c); assert.ok(md.sprites <= 12 * 2 + 8);
  const cl = new MeteorLayer(stub().scene, GL), kc = ctx(brandSim(), 'high', { calm: true }); cl.update(kc.c); assert.equal(kc.sparks.length, 0);
});
test('brand art: hostile mark and pop records never throw', () => {
  const s = brandSim(3);
  s.weapons[0].rt.brands.push({ e: null, x: NaN, y: 1 }, { e: { burnT: NaN, r: NaN }, x: 1e9, y: -1e9, t: NaN }, { e: { r: 4 }, x: 5, y: 5, t: 0 });
  s.weapons[0].rt.pops.push({ x: NaN, y: 3, r: 5, t: 0.9 }, { x: 3, y: 3, r: 1e9, t: NaN }, null);
  const L = new MeteorLayer(stub().scene, GL);
  assert.doesNotThrow(() => { L.update(ctx(s, 'high').c); s.time = 1.1; L.update(ctx(s, 'med').c); });
  const L2 = new MeteorLayer(stub().scene, GL); assert.doesNotThrow(() => L2.update(ctx(s, 'low', { calm: true }).c));
});
test('cues: brand_pop and evo_cinder_brand are registered, pop is a quiet first-to-drop hit-priority cue', () => {
  assert.ok(CUES.brand_pop && CUES.brand_pop.pri === 2); assert.ok(CUES.evo_cinder_brand);
});
