// HUSKS batch 1 creatures (LOCKED picks, docs/LOCKED.md 2026-10-18): Fell Wolf A Splitsnout (EN0/EN1); Grave Crow + Root Crawler follow in EN2.
// Ported 1:1 from the locked mock-up rigs (docs/mockups/enemies-husks/wolves.mjs, birds.mjs, crawlers.mjs). Each fn(st) -> { b: body svg, e: eye svg }.
// st = { ph walk phase 0..1, tele 0..1, hurt, noMask }. Origin = ground under the feet, facing +x, y up negative, design units (du).
// Game changes vs the mock-up: no telegraph decals (the game draws the lunge lane above the vignette), noMask (death body) and eye anchors
// recorded by paint.eye() (the night layer draws the eyes; frames carry empty sockets).
import { K, P, S, locks, sock, husk, knotSocket, strap, sprout, moss, thorn, lichen, finish, furry, blob, line, ell, circ, limb, eye, shadow, glow, mix, rng, specks, f, TAU, VOID, BOSS_EYE } from './kit.js';

// EN1: the FREED face shown for a moment on death after the mask falls off (game addition; the mock-up only showed wisps): a soft pale muzzle,
// a small nose and one peacefully CLOSED eye (a gentle arc, not a mouth/brow), so the beat reads as 'the animal is freed'. muzzle 0 = birds.
function freedFace(x, y, muzzle, fur) {
  let s = '';
  const L = muzzle > 1 ? 9 * (muzzle - 1) : 0; // longer snout for the wolf
  if (muzzle) s += P(ell(x + 6 + L * 0.5, y + 3, 11 + L * 0.5, 7), mix(fur, '#dfe6f0', 0.55), { lw: 2, sh: 2, rim: 1, grain: 0 }) + `<ellipse cx="${f(x + 15.5 + L)}" cy="${f(y + 1)}" rx="3" ry="2.3" fill="#1d1a26"/>`;
  s += `<path d="M${f(x - 7)} ${f(y - 7)} q4 3.2 8 0" stroke="#1d1a26" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  return s;
}

// ---------- shared chibi quadruped wolf rig (the options change mask, ears, coat, tail and extras, not just colour) ----------
export function wolfRig(st, C) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2.6, cr = tl * 6; // crouch
  const FUR = C.fur, DK = C.dk, TK = mix(FUR, '#0e0a1c', 0.5), HI = mix(FUR, '#e6eef8', 0.42);
  let b = shadow(44 * (C.sc || 1), 2) + `<ellipse cx="2" cy="0" rx="${f(36 * (C.sc || 1))}" ry="6" fill="${K.ink}" opacity=".32"/>`;
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
  if (st.maskOnly) return { b: `<g transform="translate(${f(-m.cx)},${f(-m.cy)})">${m.svg}</g>`, e: '' };
  if (!st.noMask) b += m.svg;
  else b += freedFace(hx + 12, hy + 2, 2, C.fur);
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
