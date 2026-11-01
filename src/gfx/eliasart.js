// Elias v2 "The Lamplighter" + candle-wheel chandelier, drawn in code (Canvas2D) from the locked sheet (docs/mockups/elias-v2/elias2.mjs, 3/4 view only).
// Hollowlight Style v1 (same helpers and design units as Wren: DU, TEX, L2 outline, H2 gradient + rim). Origin = ground under the feet, y up is negative, faces +x.
// Parts go into ONE atlas ('elias_rig'): staff-back (wheel back half, pole, spade, lantern), 2 boots, body (coat, pockets, arms, spare candles), 5 heads, staff-front (hub, wheel front half).
import { TEX, shape, S, E, C, CAP, stroke, fillP, glowAt, dot, mix } from './wrenart.js';

export const PE = {
  coat: '#9a5a3c', coatDk: '#6e3d2a', coatLt: '#bd7a52', slate: '#6f8aa3', cream: '#e8dcc0', sage: '#7d9a6a', cap: '#3d4a5c', skin: '#e4b794', mous: '#cfc8bb',
  wood: '#7a5a3c', iron: '#3b4250', brass: '#d6a94c', brassDk: '#8a6a2c', pants: '#4a4034', boot: '#2e2622', cheek: '#e88a7a', candle: '#f6efe0',
};
const P = PE;
const INK = '#4a3238';

const TH = 0.6; const SN = Math.sin(TH); const CS = Math.cos(TH);
const XS = 1 - 0.26 * SN; // body narrowing in 3/4 view
const HB = -2 * SN; const FX = 14 * SN; const HC = -82; const HXS = 26 * (1 - 0.1 * SN);
const wx = (a, z) => a * CS + z * SN;
const STAFF_X = wx(47, 2);
const LGX = 11 * XS;
const TOP_Y = -118; const RING_Y = -104; const RING_RX = 21; const LAN_Y = TOP_Y - 8; // lantern centre

export const E_ANCHOR = {
  bootFar: [-LGX + 3 * SN, -4], bootNear: [LGX + 3 * SN, -4],
  neck: [0, -60], // head pivot
  hand: [STAFF_X, -48], // the hand that grips the pole; the staff swings about it
  lantern: [STAFF_X, LAN_Y + 8.6], // the lantern flame (his light)
  hem: [-20, -30], // W2b: back of the coat, where the trim wisp trails from (trail anchor only, draws nothing)
  crown: [STAFF_X, RING_Y - 6], // the candle wheel's glow centre
  staffBack: [STAFF_X, -60], staffFront: [STAFF_X, RING_Y], // atlas pivots (inside their frames)
};

// head expressions: eye style, brow (-1 sad, 0, 1 up), head drop (du), tilt (deg)
export const E_EXPR = {
  kind: { eye: 'arc', brow: 0, hy: 0, tilt: 0 },
  blink: { eye: 'closed', brow: 0, hy: 0, tilt: 0 },
  tender: { eye: 'open', brow: -1, hy: 2, tilt: -4 },
  hurt: { eye: 'x', brow: -1, hy: 1, tilt: -7 },
  brace: { eye: 'closed', brow: 1, hy: 1, tilt: 0 },
  death: { eye: 'closed', brow: -1, hy: 3, tilt: -3 },
};

const F1 = (n) => (+n).toFixed(1);
const gE = (c, x, y, rx, ry, col, a) => { c.save(); c.translate(x, y); c.scale(1, ry / rx); glowAt(c, 0, 0, rx, col, a); c.restore(); }; // elliptical glow
const strokeOut = (c, d, col, w) => { stroke(c, d, mix(col, '#2a0f30', 0.62), w + 2.2); stroke(c, d, col, w); };
const rectP = (x0, y0, x1, y1) => `M${F1(x0)} ${F1(y0)} L${F1(x1)} ${F1(y0)} L${F1(x1)} ${F1(y1)} L${F1(x0)} ${F1(y1)}Z`;

// ---- light bits -----------------------------------------------------------------------------------------------------------------
const fpath = (x, y, h, w, lean, k) => { const hh = h * k; const ww = w * k; return `M${F1(x)} ${F1(y)} C${F1(x - ww)} ${F1(y - hh * 0.1)} ${F1(x - ww * 0.9 + lean * k * 0.3)} ${F1(y - hh * 0.55)} ${F1(x + lean * k)} ${F1(y - hh)} C${F1(x + ww * 0.9 + lean * k * 0.3)} ${F1(y - hh * 0.55)} ${F1(x + ww)} ${F1(y - hh * 0.1)} ${F1(x)} ${F1(y)}Z`; };
// warm candle flame, base at (x,y), about 22*s high
function flame(c, x, y, s, o = {}) {
  const h = 22 * s; const w = 7 * s;
  if (o.glow !== false) glowAt(c, x, y - h * 0.5, (22 * s + 8) * (o.gk ?? 1), '#ffc96b', o.ga ?? 0.5);
  fillP(c, fpath(x, y, h, w, 0, 1), '#ff9d3a'); fillP(c, fpath(x, y, h, w, 0, 0.74), '#ffd05a'); fillP(c, fpath(x, y, h, w, 0, 0.44), '#fff6d0');
}

// ---- the chandelier wheel (hub on the pole, ring of 6 candles) ---------------------------------------------------------------
function wheelHalf(c, front) {
  const sx = STAFF_X; const y = RING_Y; const rx = RING_RX; const ry = rx * 0.3; const lw = 3.2; const n = 6; const ph = 0.5;
  const arc = (a0, a1) => { const d = new Path2D(); d.ellipse(sx, y, rx, ry, 0, a0, a1); return d; };
  const brassInk = mix(P.brass, '#2a0f30', 0.62);
  const arcStroke = (a0, a1) => {
    c.save(); c.lineCap = 'round';
    c.strokeStyle = brassInk; c.lineWidth = lw + 2.2; c.stroke(arc(a0, a1));
    c.strokeStyle = P.brass; c.lineWidth = lw; c.stroke(arc(a0, a1)); c.restore();
  };
  const sp = (x2, y2) => strokeOut(c, `M${F1(sx)} ${F1(y)} L${F1(x2)} ${F1(y2)}`, P.brass, lw * 0.5);
  if (front) {
    arcStroke(0, Math.PI);
    c.save(); c.translate(0, -lw * 0.28); stroke(c, arc(0.08, Math.PI - 0.08), '#fff0b8', 1, { a: 0.7 }); c.restore();
    sp(sx, y + ry * 0.97);
  } else {
    arcStroke(Math.PI, Math.PI * 2);
    sp(sx - rx * 0.97, y); sp(sx + rx * 0.97, y); sp(sx, y - ry * 0.97);
  }
  const sz = Math.min(rx * 0.14 + 1.5, 5.2);
  for (let i = 0; i < n; i++) {
    const a = ph + (i * 2 * Math.PI) / n; const x = sx + rx * Math.cos(a); const yy = y + ry * Math.sin(a); const fr = Math.sin(a) >= 0;
    if (fr !== front) continue;
    const k = fr ? 1 : 0.86;
    const draw = () => {
      const ch = 5.6 * k * (sz / 3.6);
      shape(c, S(rectP(x - sz * 0.46 * k, yy - ch, x + sz * 0.46 * k, yy + 1.4)), P.candle, { w: 0.4 });
      flame(c, x, yy - ch, 0.6 * k * (sz / 3.6) ** 0.6, { ga: 0.42, gk: 0.8 });
    };
    const cup = () => shape(c, S(`M${F1(x - sz * 0.8 * k)} ${F1(yy - 0.2)} L${F1(x + sz * 0.8 * k)} ${F1(yy - 0.2)} L${F1(x + sz * 0.5 * k)} ${F1(yy + 2.6 * k)} L${F1(x - sz * 0.5 * k)} ${F1(yy + 2.6 * k)}Z`), P.brass, { w: 0.4 });
    if (fr) { cup(); draw(); } else { draw(); cup(); }
  }
}

export function drawStaffBack(c) {
  const sxl = STAFF_X; const topY = TOP_Y; const footY = 0;
  wheelHalf(c, false);
  // pole: wood, iron bands, spade foot
  shape(c, CAP(sxl, topY + 6, sxl, footY - 12, 4.4, 4.6), P.wood, { w: 0.9, x: (k) => stroke(k, `M${F1(sxl - 1.6)} ${topY} L${F1(sxl - 1.6)} ${footY - 12}`, '#a4805a', 1.4, { a: 0.6 }) });
  for (const by of [-86, -40, -20]) shape(c, S(rectP(sxl - 5.2, by - 1.6, sxl + 5.2, by + 1.6)), P.iron, { w: 0.5 });
  shape(c, S(`M${F1(sxl - 6.4)} ${footY - 20} L${F1(sxl + 6.4)} ${footY - 20} L${F1(sxl + 6.8)} ${footY - 9} L${F1(sxl)} ${footY + 0.5} L${F1(sxl - 6.8)} ${footY - 9}Z`), '#8b93a6', {
    w: 0.9, x: (k) => stroke(k, `M${F1(sxl)} ${footY - 18} L${F1(sxl)} ${footY - 3}`, '#4d566a', 1.2, { a: 0.6 }),
  });
  shape(c, S(rectP(sxl - 8.5, footY - 14.5, sxl + 8.5, footY - 11.6)), '#6b7488', { w: 0.5 });
  // lantern top: the old lantern, now the chandelier's centre flame
  const ly = LAN_Y; const lw = 7.4;
  shape(c, S(`M${F1(sxl - 3.6)} ${ly - 13} L${F1(sxl + 3.6)} ${ly - 13} L${F1(sxl + lw + 1.2)} ${ly - 9} L${F1(sxl - lw - 1.2)} ${ly - 9}Z`), P.brassDk, { w: 0.8 });
  c.beginPath(); c.arc(sxl, ly - 16, 2.7, 0, Math.PI * 2); c.lineWidth = 1.7; c.strokeStyle = P.brassDk; c.stroke();
  shape(c, S(`M${F1(sxl - lw)} ${ly - 9} L${F1(sxl + lw)} ${ly - 9} L${F1(sxl + lw - 1)} ${ly + 11} L${F1(sxl - lw + 1)} ${ly + 11}Z`), '#ffe7ae', { w: 0.9 });
  stroke(c, `M${F1(sxl - lw + 1)} ${ly - 7} L${F1(sxl - lw + 1.8)} ${ly + 9.5} M${F1(sxl + lw - 1)} ${ly - 7} L${F1(sxl + lw - 1.8)} ${ly + 9.5}`, P.iron, 1.8);
  flame(c, sxl, ly + 8.6, 0.62, { gk: 0.3, ga: 0.2 });
  shape(c, S(`M${F1(sxl - lw - 1.6)} ${ly + 11} L${F1(sxl + lw + 1.6)} ${ly + 11} L${F1(sxl + lw - 1)} ${ly + 15} L${F1(sxl - lw + 1)} ${ly + 15}Z`), P.brassDk, { w: 0.7 });
}

export function drawStaffFront(c) {
  shape(c, S(rectP(STAFF_X - 6.6, RING_Y - 3.6, STAFF_X + 6.6, RING_Y + 3.6)), P.brass, { w: 0.7 }); // collar hub
  wheelHalf(c, true);
}

export function drawEliasBoot(c) { shape(c, E(0, 0, 9.8, 5.2), P.boot, { w: 0.8 }); }

// ---- body: trousers, spare candles, coat with patches and four glowing pockets, arms ----------------------------------------------
export function drawEliasBody(c) {
  // soft ground shadow (baked, like Wren)
  c.save(); c.translate(0, 1); c.scale(1, 0.2); {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 33); g.addColorStop(0, 'rgba(4,4,12,0.5)'); g.addColorStop(0.6, 'rgba(4,4,12,0.28)'); g.addColorStop(1, 'rgba(4,4,12,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 33, 0, Math.PI * 2); c.fill();
  } c.restore();
  const shW = 27 * XS; const hemW = 38 * XS;
  shape(c, S(`M${F1(-14 * XS)} -18 L${F1(14 * XS)} -18 L${F1(15 * XS)} -6 L${F1(-15 * XS)} -6Z`), P.pants, { w: 0.8 });
  // spare-candle bundle strapped to his back, poking above the far shoulder
  c.save(); c.translate(-wx(14, 0) - 8, -8); c.translate(0, -42); c.rotate((-10 * Math.PI) / 180); c.translate(0, 42);
  for (let i = 0; i < 5; i++) {
    const cx0 = (i - 2) * 4.3; const h = 22 + (i % 2) * 5;
    shape(c, S(rectP(cx0 - 1.9, -42 - h, cx0 + 1.9, -42)), P.candle, { w: 0.5 });
    stroke(c, `M${F1(cx0)} ${-42 - h} l0 -2.3`, '#3a2e30', 1);
  }
  c.restore();
  // coat
  const coatD = `M${F1(-shW)} -58 Q${F1(-shW - 6)} -40 ${F1(-hemW)} -16 Q-8 -10 0 -13 Q8 -10 ${F1(hemW)} -16 Q${F1(shW + 6)} -40 ${F1(shW)} -58 Q0 -66 ${F1(-shW)} -58Z`;
  shape(c, S(coatD), P.coat, {
    w: 1.05, x: (k) => {
      k.save(); k.translate(-shW + 9, -51); k.rotate((-8 * Math.PI) / 180); fillP(k, rectP(-6, -4.5, 7, 4.5), P.sage); k.restore();
      fillP(k, rectP(shW - 15, -46, shW - 3, -34), P.slate); stroke(k, rectP(shW - 15, -46, shW - 3, -34), P.cream, 1.2, { dash: [2.4, 2] });
      fillP(k, rectP(-shW + 1, -27, -shW + 1 + 15 * XS, -18), P.cream, 0.9);
      fillP(k, `M${F1(-hemW - 4)} -18 Q0 -8 ${F1(hemW + 4)} -18 L${F1(hemW + 4)} -2 L${F1(-hemW - 4)} -2Z`, P.coatDk, 0.4);
    },
  });
  stroke(c, `M${F1(2 * SN)} -60 L${F1(2 * SN)} -14`, P.coatDk, 1.6, { a: 0.7 });
  for (const y of [-50, -39, -28]) shape(c, C(5 * SN + 5 * XS, y, 2.4), P.cream, { w: 0.5 });
  shape(c, S(`M${F1(-15 * XS)} -64 Q0 -52 ${F1(15 * XS)} -64 L${F1(11 * XS)} -57 Q0 -50 ${F1(-11 * XS)} -57Z`), P.coatDk, { w: 0.7 });
  // four pockets, each leaking light: bright slit, spill fan, motes (the readable coat tell); a stub candle pokes from the breast pocket
  const pk = [[-18 * XS, -26, 16, 12], [18 * XS, -26, 16, 12], [-13 * XS, -45, 12, 10], [15 * XS, -46, 9, 8]];
  pk.forEach(([px, py, pw, ph], i) => {
    gE(c, px, py + ph * 0.9, pw * 1.5, pw * 2.1, '#ffcf70', 0.62); gE(c, px, py - ph * 0.3, pw * 2.3, pw * 1.5, '#ffe2a0', 0.45);
    shape(c, S(`M${F1(px - pw / 2)} ${F1(py - ph / 2)} L${F1(px + pw / 2)} ${F1(py - ph / 2)} L${F1(px + pw / 2 - 0.8)} ${F1(py + ph / 2)} L${F1(px - pw / 2 + 0.8)} ${F1(py + ph / 2)}Z`), P.coatLt, {
      w: 0.7, x: (k) => {
        stroke(k, `M${F1(px - pw / 2)} ${F1(py - ph / 2 + 2.4)} L${F1(px + pw / 2)} ${F1(py - ph / 2 + 2.4)}`, P.coatDk, 1, { a: 0.7 });
        stroke(k, `M${F1(px - pw / 2 + 1.5)} ${F1(py + ph / 2 - 1.5)} L${F1(px + pw / 2 - 1.5)} ${F1(py + ph / 2 - 1.5)}`, P.cream, 1, { dash: [2, 1.6], a: 0.8 });
      },
    });
    stroke(c, `M${F1(px - pw * 0.42)} ${F1(py - ph / 2 - 0.2)} Q${F1(px)} ${F1(py - ph / 2 - 3.4)} ${F1(px + pw * 0.42)} ${F1(py - ph / 2 - 0.2)}`, '#fff2c0', 2.4);
    fillP(c, `M${F1(px - pw * 0.34)} ${F1(py - ph / 2 + 0.6)} L${F1(px - pw * 0.6)} ${F1(py + ph / 2 + 11)} L${F1(px + pw * 0.6)} ${F1(py + ph / 2 + 11)} L${F1(px + pw * 0.34)} ${F1(py - ph / 2 + 0.6)}Z`, '#ffe9a8', 0.3);
    dot(c, px + (i % 2 ? 3 : -3), py - ph / 2 - 7 - (i % 3) * 2, 1.5, '#fff2c0'); dot(c, px + (i % 2 ? -2 : 4), py + ph / 2 + 6 + (i % 2) * 3, 1.1, '#fff2c0', 0.85);
    if (i === 2) { shape(c, S(rectP(px - 3, py - ph / 2 - 7, px - 0.6, py - ph / 2)), P.candle, { w: 0.3, nl: true }); flame(c, px - 1.8, py - ph / 2 - 7, 0.3, { gk: 0.3, ga: 0.2 }); }
  });
  // arms: far one hangs, near one grips the pole
  const hx = STAFF_X; const hy = E_ANCHOR.hand[1];
  shape(c, CAP(wx(-24, 0), -54, wx(-33, 2), -30, 7.8, 6.6), P.coat, { w: 0.9 }); shape(c, C(wx(-33, 2), -26, 4.4), P.skin, { w: 0.6 });
  shape(c, CAP(wx(24, 0), -54, hx - 1, hy, 7.8, 6.4), P.coat, { w: 0.9 }); shape(c, C(hx, hy, 5), P.skin, { w: 0.6 });
  shape(c, S(rectP(hx - 5.6, hy - 1, hx + 5.6, hy + 2.4)), P.skin, { w: 0, nl: true });
}

// ---- head: flat cap, kind face, drooping moustache. expr: kind | blink | tender | hurt | brace | death -------------------------------
export function drawEliasHead(c, expr = 'kind') {
  const X = E_EXPR[expr] || E_EXPR.kind;
  const hb = HB; const fx = FX; const hc = HC; const hxs = HXS;
  shape(c, E(hb - hxs + 3, hc + 5, 5.6, 8.4), P.mous, { w: 0.7 }); shape(c, E(hb + hxs - 3, hc + 5, 5.6, 8.4), P.mous, { w: 0.7 }); // grey hair at the sides
  shape(c, E(hb - hxs - 0.5, hc + 2, 3.8, 5.6), '#d9a782', { w: 0.5 }); shape(c, E(hb + hxs + 0.5, hc + 2, 3.8, 5.6), '#d9a782', { w: 0.5 });
  shape(c, E(hb, hc, hxs, 23), P.skin, { w: 1 });
  shape(c, S(`M${F1(hb - hxs * 1.03)} ${hc - 11} Q${F1(hb - hxs * 1.05)} ${hc - 28} ${F1(hb)} ${hc - 28} Q${F1(hb + hxs * 1.05)} ${hc - 28} ${F1(hb + hxs * 1.03)} ${hc - 11} Q${F1(hb)} ${hc - 16} ${F1(hb - hxs * 1.03)} ${hc - 11}Z`), P.cap, {
    w: 0.9, x: (k) => stroke(k, `M${F1(hb - hxs)} ${hc - 15} Q${F1(hb)} ${hc - 21} ${F1(hb + hxs)} ${hc - 15}`, mix(P.cap, '#ffffff', 0.3), 1, { a: 0.5 }),
  });
  shape(c, C(hb, hc - 28.5, 1.9), mix(P.cap, '#000000', 0.14), { w: 0.5 });
  shape(c, E(fx + 2 * SN, hc + 2, hxs * 0.8, 18), P.skin, { w: 0, nl: true });
  shape(c, S(`M${F1(hb - hxs * 1.02)} ${hc - 12} Q${F1(fx - 2)} ${hc - 9} ${F1(hb + hxs * 1.02 + 6 * SN)} ${hc - 12} L${F1(hb + hxs * 1.02 + 10 * SN)} ${hc - 9} Q${F1(fx)} ${hc - 6} ${F1(hb - hxs * 1.02)} ${hc - 9}Z`), mix(P.cap, '#000000', 0.14), { w: 0.8 }); // brim
  for (const sx of [-15, 15]) { c.save(); c.translate(fx + sx, hc + 6); c.scale(1, 3.4 / 5); fillP(c, `M-5 0 A5 5 0 1 0 5 0 A5 5 0 1 0 -5 0Z`, P.cheek, 0.55); c.restore(); }
  shape(c, E(fx, hc + 5, 5.6, 4.8), '#ee9f8c', { w: 0.5 });
  for (const sg of [-1, 1]) {
    const a = TH + sg * 0.5; const cs = Math.cos(a); if (cs < 0.12) continue;
    const x = 20 * Math.sin(a) + hb; const y = hc + 2; const k = 0.5 + 0.5 * cs;
    if (X.eye === 'arc') stroke(c, `M${F1(x - 4.4 * k)} ${y + 1.2} Q${F1(x)} ${y - 4} ${F1(x + 4.4 * k)} ${y + 1.2}`, INK, 2.1);
    else if (X.eye === 'closed') stroke(c, `M${F1(x - 4.2 * k)} ${y - 0.5} Q${F1(x)} ${y + 3} ${F1(x + 4.2 * k)} ${y - 0.5}`, INK, 2);
    else if (X.eye === 'x') stroke(c, `M${F1(x + sg * 4 * k)} ${y - 3} L${F1(x - sg * 3 * k)} ${y} L${F1(x + sg * 4 * k)} ${y + 3}`, INK, 2);
    else { c.save(); c.fillStyle = INK; c.beginPath(); c.ellipse(x, y, 2.8 * k, 3.4, 0, 0, Math.PI * 2); c.fill(); c.restore(); dot(c, x - 0.8, y - 1.2, 1.1, '#fff'); }
    const raise = X.brow === 1 ? -2 : 0; const slant = X.brow === -1 ? -sg * 2.6 : 0;
    stroke(c, `M${F1(x - 5.2 * k)} ${F1(y - 6.4 + raise + slant)} Q${F1(x)} ${F1(y - 9.4 + raise)} ${F1(x + 5.2 * k)} ${F1(y - 6.4 + raise - slant)}`, P.mous, 3);
  }
  shape(c, S(`M${F1(fx)} ${hc + 8} Q${F1(fx - 11)} ${hc + 6} ${F1(fx - 17)} ${hc + 14} Q${F1(fx - 15)} ${hc + 21} ${F1(fx - 7)} ${hc + 18} Q${F1(fx - 2)} ${hc + 16} ${F1(fx)} ${hc + 17}Z`), P.mous, { w: 0.7 });
  shape(c, S(`M${F1(fx)} ${hc + 8} Q${F1(fx + 11)} ${hc + 6} ${F1(fx + 17)} ${hc + 14} Q${F1(fx + 15)} ${hc + 21} ${F1(fx + 7)} ${hc + 18} Q${F1(fx + 2)} ${hc + 16} ${F1(fx)} ${hc + 17}Z`), P.mous, { w: 0.7 });
  if (expr === 'hurt') fillP(c, `M${F1(fx - 5)} ${hc + 18.5} Q${F1(fx)} ${hc + 24} ${F1(fx + 5)} ${hc + 18.5}Z`, '#7a3a42');
}

// ---- flat composite (Low tier hero, crowd outline source, iframe flicker, death) -------------------------------------------------
export const E_FLAT = { x0: -46, y0: -152, w: 124, h: 166 };
export const E_FLAT_TEXEL = 1.5;
export function drawEliasFlat(c) {
  glowAt(c, E_ANCHOR.lantern[0], E_ANCHOR.lantern[1], 26, '#ffc96b', 0.4); // Low tier bakes a small lantern halo
  drawStaffBack(c);
  for (const a of [E_ANCHOR.bootFar, E_ANCHOR.bootNear]) { c.save(); c.translate(a[0], a[1]); drawEliasBoot(c); c.restore(); }
  drawEliasBody(c);
  drawEliasHead(c, 'kind');
  drawStaffFront(c);
}

// ---- atlas -----------------------------------------------------------------------------------------------------------------------
const ef = (name, bb, pv, draw) => ({ name, bb, pv, draw });
export const ELIAS_FRAMES = [
  ef('e_staff_back', [8, -152, 74, 6], E_ANCHOR.staffBack, drawStaffBack),
  ef('e_staff_front', [14, -128, 68, -86], E_ANCHOR.staffFront, drawStaffFront),
  ef('e_boot', [-12, -8, 12, 8], [0, 0], drawEliasBoot),
  ef('e_body', [-56, -96, 56, 14], [0, 0], drawEliasBody),
  ...Object.keys(E_EXPR).map((e) => ef(`e_head_${e}`, [-44, -118, 52, -52], E_ANCHOR.neck, (c) => drawEliasHead(c, e))),
];
