// HUSKS options: (7) GREY ALPHA miniboss A/B/C. Mock-up drawing code only (not game code).
// Scale rule for every later miniboss: the normal enemy x1.7 + ONE crown feature + a THIRD socket, amber boss eyes #ffb84a, always fully lit,
// pale cool outline in the build, sprout + flower on death (elite). Uses the Fell Wolf rig so the "big special version" reads instantly.
import { K, P, S, locks, husk, knotSocket, strap, sprout, moss, furry, blob, ell, eye, mix, specks, f, VOID, BOSS_EYE } from './kit.mjs';
import { wolfRig, ears } from './wolves.mjs';

const AF = '#3c4562', AD = '#272d43';
const eyes3 = (E1, E2, E3, o = {}) => (tl, hurt, ec) => hurt ? eye(...E1, 2.6, { col: ec, shape: 'squint' }) + eye(...E2, 1.9, { col: ec, shape: 'squint' })
  : eye(...E1, 2.9 + tl, { col: ec, shape: tl > 0.3 ? 'slit' : 'almond', rot: o.r1 ?? -14 }) + eye(...E2, 2.1 + tl * 0.7, { col: ec, shape: tl > 0.3 ? 'slit' : 'almond', rot: o.r2 ?? -16 }) + eye(...E3, 1.7 + tl * 0.5, { col: ec });

// A (recommended) BRANCH-MANE: the oldest husk, cracked right across, with a THIRD socket; a mane of pale dead BRANCHES rises from a frosted
// scruff, a moss beard hangs under the mask, an old scar splits one ear. Deliberate, commanding: on the howl the mane rattles up and spreads.
export function alphaA(st = {}) {
  const C = { fur: AF, dk: AD, seed: 15, ec: BOSS_EYE, elite: 1, hy: -2, sc: 1,
    tail: (a, tl, bob, s1) => { const tw = s1 * 2 - tl * 6; return P(furry([[-24, -36 + bob], [-38, -50 + tw * 0.3], [-56, -56 + tw], [-66, -44 + tw], [-60, -30 + tw], [-44, -30 + bob], [-28, -26 + bob]], 3.8, -1, 13, [1, 1, 1, 1, 0, 0, 0], 0.7), AF, { sh: 4, rim: 3, tex: `<path d="M-90 ${f(-74 + tw)} Q-62 ${f(-56 + tw)} -58 ${f(-26 + tw)} L-90 -10Z" fill="${K.ink}" opacity=".9" filter="url(#sb2)"/>` }); },
    back: (by, tl) => { let s = '';
      for (const [x0, ang, len, w] of [[-20, -2.45, 20, 3.2], [-14, -2.2, 26, 3.6], [-6, -1.95, 34, 4], [2, -1.7, 40, 4.4], [10, -1.45, 36, 4.2], [16, -1.25, 26, 3.6]]) {
        const y = by - 10, L = len * (1 + tl * 0.3), A = ang - tl * 0.12, x2 = x0 + Math.cos(A) * L, y2 = y + Math.sin(A) * L, mx = (x0 + x2) / 2, my = (y + y2) / 2;
        s += S(`M${f(x0)} ${f(y)} Q${f(mx - 4)} ${f(my + 2)} ${f(x2)} ${f(y2)} M${f(mx - 1)} ${f(my)} l-8 -5 M${f(mx + (x2 - mx) * 0.5)} ${f(my + (y2 - my) * 0.5)} l6 -6`, '#cfcbbb', w, { lw: 2.4 }) + `<circle cx="${f(x2)}" cy="${f(y2)}" r="${f(w * 0.45)}" fill="#efe9da"/>`; }
      return s; },
    ruff: (hx, hy) => P(furry([[hx - 34, hy + 2], [hx - 28, hy - 14], [hx - 12, hy - 10], [hx + 2, hy + 8], [hx + 4, hy + 22], [hx - 8, hy + 30], [hx - 28, hy + 22]], 4.8, -1, 27, null, 0.5), '#b9c3d6', { sh: 4, rimA: 1, tex: locks([[hx - 26, hy + 2, 11, 1.1], [hx - 18, hy + 12, 11, 1.4], [hx - 10, hy + 20, 10, 1.6]], '#6e7a92', 0.55) + specks(hx - 16, hy + 8, 14, 14, 9, '#f6f9fd', { seed: 6, r: 1.4, a: 0.7 }) }),
    head: (hx, hy, tl, a) => ears(hx, hy, tl, a, { fur: AF, dk: AD }, { torn: 1 }) + P(ell(hx - 2, hy - 2, 22, 20), AF, { sh: 6 }) + `<path d="M${f(hx - 6)} ${f(hy - 30)} l4 8 l-3 5" stroke="${VOID}" stroke-width="1.6" fill="none"/>`,
    mask: (hx, hy, tl) => {
      const M = (x, y) => [hx + x * 1.06, hy + y * 1.06 + tl * 2];
      let s = strap([M(-6, -14), M(-14, -12), M(-20, -4), M(-17, 6)], 3.8, { seed: 3 }) + strap([M(-2, 10), M(-12, 13), M(-20, 10)], 3, { seed: 6, out: 1.4 });
      const d = blob([M(-8, -17), M(2, -21), M(13, -19), M(24, -12), M(35, -6), M(44, -2), M(49, 1), M(46, 4), M(48, 7), M(40, 8), M(30, 10), M(16, 13), M(2, 13), M(-7, 9), M(-11, -1), M(-10, -10)]);
      s += moss(...M(18, 11), 22, 13, 7);
      s += husk(d, M, { col: '#d0ccb8', grain: [[[-4, -13], [12, -12], [30, -6], [44, -1]], [[-2, 2], [14, 3], [30, 4], [42, 5]], [[2, 9], [16, 10], [28, 9]]], crack: [[-2, -20], [3, -12], [0, -6], [6, 2], [4, 10]], lichen: [[10, -15, 4], [34, 7, 3], [-6, 4, 3]], chip: [[-10, -10, 4, 3.6], [-11, 2, 4, 3.0], [48, 6, 3, 0.3]], under: [[-6, 10], [16, 13], [40, 8]], hi: [[0, -18], [14, -15], [30, -9]] });
      s += sprout(...M(2, -20), -2.0, 1, { two: 1 });
      s += knotSocket(blob([M(2, -9), M(8, -13), M(15, -10), M(13, -4), M(5, -3)])) + knotSocket(blob([M(18, -8), M(23, -9), M(26, -5), M(21, -3)]), 1.6) + knotSocket(blob([M(9, -17), M(13, -19), M(16, -16), M(12, -14)]), 1.4);
      return { svg: s, cx: hx + 18, cy: hy - 2, eyes: eyes3(M(8.5, -7.6), M(22, -6), M(12.5, -16.5)) };
    } };
  return wolfRig(st, C);
}

// a dead, COLD iron lantern cage (a trophy: never lit on an enemy)
export const lantern = (x, y, s = 1) => `<g transform="translate(${f(x)},${f(y)}) scale(${s})">` + P('M-5 -8 L5 -8 L6 6 L-6 6Z', '#4b4f5c', { lw: 1.8, sh: 1.5, rim: 1, grain: 0, tex: `<rect x="-4" y="-6" width="8" height="10" fill="#1d1f2a" opacity=".6"/><path d="M-2 -7 L-2 5 M2 -7 L2 5" stroke="#262833" stroke-width="1.4"/>` }) + P('M-6.5 -8 L0 -13 L6.5 -8Z', '#5a5f6d', { lw: 1.6, sh: 1, rim: 0.8, grain: 0 }) + `<circle cx="0" cy="-14.5" r="1.6" fill="none" stroke="#2c2e38" stroke-width="1.2"/></g>`;

// B LANTERN THIEF: the alpha that put out the lamplighters' lanterns and wears them: three dead, COLD iron lantern cages hang from its scruff on
// root cords (stolen light: no glow), a crown of three bark tines on the mask, a third socket. On death each cage cracks and a warm spark escapes.
export function alphaB(st = {}) {
  const FU = '#414a66';
  const C = { fur: FU, dk: AD, seed: 17, ec: BOSS_EYE, elite: 1,
    tail: (a, tl, bob, s1) => { const tw = s1 * 3 - tl * 6; return P(furry([[-24, -36 + bob], [-40, -44 + tw * 0.3], [-56, -44 + tw], [-62, -32 + tw], [-50, -26 + tw], [-28, -26 + bob]], 3.6, -1, 16, [1, 1, 1, 1, 0, 0], 0.7), FU, { sh: 4, tex: `<path d="M-90 ${f(-60 + tw)} L-52 ${f(-44 + tw)} L-50 ${f(-20 + tw)} L-90 -10Z" fill="${K.ink}" opacity=".9" filter="url(#sb2)"/>` }); },
    over: (hx, hy, tl, a) => { let s = ''; const sw = Math.sin(a) * 4 - tl * 3;
      for (const [x, len] of [[-12, 10], [-2, 16], [8, 12]]) { const X = hx + x - 14, Y = hy + 14, x2 = X + sw * 0.5, y2 = Y + len;
        s += S(`M${f(X)} ${f(Y)} Q${f(X - 3)} ${f(Y + len * 0.5)} ${f(x2)} ${f(y2)}`, K.strap, 1.6, { lw: 1.4, hi: 0 }) + lantern(x2, y2 + 8, 0.95); }
      return s; },
    ruff: (hx, hy) => P(furry([[hx - 32, hy + 2], [hx - 26, hy - 12], [hx - 12, hy - 8], [hx + 2, hy + 8], [hx + 4, hy + 22], [hx - 8, hy + 28], [hx - 26, hy + 20]], 4.6, -1, 31, null, 0.5), '#aab6cb', { sh: 4 }),
    head: (hx, hy, tl, a) => ears(hx, hy, tl, a, { fur: FU, dk: AD }) + P(ell(hx - 2, hy - 2, 22, 20), FU, { sh: 6 }),
    mask: (hx, hy, tl) => {
      const M = (x, y) => [hx + x * 1.04, hy + y * 1.04 + tl * 2];
      let s = '';
      for (const [x, y, ang, len] of [[0, -16, -2.0, 18], [8, -18, -1.65, 24], [16, -16, -1.3, 17]]) { const [X, Y] = M(x, y); s += S(`M${f(X)} ${f(Y)} q${f(Math.cos(ang) * len * 0.4 - 2)} ${f(Math.sin(ang) * len * 0.5)} ${f(Math.cos(ang) * len)} ${f(Math.sin(ang) * len)}`, '#bdb8a3', 4.4, { lw: 2.2 }); }
      s += strap([M(-6, -12), M(-16, -8), M(-18, 4)], 3.6, { seed: 8 });
      const d = blob([M(-8, -15), M(4, -19), M(16, -16), M(28, -9), M(40, -3), M(45, 2), M(40, 6), M(26, 10), M(10, 12), M(-4, 10), M(-10, 0)]);
      s += husk(d, M, { col: '#c9c4ae', grain: [[[-2, -11], [14, -11], [32, -4]], [[0, 3], [16, 5], [36, 4]]], lichen: [[24, -10, 3.4], [2, 8, 3]], chip: [[-9, -6, 4, 3.4]], knot: [[34, 2, 1.6]], under: [[-4, 9], [20, 11], [40, 5]], hi: [[2, -16], [18, -14]] });
      s += knotSocket(blob([M(2, -8), M(8, -12), M(14, -9), M(12, -3), M(4, -3)])) + knotSocket(blob([M(18, -7), M(23, -8), M(26, -4), M(21, -2)]), 1.6) + knotSocket(ell(...M(8, -15.5), 2.3, 2.1), 1.3);
      return { svg: s, cx: hx + 16, cy: hy - 2, eyes: eyes3(M(8, -7), M(22, -5), M(8, -15.5), { r1: -12, r2: -14 }) };
    } };
  return wolfRig(st, C);
}

// C BARKMANTLE: the husk never stopped growing: a MANTLE of overlapping bark plates runs from the helm down its spine like a cloak, lichen in
// the seams; the face is a short heavy bark helm with THREE sockets stacked in a slanted column (a totem face). Slow, enormous presence.
export function alphaC(st = {}) {
  const FU = '#3e4762';
  const C = { fur: FU, dk: AD, seed: 19, ec: BOSS_EYE, elite: 1,
    tail: (a, tl, bob, s1) => { const tw = s1 * 3 - tl * 8; return P(furry([[-24, -34 + bob], [-42, -38 + tw * 0.4], [-58, -34 + tw], [-62, -22 + tw], [-48, -20 + tw], [-28, -24 + bob]], 3.6, -1, 18, [1, 1, 1, 1, 0, 0], 0.7), FU, { sh: 4 }); },
    back: (by, tl) => { let s = '';
      for (let i = 0; i < 5; i++) { const x = -26 + i * 9, y = by - 10 - i * 1.6 - tl * 3, w = 13, h = 11 + i; s += husk(blob([[x - w * 0.6, y + 4], [x - w * 0.5, y - h * 0.6], [x + w * 0.2, y - h], [x + w * 0.7, y - h * 0.4], [x + w * 0.6, y + 5]]), (X, Y) => [X, Y], { col: mix('#c4bfa9', '#8b846d', 0.15 + (4 - i) * 0.06), grain: [[[x - 3, y - h * 0.6], [x + 1, y - 2], [x + 3, y + 3]]], lichen: i % 2 ? [[x, y - 2, 2.2]] : [], p: { lw: 2.4 } }); }
      return s; },
    ruff: (hx, hy) => P(furry([[hx - 30, hy + 4], [hx - 24, hy - 6], [hx - 10, hy - 4], [hx + 2, hy + 10], [hx + 2, hy + 22], [hx - 10, hy + 26], [hx - 24, hy + 18]], 4, -1, 33, null, 0.5), '#a3aec4', { sh: 4 }),
    head: (hx, hy, tl, a) => ears(hx, hy, tl, a, { fur: FU, dk: AD }) + P(ell(hx - 2, hy - 2, 22, 20), FU, { sh: 6 }),
    mask: (hx, hy, tl) => {
      const M = (x, y) => [hx + x, hy + y + tl * 2];
      const d = blob([M(-12, -22), M(4, -26), M(18, -22), M(28, -12), M(34, -2), M(34, 8), M(24, 14), M(8, 16), M(-6, 12), M(-12, 0)]);
      let s = husk(d, M, { col: '#ccc7b2', grain: [[[-6, -18], [8, -20], [22, -14]], [[-8, -2], [6, -2], [20, 0], [32, 4]], [[-4, 10], [10, 12], [24, 10]]], crack: [[18, -22], [16, -14], [20, -8]], lichen: [[24, -16, 3.6], [-6, 6, 3]], chip: [[34, 6, 4, 0.2], [-11, -12, 4, 3.4]], under: [[-4, 12], [12, 14], [28, 10]], hi: [[-6, -20], [10, -22], [22, -16]] });
      s += sprout(...M(12, -24), -1.4, 0.9);
      s += knotSocket(blob([M(8, -18), M(14, -19), M(17, -15), M(11, -13)]), 1.5) + knotSocket(blob([M(10, -9), M(18, -11), M(22, -6), M(14, -4)])) + knotSocket(blob([M(14, 1), M(22, -1), M(26, 4), M(18, 6)]), 1.6);
      return { svg: s, cx: hx + 10, cy: hy - 4, eyes: eyes3(M(16, -7.5), M(20, 2.2), M(12.5, -16), { r1: -10, r2: -10 }) };
    } };
  return wolfRig(st, C);
}
