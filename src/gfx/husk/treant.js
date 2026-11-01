// ELDER TREANT boss painter (B3; LOCKED take A THE FIRST HUSK, ELDER), ported 1:1 from docs/mockups/boss-treant/treant.mjs (take A, the death
// beat and the seed pod / Sapling Husk). Pure JS: SVG strings only (no DOM); src/gfx/boss/bossart.js rasterises them. Builds on ./kit.js (Husk family: grown-bark mask, knot sockets, root straps, lichen, Style v1 L2 tinted outline + H2 rim).
// Units: du (4 du = 1 world unit). Origin = ground centre under the trunk, y up negative. Drawn height ~340 du = ~85 world units.
// EYES: Husk pattern (EYES IN SOCKETS row): the dark socket is baked in the body, the amber glow is SOCKET-SHAPED (clipped to the socket),
// with a cream core low in the socket; only a faint halo leaks out. Never a round floating ball.
import { K, P, S, husk, knotSocket, strap, sprout, moss, lichen, furry, blob, line, ell, glow, mix, rng, specks, f, VOID, BOSS_EYE } from './kit.js';
import { addDef, nid } from './paint.js';

export const BARK = '#5f5f69', BARK_D = '#3d3c46', BARK_P2 = '#58566a', CROWN = '#5d6a6c', CROWN_D = '#3f4a4e', MEM = '#7f9a6e', COLD = '#8fa8ff', LIFE = '#6fae5a', LIFE_L = '#9fd27a';

// amber socket eye: socket path d (already drawn as knotSocket in the body), centre cx,cy, size r. a = brightness (tell = 1.25)
export function socketEye(d, cx, cy, r, a = 1) {
  const id = nid('se');
  addDef(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return glow(cx, cy, r * 3.2, r * 2.4, BOSS_EYE, 0.38 * a)
    + `<g clip-path="url(#${id})"><ellipse cx="${f(cx)}" cy="${f(cy + r * 0.95)}" rx="${f(r * 1.9)}" ry="${f(r * 1.25)}" fill="${BOSS_EYE}" opacity="${f(Math.min(1, 0.85 * a))}"/>`
    + `<ellipse cx="${f(cx + r * 0.1)}" cy="${f(cy + r * 0.85)}" rx="${f(r * 0.85)}" ry="${f(r * 0.5)}" fill="#ffe9c4"/><ellipse cx="${f(cx - r * 0.15)}" cy="${f(cy + r * 0.75)}" rx="${f(r * 0.3)}" ry="${f(r * 0.2)}" fill="#fff"/>`
    + `<path d="${d}" fill="none" stroke="#5a2a10" stroke-width="${f(r * 0.5)}" opacity=".55"/></g>`;
}

const trunkTex = (n, x0, dx, top, col = BARK_D) => Array.from({ length: n }, (_, i) => `<path d="M${f(x0 + i * dx)} -10 q${f(6 - i * 1.8)} ${f(top * 0.45)} ${f(-2 + i * 0.8)} ${f(top)}" stroke="${col}" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>`).join('');
// broken bark plates (short curved strokes + pale top edges)
const plates = (x0, y0, seed) => { const q = rng(seed); let s = ''; for (let i = 0; i < 16; i++) { const x = x0 + q() * 84, y = y0 - q() * 160, w = 10 + q() * 12; s += `<path d="M${f(x)} ${f(y)} q${f(w / 2)} -4 ${f(w)} 0" stroke="${BARK_D}" stroke-width="2.2" fill="none" opacity=".75" stroke-linecap="round"/><path d="M${f(x + 1)} ${f(y - 2.2)} q${f(w / 2)} -4 ${f(w - 2)} 0" stroke="#8a8a96" stroke-width="1" fill="none" opacity=".55" stroke-linecap="round"/>`; } return s; };
const rootFeet = (spec, col = BARK_D, w = 11) => spec.map(([x, dx, up]) => S(line([[x, -up], [x + dx * 0.55, -up * 0.35], [x + dx, 2]]), col, w, { lw: 3 })).join('');
// branch arm with twig fingers; pts from shoulder to hand; claw = drooping root fingers
function arm(pts, col, w = 15, o = {}) {
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) s += S(line([pts[i], pts[i + 1]]), col, w * (1 - i * 0.22), { lw: 3.4 });
  s += `<circle cx="${f(pts[1][0])}" cy="${f(pts[1][1])}" r="${f(w * 0.42)}" fill="${col}"/>` + `<circle cx="${f(pts[2][0])}" cy="${f(pts[2][1])}" r="${f(w * 0.3)}" fill="${col}"/>`;
  const [hx, hy] = pts[pts.length - 1], [px, py] = pts[pts.length - 2], a = Math.atan2(hy - py, hx - px);
  for (const [da, l] of o.fingers || [[-0.7, 26], [0, 32], [0.6, 24]]) { const A = a + da; s += S(line([[hx, hy], [hx + Math.cos(A) * l * 0.55, hy + Math.sin(A) * l * 0.55 + 3], [hx + Math.cos(A) * l, hy + Math.sin(A) * l + 8]]), col, w * 0.38, { lw: 2.4 }); }
  if (o.moss) s += moss(pts[1][0], pts[1][1] + 3, 12, 18, o.moss, K.mossDk);
  return s;
}

// the FIRST HUSK face (grown bark mask). M = local->world. ph = phase (1..3): crack widens, chip grows. tele: brow lowers
function firstHuskFace(M, ph, o = {}) {
  const sc = o.sc || 1, m = (x, y) => M(x * sc, y * sc);
  const crack = ph >= 3 ? [[-6, -38], [2, -22], [-6, -10], [6, 2], [-2, 16], [4, 30]] : ph >= 2 ? [[-6, -38], [0, -24], [-4, -12], [4, 0], [0, 14]] : [[-6, -38], [0, -26], [-3, -16]];
  const mask = blob([m(-42, -28), m(-14, -42), m(8, -41), m(42, -27), m(48, 4), m(32, 32), m(2, 44), m(-30, 32), m(-48, 6)]);
  let s = husk(mask, m, {
    grain: [[[-36, -16], [0, -26], [36, -16]], [[-40, 6], [0, -2], [40, 6]], [[-24, 18], [-19, 33]], [[22, 16], [26, 30]]], gw: 2.4,
    crack, lichen: [[-24, 20, 8], [28, -14, 6]], chip: [[46, -6, 11 + ph * 2, 0.2], [-46, 12, 9, 3.2]].concat(ph >= 3 ? [[10, 42, 12, 1.6]] : []),
    under: [[-32, 30], [0, 42], [32, 30]], underW: 11, hi: [[-36, -24], [-8, -37], [30, -24]], hiW: 4.5,
  });
  // root straps: the mask is GROWN onto the trunk (bark roots grip its edge)
  s += strap([m(-42, -6), m(-52, 14), m(-48, 40), m(-40, 62)], 4.4, { seed: 3, out: 3 }) + strap([m(44, -12), m(54, 10), m(50, 36), m(42, 60)], 4.4, { seed: 7 }) + strap([m(-10, -40), m(-18, -56), m(-14, -70)], 3.4, { seed: 11, rootlets: 0 });
  const lo = o.tele ? 3 : 0;
  // irregular knot-hole sockets: high outer corner, low inner corner (a stern, tired brow), not round goggles
  const sL = blob([m(-32, -10 + lo), m(-22, -16 + lo), m(-8, -8 + lo * 1.4), m(-5, 1), m(-14, 5), m(-27, 2)]), sR = blob([m(31, -12 + lo), m(20, -17 + lo), m(7, -9 + lo * 1.4), m(5, 0), m(15, 4), m(27, 1)]);
  s += knotSocket(sL, 2.1) + knotSocket(sR, 2.1);
  // mouth: a long thin dark split (the oldest crack), not a grin
  s += `<path d="${blob([m(-15, 24), m(-6, 21), m(3, 23), m(13, 21), m(9, 26), m(-2, 27), m(-11, 27)])}" fill="${VOID}"/><path d="${line([m(-13, 27.5), m(0, 28.5), m(10, 27)])}" stroke="${K.barkLt}" stroke-width="1" fill="none" opacity=".6"/>`;
  s += sprout(...m(-12, -40), -2.0, 2.4, { two: 1, leaf: ph === 1 ? MEM : K.leaf });
  const [lx, ly] = m(-17, -6 + lo), [rx, ry] = m(17, -7 + lo), er = 6.0 * sc;
  return { b: s, e: o.dim ? '' : socketEye(sL, lx, ly, er, o.tele ? 1.3 : 1) + socketEye(sR, rx, ry, er, o.tele ? 1.3 : 1) };
}

// crown: furry canopy; ph1 = full grey with a few memory-green leaves; ph2 = thinning (gaps, falling leaves); ph3 = bare branches only
function crown(ph, x0 = 0, y0 = -250, w = 1, o = {}) {
  const X = (x) => x0 + x * w;
  let s = '';
  const bare = (col) => [[-1, 1.0], [1, 1.0], [-0.5, 1.2], [0.5, 1.15]].map(([d, l], i) => S(line([[X(d * 20), y0 + 10], [X(d * 60 * l), y0 - 40 * l], [X(d * 95 * l), y0 - 70 * l], [X(d * 120 * l), y0 - 64 * l - i * 6]]), col, 9 - i, { lw: 2.6 })).join('');
  if (ph >= 3) s += bare(o.branch || '#77727e');
  else s += [[-1, 0.55], [1, 0.5], [-0.4, 0.62], [0.45, 0.6]].map(([d, l], i) => S(line([[X(d * 20), y0 + 10], [X(d * 60 * l), y0 - 40 * l], [X(d * 95 * l), y0 - 70 * l]]), '#77727e', 8 - i, { lw: 2.4 })).join('');
  if (ph >= 3) return s + [[-80, -60], [70, -70], [-30, -96]].map(([x, y]) => S(`M${f(X(x))} ${f(y0 + y)} l${f(-8 * w)} -14`, '#77727e', 4, { lw: 2 })).join('');
  const sh2 = ph >= 2 ? 0.8 : 1;
  const pts = [[-118, 10], [-96, -46], [-40, -78], [20, -84], [84, -60], [124, -12], [112, 22], [60, 30], [-60, 30]].map(([x, y]) => [X(x * sh2), y0 + y * sh2 + (ph >= 2 ? 6 : 0)]);
  const col = ph >= 2 ? mix(CROWN, '#5e5868', 0.55) : CROWN;
  if (ph >= 2) s += bare('#77727e');
  s += P(furry(pts, ph >= 2 ? 18 : 13, -1, 51 + ph, null, 0.4), col, { sh: 12, tex: specks(x0, y0 - 30, 90 * w, 40, 34, CROWN_D, { seed: 4, r: 6, a: 0.6 }) + specks(x0 - 20, y0 - 50, 70 * w, 25, 16, '#8a9a96', { seed: 8, r: 4, a: 0.5 }) + (ph === 1 ? specks(x0 + 10, y0 - 40, 80 * w, 30, 9, MEM, { seed: 12, r: 4.5, a: 0.75 }) : '') });
  if (ph >= 2) for (const [x, y, r] of [[-60, -10, 14], [30, -40, 12], [70, 0, 11], [-10, -56, 13], [-84, -22, 9], [48, -18, 8]]) s += `<path d="${ell(X(x), y0 + y, r, r * 0.7)}" fill="#1d2433" opacity=".85"/>`; // holes in the canopy
  if (ph >= 2) { const q = rng(31); for (let i = 0; i < 7; i++) { const x = X((q() - 0.5) * 220), y = y0 + 40 + q() * 160; s += `<path d="M${f(x)} ${f(y)} q4 -5 9 -2 q-4 4 -9 2Z" fill="${mix(K.leaf, '#9a8f7e', 0.4)}" stroke="#3a3540" stroke-width=".8" transform="rotate(${f(q() * 180)} ${f(x)} ${f(y)})"/>`; } }
  return s;
}

// hollow chest: a cold split with the Hollow inside. ph3: glows cold blue-white (the weak point read). tele 'thorn': chest flares
function chest(x, yTop, yBot, ph, tele) {
  const w = ph >= 3 ? 16 : 12;
  let s = `<path d="M${f(x - 4)} ${yBot} Q${f(x - w - 4)} ${f((yTop + yBot) / 2)} ${f(x + 2)} ${yTop} Q${f(x + w + 8)} ${f((yTop + yBot) / 2)} ${f(x + 8)} ${yBot}Z" fill="${VOID}"/>`;
  const a = tele === 'thorn' ? 0.95 : ph >= 3 ? 0.7 : ph >= 2 ? 0.45 : 0.3;
  s += glow(x + 2, (yTop + yBot) / 2, 22 + ph * 4, (yBot - yTop) * 0.55, COLD, a);
  if (ph >= 2) s += `<path d="M${f(x + 2)} ${f(yTop + 10)} L${f(x)} ${f(yBot - 10)}" stroke="#cfdcff" stroke-width="${ph >= 3 ? 2.6 : 1.4}" opacity="${ph >= 3 ? 0.9 : 0.6}"/>`;
  return s;
}
// phase cracks: thin cold veins in the bark (ph2+), never red
const veins = (ph, pts) => ph < 2 ? '' : pts.map((p) => `<path d="${line(p)}" stroke="${mix(COLD, '#6a58a0', 0.5)}" stroke-width="${ph >= 3 ? 2.2 : 1.4}" fill="none" opacity="${ph >= 3 ? 0.85 : 0.55}" stroke-linecap="round"/>`).join('');

// ================= TAKE A (recommended): THE FIRST HUSK, ELDER =================
// Tall grey elder; its face is the biggest, oldest bark mask, grown on with root straps; two long branch arms; a cold split chest;
// heavy grey crown that still holds a few leaves of memory-green (phase 1) and loses them by phase 3.
export function treantA(st = {}) {
  const ph = st.ph || 1, tele = st.tele || '', sway = st.sway || 0;
  const raise = tele === 'slam' ? 1 : 0, sweep = tele === 'sweep' ? 1 : 0;
  let b = `<ellipse cx="0" cy="0" rx="118" ry="20" fill="${K.ink}" opacity=".5"/>` + rootFeet([[-40, -74, 34], [-18, -50, 22], [24, 60, 26], [44, 90, 34], [0, -16, 12]]);
  const trunk = blob([[-84, -4], [-66, -34], [-60, -80], [-52, -140], [-62, -205], [-30, -236], [30, -238], [60, -208], [50, -134], [58, -78], [64, -36], [86, -4]]);
  const tcol = ph >= 2 ? BARK_P2 : BARK;
  // arms behind/beside the trunk (drawn first so the trunk overlaps the shoulders)
  const LA = raise ? [[-48, -180], [-90, -230], [-112, -280], [-100, -318]] : sweep ? [[-48, -170], [-110, -176], [-170, -150], [-214, -110]] : [[-48, -170], [-94, -192 + sway], [-130, -176 + sway], [-150, -142]];
  const RA = raise ? [[48, -178], [92, -232], [110, -282], [96, -320]] : [[48, -160], [98, -186 - sway], [140, -170 - sway], [158, -136]];
  b += arm(LA, tcol, 16, { moss: 6 }) + arm(RA, tcol, 16, { moss: 9 });
  b += P(trunk, tcol, { sh: 14, lw: 4.2, tex: trunkTex(7, -50, 17, -212) + plates(-40, -60, 13) + `<ellipse cx="-34" cy="-58" rx="7" ry="10" fill="none" stroke="${BARK_D}" stroke-width="2.4"/><ellipse cx="-34" cy="-57" rx="3" ry="5" fill="${VOID}" opacity=".8"/><ellipse cx="40" cy="-150" rx="5" ry="8" fill="none" stroke="${BARK_D}" stroke-width="2"/>` + specks(0, -80, 40, 50, 10, '#4a4a56', { seed: 3, r: 3, a: 0.5 }) + lichen(-40, -110, 7) + lichen(44, -60, 6) + veins(ph, [[[-30, -120], [-20, -150], [-26, -180]], [[34, -70], [24, -100], [30, -130]]]) });
  b += chest(4, -128, -36, ph, tele) + moss(-30, -230, 18, 22, 14, K.mossDk) + moss(38, -234, 14, 18, 15, K.mossDk);
  b = crown(ph, 0, -250, 1) + b; // crown behind trunk top
  const M = (x, y) => [x, y - 186];
  const face = firstHuskFace(M, ph, { tele: !!tele });
  b += face.b;
  return { b, e: face.e, h: 340, w: 260 };
}

// death / victory states (Take A): kneel -> mask cracks and falls -> green leaf from the chest + colour runs down
export function treantDeath(st = {}) {
  const k = st.k || 0; // 0 standing ... 1 knelt and restored
  const sink = Math.min(1, k * 1.6), maskFall = Math.max(0, Math.min(1, (k - 0.25) / 0.35)), green = Math.max(0, (k - 0.5) / 0.5);
  const A = treantA({ ph: 3 });
  let body = `<g transform="translate(0,${f(sink * 62)}) rotate(${f(sink * 6)} 0 0) scale(1,${f(1 - sink * 0.16)})">`;
  // remove the face from the standing body by redrawing: simpler: draw the body, then cover the face with trunk wood revealed under the mask
  body += A.b;
  const fx = 0, fy = -186 + sink * 0;
  // revealed living wood (under the mask): warm brown-green heartwood, a quiet kind knot face (no eyes: it is at rest)
  if (maskFall > 0) body += `<g opacity="${f(maskFall)}">` + P(blob([[-46, fy - 30], [0, fy - 46], [46, fy - 30], [50, fy + 8], [30, fy + 34], [0, fy + 44], [-32, fy + 32], [-50, fy + 6]]), mix('#8a6e4c', '#8f9a5e', green * 0.55), { sh: 6, lw: 3.4, rimC: '#ffe8b0', rimA: 0.8, tex: `<path d="M-20 ${fy} q8 6 14 0 M8 ${fy} q8 6 14 0" stroke="#3e3428" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M-8 ${fy + 22} q8 4 16 0" stroke="#3e3428" stroke-width="2" fill="none" stroke-linecap="round"/>` }) + '</g>';
  // colour runs down the trunk
  if (green > 0) body += [-40, -22, -6, 14, 30, 46].map((x, i) => `<path d="M${x} -150 q${i % 2 ? 4 : -4} ${f(70 * green)} ${i % 2 ? -2 : 3} ${f(150 * green)}" stroke="${i % 2 ? LIFE_L : '#ffd98a'}" stroke-width="${i % 2 ? 4 : 3}" fill="none" stroke-linecap="round" opacity="${f(0.85 * green)}"/>`).join('') + glow(0, -6, 110 * green + 10, 26, '#c8f08a', 0.55 * green)
    + `<g transform="translate(6,-86)">` + S(`M0 10 Q-2 0 2 ${f(-12 * green)}`, '#4f8a42', 2.6, { lw: 1.6 }) + P(`M2 ${f(-12 * green)} q10 -8 18 -2 q-8 8 -18 2Z`, LIFE_L, { lw: 1.6, sh: 1, rimC: '#f4ffd0', grain: 0 }) + glow(10, -16 * green, 26, 26, '#c8f08a', 0.6 * green) + '</g>';
  body += '</g>';
  // the mask itself, falling off and splitting in two
  let mask = '';
  if (maskFall > 0 && maskFall < 1.01) {
    const M0 = (x, y) => [x, y];
    const face = firstHuskFace(M0, 3, { dim: true });
    const split = Math.max(0, (maskFall - 0.7) / 0.3);
    mask = `<g transform="translate(${f(70 * maskFall)},${f(-186 + 176 * maskFall)}) rotate(${f(80 * maskFall)}) scale(${f(1 - 0.35 * maskFall)})"><g style="clip-path:inset(0 50% 0 0)" transform="translate(${f(-split * 10)},${f(split * 4)}) rotate(${f(-split * 8)})">${face.b}</g><g style="clip-path:inset(0 0 0 50%)" transform="translate(${f(split * 10)},0) rotate(${f(split * 10)})">${face.b}</g></g>`;
  }
  const eyes = maskFall > 0 ? '' : A.e;
  return { b: body + mask, e: eyes, h: 340, w: 260 };
}

// adds the boss calls (Seed Toss -> Husk saplings): a small seed pod and a sapling Husk (stump body, tiny bark mask, red-orange eye pair)
export function seedPod(st = {}) {
  const g = st.g || 0; // 0 pod ... 1 sapling grown
  let b = `<ellipse cx="0" cy="0" rx="10" ry="3" fill="${K.ink}" opacity=".45"/>`;
  if (g < 0.5) b += P(ell(0, -8, 8, 9), '#6d6658', { sh: 3, lw: 2.2, tex: `<path d="M-4 -14 Q0 -8 -2 -2 M3 -15 Q5 -8 3 -2" stroke="#4a4438" stroke-width="1.2" fill="none"/>` }) + sprout(0, -16, -1.7, 0.7);
  else { b += S(line([[-8, -3], [-11, 1]]), '#4a4552', 3, { lw: 1.4 }) + S(line([[7, -3], [10, 1]]), '#4a4552', 3, { lw: 1.4 });
    b += P(blob([[-13, -2], [-14, -11], [-6, -17], [6, -16], [12, -10], [12, -2]]), '#5a5868', { sh: 4, lw: 2.2, tex: `<path d="M-8 -14 q2 6 0 11 M0 -16 q2 7 0 13" stroke="#3d3c46" stroke-width="1.1" fill="none"/>` }) + sprout(-4, -16, -1.9, 0.8, { two: 1 });
    const sk = blob([[9, -16], [14, -15], [16, -10], [12, -7]]);
    b += husk(blob([[5, -19], [15, -18], [19, -11], [15, -5], [7, -7], [4, -12]]), (x, y) => [x, y], { grain: [[[7, -15], [16, -13]]], p: { lw: 1.8 } }) + knotSocket(sk, 0.8) + `<ellipse cx="12.4" cy="-10" rx="1.6" ry="1.2" fill="#ff5a3c"/><ellipse cx="12.2" cy="-10.2" rx=".7" ry=".5" fill="#ffe9c4"/>`; }
  return { b, e: '' };
}
