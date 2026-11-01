// TAKE A "HUSKS": the forest's own creatures, drained; the Hollow wears them. Plush cold fur/feather + a pale lichen-bark HUSK MASK
// with an empty void face where ember eye-points float. Ink got in through the paws (dark socks, creeping veins).
// Mock-up drawing code only (not game code). Units du (4 du = 1 world unit). Origin = feet on ground, facing +x.
import { furry, part, rod, strands, specks, tick, ticks, eye, socket, shadow, glow, mix, blob, line, poly, ell, circ, tuft, spiky, limb, rng, f, TAU, BOSS_EYE, VOID } from './paint.mjs';

export const PA = {
  fur: '#45506d', furDk: '#2e3550', ruff: '#8e9cb9', mask: '#bdbba6', maskDk: '#86836f', lichen: '#8fa596', ink: '#171222', crack: '#6a58a0',
  feather: '#566176', thorn: '#3d3548', bark: '#6b6a72', barkDk: '#47454f', moss: '#71877b', toad: '#6e7a86', toadBelly: '#a5aeb2', antler: '#c2c2b4',
};
const P = PA;
export const veins = (pts, k = 1) => `<path d="${line(pts)}" stroke="${P.ink}" stroke-width="${f(1.8 * k)}" fill="none" stroke-linecap="round" opacity=".8"/><path d="${line(pts)}" stroke="${P.crack}" stroke-width="${f(0.6 * k)}" fill="none" opacity=".6" transform="translate(-.4,-.4)"/>`;
// ink "sock" paw with a wavy top edge (the Hollow got in through the feet)
export const sock = (x, y, r, top) => part(blob([[x - r, y - 1], [x - r * 1.05, y - top * 0.6], [x - r * 0.6, y - top - 1.5], [x - r * 0.1, y - top + 1.5], [x + r * 0.45, y - top - 1], [x + r * 1.05, y - top * 0.5], [x + r * 1.5, y - 2.5], [x + r * 1.2, y + 0.6], [x - r * 0.3, y + 0.8]]), P.ink, { lw: 2.3, sh: 2, rimC: '#9886d6', rimA: 0.7, grain: 0,
  tex: `<path d="M${f(x + r * 0.3)} ${f(y - 0.5)} l0 -2.5 M${f(x + r * 0.9)} ${f(y - 0.5)} l0 -2.2" stroke="#2e2440" stroke-width="1.1"/>` });
// husk mask paint: pale lichen bark with carved grain, lichen spots, a crack, under-plane shade
export const huskMask = (d, M, o = {}) => part(d, o.col || P.mask, { sh: 4, rimA: 1, rimC: '#f2f6ff', grain: 0.12, tex: (o.tex || '')
  + (o.grain || []).map((g) => `<path d="${line(g.map(([x, y]) => M(x, y)))}" stroke="${P.maskDk}" stroke-width="1.05" fill="none" opacity=".7"/>`).join('')
  + (o.crack ? `<path d="${line(o.crack.map(([x, y]) => M(x, y)))}" stroke="${VOID}" stroke-width="1.2" fill="none" opacity=".85"/>` : '')
  + (o.lichen || []).map(([x, y, rx, ry, n, s]) => specks(...M(x, y), rx, ry, n, P.lichen, { seed: s, r: 2, a: 0.85 })).join('') });

// generic finish: hurt flash + recoil; death = mask clatters off, body breaks to ink wisps + ash, a lichen sprout + warm mote remain
export function finishA(st, body, eyes, o = {}) {
  const die = st.die || 0, hurt = st.hurt || 0, W = o.w || 40;
  let b = body, e = eyes;
  if (hurt) { b = `<g transform="rotate(-7 ${-W * 0.3} 0) translate(-5,0)"><g filter="url(#hurtF)">${b}</g></g>`; e = `<g transform="rotate(-7 ${-W * 0.3} 0) translate(-5,0)">${e}</g>`; }
  if (die > 0) {
    const r = rng(o.seed || 5); let wisp = '';
    for (let i = 0; i < 9; i++) { const x = (r() - 0.5) * W * 1.4, y0 = -o.h * (0.3 + 0.5 * r()), up = die * (20 + 30 * r()); wisp += `<path d="M${f(x)} ${f(y0 - up)} q${f(4 + r() * 4)} ${f(-6 - r() * 6)} ${f(-1)} ${f(-14 - r() * 8)}" stroke="${P.ink}" stroke-width="${f(5 * (1 - die) + 1.5)}" fill="none" stroke-linecap="round" opacity="${f(0.85 * (1 - die * 0.7))}"/>`; }
    for (let i = 0; i < 8; i++) { const x = (r() - 0.5) * W * 1.6, y = -o.h * r() - die * 18 * r(); wisp += `<rect x="${f(x)}" y="${f(y)}" width="3" height="2" fill="#b9bdc8" opacity="${f(0.7 * (1 - die * 0.5))}" transform="rotate(${f(r() * 90)} ${f(x)} ${f(y)})"/>`; }
    b = `<g opacity="${f(1 - Math.min(1, die * 1.1))}" transform="translate(0,${f(die * o.h * 0.25)}) scale(1,${f(1 - die * 0.45)})">${b}</g>` + wisp;
    const dm = Math.min(1, die * 1.3);
    if (o.mask) b += `<g transform="translate(${f(o.mx + dm * 8)},${f(o.my + (-o.my - 5) * dm)}) rotate(${f(dm * (o.mrot ?? 80))})">${o.mask}</g>`;
    if (die > 0.6) { const g = (die - 0.6) / 0.4; b += glow(-6, -6, 26 * g, 14 * g, '#ffd27a', 0.45) + `<path d="M-8 0 q-1 -8 2 -${f(12 * g)}" stroke="#6fae5a" stroke-width="2" fill="none"/><path d="M-6 ${f(-10 * g)} q6 -4 9 0 q-5 3 -9 0Z" fill="#8fd06a" stroke="#3f7a46" stroke-width=".8"/>`; }
    e = `<g opacity="${f(Math.max(0, 1 - die * 1.6))}">${e}</g>`;
  }
  return { b, e };
}
const tele = (x0, x1, tl, y = 3) => `<path d="M${x0} ${y} Q${f((x0 + x1) / 2)} ${f(y - 4 - 6 * tl)} ${f(x1)} ${y}" stroke="#ff5a3c" stroke-width="${f(2 + 2 * tl)}" fill="none" stroke-dasharray="8 6" opacity="${f(0.4 + 0.5 * tl)}"/><ellipse cx="${f(x1 - 6)}" cy="${y}" rx="${f(14 + 8 * tl)}" ry="5" fill="#ff5a3c" opacity="${f(0.15 + 0.2 * tl)}"/>`;
export const teleRing = (rx, tl, x = 0) => `<ellipse cx="${x}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.36)}" fill="#ff5a3c" opacity="${f(0.1 + 0.12 * tl)}"/><ellipse cx="${x}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.36)}" fill="none" stroke="#ff5a3c" stroke-width="2.6" opacity="${f(0.5 + 0.4 * tl)}"/><ellipse cx="${x}" cy="1" rx="${f(rx * tl)}" ry="${f(rx * 0.36 * tl)}" fill="#ff5a3c" opacity=".22"/>`;

// ============================ FELL WOLF (Husk) ============================
// story: one of the hill wolves, drained; the Hollow wears its face as a pale bark husk. signature: long bark-husk snout held LOW,
// a frosted scruff collar, one torn flopped ear, a heavy ink-dipped plume tail. personality: hunched slinking lope, head low, tail drags.
export function wolfA(st = {}, K = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2.4 + tl * 5;
  const FUR = K.fur || P.fur, RU = K.ruff || P.ruff, C = { fur: FUR, dk: K.dk || P.furDk, tick: mix(FUR, '#120d22', 0.55), hi: mix(FUR, '#e6eef8', 0.45) };
  let b = shadow(42, 0) + `<ellipse cx="0" cy="0" rx="34" ry="6" fill="${P.ink}" opacity=".3"/>`;
  // tail: heavy plume, droops, ink-dipped tip + drip
  const tw = s1 * 3 - tl * 12;
  const tail = furry([[-24, -38 + bob], [-42, -44 + bob + tw * 0.3], [-58, -38 + tw * 0.7], [-64, -24 + tw], [-58, -12 + tw * 0.7], [-50, -20 + tw * 0.6], [-40, -28 + bob * 0.5], [-28, -27 + bob]], 3.4, -1, 12, [1, 1, 1, 1, 0, 0, 0, 0], 0.7);
  b += part(tail, C.fur, { sh: 4, tex: `<path d="M-90 ${f(-26 + tw)} Q-60 ${f(-28 + tw * 0.9)} -46 ${f(-8 + tw)} L-90 0Z" fill="${P.ink}" opacity=".92" filter="url(#sb2)"/>`
    + ticks([[-32, -40 + bob, 9, 3.3, 1.8], [-44, -38 + bob, 9, 3.6, 1.8], [-52, -32 + tw * 0.6, 8, 4.0, 1.6]], C.tick, 0.65) + ticks([[-30, -43 + bob, 9, 3.3, 1.5], [-42, -43 + bob, 8, 3.5, 1.5]], C.hi, 0.55) });
  if (tl < 0.5) b += `<path d="M-57 ${f(-12 + tw * 0.6)} q-1 5 0.5 9" stroke="${P.ink}" stroke-width="2.6" stroke-linecap="round" fill="none"/><ellipse cx="-56" cy="${f(-0.5 + tw * 0.6)}" rx="1.6" ry="2" fill="${P.ink}"/>`;
  const leg = (x, y0, ph, far, r1 = 6.5) => { const sw = Math.sin(ph) * 6 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 4 * (1 - tl), px = x + sw - tl * 4, py = -lift;
    return part(limb(x, y0 + bob, px, py - 4, r1, 4.8, far ? 1 : -1), far ? C.dk : C.fur, { lw: 2.5, sh: 3, rim: far ? 0 : 1.6 }) + sock(px, py, 5.4, 9); };
  b += leg(14, -24, a + Math.PI, true) + leg(-22, -22, a, true);
  // body: one clean bean (front higher), belly fringe tufts
  const body = furry([[22, -18 + bob], [26, -34 + bob], [14, -48 + bob], [-6, -47 + bob], [-24, -41 + bob], [-32, -30 + bob], [-26, -17 + bob], [-4, -14 + bob]], 3.4, -1, 5, [0, 0, 1, 1, 0, 0, 1, 1], 0.6);
  b += part(body, C.fur, { sh: 7, tex: `<ellipse cx="-4" cy="${f(-12 + bob)}" rx="30" ry="7" fill="${P.ink}" opacity=".45" filter="url(#sb2)"/>`
    + ticks([[-22, -34 + bob, 10, 2.9, 2], [-12, -38 + bob, 11, 3.0, 2], [-1, -41 + bob, 11, 3.05, 2], [-16, -26 + bob, 9, 2.7, 2], [-4, -28 + bob, 10, 2.8, 2], [8, -31 + bob, 9, 2.9, 2]], C.tick, 0.6)
    + ticks([[-16, -43 + bob, 10, 3.1, 1.8], [-2, -45 + bob, 10, 3.15, 1.8], [10, -46 + bob, 8, 3.2, 1.6]], C.hi, 0.55) });
  // hackles: ragged spine tufts, rise + fan on the tell
  const hk = 1 + tl * 1.4;
  for (let i = 0; i < 4; i++) { const x = 6 - i * 9, y = -46 + bob + i * 1.8, h = (5 + (i === 1 ? 3 : 0)) * hk; b += part(`M${f(x - 6)} ${f(y + 3)} Q${f(x - 2)} ${f(y - h * 0.5)} ${f(x - 8 - tl * 2)} ${f(y - h)} Q${f(x + 3)} ${f(y - h * 0.4)} ${f(x + 3)} ${f(y + 3)}Z`, RU, { lw: 2.1, sh: 2, grain: 0, rimA: 0.9 }); }
  // near haunch (clean ellipse) + near legs
  const hp = Math.sin(a) * 2;
  b += part(ell(-20 + hp * 0.3, -27 + bob, 10.5, 11.5), C.fur, { sh: 4, rim: 1.8, tex: ticks([[-26, -30 + bob, 9, 2.2, 1.8], [-21, -22 + bob, 8, 2.0, 1.6]], C.tick, 0.55) + veins([[-27, -19 + bob], [-23, -25 + bob], [-25, -31 + bob]], 1) });
  b += leg(-20, -20, a + Math.PI, false, 5.2) + leg(10, -24, a, false);
  // head + scruff collar
  const hx = 40 - tl * 4, hy = -38 + bob * 0.6 + tl * 7;
  if (K.mane) { // a crown of pale dead branches rising from the scruff (miniboss)
    for (const [x0, y0, ang, len, w] of [[-34, -6, -2.0, 30, 4], [-28, -12, -1.75, 36, 4.4], [-20, -16, -1.5, 40, 4.6], [-12, -18, -1.25, 34, 4.2], [-38, 2, -2.3, 26, 3.6], [-6, -16, -1.05, 26, 3.6]]) {
      const x = hx + x0, y = hy + y0, x2 = x + Math.cos(ang) * len * (1 + tl * 0.2), y2 = y + Math.sin(ang) * len * (1 + tl * 0.2);
      b += rod(`M${f(x)} ${f(y)} Q${f((x + x2) / 2 - 4)} ${f((y + y2) / 2)} ${f(x2)} ${f(y2)} M${f((x + x2) / 2 - 2)} ${f((y + y2) / 2)} l${f(-7)} ${f(-6)}`, '#c9cabb', w, { lw: 2.2 }); }
  }
  const ruff = furry([[hx - 30, hy - 8], [hx - 24, hy - 24], [hx - 10, hy - 26], [hx - 2, hy - 10], [hx - 4, hy + 8], [hx - 14, hy + 16], [hx - 26, hy + 12]], 4.2, -1, 21, null, 0.5);
  b += part(ruff, RU, { sh: 4, rimA: 0.9, tex: ticks([[hx - 24, hy - 10, 9, 1.0, 1.8], [hx - 19, hy, 10, 1.3, 1.8], [hx - 15, hy + 8, 8, 1.6, 1.6], [hx - 11, hy - 14, 8, 0.9, 1.6]], mix(RU, '#150f28', 0.5), 0.55) + specks(hx - 18, hy - 6, 12, 14, 7, '#f2f6fb', { seed: 4, r: 1.2, a: 0.6 }) });
  const flop = Math.sin(a + 0.8) * 3;
  b += part(blob([[hx - 14, hy - 10], [hx - 21, hy - 25], [hx - 18, hy - 38 + tl * 8], [hx - 9, hy - 24], [hx - 5, hy - 14]]), C.dk, { lw: 2.4, sh: 3, rim: 1.2 });
  b += part(ell(hx - 6, hy - 7, 15.5, 14.5), C.fur, { sh: 5, tex: ticks([[hx - 15, hy - 13, 8, 2.6, 1.6], [hx - 11, hy - 3, 7, 2.4, 1.6]], C.tick, 0.5) });
  b += part(blob([[hx - 8, hy - 17], [hx - 10, hy - 31], [hx - 4, hy - 41 + tl * 9], [hx + 4, hy - 35 + tl * 6], [hx + 11 + flop, hy - 31 + tl * 5], [hx + 4, hy - 26], [hx + 3, hy - 17]]), C.fur, { lw: 2.4, sh: 3,
    tex: `<path d="M${f(hx - 4)} ${f(hy - 34)} Q${f(hx - 1)} ${f(hy - 27)} ${f(hx - 2)} ${f(hy - 19)}" stroke="${C.tick}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` });
  b += `<path d="M${f(hx + 4.5 + flop * 0.5)} ${f(hy - 34 + tl * 6)} l3.2 2.6 l-3.8 1" fill="${C.tick}" stroke="${mix(C.fur, '#170c26', 0.6)}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const M = (x, y) => [hx + x * 1.08, hy + y * 1.08];
  const mask = blob([M(-12, -14), M(-3, -21), M(9, -19), M(16, -12), M(26, -5.5), M(33, -1), M(36, 2.5), M(32, 5), M(21, 7.5), M(10, 10), M(0, 10), M(-8, 6), M(-13, -2)]);
  const maskSvg = huskMask(mask, M, { tex: `<path d="${line([M(-4, -19), M(12, -14), M(32, -1)])}" stroke="#f0f0e4" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/><path d="${line([M(-12, 2), M(8, 8), M(32, 5)])}" stroke="${P.maskDk}" stroke-width="7" fill="none" opacity=".6" filter="url(#sb2)"/>`,
    grain: [[[0, -10], [14, -6], [28, 0]], [[2, 1], [14, 3], [26, 4]]], crack: [[-2, -18], [1, -13], [-1, -10], [3, -6]], lichen: [[6, -13, 8, 4, 5, 8], [22, 2, 6, 3, 3, 2]] })
    + socket(blob([M(-3, -8), M(4, -13), M(12, -10), M(10, -4), M(2, -3)])) + socket(blob([M(15, -8), M(20, -10), M(23, -6), M(18, -3)]))
    + (K.eye3 ? socket(ell(...M(9, -15.5), 2.6, 2.4)) + `<path d="${line([M(-8, -16), M(2, -6), M(6, 4)])}" stroke="${VOID}" stroke-width="1.6" fill="none"/>` : '');
  b += maskSvg;
  const es = tl > 0.3 ? 'slit' : 'almond', er = 2.6 + tl * 1, EC = K.eye;
  const E1 = M(4.5, -7.5), E2 = M(19, -6.5);
  let e = eye(E1[0], E1[1], er, { shape: es, rot: -16, col: EC }) + eye(E2[0], E2[1], er * 0.7, { shape: es, rot: -18, col: EC });
  if (K.eye3) { const E3 = M(9, -15.5); e += eye(E3[0], E3[1], er * 0.7, { col: EC }); }
  if (st.hurt) e = eye(E1[0], E1[1], 2.5, { shape: 'squint', col: EC }) + eye(E2[0], E2[1], 1.8, { shape: 'squint', col: EC });
  if (tl > 0) b = tele(40, 90 + 40 * tl, tl) + b;
  return finishA(st, b, e, { w: 80, h: 64, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${maskSvg}</g>` : '', mx: hx, my: hy, seed: 3 });
}
