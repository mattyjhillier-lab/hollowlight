// HUSKS options: (4) RANGED, Thornspitter role (walks in to ~160 u, roots, 0.7 s tell: swell + ember glow inside + rock back, then ONE slow
// thorn; ONE eye, very HIGH). Mock-up drawing code only. Origin feet, facing +x.
import { K, P, S, locks, sock, husk, knotSocket, strap, sprout, moss, lichen, thorn, finish, tAim, furry, blob, line, ell, circ, limb, eye, shadow, glow, mix, rng, specks, f, TAU, VOID } from './kit.mjs';
const RO = '#ff5a3c';
const eye1 = (E, r, tl, hurt, shape = 'almond', rot = -8) => hurt ? eye(...E, r * 0.9, { shape: 'squint' }) : eye(...E, r + tl * 0.8, { shape: tl > 0.3 ? 'wide' : shape, rot });

// A (recommended) STOAT PIPER: a stoat that stood up on its hind legs to watch for danger and never sat back down. Tall S-curve body, a long
// ink-tipped tail curled at its feet, and a husk grown into a long bark BLOWPIPE snout with ONE socket high on the brow. Tell: it rears even
// taller, the pipe swings onto you and an ember glows inside the tip (red-orange = danger); recoil on the shot. Twitchy sentry.
export function spitA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2, rear = tl * 6;
  const FU = '#525c78', DK = '#353c54', BE = '#9aa6bd';
  let b = shadow(24, 0) + `<ellipse cx="0" cy="0" rx="20" ry="5" fill="${K.ink}" opacity=".32"/>`;
  // tail curled on the ground behind
  b += P(furry([[-6, -8], [-20, -6], [-30, -12], [-34, -22], [-28, -26], [-24, -18], [-14, -14], [-4, -16]], 2.6, -1, 51, [1, 1, 1, 1, 0, 0, 0, 0], 0.5), FU, { sh: 3, tex: `<path d="M-40 -30 L-26 -30 L-24 -16 L-40 -14Z" fill="${K.ink}" opacity=".92" filter="url(#sb2)"/>` });
  // hind feet + body (tall bean leaning forward)
  b += sock(-6, 0, 5, 7) + sock(8, 0, 5, 7);
  const by = -30 + bob - rear * 0.4;
  b += P(furry([[12, by + 26], [14, by + 6], [10, by - 12], [4, by - 22], [-8, by - 20], [-14, by - 4], [-14, by + 16], [-6, by + 28]], 2.8, -1, 53, [0, 0, 1, 1, 1, 1, 0, 0], 0.5), FU, { sh: 6, rim: 3, rimA: 1,
    tex: P(blob([[10, by + 22], [12, by + 4], [6, by - 14], [0, by - 8], [0, by + 12], [4, by + 24]]), BE, { lw: 0.01, nl: 1, sh: 2, rim: 0 }) + locks([[-8, by - 4, 10, 1.9], [-10, by + 8, 10, 1.7]], mix(FU, '#0e0a1c', 0.5), 0.5) });
  // little forepaws held up
  b += P(limb(8, by - 4, 16, by + 4, 3.4, 3), DK, { lw: 2, sh: 1.5, rim: 0 }) + P(circ(16.5, by + 4.5, 3.4), K.ink, { lw: 1.8, sh: 1, rimC: K.inkRim, rimA: 0.6 });
  // head
  const hx = 6 + tl * 2, hy = by - 30 - rear * 0.8;
  b += P(blob([[hx - 12, hy - 4], [hx - 16, hy - 16], [hx - 8, hy - 10]]), DK, { lw: 2.2, sh: 2 }) + P(ell(hx - 1, hy, 13.5, 12.5), FU, { sh: 5 }) + P(blob([[hx - 2, hy - 10], [hx + 2, hy - 20], [hx + 7, hy - 9]]), FU, { lw: 2.2, sh: 2 });
  const M = (x, y) => [hx + x, hy + y];
  const pipeAng = -tl * 0.12;
  let ms = strap([M(-8, -6), M(-12, 2), M(-10, 10)], 2.6, { seed: 6 });
  const d = blob([M(-8, -10), M(4, -12), M(12, -6), M(32, -4), M(36, -6), M(38, -1), M(36, 3), M(30, 2), M(12, 5), M(2, 8), M(-8, 5), M(-11, -3)]);
  ms += husk(d, M, { grain: [[[-4, -8], [6, -9], [12, -4]], [[12, -2], [24, -1.5], [34, -2]], [[-4, 4], [8, 4]]], knot: [[22, 0, 1.4]], lichen: [[-4, 3, 2.6]], chip: [[-10, -6, 3, 3.4]], under: [[-4, 6], [10, 4], [32, 2]], hi: [[-4, -10], [6, -10], [12, -6]] });
  ms += `<ellipse cx="${f(M(38, -1.5)[0])}" cy="${f(M(38, -1.5)[1])}" rx="1.8" ry="3.4" fill="${VOID}"/>` + (tl > 0 ? glow(...M(38, -1.5), 5 + tl * 6, 5 + tl * 6, RO, 0.9) + `<circle cx="${f(M(38, -1.5)[0])}" cy="${f(M(38, -1.5)[1])}" r="${f(1 + tl * 1.4)}" fill="#ffd0a0"/>` : '');
  ms += sprout(...M(0, -11), -1.9, 0.75);
  ms += knotSocket(blob([M(-2, -6), M(3, -9), M(8, -6), M(5, -2), M(0, -2)]));
  b += `<g transform="rotate(${f(pipeAng * 57)} ${f(hx)} ${f(hy)})">${ms}</g>`;
  if (tl > 0) b = tAim(hx + 40, hy, hx + 130, hy + 26, tl) + b;
  const R = (p) => { const t = pipeAng, dx = p[0] - hx, dy = p[1] - hy; return [hx + dx * Math.cos(t) - dy * Math.sin(t), hy + dx * Math.sin(t) + dy * Math.cos(t)]; };
  return finish(st, b, eye1(R(M(3, -5.2)), 2.9, tl, st.hurt), { w: 40, h: 76, seed: 51, mask: st.die ? `<g transform="translate(${f(-hx - 10)},${f(-hy)})">${ms}</g>` : '', mx: hx + 10, my: hy });
}

// B QUILLHOG: a hedgehog that curled up when the Hollow came and never uncurled; its quills turned to dark-tipped bark THORNS. Round low ball,
// tiny husk face with a short tube snout. Tell: it PUFFS, quills fan out and an ember glows in the tube; recoil. Bustling waddle. (Low, not tall:
// the single eye is lower than the role asks, so it reads less at night than A or C.)
export function spitB(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, bob = -Math.abs(Math.sin(a)) * 1.6, puff = 1 + tl * 0.14;
  const FU = '#4f586f', Q = '#bcb8a4', QD = '#7a7564';
  let b = shadow(30, 0) + `<ellipse cx="0" cy="0" rx="24" ry="5" fill="${K.ink}" opacity=".3"/>`;
  const cx = -2, cy = -22 + bob;
  b += sock(-12 + Math.sin(a) * 3, 0, 4.6, 5) + sock(8 - Math.sin(a) * 3, 0, 4.6, 5);
  const r = rng(17); let back = '', front = '';
  for (let row = 0; row < 3; row++) for (let i = 0; i < 11; i++) {
    const t = (i + row * 0.33) / 10.5, ang = Math.PI * (0.5 + 1.0 * t) + (r() - 0.5) * 0.12, len = (12 + 6 * r() + row * 2) * (1 + tl * 0.4) * puff, rr = 17 - row * 3;
    const bx = cx + Math.cos(ang) * rr, by = cy - Math.sin(ang) * rr * 0.9, tx = cx + Math.cos(ang) * (rr + len), ty = cy - Math.sin(ang) * (rr + len) * 0.9, w = 3.4 - row * 0.4, nx = -Math.sin(ang) * w, ny = -Math.cos(ang) * w;
    const s = P(`M${f(bx + nx)} ${f(by + ny)} L${f(tx)} ${f(ty)} L${f(bx - nx)} ${f(by - ny)}Z`, row === 2 ? Q : mix(Q, QD, 0.35 - row * 0.12), { lw: 1.6, sh: 1.2, rim: 0.9, grain: 0, tex: `<path d="M${f(bx + (tx - bx) * 0.7)} ${f(by + (ty - by) * 0.7)} L${f(tx)} ${f(ty)}" stroke="${K.thorn}" stroke-width="${f(w * 1.5)}"/>` });
    if (row < 2) back += s; else front += s; }
  b += back + P(ell(cx + 2, cy + 2, 21 * puff, 17 * puff), FU, { sh: 5, rim: 3 }) + front;
  const hx = cx + 18 + tl * 2, hy = cy + 3, M = (x, y) => [hx + x, hy + y];
  let ms = husk(blob([M(-7, -9), M(3, -10), M(9, -5), M(9, 4), M(2, 8), M(-7, 6), M(-9, -1)]), M, { grain: [[[-4, -6], [2, -7], [7, -4]]], lichen: [[-4, 3, 2.4]], hi: [[-5, -8], [3, -9]] })
    + P(blob([M(6, -3), M(17 + tl * 2, -4), M(19 + tl * 2, 0), M(17 + tl * 2, 4), M(6, 4)]), K.bark, { lw: 2, sh: 2, rimA: 1, tex: `<ellipse cx="${f(hx + 18 + tl * 2)}" cy="${f(hy)}" rx="1.6" ry="3" fill="${VOID}"/>` })
    + knotSocket(blob([M(-4, -5), M(1, -8), M(5, -5), M(2, -1), M(-2, -1)]), 1.5);
  if (tl > 0) ms += glow(hx + 19, hy, 6 + tl * 6, 6 + tl * 6, RO, 0.9);
  b += ms;
  if (tl > 0) b = tAim(hx + 22, hy, hx + 110, hy + 10, tl) + b;
  return finish(st, b, eye1(M(0.5, -4.2), 2.3, tl, st.hurt), { w: 50, h: 50, seed: 21, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>` : '', mx: hx, my: hy });
}

// C THORN SQUIRREL: an upright red squirrel gone grey; its huge tail has become a curled BRAMBLE plume over its head, studded with thorns it
// plucks and throws. The husk is a wrinkled WALNUT shell half over the face, one socket high in it. Tell: it plucks a thorn from the tail and
// holds it high (ember tip glows), then throws. Fidgety, tail flicks.
export function spitC(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 1.8;
  const FU = '#566078', DK = '#394058', BR = '#3b3446';
  let b = shadow(24, 0) + `<ellipse cx="0" cy="0" rx="20" ry="5" fill="${K.ink}" opacity=".32"/>`;
  // bramble tail: a big curl up behind and over the head
  const tf = s1 * 2 - tl * 3;
  const tail = furry([[-6, -10], [-22, -18], [-30, -38], [-28, -60 + tf], [-14, -74 + tf], [2, -76 + tf], [10, -68 + tf], [4, -62 + tf], [-8, -62 + tf], [-14, -52], [-14, -34], [-4, -22]], 3.4, -1, 61, [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], 0.7);
  let th = ''; for (const [x, y, an] of [[-26, -30, 3.3], [-30, -46, 3.4], [-26, -62, -2.4], [-14, -74, -1.9], [0, -76, -1.3], [8, -70, -0.6], [-20, -22, 2.8]]) th += thorn(x, y + tf * (y < -55 ? 1 : 0), an, 7, 2.4, BR);
  b += th + P(tail, '#7d8499', { sh: 5, rim: 3, tex: `<path d="${line([[-8, -18], [-24, -30], [-22, -50], [-26, -60], [-12, -70], [0, -70]])}" stroke="${BR}" stroke-width="3.6" fill="none" opacity=".85" stroke-linecap="round"/><path d="${line([[-14, -20], [-28, -40], [-18, -56], [-6, -66], [6, -66]])}" stroke="${BR}" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>` + specks(-18, -50, 10, 20, 8, BR, { seed: 4, r: 1.6, a: 0.6 }) });
  b += sock(-4, 0, 5, 6) + sock(9, 0, 5, 6);
  const by = -24 + bob;
  b += P(furry([[12, by + 20], [14, by + 2], [6, by - 12], [-6, by - 12], [-12, by + 4], [-10, by + 20]], 2.6, -1, 63, [0, 1, 1, 1, 1, 0], 0.5), FU, { sh: 6, rim: 3, rimA: 1, tex: P(ell(5, by + 6, 6, 11), '#9aa6bd', { nl: 1, sh: 2, rim: 0 }) });
  // paws: on the tell one paw holds a plucked thorn high, its tip glows
  if (tl > 0) b += P(limb(4, by - 6, 6, by - 22, 3, 2.6), DK, { lw: 1.8, sh: 1, rim: 0 }) + thorn(6, by - 22, -1.4, 10, 2.6, BR) + glow(7.5, by - 32, 4 + tl * 5, 4 + tl * 5, RO, 0.9);
  else b += P(limb(8, by - 2, 14, by + 4, 3, 2.6), DK, { lw: 1.8, sh: 1, rim: 0 });
  // head + walnut husk
  const hx = 6, hy = by - 22;
  b += P(blob([[hx - 8, hy - 8], [hx - 10, hy - 22], [hx - 2, hy - 12]]), DK, { lw: 2, sh: 1.5, tex: `<path d="M${f(hx - 10)} ${f(hy - 22)} l-2 -4 M${f(hx - 10)} ${f(hy - 22)} l2 -4" stroke="${DK}" stroke-width="1.6"/>` }) + P(ell(hx, hy, 13, 12), FU, { sh: 5 });
  const M = (x, y) => [hx + x, hy + y];
  let ms = strap([M(-8, -2), M(-12, 6)], 2.4, { seed: 2 });
  const d = blob([M(-6, -12), M(6, -13), M(15, -6), M(17, 3), M(11, 8), M(2, 7), M(-4, 2), M(-8, -4)]);
  let wr = ''; for (const g of [[[-2, -10], [2, -6], [0, -2], [4, 3]], [[6, -11], [9, -6], [7, -1], [11, 5]], [[12, -6], [14, -1], [13, 4]]]) wr += `<path d="${line(g.map(([x, y]) => M(x, y)))}" stroke="${K.grain}" stroke-width="1.4" fill="none" opacity=".8"/>`;
  ms += husk(d, M, { col: '#c4bda5', p: { tex: wr + `<path d="${line([M(-6, 4), M(4, 8), M(14, 6)])}" stroke="${K.barkDk}" stroke-width="5" fill="none" opacity=".6" filter="url(#sb2)"/>` } });
  ms += `<path d="${line([M(4, -13), M(5, -4), M(4, 7)])}" stroke="${K.barkDk}" stroke-width="2" fill="none"/>` + knotSocket(blob([M(6, -8), M(11, -9), M(13, -4), M(8, -2)]), 1.5);
  b += ms;
  if (tl > 0) b = tAim(hx + 14, hy - 2, hx + 110, hy + 30, tl) + b;
  return finish(st, b, eye1(M(9.4, -5.6), 2.7, tl, st.hurt, 'round'), { w: 44, h: 80, seed: 61, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>` : '', mx: hx, my: hy });
}
