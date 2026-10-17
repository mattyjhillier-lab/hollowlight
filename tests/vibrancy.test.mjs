// WL6c: vibrancy of the restored world (src/gfx/vibrancy.js). Pure maths + wiring pins: visual only, restored layers only, no per-frame allocation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  VIB_MIN, VIB_STEP, spriteSat, VIB_LEVELS, vibTarget, vibLevel, levelSat, satTint, satColor, meanColor, VibTints, restoredShare, buildGlowTable, mulTint, R_COLS, R_ROWS,
} from '../src/gfx/vibrancy.js';
import { ARC_A, arcSample, makeArcOut } from '../src/gfx/arc.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const chroma = (c) => { const r = (c >> 16) & 255; const g = (c >> 8) & 255; const b = c & 255; return Math.max(r, g, b) - Math.min(r, g, b); };
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const apply = (rgb, t) => [rgb[0] * ((t >> 16) & 255) / 255, rgb[1] * ((t >> 8) & 255) / 255, rgb[2] * (t & 255) / 255];

test('arc sat column ramps 0.80 -> 1.30 and never goes down', () => {
  assert.equal(ARC_A[0][7], 0.8); assert.equal(ARC_A[ARC_A.length - 1][7], 1.3);
  for (let i = 1; i < ARC_A.length; i++) assert.ok(ARC_A[i][7] >= ARC_A[i - 1][7]);
});

test('target = clock x (0.85 + 0.15 R): R only adds, bounds 0.68 .. 1.30, NaN-safe, levels cover the range', () => {
  assert.ok(Math.abs(vibTarget(0.8, 0) - 0.68) < 1e-9);
  assert.ok(Math.abs(vibTarget(1.3, 1) - 1.3) < 1e-9);
  for (let s = 0.8; s <= 1.3; s += 0.05) assert.ok(vibTarget(s, 1) > vibTarget(s, 0));
  for (const bad of [NaN, -1, undefined]) assert.ok(Number.isFinite(vibTarget(bad, bad)));
  assert.equal(vibLevel(NaN), 0); assert.equal(vibLevel(VIB_MIN), 0); assert.ok(vibLevel(0.68) <= 1); assert.equal(vibLevel(1.3), VIB_LEVELS - 1); assert.equal(vibLevel(9), VIB_LEVELS - 1);
  assert.ok(Math.abs(levelSat(0) - VIB_MIN) < 1e-9 && Math.abs(levelSat(VIB_LEVELS - 1) - 1.3) < 1e-9);
  assert.ok(VIB_STEP <= 0.04 + 1e-9);
});

test('smooth in time: along the arc the quantised level changes by at most 1 per second of run time', () => {
  const o = makeArcOut(); let prev = -1;
  for (let t = 0; t <= 900; t++) { arcSample(t, 'normal', false, o); const L = vibLevel(vibTarget(o.sat, 0.6)); if (prev >= 0) assert.ok(Math.abs(L - prev) <= 1, `t${t}: ${prev} -> ${L}`); prev = L; }
});

test('satTint: grey and s=1 are neutral; s>1 raises chroma, s<1 lowers it, luminance dips by at most ~20%; never above white', () => {
  assert.equal(satTint(120, 120, 120, 1.3), 0xffffff);
  assert.equal(satTint(0, 0, 0, 1.3), 0xffffff);
  for (const rgb of [[90, 130, 70], [200, 150, 120], [140, 160, 196], [168, 150, 190], [74, 120, 60], [120, 90, 60]]) {
    const a1 = apply(rgb, satTint(rgb[0], rgb[1], rgb[2], 1));
    assert.ok(Math.abs(a1[0] - rgb[0]) <= 1.5 && Math.abs(a1[1] - rgb[1]) <= 1.5 && Math.abs(a1[2] - rgb[2]) <= 1.5, 'neutral at 1');
    const hi = apply(rgb, satTint(rgb[0], rgb[1], rgb[2], 1.3)); const lo = apply(rgb, satTint(rgb[0], rgb[1], rgb[2], spriteSat(0.66)));
    const ch = (c) => Math.max(...c) - Math.min(...c);
    assert.ok(ch(hi) > ch(rgb) * 1.15, `chroma up ${rgb}`);
    assert.ok(ch(lo) < ch(rgb) * 0.9, `chroma down ${rgb}`);
    assert.ok(luma(hi[0], hi[1], hi[2]) >= luma(rgb[0], rgb[1], rgb[2]) * 0.8 && luma(lo[0], lo[1], lo[2]) >= luma(rgb[0], rgb[1], rgb[2]) * 0.85, `luma dip ${rgb}`);
    for (const t of [satTint(rgb[0], rgb[1], rgb[2], 1.3), satTint(rgb[0], rgb[1], rgb[2], spriteSat(0.66))]) assert.ok(t >= 0 && t <= 0xffffff);
  }
});

test('satColor (additive glows): saturates about luma, clamps', () => {
  const c = 0xffe2b0; assert.ok(chroma(satColor(c, 1.3)) > chroma(c)); assert.ok(chroma(satColor(c, 0.7)) < chroma(c));
  assert.equal(satColor(0x808080, 1.3), 0x808080);
});

test('VibTints: mean colour per frame from atlas pixels, cached tint per level, unknown/empty frames neutral, no allocation after build', () => {
  const W = 8; const H = 4; const px = new Uint8Array(W * H * 4);
  const put = (x, y, r, g, b, a) => { const i = (y * W + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a; };
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) put(x, y, 90, 130, 70, 255); // frame a: green
  const v = new VibTints(px, W, [{ name: 'a', x: 0, y: 0, w: 4, h: 4 }, { name: 'b', x: 4, y: 0, w: 4, h: 4 }]); // frame b is empty
  assert.equal(v.get('nope', 5), 0xffffff); assert.equal(v.get('b', 5), 0xffffff);
  const t = v.get('a', VIB_LEVELS - 1); assert.equal(t, satTint(90, 130, 70, spriteSat(1.3))); assert.equal(v.get('a', VIB_LEVELS - 1), t);
  assert.equal(v.get('a', -5), v.get('a', 0)); assert.equal(v.get('a', 99), v.get('a', VIB_LEVELS - 1));
  const h0 = process.memoryUsage().heapUsed;
  for (let i = 0; i < 200000; i++) v.get('a', i % VIB_LEVELS);
  assert.ok(process.memoryUsage().heapUsed - h0 < 6e6, 'heap grew');
  const out = [0, 0, 0]; assert.equal(meanColor(px, W, 4, 0, 4, 4, out), false); assert.equal(meanColor(px, W, 0, 0, 4, 4, out), true); assert.deepEqual(out.map(Math.round), [90, 130, 70]);
});

test('restoredShare: mean of an R_COLS x R_ROWS grid of clean-life samples, clamped 0..1', () => {
  let calls = 0;
  const life = { sampleClean: () => { calls++; return 0.5; } };
  assert.ok(Math.abs(restoredShare(life, 0, 0, 640, 360) - 0.5) < 1e-9); assert.equal(calls, R_COLS * R_ROWS);
  assert.equal(restoredShare({ sampleClean: () => 5 }, 0, 0, 1, 1), 1); assert.equal(restoredShare({ sampleClean: () => -3 }, 0, 0, 1, 1), 0); assert.equal(restoredShare({ sampleClean: () => NaN }, 0, 0, 1, 1), 0);
});

test('glow table: Hollow (cold, index 0) fireflies are unchanged at every level; warm ones follow the saturation', () => {
  const tints = [0x8aa0c8, 0xa0a8c4, 0xb8b0bc, 0xd0b8b0, 0xe8c0a0, 0xf4c890, 0xffd080, 0xffe0a0, 0xffe8b0];
  const tab = buildGlowTable(tints); const n = tints.length;
  for (let L = 0; L < VIB_LEVELS; L++) assert.equal(tab[L * n], tints[0]);
  assert.ok(chroma(tab[(VIB_LEVELS - 1) * n + n - 1]) >= chroma(tints[n - 1]));
  assert.ok(chroma(tab[n - 1]) <= chroma(tints[n - 1]));
});

test('WIRING: only restored-world layers import vibrancy; enemies, heroes, UI, pickups, numbers, telegraphs and the sim never do', () => {
  const users = [];
  for (const dir of ['src/gfx', 'src/sim', 'src/ui', 'src/scenes', 'src/save', 'src']) {
    for (const f of readdirSync(new URL(`../${dir}`, import.meta.url))) {
      if (!f.endsWith('.js')) continue;
      if (/vibrancy\.js|vibatlas\.js/.test(read(`${dir}/${f}`).split('\n').filter((l) => l.startsWith('import')).join('\n'))) users.push(`${dir}/${f}`);
    }
  }
  assert.deepEqual([...new Set(users)].sort(), ['src/gfx/airlayer.js', 'src/gfx/critterlayer.js', 'src/gfx/proplayer.js', 'src/gfx/swaylayer.js', 'src/gfx/vibatlas.js', 'src/scenes/RunScene.js']);
  assert.ok(!/gfx\//.test(read('src/sim/Sim.js')));
  const rs = read('src/scenes/RunScene.js');
  const a = rs.indexOf('ei++;'); const b = rs.indexOf('silhouette pass');
  assert.ok(a > 0 && b > a);
  assert.ok(!/vib/i.test(rs.slice(a, b)), 'enemy loop does not touch vibrancy');
  assert.ok(!/vib/i.test(read('src/gfx/nightlayer.js') + read('src/gfx/nightlook.js') + read('src/gfx/dmgnums.js') + read('src/gfx/numpool.js')));
});

test('WIRING: props apply vibrancy to restored images only (not Hollow, not the canopy shade); ground shader saturates the restored tile only', () => {
  const pl = read('src/gfx/proplayer.js');
  assert.ok(pl.includes("propTint(im, p.jit, st === 'r')"));
  assert.ok(pl.includes('k.charCodeAt(k.length - 1) === 114'), "'r' layers only");
  const gbs = read('src/gfx/groundblend.js');
  const i1 = gbs.indexOf('res = max(vec3(0.0), vec3(ly) + (res - ly) * uSat)'); const i2 = gbs.indexOf('vec3 col = mix(hol, res, m)');
  assert.ok(i1 > 0 && i2 > i1, 'uSat is applied to res before the restored/Hollow mix');
  assert.ok(gbs.includes("uSat: { type: '1f', value: 1 }"), 'default 1 = the authored look');
});

test('tickVibrancy: no per-frame allocation, Low = tint-only on props (no ground uniform), ?vib=0 restores the old look', () => {
  const rs = read('src/scenes/RunScene.js');
  const fn = rs.slice(rs.indexOf('  tickVibrancy(dt, view) {'), rs.indexOf('  hideAmbient() {'));
  assert.ok(fn.length > 200);
  assert.ok(!/new (Array|Map|Set|Float32Array|Int32Array|Uint8Array)|\.map\(|\.filter\(|\.slice\(|=> /.test(fn));
  assert.ok(fn.includes('if (this.gbOn) this.gb.setSat'), 'ground uniform only when the shader runs');
  assert.ok(fn.includes('app.params.vib && app.params.arc'));
  assert.ok(read('src/app.js').includes("vib: q.get('vib') !== '0'"));
});

test('mulTint is a plain multiply', () => {
  assert.equal(mulTint(0xffffff, 0x80c0ff), 0x80c0ff); assert.equal(mulTint(0x808080, 0x808080), 0x404040);
});
