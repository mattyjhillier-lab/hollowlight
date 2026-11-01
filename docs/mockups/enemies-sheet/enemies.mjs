// Enemies sheet #4: code-drawn Chapter 1 enemy designs in Hollowlight Style v1 (L2 tinted outline + H2 soft gradient/rim + P1 chibi).
// Mock-ups only, not game code. Units: design units (du), 4 du = 1 world unit (the game's texel density, DENS 4). Origin = feet on the ground, facing right.
// Every draw function returns { b: body svg, e: eye-points svg } so the night look can darken the body and keep the eyes above the dark (WL6b rule).
// State st: { ph: walk phase 0..1, tele: telegraph 0..1, hurt: 0|1, die: 0..1, act: attack beat 0..1 }.
import { shp, stk, glowId, rgU, mix, ell, circ, addDef } from '../style-lab/lab.mjs';

const TAU = Math.PI * 2;
const f = (n) => (+n).toFixed(1);
export const EYE = '#ff5a3c'; // corruption.accent: enemy eye-points + danger telegraphs only (BIBLE 6)
export const BOSS_EYE = '#ffb84a'; // locked boss eye (WL6b); minibosses share it
export const CORE = '#ffe6b8';
export const TELE = '#ff5a3c';
export const INK = '#14101b';
export const CRACK = '#6a58a0'; // W3 faint cold-violet crack

// closed / open Catmull-Rom paths through points
export const blob = (p) => { const n = p.length; let d = `M${f(p[0][0])} ${f(p[0][1])}`; for (let i = 0; i < n; i++) { const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n]; d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; } return d + 'Z'; };
export const path = (p) => { let d = `M${f(p[0][0])} ${f(p[0][1])}`; for (let i = 0; i < p.length - 1; i++) { const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)]; d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; } return d; };
const poly = (p) => 'M' + p.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + 'Z';

export function enemyDefs() {
  addDef(`<filter id="nightF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".29 0 0 0 .012  0 .32 0 0 .016  0 0 .36 0 .03  0 0 0 1 0"/></filter>
<filter id="duskF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".6 0 0 0 .01  0 .63 0 0 .014  0 0 .68 0 .025  0 0 0 1 0"/></filter>
<filter id="dayF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".78 0 0 0 0  0 .8 0 0 0  0 0 .84 0 0  0 0 0 1 0"/></filter>
<filter id="hurtF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .75 0"/></filter>
<filter id="silF"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
<filter id="rimF" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="d"/><feFlood flood-color="#9aa6c8"/><feComposite in2="d" operator="in" result="o"/><feGaussianBlur in="o" stdDeviation="2.4"/></filter>
<filter id="coldRimF" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="d"/><feFlood flood-color="#7f8fc8"/><feComposite in2="d" operator="in" result="o"/><feComposite in="o" in2="SourceAlpha" operator="out"/></filter>`);
}

export const eyeP = (x, y, r = 3, col = EYE, a = 1) => `<g opacity="${a}"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 3.6)}" fill="url(#${glowId(col, 0.85)})"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${CORE}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.45)}" fill="#fff"/></g>`;
export const shadow = (rx, x = 0, a = 0.38) => `<ellipse cx="${f(x)}" cy="0" rx="${f(rx)}" ry="${f(rx * 0.22)}" fill="#05040a" opacity="${a}" filter="url(#b2)"/>`;
const leg = (x, y, len, sw, col, w = 5, bend = 1) => stk(path([[x, y], [x + sw * 0.45 + 3 * bend, y + len * 0.55], [x + sw, -1.5]]), col, w);
const spikes = (x0, x1, yb, h, n, lean = 0.3) => { const p = [[x0, yb]]; for (let i = 0; i < n; i++) { const xa = x0 + (x1 - x0) * (i + 0.5) / n, xb = x0 + (x1 - x0) * (i + 1) / n; p.push([xa + h * lean, yb - h * (0.7 + 0.3 * ((i * 7) % 3) / 2)], [xb, yb + 1]); } p.push([x1, yb + 4], [x0, yb + 4]); return poly(p); };

// ---------------------------------------------------------------- FELL WOLF (wolf) 26 x 16 world units
// A Hackled Hollow (rec): lean starving wedge, head low and long, ash hackle ridge that RISES on the lunge tell.
// B Bark-Backed: heavier, dead branches grow along the spine. C Shade Wolf: rear half dissolves into ink wisps.
export function fellWolf(opt = 'A', st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, act = st.act || 0;
  const BODY = opt === 'B' ? '#4f4651' : '#4a4558', TOP = opt === 'B' ? '#6c6260' : '#6d687a', ASH = '#b9bec8', VOID = '#100c14', FAR = mix(BODY, '#000', 0.35);
  const run = 1 - tl;
  const bob = -Math.abs(Math.sin(a)) * 3.2 * run + act * -4;
  const heavy = opt === 'B' ? 2 : 0;
  const by = -31 + tl * 5 + bob, lean = act * 6;
  let b = shadow(40 + heavy);
  const s1 = Math.sin(a) * 11 * run, s2 = Math.sin(a + Math.PI) * 11 * run;
  // tail: hangs straight back/down, ragged tip (straighter + lifted on the tell)
  const tY = tl * -8;
  const tail = opt === 'C' ? '' : shp(path([[-33, by - 4], [-44, by + 2 + tY], [-50, by + 14 + tY], [-46, by + 15 + tY], [-41, by + 6 + tY], [-31, by + 3]]) + 'Z', TOP, { w: 0.8 });
  b += tail;
  // far legs
  if (opt !== 'C') b += leg(-22 + lean, by + 6, 24, s2 - (tl * 6), FAR, 5.5) + leg(20 + lean, by + 6, 24, s1 + tl * 8, FAR, 5.5);
  else b += leg(20 + lean, by + 6, 24, s1 + tl * 8, FAR, 5.5);
  // body
  const bp = [[-37, by - 1], [-27, by - 12 - heavy], [-6, by - 14 - heavy], [14, by - 16 - heavy], [29, by - 9], [27, by + 6], [10, by + 9 + heavy], [-14, by + 8 + heavy], [-33, by + 7]].map(([x, y]) => [x + lean, y]);
  if (opt === 'C') {
    const gid = rgU('shade' + f(by), 30 + lean, by, 60, [[0, BODY, 1], [0.55, BODY, 0.95], [1, BODY, 0]]);
    b += `<path d="${blob(bp)}" fill="url(#${gid})"/>`;
    for (let i = 0; i < 4; i++) b += `<path d="${path([[-14 + lean, by - 6 + i * 4], [-36 + lean - i * 3, by - 10 + i * 6 + Math.sin(a + i) * 3], [-58 - i * 4, by - 4 + i * 7 + Math.sin(a * 1.3 + i) * 5]])}" fill="none" stroke="${BODY}" stroke-width="${6 - i}" stroke-linecap="round" opacity="${0.55 - i * 0.1}"/>`;
  } else b += shp(blob(bp), BODY, { w: 1 });
  // hackles / branches
  if (opt === 'A') b += shp(spikes(-27 + lean, 15 + lean, by - 11, 7 + tl * 8 + act * 3, 7, 0.45), ASH, { w: 0.7 });
  if (opt === 'B') for (const [x, h, k] of [[-22, 16, -0.4], [-8, 22, 0.2], [6, 14, 0.5], [-30, 10, -0.8]]) { const x0 = x + lean, y0 = by - 14; b += stk(path([[x0, y0], [x0 + k * 6, y0 - h * 0.6], [x0 + k * 10, y0 - h]]), '#6b5d55', 3.2) + stk(path([[x0 + k * 5, y0 - h * 0.55], [x0 + k * 5 + 6, y0 - h * 0.8]]), '#6b5d55', 2); }
  if (opt === 'C') b += shp(spikes(-6 + lean, 15 + lean, by - 12, 5, 4, 0.4), ASH, { w: 0.6, op: 0.85 });
  // ribs (starving)
  for (let i = 0; i < 3; i++) { const x = -8 + i * 7 + lean; b += `<path d="M${f(x)} ${f(by - 6)} q3 6 0 12" fill="none" stroke="${mix(BODY, '#000', 0.45)}" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`; }
  // near legs
  if (opt !== 'C') b += leg(-18 + lean, by + 7, 24, s1 - tl * 6, BODY, 6) + leg(24 + lean, by + 6, 25, s2 + tl * 10, BODY, 6);
  else b += leg(24 + lean, by + 6, 25, s2 + tl * 10, BODY, 6);
  // head: low and long, ears pinned back; lowers further on the tell, snaps forward on the lunge
  const hx = 44 + lean + act * 6, hy = by + 4 + tl * 5;
  b += shp(poly([[hx - 12, hy - 9], [hx - 22, hy - 19 + tl * 4], [hx - 6, hy - 11]]), TOP, { w: 0.7 });
  b += shp(blob([[hx - 16, hy - 8], [hx - 2, hy - 13], [hx + 12, hy - 8], [hx + 20, hy - 1], [hx + 15, hy + 6], [hx, hy + 8], [hx - 14, hy + 5]]), TOP, { w: 0.9 });
  b += shp(poly([[hx - 4, hy - 11], [hx - 13, hy - 22 + tl * 5], [hx + 3, hy - 12]]), TOP, { w: 0.7 });
  b += `<path d="${blob([[hx + 3, hy - 6], [hx + 14, hy - 4], [hx + 19, hy], [hx + 13, hy + 5], [hx + 3, hy + 4]])}" fill="${VOID}"/>`;
  const e = eyeP(hx + 9, hy - 1, 2.6) + eyeP(hx + 15, hy, 2.3);
  return { b, e, w: 104, h: 64 };
}

// ---------------------------------------------------------------- GRAVE CROW (crow) 18 x 13 world units, hovers
// A Ash Crow (rec): ragged V, wings too long, jerky 2-beat flap then a stall, sheds ash flakes, ONE big eye.
// B Murmur: comes as a tight swirl of five small crows (one enemy, five bodies). C Rag Crow: torn black cloth on the wind, ribbon tail.
export function graveCrow(opt = 'A', st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, act = st.act || 0;
  const RAG = '#322e47', PLUM = '#564b72', FLAKE = '#8d8a9e';
  const H = 26 + Math.sin(a) * 3 - act * 10;
  let b = shadow(opt === 'B' ? 30 : 18, 0, 0.3);
  if (opt === 'B') {
    let e = '';
    for (let i = 0; i < 5; i++) {
      const ang = a + i * TAU / 5, x = Math.cos(ang) * 20, y = -H - 4 + Math.sin(ang) * 9, s = 0.55;
      const c = graveCrow('A', { ph: (st.ph || 0) + i * 0.17 });
      b += `<g transform="translate(${f(x)},${f(y + H * s)}) scale(${s})">${c.b.replace(/<ellipse[^>]*opacity="0.3"[^>]*\/>/, '')}</g>`;
      e += `<g transform="translate(${f(x)},${f(y + H * s)}) scale(${s})">${c.e}</g>`;
    }
    b += `<path d="M-30 ${f(-H - 6)} a30 13 0 0 1 60 0" fill="none" stroke="${FLAKE}" stroke-width="1.4" stroke-dasharray="2 5" opacity=".6"/>`;
    return { b, e, w: 90, h: 70 };
  }
  const up = Math.sin(a * 2); // two beats per cycle
  const wl = 44, wy = -H - 6;
  const wing = (k, dk) => { const tipY = wy - up * 26 * k, tipX = -6 - wl * 0.55; const p = [[2, wy], [tipX * 0.45, tipY * 0.5 + wy * 0.5 - 4], [tipX, tipY], [tipX + 4, tipY + 7], [tipX + 9, tipY + 6], [tipX + 13, tipY + 12], [tipX + 18, tipY + 10], [-4, wy + 6]]; return opt === 'C' ? stk(path(p.slice(0, 4)), dk ? mix(RAG, '#000', 0.3) : PLUM, 6) + stk(path([[tipX, tipY], [tipX - 6, tipY + 10 + Math.sin(a * 3) * 4]]), PLUM, 2.5) : shp(poly(p), dk ? mix(RAG, '#000', 0.25) : PLUM, { w: 0.8 }); };
  b += wing(0.8, true);
  // tail: ragged fan / ribbons
  if (opt === 'C') for (let i = 0; i < 3; i++) b += stk(path([[-10, -H], [-22, -H + 4 + i * 3 + Math.sin(a + i) * 3], [-34 - i * 3, -H + 2 + i * 5 + Math.sin(a * 1.4 + i) * 6]]), RAG, 3 - i * 0.6);
  else b += shp(poly([[-8, -H - 3], [-27, -H - 6], [-24, -H - 1], [-29, -H + 3], [-23, -H + 4], [-26, -H + 9], [-8, -H + 4]]), RAG, { w: 0.8 });
  b += shp(opt === 'C' ? poly([[-12, -H - 4], [10, -H - 10], [16, -H + 2], [4, -H + 9], [-10, -H + 6], [-6, -H + 2]]) : ell(0, -H, 14, 10.5), RAG, { w: 1 });
  const hx = 13 + act * 4, hy = -H - 8 + act * 4;
  b += shp(circ(hx, hy, 9.5), RAG, { w: 0.9 });
  b += shp(poly([[hx + 7, hy - 2], [hx + 17, hy + 2 + act * 2], [hx + 7, hy + 4]]), '#1d1a28', { w: 0.6 }); // dark beak stub (never orange: friendly ravens own the orange beak)
  b += wing(1, false);
  // ash flakes falling behind
  for (let i = 0; i < 4; i++) { const t = ((st.ph || 0) + i * 0.27) % 1; b += `<rect x="${f(-14 - i * 7 - t * 6)}" y="${f(-H + 6 + t * 22)}" width="2.6" height="2.6" fill="${FLAKE}" opacity="${f(0.8 - t * 0.7)}" transform="rotate(${f(t * 140)} ${f(-14 - i * 7)} ${f(-H + 8 + t * 22)})"/>`; }
  const e = eyeP(hx + 3, hy - 2, 3.4 + tl * 0.6);
  return { b, e, w: 72, h: 52 };
}

// ---------------------------------------------------------------- ROOT CRAWLER (root_crawler) 28 x 26 world units
// A Knot Crawler (rec): wide low dome of knotted roots on six root legs that PLANT and pull (lurch, pause), two wide-set eyes in a dark cleft.
// B Stump Crawler: an old stump walking on roots, eyes in a knot-hole. C Tangle Spider: small body slung high on six long arched root legs.
export function rootCrawler(opt = 'A', st = {}) {
  const a = (st.ph || 0) * TAU, act = st.act || 0;
  const BARK = '#534d4f', TOP = '#79716f', LICHEN = '#6f7d6a', VOID = '#100c14';
  const lurch = Math.max(0, Math.sin(a)) ** 2; // pull phase
  let b = shadow(opt === 'C' ? 46 : 50);
  if (opt === 'C') {
    const by = -44 - lurch * 3;
    for (let i = 0; i < 6; i++) { const side = i < 3 ? -1 : 1, k = i % 3, lift = (k + (side > 0 ? 1 : 0)) % 2 ? lurch * 6 : 0; const fx = side * (34 + k * 12), hx = side * (8 + k * 3); b += stk(path([[hx, by + 2], [side * (24 + k * 10), by - 22 - k * 4 - lift], [fx, -lift]]), k === 1 ? TOP : BARK, 4.2); }
    b += shp(ell(0, by, 22, 15), BARK, { w: 1 });
    b += shp(ell(-4, by - 6, 12, 6), LICHEN, { w: 0.5, op: 0.7 });
    b += `<path d="M2 ${by + 2} q8 6 16 0" fill="${VOID}"/>`;
    return { b, e: eyeP(7, by + 4, 2.4) + eyeP(14, by + 3, 2.4), w: 120, h: 80 };
  }
  // legs: three planted, three lifting (swap each half cycle)
  const legs = (front) => { let o = ''; for (let i = 0; i < 6; i++) { const side = i < 3 ? -1 : 1, k = i % 3, alt = (k + (side > 0 ? 1 : 0)) % 2, lift = alt ? lurch * 7 : 0; if ((k === 1) !== front) continue; const hx = side * (22 + k * 7), hy = -18 - k * 4; o += stk(path([[hx, hy], [side * (38 + k * 7), hy - 8 - lift], [side * (52 + k * 6), -1 - lift]]), front ? BARK : mix(BARK, '#000', 0.3), 5.2) + (lift ? '' : stk(path([[side * (52 + k * 6), -1], [side * (55 + k * 6), 3]]), mix(BARK, '#000', 0.3), 2.4)); } return o; };
  const sy = 1 - lurch * 0.05 - act * 0.08, sx = 1 + lurch * 0.04 + act * 0.06;
  b += legs(false);
  let body = '';
  if (opt === 'B') {
    body += shp(`M-34 -10 C-36 -40 -32 -66 -26 -70 L26 -70 C32 -66 36 -40 34 -10 Q0 4 -34 -10Z`, BARK, { w: 1 });
    body += `<ellipse cx="0" cy="-70" rx="26" ry="8" fill="${TOP}" stroke="${mix(TOP, '#2a0f30', 0.55)}" stroke-width="3"/><ellipse cx="0" cy="-70" rx="16" ry="4.6" fill="none" stroke="${mix(TOP, '#000', 0.3)}" stroke-width="1.2"/><ellipse cx="0" cy="-70" rx="7" ry="2" fill="none" stroke="${mix(TOP, '#000', 0.3)}" stroke-width="1.2"/>`;
    for (const x of [-22, -6, 12, 26]) body += `<path d="M${x} -64 q${x > 0 ? 3 : -3} 24 0 50" fill="none" stroke="${mix(BARK, '#000', 0.4)}" stroke-width="2" opacity=".7"/>`;
    body += `<ellipse cx="6" cy="-34" rx="12" ry="9" fill="${VOID}"/>`;
    b += `<g transform="scale(${f(sx)},${f(sy)})">${body}</g>` + legs(true);
    return { b, e: eyeP(2, -35 * sy, 2.6) + eyeP(10, -34 * sy, 2.6), w: 124, h: 92 };
  }
  body += shp(blob([[-44, -8], [-46, -30], [-34, -52], [-10, -64], [16, -62], [38, -48], [46, -26], [42, -8], [16, -2], [-18, -2]]), BARK, { w: 1.1 });
  for (const [x, y, r] of [[-26, -40, 7], [4, -52, 8], [28, -36, 6], [-8, -28, 5]]) body += `<path d="${circ(x, y, r)}" fill="none" stroke="${mix(BARK, '#000', 0.42)}" stroke-width="2.2"/><path d="${circ(x, y, r * 0.45)}" fill="${mix(BARK, '#000', 0.3)}"/>`;
  for (const [x, y, rx, ry] of [[-30, -50, 9, 4.5], [20, -58, 8, 4], [36, -28, 5, 7]]) body += `<path d="${ell(x, y, rx, ry)}" fill="${LICHEN}" opacity=".75"/>`;
  body += stk(path([[-12, -62], [-18, -76], [-10, -86]]), TOP, 3) + stk(path([[14, -60], [22, -72], [18, -80]]), TOP, 2.6);
  body += `<path d="${blob([[-6, -26], [10, -32], [26, -24], [24, -12], [8, -8], [-6, -14]])}" fill="${VOID}"/>`;
  b += `<g transform="scale(${f(sx)},${f(sy)})">${body}</g>` + legs(true);
  return { b, e: eyeP(2 * sx, -21 * sy, 2.8) + eyeP(20 * sx, -20 * sy, 2.8), w: 112, h: 104 };
}

// ---------------------------------------------------------------- NEW 1 RANGED: THORNSPITTER 14 x 28 world units
// A Thornspitter (rec): a dead sapling with a bone-pale seed bulb; roots at range, bulb swells with ember light 0.7 s, spits ONE slow thorn.
// B Spore Puffer: grey mushroom that lobs an arcing spore ball onto a marked ground circle. C Needle Fir: a small dead fir that fires a fan of three needles.
export function thornspitter(opt = 'A', st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, act = st.act || 0;
  const STICK = '#5c5562', BONE = '#a9a8b6', DARK = '#100c14';
  const rock = -act * 10 + Math.sin(a) * 2 * (1 - tl);
  let b = shadow(22);
  b += stk('M-4 -2 q-8 2 -12 4', STICK, 3) + stk('M3 -2 q8 1 12 4', STICK, 3) + stk('M0 -2 q-1 3 2 6', STICK, 2.6);
  if (opt === 'B') {
    const sw = 1 + tl * 0.15;
    b += shp(`M-7 0 C-8 -18 -6 -30 -5 -38 L5 -38 C6 -30 8 -18 7 0Z`, '#77727c', { w: 0.9 });
    b += `<g transform="translate(0,-40) scale(${f(sw)},${f(1 / sw)}) rotate(${f(rock * 0.5)})">${shp('M-34 2 C-32 -26 -14 -36 0 -36 C14 -36 32 -26 34 2 Q0 -6 -34 2Z', '#8c8a96', { w: 1 })}${[-20, -6, 10, 22].map((x, i) => `<circle cx="${x}" cy="${-18 - (i % 2) * 8}" r="${3.5 + (i % 2)}" fill="#6a6774"/>`).join('')}<path d="M-30 1 Q0 -4 30 1" stroke="${DARK}" stroke-width="2" fill="none" opacity=".7"/></g>`;
    return { b, e: eyeP(0, -44, 3), w: 72, h: 84 };
  }
  if (opt === 'C') {
    b += stk('M0 0 L0 -18', STICK, 5);
    for (let i = 0; i < 3; i++) { const y = -14 - i * 18, w = 30 - i * 8; b += shp(poly([[-w, y + 2], [0, y - 24], [w, y + 2], [w * 0.5, y - 2], [0, y + 1], [-w * 0.5, y - 2]]), mix('#4d5257', '#000', i * 0.08), { w: 0.9 }); }
    if (tl) b += [-0.35, 0, 0.35].map((r) => `<path d="M10 -40 l${f(Math.cos(r) * 26 * tl)} ${f(Math.sin(r) * 26 * tl)}" stroke="${TELE}" stroke-width="1.6" stroke-dasharray="3 3" opacity="${f(tl)}"/>`).join('');
    return { b, e: eyeP(4, -36, 2.8), w: 64, h: 76 };
  }
  b += `<g transform="rotate(${f(rock)} 0 0)">`;
  b += stk(path([[0, 0], [-2, -30], [1, -64]]), STICK, 7);
  b += stk(path([[-1, -40], [-14, -52], [-24, -54]]), STICK, 3.4) + stk(path([[-14, -52], [-18, -62]]), STICK, 2) + stk(path([[1, -48], [14, -58], [22, -66]]), STICK, 3.2) + stk(path([[14, -58], [24, -56]]), STICK, 2);
  const s = 1 + tl * 0.28;
  b += `<g transform="translate(2,-80) scale(${f(s)})">`;
  b += shp(blob([[-12, 4], [-14, -8], [-8, -18], [4, -20], [13, -12], [14, 2], [6, 12], [-6, 12]]), BONE, { w: 0.9 });
  b += `<path d="M-6 -16 q-4 12 0 26 M6 -18 q5 14 1 28" stroke="${mix(BONE, '#000', 0.4)}" stroke-width="1.4" fill="none"/>`;
  if (tl) b += `<circle cx="1" cy="-3" r="13" fill="url(#${glowId(EYE, 0.9)})" opacity="${f(tl)}"/>`;
  b += `<path d="M6 -6 l10 -3 l-9 6Z" fill="${DARK}"/>`;
  b += `</g></g>`;
  return { b, e: eyeP(2 + Math.sin(rock * 0.017) * 80, -82, 3.2), w: 56, h: 112 };
}
export const thorn = () => `<path d="M-22 0 L-4 -1.4 L10 0 L-4 1.4Z" fill="#1a1520" stroke="#c9c6cf" stroke-width=".8"/><circle cx="2" cy="0" r="3.6" fill="url(#${glowId(EYE, 0.9)})"/><circle cx="2" cy="0" r="1.6" fill="${CORE}"/><path d="M-24 0 L-60 0" stroke="${CORE}" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>`;

// ---------------------------------------------------------------- NEW 2 AREA DENIAL: BLIGHTBULB 18 x 18 world units
// A Blightbulb (rec): a pallid puffball waddling on stubby legs; within reach it plants, pulses faster and faster while a ground ring fills, then bursts.
// B Mire Slug: a low ink slug that leaves a short-lived corrupt trail that hurts to stand in. C Seedpod: splits on death into six tiny fast seedlings.
export function blightbulb(opt = 'A', st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0;
  const PALE = '#b9bdb2', SPOT = '#7e897b', DARK = '#100c14';
  let b = shadow(opt === 'B' ? 44 : 26);
  if (opt === 'B') {
    const sq = Math.sin(a) * 0.08;
    b += `<path d="M-90 2 Q-60 -4 -40 0" stroke="${INK}" stroke-width="10" stroke-linecap="round" opacity=".55"/>`;
    b += `<g transform="scale(${f(1 + sq)},${f(1 - sq)})">${shp(blob([[-42, 0], [-36, -12], [-8, -18], [20, -20], [38, -12], [42, 0], [0, 4]]), '#3b3646', { w: 1 })}${shp(ell(18, -18, 10, 7), '#4a4458', { w: 0.6 })}</g>`;
    return { b, e: eyeP(14, -21, 2.4) + eyeP(23, -20, 2.4), w: 92, h: 30 };
  }
  if (opt === 'C') {
    const sp = st.die || 0;
    if (sp > 0.3) { let e = ''; for (let i = 0; i < 6; i++) { const ang = i * TAU / 6, r = 14 + sp * 26, x = Math.cos(ang) * r, y = -6 + Math.sin(ang) * r * 0.5; b += `<g transform="translate(${f(x)},${f(y)})">${shp(ell(0, -5, 5, 5), '#6b6f63', { w: 0.6 })}${stk('M-3 0 l-2 3 M3 0 l2 3', '#4d4a52', 1.6)}</g>`; e += eyeP(x + 2, y - 6, 1.4); } return { b, e, w: 100, h: 60 }; }
    b += stk('M-6 -4 l-6 4 M6 -4 l6 4', '#4d4a52', 3.4);
    b += shp(blob([[-14, -6], [-16, -24], [-8, -40], [4, -44], [14, -32], [14, -10], [4, -2]]), '#6b6f63', { w: 1 });
    b += `<path d="M-2 -42 q6 18 2 38" stroke="${DARK}" stroke-width="2" fill="none"/>`;
    return { b, e: eyeP(6, -30, 2.4), w: 64, h: 76 };
  }
  const pulse = tl ? 1 + 0.1 * Math.abs(Math.sin(tl * tl * 30)) : 1;
  const wad = Math.sin(a) * 7 * (1 - tl);
  b += stk(`M-8 -10 l${f(-3 + wad * 0.3)} 10`, '#4d4a52', 5) + stk(`M8 -10 l${f(3 - wad * 0.3)} 10`, '#4d4a52', 5);
  b += `<g transform="translate(0,-26) rotate(${f(wad)}) scale(${f(pulse)})">`;
  b += shp(blob([[-22, 8], [-24, -6], [-16, -20], [0, -25], [16, -20], [24, -6], [22, 8], [0, 16]]), PALE, { w: 1 });
  for (const [x, y, r] of [[-12, -10, 4.5], [8, -16, 3.6], [14, 2, 4], [-4, 6, 3]]) b += `<circle cx="${x}" cy="${y}" r="${r}" fill="${SPOT}"/>`;
  b += `<path d="M-22 -2 q4 8 10 12 M14 -14 q8 6 8 14" stroke="${DARK}" stroke-width="1.6" fill="none" opacity=".7"/>`;
  if (tl) b += `<circle cx="0" cy="-2" r="20" fill="url(#${glowId(EYE, 0.8)})" opacity="${f(tl * 0.9)}"/>`;
  b += `</g>`;
  const ey = -26 - 10;
  return { b, e: eyeP(4, ey, 2) + eyeP(12, ey - 1, 2) + eyeP(8, ey - 7, 2), w: 72, h: 72 };
}

// ---------------------------------------------------------------- NEW 3 (role varies by option)
// A Bramble Hart (rec, HEAVY CHARGER): a stag drained mid-leap, briar antlers twice its head; lowers head + scrapes (0.8 s line tell) then charges straight.
// B Moss Mourner (SUPPORT): a hooded moss lump that stays behind packs and wraps up to 3 allies in a moss ward. C Seed Mother (SPAWNER): a walking seed husk that plants sprouts you can stomp.
export function hart(opt = 'A', st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, act = st.act || 0;
  const SLATE = '#575d6c', TOP = '#7a8090', BRIAR = '#3e3642', BELLY = '#9ea3ae';
  if (opt === 'B') {
    const sway = Math.sin(a) * 4;
    let b = shadow(30);
    b += `<g transform="rotate(${f(sway * 0.6)} 0 0)">`;
    b += shp(blob([[-26, 0], [-30, -30], [-20, -58], [0, -70], [18, -62], [28, -34], [26, 0]]), '#56604f', { w: 1 });
    for (let i = 0; i < 5; i++) b += stk(path([[-20 + i * 10, -14 + (i % 2) * 6], [-22 + i * 10 + sway * 0.5, 4], [-20 + i * 10 + sway, 12 + i % 3 * 3]]), '#6d7a68', 3);
    b += `<path d="${blob([[0, -54], [16, -50], [20, -38], [10, -30], [-2, -36]])}" fill="#100c14"/>`;
    b += `</g>`;
    return { b, e: eyeP(8 + sway * 0.4, -44, 2.4) + eyeP(15 + sway * 0.4, -43, 2.4), w: 70, h: 80 };
  }
  if (opt === 'C') {
    let b = shadow(34);
    const s = Math.sin(a) * 6;
    for (const k of [-1, 1]) b += stk(path([[k * 10, -20], [k * 26, -14 - Math.abs(s) * 0.4], [k * 34, 0]]), '#4f4a4c', 5) + stk(path([[k * 4, -18], [k * 12 + s * k * 0.5, -6], [k * 16, 0]]), '#4f4a4c', 4.5);
    b += shp(blob([[-24, -22], [-26, -50], [-14, -78], [0, -90], [14, -78], [26, -50], [24, -22], [0, -14]]), '#6b6457', { w: 1.1 });
    b += `<path d="M-8 -88 q8 -10 16 0" fill="#100c14"/>` + [-6, 0, 6].map((x, i) => `<ellipse cx="${x}" cy="${-96 - i % 2 * 4}" rx="3" ry="4" fill="#8c8578"/>`).join('');
    b += `<path d="M-14 -70 q14 6 28 0 M-18 -48 q18 6 36 0" stroke="#3a3530" stroke-width="2" fill="none"/>`;
    return { b, e: eyeP(6, -60, 2.8) + eyeP(15, -58, 2.6), w: 80, h: 108 };
  }
  const run = 1 - tl;
  const bob = -Math.abs(Math.sin(a)) * 3 * run;
  const by = -58 + tl * 6 + bob, lean = act * 8;
  let b = shadow(46);
  const s1 = Math.sin(a) * 12 * run, s2 = -s1;
  const scrape = tl ? Math.sin(tl * 26) * 8 : 0;
  b += leg(-24 + lean, by + 10, 46, s2, mix(SLATE, '#000', 0.35), 5) + leg(22 + lean, by + 10, 46, s1 + 4, mix(SLATE, '#000', 0.35), 5);
  b += shp(poly([[-36 + lean, by - 6], [-44 + lean, by - 14], [-40 + lean, by - 2]]), BELLY, { w: 0.6 });
  b += shp(blob([[-38, by], [-30, by - 13], [0, by - 15], [24, by - 14], [36, by - 4], [30, by + 12], [0, by + 15], [-30, by + 12]].map(([x, y]) => [x + lean, y])), SLATE, { w: 1 });
  b += `<path d="${blob([[-24 + lean, by + 8], [0 + lean, by + 12], [22 + lean, by + 8], [0 + lean, by + 4]])}" fill="${BELLY}" opacity=".5"/>`;
  b += leg(-18 + lean, by + 11, 47, s1, SLATE, 5.6) + leg(28 + lean, by + 10, 47, s2 + scrape, SLATE, 5.6);
  // neck + head: proud and high; lowers forward on the tell
  const hx = 44 + lean + tl * 8 + act * 6, hy = by - 26 + tl * 26;
  b += stk(path([[26 + lean, by - 6], [36 + lean + tl * 4, by - 16 + tl * 12], [hx - 4, hy + 4]]), SLATE, 12);
  b += shp(blob([[hx - 10, hy - 6], [hx + 2, hy - 10], [hx + 14, hy - 4], [hx + 18, hy + 4], [hx + 8, hy + 8], [hx - 8, hy + 6]]), TOP, { w: 0.9 });
  b += `<path d="${blob([[hx + 4, hy - 4], [hx + 15, hy - 1], [hx + 16, hy + 5], [hx + 6, hy + 5]])}" fill="#100c14"/>`;
  // briar antlers: big, branching, thorn ticks; swing forward when lowered
  const ant = (k) => { const bx = hx - 2 + k * 3, byy = hy - 8; const R = (x, y) => { const ang = -tl * 0.9; const dx = x - bx, dy = y - byy; return [bx + dx * Math.cos(ang) - dy * Math.sin(ang), byy + dx * Math.sin(ang) + dy * Math.cos(ang)]; }; const main = [[bx, byy], [bx - 10, byy - 22], [bx - 6, byy - 44], [bx + 8, byy - 60]].map(([x, y]) => R(x, y)); let o = stk(path(main), BRIAR, 4.2 - k); for (const [x0, y0, x1, y1] of [[bx - 9, byy - 20, bx - 26, byy - 30], [bx - 7, byy - 36, bx + 12, byy - 44], [bx - 7, byy - 40, bx - 22, byy - 58], [bx - 10, byy - 24, bx + 6, byy - 30]]) { const p0 = R(x0, y0), p1 = R(x1, y1); o += stk(path([p0, p1]), BRIAR, 2.6 - k * 0.5); const m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2]; o += `<path d="M${f(m[0])} ${f(m[1])} l3 -4 l1 5Z" fill="${mix(BRIAR, '#fff', 0.4)}"/>`; } return o; };
  b = b + ant(1);
  b += ant(0);
  return { b, e: eyeP(hx + 9, hy, 2.6) + eyeP(hx + 15, hy + 1.5, 2.3), w: 136, h: 144 };
}

// ---------------------------------------------------------------- MINIBOSS
// A Grey Alpha (rec): 2x Fell Wolf, mane of dead branches with bone tips, boss-amber eyes, pale cool outline; HOWL (calls the pack) and LINE CHARGE.
// B Briar Mother: a walking briar thicket with a hollow doorway mouth; ROOT PULSES (circle tells) and drops Blightbulbs. C Pale Hart King: a giant hart with a dead crown; charges leave bramble walls.
export function miniboss(opt = 'A', st = {}) {
  const tl = st.tele || 0, howl = st.howl || 0;
  if (opt === 'A') {
    const w = fellWolf('A', { ...st, tele: tl });
    const recol = (s) => s.replace(/#4a4558/g, '#3d3949').replace(/#6d687a/g, '#5d5868');
    let b = `<g transform="scale(1.95)">${recol(w.b)}</g>`;
    // mane of dead branches with bone tips around the neck/shoulders
    let mane = '';
    for (let i = 0; i < 13; i++) { const ang = -3.45 + i * 0.2, cx0 = 56, cy0 = -62 + tl * 10, bx = cx0 + Math.cos(ang) * 20, by0 = cy0 + Math.sin(ang) * 15, L = 20 + (i % 3) * 11 + howl * 6; const x1 = bx + Math.cos(ang) * L, y1 = by0 + Math.sin(ang) * L, xm = bx + Math.cos(ang) * L * 0.55, ym = by0 + Math.sin(ang) * L * 0.55; mane += stk(path([[bx, by0], [x1, y1]]), "#4c4552", 4.2) + (i % 2 ? stk(path([[xm, ym], [xm + Math.cos(ang + 0.7) * 10, ym + Math.sin(ang + 0.7) * 10]]), "#4c4552", 2.4) : "") + `<circle cx="${f(x1)}" cy="${f(y1)}" r="2.8" fill="#d9d6cc"/>`; }
    b = `<g filter="url(#rimF)" opacity=".75"><g transform="scale(1.95)">${recol(w.b)}</g>${mane}</g>` + b + mane;
    if (howl) b += [1, 2, 3].map((k) => `<path d="M${f(110 + k * 14)} ${f(-90 - k * 6)} a${8 + k * 10} ${8 + k * 10} 0 0 1 0 ${f(16 + k * 14)}" stroke="#9aa6c8" stroke-width="2" fill="none" opacity="${f(howl * (0.8 - k * 0.2))}"/>`).join('');
    const e = w.e.replace(/glow[^)]*\)/g, (m) => m).replace(/<g opacity="1">/g, '<g>');
    const hx = (44 + 6 * (st.act || 0)) * 1.95, hy = (-31 + tl * 5 + 4 + tl * 5) * 1.95;
    return { b, e: eyeP(hx + 9 * 1.95, hy - 2, 4.2, BOSS_EYE) + eyeP(hx + 15 * 1.95, hy, 3.8, BOSS_EYE), w: 210, h: 136 };
  }
  if (opt === 'B') {
    let b = shadow(100);
    b += shp(blob([[-100, 0], [-96, -50], [-60, -100], [0, -118], [60, -100], [96, -50], [100, 0], [0, 10]]), '#4a4247', { w: 1.3 });
    for (let i = 0; i < 14; i++) { const x = -80 + (i * 37) % 160, y = -20 - (i * 23) % 80; b += `<path d="M${x} ${y} q${10 + i % 3 * 6} -18 ${24 + i % 4 * 4} -4 q-10 10 -20 -10" stroke="#2f282e" stroke-width="3" fill="none"/><path d="M${x + 12} ${y - 8} l3 -5 l2 5Z" fill="#a9a2a6"/>`; }
    b += `<path d="M-26 0 C-26 -50 26 -50 26 0Z" fill="#100c14"/>`;
    return { b, e: eyeP(-10, -30, 4, BOSS_EYE) + eyeP(10, -30, 4, BOSS_EYE), w: 210, h: 130 };
  }
  const h = hart('A', st);
  return { b: `<g transform="scale(1.8)">${h.b.replace(/#3e3642/g, '#d4d0c4').replace(/#575d6c/g, '#4b5060')}</g>`, e: `<g transform="scale(1.8)">${h.e.replace(new RegExp(EYE, 'g'), BOSS_EYE)}</g>`, w: 250, h: 260 };
}

// ---------------------------------------------------------------- CHEST (friendly object: warm, never gold; gold stays evolution/dawn only)
// tier 0 small, 1 medium, 2 large. open 0..1. opt A Lantern Reliquary (tiers), B Choice Chest (card fan), C Seed of Colour (meta-only bud).
export function chest(opt = 'A', tier = 0, open = 0) {
  let o = shadow(34 + tier * 6, 0, 0.4);
  if (opt === 'C') {
    const k = 1 + tier * 0.15;
    o += `<g transform="scale(${k})">`;
    o += stk('M0 0 q-2 -14 0 -22', '#5f6b58', 4);
    if (open < 0.5) o += shp(blob([[-12, -20], [-14, -36], [0, -52], [14, -36], [12, -20], [0, -16]]), '#8a8f95', { w: 1 });
    else { for (let i = 0; i < 6; i++) { const ang = -Math.PI / 2 + (i - 2.5) * 0.5; o += `<g transform="translate(0,-24) rotate(${f(ang * 57.3 + 90)})">${shp(ell(0, -16, 7, 15), ['#ff8fa3', '#ffb347', '#fff1c4'][i % 3], { w: 0.7 })}</g>`; } o += `<circle cx="0" cy="-26" r="7" fill="#ffd9a0"/>` + `<circle cx="-14" cy="-56" r="5" fill="#c9a25a" stroke="#6e5326" stroke-width="1.4"/><path d="M12 -62 l5 8 l-5 8 l-5 -8Z" fill="#b79cff" stroke="#5b4a8a" stroke-width="1.2"/>`; }
    o += `</g>`;
    return o;
  }
  const W = 30 + tier * 6, H = 22 + tier * 3, WOOD = '#7d6450', BAND = tier ? '#c9a25a' : '#6a6f78';
  if (open) o += `<ellipse cx="0" cy="${-H - 6}" rx="${W * 1.4}" ry="${W * 0.9}" fill="url(#${glowId('#ffc96b', 0.85)})" opacity="${f(open)}"/>` + [-0.5, -0.2, 0.15, 0.45].map((r) => `<path d="M0 ${-H} l${f(Math.sin(r) * 70 * open)} ${f(-Math.cos(r) * 70 * open)}" stroke="#fff1c4" stroke-width="5" opacity="${f(0.35 * open)}" stroke-linecap="round"/>`).join('');
  o += shp(`M${-W} 0 L${-W} ${-H} L${W} ${-H} L${W} 0Z`, WOOD, { w: 1 });
  o += `<rect x="${-W}" y="${-H * 0.62}" width="${W * 2}" height="3.4" fill="${BAND}"/>` + [-W * 0.6, W * 0.6].map((x) => `<rect x="${x - 2.5}" y="${-H}" width="5" height="${H}" fill="${BAND}"/>`).join('');
  const lid = `M${-W - 2} ${-H} C${-W - 2} ${-H - 16} ${W + 2} ${-H - 16} ${W + 2} ${-H}Z`;
  o += `<g transform="translate(0,${-H}) rotate(${f(-open * 70)} ${-W} 0) translate(0,${H})">${shp(lid, mix(WOOD, '#fff', 0.08), { w: 1 })}<rect x="-4" y="${-H - 6}" width="8" height="9" rx="2" fill="${BAND}"/></g>`;
  if (tier === 2) o += `<g transform="translate(${W - 6},${-H - 14 + open * -6})">${stk('M0 0 q4 -8 0 -14', '#4a4048', 1.6)}${shp('M-5 -14 L5 -14 L4 -2 L-4 -2Z', '#4a3a2a', { w: 0.6 })}<circle cx="0" cy="-8" r="3" fill="#ffd98a"/><circle cx="0" cy="-8" r="9" fill="url(#${glowId('#ffc96b', 0.8)})"/></g>`;
  if (opt === 'B' && open > 0.5) o += [-1, 0, 1].map((k) => `<g transform="translate(${k * 24},${-H - 44 - Math.abs(k) * -6}) rotate(${k * 14})"><rect x="-10" y="-15" width="20" height="30" rx="4" fill="#efe4cc" stroke="#8a6a3a" stroke-width="1.6"/><circle cx="0" cy="-3" r="5" fill="#d8c9a8"/></g>`).join('');
  return o;
}

// ---------------------------------------------------------------- CORRUPTION BLOOM at the feet (W3 ink + faint cold-violet crack, never red)
// kind: wolf | crow | root | spit | bulb | hart | alpha. mode A footprint stamps (rec), B uniform pool, C growing vein decal (t 0..1).
export function bloom(kind, mode = 'A', t = 1, seed = 1) {
  const veinsAt = (x, y, n, L, w = 1.6) => { let o = ''; for (let i = 0; i < n; i++) { const ang = i * TAU / n + seed, l = L * (0.6 + ((i * 7 + seed) % 5) / 10) * t; o += `<path d="M${f(x)} ${f(y)} l${f(Math.cos(ang) * l * 0.5)} ${f(Math.sin(ang) * l * 0.25)} l${f(Math.cos(ang + 0.4) * l * 0.5)} ${f(Math.sin(ang + 0.4) * l * 0.25)}" stroke="${INK}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".7"/>`; } return o; };
  const crack = (x, y, r) => `<path d="M${f(x - r * 0.5)} ${f(y)} l${f(r * 0.3)} ${f(-r * 0.08)} l${f(r * 0.25)} ${f(r * 0.1)} l${f(r * 0.3)} ${f(-r * 0.06)}" stroke="${CRACK}" stroke-width="1" fill="none" opacity=".55"/>`;
  const pool = (rx) => `<ellipse cx="0" cy="0" rx="${f(rx * t)}" ry="${f(rx * 0.32 * t)}" fill="${INK}" opacity=".62" filter="url(#b2)"/><ellipse cx="0" cy="0" rx="${f(rx * t)}" ry="${f(rx * 0.32 * t)}" fill="none" stroke="${CRACK}" stroke-width="1" opacity=".35"/>`;
  if (mode === 'B') return pool({ wolf: 40, crow: 40, root: 40, spit: 40, bulb: 40, hart: 40, alpha: 80 }[kind]);
  if (mode === 'C') return pool(30) + veinsAt(0, 0, 7, 120, 2) + crack(10, 2, 30);
  switch (kind) {
    case 'wolf': return [[-60, 4], [-40, -3], [-20, 5], [0, -2]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.4" fill="${INK}" opacity="${f(0.35 + i * 0.12)}"/>` + veinsAt(x, y, 3, 18, 1.1)).join('') + crack(-30, 6, 30);
    case 'crow': return Array.from({ length: 10 }, (_, i) => `<circle cx="${f(((i * 37) % 70) - 35)}" cy="${f(((i * 23) % 16) - 8)}" r="${1.2 + (i % 3) * 0.6}" fill="${INK}" opacity=".7"/>`).join('');
    case 'root': return pool(46) + veinsAt(0, 0, 9, 80, 2) + crack(-20, 4, 40) + crack(26, -3, 30);
    case 'spit': return pool(14) + Array.from({ length: 6 }, (_, i) => `<path d="M${f(-30 + i * 12)} ${f(-4 + (i % 2) * 8)} l2 -7 l2 7Z" fill="${INK}"/>`).join('');
    case 'bulb': return `<circle cx="0" cy="0" r="${f(60 * t)}" fill="${INK}" opacity=".55" transform="scale(1,.4)" filter="url(#b2)"/>` + veinsAt(0, 0, 12, 90, 1.6) + crack(0, 0, 60);
    case 'hart': return `<path d="M-160 0 L60 0" stroke="${INK}" stroke-width="${f(10 * t)}" stroke-linecap="round" opacity=".6"/>` + veinsAt(-100, 0, 4, 30) + veinsAt(-30, 0, 4, 30) + `<g transform="translate(70,0)">${pool(16)}${Array.from({ length: 5 }, (_, i) => `<path d="M${-10 + i * 5} 0 q3 -10 6 -2" stroke="#3e3642" stroke-width="2" fill="none"/>`).join('')}</g>`;
    case 'alpha': return `<ellipse cx="0" cy="0" rx="${f(150 * t)}" ry="${f(48 * t)}" fill="none" stroke="${INK}" stroke-width="7" opacity=".55"/>` + veinsAt(0, 0, 14, 150, 1.8) + pool(70);
    default: return pool(40);
  }
}

// death: body crumbles to ash flakes that rise + one small cream spark (Wren's pack-spark, visual only; never gold)
export function deathFx(w, h, k) {
  let o = '';
  for (let i = 0; i < 9; i++) { const x = ((i * 29) % w) - w / 2, y = -h * 0.3 - k * (20 + (i % 4) * 10) - (i % 3) * 8; o += `<rect x="${f(x)}" y="${f(y)}" width="3" height="3" fill="#8f8c9a" opacity="${f(0.9 * (1 - k))}" transform="rotate(${i * 40} ${f(x)} ${f(y)})"/>`; }
  o += `<circle cx="0" cy="${f(-h * 0.5 - k * 40)}" r="${f(3 + k * 2)}" fill="#fff1d6" opacity="${f(0.9 - k * 0.3)}"/><circle cx="0" cy="${f(-h * 0.5 - k * 40)}" r="12" fill="url(#${glowId('#ffe2b0', 0.7)})"/>`;
  return o;
}

export const ROSTER = {
  wolf: { fn: fellWolf, name: 'Fell Wolf', kind: 'wolf' },
  crow: { fn: graveCrow, name: 'Grave Crow', kind: 'crow' },
  root: { fn: rootCrawler, name: 'Root Crawler', kind: 'root' },
  spit: { fn: thornspitter, name: 'Thornspitter', kind: 'spit' },
  bulb: { fn: blightbulb, name: 'Blightbulb', kind: 'bulb' },
  hart: { fn: hart, name: 'Bramble Hart', kind: 'hart' },
  alpha: { fn: miniboss, name: 'Grey Alpha', kind: 'alpha' },
};

// one enemy, posed: hurt = squash + white flash overlay; die = sink, fade, ash + spark; night: body darkened (filter), eyes kept above
export function posed(fn, opt, st = {}, light = 'day') {
  if (fn === miniboss && (light === 'night' || light === 'dusk' || light === 'lit')) light = 'day'; // minibosses are always fully lit, like the boss (visibility arc 3.4)
  const r = fn(opt, st);
  let body = r.b;
  const flt = light === 'night' ? 'nightF' : light === 'dusk' ? 'duskF' : light === 'sil' ? 'silF' : null;
  if (st.hurt) body = `<g transform="translate(-4,0) scale(1.1,.88)">${body}<g filter="url(#hurtF)">${body}</g></g>`;
  if (st.die) body = `<g opacity="${f(1 - st.die)}" transform="scale(${f(1 + st.die * 0.15)},${f(1 - st.die * 0.55)})">${body}</g>` + deathFx(r.w, r.h, st.die);
  if (flt) body = `<g filter="url(#${flt})">${body}</g>`;
  if (light === 'night' && opt !== 'sil') body = `<g filter="url(#coldRimF)" opacity=".3">${r.b}</g>` + body;
  const eyeA = light === 'sil' ? 0 : st.die ? Math.max(0, 1 - st.die * 2) : light === 'lit' ? 0.5 : 1;
  const eyes = eyeA ? `<g opacity="${f(eyeA)}"${st.hurt ? ' transform="translate(-4,0) scale(1.1,.6)"' : ''}>${r.e}</g>` : '';
  return { body, eyes, w: r.w, h: r.h };
}
