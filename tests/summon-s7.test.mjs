// S7 shared FX 'Light in, light out' (render only; pure helpers, mock Graphics). docs/design/summons-art-v1.md 3.6 A, sections 2 + 5.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BeatPool, HitPool, SpiritTracker, RimBudget, FX_CAPS, fxCap, VERB_OF, SPAWN_T, DESPAWN_T, HIT_T, MOTES, MOTE_COL, GOLD, crossingsPerSec, drawSpawn, drawDespawn, drawClaw, drawStar, drawInk } from '../src/gfx/summon/fxlight.js';
import { CAPS } from '../src/gfx/quality.js';
import { GLYPH_CAPS } from '../src/gfx/summon/glyph.js';
import { CHAIN_CAPS, decalCap } from '../src/gfx/summon/chain.js';
import { ORBIT_CAPS } from '../src/gfx/summon/orbitanim.js';
import { wolfFrame } from '../src/gfx/summon/wolfanim.js';
import { ravenPose } from '../src/gfx/summon/ravenanim.js';
import { flameFrame } from '../src/gfx/summon/orbitanim.js';
import { Sim } from '../src/sim/Sim.js';
import { data } from '../scripts/evo-same-ranks.mjs';

function mockG() {
  const g = { calls: [], cols: [], alphas: [], xs: [], ys: [], rs: [] };
  const rec = (n) => (...a) => { g.calls.push(n); return g; };
  for (const n of ['beginPath', 'strokePath', 'arc']) g[n] = rec(n);
  g.fillStyle = (c, a) => { g.cols.push(c); g.alphas.push(a); g.calls.push('fill'); return g; };
  g.lineStyle = (w, c, a) => { g.cols.push(c); g.alphas.push(a); g.calls.push('line'); return g; };
  const pt = (x, y, r = 0) => { g.xs.push(x); g.ys.push(y); g.rs.push(r); };
  g.fillCircle = (x, y, r) => { pt(x, y, r); return g; };
  g.strokeCircle = (x, y, r) => { pt(x, y, r); g.calls.push('ring'); return g; };
  g.fillEllipse = (x, y) => { pt(x, y); return g; };
  g.lineBetween = (x0, y0, x1, y1) => { pt(x0, y0); pt(x1, y1); return g; };
  g.fillTriangle = (x0, y0, x1, y1, x2, y2) => { pt(x0, y0); pt(x1, y1); pt(x2, y2); return g; };
  g.reset = () => { for (const k of ['calls', 'cols', 'alphas', 'xs', 'ys', 'rs']) g[k].length = 0; };
  return g;
}

test('S7 caps table = section 5 budget, and every older per-weapon cap sits inside it', () => {
  assert.deepEqual(FX_CAPS.high, { bodies: 40, halos: 160, ribbons: 12, echoes: 10, decals: 40, beats: 12, rims: 40 });
  assert.deepEqual(FX_CAPS.med, { bodies: 28, halos: 90, ribbons: 6, echoes: 6, decals: 24, beats: 8, rims: 24 });
  assert.deepEqual(FX_CAPS.low, { bodies: 20, halos: 40, ribbons: 0, echoes: 3, decals: 12, beats: 3, rims: 12 });
  for (const t of ['high', 'med', 'low']) {
    assert.equal(CAPS[t].halos, FX_CAPS[t].halos, t + ' halos');
    assert.equal(CAPS[t].echoes, FX_CAPS[t].echoes, t + ' echoes');
    assert.equal(CAPS[t].ribbon.spirits.n, FX_CAPS[t].ribbons, t + ' ribbons');
    assert.equal(CHAIN_CAPS[t].decals, FX_CAPS[t].decals, t + ' crack decals');
    assert.ok(GLYPH_CAPS[t].tails <= FX_CAPS[t].bodies, t + ' glyph tails ride the body cap');
    assert.equal(GLYPH_CAPS[t].rims, FX_CAPS[t].rims, t + ' glyph rims');
    assert.ok(ORBIT_CAPS[t].flowers <= FX_CAPS[t].beats, t + ' flower beats');
    assert.equal(fxCap(t, 'decals', true), decalCap(t, true), t + ' phone decals x0.6');
  }
  assert.equal(fxCap('high', 'bodies', true), 34); assert.equal(fxCap('high', 'halos', true), 96); assert.equal(fxCap('high', 'beats', true), 12);
  assert.equal(fxCap('nope', 'beats'), 8); assert.equal(fxCap('high', 'nope'), 0);
});

test('S7 beats: in-flight cap per tier is never exceeded (spawn + despawn share it)', () => {
  for (const t of ['high', 'med', 'low']) {
    const b = new BeatPool(12); b.setCap(fxCap(t, 'beats'));
    let ok = 0;
    for (let i = 0; i < 50; i++) if (b.add(i % 2, 1 + i * 0.001, i, i, 0, 0, null, i)) ok++;
    assert.equal(ok, fxCap(t, 'beats'), t);
    assert.equal(b.live(1.05), fxCap(t, 'beats'));
    const g = mockG(); assert.equal(b.draw(g, 1.05, false), fxCap(t, 'beats'));
    assert.equal(b.live(1 + DESPAWN_T + 0.06), 0, 'all gone after the despawn life');
    assert.ok(b.add(0, 2, 0, 0, 0, 0, null, 1), 'slots free again');
  }
  const b = new BeatPool(12); b.setCap(0); assert.equal(b.add(0, 0, 0, 0, 0, 0, null, 0), false);
});

test('S7 spawn: light flies from the lantern into the spirit and the ring closes in 0.25 s; Calm = fade only, no ring', () => {
  const g = mockG();
  drawSpawn(g, 0, 100, 50, 0, 0, false); const r0 = Math.max(...g.rs.filter((r, i) => g.calls.includes('ring')));
  g.reset(); drawSpawn(g, 0.99, 100, 50, 0, 0, false);
  assert.ok(g.rs[0] < 3 && r0 >= 9.5, 'ring closes 10 -> 2');
  const mx = g.xs[g.xs.length - 1]; assert.ok(Math.abs(mx - 100) < 1, 'mote has reached the spirit');
  g.reset(); drawSpawn(g, 0.1, 100, 50, 0, 0, false); assert.ok(g.xs[g.xs.length - 1] < 60, 'mote starts near the lantern');
  g.reset(); drawSpawn(g, 0.5, 100, 50, 0, 0, true); assert.ok(!g.calls.includes('ring'), 'Calm: no ring'); assert.deepEqual(g.xs, [100]);
  assert.equal(SPAWN_T, 0.25); assert.equal(DESPAWN_T, 0.4); assert.ok(HIT_T <= 0.15);
});

test('S7 despawn: 5 warm cream-amber motes (never gold) drift up 0.4 s; Calm: they fade in place', () => {
  assert.equal(MOTES, 5);
  for (const c of MOTE_COL) {
    assert.notEqual(c, GOLD);
    const r = c >> 16, gg = (c >> 8) & 255, b = c & 255;
    assert.ok(r === 255 && gg >= 0xdc && b >= 0xa0 && b < gg, 'cream-amber: warm, light, low saturation ' + c.toString(16));
    assert.ok((r - b) / 255 < (0xff - 0x6b) / 255, 'less saturated than the evolution gold');
  }
  const g = mockG(); drawDespawn(g, 0, 10, 10, 7, false); const y0 = g.ys.slice(); assert.equal(y0.length, 5);
  g.reset(); drawDespawn(g, 0.9, 10, 10, 7, false); assert.ok(g.ys.every((y, i) => y < y0[i] - 8), 'rise');
  g.reset(); drawDespawn(g, 0.9, 10, 10, 7, true); assert.deepEqual(g.ys, y0, 'Calm: no drift');
});

test('S7 verb hits: one shape per verb <= 0.15 s, shared decal budget, unknown verbs refused', () => {
  assert.deepEqual(VERB_OF, { ghost_wolves: 'claw', raven_flock: 'star', spirit_bolts: 'ink' });
  for (const t of ['high', 'med', 'low']) for (const ph of [false, true]) {
    const h = new HitPool(40), cap = fxCap(t, 'decals', ph);
    let n = 0; for (let i = 0; i < 100; i++) if (h.add(['claw', 'star', 'ink'][i % 3], 5, i, 0, i, cap)) n++;
    assert.equal(n, cap, t + ph); assert.equal(h.live(5.01), cap);
    assert.equal(h.live(5 + HIT_T), 0, 'gone by 0.15 s');
  }
  const h = new HitPool(40); assert.equal(h.add('crack', 0, 0, 0, 0), false); assert.equal(h.add('claw', 0, 0, 0, 0, 0), false, 'cap 0 (crack-stars used it all)');
  const gl = mockG(), gn = mockG();
  h.add('claw', 1, 0, 0, 1); h.add('star', 1, 30, 0, 2); h.add('ink', 1, 60, 0, 3);
  assert.equal(h.draw(gl, gn, 1.05, false), 3);
  assert.ok(gl.calls.includes('arc') && gl.xs.length > 0, 'claws + star on the additive layer'); assert.ok(gn.xs.length >= 6, 'ink + feather on the normal layer');
  assert.equal(h.draw(gl, gn, 1 + HIT_T + 0.001, false), 0);
});

test('S7 tracker: new id = spawn, id gone = despawn at its last place, a resting (hidden) light is silent', () => {
  const tr = new SpiritTracker(), sp = [], dp = [];
  const u = [{ id: 1, kind: 'wolf', x: 0, y: 0 }, { id: 2, kind: 'orb', x: 5, y: 5 }, { id: 3, kind: 'echo', x: 1, y: 1 }];
  tr.update(u, (e) => sp.push(e.id), (e) => dp.push(e.id));
  assert.deepEqual(sp, [1, 2]);
  u[0].x = 40; u[1].hidden = true; tr.update(u, (e) => sp.push(e.id), (e) => dp.push(e.id));
  u[1].hidden = false; tr.update(u, (e) => sp.push(e.id), (e) => dp.push(e.id));
  assert.deepEqual(sp, [1, 2]); assert.deepEqual(dp, []);
  let last = null; tr.update([u[1]], null, (e) => { dp.push(e.id); last = e; });
  assert.deepEqual(dp, [1]); assert.equal(last.x, 40);
  tr.clear(); tr.update([u[1]], (e) => sp.push(e.id), null); assert.deepEqual(sp, [1, 2, 2]);
});

test('S7 unified gold rim: one budget per frame across weapons (40 / 24 / 12)', () => {
  const r = new RimBudget();
  for (const t of ['high', 'med', 'low']) { r.begin(t); let n = 0; for (let i = 0; i < 100; i++) if (r.take()) n++; assert.equal(n, fxCap(t, 'rims')); }
  const src = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.equal((src.match(/sk\.gold && !this\.rimB\.take\(\)/g) || []).length, 3, 'wolves, ravens, flames take from the shared budget');
  assert.ok(src.includes('rims: this.rimB.n'), 'glyph rims start from the shared count');
});

test('S7 Calm motion: every shared beat and the summon poses stay <= 3 crossings/s (no flicker / bob)', () => {
  const dt = 1 / 60, N = 120;
  // beats: alpha + every drawn y sampled over their life under Calm
  for (const kind of [0, 1]) {
    const b = new BeatPool(12); b.add(kind, 0, 50, 50, 0, 0, null, 9);
    const al = [], ys = [];
    for (let i = 0; i < N; i++) { const g = mockG(); b.draw(g, i * dt * 0.25, true); al.push(g.alphas[0] || 0); ys.push(g.ys[0] || 0); }
    assert.ok(crossingsPerSec(al, dt) <= 3 && crossingsPerSec(ys, dt) <= 3, 'beat ' + kind);
  }
  for (const f of [(g, k) => drawClaw(g, k, 0, 0, 5, true), (g, k) => drawStar(g, mockG(), k, 0, 0, 5, true), (g, k) => drawInk(g, k, 0, 0, 5)]) {
    const al = [], ys = []; for (let i = 0; i < 30; i++) { const g = mockG(); f(g, i / 30); al.push(g.alphas[0]); ys.push(g.ys[0] || 0); }
    assert.ok(crossingsPerSec(al, dt) <= 3 && crossingsPerSec(ys, dt) <= 3);
  }
  // wolf: moving, Calm -> one held frame; raven flying, Calm -> no wing-beat swap; flame, Calm -> no flicker
  const s = {}, u = { x: 0, y: 0, atkCd: 0, target: {} }, wf = [];
  for (let i = 0; i < N; i++) { u.x += 2; wf.push(wolfFrame(s, u, dt, true)); }
  assert.ok(crossingsPerSec(wf, dt) <= 3, 'wolf');
  const rs = {}, ru = { x: 0, y: 0, st: 'return', faceX: 1 }, rp = [];
  for (let i = 0; i < N; i++) { ru.x += 3; rp.push(['up', 'down'].indexOf(ravenPose(rs, ru, dt, { calm: true }).pose)); }
  assert.ok(crossingsPerSec(rp, dt) <= 3, 'raven');
  const fs = {}, fu = { x: 0, y: 0 }, ff = [];
  for (let i = 0; i < N; i++) ff.push(flameFrame(fs, fu, dt, true));
  assert.ok(crossingsPerSec(ff, dt) <= 3, 'flame');
  assert.ok(crossingsPerSec([0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], 1 / 60) > 3, 'the meter catches a flicker');
});

test('S7 ?summons=0: no atlas = the shared FX draw nothing (old visuals)', () => {
  const src = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  const fn = src.slice(src.indexOf('  drawLightInOut(sim'), src.indexOf('  drawLightInOut(sim') + 600);
  assert.ok(/g\.clear\(\); gl\.clear\(\); gn\.clear\(\);\s+if \(!this\.sumAtlas\) return;/.test(fn), 'clears then returns without the atlas');
  assert.ok(src.includes("const lio = !!this.sumAtlas, vCap = lio ?"), 'verb hits only with the atlas');
  assert.ok(src.includes("lio ? fxCap(this.quality.tier, 'rims') : 1e9"), 'no rim budget without the atlas');
});

test('S7 hit log carries the weapon id (render-only tag; the sim never reads it)', () => {
  const sim = new Sim({ data, characterId: 'wren', seed: 4, godMode: true });
  sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant('spirit_bolts', {}, null); sim.debugGrant('raven_flock', {}, null);
  for (let i = 0; i < 8; i++) { const e = sim.spawnEnemy(Object.keys(data.enemies)[0], sim.player.x + 30 + i * 6, sim.player.y + (i % 3) * 8); e.hp = e.maxHp = 1e9; }
  const seen = new Set();
  for (let i = 0; i < 60 * 8; i++) { sim.step(1 / 60); for (let k = 0; k < sim.hitN; k++) seen.add(sim.hitBuf[k].src); sim.hitN = 0; }
  assert.ok(seen.has('ghost_wolves') && seen.has('spirit_bolts'), [...seen].join(','));
  const simSrc = readFileSync(new URL('../src/sim/Sim.js', import.meta.url), 'utf8');
  assert.equal((simSrc.match(/\.src\b/g) || []).filter(Boolean).length > 0, true);
  assert.ok(!/h\.src\s*[=!]==|\.hitBuf\[[^\]]+\]\.src/.test(simSrc), 'sim never branches on the tag');
});
