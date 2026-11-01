// TAKE B "WICKERKIN" part 2: ranged Briar Poppet, area-denial Spore Basket, charger Bramble Hart, miniboss Effigy Alpha, Treant hint, chest.
import { furry, part, rod, specks, ticks, eye, socket, shadow, glow, mix, blob, line, poly, ell, circ, limb, rng, f, TAU, VOID, BOSS_EYE } from './paint.mjs';
import { PB as P, weave, wicker, twine, disc, ribbon, bramble, stick, finishB, teleRingB, wolfB } from './takeB.mjs';

// ============================ BRIAR POPPET (ranged, Wickerkin) ============================
// story: a harvest corn-doll left at a grave; the Hollow crowned it with thorns and it plucks them to throw. signature: tall STRAW BELL-SKIRT
// doll, twine waist, woven ball head with a disc face, a spiky CROWN of thorn twigs, one stick arm raised with a thorn. personality: rigid hop,
// stops, plucks a thorn from its crown (the tell), rocks back on the throw.
export function spitB(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, hop = Math.max(0, Math.sin(a)) * 3 * (1 - tl), y0 = -hop;
  let b = shadow(22, 0) + specks(0, -1, 16, 2, 6, P.strawDk, { seed: 4, r: 1.6, a: 0.7 });
  // straw bell skirt
  const sk = `M-18 ${f(y0 - 2)} Q-16 ${f(y0 - 22)} -7 ${f(y0 - 34)} L7 ${f(y0 - 34)} Q16 ${f(y0 - 22)} 18 ${f(y0 - 2)} Q0 ${f(y0 + 3)} -18 ${f(y0 - 2)}Z`;
  b += part(sk, P.straw, { sh: 4, rimA: 0.75, tex: Array.from({ length: 16 }, (_, i) => `<path d="M${f(-6 + i * 0.8)} ${f(y0 - 33)} Q${f(-14 + i * 1.9)} ${f(y0 - 18)} ${f(-19 + i * 2.5)} ${f(y0 - 1)}" stroke="${i % 3 ? P.strawDk : mix(P.straw, '#f2f2e6', 0.45)}" stroke-width="1.1" fill="none" opacity=".75"/>`).join('') });
  // ragged hem ends + a rag sash
  b += part(`M-12 ${f(y0 - 22)} Q0 ${f(y0 - 18)} 13 ${f(y0 - 23)} L14 ${f(y0 - 19)} Q0 ${f(y0 - 13)} -13 ${f(y0 - 18)}Z`, P.rag, { lw: 1.6, sh: 1.5, grain: 0.15 }) + ribbon(-12, y0 - 20, 2.3 + Math.sin(a) * 0.2, 16, a * 2, P.rag, 4);
  b += twine(0, y0 - 33, 0, 16, 3);
  // arms: far arm down, near arm raised with a thorn on the tell
  b += stick([[-4, y0 - 30], [-14, y0 - 24], [-20, y0 - 18]], 3.2, mix(P.wood, '#141020', 0.3), false);
  const ra = -0.6 - tl * 1.6, ax = 4 + Math.cos(ra) * 10, ay = y0 - 30 + Math.sin(ra) * 10, hx2 = ax + Math.cos(ra - 0.3) * 9, hy2 = ay + Math.sin(ra - 0.3) * 9;
  // head: woven ball + disc face + thorn crown
  const hx = 0, hy = y0 - 46;
  b += bramble([[hx - 10, hy - 6], [hx - 6, hy - 16 - tl * 3], [hx - 1, hy - 10], [hx + 3, hy - 19 - tl * 3], [hx + 7, hy - 10], [hx + 11, hy - 15 - tl * 2], [hx + 12, hy - 4]], 2.6, 5);
  b += wicker(ell(hx, hy, 12, 12), hx, hy, 12, 12, { sp: 6.5, w: 3.8, ang: 0.6 });
  const dsc = disc(hx + 5, hy + 1, 7.5, [[hx + 3.5, hy - 0.5, 2.2, 2.6], [hx + 8, hy - 0.5, 1.7, 2.2]], { sx: 0.85 });
  b += dsc;
  b += stick([[4, y0 - 30], [ax, ay], [hx2, hy2]], 3.4, P.wood, false);
  if (tl > 0) b += part(`M${f(hx2 - 2)} ${f(hy2 + 1)} L${f(hx2 + 12)} ${f(hy2 - 4)} L${f(hx2 + 1)} ${f(hy2 + 4)}Z`, P.bramble, { lw: 1.4, sh: 1, rim: 0.8 }) + glow(hx2 + 6, hy2 - 1, 8 * tl, 8 * tl, '#ff5a3c', 0.7);
  let e = eye(hx + 3.5, hy - 0.5, 2 + tl * 0.6) + eye(hx + 8, hy - 0.5, 1.6 + tl * 0.5);
  if (st.hurt) e = eye(hx + 3.5, hy - 0.5, 1.9, { shape: 'squint' }) + eye(hx + 8, hy - 0.5, 1.5, { shape: 'squint' });
  if (tl > 0) b += `<path d="M${f(hx2 + 14)} ${f(hy2 - 4)} L${f(hx2 + 90)} ${f(-6)}" stroke="#ff5a3c" stroke-width="2.4" stroke-dasharray="6 5" opacity="${f(0.45 + 0.45 * tl)}"/>`;
  return finishB(st, b, e, { w: 40, h: 64, seed: 17, rag: 1, disc: st.die ? `<g transform="translate(${-hx - 5},${f(-hy - 1)})">${dsc}</g>` : '', mx: hx + 5, my: hy + 1 });
}

// ============================ SPORE BASKET (area denial, Wickerkin) ============================
// story: a forager's basket the Hollow stuffed with blight-moss; it waddles to you and bursts. signature: a ROUND woven ball with grey spore-moss
// BULGING through the gaps, a twine handle loop on top, stubby stick legs, a small disc face. personality: wobbly waddle; swells and creaks.
export function bulbB(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, wob = Math.sin(a) * 4 * (1 - tl), sw = 1 + tl * 0.22 + Math.sin(a * 2) * 0.02;
  let b = shadow(26, 0) + specks(0, -1, 20, 2, 6, P.woodDk, { seed: 6, r: 1.6, a: 0.6 });
  b += stick([[-8, -10], [-11 + wob * 0.4, -4], [-12 + wob * 0.6, 0]], 3.6, mix(P.wood, '#141020', 0.3), false) + stick([[8, -10], [10 - wob * 0.4, -4], [12 - wob * 0.6, 0]], 3.6, P.wood, false);
  const cx = 0, cy = -26, r = 20 * sw;
  b += `<g transform="rotate(${f(wob)} 0 -6)">`;
  // handle loop
  b += rod(`M${f(cx - 12)} ${f(cy - r * 0.7)} Q${f(cx - 4)} ${f(cy - r - 18)} ${f(cx + 12)} ${f(cy - r * 0.7)}`, P.wood, 4, { lw: 2.1 }) + twine(cx - 11, cy - r * 0.72, 0.6, 7, 2) + twine(cx + 11, cy - r * 0.72, -0.6, 7, 2);
  // spore moss underneath the weave (shows through gaps + bulges)
  const MO = '#8e9e8c', MD = '#566256';
  b += part(ell(cx, cy, r, r * 0.95), P.wood, { sh: 5, grain: 0.12, rimA: 0.75, tex: `<ellipse cx="${cx}" cy="${cy}" rx="${f(r * 1.4)}" ry="${f(r * 1.4)}" fill="${MO}"/>` + specks(cx, cy, r, r, 30, MD, { seed: 2, r: 2.4, a: 0.7 })
    + (tl > 0 ? `<ellipse cx="${cx}" cy="${cy}" rx="${f(r)}" ry="${f(r)}" fill="#ff5a3c" opacity="${f(0.25 * tl)}"/>` : '')
    + weave(cx, cy, r, r, { sp: 10, w: 4.6, ang: 0.62 }).replace(`fill="${P.inside}"`, 'fill="none"') + `<path d="${ell(cx, cy, r, r * 0.95)}" fill="url(#vgn)"/>` });
  // bulges of moss through gaps
  for (const [dx, dy, s] of [[-12, -6, 1], [6, -12, 0.8], [10, 6, 1.1], [-6, 10, 0.9]]) b += part(ell(cx + dx * sw, cy + dy * sw, 4.5 * s * sw, 3.6 * s * sw), MO, { lw: 1.6, sh: 1.2, rim: 1, grain: 0.15, tex: specks(cx + dx * sw, cy + dy * sw, 3, 2, 3, MD, { seed: 3 + dx, r: 1.2, a: 0.8 }) });
  // rim band + disc face
  b += twine(cx, cy + r * 0.62, 0, 4, 1);
  const dsc = disc(cx + r * 0.7, cy + 2, 7.5, [[cx + r * 0.7 - 1.5, cy + 0.5, 2.1, 2.5], [cx + r * 0.7 + 3, cy + 0.5, 1.7, 2.1]], { sx: 0.8 });
  b += dsc + '</g>';
  for (let i = 0; i < 4; i++) b += `<circle cx="${f(-8 + i * 6)}" cy="${f(cy - r - 6 - i * 3 - Math.sin(a + i) * 2)}" r="${f(1.5 - i * 0.2)}" fill="${MO}" opacity=".75"/>`;
  const E1 = [cx + r * 0.7 - 1.5, cy + 0.5], E2 = [cx + r * 0.7 + 3, cy + 0.5];
  let e = `<g transform="rotate(${f(wob)} 0 -6)">` + eye(E1[0], E1[1], 2 + tl * 0.6) + eye(E2[0], E2[1], 1.6 + tl * 0.5) + '</g>';
  if (st.hurt) e = eye(E1[0], E1[1], 1.9, { shape: 'squint' }) + eye(E2[0], E2[1], 1.5, { shape: 'squint' });
  if (tl > 0) b = teleRingB(46, tl) + b;
  return finishB(st, b, e, { w: 44, h: 50, seed: 23, disc: st.die ? `<g transform="translate(${f(-cx - r * 0.7)},${f(-cy - 2)})">${dsc}</g>` : '', mx: cx + r * 0.7, my: cy + 2 });
}

// ============================ BRAMBLE HART (charger, Wickerkin) ============================
// story: woven in the shape of the stag the hunters never caught; its antlers are living bramble hung with grave-rags. signature: woven deer body on
// tall stick legs, HUGE bramble antlers streaming rag ribbons. personality: still as a scarecrow, then ribbons snap back and it bolts.
export function hartB(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2;
  let b = shadow(38, 0) + specks(0, -1, 28, 2, 8, P.woodDk, { seed: 8, r: 1.6, a: 0.6 });
  const leg = (x, ph, far, back) => { const sw = Math.sin(ph) * 6 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 5 * (1 - tl), px = x + sw + (back ? -tl * 4 : tl * 6), py = -lift, c = far ? mix(P.wood, '#141020', 0.35) : P.wood;
    return stick([[x, -38 + bob], [px + (back ? -4 : 3), -20 - lift], [px, py - 1]], 3.8, c, false); };
  b += leg(14, a + Math.PI, true) + leg(-16, a, true, true);
  const body = blob([[24, -40 + bob], [16, -54 + bob], [-4, -56 + bob], [-22, -52 + bob], [-28, -42 + bob], [-20, -34 + bob], [6, -32 + bob]]);
  b += wicker(body, -2, -44 + bob, 26, 12, { sp: 8.5, w: 4, ang: 0.75 });
  b += ribbon(-26, -48 + bob, 2.6 + s1 * 0.2 - tl * 0.4, 14, a * 2, P.rag2, 4);
  b += leg(-20, a + Math.PI, false, true) + leg(10, a, false);
  const hx = 30 + tl * 10, hy = -70 + bob + tl * 26, rot = tl * 50;
  b += stick([[16, -50 + bob], [hx - 4, hy + 6]], 7, P.wood, false) + twine((16 + hx) / 2 - 2, (-50 + bob + hy + 6) / 2, Math.atan2(hy + 56 - bob, hx - 20), 9, 2);
  let h = '';
  const antler = (far) => { const dir = far ? -1 : 1, bx = hx - 3 + (far ? -5 : 0), by = hy - 7; const pts = [[bx, by], [bx + dir * 8, by - 14], [bx + dir * 18, by - 24], [bx + dir * 22, by - 38], [bx + dir * 16, by - 50]];
    let s = bramble(pts, far ? 4 : 4.6, far ? 2 : 9);
    for (const [i, len, ang] of [[1, 14, -1.9], [2, 16, -1.5], [3, 12, -1.2]]) { const p = pts[i], an = dir > 0 ? ang : Math.PI - ang; s += bramble([[p[0], p[1]], [p[0] + Math.cos(an) * len * 0.5, p[1] + Math.sin(an) * len * 0.6], [p[0] + Math.cos(an) * len, p[1] + Math.sin(an) * len]], 2.8, i + (far ? 5 : 1)); }
    if (!far) s += ribbon(pts[2][0], pts[2][1], 2.6 - tl * 0.8 + s1 * 0.2, 22, a * 2 + 1, P.rag, 4.4) + ribbon(pts[3][0], pts[3][1], 2.8 - tl * 0.8 + s1 * 0.2, 18, a * 2 + 2.5, P.rag2, 3.8);
    else s += ribbon(pts[3][0], pts[3][1], 2.3 - tl * 0.6, 16, a * 2 + 0.7, mix(P.rag, '#120d22', 0.3), 3.6);
    return s; };
  h += antler(true);
  h += wicker(ell(hx - 2, hy, 10, 9), hx - 2, hy, 10, 9, { sp: 6, w: 3.4 });
  h += part(blob([[hx + 2, hy - 4], [hx + 22, hy], [hx + 22, hy + 5], [hx + 2, hy + 7]]), P.wood, { lw: 2, sh: 2, tex: weave(hx + 12, hy + 1, 10, 6, { sp: 5, w: 3 }) });
  const dsc = disc(hx + 4, hy, 7, [[hx + 3, hy - 1.2, 2.2, 2.6], [hx + 7.4, hy - 1.2, 1.6, 2]], { sx: 0.82 });
  h += dsc + antler(false);
  b += `<g transform="rotate(${f(rot)} ${f(hx)} ${f(hy)})">${h}</g>`;
  const R = (x, y) => { const t = rot * Math.PI / 180, dx = x - hx, dy = y - hy; return [hx + dx * Math.cos(t) - dy * Math.sin(t), hy + dx * Math.sin(t) + dy * Math.cos(t)]; };
  const E1 = R(hx + 3, hy - 1.2), E2 = R(hx + 7.4, hy - 1.2);
  let e = eye(E1[0], E1[1], 2.1 + tl * 0.8, { shape: tl > 0.3 ? 'slit' : 'round', rot }) + eye(E2[0], E2[1], 1.6 + tl * 0.6, { shape: tl > 0.3 ? 'slit' : 'round', rot });
  if (st.hurt) e = eye(E1[0], E1[1], 2, { shape: 'squint' }) + eye(E2[0], E2[1], 1.5, { shape: 'squint' });
  if (tl > 0) b = `<rect x="30" y="-7" width="${f(120 * tl + 30)}" height="14" rx="7" fill="#ff5a3c" opacity="${f(0.12 + 0.1 * tl)}"/><path d="M30 0 L${f(60 + 120 * tl)} 0" stroke="#ff5a3c" stroke-width="2.6" stroke-dasharray="9 6" opacity="${f(0.5 + 0.4 * tl)}"/>` + b;
  return finishB(st, b, e, { w: 70, h: 110, seed: 29, rag: 1, disc: st.die ? `<g transform="translate(${f(-hx - 4)},${f(-hy)})">${dsc}</g>` : '', mx: hx + 4, my: hy });
}

// ============================ EFFIGY ALPHA (miniboss, Wickerkin) ============================
// the biggest effigy: a wolf woven round an old grave-lantern cage, wearing a long rag cape and a crown of standing sticks; three eyes (amber).
export function alphaB(st = {}) {
  const tl = st.tele || 0;
  const w = wolfB(st, { wood: '#83817b', rag: '#4d5f80', eye: BOSS_EYE, eye3: true });
  // stick crown + rag cape drawn behind by prepending
  const a = (st.ph || 0) * TAU, bob = -Math.abs(Math.sin(a)) * 2.6 + tl * 4;
  let back = ribbon(-10, -50 + bob, 2.95, 40, a * 2, '#4d5f80', 9) + ribbon(-2, -50 + bob, 2.8, 34, a * 2 + 1, P.rag2, 8);
  back += bramble([[-22, -46 + bob], [-16, -66 + bob - tl * 6], [-8, -54 + bob], [-2, -74 + bob - tl * 6], [6, -56 + bob], [12, -70 + bob - tl * 5], [18, -50 + bob]], 4, 13);
  if (st.die) return w;
  return { b: back + w.b, e: w.e };
}

// ============================ ELDER TREANT hint (Wickerkin) ============================
// the Hollow wove its first effigy round the Elder Treant itself: a wicker-man tree with a great disc face and a cage chest.
export function treantB(st = {}) {
  let b = shadow(120, 0, 0.5) + specks(0, -2, 100, 6, 20, P.woodDk, { seed: 3, r: 3, a: 0.6 });
  for (const [x, dx] of [[-40, -70], [-20, -50], [30, 60], [44, 88]]) b += stick([[x, -24], [x + dx * 0.5, -8], [x + dx, 0]], 10, P.woodDk, false);
  b += bramble([[-120, -200], [-80, -280], [-10, -310], [60, -300], [120, -240]], 8, 3);
  b += part(furry([[-100, -220], [-70, -290], [-10, -316], [60, -300], [110, -246], [100, -200], [0, -190]], 12, -1, 5, null, 0.4), '#56625f', { sh: 12, tex: specks(0, -260, 90, 40, 26, '#3c4644', { seed: 4, r: 6, a: 0.6 }) });
  const trunk = blob([[-60, -10], [-70, -60], [-56, -140], [-64, -210], [-30, -230], [30, -232], [62, -206], [54, -130], [70, -60], [62, -10]]);
  b += wicker(trunk, 0, -120, 66, 110, { sp: 18, w: 9, ang: 0.8 });
  for (const y of [-40, -150, -210]) b += twine(0, y, 0, 120, 3);
  b += stick([[-50, -170], [-96, -190], [-130, -176], [-150, -196]], 14, P.wood, false) + stick([[50, -160], [100, -190], [140, -180], [160, -204]], 14, P.wood, false);
  b += ribbon(-110, -186, 1.8, 40, 1, P.rag, 10) + ribbon(130, -184, 1.5, 34, 2, P.rag2, 9);
  b += disc(0, -168, 36, [[-12, -172, 8, 9], [12, -172, 8, 9]]);
  const e = eye(-12, -172, 5.5, { col: BOSS_EYE }) + eye(12, -172, 5.5, { col: BOSS_EYE });
  return { b, e };
}

// ============================ CHEST (Wickerkin) ============================
export function chestB(st = {}) {
  let b = shadow(30, 0, 0.5) + glow(0, -16, 40, 26, '#ffc45a', 0.45);
  const box = 'M-24 -1 L-25 -21 Q-25 -23 -23 -23 L23 -23 Q25 -23 25 -21 L24 -1 Q24 1 22 1 L-22 1 Q-24 1 -24 -1Z';
  b += part(box, P.wood, { sh: 4, tex: weave(0, -11, 25, 12, { sp: 7, w: 4.4, ang: 0.0001 }).replace(`fill="${P.inside}"`, 'fill="#ffcf70"') });
  b += part('M-26 -21 Q-26 -36 0 -38 Q26 -36 26 -21Z', P.wood, { sh: 4, tex: weave(0, -29, 26, 10, { sp: 7, w: 4.4, ang: 0.0001 }) });
  b += twine(-14, -14, 0, 30, 2) + twine(14, -14, 0, 30, 2) + rod('M-8 -36 Q0 -46 8 -36', P.wood, 3.4, { lw: 1.8 });
  b += part('M-6 -26 L-6 -14 L6 -14 L6 -26Z', '#c9a25a', { lw: 2, sh: 1.5, rimC: '#fff0c0' }) + `<rect x="-3.6" y="-23.5" width="7.2" height="7" rx="2" fill="#ffe08a"/>` + glow(0, -20, 12, 12, '#ffd27a', 0.9);
  return { b, e: '' };
}
