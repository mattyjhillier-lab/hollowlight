// TAKE A "HUSKS" part 2: crow, crawler (Rootback), ranged (Quillhog), area denial (Puffback Toad), charger (Bramble Hart). Mock-up code only.
import { furry, part, rod, specks, ticks, eye, socket, shadow, glow, mix, blob, line, poly, ell, circ, limb, rng, f, TAU, VOID } from './paint.mjs';
import { PA as P, sock, huskMask, finishA, teleRing, veins } from './takeA.mjs';

// ============================ GRAVE CROW (Husk) ============================
// story: a crow that ate from the drained fields; a bark visor grew over its eyes and left ONE socket. signature: puff-ball body, huge ragged
// moth-eaten wings in a high V, one big eye, dark charcoal beak stub, three-feather tail. personality: jerky 2-beat flap then a hanging stall, head tilts.
export function crowA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, fl = Math.cos(a), hover = -30 + Math.sin(a) * 3 - tl * 4;
  const FE = P.feather, DK = mix(FE, '#120d22', 0.4), TK = mix(FE, '#0e0a1c', 0.55);
  let b = shadow(16, 0, 0.32);
  const Y = (y) => y + hover;
  for (const [ang, len, c] of [[2.75, 22, DK], [2.95, 25, FE], [3.15, 20, DK]]) { const x0 = -12, y0 = Y(-6), x1 = x0 + Math.cos(ang) * len, y1 = y0 - Math.sin(ang) * len * 0.3 + 8;
    b += part(blob([[x0, y0 - 3], [x1 + 3, y1 - 3], [x1 - 2, y1 + 1], [x1 + 4, y1 + 3], [x0, y0 + 3]]), c, { lw: 2.2, sh: 2, rim: 1.2 }); }
  // wing = fan of 5 long ragged primaries + a covert pad; angle from the flap (up = raised V); folded back on the dive tell
  const wing = (far) => { const up = tl > 0 ? -0.5 - tl * 0.5 : fl, sx = far ? -7 : 0, sy = far ? -3 : 0, col = far ? DK : FE;
    const ox = -2 + sx, oy = Y(-14) + sy, base = -1.95 - up * 0.75 + (tl * 0.9); let s = '';
    for (let i = 4; i >= 0; i--) { const ang = base - i * 0.2 + (tl * i * 0.12), len = 30 - i * 2.2 + (i === 1 ? 3 : 0), c = Math.cos(ang), sn = Math.sin(ang), nx = -sn, ny = c, w = 4.4 - i * 0.2;
      const x2 = ox + c * len, y2 = oy + sn * len, rag = i % 2 ? 2.4 : -1.6;
      const d = `M${f(ox + nx * w * 0.6)} ${f(oy + ny * w * 0.6)} Q${f(ox + c * len * 0.5 + nx * w)} ${f(oy + sn * len * 0.5 + ny * w)} ${f(x2 + nx * 1.4)} ${f(y2 + ny * 1.4)} L${f(x2 - c * 3 + rag * nx * 0.4)} ${f(y2 - sn * 3 + rag * ny * 0.4)} L${f(x2 - nx * 1.2)} ${f(y2 - ny * 1.2)} Q${f(ox + c * len * 0.5 - nx * w)} ${f(oy + sn * len * 0.5 - ny * w)} ${f(ox - nx * w * 0.6)} ${f(oy - ny * w * 0.6)}Z`;
      s += part(d, i % 2 ? mix(col, '#120d22', 0.15) : col, { lw: 2, sh: 2, rim: far ? 0 : 1.2, grain: 0.06, tex: `<path d="M${f(ox)} ${f(oy)} L${f(x2 - c * 4)} ${f(y2 - sn * 4)}" stroke="${TK}" stroke-width="1" opacity=".7"/>` + (i === 2 ? `<circle cx="${f(ox + c * len * 0.62)}" cy="${f(oy + sn * len * 0.62)}" r="1.5" fill="${VOID}"/>` : '') }); }
    const cv = furry([[ox + 6, oy + 4], [ox + Math.cos(base) * 14 + 4, oy + Math.sin(base) * 14], [ox + Math.cos(base - 0.8) * 14, oy + Math.sin(base - 0.8) * 14], [ox - 6, oy + 4]], 2.4, 1, 61, [0, 1, 0, 0], 0.5);
    return s + part(cv, col, { lw: 2.1, sh: 2, rim: far ? 0 : 1.4, tex: ticks([[ox, oy, 8, base - 0.3, 1.5]], TK, 0.5) }); };
  b += wing(true);
  b += rod(`M-2 ${f(Y(6))} l-2 7 l-3 2 M-4 ${f(Y(13))} l2 3`, P.ink, 1.6, { lw: 1.4, hi: 0 }) + rod(`M5 ${f(Y(6))} l0 7 l-3 2 M5 ${f(Y(13))} l3 2`, P.ink, 1.6, { lw: 1.4, hi: 0 });
  const body = furry([[14, Y(-4)], [16, Y(-16)], [6, Y(-24)], [-8, Y(-22)], [-16, Y(-12)], [-12, Y(2)], [2, Y(6)]], 3, -1, 33, [0, 1, 1, 1, 1, 1, 1], 0.6);
  b += part(body, FE, { sh: 6, tex: ticks([[-10, Y(-14), 9, 2.8, 1.8], [-4, Y(-6), 9, 2.6, 1.8], [-12, Y(-4), 8, 2.4, 1.6], [2, Y(0), 7, 2.5, 1.6]], TK, 0.55) + ticks([[-6, Y(-20), 9, 3.0, 1.6], [4, Y(-22), 8, 3.1, 1.5]], mix(FE, '#e6eef8', 0.45), 0.5) + `<ellipse cx="2" cy="${f(Y(5))}" rx="12" ry="4" fill="${P.ink}" opacity=".45" filter="url(#sb2)"/>` });
  const hx = 13 + tl * 3, hy = Y(-24) + tl * 3, tilt = tl ? 18 : Math.sin(a * 2) * 6;
  let h = part(furry([[hx - 10, hy + 6], [hx - 12, hy - 4], [hx - 4, hy - 12], [hx + 6, hy - 11], [hx + 11, hy - 2], [hx + 8, hy + 7]], 2.6, -1, 41, [1, 1, 1, 0, 0, 0], 0.6), FE, { sh: 4 });
  h += part(blob([[hx + 8, hy - 3], [hx + 24, hy + 1], [hx + 26, hy + 3], [hx + 9, hy + 5]]), '#2a2833', { lw: 2.2, sh: 2, rimC: '#9aa6c0', rimA: 0.7 });
  const M = (x, y) => [hx + x, hy + y];
  const visor = poly([M(-9, -4), M(-5, -10), M(1, -13), M(8, -12), M(13, -7), M(14, -2), M(11, 0), M(12, 3), M(8, 1.5), M(6, 4.5), M(3, 2), M(0, 4), M(-2, 1.5), M(-6, 3), M(-7, 0)]);
  const vis = huskMask(visor, M, { col: '#aaa895', grain: [[[-4, -4], [4, -6], [11, -3]]], crack: [[1, -11], [3, -8], [2, -6]], lichen: [[-3, -8, 4, 2, 3, 6]] }) + socket(ell(hx + 4.5, hy - 4, 4.4, 3.8));
  h += vis;
  b += `<g transform="rotate(${f(tilt)} ${f(hx)} ${f(hy)})">${h}</g>`;
  b += wing(false);
  for (const [x, y, r] of [[-20, Y(14), 20], [-8, Y(22), 70], [8, Y(18), 130]]) b += `<rect x="${x}" y="${f(y)}" width="3.2" height="2.2" rx=".6" fill="#b9bdc8" opacity=".7" transform="rotate(${r} ${x} ${f(y)})"/>`;
  const tr = tilt * Math.PI / 180, ex = hx + 4.5 * Math.cos(tr) + 4 * Math.sin(tr), ey = hy + 4.5 * Math.sin(tr) - 4 * Math.cos(tr);
  let e = eye(ex, ey, st.hurt ? 3 : 3.1 + tl * 1, { shape: st.hurt ? 'squint' : tl > 0.3 ? 'wide' : 'round' });
  if (tl > 0) b = `<circle cx="${f(40 + 30 * tl)}" cy="2" r="${f(7 + 4 * tl)}" fill="none" stroke="#ff5a3c" stroke-width="2.4" opacity="${f(0.5 + 0.4 * tl)}"/><path d="M${f(hx + 20)} ${f(hy + 4)} L${f(40 + 30 * tl)} 2" stroke="#ff5a3c" stroke-width="2" stroke-dasharray="5 5" opacity="${f(0.4 + 0.4 * tl)}"/>` + b;
  return finishA(st, b, e, { w: 40, h: 60, seed: 9, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${vis}</g>` : '', mx: hx, my: hy, mrot: -40 });
}

// ============================ ROOTBACK (Root Crawler, Husk) ============================
// story: a badger the Hollow buried and pulled up again with the root-knot it was caught in; it carries the knot like a shell. signature: a wide
// stump CROWN on its back with three broken root prongs, short legs, a small low mask face. personality: heavy plod, rocks side to side, roots drag.
export function crawlerA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, rock = Math.sin(a) * 2.5, bob = -Math.abs(Math.sin(a)) * 1.5 + tl * 2;
  const FUR = '#4b5268', BK = P.bark, BD = P.barkDk;
  let b = shadow(46, 0) + `<ellipse cx="0" cy="0" rx="40" ry="7" fill="${P.ink}" opacity=".35"/>`;
  b += rod(line([[-30, -10], [-44, -4], [-54, -1], [-62, 0]]), BD, 4, { lw: 2.2 }) + rod(line([[-24, -6], [-34, 0], [-46, 1]]), BD, 3, { lw: 2 });
  const leg = (x, ph, far) => { const sw = Math.sin(ph) * 4, lift = Math.max(0, -Math.cos(ph)) * 3; return part(limb(x, -14 + bob, x + sw, -lift - 3, 6, 5.5), far ? '#343a50' : FUR, { lw: 2.4, sh: 2, rim: far ? 0 : 1.4 }) + sock(x + sw, -lift, 6, 7); };
  b += leg(-22, a, true) + leg(14, a + Math.PI, true);
  const body = furry([[30, -10 + bob], [28, -24 + bob], [10, -30 + bob], [-20, -30 + bob], [-34, -20 + bob], [-30, -8 + bob], [0, -6 + bob]], 3, -1, 7, [0, 0, 1, 1, 0, 1, 1], 0.6);
  b += part(body, FUR, { sh: 5, tex: ticks([[-20, -18 + bob, 9, 2.8, 1.8], [-6, -20 + bob, 9, 2.9, 1.8], [8, -18 + bob, 8, 2.9, 1.6]], mix(FUR, '#0e0a1c', 0.55), 0.55) });
  const R = (x, y) => [x + rock * 0.3, y + bob - Math.abs(rock) * 0.2];
  const dome = blob([R(-32, -22), R(-30, -38), R(-18, -50), R(0, -54), R(18, -50), R(28, -38), R(28, -24), R(10, -18), R(-14, -18)]);
  b += part(dome, BK, { sh: 7, rimA: 0.85, tex: [0, 1, 2, 3, 4].map((i) => `<path d="M${f(-26 + i * 12 + rock * 0.3)} ${f(-22 + bob)} q${f(2 - i)} -14 ${f(1 + i * 0.5)} -28" stroke="${BD}" stroke-width="1.6" fill="none" opacity=".75"/>`).join('')
    + `<ellipse cx="${f(-2 + rock * 0.3)}" cy="${f(-49 + bob)}" rx="18" ry="5.5" fill="${mix(BK, '#d8dccc', 0.35)}" stroke="${BD}" stroke-width="1.2"/><ellipse cx="${f(-2 + rock * 0.3)}" cy="${f(-49 + bob)}" rx="11" ry="3.2" fill="none" stroke="${BD}" stroke-width="1" opacity=".8"/><ellipse cx="${f(-2 + rock * 0.3)}" cy="${f(-49 + bob)}" rx="5" ry="1.5" fill="none" stroke="${BD}" stroke-width="1" opacity=".8"/>`
    + `<path d="M${f(-30 + rock * 0.3)} ${f(-30 + bob)} q10 -6 22 -2 q10 4 20 -1" stroke="${P.ink}" stroke-width="2.2" fill="none" opacity=".65"/>` });
  b += part(furry([R(-30, -34), R(-20, -42), R(-10, -40), R(-6, -33), R(-18, -30)], 2.2, 1, 3, [0, 0, 0, 1, 1], 0.2), P.moss, { lw: 2, sh: 2, grain: 0.15 }) + specks(R(14, -36)[0], R(14, -36)[1], 8, 6, 6, P.lichen, { seed: 5, r: 2, a: 0.85 });
  const prong = (x, y, h, lean, w) => { const p0 = R(x, y); return part(blob([[p0[0] - w, p0[1] + 2], [p0[0] - w * 0.5 + lean * 0.5, p0[1] - h * 0.6], [p0[0] + lean, p0[1] - h], [p0[0] + lean + w * 0.5, p0[1] - h + 2], [p0[0] + w * 0.6, p0[1] - h * 0.4], [p0[0] + w, p0[1] + 2]]), BK, { lw: 2.3, sh: 2, rimA: 0.9, tex: `<path d="M${f(p0[0] + lean - 1)} ${f(p0[1] - h + 1)} l2 3 l-1 2" stroke="${VOID}" stroke-width="1" fill="none"/>` }); };
  b += prong(-16, -46, 16 + tl * 4, -6, 4.5) + prong(4, -52, 22 + tl * 5, 3, 5) + prong(18, -44, 13 + tl * 4, 8, 4);
  b += leg(-16, a + Math.PI, false) + leg(20, a, false);
  const hx = 34, hy = -16 + bob, M = (x, y) => [hx + x, hy + y];
  b += part(ell(hx - 3, hy - 2, 10, 9), FUR, { sh: 3 });
  const mask = blob([M(-6, -8), M(4, -10), M(12, -5), M(14, 1), M(10, 5), M(0, 6), M(-6, 2)]);
  const maskSvg = huskMask(mask, M, { grain: [[[-2, -3], [6, -2], [12, 0]]], lichen: [[2, 2, 4, 2, 3, 3]] }) + socket(blob([M(-2, -2), M(2, -6), M(6, -4), M(4, 0)])) + socket(blob([M(8, -4), M(11, -6), M(13, -3), M(10, -1)]));
  b += maskSvg;
  let e = eye(hx + 2, hy - 3.2, 2.1 + tl * 0.8, { shape: 'almond', rot: -20 }) + eye(hx + 10.4, hy - 3.6, 1.6 + tl * 0.6, { shape: 'almond', rot: -20 });
  if (st.hurt) e = eye(hx + 1.5, hy - 3, 2.2, { shape: 'squint' }) + eye(hx + 9, hy - 3, 1.8, { shape: 'squint' });
  if (tl > 0) b = teleRing(54, tl) + b;
  return finishA(st, b, e, { w: 80, h: 56, seed: 13, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${maskSvg}</g>` : '', mx: hx, my: hy });
}
