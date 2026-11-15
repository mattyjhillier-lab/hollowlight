// Lucinda, the Hearth-Warden (hidden hero, release switch is DM8-DM10): option A Ember Horns, hood down, drawn in code from the locked look (docs/design/lucinda-ophimber-look-v1.md).
// Same craft as Wren / Elias: the REAL helpers from wrenart.js (L2 tinted outline, H2 gradient + rim, P1 chibi, design units DU, one atlas). Visual only.
// Origin = ground under the feet, y up is negative, faces +x. Parts go into ONE atlas ('lucinda_rig'): tail, boot, body (far arm + cloak + cowl), 5 heads, near arm with the hearth flame.
import { shape, S, E, C, CAP, stroke, fillP, glowAt, dot, mix } from './wrenart.js';

export const F = (n) => (+n).toFixed(2);
const TH = 0.6; const SN = Math.sin(TH); const XS = 1 - 0.36 * SN;
export const INK = '#2a0f30';
export const ink = (c) => mix(c, INK, 0.7);

// ---- new helpers (same style family): tapered limb along a cubic, overlapping scale plates, flame, spikes ------------------
export const bz = (p, t) => { const u = 1 - t; return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]]; };
export const bzN = (p, t) => { const a = bz(p, Math.max(0, t - 0.01)); const b = bz(p, Math.min(1, t + 0.01)); const dx = b[0] - a[0]; const dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l, dx / l, dy / l]; };
// closed tapered shape along cubic p (8 numbers); w(t) half width (number pair or fn). Returns {p,bb,L,R} (L = left side points)
export function taper(p, w0, w1 = w0, n = 22) {
  const L = []; const R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; const q = bz(p, t); const [nx, ny] = bzN(p, t);
    const w = typeof w0 === 'function' ? w0(t) : w0 + (w1 - w0) * t;
    L.push([q[0] + nx * w, q[1] + ny * w]); R.push([q[0] - nx * w, q[1] - ny * w]);
  }
  const pts = L.concat(R.slice().reverse());
  let x0 = 1e9; let y0 = 1e9; let x1 = -1e9; let y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { p: new Path2D('M' + pts.map((q) => F(q[0]) + ' ' + F(q[1])).join(' L') + 'Z'), bb: [x0, y0, x1, y1], L, R };
}
export const poly = (pts) => S('M' + pts.map((q) => F(q[0]) + ' ' + F(q[1])).join(' L') + 'Z');
// overlapping plates (drawn bottom row first so each row's rounded lower edge lies over the row below). Call inside a clip.
export function plates(c, x0, x1, y0, y1, r, col, o = {}) {
  const lt = mix(col, '#fff6dc', o.lt ?? 0.3); const dk = ink(col); const rows = [];
  for (let y = y0; y <= y1 + r; y += r * (o.dy ?? 1.05)) rows.push(y);
  for (let ri = rows.length - 1; ri >= 0; ri--) {
    const y = rows[ri]; const off = (ri % 2) * r;
    for (let x = x0 - 2 * r + off; x <= x1 + r; x += 2 * r) {
      const d = new Path2D(`M${F(x - r)} ${F(y - r * 1.2)} L${F(x - r)} ${F(y)} Q${F(x - r)} ${F(y + r * 1.05)} ${F(x)} ${F(y + r * 1.05)} Q${F(x + r)} ${F(y + r * 1.05)} ${F(x + r)} ${F(y)} L${F(x + r)} ${F(y - r * 1.2)}Z`);
      const g = c.createLinearGradient(x, y - r, x, y + r); g.addColorStop(0, mix(col, INK, 0.12)); g.addColorStop(0.65, col); g.addColorStop(1, lt);
      c.fillStyle = g; c.fill(d);
      c.save(); c.lineWidth = o.lw ?? 1.1; c.strokeStyle = dk; c.globalAlpha = o.a ?? 0.85; c.stroke(new Path2D(`M${F(x - r)} ${F(y)} Q${F(x - r)} ${F(y + r * 1.05)} ${F(x)} ${F(y + r * 1.05)} Q${F(x + r)} ${F(y + r * 1.05)} ${F(x + r)} ${F(y)}`)); c.restore();
      if (o.shine !== false) stroke(c, `M${F(x - r * 0.45)} ${F(y + r * 0.6)} Q${F(x)} ${F(y + r * 0.85)} ${F(x + r * 0.45)} ${F(y + r * 0.6)}`, lt, 0.9, { a: 0.7 });
    }
  }
}
// small rounded scale (cheek / forearm patches): a filled shield with a tinted edge
export function scaleDot(c, x, y, r, col, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const d = new Path2D(`M${F(-r)} ${F(-r * 0.6)} Q0 ${F(-r * 1.3)} ${F(r)} ${F(-r * 0.6)} Q${F(r * 1.05)} ${F(r * 0.5)} 0 ${F(r * 1.1)} Q${F(-r * 1.05)} ${F(r * 0.5)} ${F(-r)} ${F(-r * 0.6)}Z`);
  c.fillStyle = col; c.fill(d); c.lineWidth = Math.max(0.45, r * 0.26); c.strokeStyle = mix(col, INK, 0.4); c.stroke(d);
  stroke(c, `M${F(-r * 0.5)} ${F(-r * 0.35)} Q0 ${F(-r * 0.75)} ${F(r * 0.5)} ${F(-r * 0.35)}`, mix(col, '#fff6dc', 0.55), r * 0.3, { a: 0.8 });
  c.restore();
}
// warm flame (light, not a body colour): gold to ember, white core; base (x,y), height h, pointing along angle ang (0 = up)
export function flame(c, x, y, h, w, ang = 0, o = {}) {
  c.save(); c.translate(x, y); c.rotate(ang);
  if (o.glow !== false) glowAt(c, 0, -h * 0.45, h * (o.gr ?? 1.6), o.gc || '#ffc96b', o.ga ?? 0.55);
  const fp = (k, lean) => `M0 0 C${F(-w * k)} ${F(-h * k * 0.1)} ${F(-w * k * 0.9 + lean)} ${F(-h * k * 0.55)} ${F(lean * 1.6)} ${F(-h * k)} C${F(w * k * 0.9 + lean)} ${F(-h * k * 0.55)} ${F(w * k)} ${F(-h * k * 0.1)} 0 0Z`;
  const ln = o.lean ?? 0;
  fillP(c, fp(1, ln), o.c3 || '#ef8a5a'); fillP(c, fp(0.74, ln * 0.8), o.c2 || '#ffc46a'); fillP(c, fp(0.44, ln * 0.6), '#fff6d0');
  c.restore();
}
// spikes along a sampled edge (pts = [[x,y],..]); n spikes between t0..t1, pointing along normal sign s
export function spikesAlong(c, p, t0, t1, n, h0, h1, col, s = 1, wk = 0.55, off = 0) {
  for (let i = 0; i < n; i++) {
    const t = t0 + (t1 - t0) * (n === 1 ? 0.5 : i / (n - 1)); const q0 = bz(p, t); const [nx, ny, tx, ty] = bzN(p, t); const h = h0 + (h1 - h0) * (i / Math.max(1, n - 1)); const w = h * wk;
    const o = (typeof off === 'function' ? off(t) : off) * s; const q = [q0[0] + nx * o, q0[1] + ny * o];
    const tip = [q[0] + nx * h * s - tx * h * 0.45, q[1] + ny * h * s - ty * h * 0.45];
    shape(c, S(`M${F(q[0] - tx * w)} ${F(q[1] - ty * w)} Q${F(q[0] + nx * h * 0.5 * s - tx * w * 0.6)} ${F(q[1] + ny * h * 0.5 * s - ty * w * 0.6)} ${F(tip[0])} ${F(tip[1])} Q${F(q[0] + nx * h * 0.35 * s + tx * w * 0.5)} ${F(q[1] + ny * h * 0.35 * s + ty * w * 0.5)} ${F(q[0] + tx * w)} ${F(q[1] + ty * w)}Z`), col, { w: 0.55 });
  }
}


// ================================================== LUCINDA (option A, Ember Horns, hood down: LOCKED 2026-11-13) =================================
// Female half-dragon Hearth-Warden. Big silhouette traits: ivory horns swept back, ribbed ear-fin, dorsal spines down the cloak, a thick scaled tail
// ending in an outlined rose-gold flame-leaf. Small trim: cheek + forearm scales, slit ember eyes, a tiny fang, clawed hands cupping a hearth flame.
export const LP = { cloak: '#3f8a80', tunic: '#e4bd9c', skin: '#f3cdb0', scale: '#dc7a5e', accent: '#ef8a5a', hair: '#7a4636', horn: '#e8cfa4', boot: '#3e2c36', fin: '#f2d6a6', belt: '#ef8a5a' };
const P = LP;
const HC = -84; const HB = -2 * SN; const HX = 22; const HY = 21; const FX = 9 * SN;

export const L_ANCHOR = {
  bootFar: [-6.5 * XS + 3 * SN, -2.6], bootNear: [6.5 * XS + 3 * SN, -2.6],
  neck: [0, -66], // head pivot
  shoulder: [12 * XS + 2, -58], // the near arm swings about this
  flame: [27, -47], // the hearth flame she cups (her light), at rest
  tail: [-12, -22], // tail root (the tail sways about it)
  hem: [-24, -22], // trail anchor only
  perch: [-36, -57], // where Ophimber sits: her back shoulder, at the nape (her du)
};
export const PERCH_SCALE = 0.84;

// head expressions: closed (eyes shut), brow raise (du, up), brow slant (hurt / sad), tilt (deg), drop (du)
export const L_EXPR = {
  kind: { closed: false, raise: 0, slant: 0, hy: 0, tilt: 0 },
  blink: { closed: true, raise: 0, slant: 0, hy: 0, tilt: 0 },
  hurt: { closed: true, raise: 0, slant: 1, hy: 1, tilt: -7 },
  cast: { closed: false, raise: -2.2, slant: 0, hy: 0, tilt: 3 },
  death: { closed: true, raise: 0, slant: 1, hy: 3, tilt: -3 },
};

export function lucTail(c) {
  const p = [-12, -22, -38, -10, -58, -14, -64, -32];
  const wf = (t) => 8.6 * (1 - t) + 2.6 * t;
  const tl = taper(p, wf);
  const back = tl.L; const belly = tl.R;
  spikesAlong(c, p, 0.1, 0.7, 5, 6.5, 4, P.accent, 1, 0.5, (t) => wf(t) - 1.2);
  shape(c, tl, P.scale, {
    w: 0.9, x: (k) => {
      for (let i = 1; i < 21; i += 2) { const a = back[i]; const b = belly[i]; stroke(k, `M${F(a[0] * 0.3 + b[0] * 0.7)} ${F(a[1] * 0.3 + b[1] * 0.7)} L${F(b[0])} ${F(b[1])}`, mix(P.scale, '#fff1d6', 0.6), 2.4, { a: 0.85 }); }
      for (let i = 2; i < 21; i += 3) { const a = back[i]; const b = belly[i]; stroke(k, `M${F(a[0])} ${F(a[1])} Q${F(a[0] * 0.6 + b[0] * 0.4 + 1)} ${F(a[1] * 0.6 + b[1] * 0.4)} ${F(a[0] * 0.45 + b[0] * 0.55)} ${F(a[1] * 0.45 + b[1] * 0.55)}`, mix(P.scale, INK, 0.35), 1, { a: 0.6 }); }
    },
  });
  tailTip(c, p, 1.05, P.accent, 0);
}
// flame-leaf tail tip: an OUTLINED rose-gold leaf of flame that grows out of the tail, glowing core (also Ophimber's tail tip)
export function tailTip(c, p, s, accent, wob = 0) {
  const e = bz(p, 1); const [, , tx, ty] = bzN(p, 0.97);
  c.save(); c.translate(e[0] - tx * 2 * s, e[1] - ty * 2 * s); c.rotate(Math.atan2(tx, -ty) + wob); c.scale(s, s);
  glowAt(c, 0, -7, 15, '#ffc96b', 0.5);
  const d = 'M-3.6 1 C-6.8 -3 -6 -9 -2.2 -12.5 C-1 -14 0.2 -15.5 -0.6 -18.5 C3.6 -16 5.6 -11 4.6 -6.5 C4 -3 3.6 -0.5 3.6 1Z';
  shape(c, S(d), accent, {
    w: 0.7, x: (k) => {
      const g = k.createLinearGradient(0, 1, 0, -18); g.addColorStop(0, 'rgba(255,217,138,0)'); g.addColorStop(0.55, 'rgba(255,217,138,0.75)'); g.addColorStop(1, 'rgba(255,246,208,0.95)'); k.fillStyle = g; k.fill(new Path2D(d));
      fillP(k, 'M-1.2 -1 C-3 -4 -2.4 -7.5 0.2 -10.5 C1.8 -7.5 2.4 -4 1.2 -1Z', '#fff6d0', 0.95);
    },
  });
  c.restore();
}

export function lucBoot(c) {
  shape(c, E(0, 0, 7, 4.2), P.boot, { w: 0.8 });
  for (const dx of [3.2, 6.4]) shape(c, S(`M${dx - 1.4} 1.5 L${dx + 1.6} 1.2 L${dx + 2.6} 4.2Z`), '#efe2c6', { w: 0.35 });
}

function lucArmFar(c) {
  shape(c, CAP(-12 * XS, -58, -20, -42, 6, 5), mix(P.cloak, INK, 0.1), { w: 0.9 });
  shape(c, C(-21, -38.5, 4), P.skin, { w: 0.7 });
  for (const [x, y, a] of [[-24.6, -36.4, 2.6], [-22.4, -34.6, 2.0]]) { c.save(); c.translate(x, y); c.rotate(a); shape(c, S('M0 -1 L2.6 0 L0 1Z'), '#f4ead6', { w: 0.3 }); c.restore(); }
}

// body: far arm, scale-plate cloak (hem ends in a tail-point), rose-gold front edge, dorsal spines, belt, the rolled scale cowl. afterBody = the costume hook.
export function lucBody(c, afterBody = null) {
  c.save(); c.translate(0, 1); c.scale(1, 0.2); { const g = c.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, 'rgba(4,4,12,0.5)'); g.addColorStop(0.6, 'rgba(4,4,12,0.28)'); g.addColorStop(1, 'rgba(4,4,12,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.fill(); } c.restore();
  lucArmFar(c);
  const W = 27 * XS + 2;
  const back = -W - 1;
  let hem = ''; const n = 6; const hx0 = back + 2; const hx1 = W;
  for (let i = 1; i <= n; i++) { const xa = hx0 + ((hx1 - hx0) * (i - 0.5)) / n; const xb = hx0 + ((hx1 - hx0) * i) / n; hem += `Q${F(xa)} ${F(-4)} ${F(xb)} ${F(-10)} `; }
  const cloakD = `M${F(-12 * XS)} -64 Q${F(-W * 1.08)} -46 ${F(back)} -14 L${F(back - 15)} -4 L${F(hx0)} -10 ${hem}Q${F(W * 1.08)} -44 ${F(12 * XS)} -64 Q0 -68 ${F(-12 * XS)} -64Z`;
  shape(c, S(cloakD), P.cloak, { w: 1, x: (k) => plates(k, -W - 18, W + 4, -60, -6, 5.2, P.cloak) });
  stroke(c, `M${F(7 + 4 * SN)} -58 Q${F(8.5 + 3 * SN)} -32 ${F(11 + 3 * SN)} -11`, mix(P.cloak, INK, 0.55), 3.4, { a: 0.9 });
  stroke(c, `M${F(7 + 4 * SN)} -58 Q${F(8.5 + 3 * SN)} -32 ${F(11 + 3 * SN)} -11`, mix(P.accent, '#fff1d6', 0.15), 1.8, { a: 0.95 });
  spikesAlong(c, [-12 * XS, -64, -W * 1.08, -52, back - 2, -30, back - 2, -12], 0.12, 0.9, 5, 7, 4, P.accent, 1);
  shape(c, S(`M${F(-W + 4)} -32 Q0 -27 ${F(W - 2)} -31 L${F(W - 2)} -26.5 Q0 -22.5 ${F(-W + 4)} -27.5Z`), mix(P.cloak, INK, 0.35), { w: 0.6 });
  shape(c, E(W - 6, -29, 3.2, 3.6), '#ffcf8a', { w: 0.5 }); glowAt(c, W - 6, -29, 7, '#ffc96b', 0.45);
  if (afterBody) afterBody(c);
  // hood down: a rolled scale cowl behind the neck with a spiny crest
  shape(c, S(`M${F(-24 * XS)} -58 Q${F(-27)} -72 ${F(-8)} -72 Q${F(10)} -73 ${F(20 * XS)} -62 Q${F(6)} -60 ${F(-4)} -61 Q${F(-16)} -60 ${F(-24 * XS)} -58Z`), P.cloak, { w: 0.9, x: (k) => plates(k, -30, 24, -74, -56, 3.6, P.cloak, { shine: false }) });
  spikesAlong(c, [-24 * XS, -58, -28, -66, -24, -72, -12, -74], 0.1, 0.95, 4, 4, 6, P.accent, 1);
}

// near arm: bare scaled forearm, clawed hand cupping a small hearth flame (baked at rest; the rig adds a flickering glow). Pivot = the shoulder.
export function lucArmNear(c) {
  const sl = P.cloak;
  shape(c, CAP(12 * XS + 2, -58, 19, -46, 6.4, 5.4), sl, { w: 0.9, x: (k) => plates(k, 6, 26, -62, -44, 3.2, sl, { shine: false }) });
  shape(c, S('M14 -48 Q19 -51 24 -46 L23 -43 Q19 -46 14.5 -44Z'), sl, { w: 0.6 });
  shape(c, CAP(19, -45, 24, -37, 4.3, 3.8), P.skin, { w: 0.8 });
  scaleDot(c, 20.2, -43.2, 2.1, P.scale, 0.3); scaleDot(c, 22.4, -40, 1.9, P.scale, 0.3); scaleDot(c, 19.8, -39.6, 1.5, P.scale, 0.3);
  flame(c, 27, -41, 13, 5, 0.05, { ga: 0.5, gr: 1.5 });
  shape(c, E(26.5, -37.5, 5, 3.6), P.skin, { w: 0.75 });
  for (const [x, y, a] of [[30.4, -39.8, -0.6], [31.2, -37, 0], [30, -34.6, 0.6]]) { c.save(); c.translate(x, y); c.rotate(a); shape(c, S('M0 -1.1 L3 0 L0 1.1Z'), '#f4ead6', { w: 0.35 }); c.restore(); }
}

function horn(c, root, far) {
  const [x, y] = root; const col = far ? mix(P.horn, INK, 0.18) : P.horn;
  const p = [x, y, x - 5, y - 11, x - 21, y - 12, x - 29, y - 25]; // swept back, tip hooks up
  const tp = taper(p, 5, 0.6);
  shape(c, tp, col, {
    w: 0.9, x: (k) => {
      const a = bz(p, 0.55); const b = bz(p, 1); const g = k.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, 'rgba(239,138,90,0)'); g.addColorStop(1, 'rgba(239,138,90,0.85)'); k.fillStyle = g; k.fill(tp.p);
      for (let i = 3; i < 19; i += 3) stroke(k, `M${F(tp.L[i][0])} ${F(tp.L[i][1])} L${F(tp.R[i][0])} ${F(tp.R[i][1])}`, mix(col, INK, 0.35), 0.9, { a: 0.7 });
    },
  });
}

function earFin(c, x, y, s = 1) {
  const rib = mix(P.scale, INK, 0.35);
  c.save(); c.translate(x, y); c.scale(s, s);
  const tips = [[-17, -13], [-20, -3], [-15, 6]];
  const d = `M2 -5 L${tips[0][0]} ${tips[0][1]} Q-11 -6 ${tips[1][0]} ${tips[1][1]} Q-11 1 ${tips[2][0]} ${tips[2][1]} Q-6 6 2 5Z`;
  shape(c, S(d), P.fin, { w: 0.7, x: (k) => { for (const tp of tips) stroke(k, `M1 0 L${tp[0]} ${tp[1]}`, rib, 1.3, { a: 0.85 }); } });
  c.restore();
}

export function lucHead(c, expr = 'kind') {
  const X = L_EXPR[expr] || L_EXPR.kind;
  const hb = HB; const hc = HC;
  // back hair (falls to the shoulders)
  shape(c, S(`M${F(hb - 6)} ${hc - 18} Q${F(hb - 30)} ${hc - 14} ${F(hb - 27)} ${hc + 14} Q${F(hb - 25)} ${hc + 26} ${F(hb - 12)} ${hc + 24} Q${F(hb - 4)} ${hc + 18} ${F(hb + 2)} ${hc + 12}Z`), P.hair, { w: 0.9 });
  const roots = [[hb - 10, hc - 13], [hb + 6, hc - 18]];
  horn(c, roots[0], true);
  shape(c, E(hb, hc, HX, HY), P.skin, { w: 1 });
  earFin(c, hb - 12, hc + 1, 1.25);
  for (const [x, s] of [[FX - 6, 1], [FX + 14, 0.7]]) { c.save(); c.translate(x, hc + 12); c.scale(s, 0.62); fillP(c, 'M-5 0 A5 5 0 1 0 5 0 A5 5 0 1 0 -5 0Z', '#ee9a8a', 0.45); c.restore(); }
  for (const [x, y, r] of [[-10.6, 5.5, 1.6], [-9.4, 8.6, 2], [-7.4, 11.6, 2.2], [-4.6, 14, 1.8]]) scaleDot(c, hb + x, hc + y, r, P.scale, -0.5);
  for (const [x, y, r] of [[20.6, 9.6, 1.4], [19.4, 12.4, 1.2]]) scaleDot(c, hb + x, hc + y, r, P.scale, 0.4);
  // eyes: ember-gold, vertical slit pupils, lash line, warm glow
  for (const sg of [-1, 1]) {
    const a = TH + sg * 0.5; const cs = Math.cos(a); const x = 19 * Math.sin(a) + hb + 1; const y = hc + 4; const k = 0.55 + 0.45 * cs;
    const slant = X.slant ? -sg * 2.4 : 0;
    if (X.closed) {
      stroke(c, `M${F(x - 4.4 * k)} ${y + 1} Q${F(x)} ${y + 3.6} ${F(x + 4.4 * k)} ${y + 1}`, '#3a1830', 1.9);
      stroke(c, `M${F(x - 3.4 * k)} ${F(y - 9 + slant)} Q${F(x)} ${F(y - 10.4)} ${F(x + 3.4 * k)} ${F(y - 9.2 - slant)}`, mix(P.hair, INK, 0.2), 1.3, { a: 0.8 });
      continue;
    }
    glowAt(c, x, y + 1, 9, '#ffc96b', 0.3);
    const rx = 4.7 * k; const ry = 6.2;
    c.save(); c.beginPath(); c.ellipse(x, y, rx + 0.5, ry + 0.5, 0, 0, Math.PI * 2); c.fillStyle = '#4a1a34'; c.fill();
    const g = c.createLinearGradient(x, y - ry, x, y + ry); g.addColorStop(0, '#f08a50'); g.addColorStop(0.4, '#ffc46a'); g.addColorStop(1, '#fff2b8');
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = g; c.fill();
    c.beginPath(); c.ellipse(x + 0.3 * sg, y + 0.4, 0.95 * k, ry * 0.66, 0, 0, Math.PI * 2); c.fillStyle = '#2a0f22'; c.fill(); c.restore();
    dot(c, x - rx * 0.38, y - ry * 0.42, 1.9 * (0.6 + 0.4 * k), '#ffffff'); dot(c, x + rx * 0.4, y + ry * 0.48, 0.8, '#ffffff', 0.9);
    stroke(c, `M${F(x - rx - 0.6)} ${F(y - ry * 0.3)} Q${F(x - rx * 0.3)} ${F(y - ry - 1.6)} ${F(x + rx * 0.5)} ${F(y - ry - 0.6)} Q${F(x + rx + 0.4)} ${F(y - ry * 0.6)} ${F(x + rx + 2.2 * k)} ${F(y - ry * 0.9)}`, '#3a1830', 2.3);
    stroke(c, `M${F(x - 3.4 * k)} ${F(y - ry - 4.6 + X.raise)} Q${F(x)} ${F(y - ry - 6 + X.raise)} ${F(x + 3.4 * k)} ${F(y - ry - 4.8 + X.raise)}`, mix(P.hair, INK, 0.2), 1.3, { a: 0.8 });
  }
  dot(c, FX + 10, hc + 10, 0.9, '#c87a6a');
  if (expr === 'hurt' || expr === 'death') stroke(c, `M${F(FX + 3)} ${hc + 16.4} Q${F(FX + 7)} ${hc + 14.2} ${F(FX + 11)} ${hc + 16.2}`, '#8a3a40', 1.2);
  else {
    stroke(c, `M${F(FX + 3)} ${hc + 14.4} Q${F(FX + 7)} ${hc + 17.2} ${F(FX + 11)} ${hc + 14.2}`, '#8a3a40', 1.2);
    fillP(c, `M${F(FX + 8.4)} ${hc + 15.6} L${F(FX + 10)} ${hc + 15.2} L${F(FX + 9.2)} ${hc + 17.8}Z`, '#ffffff');
  }
  // side-swept fringe with separate locks + crown tufts (never a smooth helmet)
  shape(c, S(`M${F(hb - HX - 2)} ${hc + 9} Q${F(hb - HX - 6)} ${hc - 4} ${F(hb - HX + 1)} ${hc - 12} Q${F(hb - HX + 1)} ${hc - 23} ${F(hb - 7)} ${hc - 23} Q${F(hb + 1)} ${hc - 29} ${F(hb + 10)} ${hc - 23} Q${F(hb + HX + 5)} ${hc - 21} ${F(hb + HX + 2)} ${hc - 5} Q${F(FX + 18)} ${hc + 1} ${F(FX + 14)} ${hc + 5} Q${F(FX + 13)} ${hc - 5} ${F(FX + 7)} ${hc - 9} Q${F(FX - 2)} ${hc - 13} ${F(hb - 7)} ${hc - 8} Q${F(hb - 10)} ${hc - 3} ${F(hb - 10.5)} ${hc + 10} Q${F(hb - 15)} ${hc + 6} ${F(hb - HX - 2)} ${hc + 9}Z`), P.hair, {
    w: 0.72, x: (k) => {
      for (const [x0, x1, y1] of [[-8, -16, 4], [-1, -6, -6], [6, FX + 2, -10], [11, FX + 13, 1]]) stroke(k, `M${F(hb + x0 * 0.4)} ${hc - 21} Q${F(hb + x0)} ${hc - 12} ${F(hb + x1)} ${hc + y1}`, mix(P.hair, INK, 0.35), 1.1, { a: 0.7 });
      for (const [x, y] of [[-10, -14], [3, -17], [13, -12]]) stroke(k, `M${F(hb + x)} ${hc + y} q3 -2.2 6 -0.6`, mix(P.hair, '#fff6dc', 0.45), 1.5, { a: 0.75 });
    },
  });
  for (const [x, y, a, s] of [[-4, -20, -0.5, 1], [3, -21.5, 0.05, 1.15], [10, -19.5, 0.6, 0.9]]) {
    c.save(); c.translate(hb + x, hc + y); c.rotate(a); c.scale(s, s);
    shape(c, S('M-3.4 1.5 Q-2.6 -4 0.6 -7.5 Q0.4 -3.5 3.4 1.5Z'), P.hair, { w: 0.6 });
    c.restore();
  }
  horn(c, roots[1], false);
}

// ---- flat composite (Low tier hero, crowd outline source, iframe flicker, death) -------------------------------------------------
export const L_FLAT = { x0: -86, y0: -134, w: 166, h: 148 };
export const L_FLAT_TEXEL = 1.5;
export function drawLucindaFlat(c, afterBody = null) {
  c.save(); lucTail(c); c.restore();
  for (const a of [L_ANCHOR.bootFar, L_ANCHOR.bootNear]) { c.save(); c.translate(a[0], a[1]); lucBoot(c); c.restore(); }
  lucBody(c, afterBody);
  lucHead(c, 'kind');
  lucArmNear(c);
}

// ---- atlas -----------------------------------------------------------------------------------------------------------------------
const lf = (name, bb, pv, draw) => ({ name, bb, pv, draw });
export const LUCINDA_FRAMES = [
  lf('l_tail', [-86, -66, 0, 6], L_ANCHOR.tail, lucTail),
  lf('l_boot', [-12, -8, 14, 8], [0, 0], lucBoot),
  lf('l_body', [-60, -100, 54, 14], [0, 0], (c) => lucBody(c)),
  ...Object.keys(L_EXPR).map((e) => lf(`l_head_${e}`, [-56, -134, 44, -50], L_ANCHOR.neck, (c) => lucHead(c, e))),
  lf('l_arm', [-2, -90, 56, -22], L_ANCHOR.shoulder, lucArmNear),
];

// the palette colours that make up her body (the reserved-colour test reads these; flames, ember eyes and rose-gold trim are light / small trim and excluded)
export const BODY_COLOURS = ['cloak', 'tunic', 'skin', 'scale', 'hair', 'horn', 'boot', 'fin'];
