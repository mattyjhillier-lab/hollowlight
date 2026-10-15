// Wren v2 "Pelt Walker" + ghost wolf pup, drawn in code (Canvas2D) from the locked sheet geometry (docs/mockups/wren-v2/wren2.mjs).
// Hollowlight Style v1: L2 tinted outline (a darker shade of each fill), H2 soft gradient + rim light, P1 chibi.
// Everything is in DESIGN UNITS (du): origin = ground under the feet, y up is negative, faces +x (flip in code). 122 du = feet to ear tips.
// Parts are packed into ONE atlas texture so the whole rig (and pup) batches into one draw call. No DOM/Phaser here: callers pass a canvas factory.
export const DU = 0.211; // world units per design unit: 122 du = 25.7 world units = the old 18-unit hero * 1.43 display scale (hitboxes unchanged)
export const FEET = 10.9; // world units from the sim position (p.x, p.y) down to the soles (matches the old sprite and the ground ring)
export const TEX = 1.25; // atlas texels per du
export const PUP_K = 0.78; // pup scale vs Wren du (knee-high)

export const PAL2 = {
  pelt: '#cdd9e2', peltDk: '#8da3b7', inner: '#59708a', tunic: '#34506a', void: '#121923', amber: '#ffb84a', glint: '#ffd98a',
  bone: '#efe4cc', skin: '#8a6e66', hand: '#e8c4a8', boot: '#2b3441', nose: '#2a3140',
  pup: '#ffe8b0', pupDk: '#f6c987', pupIn: '#ffd2a0', pupChest: '#fff6d8', pupEye: '#5a2e10', pupEmber: '#ffb84a',
};
const P = PAL2;

// ---- colour + shape helpers (canvas port of style-lab shp(): L2 outline, H2 gradient, rim crescent) ---------------------------
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hs = (a) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
export const mix = (a, b, t) => { const x = hx(a); const y = hx(b); return hs(x.map((v, i) => v + (y[i] - v) * t)); };
const OUT = 5.6; // outline stroke width (du); a touch heavier than the sheet (4.6) so the hero holds on pale ground at 40-60 px
const INK_MIX = 0.7;

const pathBB = (d) => {
  const n = d.match(/-?\d*\.?\d+/g).map(Number);
  let x0 = 1e9; let y0 = 1e9; let x1 = -1e9; let y1 = -1e9;
  for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
  return [x0, y0, x1, y1];
};
export const S = (d, bb) => ({ p: new Path2D(d), bb: bb || pathBB(d) }); // SVG path data (absolute M L C Q Z only unless bb given)
export const E = (x, y, rx, ry) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return { p, bb: [x - rx, y - ry, x + rx, y + ry] }; };
export const C = (x, y, r) => E(x, y, r, r);
// capsule between two points (legs, forepaws)
export const CAP = (x1, y1, x2, y2, r1, r2 = r1) => {
  const a = Math.atan2(y2 - y1, x2 - x1); const nx = -Math.sin(a); const ny = Math.cos(a);
  const q = (x, y, r, s) => `${(x + nx * r * s).toFixed(2)} ${(y + ny * r * s).toFixed(2)}`;
  const d = `M${q(x1, y1, r1, 1)} L${q(x2, y2, r2, 1)} A${r2} ${r2} 0 0 0 ${q(x2, y2, r2, -1)} L${q(x1, y1, r1, -1)} A${r1} ${r1} 0 0 0 ${q(x1, y1, r1, 1)}Z`;
  return S(d, [Math.min(x1 - r1, x2 - r2), Math.min(y1 - r1, y2 - r2), Math.max(x1 + r1, x2 + r2), Math.max(y1 + r1, y2 + r2)]);
};

// o: w (outline weight), so (unused, kept for sheet parity), nl (no outline), x(c) extra drawn clipped to the shape
export function shape(c, sh, col, o = {}) {
  const w = o.w ?? 1;
  const lt = mix(col, '#fff6dc', 0.36); const dk = mix(col, '#3a1f4a', 0.4);
  const ink = mix(col, '#2a0f30', INK_MIX);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (!o.nl) { c.lineWidth = OUT * w; c.strokeStyle = ink; c.fillStyle = ink; c.fill(sh.p); c.stroke(sh.p); }
  const [x0, y0, x1, y1] = sh.bb; const bw = x1 - x0; const bh = y1 - y0;
  const g = c.createLinearGradient(x0 + 0.2 * bw, y0, x0 + 0.8 * bw, y1 || y0 + bh);
  g.addColorStop(0, lt); g.addColorStop(0.5, col); g.addColorStop(1, dk);
  c.fillStyle = g; c.fill(sh.p);
  c.save(); c.clip(sh.p);
  // rim light on the lower-right edge (the lantern side): shape minus itself shifted up-left
  const rim = new Path2D(); rim.rect(x0 - 40, y0 - 40, bw + 80, bh + 80); rim.addPath(sh.p, { a: 1, b: 0, c: 0, d: 1, e: -2.8, f: -2.2 });
  c.globalAlpha = 0.9; c.fillStyle = mix(lt, '#fff2c0', 0.5); c.fill(rim, 'evenodd'); c.globalAlpha = 1;
  if (o.x) o.x(c);
  c.restore();
}
export const stroke = (c, d, col, w, o = {}) => {
  c.save();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = o.cap || 'round'; c.lineJoin = 'round'; c.globalAlpha = o.a ?? 1;
  if (o.dash) c.setLineDash(o.dash);
  c.stroke(typeof d === 'string' ? new Path2D(d) : d);
  c.restore();
};
export const fillP = (c, d, col, a = 1) => { c.save(); c.globalAlpha = a; c.fillStyle = col; c.fill(typeof d === 'string' ? new Path2D(d) : d); c.restore(); };
export const glowAt = (c, x, y, r, col, a) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  const rgb = hx(col).join(',');
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.18, `rgba(${rgb},${a * 0.62})`); g.addColorStop(0.4, `rgba(${rgb},${a * 0.26})`); g.addColorStop(0.7, `rgba(${rgb},${a * 0.07})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
};
export const dot = (c, x, y, r, col, a = 1) => { c.save(); c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore(); };
export const ell = (c, x, y, rx, ry, col, a = 1, rot = 0) => { c.save(); c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill(); c.restore(); };
const pawPrint = (c, x, y, k, col, a = 1) => {
  c.save(); c.translate(x, y); c.scale(k, k); c.globalAlpha = a; c.fillStyle = col;
  for (const [ex, ey, rx, ry] of [[0, 2, 4.6, 3.7], [-5, -3, 1.9, 2.5], [-1.7, -5.6, 1.9, 2.6], [1.9, -5.6, 1.9, 2.6], [5.2, -3, 1.9, 2.5]]) { c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
  c.restore();
};

// ---- WREN geometry (3/4 view, th = 0.6 rad) ----------------------------------------------------------------------------------
const TH = 0.6; const SN = Math.sin(TH); const CS = Math.cos(TH);
const XS = 1 - 0.36 * SN;
export const ANCHOR = {
  tail: [-6, -33], // pelt tail root
  bootFar: [-6.5 * XS + 3 * SN, -2.6], bootNear: [6.5 * XS + 3 * SN, -2.6],
  neck: [0, -66], // head pivot
  ember: [33, -80], // ember rest position (her lantern)
  hand: [16, -47], // the hand the ember hangs from
};

export function drawWrenBody(c) {
  const W = 32 * XS;
  // soft ground shadow (the shape is baked here so it never needs its own sprite)
  c.save(); c.translate(0, 1); c.scale(1, 0.2); c.fillStyle = (() => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 27); g.addColorStop(0, 'rgba(4,4,12,0.5)'); g.addColorStop(0.6, 'rgba(4,4,12,0.28)'); g.addColorStop(1, 'rgba(4,4,12,0)'); return g; })();
  c.beginPath(); c.arc(0, 0, 27, 0, Math.PI * 2); c.fill(); c.restore();
  let zig = ''; for (let i = 0; i <= 8; i++) zig += `L${-W + (2 * W * i) / 8} ${i % 2 ? -7 : -14} `;
  shape(c, S(`M${-13 * XS} -62 Q${-W * 1.05} -46 ${-W} -14 ${zig} Q${W * 1.05} -46 ${13 * XS} -62 Q0 -67 ${-13 * XS} -62Z`), P.inner, { w: 0.9 });
  shape(c, S(`M${-11 * XS} -58 Q${-13 * XS} -36 ${-17 * XS} -8 L${-11 * XS} -3 L-5 -8 L2 -3 L${9 * XS} -8 L${17 * XS} -6 Q${13 * XS} -36 ${11 * XS} -58Z`), P.tunic, {
    w: 0.9, x: (k) => stroke(k, 'M-20 -7 Q0 -3 20 -7', P.amber, 1.4, { dash: [2.2, 2], a: 0.95 }),
  });
  glowAt(c, -21 * XS, -24, 11, P.amber, 0.3);
  pawPrint(c, -21 * XS, -24, 0.95, P.amber, 0.95); pawPrint(c, 20 * XS, -31, 0.8, P.amber, 0.9);
  let mz = ''; for (let i = 0; i <= 8; i++) mz += `L${W * 0.8 - (2 * W * 0.8 * i) / 8} ${i % 2 ? -38 : -45} `;
  shape(c, S(`M${-W * 0.8} -50 Q${-W * 0.88} -60 ${-12 * XS} -66 Q0 -70 ${12 * XS} -66 Q${W * 0.88} -60 ${W * 0.8} -50 ${mz}Z`), P.pelt, {
    w: 0.9, x: (k) => stroke(k, `M${-W * 0.7} -52 Q0 -47 ${W * 0.7} -52`, P.peltDk, 1, { a: 0.5 }),
  });
  // the alpha's forepaws, tied at the throat: v2.1 fix (ArtDecisions) shorter and angled outward, so they read as pelt paws, not clasped hands
  const px = (q) => q * 6.5 * XS + 2.5 * SN;
  for (const q of [-1, 1]) {
    const x0 = px(q);
    c.save(); c.translate(x0, -58); c.rotate(q * -0.34); c.scale(0.9, 0.62); c.translate(-x0, 58);
    shape(c, S(`M${x0 - 2.6} -58 Q${x0 - 4.8} -50 ${x0 - 3.6} -45 Q${x0} -42 ${x0 + 3.6} -45 Q${x0 + 4.8} -50 ${x0 + 2.6} -58Z`), P.pelt, { w: 0.8 / 0.7 });
    stroke(c, `M${x0 - 2} -44.4 v3 M${x0} -43.4 v3.4 M${x0 + 2} -44.4 v3`, P.amber, 1.4);
    c.restore();
  }
  shape(c, C(px(0), -58, 2.3), P.bone, { w: 0.6 });
  shape(c, C(ANCHOR.hand[0], ANCHOR.hand[1], 4), P.hand, { w: 0.7 });
  shape(c, C(-17 * XS - 3 * SN, -34, 3.8), P.hand, { w: 0.7 });
}

export function drawWrenBoot(c) { shape(c, E(0, 0, 6.8, 4), P.boot, { w: 0.8 }); }

export function drawWrenTail(c) {
  const tx = -40; const ty = -26;
  shape(c, S(`M-6 -44 C${tx * 0.4} -52 ${tx * 0.8} -40 ${tx} ${ty} C${tx * 0.75} -19 ${tx * 0.4} -21 -6 -22Z`), P.pelt, {
    w: 0.9,
    x: (k) => { stroke(k, `M-8 -33 C${tx * 0.4} -36 ${tx * 0.7} -31 ${tx * 0.95} ${ty + 1}`, P.amber, 1.2, { dash: [2, 2.2], a: 0.9 }); fillP(k, `M${tx * 0.7} -40 L${tx * 1.05} ${ty - 3} L${tx * 0.7} -22Z`, P.peltDk, 0.55); },
  });
}

// ember: bone-cage orb with a live flame. fl = flame size 0.6..1.5; drawn at origin (the glow is a separate additive sprite)
export function drawEmber(c) {
  const bone = P.bone;
  shape(c, S('M-2.8 -9.2 L2.8 -9.2 L1.8 -12.6 L-1.8 -12.6Z'), bone, { w: 0.6 });
  c.beginPath(); c.arc(0, -14.6, 1.9, 0, Math.PI * 2); c.lineWidth = 1.1; c.strokeStyle = mix(bone, '#7a5a3a', 0.5); c.stroke();
  shape(c, C(0, 0, 8.8), bone, { w: 0.7 });
  const cg = c.createRadialGradient(0, 0, 0, 0, 0, 7);
  cg.addColorStop(0, '#fffbe2'); cg.addColorStop(0.35, '#ffd05a'); cg.addColorStop(0.8, '#ff9d3a'); cg.addColorStop(1, '#d9651e');
  c.fillStyle = cg; c.beginPath(); c.arc(0, 0, 6.4, 0, Math.PI * 2); c.fill();
  fillP(c, 'M0 -5.8 Q3 0.5 0 4.6 Q-3 0.5 0 -5.8Z', '#ffffff', 0.95);
  stroke(c, 'M-3.5 -6.1 Q-6.6 0 -3.5 6.1 M3.5 -6.1 Q6.6 0 3.5 6.1 M0 -6.4 L0 6.4', bone, 1.7);
  stroke(c, 'M-3.1 -5.8 Q-6.2 0.3 -3.1 6.4 M3.9 -5.8 Q7 0.3 3.9 6.4', mix(bone, '#8a6a46', 0.35), 0.5, { a: 0.7 });
  shape(c, S('M-2.2 8.4 L2.2 8.4 L0 12.6Z'), bone, { w: 0.5 });
}

// head: wolf-head hood, void face, glints. expr: neutral | blink | worried | hurt | death
export const HEAD_EXPR = {
  neutral: { ear: 0, tilt: 0 }, blink: { ear: 0, tilt: 0 }, worried: { ear: 24, tilt: -3 }, hurt: { ear: 40, tilt: -9 }, death: { ear: 14, tilt: -6 },
};
export function drawWrenHead(c, expr = 'neutral') {
  const X = HEAD_EXPR[expr] || HEAD_EXPR.neutral; const earA = X.ear;
  const hb = -3 * SN; const fx = 8 * SN; const earK = 0.5 + 0.5 * Math.abs(CS);
  const ear = (x0, dx, sgn) => {
    c.save(); c.translate(x0, -96); c.rotate((sgn * earA * Math.PI) / 180); c.translate(-x0, 96);
    shape(c, S(`M${x0 - 7} -96 L${x0 + dx} -122 L${x0 + 8} -97Z`), P.pelt, { w: 0.9 });
    shape(c, S(`M${x0 - 3.6} -98 L${x0 + dx * 0.9} -115 L${x0 + 4} -98Z`), P.inner, { w: 0.4, nl: true });
    c.restore();
  };
  ear(-13 * earK + hb - 3 * SN, -1, -1); ear(13 * earK + hb - 8 * SN, 2, 1);
  shape(c, E(hb, -84, 22 * (1 - 0.08 * SN), 20), P.pelt, { w: 1 });
  for (const q of [-1, 1]) shape(c, S(`M${fx + q * 14} -86 L${fx + q * 22} -70 L${fx + q * 15} -73 L${fx + q * 20} -60 L${fx + q * 11} -66Z`), P.pelt, { w: 0.8 });
  // void face: radial depth, rim stroke
  const vg = c.createRadialGradient(0, -76, 0, 0, -76, 15);
  vg.addColorStop(0, '#0a0f17'); vg.addColorStop(0.7, '#121923'); vg.addColorStop(1, '#1d2838');
  c.beginPath(); c.ellipse(fx, -76, 14 * (1 - 0.18 * SN), 12.5, 0, 0, Math.PI * 2); c.fillStyle = vg; c.fill(); c.lineWidth = 1.2; c.strokeStyle = mix(P.pelt, '#2a3a50', 0.5); c.stroke();
  // fur fringe over the opening
  for (const q of [-1, 0, 1]) {
    c.beginPath(); c.moveTo(fx + q * 6.5 - 2.4, -87.6); c.lineTo(fx + q * 6.5, -82.6 + (q === 0 ? 0.6 : 0)); c.lineTo(fx + q * 6.5 + 2.4, -87.6); c.closePath();
    c.fillStyle = P.pelt; c.fill(); c.lineWidth = 0.6; c.strokeStyle = mix(P.pelt, '#2a3a50', 0.55); c.lineJoin = 'round'; c.stroke();
  }
  shape(c, E(fx, -67, 7 * (1 - 0.3 * SN), 3.2), P.skin, { w: 0.3, nl: true });
  for (const sg of [-1, 1]) {
    const a = TH + sg * 0.55; const cs = Math.cos(a); if (cs < 0.12) continue;
    const x = 12 * Math.sin(a); const y = -77; const rx = 2.6 * (0.5 + 0.5 * cs);
    const soft = expr === 'worried' || expr === 'hurt';
    glowAt(c, x, y, soft ? 7 : 9, P.amber, expr === 'worried' ? 0.4 : expr === 'hurt' ? 0.3 : 0.6);
    if (expr === 'worried') {
      c.save(); c.translate(x, y); c.rotate((sg * 20 * Math.PI) / 180); ell(c, 0, 0.8, rx * 0.92, 3.5, P.glint, 0.88); c.restore();
      dot(c, x - 0.5, y + 1.8, 1.1, '#fff', 0.8);
    } else if (expr === 'hurt') {
      stroke(c, `M${x + sg * rx * 1.3} ${y - 2.6} L${x - sg * rx * 1.2} ${y} L${x + sg * rx * 1.3} ${y + 2.6}`, P.glint, 2.1);
      if (sg > 0) fillP(c, `M${x + 1} ${y + 4.5} q1.8 2.2 0 4 q-1.8 -1.8 0 -4Z`, '#bfe6ff');
    } else if (expr === 'blink') stroke(c, `M${x - rx * 1.2} ${y} L${x + rx * 1.2} ${y}`, P.glint, 1.8);
    else if (expr === 'death') stroke(c, `M${x - rx * 1.25} ${y + 1.8} Q${x} ${y - 3.2} ${x + rx * 1.25} ${y + 1.8}`, P.glint, 1.9, { a: 0.8 });
    else { ell(c, x, y, rx, 3.1, P.glint); dot(c, x - 0.6, y - 0.9, 0.9, '#fff'); }
  }
  // wolf muzzle (3/4 view) + nose
  const m = 6 + 12 * SN;
  shape(c, S(`M${m - 12} -97 Q${m} -99 ${m + 10} -93 Q${m + 15} -90 ${m + 14} -86 Q${m + 8} -83 ${m - 2} -85 Q${m - 10} -86 ${m - 12} -97Z`), P.pelt, { w: 0.9 });
  shape(c, E(m + 13, -87.5, 2.8, 2.3), P.nose, { w: 0.4, nl: true });
}

// ---- the PUP (pup units: origin = ground under the paws, sitting height ~46; drawn scaled by PUP_K) ---------------------
const PTH = 1.2; const PS = Math.sin(PTH); const PAB = Math.abs(PS);
const PUP_G = {
  sit: { by: -11, rx: 9.2, ry: 11 },
  run: { rx: 13.5, ry: 7.2 },
};
const RUN_BOB = (k) => -3 * Math.abs(Math.sin(k * (Math.PI / 2) + 0.3));
export const pupRunBob = RUN_BOB;

function pupEmberTip(c, tx, ty, sc = 1, glowA = 0.95) {
  glowAt(c, tx, ty, 12 * sc, P.amber, glowA);
  dot(c, tx, ty, 3.1 * sc, P.pupEmber); dot(c, tx - 0.4, ty - 0.5, 1.5 * sc, '#fff4c8');
}

export function drawPupTail(c, pose) {
  const run = pose === 'run';
  const x0 = run ? -13 : -9; const y0 = run ? -19 : -4; const tx = run ? -27 : -22; const ty = run ? -30 : -17;
  shape(c, S(`M${x0 + 3} ${y0 - 3} C${x0 - 8} ${y0 - 7} ${tx - 5} ${ty + 10} ${tx} ${ty} C${tx + 3} ${ty + 7} ${x0 - 8} ${y0 + 4} ${x0 + 3} ${y0 + 3}Z`), P.pupDk, { w: 0.8 });
  pupEmberTip(c, tx, ty);
}
export const PUP_TAIL_ROOT = { sit: [-6, -4], run: [-10, -19] };

export function drawPupBody(c, pose, k = 0) {
  if (pose === 'sit') {
    const by = PUP_G.sit.by;
    shape(c, E(-4.5, -5, 7.6, 5.2), P.pupDk, { w: 0.8 });
    shape(c, E(-1.4, by + 0.5, 8.8, 11.2), P.pup, { w: 0.9 });
    shape(c, S(`M3 ${by - 8} Q9 ${by - 4} 7.6 ${by + 5} Q3 ${by + 6} 1.5 ${by - 3}Z`), P.pupChest, { w: 0.5 });
    shape(c, CAP(5.4, -11, 6.8, -2.4, 2.9, 2.5), P.pup, { w: 0.7 }); shape(c, E(8.2, -1.8, 4, 2.2), P.pup, { w: 0.6 });
    return;
  }
  const bob = RUN_BOB(k); const by = -17 + bob; const { rx, ry } = PUP_G.run; const ph = k * (Math.PI / 2) + 0.3;
  const legs = [[0.62, 0], [0.34, 1.6], [-0.4, 3.0], [-0.66, 4.6]];
  const lx = (kk, i) => { const phi = ph + legs[i][1]; return [kk * rx + 7 * Math.sin(phi) * (i < 2 ? 1 : 0.9), -1.8 - Math.max(0, -Math.cos(phi)) * 7]; };
  const leg = (i) => { const [fx, fy] = lx(legs[i][0], i); const col = i % 2 ? P.pupDk : P.pup; shape(c, CAP(legs[i][0] * rx, by + 2, fx, fy + 0.5, 2.9, 2.4), col, { w: 0.7 }); shape(c, E(fx + 1.5, fy, 3.6, 2), col, { w: 0.6 }); };
  leg(1); leg(3);
  shape(c, E(0, by, rx, ry), P.pup, { w: 0.9 });
  shape(c, S(`M${rx * 0.5} ${by - ry * 0.6} Q${rx * 0.95} ${by + ry * 0.2} ${rx * 0.55} ${by + ry * 0.9} Q${rx * 0.2} ${by + ry * 0.5} ${rx * 0.3} ${by - ry * 0.4}Z`), P.pupChest, { w: 0.5 });
  leg(0); leg(2);
}
// anchors for the head neck pivot / tail root per body frame (pup units)
export const pupAnchors = (pose, k = 0) => (pose === 'sit'
  ? { headC: [6.8, -27], tail: PUP_TAIL_ROOT.sit }
  : { headC: [PUP_G.run.rx * PAB, -24.5 + RUN_BOB(k)], tail: [PUP_TAIL_ROOT.run[0], PUP_TAIL_ROOT.run[1] + RUN_BOB(k)] });

// head drawn with its centre at the origin; the neck pivot is local (-2, 8.5). ex: open | happy | hurt | blink
export const PUP_NECK = [-2, 8.5];
export function drawPupHead(c, ex = 'open') {
  const R = 9.8; const flat = ex === 'hurt';
  const earSh = (bx, by2, lean, col) => {
    const l = flat ? lean * 1.2 + Math.sign(lean || 1) * 11 : lean; const h = flat ? 6.5 : 14.2; const w = 5.6;
    shape(c, S(`M${bx - w} ${by2} Q${bx - w * 0.7 + l * 0.5} ${by2 - h * 0.55} ${bx + l} ${by2 - h} Q${bx + w * 0.7 + l * 0.4} ${by2 - h * 0.5} ${bx + w} ${by2}Z`), col, { w: 0.7 });
    if (!flat) shape(c, S(`M${bx - w * 0.55} ${by2 - 1} Q${bx - w * 0.3 + l * 0.5} ${by2 - h * 0.5} ${bx + l * 0.9} ${by2 - h * 0.78} Q${bx + w * 0.3 + l * 0.4} ${by2 - h * 0.45} ${bx + w * 0.55} ${by2 - 1}Z`), P.pupIn, { w: 0.3, nl: true });
  };
  // far ear (darker, behind) then near ear
  earSh(0.82, -R * (0.62 + 0.068), -1.5, P.pupDk);
  earSh(3.64, -R * (0.62 + 0.0997), -1.5, P.pup);
  shape(c, C(0, 0, R), P.pup, { w: 0.9 });
  shape(c, S(`M${-2 + 2 * PS} ${-R + 1} L${0.5 + 2 * PS} ${-R - 4.6} L${3 + 2 * PS} ${-R + 1.2}Z`), P.pup, { w: 0.5 });
  const mx = (R + 1.2) * Math.sin(PTH) * 0.9; const my = 3.4; const mrx = 3.6 + 2.8 * PAB;
  shape(c, E(mx, my, mrx, 3.3), P.pupChest, { w: 0.7 });
  ell(c, mx + 1.3 * PS + (mrx - 3) * 0.3 * PAB, my - 1.6, 1.7, 1.2, '#3a2418');
  if (ex === 'happy') fillP(c, `M${mx - 1.6} ${my + 1.2} Q${mx} ${my + 4.8} ${mx + 1.8} ${my + 1.2}Z`, '#ff9a8a');
  else stroke(c, `M${mx - 1.8} ${my + 1.2} Q${mx} ${my + 2.8} ${mx + 1.8} ${my + 1.2}`, '#7a4222', 0.8);
  const a = PTH - 0.66; const cs = Math.cos(a); const x = R * 0.95 * Math.sin(a); const y = -0.8; const rx2 = 2.2 * (0.45 + 0.55 * cs);
  if (ex === 'happy') stroke(c, `M${x - rx2 * 1.1} ${y + 1} Q${x} ${y - 3.3} ${x + rx2 * 1.1} ${y + 1}`, P.pupEye, 1.5);
  else if (ex === 'blink') stroke(c, `M${x - rx2 * 1.1} ${y - 0.4} Q${x} ${y + 2.4} ${x + rx2 * 1.1} ${y - 0.4}`, P.pupEye, 1.4);
  else if (ex === 'hurt') stroke(c, `M${x - rx2} ${y - 1.8} L${x + rx2 * 0.9} ${y} L${x - rx2} ${y + 1.8}`, P.pupEye, 1.4);
  else { ell(c, x, y, rx2, 2.6, P.pupEye); ell(c, x, y + 2.6 * 0.38, rx2 * 0.62, 2.6 * 0.45, '#e98a3a', 0.85); dot(c, x - rx2 * 0.28, y - 2.6 * 0.3, Math.max(0.85, rx2 * 0.42), '#fff'); }
  if (ex === 'happy') ell(c, R * Math.sin(PTH - 1.05 + 1.2) * 0 + 1.5, 4.2, 2.4, 1.7, '#ff9a7a', 0.5);
  // thread collar (tied to her finger thread: the leash of light)
  stroke(c, `M${-7.5 * 0.4} ${8.2} Q${0.5} ${11.8} ${8 * 0.6} ${8}`, P.amber, 1.7);
  c.beginPath(); c.arc(0.5, 11.2, 1.6, 0, Math.PI * 2); c.fillStyle = P.amber; c.fill(); c.lineWidth = 0.5; c.strokeStyle = '#a8541a'; c.stroke();
}

// ---- flat composites (Low tier hero, crowd outline source, portraits) ----------------------------------------------------
export const REST = { tail: -0.05, expr: 'neutral' };
export function drawWrenFlat(c) {
  c.save(); c.translate(ANCHOR.tail[0], ANCHOR.tail[1]); c.rotate(REST.tail); c.translate(-ANCHOR.tail[0], -ANCHOR.tail[1]); drawWrenTail(c); c.restore();
  c.save(); c.translate(ANCHOR.bootFar[0], ANCHOR.bootFar[1]); drawWrenBoot(c); c.restore();
  c.save(); c.translate(ANCHOR.bootNear[0], ANCHOR.bootNear[1]); drawWrenBoot(c); c.restore();
  drawWrenBody(c);
  drawWrenHead(c, 'neutral');
  stroke(c, `M${ANCHOR.hand[0]} ${ANCHOR.hand[1]} Q${ANCHOR.ember[0] * 0.9} ${(ANCHOR.ember[1] + ANCHOR.hand[1]) / 2 + 4} ${ANCHOR.ember[0]} ${ANCHOR.ember[1] + 12}`, P.amber, 1.2, { dash: [1.2, 2.4] });
  c.save(); c.translate(ANCHOR.ember[0], ANCHOR.ember[1]); c.scale(0.95, 0.95); drawEmber(c); c.restore();
}
// flat hero box (du): left/top margin so every part fits. Origin (feet) inside the box:
export const FLAT = { x0: -52, y0: -132, w: 106, h: 140 };
export const FLAT_TEXEL = 1.5; // texels per du of the flat Wren sprite

export function drawPupFlat(c, pose) {
  // pup units, origin ground under the paws. glow baked in (normal alpha) so Low tier still has a soft warm halo
  glowAt(c, 0, -17, 30, P.amber, 0.28);
  ell(c, 0, 1, 12, 2.6, '#04040c', 0.32);
  const tail = pose === 'sit' ? PUP_TAIL_ROOT.sit : PUP_TAIL_ROOT.run;
  c.save(); drawPupTail(c, pose); c.restore();
  drawPupBody(c, pose, 0);
  const an = pupAnchors(pose, 0); const hc = an.headC;
  c.save(); c.translate(hc[0], hc[1]); drawPupHead(c, pose === 'run' ? 'happy' : 'open'); c.restore();
  void tail;
}
export const PUP_FLAT = { x0: -40, y0: -56, w: 80, h: 72 };

// ---- atlas ---------------------------------------------------------------------------------------------------------------------
// Frame spec: bb (du, part-local), pv (pivot du), draw(c). Pup frames are authored in pup units and scaled by PUP_K here.
const wf = (name, bb, pv, draw) => ({ name, bb, pv, draw });
const pf = (name, bb, pv, draw) => ({
  name, bb: bb.map((v) => v * PUP_K), pv: pv.map((v) => v * PUP_K), draw: (c) => { c.scale(PUP_K, PUP_K); draw(c); },
});
export const FRAMES = [
  wf('w_tail', [-50, -60, -2, -12], ANCHOR.tail, drawWrenTail),
  wf('w_boot', [-10, -8, 10, 8], [0, 0], drawWrenBoot),
  wf('w_body', [-38, -76, 38, 8], [0, 0], drawWrenBody),
  ...Object.keys(HEAD_EXPR).map((e) => wf(`w_head_${e}`, [-42, -132, 42, -52], ANCHOR.neck, (c) => drawWrenHead(c, e))),
  wf('w_ember', [-13, -20, 13, 17], [0, 0], drawEmber),
  pf('p_tail_sit', [-40, -44, 2, 8], PUP_TAIL_ROOT.sit, (c) => drawPupTail(c, 'sit')),
  pf('p_tail_run', [-46, -52, 2, 4], PUP_TAIL_ROOT.run, (c) => drawPupTail(c, 'run')),
  pf('p_body_sit', [-18, -26, 14, 5], [0, 0], (c) => drawPupBody(c, 'sit')),
  ...[0, 1, 2, 3].map((k) => pf(`p_body_run${k}`, [-20, -32, 24, 5], [0, 0], (c) => drawPupBody(c, 'run', k))),
  ...['open', 'happy', 'hurt', 'blink'].map((e) => pf(`p_head_${e}`, [-16, -32, 20, 18], PUP_NECK, (c) => drawPupHead(c, e))),
];

// Shelf packer (pure): sizes [{name,w,h}] -> {w,h,rects:{name:{x,y,w,h}}}. 2 px gutter keeps linear filtering from bleeding.
export function shelfPack(items, maxW = 1024, gap = 2) {
  const rects = {}; let x = 0; let y = 0; let rowH = 0; let W = 0;
  for (const it of items) {
    if (x + it.w > maxW) { y += rowH + gap; x = 0; rowH = 0; }
    rects[it.name] = { x, y, w: it.w, h: it.h };
    x += it.w + gap; rowH = Math.max(rowH, it.h); W = Math.max(W, x - gap);
  }
  return { w: W, h: y + rowH, rects };
}

// Draws every frame into one canvas. mk(w,h) -> canvas. Returns {cv, frames:{name:{x,y,w,h,ox,oy}}} (ox,oy = origin fraction).
export function buildRigAtlas(mk, frameList = FRAMES, pack = 768) {
  const items = frameList.map((f) => ({ name: f.name, w: Math.ceil((f.bb[2] - f.bb[0]) * TEX), h: Math.ceil((f.bb[3] - f.bb[1]) * TEX) }));
  const pk = shelfPack(items, pack);
  const cv = mk(pk.w, pk.h); const c = cv.getContext('2d');
  const frames = {};
  for (const f of frameList) {
    const r = pk.rects[f.name];
    c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip();
    c.translate(r.x - f.bb[0] * TEX, r.y - f.bb[1] * TEX); c.scale(TEX, TEX);
    f.draw(c);
    c.restore();
    frames[f.name] = { x: r.x, y: r.y, w: r.w, h: r.h, ox: ((f.pv[0] - f.bb[0]) * TEX) / r.w, oy: ((f.pv[1] - f.bb[1]) * TEX) / r.h };
  }
  return { cv, frames };
}
