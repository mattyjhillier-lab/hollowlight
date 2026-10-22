// HUSKS batch 3 (LOCKED picks, docs/LOCKED.md 2026-10-18 'HUSKS BATCH 3'): the BRANCH-MANE miniboss (Grey Alpha role) and the LANTERN RELIQUARY
// chest. Ported from the locked mock-ups (docs/mockups/enemies-husks/alphas.mjs alphaA, bigs.mjs chestA). Origin = ground under the feet, facing +x,
// y up negative, design units (du). Game changes vs the mock-ups: no telegraph decal (the scene draws the charge lane above the vignette), the
// mask's sockets are polygon blobs (paint.sockRec), AMBER eyes baked into the sockets (paint.js species 'branch_mane': the locked boss eye #ffb84a,
// never red-orange, never gold), the freed face on the death body, a mask-only frame; tell = the mane rattles up and spreads + the head drops.
import { K, P, S, locks, husk, knotSocket, strap, sprout, moss, lichen, furry, blob, ell, eye, shadow, glow, mix, specks, f, VOID } from './kit.js';
import { wolfRig, ears } from './husks.js';

const AF = '#3c4562', AD = '#272d43';
// three amber eyes (two in the snout line, one high third socket); slit on the tell, squint on the hurt frame
const eyes3 = (E1, E2, E3) => (tl, hurt) => hurt ? eye(...E1, 2.6, { shape: 'squint' }) + eye(...E2, 1.9, { shape: 'squint' }) + eye(...E3, 1.5, { shape: 'squint' })
  : eye(...E1, 2.9 + tl, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -14 }) + eye(...E2, 2.1 + tl * 0.7, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -16 }) + eye(...E3, 1.7 + tl * 0.5, { shape: 'round' });

// BRANCH-MANE: the oldest husk, cracked right across, with a THIRD socket; a mane of pale dead BRANCHES rises from a frosted scruff, a moss beard
// hangs under the mask, an old scar splits one ear. Deliberate, commanding: on the howl / charge tell the mane rattles up and spreads (tele).
export function maneA(st = {}) {
  const C = { fur: AF, dk: AD, seed: 15, elite: 1, hy: -2, sc: 1,
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
      // sockets: the two of the snout line + the high THIRD socket (sized for the WL6d eye gate; amber cores baked in)
      s += knotSocket(blob([M(2, -9), M(8, -13), M(15, -10), M(13, -4), M(5, -3)])) + knotSocket(blob([M(18, -8), M(23, -9.5), M(26.5, -5), M(21, -2.6)]), 1.6) + knotSocket(blob([M(8.6, -17.6), M(13, -20), M(16.6, -16.4), M(12, -13.6)]), 1.4);
      return { svg: s, cx: hx + 18, cy: hy - 2, eyes: eyes3(M(8.5, -7.6), M(22, -6), M(12.5, -16.6)) };
    } };
  return wolfRig(st, C);
}

// ============================ LANTERN RELIQUARY (chest) ============================
// A small peaked-roof shrine-box of old wood with warm BRASS corner bands and a brass clasp (brass #b98f4e = the currency brass, NEVER evolution
// gold); light leaks warm through the lid seam. Tier read at a glance: 0 small = plain box; 1 medium = brass bands; 2 large = a small lit lantern
// hangs from the roof. open 0..1: the roof tips back and cream-amber light spills up (lantern colours, no gold).
const BR = '#b98f4e', BRD = '#7a5a2e', WD = '#6e5f58', WDD = '#463b38', LT = '#ffd98a', LTC = '#fff1c8';
const lanternLit = (x, y, s = 1, a = 1) => `<g transform="translate(${f(x)},${f(y)}) scale(${s})">` + glow(0, 0, 22, 22, '#ffc96b', 0.75 * a) + P('M-5 -8 L5 -8 L6 6 L-6 6Z', BR, { lw: 1.8, sh: 1.5, rim: 1, rimC: '#fff0c0', grain: 0, tex: `<rect x="-4" y="-6" width="8" height="10" rx="1.5" fill="${LT}"/><ellipse cx="0" cy="0" rx="2" ry="3.4" fill="${LTC}"/><path d="M-2 -7 L-2 5 M2 -7 L2 5" stroke="${BRD}" stroke-width="1.2"/>` }) + P('M-6.5 -8 L0 -13 L6.5 -8Z', BR, { lw: 1.6, sh: 1, rim: 0.8, rimC: '#fff0c0', grain: 0 }) + `<circle cx="0" cy="-14.5" r="1.6" fill="none" stroke="${BRD}" stroke-width="1.2"/></g>`;
export function reliquaryA(st = {}) {
  const tier = st.tier ?? 2, open = st.open || 0, sc = [0.84, 0.94, 1.04][tier];
  let b = shadow(30, 0, 0.5) + glow(0, -18, 46, 30, '#ffc45a', 0.3 + tier * 0.1 + open * 0.3);
  b += P('M-22 -1 L-23 -22 Q-23 -24 -21 -24 L21 -24 Q23 -24 23 -22 L22 -1 Q22 1 20 1 L-20 1 Q-22 1 -22 -1Z', WD, { sh: 4, rimC: '#ffe2b0', rimA: 0.6, tex: [0, 1, 2, 3].map((i) => `<path d="M${-15 + i * 10} -3 q2 -9 0 -18" stroke="${WDD}" stroke-width="1.3" fill="none" opacity=".75"/>`).join('') + `<rect x="-23" y="-6" width="46" height="6" fill="${WDD}" opacity=".35"/>` });
  if (tier >= 1) for (const x of [-21, 17]) b += P(`M${x} -24 L${x + 4} -24 L${x + 4} 0 L${x} 0Z`, BR, { lw: 1.8, sh: 1.5, rimC: '#fff0c0', rimA: 0.9, grain: 0, tex: `<circle cx="${x + 2}" cy="-19" r="1" fill="${BRD}"/><circle cx="${x + 2}" cy="-5" r="1" fill="${BRD}"/>` });
  b += `<path d="M-22 -24 L22 -24" stroke="${LT}" stroke-width="${f(2.4 + open * 3)}" opacity=".95"/>` + glow(0, -24, 32, 6 + open * 10, '#ffd27a', 0.7); // seam light
  if (open > 0) b += glow(0, -24 - 26 * open, 24, 34 * open + 6, '#ffe2a0', 0.8 * open) + [0, 1, 2].map((i) => `<circle cx="${f(-8 + i * 8)}" cy="${f(-30 - open * (18 + i * 10))}" r="${f(1.6 - i * 0.2)}" fill="${LTC}" opacity="${f(open)}"/>`).join('');
  b += `<g transform="rotate(${f(-open * 35)} -23 -24)">` + P('M-25 -24 L0 -40 L25 -24Z', mix(WD, '#8a7a70', 0.15), { sh: 3, rimC: '#ffe2b0', rimA: 0.7, tex: `<path d="M-16 -27 L0 -37 L16 -27" stroke="${WDD}" stroke-width="1.3" fill="none"/>` + lichen(-10, -28, 2.4) })
    + P('M-3 -40 L3 -40 L3 -44 L-3 -44Z', BR, { lw: 1.4, sh: 1, rim: 0.8, rimC: '#fff0c0', grain: 0 }) + (tier >= 2 ? S('M14 -30 q4 3 4 9', BRD, 1.2, { lw: 1, hi: 0 }) + lanternLit(18, -14, 0.7) : '') + '</g>';
  b += P('M-4 -24 L4 -24 L4 -15 Q0 -12 -4 -15Z', BR, { lw: 1.8, sh: 1.2, rimC: '#fff0c0', grain: 0, tex: `<circle cx="0" cy="-18" r="1.6" fill="${BRD}"/>` }); // clasp
  return `<g transform="scale(${sc})">${b}</g>`;
}
