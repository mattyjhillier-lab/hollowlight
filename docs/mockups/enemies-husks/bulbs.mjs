// HUSKS options: (5) AREA DENIAL, Blightbulb role (waddles in, plants within ~50 u, pulses faster while a ground ring fills 1.0 s, BURSTS;
// killed early it fizzles; THREE tiny eyes in a triangle). Mock-up drawing code only. Origin feet, facing +x.
import { K, P, S, locks, sock, husk, knotSocket, strap, sprout, moss, lichen, finish, tRing, furry, blob, line, ell, circ, limb, eye, shadow, glow, mix, rng, specks, f, TAU, VOID } from './kit.mjs';
const RO = '#ff5a3c';
const eyes3 = (E, r, tl, hurt) => E.map((p, i) => hurt ? eye(...p, r * 0.85, { shape: 'squint' }) : eye(...p, (i ? r * 0.85 : r) + tl * 0.5, { shape: tl > 0.3 ? 'wide' : 'round' })).join('');
const cracks = (x, y, r, tl, seed = 3) => { if (tl <= 0) return ''; const q = rng(seed); let s = ''; for (let i = 0; i < 4; i++) { const a0 = q() * TAU, pts = [[x + Math.cos(a0) * r * 0.2, y + Math.sin(a0) * r * 0.2]]; for (let k = 1; k < 4; k++) { const a = a0 + (q() - 0.5) * 0.9; pts.push([x + Math.cos(a) * r * k * 0.28, y + Math.sin(a) * r * k * 0.25]); } s += `<path d="${line(pts)}" stroke="${RO}" stroke-width="${f(1.2 + tl * 1.2)}" fill="none" opacity="${f(0.5 + 0.5 * tl)}" stroke-linecap="round"/>`; } return s + glow(x, y, r * 0.8, r * 0.7, RO, 0.35 * tl); };

// A (recommended) PUFFBACK TOAD: a pond toad the Hollow filled with spores: a HUGE pale spore BLISTER rides its back (the silhouette hook),
// spore motes leak from it; a wide flat husk with three small sockets in a triangle. Heavy hop-waddle, the blister breathes; on the tell it
// squats, the blister swells and cracks glow red-orange while the ring fills; burst = blister pops in a spore puff.
export function bulbA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, hop = Math.max(0, Math.sin(a)) * 4 * (1 - tl), br = 1 + Math.sin(a * 2) * 0.03 + tl * 0.3;
  const SK = '#64707f', BEL = '#a5aeb2', SAC = '#aab5a5', SACD = '#64705f';
  let b = shadow(32, 0) + `<ellipse cx="0" cy="0" rx="26" ry="5" fill="${K.ink}" opacity=".3"/>`;
  if (tl > 0) b = tRing(52, tl) + b;
  const y = -hop + tl * 2;
  b += P(ell(-16, -9 + y, 11, 8), mix(SK, '#120d22', 0.25), { sh: 3, rim: 1 }) + sock(-10, 0, 6, 5);
  b += P(blob([[24, -14 + y], [22, -24 + y], [6, -30 + y], [-16, -28 + y], [-26, -18 + y], [-22, -8 + y], [0, -6 + y], [18, -8 + y]]), SK, { sh: 5, rim: 3, rimA: 1, tex: specks(0, -20 + y, 18, 7, 14, mix(SK, '#120d22', 0.45), { seed: 7, r: 2.2, a: 0.55 }) + `<path d="M-22 ${f(-10 + y)} Q0 ${f(-2 + y)} 22 ${f(-11 + y)}" stroke="${BEL}" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>` });
  const sx = -4, sy = -38 + y, sr = 18 * br;
  b += P(blob([[sx - sr, sy + 9], [sx - sr * 0.95, sy - sr * 0.45], [sx - sr * 0.25, sy - sr * 1.05], [sx + sr * 0.6, sy - sr * 0.85], [sx + sr, sy - sr * 0.1], [sx + sr * 0.8, sy + 9]]), SAC, { sh: 4, gloss: 0.5, rimC: '#eef6f0', rimA: 1,
    tex: specks(sx, sy - 4, sr * 0.7, sr * 0.6, 10, SACD, { seed: 3, r: 2.8, a: 0.6 }) + lichen(sx + 8, sy - 10, 3) + cracks(sx, sy - 2, sr, tl) });
  for (let i = 0; i < 4; i++) b += `<circle cx="${f(sx - 6 + i * 6)}" cy="${f(sy - sr - 4 - i * 3 - Math.sin(a + i) * 2)}" r="${f(1.8 - i * 0.2)}" fill="${SAC}" opacity=".75"/>`;
  b += P(limb(14, -14 + y, 22, -2, 4.6, 4), SK, { lw: 2.3, sh: 2, rim: 1.2 }) + sock(23, 0, 5.4, 5);
  const hx = 24, hy = -22 + y, M = (x, y2) => [hx + x, hy + y2];
  let ms = strap([M(-8, -4), M(-14, -8), M(-18, -4)], 2.4, { seed: 3 });
  ms += husk(blob([M(-10, -6), M(-6, -11), M(-1, -9), M(4, -12), M(10, -10), M(15, -3), M(13, 4), M(2, 7), M(-8, 5)]), M, { grain: [[[-6, -3], [4, -5], [12, -1]], [[-6, 3], [4, 4], [10, 3]]], lichen: [[-6, 2, 2.4]], chip: [[15, 0, 3, 0.1]], hi: [[-6, -8], [4, -10]] });
  ms += knotSocket(circ(...M(0, -4), 2.6), 1.3) + knotSocket(circ(...M(8, -5), 2.3), 1.3) + knotSocket(circ(...M(4, 1.5), 2), 1.2);
  b += ms;
  return finish(st, b, eyes3([M(0, -4), M(8, -5), M(4, 1.5)], 1.7, tl, st.hurt), { w: 50, h: 58, seed: 31, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>` : '', mx: hx, my: hy });
}

// B PUFFCAP DORMOUSE: a fat sleepy dormouse; a giant PUFFBALL mushroom grew over its head and back as its husk (pale, round, dimpled), three
// little sockets peek from under its brim; tiny feet patter under it, a long thin tail. Tell: it sits, the cap inflates and dimples, spore
// dust puffs from the top while the ring fills; burst = the cap tears open in a grey cloud.
export function bulbB(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, wob = Math.sin(a) * 5 * (1 - tl), inf = 1 + tl * 0.28 + Math.sin(a * 2) * 0.02;
  const FU = '#5a6378', CAP = '#c9c8b8', CAPD = '#8d8b7a';
  let b = shadow(30, 0) + `<ellipse cx="0" cy="0" rx="24" ry="5" fill="${K.ink}" opacity=".3"/>`;
  if (tl > 0) b = tRing(52, tl) + b;
  b += S(line([[-14, -8], [-28, -6], [-36, -12], [-40, -8]]), FU, 2.4, { lw: 1.8 });
  b += `<g transform="rotate(${f(wob)} 0 0)">`;
  b += sock(-8, 0, 4.4, 4) + sock(8, 0, 4.4, 4);
  b += P(ell(0, -10, 18, 10), FU, { sh: 4, rim: 2.4, tex: specks(-6, -6, 8, 3, 4, mix(FU, '#0e0a1c', 0.4), { seed: 2, r: 1.2, a: 0.5 }) });
  // ears poking out under the cap
  b += P(ell(-14, -18, 5, 6), FU, { lw: 2, sh: 2 }) + P(ell(14, -18, 5, 6), FU, { lw: 2, sh: 2, tex: `<ellipse cx="14" cy="-18" rx="2.4" ry="3.4" fill="#8892a6"/>` });
  const cy = -30, R = 22 * inf;
  let cap = P(blob([[-R, cy + 6], [-R * 0.95, cy - R * 0.45], [-R * 0.45, cy - R * 0.95], [R * 0.2, cy - R * 1.02], [R * 0.75, cy - R * 0.7], [R, cy - R * 0.1], [R * 0.9, cy + 7], [0, cy + 10]]), CAP, { sh: 5, gloss: 0.35, rimA: 1, rimC: '#f6f8f2',
    tex: [[-10, -12, 3.4], [4, -16, 2.6], [12, -6, 3], [-4, -4, 2.4], [-14, -2, 2]].map(([x, y, r]) => `<ellipse cx="${f(x * inf)}" cy="${f(cy + y * inf)}" rx="${f(r * inf)}" ry="${f(r * 0.7 * inf)}" fill="${CAPD}" opacity=".55"/><ellipse cx="${f(x * inf - 0.6)}" cy="${f(cy + y * inf - 0.8)}" rx="${f(r * 0.5 * inf)}" ry="${f(r * 0.3 * inf)}" fill="#fbfbf3" opacity=".6"/>`).join('') + specks(0, cy - 4, R * 0.7, R * 0.5, 12, '#a19f8d', { seed: 9, r: 1, a: 0.6 }) + cracks(0, cy - 6, R, tl, 5) });
  // brim band with the three sockets (the face line)
  const M = (x, y) => [x, y];
  cap += P(blob([[-R * 0.92, cy + 4], [-R * 0.4, cy + 0], [R * 0.4, cy - 1], [R * 0.92, cy + 3], [R * 0.85, cy + 9], [0, cy + 12], [-R * 0.85, cy + 10]]), mix(CAP, '#8d8b7a', 0.25), { lw: 2, sh: 2, rim: 1, grain: 0.1 });
  cap += knotSocket(circ(4, cy + 4.5, 2.6), 1.2) + knotSocket(circ(13, cy + 4, 2.3), 1.2) + knotSocket(circ(8.5, cy - 2, 2.1), 1.1);
  if (tl > 0.2) for (let i = 0; i < 4; i++) cap += `<circle cx="${f(-6 + i * 4)}" cy="${f(cy - R - 3 - i * 3 * tl)}" r="${f(2.4 - i * 0.3)}" fill="#c9c8b8" opacity="${f(0.7 * tl)}"/>`;
  b += cap + '</g>';
  const Rt = (p) => { const t = wob * Math.PI / 180; return [p[0] * Math.cos(t) - p[1] * Math.sin(t), p[0] * Math.sin(t) + p[1] * Math.cos(t)]; };
  return finish(st, b, eyes3([Rt([4, cy + 4.5]), Rt([13, cy + 4]), Rt([8.5, cy - 2])], 1.6, tl, st.hurt), { w: 48, h: 56, seed: 33, mask: st.die ? `<g transform="translate(0,${f(-cy)})">${cap}</g>` : '', mx: 0, my: cy });
}

// C GOURD BEETLE: a round dung beetle whose shell has become a pale SPORE GOURD split down the middle by a seam; six short ink legs, a
// stubby bark face plate with three sockets. Tell: it braces, the seam gapes and glows red-orange, the gourd halves lift like wings while
// the ring fills; burst = the gourd splits open and dumps a spore patch. Skittery, stops dead.
export function bulbC(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, sk = Math.sin(a * 2) * 1.2 * (1 - tl), open = tl * 9;
  const SH = '#b9b9a6', SHD = '#76776a', BD = '#3a3f52';
  let b = shadow(30, 0) + `<ellipse cx="0" cy="0" rx="26" ry="5" fill="${K.ink}" opacity=".3"/>`;
  if (tl > 0) b = tRing(52, tl) + b;
  for (let i = 0; i < 3; i++) { const x = -12 + i * 12, ph = a + i * 2.1, sw = Math.sin(ph) * 3 * (1 - tl); b += S(`M${f(x)} -10 l${f(sw - 3)} 6 l${f(-2)} 4`, K.ink, 2.6, { lw: 1.6, hi: 0 }) + S(`M${f(x + 3)} -9 l${f(-sw + 3)} 6 l2 3`, '#2a2338', 2.4, { lw: 1.6, hi: 0 }); }
  b += P(ell(0, -12 + sk, 22, 8), BD, { sh: 2, rim: 1.4 });
  const cy = -24 + sk;
  // back half (lifts on tell)
  b += `<g transform="rotate(${f(-open)} -20 ${f(cy + 8)})">` + P(blob([[-24, cy + 8], [-24, cy - 6], [-14, cy - 18], [0, cy - 21], [2, cy + 8]]), SH, { sh: 5, gloss: 0.35, rimA: 1, tex: [[-14, cy - 8], [-6, cy - 14], [-18, cy + 2]].map(([x, y]) => `<path d="M${f(x)} ${f(y)} q4 -2 6 2" stroke="${SHD}" stroke-width="1.4" fill="none"/>`).join('') + specks(-10, cy - 4, 10, 10, 8, SHD, { seed: 4, r: 1.6, a: 0.6 }) }) + '</g>';
  b += `<g transform="rotate(${f(open)} 20 ${f(cy + 8)})">` + P(blob([[0, cy + 8], [0, cy - 21], [12, cy - 18], [22, cy - 8], [24, cy + 8]]), mix(SH, '#fff', 0.08), { sh: 5, gloss: 0.4, rimA: 1, tex: lichen(10, cy - 8, 3.4) + specks(10, cy - 2, 10, 8, 6, SHD, { seed: 6, r: 1.6, a: 0.6 }) }) + '</g>';
  b += `<path d="M1 ${f(cy - 21)} L1 ${f(cy + 8)}" stroke="${tl > 0 ? RO : VOID}" stroke-width="${f(1.6 + tl * 2.4)}" opacity="${f(tl > 0 ? 0.6 + 0.4 * tl : 0.8)}"/>` + (tl > 0 ? glow(1, cy - 6, 8 + 10 * tl, 16, RO, 0.45 * tl) : '');
  for (let i = 0; i < 3; i++) b += `<circle cx="${f(-2 + i * 3)}" cy="${f(cy - 24 - i * 3 - Math.sin(a + i) * 1.5)}" r="1.5" fill="${SH}" opacity=".7"/>`;
  // face plate
  const hx = 25, hy = -16 + sk, M = (x, y) => [hx + x, hy + y];
  let ms = husk(blob([M(-6, -9), M(4, -10), M(10, -5), M(11, 3), M(4, 7), M(-5, 6), M(-8, -1)]), M, { grain: [[[-4, -6], [4, -7], [9, -3]]], chip: [[11, 0, 3, 0]], hi: [[-4, -8], [4, -9]] })
    + `<path d="M${f(hx + 2)} ${f(hy - 10)} q-2 -6 -7 -8 M${f(hx + 6)} ${f(hy - 9)} q1 -7 5 -9" stroke="${K.ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    + knotSocket(circ(...M(0, -3), 2.3), 1.2) + knotSocket(circ(...M(7, -3.5), 2), 1.2) + knotSocket(circ(...M(3.6, 2.4), 1.8), 1.1);
  b += ms;
  return finish(st, b, eyes3([M(0, -3), M(7, -3.5), M(3.6, 2.4)], 1.5, tl, st.hurt), { w: 52, h: 46, seed: 35, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>` : '', mx: hx, my: hy });
}
