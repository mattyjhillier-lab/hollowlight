// TAKE C "SNUFFED" part 2: ranged Taper, area-denial Wax Bloat, charger Candelabra Hart, miniboss Old Tallow, Treant hint, chest. Mock-up code only.
import { part, rod, specks, eye, shadow, glow, mix, blob, line, ell, limb, f, TAU, VOID, BOSS_EYE } from './paint.mjs';
import { PC as P, wax, drips, puddle, wick, stub, hollow, finishC, teleRingC, wolfC } from './takeC.mjs';

// ============================ TAPER (ranged, Snuffed) ============================
// story: a tall altar taper that burned down crooked; it spits gobs of cold wax. signature: a TALL THIN crooked candle column with a bulb head,
// drip "arms", a long wick that bends like a feeler. personality: sways like a flame in a draught; on the tell the wick catches and the head swells.
export function spitC(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, sway = Math.sin(a) * 4 * (1 - tl), W = P.wax;
  let b = shadow(18, 0) + puddle(0, 16, W);
  const col = `M-9 -2 Q-10 -26 ${f(-7 + sway * 0.5)} -48 Q${f(-6 + sway)} -56 ${f(sway)} -58 Q${f(7 + sway)} -56 ${f(7 + sway * 0.5)} -48 Q10 -26 9 -2 Q0 1 -9 -2Z`;
  b += wax(col, W, { sh: 4, tex: `<path d="M${f(3 + sway * 0.3)} -52 Q5 -30 4 -6" stroke="${mix(W, '#e4ecfb', 0.5)}" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>` });
  b += drips([[-6, -36, 12, 2.6], [6, -30, 16, 2.8], [-2, -18, 9, 2.2]], W);
  // drip arms
  b += wax(limb(-6, -40, -15 - sway * 0.3, -28, 3.6, 2.8), W, { sh: 1.5, lw: 2.2 }) + wax(limb(6 + sway * 0.4, -42, 16 + sway * 0.6 + tl * 4, -34 - tl * 6, 3.6, 2.8), W, { sh: 1.5, lw: 2.2 });
  // bulb head (swells on the tell)
  const hx = sway, hy = -66 - tl * 2, r = 11 + tl * 3;
  b += wax(blob([[hx - r, hy + 4], [hx - r * 0.8, hy - r * 0.7], [hx, hy - r], [hx + r * 0.85, hy - r * 0.6], [hx + r, hy + 3], [hx + r * 0.5, hy + r * 0.8], [hx - r * 0.5, hy + r * 0.8]]), P.old, { sh: 3 });
  b += hollow(blob([[hx - 2, hy - 2], [hx + 4, hy - 6], [hx + 10, hy - 3], [hx + 8, hy + 3], [hx + 1, hy + 3]]));
  b += wick(hx - 2, hy - r + 1, -1.3 + Math.sin(a) * 0.2, 12, tl, a);
  let e = eye(hx + 3, hy - 1.5, 2 + tl * 0.6) + eye(hx + 8, hy - 1.5, 1.6 + tl * 0.5);
  if (st.hurt) e = eye(hx + 3, hy - 1.5, 1.9, { shape: 'squint' }) + eye(hx + 8, hy - 1.5, 1.5, { shape: 'squint' });
  if (tl > 0) b += `<path d="M${f(hx + 14)} ${f(hy)} L${f(hx + 90)} -8" stroke="#ff5a3c" stroke-width="2.4" stroke-dasharray="6 5" opacity="${f(0.45 + 0.45 * tl)}"/>`;
  return finishC(st, b, e, { w: 36 });
}

// ============================ WAX BLOAT (area denial, Snuffed) ============================
// story: a round lantern-candle that swelled when it was snuffed; its short wick is a fuse. signature: a FAT ROUND ball candle with a stubby fuse
// wick, a drip skirt, two tiny feet. personality: wobbling waddle; on the tell the fuse sparks red, it swells and cracks, then bursts into a
// slippery wax pool (the area it denies).
export function bulbC(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, wob = Math.sin(a) * 5 * (1 - tl), sw = 1 + tl * 0.25, W = P.old;
  let b = shadow(24, 0) + puddle(0, 20, P.wax);
  b += wax(ell(-8 + wob * 0.2, -2, 5.5, 3.2), P.wax, { sh: 1, lw: 2 }) + wax(ell(9 + wob * 0.2, -2, 5.5, 3.2), P.wax, { sh: 1, lw: 2 });
  const cx = wob * 0.3, cy = -24, r = 19 * sw;
  b += `<g transform="rotate(${f(wob)} 0 -4)">`;
  b += wax(ell(cx, cy, r, r * 0.95), W, { sh: 6, tex: specks(cx, cy + 4, r * 0.7, r * 0.5, 7, P.soot, { seed: 6, r: 2.4, a: 0.28 }) + `<path d="M${f(cx - r * 0.7)} ${f(cy - r * 0.2)} Q${f(cx)} ${f(cy - r * 0.95)} ${f(cx + r * 0.6)} ${f(cy - r * 0.45)}" stroke="#eef3fc" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/>`
    + (tl > 0 ? `<path d="M${f(cx - 8)} ${f(cy - 6)} l4 5 l-2 6 l5 4 M${f(cx + 6)} ${f(cy - 10)} l-2 6 l4 4" stroke="#ff5a3c" stroke-width="${f(1.2 + tl)}" fill="none" opacity="${f(0.5 + 0.5 * tl)}"/>` : '') });
  b += drips([[cx - 12, cy + r * 0.6, 9, 2.8], [cx - 2, cy + r * 0.85, 7, 2.4], [cx + 10, cy + r * 0.65, 10, 2.8]], W);
  b += hollow(blob([[cx + 4, cy - 2], [cx + 10, cy - 6], [cx + 17, cy - 3], [cx + 15, cy + 3], [cx + 7, cy + 3]]));
  b += wick(cx - 2, cy - r + 1, -1.6, 6, tl, a, { w: 2.4 });
  if (tl > 0) for (let i = 0; i < 5; i++) { const an = i * 1.25; b += `<path d="M${f(cx - 2)} ${f(cy - r - 6)} l${f(Math.cos(an) * 6)} ${f(Math.sin(an) * 6 - 2)}" stroke="#ffb08a" stroke-width="1.2" opacity="${f(tl)}"/>`; }
  b += '</g>';
  const E1 = [cx + 9, cy - 1.5], E2 = [cx + 14, cy - 1];
  let e = `<g transform="rotate(${f(wob)} 0 -4)">` + eye(E1[0], E1[1], 2 + tl * 0.6) + eye(E2[0], E2[1], 1.6 + tl * 0.5) + '</g>';
  if (st.hurt) e = eye(E1[0], E1[1], 1.9, { shape: 'squint' }) + eye(E2[0], E2[1], 1.5, { shape: 'squint' });
  if (tl > 0) b = teleRingC(46, tl) + b;
  return finishC(st, b, e, { w: 44, col: W });
}

// ============================ CANDELABRA HART (charger, Snuffed) ============================
// story: the stag from the hunting-lodge chandelier, cast in wax; its antlers still hold their candles. signature: wax stag with ANTLERS THAT ARE
// A CANDELABRA: every tine ends in a snuffed candle stub (6 wicks, 6 smoke curls). personality: proud and still; on the tell EVERY wick catches
// red in a ripple and it charges in a straight lane.
export function hartC(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2, W = P.wax;
  let b = shadow(38, 0) + puddle(0, 30, W);
  const leg = (x, ph, far, back) => { const sw = Math.sin(ph) * 6 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 5 * (1 - tl), px = x + sw + (back ? -tl * 4 : tl * 6), py = -lift, col = far ? mix(W, '#141020', 0.3) : W;
    return wax(limb(x, -38 + bob, px + (back ? -3 : 2), -18 - lift, 5.2, 3.8, back ? -2 : 1), col, { sh: 2, lw: 2.2 }) + wax(limb(px + (back ? -3 : 2), -18 - lift, px, py - 2, 3.8, 3.4), col, { sh: 1, lw: 2.1 }) + wax(ell(px + 1, -1.5 - lift * 0.4, 5, 2.4), col, { sh: 1, lw: 1.8 }); };
  b += leg(14, a + Math.PI, true) + leg(-16, a, true, true);
  b += wax(blob([[24, -38 + bob], [18, -52 + bob], [-2, -55 + bob], [-22, -51 + bob], [-28, -42 + bob], [-20, -32 + bob], [6, -31 + bob]]), W, { sh: 6 });
  b += drips([[-14, -33 + bob, 8, 2.4], [0, -32 + bob, 10, 2.6], [12, -33 + bob, 7, 2.2]], W);
  b += leg(-20, a + Math.PI, false, true) + leg(10, a, false);
  const hx = 30 + tl * 10, hy = -70 + bob + tl * 26, rot = tl * 48;
  b += wax(limb(16, -48 + bob, hx - 4, hy + 6, 8.5, 6.5), W, { sh: 3 });
  let h = '';
  const antler = (far) => { const dir = far ? -1 : 1, bx = hx - 3 + (far ? -5 : 0), by = hy - 7, c = far ? mix(P.old, '#141020', 0.3) : P.old;
    const pts = [[bx, by], [bx + dir * 8, by - 12], [bx + dir * 18, by - 20], [bx + dir * 24, by - 32]];
    let s = rod(line(pts), c, 5, { lw: 2.3 });
    const cups = [[1, -1.9, 10], [2, -1.6, 9], [3, -1.5, 0]];
    for (const [i, ang, len] of cups) { const p = pts[i], an = dir > 0 ? ang : Math.PI - ang, x = p[0] + Math.cos(an) * len, y = p[1] + Math.sin(an) * len;
      if (len) s += rod(`M${f(p[0])} ${f(p[1])} Q${f(p[0] + Math.cos(an) * len * 0.3 + dir * 3)} ${f(p[1] + Math.sin(an) * len * 0.7)} ${f(x)} ${f(y)}`, c, 3.6, { lw: 2.1 });
      s += wax(ell(x, y, 4.6, 1.8), c, { sh: 0.8, lw: 1.8 }) + stub(x, y - 0.5, 9, 2.6, tl > 0 ? Math.min(1, tl * 1.4 - i * 0.15) : 0, a + i + (far ? 2 : 0), far ? mix(P.old, '#141020', 0.25) : P.old); }
    return s; };
  h += antler(true);
  h += wax(ell(hx - 3, hy, 9, 8), W, { sh: 3 });
  h += wax(blob([[hx - 9, hy - 5], [hx - 19, hy - 9], [hx - 9, hy - 1]]), mix(W, '#141020', 0.3), { sh: 1, lw: 2 });
  h += wax(blob([[hx - 4, hy - 6], [hx + 10, hy - 6], [hx + 22, hy - 1], [hx + 23, hy + 4], [hx + 14, hy + 7], [hx, hy + 7]]), W, { sh: 3 }) + drips([[hx + 12, hy + 6, 7, 2.2]], W);
  h += hollow(blob([[hx - 1, hy - 3], [hx + 5, hy - 6], [hx + 15, hy - 3], [hx + 13, hy + 2], [hx + 3, hy + 2]]));
  h += antler(false);
  b += `<g transform="rotate(${f(rot)} ${f(hx)} ${f(hy)})">${h}</g>`;
  const R = (x, y) => { const t = rot * Math.PI / 180, dx = x - hx, dy = y - hy; return [hx + dx * Math.cos(t) - dy * Math.sin(t), hy + dx * Math.sin(t) + dy * Math.cos(t)]; };
  const E1 = R(hx + 4, hy - 2), E2 = R(hx + 11, hy - 1.5);
  let e = eye(E1[0], E1[1], 2.2 + tl * 0.7, { shape: tl > 0.3 ? 'slit' : 'almond', rot: rot - 8 }) + eye(E2[0], E2[1], 1.7 + tl * 0.5, { shape: tl > 0.3 ? 'slit' : 'almond', rot: rot - 8 });
  if (st.hurt) e = eye(E1[0], E1[1], 2, { shape: 'squint' }) + eye(E2[0], E2[1], 1.6, { shape: 'squint' });
  if (tl > 0) b = `<rect x="30" y="-7" width="${f(120 * tl + 30)}" height="14" rx="7" fill="#ff5a3c" opacity="${f(0.12 + 0.1 * tl)}"/><path d="M30 0 L${f(60 + 120 * tl)} 0" stroke="#ff5a3c" stroke-width="2.6" stroke-dasharray="9 6" opacity="${f(0.5 + 0.4 * tl)}"/>` + b;
  return finishC(st, b, e, { w: 70 });
}

// ============================ OLD TALLOW (miniboss, Snuffed) ============================
// the pack leader set in the oldest, yellowed-grey wax: a ROW OF MELTED CANDLES down its spine, a mane of hard stalactite drips, three eyes (amber).
export function alphaC(st = {}) {
  const tl = st.tele || 0, a = (st.ph || 0) * TAU, bob = -Math.abs(Math.sin(a)) * 2 + tl * 4;
  const w = wolfC(st, { wax: '#5e6880', eye: BOSS_EYE, eye3: true });
  if (st.die) return w;
  let top = '';
  for (const [x, h, wd, i] of [[-20, 12, 3.6, 0], [-9, 18, 4, 1], [2, 14, 3.8, 2], [12, 20, 4.2, 3]]) top += stub(x, -46 + bob + Math.abs(x) * 0.05, h, wd, tl * (i % 2 ? 1 : 0.7), a + i, '#9aa2b0');
  // mane of hard drips round the neck
  let mane = '';
  for (let i = 0; i < 5; i++) { const x = 18 + i * 3, y = -46 + bob + i * 3; mane += wax(`M${f(x - 4)} ${f(y)} L${f(x + 4)} ${f(y)} L${f(x + 1)} ${f(y + 12 + (i % 2) * 5)}Z`, '#8790a3', { sh: 1, lw: 1.8 }); }
  return { b: w.b + mane + top, e: w.e };
}

// ============================ ELDER TREANT hint (Snuffed) ============================
// the Elder Treant's sap set like wax: dripping curtains down the bark, every branch-tip a snuffed wick; the great face is a melted hollow.
export function treantC(st = {}) {
  const W = '#5f6a7e';
  let b = shadow(120, 0, 0.5) + puddle(0, 110, W);
  for (const [x, dx] of [[-40, -70], [-20, -50], [30, 60], [44, 88]]) b += rod(line([[x, -20], [x + dx * 0.5, -6], [x + dx, 2]]), '#3d4250', 10, { lw: 3 });
  const trunk = blob([[-60, -10], [-70, -60], [-56, -140], [-64, -210], [-30, -230], [30, -232], [62, -206], [54, -130], [70, -60], [62, -10]]);
  b += wax(trunk, W, { sh: 14, lw: 4, gloss: 0.25, tex: [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-50 + i * 20} -230 q${f(4 - i)} 90 ${f(-2 + i)} 200" stroke="${mix(W, '#141020', 0.4)}" stroke-width="2.4" fill="none" opacity=".6"/>`).join('') });
  b += drips([[-40, -214, 40, 6], [-10, -224, 60, 7], [24, -218, 34, 6], [50, -200, 46, 6]], W);
  for (const [pts, w] of [[[[-50, -170], [-96, -190], [-130, -176], [-150, -196]], 14], [[[50, -160], [100, -190], [140, -180], [160, -204]], 14], [[[-20, -228], [-40, -280], [-30, -310]], 10], [[[20, -228], [50, -276], [44, -306]], 10]]) {
    b += rod(line(pts), W, w, { lw: 3.4 }); const e2 = pts[pts.length - 1]; b += stub(e2[0], e2[1] + 2, 18, 6, 0, e2[0]); }
  b += hollow(blob([[-34, -186], [-10, -200], [14, -200], [36, -186], [30, -160], [0, -150], [-30, -160]]));
  b += `<ellipse cx="2" cy="-92" rx="22" ry="30" fill="${VOID}"/>` + glow(2, -92, 26, 34, '#6f86c8', 0.35);
  const e = eye(-14, -178, 5.5, { col: BOSS_EYE, shape: 'almond', rot: 12 }) + eye(14, -178, 5.5, { col: BOSS_EYE, shape: 'almond', rot: -12 });
  return { b, e };
}

// ============================ CHEST (Snuffed) ============================
// an iron-banded box sealed with a big cold wax seal; the warm reward glows through the keyhole and the seams.
export function chestC(st = {}) {
  let b = shadow(30, 0, 0.5) + glow(0, -16, 40, 26, '#ffc45a', 0.45);
  b += part('M-24 -1 L-25 -21 Q-25 -23 -23 -23 L23 -23 Q25 -23 25 -21 L24 -1 Q24 1 22 1 L-22 1 Q-24 1 -24 -1Z', '#4a4f5e', { sh: 4, gloss: 0.2 });
  b += `<path d="M-25 -21 L25 -21" stroke="#ffcf70" stroke-width="2.2" opacity=".9"/>` + glow(0, -21, 30, 5, '#ffd27a', 0.7);
  b += part('M-26 -21 Q-26 -36 0 -38 Q26 -36 26 -21Z', '#4a4f5e', { sh: 4, gloss: 0.25 });
  for (const x of [-16, 16]) b += part(`M${x - 3} 0 L${x - 3} -36 L${x + 3} -36 L${x + 3} 0Z`, P.iron, { lw: 1.8, sh: 1, gloss: 0.4 });
  b += wax(blob([[-9, -30], [0, -34], [9, -30], [10, -20], [4, -15], [-4, -15], [-10, -20]]), '#7c879c', { sh: 2 }) + drips([[-5, -16, 8, 2.2], [4, -16, 11, 2.4]], '#7c879c');
  b += `<path d="M0 -28 l3 5 l-6 0Z M0 -23 l0 4" stroke="#ffe08a" stroke-width="1.6" fill="#ffe08a"/>` + glow(0, -24, 10, 10, '#ffd27a', 0.9);
  return { b, e: '' };
}
