import test from 'node:test';
import assert from 'node:assert/strict';
import { ravenSvg, goldRavenSvg, ravenSheet, KIND, POSES, GOLD_POSES, TIPS, PAPER, R, RAVEN_BOX, RAVEN_LEN_DU, RAVEN_WPD, LEAD_K, BAKED_ROT, featherDecal, waxSealDecal } from '../src/gfx/summon/raven.js';
import { ravenPose, ravenSkin, FLAP_T, TAKEOFF_T, MAX_TURN } from '../src/gfx/summon/ravenanim.js';
import { RAVEN_BAKE, RAVEN_KINDS, BOOT_KINDS, kindOf, ravenRects } from '../src/gfx/summon/atlas.js';
import { FRAME_BY_NAME, PACK } from '../src/gfx/summon/frames.js';
import { NAMED } from '../src/gfx/summon/paint.js';
import { zoomFor } from '../src/gfx/style.js';
import { Lstar } from '../src/gfx/husk/paint.js';

test('raven art: 7 poses + 6 gold poses + 2 Low flats, all from our own code (no external refs, no scripts)', () => {
  assert.deepEqual(POSES, ['perch', 'up', 'down', 'swoop', 'peck', 'spread', 'dive']);
  for (const p of POSES) assert.ok(FRAME_BY_NAME['raven_' + p], p);
  for (const p of GOLD_POSES) assert.ok(FRAME_BY_NAME['ravg_' + p], p);
  assert.ok(FRAME_BY_NAME.raven_flat0 && FRAME_BY_NAME.raven_flat1);
  const sheet = ravenSheet(ravenRects().map((r) => ({ ...r })), 1024, PACK.h);
  assert.ok(sheet.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  const body = sheet.slice(sheet.indexOf('>') + 1);
  assert.ok(!/http|<script|javascript:|<image|<foreignObject|on\w+=/i.test(body));
  assert.equal(RAVEN_BAKE.length, 7 + 1 + 6 + 1);
});

test('raven art: friendly value read (light violet body, ink outline, cream/ink eye never red), warm wax seal, paper tips darker cream (never white)', () => {
  assert.ok(Lstar(R.c) > 65, 'light body'); assert.ok(Lstar(R.ink) < 25, 'dark tinted outline');
  assert.equal(PAPER, '#efe1c0'); assert.equal(TIPS.paper.near, '#efe1c0'); assert.ok(Lstar(PAPER) < Lstar('#ffffff') - 5);
  for (const p of POSES) {
    const s = ravenSvg({ pose: p });
    assert.ok(s.includes(PAPER), p + ' paper tips'); assert.ok(s.includes('#ffcf7a'), p + ' wax seal ember');
    assert.ok(!/#ff5a3c|#ff3|#f00\b|#ff0000/i.test(s), p + ' no red eye'); assert.ok(!s.includes('#ffd36b') && !s.includes('grim'), p + ' no gold on the plain raven');
  }
  for (const p of GOLD_POSES) assert.ok(goldRavenSvg({ pose: p }).startsWith('<g filter="url(#grim)">'));
  assert.ok(ravenSvg({ pose: 'up', tips: 'violet' }).includes(TIPS.violet.near) && !ravenSvg({ pose: 'up', tips: 'violet' }).includes(PAPER), 'violet-tip fallback exists');
  assert.equal(Object.keys(KIND).sort().join(), 'rbase,rflat,rflatg,rgold');
});

test('raven size: ~30 px long on the 1280x720 desktop (locked), frame box 64 texels, Spearhead lead 1.2x', () => {
  const px = RAVEN_LEN_DU * RAVEN_WPD * zoomFor(1280, 720);
  assert.ok(px >= 28 && px <= 32, String(px));
  for (const n of [...POSES.map((p) => 'raven_' + p), ...GOLD_POSES.map((p) => 'ravg_' + p)]) { assert.equal(FRAME_BY_NAME[n].w, 64); assert.equal(FRAME_BY_NAME[n].ax, 0.5); }
  assert.equal(RAVEN_BOX[2], RAVEN_BOX[3]); assert.equal(LEAD_K, 1.2);
});

const step = (s, u, dt, o) => ravenPose(s, u, dt, o);
test('raven pose picker: perch -> take-off -> swoop -> peck bob -> return flaps, from the sim state only (never writes the unit)', () => {
  const s = {}, u = Object.freeze({ x: 0, y: 0, st: 'perch', faceX: 1, pecks: 0 });
  assert.equal(step(s, u, 0.016).pose, 'perch');
  let v = { x: 0, y: 0, st: 'dive', faceX: 1, pecks: 0 };
  assert.equal(step(s, Object.freeze({ ...v }), 0.016).pose, 'up', 'take-off');
  let r;
  for (let i = 1; i <= 12; i++) r = step(s, Object.freeze({ ...v, x: i * 4, y: i * 2 }), 0.016);
  assert.equal(r.pose, 'swoop'); assert.ok(Math.abs(r.rot) <= MAX_TURN && r.flip === false);
  // flying left: flipped, turn mirrored
  const s2 = {}; for (let i = 0; i <= 12; i++) r = step(s2, Object.freeze({ x: -i * 4, y: i * 2, st: 'dive', faceX: -1, pecks: 0 }), 0.016);
  assert.equal(r.flip, true);
  // peck: 'peck' just after each peck, head up between
  v = { x: 48, y: 24, st: 'peck', faceX: 1, pecks: 3 };
  assert.equal(step(s, Object.freeze(v), 0.016).pose, 'peck');
  assert.equal(step(s, Object.freeze(v), 0.1).pose, 'perch');
  assert.equal(step(s, Object.freeze({ ...v, pecks: 2 }), 0.016).pose, 'peck');
  // return: wing strokes alternate up / down every FLAP_T
  const seen = new Set(); for (let i = 0; i < 8; i++) seen.add(step(s, Object.freeze({ x: 48 - i, y: 24, st: 'return', faceX: -1, pecks: 0 }), FLAP_T * 0.6).pose);
  assert.deepEqual([...seen].sort(), ['down', 'up']);
  assert.ok(TAKEOFF_T > 0.05 && TAKEOFF_T < 0.3);
});

test('raven pose picker: Talon Mark climb flaps then the folded dive dart; Wall ring spreads; Spearhead swoops only while the wedge flies; calm holds', () => {
  let s = {}, r;
  r = step(s, { x: 0, y: 0, st: 'dive', tellK: 0.4, faceX: 1 }, 0.016, { talon: true }); assert.ok(['up', 'down'].includes(r.pose));
  for (let i = 1; i < 6; i++) r = step(s, { x: 0, y: i * 5, st: 'dive', tellK: 1, faceX: 1 }, 0.016, { talon: true });
  assert.equal(r.pose, 'dive'); assert.ok(Math.abs(r.rot) <= MAX_TURN);
  s = {}; const poses = new Set(); for (let i = 0; i < 40; i++) poses.add(step(s, { x: i, y: 0, st: 'orbit', wall: true, faceX: 1 }, 0.03).pose);
  assert.ok(poses.has('spread')); assert.ok([...poses].every((p) => p === 'spread' || p === 'up'));
  s = {}; assert.equal(step(s, { x: 0, y: 0, st: 'wedge', wedge: true }, 0.016, { wedgeOn: true }).pose, 'swoop');
  assert.ok(['up', 'down'].includes(step(s, { x: 0, y: 0, st: 'wedge', wedge: true }, 0.016, { wedgeOn: false }).pose));
  // calm: no flapping / peck bob / ring beat (single held poses)
  s = {}; const c = new Set(); for (let i = 0; i < 30; i++) c.add(step(s, { x: i, y: 0, st: 'return', faceX: 1 }, 0.05, { calm: true }).pose); assert.deepEqual([...c], ['up']);
  s = {}; const w = new Set(); for (let i = 0; i < 30; i++) w.add(step(s, { x: i, y: 0, st: 'orbit', wall: true }, 0.05, { calm: true }).pose); assert.deepEqual([...w], ['spread']);
  s = {}; const k = new Set(); for (let i = 0; i < 10; i++) k.add(step(s, { x: 0, y: 0, st: 'peck', pecks: 3 - (i % 3) }, 0.1, { calm: true }).pose); assert.deepEqual([...k], ['peck']);
  assert.equal(BAKED_ROT.dive, 78);
});

test('raven skins: gold only on the evolved verb\'s units (Talon scouts, Wall ring, Spearhead lead); Low flats; gold frames all baked by the gold kinds', () => {
  const scout = { st: 'perch' }, ring = { wall: true }, wedge = { wedge: true };
  assert.equal(ravenSkin(null, scout, false, false, 'perch').fr, 'raven_perch');
  assert.equal(ravenSkin('dive_bombers', scout, false, false, 'dive').fr, 'ravg_dive');
  assert.equal(ravenSkin('murder_storm', scout, false, false, 'perch').gold, false);
  assert.equal(ravenSkin('murder_storm', ring, false, false, 'spread').fr, 'ravg_spread');
  assert.equal(ravenSkin('spearhead', wedge, false, false, 'swoop').gold, false);
  const lead = ravenSkin('spearhead', wedge, true, false, 'swoop'); assert.equal(lead.fr, 'ravg_swoop'); assert.equal(lead.size, LEAD_K);
  assert.equal(ravenSkin('spearhead', scout, false, false, 'perch').gold, false);
  assert.equal(ravenSkin('dive_bombers', scout, false, false, 'peck').fr, 'raven_peck'); // no gold peck frame
  assert.equal(ravenSkin(null, scout, false, true, 'swoop').fr, 'raven_flat0'); assert.equal(ravenSkin('dive_bombers', scout, false, true, 'dive').fr, 'raven_flat1');
  const names = new Set(RAVEN_BAKE.map((b) => b[0]));
  for (const evo of [null, 'dive_bombers', 'murder_storm', 'spearhead']) for (const u of [scout, ring, wedge]) for (const lw of [false, true]) for (const low of [false, true]) for (const p of POSES) {
    const sk = ravenSkin(evo, u, lw, low, p); assert.ok(names.has(sk.fr), sk.fr);
    assert.ok((sk.gold ? RAVEN_KINDS.gold : RAVEN_KINDS.base).includes(kindOf(sk.fr)), sk.fr);
  }
  for (const k of [...RAVEN_KINDS.base, ...RAVEN_KINDS.gold]) assert.ok(!BOOT_KINDS.includes(k), 'nothing raven at boot');
});

test('raven decals: paper feather and wax seal are named canvas painters that stay inside their frame', () => {
  assert.equal(NAMED.decal_feather, featherDecal); assert.equal(NAMED.decal_waxseal, waxSealDecal);
  const pts = [];
  const grad = { addColorStop() {} };
  const c = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => grad : k === 'moveTo' || k === 'lineTo' ? (x, y) => pts.push([x, y]) : () => {}), set: () => true });
  for (const fn of [featherDecal, waxSealDecal]) { const fr = FRAME_BY_NAME[fn === featherDecal ? 'decal_feather' : 'decal_waxseal']; pts.length = 0; fn(c, fr, 0, 0); if (fn === waxSealDecal) for (const [x, y] of pts) assert.ok(x >= 0 && y >= 0 && x <= fr.w && y <= fr.h); }
});
