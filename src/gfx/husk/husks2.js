// HUSKS batch 2 creatures (LOCKED picks, docs/LOCKED.md 2026-10-18 'HUSKS BATCH 2 picks'): Stoat Piper (ranged), Puffback Toad (area denial),
// Bramble Hart (charger). Ported from the locked mock-up rigs (docs/mockups/enemies-husks/ranged.mjs spitA, bulbs.mjs bulbA, chargers.mjs hartA).
// Each fn(st) -> { b: body svg, e: eye svg }; st = { ph walk phase 0..1, tele 0..1, hurt, noMask, maskOnly }. Origin = ground under the feet,
// facing +x, y up negative, design units (du). Game changes vs the mock-ups: no telegraph decals (the scene draws the aim tick / fuse ring /
// charge lane above the vignette), the mask is built in pre-rotated coordinates (so the knot-hole socket that the eye is baked into matches the
// drawn socket on every frame), sockets are polygon blobs (paint.sockRec reads point pairs), freed face on the death body, mask-only frame.
import { K, P, S, locks, sock, husk, knotSocket, strap, sprout, lichen, finish, furry, blob, ell, circ, limb, eye, shadow, glow, mix, f, TAU, VOID } from './kit.js';

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
