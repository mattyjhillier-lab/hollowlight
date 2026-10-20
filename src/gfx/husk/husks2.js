// HUSKS batch 2 creatures (LOCKED picks, docs/LOCKED.md 2026-10-18 'HUSKS BATCH 2 picks'): Stoat Piper (ranged), Puffback Toad (area denial),
// Bramble Hart (charger). Ported from the locked mock-up rigs (docs/mockups/enemies-husks/ranged.mjs spitA, bulbs.mjs bulbA, chargers.mjs hartA).
// Each fn(st) -> { b: body svg, e: eye svg }; st = { ph walk phase 0..1, tele 0..1, hurt, noMask, maskOnly }. Origin = ground under the feet,
// facing +x, y up negative, design units (du). Game changes vs the mock-ups: no telegraph decals (the scene draws the aim tick / fuse ring /
// charge lane above the vignette), the mask is built in pre-rotated coordinates (so the knot-hole socket that the eye is baked into matches the
// drawn socket on every frame), sockets are polygon blobs (paint.sockRec reads point pairs), freed face on the death body, mask-only frame.
import { K, P, S, locks, sock, husk, knotSocket, strap, sprout, lichen, moss, thorn, finish, furry, blob, ell, circ, limb, eye, shadow, glow, mix, f, TAU, VOID } from './kit.js';

const RO = '#ff5a3c';
// polygon ellipse (sockRec needs point pairs; arcs would mis-read)
export const rblob = (cx, cy, rx, ry, n = 8, rot = 0) => { const p = []; for (let i = 0; i < n; i++) { const t = rot + (i / n) * TAU; p.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); } return blob(p); };
// rotate a point about (ox, oy) by t radians
const rotP = (ox, oy, t) => (x, y) => { const c = Math.cos(t), s = Math.sin(t), dx = x - ox, dy = y - oy; return [ox + dx * c - dy * s, oy + dx * s + dy * c]; };
// the freed face (death body, mask off): pale muzzle + one peacefully closed eye (same language as the batch 1 freedFace)
const freed = (x, y, fur, L = 0) => P(ell(x + 5 + L * 0.5, y + 3, 9 + L * 0.5, 6), mix(fur, '#dfe6f0', 0.55), { lw: 2, sh: 2, rim: 1, grain: 0 })
  + `<ellipse cx="${f(x + 12 + L)}" cy="${f(y + 1.5)}" rx="2.4" ry="1.9" fill="#1d1a26"/><path d="M${f(x - 5)} ${f(y - 6)} q3.4 2.8 7 0" stroke="#1d1a26" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;

// =============================== 4. STOAT PIPER (ranged) ===============================
// A STOAT PIPER: a stoat that stood up on its hind legs to watch for danger and never sat back down. Tall S-curve body, a long ink-tipped tail
// curled at its feet, and a husk grown into a long bark BLOWPIPE snout with ONE socket high on the brow. Tell: it rears taller, the pipe swings
// onto you and an ember glows inside the tip (red-orange = danger); recoil on the shot. Twitchy sentry.
export function stoatA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2, rear = tl * 6;
  const FU = '#525c78', DK = '#353c54', BE = '#9aa6bd';
  let b = shadow(24, 0) + `<ellipse cx="0" cy="0" rx="20" ry="5" fill="${K.ink}" opacity=".32"/>`;
  // tail curled on the ground behind (sways a little with the hop)
  const tw = s1 * 1.5;
  b += P(furry([[-6, -8], [-20, -6 + tw * 0.3], [-30, -12 + tw], [-34, -22 + tw], [-28, -26 + tw], [-24, -18 + tw * 0.5], [-14, -14], [-4, -16]], 2.6, -1, 51, [1, 1, 1, 1, 0, 0, 0, 0], 0.5), FU, { sh: 3, tex: `<path d="M-40 ${f(-30 + tw)} L-26 ${f(-30 + tw)} L-24 -16 L-40 -14Z" fill="${K.ink}" opacity=".92" filter="url(#sb2)"/>` + locks([[-22, -12, 8, 2.6], [-28, -18 + tw, 7, 2.0]], mix(FU, '#0e0a1c', 0.5), 0.5) });
  // hind feet: a small hop step (feet lift alternately)
  const l1 = Math.max(0, s1) * 2.2, l2 = Math.max(0, -s1) * 2.2;
  b += sock(-6, -l1, 5, 7) + sock(8, -l2, 5, 7);
  const by = -30 + bob - rear * 0.4;
  b += P(furry([[12, by + 26], [14, by + 6], [10, by - 12], [4, by - 22], [-8, by - 20], [-14, by - 4], [-14, by + 16], [-6, by + 28]], 2.8, -1, 53, [0, 0, 1, 1, 1, 1, 0, 0], 0.5), FU, { sh: 6, rim: 3, rimA: 1,
    tex: P(blob([[10, by + 22], [12, by + 4], [6, by - 14], [0, by - 8], [0, by + 12], [4, by + 24]]), BE, { lw: 0.01, nl: 1, sh: 2, rim: 0 }) + locks([[-8, by - 4, 10, 1.9], [-10, by + 8, 10, 1.7], [-6, by + 18, 8, 1.6]], mix(FU, '#0e0a1c', 0.5), 0.5) + locks([[-2, by - 14, 8, 2.2, 1.8]], mix(FU, '#e6eef8', 0.4), 0.45) });
  // little forepaws held up (pulled in on the tell)
  const pw = tl * 3;
  b += P(limb(8, by - 4, 16 - pw, by + 4 - pw, 3.4, 3), DK, { lw: 2, sh: 1.5, rim: 0 }) + P(circ(16.5 - pw, by + 4.5 - pw, 3.4), K.ink, { lw: 1.8, sh: 1, rimC: K.inkRim, rimA: 0.6 });
  // head
  const hx = 6 + tl * 2, hy = by - 30 - rear * 0.8;
  b += P(blob([[hx - 12, hy - 4], [hx - 16, hy - 16], [hx - 8, hy - 10]]), DK, { lw: 2.2, sh: 2 }) + P(ell(hx - 1, hy, 13.5, 12.5), FU, { sh: 5, tex: locks([[hx - 8, hy - 2, 7, 2.4], [hx - 6, hy + 6, 6, 2.2]], mix(FU, '#0e0a1c', 0.5), 0.5) }) + P(blob([[hx - 2, hy - 10], [hx + 2, hy - 20], [hx + 7, hy - 9]]), FU, { lw: 2.2, sh: 2 });
  // the blowpipe husk: points pre-rotated by the aim swing (the pipe drops onto you on the tell)
  const R = rotP(hx, hy, -tl * 0.12), M = (x, y) => R(hx + x, hy + y);
  let ms = strap([M(-8, -6), M(-12, 2), M(-10, 10)], 2.6, { seed: 6 });
  ms += husk(blob([M(-8, -10), M(4, -12), M(12, -6), M(32, -4), M(36, -6), M(38, -1), M(36, 3), M(30, 2), M(12, 5), M(2, 8), M(-8, 5), M(-11, -3)]), M,
    { grain: [[[-4, -8], [6, -9], [12, -4]], [[12, -2], [24, -1.5], [34, -2]], [[-4, 4], [8, 4]]], crack: [[6, 6], [8, 2], [11, 3]], knot: [[22, 0, 1.4]], lichen: [[-4, 3, 2.6]], chip: [[-10, -6, 3, 3.4], [37, 2, 2.4, 0.4]], under: [[-4, 6], [10, 4], [32, 2]], hi: [[-4, -10], [6, -10], [12, -6]] });
  const [tx, ty] = M(38, -1.5);
  ms += `<path d="${rblob(tx, ty, 1.8, 3.4, 8)}" fill="${VOID}"/>`; // the pipe bore
  ms += sprout(...M(0, -11), -1.9, 0.75);
  ms += knotSocket(blob([M(-2, -6), M(3, -9), M(8, -6), M(5, -2), M(0, -2)]));
  if (st.maskOnly) return { b: `<g transform="translate(${f(-hx - 10)},${f(-hy)})">${ms}</g>`, e: '' };
  if (!st.noMask) {
    b += ms;
    if (tl > 0) b += glow(tx, ty, 5 + tl * 6, 5 + tl * 6, RO, 0.9) + `<circle cx="${f(tx)}" cy="${f(ty)}" r="${f(1 + tl * 1.4)}" fill="#ffd0a0"/>`; // ember in the tip
  } else b += freed(hx, hy - 2, FU, 1);
  const E = M(3, -5.2), e = st.hurt ? eye(...E, 2.6, { shape: 'squint' }) : eye(...E, 2.9 + tl * 0.8, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -8 });
  return finish(st, b, e, { w: 40, h: 76, seed: 51 });
}

// =============================== 5. PUFFBACK TOAD (area denial) ===============================
// A PUFFBACK TOAD: a pond toad the Hollow filled with spores: a pale spore BLISTER rides its back (the silhouette hook), spore motes leak from it;
// a wide flat husk with three small sockets in a triangle. Heavy hop-waddle, the blister breathes; on the tell it squats, the blister swells and
// cracks glow red-orange while the ring fills. LOCK NOTE (Matt): the body must stay readable under the blister: vs the mock-up the blister is
// smaller and sits further back, the toad body is wider with a bent frog hind leg, a pale throat/belly band and warts, so it reads 'toad + sac'.
const crk = (x, y, r, tl) => {
  if (tl <= 0) return '';
  let s = '', q = 3;
  const R = () => { q = (q * 1664525 + 1013904223) % 4294967296; return q / 4294967296; };
  for (let i = 0; i < 4; i++) {
    const a0 = R() * TAU, pts = [[x + Math.cos(a0) * r * 0.2, y + Math.sin(a0) * r * 0.2]];
    for (let k = 1; k < 4; k++) { const a = a0 + (R() - 0.5) * 0.9; pts.push([x + Math.cos(a) * r * k * 0.28, y + Math.sin(a) * r * k * 0.25]); }
    s += `<path d="M${pts.map(([px, py]) => `${f(px)} ${f(py)}`).join(' L')}" stroke="${RO}" stroke-width="${f(1.2 + tl * 1.2)}" fill="none" opacity="${f(0.5 + 0.5 * tl)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return s + glow(x, y, r * 0.8, r * 0.7, RO, 0.35 * tl);
};
export function toadA(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, hop = Math.max(0, Math.sin(a)) * 4 * (1 - tl), br = 1 + Math.sin(a * 2) * 0.03 + tl * 0.28;
  const SK = '#58627a', SKD = mix(SK, '#120d22', 0.3), BEL = '#b4bcbd', SAC = '#aab5a5', SACD = '#64705f';
  let b = shadow(32, 0) + `<ellipse cx="0" cy="0" rx="27" ry="5" fill="${K.ink}" opacity=".3"/>`;
  const y = -hop + tl * 2.5;
  // far hind leg, then the near bent frog leg (thigh + shin + ink sock)
  const kick = Math.max(0, -Math.sin(a)) * 3 * (1 - tl);
  b += P(ell(-14, -7 + y * 0.5, 9, 6), SKD, { sh: 2, rim: 0.8 });
  b += P(blob([[-26, -10 + y], [-20, -20 + y], [-8, -18 + y], [-4, -10 + y], [-12, -4 + y * 0.4]]), mix(SK, '#e6eef8', 0.08), { sh: 3, rim: 1.6, tex: `<path d="M-22 ${f(-12 + y)} q6 -4 12 -2" stroke="${SKD}" stroke-width="1.6" fill="none" opacity=".7"/>` })
    + P(limb(-14, -6 + y * 0.6, -22 - kick, -2, 3.6, 3), SKD, { lw: 2, sh: 1.5, rim: 0.8 }) + sock(-22 - kick, 0, 5.2, 4.5);
  // body: a wide flat toad (head end low and forward), warts, pale belly band
  const warts = [[-8, -22], [2, -25], [12, -21], [-16, -19], [18, -15], [6, -16]].map(([wx, wy], i) => `<circle cx="${wx}" cy="${f(wy + y)}" r="${1.4 + (i % 3) * 0.5}" fill="${SKD}" opacity=".7"/><circle cx="${wx - 0.5}" cy="${f(wy + y - 0.6)}" r="${0.6 + (i % 2) * 0.3}" fill="#9aa3b2" opacity=".6"/>`).join('');
  b += P(blob([[26, -12 + y], [22, -24 + y], [6, -29 + y], [-14, -27 + y], [-26, -16 + y], [-22, -6 + y], [0, -4 + y], [20, -6 + y]]), SK, { sh: 5, rim: 3, rimA: 1,
    tex: `<path d="M-20 ${f(-8 + y)} Q2 ${f(-1 + y)} 24 ${f(-9 + y)}" stroke="${BEL}" stroke-width="6" fill="none" opacity=".6" stroke-linecap="round"/>` + warts });
  // the spore blister (smaller + further back than the mock-up so the toad reads), breathing; cracks glow on the fuse
  const sx = -9, sy = -36 + y, sr = 14.5 * br;
  b += P(blob([[sx - sr, sy + 8], [sx - sr * 0.95, sy - sr * 0.45], [sx - sr * 0.25, sy - sr * 1.05], [sx + sr * 0.6, sy - sr * 0.85], [sx + sr, sy - sr * 0.1], [sx + sr * 0.8, sy + 8]]), SAC, { sh: 4, gloss: 0.5, rimC: '#eef6f0', rimA: 1,
    tex: `<circle cx="${f(sx - sr * 0.3)}" cy="${f(sy - 3)}" r="${f(sr * 0.22)}" fill="${SACD}" opacity=".55"/><circle cx="${f(sx + sr * 0.35)}" cy="${f(sy + 2)}" r="${f(sr * 0.16)}" fill="${SACD}" opacity=".55"/><circle cx="${f(sx + sr * 0.05)}" cy="${f(sy - sr * 0.55)}" r="${f(sr * 0.12)}" fill="${SACD}" opacity=".5"/>`
      + lichen(sx + 7, sy - 8, 2.6) + crk(sx, sy - 2, sr, tl) });
  for (let i = 0; i < 3; i++) b += `<circle cx="${f(sx - 4 + i * 5)}" cy="${f(sy - sr - 3 - i * 3 - Math.sin(a + i) * 2)}" r="${f(1.6 - i * 0.2)}" fill="${SAC}" opacity=".7"/>`;
  // front leg
  b += P(limb(16, -12 + y, 22, -2, 4.4, 3.8), SK, { lw: 2.3, sh: 2, rim: 1.2 }) + sock(23, 0, 5.4, 5);
  // the wide flat husk with three sockets in a triangle
  const hx = 24, hy = -21 + y, M = (x, y2) => [hx + x, hy + y2];
  let ms = strap([M(-8, -4), M(-14, -8), M(-18, -4)], 2.4, { seed: 3 });
  // wide FLAT bark plate (never a round shell), chipped front edge; three knot sockets in an UPWARD triangle (two low, one high between them:
  // a constellation, never two-eyes-and-a-mouth: faceless rule F3)
  ms += husk(blob([M(-12, -5), M(-8, -10), M(0, -9), M(7, -11), M(15, -8), M(21, -3), M(19, 3), M(9, 5), M(-3, 5), M(-11, 2)]), M, { grain: [[[-8, -6], [4, -7], [16, -4]], [[-8, 3], [6, 3], [16, 2]]], crack: [[13, -9], [14, -5], [12, -3]], lichen: [[-8, 1, 2.2], [17, -5, 1.8]], chip: [[20, 0, 3, 0.1], [-11, -2, 2.6, 3.3]], hi: [[-6, -8], [6, -9]] });
  // sockets sized for the WL6d eye gate (the first, smaller set measured eye 2.2-2.9:1 near the lantern on High)
  ms += knotSocket(rblob(...M(-3, -0.5), 5.0, 4.0, 8), 1.2) + knotSocket(rblob(...M(10.5, -1), 4.5, 3.7, 8, 0.3), 1.2) + knotSocket(rblob(...M(3.8, -7.8), 4.1, 3.4, 8, 0.6), 1.1);
  ms += sprout(...M(-4, -9), -2.0, 0.6);
  if (st.maskOnly) return { b: `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>`, e: '' };
  if (!st.noMask) b += ms; else b += freed(hx - 2, hy - 2, SK, 0);
  const E = [M(-3, -0.5), M(10.5, -1), M(3.8, -7.8)];
  const e = E.map((p, i) => (st.hurt ? eye(...p, 1.5, { shape: 'squint' }) : eye(...p, (i ? 1.4 : 1.7) + tl * 0.5, { shape: tl > 0.3 ? 'slit' : 'round' }))).join('');
  return finish(st, b, e, { w: 50, h: 58, seed: 31 });
}

// =============================== 6. BRAMBLE HART (charger) ===============================
// A BRAMBLE HART: a stag drained mid-leap; its antlers kept growing, into BRAMBLE: a lyre of thorny tines twice the size of its head (the hook),
// a long deer-skull husk, a rag of moss on one tine. Proud and still, then explosive: on the tell it lowers the crown (eyes swing LOW), scrapes,
// then charges in a straight line. Rig from the mock-up hoofRig: body bean on slim legs, neck to a big chibi head; the head + antlers rotate
// as one group on the tell, the mask is drawn in pre-rotated coordinates (sockets match), between the far and near antler.
export function hartA(st = {}) {
  const FU = '#56607a', DK = '#3a4157', AN = '#7c7883', AND = '#5a5662', LH = 34;
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2;
  let b = shadow(42, 0) + `<ellipse cx="0" cy="0" rx="32" ry="5" fill="${K.ink}" opacity=".3"/>`;
  if (tl > 0) b += `<path d="M14 2 q4 -5 9 -2 M18 -1 q3 -4 7 -2" stroke="#8a8f99" stroke-width="2" fill="none" opacity="${f(tl)}"/>`; // hoof scrape dust
  const by = -LH - 8 + bob + tl * 3;
  const leg = (x, ph, far, back) => { const sw = Math.sin(ph) * 6 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 5 * (1 - tl), px = x + sw + (back ? -tl * 3 : tl * 5), py = -lift;
    const pts = back ? [[x, by + 4], [x - 4, by + LH * 0.45], [px + 1, -LH * 0.3 - lift], [px, py - 4]] : [[x, by + 4], [x + 1, by + LH * 0.5], [px, py - 4]];
    return S(`M${pts.map(([q, r]) => `${f(q)} ${f(r)}`).join(' L')}`, far ? DK : FU, 6.4, { lw: 2.4 }) + sock(px, py, 3.8, 12); };
  b += leg(16, a + Math.PI, true) + leg(-18, a, true, true) + leg(-22, a + Math.PI, false, true) + leg(12, a, false);
  // body bean + pale rump patch
  b += P(furry([[24, by + 6], [22, by - 8], [4, by - 12], [-16, by - 11], [-28, by - 4], [-26, by + 8], [0, by + 10]], 2.8, -1, 19, [0, 0, 0, 0, 0, 1, 1], 0.6), FU, { sh: 6, rim: 3, rimA: 1,
    tex: locks([[-18, by - 4, 10, 2.9], [-6, by - 6, 10, 3.0], [6, by - 6, 9, 3.0]], mix(FU, '#0e0a1c', 0.5), 0.5) + locks([[-10, by - 10, 9, 3.0, 1.8], [4, by - 11, 8, 3.1, 1.8]], mix(FU, '#e6eef8', 0.4), 0.45) + `<ellipse cx="0" cy="${f(by + 9)}" rx="22" ry="4" fill="${K.ink}" opacity=".35" filter="url(#sb2)"/>` })
    + P(blob([[-26, by - 6], [-34, by - 10], [-33, by - 2], [-27, by]]), '#d9dccf', { lw: 2, sh: 1 });
  // neck + head (lowered and rotated on the tell)
  const hx = 28 + tl * 12, hy = by - 20 + tl * 26, rot = tl * 48, rr = (rot * Math.PI) / 180;
  b += P(limb(12, by - 2, hx - 4, hy + 6, 8, 7), FU, { sh: 3 });
  const crown = (far) => { const c = far ? AND : AN, bx = hx - 3 + (far ? -5 : 0), by2 = hy - 8, dir = far ? -1 : 1;
    const main = [[bx, by2], [bx + dir * 6, by2 - 12], [bx + dir * 16, by2 - 22], [bx + dir * 22, by2 - 36], [bx + dir * 20, by2 - 50]];
    let s = S(`M${main.map(([q, r]) => `${f(q)} ${f(r)}`).join(' L')}`, c, 6.4, { lw: 2.4 });
    for (const [i, len, ang] of [[1.3, 14, -1.9], [2.2, 17, -1.6], [3.1, 13, -1.35]]) { const p = main[Math.floor(i)], q = main[Math.ceil(i)], t = i % 1, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, an = dir > 0 ? ang : Math.PI - ang;
      s += S(`M${f(x)} ${f(y)} q${f(Math.cos(an) * len * 0.3)} ${f(Math.sin(an) * len * 0.6)} ${f(Math.cos(an) * len)} ${f(Math.sin(an) * len)}`, c, 4, { lw: 2.1 }) + `<circle cx="${f(x + Math.cos(an) * len)}" cy="${f(y + Math.sin(an) * len)}" r="2.1" fill="#dcdccd"/>`; }
    s += `<circle cx="${f(main[4][0])}" cy="${f(main[4][1])}" r="2.7" fill="#dcdccd"/>`;
    for (let i = 0; i < 6; i++) { const p = main[1 + (i % 3)], sg = i % 2 ? 1 : -1; s += thorn(p[0], p[1] + 2 - i, sg > 0 ? -0.3 : 3.4, 6, 2, '#2f283a'); }
    if (!far) s += moss(bx + 10, by2 - 32, 9, 13, 6);
    return s; };
  const head = P(blob([[hx - 8, hy - 4], [hx - 22, hy - 10], [hx - 12, hy + 0]]), DK, { lw: 2, sh: 1 }) + P(ell(hx - 4, hy - 1, 11, 10), FU, { sh: 4 });
  const G = (svg) => `<g transform="rotate(${f(rot)} ${f(hx)} ${f(hy)})">${svg}</g>`;
  // the long deer-skull husk, built in pre-rotated coordinates
  const R = rotP(hx, hy, rr), M = (x, y) => R(hx + x, hy + y);
  let ms = strap([M(-6, -7), M(-12, -2), M(-10, 6)], 2.6, { seed: 4 });
  ms += husk(blob([M(-8, -9), M(4, -11), M(16, -6), M(26, 1), M(27, 5), M(20, 7), M(6, 8), M(-6, 5)]), M, { grain: [[[0, -6], [12, -3], [24, 2]], [[-2, 3], [10, 5], [22, 5]]], crack: [[2, -10], [4, -6], [3, -3]], lichen: [[12, -3, 2.6]], chip: [[-7, 2, 3, 3.2 + rr]], under: [[-6, 4], [10, 8], [25, 5]], hi: [[-4, -9], [8, -8], [20, -2]] })
    + knotSocket(blob([M(-2.6, -5.6), M(4, -8.8), M(9.8, -5.4), M(6.6, -0.6), M(-0.4, -0.6)])) + knotSocket(rblob(...M(13.2, -3), 2.7, 2.3, 8, rr), 1.3); // sockets +15% after the WL6d run (far hart on the landscape phone)
  if (st.maskOnly) return { b: `<g transform="translate(${f(-hx)},${f(-hy)})">${ms}</g>`, e: '' };
  b += G(crown(true) + head) + (st.noMask ? G(freed(hx - 2, hy - 3, FU, 1)) : ms) + G(crown(false));
  const E1 = M(3.5, -4.5), E2 = M(13, -3), sh = tl > 0.3 ? 'slit' : 'almond';
  const e = st.hurt ? eye(...E1, 2.3, { shape: 'squint' }) + eye(...E2, 1.7, { shape: 'squint' }) : eye(...E1, 2.5 + tl * 0.8, { shape: sh, rot: -12 + rot }) + eye(...E2, 1.8 + tl * 0.5, { shape: sh, rot: -12 + rot });
  return finish(st, b, e, { w: 70, h: 120, seed: 41 });
}
