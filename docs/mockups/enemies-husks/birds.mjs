// HUSKS options: (2) GRAVE CROW A/B/C. Fast zig-zag flyer, ONE big eye held HIGH (+20%), dark beak (friendly ravens own the orange beak).
// Mock-up drawing code only. Origin = ground under the bird (it hovers), facing +x.
import { K, P, S, locks, husk, knotSocket, strap, sprout, moss, lichen, finish, furry, blob, line, ell, circ, eye, shadow, mix, rng, specks, f, TAU, VOID } from './kit.mjs';

const FE = K.feather, FD = mix(FE, '#120d22', 0.38), FT = mix(FE, '#0e0a1c', 0.55), FH = mix(FE, '#e6eef8', 0.4);
// shared chibi crow rig: one round body-head ball, a ragged wing pair posed by the flap, a fan tail, tucked ink feet, a DARK beak.
function crowRig(st, C) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, fl = Math.cos(a), hov = -34 + Math.sin(a) * 3 + tl * 6;
  const Y = (y) => y + hov;
  let b = shadow(15, 0, 0.3);
  // tail fan (3 long feathers, ragged tips) + optional streamer
  const tlr = tl * 0.4;
  for (const [ang, len, c] of [[2.7, 20, FD], [2.92, 24, FE], [3.15, 19, FD]]) { const x0 = -10, y0 = Y(2), x1 = x0 + Math.cos(ang + tlr) * len, y1 = y0 - Math.sin(ang + tlr) * len * 0.35 + 7;
    b += P(blob([[x0, y0 - 3.4], [x1 + 2, y1 - 3], [x1 - 3, y1], [x1 + 3, y1 + 3], [x0, y0 + 3.4]]), c, { lw: 2.4, sh: 2, rim: 1.2 }); }
  if (C.tail) b += C.tail(Y, a, tl);
  // wing: 5 primaries + covert pad. up = raised V (flap), tl = folded back for the dive
  const wing = (far) => { const up = tl > 0 ? -0.7 - tl * 0.4 : fl, sx = far ? -8 : 0, sy = far ? -3 : 0, col = far ? FD : FE;
    const ox = -3 + sx + (far ? 6 : 0), oy = Y(-22) + sy, base = (far ? -1.5 : -2.2) - up * 0.6 + tl * 1.2; let s = '';
    for (let i = 4; i >= 0; i--) { const ang = base - i * 0.21 + tl * i * 0.14, len = (C.wl || 30) - i * 2.2 + (i === 1 ? 3 : 0), c = Math.cos(ang), sn = Math.sin(ang), nx = -sn, ny = c, w = 4.6 - i * 0.2;
      const x2 = ox + c * len, y2 = oy + sn * len, rag = i % 2 ? 2.4 : -1.6;
      const d = `M${f(ox + nx * w * 0.6)} ${f(oy + ny * w * 0.6)} Q${f(ox + c * len * 0.5 + nx * w)} ${f(oy + sn * len * 0.5 + ny * w)} ${f(x2 + nx * 1.4)} ${f(y2 + ny * 1.4)} L${f(x2 - c * 3 + rag * nx * 0.4)} ${f(y2 - sn * 3 + rag * ny * 0.4)} L${f(x2 - nx * 1.2)} ${f(y2 - ny * 1.2)} Q${f(ox + c * len * 0.5 - nx * w)} ${f(oy + sn * len * 0.5 - ny * w)} ${f(ox - nx * w * 0.6)} ${f(oy - ny * w * 0.6)}Z`;
      s += P(d, i % 2 ? mix(col, '#120d22', 0.15) : col, { lw: 2.2, sh: 2, rim: far ? 0 : 1.4, grain: 0.05, tex: `<path d="M${f(ox)} ${f(oy)} L${f(x2 - c * 4)} ${f(y2 - sn * 4)}" stroke="${FT}" stroke-width="1" opacity=".7"/>` + (C.wingTex ? C.wingTex(ox, oy, c, sn, len, i) : '') }); }
    const cv = furry([[ox + 7, oy + 5], [ox + Math.cos(base) * 15 + 4, oy + Math.sin(base) * 15], [ox + Math.cos(base - 0.8) * 15, oy + Math.sin(base - 0.8) * 15], [ox - 7, oy + 5]], 2.6, 1, 61, [0, 1, 0, 0], 0.5);
    return s + P(cv, col, { lw: 2.3, sh: 2, rim: far ? 0 : 1.6, tex: locks([[ox, oy, 9, base - 0.3, 1.8]], FT, 0.5) }); };
  b += wing(true);
  // tucked ink feet
  b += S(`M-3 ${f(Y(8))} l-2 6 l-3 2 M-5 ${f(Y(14))} l2 3`, K.ink, 1.8, { lw: 1.4, hi: 0 }) + S(`M5 ${f(Y(8))} l0 6 l-3 2 M5 ${f(Y(14))} l3 2`, K.ink, 1.8, { lw: 1.4, hi: 0 });
  // body-head ball (chibi: one round mass, head is the front-top of the ball)
  const body = furry([[16, Y(-2)], [20, Y(-14)], [14, Y(-27)], [2, Y(-32)], [-10, Y(-27)], [-17, Y(-14)], [-13, Y(2)], [2, Y(8)]], 3.2, -1, C.seed || 33, [0, 0, 0, 1, 1, 1, 1, 1], 0.6);
  b += P(body, FE, { sh: 7, rim: 3, rimA: 1, tex: locks([[-11, Y(-12), 10, 2.8], [-5, Y(-4), 10, 2.6], [-12, Y(-2), 9, 2.4], [3, Y(2), 8, 2.5]], FT, 0.55) + locks([[-6, Y(-24), 9, 3.0, 2], [4, Y(-28), 8, 3.1, 1.8]], FH, 0.5) + `<ellipse cx="2" cy="${f(Y(7))}" rx="12" ry="4" fill="${K.ink}" opacity=".45" filter="url(#sb2)"/>` });
  if (C.chest) b += C.chest(Y, tl);
  // the mask (per option) + DARK beak
  const hx = 10 + tl * 3, hy = Y(-18) + tl * 2;
  const m = C.mask(hx, hy, tl, a);
  b += wing(false);
  b += m.svg + (m.beak || '');
  const e = st.hurt ? eye(...m.E, 3.2, { shape: 'squint' }) : eye(...m.E, 3.8 + tl * 0.8, { shape: tl > 0.3 ? 'slit' : m.shape || 'round', rot: m.rot || 0 });
  return finish(st, b, e, { w: 40, h: 60, seed: C.seed || 33, mask: st.die ? `<g transform="translate(${f(-m.cx)},${f(-m.cy)})">${m.svg}</g>` : '', mx: m.cx, my: m.cy, mdx: 6 });
}
const beak = (x, y, len = 13, open = 0) => P(`M${f(x)} ${f(y - 4)} Q${f(x + len * 0.6)} ${f(y - 4.5)} ${f(x + len)} ${f(y + 1)} Q${f(x + len * 0.55)} ${f(y + 1.6)} ${f(x)} ${f(y + 3)}Z`, '#2b2733', { lw: 2.2, sh: 1.5, rim: 1.4, rimC: '#8f8fa8', grain: 0 })
  + `<path d="M${f(x + 1)} ${f(y - 0.4)} L${f(x + len * 0.8)} ${f(y + 0.4)}" stroke="#14111b" stroke-width="1" opacity=".8"/>`;

// A (recommended) CRACKED BROW: a pale bark BROW-HUSK grows over the top and front of the head like a heavy cracked helmet-brow, one big
// knot socket in it; the dark beak juts out underneath; a root strap wraps the throat; a lichen tuft on top. Jerky 2-beat flap, hang, head tilt.
export function crowA(st = {}) {
  return crowRig(st, { seed: 33,
    mask: (hx, hy, tl) => { const M = (x, y) => [hx + x, hy + y];
      let s = strap([M(-6, 6), M(-12, 2), M(-14, -6)], 2.6, { seed: 4 });
      const d = blob([M(-10, -6), M(-6, -14), M(4, -17), M(14, -13), M(19, -5), M(17, 2), M(12, 5), M(4, 4), M(-4, 6), M(-11, 2)]);
      s += husk(d, M, { grain: [[[-6, -9], [4, -13], [14, -9]], [[-6, 1], [4, -1], [16, -1]]], crack: [[2, -16], [4, -10], [1, -6]], lichen: [[-6, -12, 3]], chip: [[-10, -2, 3.4, 3.4], [17, 3, 3, 0.6]], hi: [[-4, -13], [6, -15]] });
      s += sprout(...M(-2, -15), -2.2, 0.75);
      s += knotSocket(blob([M(4, -9), M(11, -11), M(15, -5), M(10, -1), M(4, -3)]));
      return { svg: s, beak: beak(...M(10, 4), 15), cx: hx + 4, cy: hy - 4, E: M(9.6, -6), shape: 'almond', rot: -10 };
    } });
}
// B LEAFHOOD: a single huge dead OAK LEAF has grown stiff as bark and wraps the head like a hood, its lobed edge framing one hole; the stem
// curls up as a crest; the tail trails a long torn leaf-ribbon. Fluttery, blown about, drops in a spiral.
export function crowB(st = {}) {
  return crowRig(st, { seed: 35, wl: 28,
    tail: (Y, a) => S(line([[-12, Y(4)], [-26, Y(10) + Math.sin(a) * 3], [-38, Y(6) + Math.sin(a + 1) * 4], [-48, Y(12) + Math.sin(a + 2) * 4]]), '#9b9a86', 2.6, { lw: 1.8 }),
    mask: (hx, hy, tl) => { const M = (x, y) => [hx + x, hy + y];
      let s = '';
      const pts = []; const L = 13; for (let i = 0; i <= 12; i++) { const t = i / 12, ang = Math.PI * (0.95 + 1.1 * t), r = L * (0.85 + (i % 2 ? 0.25 : -0.02)); pts.push(M(3 + Math.cos(ang) * r * 1.25, -4 + Math.sin(ang) * r)); }
      pts.push(M(19, 2), M(10, 6), M(-6, 6));
      const d = blob(pts);
      s += husk(d, M, { col: '#c2bea6', grain: [[[-10, -2], [3, -8], [16, -6]], [[3, -8], [-4, -16]], [[3, -8], [10, -17]], [[3, -8], [-12, -10]]], gw: 1.6, lichen: [[-8, 2, 2.4]], hi: [[-10, -10], [2, -17]] });
      s += S(`M${f(M(-2, -16)[0])} ${f(M(-2, -16)[1])} q-2 -8 4 -10 q4 -1 3 3`, K.strap, 2, { lw: 1.6 });
      s += knotSocket(blob([M(5, -9), M(12, -10), M(15, -4), M(9, -1), M(4, -4)]));
      return { svg: s, beak: beak(...M(12, 4), 13), cx: hx + 3, cy: hy - 4, E: M(9.6, -5.4), shape: 'round' };
    } });
}
// C ACORN-CAP JACKDAW: a smaller, rounder jackdaw whose husk is a scaly ACORN CUP worn like a helmet down to the beak, one socket through
// the scales; a stub of acorn stalk on top; long thin wings. Pecky, darting, bobs its head between hops of flight.
export function crowC(st = {}) {
  return crowRig(st, { seed: 37, wl: 34,
    mask: (hx, hy, tl) => { const M = (x, y) => [hx + x, hy + y];
      let s = '';
      const d = blob([M(-11, 2), M(-12, -8), M(-6, -16), M(4, -18), M(14, -14), M(18, -5), M(16, 3), M(6, 6), M(-4, 6)]);
      // cupule scales as texture
      let sc = ''; const q = rng(5); for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const [X, Y] = M(-9 + i * 5 + (r % 2) * 2.4, -14 + r * 5); sc += `<path d="M${f(X - 3)} ${f(Y + 1)} Q${f(X)} ${f(Y - 3.4)} ${f(X + 3)} ${f(Y + 1)} Q${f(X)} ${f(Y + 0.2)} ${f(X - 3)} ${f(Y + 1)}Z" fill="${mix('#c7c2ab', '#8b846d', 0.3 + 0.3 * q())}" stroke="${K.grain}" stroke-width=".8"/>`; }
      s += husk(d, M, { col: '#c7c2ab', p: { tex: sc } });
      s += S(`M${f(M(3, -18)[0])} ${f(M(3, -18)[1])} l1 -6`, K.strap, 3.2, { lw: 1.8 });
      s += knotSocket(blob([M(5, -8), M(12, -9), M(14, -3), M(8, 0), M(4, -3)]));
      return { svg: s, beak: beak(...M(12, 4), 12), cx: hx + 3, cy: hy - 5, E: M(9, -4.4), shape: 'round' };
    } });
}
