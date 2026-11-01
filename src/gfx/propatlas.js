// W4 prop atlas: ONE code-drawn canvas holding every prop in two states (Hollow = grey, restored = colour) that share one
// silhouette, so a swap/crossfade never pops (docs/mockups/world-sheet/ws3-props.png). Hollowlight Style v1: tinted outline L2
// (a darker shade of each fill), soft gradient + rim light H2, chibi-soft shapes. Pure drawing (no DOM at import time, testable with
// a fake 2D ctx). Geometry comes from seeded hashes and is consumed identically for both states (only colours/decor-in-silhouette differ).
// Design space = the world-sheet mock px (1 px = 0.5 world unit at KSCALE 1); the atlas bakes TPU texels per world unit.
//   Take A (Meadow Glade): oak, snag, bush, stump, log, boulder, grave, mushroom ring, fern, bramble.   Take B (Deep Forest): bark pillar (+ ground shade), plus the shared low set.
// Tall props with a canopy (oak, snag) are split into trunk (static) + crown (rotates about its base with the shared wind, AL-3).
export const TPU = 3; // texels per world unit
export const ATLAS_KEY = 'propAtlas';
export const ATLAS_W = 2048;
const PAD = 2;
const TAU = Math.PI * 2;

// kind -> { variants, layers, k (design px -> world: 0.5 * k units per px), tall, rect per layer (design px), pivot of the crown }
export const KINDS = {
  oak: { variants: 2, k: 0.8, tall: true, layers: { trunk: [-62, -130, 62, 16], crown: [-116, -250, 116, -62] }, pivot: [0, -104] },
  snag: { variants: 2, k: 0.8, tall: true, layers: { trunk: [-36, -158, 36, 14], crown: [-86, -218, 86, -60] }, pivot: [0, -92] },
  pillar: { variants: 1, k: 0.9, tall: true, layers: { body: [-58, -760, 58, 18] } }, // runs off the top of any screen; fades out into the canopy at its top
  bush: { variants: 3, k: 0.85, layers: { body: [-50, -66, 50, 14] } },
  stump: { variants: 2, k: 0.9, layers: { body: [-42, -42, 46, 14] } },
  log: { variants: 2, k: 0.9, layers: { body: [-72, -58, 74, 14] } },
  boulder: { variants: 3, k: 0.9, layers: { body: [-56, -58, 58, 14] } },
  grave: { variants: 2, k: 0.9, layers: { body: [-30, -64, 32, 12] } },
  fern: { variants: 2, k: 0.9, layers: { body: [-36, -42, 36, 12] } },
  mush: { variants: 1, k: 0.9, layers: { body: [-66, -34, 66, 28] } },
  bramble: { variants: 2, k: 0.9, layers: { body: [-64, -62, 66, 12] } },
};
export const KIND_NAMES = Object.keys(KINDS);
export const SHADE_RECT = [-190, -78, 190, 44]; // pillar canopy shadow (ground decal, one frame, both states)
export const PETAL_FRAMES = ['petal0', 'petal1'];

export const frameName = (kind, v, layer, st) => `${kind}${v}.${layer}.${st}`; // st: 'h' Hollow | 'r' restored

// ---------- layout (pure math) ----------
let LAYOUT = null;
export function layout() {
  if (LAYOUT) return LAYOUT;
  const items = [];
  for (const kind of KIND_NAMES) {
    const K = KINDS[kind];
    const S = TPU * 0.5 * K.k;
    for (let v = 0; v < K.variants; v++) for (const layer of Object.keys(K.layers)) for (const st of ['h', 'r']) {
      const [x0, y0, x1, y1] = K.layers[layer];
      items.push({ name: frameName(kind, v, layer, st), kind, v, layer, st, S, rect: [x0, y0, x1, y1], w: Math.ceil((x1 - x0) * S), h: Math.ceil((y1 - y0) * S) });
    }
  }
  { const S = TPU * 0.5 * 0.9; const [x0, y0, x1, y1] = SHADE_RECT; items.push({ name: 'shade', kind: 'shade', v: 0, layer: 'body', st: 'h', S, rect: SHADE_RECT, w: Math.ceil((x1 - x0) * S), h: Math.ceil((y1 - y0) * S) }); }
  for (let i = 0; i < PETAL_FRAMES.length; i++) items.push({ name: PETAL_FRAMES[i], kind: 'petal', v: i, layer: 'body', st: 'r', S: 1, rect: [0, 0, 14, 14], w: 14, h: 14 });
  // shelf pack, tallest first
  const order = items.slice().sort((a, b) => b.h - a.h || b.w - a.w || (a.name < b.name ? -1 : 1));
  let x = 0; let y = 0; let rowH = 0;
  for (const it of order) {
    if (x + it.w + PAD > ATLAS_W) { x = 0; y += rowH + PAD; rowH = 0; }
    it.x = x; it.y = y;
    x += it.w + PAD;
    if (it.h > rowH) rowH = it.h;
  }
  const used = y + rowH + PAD;
  let H = 256; while (H < used) H *= 2;
  const frames = {};
  for (const it of items) {
    const [x0, y0] = it.rect;
    it.ax = -x0 * it.S; // design origin (the prop's base) inside the frame, in texels
    it.ay = -y0 * it.S;
    frames[it.name] = it;
  }
  LAYOUT = { items, frames, W: ATLAS_W, H };
  return LAYOUT;
}

// World placement helper: for frame `name`, the Phaser origin (0..1) that puts the design point (px, py) (default: the base (0,0)) on the sprite position.
export function frameOrigin(name, px = 0, py = 0) {
  const f = layout().frames[name];
  return [(f.ax + px * f.S) / f.w, (f.ay + py * f.S) / f.h];
}

// ---------- colour + path helpers ----------
const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex(a); const B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const ol = (c, t = 0.45) => mix(c, '#17222c', t);
const lift = (c, t = 0.4) => mix(c, '#ffffff', t);
function rnd(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const lg = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
const rg = (c, x, y, r0, r1, stops) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };

// tiny SVG-path subset (M L H V Q Z, absolute + relative) so the sheet's path strings port as they are
function svg(c, d) {
  const t = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0; let x = 0; let y = 0; let sx = 0; let sy = 0; let cmd = 'M';
  const n = () => parseFloat(t[i++]);
  c.beginPath();
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'M': { const a = n(); const b = n(); x = rel ? x + a : a; y = rel ? y + b : b; sx = x; sy = y; c.moveTo(x, y); cmd = rel ? 'l' : 'L'; break; }
      case 'L': { const a = n(); const b = n(); x = rel ? x + a : a; y = rel ? y + b : b; c.lineTo(x, y); break; }
      case 'H': { const a = n(); x = rel ? x + a : a; c.lineTo(x, y); break; }
      case 'V': { const a = n(); y = rel ? y + a : a; c.lineTo(x, y); break; }
      case 'Q': { const a = n(); const b = n(); const e = n(); const f = n(); const cx = rel ? x + a : a; const cy = rel ? y + b : b; x = rel ? x + e : e; y = rel ? y + f : f; c.quadraticCurveTo(cx, cy, x, y); break; }
      case 'Z': c.closePath(); x = sx; y = sy; break;
      default: i++; // unknown command: skip a token (never loops forever)
    }
  }
}
const fillPath = (c, d, fill, line, lw = 1.6) => { svg(c, d); c.fillStyle = fill; c.fill(); if (line) { c.lineWidth = lw; c.lineJoin = 'round'; c.strokeStyle = line; c.stroke(); } };
const strokePath = (c, d, col, lw, a = 1) => { svg(c, d); c.globalAlpha = a; c.lineWidth = lw; c.lineCap = 'round'; c.strokeStyle = col; c.stroke(); c.globalAlpha = 1; };
const disc = (c, x, y, r, fill, line, lw = 1) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); if (line) { c.lineWidth = lw; c.strokeStyle = line; c.stroke(); } };
const ell = (c, x, y, rx, ry, fill, line, lw = 1, a = 1) => { c.save(); c.globalAlpha = a; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill(); if (line) { c.lineWidth = lw; c.strokeStyle = line; c.stroke(); } c.restore(); };
function shadow(c, rx, ry, a = 0.3, dy = 2) { // soft contact shadow: a radial falloff squashed to an ellipse
  c.save(); c.translate(0, dy); c.scale(1, ry / rx);
  c.fillStyle = rg(c, 0, 0, 0, rx, [[0, `rgba(8,12,22,${a})`], [0.7, `rgba(8,12,22,${a * 0.55})`], [1, 'rgba(8,12,22,0)']]);
  c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}

// ---------- palettes (the sheet's PC(): Hollow = cool grey-blue, restored = paint) ----------
const PA = {
  h: { leaf: ['#aab6c4', '#6f7c8d', '#46525f'], bark: ['#8a94a3', '#555f6d'], stone: ['#aab4c0', '#6d7886'], moss: '#6d7a88', cut: '#bcc4cd', fern: ['#8696a8', '#6a7686', '#7d8a9a'], cap: '#8e9aaa', stem: '#b8c2cc', bram: ['#2c3441', '#6d7886'], pale: ['#c5ccd4', '#7a8593'], bloom: ['#c2cbd6', '#d0d7e0', '#aab4c0'] },
  r: { leaf: ['#b8e47e', '#5fa94e', '#2f6a3a'], bark: ['#a07a54', '#5a3e2a'], stone: ['#c4c8b0', '#7d866e'], moss: '#79a85a', cut: '#d8b284', fern: ['#9ad66b', '#63a54f', '#bde68a'], cap: '#ffd88a', stem: '#efe2c2', bram: ['#3a4a3a', '#7d9a6a'], pale: ['#d9c8aa', '#8a7458'], bloom: ['#ffe8c4', '#fff1d8', '#ffd0b4'] },
};
const PB = { // Take B pillar bark
  h: { bark: ['#7a8594', '#464f5c'], moss: '#5f6c7a' },
  r: { bark: ['#8a6a4c', '#4a3626'], moss: '#6a9a52' },
};

// ---------- drawing, one function per kind. Each takes (c, st, v) in design space, base at (0,0), y up = negative ----------
function cloud(c, C, P, st, r, small) {
  for (const [x, y, rr] of C) disc(c, x, y, rr + 2.4, ol(P.leaf[2], 0.35));
  for (const [x, y, rr] of C) disc(c, x, y, rr, rg(c, x - rr * 0.35, y - rr * 0.4, rr * 0.1, rr * 1.1, [[0, P.leaf[0]], [0.62, P.leaf[1]], [1, P.leaf[2]]]));
  c.lineCap = 'round';
  const n = small ? 10 : 26;
  for (let i = 0; i < n; i++) { // dapple marks (identical geometry in both states)
    const [x, y, rr] = C[(r() * C.length) | 0]; const a = r() * TAU; const d = rr * 0.7 * Math.sqrt(r()); const lt = r() > 0.5;
    const px = x + Math.cos(a) * d; const py = y + Math.sin(a) * d;
    c.globalAlpha = lt ? 0.8 : 0.5; c.lineWidth = 1.5; c.strokeStyle = lt ? P.leaf[0] : P.leaf[2];
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + (lt ? 2.4 : -2.4), py - 4.2); c.stroke();
  }
  c.globalAlpha = 1;
  for (const [x, y, rr] of C) { // rim light on the lit (upper-left) side
    c.beginPath(); c.arc(x, y, rr, Math.PI * 1.05, Math.PI * 1.55); c.globalAlpha = st === 'r' ? 0.6 : 0.42; c.lineWidth = small ? 1.8 : 2.4; c.strokeStyle = st === 'r' ? '#f0ffc0' : '#e0e8f0'; c.stroke();
  }
  c.globalAlpha = 1;
}

function drawOakTrunk(c, st, v) {
  const P = PA[st]; const r = rnd(101 + v * 17);
  shadow(c, 56, 12, 0.32);
  fillPath(c, 'M-30 5 Q-19 -6 -15 -38 Q-12 -80 -11 -120 L14 -120 Q16 -80 17 -40 Q21 -6 34 5 Q2 13 -30 5Z', lg(c, -30, 0, 34, 0, [[0, P.bark[0]], [0.55, mix(P.bark[0], P.bark[1], 0.5)], [1, P.bark[1]]]), ol(P.bark[1]), 1.8);
  strokePath(c, 'M-13 -34 Q-12 -74 -10 -112', mix(P.bark[0], '#ffffff', 0.4), 2.4, 0.55);
  strokePath(c, 'M3 -18 Q5 -52 3 -96 M10 -26 Q12 -62 9 -104', ol(P.bark[1], 0.15), 1.4, 0.5);
  ell(c, 2 + (r() - 0.5) * 3, -58, 5, 7, ol(P.bark[1], 0.55), null, 1, 0.7);
  if (st === 'r') fillPath(c, 'M-24 2 Q-18 -10 -14 -16 Q-8 -8 -4 2Z', P.moss, null);
  else fillPath(c, 'M-24 2 Q-18 -10 -14 -16 Q-8 -8 -4 2Z', P.moss, null); // grey "moss" keeps the shape in both states
}
function oakCircles(v) {
  const r = rnd(7 + v * 31);
  const base = [[-48, -130, 44], [46, -134, 42], [0, -178, 54], [-22, -112, 40], [30, -106, 36], [-70, -164, 30], [66, -166, 28], [0, -128, 46]];
  return base.map(([x, y, rr]) => [x + (r() - 0.5) * 10, y + (r() - 0.5) * 8, rr + (r() - 0.5) * 6]);
}
function drawOakCrown(c, st, v) {
  const P = PA[st]; const r = rnd(33 + v * 5);
  const C = oakCircles(v);
  cloud(c, C, P, st, r, false);
  for (let i = 0; i < 8; i++) { // little blossom/light dots (grey in the Hollow, warm cream when restored): same positions
    const [x, y, rr] = C[(r() * C.length) | 0]; const px = x + (r() - 0.7) * rr; const py = y - r() * rr * 0.6;
    disc(c, px, py, 2.2, st === 'r' ? '#fff1a8' : '#c9d2dc'); }
}

function drawSnagTrunk(c, st, v) {
  const P = PA[st]; const pale = P.pale;
  shadow(c, 38, 8, 0.3);
  fillPath(c, 'M-14 4 Q-9 -4 -8 -40 Q-7 -90 -5 -150 L4 -150 Q6 -90 8 -40 Q9 -4 18 4 Q2 9 -14 4Z', lg(c, -14, 0, 18, 0, [[0, pale[0]], [1, pale[1]]]), ol(pale[1]), 1.5);
  strokePath(c, 'M-5 -30 Q-4 -80 -3 -140', '#ffffff', 2, 0.4);
  strokePath(c, 'M-6 -22 h8 M-6 -58 h7 M-5 -96 h8', ol(pale[1], 0.3), 1.6, 0.6);
}
function snagBranches(v) {
  const j = v ? 1 : 0;
  return [[-6, -118, -52 - 6 * j, -168 + 4 * j, 7], [-3, -96, 42 + 8 * j, -150, 6], [-4, -140, -26, -196 - 6 * j, 5], [0, -150, 30, -204, 5], [-5, -70, -44, -104 + 6 * j, 5], [-52 - 6 * j, -168 + 4 * j, -70, -176, 3], [42 + 8 * j, -150, 66, -156, 3]];
}
function drawSnagCrown(c, st, v) {
  const P = PA[st]; const pale = P.pale; const br = snagBranches(v); const r = rnd(44 + v * 9);
  for (const [x1, y1, x2, y2, wd] of br) { const d = `M${x1} ${y1} Q${(x1 + x2) / 2 - 4} ${(y1 + y2) / 2 - 12} ${x2} ${y2}`; strokePath(c, d, ol(pale[1], 0.35), wd + 1.6); strokePath(c, d, pale[0], wd); }
  // blossom clusters at the branch ends (cream/peach when restored, grey in the Hollow; same circles both states)
  const tips = [br[0], br[1], br[2], br[3], br[4], br[5], br[6]].map((b) => [b[2], b[3]]);
  tips.forEach(([x, y], i) => {
    for (let q = 0; q < 5; q++) {
      const px = x + Math.cos(q * 1.9 + i) * 11; const py = y + Math.sin(q * 1.9 + i) * 9 - 3; const rr = 5 + (q % 2) * 2 + r() * 0.01;
      const fill = P.bloom[q % 3];
      disc(c, px, py, rr, fill, ol(st === 'r' ? '#e8b49c' : '#8e9aaa', 0.3), 0.9);
    }
  });
}

function drawPillar(c, st, v) {
  const P = PB[st]; const r = rnd(201 + v * 13);
  shadow(c, 64, 13, 0.34);
  const roots = [[-40, 6, -16, -30], [38, 6, 14, -32], [-22, 12, -8, -22], [18, 12, 6, -24]];
  for (const [x1, y1, x2, y2] of roots) { const d = `M${x1} ${y1} Q${(x1 + x2) / 2} ${y1 - 6} ${x2} ${y2}`; strokePath(c, d, ol(P.bark[1], 0.4), 12); strokePath(c, d, P.bark[0], 8); }
  const top = -750;
  fillPath(c, `M-22 4 Q-17 -20 -16 -60 L-15 ${top} L15 ${top} L16 -60 Q17 -20 24 4 Q2 11 -22 4Z`, lg(c, -22, 0, 24, 0, [[0, P.bark[0]], [0.5, mix(P.bark[0], P.bark[1], 0.55)], [1, P.bark[1]]]), ol(P.bark[1]), 1.8);
  // bark: long ridges, short cracks and a few knots (same geometry in both states)
  const sh = (r() - 0.5) * 3;
  strokePath(c, `M-12 -20 Q${-10 + sh} -150 -11 ${top + 10} M-2 -10 Q0 -140 -1 ${top + 10} M8 -16 Q${10 - sh} -150 9 ${top + 10}`, ol(P.bark[1], 0.1), 2.4, 0.7);
  strokePath(c, `M-13 -30 Q-12 -150 -12 ${top + 20}`, mix(P.bark[0], '#ffffff', 0.35), 2.6, 0.55);
  for (let y = -90; y > top + 40; y -= 34 + r() * 40) { const x = -12 + r() * 20; strokePath(c, `M${x.toFixed(1)} ${y.toFixed(0)} l${(4 + r() * 6).toFixed(1)} ${(-2 - r() * 3).toFixed(1)}`, ol(P.bark[1], 0.2), 1.8, 0.65); }
  for (let y = -170; y > top + 80; y -= 120 + r() * 90) ell(c, -6 + r() * 14, y, 4.2, 6, ol(P.bark[1], 0.6), null, 1, 0.75);
  ell(c, 3, -70, 6, 9, ol(P.bark[1], 0.6));
  fillPath(c, 'M-20 -4 Q-14 -50 -12 -64 Q-6 -34 -2 -4Z', P.moss, null);
  fillPath(c, 'M6 -8 Q10 -30 14 -40 Q16 -20 18 -6Z', P.moss, null);
  for (let y = -260; y > top + 160; y -= 150 + r() * 80) fillPath(c, `M-15 ${y} Q-8 ${y + 14} -2 ${y + 30} Q-9 ${y + 12} -15 ${y + 4}Z`, P.moss, null);
  c.save(); c.globalCompositeOperation = 'destination-out'; // the top dissolves into the unseen canopy
  c.fillStyle = lg(c, 0, top - 4, 0, top + 190, [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
  c.fillRect(-70, top - 10, 140, 210); c.restore();
}
function drawShade(c) { // canopy shadow decal on the ground (the sheet: canopy only as a ground shadow)
  c.save(); c.scale(1, 0.38);
  c.fillStyle = rg(c, 0, -20, 0, 180, [[0, 'rgba(11,16,24,0.34)'], [0.6, 'rgba(11,16,24,0.2)'], [1, 'rgba(11,16,24,0)']]);
  c.beginPath(); c.arc(0, -20, 180, 0, TAU); c.fill(); c.restore();
}

function drawBush(c, st, v) {
  const P = PA[st]; const r = rnd(301 + v * 19);
  shadow(c, 40, 8, 0.28);
  const sp = [[[-26, -18, 21], [2, -32, 26], [27, -18, 21], [-4, -14, 22]], [[-28, -16, 19], [-4, -30, 25], [24, -22, 23], [6, -12, 20]], [[-22, -20, 22], [8, -34, 24], [30, -14, 18], [-6, -12, 23]]][v];
  cloud(c, sp, P, st, r, true);
  const cols = st === 'r' ? ['#ffd0b4', '#ffd86b', '#fff1c4'] : ['#c0cad6', '#c0cad6', '#c0cad6'];
  for (let i = 0; i < 6; i++) { const x = -24 + r() * 48; const y = -44 + r() * 30; disc(c, x, y, st === 'r' ? 3.4 : 2.6, cols[i % 3], st === 'r' ? ol('#e8a89a', 0.35) : null, 0.7); }
}
function drawStump(c, st, v) {
  const P = PA[st]; const j = v ? 4 : 0;
  shadow(c, 38, 8, 0.3);
  fillPath(c, `M-24 2 Q-20 -6 -19 -26 L19 -26 Q20 -6 26 2 Q2 9 -24 2Z`, lg(c, -24, 0, 26, 0, [[0, P.bark[0]], [1, P.bark[1]]]), ol(P.bark[1]), 1.6);
  ell(c, 0, -27, 20, 8, P.cut, ol(P.bark[1]), 1.4);
  ell(c, 0, -27, 13, 5, 'rgba(0,0,0,0)', ol(P.bark[1], 0.25), 1, 0.6); ell(c, 0, -27, 6, 2.4, 'rgba(0,0,0,0)', ol(P.bark[1], 0.25), 1, 0.6);
  fillPath(c, 'M-19 -26 Q-12 -34 -4 -28 Q-12 -22 -19 -26Z', P.moss, null);
  for (const [x, y, s] of [[14 + j, -1, 1], [22 + j, -4, 0.7]]) { // mushrooms
    c.save(); c.translate(x, y); c.scale(s, s);
    fillPath(c, 'M-1.6 1 L-1.6 -8 L1.6 -8 L1.6 1Z', P.stem, ol(P.stem, 0.35), 0.8); ell(c, 0, -9, 7, 4.4, P.cap, ol(P.cap, 0.4), 0.9);
    disc(c, -2, -10.4, 1.1, st === 'r' ? '#fff4dc' : '#d0d8e0'); c.restore();
  }
}
function drawLog(c, st, v) {
  const P = PA[st]; const f = v ? -1 : 1;
  c.save(); c.scale(f, 1);
  shadow(c, 66, 10, 0.3);
  fillPath(c, 'M-58 -2 Q-60 -24 -50 -26 L48 -26 Q58 -24 58 -2 Q56 4 46 4 L-48 4 Q-58 4 -58 -2Z', lg(c, 0, -26, 0, 4, [[0, P.bark[0]], [1, P.bark[1]]]), ol(P.bark[1]), 1.6);
  ell(c, 52, -12, 7, 14, P.cut, ol(P.bark[1]), 1.4); ell(c, 52, -12, 3, 7, 'rgba(0,0,0,0)', ol(P.bark[1], 0.25), 1, 0.6);
  strokePath(c, 'M-40 -22 Q-10 -26 24 -22 M-44 -12 Q-10 -15 28 -10', ol(P.bark[1], 0.15), 1.5, 0.5);
  strokePath(c, 'M-20 -26 Q-16 -42 -8 -48', ol(P.bark[1]), 4);
  fillPath(c, 'M-46 -24 Q-30 -34 -12 -26 Q-30 -20 -46 -24Z', P.moss, null); disc(c, -8, -48, 5, st === 'r' ? P.leaf[1] : P.leaf[1]);
  c.restore();
}
function drawBoulder(c, st, v) {
  const P = PA[st]; const r = rnd(401 + v * 23); const w = 1 + (v - 1) * 0.12; const h = 1 - (v - 1) * 0.12;
  c.save(); c.scale(w, h);
  shadow(c, 48, 9, 0.3);
  fillPath(c, 'M-40 2 Q-46 -18 -28 -34 Q-6 -48 18 -38 Q42 -28 44 -6 Q44 4 30 5 Z', rg(c, -14, -32, 0, 70, [[0, P.stone[0]], [1, P.stone[1]]]), ol(P.stone[1]), 1.6);
  strokePath(c, 'M-26 -30 Q-8 -42 12 -35', '#ffffff', 2.4, 0.4);
  strokePath(c, 'M-8 -22 l6 10 l-4 8 M16 -26 l-3 8', ol(P.stone[1], 0.3), 1.3, 0.6);
  fillPath(c, 'M-30 -26 Q-14 -44 8 -38 Q-4 -30 -16 -30 Q-22 -22 -30 -26Z', P.moss, null);
  void r; c.restore();
}
function drawGrave(c, st, v) {
  const P = PA[st];
  shadow(c, 28, 6, 0.28);
  c.save(); c.rotate((v ? 5 : -6) * Math.PI / 180);
  fillPath(c, 'M-17 2 L-17 -34 Q-17 -52 0 -52 Q17 -52 17 -34 L17 2 Z', lg(c, -17, -52, 17, 2, [[0, P.stone[0]], [1, P.stone[1]]]), ol(P.stone[1]), 1.6);
  strokePath(c, 'M0 -42 v16 M-7 -35 h14', ol(P.stone[1], 0.25), 2.2, 0.7);
  strokePath(c, 'M-14 -40 Q-14 -50 -4 -50', '#ffffff', 2, 0.4);
  fillPath(c, 'M-19 0 Q-12 -14 -4 -2Z', P.moss, null);
  disc(c, -9, -12, 2.4, st === 'r' ? '#fff1c4' : '#c0cad6'); disc(c, -5, -9, 2, st === 'r' ? '#ffd0b4' : '#b6c0cc');
  c.restore();
}
function drawFern(c, st, v) {
  const P = PA[st]; const fk = P.fern; const k = v ? 1.12 : 1;
  shadow(c, 26, 5, 0.22);
  for (let q = 0; q < 8; q++) {
    const a = (q - 3.5) * 8 * k; const L = 26 + (q % 3) * 6;
    const d = `M0 0 Q${a * 0.35} ${-L * 0.7} ${a} ${-L} Q${a * 0.5 + 3} ${-L * 0.6} 3 0Z`;
    fillPath(c, d, fk[q % 3], ol(fk[1], 0.35), 0.8);
  }
}
function drawMush(c, st) {
  const P = PA[st];
  ell(c, 0, 0, 52, 19, 'rgba(0,0,0,0)', st === 'r' ? '#ffe3a6' : '#a8b4c0', 1.4, st === 'r' ? 0.5 : 0.3);
  const items = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + 0.3; items.push([Math.cos(a) * 46, Math.sin(a) * 16, 0.7 + ((i * 7) % 5) / 10]); }
  items.sort((a, b) => a[1] - b[1]);
  for (const [x, y, s] of items) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (st === 'r') disc(c, 0, -8, 11, rg(c, 0, -8, 0, 11, [[0, 'rgba(255,196,90,0.5)'], [1, 'rgba(255,196,90,0)']]));
    fillPath(c, 'M-2 1 L-2 -9 L2 -9 L2 1Z', P.stem, ol(P.stem, 0.35), 0.8); ell(c, 0, -11, 8.4, 5, P.cap, ol(P.cap, 0.4), 1);
    disc(c, -2.6, -12.4, 1.2, st === 'r' ? '#fff4dc' : '#d0d8e0'); c.restore();
  }
}
function drawBramble(c, st, v) {
  const P = PA[st]; const col = P.bram[0]; const hi = P.bram[1]; const f = v ? -1 : 1;
  c.save(); c.scale(f, 1);
  shadow(c, 46, 8, 0.3);
  const stems = ['M-40 2 Q-46 -26 -20 -34 Q0 -44 -6 -22', 'M-6 2 Q-14 -34 12 -46 Q34 -50 30 -28', 'M10 2 Q28 -22 48 -14 Q58 -4 44 2', 'M-30 -6 Q-20 -44 4 -40'];
  for (const d of stems) { strokePath(c, d, ol(col, 0.3), 7); strokePath(c, d, col, 4.6); c.save(); c.translate(-1, -1.4); strokePath(c, d, hi, 1.2, 0.5); c.restore(); }
  for (const [x, y, a] of [[-34, -26, 200], [-20, -38, 280], [8, -46, 300], [30, -48, 340], [40, -14, 20], [-8, -20, 250]]) fillPath(c, `M${x} ${y} l${(Math.cos(a * 0.01745) * 9).toFixed(2)} ${(Math.sin(a * 0.01745) * 9).toFixed(2)} l-3 3Z`, hi, null);
  for (const [x, y] of [[-12, -34], [20, -42], [40, -18]]) disc(c, x, y, 2.6, st === 'r' ? '#ffb89a' : '#9aa6b4', st === 'r' ? ol('#ffb89a', 0.4) : null, 0.7);
  c.restore();
}
function drawPetal(c, v) {
  c.save(); c.translate(7, 7); c.rotate(v ? 0.6 : -0.4);
  const col = v ? '#ffd9bd' : '#fff0d2';
  c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(0, -5.4, 5, 0); c.quadraticCurveTo(0, 4.4, -5, 0); c.closePath();
  c.fillStyle = col; c.fill(); c.lineWidth = 0.9; c.strokeStyle = ol(col, 0.28); c.stroke(); c.restore();
}

const DRAW = {
  oak: { trunk: drawOakTrunk, crown: drawOakCrown },
  snag: { trunk: drawSnagTrunk, crown: drawSnagCrown },
  pillar: { body: drawPillar },
  bush: { body: drawBush }, stump: { body: drawStump }, log: { body: drawLog }, boulder: { body: drawBoulder },
  grave: { body: drawGrave }, fern: { body: drawFern }, mush: { body: drawMush }, bramble: { body: drawBramble },
};

// Draws every frame into `cv` (ATLAS_W wide, layout().H high).
export function drawPropAtlas(cv) {
  const { items } = layout();
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  for (const it of items) {
    c.save();
    c.beginPath(); c.rect(it.x, it.y, it.w, it.h); c.clip();
    if (it.kind === 'petal') { c.translate(it.x, it.y); drawPetal(c, it.v); } else {
      c.translate(it.x + it.ax, it.y + it.ay); c.scale(it.S, it.S);
      if (it.kind === 'shade') drawShade(c); else DRAW[it.kind][it.layer](c, it.st, it.v);
    }
    c.restore();
  }
  return cv;
}

// Registers the atlas as a Phaser texture with one named frame per sprite. Returns world units per texel.
export function makePropAtlas(scene, mkCanvas) {
  const { items, W, H } = layout();
  const cv = mkCanvas(W, H);
  drawPropAtlas(cv);
  if (scene.textures.exists(ATLAS_KEY)) scene.textures.remove(ATLAS_KEY);
  const tex = scene.textures.addCanvas(ATLAS_KEY, cv);
  for (const it of items) tex.add(it.name, 0, it.x, it.y, it.w, it.h);
  return 1 / TPU;
}

// World-unit geometry of a kind (relative to the prop base, before size jitter), for fades and tests.
export function kindGeo(kind) {
  const K = KINDS[kind]; const u = 0.5 * K.k;
  const out = { tall: !!K.tall, u };
  if (K.layers.crown) { const [x0, y0, x1, y1] = K.layers.crown; out.crown = { x0: x0 * u, y0: y0 * u, x1: x1 * u, y1: y1 * u }; out.pivot = [K.pivot[0] * u, K.pivot[1] * u]; }
  const b = K.layers.body || K.layers.trunk; out.body = { x0: b[0] * u, y0: b[1] * u, x1: b[2] * u, y1: b[3] * u };
  return out;
}
