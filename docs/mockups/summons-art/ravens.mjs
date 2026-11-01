// SUMMONS ART: (2) Raven Flock options A/B/C (mock-up drawing code only, NOT game code).
import { SP, ROLE, WARM, EMBER, G, sEye, wrap, star } from './spirits.mjs';
import { blob, poly, circ, ell, limb, rng, tick, f, TAU } from '../enemies-art2/paint.mjs';

// A LETTER RAVENS (recommended): round chibi violet raven, big head, short pale beak, cream LETTER-PAPER wing tips with ink lines (Mara's
// undelivered letters), a warm wax-seal ember on the chest. Origin = body centre (flyer). Poses: perch | up | down | swoop | peck | spread | dive.
export function ravenA(st = {}) {
  const R = ROLE.raven, p = st.pose || 'up', bob = Math.sin((st.ph || 0) * TAU) * 2;
  const folded = p === 'perch' || p === 'swoop' || p === 'peck' || p === 'dive';
  let b = G(0, 0, 34, 26, R.glow, 0.42);
  const rot = p === 'swoop' ? 28 : p === 'dive' ? 78 : p === 'peck' ? 22 : 0;
  let g = '';
  g += SP(blob([[-12, 2], [-26, -2], [-30, 4], [-26, 9], [-12, 8]]), R, { col: R.dk, sh: 1 }) + `<path d="M-28 1 l-4 -1 M-29 5 l-5 1 M-27 8 l-4 3" stroke="${WARM}" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`;
  // wing = a fan of 4 rounded primaries from the shoulder; the last quarter of each is cream LETTER PAPER with two ink lines
  const FAN = { up: [[-148, 27], [-135, 32], [-121, 31], [-107, 25]], down: [[156, 25], [142, 30], [128, 29], [114, 23]], spread: [[-172, 31], [-158, 36], [-143, 35], [-128, 28]], fold: [[176, 26], [168, 29], [160, 25], [152, 20]] };
  const wing = (far) => {
    const fan = FAN[folded ? 'fold' : p] || FAN.up, k = far ? 0.82 : 1, sx = far ? 6 : 2, sy = far ? -8 : (folded ? -3 : -6), col = far ? R.dk : R.c;
    let s = '';
    fan.slice().reverse().forEach(([deg, L], i) => {
      const a = deg * Math.PI / 180, ex = sx + Math.cos(a) * L * k, ey = sy + Math.sin(a) * L * k, mx = sx + Math.cos(a) * L * k * 0.7, my = sy + Math.sin(a) * L * k * 0.7;
      s += SP(limb(sx, sy, ex, ey, 7.6 * k, 3.8 * k, 0), R, { col: i % 2 ? col : (far ? R.dk : '#c6b0ff'), sh: 2, rim: far ? 0 : 1.6 });
      s += SP(limb(mx, my, ex, ey, 4 * k, 3.4 * k, 0), R, { col: far ? '#d4c6a8' : '#efe1c0', lt: '#ffffff', dk: '#e2cfa5', ink: R.ink, sh: 1, rim: 0, lw: 1.6 });
      if (!far) s += `<path d="M${f(mx + Math.cos(a) * 2 - Math.sin(a) * 1.4)} ${f(my + Math.sin(a) * 2 + Math.cos(a) * 1.4)} l${f(Math.cos(a) * 4)} ${f(Math.sin(a) * 4)}" stroke="${R.ink}" stroke-width=".8" opacity=".75"/>`;
    });
    return s;
  };
  if (!folded) g += wing(1);
  g += SP(blob([[14, -2], [10, -12], [-2, -14], [-14, -8], [-16, 2], [-8, 10], [6, 10]]), R, { sh: 4, lt: '#f6f0ff', tex: `<path d="M-12 -4 Q-2 -12 8 -9" stroke="#ffffff" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>` });
  g += G(8, 4, 8, 7, EMBER, 0.7) + `<circle cx="8" cy="4" r="3.6" fill="${EMBER}" stroke="#b5762a" stroke-width="1.2"/><path d="M6.4 4 h3.2 M8 2.4 v3.2" stroke="#b5762a" stroke-width="1"/>`;
  if (folded) g += wing(0);
  const hx = p === 'peck' ? 18 : 14, hy = p === 'peck' ? -4 : -14;
  g += SP(blob([[hx - 6, hy - 9], [hx - 2, hy - 15], [hx + 1, hy - 11]]), R, { col: R.dk, sh: 1, rim: 0 });
  g += SP(circ(hx, hy, 11), R, { sh: 4, lt: '#ffffff' });
  g += SP(`M${f(hx + 8)} ${f(hy - 2.5)} Q${f(hx + 14)} ${f(hy - 1)} ${f(hx + 17)} ${f(hy + 1.5)} Q${f(hx + 13)} ${f(hy + 3.5)} ${f(hx + 8)} ${f(hy + 4)}Z`, R, { col: '#ece2f6', lt: '#ffffff', dk: '#b9a6d6', ink: R.ink, sh: 1, rim: 1, lw: 1.8 });
  g += sEye(hx + 3, hy - 2, 3.4, R);
  g += `<ellipse cx="${f(hx - 3)}" cy="${f(hy + 4)}" rx="3" ry="1.8" fill="${EMBER}" opacity=".35"/>`;
  if (!folded) g += wing(0);
  b += `<g transform="translate(0,${f(p === 'perch' ? bob : 0)}) rotate(${rot})">${g}</g>`;
  if (p === 'swoop' || p === 'dive') b = `<path d="${p === 'dive' ? 'M-8 -64 L-2 -12' : 'M-62 -30 L-12 -4'}" stroke="${R.glow}" stroke-width="10" opacity=".4" stroke-linecap="round" filter="url(#blur3)"/>` + b;
  if (p === 'peck') b += `<g transform="translate(38,12)">${G(0, 0, 12, 12, R.glow, 0.6)}${star(0, 0, 7, '#ffffff')}</g><path d="M30 20 q6 2 4 8 q-5 -2 -4 -8Z" fill="${R.c}" stroke="${R.ink}" stroke-width=".8"/>`;
  return wrap(b, st);
}

// B ORIGAMI RAVENS: folded-paper birds, crisp facets lit violet from inside the creases; the letter IS the bird.
export function ravenB(st = {}) {
  const R = ROLE.raven, p = st.pose || 'up', up = p === 'up' || p === 'spread' ? -1 : p === 'down' ? 1 : 0;
  let b = G(0, 0, 32, 24, R.glow, 0.45);
  const fac = (pts, col) => `<path d="${poly(pts)}" fill="${col}" stroke="${R.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
  const rot = p === 'swoop' ? 28 : p === 'dive' ? 78 : p === 'peck' ? 20 : 0;
  let g = '';
  if (up) g += fac([[-2, -2], [-10, up * 30], [8, -2]], R.dk);
  g += fac([[-22, 0], [-6, -8], [12, -6], [6, 6]], '#d8c8ff') + fac([[-22, 0], [6, 6], [-4, 8]], R.c) + fac([[12, -6], [24, -2], [10, 2]], '#f3ecff') + fac([[24, -2], [32, 0], [22, 1]], '#efe4cf');
  g += `<path d="M-6 -8 L6 6" stroke="#ffffff" stroke-width="1" opacity=".7"/>` + G(-2, 0, 10, 6, '#ffcf7a', 0.6) + `<circle cx="16" cy="-3" r="1.8" fill="${R.ink}"/>`;
  g += fac(up ? [[-4, -4], [-14, up * 34], [10, -4]] : [[-6, -2], [-26, 6], [8, 2]], '#cbb8ff');
  g += `<path d="M${up ? '-9 ' + up * 18 : '-16 3'} l6 ${up ? 1 : -1}" stroke="${R.ink}" stroke-width=".9" opacity=".7"/>`;
  b += `<g transform="rotate(${rot})">${g}</g>`;
  if (p === 'peck') b += `<g transform="translate(38,12)">${star(0, 0, 7, '#ffffff')}</g>`;
  return wrap(b, st);
}

// C FEATHER WISPS: a small bright raven head and breast whose body unravels into a comet of loose feathers (light first, bird second).
export function ravenC(st = {}) {
  const R = ROLE.raven, p = st.pose || 'up', q = rng(4);
  let b = G(-10, 0, 40, 18, R.glow, 0.5);
  const rot = p === 'swoop' ? 28 : p === 'dive' ? 78 : p === 'peck' ? 20 : 0;
  let g = '';
  for (let i = 0; i < 7; i++) { const y = (q() - 0.5) * 14, x = -10 - i * 6; g += tick(x, y, 10 + q() * 6, Math.PI + (q() - 0.5) * 0.6, 2.4, i % 2 ? R.c : '#e9e0ff', 0.9 - i * 0.1); }
  if (p === 'up' || p === 'spread' || p === 'down') { const s = p === 'down' ? 1 : -1; for (let i = 0; i < 4; i++) g += tick(-2 + i * 3, 0, 18 - i * 2, s * (1.2 + i * 0.25), 2.6, i % 2 ? R.c : '#efe8ff', 0.95); }
  g += SP(ell(4, 0, 11, 8), R, { sh: 3, lt: '#ffffff' }) + G(4, 2, 6, 5, EMBER, 0.6);
  g += SP(circ(14, -6, 7), R, { sh: 2, lt: '#ffffff' }) + `<path d="M19 -8 L28 -5 L19 -3Z" fill="#efe4cf" stroke="${R.ink}" stroke-width="1"/>` + sEye(16, -7, 2.4, R);
  b += `<g transform="rotate(${rot})">${g}</g>`;
  return wrap(b, st);
}
