// TAKE B "WICKERKIN": effigies the Hollow weaves from what the forest drops: ash-grey twig wicker, bramble, straw, moss and grave-rag ribbons.
// They are hollow cages (you see the dark through the weave); a carved wooden DISC is the face, one or two holes, ember eye-points inside.
// Mock-up drawing code only (not game code). Units du (4 du = 1 world unit). Origin = feet on ground, facing +x.
import { furry, part, rod, specks, ticks, eye, socket, shadow, glow, mix, blob, line, poly, ell, circ, limb, rng, f, TAU, VOID, BOSS_EYE, addDef, nid } from './paint.mjs';

export const PB = { wood: '#93918a', woodDk: '#5d5b58', inside: '#1d1a25', twine: '#a9a596', rag: '#5c6f8e', rag2: '#6f6a8c', bramble: '#3a3245', disc: '#7b7974', discDk: '#4c4a47', straw: '#a3a493', strawDk: '#6d6e60', moss: '#6a8577', ink: '#171222' };
const P = PB;
// woven texture: two diagonal strip sets, over-under by dash offsets; strips leave gaps that show the dark inside
export function weave(cx, cy, rx, ry, o = {}) {
  const sp = o.sp || 9.5, w = o.w || 4.4, ang = o.ang ?? 0.7, col = o.col || P.wood, dk = mix(col, '#140f20', 0.45), hi = mix(col, '#f2f4f8', 0.4), L = Math.hypot(rx, ry) * 2.4;
  let s = `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx * 1.6)}" ry="${f(ry * 1.6)}" fill="${P.inside}"/>`;
  const set = (a, off, dash) => { let r = ''; const c = Math.cos(a), sn = Math.sin(a), nx = -sn, ny = c; for (let k = -12; k <= 12; k++) { const ox = cx + nx * k * sp, oy = cy + ny * k * sp, x1 = ox - c * L / 2, y1 = oy - sn * L / 2, x2 = ox + c * L / 2, y2 = oy + sn * L / 2;
    const da = dash ? ` stroke-dasharray="${f(sp * 1.15)} ${f(sp * 1.15)}" stroke-dashoffset="${f(off + (k % 2) * sp * 1.15)}"` : '';
    r += `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${dk}" stroke-width="${f(w + 1.6)}"${da}/><path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${col}" stroke-width="${f(w)}"${da}/><path d="M${f(x1 + nx * w * 0.25)} ${f(y1 + ny * w * 0.25)} L${f(x2 + nx * w * 0.25)} ${f(y2 + ny * w * 0.25)}" stroke="${hi}" stroke-width="${f(w * 0.28)}" opacity=".7"${da}/>`; } return r; };
  s += set(-ang, 0, false) + set(ang, 0, false) + set(-ang, 0, true);
  return s;
}
// part painted as a woven cage
export const wicker = (d, cx, cy, rx, ry, o = {}) => part(d, o.col || P.wood, { sh: o.sh ?? 5, grain: 0.12, rimA: 0.75, tex: weave(cx, cy, rx, ry, o) + `<path d="${d}" fill="url(#vgn)" />`, ...o.p });
// twine wrap band across a stick at (x,y) angle a
export const twine = (x, y, a, len = 7, n = 3) => { let s = ''; const c = Math.cos(a), sn = Math.sin(a); for (let i = 0; i < n; i++) { const ox = x + c * (i - (n - 1) / 2) * 2.2, oy = y + sn * (i - (n - 1) / 2) * 2.2; s += `<path d="M${f(ox - sn * len / 2)} ${f(oy + c * len / 2)} L${f(ox + sn * len / 2)} ${f(oy - c * len / 2)}" stroke="#2c2834" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(ox - sn * len / 2)} ${f(oy + c * len / 2)} L${f(ox + sn * len / 2)} ${f(oy - c * len / 2)}" stroke="${P.twine}" stroke-width="1.3" stroke-linecap="round"/>`; } return s; };
// carved wooden face disc with void holes; holes = list of [x,y,rx,ry]
export const disc = (x, y, r, holes, o = {}) => { const col = o.col || P.disc; let s = part(ell(x, y, r * (o.sx || 1), r), col, { sh: 3, rimA: 0.9, grain: 0.2, tex: `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.66 * (o.sx || 1))}" ry="${f(r * 0.66)}" fill="none" stroke="${P.discDk}" stroke-width="1.1" opacity=".7"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.33 * (o.sx || 1))}" ry="${f(r * 0.33)}" fill="none" stroke="${P.discDk}" stroke-width="1" opacity=".55"/><path d="M${f(x - r * 0.2)} ${f(y - r * 0.95)} l${f(r * 0.1)} ${f(r * 0.4)} l${f(-r * 0.08)} ${f(r * 0.25)}" stroke="${VOID}" stroke-width="1.1" fill="none"/>` });
  for (const [hx, hy, rx, ry] of holes) s += socket(ell(hx, hy, rx, ry)); return s; };
// grave-rag ribbon from (x,y), flutter phase ph, length len, direction (radians), width w
export const ribbon = (x, y, ang, len, ph, col = P.rag, w = 4.5) => { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6, wav = Math.sin(ph + t * 5) * 4 * t; pts.push([x + Math.cos(ang) * len * t - Math.sin(ang) * wav, y + Math.sin(ang) * len * t + Math.cos(ang) * wav]); }
  const L = [], R = []; pts.forEach(([px, py], i) => { const q = pts[Math.min(pts.length - 1, i + 1)], p0 = pts[Math.max(0, i - 1)], dx = q[0] - p0[0], dy = q[1] - p0[1], l = Math.hypot(dx, dy) || 1, ww = w * (1 - i / 8) * (i === 6 ? 0.2 : 1); L.push([px - dy / l * ww / 2, py + dx / l * ww / 2]); R.push([px + dy / l * ww / 2, py - dx / l * ww / 2]); });
  const end = pts[6]; const notch = [end[0] - Math.cos(ang) * 3, end[1] - Math.sin(ang) * 3];
  return part('M' + [...L, notch, ...R.reverse()].map(([a, b]) => `${f(a)} ${f(b)}`).join(' L') + 'Z', col, { lw: 1.8, sh: 2, rim: 1.2, grain: 0.15 }); };
// bramble vine with thorns along a polyline
export const bramble = (pts, w = 3, seed = 1) => { const r = rng(seed); let s = rod(line(pts), P.bramble, w, { lw: 1.8 });
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 2; k++) { const t = (k + 0.5) / 2, x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, sg = r() > 0.5 ? 1 : -1, a = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) + sg * 1.2;
    s += `<path d="M${f(x - 1.5)} ${f(y)} L${f(x + Math.cos(a) * 5)} ${f(y + Math.sin(a) * 5)} L${f(x + 1.5)} ${f(y)}Z" fill="${P.bramble}" stroke="#211b2a" stroke-width=".8"/>`; } return s; };
// stick limb with a twine knot at the joint
export const stick = (pts, w = 3.6, col = P.wood, knot = true) => { let s = ''; for (let i = 0; i < pts.length - 1; i++) { const w0 = w * (1 - 0.16 * i), w1 = w * (1 - 0.16 * (i + 1)); s += part(limb(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w0 / 2 + 0.4, w1 / 2 + 0.2), col, { lw: 1.9, sh: 1.2, rim: 1, grain: 0.1, tex: `<circle cx="${f((pts[i][0] + pts[i + 1][0]) / 2)}" cy="${f((pts[i][1] + pts[i + 1][1]) / 2)}" r="${f(w0 * 0.22)}" fill="${P.woodDk}" opacity=".8"/>` }); }
  return s + (knot && pts.length > 2 ? twine(pts[1][0], pts[1][1], Math.atan2(pts[2][1] - pts[0][1], pts[2][0] - pts[0][0]), w + 3, 2) : ''); };

export const teleRingB = (rx, tl, x = 0) => `<ellipse cx="${x}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.36)}" fill="#ff5a3c" opacity="${f(0.1 + 0.12 * tl)}"/><ellipse cx="${x}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.36)}" fill="none" stroke="#ff5a3c" stroke-width="2.6" opacity="${f(0.5 + 0.4 * tl)}"/><ellipse cx="${x}" cy="1" rx="${f(rx * tl)}" ry="${f(rx * 0.36 * tl)}" fill="#ff5a3c" opacity=".22"/>`;
// death = UNRAVEL: the weave springs loose, twigs scatter, rag flutters down, the disc face rolls away; a warm mote and a sprout remain
export function finishB(st, body, eyes, o = {}) {
  const die = st.die || 0; let b = body, e = eyes;
  if (st.hurt) { b = `<g transform="rotate(-6 0 0) translate(-4,0) scale(1.04,.96)"><g filter="url(#hurtF)">${b}</g></g>`; e = `<g transform="rotate(-6 0 0) translate(-4,0) scale(1.04,.96)">${e}</g>`; }
  if (die > 0) {
    const r = rng(o.seed || 3), W = o.w || 50, H = o.h || 50; let deb = '';
    for (let i = 0; i < 12; i++) { const x0 = (r() - 0.5) * W, y0 = -H * (0.2 + 0.6 * r()), x = x0 * (1 + die * 0.9), y = y0 * (1 - die) - 2 + die * (r() * 4), a = r() * 180 + die * 200 * (r() - 0.5), l = 6 + r() * 10;
      deb += `<g transform="translate(${f(x)},${f(y)}) rotate(${f(a)})">${rod(`M${f(-l / 2)} 0 L${f(l / 2)} 0`, i % 4 === 0 ? P.straw : P.wood, 3, { lw: 1.6 })}</g>`; }
    if (o.rag) deb += `<g transform="translate(${f(-6 - die * 10)},${f(-H * 0.6 * (1 - die) - 4)}) rotate(${f(die * 70)})">${ribbon(0, 0, 0.4, 18, die * 6, P.rag, 4)}</g>`;
    b = `<g opacity="${f(Math.max(0, 1 - die * 1.5))}" transform="translate(0,${f(die * 8)}) scale(${f(1 + die * 0.25)},${f(1 - die * 0.5)})">${b}</g>` + deb;
    if (o.disc) b += `<g transform="translate(${f(o.mx + die * 22)},${f(o.my + (-o.my - 6) * Math.min(1, die * 1.4))}) rotate(${f(die * 200)})">${o.disc}</g>`;
    if (die > 0.6) { const g = (die - 0.6) / 0.4; b += glow(-4, -6, 24 * g, 13 * g, '#ffd27a', 0.45) + `<path d="M-6 0 q-1 -8 2 -${f(12 * g)}" stroke="#6fae5a" stroke-width="2" fill="none"/><path d="M-4 ${f(-10 * g)} q6 -4 9 0 q-5 3 -9 0Z" fill="#8fd06a" stroke="#3f7a46" stroke-width=".8"/>`; }
    e = `<g opacity="${f(Math.max(0, 1 - die * 1.6))}">${e}</g>`;
  }
  return { b, e };
}
export const VGN = `<radialGradient id="vgn" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff" stop-opacity=".12"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0812" stop-opacity=".55"/></radialGradient>`;

// ============================ WICKER HOUND (Fell Wolf, Wickerkin) ============================
// story: the Hollow found the wolves gone and wove new ones from their den sticks. signature: a SEE-THROUGH woven cage body, a bramble collar,
// a grave-rag ribbon tail, upright twig-bundle ears, a wooden disc face. personality: clattery stiff-legged trot, ribbons stream, head wobbles loosely.
export function wolfB(st = {}, K = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2.6 + tl * 4, Wd = K.wood || P.wood;
  let b = shadow(42, 0) + specks(-6, -1, 30, 3, 9, P.woodDk, { seed: 5, r: 1.6, a: 0.7 });
  // ribbon tail (2 rags tied to a stick)
  b += stick([[-26, -36 + bob], [-36, -42 + bob], [-42, -44 + bob]], 3.4, Wd);
  b += ribbon(-40, -44 + bob, 2.9 + s1 * 0.15 - tl * 0.6, 34, a * 2, K.rag || P.rag, 5.5) + ribbon(-40, -43 + bob, 2.6 + s1 * 0.2 - tl * 0.6, 26, a * 2 + 1.5, P.rag2, 4.5);
  const leg = (x, ph, far, back) => { const sw = Math.sin(ph) * 6 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 5 * (1 - tl), px = x + sw - tl * (back ? 2 : -3), py = -lift;
    const kx = (x + px) / 2 + (back ? -4 : 3), ky = -16 - lift * 0.5 + bob * 0.5; const c = far ? mix(Wd, '#141020', 0.35) : Wd;
    return stick([[x, -26 + bob], [kx, ky], [px, py - 2]], 4.2, c, false) + rod(`M${f(px - 3)} ${f(py - 1)} L${f(px + 4)} ${f(py - 1)}`, c, 3.2, { lw: 1.8 }); };
  b += leg(14, a + Math.PI, true) + leg(-20, a, true, true);
  // the cage body
  const body = blob([[24, -26 + bob], [18, -44 + bob], [0, -50 + bob], [-20, -46 + bob], [-30, -34 + bob], [-24, -20 + bob], [0, -16 + bob], [18, -18 + bob]]);
  b += wicker(body, -2, -33 + bob, 28, 18, { col: Wd, ang: 0.75 });
  // rib hoops (thicker bent sticks) + twine
  for (const x of [-16, 2]) b += twine(x + 2, -46 + bob, 0.2, 6, 2);
  b += leg(-24, a + Math.PI, false, true) + leg(10, a, false);
  // bramble collar
  const hx = 34 - tl * 3, hy = -46 + bob * 0.7 + tl * 8;
  b += bramble([[hx - 22, hy + 14], [hx - 18, hy - 2], [hx - 8, hy - 8], [hx - 2, hy + 4], [hx - 10, hy + 14], [hx - 20, hy + 10]], 3.4, 7);
  // head: small woven basket + twig-bundle ears + disc face
  const ear = (x, lean, h, scrap) => { const tx = x + lean, ty = hy - 6 - h; let s = '';
    if (scrap) s += part(poly([[x - 4, hy - 7], [tx, ty + 2], [x + 4, hy - 7]]), P.rag2, { lw: 1.4, sh: 1, rim: 0.8, grain: 0.15 });
    s += rod(`M${f(x - 5)} ${f(hy - 5)} L${f(tx)} ${f(ty)} L${f(x + 5)} ${f(hy - 5)} M${f(x - 3)} ${f(hy - 10)} L${f(x + 3.4)} ${f(hy - 10)}`, Wd, 2.6, { lw: 1.6, hi: 0 }); return s + twine(tx, ty + 3, -1.5, 5, 1); };
  b += ear(hx - 12, -6 - tl * 4, 17, true);
  b += wicker(ell(hx - 4, hy, 14, 12.5), hx - 4, hy, 14, 12, { col: Wd, sp: 6.5, w: 4, ang: 0.6 });
  b += ear(hx - 2, 3 - tl * 6, 19, true);
  const dsc = disc(hx + 8, hy + 1, 10, [[hx + 6, hy - 1, 2.9, 3.3], [hx + 12.5, hy - 1.5, 2.2, 2.7]], { sx: 0.82 });
  b += dsc + rod(`M${f(hx + 15)} ${f(hy + 5)} l6 2`, P.woodDk, 3, { lw: 1.6 });
  const E1 = [hx + 6, hy - 1], E2 = [hx + 12.5, hy - 1.5];
  let e = eye(E1[0], E1[1], 2.3 + tl * 0.9, { shape: tl > 0.3 ? 'slit' : 'round', col: K.eye }) + eye(E2[0], E2[1], 1.8 + tl * 0.7, { shape: tl > 0.3 ? 'slit' : 'round', col: K.eye });
  if (K.eye3) e += eye(hx + 9, hy - 7.5, 1.7, { col: K.eye });
  if (st.hurt) e = eye(E1[0], E1[1], 2.2, { shape: 'squint', col: K.eye }) + eye(E2[0], E2[1], 1.7, { shape: 'squint', col: K.eye });
  if (tl > 0) b = `<path d="M40 3 Q70 ${f(-3 - 6 * tl)} ${f(90 + 40 * tl)} 3" stroke="#ff5a3c" stroke-width="${f(2 + 2 * tl)}" fill="none" stroke-dasharray="8 6" opacity="${f(0.4 + 0.5 * tl)}"/><ellipse cx="${f(84 + 40 * tl)}" cy="3" rx="${f(14 + 8 * tl)}" ry="5" fill="#ff5a3c" opacity="${f(0.15 + 0.2 * tl)}"/>` + b;
  return finishB(st, b, e, { w: 70, h: 60, seed: 3, rag: 1, disc: st.die ? `<g transform="translate(${f(-hx - 8)},${f(-hy - 1)})">${dsc}</g>` : '', mx: hx + 8, my: hy + 1 });
}

// ============================ RAG CROW (Grave Crow, Wickerkin) ============================
// story: a field scarecrow's crow, made to frighten crows; the Hollow let it fly. signature: two bare STICK WINGS hung with long grave-rag
// strips (tattered feathers), a tight straw teardrop body in twine bands, a broom tail, a one-hole disc head with a dark peg beak.
// personality: jerky gusts, rags snap and stream, tilts and stalls like something blown about.
export function crowB(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, gust = Math.sin(a), hov = -32 + gust * 4 - tl * 4, tilt = gust * 6 + tl * 22;
  const Y = (y) => y + hov;
  let b = shadow(18, 0, 0.32), k = '';
  const wing = (far) => { const up = tl > 0 ? -0.4 - tl * 0.4 : Math.cos(a), sx = far ? -6 : 0, sy = far ? -3 : 0, c = far ? mix(P.wood, '#141020', 0.35) : P.wood;
    const ox = -2 + sx, oy = Y(-14) + sy, ang = -2.35 - up * 0.6 + tl * 0.9, L = 38, ex = ox + Math.cos(ang) * L, ey = oy + Math.sin(ang) * L;
    let s = '';
    for (let i = 0; i < 4; i++) { const t = 0.3 + i * 0.22, x = ox + (ex - ox) * t, y = oy + (ey - oy) * t; s += ribbon(x, y, 1.95 + gust * 0.15 - tl * 0.6 + i * 0.05, 10 + i * 3.5, a * 2 + i, far ? mix(P.rag, '#120d22', 0.3) : (i % 2 ? P.rag2 : P.rag), 5 - i * 0.4); }
    s += stick([[ox, oy], [(ox + ex) / 2, (oy + ey) / 2 - 2], [ex, ey]], 4, c);
    return s; };
  k += wing(true);
  // broom tail
  for (let i = 0; i < 6; i++) k += rod(`M-12 ${f(Y(-8))} l${f(-16 + i * 1.6)} ${f(-2 + i * 2.6)}`, i % 2 ? P.straw : P.strawDk, 2, { lw: 1.3, hi: 0 });
  k += twine(-12, Y(-8), 0.3, 7, 2);
  // straw teardrop body in twine bands
  const body = blob([[16, Y(-16)], [8, Y(-24)], [-6, Y(-20)], [-14, Y(-10)], [-8, Y(-2)], [6, Y(-2)], [16, Y(-8)]]);
  k += part(body, P.straw, { sh: 4, rimA: 0.7, tex: Array.from({ length: 12 }, (_, i) => `<path d="M${f(-16 + i * 3)} ${f(Y(-26))} q2 10 ${f(1 + (i % 3))} 24" stroke="${i % 2 ? P.strawDk : mix(P.straw, '#eef0e4', 0.4)}" stroke-width="1.2" fill="none" opacity=".75"/>`).join('') });
  k += twine(-4, Y(-12), 0.15, 18, 2) + twine(8, Y(-13), 0.1, 18, 2);
  // dangling twine with a broken knot
  k += `<path d="${line([[0, Y(-2)], [-3 - gust * 2, Y(8)], [1 + gust * 3, Y(16)]])}" stroke="${P.twine}" stroke-width="1.3" fill="none"/>`;
  // head disc + peg beak
  const hx = 18, hy = Y(-24);
  k += rod(`M${hx + 6} ${f(hy + 1)} L${hx + 17} ${f(hy + 4)}`, '#2a2833', 3.8, { lw: 1.8 });
  const dsc = disc(hx, hy, 8.5, [[hx + 1.5, hy - 1, 3.4, 3.6]]);
  k += dsc;
  k += wing(false);
  b += `<g transform="rotate(${f(tilt)} 0 ${f(Y(-12))})">${k}</g>`;
  const tr = tilt * Math.PI / 180, oy = Y(-12), ex = (hx + 1.5) * Math.cos(tr) - (hy - 1 - oy) * Math.sin(tr), ey = oy + (hx + 1.5) * Math.sin(tr) + (hy - 1 - oy) * Math.cos(tr);
  let e = eye(ex, ey, st.hurt ? 2.8 : 3 + tl, { shape: st.hurt ? 'squint' : tl > 0.3 ? 'wide' : 'round' });
  if (tl > 0) b = `<circle cx="${f(44 + 26 * tl)}" cy="2" r="${f(7 + 4 * tl)}" fill="none" stroke="#ff5a3c" stroke-width="2.4" opacity="${f(0.5 + 0.4 * tl)}"/><path d="M26 ${f(Y(-10))} L${f(44 + 26 * tl)} 2" stroke="#ff5a3c" stroke-width="2" stroke-dasharray="5 5" opacity="${f(0.4 + 0.4 * tl)}"/>` + b;
  return finishB(st, b, e, { w: 50, h: 70, seed: 7, rag: 1, disc: st.die ? `<g transform="translate(${-hx},${f(-hy)})">${dsc}</g>` : '', mx: hx, my: hy });
}

// ============================ BUNDLE CRAWLER (Root Crawler, Wickerkin) ============================
// story: a firewood bundle nobody came back for; the Hollow tied it tighter and taught its loose root ends to walk. signature: a long LOG
// BUNDLE bound by three twine bands, a fringe of many splayed root legs, a moss cap with a thorn crown, a disc face at the front.
// personality: skitters in bursts, all the root legs patter, stops dead, shudders.
export function crawlerB(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, bob = -Math.abs(Math.sin(a * 2)) * 1.2 + tl * 2;
  let b = shadow(44, 0) + specks(0, -1, 34, 3, 10, P.woodDk, { seed: 9, r: 1.8, a: 0.7 });
  // root legs (far row)
  for (let i = 0; i < 6; i++) { const x = -30 + i * 11, ph = a * 2 + i * 1.3, sw = Math.sin(ph) * 3; b += rod(line([[x, -16 + bob], [x - 4 + sw, -8], [x - 7 + sw * 1.4, 0]]), mix(P.woodDk, '#141020', 0.3), 2.8, { lw: 1.6, hi: 0 }); }
  // the bundle: 5 logs stacked
  const logs = [[-10, -38, 1], [-24, -28, 0], [4, -27, 2]];
  for (const [dx, dy, i] of logs) { const y = dy + bob, x0 = -36 + dx * 0.3, x1 = 30 + dx * 0.3, r = 8 - (i % 2) * 1.2; const col = i % 2 ? mix(P.wood, '#141020', 0.12) : P.wood;
    b += part(`M${f(x0)} ${f(y - r)} L${f(x1)} ${f(y - r)} A${f(r * 0.6)} ${f(r)} 0 0 1 ${f(x1)} ${f(y + r)} L${f(x0)} ${f(y + r)} A${f(r * 0.6)} ${f(r)} 0 0 1 ${f(x0)} ${f(y - r)}Z`, col, { lw: 2.2, sh: 3, rim: 1.4, grain: 0.18,
      tex: `<path d="M${f(x0 + 6)} ${f(y - 1)} L${f(x1 - 10)} ${f(y + 1)}" stroke="${P.woodDk}" stroke-width="1" opacity=".7"/>` });
    b += `<ellipse cx="${f(x1)}" cy="${f(y)}" rx="${f(r * 0.6)}" ry="${f(r)}" fill="${mix(P.wood, '#e8ead8', 0.3)}" stroke="${P.woodDk}" stroke-width="1.2"/><ellipse cx="${f(x1)}" cy="${f(y)}" rx="${f(r * 0.3)}" ry="${f(r * 0.5)}" fill="none" stroke="${P.woodDk}" stroke-width=".9"/>`; }
  // three twine bands
  for (const x of [-22, 0, 18]) b += twine(x, -32 + bob, 0, 30, 2);
  // moss cap + thorn crown
  b += part(furry([[-24, -42 + bob], [-10, -50 + bob], [8, -48 + bob], [14, -42 + bob], [-6, -40 + bob]], 2.4, -1, 4, [1, 1, 1, 0, 0], 0.4), P.moss, { lw: 2, sh: 2, grain: 0.2 });
  b += bramble([[-18, -48 + bob], [-10, -56 - tl * 6 + bob], [-2, -52 + bob], [6, -60 - tl * 6 + bob], [10, -50 + bob]], 2.6, 3);
  // near root legs
  for (let i = 0; i < 6; i++) { const x = -26 + i * 11, ph = a * 2 + i * 1.3 + Math.PI, sw = Math.sin(ph) * 3.5, sp = (i - 2.5) * 2.4; b += stick([[x, -18 + bob], [x + sp * 0.5 + sw, -10], [x + sp + sw * 1.5, -3], [x + sp * 1.6 + sw * 1.6, 0]], 4.2, P.woodDk, false); }
  // disc face at the front end
  const hx = 34, hy = -28 + bob;
  const dsc = disc(hx, hy, 10, [[hx + 1, hy - 2, 2.7, 3], [hx + 5.5, hy + 2.5, 2.2, 2.4]], { sx: 0.7 });
  b += dsc;
  let e = eye(hx + 1, hy - 2, 2.2 + tl * 0.7) + eye(hx + 5.5, hy + 2.5, 1.8 + tl * 0.6);
  if (st.hurt) e = eye(hx + 1, hy - 2, 2, { shape: 'squint' }) + eye(hx + 5.5, hy + 2.5, 1.6, { shape: 'squint' });
  if (tl > 0) b = teleRingB(54, tl) + b;
  return finishB(st, b, e, { w: 80, h: 50, seed: 11, disc: st.die ? `<g transform="translate(${-hx},${f(-hy)})">${dsc}</g>` : '', mx: hx, my: hy });
}
