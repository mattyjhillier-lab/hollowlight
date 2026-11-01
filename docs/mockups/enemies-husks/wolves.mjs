// HUSKS options: (1) Fell Wolf A/B/C and (7) Grey Alpha A/B/C. Mock-up drawing code only (not game code).
// Each fn(st) -> { b: body svg, e: eye svg }. st = { ph walk phase 0..1, tele 0..1, hurt, die 0..1 }. Origin feet, facing +x.
import { K, P, S, locks, sock, husk, knotSocket, strap, sprout, moss, thorn, lichen, finish, tLunge, tLane, tRing, furry, blob, line, ell, circ, limb, eye, shadow, glow, mix, rng, specks, f, TAU, VOID, BOSS_EYE } from './kit.mjs';

// ---------- shared chibi quadruped wolf rig (the options change mask, ears, coat, tail and extras, not just colour) ----------
export function wolfRig(st, C) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2.6, cr = tl * 6; // crouch
  const FUR = C.fur, DK = C.dk, TK = mix(FUR, '#0e0a1c', 0.5), HI = mix(FUR, '#e6eef8', 0.42);
  let b = shadow(44 * (C.sc || 1), 2) + `<ellipse cx="2" cy="0" rx="${f(36 * (C.sc || 1))}" ry="6" fill="${K.ink}" opacity=".32"/>`;
  if (tl > 0) b = tLunge(54, 104 + 50 * tl, tl) + b;
  const by = -27 + bob + cr * 0.5, hx = 26 - tl * 2 + (C.hx || 0), hy = -46 + bob * 0.7 + cr * 1.3 + (C.hy || 0);
  // tail
  b += C.tail(a, tl, bob, s1);
  // far legs
  // legs = one stroked path each (no internal seams): front legs straight columns, back legs with a hock bend; drawn under the body
  const leg = (x, ph, far, back, w = 9) => { const sw = Math.sin(ph) * 6 * (1 - tl * 0.8), lift = Math.max(0, -Math.cos(ph)) * 4.5 * (1 - tl), px = x + sw - tl * 3 + (back ? -3 : 0), py = -lift;
    const col = far ? DK : FUR, pts = back ? [[x, by + 2], [x - 3 + sw * 0.4, by + 12], [px + 2, -13 - lift * 0.5], [px, py - 4]] : [[x, by + 2], [x + sw * 0.5, by + 14], [px, py - 4]];
    return S(line(pts), col, w, { lw: 2.6 }) + (far ? '' : `<path d="${line(pts)}" stroke="${mix(col, '#0e0a1c', 0.45)}" stroke-width="${f(w * 0.35)}" fill="none" stroke-linecap="round" transform="translate(${f(w * 0.25)},0)" opacity=".5"/>`) + sock(px, py, 4.6, C.sockH ?? 8); };
  b += leg(12, a + Math.PI, true, false) + leg(-20, a, true, true) + leg(-16, a + Math.PI, false, true, 10) + leg(16, a, false, false);
  // body bean
  const body = furry([[20, by + 11], [25, by - 1], [14, by - 13], [-6, by - 13], [-24, by - 9], [-31, by + 1], [-26, by + 10], [-12, by + 7], [4, by + 9]], 3.6, -1, C.seed || 5, [0, 1, 1, 1, 1, 0, 0, 1, 1], 0.6);
  b += P(body, FUR, { sh: 7, rim: 3.4, rimA: 1, tex: `<ellipse cx="-4" cy="${f(by + 11)}" rx="28" ry="5" fill="${K.ink}" opacity=".45" filter="url(#sb2)"/>`
    + locks([[-22, by - 2, 11, 2.9], [-11, by - 6, 12, 3.0], [0, by - 8, 11, 3.05], [-16, by + 6, 10, 2.7], [-4, by + 4, 10, 2.8]], TK, 0.55)
    + locks([[-18, by - 10, 10, 3.1, 2], [-4, by - 12, 10, 3.15, 2]], HI, 0.5) + (C.bodyTex ? C.bodyTex(by) : '')
    + `<path d="M-30 ${f(by + 10)} Q-30 ${f(by - 8)} -14 ${f(by - 6)}" stroke="${HI}" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/>`
    + `<path d="${line([[-26, by + 12], [-21, by + 5], [-24, by - 1]])}" stroke="${K.ink}" stroke-width="1.8" fill="none" opacity=".75" stroke-linecap="round"/>` });
  if (C.back) b += C.back(by, tl, a);
  // ruff / chest
  b += C.ruff(hx, hy, tl, a);
  // head
  b += C.head(hx, hy, tl, a, s1);
  const m = C.mask(hx, hy, tl, a);
  b += m.svg;
  let e = m.eyes(tl, st.hurt, C.ec);
  if (C.over) b += C.over(hx, hy, tl, a, m);
  return finish(st, b, e, { w: 80 * (C.sc || 1), h: 66 * (C.sc || 1), seed: C.seed || 3, mask: st.die ? `<g transform="translate(${f(-m.cx)},${f(-m.cy)})">${m.svg}</g>` : '', mx: m.cx, my: m.cy, elite: C.elite });
}
export const ears = (hx, hy, tl, a, C, o = {}) => { const flop = Math.sin(a + 0.8) * 2.5, fl = tl * 7; let s = '';
  // far ear (behind), near ear (front); o.torn tears the near ear; ears flatten back on the tell
  s += P(blob([[hx - 12, hy - 8], [hx - 19 - fl, hy - 26 + fl * 0.6], [hx - 14 - fl * 1.2, hy - 34 + fl * 1.4], [hx - 6, hy - 22], [hx - 3, hy - 12]]), C.dk, { lw: 2.6, sh: 3, rim: 1.2 });
  const tip = o.torn ? [[hx + 2 - fl, hy - 31 + fl], [hx + 6 - fl, hy - 27 + fl], [hx + 9 + flop - fl, hy - 30 + fl]] : [[hx + 3 - fl, hy - 36 + fl * 1.4]];
  s += P(blob([[hx - 6, hy - 14], [hx - 7, hy - 26 + fl * 0.5], ...tip, [hx + 9, hy - 22], [hx + 6, hy - 13]]), C.fur, { lw: 2.6, sh: 3, tex: `<path d="M${f(hx - 2)} ${f(hy - 28 + fl)} Q${f(hx + 1)} ${f(hy - 22)} ${f(hx + 1)} ${f(hy - 16)}" stroke="${mix(C.fur, '#0e0a1c', 0.55)}" stroke-width="4" fill="none" stroke-linecap="round"/>` });
  return s; };

// =============================== 1. FELL WOLF ===============================
// A (recommended) SPLITSNOUT: the classic Husk wolf. Long pale bark snout-husk held LOW whose tip has split like a snapped branch (two splinters),
// root straps grip behind the ears, frosted scruff, one torn ear, a heavy ink-dipped plume tail. Hungry slinker; hackles + head drop on the tell.
export function wolfA(st = {}) {
  const C = { fur: K.fur, dk: K.furDk, seed: 5,
    tail: (a, tl, bob, s1) => { const tw = s1 * 3 - tl * 10, y = bob;
      const d = furry([[-24, -36 + y], [-36, -46 + y + tw * 0.2], [-50, -54 + tw * 0.6], [-62, -48 + tw], [-62, -34 + tw * 0.8], [-52, -32 + tw * 0.5], [-40, -30 + y], [-28, -26 + y]], 3.6, -1, 12, [1, 1, 1, 1, 0, 0, 0, 0], 0.7);
      return P(d, K.fur, { sh: 4, tex: `<path d="M-90 ${f(-70 + tw)} Q-60 ${f(-50 + tw)} -54 ${f(-26 + tw)} L-90 -10Z" fill="${K.ink}" opacity=".93" filter="url(#sb2)"/>` + locks([[-32, -40 + y, 10, 3.6], [-44, -46 + y, 10, 3.8], [-50, -40 + tw * 0.6, 9, 4.1]], mix(K.fur, '#0e0a1c', 0.5), 0.6) + locks([[-30, -44 + y, 9, 3.5, 1.8], [-42, -50 + y, 8, 3.7, 1.8]], K.furHi, 0.5) })
        + (tl < 0.5 ? `<path d="M-61 ${f(-34 + tw)} q-1 6 0.6 10" stroke="${K.ink}" stroke-width="2.8" stroke-linecap="round" fill="none"/><ellipse cx="-60" cy="${f(-22 + tw)}" rx="1.8" ry="2.2" fill="${K.ink}"/>` : ''); },
    back: (by, tl) => { let s = ''; const hk = 1 + tl * 1.6; // hackles: ash spikes along the spine that rise on the tell
      for (let i = 0; i < 4; i++) { const x = 8 - i * 9, y = by - 13 + i * 1.2, h = (5 + (i === 1 ? 3 : 0)) * hk; s += P(`M${f(x - 6)} ${f(y + 3)} Q${f(x - 2)} ${f(y - h * 0.5)} ${f(x - 8 - tl * 3)} ${f(y - h)} Q${f(x + 3)} ${f(y - h * 0.4)} ${f(x + 3)} ${f(y + 3)}Z`, K.ruff, { lw: 2.2, sh: 2, grain: 0, rimA: 0.9 }); }
      return s; },
    ruff: (hx, hy) => P(furry([[hx - 30, hy + 2], [hx - 24, hy - 8], [hx - 12, hy - 4], [hx + 2, hy + 8], [hx + 4, hy + 20], [hx - 8, hy + 27], [hx - 24, hy + 20]], 4.4, -1, 21, null, 0.5), K.ruff, { sh: 4, rimA: 0.9,
      tex: locks([[hx - 24, hy, 10, 1.0], [hx - 19, hy + 9, 10, 1.3], [hx - 14, hy + 16, 9, 1.6], [hx - 12, hy - 6, 9, 0.9]], mix(K.ruff, '#150f28', 0.5), 0.5) + specks(hx - 16, hy + 4, 12, 14, 8, '#f4f8fd', { seed: 4, r: 1.3, a: 0.65 }) }),
    head: (hx, hy, tl, a) => ears(hx, hy, tl, a, { fur: K.fur, dk: K.furDk }, { torn: 1 }) + P(ell(hx - 2, hy - 2, 21, 19), K.fur, { sh: 6, tex: locks([[hx - 14, hy - 8, 9, 2.6], [hx - 10, hy + 4, 8, 2.4], [hx - 4, hy - 14, 8, 2.9, 2]], mix(K.fur, '#0e0a1c', 0.5), 0.5) + locks([[hx - 8, hy - 16, 8, 3.2, 1.8]], K.furHi, 0.5) }),
    mask: (hx, hy, tl) => {
      const M = (x, y) => [hx + x, hy + y + tl * 2];
      // root straps behind (drawn first so the mask sits on them)
      let s = strap([M(-6, -14), M(-14, -12), M(-20, -4), M(-17, 6)], 3.4, { seed: 3 }) + strap([M(-2, 10), M(-12, 13), M(-20, 10)], 2.6, { seed: 6, out: 1.4 });
      const d = blob([M(-8, -15), M(2, -19), M(13, -17), M(24, -11), M(35, -5), M(44, -2), M(49, 0), M(45, 3), M(48, 6), M(41, 7), M(30, 9), M(16, 12), M(2, 12), M(-7, 8), M(-11, -1), M(-10, -9)]);
      s += husk(d, M, { grain: [[[-4, -12], [12, -11], [30, -5], [44, -1]], [[-2, 2], [14, 3], [30, 4], [42, 4]], [[2, 8], [16, 9], [28, 8]]], crack: [[38, 1], [42, 3], [45, 1]], knot: [[26, -7, 1.8]], lichen: [[6, -14, 3.6], [33, 7, 2.4]], chip: [[-10, -9, 4, 3.6], [-11, 2, 4, 3.0]], under: [[-6, 9], [16, 12], [40, 7]], hi: [[0, -16], [14, -14], [30, -8]] });
      s += sprout(...M(4, -18), -2.1, 0.8);
      s += knotSocket(blob([M(2, -9), M(8, -13), M(15, -10), M(13, -4), M(5, -3)])) + knotSocket(blob([M(18, -8), M(23, -9), M(26, -5), M(21, -3)]), 1.6);
      const E1 = M(8.5, -7.6), E2 = M(22, -6);
      return { svg: s, cx: hx + 18, cy: hy - 2, eyes: (tl, hurt, ec) => hurt ? eye(...E1, 2.5, { col: ec, shape: 'squint' }) + eye(...E2, 1.8, { col: ec, shape: 'squint' }) : eye(...E1, 2.7 + tl, { col: ec, shape: tl > 0.3 ? 'slit' : 'almond', rot: -14 }) + eye(...E2, 1.9 + tl * 0.7, { col: ec, shape: tl > 0.3 ? 'slit' : 'almond', rot: -16 }) };
    } };
  return wolfRig(st, C);
}

// B SLABFACE: a shaggy, heavier wolf whose husk is a FLAT bark PLANK over the whole face (a slab of grey bark with a horizontal split
// as its only eye-slit); thick shag mane, stubby round ears, a short brushy tail. Silhouette hook: a square face-board. Stubborn trudge.
export function wolfB(st = {}) {
  const FUR = '#46526a', DK = '#2c3348';
  const C = { fur: FUR, dk: DK, seed: 8,
    tail: (a, tl, bob, s1) => { const tw = s1 * 4 - tl * 6; return P(furry([[-26, -34 + bob], [-40, -38 + tw * 0.4], [-50, -30 + tw], [-46, -20 + tw], [-36, -22 + tw * 0.5], [-26, -24 + bob]], 3.4, -1, 14, [1, 1, 1, 1, 0, 0], 0.7), FUR, { sh: 3, tex: `<path d="M-60 ${f(-40 + tw)} L-44 ${f(-36 + tw)} L-40 ${f(-14 + tw)} L-60 -10Z" fill="${K.ink}" opacity=".9" filter="url(#sb2)"/>` }); },
    bodyTex: (by) => specks(-6, by - 4, 18, 6, 8, K.lichen, { seed: 5, r: 1.8, a: 0.5 }),
    back: (by, tl) => { let s = ''; for (let i = 0; i < 6; i++) { const x = 10 - i * 7.4, y = by - 12 + Math.abs(i - 2) * 0.8, h = 9 + (i % 2) * 3 + tl * 6; s += P(`M${f(x - 5)} ${f(y + 4)} Q${f(x - 1)} ${f(y - h * 0.6)} ${f(x - 7)} ${f(y - h)} Q${f(x + 4)} ${f(y - h * 0.5)} ${f(x + 4)} ${f(y + 4)}Z`, i % 2 ? DK : FUR, { lw: 2.2, sh: 2, rim: 1.2, grain: 0 }); } return s; },
    ruff: (hx, hy, tl) => P(furry([[hx - 30, hy + 2], [hx - 26, hy - 16], [hx - 10, hy - 22], [hx + 2, hy - 10], [hx + 4, hy + 16], [hx - 8, hy + 26], [hx - 26, hy + 20]], 5.2, -1, 23, null, 0.4), mix(FUR, '#8a96ad', 0.35), { sh: 4,
      tex: locks([[hx - 22, hy - 4, 12, 1.3], [hx - 16, hy + 8, 12, 1.5], [hx - 8, hy + 16, 10, 1.6], [hx - 10, hy - 12, 10, 1.1]], mix(FUR, '#0e0a1c', 0.5), 0.55) + moss(hx - 14, hy + 14, 10, 8, 3) }),
    head: (hx, hy, tl, a) => { const fl = tl * 5; return P(circ(hx - 14, hy - 17 + fl * 0.5, 6), DK, { lw: 2.4, sh: 2 }) + P(ell(hx - 2, hy - 2, 18, 17), FUR, { sh: 6 }) + P(circ(hx + 4, hy - 19 + fl * 0.6, 6.4), FUR, { lw: 2.4, sh: 2, tex: `<circle cx="${f(hx + 4)}" cy="${f(hy - 19 + fl * 0.6)}" r="3" fill="${DK}"/>` }); },
    mask: (hx, hy, tl) => {
      const M = (x, y) => [hx + x, hy + y + tl * 3];
      let s = strap([M(-4, -14), M(-12, -18), M(-18, -12)], 3, { seed: 4 }) + strap([M(0, 14), M(-10, 18), M(-18, 14)], 2.8, { seed: 7, out: 1.4 });
      const d = blob([M(-2, -15), M(10, -18), M(22, -16), M(27, -12), M(28, 0), M(27, 12), M(18, 15), M(4, 16), M(-2, 12), M(-4, 0)]);
      s += husk(d, M, { grain: [[[2, -11], [12, -13], [24, -10]], [[3, 6], [14, 7], [25, 5]], [[4, 11], [16, 12], [24, 10]]], knot: [[8, 8, 2.2]], lichen: [[22, -12, 3.8], [6, 12, 2.6]], chip: [[27, 3, 4, 0], [-3, 6, 4, 3.0]], under: [[0, 13], [14, 15], [26, 12]], hi: [[2, -14], [14, -16], [24, -13]] });
      s += `<path d="${line([M(-1, -3), M(8, -6), M(16, -4), M(25, -6)])}" stroke="${K.barkDk}" stroke-width="7.5" fill="none" stroke-linecap="round" opacity=".8"/>` + knotSocket(blob([M(0, -3), M(8, -7.5), M(17, -5), M(25, -7.5), M(25, -3.5), M(16, -1), M(8, -2)]), 1.4);
      const E1 = M(7, -4.4), E2 = M(19, -4.6);
      return { svg: s, cx: hx + 12, cy: hy, eyes: (tl, hurt, ec) => hurt ? eye(...E1, 2.3, { col: ec, shape: 'squint' }) + eye(...E2, 2, { col: ec, shape: 'squint' }) : eye(...E1, 2.4 + tl, { col: ec, shape: 'slit', rot: -6 }) + eye(...E2, 2.1 + tl * 0.8, { col: ec, shape: 'slit', rot: -10 }) };
    } };
  return wolfRig(st, C);
}

// C RINGHUSK: a lean, long-legged hungry wolf whose husk is a cross-cut BARK RIND worn sideways: a half-ring of bark with growth rings showing
// on its cut face, so the face is a rough crescent; eyes sit in the dark heartwood. Twig-thin tail. Silhouette hook: crescent face + high ears.
export function wolfC(st = {}) {
  const FUR = '#505c78', DK = '#323a52';
  const C = { fur: FUR, dk: DK, seed: 11, sockH: 12,
    tail: (a, tl, bob, s1) => { const tw = s1 * 4 - tl * 8; return S(line([[-26, -34 + bob], [-40, -42 + tw * 0.3], [-52, -40 + tw], [-60, -46 + tw]]), FUR, 5, { lw: 2.6 }) + P(furry([[-50, -38 + tw], [-56, -50 + tw], [-66, -50 + tw], [-66, -40 + tw]], 2.6, -1, 4), K.ink, { lw: 2, sh: 2, rimC: K.inkRim }); },
    bodyTex: (by) => `<path d="M-20 ${f(by + 2)} q4 -4 8 0 M-12 ${f(by + 4)} q4 -4 8 0 M-4 ${f(by + 5)} q4 -4 8 0" stroke="${mix(FUR, '#0e0a1c', 0.55)}" stroke-width="2" fill="none" opacity=".7"/>`,
    back: (by, tl) => tl > 0 ? [0, 1, 2].map((i) => thorn(4 - i * 10, by - 13, -1.9 - i * 0.1, 7 + tl * 5, 2.4, '#8e9cb9')).join('') : '',
    ruff: (hx, hy) => P(furry([[hx - 26, hy + 4], [hx - 22, hy - 8], [hx - 10, hy - 10], [hx - 4, hy + 6], [hx - 10, hy + 18], [hx - 22, hy + 16]], 3.4, -1, 25, null, 0.6), mix(FUR, '#a9b6cc', 0.45), { sh: 3 }),
    head: (hx, hy, tl, a) => { const fl = tl * 8; return P(blob([[hx - 10, hy - 10], [hx - 16 - fl, hy - 34 + fl], [hx - 4, hy - 16]]), DK, { lw: 2.4, sh: 2 }) + P(ell(hx - 2, hy - 1, 17, 16), FUR, { sh: 5 }) + P(blob([[hx - 4, hy - 14], [hx + 2 - fl, hy - 40 + fl * 1.2], [hx + 8, hy - 14]]), FUR, { lw: 2.4, sh: 2, tex: `<path d="M${f(hx + 1)} ${f(hy - 34 + fl)} L${f(hx + 2)} ${f(hy - 18)}" stroke="${DK}" stroke-width="3"/>` }); },
    mask: (hx, hy, tl) => {
      const M = (x, y) => [hx + x, hy + y + tl * 2];
      let s = strap([M(-6, -10), M(-14, -6), M(-16, 4)], 3, { seed: 5 });
      // crescent rind: outer bark arc + the pale cut face with rings
      const d = blob([M(-4, -14), M(10, -16), M(24, -12), M(34, -4), M(37, 4), M(30, 6), M(22, 1), M(12, -1), M(4, 2), M(0, 10), M(-6, 6), M(-8, -4)]);
      s += husk(d, M, { col: '#c4c0aa', grain: [[[0, -10], [12, -12], [26, -8], [34, 0]]], lichen: [[-2, 4, 3]], chip: [[36, 4, 4, 0.4]], hi: [[2, -13], [16, -13], [28, -7]] });
      // cut face growth rings (the hook)
      s += [0, 1, 2].map((i) => `<path d="${line([M(2 + i * 2, -6 + i * 1.5), M(14, -9 + i * 2.2), M(28, -4 + i * 1.6)])}" stroke="${K.barkDk}" stroke-width="1.1" fill="none" opacity=".75"/>`).join('');
      s += knotSocket(blob([M(4, -1), M(10, -6), M(17, -4), M(14, 1), M(7, 3)])) + knotSocket(blob([M(20, -2), M(26, -3), M(28, 1), M(23, 2)]), 1.5);
      // bare dark heartwood under the crescent (void jaw area, no mouth)
      const E1 = M(10.5, -1.5), E2 = M(24, -0.6);
      return { svg: s, cx: hx + 14, cy: hy - 2, eyes: (tl, hurt, ec) => hurt ? eye(...E1, 2.4, { col: ec, shape: 'squint' }) + eye(...E2, 1.7, { col: ec, shape: 'squint' }) : eye(...E1, 2.5 + tl, { col: ec, shape: tl > 0.3 ? 'slit' : 'round' }) + eye(...E2, 1.7 + tl * 0.7, { col: ec, shape: tl > 0.3 ? 'slit' : 'round' }) };
    } };
  return wolfRig(st, C);
}
