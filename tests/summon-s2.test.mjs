// S2 wolf evolutions in the Lantern-Heart look (render only): skins, gold rim only on evolved units, Echo hollow, Alpha 1.7x, Light Trails
// pawprints on the existing trail points + soft ribbon with no long straight segments, near-hero fade, sim untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { wolfSvg, goldSvg, echoSvg, KIND, WOLF_POSES, OV_OFF, OV_OFF_LF, ALPHA_K, ALPHA_BOX, LF_BOX, WOLF_BOX, GOLD, RIM_SOFT, RIM_HOT, wolfSheet } from '../src/gfx/summon/wolf.js';
import { wolfSkin, LF_AX } from '../src/gfx/summon/wolfanim.js';
import { pawStamps, PawLayer, PAW_A, PAW_A_CROWD, PAW_SIDE, PAW_FRAME } from '../src/gfx/summon/pawtrail.js';
import { RibbonSet, SOFT_MAX, softNear, SOFT_NEAR, RIBBON_DEPTH } from '../src/gfx/ribbons.js';
import { wolfRects, WOLF_BAKE } from '../src/gfx/summon/atlas.js';
import { FRAME_BY_NAME, PACK, PAGE_W } from '../src/gfx/summon/frames.js';
import { paw, NAMED } from '../src/gfx/summon/paint.js';

const POSE = (i) => WOLF_POSES[i];

test('S2 skins: one frame set per evolution, gold only on evolved units (never the shades, never the echoes)', () => {
  const wolf = { kind: 'wolf' }, shade = { kind: 'wolf', shade: true }, echo = { kind: 'echo' };
  assert.deepEqual(wolfSkin(null, wolf, false, 2), { fr: 'wolf_2', size: 1, ax: 0.5, ov: 'base', texel: 1, gold: false });
  assert.equal(wolfSkin('howling_legion', wolf, false, 3).fr, 'wolfg_3');
  assert.equal(wolfSkin('howling_legion', echo, false, 3).fr, 'echo_3');
  assert.equal(wolfSkin('howling_legion', echo, false, 3).gold, false);
  const lf = wolfSkin('phantom_stampede', wolf, false, 1);
  assert.equal(lf.fr, 'lfoot_1'); assert.equal(lf.ax, LF_AX); assert.equal(lf.ov, 'lf'); assert.ok(lf.gold);
  const al = wolfSkin('dire_alpha', wolf, false, 4);
  assert.equal(al.fr, 'alpha_4'); assert.equal(al.size, ALPHA_K); assert.equal(al.ov, null);
  assert.equal(wolfSkin('dire_alpha', shade, false, 4).fr, 'wolf_4'); assert.equal(wolfSkin('dire_alpha', shade, false, 4).gold, false);
  // Low: one flat per creature
  assert.equal(wolfSkin(null, wolf, true, 0).fr, 'flat_wolf'); assert.equal(wolfSkin('howling_legion', wolf, true, 0).fr, 'flat_wolfg');
  assert.equal(wolfSkin('dire_alpha', wolf, true, 0).size, ALPHA_K); assert.equal(wolfSkin('dire_alpha', wolf, true, 0).texel, 0.75);
  assert.equal(wolfSkin('howling_legion', echo, true, 5).fr, 'echo_0');
  // every frame a skin can name exists in the atlas with the skin's anchor
  for (const evo of [null, 'howling_legion', 'phantom_stampede', 'dire_alpha']) for (const u of [wolf, shade, echo]) for (const low of [false, true]) for (let i = 0; i < 6; i++) {
    const s = wolfSkin(evo, u, low, i); const f = FRAME_BY_NAME[s.fr];
    assert.ok(f, s.fr); assert.ok(Math.abs(f.ax - s.ax) < 1e-9, s.fr); assert.ok(Math.abs(f.ay - 90 / 96) < 1e-9, s.fr);
  }
});

test('S2 art: gold rim filter wraps evolved frames only; base frames carry no gold; signature changes are in place', () => {
  for (let i = 0; i < 6; i++) {
    const base = wolfSvg(POSE(i));
    assert.ok(!base.includes(GOLD) && !base.includes('url(#grim)'), 'base wolf has no gold');
    assert.ok(goldSvg(POSE(i)).startsWith('<g filter="url(#grim)">'));
    assert.ok(KIND.alpha[0](i).includes('url(#grim)') && KIND.lfoot[0](i).includes('url(#grim)'));
    assert.ok(!KIND.echo[0](i).includes('url(#grim)') && KIND.echo[0](i).includes('url(#hollow)'), 'echo = hollow, no rim');
  }
  const sheet = wolfSheet(wolfRects(), PAGE_W, PACK.h);
  assert.ok(sheet.includes(`radius="${RIM_SOFT}"`) && sheet.includes(`radius="${RIM_HOT}"`), 'rim widths 2.6 + 1.1 du');
  assert.ok(sheet.includes(`flood-color="${GOLD}"`));
  assert.ok(!/<script|href=|xlink|https?:|javascript:|<foreignObject|<image/i.test(sheet.replace('xmlns="http://www.w3.org/2000/svg"', '')), 'self-contained');
  // Alpha: amber eyes + frost mane (ticks) + bigger heart; never red-orange
  const a = KIND.alpha[0](0);
  assert.ok(a.includes('#b8742a') && a.includes('#e8f7ff'));
  assert.ok(!/#ff5a3c|#ff[0-4][0-9a-f]{3}"/i.test(a));
  // Light Trails: streamers (blur1) and ears swept back -> overlay offsets differ from the base set
  assert.ok(KIND.lfoot[0](0).includes('url(#blur1)'));
  assert.notDeepEqual(OV_OFF_LF[0], OV_OFF[0]);
  // boxes: Alpha box matches its frame at 1 texel per du; Light Trails box shifted back, same size as the wolf
  assert.deepEqual([FRAME_BY_NAME.alpha_0.w, FRAME_BY_NAME.alpha_0.h], [ALPHA_BOX[2], ALPHA_BOX[3]]);
  assert.deepEqual([LF_BOX[2], LF_BOX[3]], [WOLF_BOX[2], WOLF_BOX[3]]);
  assert.equal(-LF_BOX[0] / LF_BOX[2], LF_AX);
  assert.equal(echoSvg(POSE(0)).includes('#ffcf7a'), true, 'echo keeps the warm ember heart');
  assert.equal(WOLF_BAKE.filter(([n]) => /^(wolfg|lfoot|alpha|echo)_/.test(n)).length, 24);
});

function trail(nWolves, steps, space = 7, ttl = 2.3) {
  const pts = [];
  for (let s = 0; s < steps; s++) for (let w = 0; w < nWolves; w++) pts.push({ x: w * 300 + s * space, y: w * 50 + Math.sin(s / 3) * 6, t: ttl * (s + 1) / steps, l: ttl, hw: 9, id: 100 + w });
  return pts;
}
const outBuf = (n) => ({ x: new Float32Array(n), y: new Float32Array(n), r: new Float32Array(n), a: new Float32Array(n), k: new Float32Array(n) });

test('S2 pawprints: one stamp per existing trail point (newest n), alternating sides, heading kept, alpha capped, sim points never written', () => {
  const pts = trail(2, 40);
  const snap = JSON.stringify(pts);
  const mem = { side: new WeakMap(), last: new Map() }, out = outBuf(300);
  const c = pawStamps(pts, 60, mem, out);
  assert.equal(c, 60);
  assert.equal(JSON.stringify(pts), snap, 'trail points untouched');
  // alternation per wolf: consecutive stamps of one wolf sit on opposite sides of its stride line
  const w0 = pts.slice(-60).map((q, i) => [q, i]).filter(([q]) => q.id === 100).map(([q, i]) => out.y[i] - q.y);
  for (let i = 1; i < w0.length; i++) assert.ok(Math.sign(w0[i]) !== Math.sign(w0[i - 1]) || Math.abs(w0[i]) < 0.2, 'alternates');
  for (let i = 0; i < c; i++) { assert.ok(out.a[i] <= PAW_A + 1e-6 && out.a[i] > 0); assert.ok(Math.hypot(out.x[i] - pts[pts.length - 60 + i].x, out.y[i] - pts[pts.length - 60 + i].y) <= PAW_SIDE + 1e-4); }
  // stable: a second pass (oldest point dropped) keeps each surviving point's side and heading
  const r0 = out.r[5], y0 = out.y[5];
  pts.shift(); pts.push({ ...pts[pts.length - 1], x: pts[pts.length - 1].x + 7 });
  pawStamps(pts, 60, mem, out);
  assert.ok(Math.abs(out.r[4] - r0) < 1e-6 && Math.abs(out.y[4] - y0) < 1e-6);
  // crowd: eased to the combat clarity cap
  pawStamps(pts, 60, mem, out, 1);
  for (let i = 0; i < 60; i++) assert.ok(out.a[i] <= PAW_A_CROWD + 1e-6);
  assert.equal(pawStamps([], 60, mem, out), 0); assert.equal(pawStamps(null, 60, mem, out), 0);
  assert.equal(pawStamps(pts, 500, mem, outBuf(10)), 10, 'never past the buffer');
});

test('S2 soft ribbon: no segment longer than SOFT_MAX (the old web of straight lines), no core, within the point cap, fades near the hero', () => {
  const pts = trail(3, 60);
  // a wolf that jumps 80 u (respawn / leap): the old addTrail bridged it (<= 90), the soft ribbon never does
  pts.push({ x: pts[pts.length - 1].x + 80, y: pts[pts.length - 1].y, t: 2.3, l: 2.3, hw: 9, id: 102 });
  const set = new RibbonSet(1000, 12, 64);
  set.count = 0;
  const n = set.addTrailSoft(pts, { body: 120 }, 0x9fd8ff);
  assert.ok(n > 0 && n <= 120);
  for (let i = 0; i < n; i++) { assert.ok(set.sl[i] <= SOFT_MAX); assert.equal(set.sc[i], 0x9fd8ff); assert.ok(set.sa[i] <= 0.2 + 1e-6); }
  const old = new RibbonSet(1000, 12, 64); old.count = 0;
  const m = old.addTrail(pts, { body: 120, core: 120 }, 0x9fd8ff, 0xfff1c8);
  let longOld = 0; for (let i = 0; i < m; i++) if (old.sl[i] > SOFT_MAX) longOld++;
  assert.ok(longOld > 0, 'the old renderer did draw long straight segments');
  // near the hero the ribbon is faint, far away full strength
  assert.equal(softNear(0, 0, { x: 0, y: 0, r: 60 }), SOFT_NEAR);
  assert.equal(softNear(200, 0, { x: 0, y: 0, r: 60 }), 1);
  assert.equal(softNear(5, 5, null), 1);
  const near = new RibbonSet(1000, 12, 64); near.count = 0;
  near.addTrailSoft(pts, { body: 120 }, 0x9fd8ff, { x: pts[pts.length - 2].x, y: pts[pts.length - 2].y, r: 60 });
  assert.ok(near.sa[near.count - 1] < set.sa[set.count - 1]);
});

test('S2 paw layer: draws under every creature, halo, pickup and number (depth between ribbons and halos), pooled', () => {
  const made = [];
  const img = () => { const o = { visible: false, setDepth(d) { this.depth = d; return this; }, setVisible(v) { this.visible = v; return this; }, setPosition() { return this; }, setRotation() { return this; }, setScale() { return this; }, setAlpha(a) { this.alpha = a; return this; } }; made.push(o); return o; };
  const scene = { add: { image: (x, y, key, fr) => { assert.equal(fr, PAW_FRAME); return img(); } } };
  const L = new PawLayer(scene, 'sum_atlas', RIBBON_DEPTH + 1, 50);
  const pts = trail(2, 40);
  assert.equal(L.render(pts, 80), 50);
  assert.equal(made.length, 50);
  for (const o of made) assert.ok(o.depth > RIBBON_DEPTH && o.depth < 55000, 'under D_HALO (55000) and every lit sprite / pickup / number');
  assert.equal(L.render(pts.slice(0, 10), 80), 10);
  assert.equal(made.filter((o) => o.visible).length, 10);
  L.clear(); assert.equal(made.filter((o) => o.visible).length, 0);
});

test('S2 paw decal: painted once into decal_paw (named painter), inside its frame', () => {
  assert.equal(NAMED.decal_paw, paw);
  const calls = []; const g = { addColorStop() {} };
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' ? () => g : (...a) => { calls.push([k, ...a]); }), set: () => true });
  const f = PACK.frames[FRAME_BY_NAME.decal_paw.id];
  paw(ctx, f, f.x, f.y);
  const arcs = calls.filter((c) => c[0] === 'arc' || c[0] === 'ellipse');
  assert.ok(arcs.length >= 6);
  for (const c of arcs) { assert.ok(c[1] >= f.x && c[1] <= f.x + f.w && c[2] >= f.y && c[2] <= f.y + f.h, 'centre inside the frame'); }
});

test('S2 lazy bake: boot bakes only the base wolf; every frame a skin can use belongs to its evolution\'s kinds', async () => {
  const { BOOT_KINDS, EVO_KINDS, kindOf } = await import('../src/gfx/summon/atlas.js');
  assert.deepEqual(BOOT_KINDS, ['base', 'ov', 'flat']);
  const wolf = { kind: 'wolf' }, shade = { kind: 'wolf', shade: true }, echo = { kind: 'echo' };
  for (const evo of Object.keys(EVO_KINDS)) for (const u of evo === 'howling_legion' ? [wolf, echo] : evo === 'dire_alpha' ? [wolf, shade] : [wolf]) for (const low of [false, true]) for (let i = 0; i < 6; i++) {
    const k = kindOf(wolfSkin(evo, u, low, i).fr);
    assert.ok(BOOT_KINDS.includes(k) || EVO_KINDS[evo].includes(k), `${evo} ${k}`);
  }
  for (const [name, kind] of WOLF_BAKE) assert.equal(kindOf(name), kind, name);
});
