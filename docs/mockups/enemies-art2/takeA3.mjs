// TAKE A "HUSKS" part 3: ranged Quillhog, area-denial Puffback Toad, charger Bramble Hart, miniboss Grey Alpha, Elder Treant hint, chest. Mock-up code only.
import { furry, part, rod, specks, ticks, tick, eye, socket, shadow, glow, mix, blob, line, poly, ell, circ, limb, rng, f, TAU, VOID, BOSS_EYE } from './paint.mjs';
import { PA as P, sock, huskMask, finishA, teleRing, veins, wolfA } from './takeA.mjs';

// ============================ QUILLHOG (ranged, Husk) ============================
// story: a hedgehog that curled up when the Hollow came and never uncurled; its quills turned to bark thorns it now spits. signature: a round
// ball of pale thorn quills with dark tips, a tiny mask face with a short bark tube-snout. personality: bustling waddle, stops, PUFFS, recoils on the shot.
export function spitA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, bob = -Math.abs(Math.sin(a)) * 1.6, puff = 1 + tl * 0.12;
  const FUR = '#4f586f', Q = '#b3b19f', QD = '#6f6c60';
  let b = shadow(30, 0) + `<ellipse cx="0" cy="0" rx="24" ry="5" fill="${P.ink}" opacity=".3"/>`;
  const cx = -2, cy = -24 + bob;
  const feet = (x, ph) => { const sw = Math.sin(ph) * 3 * (1 - tl); return sock(x + sw, -Math.max(0, -Math.cos(ph)) * 2, 4.6, 5); };
  b += feet(-12, a) + feet(8, a + Math.PI);
  // quills: three rows of thorns radiating over the back (left/top), longer + spread on the tell
  const r = rng(17); let back = '', front = '';
  for (let row = 0; row < 3; row++) for (let i = 0; i < 11; i++) {
    const t = (i + row * 0.33) / 10.5, ang = Math.PI * (0.55 + 0.95 * t) + (r() - 0.5) * 0.12, len = (13 + 6 * r() + row * 2) * (1 + tl * 0.35) * puff, rr = 17 - row * 3;
    const bx = cx + Math.cos(ang) * rr, by = cy - Math.sin(ang) * rr * 0.9, tx = cx + Math.cos(ang) * (rr + len), ty = cy - Math.sin(ang) * (rr + len) * 0.9, w = 3.2 - row * 0.4;
    const nx = -Math.sin(ang) * w, ny = -Math.cos(ang) * w;
    const d = `M${f(bx + nx)} ${f(by + ny)} L${f(tx)} ${f(ty)} L${f(bx - nx)} ${f(by - ny)}Z`;
    const s = part(d, row === 2 ? Q : mix(Q, QD, 0.35 - row * 0.12), { lw: 1.5, sh: 1.2, rim: 0.8, grain: 0, tex: `<path d="M${f(bx + (tx - bx) * 0.72)} ${f(by + (ty - by) * 0.72)} L${f(tx)} ${f(ty)}" stroke="${P.ink}" stroke-width="${f(w * 1.4)}"/>` });
    if (row < 2) back += s; else front += s;
  }
  b += back;
  b += part(ell(cx + 2, cy + 2, 21 * puff, 17 * puff), FUR, { sh: 5, tex: ticks([[cx - 8, cy + 6, 7, 2.6, 1.6], [cx + 2, cy + 10, 7, 2.4, 1.6]], mix(FUR, '#0e0a1c', 0.5), 0.5) + `<ellipse cx="${cx}" cy="${f(cy + 16)}" rx="16" ry="4" fill="${P.ink}" opacity=".4" filter="url(#sb2)"/>` });
  b += front;
  // face: small husk mask with a bark tube snout (the spitter)
  const hx = cx + 18 + tl * 2, hy = cy + 4 + tl * 1, M = (x, y) => [hx + x, hy + y];
  const mask = blob([M(-7, -9), M(3, -10), M(9, -5), M(9, 4), M(2, 8), M(-7, 6), M(-9, -1)]);
  const tube = part(blob([M(6, -3), M(17 + tl * 2, -4), M(19 + tl * 2, 0), M(17 + tl * 2, 4), M(6, 4)]), P.mask, { lw: 2, sh: 2, rimA: 1, tex: `<ellipse cx="${f(hx + 18 + tl * 2)}" cy="${f(hy)}" rx="1.6" ry="3" fill="${VOID}"/>` });
  const maskSvg = huskMask(mask, M, { grain: [[[-4, -6], [2, -7], [7, -4]]], lichen: [[-4, 3, 3, 2, 3, 5]] }) + tube + socket(blob([M(-5, -2), M(-1, -6), M(3, -4.5), M(1, -0.5)])) + socket(blob([M(3.5, -4), M(6.5, -6), M(8, -3), M(5.5, -1.5)]));
  b += maskSvg;
  let e = eye(hx - 1, hy - 3.2, 1.9 + tl * 0.6, { shape: 'almond', rot: -22 }) + eye(hx + 5.8, hy - 3.6, 1.4 + tl * 0.5, { shape: 'almond', rot: -22 });
  if (st.hurt) e = eye(hx - 1, hy - 3, 2, { shape: 'squint' }) + eye(hx + 5, hy - 3.5, 1.6, { shape: 'squint' });
  if (tl > 0) b += `<path d="M${f(hx + 22)} ${f(hy)} L${f(hx + 90)} ${f(hy - 4)}" stroke="#ff5a3c" stroke-width="2.4" stroke-dasharray="6 5" opacity="${f(0.45 + 0.45 * tl)}"/>` + glow(hx + 19, hy, 7 * tl + 2, 7 * tl + 2, '#ff5a3c', 0.8);
  return finishA(st, b, e, { w: 50, h: 50, seed: 21, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${maskSvg}</g>` : '', mx: hx, my: hy });
}

// ============================ PUFFBACK TOAD (area denial, Husk) ============================
// story: a pond toad the Hollow filled with spores; the blister on its back is the Hollow ripening. signature: squat wide toad + a HUGE pale
// spore blister on its back + a wide flat husk mask. personality: heavy hop-waddle, the blister breathes; on the tell it swells and the cracks glow.
export function bulbA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, hop = Math.max(0, Math.sin(a)) * 4, br = 1 + Math.sin(a * 2) * 0.03 + tl * 0.32;
  const SK = P.toad, BEL = P.toadBelly, SAC = '#9eac9c', SACD = '#5f6c62';
  let b = shadow(32, 0) + `<ellipse cx="0" cy="0" rx="26" ry="5" fill="${P.ink}" opacity=".3"/>`;
  const y = -hop;
  // back legs (folded big thighs) + front splayed legs
  b += part(ell(-16, -9 + y, 11, 8), mix(SK, '#120d22', 0.25), { sh: 3, rim: 1 }) + sock(-10, 0, 6, 5);
  b += part(blob([[24, -14 + y], [22, -24 + y], [6, -30 + y], [-16, -28 + y], [-26, -18 + y], [-22, -8 + y], [0, -6 + y], [18, -8 + y]]), SK, { sh: 5, tex: specks(0, -20 + y, 18, 7, 12, mix(SK, '#120d22', 0.45), { seed: 7, r: 2.2, a: 0.55 }) + `<path d="M-22 ${f(-10 + y)} Q0 ${f(-2 + y)} 22 ${f(-11 + y)}" stroke="${BEL}" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>` });
  // the spore blister on the back
  const sx = -4, sy = -36 + y, sr = 17 * br;
  b += part(blob([[sx - sr, sy + 8], [sx - sr * 0.9, sy - sr * 0.5], [sx - sr * 0.2, sy - sr * 1.05], [sx + sr * 0.6, sy - sr * 0.85], [sx + sr, sy - sr * 0.1], [sx + sr * 0.8, sy + 8]]), SAC, { sh: 4, gloss: 0.55, rimC: '#eef6f0',
    tex: specks(sx, sy - 4, sr * 0.7, sr * 0.6, 9, SACD, { seed: 3, r: 2.6, a: 0.7 }) + (tl > 0 ? `<path d="M${f(sx - 8)} ${f(sy - 2)} l4 -6 l5 3 l4 -7 M${f(sx + 2)} ${f(sy + 3)} l5 -4 l3 2" stroke="#ff5a3c" stroke-width="${f(1.4 + tl)}" fill="none" opacity="${f(0.5 + 0.5 * tl)}"/>` : veins([[sx - 10, sy + 4], [sx - 4, sy - 4], [sx + 2, sy - 10]], 0.8)) });
  // spore motes leaking
  for (let i = 0; i < 4; i++) b += `<circle cx="${f(sx - 6 + i * 6)}" cy="${f(sy - sr - 4 - i * 3 - Math.sin(a + i) * 2)}" r="${f(1.6 - i * 0.2)}" fill="${SAC}" opacity=".7"/>`;
  b += part(limb(14, -14 + y, 22, -2, 4.6, 4), SK, { lw: 2.3, sh: 2, rim: 1.2 }) + sock(23, 0, 5.4, 5);
  // wide flat husk mask
  const hx = 24, hy = -22 + y, M = (x, y2) => [hx + x, hy + y2];
  const mask = blob([M(-10, -6), M(-6, -11), M(-1, -9), M(4, -12), M(10, -10), M(14, -3), M(12, 4), M(2, 7), M(-8, 5)]);
  const maskSvg = huskMask(mask, M, { grain: [[[-6, -3], [4, -4], [12, -1]]], lichen: [[2, 3, 5, 2, 4, 9]] }) + socket(blob([M(-8, -2), M(-2, -6), M(8, -6.5), M(12, -3), M(8, 0.5), M(-2, 0.5)]));
  b += maskSvg;
  let e = eye(hx - 2, hy - 3, 2.3 + tl * 0.5, { shape: 'almond' }) + eye(hx + 8, hy - 3, 1.9 + tl * 0.4, { shape: 'almond' });
  if (st.hurt) e = eye(hx - 2, hy - 3, 2, { shape: 'squint' }) + eye(hx + 8, hy - 3, 1.7, { shape: 'squint' });
  if (tl > 0) b = teleRing(48, tl) + b;
  return finishA(st, b, e, { w: 50, h: 54, seed: 31, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${maskSvg}</g>` : '', mx: hx, my: hy });
}

// ============================ BRAMBLE HART (charger, Husk) ============================
// story: a stag drained mid-leap; its antlers kept growing, into thorn. signature: ANTLERS twice the size of its head, long deer-skull husk mask,
// slim ink-socked legs, moss rag hanging from a tine. personality: proud and still, then explosive: lowers the antlers, scrapes, charges straight.
export function hartA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2;
  const FUR = '#56607a', DK = '#3a4157', AN = '#86847a', AND = '#5f5d56';
  let b = shadow(40, 0) + `<ellipse cx="0" cy="0" rx="32" ry="5" fill="${P.ink}" opacity=".3"/>`;
  const leg = (x, ph, far, back) => { const sw = Math.sin(ph) * 6 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 5 * (1 - tl); const px = x + sw - (back ? tl * 4 : -tl * 6), py = -lift;
    const kx = px + (back ? -4 : 2), ky = -18 - lift; const d = `M${f(x - 5)} ${f(-38 + bob)} Q${f(kx - 5)} ${f(ky - 6)} ${f(kx - 3)} ${f(ky)} L${f(px - 2.6)} ${f(py - 3)} L${f(px + 2.6)} ${f(py - 3)} L${f(kx + 3)} ${f(ky)} Q${f(kx + 5)} ${f(ky - 8)} ${f(x + 5)} ${f(-38 + bob)}Z`;
    return part(d, far ? DK : FUR, { lw: 2.2, sh: 2, rim: far ? 0 : 1.4 }) + sock(px, py, 3.8, 10); };
  b += leg(16, a + Math.PI, true) + leg(-18, a, true, true);
  const body = furry([[24, -36 + bob], [20, -50 + bob], [0, -52 + bob], [-20, -50 + bob], [-28, -42 + bob], [-24, -32 + bob], [0, -30 + bob]], 2.8, -1, 19, [0, 0, 0, 0, 0, 1, 1], 0.6);
  b += part(body, FUR, { sh: 6, tex: ticks([[-18, -44 + bob, 9, 2.9, 1.8], [-6, -46 + bob, 9, 3.0, 1.8], [6, -45 + bob, 8, 3.0, 1.6]], mix(FUR, '#0e0a1c', 0.5), 0.5) + `<ellipse cx="0" cy="${f(-31 + bob)}" rx="22" ry="5" fill="${P.ink}" opacity=".35" filter="url(#sb2)"/>` });
  b += part(blob([[-26, -48 + bob], [-34, -52 + bob], [-33, -45 + bob], [-27, -43 + bob]]), '#d9dccf', { lw: 2, sh: 1 });
  b += leg(-22, a + Math.PI, false, true) + leg(12, a, false);
  // neck + head: lowered on the tell
  const hx = 30 + tl * 10, hy = -66 + bob + tl * 26, rot = tl * 50;
  b += part(limb(16, -46 + bob, hx - 4, hy + 6, 9, 7), FUR, { sh: 3, tex: ticks([[18, -52 + bob, 8, -1.2, 1.6]], mix(FUR, '#0e0a1c', 0.5), 0.5) });
  let h = '';
  // antlers: two big thorny branches (far darker), each with tines and thorns
  // antlers: near beam sweeps forward-up, far beam back-up; thick base, tines up, thorns; dark bark with pale tips (lyre crown silhouette)
  const antler = (far) => { const c = far ? AND : AN, bx = hx - 3 + (far ? -5 : 0), by = hy - 8, dir = far ? -1 : 1;
    const main = [[bx, by], [bx + dir * 6, by - 12], [bx + dir * 16, by - 22], [bx + dir * 22, by - 36], [bx + dir * 20, by - 50]];
    let s = rod(line(main), c, 6, { lw: 2.4 });
    for (const [i, len, ang] of [[1.3, 14, -1.9], [2.2, 17, -1.6], [3.1, 13, -1.35]]) { const p = main[Math.floor(i)], q = main[Math.ceil(i)], t = i % 1, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, an = dir > 0 ? ang : Math.PI - ang;
      s += rod(`M${f(x)} ${f(y)} q${f(Math.cos(an) * len * 0.3)} ${f(Math.sin(an) * len * 0.6)} ${f(Math.cos(an) * len)} ${f(Math.sin(an) * len)}`, c, 3.8, { lw: 2.1 });
      s += `<circle cx="${f(x + Math.cos(an) * len)}" cy="${f(y + Math.sin(an) * len)}" r="2" fill="#dcdccd"/>`; }
    s += `<circle cx="${f(main[4][0])}" cy="${f(main[4][1])}" r="2.6" fill="#dcdccd"/>`;
    for (let i = 0; i < 5; i++) { const p = main[1 + (i % 3)], sg = i % 2 ? 1 : -1; s += `<path d="M${f(p[0])} ${f(p[1] + 1 - i)} l${f(sg * 6)} ${f(-1.5)} l${f(-sg * 5)} 3Z" fill="#2f283a" stroke="#1c1626" stroke-width=".8"/>`; }
    return s; };
  h += antler(true);
  h += part(ell(hx - 4, hy - 2, 9, 8), FUR, { sh: 3 });
  // ears
  h += part(blob([[hx - 8, hy - 6], [hx - 20, hy - 10], [hx - 10, hy - 2]]), DK, { lw: 2, sh: 1 });
  const M = (x, y) => [hx + x, hy + y];
  const mask = blob([M(-8, -9), M(4, -11), M(16, -6), M(26, 1), M(27, 5), M(20, 7), M(6, 8), M(-6, 5)]);
  const maskSvg = huskMask(mask, M, { tex: `<path d="${line([M(-6, 4), M(10, 8), M(25, 5)])}" stroke="${P.maskDk}" stroke-width="5" fill="none" opacity=".55" filter="url(#sb2)"/>`, grain: [[[0, -6], [12, -3], [24, 2]]], crack: [[2, -10], [4, -6], [3, -3]], lichen: [[10, -2, 5, 2, 4, 4]] })
    + socket(blob([M(-2, -5), M(4, -8), M(9, -5), M(6, -1), M(0, -1)])) + socket(ell(hx + 13, hy - 3, 2.2, 2));
  h += maskSvg + antler(false);
  // moss rag on a tine
  h += part(blob([[hx + 6, hy - 40], [hx + 14, hy - 38], [hx + 12, hy - 26], [hx + 9, hy - 30], [hx + 6, hy - 22], [hx + 4, hy - 32]]), P.moss, { lw: 1.8, sh: 1.5, grain: 0.15 });
  b += `<g transform="rotate(${f(rot)} ${f(hx)} ${f(hy)})">${h}</g>`;
  const R = (x, y) => { const t = rot * Math.PI / 180, dx = x - hx, dy = y - hy; return [hx + dx * Math.cos(t) - dy * Math.sin(t), hy + dx * Math.sin(t) + dy * Math.cos(t)]; };
  const E1 = R(hx + 3.5, hy - 4.5), E2 = R(hx + 13, hy - 3);
  let e = eye(E1[0], E1[1], 2.4 + tl * 0.8, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -12 + rot }) + eye(E2[0], E2[1], 1.7 + tl * 0.5, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -12 + rot });
  if (st.hurt) e = eye(E1[0], E1[1], 2.2, { shape: 'squint' }) + eye(E2[0], E2[1], 1.6, { shape: 'squint' });
  if (tl > 0) b = `<rect x="30" y="-7" width="${f(120 * tl + 30)}" height="14" rx="7" fill="#ff5a3c" opacity="${f(0.12 + 0.1 * tl)}"/><path d="M30 0 L${f(60 + 120 * tl)} 0" stroke="#ff5a3c" stroke-width="2.6" stroke-dasharray="9 6" opacity="${f(0.5 + 0.4 * tl)}"/>` + `<path d="M18 2 q4 -5 9 -2" stroke="#8a8f99" stroke-width="2" fill="none" opacity="${f(tl)}"/>` + b;
  return finishA(st, b, e, { w: 70, h: 110, seed: 41, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${maskSvg}</g>` : '', mx: hx, my: hy });
}

// ============================ GREY ALPHA (miniboss, Husk) ============================
// story: the old leader of the rival pack; its husk is the oldest, cracked and crowned with dead branches; three eyes. signature: wolf x1.7,
// a MANE OF PALE BRANCHES rising from a white scruff, a scarred mask with a third eye. personality: deliberate, commanding; howls to call the pack.
export function alphaA(st = {}) {
  const w = wolfA(st, { fur: '#39415a', dk: '#262c40', ruff: '#b2bccd', eye: BOSS_EYE, eye3: true, mane: true });
  return w;
}

// ============================ ELDER TREANT hint (boss scale, Husk) ============================
// the husk masks come FROM the Elder Treant's bark: its own face is the first and biggest husk, cracked, with a cold hollow chest.
export function treantA(st = {}) {
  const BK = '#5f5f69', BD = '#3d3c46', tl = st.tele || 0;
  let b = shadow(120, 0, 0.5) + `<ellipse cx="0" cy="0" rx="120" ry="18" fill="${P.ink}" opacity=".45"/>`;
  // roots
  for (const [x, dx] of [[-40, -70], [-20, -50], [30, 60], [44, 88], [0, -20]]) b += rod(line([[x, -20], [x + dx * 0.5, -6], [x + dx, 2]]), BD, 10, { lw: 3 });
  // crown (grey, drained), behind
  b += part(furry([[-110, -230], [-80, -290], [-20, -320], [50, -310], [110, -260], [120, -210], [60, -190], [-60, -190]], 12, -1, 51, null, 0.4), '#5d6a6c', { sh: 12, tex: specks(0, -260, 90, 40, 30, '#3f4a4e', { seed: 4, r: 6, a: 0.6 }) + specks(-20, -280, 70, 25, 14, '#8a9a96', { seed: 8, r: 4, a: 0.5 }) });
  // trunk
  const trunk = blob([[-60, -10], [-70, -60], [-56, -140], [-64, -210], [-30, -230], [30, -232], [62, -206], [54, -130], [70, -60], [62, -10]]);
  b += part(trunk, BK, { sh: 14, lw: 4, tex: [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${-50 + i * 17} -14 q${f(6 - i * 2)} -90 ${f(-2 + i)} -210" stroke="${BD}" stroke-width="2.4" fill="none" opacity=".7"/>`).join('') });
  // branches (arms)
  b += rod(line([[-50, -170], [-96, -190], [-130, -176], [-150, -196]]), BK, 14, { lw: 3.4 }) + rod(line([[50, -160], [100, -190], [140, -180], [160, -204]]), BK, 14, { lw: 3.4 });
  // hollow chest cavity (cold)
  b += `<ellipse cx="2" cy="-92" rx="22" ry="30" fill="${VOID}"/>` + glow(2, -92, 26, 34, '#6f86c8', 0.35);
  // the great husk face
  const M = (x, y) => [x, y - 170];
  const mask = blob([M(-40, -26), M(0, -40), M(40, -26), M(46, 6), M(30, 30), M(0, 40), M(-30, 30), M(-46, 6)]);
  b += huskMask(mask, M, { tex: `<path d="${line([M(-30, 20), M(0, 30), M(30, 20)])}" stroke="${P.maskDk}" stroke-width="10" fill="none" opacity=".5" filter="url(#sb2)"/>`, grain: [[[-34, -14], [0, -24], [34, -14]], [[-36, 4], [0, -4], [36, 4]], [[-26, 22], [0, 18], [26, 22]]], crack: [[-6, -38], [0, -24], [-4, -12], [4, 0], [0, 12]], lichen: [[-20, 16, 10, 6, 8, 3], [24, -10, 8, 6, 6, 7]] })
    + socket(blob([M(-26, -8), M(-14, -16), M(-4, -8), M(-10, 2), M(-22, 2)])) + socket(blob([M(26, -8), M(14, -16), M(4, -8), M(10, 2), M(22, 2)]));
  const e = eye(-14, -178, 5.5 + tl, { col: BOSS_EYE, shape: 'almond', rot: 12 }) + eye(14, -178, 5.5 + tl, { col: BOSS_EYE, shape: 'almond', rot: -12 });
  return { b, e };
}

// ============================ CHEST (Husk) ============================
// a bark coffer bound in roots; the reward light leaks warm through the seams and the lantern lock (rewards may be warm; enemies never).
export function chestA(st = {}) {
  const BK = '#6f6b70', BD = '#45414b', open = st.open || 0;
  let b = shadow(30, 0, 0.5) + glow(0, -16, 40, 26, '#ffc45a', 0.45);
  b += part('M-24 -1 L-25 -21 Q-25 -23 -23 -23 L23 -23 Q25 -23 25 -21 L24 -1 Q24 1 22 1 L-22 1 Q-24 1 -24 -1Z', BK, { sh: 4, tex: [0, 1, 2, 3].map((i) => `<path d="M${-18 + i * 12} -3 q2 -9 0 -18" stroke="${BD}" stroke-width="1.4" fill="none" opacity=".8"/>`).join('') });
  b += `<path d="M-25 -21 L25 -21" stroke="#ffcf70" stroke-width="2.4" opacity=".9"/>` + glow(0, -21, 30, 5, '#ffd27a', 0.7);
  b += `<g transform="rotate(${f(-open * 30)} -24 -22)">` + part('M-26 -21 Q-26 -36 0 -38 Q26 -36 26 -21Z', BK, { sh: 4, tex: `<path d="M-20 -30 Q0 -36 20 -30" stroke="${BD}" stroke-width="1.4" fill="none"/>` + specks(-10, -30, 8, 3, 4, P.lichen, { seed: 3, r: 2, a: 0.8 }) }) + '</g>';
  // root bands
  for (const x of [-15, 15]) b += rod(line([[x - 2, -1], [x, -12], [x - 1, -24], [x + 1, -35]]), P.barkDk, 4, { lw: 2 });
  // lantern lock
  b += part(blob([[-6, -26], [-6, -14], [6, -14], [6, -26]]), '#c9a25a', { lw: 2, sh: 1.5, rimC: '#fff0c0' }) + `<rect x="-3.6" y="-23.5" width="7.2" height="7" rx="2" fill="#ffe08a"/>` + glow(0, -20, 12, 12, '#ffd27a', 0.9);
  return { b, e: '' };
}
