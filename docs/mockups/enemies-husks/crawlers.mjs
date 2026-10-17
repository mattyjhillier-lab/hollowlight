// HUSKS options: (3) ROOT CRAWLER A/B/C (slow tank, root-slam ring; 2 eyes WIDE apart, LOW; lurch-pause). Mock-up drawing code only.
import { K, P, S, locks, sock, husk, knotSocket, strap, sprout, moss, lichen, thorn, finish, tRing, furry, blob, line, ell, circ, limb, eye, shadow, mix, rng, specks, f, TAU, VOID } from './kit.mjs';

const eyes2 = (E1, E2, r1 = 2.6, r2 = 2.2) => (tl, hurt) => hurt ? eye(...E1, r1, { shape: 'squint' }) + eye(...E2, r2 * 0.9, { shape: 'squint' }) : eye(...E1, r1 + tl * 0.8, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -6 }) + eye(...E2, r2 + tl * 0.6, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -8 });
// lurch-pause gait: legs plant in pairs, body surges forward then settles; on the tell it rears and slams (ring)
const gait = (st) => { const a = (st.ph || 0) * TAU, tl = st.tele || 0; return { a, tl, surge: Math.max(0, Math.sin(a)) * 3, rock: Math.sin(a) * 2.2, rear: tl * 10 }; };

// A (recommended) ROOTBACK: a heavy badger that carries a dead STUMP grown into its back; three broken root PRONGS stick up from the stump
// (the silhouette hook), moss on the rim. Its husk is a wide flat bark plate low on the face with two wide-set sockets. Heavy plod, rocks.
export function crawlerA(st = {}) {
  const { a, tl, surge, rock, rear } = gait(st), FU = '#4b5168', DK = '#30354a';
  let b = shadow(46, 0) + `<ellipse cx="0" cy="0" rx="38" ry="6" fill="${K.ink}" opacity=".32"/>`;
  if (tl > 0) b = tRing(70, tl) + b;
  const by = -20 - surge * 0.4 - rear * 0.3;
  const leg = (x, ph, far) => { const sw = Math.sin(ph) * 4 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 3 * (1 - tl); return S(line([[x, by + 2], [x + sw, -lift - 4]]), far ? DK : FU, 11, { lw: 2.6 }) + sock(x + sw, -lift, 6, 8); };
  b += leg(20, a + Math.PI, true) + leg(-22, a, true) + leg(-16, a + Math.PI) + leg(24, a);
  // body: low wide dome
  b += `<g transform="rotate(${f(rock - rear * 0.6)} 0 ${f(by)})">`;
  b += P(furry([[34, by + 6], [32, by - 8], [16, by - 16], [-10, by - 17], [-30, by - 12], [-38, by + 0], [-32, by + 10], [0, by + 12]], 3.6, -1, 41, [0, 1, 1, 1, 1, 1, 1, 0], 0.5), FU, { sh: 7, rim: 3.2, rimA: 1,
    tex: locks([[-26, by - 4, 10, 2.8], [-14, by - 8, 10, 3.0], [0, by - 9, 10, 3.0], [-20, by + 4, 9, 2.7], [10, by - 2, 9, 3]], mix(FU, '#0e0a1c', 0.5), 0.55) + `<path d="M-34 ${f(by + 2)} Q0 ${f(by - 4)} 30 ${f(by + 2)}" stroke="#a6aec0" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>` });
  // the stump shell + 3 broken root prongs
  const sx = -6, sy = by - 14;
  for (const [x, ang, len, w] of [[-14, -2.3, 22, 5], [-2, -1.65, 30, 5.6], [10, -1.15, 20, 4.8]]) { const x2 = sx + x + Math.cos(ang) * len, y2 = sy - 8 + Math.sin(ang) * len; b += S(`M${f(sx + x)} ${f(sy - 6)} Q${f(sx + x + Math.cos(ang) * len * 0.5 + 3)} ${f(sy - 6 + Math.sin(ang) * len * 0.55)} ${f(x2)} ${f(y2)}`, '#6b6672', w, { lw: 2.6 }) + `<path d="M${f(x2 - 2)} ${f(y2 + 1)} l2 -3 l2 3" fill="#cfcbbb" stroke="#4a4552" stroke-width="1"/>`; }
  b += P(blob([[sx - 22, sy + 6], [sx - 22, sy - 6], [sx - 14, sy - 12], [sx + 14, sy - 12], [sx + 22, sy - 6], [sx + 22, sy + 6], [sx, sy + 9]]), '#77717b', { sh: 4, tex: [0, 1, 2, 3, 4].map((i) => `<path d="M${f(sx - 16 + i * 8)} ${f(sy + 6)} q2 -8 0 -16" stroke="#4d4855" stroke-width="1.6" fill="none" opacity=".8"/>`).join('') });
  b += P(ell(sx, sy - 11, 22, 5), '#a49c8a', { lw: 2.4, sh: 1, rim: 1.4, tex: [3, 6, 9].map((r) => `<ellipse cx="${sx}" cy="${f(sy - 11)}" rx="${r * 2}" ry="${f(r * 0.45)}" fill="none" stroke="#7a715f" stroke-width="1"/>`).join('') });
  b += moss(sx - 16, sy + 2, 9, 8, 5) + lichen(sx + 14, sy - 2, 3.6) + lichen(sx - 4, sy - 12, 2.6);
  b += '</g>';
  // head + wide flat husk plate
  const hx = 34 + surge * 0.3, hy = by - 2 + rear * 0.2;
  b += P(ell(hx - 4, hy, 14, 13), FU, { sh: 5 }) + P(blob([[hx - 14, hy - 8], [hx - 18, hy - 18], [hx - 8, hy - 11]]), DK, { lw: 2.2, sh: 2 });
  const M = (x, y) => [hx + x, hy + y + rear * 0.3];
  let ms = strap([M(-8, -8), M(-14, -2), M(-14, 8)], 3, { seed: 2 });
  ms += husk(blob([M(-11, -12), M(0, -16), M(10, -14), M(19, -9), M(25, -1), M(22, 6), M(12, 9), M(-2, 9), M(-11, 4), M(-13, -4)]), M, { grain: [[[-8, -9], [4, -12], [16, -8]], [[-8, 2], [-4, 7]], [[16, 1], [19, 5]]], crack: [[6, -15], [8, -9], [5, -5]], lichen: [[17, -8, 3], [4, 6, 2.6]], chip: [[24, 1, 3.6, 0], [-12, -6, 3.6, 3.4]], under: [[-8, 7], [8, 8], [20, 5]], hi: [[-8, -12], [6, -14]] })
    + knotSocket(blob([M(-8, -6), M(-2, -10), M(3, -6), M(-1, -1), M(-6, -1)]), 1.7) + knotSocket(blob([M(12, -3), M(16, -5), M(19, -1), M(14, 1)]), 1.4);
  ms += sprout(...M(-4, -15), -2.0, 0.8);
  b += ms;
  return finish(st, b, eyes2(M(-2.6, -5.4), M(15.4, -1.8), 2.8, 2)(tl, st.hurt), { w: 84, h: 50, seed: 41, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>` : '', mx: hx, my: hy });
}

// B BURLTOISE: a tortoise whose shell has become one huge knobbly BURL (round bulging knots, a shelf of bracket fungus, a crack of cold
// violet ink); its husk is a short beaked bark plate. Stump legs. Slowest, most inevitable; on the tell it lifts and drops its front (ring).
export function crawlerB(st = {}) {
  const { a, tl, surge, rock, rear } = gait(st), SK = '#57606d', DK = '#373e4b';
  let b = shadow(46, 0) + `<ellipse cx="0" cy="0" rx="38" ry="6" fill="${K.ink}" opacity=".32"/>`;
  if (tl > 0) b = tRing(70, tl) + b;
  const by = -14 - surge * 0.3 - rear * 0.2;
  const leg = (x, ph, far) => { const sw = Math.sin(ph) * 3.5 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 2.6 * (1 - tl); return S(line([[x, by], [x + sw, -lift - 4]]), far ? DK : SK, 13, { lw: 2.6 }) + sock(x + sw, -lift, 6.6, 7); };
  b += leg(18, a + Math.PI, true) + leg(-20, a, true);
  // burl shell
  b += `<g transform="rotate(${f(rock * 0.6 - rear * 0.4)} 0 ${f(by)})">`;
  const shell = blob([[30, by + 2], [30, by - 12], [20, by - 26], [4, by - 32], [-14, by - 30], [-30, by - 20], [-36, by - 6], [-32, by + 4], [0, by + 6]]);
  const knobs = [[-18, by - 22, 8], [2, by - 26, 9], [18, by - 16, 7], [-28, by - 8, 6], [-6, by - 12, 7], [12, by - 4, 6]].map(([x, y, r]) => P(circ(x, y, r), '#7a7480', { lw: 2.2, sh: 3, rim: 1.8, tex: `<ellipse cx="${x}" cy="${y}" rx="${f(r * 0.5)}" ry="${f(r * 0.35)}" fill="none" stroke="#4e4856" stroke-width="1.1"/><circle cx="${x}" cy="${y}" r="1.4" fill="#4e4856"/>` })).join('');
  b += P(shell, '#6c6672', { sh: 8, rim: 3, rimA: 1, tex: `<path d="M-30 ${f(by)} Q0 ${f(by + 4)} 28 ${f(by - 2)}" stroke="#3e3946" stroke-width="5" fill="none" opacity=".55"/>` }) + knobs;
  b += `<path d="M-8 ${f(by - 30)} l3 8 l-4 6 l4 7" stroke="${K.ink}" stroke-width="2.4" fill="none"/><path d="M-8 ${f(by - 30)} l3 8 l-4 6 l4 7" stroke="${K.crack}" stroke-width=".9" fill="none" transform="translate(.6,.2)"/>`;
  b += P(`M-34 ${f(by - 10)} q-10 -2 -12 4 q8 3 14 0Z`, '#b8b3a0', { lw: 2, sh: 1.5, rim: 1.2, tex: `<path d="M-44 ${f(by - 7)} q6 -1 10 -1" stroke="#8b846d" stroke-width="1"/>` }) + P(`M-30 ${f(by - 18)} q-8 -2 -10 3 q6 3 11 0Z`, '#b8b3a0', { lw: 2, sh: 1.5, rim: 1.2 });
  b += moss(10, by - 30, 10, 7, 9) + '</g>';
  b += leg(-16, a + Math.PI) + leg(22, a);
  // head on a neck
  const hx = 36 + surge * 0.4, hy = -22 - rear * 0.8;
  b += P(limb(20, by - 4, hx - 6, hy + 4, 7, 7.5), SK, { sh: 3, tex: `<path d="M24 ${f(by - 8)} q6 -2 10 -6" stroke="${DK}" stroke-width="1.4" fill="none"/>` });
  b += P(ell(hx - 2, hy, 12.5, 11.5), SK, { sh: 4 });
  const M = (x, y) => [hx + x, hy + y];
  let ms = husk(blob([M(-9, -9), M(4, -12), M(14, -8), M(19, 0), M(14, 4), M(16, 8), M(6, 9), M(-6, 7), M(-10, -1)]), M, { grain: [[[-6, -6], [6, -8], [16, -2]], [[-4, 4], [8, 6]]], lichen: [[-5, 4, 2.6]], chip: [[19, 1, 3, 0.2]], hi: [[-5, -9], [6, -10]] })
    + knotSocket(blob([M(-5, -4), M(0, -6), M(3, -2), M(-2, 0)]), 1.5) + knotSocket(blob([M(8, -4), M(12, -5), M(14, -1), M(10, 0)]), 1.4);
  b += ms;
  return finish(st, b, eyes2(M(-1, -2.8), M(11, -2.4), 2.4, 2)(tl, st.hurt), { w: 80, h: 50, seed: 43, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>` : '', mx: hx, my: hy });
}

// C MOLEBORE: a fat blind mole with huge ink DIGGING CLAWS; its husk is a twisted spiral ROOT-DRILL snout (a cone of wound bark), two tiny
// wide-set sockets at its base. It ploughs a furrow; on the tell it rears onto its haunches and drives the drill down (ring of root spikes).
export function crawlerC(st = {}) {
  const { a, tl, surge, rock, rear } = gait(st), FU = '#4f5670', DK = '#33384e';
  let b = shadow(44, 0) + `<ellipse cx="0" cy="0" rx="36" ry="6" fill="${K.ink}" opacity=".32"/>`;
  if (tl > 0) b = tRing(70, tl) + b + [0, 1, 2, 3, 4].map((i) => thorn(-40 + i * 20, 2, -1.57 + (i - 2) * 0.2, 6 + tl * 8, 3, K.strap)).join('');
  const by = -22 - rear * 0.8;
  // body: a plump pear, rising on the tell
  b += `<g transform="rotate(${f(rock * 0.5 - rear * 2.2)} -20 0)">`;
  b += sock(-24, 0, 6, 6) + sock(-10, 0, 6, 6);
  b += P(furry([[24, by + 14], [26, by - 4], [14, by - 18], [-8, by - 20], [-28, by - 12], [-36, by + 4], [-30, by + 20], [0, by + 22]], 2.6, -1, 45, [0, 1, 1, 1, 1, 1, 1, 0], 0.4), FU, { sh: 7, rim: 3.2, rimA: 1,
    tex: specks(-6, by, 26, 14, 18, mix(FU, '#0e0a1c', 0.4), { seed: 3, r: 1.6, a: 0.6 }) + `<path d="M-30 ${f(by + 10)} Q-6 ${f(by + 20)} 20 ${f(by + 12)}" stroke="#a6aec0" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>` + specks(-10, by - 6, 16, 6, 5, K.lichen, { seed: 8, r: 2, a: 0.7 }) });
  // digging claws (big spade paws)
  const paw = (x, y, far) => P(blob([[x - 6, y - 6], [x + 6, y - 7], [x + 12, y - 2], [x + 13, y + 2], [x + 6, y + 3], [x - 6, y + 2]]), far ? '#221c30' : K.ink, { lw: 2.2, sh: 2, rimC: K.inkRim, rimA: 0.6, grain: 0 }) + [0, 1, 2].map((i) => `<path d="M${f(x + 9 + i * 0.5)} ${f(y - 4 + i * 2.6)} l6 1" stroke="#c9c6d4" stroke-width="1.8" stroke-linecap="round"/>`).join('');
  const pw = Math.sin(a) * 5 * (1 - tl);
  b += paw(16 + pw, -4, true) + paw(22 - pw, -2 - surge);
  // drill husk
  const hx = 24, hy = by - 2;
  const M = (x, y) => [hx + x, hy + y];
  let ms = strap([M(-6, -8), M(-12, -12), M(-16, -6)], 2.8, { seed: 5 });
  const d = blob([M(-6, -12), M(6, -12), M(18, -8), M(30, -3), M(40, 1), M(30, 4), M(18, 8), M(4, 10), M(-6, 8), M(-9, -2)]);
  ms += husk(d, M, { grain: [[[2, -11], [6, -4], [4, 6]], [[12, -9], [15, -2], [13, 6]], [[22, -5], [25, 0], [23, 4]], [[31, -2], [33, 1], [32, 3]]], gw: 1.8, lichen: [[-2, 6, 2.8]], chip: [[-8, -6, 3.4, 3.4]], under: [[-4, 8], [14, 8], [32, 3]], hi: [[-2, -11], [14, -10], [28, -4]] });
  ms += knotSocket(ell(...M(-1, -4), 2.6, 2.2), 1.4) + knotSocket(ell(...M(9, -5), 2.2, 2), 1.3);
  b += ms + '</g>';
  // rotated eye positions (pivot -20,0)
  const R = (p) => { const t = (rock * 0.5 - rear * 2.2) * Math.PI / 180, dx = p[0] + 20, dy = p[1]; return [-20 + dx * Math.cos(t) - dy * Math.sin(t), dx * Math.sin(t) + dy * Math.cos(t)]; };
  return finish(st, b, eyes2(R(M(-1, -4)), R(M(9, -5)), 2, 1.7)(tl, st.hurt), { w: 76, h: 52, seed: 45, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>` : '', mx: hx, my: hy });
}
