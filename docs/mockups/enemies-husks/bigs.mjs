// HUSKS options: (8) CHEST A/B/C (warm BRASS, never gold; rewards may be warm, enemies never) and (9) ELDER TREANT boss-scale HINT A/B/C
// (family consistency only; the boss gets its own sheet #7). Mock-up drawing code only. Origin = ground centre.
import { K, P, S, husk, knotSocket, strap, sprout, moss, lichen, thorn, furry, blob, line, ell, circ, eye, shadow, glow, mix, rng, specks, f, VOID, BOSS_EYE } from './kit.mjs';
const BR = '#b98f4e', BRL = '#e2bf7c', BRD = '#7a5a2e', WD = '#6e5f58', WDD = '#463b38', LT = '#ffd98a', LTC = '#fff1c8';
const lanternLit = (x, y, s = 1, a = 1) => `<g transform="translate(${f(x)},${f(y)}) scale(${s})">` + glow(0, 0, 22, 22, '#ffc96b', 0.75 * a) + P('M-5 -8 L5 -8 L6 6 L-6 6Z', BR, { lw: 1.8, sh: 1.5, rim: 1, rimC: '#fff0c0', grain: 0, tex: `<rect x="-4" y="-6" width="8" height="10" rx="1.5" fill="${LT}"/><ellipse cx="0" cy="0" rx="2" ry="3.4" fill="${LTC}"/><path d="M-2 -7 L-2 5 M2 -7 L2 5" stroke="${BRD}" stroke-width="1.2"/>` }) + P('M-6.5 -8 L0 -13 L6.5 -8Z', BR, { lw: 1.6, sh: 1, rim: 0.8, rimC: '#fff0c0', grain: 0 }) + `<circle cx="0" cy="-14.5" r="1.6" fill="none" stroke="${BRD}" stroke-width="1.2"/></g>`;

// ============================ 8. CHEST ============================
// A (recommended) LANTERN RELIQUARY: a small peaked-roof shrine-box of old wood with warm BRASS corner bands and a brass clasp; light leaks
// warm through the lid seam. Tier read at a glance: small = plain box; medium = brass bands; large = a small lit lantern hangs from the roof.
// Opening = the roof tips back and cream-amber light spills up (lantern colours, no gold).
export function chestA(st = {}) {
  const tier = st.tier ?? 2, open = st.open || 0, sc = [0.84, 0.94, 1.04][tier];
  let b = shadow(30, 0, 0.5) + glow(0, -18, 46, 30, '#ffc45a', 0.3 + tier * 0.1 + open * 0.3);
  b += P('M-22 -1 L-23 -22 Q-23 -24 -21 -24 L21 -24 Q23 -24 23 -22 L22 -1 Q22 1 20 1 L-20 1 Q-22 1 -22 -1Z', WD, { sh: 4, rimC: '#ffe2b0', rimA: 0.6, tex: [0, 1, 2, 3].map((i) => `<path d="M${-15 + i * 10} -3 q2 -9 0 -18" stroke="${WDD}" stroke-width="1.3" fill="none" opacity=".75"/>`).join('') + `<rect x="-23" y="-6" width="46" height="6" fill="${WDD}" opacity=".35"/>` });
  if (tier >= 1) for (const x of [-21, 17]) b += P(`M${x} -24 L${x + 4} -24 L${x + 4} 0 L${x} 0Z`, BR, { lw: 1.8, sh: 1.5, rimC: '#fff0c0', rimA: 0.9, grain: 0, tex: `<circle cx="${x + 2}" cy="-19" r="1" fill="${BRD}"/><circle cx="${x + 2}" cy="-5" r="1" fill="${BRD}"/>` });
  // seam light
  b += `<path d="M-22 -24 L22 -24" stroke="${LT}" stroke-width="${f(2.4 + open * 3)}" opacity=".95"/>` + glow(0, -24, 32, 6 + open * 10, '#ffd27a', 0.7);
  if (open > 0) b += glow(0, -24 - 26 * open, 24, 34 * open + 6, '#ffe2a0', 0.8 * open) + [0, 1, 2].map((i) => `<circle cx="${f(-8 + i * 8)}" cy="${f(-30 - open * (18 + i * 10))}" r="${f(1.6 - i * 0.2)}" fill="${LTC}" opacity="${f(open)}"/>`).join('');
  // peaked roof lid
  b += `<g transform="rotate(${f(-open * 35)} -23 -24)">` + P('M-25 -24 L0 -40 L25 -24Z', mix(WD, '#8a7a70', 0.15), { sh: 3, rimC: '#ffe2b0', rimA: 0.7, tex: `<path d="M-16 -27 L0 -37 L16 -27" stroke="${WDD}" stroke-width="1.3" fill="none"/>` + lichen(-10, -28, 2.4) })
    + P('M-3 -40 L3 -40 L3 -44 L-3 -44Z', BR, { lw: 1.4, sh: 1, rim: 0.8, rimC: '#fff0c0', grain: 0 }) + (tier >= 2 ? S('M14 -30 q4 3 4 9', BRD, 1.2, { lw: 1, hi: 0 }) + lanternLit(18, -14, 0.7) : '') + '</g>';
  // clasp
  b += P('M-4 -24 L4 -24 L4 -15 Q0 -12 -4 -15Z', BR, { lw: 1.8, sh: 1.2, rimC: '#fff0c0', grain: 0, tex: `<circle cx="0" cy="-18" r="1.6" fill="${BRD}"/>` });
  return { b: `<g transform="scale(${sc})">${b}</g>`, e: '' };
}
// B ROOT-BOUND COFFER: a bark coffer the Treant's roots had seized; two pale roots still bind it, a brass lantern-lock glows warm in front.
// Opening = the roots creak loose and drop away, the lid springs. Ties the reward to the Husk family (taking it back from the Hollow).
export function chestB(st = {}) {
  const open = st.open || 0, BK = '#6f6b70', BD = '#45414b';
  let b = shadow(30, 0, 0.5) + glow(0, -16, 42, 26, '#ffc45a', 0.42 + open * 0.3);
  b += P('M-24 -1 L-25 -21 Q-25 -23 -23 -23 L23 -23 Q25 -23 25 -21 L24 -1 Q24 1 22 1 L-22 1 Q-24 1 -24 -1Z', BK, { sh: 4, tex: [0, 1, 2, 3].map((i) => `<path d="M${-18 + i * 12} -3 q2 -9 0 -18" stroke="${BD}" stroke-width="1.4" fill="none" opacity=".8"/>`).join('') });
  b += `<path d="M-25 -21 L25 -21" stroke="#ffcf70" stroke-width="${f(2.4 + open * 3)}" opacity=".9"/>` + glow(0, -21, 30, 5 + open * 8, '#ffd27a', 0.7);
  b += `<g transform="rotate(${f(-open * 30)} -24 -22)">` + P('M-26 -21 Q-26 -36 0 -38 Q26 -36 26 -21Z', BK, { sh: 4, tex: `<path d="M-20 -30 Q0 -36 20 -30" stroke="${BD}" stroke-width="1.4" fill="none"/>` + lichen(-10, -31, 2.8) }) + '</g>';
  const drop = open * 12;
  for (const x of [-15, 15]) b += `<g transform="translate(0,${f(drop)}) rotate(${f(open * (x < 0 ? -20 : 20))} ${x} 0)">` + S(line([[x - 2, -1], [x, -12], [x - 1, -24], [x + 1, -36]]), '#a7a092', 4.4, { lw: 2.2 }) + S(`M${x} -12 q-6 1 -9 6`, '#a7a092', 2, { lw: 1.6 }) + '</g>';
  b += P(blob([[-6, -26], [-6, -13], [6, -13], [6, -26]]), BR, { lw: 2, sh: 1.5, rimC: '#fff0c0' }) + `<rect x="-3.6" y="-23.5" width="7.2" height="7.5" rx="2" fill="${LT}"/>` + glow(0, -20, 12, 12, '#ffd27a', 0.9);
  return { b, e: '' };
}
// C LANTERN HIVE: a round bark-and-brass lantern cage shaped like an old skep hive on three stubby brass feet; warm light glows through the
// banded slats and two moth-motes circle it. Opening = the domed top unscrews and the light rises out. Most "lantern", least "box".
export function chestC(st = {}) {
  const open = st.open || 0;
  let b = shadow(26, 0, 0.5) + glow(0, -22, 40, 34, '#ffc45a', 0.45 + open * 0.3);
  for (const x of [-12, 0, 12]) b += P(`M${x - 3} 0 L${x + 3} 0 L${x + 2} -6 L${x - 2} -6Z`, BR, { lw: 1.4, sh: 1, rim: 0.6, grain: 0 });
  const body = 'M-20 -6 Q-24 -22 -16 -34 Q0 -42 16 -34 Q24 -22 20 -6Z';
  b += P(body, mix(WD, '#7d7268', 0.3), { sh: 4, tex: `<ellipse cx="0" cy="-20" rx="12" ry="12" fill="${LT}" opacity=".85"/><ellipse cx="0" cy="-20" rx="6" ry="7" fill="${LTC}"/>` + [-14, -22, -30].map((y, i) => `<path d="M-22 ${y} Q0 ${y - 4} 22 ${y}" stroke="${BR}" stroke-width="2.6" fill="none"/><path d="M-22 ${y} Q0 ${y - 4} 22 ${y}" stroke="${BRL}" stroke-width=".9" fill="none" transform="translate(0,-.8)"/>`).join('') + [-10, -3, 4, 11].map((x) => `<path d="M${x} -8 L${x * 1.1} -34" stroke="${WDD}" stroke-width="2.4" opacity=".8"/>`).join('') });
  b += glow(0, -20, 20, 20, '#ffd27a', 0.6);
  b += `<g transform="translate(0,${f(-open * 16)}) rotate(${f(open * 25)} 0 -36)">` + P('M-12 -34 Q0 -48 12 -34Z', BR, { lw: 2, sh: 1.5, rimC: '#fff0c0' }) + `<circle cx="0" cy="-48" r="2.2" fill="none" stroke="${BRD}" stroke-width="1.4"/></g>`;
  for (const [x, y] of [[24, -34], [-26, -22]]) b += glow(x, y, 6, 6, '#ffd98a', 0.9) + `<circle cx="${x}" cy="${y}" r="1.4" fill="${LTC}"/><path d="M${x - 3} ${y - 1} q3 -3 3 1 q0 -4 3 -1" stroke="#e8d6a8" stroke-width=".9" fill="none"/>`;
  return { b, e: '' };
}

// ============================ 9. ELDER TREANT (hint) ============================
const trunkPath = blob([[-60, -10], [-70, -60], [-56, -140], [-64, -210], [-30, -232], [30, -234], [62, -206], [54, -130], [70, -60], [62, -10]]);
const roots = (BD) => [[-40, -70], [-20, -50], [30, 60], [44, 88], [0, -20]].map(([x, dx]) => S(line([[x, -20], [x + dx * 0.5, -6], [x + dx, 2]]), BD, 10, { lw: 3 })).join('');
const crown = (col = '#5d6a6c') => P(furry([[-110, -230], [-80, -290], [-20, -320], [50, -310], [110, -260], [120, -210], [60, -190], [-60, -190]], 12, -1, 51, null, 0.4), col, { sh: 12, tex: specks(0, -260, 90, 40, 30, '#3f4a4e', { seed: 4, r: 6, a: 0.6 }) + specks(-20, -280, 70, 25, 14, '#8a9a96', { seed: 8, r: 4, a: 0.5 }) });
const bigEyes = (x1, y1, x2, y2, r = 5.5, tl = 0) => eye(x1, y1, r + tl, { col: BOSS_EYE, shape: 'almond', rot: 12 }) + eye(x2, y2, r + tl, { col: BOSS_EYE, shape: 'almond', rot: -12 });
// A (recommended) THE FIRST HUSK: every mask came from it. A great grey tree whose own face is the biggest, oldest husk: cracked, lichened,
// with a chip missing where the masks are shed; a cold hollow in the chest; branch arms. Groaning sway.
export function treantA(st = {}) {
  const BK = '#5f5f69', BD = '#3d3c46';
  let b = shadow(120, 0, 0.5) + `<ellipse cx="0" cy="0" rx="120" ry="18" fill="${K.ink}" opacity=".45"/>` + roots(BD) + crown();
  b += P(trunkPath, BK, { sh: 14, lw: 4, tex: [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${-50 + i * 17} -14 q${f(6 - i * 2)} -90 ${f(-2 + i)} -210" stroke="${BD}" stroke-width="2.4" fill="none" opacity=".7"/>`).join('') });
  b += S(line([[-50, -170], [-96, -190], [-130, -176], [-150, -196]]), BK, 14, { lw: 3.4 }) + S(line([[50, -160], [100, -190], [140, -180], [160, -204]]), BK, 14, { lw: 3.4 });
  b += `<path d="M-4 -40 Q-14 -80 2 -120 Q16 -80 8 -40Z" fill="${VOID}"/>` + glow(2, -80, 18, 40, '#6f86c8', 0.35);
  const M = (x, y) => [x, y - 170];
  b += husk(blob([M(-40, -26), M(0, -40), M(40, -26), M(46, 6), M(30, 30), M(0, 40), M(-30, 30), M(-46, 6)]), M, { grain: [[[-34, -14], [0, -24], [34, -14]], [[-36, 4], [0, -4], [36, 4]], [[-22, 16], [-18, 30]], [[20, 14], [24, 28]]], gw: 2.2, crack: [[-6, -38], [0, -24], [-4, -12], [4, 0], [0, 12]], lichen: [[-20, 16, 8], [24, -10, 7]], chip: [[44, -4, 10, 0.2], [-44, 10, 9, 3.2]], under: [[-30, 28], [0, 38], [30, 28]], underW: 10, hi: [[-34, -22], [0, -34], [30, -22]], hiW: 4 })
    + knotSocket(blob([M(-26, -8), M(-14, -16), M(-4, -8), M(-10, 2), M(-22, 2)]), 3) + knotSocket(blob([M(26, -8), M(14, -16), M(4, -8), M(10, 2), M(22, 2)]), 3);
  b += sprout(...M(-10, -38), -2.0, 2.6, { two: 1 });
  return { b, e: bigEyes(-14, -178, 14, -178) };
}
// B THE MASK-BEARER: the Treant GROWS the husks: small animal masks (a wolf snout, a crow brow, a hart skull) sprout from its bark like
// bracket fungus, waiting for bodies; its own face is only a dark split knot with two amber eyes. Creepiest family link; busiest silhouette.
export function treantB(st = {}) {
  const BK = '#5c5d68', BD = '#3b3a45';
  let b = shadow(120, 0, 0.5) + `<ellipse cx="0" cy="0" rx="120" ry="18" fill="${K.ink}" opacity=".45"/>` + roots(BD) + crown('#58656a');
  b += P(trunkPath, BK, { sh: 14, lw: 4, tex: [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${-50 + i * 17} -14 q${f(6 - i * 2)} -90 ${f(-2 + i)} -210" stroke="${BD}" stroke-width="2.4" fill="none" opacity=".7"/>`).join('') });
  b += S(line([[-50, -170], [-96, -190], [-130, -176], [-150, -196]]), BK, 14, { lw: 3.4 }) + S(line([[50, -160], [100, -190], [140, -180], [160, -204]]), BK, 14, { lw: 3.4 });
  // the face: a long dark split knot
  b += P(blob([[-26, -186], [0, -206], [26, -186], [16, -150], [0, -140], [-16, -150]]), '#4a4954', { sh: 4, lw: 3 }) + `<path d="${blob([[-18, -182], [0, -198], [18, -182], [10, -156], [0, -150], [-10, -156]])}" fill="${VOID}"/>`;
  // grown masks (small husks) on the bark
  const mini = (x, y, s, kind) => { const M = (u, v) => [x + u * s, y + v * s]; const d = kind === 'wolf' ? blob([M(-8, -8), M(4, -9), M(16, -3), M(22, 1), M(14, 5), M(0, 6), M(-8, 3)]) : kind === 'crow' ? blob([M(-8, -2), M(-4, -9), M(6, -10), M(12, -3), M(8, 3), M(-4, 4)]) : blob([M(-6, -8), M(6, -9), M(14, -2), M(16, 4), M(6, 6), M(-6, 4)]);
    return husk(d, M, { grain: [[[-4, -4], [6, -5], [14, -1]]], lichen: [[0, 2, 2 * s]], p: { lw: 2.6 } }) + knotSocket(circ(...M(2, -3), 2 * s), 1.2) + (kind !== 'crow' ? knotSocket(circ(...M(10, -2), 1.6 * s), 1) : ''); };
  b += mini(-40, -120, 1.4, 'wolf') + mini(26, -96, 1.3, 'hart') + mini(-30, -60, 1.2, 'crow') + mini(30, -150, 1.1, 'crow') + mini(10, -40, 1.2, 'wolf');
  return { b, e: bigEyes(-8, -176, 8, -176, 5) };
}
// C THE ANTLERED ELDER: an ancient tree whose bare crown has grown into a vast ANTLER rack of dead branches (the hart's crown, writ huge);
// a long pale stag-skull husk for a face; moss beards hanging from every tine. Most majestic; overlaps the Bramble Hart's language.
export function treantC(st = {}) {
  const BK = '#61606a', BD = '#3e3d47';
  let b = shadow(120, 0, 0.5) + `<ellipse cx="0" cy="0" rx="120" ry="18" fill="${K.ink}" opacity=".45"/>` + roots(BD);
  for (const dir of [-1, 1]) { const pts = [[dir * 20, -230], [dir * 50, -270], [dir * 80, -300], [dir * 100, -340]]; b += S(line(pts), '#8a8590', 14, { lw: 3.4 });
    for (const [i, l, an] of [[1, 40, -1.9], [2, 46, -1.5], [3, 30, -1.2]]) { const [x, y] = pts[i], A = dir > 0 ? an : Math.PI - an; b += S(`M${x} ${y} l${f(Math.cos(A) * l)} ${f(Math.sin(A) * l)}`, '#8a8590', 9, { lw: 2.8 }) + moss(x + Math.cos(A) * l * 0.6, y + Math.sin(A) * l * 0.6, 14, 22, i * 3 + (dir > 0 ? 1 : 2)); } }
  b += P(trunkPath, BK, { sh: 14, lw: 4, tex: [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${-50 + i * 17} -14 q${f(6 - i * 2)} -90 ${f(-2 + i)} -210" stroke="${BD}" stroke-width="2.4" fill="none" opacity=".7"/>`).join('') });
  const M = (x, y) => [x, y - 180];
  b += husk(blob([M(-30, -30), M(0, -40), M(30, -30), M(34, 0), M(22, 40), M(0, 56), M(-22, 40), M(-34, 0)]), M, { grain: [[[-24, -20], [0, -28], [24, -20]], [[-20, 10], [0, 4], [20, 10]], [[-6, 24], [-4, 44]], [[8, 22], [6, 42]]], gw: 2, crack: [[4, -38], [0, -20], [6, -4]], lichen: [[-16, 20, 6]], under: [[-20, 40], [0, 52], [20, 40]], underW: 12, hi: [[-26, -28], [0, -36]], hiW: 4 })
    + knotSocket(blob([M(-22, -10), M(-10, -16), M(-4, -6), M(-12, 0)]), 3) + knotSocket(blob([M(22, -10), M(10, -16), M(4, -6), M(12, 0)]), 3);
  b += moss(...M(0, 54), 30, 30, 21);
  return { b, e: bigEyes(-12, -188, 12, -188) };
}
