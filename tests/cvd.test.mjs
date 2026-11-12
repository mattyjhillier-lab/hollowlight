// Q8 colour-blind check: the three thread states (lit / available / locked) and the banner chips must stay apart by LIGHTNESS (plus width and glow) under protan,
// deutan and tritan simulation (Machado 2009, full severity), so no state depends on hue alone. Mirrors the draw formulas in ui/treescreen.js drawWeb().
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { LOOK } from '../src/gfx/treebg.js';
import { mix } from '../src/gfx/medallions.js';
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const M = { normal: [[1,0,0],[0,1,0],[0,0,1]], protan: [[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]], deutan: [[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]], tritan: [[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.303900]] };
const lab = (rgb, m) => { const l = rgb.map(lin); const s = m.map((r) => Math.max(0, Math.min(1, r[0]*l[0]+r[1]*l[1]+r[2]*l[2])));
  const X = (0.4124*s[0]+0.3576*s[1]+0.1805*s[2])/0.95047, Y = 0.2126*s[0]+0.7152*s[1]+0.0722*s[2], Z = (0.0193*s[0]+0.1192*s[1]+0.9505*s[2])/1.08883;
  const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787*t+16/116; return [116*f(Y)-16, 500*(f(X)-f(Y)), 200*(f(Y)-f(Z))]; };
const over = (fg, a, bg) => fg.map((c, i) => c*a + bg[i]*(1-a));
const bg = hex('#141a3a');
const contrast = (a, b) => { const y = (c) => { const l = c.map(lin); return 0.2126*l[0]+0.7152*l[1]+0.0722*l[2]; }; const [p, q] = [y(a), y(b)].sort((x, z) => z - x); return (p + 0.05) / (q + 0.05); };
const bright = 0.55 + 0.45 * LOOK.bright;
const cols = [...Object.values(data.weapons).map((w) => w.color).filter(Boolean), '#ffd9a0'];

test('thread states stay apart by lightness for every weapon colour under protan / deutan / tritan', () => {
  for (const [name, m] of Object.entries(M)) {
    for (const c of [...new Set(cols)]) {
      const lit = over(hex(mix(c, '#fff6e0', 0.35)), LOOK.thrLit * bright, bg), av = over(hex(c), LOOK.thrAvail * bright, bg), lo = over(hex('#8592c4'), LOOK.thrLocked, bg);
      const [L, A, K, B] = [lit, av, lo, bg].map((x) => lab(x, m)[0]);
      assert.ok(L - A >= 25, `${name} ${c}: lit ${L.toFixed(0)} vs available ${A.toFixed(0)}`);
      assert.ok(A - K >= 4, `${name} ${c}: available ${A.toFixed(0)} vs locked ${K.toFixed(0)} (width differs too)`);
      assert.ok(K - B >= 12, `${name} ${c}: locked ${K.toFixed(0)} vs sky ${B.toFixed(0)}`);
    }
  }
});

test('banner chips and the hub caption are high contrast text on their plates (AAA 7:1)', () => {
  assert.ok(contrast(hex('#ffe6ae'), over(hex('#0c1126'), 0.92, bg)) >= 7);
  assert.ok(contrast(hex('#fff1cf'), over(hex('#050814'), 0.9, bg)) >= 7);
  assert.ok(contrast(hex('#cfd7f3'), hex('#0b1030')) >= 7, 'condition tile text');
});
